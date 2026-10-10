---
title: Fehler und Exceptions
summary: Wie PHP Fehler meldet – die Throwable-Hierarchie, try/catch/finally, eigene Exception-Klassen und wo man Fehler am besten abfängt.
duration: 25
sources:
  - title: PHP-Handbuch – Exceptions
    url: https://www.php.net/manual/de/language.exceptions.php
  - title: PHP-Handbuch – Vordefinierte Exceptions
    url: https://www.php.net/manual/de/reserved.exceptions.php
  - title: PHP-Handbuch – SPL-Exceptions
    url: https://www.php.net/manual/de/spl.exceptions.php
  - title: PHP-Handbuch – Errors in PHP 8
    url: https://www.php.net/manual/de/language.errors.php7.php
quiz:
  - type: single
    question: Welche Klasse ist die gemeinsame Wurzel von `Exception` und `Error`?
    options: ["Throwable", "RuntimeException", "ErrorException", "stdClass"]
    answer: 0
    explanation: >
      `Throwable` ist ein Interface, das beide implementieren. `catch (Throwable $t)` fängt deshalb wirklich alles –
      auch TypeError oder DivisionByZeroError.
  - type: single
    question: "Was gibt dieser Code aus? `function f(): string { try { return 'A'; } finally { echo 'B'; } }  echo f();`"
    options: ["BA", "AB", "A", "B"]
    answer: 0
    explanation: >
      Der finally-Block läuft immer – auch nach einem return. Er wird ausgeführt, bevor der Rückgabewert beim
      Aufrufer ankommt. Deshalb erscheint zuerst B, dann A.
  - type: find-bug
    question: Gesperrte Konten sollen eine eigene Meldung bekommen, doch sie erscheint nie. In welcher Zeile liegt die Ursache?
    language: php
    code: |
      <?php
      class BuchungsFehler extends RuntimeException {}
      class KontoGesperrt extends BuchungsFehler {}

      try {
          $konto->abheben(500);
      } catch (BuchungsFehler $e) {
          echo 'Buchung fehlgeschlagen';
      } catch (KontoGesperrt $e) {
          echo 'Konto ist gesperrt';
      }
    bug_line: 7
    explanation: >
      PHP prüft die catch-Blöcke von oben nach unten. KontoGesperrt ist auch ein BuchungsFehler, also greift
      schon der erste Block. Der speziellere catch-Block muss vor dem allgemeineren stehen.
  - type: match
    question: Ordne jeder Situation die Klasse zu, die PHP (oder du) dabei wirft.
    pairs:
      - { left: "intdiv(1, 0)", right: "DivisionByZeroError" }
      - { left: "strlen([]) mit strict_types", right: "TypeError" }
      - { left: "json_decode('{kaputt', flags: JSON_THROW_ON_ERROR)", right: "JsonException" }
      - { left: "Ein Parameter hat einen unerlaubten Wert", right: "InvalidArgumentException" }
    explanation: >
      Error-Klassen meldet PHP selbst bei Programmierfehlern. Exception-Klassen beschreiben Situationen, auf die
      dein Programm sinnvoll reagieren kann.
  - type: multiple
    question: Welche Aussagen über Exceptions stimmen?
    options:
      - Eine nicht gefangene Exception beendet das Skript mit einem Fatal Error und Exit-Code 255.
      - "Seit PHP 8 darfst du `catch (JsonException)` ohne Variable schreiben."
      - "`throw` ist ein Ausdruck – `$x = $wert ?? throw new LogicException();` ist erlaubt."
      - Jede Funktion sollte jede Exception sofort selbst fangen.
    answers: [0, 1, 2]
    explanation: >
      Fange eine Exception nur dort, wo du wirklich etwas Sinnvolles tun kannst – oft ganz oben im Programm.
      Wer alles sofort fängt, versteckt Fehler.
tasks:
  - id: konto-abheben
    type: code
    language: php
    title: Abheben mit eigenen Exceptions
    description: |
      Baue eine kleine Fehler-Hierarchie für ein Konto.

      1. `class BuchungsFehler extends RuntimeException {}` und `final class KontoGesperrt extends BuchungsFehler {}`.
      2. `final class Konto` mit dem Konstruktor `__construct(private int $saldoCent = 0, private bool $gesperrt = false)`
         und den Methoden `saldoCent(): int` und `abheben(int $cent): void`. `abheben` prüft in dieser Reihenfolge:
         - `$cent <= 0` → `InvalidArgumentException` (ein Programmierfehler des Aufrufers)
         - Konto gesperrt → `KontoGesperrt` mit der Nachricht `Konto gesperrt`
         - zu wenig Guthaben → `BuchungsFehler` mit der Nachricht `Deckung nicht ausreichend`
         - sonst wird der Betrag abgezogen.
      3. `function versucheAbheben(Konto $konto, int $cent): string` ruft `abheben` auf und liefert
         `OK`, bei `KontoGesperrt` den Text `Gesperrt` und bei jedem anderen `BuchungsFehler`
         `Fehler: ` plus die Nachricht. Eine `InvalidArgumentException` fängt sie **nicht** ab.
    starter: |
      <?php
      declare(strict_types=1);

      class BuchungsFehler extends RuntimeException {}

      final class Konto
      {
          public function __construct(private int $saldoCent = 0, private bool $gesperrt = false) {}

          public function saldoCent(): int
          {
              return $this->saldoCent;
          }

          public function abheben(int $cent): void
          {
              $this->saldoCent -= $cent;
          }
      }

      function versucheAbheben(Konto $konto, int $cent): string
      {
          return 'OK';
      }
    tests:
      - name: erfolgreiches Abheben
        code: $k = new Konto(1000); assert_same('OK', versucheAbheben($k, 400)); assert_same(600, $k->saldoCent());
      - name: zu wenig Guthaben
        code: |
          $k = new Konto(100); assert_same('Fehler: Deckung nicht ausreichend', versucheAbheben($k, 101)); assert_same(100, $k->saldoCent());
      - name: gesperrtes Konto
        code: |
          $k = new Konto(1000, gesperrt: true); assert_same('Gesperrt', versucheAbheben($k, 1)); assert_same(1000, $k->saldoCent());
      - name: KontoGesperrt ist ein BuchungsFehler
        code: assert_true(is_subclass_of(KontoGesperrt::class, BuchungsFehler::class)); assert_true(is_subclass_of(BuchungsFehler::class, RuntimeException::class));
      - name: ungültiger Betrag wird nicht verschluckt
        code: try { versucheAbheben(new Konto(1000), 0); assert_true(false, 'Bei 0 Cent wurde keine InvalidArgumentException geworfen.'); } catch (InvalidArgumentException $e) { assert_true(true); }
    hints:
      - "Werfen: `throw new KontoGesperrt('Konto gesperrt');` – die Prüfungen stehen am Anfang von `abheben`, der Abzug ganz am Ende."
      - "Reihenfolge der catch-Blöcke: zuerst `catch (KontoGesperrt)`, danach `catch (BuchungsFehler $e)`."
      - "Für die Nachricht: `return 'Fehler: ' . $e->getMessage();`"
    solution: |
      <?php
      declare(strict_types=1);

      class BuchungsFehler extends RuntimeException {}

      final class KontoGesperrt extends BuchungsFehler {}

      final class Konto
      {
          public function __construct(private int $saldoCent = 0, private bool $gesperrt = false) {}

          public function saldoCent(): int
          {
              return $this->saldoCent;
          }

          public function abheben(int $cent): void
          {
              if ($cent <= 0) {
                  throw new InvalidArgumentException('Betrag muss positiv sein.');
              }
              if ($this->gesperrt) {
                  throw new KontoGesperrt('Konto gesperrt');
              }
              if ($cent > $this->saldoCent) {
                  throw new BuchungsFehler('Deckung nicht ausreichend');
              }

              $this->saldoCent -= $cent;
          }
      }

      function versucheAbheben(Konto $konto, int $cent): string
      {
          try {
              $konto->abheben($cent);

              return 'OK';
          } catch (KontoGesperrt) {
              return 'Gesperrt';
          } catch (BuchungsFehler $e) {
              return 'Fehler: ' . $e->getMessage();
          }
      }
  - id: error-oder-exception
    type: dragdrop
    title: Error oder Exception?
    description: |
      PHP unterscheidet zwei Äste unter `Throwable`. Ordne jede Klasse ihrem Ast zu. Tipp: Error-Klassen
      melden fast immer einen Programmierfehler, Exception-Klassen eine Situation, auf die man reagieren kann.
    targets:
      - { id: error, label: "Ast Error (Programmierfehler, meldet PHP selbst)" }
      - { id: exception, label: "Ast Exception (erwartbare Fehlersituation)" }
    items:
      - { label: TypeError, target: error }
      - { label: DivisionByZeroError, target: error }
      - { label: ValueError, target: error }
      - { label: UnhandledMatchError, target: error }
      - { label: JsonException, target: exception }
      - { label: InvalidArgumentException, target: exception }
      - { label: RuntimeException, target: exception }
      - { label: DateMalformedStringException, target: exception }
---
Dein Skript liest eine JSON-Datei, rechnet mit Eingaben und speichert das Ergebnis. Was passiert, wenn die
Datei kaputt ist, jemand durch null teilt oder das Guthaben nicht reicht? Ein gutes Programm stürzt in solchen
Fällen nicht wortlos ab und rechnet auch nicht still mit falschen Werten weiter. In dieser Lektion lernst du,
wie PHP Fehler meldet und wie du sauber darauf reagierst.

## Zwei Arten, Fehler zu melden

PHP ist über viele Jahre gewachsen. Deshalb gibt es zwei Mechanismen nebeneinander:

| Mechanismus | Beispiel | Verhalten |
|---|---|---|
| **Warnungen und Notices** (alt) | `file_get_contents('fehlt.txt')` | Meldung, dann geht es mit `false` weiter |
| **[[exception\|Exceptions]]** (modern) | `intdiv(1, 0)`, `json_decode(…, flags: JSON_THROW_ON_ERROR)` | Programm springt zum nächsten passenden `catch` |

Warnungen sind tückisch: Das Skript läuft weiter, und der Rückgabewert `false` richtet später an ganz anderer
Stelle Schaden an. Exceptions sind ehrlicher. Sie unterbrechen den normalen Ablauf sofort, bis jemand sie
behandelt.

Seit PHP 8 werfen fast alle eingebauten Funktionen bei falscher Benutzung Exceptions, etwa einen
[[typeerror|TypeError]] bei falschen Typen. Bei älteren Funktionen prüfst du Rückgabewerte selbst oder nutzt
Flags wie `JSON_THROW_ON_ERROR`.

> [!MERKSATZ]
> Eine Exception ist ein Objekt, das sagt: „Hier geht es nicht weiter.“ Sie wandert die Aufrufkette nach oben,
> bis ein passender `catch`-Block sie auffängt.

## try, catch und finally

Mit [[try-catch|try/catch]] fängst du eine Exception auf:

```php
try {
    $daten = json_decode($text, true, flags: JSON_THROW_ON_ERROR);
    echo 'Gelesen: ' . count($daten) . ' Einträge';
} catch (JsonException $e) {
    fwrite(STDERR, 'Ungültiges JSON: ' . $e->getMessage() . PHP_EOL);
} finally {
    echo 'Fertig.' . PHP_EOL;   // läuft IMMER – mit und ohne Fehler
}
```

- Tritt im `try`-Block eine Exception auf, bricht PHP dort ab und springt in den ersten passenden `catch`.
- Mehrere Klassen fängst du mit `catch (JsonException | ValueError $e)`.
- Brauchst du das Objekt nicht, reicht `catch (JsonException)` ohne Variable.
- `finally` eignet sich zum Aufräumen, etwa um eine Datei zu schließen oder eine Sperre zu lösen.

Fängt niemand die Exception, beendet PHP das Skript mit `Fatal error: Uncaught …`, einem [[stack-trace|Stack
Trace]] und dem [[exit-code|Exit-Code]] 255.

## Die Throwable-Hierarchie

Alle Exceptions sind Objekte von [[klasse|Klassen]], die in einem Baum angeordnet sind. Ganz oben steht das
Interface [[throwable|Throwable]]:

![Die Throwable-Hierarchie: Error und Exception mit ihren wichtigsten Unterklassen](/assets/php/throwable-hierarchie.svg)

| Ast | Bedeutung | Typische Klassen |
|---|---|---|
| `Error` | Programmierfehler, meldet PHP selbst | `TypeError`, `ValueError`, `DivisionByZeroError`, `UnhandledMatchError` |
| `Exception` | erwartbare Fehlersituation | `JsonException`, `RuntimeException`, `InvalidArgumentException`, `DateMalformedStringException` |

`catch (Exception $e)` fängt **keine** `Error`-Objekte. Das ist Absicht: Einen TypeError sollst du nicht
wegfangen, sondern den Code reparieren. Nur ganz oben im Programm, etwa um eine freundliche Fehlerseite zu
zeigen, fängt man `Throwable`.

> [!FEHLER]
> `catch (Exception $e) {}` mit leerem Block verschluckt Fehler komplett. Niemand erfährt davon, und die Suche
> nach der Ursache dauert Stunden. Fange nur, was du wirklich behandeln kannst – und protokolliere den Rest.

## Eigene Exceptions

Eigene Klassen machen Fehler sprechend. Du erbst von einer passenden Standardklasse:

```php
class BuchungsFehler extends RuntimeException {}
final class KontoGesperrt extends BuchungsFehler {}

final class Konto
{
    public function abheben(int $cent): void
    {
        if ($cent <= 0) {
            throw new InvalidArgumentException('Betrag muss positiv sein.');
        }
        if ($this->gesperrt) {
            throw new KontoGesperrt('Konto gesperrt');
        }
        // …
    }
}
```

Zwei Familien helfen bei der Wahl der Elternklasse:

- `LogicException` (z. B. `InvalidArgumentException`): Der **Aufrufer** hat einen Fehler gemacht. Das passiert
  nur bei falschem Code.
- `RuntimeException`: Etwas geht zur **Laufzeit** schief, obwohl der Code stimmt – Datei fehlt, Konto
  gesperrt, Netzwerk weg.

Eine [[vererbung|Hierarchie]] eigener Klassen erlaubt beides: `catch (KontoGesperrt)` für den Sonderfall,
`catch (BuchungsFehler $e)` für alle Buchungsprobleme. Der speziellere `catch` muss dabei **zuerst** stehen.

## Wo fängt man Fehler?

Eine Exception darf ruhig durch mehrere Funktionen nach oben wandern. Fange sie dort, wo du sinnvoll reagieren
kannst:

```php
// tief unten: nur werfen, nicht fangen
function ladeKatalog(string $datei): array
{
    if (!is_file($datei)) {
        throw new RuntimeException("Datei {$datei} fehlt.");
    }
    return json_decode(file_get_contents($datei), true, flags: JSON_THROW_ON_ERROR);
}

// ganz oben im CLI-Skript: fangen, Meldung, Exit-Code
try {
    $katalog = ladeKatalog('katalog.json');
} catch (RuntimeException | JsonException $e) {
    fwrite(STDERR, 'Fehler: ' . $e->getMessage() . PHP_EOL);
    exit(1);
}
```

Weitere nützliche Werkzeuge:

- `throw` ist ein Ausdruck: `$name = $argv[1] ?? throw new InvalidArgumentException('Name fehlt');`
- Verketten: `throw new BuchungsFehler('Speichern fehlgeschlagen', previous: $e);` – die Ursache bleibt über
  `getPrevious()` erhalten.
- `$e->getMessage()`, `$e->getFile()`, `$e->getLine()` und `$e->getTraceAsString()` liefern Details.

> [!PRAXIS]
> Frameworks wie Laravel haben einen zentralen Exception-Handler. Er fängt alles, was bis ganz nach oben
> durchrutscht, schreibt es ins Log und zeigt eine passende Fehlerseite oder JSON-Antwort. Deine Klassen
> werfen nur – und bleiben dadurch schlank.

## Zusammenfassung

- Warnungen lassen das Skript weiterlaufen, Exceptions unterbrechen es sofort – moderner Code setzt auf Exceptions.
- `try`/`catch` fängt Exceptions, `finally` läuft immer, mehrere Klassen fängst du mit `|`.
- Unter `Throwable` gibt es zwei Äste: `Error` für Programmierfehler und `Exception` für erwartbare Situationen.
- Eigene Exceptions erben von `RuntimeException` oder `LogicException`; der speziellere `catch` steht zuerst.
- Fange Fehler dort, wo du sinnvoll reagieren kannst – in CLI-Skripten oft ganz oben, mit Meldung auf STDERR
  und `exit(1)`.
- Ein leerer `catch`-Block versteckt Fehler – vermeide ihn.
