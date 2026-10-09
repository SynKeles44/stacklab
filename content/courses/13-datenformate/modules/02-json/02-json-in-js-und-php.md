---
title: JSON in JavaScript und PHP
summary: JSON sicher einlesen und erzeugen – mit JSON.parse/stringify, json_decode/json_encode, den wichtigsten Flags und einem Blick auf JSON Schema.
duration: 25
sources:
  - title: MDN – JSON.parse()
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse
  - title: MDN – JSON.stringify()
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
  - title: PHP-Handbuch – json_decode
    url: https://www.php.net/manual/de/function.json-decode.php
  - title: PHP-Handbuch – json_encode
    url: https://www.php.net/manual/de/function.json-encode.php
  - title: PHP-Handbuch – JSON-Konstanten
    url: https://www.php.net/manual/de/json.constants.php
  - title: JSON Schema – Getting Started
    url: https://json-schema.org/learn/getting-started-step-by-step
quiz:
  - type: single
    question: "Was gibt `JSON.stringify({ a: undefined, b: 1, c: () => 2 })` zurück?"
    options:
      - "'{\"a\":undefined,\"b\":1,\"c\":\"() => 2\"}'"
      - "'{\"b\":1}'"
      - "'{\"a\":null,\"b\":1,\"c\":null}'"
      - Einen TypeError
    answer: 1
    explanation: undefined und Funktionen gibt es in JSON nicht. In Objekten lässt JSON.stringify diese Eigenschaften einfach weg – in Arrays würden sie zu null.
  - type: cloze
    text: "Mit `JSON.stringify(daten, null, ___)` erzeugst du JSON mit zwei Leerzeichen Einrückung. In PHP liefert `json_decode($json, ___)` ein assoziatives Array statt eines Objekts."
    blanks:
      - ["2"]
      - ["true"]
    explanation: Der dritte Parameter von JSON.stringify ist die Einrückung. Der zweite Parameter von json_decode entscheidet zwischen assoziativem Array (true) und stdClass-Objekt.
  - type: match
    question: Ordne jedem Flag von json_encode seine Wirkung zu.
    pairs:
      - { left: "JSON_PRETTY_PRINT", right: "Ausgabe mit Zeilenumbrüchen und Einrückung" }
      - { left: "JSON_UNESCAPED_UNICODE", right: "ü bleibt ü statt \\u00fc" }
      - { left: "JSON_UNESCAPED_SLASHES", right: "/ wird nicht als \\/ geschrieben" }
      - { left: "JSON_THROW_ON_ERROR", right: "Fehler werfen eine JsonException" }
    explanation: Flags kombinierst du mit dem bitweisen Oder, zum Beispiel JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR.
  - type: find-bug
    question: Das Skript bricht mit „Cannot use object of type stdClass as array“ ab. In welcher Zeile liegt die Ursache?
    language: php
    code: |
      <?php
      $json = '{"name": "Ada", "rolle": "admin"}';
      $user = json_decode($json);
      echo $user['name'];
    bug_line: 3
    explanation: Ohne zweiten Parameter liefert json_decode ein stdClass-Objekt, auf das du mit $user->name zugreifst. Für den Array-Zugriff brauchst du json_decode($json, true).
  - type: single
    question: "Was liefert `json_decode('{\"a\": 1,}')` in PHP ohne weitere Flags?"
    options:
      - Ein leeres Array
      - "null – den Grund verrät json_last_error_msg()"
      - Eine JsonException
      - "Das Objekt mit a = 1, das Komma wird ignoriert"
    answer: 1
    explanation: Ohne JSON_THROW_ON_ERROR meldet json_decode Fehler nur über den Rückgabewert null. Weil aber auch der gültige JSON-Text "null" zu null wird, ist das tückisch – nutze lieber JSON_THROW_ON_ERROR.
tasks:
  - id: einstellungen-laden
    type: code
    language: js
    title: Einstellungen robust laden
    description: |
      Eine App lädt Nutzereinstellungen aus einem JSON-String, den der Browser gespeichert hat. Der String kann
      kaputt sein. Schreibe `loadSettings(text)`:

      1. Ist `text` kein gültiges JSON, gib `{ ok: false, error: 'invalid-json' }` zurück.
      2. Ist das Ergebnis kein Objekt (sondern z. B. ein Array, eine Zahl oder `null`), gib
         `{ ok: false, error: 'not-an-object' }` zurück.
      3. Sonst gib `{ ok: true, settings }` zurück. `settings` enthält die Standardwerte
         `{ theme: 'light', pageSize: 20 }`, überschrieben von den Werten aus dem JSON.
    starter: |
      const DEFAULTS = { theme: 'light', pageSize: 20 }

      function loadSettings(text) {
        // JSON.parse wirft bei kaputtem JSON einen SyntaxError
      }
    tests:
      - name: Gültiges JSON überschreibt die Standardwerte
        code: |
          assertDeepEqual(loadSettings('{"theme": "dark"}'), { ok: true, settings: { theme: 'dark', pageSize: 20 } })
      - name: Leeres Objekt ergibt die Standardwerte
        code: |
          assertDeepEqual(loadSettings('{}'), { ok: true, settings: { theme: 'light', pageSize: 20 } })
      - name: Kaputtes JSON wird erkannt
        code: |
          assertDeepEqual(loadSettings("{'theme': 'dark'}"), { ok: false, error: 'invalid-json' })
          assertDeepEqual(loadSettings(''), { ok: false, error: 'invalid-json' })
      - name: Arrays, Zahlen und null sind keine Einstellungen
        code: |
          assertDeepEqual(loadSettings('[1, 2]'), { ok: false, error: 'not-an-object' })
          assertDeepEqual(loadSettings('42'), { ok: false, error: 'not-an-object' })
          assertDeepEqual(loadSettings('null'), { ok: false, error: 'not-an-object' })
      - name: Die Standardwerte werden nicht verändert
        code: |
          loadSettings('{"pageSize": 50}')
          assertEqual(DEFAULTS.pageSize, 20)
    hints:
      - "Packe `JSON.parse(text)` in ein `try { … } catch { … }`."
      - "Prüfe danach `data === null || typeof data !== 'object' || Array.isArray(data)`."
      - "`{ ...DEFAULTS, ...data }` erzeugt ein neues Objekt, ohne DEFAULTS zu verändern."
    solution: |
      ```js
      const DEFAULTS = { theme: 'light', pageSize: 20 }

      function loadSettings(text) {
        let data
        try {
          data = JSON.parse(text)
        } catch {
          return { ok: false, error: 'invalid-json' }
        }
        if (data === null || typeof data !== 'object' || Array.isArray(data)) {
          return { ok: false, error: 'not-an-object' }
        }
        return { ok: true, settings: { ...DEFAULTS, ...data } }
      }
      ```
  - id: bestseller
    type: code
    language: php
    title: Bestseller als JSON ausgeben
    description: |
      Ein Shop liefert seine Verkaufszahlen als JSON-Array, z. B.
      `[{"name": "Tasse", "sold": 12}, {"name": "Bürostuhl", "sold": 40}]`.
      Schreibe `topSellers(string $json): string`:

      - Lies das JSON mit `json_decode` als **assoziatives Array** ein und nutze `JSON_THROW_ON_ERROR`, damit
        kaputtes JSON eine `JsonException` auslöst.
      - Sortiere absteigend nach `sold` und nimm die ersten **drei** Produkte.
      - Gib die **Namen** als JSON-Array zurück. Umlaute sollen lesbar bleiben (`"Bürostuhl"`, nicht
        `"Bürostuhl"`).
    starter: |
      function topSellers(string $json): string
      {
          $products = json_decode($json, true, flags: JSON_THROW_ON_ERROR);

          // sortieren, die ersten drei nehmen, Namen sammeln, als JSON zurückgeben
          return '[]';
      }
    tests:
      - name: Die drei meistverkauften Produkte in absteigender Reihenfolge
        code: |
          $json = '[{"name":"Tasse","sold":12},{"name":"Poster","sold":3},{"name":"Lampe","sold":25},{"name":"Kabel","sold":7}]';
          assert_same('["Lampe","Tasse","Kabel"]', topSellers($json));
      - name: Umlaute bleiben lesbar
        code: |
          assert_same('["Bürostuhl","Tasse"]', topSellers('[{"name":"Tasse","sold":12},{"name":"Bürostuhl","sold":40}]'));
      - name: Ein leeres Array ergibt ein leeres JSON-Array
        code: |
          assert_same('[]', topSellers('[]'));
      - name: Kaputtes JSON löst eine JsonException aus
        code: |
          $thrown = false;
          try {
              topSellers('[{"name": "Tasse",}]');
          } catch (JsonException $e) {
              $thrown = true;
          }
          assert_true($thrown);
    hints:
      - "`usort($products, fn ($a, $b) => $b['sold'] <=> $a['sold']);` sortiert absteigend."
      - "`array_slice($products, 0, 3)` nimmt die ersten drei, `array_column($top, 'name')` sammelt die Namen."
      - "`json_encode($names, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)` erzeugt das Ergebnis."
    solution: |
      ```php
      function topSellers(string $json): string
      {
          $products = json_decode($json, true, flags: JSON_THROW_ON_ERROR);

          usort($products, fn (array $a, array $b): int => $b['sold'] <=> $a['sold']);
          $names = array_column(array_slice($products, 0, 3), 'name');

          return json_encode($names, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
      }
      ```
---
Im Terminal prüfst du JSON mit `jq`. In deinen Programmen übernehmen das eingebaute Funktionen: Sie
verwandeln Text in Objekte und zurück. Dabei gibt es ein paar Stolperstellen, die in echten Projekten
regelmäßig zu Fehlern führen – vor allem beim Fehlerfall und bei Typen.

## JavaScript: JSON.parse und JSON.stringify

JavaScript hat das globale Objekt `JSON` mit zwei Methoden:

```js run
const text = '{"name": "Ada", "skills": ["php", "sql"]}'
const user = JSON.parse(text)          // Text → Objekt (deserialisieren)
console.log(user.skills[1])            // "sql"

const back = JSON.stringify(user)      // Objekt → Text (serialisieren)
console.log(back)
console.log(JSON.stringify(user, null, 2)) // hübsch eingerückt
```

`JSON.parse` wirft bei ungültigem Text einen `SyntaxError`. Daten von außen – aus einer Datei, vom Server,
aus dem `localStorage` – liest du deshalb immer in einem [[try-catch|try/catch]]:

```js
try {
  const data = JSON.parse(text)
} catch (error) {
  console.error('Kein gültiges JSON:', error.message)
}
```

Beide Methoden haben optionale Zusatzparameter. `JSON.stringify(wert, replacer, einrueckung)` kann mit einem
*Replacer* Felder weglassen – praktisch, um etwa ein Passwortfeld nie mitzuschicken. `JSON.parse(text, reviver)`
kann jeden Wert beim Einlesen umbauen, zum Beispiel Datums-Strings zurück in `Date`-Objekte. Für den Alltag
reichen meist die einfachen Formen.

> [!MERKSATZ]
> `JSON.parse` vertraut nichts: Ein falsches Zeichen, und es wirft eine [[exception|Exception]]. Fange sie
> überall dort ab, wo der Text nicht aus deinem eigenen Code stammt.

## Was beim Serialisieren verloren geht

`JSON.stringify` kann nur das gemeinsame Datenmodell abbilden. Alles andere wird umgewandelt oder fällt weg:

| Wert in JavaScript | Ergebnis in JSON |
|---|---|
| `undefined`, Funktion (in einem Objekt) | Eigenschaft fehlt |
| `undefined`, Funktion (in einem Array) | `null` |
| `NaN`, `Infinity` | `null` |
| `new Date(…)` | ISO-String wie `"2026-10-09T08:00:00.000Z"` |
| `new Map(…)`, `new Set(…)` | `{}` – Inhalt weg! |

Nach dem Einlesen ist ein Datum also nur noch ein String. Willst du wieder ein `Date`, erzeugst du es
selbst: `new Date(data.createdAt)`.

> [!FEHLER]
> **`Map` oder `Set` speichern.** `JSON.stringify(new Map([['a', 1]]))` ergibt `{}` – ohne Fehlermeldung.
> Wandle sie vorher um, etwa mit `Object.fromEntries(map)` oder `[...set]`.

## PHP: json_encode und json_decode

In PHP heißen die Gegenstücke `json_encode` (serialisieren) und `json_decode` (deserialisieren):

```php
$user = ['name' => 'Ada', 'skills' => ['php', 'sql']];
$json = json_encode($user, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);

$data = json_decode($json, true, flags: JSON_THROW_ON_ERROR);
echo $data['skills'][1]; // sql
```

Der zweite Parameter von `json_decode` entscheidet, was du bekommst: `true` liefert ein
[[assoziatives-array|assoziatives Array]] (`$data['name']`), ohne ihn bekommst du ein `stdClass`-Objekt
(`$data->name`).

Die wichtigsten Flags:

| Flag | Wirkung |
|---|---|
| `JSON_THROW_ON_ERROR` | Fehler werfen eine `JsonException` |
| `JSON_PRETTY_PRINT` | eingerückt, mit Zeilenumbrüchen |
| `JSON_UNESCAPED_UNICODE` | `ü` statt `ü` |
| `JSON_UNESCAPED_SLASHES` | `/` statt `\/` |
| `JSON_PRESERVE_ZERO_FRACTION` | `1.0` bleibt `1.0` statt `1` |

Warum ist `JSON_THROW_ON_ERROR` so wichtig? Der Text `null` ist gültiges JSON und wird ebenfalls zu `null`.
Am Rückgabewert allein erkennst du also nicht, ob etwas schiefging. Mit dem Flag gibt es eine klare
`JsonException`, die du gezielt abfangen kannst.

Ohne `JSON_THROW_ON_ERROR` gibt `json_decode` bei Fehlern still `null` zurück, und nur
`json_last_error_msg()` verrät den Grund. Seit PHP 8.3 prüft `json_validate($text)` die Syntax, ohne die
Daten aufzubauen.

## Typen-Fallen zwischen PHP und JSON

PHP kennt nur „Array“ für Listen **und** Objekte. Beim Kodieren entscheidet der Inhalt:

```php
json_encode(['a', 'b']);            // ["a","b"]       Liste
json_encode(['x' => 1]);            // {"x":1}         Objekt
json_encode([]);                    // []              leeres Array!
json_encode([], JSON_FORCE_OBJECT); // {}
json_encode([1 => 'a', 2 => 'b']);  // {"1":"a","2":"b"} – Lücke im Index
```

> [!PRAXIS]
> Erwartet ein Frontend ein Objekt, bekommt aber bei leeren Daten `[]`, knallt es dort. In Laravel-APIs
> sieht man deshalb oft `(object) []` oder `JSON_FORCE_OBJECT`. Nach `array_filter` hilft `array_values`,
> damit aus einer Liste mit Lücken kein Objekt wird.

## JSON Schema: Struktur prüfen

`JSON.parse` prüft nur die Syntax. Ob ein Feld `email` existiert und ein String ist, prüft es nicht. Dafür
gibt es [[json-schema|JSON Schema]] – eine Beschreibung der erwarteten Struktur, selbst in JSON geschrieben:

```json title="user.schema.json"
{
  "type": "object",
  "required": ["name", "email"],
  "properties": {
    "name": { "type": "string", "minLength": 1 },
    "email": { "type": "string", "format": "email" },
    "age": { "type": "integer", "minimum": 0 }
  }
}
```

Bibliotheken wie Ajv (JavaScript) oder entsprechende Composer-Pakete prüfen Daten gegen so ein Schema. Auch
dein Editor nutzt JSON Schema: Er kennt daher die erlaubten Felder in `package.json` oder `tsconfig.json`.
Mehr dazu auf [json-schema.org](https://json-schema.org/).

## Zusammenfassung

- `JSON.parse` / `json_decode` deserialisieren, `JSON.stringify` / `json_encode` serialisieren.
- Fremde Daten immer mit Fehlerbehandlung einlesen: `try/catch` bzw. `JSON_THROW_ON_ERROR`.
- `undefined`, Funktionen, `Map` und `Set` überleben `JSON.stringify` nicht, Datumswerte werden Strings.
- `json_decode($json, true)` liefert ein assoziatives Array, ohne `true` ein `stdClass`-Objekt.
- Ein leeres PHP-Array wird zu `[]` – für ein leeres Objekt brauchst du `JSON_FORCE_OBJECT`.
- JSON Schema beschreibt und prüft die erwartete Struktur.
