---
title: Das gemeinsame Datenmodell
summary: Skalare, Listen und Schlüssel-Wert-Objekte – aus diesen drei Bausteinen bestehen JSON, YAML und fast alle anderen Formate.
duration: 20
sources:
  - title: RFC 8259 – JSON, Abschnitt 3 bis 7 (Werte, Objekte, Arrays)
    url: https://www.rfc-editor.org/rfc/rfc8259
  - title: YAML 1.2.2 – Kapitel 3, Processes and Models
    url: https://yaml.org/spec/1.2.2/
  - title: MDN – JavaScript data types and data structures
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Data_structures
quiz:
  - type: match
    question: Wie heißt derselbe Baustein in verschiedenen Welten?
    pairs:
      - { left: "JSON-Objekt", right: "assoziatives Array in PHP" }
      - { left: "JSON-Array", right: "Sequenz in YAML" }
      - { left: "YAML-Mapping", right: "Objekt in JavaScript" }
    explanation: Die Namen unterscheiden sich, das Prinzip ist gleich – ungeordnete Schlüssel-Wert-Sammlungen (Objekt, Mapping, assoziatives Array) und geordnete Listen (Array, Sequenz).
  - type: single
    question: "Welcher Wert ist **kein** Skalar?"
    options:
      - "\"Musterstadt\""
      - "42"
      - "null"
      - "[\"php\", \"sql\"]"
    answer: 3
    explanation: Ein Skalar ist ein einzelner, nicht weiter zerlegbarer Wert. Ein Array enthält weitere Werte und ist deshalb ein Container.
  - type: multiple
    question: "Welche Typen kennt JSON **nicht** direkt?"
    options:
      - Datum
      - Boolean
      - Ganzzahl getrennt von Kommazahl
      - "null"
    answers: [0, 2]
    explanation: JSON kennt nur einen Zahlentyp und kein Datum. Datumsangaben werden als String übertragen, meist im ISO-8601-Format wie "2026-10-09T08:00:00Z".
  - type: cloze
    text: "In `{\"user\": {\"name\": \"Ada\"}}` steckt ein Objekt in einem Objekt. Das nennt man ___. Zusammen bilden die Werte einen ___."
    blanks:
      - [Verschachtelung, verschachtelt, Nesting]
      - [Baum, Datenbaum]
    explanation: Container dürfen weitere Container enthalten. So entsteht ein Baum, dessen Blätter Skalare sind.
tasks:
  - id: datenbaum-beschriften
    type: diagram
    title: Beschrifte den Datenbaum
    description: |
      Das Diagramm zeigt diesen JSON-Wert als Baum:

      ```json
      {"name": "Ada", "alter": 36, "aktiv": true,
       "skills": ["php", "sql"], "adresse": {"stadt": "Musterstadt"}}
      ```

      Ordne den leeren Kästen den passenden Datentyp zu.
    image: /assets/datenformate/datenbaum-leer.svg
    slots:
      - { x: 50, y: 13, answer: Objekt }
      - { x: 11, y: 44, answer: String }
      - { x: 30, y: 44, answer: Number }
      - { x: 50, y: 44, answer: Boolean }
      - { x: 70, y: 44, answer: Array }
    distractors: [Datum, Tabelle]
    hints:
      - Geschweifte Klammern ergeben ein Objekt, eckige Klammern ein Array.
  - id: typ-bestimmen
    type: code
    language: js
    title: Den JSON-Typ eines Werts bestimmen
    description: |
      `typeof` in JavaScript ist für Datenformate leider ungenau: `typeof null` und `typeof []` liefern beide
      `"object"`. Schreibe die Funktion `jsonType(value)`, die den Typ im Sinne von JSON zurückgibt:

      | Wert | Rückgabe |
      |---|---|
      | `"Ada"` | `"string"` |
      | `36`, `1.5` | `"number"` |
      | `true`, `false` | `"boolean"` |
      | `null` | `"null"` |
      | `[1, 2]` | `"array"` |
      | `{ a: 1 }` | `"object"` |

      Alles andere (zum Beispiel `undefined` oder eine Funktion) ist in JSON nicht erlaubt: Gib dann `"invalid"`
      zurück.
    starter: |
      function jsonType(value) {
        // Achtung: null zuerst prüfen, Arrays vor Objekten!
        return 'invalid'
      }
    tests:
      - name: Skalare werden erkannt
        code: |
          assertEqual(jsonType('Ada'), 'string')
          assertEqual(jsonType(36), 'number')
          assertEqual(jsonType(false), 'boolean')
      - name: null ist kein Objekt
        code: assertEqual(jsonType(null), 'null')
      - name: Arrays und Objekte werden unterschieden
        code: |
          assertEqual(jsonType([]), 'array')
          assertEqual(jsonType({ a: 1 }), 'object')
      - name: Nicht erlaubte Werte sind invalid
        code: |
          assertEqual(jsonType(undefined), 'invalid')
          assertEqual(jsonType(() => 1), 'invalid')
      - name: NaN und Infinity gibt es in JSON nicht
        code: |
          assertEqual(jsonType(NaN), 'invalid')
          assertEqual(jsonType(Infinity), 'invalid')
    hints:
      - "`Array.isArray(value)` erkennt Arrays zuverlässig."
      - "Für Zahlen hilft `Number.isFinite(value)` – es ist für NaN und Infinity `false`."
    solution: |
      ```js
      function jsonType(value) {
        if (value === null) return 'null'
        if (Array.isArray(value)) return 'array'
        if (typeof value === 'string') return 'string'
        if (typeof value === 'boolean') return 'boolean'
        if (typeof value === 'number') return Number.isFinite(value) ? 'number' : 'invalid'
        if (typeof value === 'object') return 'object'
        return 'invalid'
      }
      ```
---
Ob `package.json`, `compose.yaml` oder die Antwort einer API: Wenn du genau hinsiehst, bestehen fast alle
Datenformate aus denselben drei Bausteinen. Wer diese Bausteine kennt, lernt jedes neue Format in Minuten –
nur die Schreibweise ändert sich.

## Baustein 1: Skalare

Ein [[skalar|Skalar]] ist ein einzelner Wert, der sich nicht weiter zerlegen lässt. JSON kennt vier Sorten:

| Typ | Beispiele | Bedeutung |
|---|---|---|
| [[string\|String]] | `"Ada"`, `""` | Text, auch leer |
| [[number\|Number]] | `36`, `-1.5`, `2e3` | Zahl – ganz oder mit Komma |
| [[boolean\|Boolean]] | `true`, `false` | wahr oder falsch |
| [[null]] | `null` | bewusst „kein Wert“ |

Wichtig ist der Unterschied zwischen `"36"` und `36`. Das erste ist Text, das zweite eine Zahl. Mit Text
kannst du nicht rechnen, und beim Sortieren landet `"10"` vor `"9"`.

Achte auch auf den Unterschied zwischen `null`, einem leeren String `""` und einem fehlenden Schlüssel. `null`
sagt: „Diesen Wert gibt es, aber er ist bewusst leer.“ Ein fehlender Schlüssel sagt: „Darüber weiß ich nichts.“
Viele APIs behandeln das unterschiedlich – etwa beim Aktualisieren eines Datensatzes, wo `null` ein Feld
leert, ein fehlender Schlüssel es aber unverändert lässt.

> [!MERKSATZ]
> Anführungszeichen machen aus einem Wert einen String. `"true"` ist Text, `true` ist ein Boolean.

## Baustein 2 und 3: Listen und Objekte

Neben Skalaren gibt es zwei Container, die andere Werte enthalten:

- Eine **Liste** ist eine geordnete Folge von Werten. In JSON heißt sie [[array|Array]], in YAML
  [[yaml-sequenz|Sequenz]]. Die Reihenfolge zählt, du greifst über den Index zu (`skills[0]`).
- Ein **Objekt** ist eine Sammlung aus [[schluessel-wert-paar|Schlüssel-Wert-Paaren]]. In JSON heißt es
  [[objekt|Objekt]], in YAML [[yaml-mapping|Mapping]], in PHP [[assoziatives-array|assoziatives Array]].
  Du greifst über den Namen zu (`user.name`).

```json
{
  "name": "Ada",
  "skills": ["php", "sql"]
}
```

Hier ist das Ganze ein Objekt mit zwei Schlüsseln. Der Wert von `skills` ist ein Array mit zwei Strings.

> [!FEHLER]
> **Sich auf die Reihenfolge von Schlüsseln verlassen.** Laut Standard ist ein JSON-Objekt *ungeordnet*.
> Viele Parser behalten die Reihenfolge zwar bei, garantiert ist das aber nicht. Brauchst du eine
> Reihenfolge, nimm ein Array.

## Verschachtelung: Daten als Baum

Container dürfen weitere Container enthalten. Diese [[verschachtelung|Verschachtelung]] macht Formate wie
JSON und YAML so mächtig: Du kannst damit beliebige Strukturen abbilden.

![Ein JSON-Objekt als Baum: innen Objekte und Arrays, außen einfache Werte](/assets/datenformate/datenbaum.svg)

Stell dir den Wert als **Baum** vor. Die Wurzel ist das äußere Objekt. Innere Knoten sind Objekte und Arrays,
die Blätter sind Skalare. Einen Wert erreichst du über seinen **Pfad** von der Wurzel aus:

| Pfad | Wert |
|---|---|
| `name` | `"Ada"` |
| `skills[1]` | `"sql"` |
| `adresse.stadt` | `"Musterstadt"` |

Genau so arbeiten später `jq`-Filter wie `.adresse.stadt` oder der Zugriff `$data['adresse']['stadt']` in PHP.

## Ein Modell, viele Sprachen

Das Schöne am gemeinsamen Modell: Jede Programmiersprache hat passende Gegenstücke.

| JSON | JavaScript | PHP | YAML |
|---|---|---|---|
| Objekt | Object | assoziatives Array oder `stdClass` | Mapping |
| Array | Array | Array mit Index 0, 1, 2 … | Sequenz |
| String | string | string | String |
| Number | number | int oder float | int oder float |
| `true`/`false` | boolean | bool | bool |
| `null` | null | null | `null` oder `~` |

Was das Modell **nicht** kennt, geht beim Serialisieren verloren oder muss umgeschrieben werden: Datumswerte
werden zu Strings, Funktionen fallen weg, und JSON unterscheidet nicht zwischen `1` und `1.0`.

> [!PRAXIS]
> Datumswerte überträgst du am besten als ISO-8601-String wie `"2026-10-09T08:00:00Z"`. Den versteht jede
> Sprache, und er sortiert sich als Text sogar richtig.

## Zusammenfassung

- Fast alle Formate bestehen aus **Skalaren**, **Listen** und **Objekten**.
- Skalare in JSON: String, Number, Boolean und `null` – `"36"` ist nicht dasselbe wie `36`.
- Listen sind geordnet, Objekte bestehen aus Schlüssel-Wert-Paaren ohne garantierte Reihenfolge.
- Durch Verschachtelung entsteht ein **Baum**, jeder Wert hat einen Pfad wie `adresse.stadt`.
- JavaScript, PHP und YAML haben für jeden Baustein ein Gegenstück.
- Datum, Funktionen und Ganzzahl-vs-Kommazahl kennt JSON nicht.
