---
title: Gierig oder genügsam, Flags und Lookarounds
summary: Warum .* oft zu viel erwischt, wie Flags (i, g, m, s, u) das Verhalten eines Musters ändern und wie Lookarounds Bedingungen prüfen, ohne Zeichen zu verbrauchen.
duration: 25
sources:
  - title: MDN – Quantoren (gierig und genügsam)
    url: https://developer.mozilla.org/de/docs/Web/JavaScript/Guide/Regular_expressions/Quantifiers
  - title: MDN – Flags in regulären Ausdrücken
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions#advanced_searching_with_flags
  - title: MDN – Assertions (Lookahead und Lookbehind)
    url: https://developer.mozilla.org/de/docs/Web/JavaScript/Guide/Regular_expressions/Assertions
  - title: PHP-Handbuch – Modifikatoren
    url: https://www.php.net/manual/de/reference.pcre.pattern.modifiers.php
quiz:
  - type: single
    question: "Was liefert `'<b>fett</b>'.match(/<.+>/)[0]`?"
    options: ["<b>", "<b>fett</b>", "fett", "</b>"]
    answer: 1
    explanation: "`.+` ist gierig und frisst bis zum Textende. Danach gibt die Engine Zeichen für Zeichen zurück, bis `>` passt – beim **letzten** `>`. Mit `<.+?>` wäre es `<b>`."
  - type: match
    question: Ordne jedem Flag seine Wirkung zu.
    pairs:
      - { left: "i", right: "Groß-/Kleinschreibung ignorieren" }
      - { left: "g", right: "alle Treffer statt nur des ersten (nur JavaScript)" }
      - { left: "m", right: "^ und $ gelten für jede Zeile" }
      - { left: "s", right: "der Punkt passt auch auf Zeilenumbrüche" }
      - { left: "u", right: "Unicode-Modus, z. B. für \\p{L}" }
    explanation: Flags ändern das Verhalten des ganzen Musters. In PHP heißen sie Modifikatoren und stehen hinter dem schließenden Begrenzer – ein g gibt es dort nicht.
  - type: multiple
    question: "Wo findet `/\\d+(?=€)/` einen Treffer – und welcher Text gehört dazu?"
    options:
      - "In „Preis 25€“ – Treffer „25“"
      - "In „Preis 25€“ – Treffer „25€“"
      - "In „Preis 25 €“ – Treffer „25“"
      - "In „25€ und 30€“ – erster Treffer „25“"
    answers: [0, 3]
    explanation: "Der Lookahead `(?=€)` prüft, ob direkt danach ein € kommt, nimmt es aber **nicht** in den Treffer auf. Bei „25 €“ steht ein Leerzeichen dazwischen."
  - type: find-bug
    question: Das Skript soll in einem mehrzeiligen Text alle Zeilen finden, die mit „TODO“ beginnen. Es findet aber nur eine. In welcher Zeile liegt der Fehler?
    language: js
    code: |
      const text = "TODO: tests\nfertig\nTODO: docs";
      const muster = /^TODO: .+$/g;
      const treffer = text.match(muster);
      console.log(treffer);
    bug_line: 2
    explanation: "Ohne das Flag `m` stehen `^` und `$` für Anfang und Ende des **ganzen** Textes. Richtig: `/^TODO: .+$/gm`."
tasks:
  - id: zitate-extrahieren
    type: code
    language: js
    title: Zitate aus einem Text holen
    description: |
      Schreibe `zitate(text)`. Die Funktion gibt ein Array mit allen Texten zurück, die zwischen **doppelten
      Anführungszeichen** stehen – ohne die Anführungszeichen selbst.

      `zitate('Sie sagte "Hallo" und er "Tschüss".')` → `["Hallo", "Tschüss"]`

      Auch leere Zitate (`""`) gehören dazu. Gibt es keine Zitate, ist das Ergebnis ein leeres Array.
      Nutze einen **genügsamen** Quantor und das Flag `g`.
    starter: |
      function zitate(text) {
        const muster = /"(.*)"/g;
        const ergebnis = [];
        for (const treffer of text.matchAll(muster)) {
          ergebnis.push(treffer[1]);
        }
        return ergebnis;
      }
    tests:
      - name: Zwei Zitate in einem Satz
        code: assertDeepEqual(zitate('Sie sagte "Hallo" und er "Tschüss".'), ["Hallo", "Tschüss"])
      - name: Kein Zitat ergibt ein leeres Array
        code: assertDeepEqual(zitate("Keine Anführungszeichen hier"), [])
      - name: Leeres Zitat wird mitgezählt
        code: assertDeepEqual(zitate('A "" B "x"'), ["", "x"])
      - name: Zitate über mehrere Zeilen werden getrennt erkannt
        code: assertDeepEqual(zitate('"eins"\n"zwei"'), ["eins", "zwei"])
    hints:
      - "Führe den Starter aus: `.*` frisst vom ersten bis zum **letzten** Anführungszeichen."
      - "Ein `?` hinter dem Quantor macht ihn genügsam: `.*?`."
      - "`/\"(.*?)\"/g` – alternativ geht auch `/\"([^\"]*)\"/g`."
    solution: |
      ```js
      function zitate(text) {
        const muster = /"(.*?)"/g;
        const ergebnis = [];
        for (const treffer of text.matchAll(muster)) {
          ergebnis.push(treffer[1]);
        }
        return ergebnis;
      }
      ```
  - id: engine-schritte
    type: steps
    title: Was macht die Engine als Nächstes?
    description: Verfolge, wie die Engine das Muster `<.+>` auf den Text `<b>fett</b>` anwendet.
    steps:
      - situation: "Die Engine steht am Textanfang. `<` im Muster passt auf das erste Zeichen `<`."
        question: Was macht `.+` jetzt?
        options:
          - Es nimmt genau ein Zeichen und prüft dann `>`
          - Es nimmt so viele Zeichen wie möglich – bis zum Textende
          - Es springt direkt zum nächsten `>`
        answer: 1
        explanation: Quantoren sind standardmäßig gierig. `.+` frisst `b>fett</b>` komplett.
      - situation: "`.+` hat alles bis zum Textende genommen. Im Muster folgt noch `>` – aber im Text ist nichts mehr übrig."
        question: Was passiert jetzt?
        options:
          - Die Suche scheitert sofort
          - Die Engine gibt ein Zeichen zurück und prüft, ob `>` dort passt
          - Die Engine beginnt beim zweiten Zeichen des Textes von vorn
        answer: 1
        explanation: Das heißt Backtracking. `.+` gibt das letzte Zeichen ab – es ist `>`, also passt der Rest des Musters.
      - situation: "Das letzte `>` passt. Das Muster ist vollständig erfüllt."
        question: Was ist der Treffer?
        options: ["<b>", "<b>fett</b>", "b>fett</b"]
        answer: 1
        explanation: Der gierige Quantor liefert den längstmöglichen Treffer. Mit `<.+?>` hätte die Engine nach jedem Zeichen zuerst `>` probiert und `<b>` geliefert.
---
Du willst aus `<b>fett</b> und <i>kursiv</i>` die einzelnen Tags herausholen und schreibst `/<.*>/`. Heraus
kommt **der ganze Text**. Das Muster ist nicht falsch – es ist nur gierig. Diese Lektion zeigt dir, wie die
Engine dabei denkt, und gibt dir drei Feinwerkzeuge: genügsame Quantoren, Flags und Lookarounds.

## Gierig: so viel wie möglich

Quantoren wie `*`, `+` und `{n,m}` sind standardmäßig [[gieriger-quantor|gierig]] (*greedy*): Sie nehmen
**so viele Zeichen wie möglich**. Passt der Rest des Musters danach nicht, geben sie Zeichen für Zeichen
wieder ab. Dieses Zurückgehen heißt [[backtracking|Backtracking]].

```js run
const text = "<b>fett</b> und <i>kursiv</i>";
console.log(text.match(/<.*>/)[0]);   // der ganze Text
```

![Vergleich: gieriges <.*> trifft den ganzen Text, genügsames <.*?> trifft jedes Tag einzeln](/assets/regex/gierig-genuegsam.svg)

Ablauf für `<.*>`:

1. `<` passt auf das erste Zeichen.
2. `.*` frisst alles bis zum Textende.
3. `>` passt nicht mehr – `.*` gibt ein Zeichen zurück: das letzte `>`. Treffer!

## Genügsam: so wenig wie nötig

Ein angehängtes `?` macht einen Quantor [[genuegsamer-quantor|genügsam]] (*lazy*): Er nimmt **so wenige
Zeichen wie möglich** und versucht nach jedem Zeichen, ob der Rest des Musters schon passt.

| gierig | genügsam |
|---|---|
| `*` | `*?` |
| `+` | `+?` |
| `?` | `??` |
| `{2,5}` | `{2,5}?` |

```js run
const text = "<b>fett</b> und <i>kursiv</i>";
console.log(text.match(/<.*?>/g));   // [ '<b>', '</b>', '<i>', '</i>' ]
console.log(text.match(/<[^>]*>/g)); // gleiches Ergebnis mit verneinter Klasse
```

Die verneinte Klasse `[^>]*` ist oft die bessere Wahl: Sie kann gar nicht über ein `>` hinauslaufen und
braucht kein Backtracking.

> [!MERKSATZ]
> `.*` heißt „so viel wie möglich“. Wenn du „bis zum **nächsten** X“ meinst, schreibe `.*?X` oder besser
> `[^X]*X`.

## Flags: Schalter für das ganze Muster

[[regex-flag|Flags]] ändern, wie die Engine ein Muster anwendet. In JavaScript stehen sie hinter dem
letzten Schrägstrich, in PHP als *Modifikatoren* hinter dem schließenden Begrenzer.

| Flag | Wirkung | JavaScript | PHP |
|---|---|---|---|
| `i` | Groß-/Kleinschreibung egal | `/error/i` | `'/error/i'` |
| `g` | alle Treffer suchen | `/\d+/g` | gibt es nicht – dafür `preg_match_all()` |
| `m` | `^`/`$` gelten pro Zeile | `/^TODO/m` | `'/^TODO/m'` |
| `s` | `.` passt auch auf `\n` | `/a.b/s` | `'/a.b/s'` |
| `u` | Unicode-Modus | `/\p{L}+/u` | `'/\p{L}+/u'` |

```js run
const log = "ERROR eins\nInfo\nerror zwei";
console.log(log.match(/^error.*$/gim));   // [ 'ERROR eins', 'error zwei' ]
console.log("Müller".match(/\p{L}+/u)[0]); // "Müller"
```

Weitere Flags wie `d` (Indizes), `y` (sticky) und `v` (erweiterter Unicode-Modus) beschreibt die
[MDN-Referenz](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/flags).

## Typische Fallen mit Flags

> [!FEHLER]
> **`^` und `$` in mehrzeiligem Text ohne `m`.** Liest du eine ganze Datei als String ein, steht `^` nur
> für den Anfang der **Datei**. Für „jede Zeile, die mit TODO beginnt“ brauchst du `/^TODO/gm`.

Zweite Falle: Der Punkt passt standardmäßig **nicht** auf Zeilenumbrüche. Ein Muster wie
`/<pre>.*<\/pre>/` scheitert, sobald der Block über mehrere Zeilen geht – mit `s` klappt es.

| Text | `/a.b/` | `/a.b/s` |
|---|---|---|
| `a-b` | Treffer | Treffer |
| `a` + Zeilenumbruch + `b` | kein Treffer | Treffer |

> [!PRAXIS]
> Wenn Benutzernamen oder Ortsnamen Umlaute enthalten dürfen, ersetzt du `[A-Za-z]` durch `\p{L}` und setzt
> das Flag `u`. Das ist in internationalen Anwendungen Standard – „Zoë“ und „Çelik“ sollen sich genauso
> anmelden können wie „Max“.

## Lookarounds: prüfen ohne zu verbrauchen

[[lookaround|Lookarounds]] prüfen, was **vor** oder **nach** der aktuellen Stelle steht – aber der geprüfte
Text gehört **nicht** zum Treffer. Wie Anker passen sie auf eine Position.

| Schreibweise | Name | bedeutet |
|---|---|---|
| `X(?=Y)` | Lookahead | X, wenn danach Y kommt |
| `X(?!Y)` | negativer Lookahead | X, wenn danach **kein** Y kommt |
| `(?<=Y)X` | Lookbehind | X, wenn davor Y steht |
| `(?<!Y)X` | negativer Lookbehind | X, wenn davor **kein** Y steht |

```js run
console.log("Preis: 25€, Rabatt 5%".match(/\d+(?=€)/)[0]);     // "25"
console.log("Bestellung #4711".match(/(?<=#)\d+/)[0]);          // "4711"
console.log(/^(?=.*\d)(?=.*[A-Z]).{8,}$/.test("Sicher2026"));    // true
```

Das letzte Beispiel prüft mehrere Bedingungen gleichzeitig: mindestens eine Ziffer, ein Großbuchstabe,
acht Zeichen. Lookarounds sind ein Feinwerkzeug – meist geht es mit zwei einfachen Mustern lesbarer.

## Zusammenfassung

- Quantoren sind **gierig**: Sie nehmen so viel wie möglich und geben per Backtracking wieder ab.
- Ein angehängtes `?` macht sie **genügsam**; `[^X]*` ist oft noch besser.
- Flags: `i` (Groß/klein egal), `g` (alle Treffer, nur JS), `m` (pro Zeile), `s` (Punkt mit `\n`), `u` (Unicode).
- In PHP heißen Flags Modifikatoren; statt `g` nutzt du `preg_match_all()`.
- Lookarounds `(?=…)`, `(?!…)`, `(?<=…)`, `(?<!…)` prüfen die Umgebung, ohne sie in den Treffer aufzunehmen.
