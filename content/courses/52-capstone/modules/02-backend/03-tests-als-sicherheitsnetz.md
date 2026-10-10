---
title: Tests als Sicherheitsnetz
summary: Welche Tests ein Projekt wie Vereinskurse wirklich braucht, wie du Randfälle systematisch findest und woran du erkennst, dass ein Test etwas taugt.
duration: 25
sources:
  - title: Pest-Dokumentation – Writing Tests
    url: https://pestphp.com/docs/writing-tests
  - title: Laravel-Dokumentation – HTTP Tests
    url: https://laravel.com/docs/13.x/http-tests
  - title: Laravel-Dokumentation – Sanctum (Testing)
    url: https://laravel.com/docs/13.x/sanctum#testing
quiz:
  - type: single
    question: Welche Testart prüft in Vereinskurse am meisten Wert pro Zeile?
    options:
      - Unit-Tests für jeden Getter im Model
      - Feature-Tests, die echte HTTP-Anfragen an die API schicken und Status, JSON und Datenbank prüfen
      - Manuelle Klicktests vor jedem Release
    answer: 1
    explanation: >
      Eine API lebt von Routen, Middleware, Validierung und Datenbank. Feature-Tests prüfen genau dieses
      Zusammenspiel. Unit-Tests lohnen sich für reine Logik wie die Platzberechnung.
  - type: multiple
    question: Welche Randfälle sollte ein Test für das Buchen abdecken?
    options:
      - Der letzte freie Platz wird gebucht
      - Ein voller Workshop wird gebucht
      - Dieselbe Person bucht zweimal
      - Der Workshop-Titel ist besonders schön
    answers: [0, 1, 2]
    explanation: Randfälle liegen an Grenzen – genau ein Platz frei, null Plätze frei, schon gebucht.
  - type: find-bug
    question: Dieser Test soll beweisen, dass Gäste nicht buchen können. Welche Zeile macht ihn wertlos?
    language: php
    code: |
      test('Buchen ohne Anmeldung antwortet mit 401', function () {
          $workshop = Workshop::factory()->create();
          Sanctum::actingAs(User::factory()->create());

          $this->postJson("/api/workshops/{$workshop->id}/booking")->assertUnauthorized();
      });
    bug_line: 3
    explanation: >
      `Sanctum::actingAs` meldet eine Person an – der Test prüft dann gar keinen Gast mehr und schlägt fehl oder
      testet das Falsche. Für den Gast-Fall lässt du diese Zeile weg.
  - type: cloze
    text: "Ein guter Test folgt dem Muster ___ – ___ – ___: Daten vorbereiten, Aktion ausführen, Ergebnis prüfen."
    blanks:
      - [Arrange]
      - [Act]
      - [Assert]
    explanation: Arrange-Act-Assert macht Tests lesbar. Jeder Abschnitt ist durch eine Leerzeile getrennt.
tasks:
  - id: platzrechner-testen
    type: terminal
    title: Tests, die Fehler wirklich finden
    description: |
      Im Ordner `platzrechner` liegt eine Laravel-Anwendung mit der Klasse `app/Support/Platzrechner.php`. Sie hat
      zwei Methoden:

      - `seatsLeft(int $capacity, int $booked): int` – freie Plätze, nie negativ
      - `canBook(int $capacity, int $booked, bool $alreadyBooked): bool` – darf gebucht werden?

      Klicke zuerst auf **Aufgabe vorbereiten** (das Kopieren dauert ein paar Sekunden).

      1. Lege `tests/Unit/PlatzrechnerTest.php` an und schreibe **mindestens drei** Pest-Tests.
      2. Decke diese Fälle ab: mehr Buchungen als Plätze ergibt 0 freie Plätze; ein voller Workshop
         (`capacity` = `booked`) darf nicht gebucht werden; wer schon gebucht hat, darf nicht noch einmal.
      3. Führe sie aus: `./vendor/bin/pest tests/Unit/PlatzrechnerTest.php`.

      Die Prüfung baut danach absichtlich Fehler in `Platzrechner` ein. Deine Tests müssen jeden davon bemerken.
      Ändere `Platzrechner.php` selbst nicht.
    workdir: platzrechner
    setup: |
      B="$HOME/.cache/stacklab/laravel13"
      if [ ! -f "$B/.fertig" ]; then
        T="$B.bau.$$"; rm -rf "$T"; mkdir -p "$(dirname "$B")"
        timeout 170 composer create-project laravel/laravel "$T" "^13.0" -n -q --prefer-dist </dev/null
        (cd "$T" && timeout 170 composer require pestphp/pest pestphp/pest-plugin-laravel --dev -W -n -q </dev/null)
        printf '%s\n' '<?php' '' "pest()->extend(Tests\\TestCase::class)->in('Feature');" > "$T/tests/Pest.php"
        touch "$T/.fertig"; rm -rf "$B"; mv "$T" "$B"
      fi
      cp -a "$B/." . && rm -f .fertig
      mkdir -p app/Support
      cat > app/Support/Platzrechner.php <<'EOF'
      <?php

      namespace App\Support;

      final class Platzrechner
      {
          public function seatsLeft(int $capacity, int $booked): int
          {
              return max(0, $capacity - $booked);
          }

          public function canBook(int $capacity, int $booked, bool $alreadyBooked): bool
          {
              return $this->seatsLeft($capacity, $booked) > 0 && ! $alreadyBooked;
          }
      }
      EOF
      cp app/Support/Platzrechner.php .platzrechner.original
    checks:
      - type: file_exists
        path: tests/Unit/PlatzrechnerTest.php
        message: Die Datei tests/Unit/PlatzrechnerTest.php fehlt noch.
      - type: command
        run: grep -cE '^\s*(test|it)\(' tests/Unit/PlatzrechnerTest.php
        stdout_matches: "^([3-9]|[1-9][0-9]+)\\s*$"
        message: Schreibe mindestens drei Tests mit test(…) oder it(…).
      - type: command
        run: cmp -s app/Support/Platzrechner.php .platzrechner.original && ./vendor/bin/pest tests/Unit/PlatzrechnerTest.php >/dev/null 2>&1 && echo gruen
        stdout_equals: gruen
        message: Deine Tests sind gegen den korrekten Platzrechner noch nicht grün – oder Platzrechner.php wurde verändert. Stelle die Datei mit cp .platzrechner.original app/Support/Platzrechner.php wieder her.
      - type: command
        run: >-
          cp .platzrechner.original app/Support/Platzrechner.php; ./vendor/bin/pest tests/Unit/PlatzrechnerTest.php >/dev/null 2>&1 || { echo rot; exit 0; };
          sed 's/max(0, \$capacity - \$booked)/$capacity - $booked/' .platzrechner.original > app/Support/Platzrechner.php;
          ./vendor/bin/pest tests/Unit/PlatzrechnerTest.php >/dev/null 2>&1 && r=bemerkt-nicht || r=bemerkt;
          cp .platzrechner.original app/Support/Platzrechner.php; echo $r
        stdout_equals: bemerkt
        message: "Eingebauter Fehler bleibt unbemerkt: seatsLeft liefert negative Zahlen. Teste z. B. expect((new Platzrechner)->seatsLeft(2, 5))->toBe(0)."
      - type: command
        run: >-
          cp .platzrechner.original app/Support/Platzrechner.php; ./vendor/bin/pest tests/Unit/PlatzrechnerTest.php >/dev/null 2>&1 || { echo rot; exit 0; };
          sed 's/ > 0 \&\& / >= 0 \&\& /' .platzrechner.original > app/Support/Platzrechner.php;
          ./vendor/bin/pest tests/Unit/PlatzrechnerTest.php >/dev/null 2>&1 && r=bemerkt-nicht || r=bemerkt;
          cp .platzrechner.original app/Support/Platzrechner.php; echo $r
        stdout_equals: bemerkt
        message: "Eingebauter Fehler bleibt unbemerkt: canBook erlaubt Buchungen bei vollem Workshop. Teste canBook(10, 10, false) – erwartet false."
      - type: command
        run: >-
          cp .platzrechner.original app/Support/Platzrechner.php; ./vendor/bin/pest tests/Unit/PlatzrechnerTest.php >/dev/null 2>&1 || { echo rot; exit 0; };
          sed 's/ \&\& ! \$alreadyBooked//' .platzrechner.original > app/Support/Platzrechner.php;
          ./vendor/bin/pest tests/Unit/PlatzrechnerTest.php >/dev/null 2>&1 && r=bemerkt-nicht || r=bemerkt;
          cp .platzrechner.original app/Support/Platzrechner.php; echo $r
        stdout_equals: bemerkt
        message: "Eingebauter Fehler bleibt unbemerkt: canBook ignoriert, ob schon gebucht wurde. Teste canBook(10, 3, true) – erwartet false."
    hints:
      - "Ein Unit-Test braucht keine Datenbank: `use App\\Support\\Platzrechner;` und dann `expect((new Platzrechner)->seatsLeft(10, 3))->toBe(7);`."
      - "Teste genau an den Grenzen: `seatsLeft(2, 5)`, `canBook(10, 10, false)`, `canBook(10, 9, false)`, `canBook(10, 3, true)`."
      - "Hast du Platzrechner.php aus Versehen geändert? `cp .platzrechner.original app/Support/Platzrechner.php` stellt sie wieder her."
    solution: |
      ```php title="tests/Unit/PlatzrechnerTest.php"
      <?php

      use App\Support\Platzrechner;

      test('freie Plätze sind nie negativ', function () {
          expect((new Platzrechner)->seatsLeft(10, 3))->toBe(7);
          expect((new Platzrechner)->seatsLeft(2, 5))->toBe(0);
      });

      test('ein voller Workshop kann nicht gebucht werden', function () {
          expect((new Platzrechner)->canBook(10, 9, false))->toBeTrue();
          expect((new Platzrechner)->canBook(10, 10, false))->toBeFalse();
      });

      test('wer schon gebucht hat, kann nicht noch einmal buchen', function () {
          expect((new Platzrechner)->canBook(10, 3, true))->toBeFalse();
      });
      ```
  - id: testart-waehlen
    type: dragdrop
    title: Welche Testart passt?
    description: Ordne jedes Prüfziel der Testart zu, mit der du es in Vereinskurse am besten absicherst.
    targets:
      - { id: unit, label: Unit-Test }
      - { id: feature, label: Feature-Test (HTTP) }
      - { id: e2e, label: End-to-End-Test im Browser }
    items:
      - { label: seatsLeft() rechnet bei Überbuchung 0, target: unit }
      - { label: Datumsformatierung in einer Hilfsfunktion, target: unit }
      - { label: POST /api/workshops ohne Token ergibt 401, target: feature }
      - { label: Validierungsfehler kommen als 422 mit errors, target: feature }
      - { label: Eine doppelte Buchung ergibt 409, target: feature }
      - { label: Ein Mitglied meldet sich an und bucht über die Oberfläche, target: e2e }
    hints:
      - Unit-Tests prüfen eine Klasse ohne HTTP und Datenbank, End-to-End-Tests einen kompletten Weg durch die Oberfläche.
---
Bis hierhin hast du die API Schritt für Schritt gebaut, und vorbereitete Tests haben dir gesagt, ob ein Schritt
fertig ist. In echten Projekten schreibt diese Tests niemand für dich. Diese Lektion klärt, **welche** Tests du
brauchst, wie du Randfälle findest und woran du erkennst, dass ein Test wirklich etwas absichert.

## Welche Tests sich lohnen

Für eine API wie Vereinskurse gilt eine einfache Faustregel: Die meisten Tests sind
[[feature-test|Feature-Tests]]. Sie schicken echte HTTP-Anfragen durch Routen, Middleware, Validierung
und Datenbank – genau dort entstehen die meisten Fehler.

| Testart | Prüft | Beispiel |
|---|---|---|
| [[unit-test\|Unit-Test]] | eine Klasse oder Funktion isoliert | `seatsLeft(2, 5)` ist `0` |
| Feature-Test | einen Endpunkt mit allem Drum und Dran | `POST …/booking` bei vollem Workshop → 409 |
| [[end-to-end-test\|End-to-End-Test]] | einen kompletten Weg im Browser | Login, Workshop öffnen, buchen |

End-to-End-Tests sind wertvoll, aber langsam und empfindlich. Ein, zwei Stück für den wichtigsten Weg
reichen für ein MVP. Wie du sie mit Playwright schreibst, zeigt der Kurs Testing.

> [!MERKSATZ]
> Teste **Verhalten**, nicht Implementierung: Statuscode, JSON und Datenbankzustand – nicht, welche Methode
> intern aufgerufen wurde.

## Ein Feature-Test im Detail

Jeder Test folgt [[arrange-act-assert|Arrange – Act – Assert]]. [[test-factory|Factories]] liefern die
Testdaten, `Sanctum::actingAs` meldet eine Person an, ohne dass du ein echtes Token brauchst:

```php title="tests/Feature/Vereinskurse/BuchungTest.php (Auszug)"
test('ein ausgebuchter Workshop antwortet mit 409', function () {
    $workshop = Workshop::factory()->create(['capacity' => 1]);
    $workshop->bookings()->create(['user_id' => User::factory()->create()->id]);
    Sanctum::actingAs(User::factory()->create());

    $this->postJson("/api/workshops/{$workshop->id}/booking")
        ->assertStatus(409)
        ->assertJsonStructure(['message']);

    expect($workshop->bookings()->count())->toBe(1);
});
```

Die letzte Zeile ist wichtig: Sie prüft, dass **nichts** in der Datenbank gelandet ist. Ein 409 mit einer
trotzdem gespeicherten Buchung wäre ein schwerer Fehler.

## Randfälle systematisch finden

Fehler sitzen an Grenzen. Für jede Regel fragst du nach den Werten direkt davor, genau darauf und dahinter
([[grenzwertanalyse|Grenzwertanalyse]]):

- **Plätze:** 1 Platz frei → Buchung klappt. 0 Plätze frei → 409. Mehr Buchungen als Plätze → weiterhin 409.
- **Kapazität:** 0 → 422, 1 → gültig, 500 → gültig, 501 → 422.
- **Beginn:** in der Vergangenheit → 422, in der Zukunft → gültig.
- **Login:** ohne Token → 401, mit fremdem Workshop → trotzdem nur eigene Buchung löschen.

Jeder dieser Fälle ist ein kurzer Test. Zusammen beschreiben sie die Regeln präziser als jeder Fließtext.

> [!FEHLER]
> Nur den Erfolgsfall testen. Ein Test „Buchung klappt“ bleibt auch grün, wenn die Platzprüfung komplett
> fehlt. Die Fehlerfälle sind die eigentlichen Wächter.

## Taugt mein Test etwas?

Ein Test ist nur dann ein Sicherheitsnetz, wenn er **rot** wird, sobald der Code falsch ist. Das prüfst du mit
einem einfachen Trick: Bau absichtlich einen Fehler ein – etwa `>=` statt `>` – und schau, ob ein Test
anschlägt. Bleibt alles grün, fehlt ein Test.

Werkzeuge für [[mutationstest|Mutationstests]] machen genau das automatisch, tausendfach. Pest bringt dafür
die Option `--mutate` mit. Für dein Projekt reicht es, den Trick bei den wichtigsten Regeln von Hand
anzuwenden – in der Aufgabe dieser Lektion übernimmt das die Prüfung für dich.

> [!PRAXIS]
> Bei einem Bugfix schreibst du zuerst einen Test, der den Fehler zeigt (rot), und behebst ihn dann (grün).
> Dieser [[regressionstest|Regressionstest]] sorgt dafür, dass der Fehler nie unbemerkt zurückkommt.

## Zusammenfassung

- Für eine API sind **Feature-Tests** das Rückgrat, **Unit-Tests** sichern reine Logik.
- Jeder Test folgt **Arrange – Act – Assert** und prüft Verhalten, nicht Implementierung.
- **Randfälle** findest du an Grenzen: direkt davor, genau darauf, dahinter.
- Fehlerfälle zu testen ist wichtiger als den Erfolgsfall zu wiederholen.
- Ein Test taugt nur, wenn er bei einem eingebauten Fehler **rot** wird.
