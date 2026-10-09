---
title: Regex in PHP
summary: Begrenzer, Modifikatoren und die preg-Funktionen – preg_match, preg_match_all, preg_replace, preg_replace_callback, preg_split und preg_quote im Überblick.
duration: 25
sources:
  - title: PHP-Handbuch – PCRE-Funktionen
    url: https://www.php.net/manual/de/ref.pcre.php
  - title: PHP-Handbuch – preg_match
    url: https://www.php.net/manual/de/function.preg-match.php
  - title: PHP-Handbuch – Begrenzer
    url: https://www.php.net/manual/de/regexp.reference.delimiters.php
  - title: PHP-Handbuch – Modifikatoren
    url: https://www.php.net/manual/de/reference.pcre.pattern.modifiers.php
quiz:
  - type: single
    question: "Was gibt `preg_match('/\\d+/', 'Raum 42 und 43', $m)` zurück?"
    options:
      - "1 – und $m[0] ist „42“"
      - "2 – weil es zwei Zahlen gibt"
      - "true – und $m enthält beide Zahlen"
      - "„42“"
    answer: 0
    explanation: "preg_match() hört nach dem ersten Treffer auf und gibt 1 zurück (0 ohne Treffer, false bei einem Fehler). Für alle Treffer gibt es preg_match_all()."
  - type: match
    question: Welche PHP-Funktion entspricht welchem JavaScript-Aufruf?
    pairs:
      - { left: "preg_match()", right: "regex.test() bzw. text.match(regex)" }
      - { left: "preg_match_all()", right: "text.matchAll(regexMitG)" }
      - { left: "preg_replace()", right: "text.replace(regexMitG, \"…\")" }
      - { left: "preg_replace_callback()", right: "text.replace(regexMitG, funktion)" }
      - { left: "preg_split()", right: "text.split(regex)" }
    explanation: Die Ideen sind gleich, nur die Form unterscheidet sich. PHP ersetzt standardmäßig alle Treffer – ein g-Flag gibt es nicht.
  - type: find-bug
    question: PHP meldet „preg_match() No ending delimiter '/' found“. In welcher Zeile steckt der Fehler?
    language: php
    code: |
      $url = 'https://example.com/shop/item-42';
      if (preg_match('/^https://example\.com/', $url)) {
          echo 'interne URL';
      }
    bug_line: 2
    explanation: "Der Schrägstrich in `https://` beendet das Muster vorzeitig. Lösung: die Schrägstriche escapen oder einen anderen Begrenzer nehmen, z. B. `'#^https://example\\.com#'`."
  - type: cloze
    text: "In PHP steht das Muster zwischen zwei ___ wie `/…/` oder `#…#`. Der Modifikator `___` hinter dem Muster schaltet die Groß-/Kleinschreibung ab."
    blanks:
      - [Begrenzern, Begrenzer, Delimitern, Delimiter, Trennzeichen]
      - [i]
    explanation: "Die Begrenzer gehören zum Muster-String. Modifikatoren wie `i`, `m`, `s`, `x` und `u` folgen direkt nach dem schließenden Begrenzer."
tasks:
  - id: hashtags-und-kuerzel
    type: code
    language: php
    title: Hashtags sammeln und Kürzel ersetzen
    description: |
      Schreibe zwei Funktionen für eine Social-Media-Vorschau:

      1. `hashtags(string $text): array` gibt alle Hashtags **ohne** `#` in der Reihenfolge ihres Auftretens
         zurück. Ein Hashtag ist ein `#`, gefolgt von mindestens einem Buchstaben (auch Umlaute), einer Ziffer
         oder einem Unterstrich. `'Neu: #php und #Größe_2026!'` → `['php', 'Größe_2026']`.
      2. `ersetzeKuerzel(string $text, array $kuerzel): string` ersetzt **ganze Wörter** anhand einer Liste wie
         `['mfg' => 'Mit freundlichen Grüßen', 'lg' => 'Liebe Grüße']`. Groß-/Kleinschreibung beim Kürzel ist
         egal; Wörter, die nicht in der Liste stehen, bleiben unverändert. Nutze `preg_replace_callback()`.
    starter: |
      function hashtags(string $text): array
      {
          preg_match_all('/#(\w+)/', $text, $treffer);
          return $treffer[0];
      }

      function ersetzeKuerzel(string $text, array $kuerzel): string
      {
          return preg_replace_callback('/\b\w+\b/u', function (array $m) use ($kuerzel): string {
              return $m[0];
          }, $text);
      }
    tests:
      - name: "Hashtags werden ohne # geliefert"
        code: |
          assert_same(['php', 'regex'], hashtags('Ich lerne #php und #regex'));
      - name: Umlaute gehören zum Hashtag
        code: |
          assert_same(['php', 'Größe_2026'], hashtags('Neu: #php und #Größe_2026!'));
      - name: Ohne Hashtags gibt es ein leeres Array
        code: |
          assert_same([], hashtags('Keine Tags hier'));
          assert_same([], hashtags(''));
      - name: Kürzel werden ersetzt, auch großgeschrieben
        code: assert_same('Bis morgen, Liebe Grüße', ersetzeKuerzel('Bis morgen, LG', ['mfg' => 'Mit freundlichen Grüßen', 'lg' => 'Liebe Grüße']));
      - name: Nur ganze Wörter werden ersetzt
        code: assert_same('Folge dem Plan', ersetzeKuerzel('Folge dem Plan', ['lg' => 'Liebe Grüße', 'an' => 'XX']));
    hints:
      - "`$treffer[0]` enthält die ganzen Treffer, `$treffer[1]` die Inhalte der ersten Gruppe."
      - "Für Umlaute brauchst du den Modifikator `u` und `\\p{L}` statt `\\w`: `'/#([\\p{L}\\d_]+)/u'`."
      - "In der Callback-Funktion: `$kuerzel[mb_strtolower($m[0])] ?? $m[0]`."
    solution: |
      ```php
      function hashtags(string $text): array
      {
          preg_match_all('/#([\p{L}\d_]+)/u', $text, $treffer);
          return $treffer[1];
      }

      function ersetzeKuerzel(string $text, array $kuerzel): string
      {
          return preg_replace_callback('/\b\w+\b/u', function (array $m) use ($kuerzel): string {
              return $kuerzel[mb_strtolower($m[0])] ?? $m[0];
          }, $text);
      }
      ```
  - id: rueckgabewerte
    type: dragdrop
    title: Was kommt zurück?
    description: Ordne jeden Ausdruck seinem Rückgabewert zu.
    targets:
      - { id: eins, label: "1" }
      - { id: null-treffer, label: "0" }
      - { id: zahl, label: "3" }
      - { id: text, label: "ein String" }
      - { id: liste, label: "ein Array" }
    items:
      - { label: "preg_match('/\\d/', 'a1b2')", target: eins }
      - { label: "preg_match('/\\d/', 'abc')", target: null-treffer }
      - { label: "preg_match_all('/\\d/', 'a1b2c3')", target: zahl }
      - { label: "preg_replace('/\\d/', '#', 'a1b2')", target: text }
      - { label: "preg_split('/,\\s*/', 'a, b,c')", target: liste }
      - { label: "preg_quote('1.5')", target: text }
---
Im PHP-Backend begegnen dir Regex überall: in Validierungsregeln, beim Zerlegen von Importdateien oder beim
Umbau von Texten. PHP nutzt die Bibliothek [[pcre|PCRE]]. Die Muster sehen fast genauso aus wie in
JavaScript – verpackt sind sie aber anders.

## Begrenzer und Modifikatoren

In PHP ist ein Muster ein **String**. Darin steht das Muster zwischen zwei [[regex-begrenzer|Begrenzern]],
dahinter optional die Modifikatoren (so heißen Flags in PHP):

```php
$muster = '/^\d{5}$/';       // Begrenzer: /
$muster = '#^https://#i';    // Begrenzer: # – praktisch bei URLs
$muster = '~^\d+ ms$~';      // auch ~ ist üblich
```

Kommt der Begrenzer im Muster vor, musst du ihn escapen. Deshalb nimmt man für URLs und Pfade gern `#` oder
`~`. Schreibe Muster in **einfachen** Anführungszeichen – dann musst du Backslashes nicht verdoppeln.

| Modifikator | Wirkung |
|---|---|
| `i` | Groß-/Kleinschreibung egal |
| `m` | `^` und `$` pro Zeile |
| `s` | `.` passt auch auf Zeilenumbrüche |
| `x` | Leerzeichen und `#`-Kommentare im Muster erlaubt |
| `u` | UTF-8-Modus – für Umlaute und `\p{L}` |

> [!MERKSATZ]
> Ein `g` gibt es in PHP nicht. Ob ein Treffer oder alle – das entscheidet die **Funktion**:
> `preg_match()` oder `preg_match_all()`.

## preg_match: passt es – und was steckt drin?

`preg_match($muster, $text, $treffer)` sucht den **ersten** Treffer. Der Rückgabewert ist `1` (Treffer),
`0` (kein Treffer) oder `false` (Fehler im Muster). Die Gruppen landen im dritten Parameter.

```php
$zeile = '2026-10-01 08:02:45 [ERROR] db: Query timeout';
if (preg_match('/\[(?<level>[A-Z]+)\] (?<source>[a-z]+):/', $zeile, $m) === 1) {
    echo $m['level'];   // ERROR
    echo $m[2];         // db – benannte Gruppen haben zusätzlich eine Nummer
}
```

> [!FEHLER]
> **`if (preg_match(...) == false)`** behandelt „kein Treffer“ (0) und „kaputtes Muster“ (false) gleich.
> Vergleiche mit `=== 1` oder `=== 0`. Die genaue Fehlermeldung liefert `preg_last_error_msg()`.

## preg_match_all: alle Treffer

`preg_match_all()` gibt die **Anzahl** der Treffer zurück. Die Ergebnisse sind standardmäßig nach Gruppen
sortiert (`PREG_PATTERN_ORDER`):

```php
preg_match_all('/B-(\d+)/', 'B-1042 und B-7719', $m);
// $m[0] = ['B-1042', 'B-7719']   alle ganzen Treffer
// $m[1] = ['1042', '7719']       alle Werte von Gruppe 1
```

Brauchst du pro Treffer ein Array, übergibst du `PREG_SET_ORDER`:

```php
preg_match_all('/(?<nr>B-\d+)/', 'B-1042 und B-7719', $m, PREG_SET_ORDER);
foreach ($m as $treffer) {
    echo $treffer['nr'], PHP_EOL;
}
```

| Flag | Aufbau von `$m` | gut für |
|---|---|---|
| `PREG_PATTERN_ORDER` (Standard) | eine Liste pro Gruppe | „Gib mir alle Werte von Gruppe 1“ |
| `PREG_SET_ORDER` | ein Array pro Treffer | Treffer in einer Schleife verarbeiten |
| `PREG_OFFSET_CAPTURE` | zusätzlich die Position jedes Treffers | Fundstellen markieren |

Gibt es keinen Treffer, liefert `preg_match_all()` den Wert `0` und `$m[0]` ist ein leeres Array. Du musst
also nicht prüfen, ob die Liste existiert – eine `foreach`-Schleife läuft dann einfach nicht.

## Ersetzen und Zerlegen

| Funktion | Zweck |
|---|---|
| `preg_replace($muster, $ersatz, $text)` | alle Treffer ersetzen; `$1` oder `${1}` für Gruppen |
| `preg_replace_callback($muster, $fn, $text)` | Ersatz per Funktion berechnen |
| `preg_split($muster, $text)` | Text an Treffern zerlegen |
| `preg_quote($text, '/')` | Metazeichen in einem Text escapen |

```php
echo preg_replace('/(\d{4})-(\d{2})-(\d{2})/', '$3.$2.$1', '2026-10-09');  // 09.10.2026

echo preg_replace_callback('/\d+/', fn (array $m): string => (string) ($m[0] * 2), '3 und 12');  // 6 und 24

print_r(preg_split('/\s*,\s*/', 'php , laravel,api'));  // ['php', 'laravel', 'api']

$suche = preg_quote('1.5 (neu)', '/');   // 1\.5 \(neu\)
```

> [!PRAXIS]
> Wenn ein Muster einen Wert aus einer Benutzereingabe enthält, gehört er **immer** durch `preg_quote()`.
> Sonst sucht die Eingabe „1.5“ auch nach „125“ – und eine Eingabe wie „(“ wirft einen Fehler.

## Unicode und lesbare Muster

Ohne `u` arbeitet PCRE mit **Bytes**. Ein „ü“ besteht in UTF-8 aus zwei Bytes – `.` würde nur eines davon
treffen. Mit `u` zählt PHP Zeichen:

```php
var_dump(preg_match('/^.{5}$/', 'Grüße'));    // int(0) – 7 Bytes
var_dump(preg_match('/^.{5}$/u', 'Grüße'));   // int(1)
```

Mit `x` darfst du lange Muster auf mehrere Zeilen verteilen und kommentieren – mehr dazu in Modul 4.

## Zusammenfassung

- PHP-Muster stehen in einem String zwischen **Begrenzern** (`/…/`, `#…#`, `~…~`), Modifikatoren folgen danach.
- `preg_match()` liefert 1, 0 oder false – vergleiche strikt mit `===`.
- `preg_match_all()` zählt alle Treffer; `PREG_SET_ORDER` liefert ein Array pro Treffer.
- `preg_replace()` ersetzt immer alle Treffer, `preg_replace_callback()` berechnet den Ersatz.
- `preg_split()` zerlegt, `preg_quote()` escapt Benutzereingaben.
- Für Umlaute und `\p{L}` brauchst du den Modifikator `u`.
