---
title: Refactoring in kleinen, sicheren Schritten
summary: Was Refactoring wirklich ist, warum Tests die Voraussetzung sind und wie du mit winzigen Schritten und häufigen Commits umbaust, ohne etwas kaputt zu machen.
duration: 25
sources:
  - title: Refactoring-Katalog von Martin Fowler
    url: https://refactoring.com/catalog/
  - title: Martin Fowler – Definition Refactoring
    url: https://martinfowler.com/bliki/DefinitionOfRefactoring.html
  - title: PhpStorm – Refactoring source code
    url: https://www.jetbrains.com/help/phpstorm/refactoring-source-code.html
  - title: Pro Git – Änderungen aufzeichnen
    url: https://git-scm.com/book/de/v2/Git-Grundlagen-%C3%84nderungen-nachverfolgen-und-im-Repository-speichern
quiz:
  - type: single
    question: Was unterscheidet ein Refactoring von einer Fehlerbehebung?
    options:
      - Ein Refactoring ändert die Struktur, aber nicht das beobachtbare Verhalten.
      - Ein Refactoring macht den Code immer schneller.
      - Ein Refactoring darf nur von erfahrenen Entwickler:innen gemacht werden.
      - Es gibt keinen Unterschied.
    answer: 0
    explanation: Beim Refactoring bleibt das Verhalten gleich – nur der Aufbau wird besser. Eine Fehlerbehebung ändert dagegen absichtlich das Verhalten.
  - type: multiple
    question: Woran erkennst du einen guten Refactoring-Schritt?
    options:
      - Er ist so klein, dass du ihn in wenigen Minuten machst.
      - Nach dem Schritt laufen die Tests wieder grün.
      - Er ändert gleichzeitig Struktur und Verhalten, damit man nur einmal testen muss.
      - Du kannst ihn mit einem eigenen Commit sichern.
    answers: [0, 1, 3]
    explanation: Kleine Schritte, grüne Tests, häufige Commits. Struktur und Verhalten gleichzeitig zu ändern, ist genau das, was du vermeiden willst – dann weißt du bei roten Tests nicht mehr, woran es lag.
  - type: cloze
    text: Ein Refactoring ändert die innere ___ von Code, aber nicht sein ___. Damit du das sicher weißt, brauchst du ___.
    blanks:
      - [Struktur]
      - [Verhalten]
      - [Tests, automatisierte Tests]
    explanation: Ohne Tests ist ein Umbau ein Glücksspiel. Mit Tests merkst du sofort, wenn sich das Verhalten doch verändert hat.
  - type: find-bug
    question: Dieser Ablauf wurde als „Refactoring“ committet. In welcher Zeile wird die Regel gebrochen?
    language: bash
    code: |
      bash tests/run.sh
      # formatiereBetrag() aus rechnungErstellen() herausgezogen
      # außerdem: Versand ab 40 statt 50 Euro kostenlos
      bash tests/run.sh
      git commit -am "refactor: extract formatiereBetrag"
    bug_line: 3
    explanation: Die geänderte Versandgrenze ist eine Verhaltensänderung. Sie gehört in einen eigenen Commit vom Typ `feat` oder `fix` – nicht in ein Refactoring.
tasks:
  - id: zyklus-ordnen
    type: order
    title: Der Refactoring-Zyklus
    description: Bringe die Schritte eines sicheren Refactorings in die richtige Reihenfolge.
    items:
      - Tests starten und prüfen, dass alles grün ist
      - Einen einzigen kleinen Umbau machen (z. B. eine Funktion herausziehen)
      - Tests erneut starten
      - Bei Grün committen, bei Rot den Schritt rückgängig machen
      - Mit dem nächsten kleinen Umbau weitermachen
    hints:
      - Bevor du irgendetwas änderst, willst du wissen, dass der Ausgangszustand in Ordnung ist.
  - id: extract-function
    type: terminal
    title: Zwei Funktionen herausziehen – mit zwei Commits
    description: |
      Im Ordner `kleine-schritte` liegt ein Git-Repository mit `src/warenkorb.php`. Die Funktion
      `zusammenfassung()` berechnet Warenwert, Versand und Gesamtbetrag und formatiert alles – dreimal mit
      derselben `number_format`-Zeile. Tests liegen in `tests/test.php`.

      1. Starte die Tests: `php tests/test.php` – alles ist grün.
      2. Zieh die Formatierung in `formatiereEuro(int $cent): string` heraus (z. B. `123456` →
         `1.234,56 EUR`) und nutze sie dreimal. Tests starten, dann committen mit einer Nachricht, die mit
         `refactor:` beginnt.
      3. Zieh die Schleife in `summeInCent(array $positionen): int` heraus. Tests starten, committen – wieder
         mit `refactor:`.

      Am Ende soll `number_format` nur noch einmal vorkommen, und es gibt zwei neue Commits.
      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: kleine-schritte
    setup: |
      git init -q -b main
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      mkdir -p src tests
      cat > src/warenkorb.php <<'PHP'
      <?php

      declare(strict_types=1);

      function zusammenfassung(array $positionen): string
      {
          $summe = 0;
          foreach ($positionen as $position) {
              $summe += $position['preisCent'] * $position['menge'];
          }
          $versand = $summe >= 5000 ? 0 : 490;

          return 'Waren:   ' . number_format($summe / 100, 2, ',', '.') . " EUR\n"
              . 'Versand: ' . number_format($versand / 100, 2, ',', '.') . " EUR\n"
              . 'Gesamt:  ' . number_format(($summe + $versand) / 100, 2, ',', '.') . " EUR\n";
      }
      PHP
      cat > tests/test.php <<'PHP'
      <?php

      declare(strict_types=1);

      require __DIR__ . '/../src/warenkorb.php';

      $faelle = [
          'kleiner Einkauf' => [[['preisCent' => 350, 'menge' => 2], ['preisCent' => 280, 'menge' => 1]], "Waren:   9,80 EUR\nVersand: 4,90 EUR\nGesamt:  14,70 EUR\n"],
          'versandkostenfrei' => [[['preisCent' => 125000, 'menge' => 1]], "Waren:   1.250,00 EUR\nVersand: 0,00 EUR\nGesamt:  1.250,00 EUR\n"],
          'leerer Warenkorb' => [[], "Waren:   0,00 EUR\nVersand: 4,90 EUR\nGesamt:  4,90 EUR\n"],
      ];
      $rot = 0;
      foreach ($faelle as $name => [$positionen, $erwartet]) {
          $ist = zusammenfassung($positionen);
          echo ($ist === $erwartet ? 'GRÜN  ' : 'ROT   ') . $name . "\n";
          $rot += $ist === $erwartet ? 0 : 1;
      }
      exit($rot === 0 ? 0 : 1);
      PHP
      git add -A
      git commit -q -m "feat: add cart summary"
    checks:
      - type: command
        run: php tests/test.php
        message: Die Tests sind rot – ein Umbau hat das Verhalten verändert. Vergleiche die Ausgabe von php tests/test.php.
      - type: command
        run: |-
          php -r 'require "src/warenkorb.php"; echo formatiereEuro(123456), "|", formatiereEuro(5), "|", summeInCent([["preisCent" => 350, "menge" => 2], ["preisCent" => 280, "menge" => 1]]), "|", summeInCent([]);'
        stdout_equals: "1.234,56 EUR|0,05 EUR|980|0"
        message: formatiereEuro(int $cent) oder summeInCent(array $positionen) fehlt oder liefert ein falsches Ergebnis.
      - type: command
        run: grep -c 'number_format' src/warenkorb.php || true
        stdout_equals: "1"
        message: number_format soll nur noch einmal vorkommen – in formatiereEuro().
      - type: command
        run: git log --format=%s | grep -c '^refactor' || true
        stdout_matches: "^\\s*([2-9]|[1-9][0-9]+)\\s*$"
        message: Es fehlen Commits – mach für jede herausgezogene Funktion einen eigenen Commit, dessen Nachricht mit refactor beginnt.
      - type: command
        run: git status --porcelain
        stdout_equals: ""
        message: Es gibt noch nicht committete Änderungen. Committe deinen letzten Schritt.
    hints:
      - "Schritt 2: `function formatiereEuro(int $cent): string { return number_format($cent / 100, 2, ',', '.') . ' EUR'; }` – im return dann z. B. `'Waren:   ' . formatiereEuro($summe) . \"\\n\"`."
      - "Nach jedem Schritt: `php tests/test.php && git commit -am \"refactor: extract formatiereEuro\"`."
      - "Schritt 3: Die Schleife wandert in `summeInCent`, in `zusammenfassung` steht nur noch `$summe = summeInCent($positionen);`."
    solution: |
      ```php title="src/warenkorb.php"
      <?php

      declare(strict_types=1);

      function formatiereEuro(int $cent): string
      {
          return number_format($cent / 100, 2, ',', '.') . ' EUR';
      }

      function summeInCent(array $positionen): int
      {
          $summe = 0;
          foreach ($positionen as $position) {
              $summe += $position['preisCent'] * $position['menge'];
          }

          return $summe;
      }

      function zusammenfassung(array $positionen): string
      {
          $summe = summeInCent($positionen);
          $versand = $summe >= 5000 ? 0 : 490;

          return 'Waren:   ' . formatiereEuro($summe) . "\n"
              . 'Versand: ' . formatiereEuro($versand) . "\n"
              . 'Gesamt:  ' . formatiereEuro($summe + $versand) . "\n";
      }
      ```

      Dazwischen und danach:

      ```bash
      php tests/test.php
      git commit -am "refactor: extract formatiereEuro"
      # … zweiter Umbau …
      php tests/test.php
      git commit -am "refactor: extract summeInCent"
      ```
---
„Ich refactore mal eben den Checkout“ – drei Tage später ist der Branch 2000 Zeilen groß, nichts läuft, und
niemand weiß mehr, welche Änderung welchen Fehler verursacht hat. Das war kein Refactoring, sondern ein
Umbau ohne Netz. Echtes Refactoring sieht ganz anders aus: viele winzige Schritte, nach jedem ist alles
grün.

## Was Refactoring wirklich bedeutet

[[refactoring|Refactoring]] heißt: Du verbesserst die **Struktur** von Code, ohne sein **Verhalten** zu
ändern. Wer die Software benutzt, merkt davon nichts – wer den Code liest, sehr viel.

| Ist ein Refactoring | Ist kein Refactoring |
|---|---|
| Variable umbenennen | Einen Fehler beheben |
| Funktion herausziehen | Eine neue Funktion für Kund:innen bauen |
| Duplikat zusammenführen | Eine Grenze von 50 auf 40 Euro ändern |
| Bedingung vereinfachen | Die Ausgabe umformulieren |

Beides ist wichtig – aber nie **gleichzeitig**. Wer Struktur und Verhalten im selben Schritt ändert, kann
bei einem roten Test nicht mehr sagen, welche der beiden Änderungen schuld ist.

> [!MERKSATZ]
> Trag immer nur einen Hut: Entweder du baust um (Verhalten bleibt gleich) oder du änderst Verhalten
> (Struktur bleibt gleich). Wechsle den Hut erst nach einem grünen Commit.

## Tests sind das Sicherheitsnetz

Woher weißt du, dass sich das Verhalten nicht geändert hat? Durch [[automatisierter-test|automatisierte
Tests]]. Sie beschreiben, was der Code tun soll, und prüfen es in Sekunden.

Der Ablauf ist deshalb immer derselbe:

![Der Refactoring-Zyklus: Tests grün, kleiner Schritt, Tests, Commit](/assets/clean-code-solid-patterns/refactoring-zyklus.svg)

1. Tests starten – sie müssen **vorher** grün sein. Sonst weißt du nicht, ob du etwas kaputt gemacht hast.
2. **Einen** kleinen Schritt machen.
3. Tests starten.
4. Grün? Committen. Rot? Den Schritt rückgängig machen (`git restore .`) und kleiner versuchen.

Das Rückgängigmachen ist kein Scheitern, sondern der Trick: Ein Schritt von fünf Minuten ist billig
wegzuwerfen. Eine Stunde Fehlersuche nicht.

## Die wichtigsten Refactorings

Viele Umbauten haben feste Namen. Diese fünf brauchst du ständig:

| Refactoring | Was du tust |
|---|---|
| Rename | Variable, Funktion oder Klasse umbenennen – überall gleichzeitig |
| [[extract-function|Extract Function]] | Einen Codeblock in eine eigene, benannte Funktion ziehen |
| Inline Function | Eine überflüssige Mini-Funktion wieder einsetzen |
| Introduce Parameter Object | Mehrere zusammengehörende Parameter zu einem Objekt bündeln |
| Replace Conditional with Polymorphism | Ein `switch` über Typen durch Klassen mit gleicher Methode ersetzen |

So sieht Extract Function in kleinen Schritten aus:

```php
// 1. Neue Funktion anlegen, Block hineinkopieren
function formatiereEuro(int $cent): string
{
    return number_format($cent / 100, 2, ',', '.') . ' EUR';
}

// 2. Eine Stelle ersetzen – Tests – grün
// 3. Die nächste Stelle ersetzen – Tests – grün
// 4. Commit: "refactor: extract formatiereEuro"
```

> [!TIPP]
> Deine [[ide|IDE]] kann viele dieser Refactorings automatisch: In PhpStorm markierst du Code und drückst
> „Refactor This“. Das Werkzeug findet auch Aufrufe, die du übersehen würdest.

## Commits als Rettungsleine

Jeder grüne Schritt bekommt einen eigenen [[commit|Commit]]. Das hat drei Vorteile:

- **Rückweg:** Geht der nächste Schritt schief, springst du mit `git restore .` zum letzten grünen Stand.
- **Review:** Fünf kleine Commits wie „refactor: extract formatiereEuro“ sind leichter zu prüfen als ein
  riesiger Diff.
- **Trennung:** Refactoring-Commits (`refactor:`) und Verhaltensänderungen (`feat:`, `fix:`) liegen
  sauber getrennt.

```bash
php tests/test.php && git commit -am "refactor: extract summeInCent"
```

> [!FEHLER]
> **Refactoring ohne Tests „weil es ja nur eine Kleinigkeit ist“.** Gerade kleine Umbauten wie ein
> umbenannter Array-Schlüssel brechen gern an einer Stelle, an die niemand gedacht hat. Ohne Test merkst
> du das erst in Produktion.

> [!PRAXIS]
> Viele Teams folgen der Pfadfinderregel: Hinterlasse den Code etwas besser, als du ihn vorgefunden hast.
> Du baust also nicht alles um, sondern räumst genau dort auf, wo du ohnehin arbeitest – in einem
> separaten `refactor:`-Commit vor deiner eigentlichen Änderung.

## Zusammenfassung

- Refactoring verbessert die Struktur, ohne das Verhalten zu ändern.
- Struktur und Verhalten änderst du nie im selben Schritt.
- Tests müssen vorher **und** nach jedem Schritt grün sein.
- Kleine Schritte, die schiefgehen, wirfst du einfach weg und versuchst es kleiner.
- Benannte Refactorings wie Rename und Extract Function bilden ein gemeinsames Vokabular im Team.
- Jeder grüne Schritt bekommt einen eigenen `refactor:`-Commit.
