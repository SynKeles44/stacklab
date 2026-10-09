---
title: Lesbar, getestet und sicher
summary: Wie katastrophales Backtracking einen Server lahmlegen kann (ReDoS), wie du gefährliche Muster erkennst und wie du Regex so schreibst und testest, dass dein Team sie versteht.
duration: 25
sources:
  - title: OWASP – Regular expression Denial of Service (ReDoS)
    url: https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS
  - title: PHP-Handbuch – Modifikatoren (x und D)
    url: https://www.php.net/manual/de/reference.pcre.pattern.modifiers.php
  - title: PHP-Handbuch – pcre.backtrack_limit
    url: https://www.php.net/manual/de/pcre.configuration.php
  - title: MDN – Quantoren
    url: https://developer.mozilla.org/de/docs/Web/JavaScript/Guide/Regular_expressions/Quantifiers
quiz:
  - type: multiple
    question: Welche Muster können auf ungünstige Eingaben mit katastrophalem Backtracking reagieren?
    options: ["^(a+)+$", "^(\\w+\\s?)*$", "^\\w+(\\s\\w+)*$", "^(a|aa)+$", "^[a-z]+$"]
    answers: [0, 1, 3]
    explanation: "Gefährlich sind verschachtelte Quantoren und Alternativen, die denselben Text auf viele Arten zerlegen können. `^\\w+(\\s\\w+)*$` ist eindeutig, weil jedes Wort zwingend mit einem Leerraum beginnt."
  - type: single
    question: Was ist ReDoS?
    options:
      - Ein Angriff, bei dem eine präparierte Eingabe eine Regex so lange rechnen lässt, dass der Dienst nicht mehr antwortet
      - Ein Fehler, der entsteht, wenn eine Regex zu viele Gruppen hat
      - Ein Werkzeug, mit dem man Regex debuggen kann
    answer: 0
    explanation: "ReDoS steht für Regular expression Denial of Service. Schon ein einzelner Request mit wenigen Dutzend Zeichen kann einen Prozess für Sekunden oder Minuten blockieren."
  - type: find-bug
    question: In welcher Zeile steckt das Sicherheitsproblem?
    language: js
    code: |
      app.post("/suche", (req, res) => {
        const begriff = req.body.begriff;
        const muster = new RegExp(begriff, "i");
        const treffer = artikel.filter((a) => muster.test(a.name));
        res.json(treffer);
      });
    bug_line: 3
    explanation: "Die Eingabe wird ungeprüft als Muster verwendet. Wer `(a+)+$` schickt, legt den Server lahm – und Metazeichen verfälschen die Suche. Für eine Textsuche escapt man die Eingabe oder nutzt `includes()`."
  - type: cloze
    text: "Der PHP-Modifikator ___ erlaubt Leerzeichen und Kommentare im Muster. Benannte ___ machen die Treffer selbsterklärend."
    blanks:
      - [x]
      - [Gruppen, Gruppe]
    explanation: "Mit `x` darfst du ein Muster auf mehrere Zeilen verteilen und mit `#` kommentieren. Benannte Gruppen ersetzen rätselhafte Nummern wie `$m[4]`."
tasks:
  - id: redos-entschaerfen
    type: code
    language: js
    title: Ein gefährliches Muster entschärfen
    description: |
      Ein Formular prüft, ob ein Feld aus Wörtern besteht, die durch **genau ein** Leerzeichen getrennt sind.
      Das aktuelle Muster `/^(\w+\s?)*$/` ist anfällig für katastrophales Backtracking. Bei einer Eingabe wie
      40-mal „a“ plus „!“ rechnet es praktisch endlos.

      Ersetze das Muster durch eine **eindeutige** Variante. Regeln:

      - mindestens ein Wort aus Wortzeichen (`\w`)
      - zwischen zwei Wörtern genau **ein** Leerzeichen
      - kein Leerzeichen am Anfang oder Ende

      Achtung: Mit dem Starter-Code laufen die Tests in das **Zeitlimit** – genau das ist das Problem, das du
      beheben sollst.
    starter: |
      const wortfolge = /^(\w+\s?)*$/;

      function istWortfolge(text) {
        return wortfolge.test(text);
      }
    tests:
      - name: Gültige Wortfolgen
        code: |
          assertTrue(istWortfolge("hallo"))
          assertTrue(istWortfolge("hallo welt"))
          assertTrue(istWortfolge("regex macht spass 2026"))
      - name: Leerer Text und falsche Leerzeichen sind ungültig
        code: |
          assertEqual(istWortfolge(""), false)
          assertEqual(istWortfolge("hallo  welt"), false)
          assertEqual(istWortfolge(" hallo"), false)
          assertEqual(istWortfolge("hallo "), false)
      - name: Böswillige Eingabe wird schnell abgelehnt
        code: |
          assertEqual(istWortfolge("a".repeat(40) + "!"), false)
          assertEqual(istWortfolge("wort ".repeat(2000) + "!"), false)
    hints:
      - "Das Problem: `(\\w+\\s?)*` kann „aaaa“ als ein Wort, zwei Wörter, drei Wörter … lesen – weil das Leerzeichen optional ist."
      - "Mach den Aufbau eindeutig: erst ein Wort, dann beliebig viele Gruppen aus **Pflicht**-Leerzeichen und Wort."
      - "`/^\\w+( \\w+)*$/`"
    solution: |
      ```js
      const wortfolge = /^\w+( \w+)*$/;

      function istWortfolge(text) {
        return wortfolge.test(text);
      }
      ```
  - id: gefaehrlich-oder-nicht
    type: steps
    title: Ist das Muster gefährlich?
    description: Entscheide für jede Situation, ob ein ReDoS-Risiko besteht und was zu tun ist.
    steps:
      - situation: "Ein Team prüft Gutscheincodes mit `/^[A-Z]{3}-\\d{4}$/`."
        question: Besteht ein Risiko für katastrophales Backtracking?
        options:
          - "Nein – feste Anzahlen, keine verschachtelten Quantoren"
          - "Ja – jede Regex ist gefährlich"
          - "Ja – wegen des Bindestrichs"
        answer: 0
        explanation: Das Muster hat für jede Stelle genau eine Möglichkeit. Die Engine braucht höchstens so viele Schritte wie der Text lang ist.
      - situation: "Eine Bibliothek validiert Domains mit `/^([a-z0-9]+-?)*\\.com$/` – und die Eingabe kommt direkt aus einem Formular."
        question: Wie schätzt du das ein?
        options:
          - "Ungefährlich, weil .com am Ende fest ist"
          - "Gefährlich: verschachtelter Quantor mit optionalem Trenner – lange Eingaben ohne .com können sehr lange rechnen"
          - "Gefährlich nur, wenn die Domain Großbuchstaben hat"
        answer: 1
        explanation: "`([a-z0-9]+-?)*` hat dasselbe Problem wie `(\\w+\\s?)*`. Ohne Bindestriche kann die Engine jede Zeichenfolge auf extrem viele Arten aufteilen."
      - situation: "Du hast das Domain-Muster zu `/^[a-z0-9]+(-[a-z0-9]+)*\\.com$/` umgebaut."
        question: Was machst du als Nächstes?
        options:
          - "Nichts – umgebaut ist umgebaut"
          - "Tests mit gültigen, ungültigen und sehr langen bösartigen Eingaben schreiben und zusätzlich die Eingabelänge begrenzen"
          - "Das Muster mit dem Flag g ergänzen"
        answer: 1
        explanation: Tests halten das Verhalten fest, eine Längenbegrenzung (z. B. 253 Zeichen für Domains) ist eine zweite Verteidigungslinie.
---
Ein Formularfeld, eine harmlose Regex – und plötzlich steht ein Server mit 100 % CPU-Last still. Der Grund war
kein Bug im klassischen Sinn, sondern eine Eingabe aus 40 Zeichen. Diese Lektion zeigt, wie das passiert, und
wie du Muster schreibst, die sicher **und** lesbar sind.

## Katastrophales Backtracking

Du kennst [[backtracking|Backtracking]]: Passt der Rest des Musters nicht, probiert die Engine eine andere
Aufteilung. Bei manchen Mustern gibt es **exponentiell viele** Aufteilungen.

```js
/^(a+)+$/.test("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!")   // rechnet sehr, sehr lange
```

Die Engine kann „aaaa“ als `(aaaa)`, `(aaa)(a)`, `(aa)(aa)`, `(a)(a)(a)(a)` … lesen. Erst wenn sie **alle**
Varianten probiert hat, steht fest: Wegen des `!` passt es nicht. Jedes weitere „a“ verdoppelt ungefähr die
Arbeit.

| Länge der Eingabe | Aufteilungen (ungefähr) |
|---|---|
| 10 | ca. 500 |
| 20 | ca. 500 000 |
| 30 | ca. 500 Millionen |
| 40 | ca. 500 Milliarden |

## ReDoS: wenn eine Eingabe zum Angriff wird

Nutzt jemand dieses Verhalten absichtlich aus, heißt das [[redos|ReDoS]] (*Regular expression Denial of
Service*). Eine einzige Anfrage kann einen Prozess blockieren. In [[nodejs|Node.js]] ist das besonders kritisch: Dort
arbeitet ein einziger [[thread|Thread]] alle Anfragen ab – hängt er in einer Regex, wartet der ganze Server.

Gefährliche Bauformen erkennst du an zwei Merkmalen:

1. **Verschachtelte Quantoren**: `(a+)+`, `(\w+\s?)*`, `(.*)*`
2. **Überlappende Alternativen** unter einem Quantor: `(a|aa)+`, `(\d|\d\d)*`

> [!FEHLER]
> **Benutzereingaben als Muster verwenden.** `new RegExp(req.body.suche)` erlaubt es jedem, eine
> gefährliche Regex an deinen Server zu schicken. Für eine Textsuche escapst du die Eingabe oder nutzt
> `includes()`.

## Muster entschärfen

Das Gegenmittel ist **Eindeutigkeit**: Für jeden Text darf es möglichst nur **einen** Weg geben, wie das
Muster passt.

| gefährlich | eindeutig |
|---|---|
| `^(\w+\s?)*$` | `^\w+(\s\w+)*$` |
| `^(a+)+$` | `^a+$` |
| `^([a-z0-9]+-?)*\.com$` | `^[a-z0-9]+(-[a-z0-9]+)*\.com$` |
| `"(.*)*"` | `"[^"]*"` |

Dazu kommen zwei Schutzmaßnahmen außerhalb des Musters:

- **Eingabelänge begrenzen**, bevor die Regex läuft – ein Name braucht keine 10 000 Zeichen.
- **Limits der Laufzeit nutzen**: PHP bricht nach `pcre.backtrack_limit` Schritten ab; `preg_match()` liefert
  dann `false` und `preg_last_error_msg()` meldet „Backtrack limit exhausted“. Prüfe deshalb immer auf
  `false`.

> [!MERKSATZ]
> Ein Muster ist sicher, wenn es für jeden Text nur **eine** Art gibt, ihn zu zerlegen. Verschachtelte
> Quantoren mit optionalen Trennern sind das Warnsignal.

## Lesbare Muster schreiben

Regex haben den Ruf, *write-only* zu sein. Drei Techniken helfen dagegen:

**1. Benannte Gruppen** statt Nummern – siehe Modul 2.

**2. Der Modifikator `x` in PHP**: Leerzeichen werden ignoriert, `#` leitet einen Kommentar ein.

```php
$logZeile = '/
    ^(?<date>\d{4}-\d{2}-\d{2})      # Datum
    \s(?<time>\d{2}:\d{2}:\d{2})     # Uhrzeit
    \s\[(?<level>[A-Z]+)\]           # Level in eckigen Klammern
    \s(?<source>[a-z]+):             # Quelle
    \s(?<message>.+)$                # Nachricht
/x';
```

**3. Muster aus Teilen bauen** – in JavaScript mit Konstanten und `RegExp.source`:

```js run
const datum = /\d{4}-\d{2}-\d{2}/.source;
const zeit = /\d{2}:\d{2}:\d{2}/.source;
const zeitstempel = new RegExp(`^${datum} ${zeit}$`);
console.log(zeitstempel.test("2026-10-01 08:02:45"));   // true
```

## Regex testen

Ein Muster ist erst fertig, wenn es **getestet** ist. Sammle dafür drei Arten von Beispielen:

| Art | Beispiel für Postleitzahlen |
|---|---|
| soll passen | `37073`, `01067` |
| darf nicht passen | `3707`, `370731`, `PLZ 37073`, leerer Text |
| bösartig/extrem | 10 000 Ziffern, Zeilenumbruch am Ende |

Schreibe diese Fälle als automatische Tests. Online-Werkzeuge wie [regex101](https://regex101.com) helfen
beim Ausprobieren: Sie erklären jedes Zeichen und zeigen die Zahl der Schritte – setze dort aber nie echte
Kundendaten ein.

> [!PRAXIS]
> Viele Teams verlangen im Code-Review zu jeder neuen Regex einen Test mit Positiv- und Negativbeispielen.
> Statische Analyse-Werkzeuge und Linter-Regeln melden zusätzlich verschachtelte Quantoren, bevor sie in
> Produktion landen.

## Zusammenfassung

- Verschachtelte Quantoren und überlappende Alternativen können **exponentiell** viel Backtracking auslösen.
- Wird das absichtlich ausgenutzt, heißt es **ReDoS** – eine Eingabe blockiert den ganzen Dienst.
- Eindeutige Muster wie `^\w+(\s\w+)*$`, Längenbegrenzungen und Laufzeitlimits schützen dich.
- Benutzereingaben gehören nie ungeprüft in ein Muster.
- Benannte Gruppen, der PHP-Modifikator `x` und zusammengesetzte Teilmuster machen Regex lesbar.
- Teste jedes Muster mit passenden, unpassenden und extremen Beispielen.
