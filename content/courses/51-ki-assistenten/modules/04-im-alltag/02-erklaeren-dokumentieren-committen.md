---
title: Code erklären, dokumentieren, committen
summary: Unbekannten Code mit KI verstehen, Doku und Commit-Messages entwerfen lassen – und jede Aussage gegen den Code prüfen.
duration: 20
sources:
  - title: Conventional Commits 1.0.0
    url: https://www.conventionalcommits.org/de/v1.0.0/
  - title: git-commit – Commit-Messages und Trailer
    url: https://git-scm.com/docs/git-commit
  - title: git-interpret-trailers
    url: https://git-scm.com/docs/git-interpret-trailers
quiz:
  - type: single
    question: Ein Assistent erklärt dir eine Funktion. Wie gehst du mit der Erklärung um?
    options:
      - Ich übernehme sie, denn erklären kann ein Modell besonders gut.
      - Ich prüfe die zentralen Aussagen am Code – mit einem kleinen Aufruf, einem Test oder dem Debugger.
      - Ich frage so lange nach, bis die Erklärung sicher klingt.
      - Ich ignoriere sie und lese nur die Kommentare im Code.
    answer: 1
    explanation: >
      Erklärungen sind meist gut, aber nicht immer richtig – besonders bei Randfällen. Eine Aussage, die du
      mit einem kurzen Aufruf bestätigst, ist Wissen; eine ungeprüfte ist eine Vermutung.
  - type: multiple
    question: Was macht eine KI-generierte Commit-Message gut?
    options:
      - Der Typ passt zur Änderung (`fix`, `feat`, `refactor` …).
      - Der Betreff fasst das Ergebnis kurz zusammen, der Text erklärt das Warum.
      - Sie beschreibt nur Dinge, die wirklich im Diff stehen.
      - Sie listet jede geänderte Datei einzeln auf.
    answers: [0, 1, 2]
    explanation: >
      Welche Dateien sich geändert haben, zeigt Git ohnehin. Die Message erklärt Absicht und Grund – und sie
      darf nichts behaupten, was der Diff nicht hergibt.
  - type: match
    question: Wofür eignet sich ein Assistent bei der Dokumentation – und was prüfst du?
    pairs:
      - { left: "Erster Entwurf einer README-Anleitung", right: "jeden Befehl selbst ausführen" }
      - { left: "JSDoc- oder PHPDoc-Kommentar zu einer Funktion", right: "Parameter, Rückgabe und Fehlerfälle mit dem Code abgleichen" }
      - { left: "Zusammenfassung eines langen Diffs für die PR-Beschreibung", right: "auf Behauptungen achten, die nicht im Diff stehen" }
    explanation: >
      Der Assistent liefert schnell einen Entwurf. Die Verantwortung für Korrektheit bleibt bei dir – falsche
      Doku ist schlimmer als keine.
  - type: cloze
    text: "Zusätzliche Angaben am Ende einer Commit-Message im Format `Schlüssel: Wert` heißen ___. Ob KI-Beteiligung so vermerkt wird, legt euer ___ fest."
    blanks:
      - [Trailer, Git-Trailer]
      - [Team, Teamregeln]
    explanation: Manche Teams nutzen dafür einen Trailer wie `Assisted-by:` oder `Co-authored-by:`, andere verzichten darauf. Wichtig ist eine einheitliche Regel.
tasks:
  - id: commit-message-schreiben
    type: terminal
    title: Eine ehrliche Commit-Message
    description: |
      Im Ordner `rabatt` hat ein Assistent eine Korrektur vorbereitet und schon vorgemerkt (`git add`). Er
      schlägt die Message `Update files` vor. Das geht besser.

      1. Sieh dir die vorgemerkte Änderung mit `git diff --staged` an. Was war der Fehler?
      2. Committe mit einer Message nach Conventional Commits:
         - Betreff: passender Typ, Doppelpunkt, kurze Zusammenfassung, höchstens 72 Zeichen.
         - Leerzeile, dann mindestens eine Zeile Text, die erklärt, **warum** die Änderung nötig war.
      3. Ändere am vorgemerkten Inhalt nichts.

      Tipp: `git commit` ohne `-m` öffnet einen Editor; alternativ `git commit -m "Betreff" -m "Text"`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: rabatt
    setup: |
      git init -q -b main
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      mkdir -p src test
      printf '{\n  "name": "rabatt",\n  "type": "module",\n  "scripts": { "test": "node --test" }\n}\n' > package.json
      cat > src/checkout.js <<'JS'
      export function finalPrice(cents, discountPercent) {
        const discount = Math.round(cents * discountPercent / 100);
        let price = cents - discount;
        if (discountPercent > 0) {
          price = price - discount;
        }
        return price;
      }
      JS
      cat > test/checkout.test.js <<'JS'
      import { test } from 'node:test';
      import assert from 'node:assert/strict';
      import { finalPrice } from '../src/checkout.js';

      test('no discount keeps the price', () => {
        assert.equal(finalPrice(1000, 0), 1000);
      });
      JS
      git add -A
      git commit -q -m "feat: add checkout price calculation"
      cat > src/checkout.js <<'JS'
      export function finalPrice(cents, discountPercent) {
        const discount = Math.round(cents * discountPercent / 100);
        return cents - discount;
      }
      JS
      cat >> test/checkout.test.js <<'JS'

      test('applies the discount exactly once', () => {
        assert.equal(finalPrice(1000, 10), 900);
      });
      JS
      git add -A
    checks:
      - type: command
        run: git log --oneline | wc -l
        stdout_matches: "^\\s*2\\s*$"
        message: Es soll genau ein neuer Commit entstehen.
      - type: command
        run: git log -1 --format=%s
        stdout_matches: "^fix(\\([^()\\s]+\\))?!?: \\S"
        message: "Die Änderung behebt einen Fehler – der Typ ist `fix`, z. B. `fix: apply discount only once`."
      - type: command
        run: "git log -1 --format=%s | awk '{ exit (length($0) <= 72) ? 0 : 1 }'"
        message: Der Betreff ist länger als 72 Zeichen. Kürze ihn und schreib Details in den Text darunter.
      - type: command
        run: "! git log -1 --format=%s | grep -Eiqw 'update files|stuff|wip'"
        message: Der Betreff ist zu allgemein. Beschreibe, was sich am Verhalten ändert.
      - type: command
        run: "git log -1 --format=%b | grep -c '[[:alpha:]]'"
        stdout_matches: "^[1-9][0-9]*$"
        message: "Ergänze nach einer Leerzeile einen Text, der erklärt, warum die Änderung nötig war (z. B. mit einem zweiten `-m`)."
      - type: command
        run: "git show --name-only --format= HEAD | sort | tr '\\n' ' '"
        stdout_matches: "^src/checkout\\.js test/checkout\\.test\\.js$"
        message: Der Commit soll genau die vorgemerkten Dateien src/checkout.js und test/checkout.test.js enthalten.
      - type: command
        run: git status --porcelain
        stdout_equals: ""
        message: Es ist noch etwas vorgemerkt oder geändert. Committe genau die vorbereitete Änderung.
    hints:
      - "Im Diff siehst du: Der Rabatt wurde bei `discountPercent > 0` ein zweites Mal abgezogen."
      - "Ein zweites `-m` erzeugt den Text unter dem Betreff: `git commit -m \"fix: …\" -m \"Warum …\"`."
    solution: |
      ```bash
      cd rabatt
      git diff --staged
      git commit -m "fix: apply checkout discount only once" \
        -m "The discount was subtracted a second time for every discount above zero, so customers were charged too little. A test now covers a 10 percent discount."
      git log -1
      ```
  - id: erklaerung-pruefen
    type: steps
    title: Eine KI-Erklärung überprüfen
    description: |
      Ein Assistent erklärt dir diese Funktion aus einem Bestandsprojekt:

      ```js
      function isWeekend(date) {
        const day = date.getDay();
        return day === 0 || day === 6;
      }
      ```
    steps:
      - situation: "Der Assistent sagt: „`getDay()` liefert den Tag im Monat, also 1 bis 31.“"
        question: Wie prüfst du diese Aussage am schnellsten?
        options:
          - Ich glaube es, das klingt plausibel.
          - Ich schlage `getDay()` in der MDN-Doku nach oder führe `new Date(2026, 9, 10).getDay()` aus.
          - Ich frage den Assistenten, ob er sicher ist.
        answer: 1
        explanation: "Doku und ein kurzer Aufruf beantworten das in Sekunden. `getDay()` liefert den Wochentag (0 = Sonntag); den Tag im Monat liefert `getDate()`."
      - situation: Du hast nachgeschlagen – die Aussage war falsch. Der Rest der Erklärung klingt gut.
        question: Was folgt daraus?
        options:
          - Der Rest stimmt bestimmt.
          - Ich prüfe auch die übrigen wichtigen Aussagen, bevor ich mich darauf verlasse.
          - Ich nutze nie wieder KI für Erklärungen.
        answer: 1
        explanation: Ein Fehler zeigt, dass die Erklärung nicht vollständig verlässlich ist. Prüfe die Aussagen, auf die du gleich bauen willst.
      - situation: Du schreibst einen JSDoc-Kommentar für `isWeekend` und lässt den Assistenten einen Entwurf machen. Er schreibt „@param {string} date – ISO-Datum“.
        question: Was tust du?
        options:
          - Übernehmen, ein Entwurf ist ein Entwurf.
          - Korrigieren auf `{Date}`, denn die Funktion ruft `date.getDay()` auf – ein String hat diese Methode nicht.
          - Den Kommentar weglassen.
        answer: 1
        explanation: Doku, die dem Code widerspricht, führt die nächste Person in die Irre. Jede Angabe wird am Code geprüft.
---
Du übernimmst ein Modul, das seit drei Jahren niemand angefasst hat. Ein Assistent erklärt dir in einer
Minute, was die 200 Zeilen tun – flüssig, gut gegliedert, überzeugend. Zwei Details davon sind falsch.
Welche, findest du nur heraus, wenn du nachprüfst.

## Code erklären lassen

Erklären ist eine der stärksten Seiten von Assistenten: Der Code steht vollständig im Kontext, und das
Modell muss wenig erfinden. Ideal, um sich in [[legacy-code|Legacy-Code]] oder eine fremde Bibliothek
einzuarbeiten.

Gute Fragen sind konkret:

- „Was gibt diese Funktion bei einer leeren Liste zurück?“
- „Welche Aufrufer hat `applyDiscount` in diesem Projekt?“ (für Agenten, die suchen können)
- „Erkläre diesen regulären Ausdruck Teil für Teil.“
- „Welche Annahmen trifft dieser Code über die Eingabe?“

> [!MERKSATZ]
> Eine Erklärung ist eine **Hypothese** über den Code. Bestätige die Aussagen, auf die du gleich baust –
> mit einem kurzen Aufruf, einem Test oder dem [[debugger|Debugger]].

Typische Schwachstellen von Erklärungen sind dieselben wie beim Code: Randfälle, ähnlich klingende APIs
(`getDay()` und `getDate()`), Verhalten bestimmter Versionen. Die Techniken aus dem Kurs
[Fremden Code lesen](/kurse/fremden-code-lesen) bleiben wichtig – der Assistent beschleunigt sie, ersetzt
sie aber nicht.

## Dokumentation entwerfen lassen

Assistenten schreiben schnell erste Fassungen von README-Abschnitten, Docblocks und Anleitungen. Das spart
Zeit beim Formulieren. Die Fakten prüfst du:

| Doku-Art | Was du prüfst |
|---|---|
| Installationsanleitung | jeden Befehl selbst ausführen, in einem frischen Ordner |
| [[jsdoc\|JSDoc]]/PHPDoc | Typen, Parameter, Rückgabe, geworfene Fehler gegen den Code |
| API-Beschreibung | Felder und Statuscodes gegen die echte Antwort |
| Architektur-Überblick | stimmen Ordner, Klassen und Abhängigkeiten wirklich? |

> [!FEHLER]
> **Doku, die beschreibt, was der Code tun *sollte*.** Assistenten schreiben gern die „ideale“ Version:
> Parameter, die es nicht gibt, Fehlerbehandlung, die fehlt. Falsche Doku ist schlimmer als keine, weil
> man ihr glaubt.

## Commit-Messages und PR-Beschreibungen

Viele Werkzeuge schlagen Commit-Messages aus dem vorgemerkten Diff vor. Der Diff zeigt **was** sich
geändert hat – das **Warum** kennt oft nur du. Deshalb ist ein Vorschlag ein Startpunkt:

```text title="Vorschlag des Assistenten"
Update files
```

```text title="Nach deiner Überarbeitung"
fix: apply checkout discount only once

The discount was subtracted a second time for every discount above
zero, so customers were charged too little. A test now covers a
10 percent discount.
```

Prüfe bei jeder generierten [[commit-message|Commit-Message]]:

1. Passt der Typ nach [[conventional-commits|Conventional Commits]]?
2. Stimmt jede Aussage mit dem Diff überein – nichts erfunden, nichts verschwiegen?
3. Steht das Warum drin?

Dasselbe gilt für Beschreibungen von Pull Requests: Lies den Entwurf gegen den Diff und streiche
Behauptungen wie „verbessert die Performance“, wenn niemand gemessen hat.

## KI-Beteiligung kennzeichnen?

Ob und wie KI-Unterstützung vermerkt wird, ist eine **Teamregel**. Manche Teams nutzen einen
[[commit-trailer|Trailer]] am Ende der Message, andere vermerken es in der PR-Beschreibung, wieder andere
gar nicht. Einige Werkzeuge fügen solche Zeilen automatisch ein.

```text title="Beispiel für einen Trailer – nur, wenn euer Team das so vereinbart"
fix: apply checkout discount only once

Assisted-by: <Name des Werkzeugs>
```

> [!PRAXIS]
> Entscheidend ist nicht die Kennzeichnung, sondern die Verantwortung: Im Commit steht dein Name. Kläre
> die Regel einmal im Team und halte sie in der Projekt-Anweisungsdatei fest, damit Agenten sie befolgen.

## Zusammenfassung

- Assistenten erklären Code schnell und meist gut – prüfe die Aussagen, auf die du baust.
- Doku-Entwürfe sparen Zeit; Befehle, Typen und Felder prüfst du am echten System.
- Generierte Commit-Messages ergänzt du um das Warum und gleichst sie mit dem Diff ab.
- PR-Beschreibungen dürfen nichts behaupten, was nicht im Diff steht.
- Ob KI-Beteiligung gekennzeichnet wird, regelt euer Team – verantwortlich bist immer du.
