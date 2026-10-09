---
title: Was sind reguläre Ausdrücke?
summary: Ein Muster statt eines festen Suchworts – was Regex sind, wie Literale und Metazeichen funktionieren und wann du besser zu einem anderen Werkzeug greifst.
duration: 20
sources:
  - title: MDN – Reguläre Ausdrücke (Leitfaden)
    url: https://developer.mozilla.org/de/docs/Web/JavaScript/Guide/Regular_expressions
  - title: PHP-Handbuch – Reguläre Ausdrücke (PCRE)
    url: https://www.php.net/manual/de/book.pcre.php
  - title: GNU grep Manual – Regular Expressions
    url: https://www.gnu.org/software/grep/manual/grep.html#Regular-Expressions
quiz:
  - type: single
    question: "Auf welche Stelle im Text `Concatenate the cat` passt das Muster `/cat/` zuerst?"
    options:
      - Auf „cat“ ganz am Ende
      - Auf „cat“ in „Concatenate“
      - Auf „Cat“ – Groß- und Kleinschreibung ist egal
      - Auf gar nichts, weil „cat“ kein ganzes Wort ist
    answer: 1
    explanation: Die Engine sucht von links nach rechts und meldet den ersten Treffer. „cat“ steckt schon in „Concatenate“ – ob es ein ganzes Wort ist, spielt ohne zusätzliche Regeln keine Rolle.
  - type: multiple
    question: Welche Zeichen sind Metazeichen und brauchen einen Backslash, wenn du sie wörtlich meinst?
    options: [".", "a", "?", "(", "-", "+"]
    answers: [0, 2, 3, 5]
    explanation: "Punkt, Fragezeichen, runde Klammer und Plus haben eine Sonderbedeutung. Buchstaben stehen für sich selbst, und der Bindestrich ist außerhalb eckiger Klammern ein ganz normales Zeichen."
  - type: cloze
    text: "Um einen wörtlichen Punkt zu finden, stellst du einen ___ davor. Ohne ihn passt der Punkt auf ___ Zeichen."
    blanks:
      - [Backslash, "\\", Rückstrich]
      - [jedes, ein beliebiges, beliebiges, jedes beliebige, alle]
    explanation: "Der Backslash nimmt dem Punkt seine Sonderbedeutung. `3\\.50` passt nur auf „3.50“, `3.50` dagegen auch auf „3550“ oder „3x50“."
  - type: match
    question: Welches Werkzeug passt am besten zu welcher Aufgabe?
    pairs:
      - { left: "Prüfen, ob ein Text „Fehler“ enthält", right: "includes() bzw. str_contains()" }
      - { left: "Alle Bestellnummern wie B-1234 finden", right: "Regulärer Ausdruck" }
      - { left: "Einen Wert aus einer JSON-Antwort lesen", right: "JSON-Parser (JSON.parse, json_decode)" }
    explanation: Für eine feste Zeichenkette reicht eine einfache Suchfunktion, für strukturierte Formate ein Parser. Regex spielen ihre Stärke bei Mustern mit variablem Inhalt aus.
  - type: find-bug
    question: Das Skript soll nur Zeilen mit dem Preis „9.99“ finden, findet aber auch „9199“. In welcher Zeile steckt der Fehler?
    language: js
    code: |
      const zeilen = ["Preis 9.99", "Artikel 9199", "Preis 4.50"];
      const muster = /9.99/;
      const treffer = zeilen.filter((z) => muster.test(z));
      console.log(treffer);
    bug_line: 2
    explanation: "Der Punkt ist ein Metazeichen und passt auf jedes Zeichen – also auch auf die 1 in „9199“. Richtig wäre `/9\\.99/`."
tasks:
  - id: metazeichen-escapen
    type: code
    language: js
    title: Drei Muster mit Metazeichen
    description: |
      Schreibe drei reguläre Ausdrücke als JavaScript-Literale (zwischen zwei Schrägstrichen). Jeder soll den
      angegebenen Text **wörtlich** finden – auch wenn er Metazeichen enthält.

      1. `version` findet `v1.2` – aber **nicht** `v152`.
      2. `frage` findet `Wirklich?` – aber **nicht** `Wirklic`.
      3. `beta` findet `(Beta)` mit Klammern – aber **nicht** `Beta` ohne Klammern.

      Tipp: Mit `muster.test(text)` prüfst du, ob ein Muster irgendwo im Text vorkommt.
    starter: |
      const version = /v1.2/;
      const frage = /Wirklich?/;
      const beta = /(Beta)/;

      console.log(version.test("Update auf v152"));
    tests:
      - name: version findet v1.2
        code: assertTrue(version.test("Update auf v1.2 ist fertig"))
      - name: version findet v152 nicht
        code: assertEqual(version.test("Update auf v152"), false)
      - name: frage braucht das Fragezeichen
        code: |
          assertTrue(frage.test("Wirklich?"))
          assertEqual(frage.test("Wirklic"), false)
      - name: beta braucht die Klammern
        code: |
          assertTrue(beta.test("Neue Suche (Beta)"))
          assertEqual(beta.test("Neue Suche Beta"), false)
      - name: Leerer Text passt auf keines der Muster
        code: assertEqual([version, frage, beta].some((m) => m.test("")), false)
    hints:
      - Welche Zeichen in den drei Texten haben in einer Regex eine Sonderbedeutung?
      - "Punkt, Fragezeichen und runde Klammern sind Metazeichen. Ein Backslash davor macht sie zu normalen Zeichen."
      - "`/v1\\.2/`, `/Wirklich\\?/` und `/\\(Beta\\)/`"
    solution: |
      ```js
      const version = /v1\.2/;
      const frage = /Wirklich\?/;
      const beta = /\(Beta\)/;
      ```
  - id: warnungen-finden
    type: terminal
    title: Echte Warnungen aus dem Log holen
    description: |
      Im Ordner `erste-suche` liegt die Logdatei `app.log` einer kleinen Web-Anwendung. Jede Zeile hat ein
      Level in eckigen Klammern, z. B. `[INFO]` oder `[WARN]`. Ganz unten hat sich außerdem eine Zeile ohne
      dieses Format eingeschlichen.

      1. Schau dir die Datei mit `cat app.log` an.
      2. Probiere `grep 'WARN' app.log` – wie viele Zeilen erscheinen?
      3. Schreibe **nur** die Zeilen mit dem Level `[WARN]` in die Datei `warnungen.txt`. Die Zeile, die nur
         das Wort „WARNING“ enthält, gehört **nicht** dazu.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit die Logdatei angelegt wird.
    workdir: erste-suche
    setup: |
      cat > app.log <<'LOG'
      2026-10-01 08:00:01 [INFO] auth: User 1042 logged in from 192.0.2.15
      2026-10-01 08:00:07 [INFO] http: GET /products 200 took 87ms
      2026-10-01 08:01:13 [WARN] cache: Miss for key product:77 took 312ms
      2026-10-01 08:02:45 [ERROR] db: Query timeout after 5000ms
      2026-10-01 08:03:02 [INFO] http: GET /cart 200 took 45ms
      2026-10-01 08:03:10 [ERROR] payment: Card declined for order 5531
      2026-10-01 08:04:22 [INFO] auth: User 2210 logged in from 198.51.100.7
      2026-10-01 08:05:00 [WARN] http: GET /search 200 took 1450ms
      2026-10-01 08:05:31 [ERROR] db: Query timeout after 5000ms
      2026-10-01 08:06:12 [INFO] http: POST /orders 201 took 230ms
      2026-10-01 08:06:13 [INFO] mail: Sent confirmation to user@example.com
      2026-10-01 08:07:40 [ERROR] payment: Card declined for order 5540
      2026-10-01 08:08:05 [WARN] auth: Failed login for user 1042 from 203.0.113.9
      2026-10-01 08:08:09 [WARN] auth: Failed login for user 1042 from 203.0.113.9
      2026-10-01 08:09:55 [ERROR] db: Query timeout after 7500ms
      2026-10-01 08:10:30 [INFO] http: GET /products 200 took 92ms
      2026-10-01 08:11:02 [DEBUG] cache: Warmup finished
      2026-10-01 08:11:47 [ERROR] http: GET /checkout 500 took 3021ms
      WARNING: disk almost full
      2026-10-01 08:12:00 [INFO] auth: User 2210 logged out
      LOG
    checks:
      - type: file_exists
        path: warnungen.txt
        message: Die Datei warnungen.txt fehlt noch. Leite die Ausgabe von grep mit `>` in die Datei um.
      - type: command
        run: wc -l < warnungen.txt
        stdout_matches: "^\\s*4\\s*$"
        message: warnungen.txt soll genau 4 Zeilen enthalten – die vier Zeilen mit dem Level [WARN].
      - type: command
        run: grep -c 'WARNING' warnungen.txt
        expect_exit: 1
        message: Die Zeile „WARNING disk almost full“ gehört nicht in warnungen.txt. Suche nach [WARN] mit den eckigen Klammern.
      - type: command
        run: grep -c '\[WARN\]' warnungen.txt
        stdout_equals: "4"
        message: Jede Zeile in warnungen.txt muss das Level [WARN] enthalten.
    hints:
      - "`grep 'WARN'` findet auch „WARNING“. Was unterscheidet die echten Warnungen? Die eckigen Klammern."
      - "Eckige Klammern sind Metazeichen. `grep '[WARN]'` sucht nach *einem* der Buchstaben W, A, R oder N – das ist fast jede Zeile."
      - "Mit Backslashes werden die Klammern wörtlich: `grep '\\[WARN\\]' app.log > warnungen.txt`"
    solution: |
      ```bash
      cd erste-suche
      grep 'WARN' app.log            # 5 Zeilen – eine davon ist falsch
      grep '\[WARN\]' app.log > warnungen.txt
      cat warnungen.txt
      ```
---
Stell dir eine [[logdatei|Logdatei]] mit 5000 Zeilen vor. Du sollst alle Bestellnummern heraussuchen – sie sehen aus wie
`B-1042`, `B-7719` oder `B-5531`. Mit Strg+F suchst du nach einem **festen** Text. Du kennst aber keine
einzige Nummer, nur ihren **Aufbau**: „B, Bindestrich, vier Ziffern“. Genau dafür gibt es reguläre Ausdrücke.

## Ein Muster statt eines Wortes

Ein [[regex|regulärer Ausdruck]] (kurz *Regex*) ist eine Beschreibung, wie ein Text **aussehen** muss.
Denk an einen Steckbrief: Er nennt keinen Namen, sondern Merkmale wie „groß, roter Hut, Brille“. Jede
Person, auf die alle Merkmale passen, ist ein [[treffer|Treffer]].

```js
/B-\d{4}/
```

Gelesen heißt das: ein `B`, ein `-`, dann genau vier Ziffern. Die Bausteine `\d` und `{4}` lernst du in den
nächsten Lektionen kennen.

| Normale Suche | Regex-Suche |
|---|---|
| sucht genau `B-1042` | sucht alles in der Form `B-` + 4 Ziffern |
| ein Suchbegriff = ein Treffer-Text | ein Muster = beliebig viele Treffer-Texte |
| keine Sonderzeichen | Sonderzeichen beschreiben Regeln |

Ein Programm, das Muster auf Texte anwendet, heißt [[regex-engine|Regex-Engine]]. Sie steckt in
JavaScript, PHP, in `grep`, in deinem Editor und in fast jeder anderen Programmiersprache.

> [!MERKSATZ]
> Ein regulärer Ausdruck beschreibt **eine Menge von Texten**. Die Frage lautet immer: Passt das Muster
> irgendwo in diesen Text – und wenn ja, wo?

## Literale: Zeichen, die für sich selbst stehen

Die meisten Zeichen in einer Regex sind [[literal|Literale]]: Ein `c` passt auf ein `c`, eine `7` auf eine
`7`. Das Muster `cat` passt also auf die drei Buchstaben c, a, t direkt hintereinander.

```js run
const muster = /cat/;
console.log(muster.test("Concatenate"));   // true – steckt mittendrin
console.log(muster.test("Katze"));         // false
console.log(muster.test("CAT"));           // false – Großbuchstaben sind andere Zeichen
```

In JavaScript schreibst du eine Regex zwischen zwei Schrägstriche. `test()` liefert `true`, wenn das Muster
**irgendwo** im Text vorkommt.

Drei Grundregeln der Engine:

1. Sie liest den Text **von links nach rechts**.
2. Sie meldet den **ersten** Treffer (alle Treffer nur auf Wunsch).
3. Groß- und Kleinschreibung zählt – außer du sagst es ausdrücklich anders.

## Metazeichen und Escaping

Einige Zeichen haben eine Sonderbedeutung. Sie heißen [[metazeichen|Metazeichen]]:

```text
.  ^  $  *  +  ?  (  )  [  ]  {  }  |  \
```

Der Punkt `.` passt zum Beispiel auf **jedes beliebige Zeichen**. Willst du einen echten Punkt finden,
stellst du einen Backslash davor. Das nennt man [[escaping|Escaping]] (Maskieren).

```js run
console.log(/3.50/.test("3550"));    // true  – Punkt passt auf die 5
console.log(/3\.50/.test("3550"));   // false
console.log(/3\.50/.test("3.50"));   // true
```

| Du meinst wörtlich | Du schreibst |
|---|---|
| `.` | `\.` |
| `?` | `\?` |
| `(` und `)` | `\(` und `\)` |
| `[` | `\[` |
| `\` | `\\` |

> [!FEHLER]
> **Den Punkt vergessen zu escapen.** `/9.99/` findet auch „9199“ oder „9x99“. Solche Fehler fallen in
> Tests mit „schönen“ Beispielen nicht auf – teste deshalb immer auch Texte, die **nicht** passen dürfen.

## Wo dir Regex begegnen

Regex sind keine Spezialität einer Sprache. Du triffst sie überall:

| Ort | Beispiel |
|---|---|
| Editor/IDE | Suchen & Ersetzen mit „Regex“-Schalter |
| Terminal | [[grep]] und [[sed]] filtern und ändern Dateien |
| [[javascript|JavaScript]] | Formularfelder prüfen, Text umbauen |
| [[php|PHP]] | Eingaben [[validierung|validieren]], Logzeilen zerlegen |
| Konfiguration | Routen, Linter-Regeln, CI-Filter |

Die Schreibweisen ähneln sich stark, unterscheiden sich aber im Detail. Diese Familien heißen
*Dialekte*: JavaScript hat seinen eigenen, PHP nutzt [[pcre|PCRE]], und `grep -E` spricht
[[posix-ere|POSIX ERE]]. Den Kern – Literale, Klassen, Quantoren, Gruppen – lernst du einmal und nutzt
ihn überall.

> [!TIPP]
> Wenn ein Muster in einem Werkzeug nicht funktioniert, das woanders klappt, schau zuerst in die
> Dokumentation des Dialekts. Meist fehlt dort eine Kurzschreibweise wie `\d`.

## Wann du lieber keine Regex nimmst

Regex sind mächtig – und schnell unlesbar. Ein Muster ist nur dann die richtige Wahl, wenn der Text einen
**variablen** Aufbau hat, den du beschreiben kannst. Für viele Aufgaben gibt es bessere Werkzeuge:

| Aufgabe | Besser als Regex |
|---|---|
| Enthält der Text „Fehler“? | `text.includes("Fehler")`, `str_contains()` |
| [[json|JSON]] lesen | `JSON.parse()`, `json_decode()` |
| [[html|HTML]] auswerten | ein [[html-parser|HTML-Parser]] (DOM) |
| URL zerlegen | `new URL()`, `parse_url()` |
| Datum prüfen | Datumsfunktionen der Sprache |

> [!PRAXIS]
> In Code-Reviews lautet eine häufige Rückfrage: „Brauchen wir hier wirklich eine Regex?“ Eine einfache
> Funktion wie `startsWith()` ist schneller zu lesen, zu testen und zu ändern. Regex lohnen sich bei
> Mustern wie Bestellnummern, Logzeilen oder Datumsformaten.

## Zusammenfassung

- Ein regulärer Ausdruck beschreibt den **Aufbau** von Texten, nicht einen festen Text.
- Die meisten Zeichen sind **Literale** und stehen für sich selbst.
- **Metazeichen** wie `. ? ( ) [ ] *` haben eine Sonderbedeutung – mit `\` werden sie wörtlich.
- Die Engine sucht von links nach rechts und meldet den ersten Treffer; Groß-/Kleinschreibung zählt.
- Regex gibt es in Editoren, im Terminal, in JavaScript und PHP – in leicht unterschiedlichen Dialekten.
- Für feste Texte und strukturierte Formate (JSON, HTML, URLs) gibt es bessere Werkzeuge.
