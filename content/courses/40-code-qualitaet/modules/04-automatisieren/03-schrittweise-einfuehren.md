---
title: Werkzeuge schrittweise einführen
summary: Wie du Qualitätswerkzeuge in ein gewachsenes Projekt bringst, ohne das Team zu blockieren – mit einem Aufräum-Commit, .git-blame-ignore-revs, Prüfungen nur für geänderte Dateien, Baselines und dem Ratschen-Prinzip.
duration: 20
sources:
  - title: Git – git blame (--ignore-revs-file)
    url: https://git-scm.com/docs/git-blame
  - title: GitHub – Ignore commits in the blame view
    url: https://docs.github.com/de/repositories/working-with-files/using-files/viewing-and-understanding-files#ignore-commits-in-the-blame-view
  - title: PHPStan – The Baseline
    url: https://phpstan.org/user-guide/baseline
  - title: Biome – CLI (--changed, --staged)
    url: https://biomejs.dev/reference/cli/
  - title: Rector – Levels
    url: https://getrector.com/documentation/levels
quiz:
  - type: single
    question: Warum formatiert man ein Altprojekt in einem eigenen, reinen Formatierungs-Commit?
    options:
      - Damit dieser Commit keine echten Änderungen versteckt und in git blame gezielt ausgeblendet werden kann.
      - Weil Pint nur ganze Projekte auf einmal formatieren kann.
      - Damit die Tests schneller laufen.
      - Weil Git sonst die Dateien nicht speichert.
    answer: 0
    explanation: Ein Commit, der nur formatiert, ist leicht zu prüfen. Seine ID kommt in `.git-blame-ignore-revs`, damit `git blame` weiter die eigentlichen Autoren zeigt.
  - type: multiple
    question: Welche Werkzeuge haben eine Möglichkeit, alte Fehler einzufrieren oder nur Geändertes zu prüfen?
    options:
      - "PHPStan mit einer Baseline"
      - "Pint mit --dirty oder --diff=main"
      - "Biome mit --changed oder --staged"
      - "EditorConfig mit --baseline"
    answers: [0, 1, 2]
    explanation: EditorConfig hat keine Befehle – es wirkt nur im Editor. Die anderen drei bieten Wege, nur Neues zu prüfen.
  - type: cloze
    text: "Damit `git blame` die Datei `.git-blame-ignore-revs` nutzt, setzt du `git config blame.___ .git-blame-ignore-revs`."
    blanks:
      - [ignoreRevsFile]
    explanation: Lokal muss jede Person das einmal setzen. GitHub liest eine Datei mit genau diesem Namen im Wurzelverzeichnis automatisch.
  - type: single
    question: Das Team will TypeScript `strict` in einem großen Projekt einschalten, es kommen 900 Fehler. Was ist ein sinnvoller Weg?
    options:
      - Die einzelnen strict-Optionen nacheinander einschalten, z. B. zuerst noImplicitAny, und jeweils abarbeiten.
      - Alle Fehler mit `as any` auflösen.
      - strict dauerhaft ausgeschaltet lassen.
    answer: 0
    explanation: "`tsc` hat keine Baseline. Weil `strict` nur ein Sammelschalter ist, kannst du die einzelnen Optionen Schritt für Schritt einschalten."
tasks:
  - id: aufraeum-commit
    type: terminal
    title: Ein Aufräum-Commit, den git blame ignoriert
    description: |
      Im Ordner `aufraeum-commit` liegt ein Repository mit zwei Commits von Ada. Der Code wurde nie formatiert.
      Du führst Pint ein – ohne dass `git blame` danach bei jeder Zeile dich als Autor zeigt.

      1. Formatiere alles mit `pint` und committe **nur** diese Formatierung mit einer Nachricht vom Typ `style`,
         z. B. `style: apply pint to whole project`.
      2. Schreibe die vollständige Commit-ID dieses Commits in die Datei `.git-blame-ignore-revs`
         (`git rev-parse HEAD >> .git-blame-ignore-revs`).
      3. Aktiviere die Datei lokal mit `git config blame.ignoreRevsFile .git-blame-ignore-revs`.
      4. Committe `.git-blame-ignore-revs`, z. B. mit `chore: ignore formatting commit in blame`.
      5. Prüfe mit `git blame src/Shop.php`: Die Zeilen zeigen wieder Adas Commits.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: aufraeum-commit
    setup: |
      git init -q -b main
      git config user.name "Ada"
      git config user.email "ada@example.com"
      mkdir -p src
      cat > src/Shop.php <<'EOF'
      <?php
      namespace App;
      class Shop {
          public function price( $net ){
              return $net*1.19 ;
          }
      }
      EOF
      git add src/Shop.php
      git commit -q -m "feat: add shop"
      cat > src/Basket.php <<'EOF'
      <?php
      namespace App;
      class Basket {
          private $items = array();
          public function add( $item ){ $this->items[] = $item; }
          public function count(){ return count( $this->items ); }
      }
      EOF
      git add src/Basket.php
      git commit -q -m "feat: add basket"
      git config user.name "Du"
      git config user.email "du@example.com"
    checks:
      - type: command
        run: pint --test
        message: Der Code ist noch nicht formatiert. Führe pint aus und committe das Ergebnis.
      - type: command
        run: git log --format=%s | grep -c '^style'
        stdout_matches: "^\\s*1\\s*$"
        message: "Es soll genau einen Commit vom Typ style geben, z. B. \"style: apply pint to whole project\"."
      - type: command
        run: "h=$(git log --format='%H %s' | awk '/ style/{print $1}'); git show --name-only --format= \"$h\" | sort | tr '\\n' ' '"
        stdout_matches: "^src/Basket\\.php src/Shop\\.php$"
        message: Der style-Commit soll genau die beiden formatierten PHP-Dateien enthalten – nichts anderes.
      - type: command
        run: "h=$(git log --format='%H %s' | awk '/ style/{print $1}'); grep -qx \"$h\" .git-blame-ignore-revs"
        message: In .git-blame-ignore-revs fehlt die vollständige Commit-ID deines style-Commits (eine ID pro Zeile).
      - type: command
        run: git config --get blame.ignoreRevsFile
        stdout_equals: .git-blame-ignore-revs
        message: Aktiviere die Datei mit git config blame.ignoreRevsFile .git-blame-ignore-revs.
      - type: command
        run: git ls-files .git-blame-ignore-revs
        stdout_equals: .git-blame-ignore-revs
        message: Committe .git-blame-ignore-revs, damit das ganze Team (und GitHub) sie nutzt.
      - type: command
        run: "l=$(grep -n '1.19' src/Shop.php | cut -d: -f1); [ \"$(git blame -L \"$l,$l\" --porcelain src/Shop.php | head -1 | cut -c1-40)\" = \"$(git log --format=%H --grep='^feat: add shop')\" ]"
        message: git blame zeigt die Preiszeile noch nicht Adas Commit zu. Ist die ID richtig eingetragen und blame.ignoreRevsFile gesetzt?
      - type: command
        run: test -z "$(git status --porcelain)"
        message: Es gibt noch uncommittete Änderungen.
    hints:
      - "Reihenfolge: `pint`, dann `git commit -am \"style: …\"`, erst danach `git rev-parse HEAD >> .git-blame-ignore-revs`."
      - "Die Datei enthält nur die 40 Zeichen lange Commit-ID, optional mit einer Kommentarzeile darüber (`# Pint eingeführt`)."
      - "`git blame -L 9,9 src/Shop.php` zeigt nur eine Zeile – dort sollte `feat: add shop` von Ada stehen."
    solution: |
      ```bash
      cd aufraeum-commit
      pint
      git commit -am "style: apply pint to whole project"
      git rev-parse HEAD >> .git-blame-ignore-revs
      git config blame.ignoreRevsFile .git-blame-ignore-revs
      git add .git-blame-ignore-revs
      git commit -m "chore: ignore formatting commit in blame"
      git blame src/Shop.php
      ```
  - id: einfuehrung-planen
    type: steps
    title: Einführung in einem Altprojekt
    description: Du sollst Qualitätswerkzeuge in ein fünf Jahre altes Laravel-Projekt mit 1200 Dateien bringen. Triff die Entscheidungen.
    steps:
      - situation: Pint würde 900 Dateien umformatieren. Drei Kolleginnen haben offene Branches.
        question: Wie gehst du vor?
        options:
          - Den Formatierungs-Commit absprechen, wenn wenige Branches offen sind, und ihn in .git-blame-ignore-revs eintragen.
          - Jede Datei erst formatieren, wenn jemand sie zufällig anfasst – ohne Absprache.
          - Pint jedem Pull Request überlassen, auch wenn dadurch tausende Zeilen im Diff landen.
        answer: 0
        explanation: Ein abgesprochener, reiner Formatierungs-Commit ist kurz unbequem, danach aber erledigt. Offene Branches formatieren vor dem Rebase einfach selbst mit Pint.
      - situation: PHPStan meldet auf Level 5 insgesamt 640 Fehler.
        question: Was ist der nächste Schritt?
        options:
          - Baseline erzeugen, PHPStan sofort in die CI nehmen und die Baseline nach und nach abbauen.
          - PHPStan erst einführen, wenn alle 640 Fehler behoben sind.
          - Auf Level 0 bleiben, weil es dort keine Fehler gibt.
        answer: 0
        explanation: Mit der Baseline gilt die Schranke ab sofort für neuen Code. Das Ratschen-Prinzip sorgt dafür, dass es danach nur besser wird.
      - situation: Rector mit allen vorbereiteten Sets würde 3000 Stellen ändern.
        question: Wie führst du Rector ein?
        options:
          - Ein Set nach dem anderen, jeweils als eigener Pull Request mit Review.
          - Alle Sets auf einmal, ein Commit, direkt auf main.
        answer: 0
        explanation: Kleine, thematisch saubere Pull Requests lassen sich prüfen. Ein Riesen-Diff wird nur noch durchgewunken.
---
Ein neues Projekt mit allen Werkzeugen zu starten, ist leicht: Von der ersten Zeile an ist alles grün. Die
eigentliche Arbeit beginnt in einem Projekt, das seit Jahren wächst. Schaltest du dort PHPStan, Pint und
`strict` auf einen Schlag ein, ist die Pipeline für Wochen rot – und das Team lernt nur, dass Werkzeuge stören.
Diese Lektion zeigt, wie es anders geht.

## Das Prinzip: neu sauber, alt Schritt für Schritt

Alle Strategien folgen derselben Idee, dem [[ratschen-prinzip|Ratschen-Prinzip]]:

1. **Ab sofort** muss neuer und geänderter Code die Regeln erfüllen.
2. Bestehende Probleme werden **sichtbar festgehalten** statt ignoriert.
3. Die Zahl der bekannten Probleme darf **nur sinken**.

| Werkzeug | Wie man es schrittweise einführt |
|---|---|
| Formatter (Pint, Biome) | Einmal alles formatieren – oder nur geänderte Dateien |
| PHPStan | Baseline, dann Level für Level hoch |
| Rector | Ein Set nach dem anderen |
| TypeScript | strict-Optionen einzeln einschalten |

> [!MERKSATZ]
> Ein Werkzeug, das am ersten Tag in der CI läuft und nur neuen Code prüft, ist mehr wert als eines, das
> „irgendwann, wenn alles sauber ist“ eingeführt wird.

## Formatieren: ein Commit, der nichts versteckt

Beim Formatter gibt es zwei Wege. Bei kleinen und mittleren Projekten formatierst du **einmal alles** in einem
eigenen Commit, der nichts anderes enthält. Er lässt sich leicht prüfen, und danach ist das Thema erledigt.

Der Nachteil: [[git-blame|`git blame`]] zeigt danach bei fast jeder Zeile den Formatierungs-Commit. Dafür gibt
es die Datei [[git-blame-ignore-revs|`.git-blame-ignore-revs`]]:

```text title=".git-blame-ignore-revs"
# Pint im ganzen Projekt eingeführt
3f9c2a8e1b7d4c6f0a5e9b2d8c1f4a7e6b3d0c9a
```

```bash title="Terminal"
git config blame.ignoreRevsFile .git-blame-ignore-revs
git blame src/Shop.php    # zeigt wieder die eigentlichen Autoren
```

GitHub liest die Datei mit genau diesem Namen automatisch und blendet den Commit in der Blame-Ansicht aus.

Bei sehr großen Projekten oder vielen offenen Branches formatierst du stattdessen nur, was sich ändert:
`pint --dirty` lokal, `pint --diff=main` und `biome check --changed` in der CI.

> [!FEHLER]
> Formatierung und echte Änderung im selben Commit. Im Diff stehen 400 geänderte Zeilen, eine davon ist ein
> Bugfix – den findet im Review niemand. Formatierung **immer** getrennt committen.

## Analyse: Baseline und Level

Für PHPStan kennst du den Weg schon: niedriges Level, Baseline erzeugen, sofort in die CI. Dann abwechselnd
Baseline abbauen und Level erhöhen. In der CI sorgt `reportUnmatchedIgnoredErrors` dafür, dass behobene
Einträge auch aus der Baseline verschwinden.

TypeScript hat keine Baseline. Dafür ist `strict` nur ein Sammelschalter – du kannst die Einzeloptionen
nacheinander einschalten:

```json title="tsconfig.json – Zwischenstand"
{
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

Erst wenn alle Einzeloptionen grün sind, ersetzt du sie durch `"strict": true`. Für Rector gilt dasselbe:
ein Set oder eine Level-Stufe (`withTypeCoverageLevel(…)`) pro Pull Request.

## Das Team mitnehmen

Werkzeuge scheitern seltener an der Technik als an Menschen. Ein paar Regeln helfen:

- **Ankündigen**, bevor der große Formatierungs-Commit kommt – offene Branches formatieren vor dem Rebase selbst.
- **Dokumentieren**: In `README.md` oder `CONTRIBUTING.md` steht, welche Befehle es gibt (`composer qa`,
  `npm run check`) und wie man die Hooks installiert.
- **Editoren einrichten**: Format beim Speichern spart allen die meisten Fehlermeldungen.
- **Ausnahmen begründen**: Jeder `@phpstan-ignore` und `biome-ignore` braucht einen Grund im Kommentar.

> [!PRAXIS]
> In vielen Teams verfolgt eine kleine Kennzahl den Fortschritt, etwa die Zahl der Baseline-Einträge pro
> Woche. Eine sinkende Kurve motiviert mehr als jede Regel – und zeigt, dass die [[technische-schulden|technischen Schulden]]
> wirklich abgebaut werden.

## Zusammenfassung

- Neuer Code muss ab sofort sauber sein; alte Probleme werden festgehalten und nur noch weniger (**Ratschen-Prinzip**).
- Formatierung kommt in einen eigenen Commit, dessen ID in `.git-blame-ignore-revs` steht.
- Alternativ prüfen `pint --dirty`, `pint --diff=main` und `biome check --changed` nur Geändertes.
- PHPStan führst du mit Baseline und Level für Level ein, TypeScript mit einzelnen strict-Optionen, Rector Set für Set.
- Ankündigen, dokumentieren und Ausnahmen begründen nimmt das Team mit.
