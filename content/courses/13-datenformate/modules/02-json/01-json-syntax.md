---
title: Die Syntax von JSON
summary: Die wenigen, aber strengen Regeln von JSON – und die Fehler, über die fast jede:r einmal stolpert.
duration: 20
sources:
  - title: RFC 8259 – The JSON Data Interchange Format
    url: https://www.rfc-editor.org/rfc/rfc8259
  - title: json.org – Introducing JSON (mit Syntaxdiagrammen)
    url: https://www.json.org/json-de.html
  - title: MDN – JSON
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON
quiz:
  - type: find-bug
    question: In welcher Zeile ist dieses JSON ungültig?
    language: json
    code: |
      {
        "name": "mein-shop",
        "private": true,
        "keywords": ["shop", "demo"],
        "port": 8080,
      }
    bug_line: 5
    explanation: Nach dem letzten Schlüssel-Wert-Paar darf kein Komma stehen. In JavaScript ist dieses „trailing comma“ erlaubt, in JSON nicht.
  - type: find-bug
    question: Und hier? Ein Parser meldet einen Fehler – in welcher Zeile?
    language: json
    code: |
      {
        "user": "ada",
        "rolle": 'admin',
        "aktiv": true
      }
    bug_line: 3
    explanation: Strings stehen in JSON immer in doppelten Anführungszeichen. 'admin' mit einfachen Anführungszeichen ist ungültig.
  - type: multiple
    question: Welche Zeilen sind gültige JSON-Werte?
    options:
      - "\"Grüße aus Musterstadt\""
      - "TRUE"
      - "-0.25"
      - "[1, \"zwei\", null, {\"drei\": 3}]"
      - "undefined"
    answers: [0, 2, 3]
    explanation: Boolean-Werte werden klein geschrieben (true), undefined gibt es in JSON nicht. Arrays dürfen unterschiedliche Typen mischen, Umlaute sind in UTF-8 erlaubt.
  - type: cloze
    text: "Ein Anführungszeichen innerhalb eines Strings schreibst du als ___. Einen Zeilenumbruch als ___."
    blanks:
      - ['\"']
      - ['\n']
    explanation: "Sonderzeichen werden mit einem Backslash escaped: \\\" für ein Anführungszeichen, \\n für einen Zeilenumbruch und \\\\ für einen Backslash."
tasks:
  - id: json-reparieren
    type: terminal
    title: Eine kaputte Konfiguration reparieren
    description: |
      Im Ordner `json-syntax` liegt `app.json`, die Konfiguration einer kleinen App. Sie enthält **sieben**
      Syntaxfehler. Ein strenger Parser (`JSON.parse` in Node.js) lehnt sie deshalb ab.

      1. Prüfe die Datei mit `node -e 'JSON.parse(require("fs").readFileSync("app.json", "utf8"))'` – die
         Fehlermeldung zeigt dir die Position.
      2. Repariere die Fehler einen nach dem anderen (z. B. mit `nano app.json`).
      3. Die **Werte** sollen dabei erhalten bleiben: `port` ist die Zahl 8080, `debug` ist der Boolean
         `true`, `timeout` ist die Zahl 0.5 und `features` enthält zwei Einträge.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: json-syntax
    setup: |
      cat > app.json <<'JSON'
      {
        name: "mein-shop",
        'version': "1.0.0",
        "port": 08080,
        "debug": True,
        "features": ["login", "warenkorb",],
        "owner": {"email": "team@example.com"}
        "timeout": .5
      }
      JSON
    checks:
      - type: command
        run: node -e 'JSON.parse(require("fs").readFileSync("app.json", "utf8"))' && echo ok
        stdout_equals: ok
        message: app.json ist noch kein gültiges JSON. Starte den Prüfbefehl aus Schritt 1 und repariere die gemeldete Stelle.
      - type: command
        run: jq -r '[.name, .version, .owner.email] | join(" ")' app.json
        stdout_equals: mein-shop 1.0.0 team@example.com
        message: name, version und owner.email sollen ihre ursprünglichen Werte behalten.
      - type: command
        run: jq -c '[.port, .debug, .timeout, (.features | length)]' app.json
        stdout_equals: "[8080,true,0.5,2]"
        message: port soll die Zahl 8080 sein (ohne führende Null), debug der Boolean true (klein geschrieben), timeout die Zahl 0.5 und features zwei Einträge haben.
      - type: command
        run: jq -r '[(.port | type), (.debug | type)] | join(" ")' app.json
        stdout_equals: number boolean
        message: port muss eine Zahl und debug ein Boolean sein – ohne Anführungszeichen.
    hints:
      - "Typische Kandidaten: Schlüssel ohne oder mit einfachen Anführungszeichen, ein Komma zu viel, ein Komma zu wenig."
      - "Zahlen dürfen in JSON nicht mit 0 beginnen (außer 0 selbst) und nicht mit einem Punkt. Boolean-Werte schreibst du klein."
      - "Nach `\"owner\": {…}` fehlt ein Komma, nach `\"warenkorb\"` steht eins zu viel."
    solution: |
      ```json
      {
        "name": "mein-shop",
        "version": "1.0.0",
        "port": 8080,
        "debug": true,
        "features": ["login", "warenkorb"],
        "owner": {"email": "team@example.com"},
        "timeout": 0.5
      }
      ```
  - id: gueltig-ungueltig
    type: dragdrop
    title: Gültig oder ungültig?
    description: Ordne jedes Schnipsel zu. Stell dir vor, es steht allein als ganze JSON-Datei da.
    targets:
      - { id: gueltig, label: Gültiges JSON }
      - { id: ungueltig, label: Ungültiges JSON }
    items:
      - { label: '{"a": 1}', target: gueltig }
      - { label: '"nur ein Text"', target: gueltig }
      - { label: "[]", target: gueltig }
      - { label: '{"pfad": "C:\\Users"}', target: gueltig }
      - { label: "{a: 1}", target: ungueltig }
      - { label: '{"a": NaN}', target: ungueltig }
      - { label: '{"a": 1 /* Kommentar */}', target: ungueltig }
      - { label: '[1, 2, 3,]', target: ungueltig }
    hints:
      - Eine JSON-Datei darf auch nur aus einem einzelnen Wert bestehen, etwa einem String oder einem leeren Array.
      - Ein Backslash wird als \\ geschrieben – das ist also korrekt escaped.
---
JSON sieht aus wie ein JavaScript-Objekt, ist aber viel strenger. Ein einziges Komma zu viel, und dein Build
bricht ab, die API antwortet mit `400 Bad Request` oder `npm install` verweigert die `package.json`. Die gute
Nachricht: Die Regeln passen auf eine Seite.

## Die Regeln im Überblick

[[json|JSON]] (*JavaScript Object Notation*) ist im Standard RFC 8259 festgelegt. Eine JSON-Datei enthält
genau **einen** Wert. Meist ist das ein Objekt oder ein Array, erlaubt ist aber auch ein einzelner String.

| Element | Schreibweise | Beispiel |
|---|---|---|
| Objekt | `{ }`, Paare mit `,` getrennt | `{"a": 1, "b": 2}` |
| Array | `[ ]`, Werte mit `,` getrennt | `[1, 2, 3]` |
| Schlüssel | **immer** String in `"…"` | `"name"` |
| String | doppelte Anführungszeichen | `"Ada"` |
| Number | dezimal, optional `-`, `.` und `e` | `-1.5`, `2e3` |
| Boolean / null | klein geschrieben | `true`, `false`, `null` |

[[einrueckung|Einrückung]] und Leerzeichen zwischen den Elementen sind egal. Diese beiden Varianten sind
gleichwertig:

```json
{"name":"Ada","skills":["php","sql"]}
```

```json
{
  "name": "Ada",
  "skills": ["php", "sql"]
}
```

Die zweite Variante nennt man [[pretty-print|pretty-printed]] – sie ist für Menschen gemacht, die erste spart
Platz.

> [!MERKSATZ]
> JSON kennt nur doppelte Anführungszeichen, keine Kommentare und kein Komma nach dem letzten Element.

## Strings und Escaping

Ein String steht zwischen doppelten Anführungszeichen. Manche Zeichen darfst du darin nicht direkt
schreiben, sondern musst sie mit einem Backslash *escapen* ([[escaping|Escaping]]):

| Zeichen | Im JSON-String |
|---|---|
| Anführungszeichen `"` | `\"` |
| Backslash `\` | `\\` |
| Zeilenumbruch | `\n` |
| Tabulator | `\t` |
| beliebiges Unicode-Zeichen | `\u00fc` (das ist „ü“) |

```json
{"zitat": "Sie sagte: \"Hallo\"", "pfad": "C:\\Users\\ada"}
```

Umlaute und Emojis darfst du direkt schreiben, wenn die Datei in [[zeichenkodierung|UTF-8]] gespeichert ist –
und das schreibt der Standard für den Austausch zwischen Systemen vor.

## Zahlen: strenger als gedacht

Zahlen sehen harmlos aus, haben aber eigene Regeln:

- keine führenden Nullen: `8080` ja, `08080` nein,
- kein Punkt am Anfang oder Ende: `0.5` ja, `.5` und `5.` nein,
- kein `+` vorne, keine Hex-Zahlen wie `0xFF`,
- kein `NaN` und kein `Infinity`.

JSON hat nur **einen** Zahlentyp. Ob daraus eine Ganzzahl oder eine Kommazahl wird, entscheidet das
Programm beim Einlesen. Sehr große Ganzzahlen (über 2^53) verlieren in JavaScript an Genauigkeit – IDs wie
`9007199254740993` überträgst du deshalb besser als String.

> [!FEHLER]
> **Zahlen in Anführungszeichen.** `"port": "8080"` ist gültiges JSON, aber ein String. Wer damit rechnet oder
> vergleicht (`port === 8080`), bekommt falsche Ergebnisse. Prüfe den Typ, nicht nur den Wert.

## Die häufigsten Fehler

Diese Fehler entstehen fast immer, wenn jemand JSON von Hand bearbeitet:

| Fehler | Falsch | Richtig |
|---|---|---|
| [[trailing-comma\|Komma am Ende]] | `[1, 2,]` | `[1, 2]` |
| Komma vergessen | `{"a": 1 "b": 2}` | `{"a": 1, "b": 2}` |
| einfache Anführungszeichen | `{'a': 1}` | `{"a": 1}` |
| Schlüssel ohne Anführungszeichen | `{a: 1}` | `{"a": 1}` |
| Kommentar | `// Test` | weglassen |
| großgeschriebene Literale | `True`, `NULL` | `true`, `null` |

Zum Prüfen genügt im Terminal [[jq]]: `jq . datei.json` gibt die Datei schön formatiert aus – oder eine
Fehlermeldung mit Zeile und Spalte.

```bash title="Terminal"
$ jq . kaputt.json
jq: parse error: Expected another array element at line 3, column 18
```

> [!ACHTUNG]
> jq ist an manchen Stellen großzügiger als der Standard: `NaN`, `.5` oder `08080` akzeptiert es ohne
> Meckern. Für eine strenge Prüfung nimm `JSON.parse` in Node.js oder `json_validate()` in PHP.

> [!PRAXIS]
> Dateien wie `tsconfig.json` erlauben Kommentare und Kommas am Ende – das ist **nicht** reines JSON, sondern
> eine Variante namens JSONC. Was in der einen Datei funktioniert, kann in `package.json` den Build brechen.

## Zusammenfassung

- Eine JSON-Datei enthält genau einen Wert: Objekt, Array oder Skalar.
- Schlüssel und Strings stehen immer in **doppelten** Anführungszeichen.
- Kein Komma nach dem letzten Element, keine Kommentare, `true`/`false`/`null` klein geschrieben.
- Sonderzeichen in Strings werden mit `\` escaped: `\"`, `\\`, `\n`.
- Zahlen ohne führende Null, ohne `NaN`/`Infinity`; große IDs besser als String.
- `jq . datei.json` zeigt Syntaxfehler mit Zeilennummer, `JSON.parse` prüft noch strenger.
