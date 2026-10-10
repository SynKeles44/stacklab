---
title: Unicode und UTF-8
summary: Zeichen, Codepoints, Bytes und Grapheme – warum strlen lügt, wie Normalisierung funktioniert und wie du kaputte Umlaute vermeidest.
duration: 25
sources:
  - title: MDN – String.prototype.normalize()
    url: https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/String/normalize
  - title: MDN – Intl.Segmenter
    url: https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter
  - title: PHP-Handbuch – Grapheme-Funktionen
    url: https://www.php.net/manual/de/ref.intl.grapheme.php
  - title: PHP-Handbuch – Normalizer
    url: https://www.php.net/manual/de/class.normalizer.php
  - title: W3C – Character encodings for beginners
    url: https://www.w3.org/International/questions/qa-what-is-encoding
quiz:
  - type: single
    question: Wie viele Bytes belegt das Wort „Größe“ in UTF-8?
    options: ["5", "6", "7", "10"]
    answer: 2
    explanation: >
      G, r, e und das zweite e brauchen je 1 Byte, „ö“ und „ß“ je 2 Bytes: 4 + 2 + 2 = 7 Bytes bei 5 Zeichen.
  - type: match
    question: Ordne jedem Ausdruck sein Ergebnis zu.
    pairs:
      - { left: "\"😀\".length (JavaScript)", right: "2" }
      - { left: "[...\"😀\"].length (JavaScript)", right: "1" }
      - { left: "strlen('ä') (PHP)", right: "2 Bytes" }
      - { left: "mb_strlen('ä') (PHP)", right: "1 Codepoint" }
    explanation: >
      JavaScript zählt bei `.length` UTF-16-Einheiten – Emojis außerhalb der Grundebene brauchen zwei davon.
      Der Spread-Operator zählt Codepoints. PHP zählt mit strlen Bytes, mit mb_strlen Codepoints.
  - type: multiple
    question: Welche Aussagen über Normalisierung stimmen?
    options:
      - "„é“ kann als ein Codepoint (U+00E9) oder als „e“ plus Akzent (U+0065 U+0301) gespeichert sein."
      - Ohne Normalisierung kann `===` zwei gleich aussehende Wörter als verschieden melden.
      - NFC setzt Zeichen möglichst zu einem Codepoint zusammen.
      - Normalisierung entfernt alle Akzente aus einem Text.
    answers: [0, 1, 2]
    explanation: >
      Unicode erlaubt mehrere Darstellungen desselben Zeichens. NFC (zusammengesetzt) und NFD (zerlegt)
      bringen Texte in eine einheitliche Form. Akzente bleiben dabei erhalten.
  - type: find-bug
    question: Die Vorschau soll höchstens 10 sichtbare Zeichen zeigen. Bei Emojis erscheinen manchmal kaputte Zeichen. Welche Zeile ist schuld?
    language: php
    code: |
      <?php
      function vorschau(string $text): string
      {
          if (grapheme_strlen($text) <= 10) {
              return $text;
          }
          return substr($text, 0, 10) . '…';
      }
    bug_line: 7
    explanation: >
      `substr` schneidet nach Bytes und kann ein Mehrbyte-Zeichen mittendrin trennen. Richtig ist
      `grapheme_substr($text, 0, 10)`.
tasks:
  - id: text-normalisieren
    type: terminal
    title: Namen normalisieren und Längen messen
    description: |
      Im Ordner `normalisieren` liegt `namen.txt` – eine Liste von Namen aus einem Import. Die Namen sehen
      normal aus, sind aber in der **zerlegten** Form (NFD) gespeichert: „é“ steht dort als „e“ plus
      Akzentzeichen. Klicke zuerst auf **Aufgabe vorbereiten**.

      1. Sieh dir die Bytes an, z. B. mit `head -n 1 namen.txt | od -c`. Du erkennst die Akzente als eigene Bytes.
      2. Erzeuge die Datei `namen-nfc.txt` mit demselben Text in der Normalform **NFC** – z. B. mit PHP und
         `Normalizer::normalize(…, Normalizer::FORM_C)`.
      3. Schreibe ein Skript `laenge.php`, das sein erstes Argument untersucht und genau eine Zeile in dieser
         Form ausgibt:

         ```text
         Bytes: 7, Codepoints: 5, Grapheme: 5
         ```

         (Das ist die Ausgabe für `php laenge.php "Größe"`.)
    workdir: normalisieren
    setup: |
      printf 'Rene\xcc\x81e\nZoe\xcc\x88\nMu\xcc\x88ller\nA\xcc\x8angstro\xcc\x88m\n' > namen.txt
    checks:
      - type: file_exists
        path: namen-nfc.txt
        message: Die Datei namen-nfc.txt fehlt noch.
      - type: command
        run: |-
          php -r 'echo Normalizer::isNormalized(file_get_contents("namen-nfc.txt"), Normalizer::FORM_C) ? "ja" : "nein";'
        stdout_equals: "ja"
        message: namen-nfc.txt ist noch nicht in der Form NFC. Nutze Normalizer::FORM_C.
      - type: command
        run: |-
          php -r 'echo Normalizer::normalize(file_get_contents("namen.txt"), Normalizer::FORM_C) === file_get_contents("namen-nfc.txt") ? "gleich" : "anders";'
        stdout_equals: "gleich"
        message: namen-nfc.txt soll genau den Text aus namen.txt enthalten – nur normalisiert. Achte darauf, keine Zeilen zu verlieren oder anzuhängen.
      - type: file_exists
        path: laenge.php
        message: Das Skript laenge.php fehlt noch.
      - type: command
        run: php laenge.php "Größe"
        stdout_matches: "^Bytes: 7, Codepoints: 5, Grapheme: 5\\s*$"
        message: "php laenge.php \"Größe\" soll genau „Bytes: 7, Codepoints: 5, Grapheme: 5“ ausgeben. Nutze strlen, mb_strlen und grapheme_strlen."
      - type: command
        run: php laenge.php "$(printf '\xf0\x9f\x91\x8d\xf0\x9f\x8f\xbde\xcc\x81')"
        stdout_matches: "^Bytes: 11, Codepoints: 4, Grapheme: 2\\s*$"
        message: Für einen Daumen mit Hautfarbe plus ein zerlegtes „é“ erwartet die Prüfung 11 Bytes, 4 Codepoints und 2 Grapheme. Zählst du Grapheme mit grapheme_strlen?
    hints:
      - "`php -r 'echo Normalizer::normalize(file_get_contents(\"namen.txt\"), Normalizer::FORM_C);' > namen-nfc.txt`"
      - "Das erste Argument eines PHP-Skripts steht in `$argv[1]`."
      - "`printf(\"Bytes: %d, Codepoints: %d, Grapheme: %d\\n\", strlen($t), mb_strlen($t), grapheme_strlen($t));`"
    solution: |
      ```bash
      cd normalisieren
      head -n 1 namen.txt | od -c
      php -r 'echo Normalizer::normalize(file_get_contents("namen.txt"), Normalizer::FORM_C);' > namen-nfc.txt
      wc -c namen.txt namen-nfc.txt
      cat > laenge.php <<'PHP'
      <?php
      $text = $argv[1] ?? '';
      printf("Bytes: %d, Codepoints: %d, Grapheme: %d\n", strlen($text), mb_strlen($text), grapheme_strlen($text));
      PHP
      php laenge.php "Größe"
      ```
  - id: sicher-kuerzen
    type: code
    language: php
    title: Text kürzen, ohne Zeichen zu zerbrechen
    description: |
      Für eine Vorschau sollen lange Texte gekürzt werden. Schreibe `kuerzen(string $text, int $max): string`:

      - Hat der Text höchstens `$max` **sichtbare Zeichen** (Grapheme), gib ihn unverändert zurück.
      - Sonst gib die ersten `$max` Grapheme zurück und hänge `…` an.

      Emojis mit Hautfarbe oder ein „é“ aus zwei Codepoints dürfen dabei nie zerbrechen. Der Starter-Code
      funktioniert für einfache Texte schon – finde heraus, warum er bei Emojis scheitert.
    starter: |
      <?php
      declare(strict_types=1);

      function kuerzen(string $text, int $max): string
      {
          if (mb_strlen($text) <= $max) {
              return $text;
          }
          return mb_substr($text, 0, $max) . '…';
      }
    tests:
      - name: kürzt einen normalen Text
        code: assert_same('Hallo…', kuerzen('Hallo Welt', 5))
      - name: kurze Texte bleiben unverändert – auch mit Umlauten
        code: assert_same('Größe', kuerzen('Größe', 5))
      - name: leerer Text
        code: assert_same('', kuerzen('', 3))
      - name: Emojis mit Hautfarbe bleiben ganz
        code: assert_same("👍🏽👍🏽…", kuerzen("👍🏽👍🏽👍🏽", 2))
      - name: zerlegtes é zählt als ein Zeichen
        code: assert_same("Cafe\u{301}…", kuerzen("Cafe\u{301} au lait", 4))
    solution: |
      <?php
      declare(strict_types=1);

      function kuerzen(string $text, int $max): string
      {
          if (grapheme_strlen($text) <= $max) {
              return $text;
          }
          return grapheme_substr($text, 0, $max) . '…';
      }
    hints:
      - "Der Starter zählt mit `mb_strlen` schon Codepoints statt Bytes – aber ein Emoji mit Hautfarbe besteht aus zwei Codepoints."
      - Die intl-Erweiterung hat Gegenstücke, die mit Graphemen arbeiten.
      - "`grapheme_strlen()` und `grapheme_substr()`."
---
Ein Kunde heißt „Müller“, aber in der Bestellbestätigung steht „MÃ¼ller“. Eine Vorschau schneidet ein Emoji
mittendrin ab, und die Suche nach „René“ findet einen Datensatz nicht, obwohl er sichtbar dasselbe Wort
enthält. Alle drei Fehler haben dieselbe Ursache: Text ist für den Computer eine Folge von **Bytes** – und
zwischen Bytes und dem, was Menschen als „Zeichen“ sehen, liegen zwei Ebenen.

## Zeichen, Codepoints und Bytes

[[unicode|Unicode]] gibt jedem Zeichen der Welt eine Nummer, den [[codepoint|Codepoint]]. Man schreibt ihn
als `U+` mit einer hexadezimalen Zahl: „A“ ist `U+0041`, „ä“ ist `U+00E4`, „€“ ist `U+20AC`.

Um Codepoints in Dateien und über das Netz zu speichern, braucht es eine
[[zeichenkodierung|Zeichenkodierung]]. Der Standard im Web ist **UTF-8**: Er nutzt 1 bis 4 Bytes pro
Codepoint.

![Vier Zeichen mit ihren Codepoints und UTF-8-Bytes: A braucht 1 Byte, ä 2, € 3 und 😀 4 Bytes](/assets/internationalisierung/utf8-bytes.svg)

Die ersten 128 Codepoints (ASCII) sind in UTF-8 genau ein Byte – deshalb funktioniert englischer Text
„zufällig“ auch mit falsch eingestellter Kodierung. Bei Umlauten zeigt sich der Fehler sofort.

> [!MERKSATZ]
> Ein Zeichen ist nicht ein Byte. „Größe“ hat 5 Zeichen, aber 7 Bytes.

## Warum Längen lügen

Jede Sprache zählt anders – und meistens nicht das, was du erwartest:

```js run
console.log("Größe".length);                      // 5
console.log(new TextEncoder().encode("Größe").length); // 7 Bytes
console.log("😀".length);                         // 2 – UTF-16-Einheiten!
console.log([..."😀"].length);                    // 1 Codepoint
```

```php title="PHP"
strlen('Größe');     // 7  – zählt Bytes
mb_strlen('Größe');  // 5  – zählt Codepoints
```

JavaScript speichert Strings intern in UTF-16. Zeichen jenseits von `U+FFFF`, etwa viele Emojis, brauchen
dort zwei Einheiten. PHP-Strings sind dagegen einfach Bytes – deshalb gibt es die
[[multibyte-funktion|Multibyte-Funktionen]] `mb_*`.

## Grapheme: was Menschen als Zeichen sehen

Auch Codepoints sind noch nicht „Zeichen“. Das Emoji 👍🏽 besteht aus zwei Codepoints (Daumen +
Hautfarbe), die Familie 👨‍👩‍👧 sogar aus fünf. Was Menschen als **ein** Zeichen wahrnehmen, heißt
[[graphem|Graphem]] (genauer: Graphem-Cluster).

| Text | Bytes (UTF-8) | Codepoints | Grapheme |
|---|---|---|---|
| `Größe` | 7 | 5 | 5 |
| `👍🏽` | 8 | 2 | 1 |
| `é` als e + Akzent | 3 | 2 | 1 |

```js run
const seg = new Intl.Segmenter("de", { granularity: "grapheme" });
console.log([...seg.segment("👍🏽é")].length); // 2
```

In PHP heißen die Gegenstücke `grapheme_strlen()` und `grapheme_substr()`.

> [!FEHLER]
> Wer zum Kürzen `substr()` oder `text.slice(0, 10)` nutzt, kann ein Zeichen mitten durchschneiden. Übrig
> bleibt ein „�“ oder ein Emoji ohne Hautfarbe. Für Vorschauen und Zeichenlimits zählst du Grapheme.

## Normalisierung: gleich aussehen, verschieden sein

Unicode erlaubt für manche Zeichen zwei Schreibweisen: „é“ als **ein** Codepoint `U+00E9` oder als „e“
plus kombinierender Akzent `U+0301`. Sie sehen gleich aus, sind aber verschiedene Bytes. Das ist die
[[unicode-normalisierung|Unicode-Normalisierung]]:

- **NFC** setzt Zeichen möglichst zusammen (Standard im Web, auf Windows und Linux).
- **NFD** zerlegt sie (macOS-Dateinamen und manche Importe liefern das).

```js run
const a = "é";       // é als ein Codepoint
const b = "é";      // e + Akzent
console.log(a === b);                                   // false
console.log(a.normalize("NFC") === b.normalize("NFC")); // true
```

```php title="PHP"
Normalizer::normalize($text, Normalizer::FORM_C);
```

> [!PRAXIS]
> Normalisiere Texte **an der Grenze** deines Systems – beim Speichern von Formulareingaben und Importen.
> Dann funktionieren Vergleiche, Suche und eindeutige Benutzernamen zuverlässig.

## UTF-8 überall – sonst Mojibake

„MÃ¼ller“ entsteht, wenn UTF-8-Bytes als ein anderes Format (meist Latin-1) gelesen werden. Dieses
Zeichenchaos heißt [[mojibake|Mojibake]]. Es verschwindet nur, wenn **jede** Station UTF-8 spricht:

| Station | So stellst du UTF-8 ein |
|---|---|
| HTML | `<meta charset="utf-8">` ganz oben im `<head>` |
| HTTP | `Content-Type: text/html; charset=utf-8` |
| Dateien | Editor speichert UTF-8 (ohne [[bom|BOM]]) |
| MySQL/MariaDB | Zeichensatz `utf8mb4` (nur das deckt Emojis ab) |
| PostgreSQL | Datenbank mit Kodierung `UTF8` anlegen |

## Zusammenfassung

- **Unicode** nummeriert Zeichen (Codepoints), **UTF-8** speichert sie in 1–4 Bytes.
- `strlen` zählt Bytes, `mb_strlen` Codepoints, `.length` in JavaScript UTF-16-Einheiten.
- Ein **Graphem** ist das, was Menschen als ein Zeichen sehen – zum Kürzen nutzt du `Intl.Segmenter` oder `grapheme_*`.
- Dasselbe Zeichen kann verschieden kodiert sein; **NFC-Normalisierung** macht Vergleiche zuverlässig.
- Mojibake entsteht, wenn eine Station der Kette nicht UTF-8 spricht – stelle UTF-8 überall ein.
