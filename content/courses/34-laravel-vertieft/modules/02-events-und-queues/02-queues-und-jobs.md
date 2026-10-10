---
title: Queues und Jobs
summary: Langsame Arbeit in den Hintergrund verlagern – Jobs schreiben, Worker starten, Wiederholungen steuern und fehlgeschlagene Jobs behandeln.
duration: 25
sources:
  - title: Laravel – Queues
    url: https://laravel.com/docs/13.x/queues
  - title: Laravel – Queues, Dealing With Failed Jobs
    url: https://laravel.com/docs/13.x/queues#dealing-with-failed-jobs
quiz:
  - type: single
    question: Du rufst `ExportReport::dispatch()` auf, aber der Export entsteht nie. In `.env` steht `QUEUE_CONNECTION=database`. Was fehlt am wahrscheinlichsten?
    options:
      - Ein laufender Worker (`php artisan queue:work`)
      - Ein Eintrag in bootstrap/providers.php
      - Die Methode dispatchSync()
    answer: 0
    explanation: dispatch() legt den Job nur in die jobs-Tabelle. Erst ein Worker holt ihn dort ab und führt handle() aus.
  - type: match
    question: Welcher Befehl tut was?
    pairs:
      - { left: "php artisan queue:work", right: "Startet einen Worker, der Jobs abarbeitet" }
      - { left: "php artisan queue:failed", right: Listet fehlgeschlagene Jobs }
      - { left: "php artisan queue:retry all", right: Legt alle fehlgeschlagenen Jobs erneut in die Queue }
      - { left: "php artisan queue:restart", right: "Bittet laufende Worker, nach dem aktuellen Job neu zu starten" }
    explanation: queue:restart brauchst du nach jedem Deployment, sonst arbeiten Worker mit dem alten Code weiter.
  - type: cloze
    text: "Mit `#[___(3)]` darf ein Job dreimal versucht werden. `#[___([10, 60])]` wartet 10 Sekunden vor dem zweiten und 60 Sekunden vor dem dritten Versuch."
    blanks:
      - [Tries]
      - [Backoff]
    explanation: Tries begrenzt die Versuche, Backoff legt die Wartezeiten fest. Beide Attribute liegen in Illuminate\Queue\Attributes.
  - type: find-bug
    question: Der Job soll eine Rechnung erzeugen. Im Worker taucht ein Fehler auf, weil sich das Objekt nicht sauber speichern lässt. Welche Zeile ist das Problem?
    language: php
    code: |
      class CreateInvoice implements ShouldQueue
      {
          use Queueable;

          public function __construct(
              public Order $order,
              public Closure $onDone,
          ) {}

          public function handle(): void { /* … */ }
      }
    bug_line: 7
    explanation: Ein Job wird serialisiert und in der Datenbank gespeichert. Closures lassen sich nicht serialisieren. Übergib nur Daten wie Models oder IDs.
tasks:
  - id: export-job
    type: terminal
    title: Ein Export-Job mit Fehlerbehandlung
    description: |
      Im Ordner `queue-uebung` liegt eine frische Laravel-Anwendung mit `QUEUE_CONNECTION=database`.

      1. Erzeuge den Job `ExportReport` (`php artisan make:job ExportReport`). Er bekommt
         `public string $name` im Konstruktor.
      2. `handle()` wirft eine `RuntimeException`, wenn `$name` gleich `kaputt` ist. Sonst schreibt er
         mit `Storage::put("exports/{$this->name}.txt", 'Bericht fertig');` eine Datei.
      3. Der Job darf höchstens **2** Versuche haben (`#[Tries(2)]`).
      4. `failed(?Throwable $exception)` schreibt `Log::error('Export fehlgeschlagen: '.$this->name);`.
      5. Lege in Tinker zwei Jobs in die Queue: `App\Jobs\ExportReport::dispatch('januar');` und
         `App\Jobs\ExportReport::dispatch('kaputt');`.
      6. Arbeite die Queue ab: `php artisan queue:work --stop-when-empty`.
      7. Sieh dir das Ergebnis mit `php artisan queue:failed` an.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: queue-uebung
    setup: |
      # Laravel-13-Basis (mit Pest) einmal bauen und zwischenspeichern, dann hierher kopieren
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
    checks:
      - type: file_contains
        path: app/Jobs/ExportReport.php
        pattern: "#\\[Tries\\(2\\)\\]"
        message: "Begrenze die Versuche mit dem Attribut #[Tries(2)] über der Klasse."
      - type: command
        run: |
          php artisan tinker --execute="echo Storage::exists('exports/januar.txt') ? Storage::get('exports/januar.txt') : 'fehlt';"
        stdout_matches: "^Bericht fertig\\s*$"
        message: Die Datei exports/januar.txt fehlt. Hast du den Job für januar in die Queue gelegt und php artisan queue:work --stop-when-empty ausgeführt?
      - type: command
        run: php artisan tinker --execute="echo DB::table('jobs')->count();"
        stdout_matches: "^0\\s*$"
        message: In der jobs-Tabelle warten noch Jobs. Arbeite die Queue mit php artisan queue:work --stop-when-empty ab.
      - type: command
        run: |
          php artisan tinker --execute="echo DB::table('failed_jobs')->where('payload', 'like', '%ExportReport%')->where('payload', 'like', '%kaputt%')->count() > 0 ? 'fehlgeschlagen' : 'nicht';"
        stdout_matches: "^fehlgeschlagen\\s*$"
        message: In failed_jobs fehlt der Job für kaputt. Er muss in handle() eine Exception werfen und nach zwei Versuchen dort landen.
      - type: file_contains
        path: storage/logs/laravel.log
        pattern: "Export fehlgeschlagen: kaputt"
        message: "Im Log fehlt „Export fehlgeschlagen: kaputt“. Schreibe die Zeile in der Methode failed()."
    hints:
      - "Die Attribute importierst du mit `use Illuminate\\Queue\\Attributes\\Tries;`."
      - "In `handle()`: `if ($this->name === 'kaputt') { throw new RuntimeException('Export kaputt'); }`"
      - "Dispatchen geht ohne Fragen in einem Rutsch: `php artisan tinker --execute=\"App\\Jobs\\ExportReport::dispatch('januar'); App\\Jobs\\ExportReport::dispatch('kaputt');\"`"
    solution: |
      ```php title="app/Jobs/ExportReport.php"
      <?php

      namespace App\Jobs;

      use Illuminate\Contracts\Queue\ShouldQueue;
      use Illuminate\Foundation\Queue\Queueable;
      use Illuminate\Queue\Attributes\Tries;
      use Illuminate\Support\Facades\Log;
      use Illuminate\Support\Facades\Storage;
      use RuntimeException;
      use Throwable;

      #[Tries(2)]
      class ExportReport implements ShouldQueue
      {
          use Queueable;

          public function __construct(public string $name) {}

          public function handle(): void
          {
              if ($this->name === 'kaputt') {
                  throw new RuntimeException('Export kaputt');
              }

              Storage::put("exports/{$this->name}.txt", 'Bericht fertig');
          }

          public function failed(?Throwable $exception): void
          {
              Log::error('Export fehlgeschlagen: '.$this->name);
          }
      }
      ```

      ```bash
      php artisan tinker --execute="App\Jobs\ExportReport::dispatch('januar'); App\Jobs\ExportReport::dispatch('kaputt');"
      php artisan queue:work --stop-when-empty
      php artisan queue:failed
      ```
  - id: queue-diagramm
    type: diagram
    title: Beschrifte den Weg eines Jobs
    description: Ordne jedem Kasten die richtige Station zu. Der grüne Pfeil steht für Erfolg, der rote für den endgültigen Fehlschlag.
    image: /assets/laravel-vertieft/queue-ablauf-leer.svg
    slots:
      - { x: 11, y: 50, answer: "dispatch()" }
      - { x: 34, y: 50, answer: jobs-Tabelle }
      - { x: 58, y: 50, answer: "queue:work" }
      - { x: 85, y: 26, answer: Job erledigt }
      - { x: 85, y: 74, answer: failed_jobs }
    distractors: [Scheduler, Observer]
    hints:
      - Links beginnt alles im Controller, rechts endet es – gut oder schlecht.
---
Ein Nutzer klickt auf „Bericht exportieren“. Der Export dauert 40 Sekunden – so lange dreht sich im
Browser das Ladesymbol, und nach 30 Sekunden bricht der Webserver ab. Die Lösung: Die Arbeit wird
**später im Hintergrund** erledigt, und der Nutzer bekommt sofort eine Antwort.

![Der Weg eines Jobs: dispatch, jobs-Tabelle, Worker, Erfolg oder failed_jobs](/assets/laravel-vertieft/queue-ablauf.svg)

## Die Idee: Aufträge auf einen Zettelspieß

In einer Restaurantküche nimmt die Bedienung die Bestellung auf, spießt den Zettel auf und geht zum
nächsten Tisch. Die Köche arbeiten die Zettel nacheinander ab. Genau so funktioniert eine
[[job-queue|Queue]] (Warteschlange):

| Küche | Laravel |
|---|---|
| Bestellzettel | [[queue-job|Job]] – ein Objekt mit Daten und `handle()` |
| Zettelspieß | Queue, z. B. die Tabelle `jobs` |
| Koch | [[queue-worker|Worker]] – ein Prozess, der `php artisan queue:work` ausführt |

Der Request legt den Job nur ab und ist in Millisekunden fertig. Typische Kandidaten: Mails, Exporte,
Bildbearbeitung, Aufrufe externer APIs.

Wo die Queue liegt, bestimmt `QUEUE_CONNECTION` in `.env`:

| Treiber | Einsatz |
|---|---|
| `sync` | kein Hintergrund – der Job läuft sofort (gut für Tests) |
| `database` | Tabelle `jobs`, Standard in neuen Projekten |
| `redis`, `sqs` | schnelle Queues für viel Last |

## Einen Job schreiben und abschicken

```bash title="Terminal"
php artisan make:job ExportReport
```

```php title="app/Jobs/ExportReport.php"
class ExportReport implements ShouldQueue
{
    use Queueable;

    public function __construct(public User $user, public string $month) {}

    public function handle(ReportBuilder $builder): void
    {
        $builder->build($this->user, $this->month);
    }
}
```

`ShouldQueue` sagt: „Ich gehöre in die Queue.“ In `handle()` kannst du Abhängigkeiten verlangen – der
Service Container löst sie auf. Models werden nur mit ihrer ID gespeichert und im Worker frisch geladen.

```php
ExportReport::dispatch($user, '2026-09');                               // in die Queue
ExportReport::dispatch($user, '2026-09')->delay(now()->addMinutes(10)); // später
ExportReport::dispatch($user, '2026-09')->onQueue('exports');           // eigene Queue
ExportReport::dispatchSync($user, '2026-09');                           // sofort, ohne Queue
```

> [!FEHLER]
> **Closures oder offene Verbindungen im Konstruktor.** Ein Job wird [[serialisierung|serialisiert]] und
> gespeichert. Gib nur Daten mit – Models, IDs, Texte – keine Closures, Dateihandles oder HTTP-Clients.

## Der Worker

Ohne Worker passiert nichts – die Jobs liegen nur in der Tabelle.

```bash title="Terminal"
php artisan queue:work                       # läuft dauerhaft
php artisan queue:work --stop-when-empty     # arbeitet alles ab und beendet sich
php artisan queue:work --queue=high,default  # erst high, dann default
```

Ein Worker lädt deinen Code **einmal** und behält ihn im Speicher. Nach einem Deployment musst du ihn
deshalb neu starten: `php artisan queue:restart`. In Produktion hält ein Prozess-Manager wie [[supervisor|Supervisor]]
die Worker am Laufen ([Doku](https://laravel.com/docs/13.x/queues#supervisor-configuration)).

> [!MERKSATZ]
> `dispatch()` legt nur ab. Erst ein **Worker** führt `handle()` aus – und er kennt nur den Code, mit
> dem er gestartet wurde.

## Wiederholen, warten, aufgeben

Externe Dienste fallen manchmal kurz aus. Statt sofort aufzugeben, versucht Laravel einen Job erneut.
Steuern kannst du das mit Attributen:

```php
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;

#[Tries(3)]                 // höchstens 3 Versuche
#[Backoff([10, 60])]        // 10 s vor Versuch 2, 60 s vor Versuch 3
#[Timeout(120)]             // länger als 120 s? Abbrechen.
class ExportReport implements ShouldQueue
```

Die wachsenden Wartezeiten heißen [[exponential-backoff|Backoff]]: Ein überlasteter Dienst bekommt Luft, statt im
Sekundentakt bombardiert zu werden. Sind alle Versuche verbraucht, ruft Laravel `failed()` auf:

```php
public function failed(?Throwable $exception): void
{
    Log::error('Export fehlgeschlagen: '.$this->month);
}
```

## Fehlgeschlagene Jobs

Endgültig gescheiterte Jobs landen in der Tabelle `failed_jobs` – samt Fehlermeldung. Nichts geht
verloren:

```bash title="Terminal"
php artisan queue:failed              # Liste mit IDs und Fehlern
php artisan queue:retry all           # alle erneut versuchen
php artisan queue:retry 5d1f…         # einen bestimmten Job
php artisan queue:forget 5d1f…        # einen Eintrag löschen
php artisan queue:flush               # alle Einträge löschen
```

> [!PRAXIS]
> Im Betrieb überwacht man `failed_jobs`. Ein plötzlicher Anstieg zeigt fast immer, dass ein externer
> Dienst streikt oder ein Deployment einen Fehler eingebaut hat. Erst Ursache beheben, dann
> `queue:retry all`.

## Zusammenfassung

- Queues verlagern langsame Arbeit in den Hintergrund; der Request antwortet sofort.
- Ein Job implementiert `ShouldQueue`, trägt nur serialisierbare Daten und arbeitet in `handle()`.
- `dispatch()` legt ab, `queue:work` führt aus; nach Deployments `queue:restart`.
- `#[Tries]`, `#[Backoff]` und `#[Timeout]` steuern Wiederholungen und Abbrüche.
- `failed()` reagiert auf das endgültige Scheitern; die Jobs stehen dann in `failed_jobs`.
- `queue:failed`, `queue:retry` und `queue:forget` verwalten fehlgeschlagene Jobs.
