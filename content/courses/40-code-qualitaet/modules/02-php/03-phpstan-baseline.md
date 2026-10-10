---
title: Alte Fehler einfrieren mit der Baseline
summary: Wie du PHPStan in ein bestehendes Projekt mit hunderten Fehlern einführst, ohne alles auf einmal zu reparieren – mit Baseline, Ratschen-Prinzip und schrittweisem Hochstufen der Level.
duration: 20
sources:
  - title: PHPStan – The Baseline
    url: https://phpstan.org/user-guide/baseline
  - title: PHPStan – Config Reference (reportUnmatchedIgnoredErrors)
    url: https://phpstan.org/config-reference#reportunmatchedignorederrors
  - title: PHPStan – Rule Levels
    url: https://phpstan.org/user-guide/rule-levels
quiz:
  - type: single
    question: Was speichert eine PHPStan-Baseline?
    options:
      - Alle Fehler, die beim Erzeugen gefunden wurden – PHPStan meldet sie danach nicht mehr.
      - Eine Kopie des Codes zum Zeitpunkt der Analyse.
      - Die Laufzeit jeder Analyse.
      - Nur die Fehler aus neuen Dateien.
    answer: 0
    explanation: Die Baseline ist eine Liste bekannter Fehler (Meldung, Identifier, Anzahl, Datei). Was darin steht, wird ignoriert – alles Neue nicht.
  - type: cloze
    text: "Die Baseline erzeugst du mit `phpstan analyse --___` und bindest sie in der phpstan.neon unter `___:` ein."
    blanks:
      - [generate-baseline]
      - [includes]
    explanation: "`--generate-baseline` schreibt standardmäßig die Datei `phpstan-baseline.neon`. Unter `includes:` wird sie Teil der Konfiguration."
  - type: multiple
    question: Du hast einen Fehler aus der Baseline behoben. Was stimmt?
    options:
      - PHPStan meldet nun „Ignored error pattern … was not matched“.
      - Du erzeugst die Baseline neu, damit der Eintrag verschwindet.
      - Die Baseline wächst automatisch um neue Fehler.
      - So kann die Zahl der Einträge nur sinken – das ist gewollt.
    answers: [0, 1, 3]
    explanation: >
      Standardmäßig ist `reportUnmatchedIgnoredErrors` an. Ein behobener Fehler muss deshalb auch aus der Baseline
      verschwinden – so wird sie nie heimlich zu einer Liste toter Einträge.
  - type: single
    question: Ein Kollege hat einen neuen Fehler eingebaut und erzeugt die Baseline einfach neu, damit die CI grün wird. Was ist das Problem?
    options:
      - Der neue Fehler ist jetzt auch eingefroren – die Baseline hat ihren Zweck verloren.
      - Nichts, so ist die Baseline gedacht.
      - PHPStan verweigert das Neuerzeugen.
    answer: 0
    explanation: Eine Baseline darf im Review nur schrumpfen. Neue Einträge in der Baseline-Datei sind ein Warnsignal und gehören diskutiert.
tasks:
  - id: baseline-einfuehren
    type: terminal
    title: PHPStan mit Baseline einführen
    description: |
      Im Ordner `baseline-einfuehren` liegt ein altes Projekt. Auf Level 6 meldet PHPStan acht Fehler in
      `src/Legacy/`. Das Team will PHPStan **heute** in die Pipeline nehmen – und die alten Fehler später abbauen.

      1. Lege eine `phpstan.neon` mit Level 6 und dem Pfad `src` an und starte `phpstan analyse`.
      2. Erzeuge die Baseline mit `phpstan analyse --generate-baseline`.
      3. Binde `phpstan-baseline.neon` unter `includes:` in deiner `phpstan.neon` ein. `phpstan analyse` ist jetzt grün.
      4. Behebe den echten Fehler in `src/Legacy/Mailer.php` (Tippfehler in `count()`). Starte PHPStan – es
         meldet jetzt, dass Baseline-Einträge nicht mehr passen.
      5. Erzeuge die Baseline neu. Danach ist PHPStan wieder grün, und die Baseline enthält keine Einträge mehr
         für `Mailer.php`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: baseline-einfuehren
    setup: |
      mkdir -p src/Legacy
      cat > src/Legacy/OldReport.php <<'EOF'
      <?php

      namespace App\Legacy;

      class OldReport
      {
          private $rows = [];

          public function addRow($row)
          {
              $this->rows[] = $row;
          }

          public function rows()
          {
              return $this->rows;
          }

          public function total(array $values)
          {
              return array_sum($values);
          }
      }
      EOF
      cat > src/Legacy/Mailer.php <<'EOF'
      <?php

      namespace App\Legacy;

      class Mailer
      {
          /** @var list<string> */
          private array $recipients = [];

          public function add(string $email): void
          {
              $this->recipients[] = $email;
          }

          public function count(): int
          {
              return count($this->recipient);
          }
      }
      EOF
    checks:
      - type: file_exists
        path: phpstan-baseline.neon
        message: Es gibt noch keine phpstan-baseline.neon. Erzeuge sie mit phpstan analyse --generate-baseline.
      - type: file_contains
        path: phpstan.neon
        pattern: "^includes:\\s*\\n\\s+-\\s*phpstan-baseline\\.neon"
        message: Binde die Baseline in der phpstan.neon ein – ganz oben `includes:` und darunter `- phpstan-baseline.neon`.
      - type: file_contains
        path: phpstan.neon
        pattern: "level:\\s*6\\b"
        message: "Die phpstan.neon soll Level 6 verwenden (`level: 6` unter `parameters:`)."
      - type: file_contains
        path: src/Legacy/Mailer.php
        pattern: "count\\(\\$this->recipients\\)"
        message: Der Tippfehler in Mailer::count() ist noch nicht behoben – die Eigenschaft heißt $recipients.
      - type: file_contains
        path: phpstan-baseline.neon
        pattern: "OldReport\\.php"
        message: Die Fehler aus OldReport.php sollen in der Baseline bleiben – die räumt ihr später auf.
      - type: command
        run: "! grep -q 'Mailer.php' phpstan-baseline.neon"
        message: Die Baseline enthält noch Einträge für Mailer.php. Erzeuge sie nach dem Fix neu.
      - type: command
        run: phpstan analyse --no-progress
        message: phpstan analyse ist noch nicht grün. Stimmen Baseline und Code überein?
    hints:
      - "Die Reihenfolge ist wichtig: Erst die Baseline erzeugen, dann einbinden – eine fehlende Datei unter `includes:` bricht PHPStan ab."
      - "`includes:` steht ganz oben in der phpstan.neon, nicht eingerückt, darunter `    - phpstan-baseline.neon`."
      - "In `Mailer::count()` steht `$this->recipient` statt `$this->recipients`."
    solution: |
      ```bash
      cd baseline-einfuehren
      printf 'parameters:\n    level: 6\n    paths:\n        - src\n' > phpstan.neon
      phpstan analyse
      phpstan analyse --generate-baseline
      printf 'includes:\n    - phpstan-baseline.neon\n\nparameters:\n    level: 6\n    paths:\n        - src\n' > phpstan.neon
      phpstan analyse
      sed -i 's/count(\$this->recipient)/count($this->recipients)/' src/Legacy/Mailer.php
      phpstan analyse
      phpstan analyse --generate-baseline
      phpstan analyse
      ```
  - id: baseline-entscheidungen
    type: dragdrop
    title: Baseline, beheben oder diskutieren?
    description: Ordne jede Situation dem richtigen Vorgehen zu.
    targets:
      - { id: baseline, label: "Baseline erzeugen oder neu erzeugen" }
      - { id: beheben, label: "Im Code beheben" }
      - { id: review, label: "Im Review ablehnen" }
    items:
      - { label: "PHPStan wird heute eingeführt, das Projekt hat 300 alte Fehler", target: baseline }
      - { label: "Du hast drei Einträge aus der Baseline abgearbeitet", target: baseline }
      - { label: "Dein neuer Controller hat einen null-Fehler", target: beheben }
      - { label: "Ein Pull Request fügt der Baseline 12 neue Einträge hinzu", target: review }
      - { label: "Nach dem Hochstufen auf das nächste Level kommen 40 Fehler dazu", target: baseline }
    hints:
      - Neuer Code wird nie in die Baseline geschoben.
      - Beim Hochstufen eines Levels ist die Baseline der übliche Weg, um sofort weiterarbeiten zu können.
---
Du übernimmst ein fünf Jahre altes Projekt und startest zum ersten Mal PHPStan auf Level 6: **847 Fehler.**
Alle auf einmal zu beheben, dauert Wochen und blockiert jedes Feature. Gar nichts zu tun, heißt: Jeden Tag
kommen neue Fehler dazu. Die Lösung dazwischen heißt [[phpstan-baseline|Baseline]].

## Die Idee: alt einfrieren, neu blockieren

Eine Baseline ist eine Datei, in der PHPStan alle **heute bekannten** Fehler auflistet. Bei jeder weiteren
Analyse vergleicht PHPStan: Steht der Fehler in der Baseline, wird er ignoriert. Ist er neu, wird er gemeldet.

![Baseline: alte Fehler einfrieren, neue blockieren](/assets/code-qualitaet/baseline.svg)

Damit gilt ab dem ersten Tag eine klare Regel: **Neuer Code ist sauber.** Die Altlasten sind sichtbar
dokumentiert und werden Schritt für Schritt abgebaut – im Rhythmus des Teams, nicht alle auf einmal.

> [!MERKSATZ]
> Eine Baseline ist kein Freifahrtschein, sondern eine **Schuldenliste**. Sie darf nur kürzer werden.

## Die Baseline erzeugen

Du brauchst zwei Schritte. Zuerst erzeugst du die Datei:

```bash title="Terminal"
./vendor/bin/phpstan analyse --generate-baseline
# [OK] Baseline generated with 8 errors.
```

PHPStan schreibt `phpstan-baseline.neon`. Ein Eintrag sieht so aus:

```neon title="phpstan-baseline.neon (Ausschnitt)"
parameters:
	ignoreErrors:
		-
			message: '#^Method App\\Legacy\\OldReport\:\:rows\(\) has no return type specified\.$#'
			identifier: missingType.return
			count: 1
			path: src/Legacy/OldReport.php
```

Dann bindest du sie in deine Konfiguration ein:

```neon title="phpstan.neon"
includes:
    - phpstan-baseline.neon

parameters:
    level: 6
    paths:
        - src
```

Beide Dateien werden committet. Ab jetzt ist die Pipeline grün – bis jemand einen **neuen** Fehler einbaut.

> [!FEHLER]
> Wer `includes:` einträgt, **bevor** die Baseline-Datei existiert, bekommt einen Abbruch, weil die Datei fehlt.
> Erst erzeugen, dann einbinden.

## Behobene Fehler und das Ratschen-Prinzip

Behebst du einen Fehler aus der Baseline, meldet PHPStan:

```text title="Ausgabe"
Ignored error pattern #^Access to an undefined property App\\Legacy\\Mailer\:\:\$recipient\.$#
(property.notFound) in path src/Legacy/Mailer.php was not matched in reported errors.
```

Das klingt erst nach einem Fehler, ist aber Absicht: Die Option `reportUnmatchedIgnoredErrors` ist
standardmäßig an. Sie zwingt dich, die Baseline neu zu erzeugen – und so verschwindet der Eintrag.

Das Ergebnis ist das [[ratschen-prinzip|Ratschen-Prinzip]]: Wie eine Ratsche, die sich nur in eine Richtung
dreht, kann die Zahl der Einträge nur sinken. Jeder behobene Fehler ist dauerhaft weg und kann nicht
unbemerkt zurückkehren.

> [!PRAXIS]
> In vielen Teams gibt es die Pfadfinder-Regel: Wer eine Datei anfasst, behebt dabei ein, zwei
> Baseline-Einträge darin. Im Review prüft man, dass die Baseline-Datei im Diff **nur** Zeilen verliert.

## Level hochstufen mit der Baseline

Dasselbe Werkzeug hilft beim Hochstufen. Ein typischer Weg für ein Altprojekt:

1. Mit einem niedrigen Level beginnen (z. B. 2), bei dem es überschaubar wenige Fehler gibt – Baseline erzeugen.
2. Ein paar Wochen lang Baseline-Einträge abbauen.
3. Level um eins erhöhen, neue Fehler wieder in die Baseline übernehmen.
4. Wiederholen, bis das Ziel-Level erreicht ist.

Bei sehr großen Baselines kannst du sie auch als PHP-Datei erzeugen (`--generate-baseline phpstan-baseline.php`),
das lädt schneller.

| Signal im Review | Bedeutung |
|---|---|
| Baseline verliert Zeilen | Gut – Schulden wurden abgebaut |
| Baseline unverändert | Normal |
| Baseline bekommt neue Zeilen | Nur beim bewussten Hochstufen eines Levels in Ordnung |

## Zusammenfassung

- Eine **Baseline** friert alle heute bekannten Fehler ein; neue Fehler werden weiterhin gemeldet.
- Erzeugen mit `--generate-baseline`, einbinden unter `includes:` – beide Dateien werden committet.
- Behobene Einträge meldet PHPStan als „not matched“; dann erzeugst du die Baseline neu.
- Nach dem **Ratschen-Prinzip** darf die Baseline nur schrumpfen.
- Mit Baseline kannst du auch Level für Level hochstufen, ohne das Team zu blockieren.
