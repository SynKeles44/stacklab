---
title: PHP-Fehler sichtbar machen – var_dump, Fehleranzeige und Logs
summary: Wie du Werte in PHP mit var_dump und dump ausgibst, Fehlermeldungen mit error_reporting und display_errors sichtbar machst und weißt, wo PHP Fehler protokolliert.
duration: 25
sources:
  - title: PHP-Handbuch – var_dump
    url: https://www.php.net/manual/de/function.var-dump.php
  - title: PHP-Handbuch – Laufzeit-Konfiguration für Fehler
    url: https://www.php.net/manual/de/errorfunc.configuration.php
  - title: PHP-Handbuch – Kommandozeilenoptionen
    url: https://www.php.net/manual/de/features.commandline.options.php
  - title: Xdebug – Development Helpers
    url: https://xdebug.org/docs/develop
  - title: Laravel – Debugging-Helfer dump und dd
    url: https://laravel.com/docs/13.x/helpers#method-dd
quiz:
  - type: single
    question: Ein PHP-Skript liefert ein falsches Ergebnis, zeigt aber keinerlei Meldung. Was prüfst du zuerst?
    options:
      - Ob die Datei die Endung .php hat.
      - Ob Fehlermeldungen unterdrückt werden – zum Beispiel durch `display_errors=0` oder `error_reporting(0)`.
      - Ob der Rechner genug Arbeitsspeicher hat.
    answer: 1
    explanation: >
      PHP läuft bei Warnings weiter und rechnet mit Ersatzwerten wie `null`. Ist die Anzeige abgeschaltet, siehst
      du nur das falsche Ergebnis, nicht den Grund.
  - type: match
    question: Ordne jeder Einstellung ihre Wirkung zu.
    pairs:
      - { left: "error_reporting = E_ALL", right: "Welche Fehlerarten PHP überhaupt meldet" }
      - { left: "display_errors = On", right: "Fehler werden in der Ausgabe angezeigt" }
      - { left: "log_errors = On", right: "Fehler werden in ein Protokoll geschrieben" }
      - { left: "error_log = /var/log/php.log", right: "In welche Datei das Protokoll geht" }
    explanation: >
      `error_reporting` entscheidet, was gemeldet wird, `display_errors` und `log_errors` entscheiden, wohin.
      In der Entwicklung zeigst du an, in Produktion protokollierst du nur.
  - type: cloze
    text: Mit `php ___ display_errors=1 skript.php` setzt du eine ini-Einstellung nur für diesen einen Aufruf. Die geladene Konfigurationsdatei zeigt dir `php ___`.
    blanks:
      - [-d]
      - [--ini]
    explanation: >
      `-d` überschreibt eine Einstellung für einen Aufruf, ohne die php.ini zu ändern. `php --ini` listet die
      geladenen ini-Dateien.
  - type: multiple
    question: Welche Aussagen über `var_dump` und `dd` stimmen?
    options:
      - "`var_dump` zeigt Typ **und** Wert, zum Beispiel `string(4) \"4.95\"`."
      - "`dd()` kommt aus Laravel/Symfony, gibt Werte aus und beendet danach das Skript."
      - "`print_r(false)` gibt deutlich sichtbar `false` aus."
      - "`var_dump` gehört nicht in Code, der in Produktion läuft."
    answers: [0, 1, 3]
    explanation: >
      `print_r(false)` gibt einen leeren String aus – genau deshalb ist `var_dump` beim Debuggen meist besser.
      Debug-Ausgaben entfernst du vor dem Commit.
tasks:
  - id: notenschnitt-debuggen
    type: terminal
    title: Den stillen Fehler im Notenschnitt finden
    description: |
      Im Ordner `php-fehler` liegt `notenschnitt.php`. Die drei Noten 2, 1 und 3 sollen den Schnitt `2.00`
      ergeben, das Skript meldet aber `Schnitt: 1.00` – ganz ohne Fehlermeldung. Ein Kollege hat oben im Skript
      die Fehleranzeige abgeschaltet.

      1. Führe `php notenschnitt.php` aus.
      2. Entferne die beiden Zeilen, die Fehler unterdrücken (`ini_set('display_errors', '0');` und
         `error_reporting(0);`), und führe das Skript erneut aus. Lies die Warnung.
      3. Probiere zum Vergleich `php -d xdebug.mode=develop notenschnitt.php` – Xdebug zeigt einen Call Stack
         mit allen Argumenten.
      4. Behebe die Ursache, sodass `Schnitt: 2.00` erscheint und **keine** Warnung mehr kommt.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit die Datei angelegt wird.
    workdir: php-fehler
    setup: |
      cat > notenschnitt.php <<'EOF'
      <?php

      ini_set('display_errors', '0');
      error_reporting(0);

      $noten = [
          ['fach' => 'Mathe', 'note' => 2],
          ['fach' => 'Deutsch', 'note' => 1],
          ['fach' => 'Englisch', 'noten' => 3],
      ];

      function schnitt(array $noten): float
      {
          $summe = 0;
          foreach ($noten as $eintrag) {
              $summe += $eintrag['note'];
          }

          return $summe / count($noten);
      }

      printf("Schnitt: %.2f\n", schnitt($noten));
      EOF
    checks:
      - type: command
        run: php notenschnitt.php
        stdout_equals: "Schnitt: 2.00"
        message: "`php notenschnitt.php` soll genau `Schnitt: 2.00` ausgeben. Lies die Warnung – welcher Schlüssel fehlt in welchem Eintrag?"
      - type: command
        run: "! grep -Eq \"error_reporting\\(\\s*0\\s*\\)|display_errors'\\s*,\\s*'0'\" notenschnitt.php"
        message: Entferne die Zeilen, die Fehlermeldungen unterdrücken – sonst bleibt der nächste Fehler wieder unsichtbar.
      - type: command
        run: php -d display_errors=1 -d error_reporting=-1 notenschnitt.php 2>&1 | grep -Eci 'warning|notice|deprecated' || true
        stdout_equals: "0"
        message: Das Skript erzeugt noch Warnungen. Behebe die Ursache, statt die Meldung zu verstecken.
    hints:
      - "Nach dem Entfernen der zwei Zeilen meldet PHP `Warning: Undefined array key \"note\"` in der Schleife."
      - "Schau dir mit `var_dump($eintrag);` in der Schleife an, welcher Eintrag anders aufgebaut ist."
      - "Im dritten Eintrag steht `'noten' => 3` statt `'note' => 3`. Korrigiere den Schlüssel."
    solution: |
      ```bash
      cd php-fehler
      php notenschnitt.php                       # Schnitt: 1.00 – keine Meldung
      # Zeilen ini_set('display_errors', '0'); und error_reporting(0); löschen
      php notenschnitt.php                       # Warning: Undefined array key "note" … line 16
      php -d xdebug.mode=develop notenschnitt.php
      # im dritten Eintrag 'noten' => 3 zu 'note' => 3 ändern
      php notenschnitt.php                       # Schnitt: 2.00
      ```
  - id: umsatz-robust
    type: code
    language: php
    title: Mach umsatz() robust
    description: |
      `umsatz()` addiert die Beträge einer Liste von Bestellungen. In echten Daten fehlt bei stornierten
      Bestellungen aber der Schlüssel `betrag` – dann wirft PHP die Warnung `Undefined array key "betrag"`.
      Außerdem stürzt die Funktion bei einer leeren Liste ab.

      Repariere die Funktion:

      - Bestellungen **ohne** `betrag` werden übersprungen.
      - Eine leere Liste ergibt `0.0`.
      - Der Rückgabewert ist immer ein `float`, gerundet auf zwei Nachkommastellen.

      Hinweis: `durchschnitt` soll den Durchschnitt der **gezählten** Bestellungen liefern – auch hier ohne Division
      durch 0.
    starter: |
      <?php
      function umsatz(array $bestellungen): float
      {
          $summe = 0;
          foreach ($bestellungen as $bestellung) {
              $summe += $bestellung['betrag'];
          }
          return round($summe, 2);
      }

      function durchschnitt(array $bestellungen): float
      {
          return round(umsatz($bestellungen) / count($bestellungen), 2);
      }
    tests:
      - name: addiert alle Beträge
        code: assert_same(30.5, umsatz([['betrag' => 10.25], ['betrag' => 20.25]]));
      - name: überspringt Bestellungen ohne Betrag
        code: assert_same(12.0, umsatz([['betrag' => 12.0], ['status' => 'storniert']]));
      - name: leere Liste ergibt 0.0
        code: assert_same(0.0, umsatz([]));
      - name: durchschnitt zählt nur Bestellungen mit Betrag
        code: assert_same(15.0, durchschnitt([['betrag' => 10.0], ['status' => 'storniert'], ['betrag' => 20.0]]));
      - name: durchschnitt einer leeren Liste ist 0.0
        code: assert_same(0.0, durchschnitt([]));
    hints:
      - "Mit `if (!isset($bestellung['betrag'])) { continue; }` überspringst du Einträge ohne Betrag."
      - "Starte mit `$summe = 0.0;`, damit das Ergebnis auch bei leerer Liste ein float ist."
      - "Zähle in `durchschnitt()` nur die Einträge mit Betrag, z. B. mit `array_filter` und `isset`, und gib bei 0 früh `0.0` zurück."
    solution: |
      <?php
      function umsatz(array $bestellungen): float
      {
          $summe = 0.0;
          foreach ($bestellungen as $bestellung) {
              if (!isset($bestellung['betrag'])) {
                  continue;
              }
              $summe += $bestellung['betrag'];
          }
          return round($summe, 2);
      }

      function durchschnitt(array $bestellungen): float
      {
          $mitBetrag = array_filter($bestellungen, fn (array $b): bool => isset($b['betrag']));
          if (count($mitBetrag) === 0) {
              return 0.0;
          }
          return round(umsatz($mitBetrag) / count($mitBetrag), 2);
      }
---
PHP ist gnädig: Bei vielen Problemen bricht es nicht ab, sondern gibt eine Warnung aus und rechnet mit einem
Ersatzwert weiter. Das ist bequem – bis die Warnung abgeschaltet ist und du nur noch ein falsches Ergebnis
siehst. In dieser Lektion lernst du, Werte sichtbar zu machen und dafür zu sorgen, dass PHP dir **jedes**
Problem meldet.

## Werte ausgeben: var_dump und Verwandte

[[php|PHP]] hat mehrere Funktionen, um Werte anzuzeigen. Für das Debugging ist [[var-dump|var_dump]] die
wichtigste, weil sie **Typ und Wert** zeigt:

```php title="ausgaben.php"
<?php
$preis = '4.95';
$aktiv = false;

var_dump($preis);    // string(4) "4.95"
var_dump($aktiv);    // bool(false)
print_r($aktiv);     // (gar nichts!)
var_export($aktiv);  // false
```

| Funktion | Zeigt | Gut für |
|---|---|---|
| `var_dump($x)` | Typ, Länge und Wert | Debugging – auch `null` und `false` sind sichtbar |
| `print_r($x)` | lesbare Struktur | schneller Blick in Arrays |
| `var_export($x)` | gültigen PHP-Code | Werte in Tests oder Konfiguration übernehmen |

In Laravel und Symfony gibt es zusätzlich `dump($x)` – eine schön formatierte Ausgabe – und
[[dump-and-die|dd($x)]], das ausgibt und das Skript danach sofort beendet („dump and die“).

> [!FEHLER]
> **`print_r` für Wahrheitswerte.** `print_r(false)` und `print_r(null)` geben einen leeren String aus. Du
> denkst „die Variable ist leer“, dabei ist sie `false`. Nutze beim Debuggen `var_dump`.

## Warum Fehler manchmal unsichtbar sind

Ob du eine Fehlermeldung siehst, hängt von zwei Einstellungen ab:

- [[error-reporting|error_reporting]] legt fest, **welche** Fehlerarten PHP überhaupt meldet. Seit PHP 8 ist
  der Standard `E_ALL` – also alles.
- [[display-errors|display_errors]] legt fest, ob diese Meldungen in der **Ausgabe** erscheinen.

Beides lässt sich an drei Stellen setzen: in der [[php-ini|php.ini]], beim Aufruf mit `-d` und im Code mit
`ini_set()` und `error_reporting()`. Steht im Code `error_reporting(0);`, verschluckt PHP jede Meldung – auch
wenn deine php.ini alles anzeigen würde.

```bash title="Terminal"
php --ini                                    # welche ini-Dateien sind geladen?
php -i | grep -E 'display_errors|error_reporting'
php -d display_errors=1 -d error_reporting=-1 skript.php   # nur für diesen Aufruf alles anzeigen
```

> [!MERKSATZ]
> In der **Entwicklung** willst du alle Fehler sehen: `error_reporting=E_ALL` und `display_errors=On`. In
> **Produktion** zeigst du Besuchern nie Fehler an (`display_errors=Off`), sondern schreibst sie mit
> `log_errors=On` in ein Protokoll.

## Wo PHP Fehler protokolliert

Ist `log_errors` aktiv, schreibt PHP jede Meldung in ein Protokoll, meist eine [[logdatei|Logdatei]]. Wohin, bestimmt `error_log`:

| Situation | Wo landen die Meldungen? |
|---|---|
| `error_log` ist ein Dateipfad | in dieser Logdatei |
| `error_log` leer, Kommandozeile | auf der Standardfehlerausgabe (stderr) |
| `error_log` leer, Webserver (z. B. PHP-FPM) | im Log des Webservers bzw. FPM |
| Laravel-Anwendung | zusätzlich in `storage/logs/laravel.log` |

Eigene Meldungen schreibst du mit `error_log('Import gestartet');` in dasselbe Protokoll. Wie du solche Logs
liest und filterst, lernst du im letzten Modul.

## Xdebug als Ausgabehelfer

[[xdebug|Xdebug]] ist eine PHP-Erweiterung mit mehreren Modi. Der Modus `develop` verbessert die Fehleranzeige:
Zu jeder Warnung und jedem Fatal error erscheint ein **Call Stack** mit allen Funktionsargumenten, und
`var_dump` wird übersichtlicher formatiert.

```text title="php -d xdebug.mode=develop notenschnitt.php"
Warning: Undefined array key "note" in /workspace/debugging/php-fehler/notenschnitt.php on line 16

Call Stack:
    0.0001     472808   1. {main}() /workspace/debugging/php-fehler/notenschnitt.php:0
    0.0001     472840   2. schnitt($noten = [0 => [...], 1 => [...], 2 => ['fach' => 'Englisch', 'noten' => 3]]) …
```

Im Übungs-Terminal ist Xdebug installiert, aber standardmäßig ausgeschaltet (`xdebug.mode=off`), weil es PHP
verlangsamt. Mit `-d xdebug.mode=develop` schaltest du es nur für einen Aufruf ein.

> [!PRAXIS]
> Steht in einem Projekt ein `@` vor einem Funktionsaufruf (`@file_get_contents(…)`) oder ein
> `error_reporting(0)`, ist das ein Warnsignal: Hier wurde ein Problem versteckt statt gelöst. Beim Debuggen
> entfernst du solche Unterdrückungen zuerst.

## Zusammenfassung

- `var_dump` zeigt Typ und Wert und ist darum das wichtigste Ausgabewerkzeug; `dd()` gibt aus und beendet.
- `error_reporting` bestimmt, *was* gemeldet wird, `display_errors` und `log_errors`, *wohin*.
- Einstellungen kommen aus php.ini, `-d` beim Aufruf oder `ini_set()` im Code.
- Entwicklung: alles anzeigen. Produktion: nichts anzeigen, alles protokollieren.
- Ohne `error_log`-Datei landen Meldungen auf der Kommandozeile auf stderr.
- `php -d xdebug.mode=develop` liefert Call Stacks mit Argumenten zu jeder Meldung.
