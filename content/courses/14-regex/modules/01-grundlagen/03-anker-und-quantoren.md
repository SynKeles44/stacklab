---
title: Anker und Quantoren
summary: "Wie oft darf ein Zeichen vorkommen – und wo genau? Quantoren wie +, * und {n,m} und Anker wie ^, $ und \\b machen Muster präzise."
duration: 25
sources:
  - title: MDN – Quantoren
    url: https://developer.mozilla.org/de/docs/Web/JavaScript/Guide/Regular_expressions/Quantifiers
  - title: MDN – Assertions (Anker und Wortgrenzen)
    url: https://developer.mozilla.org/de/docs/Web/JavaScript/Guide/Regular_expressions/Assertions
  - title: PHP-Handbuch – Wiederholungen
    url: https://www.php.net/manual/de/regexp.reference.repetition.php
quiz:
  - type: match
    question: Ordne jedem Quantor zu, wie oft das Zeichen davor vorkommen darf.
    pairs:
      - { left: "*", right: "0-mal oder öfter" }
      - { left: "+", right: "1-mal oder öfter" }
      - { left: "?", right: "0- oder 1-mal" }
      - { left: "{3}", right: "genau 3-mal" }
      - { left: "{2,4}", right: "2- bis 4-mal" }
    explanation: Ein Quantor wirkt immer auf das Element direkt davor – ein Zeichen, eine Klasse oder eine Gruppe.
  - type: single
    question: "Warum reicht `/\\d{5}/` nicht aus, um eine Postleitzahl zu **prüfen**?"
    options:
      - Weil \d auch Buchstaben erlaubt
      - Weil das Muster auch in „123456“ oder „PLZ 12345 alt“ einen Treffer findet
      - Weil {5} „mindestens 5“ bedeutet
    answer: 1
    explanation: "Ohne Anker sucht die Engine fünf Ziffern **irgendwo** im Text. Erst `^\\d{5}$` verlangt, dass der ganze Text aus genau fünf Ziffern besteht."
  - type: multiple
    question: "In welchen Texten findet `/\\bcat\\b/` einen Treffer?"
    options: ["the cat sleeps", "concatenate", "cat", "cats", "(cat)"]
    answers: [0, 2, 4]
    explanation: "`\\b` markiert eine Wortgrenze. In „concatenate“ und „cats“ grenzt „cat“ auf einer Seite an weitere Wortzeichen. Klammern zählen dagegen nicht als Wortzeichen."
  - type: find-bug
    question: Die Funktion soll Benutzernamen aus 3 bis 12 Kleinbuchstaben akzeptieren – sie akzeptiert aber auch „ada!!!“. In welcher Zeile steckt der Fehler?
    language: js
    code: |
      function istBenutzername(name) {
        const muster = /^[a-z]{3,12}/;
        return muster.test(name);
      }
      console.log(istBenutzername("ada!!!"));
    bug_line: 2
    explanation: "Der Anker `$` am Ende fehlt. So prüft das Muster nur, ob der Name mit 3 bis 12 Kleinbuchstaben **beginnt**. Richtig: `/^[a-z]{3,12}$/`."
  - type: cloze
    text: "Das Muster `colou___r` passt auf „color“ und „colour“. Das Muster `ha___!` passt auf „ha!“, „haa!“, „haaa!“ – aber nicht auf „h!“."
    blanks:
      - ["?"]
      - ["+"]
    explanation: "`?` macht das u optional, `+` verlangt mindestens ein a."
tasks:
  - id: eingaben-pruefen
    type: code
    language: js
    title: Postleitzahl und Benutzername prüfen
    description: |
      Schreibe zwei Prüffunktionen, die `true` oder `false` zurückgeben. Der **ganze** Text muss passen.

      1. `istPostleitzahl(text)` – genau fünf Ziffern, z. B. `37073`.
      2. `istBenutzername(text)` – 3 bis 16 Zeichen lang, beginnt mit einem Kleinbuchstaben, danach nur
         Kleinbuchstaben, Ziffern oder Unterstriche. Beispiele: `ada`, `max_99`. Nicht erlaubt: `9lives`,
         `Ada`, `al`.
    starter: |
      function istPostleitzahl(text) {
        return /\d/.test(text);
      }

      function istBenutzername(text) {
        return /[a-z]/.test(text);
      }
    tests:
      - name: Gültige Postleitzahl
        code: assertTrue(istPostleitzahl("37073"))
      - name: Zu kurze, zu lange oder eingebettete Postleitzahlen sind ungültig
        code: |
          assertEqual(istPostleitzahl("3707"), false)
          assertEqual(istPostleitzahl("370731"), false)
          assertEqual(istPostleitzahl("PLZ 37073"), false)
          assertEqual(istPostleitzahl(""), false)
      - name: Gültige Benutzernamen
        code: |
          assertTrue(istBenutzername("ada"))
          assertTrue(istBenutzername("max_99"))
          assertTrue(istBenutzername("a234567890123456"))
      - name: Ungültige Benutzernamen
        code: |
          assertEqual(istBenutzername("al"), false)
          assertEqual(istBenutzername("9lives"), false)
          assertEqual(istBenutzername("Ada"), false)
          assertEqual(istBenutzername("ada!"), false)
          assertEqual(istBenutzername("a2345678901234567"), false)
    hints:
      - "Beide Muster brauchen `^` am Anfang und `$` am Ende."
      - "Postleitzahl: eine Ziffer mit dem Quantor `{5}`."
      - "Benutzername: erst `[a-z]`, dann `[a-z0-9_]{2,15}` – zusammen 3 bis 16 Zeichen."
    solution: |
      ```js
      function istPostleitzahl(text) {
        return /^\d{5}$/.test(text);
      }

      function istBenutzername(text) {
        return /^[a-z][a-z0-9_]{2,15}$/.test(text);
      }
      ```
  - id: ips-und-kaputte-zeilen
    type: terminal
    title: IP-Adressen und kaputte Zeilen finden
    description: |
      Im Ordner `anker-uebung` liegt wieder die Logdatei `app.log`. Gültige Zeilen beginnen mit einem Datum
      wie `2026-10-01`.

      1. Schreibe alle Zeilen, die **nicht** mit einem Datum im Format `JJJJ-MM-TT` beginnen, in
         `kaputt.txt`.
      2. Schreibe **nur die IP-Adressen** (z. B. `192.0.2.15`) aus dem Log in `ips.txt` – eine pro Zeile,
         ohne den Rest der Zeile. Doppelte Adressen dürfen doppelt vorkommen.

      Nutze `grep -E` (erweiterte Regex). Denk daran: `grep -E` kennt `\d` nicht.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit die Logdatei angelegt wird.
    workdir: anker-uebung
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
        path: kaputt.txt
        message: Die Datei kaputt.txt fehlt noch.
      - type: command
        run: cat kaputt.txt
        stdout_equals: "WARNING: disk almost full"
        message: kaputt.txt soll genau die eine Zeile ohne Datum am Anfang enthalten. Nutze grep -vE mit dem Anker ^.
      - type: file_exists
        path: ips.txt
        message: Die Datei ips.txt fehlt noch.
      - type: command
        run: wc -l < ips.txt
        stdout_matches: "^\\s*4\\s*$"
        message: Im Log stehen 4 IP-Adressen (eine davon zweimal). ips.txt soll genau diese 4 Zeilen enthalten.
      - type: command
        run: grep -cvE '^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$' ips.txt
        stdout_equals: "0"
        expect_exit: 1
        message: Jede Zeile in ips.txt darf nur die IP-Adresse enthalten – nutze grep -o, damit nur der Treffer ausgegeben wird.
      - type: command
        run: sort -u ips.txt | tr '\n' ' '
        stdout_matches: "^192\\.0\\.2\\.15 198\\.51\\.100\\.7 203\\.0\\.113\\.9$"
        message: In ips.txt fehlen Adressen oder es stehen falsche darin. Erwartet sind 192.0.2.15, 198.51.100.7 und 203.0.113.9.
    hints:
      - "`grep -v` gibt die Zeilen aus, die **nicht** passen. `grep -o` gibt nur den passenden Teil aus."
      - "Datum am Zeilenanfang: `^[0-9]{4}-[0-9]{2}-[0-9]{2}`."
      - "IP-Adresse: vier Blöcke aus 1–3 Ziffern, getrennt durch escapte Punkte: `[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}`."
    solution: |
      ```bash
      cd anker-uebung
      grep -vE '^[0-9]{4}-[0-9]{2}-[0-9]{2}' app.log > kaputt.txt
      grep -oE '[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}' app.log > ips.txt
      cat kaputt.txt ips.txt
      ```
---
`/\d/` findet eine Ziffer. Aber eine Postleitzahl hat **fünf** – und sie soll allein im Eingabefeld stehen,
nicht irgendwo in „PLZ 12345 und mehr“. Dir fehlen zwei Werkzeuge: eines für das **Wie oft** und eines für
das **Wo**.

## Wie oft? Quantoren

Ein [[quantor|Quantor]] steht **hinter** einem Element und sagt, wie oft es vorkommen darf:

| Quantor | Bedeutung | Beispiel | passt auf |
|---|---|---|---|
| `*` | 0-mal oder öfter | `ab*c` | ac, abc, abbbc |
| `+` | 1-mal oder öfter | `ab+c` | abc, abbbc (nicht ac) |
| `?` | 0- oder 1-mal (optional) | `colou?r` | color, colour |
| `{n}` | genau n-mal | `\d{4}` | 2026 |
| `{n,}` | mindestens n-mal | `\d{2,}` | 42, 1000 |
| `{n,m}` | n- bis m-mal | `\d{1,3}` | 7, 42, 255 |

```js run
console.log("Bestellung B-1042".match(/B-\d+/)[0]);  // "B-1042"
console.log(/colou?r/.test("color"));               // true
console.log(/\d{4}/.test("Jahr 99"));               // false
```

> [!MERKSATZ]
> Ein Quantor wirkt auf **genau das Element davor** – ein Zeichen, eine Klasse oder (ab Modul 2) eine
> Gruppe. In `ab+` wiederholt sich nur das `b`, nicht „ab“.

## Quantoren richtig kombinieren

Mit Klassen und Quantoren beschreibst du schon viele echte Formate:

| Format | Muster |
|---|---|
| Hex-Farbe `#1e1b3a` | `#[0-9a-fA-F]{6}` |
| Uhrzeit `08:15` (grob) | `\d{2}:\d{2}` |
| Preis `12,99` | `\d+,\d{2}` |
| Wort aus Kleinbuchstaben | `[a-z]+` |

Vorsicht mit `*`: Weil es auch **null** Vorkommen erlaubt, passt `\d*` auf **jeden** Text – notfalls auf
die leere Stelle ganz am Anfang.

```js run
console.log(/\d*/.test("keine Zahl"));   // true – null Ziffern sind auch "passend"
console.log(/\d+/.test("keine Zahl"));   // false
```

## Anker: Anfang und Ende

[[anker|Anker]] passen auf **kein** Zeichen, sondern auf eine **Position**:

- `^` – der Anfang des Textes
- `$` – das Ende des Textes

```js run
console.log(/\d{5}/.test("PLZ 370731"));   // true  – fünf Ziffern irgendwo
console.log(/^\d{5}$/.test("370731"));     // false – sechs Ziffern
console.log(/^\d{5}$/.test("37073"));      // true
```

Erst `^…$` bedeutet: Der **gesamte** Text muss dem Muster entsprechen. Genau das brauchst du, wenn du eine
Eingabe **prüfst** (validierst). Zum **Suchen** in längeren Texten lässt du die Anker weg.

> [!FEHLER]
> **Validieren ohne Anker.** `/[a-z]{3,12}/` akzeptiert auch „ada!!!“, weil am Anfang drei Kleinbuchstaben
> stehen. In Formularen führt das zu Daten, die später an ganz anderer Stelle Fehler auslösen.

## Wortgrenzen mit \b

Die [[wortgrenze|Wortgrenze]] `\b` ist ebenfalls ein Anker. Sie passt an jede Stelle, an der ein
Wortzeichen (`\w`) auf ein Nicht-Wortzeichen trifft – oder auf Textanfang/-ende.

| Text | `/cat/` | `/\bcat\b/` |
|---|---|---|
| the cat sleeps | Treffer | Treffer |
| concatenate | Treffer | kein Treffer |
| cats | Treffer | kein Treffer |
| (cat) | Treffer | Treffer |

```bash title="Terminal – grep kennt \b ebenfalls"
grep -E '\buser\b' app.log
```

> [!TIPP]
> `grep -w muster` ist eine Abkürzung: Das ganze Muster muss als eigenes Wort vorkommen.

## Im Terminal: nur den Treffer ausgeben

`grep` gibt normalerweise die **ganze Zeile** aus. Mit drei Schaltern steuerst du, was du siehst:

| Option | Wirkung |
|---|---|
| `-E` | erweiterte Regex – `+`, `?`, `{n,m}` ohne Backslash |
| `-o` | nur den passenden Teil ausgeben, jeden Treffer in eine eigene Zeile |
| `-v` | Zeilen ausgeben, die **nicht** passen |

```bash title="Terminal"
grep -oE '[0-9]+ms' app.log                       # 87ms, 312ms, …
grep -vE '^[0-9]{4}-[0-9]{2}-[0-9]{2}' app.log    # Zeilen ohne Datum am Anfang
```

> [!PRAXIS]
> `grep -oE` ist ein Schweizer Taschenmesser bei der Fehlersuche: Mit
> `grep -oE 'took [0-9]+ms' app.log | sort | uniq -c` siehst du in Sekunden, welche Antwortzeiten wie oft
> vorkommen – ganz ohne Skript.

## Zusammenfassung

- Quantoren `* + ? {n} {n,} {n,m}` legen fest, wie oft das Element **davor** vorkommt.
- `*` erlaubt null Vorkommen – `\d*` passt deshalb auf jeden Text.
- `^` und `$` verankern das Muster an Anfang und Ende; zum Validieren brauchst du beide.
- `\b` markiert Wortgrenzen; `grep -w` prüft ganze Wörter.
- Im Terminal helfen `grep -E` (erweiterte Regex), `-o` (nur Treffer) und `-v` (Gegenteil).
