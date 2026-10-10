---
title: Batches, Ketten und der Scheduler
summary: Viele Jobs als Gruppe verfolgen, Jobs nacheinander ausführen und wiederkehrende Aufgaben mit einem einzigen Cron-Eintrag planen.
duration: 25
sources:
  - title: Laravel – Queues, Job Batching
    url: https://laravel.com/docs/13.x/queues#job-batching
  - title: Laravel – Queues, Job Chaining
    url: https://laravel.com/docs/13.x/queues#job-chaining
  - title: Laravel – Task Scheduling
    url: https://laravel.com/docs/13.x/scheduling
quiz:
  - type: single
    question: Du importierst eine CSV-Datei in zehn Teilen. Erst wenn **alle** Teile fertig sind, soll eine Mail „Import abgeschlossen“ rausgehen. Was passt?
    options:
      - "`Bus::chain([...])`, weil die Jobs nacheinander laufen"
      - "`Bus::batch([...])->then(...)`, weil then() nach dem letzten erfolgreichen Job läuft"
      - Zehn einzelne dispatch()-Aufrufe und ein Sleep
    answer: 1
    explanation: Ein Batch verfolgt eine Gruppe von Jobs, die parallel laufen dürfen. then() wird aufgerufen, wenn alle erfolgreich waren. Eine Kette würde die Teile unnötig nacheinander abarbeiten.
  - type: match
    question: Welche Methode plant welchen Rhythmus?
    pairs:
      - { left: "->daily()", right: "Jeden Tag um 00:00" }
      - { left: "->dailyAt('02:30')", right: "Jeden Tag um 02:30" }
      - { left: "->weeklyOn(1, '8:00')", right: "Montags um 8:00" }
      - { left: "->everyFiveMinutes()", right: Alle fünf Minuten }
    explanation: Alle Methoden übersetzen sich in einen Cron-Ausdruck. php artisan schedule:list zeigt dir das Ergebnis.
  - type: cloze
    text: "Auf dem Server reicht ein einziger Cron-Eintrag, der jede Minute `php artisan schedule:___` aufruft. Damit sich ein langer Lauf nicht mit dem nächsten überschneidet, hängst du `->without___()` an."
    blanks:
      - [run]
      - [Overlapping]
    explanation: schedule:run prüft jede Minute, welche Aufgaben fällig sind. withoutOverlapping() sperrt die Aufgabe, solange sie noch läuft.
  - type: find-bug
    question: Der Job soll seine Arbeit überspringen, wenn der Batch abgebrochen wurde. Warum stürzt er ab?
    language: php
    code: |
      class ImportChunk implements ShouldQueue
      {
          use Queueable;

          public function handle(): void
          {
              if ($this->batch()->cancelled()) {
                  return;
              }
              // …
          }
      }
    bug_line: 3
    explanation: Die Methode batch() kommt aus dem Trait Batchable. Ohne use Batchable, Queueable; gibt es sie nicht.
tasks:
  - id: zeitplan
    type: terminal
    title: Einen Zeitplan anlegen
    description: |
      Im Ordner `scheduler-uebung` liegt eine Laravel-Anwendung mit dem fertigen Job
      `App\Jobs\ExportReport` (Konstruktor: `string $name`). Plane in `routes/console.php` drei Aufgaben:

      1. Der eingebaute Befehl `queue:prune-failed --hours=48` läuft **täglich um Mitternacht**.
      2. Lege einen Closure-Befehl `berichte:aufraeumen` an (`Artisan::command(...)`), der
         `Aufgeräumt` ausgibt. Er läuft **täglich um 02:30** und darf sich **nicht überschneiden**.
      3. Der Job `ExportReport` mit dem Namen `wochenbericht` wird **montags um 8:00** in die Queue
         gelegt (`Schedule::job(...)`).
      4. Prüfe alles mit `php artisan schedule:list`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: scheduler-uebung
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
      mkdir -p app/Jobs
      cat > app/Jobs/ExportReport.php <<'EOF'
      <?php

      namespace App\Jobs;

      use Illuminate\Contracts\Queue\ShouldQueue;
      use Illuminate\Foundation\Queue\Queueable;
      use Illuminate\Support\Facades\Storage;

      class ExportReport implements ShouldQueue
      {
          use Queueable;

          public function __construct(public string $name) {}

          public function handle(): void
          {
              Storage::put("exports/{$this->name}.txt", 'Bericht fertig');
          }
      }
      EOF
    checks:
      - type: command
        run: php artisan schedule:list
        stdout_matches: "0\\s+0 \\* \\* \\*\\s+php artisan queue:prune-failed --hours=48"
        message: "In schedule:list fehlt queue:prune-failed --hours=48 mit dem Rhythmus täglich um Mitternacht (0 0 * * *)."
      - type: command
        run: php artisan schedule:list
        stdout_matches: "30\\s+2 \\* \\* \\*\\s+php artisan berichte:aufraeumen"
        message: "In schedule:list fehlt berichte:aufraeumen täglich um 02:30 (30 2 * * *)."
      - type: command
        run: php artisan berichte:aufraeumen
        stdout_matches: "Aufgeräumt"
        message: "php artisan berichte:aufraeumen gibt noch nicht „Aufgeräumt“ aus."
      - type: file_contains
        path: routes/console.php
        pattern: "berichte:aufraeumen[\\s\\S]*withoutOverlapping\\(\\)"
        message: Hänge an berichte:aufraeumen ->withoutOverlapping() an.
      - type: command
        run: php artisan schedule:list
        stdout_matches: "0\\s+8 \\* \\* 1\\s+App\\\\Jobs\\\\ExportReport"
        message: "In schedule:list fehlt der Job ExportReport montags um 8:00 (0 8 * * 1). Nutze Schedule::job(new ExportReport('wochenbericht'))->weeklyOn(1, '8:00')."
      - type: file_contains
        path: routes/console.php
        pattern: "wochenbericht"
        message: Der geplante ExportReport soll den Namen wochenbericht bekommen.
    hints:
      - "`use Illuminate\\Support\\Facades\\Schedule;` oben in `routes/console.php` ergänzen."
      - "Ein Closure-Befehl: `Artisan::command('berichte:aufraeumen', function () { $this->info('Aufgeräumt'); })->dailyAt('02:30')->withoutOverlapping();`"
      - "Montags ist Tag 1: `->weeklyOn(1, '8:00')`."
    solution: |
      ```php title="routes/console.php"
      <?php

      use App\Jobs\ExportReport;
      use Illuminate\Foundation\Inspiring;
      use Illuminate\Support\Facades\Artisan;
      use Illuminate\Support\Facades\Schedule;

      Artisan::command('inspire', function () {
          $this->comment(Inspiring::quote());
      })->purpose('Display an inspiring quote');

      Schedule::command('queue:prune-failed --hours=48')->daily();

      Artisan::command('berichte:aufraeumen', function () {
          $this->info('Aufgeräumt');
      })->purpose('Räumt alte Berichte auf')->dailyAt('02:30')->withoutOverlapping();

      Schedule::job(new ExportReport('wochenbericht'))->weeklyOn(1, '8:00');
      ```
  - id: cron-einrichten
    type: simulated
    title: Den Scheduler auf dem Server aktivieren
    description: |
      Deine Anwendung liegt auf einem Server unter `/var/www/app`. Damit der Zeitplan überhaupt läuft,
      braucht der Server **einen** Cron-Eintrag.

      1. Melde dich mit `ssh deploy@203.0.113.10` an.
      2. Sieh dir mit `crontab -l` die bisherigen Einträge an.
      3. Trage den Scheduler ein, ohne einen Editor zu öffnen:
         `echo "* * * * * cd /var/www/app && php artisan schedule:run >> /dev/null 2>&1" | crontab -`
      4. Prüfe mit `crontab -l`, ob der Eintrag gespeichert ist.
      5. Kontrolliere mit `php artisan schedule:list` (im Ordner `/var/www/app`), was geplant ist.
    prompt: "du@laptop:~$"
    steps:
      - expect: "^ssh\\s+deploy@203\\.0\\.113\\.10$"
        output: |
          Welcome to Ubuntu 24.04 LTS
          Last login: Thu Oct  8 09:12:44 2026 from 198.51.100.23
        prompt: "deploy@app-server:~$"
        hint: Nutze ssh benutzer@ip.
      - expect: "^crontab\\s+-l$"
        output: no crontab for deploy
        hint: "`crontab -l` listet die Einträge des aktuellen Benutzers."
      - expect: "^echo\\s+[\"']\\* \\* \\* \\* \\* cd /var/www/app && php artisan schedule:run >> /dev/null 2>&1[\"']\\s*\\|\\s*crontab\\s+-$"
        output: ""
        hint: "Achte auf fünf Sternchen, `&&` zwischen cd und php und das `|` vor `crontab -`."
      - expect: "^crontab\\s+-l$"
        output: "* * * * * cd /var/www/app && php artisan schedule:run >> /dev/null 2>&1"
        hint: Jetzt sollte der Eintrag erscheinen.
      - expect: "^(cd\\s+/var/www/app\\s*&&\\s*)?php\\s+artisan\\s+schedule:list$"
        output: |
          0  0 * * *  php artisan queue:prune-failed --hours=48 ... Next Due: 14 hours from now
          30 2 * * *  php artisan berichte:aufraeumen .......... Next Due: 16 hours from now
          0  8 * * 1  App\Jobs\ExportReport ...................... Next Due: 3 days from now
        hint: "Wechsle mit `cd /var/www/app` in den Projektordner oder schreibe `cd /var/www/app && php artisan schedule:list`."
    responses:
      - match: "^cd\\s+/var/www/app$"
        output: ""
      - match: "^ls"
        output: "app  artisan  bootstrap  config  database  public  resources  routes  storage  vendor"
---
Jeden Monat sollen 50 000 Kundendatensätze importiert werden – in Paketen, damit kein Job ewig läuft. Du
willst wissen, wann **alle** Pakete fertig sind. Und jede Nacht um 2:30 soll ein Aufräum-Befehl laufen,
ohne dass jemand daran denkt. Dafür gibt es **Batches** und den **Scheduler**.

## Batches: viele Jobs als Gruppe

Ein [[job-batch|Batch]] ist eine Gruppe von Jobs mit gemeinsamem Fortschritt. Laravel speichert ihn in der
Tabelle `job_batches`, die in neuen Projekten schon angelegt ist. Jeder Job braucht den Trait `Batchable`:

```php title="app/Jobs/ImportChunk.php"
class ImportChunk implements ShouldQueue
{
    use Batchable, Queueable;

    public function __construct(public int $from, public int $to) {}

    public function handle(): void
    {
        if ($this->batch()->cancelled()) {
            return;   // Batch wurde abgebrochen – nichts mehr tun
        }

        // Zeilen $from bis $to importieren …
    }
}
```

Abgeschickt wird die Gruppe mit `Bus::batch()`:

```php
$batch = Bus::batch([
    new ImportChunk(1, 1000),
    new ImportChunk(1001, 2000),
    new ImportChunk(2001, 3000),
])->then(function (Batch $batch) {
    // alle Jobs erfolgreich
})->catch(function (Batch $batch, Throwable $e) {
    // der erste Job ist gescheitert
})->finally(function (Batch $batch) {
    // Batch ist fertig – egal wie
})->name('Kundenimport')->dispatch();
```

Die Callbacks werden wie Jobs gespeichert und später im Worker ausgeführt. Nutze darin deshalb kein
`$this` – schreibst du den Batch in einer Klasse, markiere kurze Callbacks mit `static fn`.

## Den Fortschritt verfolgen

Der Batch hat eine ID, über die du ihn später wiederfindest – etwa für einen Fortschrittsbalken:

```php
$batch = Bus::findBatch($batchId);

$batch->totalJobs;     // 3
$batch->pendingJobs;   // noch offen
$batch->failedJobs;    // gescheitert
$batch->progress();    // 0–100 (Prozent)
$batch->finished();    // true, wenn alles durch ist
$batch->cancel();      // Rest abbrechen
```

Scheitert ein Job, markiert Laravel den Batch als abgebrochen. Sollen die anderen weiterlaufen, rufst du
beim Abschicken `->allowFailures()` auf.

> [!MERKSATZ]
> Ein **Batch** läuft parallel und meldet sich, wenn alle fertig sind. Eine **Kette** läuft nacheinander
> und bricht beim ersten Fehler ab.

Eine Kette brauchst du, wenn die Reihenfolge zählt – erst herunterladen, dann auswerten, dann
benachrichtigen:

```php
Bus::chain([
    new DownloadFile($url),
    new ParseFile($path),
    new NotifyAdmin(),
])->dispatch();
```

> [!FEHLER]
> **`Batchable` vergessen.** Ohne den Trait gibt es `$this->batch()` nicht, und Laravel kann den Job nicht
> dem Batch zuordnen. Jeder Job in `Bus::batch()` braucht `use Batchable, Queueable;`.

## Der Scheduler: ein Cron-Eintrag für alles

Früher stand jede wiederkehrende Aufgabe als eigene Zeile im [[cron|Cron]] des Servers – unversioniert
und nur per SSH sichtbar. Der [[scheduler|Scheduler]] von Laravel holt den Zeitplan in deinen Code, nach
`routes/console.php`:

```php title="routes/console.php"
use Illuminate\Support\Facades\Schedule;

Schedule::command('queue:prune-failed --hours=48')->daily();
Schedule::job(new ExportReport('wochenbericht'))->weeklyOn(1, '8:00');
Schedule::call(fn () => Cache::forget('stats'))->everyFifteenMinutes();

Artisan::command('berichte:aufraeumen', function () {
    $this->info('Aufgeräumt');
})->dailyAt('02:30')->withoutOverlapping();
```

| Methode | Bedeutung |
|---|---|
| `everyMinute()`, `everyFiveMinutes()`, `hourly()` | feste Abstände |
| `daily()`, `dailyAt('02:30')` | täglich |
| `weeklyOn(1, '8:00')`, `monthly()` | wöchentlich, monatlich |
| `cron('15 3 * * 1-5')` | eigener Cron-Ausdruck |
| `weekdays()`, `between('8:00', '18:00')` | Einschränkungen |

## Den Scheduler betreiben

Auf dem Server steht genau **ein** Cron-Eintrag. Er ruft jede Minute `schedule:run` auf, und Laravel
entscheidet, was gerade fällig ist:

```text title="crontab"
* * * * * cd /var/www/app && php artisan schedule:run >> /dev/null 2>&1
```

Nützliche Befehle:

| Befehl | Zweck |
|---|---|
| `php artisan schedule:list` | Zeitplan mit nächstem Termin anzeigen |
| `php artisan schedule:work` | lokal im Vordergrund laufen lassen |
| `php artisan schedule:test` | eine Aufgabe sofort auswählen und ausführen |

Zwei Schutzmechanismen solltest du kennen:

- `withoutOverlapping()` – startet nicht, solange der vorige Lauf noch arbeitet.
- `onOneServer()` – läuft bei mehreren Servern nur auf einem (braucht einen gemeinsamen Cache).

> [!PRAXIS]
> Lange Aufgaben gehören nicht direkt in den Scheduler. Plane mit `Schedule::job()` einen Job ein: Der
> Scheduler legt ihn nur ab, ein Worker erledigt ihn – mit Wiederholungen und `failed_jobs`.

## Zusammenfassung

- `Bus::batch([...])` verfolgt eine Gruppe paralleler Jobs; `then`, `catch`, `finally` reagieren auf das Ergebnis.
- Batch-Jobs brauchen den Trait `Batchable` und prüfen `$this->batch()->cancelled()`.
- `Bus::chain([...])` führt Jobs nacheinander aus und stoppt beim ersten Fehler.
- Der Zeitplan steht in `routes/console.php` – mit `Schedule::command()`, `Schedule::job()` oder `Schedule::call()`.
- Auf dem Server ruft ein einziger Cron-Eintrag jede Minute `schedule:run` auf.
- `withoutOverlapping()` und `onOneServer()` verhindern doppelte Läufe.
