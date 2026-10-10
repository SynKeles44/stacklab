---
title: Pipeline-Stufen und schnelles Scheitern
summary: Aus welchen Stufen eine Pipeline besteht, warum sie beim ersten Fehler stoppt und wie du sie als Skript baust, das lokal und in CI gleich läuft.
duration: 22
sources:
  - title: GNU Bash Manual – The Set Builtin
    url: https://www.gnu.org/software/bash/manual/html_node/The-Set-Builtin.html
  - title: GitHub Docs – Building and testing PHP
    url: https://docs.github.com/en/actions/tutorials/build-and-test-code/php
  - title: Composer – Scripts
    url: https://getcomposer.org/doc/articles/scripts.md
quiz:
  - type: single
    question: Warum steht der Linter in der Pipeline vor den Tests?
    options:
      - Weil Linter grundsätzlich wichtiger sind als Tests.
      - Weil er in Sekunden scheitert und eine lange Testsuite unnötig wäre, wenn schon die Syntax kaputt ist.
      - Weil Tests ohne Linter nicht starten können.
      - Die Reihenfolge ist egal.
    answer: 1
    explanation: >
      Fail fast: Schnelle, billige Prüfungen kommen zuerst. Scheitern sie, spart die Pipeline die Zeit für
      alles Teure danach.
  - type: find-bug
    question: Dieses CI-Skript meldet immer Erfolg, selbst wenn Tests fehlschlagen. In welcher Zeile steckt der Fehler?
    language: bash
    code: |
      #!/usr/bin/env bash
      set -euo pipefail
      echo "==> Lint"
      ./vendor/bin/pint --test
      echo "==> Test"
      ./vendor/bin/pest || true
      echo "==> Build"
      npm run build
    bug_line: 6
    explanation: >
      `|| true` schluckt den Exit-Code. Der Test kann scheitern, das Skript läuft trotzdem weiter und endet mit 0 –
      die Pipeline wäre grün, obwohl Tests rot sind.
  - type: cloze
    text: Mit `set -___` bricht Bash beim ersten fehlgeschlagenen Befehl ab. Ein Programm meldet Erfolg mit dem Exit-Code ___.
    blanks:
      - [e, euo, euo pipefail]
      - ["0"]
    explanation: >
      `set -e` beendet das Skript, sobald ein Befehl einen Exit-Code ungleich 0 liefert. 0 bedeutet Erfolg,
      alles andere Fehler.
  - type: multiple
    question: Welche Aussagen über Pipeline-Stufen stimmen?
    options:
      - Jede Stufe liefert über ihren Exit-Code ein klares Ja oder Nein.
      - Die Befehle der Pipeline sollten auch lokal ausführbar sein.
      - Je mehr Logik direkt in der CI-YAML steht, desto besser.
      - Ein Quality Gate lässt nur durch, was alle Prüfungen besteht.
    answers: [0, 1, 3]
    explanation: >
      Logik gehört in Skripte oder composer/npm-Scripts, die du lokal genauso startest. Die CI-Datei ruft sie nur auf.
tasks:
  - id: stufen-ordnen
    type: order
    title: Bring die Stufen in eine sinnvolle Reihenfolge
    description: >
      Eine Pipeline für eine Laravel-App. Ordne die Stufen so, dass billige Prüfungen zuerst kommen und
      nur Geprüftes ausgeliefert wird.
    items:
      - Code auschecken
      - Abhängigkeiten installieren (composer install)
      - Code-Stil prüfen (pint --test)
      - Statische Analyse (phpstan)
      - Tests ausführen (pest)
      - Build-Artefakt erzeugen
      - Auf Staging ausliefern
    hints:
      - Ohne Code und Abhängigkeiten läuft gar nichts. Die Auslieferung kommt ganz zum Schluss.
      - Stil-Prüfung ist schneller als statische Analyse, beides ist schneller als die Tests.
  - id: ci-skript
    type: terminal
    title: Schreib ein CI-Skript, das schnell scheitert
    description: |
      Im Ordner `ci-skript` liegt eine Mini-PHP-Bibliothek: `src/Price.php` und ein Test in `tests/run.php`
      (er endet mit Exit-Code 1, wenn eine Prüfung scheitert).

      1. Lege das Skript `ci.sh` an. Erste Zeile: `#!/usr/bin/env bash`, zweite: `set -euo pipefail`.
      2. Stufe **Lint**: Gib `==> Lint` aus und prüfe jede PHP-Datei in `src` und `tests` mit `php -l`.
      3. Stufe **Test**: Gib `==> Test` aus und führe `php tests/run.php` aus.
      4. Mach das Skript ausführbar und starte es mit `./ci.sh` – es muss grün durchlaufen.

      Stacklab prüft auch, dass dein Skript bei einem Syntaxfehler **vor** der Test-Stufe abbricht und bei
      einem fehlschlagenden Test mit einem Fehler-Code endet.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: ci-skript
    setup: |
      mkdir -p src tests
      cat > src/Price.php <<'EOF'
      <?php

      declare(strict_types=1);

      function grossCents(int $netCents): int
      {
          return intdiv($netCents * 119, 100);
      }
      EOF
      cat > tests/run.php <<'EOF'
      <?php

      declare(strict_types=1);

      require __DIR__ . '/../src/Price.php';

      $failed = 0;
      $check = function (string $name, bool $ok) use (&$failed): void {
          echo ($ok ? 'ok   ' : 'FAIL ') . $name . PHP_EOL;
          $failed += $ok ? 0 : 1;
      };

      $check('1000 Cent netto ergeben 1190 Cent brutto', grossCents(1000) === 1190);
      $check('0 bleibt 0', grossCents(0) === 0);

      exit($failed === 0 ? 0 : 1);
      EOF
    checks:
      - type: file_exists
        path: ci.sh
        message: Es gibt noch keine Datei ci.sh.
      - type: command
        run: test -x ci.sh
        message: ci.sh ist nicht ausführbar – nutze chmod +x ci.sh.
      - type: file_contains
        path: ci.sh
        pattern: "^set -euo pipefail"
        message: In ci.sh fehlt die Zeile set -euo pipefail.
      - type: command
        run: ./ci.sh
        message: ./ci.sh endet mit einem Fehler – auf dem unveränderten Code muss es grün sein.
      - type: command
        run: ./ci.sh 2>&1 | tr '\n' ' '
        stdout_matches: "==> Lint.*==> Test"
        message: Das Skript soll erst "==> Lint" und danach "==> Test" ausgeben.
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX"); cp -r src tests ci.sh "$d"/
          (cd "$d" && printf '<?php\nfunction kaputt( {\n' > src/Kaputt.php && ./ci.sh > out.txt 2>&1); rc=$?
          grep -q "==> Test" "$d/out.txt"; ran=$?
          rm -rf "$d"; [ "$rc" -ne 0 ] && [ "$ran" -ne 0 ]
        message: Bei einem Syntaxfehler muss ci.sh schon in der Lint-Stufe abbrechen – die Test-Stufe darf gar nicht starten.
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX"); cp -r src tests ci.sh "$d"/
          (cd "$d" && sed -i 's/119/100/' src/Price.php && ./ci.sh > out.txt 2>&1); rc=$?
          rm -rf "$d"; [ "$rc" -ne 0 ]
        message: Wenn ein Test scheitert, muss ci.sh mit einem Exit-Code ungleich 0 enden. Schluckst du den Fehler irgendwo?
    hints:
      - "Gerüst: `printf '#!/usr/bin/env bash\\nset -euo pipefail\\n' > ci.sh`, dann mit nano weiterschreiben."
      - "Alle Dateien linten: `for f in src/*.php tests/*.php; do php -l \"$f\"; done` – dank `set -e` bricht die Schleife beim ersten Fehler ab."
      - "Zum Schluss `chmod +x ci.sh` und `./ci.sh; echo \"Exit: $?\"`."
    solution: |
      ```bash
      cd ci-skript
      cat > ci.sh <<'EOF'
      #!/usr/bin/env bash
      set -euo pipefail

      echo "==> Lint"
      for f in src/*.php tests/*.php; do
        php -l "$f" > /dev/null
      done

      echo "==> Test"
      php tests/run.php
      EOF
      chmod +x ci.sh
      ./ci.sh
      ```
---

Eine Pipeline ist kein einzelner großer Befehl, sondern eine Reihe von Stufen – wie eine Qualitätskontrolle
am Fließband. Jede Station prüft etwas anderes, und ein fehlerhaftes Teil fliegt sofort raus, statt bis zum
Versand weiterzulaufen. In dieser Lektion baust du so ein Fließband selbst.

## Die typischen Stufen

Fast jede [[ci-pipeline|Pipeline]] besteht aus denselben [[pipeline-stufe|Stufen]]:

| Stufe | Beispiel (Laravel) | Frage |
|---|---|---|
| Vorbereiten | Checkout, `composer install` | Ist alles da? |
| Stil | `vendor/bin/pint --test` | Hält sich der Code an die Regeln? |
| Analyse | `vendor/bin/phpstan analyse` | Gibt es Typfehler? |
| Test | `vendor/bin/pest` | Verhält sich der Code richtig? |
| Build | Assets bauen, Paket schnüren | Lässt er sich ausliefern? |
| Deploy | auf Staging oder Produktion | Läuft er dort? |

Jede Stufe antwortet mit dem [[exit-code|Exit-Code]] ihres Befehls: `0` heißt bestanden, alles andere
heißt durchgefallen. Mehr muss eine Pipeline nicht verstehen.

> [!MERKSATZ]
> Eine Stufe ist ein Befehl mit einem Exit-Code. 0 = weiter, alles andere = Stopp.

## Fail fast: billig zuerst

Die Reihenfolge ist nicht zufällig. Das Prinzip [[fail-fast|Fail fast]] sagt: Prüfungen, die schnell und
billig sind, laufen zuerst. Ein Stil-Check dauert Sekunden, eine Testsuite vielleicht zehn Minuten. Ist
schon die Syntax kaputt, wären die zehn Minuten verschwendet.

Daraus folgen zwei Regeln:

1. **Beim ersten Fehler stoppen.** Eine rote Stufe beendet die Pipeline.
2. **Nichts Ungeprüftes ausliefern.** Deploy-Stufen laufen nur, wenn alles davor grün war.

Zusammen bilden die Prüfungen ein [[quality-gate|Quality Gate]]: ein Tor, durch das nur Code kommt, der
alle Bedingungen erfüllt – zum Beispiel „Tests grün, keine PHPStan-Fehler, Stil sauber“.

## Ein CI-Skript in Bash

Die Logik deiner Pipeline gehört in ein [[skript|Skript]], nicht in eine Klickoberfläche. So läuft
lokal **genau dasselbe** wie auf dem CI-Server.

```bash title="ci.sh"
#!/usr/bin/env bash
set -euo pipefail

echo "==> Lint"
vendor/bin/pint --test

echo "==> Analyse"
vendor/bin/phpstan analyse --no-progress

echo "==> Test"
vendor/bin/pest
```

Die zweite Zeile ist entscheidend:

| Option | Wirkung |
|---|---|
| `-e` | bricht ab, sobald ein Befehl scheitert |
| `-u` | bricht ab, wenn eine Variable nicht gesetzt ist |
| `-o pipefail` | eine Pipe scheitert, wenn **irgendein** Teil scheitert, nicht nur der letzte |

> [!FEHLER]
> **Fehler verschlucken.** `pest || true` oder ein vergessenes `set -e` lassen das Skript weiterlaufen –
> es endet mit `0`, und die Pipeline ist grün, obwohl Tests rot sind. Teste dein Skript deshalb auch einmal
> absichtlich mit kaputtem Code.

## Lokal wie in CI

Ein Skript, das nur in CI funktioniert, ist schwer zu debuggen. Deshalb gilt: Die CI-Konfiguration ruft
nur auf, was du auch lokal starten kannst.

```json title="composer.json (Ausschnitt)"
{
    "scripts": {
        "ci": [
            "pint --test",
            "phpstan analyse --no-progress",
            "pest"
        ]
    }
}
```

Mit `composer ci` läuft lokal die gleiche Prüfung wie auf dem Server. Bei JavaScript-Projekten
übernehmen [[npm-script|npm-Scripts]] diese Rolle (`npm run ci`).

> [!PRAXIS]
> In großen Projekten laufen Stil, Analyse und Tests als **getrennte Jobs** parallel – das Ergebnis kommt
> schneller, und im Pull Request siehst du sofort, welche Prüfung rot ist. Wie das in GitHub Actions
> aussieht, lernst du im nächsten Modul.

## Zusammenfassung

- Eine Pipeline besteht aus Stufen: vorbereiten, Stil, Analyse, Test, Build, Deploy.
- Jede Stufe antwortet mit ihrem Exit-Code: 0 = weiter, sonst Stopp.
- **Fail fast**: billige Prüfungen zuerst, beim ersten Fehler abbrechen.
- `set -euo pipefail` macht Bash-Skripte streng – `|| true` hebelt das aus.
- Pipeline-Logik gehört in Skripte oder composer/npm-Scripts, die lokal genauso laufen.
