---
title: Transaktionen und Konsistenz
summary: Wie du mehrere Schreibvorgänge mit Transaktionen zusammenhältst, Nebenwirkungen erst nach dem Commit auslöst und gleichzeitige Zugriffe mit Sperren absicherst.
duration: 25
sources:
  - title: Laravel-Dokumentation – Database Transactions
    url: https://laravel.com/docs/13.x/database#database-transactions
  - title: Laravel-Dokumentation – Pessimistic Locking
    url: https://laravel.com/docs/13.x/queries#pessimistic-locking
  - title: Laravel-Dokumentation – Jobs & Database Transactions
    url: https://laravel.com/docs/13.x/queues#jobs-and-database-transactions
quiz:
  - type: single
    question: In einem `DB::transaction(...)` wirft die dritte von vier Anweisungen eine Exception. Was passiert?
    options:
      - Die ersten beiden Änderungen bleiben gespeichert.
      - Alle Änderungen der Closure werden zurückgerollt, und die Exception wird weitergeworfen.
      - Laravel ignoriert die Exception und speichert alles.
      - Nur die vierte Anweisung wird übersprungen.
    answer: 1
    explanation: Eine Transaktion gilt ganz oder gar nicht. Laravel rollt zurück und wirft die Exception erneut, damit du sie behandeln kannst.
  - type: multiple
    question: Welche Nebenwirkungen solltest du erst nach dem Commit auslösen?
    options:
      - Eine Mail an den Kunden
      - Einen Queue-Job, der die neue Rechnung liest
      - Eine weitere Zeile in derselben Datenbank
      - Einen Aufruf an eine externe Zahlungs-API
    answers: [0, 1, 3]
    explanation: >
      Mails, Jobs und externe Aufrufe kann ein Rollback nicht zurückholen. Weitere Zeilen in derselben
      Datenbank gehören dagegen gerade in die Transaktion.
  - type: find-bug
    question: Zwei Anfragen buchen gleichzeitig vom selben Konto ab. Welche Zeile müsste anders lauten, damit kein Geld doppelt ausgegeben wird?
    language: php
    code: |
      DB::transaction(function () use ($from, $cents) {
          $account = Account::findOrFail($from);

          if ($account->balance_cents < $cents) {
              throw new DomainException('Not enough money.');
          }

          $account->decrement('balance_cents', $cents);
      });
    bug_line: 2
    explanation: >
      Ohne Sperre lesen beide Anfragen denselben alten Kontostand. Mit
      `Account::lockForUpdate()->findOrFail($from)` wartet die zweite, bis die erste fertig ist.
  - type: match
    question: Ordne jedes Werkzeug seinem Zweck zu.
    pairs:
      - { left: "DB::transaction(...)", right: "Mehrere Schreibvorgänge ganz oder gar nicht" }
      - { left: "lockForUpdate()", right: "Zeile sperren, bis die Transaktion endet" }
      - { left: "attempts: 3", right: "Bei einem Deadlock automatisch neu versuchen" }
      - { left: "->afterCommit()", right: "Job erst nach erfolgreichem Commit abschicken" }
    explanation: Zusammen sorgen diese Werkzeuge dafür, dass deine Daten auch bei Fehlern und gleichzeitigen Zugriffen stimmen.
tasks:
  - id: ueberweisung-absichern
    type: terminal
    title: Eine Überweisung absichern
    description: |
      Im Ordner `konto-transfer` liegt eine Laravel-App mit der Tabelle `accounts` (Konto 1 mit 100 €,
      Konto 2 mit 0 €) und der Action `App\Actions\TransferMoney`. Sie hat zwei Fehler:

      - Sie bucht **zuerst** vom Quellkonto ab und sucht **dann** das Zielkonto. Gibt es das Zielkonto
        nicht, ist das Geld weg.
      - Sie prüft nicht, ob genug Guthaben da ist.

      Klicke zuerst auf **Aufgabe vorbereiten**.

      1. `cd konto-transfer` und `./vendor/bin/pest` – zwei Tests sind rot.
      2. Pack die ganze Logik von `handle` in `DB::transaction(function () use (...) { ... })`.
      3. Lade beide Konten mit `Account::lockForUpdate()->findOrFail(...)`.
      4. Reicht das Guthaben nicht, wirf eine `DomainException`.
      5. Erst danach: abbuchen (`decrement`) und gutschreiben (`increment`).
      6. `./vendor/bin/pest` muss grün sein.
    workdir: konto-transfer
    setup: |
      B="$HOME/.cache/stacklab/laravel13"
      if [ ! -f "$B/.fertig" ]; then
        T="$B.bau.$$"; rm -rf "$T"; mkdir -p "$(dirname "$B")"
        timeout 170 composer create-project laravel/laravel "$T" "^13.0" -n -q --prefer-dist </dev/null
        cd "$T"
        timeout 170 composer require pestphp/pest pestphp/pest-plugin-laravel --dev -W -n -q </dev/null
        printf '%s\n' '<?php' '' "pest()->extend(Tests\\TestCase::class)->in('Feature');" > tests/Pest.php
        printf '%s\n' '<?php' '' "test('the application returns a successful response', function () {" "    \$this->get('/')->assertStatus(200);" '});' > tests/Feature/ExampleTest.php
        printf '%s\n' '<?php' '' "test('that true is true', function () {" '    expect(true)->toBeTrue();' '});' > tests/Unit/ExampleTest.php
        touch .fertig && cd - >/dev/null
        rm -rf "$B" && mv "$T" "$B"
      fi
      cp -a "$B/." . && rm -f .fertig
      mkdir -p app/Actions
      cat > database/migrations/2026_01_01_000000_create_accounts_table.php <<'EOF'
      <?php

      use Illuminate\Database\Migrations\Migration;
      use Illuminate\Database\Schema\Blueprint;
      use Illuminate\Support\Facades\DB;
      use Illuminate\Support\Facades\Schema;

      return new class extends Migration
      {
          public function up(): void
          {
              Schema::create('accounts', function (Blueprint $table) {
                  $table->id();
                  $table->string('owner');
                  $table->unsignedInteger('balance_cents');
                  $table->timestamps();
              });

              DB::table('accounts')->insert([
                  ['owner' => 'Ada', 'balance_cents' => 10000],
                  ['owner' => 'Linus', 'balance_cents' => 0],
              ]);
          }

          public function down(): void
          {
              Schema::dropIfExists('accounts');
          }
      };
      EOF
      cat > app/Models/Account.php <<'EOF'
      <?php

      namespace App\Models;

      use Illuminate\Database\Eloquent\Model;

      class Account extends Model
      {
      }
      EOF
      cat > app/Actions/TransferMoney.php <<'EOF'
      <?php

      declare(strict_types=1);

      namespace App\Actions;

      use App\Models\Account;

      final class TransferMoney
      {
          public function handle(int $fromId, int $toId, int $cents): void
          {
              Account::whereKey($fromId)->decrement('balance_cents', $cents);

              $to = Account::findOrFail($toId);
              $to->increment('balance_cents', $cents);
          }
      }
      EOF
      cat > tests/Feature/TransferTest.php <<'EOF'
      <?php

      use App\Actions\TransferMoney;
      use App\Models\Account;
      use Illuminate\Foundation\Testing\RefreshDatabase;

      uses(RefreshDatabase::class);

      test('money moves between accounts', function () {
          app(TransferMoney::class)->handle(1, 2, 2500);

          expect(Account::find(1)->balance_cents)->toBe(7500)
              ->and(Account::find(2)->balance_cents)->toBe(2500);
      });

      test('a missing target account changes nothing', function () {
          try {
              app(TransferMoney::class)->handle(1, 999, 2500);
          } catch (Throwable) {
          }

          expect(Account::find(1)->balance_cents)->toBe(10000);
      });

      test('an overdraft is rejected and changes nothing', function () {
          expect(fn () => app(TransferMoney::class)->handle(2, 1, 100))->toThrow(DomainException::class);

          expect(Account::find(2)->balance_cents)->toBe(0)
              ->and(Account::find(1)->balance_cents)->toBe(10000);
      });
      EOF
      php artisan migrate -q --force
    checks:
      - type: file_contains
        path: app/Actions/TransferMoney.php
        pattern: "DB::transaction"
        message: TransferMoney nutzt noch keine Transaktion. Pack die Logik in DB::transaction(...).
      - type: file_contains
        path: app/Actions/TransferMoney.php
        pattern: "lockForUpdate"
        message: Die Konten werden noch nicht gesperrt. Lade sie mit Account::lockForUpdate()->findOrFail(...).
      - type: command
        run: php artisan tinker --execute='DB::beginTransaction(); try { app(App\Actions\TransferMoney::class)->handle(1, 999, 500); } catch (Throwable $e) {} echo App\Models\Account::find(1)->balance_cents; DB::rollBack();'
        stdout_matches: "^\\s*10000\\s*$"
        message: Bei einem unbekannten Zielkonto verschwindet noch Geld vom Quellkonto. Erst beide Konten laden, dann buchen – alles in einer Transaktion.
      - type: command
        run: php artisan tinker --execute='DB::beginTransaction(); try { app(App\Actions\TransferMoney::class)->handle(2, 1, 100); echo "erlaubt"; } catch (DomainException $e) { echo "abgelehnt"; } DB::rollBack();'
        stdout_matches: "abgelehnt"
        message: Eine Überweisung ohne genug Guthaben wird noch nicht mit einer DomainException abgelehnt.
      - type: command
        run: ./vendor/bin/pest
        message: Die Tests sind noch rot. Führe ./vendor/bin/pest aus und lies, welcher Test fehlschlägt.
    hints:
      - "Variablen gelangen mit `use ($fromId, $toId, $cents)` in die Closure."
      - "Reihenfolge: beide Konten sperrend laden → Guthaben prüfen → `$from->decrement(...)` → `$to->increment(...)`."
      - "Prüfung: `if ($from->balance_cents < $cents) { throw new \\DomainException('Not enough money.'); }`"
    solution: |
      ```php title="app/Actions/TransferMoney.php"
      <?php

      declare(strict_types=1);

      namespace App\Actions;

      use App\Models\Account;
      use DomainException;
      use Illuminate\Support\Facades\DB;

      final class TransferMoney
      {
          public function handle(int $fromId, int $toId, int $cents): void
          {
              DB::transaction(function () use ($fromId, $toId, $cents) {
                  $from = Account::lockForUpdate()->findOrFail($fromId);
                  $to = Account::lockForUpdate()->findOrFail($toId);

                  if ($from->balance_cents < $cents) {
                      throw new DomainException('Not enough money.');
                  }

                  $from->decrement('balance_cents', $cents);
                  $to->increment('balance_cents', $cents);
              }, attempts: 3);
          }
      }
      ```
  - id: commit-ablauf
    type: steps
    title: Was passiert beim Rollback?
    description: Eine Action legt in einer Transaktion eine Rechnung an, löst ein Event aus und schickt einen Job ab. Danach geht etwas schief.
    steps:
      - situation: >
          In `DB::transaction` wird die Rechnung angelegt. Danach schickt der Code direkt
          `SendInvoiceMail::dispatch($invoice->id)` ab – ohne `afterCommit`. Die Queue-Verbindung hat
          `after_commit` auf `false`.
        question: Wann landet der Job in der Queue?
        options:
          - Sofort, noch bevor die Transaktion abgeschlossen ist.
          - Erst nach dem Commit.
        answer: 0
        explanation: Ohne afterCommit wird der Job sofort abgeschickt. Ein schneller Worker kann ihn starten, bevor die Rechnung überhaupt sichtbar ist.
      - situation: Kurz danach wirft eine Prüfung in derselben Transaktion eine Exception. Laravel rollt zurück.
        question: Was passiert mit dem Job?
        options:
          - Er wird ebenfalls zurückgerollt.
          - Er bleibt in der Queue und versucht, eine Rechnung zu mailen, die es nicht gibt.
        answer: 1
        explanation: Die Queue weiß nichts von deiner Datenbank-Transaktion. Der Job findet die Rechnung nicht und schlägt fehl – oder mailt Unsinn.
      - situation: Du änderst den Aufruf zu `SendInvoiceMail::dispatch($invoice->id)->afterCommit()` und das Event implementiert `ShouldDispatchAfterCommit`.
        question: Was passiert jetzt beim Rollback?
        options:
          - Job und Event werden verworfen, nichts erreicht die Außenwelt.
          - Der Job läuft trotzdem, nur das Event nicht.
        answer: 0
        explanation: Beide warten auf den Commit. Kommt keiner, verwirft Laravel sie – die Außenwelt sieht nur, was wirklich gespeichert wurde.
---
Ada überweist Linus 25 €. Dein Code bucht ab, will gutschreiben – und genau dazwischen fällt der
Server aus. Ada hat 25 € weniger, Linus nichts mehr. In großen Apps passieren solche Zwischenzustände
täglich: Timeouts, Exceptions, zwei gleichzeitige Klicks. Diese Lektion zeigt dir, wie du Daten
trotzdem konsistent hältst.

## Ganz oder gar nicht

[[konsistenz|Konsistenz]] heißt: Deine Daten erfüllen immer die fachlichen Regeln. Die Summe aller
Konten stimmt, jede Rechnung hat Positionen, kein Lagerbestand ist negativ. Eine
[[transaktion|Transaktion]] sorgt dafür, dass mehrere Schreibvorgänge **gemeinsam** gelten oder
gar nicht.

```php title="Eine Action mit Transaktion"
DB::transaction(function () use ($fromId, $toId, $cents) {
    $from = Account::findOrFail($fromId);
    $to = Account::findOrFail($toId);

    $from->decrement('balance_cents', $cents);
    $to->increment('balance_cents', $cents);
});
```

Wirft irgendetwas in der Closure eine [[exception|Exception]], macht Laravel einen
[[rollback|Rollback]] und wirft die Exception weiter. Läuft alles durch, folgt der Commit. Die Regeln
dahinter heißen [[acid|ACID]] – das A steht für „atomar“, also unteilbar.

> [!MERKSATZ]
> Die Transaktion gehört in die Action, die den Anwendungsfall ausführt – nicht in den Controller und
> nicht in einzelne Model-Methoden.

## Wo die Transaktion beginnt

Eine Action ist der natürliche Rahmen, denn sie kennt den ganzen Anwendungsfall. Ruft eine Action eine
andere auf, die ebenfalls `DB::transaction` nutzt, ist das kein Problem: Laravel setzt dann intern einen
[[savepoint|Savepoint]], und es gibt nur **einen** echten Commit ganz außen.

| Ort | Bewertung |
|---|---|
| Controller | falsch: Artisan-Befehl und Job hätten keine Transaktion |
| Action | richtig: ein Anwendungsfall, eine Transaktion |
| Model-Event (`saving`) | gefährlich: niemand sieht, was alles mitläuft |

Halte Transaktionen **kurz**. Alles, was lange dauert – HTTP-Aufrufe, PDF-Erzeugung –, gehört davor oder
danach. Sonst blockiert die Transaktion Zeilen, auf die andere Anfragen warten.

## Nebenwirkungen erst nach dem Commit

Ein Rollback holt nur Datenbank-Änderungen zurück. Eine verschickte Mail, ein Job in der Queue oder ein
Aufruf an eine Zahlungs-API bleiben in der Welt. Deshalb gilt: Nach außen wirkt nur, was **committet** ist.

![Ablauf einer Transaktion mit Nebenwirkungen nach dem Commit](/assets/laravel-architektur/after-commit.svg)

```php title="Erst nach dem Commit nach außen wirken"
DB::transaction(function () use ($data) {
    $invoice = Invoice::create([...]);

    InvoiceCreated::dispatch($invoice->id);              // Event: ShouldDispatchAfterCommit
    SendInvoiceMail::dispatch($invoice->id)->afterCommit(); // Job wartet auf Commit
});
```

Alternativ setzt du in `config/queue.php` für die Verbindung `'after_commit' => true`. Dann warten alle
Jobs, queued Listener und Mails dieser Verbindung auf den Commit.

> [!FEHLER]
> Den Job **in** der Transaktion ohne `afterCommit` abschicken. Ein schneller Worker startet ihn, bevor
> der Commit da ist, und findet die neue Zeile nicht – ein Fehler, der nur unter Last auftritt.

## Gleichzeitige Zugriffe

Zwei Anfragen buchen gleichzeitig 80 € von einem Konto mit 100 € ab. Beide lesen „100 €“, beide prüfen
„reicht“, beide buchen. Das ist eine [[race-condition|Race Condition]], und eine Transaktion allein
verhindert sie nicht.

Die Lösung ist eine [[sperre|Sperre]]: `lockForUpdate()` sperrt die gelesene Zeile bis zum Ende der
Transaktion. Die zweite Anfrage wartet und liest danach den neuen Stand.

```php title="Lesen, prüfen, schreiben – gesperrt"
DB::transaction(function () use ($fromId, $cents) {
    $from = Account::lockForUpdate()->findOrFail($fromId);

    if ($from->balance_cents < $cents) {
        throw new DomainException('Not enough money.');
    }

    $from->decrement('balance_cents', $cents);
}, attempts: 3);
```

Sperren sich zwei Transaktionen gegenseitig, entsteht ein [[deadlock|Deadlock]]. Die Datenbank bricht
dann eine ab; mit `attempts: 3` versucht Laravel es automatisch erneut.

> [!PRAXIS]
> Jobs und Webhooks laufen oft doppelt – etwa nach einem Timeout. Mach sie [[idempotenz|idempotent]]:
> Prüfe vorher, ob die Arbeit schon erledigt ist, oder nutze einen eindeutigen Schlüssel in der Tabelle.

## Zusammenfassung

- Eine Transaktion macht mehrere Schreibvorgänge atomar: ganz oder gar nicht.
- Die Transaktion gehört in die Action; verschachtelte Transaktionen nutzen Savepoints.
- Halte Transaktionen kurz – langsame Aufrufe davor oder danach.
- Mails, Jobs, Events und API-Aufrufe wirken erst nach dem Commit: `afterCommit()`, `ShouldDispatchAfterCommit`, `after_commit`.
- `lockForUpdate()` verhindert Race Conditions bei „lesen, prüfen, schreiben“; `attempts` fängt Deadlocks ab.
- Jobs und Webhooks sollten idempotent sein.
