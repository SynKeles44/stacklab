---
title: Dateien, JSON und Datum
summary: Dateien lesen und schreiben, JSON sicher kodieren und dekodieren und mit DateTimeImmutable rechnen, ohne in Zeitfallen zu tappen.
duration: 25
sources:
  - title: PHP-Handbuch – file_put_contents
    url: https://www.php.net/manual/de/function.file-put-contents.php
  - title: PHP-Handbuch – json_encode und JSON-Konstanten
    url: https://www.php.net/manual/de/function.json-encode.php
  - title: PHP-Handbuch – DateTimeImmutable
    url: https://www.php.net/manual/de/class.datetimeimmutable.php
  - title: PHP-Handbuch – Datumsformate für format()
    url: https://www.php.net/manual/de/datetime.format.php
quiz:
  - type: single
    question: "Was liefert `json_decode('{\"name\":\"Ada\"}', true)`?"
    options:
      - Ein Objekt der Klasse stdClass
      - "Das assoziative Array ['name' => 'Ada']"
      - Den String "Ada"
      - null
    answer: 1
    explanation: Mit true als zweitem Argument liefert json_decode assoziative Arrays statt stdClass-Objekten.
  - type: find-bug
    question: Der Code soll das Startdatum ausgeben und dann das Ende eine Woche später. Es erscheint aber zweimal dasselbe Datum. In welcher Zeile liegt die Ursache?
    language: php
    code: |
      <?php
      $start = new DateTime('2026-10-01');
      $ende = $start->modify('+7 days');
      echo $start->format('d.m.Y'), PHP_EOL;
      echo $ende->format('d.m.Y'), PHP_EOL;
    bug_line: 2
    explanation: >
      DateTime ist veränderlich: modify() ändert $start selbst und gibt dasselbe Objekt zurück. Mit
      `new DateTimeImmutable(...)` liefert modify() ein neues Objekt, und $start bleibt unverändert.
  - type: multiple
    question: Welche Optionen sind beim Speichern von JSON-Dateien sinnvoll?
    options:
      - JSON_PRETTY_PRINT für lesbare Einrückung
      - JSON_UNESCAPED_UNICODE, damit Umlaute nicht als ö erscheinen
      - JSON_THROW_ON_ERROR, damit Fehler eine Exception auslösen
      - JSON_PARTIAL_OUTPUT_ON_ERROR, damit kaputte Daten trotzdem gespeichert werden
    answers: [0, 1, 2]
    explanation: Halb kaputte Daten zu speichern ist gefährlich. Mit JSON_THROW_ON_ERROR fällt ein Fehler sofort auf.
  - type: match
    question: Ordne jedem Formatzeichen von format() seine Bedeutung zu.
    pairs:
      - { left: "d", right: "Tag mit führender Null (01–31)" }
      - { left: "m", right: "Monat mit führender Null (01–12)" }
      - { left: "Y", right: "Jahr vierstellig" }
      - { left: "H:i", right: "Stunden und Minuten im 24-Stunden-Format" }
    explanation: "`format('d.m.Y H:i')` ergibt zum Beispiel 10.10.2026 14:05."
tasks:
  - id: notizbuch
    type: terminal
    title: Ein Notizbuch mit JSON-Datei
    description: |
      Du baust ein CLI-Notizbuch, das seine Einträge in einer JSON-Datei speichert.

      Klicke zuerst auf **Aufgabe vorbereiten** – der Ordner `notizbuch` ist danach leer.

      Lege im Ordner `notizbuch` die Datei `notiz.php` an. Die Daten liegen in `notizen.json` im **aktuellen
      Verzeichnis** (`getcwd()`).

      1. `php notiz.php add "Brot kaufen"` hängt eine Notiz an und gibt `Notiz 1 gespeichert.` aus
         (die Nummer ist die Anzahl der Notizen).
      2. Jede Notiz ist ein Objekt mit `text` und `erstellt` (Zeitpunkt im Format `DATE_ATOM`,
         z. B. `2026-10-10T14:05:00+00:00`). Die Datei ist eingerückt (`JSON_PRETTY_PRINT`), Umlaute bleiben
         lesbar (`JSON_UNESCAPED_UNICODE`).
      3. `php notiz.php list` gibt jede Notiz als `1. Brot kaufen (10.10.2026)` aus – gibt es keine,
         erscheint `Keine Notizen.`
      4. Ein unbekannter Befehl führt zu einer Meldung auf STDERR und Exit-Code 1.
    workdir: notizbuch
    setup: |
      true
    checks:
      - type: file_exists
        path: notiz.php
        message: Im Ordner notizbuch fehlt noch die Datei notiz.php.
      - type: command
        run: 'd=$(mktemp -d "$PWD/.pruefung-XXXXXX"); cd "$d"; php ../notiz.php list; s=$?; cd ..; rm -rf "$d"; exit $s'
        stdout_equals: "Keine Notizen."
        message: 'Ohne Datei soll "php notiz.php list" genau "Keine Notizen." ausgeben – prüfe vorher mit file_exists().'
      - type: command
        run: 'd=$(mktemp -d "$PWD/.pruefung-XXXXXX"); cd "$d"; php ../notiz.php add "Käse" >/dev/null && php ../notiz.php add "Brot kaufen"; s=$?; cd ..; rm -rf "$d"; exit $s'
        stdout_equals: "Notiz 2 gespeichert."
        message: 'Nach zwei Einträgen soll add "Notiz 2 gespeichert." ausgeben.'
      - type: command
        run: 'd=$(mktemp -d "$PWD/.pruefung-XXXXXX"); cd "$d"; php ../notiz.php add "Käse" >/dev/null; php ../notiz.php add "Brot kaufen" >/dev/null; jq -r "length, .[1].text, .[0].erstellt" notizen.json; cd ..; rm -rf "$d"'
        stdout_matches: "^2\\nBrot kaufen\\n\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}[+-]\\d{2}:\\d{2}$"
        message: notizen.json soll eine JSON-Liste von Objekten mit text und erstellt (DATE_ATOM) enthalten.
      - type: command
        run: 'd=$(mktemp -d "$PWD/.pruefung-XXXXXX"); cd "$d"; php ../notiz.php add "Käse" >/dev/null; grep -c "Käse" notizen.json; cd ..; rm -rf "$d"'
        stdout_matches: "^1$"
        message: Umlaute sollen in notizen.json lesbar bleiben – nutze JSON_UNESCAPED_UNICODE.
      - type: command
        run: 'd=$(mktemp -d "$PWD/.pruefung-XXXXXX"); cd "$d"; php ../notiz.php add "Käse" >/dev/null; php ../notiz.php add "Brot kaufen" >/dev/null; php ../notiz.php list; cd ..; rm -rf "$d"'
        stdout_matches: "^1\\. Käse \\(\\d{2}\\.\\d{2}\\.\\d{4}\\)\\n2\\. Brot kaufen \\(\\d{2}\\.\\d{2}\\.\\d{4}\\)$"
        message: 'list soll Zeilen wie "1. Käse (10.10.2026)" ausgeben – Datum mit format("d.m.Y").'
      - type: command
        run: 'd=$(mktemp -d "$PWD/.pruefung-XXXXXX"); cd "$d"; php ../notiz.php quatsch >/dev/null 2>&1; s=$?; cd ..; rm -rf "$d"; echo "exit=$s"'
        stdout_equals: "exit=1"
        message: Ein unbekannter Befehl soll mit exit(1) enden.
    hints:
      - "Laden: `$notizen = file_exists($datei) ? json_decode(file_get_contents($datei), true, flags: JSON_THROW_ON_ERROR) : [];`"
      - "Neue Notiz: `$notizen[] = ['text' => $argv[2], 'erstellt' => (new DateTimeImmutable())->format(DATE_ATOM)];`"
      - "Für die Liste: `(new DateTimeImmutable($notiz['erstellt']))->format('d.m.Y')`. Den Befehl unterscheidest du mit `switch ($argv[1] ?? '')`."
    solution: |
      ```php
      <?php
      declare(strict_types=1);

      $datei = getcwd() . '/notizen.json';
      $notizen = file_exists($datei)
          ? json_decode(file_get_contents($datei), true, flags: JSON_THROW_ON_ERROR)
          : [];

      switch ($argv[1] ?? '') {
          case 'add':
              $notizen[] = [
                  'text' => $argv[2] ?? '',
                  'erstellt' => (new DateTimeImmutable())->format(DATE_ATOM),
              ];
              file_put_contents(
                  $datei,
                  json_encode($notizen, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
              );
              echo 'Notiz ' . count($notizen) . ' gespeichert.' . PHP_EOL;
              break;
          case 'list':
              if ($notizen === []) {
                  echo 'Keine Notizen.' . PHP_EOL;
              }
              foreach ($notizen as $i => $notiz) {
                  $datum = (new DateTimeImmutable($notiz['erstellt']))->format('d.m.Y');
                  echo sprintf('%d. %s (%s)', $i + 1, $notiz['text'], $datum) . PHP_EOL;
              }
              break;
          default:
              fwrite(STDERR, 'Befehle: add <text>, list' . PHP_EOL);
              exit(1);
      }
      ```
  - id: faelligkeit
    type: code
    language: php
    title: Wann ist die Rechnung fällig?
    description: |
      Schreibe `faelligAm(string $rechnungsdatum, int $zahlungszielTage): string`.

      - `$rechnungsdatum` kommt im Format `JJJJ-MM-TT`.
      - Rechne das Zahlungsziel in Tagen dazu und gib das Ergebnis als `TT.MM.JJJJ` zurück.
      - Nutze `DateTimeImmutable`. Ein ungültiges Datum darf ruhig die Exception von PHP auslösen.
    starter: |
      <?php
      declare(strict_types=1);

      function faelligAm(string $rechnungsdatum, int $zahlungszielTage): string
      {
          return '';
      }
    tests:
      - name: 14 Tage Zahlungsziel
        code: assert_same('24.10.2026', faelligAm('2026-10-10', 14));
      - name: über das Monatsende hinaus
        code: assert_same('02.03.2026', faelligAm('2026-01-31', 30));
      - name: Zahlungsziel 0
        code: assert_same('10.10.2026', faelligAm('2026-10-10', 0));
      - name: Jahreswechsel
        code: assert_same('07.01.2027', faelligAm('2026-12-24', 14));
      - name: ungültiges Datum wirft eine Exception
        code: try { faelligAm('kein-datum', 3); assert_true(false, 'Es wurde keine Exception geworfen.'); } catch (Exception $e) { assert_true(true); }
    hints:
      - "`new DateTimeImmutable($rechnungsdatum)` liest das Datum ein."
      - "`->modify(\"+{$zahlungszielTage} days\")` oder `->add(new DateInterval(\"P{$zahlungszielTage}D\"))` liefert ein neues Objekt."
      - "Zum Schluss `->format('d.m.Y')`."
    solution: |
      <?php
      declare(strict_types=1);

      function faelligAm(string $rechnungsdatum, int $zahlungszielTage): string
      {
          $datum = new DateTimeImmutable($rechnungsdatum);

          return $datum->modify("+{$zahlungszielTage} days")->format('d.m.Y');
      }
---
Ein Programm, das alles nach dem Beenden vergisst, ist selten nützlich. Spätestens im Web weißt du: Jede
Anfrage startet leer. Was bleiben soll, muss irgendwohin – in eine [[datenbank|Datenbank]] oder, für kleine
Werkzeuge, in eine [[datei|Datei]]. Dafür brauchst du drei Dinge: Dateien lesen und schreiben, Daten als
[[json|JSON]] speichern und Zeitpunkte korrekt behandeln.

## Dateien lesen und schreiben

Für die meisten Aufgaben reichen zwei Funktionen:

```php
$inhalt = file_get_contents('daten.txt');              // ganze Datei als String
file_put_contents('daten.txt', "Zeile 1\n");           // überschreiben
file_put_contents('log.txt', "Neu\n", FILE_APPEND | LOCK_EX);   // anhängen, gesperrt
```

| Funktion | Zweck |
|---|---|
| `file_exists($pfad)` / `is_file($pfad)` | gibt es den Pfad / ist es eine Datei? |
| `file($pfad, FILE_IGNORE_NEW_LINES)` | Datei als Array von Zeilen |
| `mkdir($pfad, recursive: true)` | Ordner anlegen |
| `unlink($pfad)` | Datei löschen |
| `__DIR__` | Ordner der aktuellen PHP-Datei |
| `getcwd()` | aktuelles Arbeitsverzeichnis |

Relative Pfade beziehen sich auf das Arbeitsverzeichnis – also den Ordner, in dem du `php` startest. Willst du
eine Datei neben deinem Skript ansprechen, nutze `__DIR__ . '/daten.json'`.

> [!FEHLER]
> `file_get_contents()` auf eine fehlende Datei liefert `false` und eine Warnung. Prüfe vorher mit
> `file_exists()` – sonst landet `false` später in `json_decode()` und erzeugt Folgefehler.

## JSON kodieren

`json_encode` macht aus Arrays und Werten einen JSON-String. Die Optionen sind [[bit|Bit]]-Flags, die du mit `|`
kombinierst:

```php
$buch = ['titel' => 'Die Größe der Welt', 'jahr' => 2026, 'tags' => ['roman']];

json_encode($buch);
// {"titel":"Die Größe der Welt","jahr":2026,"tags":["roman"]}

json_encode($buch, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
```

| Flag | Wirkung |
|---|---|
| `JSON_PRETTY_PRINT` | Einrückung und Zeilenumbrüche |
| `JSON_UNESCAPED_UNICODE` | `ö` bleibt `ö` statt `ö` |
| `JSON_UNESCAPED_SLASHES` | `/` bleibt `/` statt `\/` |
| `JSON_THROW_ON_ERROR` | wirft `JsonException` statt `false` zu liefern |

Eine Liste mit Schlüsseln `0, 1, 2` wird zum JSON-Array `[…]`, ein assoziatives Array zum JSON-Objekt `{…}`.

## JSON dekodieren

```php
$text = file_get_contents('buch.json');
$daten = json_decode($text, true, flags: JSON_THROW_ON_ERROR);
echo $daten['titel'];
```

- Das zweite Argument `true` liefert **assoziative Arrays**. Ohne es bekommst du `stdClass`-Objekte.
- Ohne `JSON_THROW_ON_ERROR` liefert kaputtes JSON einfach `null` – genau wie der gültige Text `null`. Du kannst
  die beiden Fälle dann nicht unterscheiden.

> [!MERKSATZ]
> Nutze bei `json_encode` und `json_decode` immer `JSON_THROW_ON_ERROR`. Ein Fehler soll laut sein, nicht still.

## Zeitpunkte mit DateTimeImmutable

Datum und Uhrzeit sind schwieriger, als sie aussehen: Monate haben verschiedene Längen, es gibt
[[zeitzone|Zeitzonen]] und Sommerzeit. PHP bringt dafür [[datetimeimmutable|DateTimeImmutable]] mit:

```php
$jetzt = new DateTimeImmutable();                          // aktueller Zeitpunkt
$termin = new DateTimeImmutable('2026-10-10 14:00', new DateTimeZone('Europe/Berlin'));

echo $termin->format('d.m.Y H:i');                         // 10.10.2026 14:00
echo $termin->format(DATE_ATOM);                           // 2026-10-10T14:00:00+02:00

$spaeter = $termin->modify('+1 month');                    // neues Objekt!
$frist = $termin->add(new DateInterval('P14D'));           // 14 Tage
$tage = $termin->diff($frist)->days;                       // 14
var_dump($termin < $frist);                                // true – Objekte vergleichbar
```

Ungültige Eingaben wie `new DateTimeImmutable('kaputt')` werfen eine `DateMalformedStringException`.

## Warum „Immutable“?

Es gibt auch die ältere Klasse `DateTime`. Ihr `modify()` ändert das Objekt **selbst**:

```php
$start = new DateTime('2026-10-01');
$ende = $start->modify('+7 days');   // $start ist jetzt auch der 08.10.!
```

[[unveraenderlichkeit|Unveränderliche]] Objekte verhindern solche Überraschungen: Jede Änderung liefert ein
neues Objekt, das alte bleibt, wie es war.

> [!PRAXIS]
> Speichere Zeitpunkte maschinenlesbar mit Zeitzone (`DATE_ATOM`, ISO 8601) oder in UTC, und formatiere sie erst
> bei der Ausgabe für Menschen. Frameworks wie Laravel nutzen dafür die Bibliothek Carbon, die auf
> DateTimeImmutable aufbaut.

## Zusammenfassung

- `file_get_contents` und `file_put_contents` lesen und schreiben ganze Dateien; mit `FILE_APPEND` hängst du an.
- Relative Pfade gelten ab dem Arbeitsverzeichnis, `__DIR__` ist der Ordner des Skripts.
- `json_encode`/`json_decode` immer mit `JSON_THROW_ON_ERROR`; `json_decode(..., true)` liefert Arrays.
- `JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE` macht Dateien lesbar.
- Nutze `DateTimeImmutable` statt `DateTime` und formatiere mit `format('d.m.Y')`.
