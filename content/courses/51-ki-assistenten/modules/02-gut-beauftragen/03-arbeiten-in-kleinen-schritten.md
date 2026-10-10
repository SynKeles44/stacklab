---
title: Arbeiten in kleinen Schritten
summary: Erst planen, dann in kleinen, geprüften Schritten umsetzen – mit Git als Sicherheitsnetz und dir als verantwortlicher Person.
duration: 25
sources:
  - title: Anthropic – Claude Code best practices (Explore, plan, code, commit)
    url: https://www.anthropic.com/engineering/claude-code-best-practices
  - title: git-add – interaktives Vormerken mit --patch
    url: https://git-scm.com/docs/git-add
  - title: git-restore
    url: https://git-scm.com/docs/git-restore
quiz:
  - type: single
    question: Warum lässt du einen Agenten bei einer größeren Aufgabe zuerst einen Plan schreiben, bevor er Code ändert?
    options:
      - Weil Agenten ohne Plan nicht starten können
      - Weil du Missverständnisse im Plan in einer Minute korrigierst, im fertigen Code erst nach langem Review
      - Weil der Plan automatisch Tests erzeugt
      - Weil es Tokens spart, nie Code zu schreiben
    answer: 1
    explanation: >
      Ein Plan ist billig zu prüfen. Ein falscher Ansatz, der schon in zwanzig Dateien steckt, ist teuer.
  - type: multiple
    question: Welche Gewohnheiten machen Arbeit mit einem Coding-Agenten sicher?
    options:
      - Vor dem Start ein sauberes Arbeitsverzeichnis auf einem eigenen Branch
      - Nach jedem grünen Zwischenschritt ein Commit als Rücksprungpunkt
      - Den Agenten am Ende alles in einem einzigen Riesen-Commit zusammenfassen lassen, ohne den Diff zu lesen
      - Nach dem dritten erfolglosen Versuch stoppen und neu ansetzen
    answers: [0, 1, 3]
    explanation: >
      Kleine, geprüfte Commits machen jeden Schritt nachvollziehbar und umkehrbar. Endlose Reparaturschleifen
      verbrauchen Zeit und Kontext, ohne näher ans Ziel zu kommen.
  - type: cloze
    text: Mit `git add ___` fragt Git bei jedem Änderungsblock einzeln, ob er vorgemerkt werden soll. Eine ungewollte Änderung in einer Datei verwirfst du mit `git ___ datei`.
    blanks:
      - ["-p", "--patch"]
      - [restore]
    explanation: So übernimmst du von einem großen KI-Ergebnis genau die Teile, die du geprüft hast.
  - type: single
    question: Wer ist verantwortlich, wenn ein von einem Agenten geschriebener Commit in Produktion einen Fehler auslöst?
    options:
      - Der Hersteller des Werkzeugs
      - Niemand, weil eine KI ihn geschrieben hat
      - Die Person, die die Änderung übernommen, committet oder gemergt hat – und das Review-Team wie bei jeder Änderung
      - Das Sprachmodell
    answer: 2
    explanation: Ein Werkzeug trägt keine Verantwortung. Wer den Code übernimmt, steht dafür ein – genauso wie bei Code aus einem Forum.
tasks:
  - id: workflow-reihenfolge
    type: order
    title: Der Ablauf einer Agenten-Aufgabe
    description: Bringe die Schritte einer sicheren Arbeit mit einem Coding-Agenten in die richtige Reihenfolge.
    items:
      - Sauberes Arbeitsverzeichnis herstellen und einen eigenen Branch anlegen
      - Aufgabe mit Ziel, Kontext, Einschränkungen und Akzeptanzkriterien beschreiben
      - Den Agenten erst einen Plan vorschlagen lassen und den Plan prüfen
      - Einen kleinen Schritt umsetzen lassen
      - Diff lesen und Tests ausführen
      - Den geprüften Schritt committen
      - Mit dem nächsten Schritt weitermachen oder neu ansetzen, wenn es nicht vorangeht
    hints:
      - Geprüft und committet wird nach jedem Schritt – nicht erst ganz am Ende.
  - id: ergebnis-aufteilen
    type: terminal
    title: Ein KI-Ergebnis in saubere Schritte zerlegen
    description: |
      Im Ordner `kassenzettel` hat ein Agent auf einmal drei Dinge geändert – alles noch nicht committet:

      - **Bugfix:** `applyVat()` in `src/price.js` rechnete nur die Steuer statt Preis plus Steuer. Dazu gibt es
        einen neuen Test in `test/price.test.js`.
      - **Refactoring:** Die Funktion `fmt` in `src/format.js` heißt jetzt `formatEuro`; `src/invoice.js` und
        `test/format.test.js` wurden angepasst.
      - **Ungewollt:** Ganz unten in `src/invoice.js` steht eine Debug-Ausgabe mit `console.log('DEBUG' …)`.

      Zerlege das in kleine, geprüfte Schritte:

      1. Sieh dir alles mit `git status` und `git diff` an.
      2. Committe **zuerst nur den Bugfix** (`src/price.js` und `test/price.test.js`) mit einer Message vom Typ `fix`.
      3. Committe danach **das Refactoring** mit einer Message vom Typ `refactor` – **ohne** die Debug-Zeile.
         Tipp: `git add -p src/invoice.js` lässt dich einzelne Änderungsblöcke auswählen.
      4. Verwirf die Debug-Ausgabe. Am Ende ist das Arbeitsverzeichnis sauber.
      5. Nach **jedem** Commit muss `npm test` grün sein.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit das Repository mit den Änderungen angelegt wird.
    workdir: kassenzettel
    setup: |
      git init -q -b main
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      mkdir -p src test
      printf '{\n  "name": "kassenzettel",\n  "type": "module",\n  "scripts": { "test": "node --test" }\n}\n' > package.json
      cat > src/price.js <<'JS'
      export function totalCents(items) {
        return items.reduce((sum, item) => sum + item.priceCents * item.qty, 0);
      }

      export function applyVat(cents) {
        return Math.round(cents * 0.19);
      }
      JS
      cat > src/format.js <<'JS'
      export function fmt(cents) {
        return (cents / 100).toFixed(2).replace('.', ',') + ' €';
      }
      JS
      cat > src/invoice.js <<'JS'
      import { totalCents, applyVat } from './price.js';
      import { fmt } from './format.js';

      export function totalLabel(items) {
        return fmt(applyVat(totalCents(items)));
      }

      export function invoiceLines(items) {
        const net = totalCents(items);
        const gross = applyVat(net);
        const lines = items.map((item) => `${item.qty} x ${item.name}`);
        lines.push(`Netto: ${net}`);
        lines.push(`Brutto: ${gross}`);
        lines.push('Vielen Dank für deinen Einkauf!');
        lines.push('Bis zum nächsten Mal.');
        lines.push('');
        return lines;
      }
      JS
      cat > test/price.test.js <<'JS'
      import { test } from 'node:test';
      import assert from 'node:assert/strict';
      import { totalCents } from '../src/price.js';

      test('sums up all items', () => {
        assert.equal(totalCents([{ priceCents: 250, qty: 2 }, { priceCents: 100, qty: 1 }]), 600);
      });
      JS
      cat > test/format.test.js <<'JS'
      import { test } from 'node:test';
      import assert from 'node:assert/strict';
      import { fmt } from '../src/format.js';

      test('formats cents as euro', () => {
        assert.equal(fmt(1999), '19,99 €');
      });
      JS
      git add -A
      git commit -q -m "chore: initial commit"
      sed -i 's/cents \* 0.19/cents * 1.19/' src/price.js
      cat >> test/price.test.js <<'JS'

      test('adds 19 percent vat', () => {
        assert.equal(applyVat(1000), 1190);
      });
      JS
      sed -i "s/import { totalCents } from/import { totalCents, applyVat } from/" test/price.test.js
      sed -i 's/export function fmt(/export function formatEuro(/' src/format.js
      sed -i 's/import { fmt }/import { formatEuro }/; s/return fmt(/return formatEuro(/' src/invoice.js
      sed -i 's/import { fmt }/import { formatEuro }/; s/assert.equal(fmt(/assert.equal(formatEuro(/' test/format.test.js
      printf "\nconsole.log('DEBUG', invoiceLines([{ name: 'Test', priceCents: 100, qty: 1 }]));\n" >> src/invoice.js
    checks:
      - type: command
        run: git log --oneline | wc -l
        stdout_matches: "^\\s*3\\s*$"
        message: Es sollen genau zwei neue Commits entstehen – einer für den Bugfix, einer für das Refactoring.
      - type: command
        run: "git log -1 --format=%s HEAD~1"
        stdout_matches: "^fix(\\([^()\\s]+\\))?!?: \\S"
        message: "Der erste neue Commit (HEAD~1) soll der Bugfix mit einer Message vom Typ fix sein, z. B. `fix: add vat instead of returning it`."
      - type: command
        run: "git show --name-only --format= HEAD~1 | sort | tr '\\n' ' '"
        stdout_matches: "^src/price\\.js test/price\\.test\\.js$"
        message: Der fix-Commit soll genau src/price.js und test/price.test.js enthalten.
      - type: command
        run: "git log -1 --format=%s HEAD"
        stdout_matches: "^refactor(\\([^()\\s]+\\))?!?: \\S"
        message: "Der letzte Commit soll das Refactoring mit einer Message vom Typ refactor sein, z. B. `refactor: rename fmt to formatEuro`."
      - type: command
        run: "git show --name-only --format= HEAD | sort | tr '\\n' ' '"
        stdout_matches: "^src/format\\.js src/invoice\\.js test/format\\.test\\.js$"
        message: Der refactor-Commit soll genau src/format.js, src/invoice.js und test/format.test.js enthalten.
      - type: command
        run: "! git grep -q DEBUG HEAD -- src"
        message: Die Debug-Ausgabe ist im Commit gelandet. Nimm in src/invoice.js nur die Umbenennung auf (git add -p) und korrigiere den Commit.
      - type: command
        run: git status --porcelain
        stdout_equals: ""
        message: Das Arbeitsverzeichnis ist nicht sauber. Verwirf die Debug-Zeile mit `git restore src/invoice.js`.
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX")
          rc=0
          for rev in HEAD~1 HEAD; do
            rm -rf "$d/w"
            git worktree add -q --detach "$d/w" "$rev" >/dev/null 2>&1 || rc=1
            (cd "$d/w" && node --test >/dev/null 2>&1) || rc=1
            git worktree remove --force "$d/w" >/dev/null 2>&1 || true
          done
          rm -rf "$d"
          git worktree prune
          exit $rc
        message: Nach jedem der beiden Commits müssen alle Tests grün sein. Prüfe jeden Stand mit `npm test`.
    hints:
      - "Starte mit `git add src/price.js test/price.test.js` und committe den Bugfix."
      - "Bei `git add -p src/invoice.js` beantwortest du die Blöcke mit der Umbenennung mit `y` und den Block mit `console.log('DEBUG' …)` mit `n`."
      - "Danach `git add src/format.js test/format.test.js`, committen und zum Schluss `git restore src/invoice.js`."
    solution: |
      ```bash
      cd kassenzettel
      git status
      git diff
      git add src/price.js test/price.test.js
      npm test
      git commit -m "fix: add vat to price instead of returning only the tax"
      git add -p src/invoice.js        # Umbenennung: y, DEBUG-Zeile: n
      git add src/format.js test/format.test.js
      git commit -m "refactor: rename fmt to formatEuro"
      git restore src/invoice.js       # Debug-Ausgabe verwerfen
      npm test
      git status
      ```
---
Ein Agent hat in zehn Minuten vierzig Dateien geändert. Die Tests sind rot, der Diff hat 1.500 Zeilen,
und du weißt nicht mehr, welche Änderung wofür war. Das Problem war nicht die Aufgabe, sondern ihre
Größe. Mit einem einfachen Arbeitsablauf passiert dir das nicht.

## Erst erkunden und planen, dann umsetzen

Bei allem, was über ein paar Zeilen hinausgeht, trennst du **Denken** und **Ändern**:

1. **Erkunden** – Der Assistent liest die relevanten Dateien und fasst zusammen, wie der Code heute
   funktioniert. Er ändert noch nichts.
2. **Planen** – Er schlägt einen Plan in nummerierten Schritten vor: welche Dateien, welche Tests, in
   welcher Reihenfolge.
3. **Prüfen** – Du liest den Plan. Hier korrigierst du Missverständnisse für den Preis eines Satzes.
4. **Umsetzen** – Erst jetzt wird Code geschrieben, Schritt für Schritt.

Viele Agenten-Werkzeuge haben dafür einen eigenen Planungsmodus, in dem sie nur lesen dürfen. Es geht
aber auch ohne: „Lies zuerst `src/discount.js` und die Tests und schlage einen Plan vor. Ändere noch
keine Dateien.“

> [!MERKSATZ]
> Ein falscher Plan kostet einen Satz Korrektur. Ein falscher Plan, der schon umgesetzt ist, kostet
> ein komplettes Review und oft einen Neuanfang.

## Kleine Schritte mit Git als Sicherheitsnetz

Jeder Schritt sollte so klein sein, dass du seinen [[diff|Diff]] in wenigen Minuten wirklich verstehst.
[[git|Git]] macht das sicher:

| Wann | Was du tust | Warum |
|---|---|---|
| vor dem Start | `git status` sauber, `git switch -c ki/rabatt` | alles ist mit einem Befehl rückgängig zu machen |
| nach jedem Schritt | `git diff` lesen, Tests laufen lassen | du merkst Fehler, solange sie klein sind |
| Schritt ist grün | committen | ein Rücksprungpunkt für den nächsten Schritt |
| Schritt ging schief | `git restore .` | zurück zum letzten guten Stand |

```bash title="Ein Schritt im Takt"
git diff                # Was hat der Assistent geändert?
npm test                # Ist alles noch grün?
git add src/price.js test/price.test.js
git commit -m "fix: add vat to price"
```

So entsteht nebenbei eine Historie aus kleinen [[atomarer-commit|atomaren Commits]] – genau das, was
Reviewer sich wünschen.

## Große Ergebnisse zerlegen

Manchmal hat ein Assistent doch mehrere Dinge auf einmal geändert. Dann übernimmst du sie **getrennt**:

```bash title="Nur ausgewählte Änderungsblöcke vormerken"
git add -p src/invoice.js
# Stage this hunk [y,n,q,a,d,s,e,?]?
#   y = übernehmen, n = auslassen, s = Block weiter aufteilen
```

Mit `git add -p` gehst du jeden Änderungsblock einzeln durch. Was nicht dazugehört – eine
Debug-Ausgabe, eine ungefragte Umformatierung – bleibt draußen und wird anschließend mit
`git restore datei` verworfen.

> [!FEHLER]
> **„Ich committe alles, was der Agent gemacht hat.“** Ein Commit mit Bugfix, Umbenennung und
> vergessener Debug-Zeile ist schwer zu reviewen und kaum gezielt zurückzunehmen. Ein Thema pro Commit.

## Wann du aufhörst und neu ansetzt

Agenten neigen zu Reparaturschleifen: Test rot, kleine Änderung, wieder rot, nächste Änderung. Jeder
Versuch füllt das [[kontextfenster|Kontextfenster]] mit Fehlermeldungen und verschiebt die Lösung oft
weiter weg.

Bewährte Faustregeln:

- **Nach dem dritten gescheiterten Versuch stoppen.** Selbst die Ursache verstehen, dann neu beauftragen.
- **Bei gleicher Fehlermeldung zweimal hintereinander** ist der Ansatz falsch, nicht zu schwach
  umgesetzt.
- **Frisches Gespräch statt Endlos-Verlauf** – mit einer kurzen Zusammenfassung des Stands.
- **Selbst übernehmen**, wenn du die Lösung inzwischen klar vor dir siehst.

> [!PRAXIS]
> Viele Teams vereinbaren: Ein Agent darf auf seinem Branch frei arbeiten, aber nichts pushen und keine
> Pull Requests mergen. Der letzte Schritt gehört immer einem Menschen.

## Der Mensch bleibt verantwortlich

Ein Werkzeug kann keine Verantwortung tragen. Wer eine Änderung übernimmt, committet und mergt, steht
dafür ein – genauso wie für Code aus einem Forum oder von einem Praktikanten.

Daraus folgt eine einfache Haltung: **Committe nur, was du erklären kannst.** Wenn eine Kollegin im
Review fragt „Warum ist das so?“, ist „Hat die KI so gemacht“ keine Antwort.

## Zusammenfassung

- Erst erkunden und planen lassen, den Plan prüfen, dann umsetzen.
- Jeder Schritt ist so klein, dass du den Diff verstehst; danach Tests und Commit.
- Ein sauberer Branch und häufige Commits machen jeden Schritt umkehrbar.
- Große Ergebnisse zerlegst du mit `git add -p` und verwirfst Ungewolltes mit `git restore`.
- Nach drei gescheiterten Versuchen: stoppen, verstehen, neu ansetzen.
- Verantwortlich ist immer der Mensch, der übernimmt – committe nur, was du erklären kannst.
