---
title: Legacy-Code sicher ändern
summary: Wie du Code ohne Tests mit Charakterisierungstests und einem Golden Master absicherst, Nahtstellen findest und neue Logik daneben wachsen lässt.
duration: 25
sources:
  - title: Martin Fowler – StranglerFigApplication
    url: https://martinfowler.com/bliki/StranglerFigApplication.html
  - title: PHPUnit – Dokumentation
    url: https://docs.phpunit.de/
  - title: GNU diffutils – diff
    url: https://www.gnu.org/software/diffutils/manual/diffutils.html
quiz:
  - type: single
    question: Was prüft ein Charakterisierungstest?
    options:
      - Ob der Code die Anforderungen aus dem Ticket korrekt umsetzt.
      - Was der Code heute tatsächlich tut – auch wenn das vielleicht falsch ist.
      - Ob der Code schnell genug ist.
      - Ob der Code den Coding-Standard einhält.
    answer: 1
    explanation: Ein Charakterisierungstest hält das aktuelle Verhalten fest. Er ist ein Sicherheitsnetz für den Umbau, kein Urteil darüber, ob das Verhalten richtig ist.
  - type: multiple
    question: Welche Aussagen über einen Golden Master stimmen?
    options:
      - Du speicherst die Ausgabe des Programms für viele Eingaben als freigegebene Referenz.
      - Nach jedem Umbau vergleichst du die neue Ausgabe mit der Referenz.
      - Er funktioniert nur, wenn du den Code vollständig verstehst.
      - Zufallswerte und aktuelle Uhrzeiten in der Ausgabe machen ihn unzuverlässig.
    answers: [0, 1, 3]
    explanation: Ein Golden Master braucht kein Verständnis des Codes – nur reproduzierbare Ausgaben. Wechselnde Werte wie Datum oder Zufall musst du vorher festhalten oder herausfiltern.
  - type: match
    question: Ordne jeder Technik ihre Idee zu.
    pairs:
      - { left: "Charakterisierungstest", right: "Das heutige Verhalten festhalten, bevor du umbaust" }
      - { left: "Naht (Seam)", right: "Eine Stelle, an der du Verhalten austauschen kannst, ohne den Code dort zu ändern" }
      - { left: "Sprout Method", right: "Neue Logik in einer neuen, getesteten Funktion schreiben und nur aufrufen" }
      - { left: "Strangler Fig", right: "Ein altes System Stück für Stück durch ein neues ersetzen" }
    explanation: Alle vier Techniken haben dasselbe Ziel - Änderungen an Code ohne Tests möglichst risikoarm machen.
  - type: find-bug
    question: Dieser Golden-Master-Test schlägt jeden Tag fehl, obwohl niemand den Code ändert. Welche Zeile ist schuld?
    language: php
    code: |
      function bericht(array $umsaetze): string
      {
          $summe = array_sum($umsaetze);
          $kopf = 'Bericht vom ' . date('d.m.Y');
          return $kopf . "\nSumme: " . $summe;
      }
    bug_line: 4
    explanation: Das aktuelle Datum ändert sich täglich, also weicht die Ausgabe immer von der freigegebenen Referenz ab. Lösung - das Datum als Parameter übergeben (eine Naht schaffen) oder für den Test festlegen.
tasks:
  - id: golden-master
    type: terminal
    title: Einen Golden Master für ein Legacy-Skript bauen
    description: |
      Im Ordner `legacy-bonus` liegt ein Git-Repository mit `bin/bonus.php`. Das Skript liest eine CSV-Datei
      (`name,umsatzCent,jahre`) und gibt pro Zeile `name;stufe;bonusCent` aus. Es gibt keine Tests. Bevor
      jemand das Skript umbaut, brauchst du ein Sicherheitsnetz. `tests/golden.sh` ist schon da: Es vergleicht
      die Ausgabe für jede `fixtures/*.csv` mit der Datei `fixtures/*.txt` daneben.

      1. Lies `bin/bonus.php` und finde alle Zweige: Stufen `keine`, `klein`, `gross` und den Zusatz `+senior`.
      2. Lege in `fixtures/` eine oder mehrere CSV-Dateien an, die **jeden** Zweig mindestens einmal auslösen.
      3. Gib die heutige Ausgabe frei: `php bin/bonus.php fixtures/team.csv > fixtures/team.txt` (je CSV-Datei).
      4. Prüfe mit `bash tests/golden.sh`, dass alles grün ist, und committe.

      Die Prüfung baut testweise einen Fehler in eine Kopie des Skripts ein – dein Golden Master muss ihn
      bemerken. Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: legacy-bonus
    setup: |
      git init -q -b main
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      mkdir -p bin tests fixtures
      cat > bin/bonus.php <<'PHP'
      <?php

      $z = file($argv[1], FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
      foreach ($z as $l) {
          [$n, $u, $j] = explode(',', $l);
          if ($u > 5000000) {
              $s = 'gross';
              $b = $u * 0.05;
          } elseif ($u > 1000000) {
              $s = 'klein';
              $b = $u * 0.02;
          } else {
              $s = 'keine';
              $b = 0;
          }
          if ($j >= 10 && $s != 'keine') {
              $b = $b + 50000;
              $s .= '+senior';
          }
          echo $n . ';' . $s . ';' . round($b) . "\n";
      }
      PHP
      cat > tests/golden.sh <<'SH'
      #!/usr/bin/env bash
      # Vergleicht die Ausgabe von bin/bonus.php für jede fixtures/*.csv mit der freigegebenen .txt-Datei.
      set -u
      cd "$(dirname "$0")/.."
      shopt -s nullglob
      dateien=(fixtures/*.csv)
      if [ ${#dateien[@]} -eq 0 ]; then
        echo "ROT   Es gibt noch keine Fixtures in fixtures/*.csv"
        exit 1
      fi
      fehler=0
      for csv in "${dateien[@]}"; do
        erwartet="${csv%.csv}.txt"
        if [ ! -f "$erwartet" ]; then
          echo "ROT   $erwartet fehlt – gib die Ausgabe frei"
          fehler=1
        elif diff -u "$erwartet" <(php bin/bonus.php "$csv"); then
          echo "GRÜN  $csv"
        else
          echo "ROT   $csv"
          fehler=1
        fi
      done
      exit "$fehler"
      SH
      git add -A
      git commit -q -m "chore: import legacy bonus script"
    checks:
      - type: command
        run: bash tests/golden.sh
        message: bash tests/golden.sh ist nicht grün. Gibt es zu jeder CSV-Datei die freigegebene .txt-Datei?
      - type: command
        run: |-
          for teil in ';keine;' ';klein;' ';gross;' 'klein+senior;' 'gross+senior;'; do cat fixtures/*.txt 2>/dev/null | grep -qF -- "$teil" || echo "fehlt: $teil"; done
        stdout_equals: ""
        message: Deine Fixtures decken noch nicht jeden Zweig ab. Du brauchst Zeilen mit den Stufen keine, klein und gross – und klein bzw. gross mit +senior (mindestens 10 Jahre).
      - type: command
        run: |-
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX"); cp -r bin fixtures tests "$d"/; sed -i 's/0\.05/0.06/; s/50000;/40000;/' "$d/bin/bonus.php"; (cd "$d" && bash tests/golden.sh > /dev/null 2>&1); ergebnis=$?; rm -rf "$d"; echo "$ergebnis"
        stdout_matches: "^[1-9][0-9]*$"
        message: Ein absichtlich eingebauter Fehler (anderer Bonussatz) fällt deinem Golden Master nicht auf. Ergänze Fixtures, die diese Zweige treffen.
      - type: command
        run: git status --porcelain
        stdout_equals: ""
        message: Es gibt noch nicht committete Dateien. Committe deine Fixtures mit git add -A und git commit.
    hints:
      - "Der Umsatz steht in Cent: Über 5000000 ist die Stufe `gross`, über 1000000 `klein`, sonst `keine`. Ab 10 Jahren gibt es `+senior` – aber nur mit Bonus."
      - "Eine CSV-Datei für alles reicht, z. B. `printf 'Ada,500000,2\\nGrace,2000000,3\\nLinus,8000000,1\\nMargaret,3000000,12\\nKen,9000000,15\\n' > fixtures/team.csv`."
      - "Danach: `php bin/bonus.php fixtures/team.csv > fixtures/team.txt && bash tests/golden.sh && git add -A && git commit -m \"test: add golden master for bonus script\"`."
    solution: |
      ```bash
      cd legacy-bonus
      cat bin/bonus.php
      printf 'Ada,500000,2\nGrace,2000000,3\nLinus,8000000,1\nMargaret,3000000,12\nKen,9000000,15\n' > fixtures/team.csv
      php bin/bonus.php fixtures/team.csv > fixtures/team.txt
      cat fixtures/team.txt
      bash tests/golden.sh
      git add -A
      git commit -m "test: add golden master for bonus script"
      ```

      Die Ausgabe enthält jetzt alle fünf Varianten: `keine`, `klein`, `gross`, `klein+senior` und
      `gross+senior`. Ab jetzt merkt `tests/golden.sh` jede Verhaltensänderung.
  - id: sprout-entscheidung
    type: steps
    title: Neue Logik in Legacy-Code einbauen
    description: |
      Du sollst in der 400 Zeilen langen Legacy-Methode `Abrechnung::monatsabschluss()` eine neue Regel
      ergänzen: Gutscheine werden vom Betrag abgezogen. Für die Methode gibt es keine Tests.
    steps:
      - situation: Du hast die Methode gelesen und verstehst ungefähr die Hälfte.
        question: Was tust du zuerst?
        options:
          - Die Methode komplett neu schreiben, dann ist sie verständlich.
          - Die heutige Ausgabe mit einigen typischen Eingaben als Charakterisierungstests festhalten.
          - Die Gutschein-Regel direkt mitten in die Methode schreiben und manuell testen.
        answer: 1
        explanation: Erst das Sicherheitsnetz. Ein Neuschreiben ohne Tests verliert fast immer Sonderfälle, die niemand mehr kennt.
      - situation: Die Charakterisierungstests sind grün. Jetzt kommt die Gutschein-Regel.
        question: Wo schreibst du die neue Logik?
        options:
          - In eine neue Funktion `gutscheinAbziehen()`, die du mit eigenen Unit-Tests entwickelst und in der alten Methode nur aufrufst.
          - Als weitere 30 Zeilen in die alte Methode.
          - In eine Kopie der alten Methode, damit nichts kaputtgeht.
        answer: 0
        explanation: Das ist eine Sprout Method - Neues wächst als sauberer, getesteter Trieb neben dem Alten. Die alte Methode bekommt nur eine einzige neue Zeile.
      - situation: "Alles ist grün. Beim Lesen fällt dir auf: Die alte Methode rundet an einer Stelle falsch."
        question: Was machst du mit diesem Fund?
        options:
          - Sofort im selben Commit mitkorrigieren.
          - Den Fehler notieren und separat klären – er ändert Verhalten und ist eine eigene Entscheidung.
          - Den Charakterisierungstest an das falsche Verhalten anpassen und vergessen.
        answer: 1
        explanation: Der Test hält das falsche Verhalten bewusst fest. Ob es korrigiert wird, ist eine fachliche Entscheidung – die gehört in ein eigenes Ticket und einen eigenen `fix:`-Commit.
---
Jedes Projekt hat sie: die Klasse, an die sich niemand herantraut. Keine Tests, 900 Zeilen, geschrieben
von jemandem, der längst weg ist. Und genau dort sollst du jetzt eine neue Regel einbauen. Diese Lektion
zeigt dir, wie du [[legacy-code|Legacy-Code]] änderst, ohne zu beten.

## Das Dilemma von Legacy-Code

Eine verbreitete Definition sagt: Legacy-Code ist Code **ohne Tests**. Er kann gestern geschrieben sein –
wenn ihn kein Test absichert, kannst du ihn nicht sicher ändern.

Das führt zu einem Dilemma:

- Um Code sicher umzubauen, brauchst du Tests.
- Um Tests zu schreiben, musst du den Code oft erst umbauen (etwa weil er direkt die Datenbank oder die
  Uhrzeit benutzt).

Der Ausweg: Du schreibst zuerst Tests, die den Code **von außen** betrachten, ohne ihn zu verändern. Erst
wenn dieses grobe Netz hängt, baust du in kleinen Schritten um und ergänzst feinere Tests.

> [!MERKSATZ]
> Bei Legacy-Code ist die Reihenfolge immer: erst absichern, dann ändern. Nie umgekehrt.

## Charakterisierungstests

Ein [[charakterisierungstest|Charakterisierungstest]] beschreibt nicht, was der Code tun **soll**, sondern
was er heute **tut**. Du rufst ihn mit einer Eingabe auf, schaust dir das Ergebnis an und schreibst genau
dieses Ergebnis in den Test.

```php
public function test_bonus_fuer_grossen_umsatz(): void
{
    // Ergebnis einmal ausgeführt und abgeschrieben – nicht nachgerechnet
    $this->assertSame('Linus;gross;400000', berechneBonuszeile('Linus', 8000000, 1));
}
```

Merkwürdige Ergebnisse hältst du ebenfalls fest. Vielleicht ist es ein Fehler, vielleicht verlässt sich
ein anderes System genau darauf. Das klärst du später – getrennt vom Umbau.

## Der Golden Master

Wenn ein Programm viel Text ausgibt, ist ein [[golden-master|Golden Master]] die schnellste Absicherung:

1. Sammle Eingaben, die möglichst **alle Zweige** des Codes durchlaufen.
2. Führe das Programm aus und speichere die Ausgaben als freigegebene Referenz.
3. Nach jedem Umbau vergleichst du die neue Ausgabe mit der Referenz – zum Beispiel mit `diff`.

```bash title="Golden Master in drei Zeilen"
php bin/bonus.php fixtures/team.csv > fixtures/team.txt       # einmal freigeben
# … umbauen …
diff -u fixtures/team.txt <(php bin/bonus.php fixtures/team.csv)  # vergleichen
```

Welche Eingaben brauchst du? Lies den Code und suche jedes `if`. Jeder Zweig braucht mindestens eine
Eingabe, die ihn auslöst – plus die Grenzen dazwischen ([[grenzwertanalyse|Grenzwertanalyse]]).

> [!FEHLER]
> **Wechselnde Ausgaben.** Steht in der Ausgabe das aktuelle Datum, eine Zufallszahl oder eine
> Laufzeit, ist der Golden Master jeden Tag rot. Mach diese Werte steuerbar oder filtere sie heraus,
> bevor du die Referenz freigibst.

## Nahtstellen finden

Manchmal kannst du Code nicht testen, weil er etwas Unberechenbares direkt benutzt: die Uhrzeit, eine
Datenbank, einen Mailversand. Dann suchst du eine [[naht|Naht]] – eine Stelle, an der du dieses Verhalten
von außen austauschen kannst, ohne die Logik drumherum zu ändern.

```php
// vorher: date() steckt fest im Code
function bericht(array $umsaetze): string
{
    return 'Bericht vom ' . date('d.m.Y') . "\nSumme: " . array_sum($umsaetze);
}

// nachher: das Datum kommt von außen – mit Standardwert, damit alte Aufrufe weiter funktionieren
function bericht(array $umsaetze, ?DateTimeImmutable $stichtag = null): string
{
    $stichtag ??= new DateTimeImmutable();

    return 'Bericht vom ' . $stichtag->format('d.m.Y') . "\nSumme: " . array_sum($umsaetze);
}
```

Der optionale Parameter ist ein winziger, sicherer Umbau – und ab jetzt kann ein Test ein festes Datum
übergeben. Im Modul zu SOLID wirst du sehen, dass [[dependency-injection|Dependency Injection]] genau
solche Nähte im großen Stil schafft.

## Neues daneben wachsen lassen

Musst du neue Logik in eine riesige Methode einbauen, schreib sie **nicht** mitten hinein. Nutze eine
[[sprout-methode|Sprout Method]]: Die neue Logik entsteht als eigene, kleine Funktion mit eigenen Tests.
In der alten Methode ergänzt du nur einen einzigen Aufruf.

```php
$betrag = gutscheinAbziehen($betrag, $gutscheine); // einzige neue Zeile in der alten Methode
```

So wächst sauberer, getesteter Code in den alten hinein. Im Großen funktioniert das genauso: Beim
[[strangler-fig|Strangler-Fig-Muster]] ersetzt ein neues System das alte Funktion für Funktion, bis das alte
abgeschaltet werden kann.

> [!PRAXIS]
> In großen Projekten werden Legacy-Umbauten oft über viele kleine Pull Requests verteilt: zuerst nur die
> Golden-Master-Tests, dann ein Refactoring nach dem anderen. Jeder einzelne PR ist klein genug, um ihn
> gründlich zu prüfen.

## Zusammenfassung

- Legacy-Code ist Code ohne Tests – erst absichern, dann ändern.
- Charakterisierungstests halten das heutige Verhalten fest, auch wenn es seltsam wirkt.
- Ein Golden Master vergleicht die Ausgabe vieler Eingaben mit einer freigegebenen Referenz.
- Die Eingaben müssen jeden Zweig treffen; wechselnde Werte wie Datum machen den Vergleich unbrauchbar.
- Eine Naht macht Unberechenbares wie Uhrzeit oder Datenbank von außen austauschbar.
- Neue Logik wächst als Sprout Method daneben; ganze Systeme werden nach dem Strangler-Fig-Muster ersetzt.
