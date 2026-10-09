---
title: CSV und seine Tücken
summary: CSV sieht trivial aus – bis ein Komma im Namen steht, Excel ein Semikolon erwartet oder die Postleitzahl ihre Null verliert.
duration: 25
sources:
  - title: RFC 4180 – Common Format and MIME Type for CSV Files
    url: https://www.rfc-editor.org/rfc/rfc4180
  - title: PHP-Handbuch – str_getcsv
    url: https://www.php.net/manual/de/function.str-getcsv.php
  - title: PHP-Handbuch – fgetcsv
    url: https://www.php.net/manual/de/function.fgetcsv.php
  - title: OWASP – CSV Injection
    url: https://owasp.org/www-community/attacks/CSV_Injection
quiz:
  - type: single
    question: "Wie steht der Wert `Müller, Anna` korrekt in einer CSV-Datei mit Komma als Trennzeichen?"
    options:
      - "Müller, Anna"
      - "\"Müller, Anna\""
      - "Müller\\, Anna"
      - "'Müller, Anna'"
    answer: 1
    explanation: Felder, die das Trennzeichen, ein Anführungszeichen oder einen Zeilenumbruch enthalten, werden in doppelte Anführungszeichen gesetzt. Ein Backslash ist in CSV kein Escape-Zeichen.
  - type: cloze
    text: "Ein Anführungszeichen innerhalb eines gequoteten CSV-Felds schreibst du ___. Deutsche Excel-Versionen nutzen als Trennzeichen meist das ___."
    blanks:
      - ['""', "doppelt", "verdoppelt", "zwei Anführungszeichen"]
      - [Semikolon, ";"]
    explanation: "Aus Sie sagte \"Hallo\" wird im Feld \"Sie sagte \"\"Hallo\"\"\". Weil das Komma im Deutschen das Dezimalzeichen ist, exportiert Excel hierzulande mit Semikolon."
  - type: find-bug
    question: Dieser Code soll eine CSV-Zeile in Felder zerlegen. Bei manchen Kunden kommen zu viele Spalten heraus. Welche Zeile ist schuld?
    language: js
    code: |
      const zeile = '42,"Müller, Anna",Musterstadt'
      const felder = zeile.split(',')
      console.log(felder.length)
    bug_line: 2
    explanation: split(',') kennt keine Anführungszeichen und trennt auch das Komma im Namen. Heraus kommen vier statt drei Felder. Nutze einen echten CSV-Parser.
  - type: multiple
    question: Welche Informationen gehen verloren, wenn du Daten als CSV speicherst?
    options:
      - Datentypen – alles ist Text
      - Verschachtelte Strukturen wie Listen in einem Feld
      - Die Reihenfolge der Zeilen
      - Die Angabe der Zeichenkodierung
    answers: [0, 1, 3]
    explanation: CSV kennt nur Zeilen und Spalten aus Text und sagt nichts über seine Kodierung. Die Reihenfolge der Zeilen bleibt dagegen erhalten.
tasks:
  - id: csv-zu-json
    type: code
    language: php
    title: Einen Excel-Export in JSON umwandeln
    description: |
      Eine Kollegin exportiert eine Kundenliste aus einer deutschen Tabellenkalkulation. Die Datei hat:

      - eine **Kopfzeile** mit den Spaltennamen,
      - **Semikolon** als Trennzeichen und doppelte Anführungszeichen um Felder mit Sonderzeichen,
      - manchmal ein **BOM** (die unsichtbaren Bytes `"\xEF\xBB\xBF"`) am Anfang,
      - manchmal **leere Zeilen**, etwa am Dateiende.

      Schreibe `csvToJson(string $csv): string`. Sie gibt ein JSON-Array mit einem Objekt pro Datenzeile
      zurück; die Schlüssel kommen aus der Kopfzeile, alle Werte bleiben **Strings** (die Postleitzahl `01234`
      behält ihre Null!). Umlaute sollen lesbar bleiben. Zeilenumbrüche sind `\n`.

      Nutze `str_getcsv($zeile, ';', '"', '')` – das leere vierte Argument schaltet das veraltete
      Backslash-Escaping ab.
    starter: |
      function csvToJson(string $csv): string
      {
          // 1. BOM entfernen
          // 2. In Zeilen teilen, leere Zeilen überspringen
          // 3. Kopfzeile lesen, jede weitere Zeile mit array_combine() zu einem Objekt machen
          return '[]';
      }
    tests:
      - name: Kopfzeile und Datenzeilen werden zu Objekten
        code: |
          $csv = "id;name;plz\n1;Ada;01234\n2;Linus;12345";
          assert_same('[{"id":"1","name":"Ada","plz":"01234"},{"id":"2","name":"Linus","plz":"12345"}]', csvToJson($csv));
      - name: Gequotete Felder mit Semikolon und Anführungszeichen
        code: |
          $csv = "id;name;notiz\n7;\"Müller; Anna\";\"sagt \"\"Hallo\"\"\"";
          assert_same('[{"id":"7","name":"Müller; Anna","notiz":"sagt \"Hallo\""}]', csvToJson($csv));
      - name: BOM und leere Zeilen werden ignoriert
        code: |
          $csv = "\xEF\xBB\xBFid;name\n\n3;Grace\n\n";
          assert_same('[{"id":"3","name":"Grace"}]', csvToJson($csv));
      - name: Nur eine Kopfzeile ergibt ein leeres Array
        code: |
          assert_same('[]', csvToJson("id;name\n"));
    hints:
      - "Den BOM entfernst du mit `if (str_starts_with($csv, \"\\xEF\\xBB\\xBF\")) { $csv = substr($csv, 3); }`."
      - "`array_filter(explode(\"\\n\", $csv), fn ($z) => trim($z) !== '')` liefert die nicht-leeren Zeilen. Danach `array_values`, damit die Indizes wieder bei 0 beginnen."
      - "Die erste Zeile ist die Kopfzeile: `$header = str_getcsv(array_shift($zeilen), ';', '\"', '');`. Für jede weitere Zeile: `array_combine($header, str_getcsv($zeile, ';', '\"', ''))`."
    solution: |
      ```php
      function csvToJson(string $csv): string
      {
          if (str_starts_with($csv, "\xEF\xBB\xBF")) {
              $csv = substr($csv, 3);
          }

          $lines = array_values(array_filter(explode("\n", $csv), fn (string $line): bool => trim($line) !== ''));
          if ($lines === []) {
              return '[]';
          }

          $header = str_getcsv(array_shift($lines), ';', '"', '');
          $rows = [];
          foreach ($lines as $line) {
              $rows[] = array_combine($header, str_getcsv($line, ';', '"', ''));
          }

          return json_encode($rows, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
      }
      ```
  - id: csv-import-ablauf
    type: order
    title: Einen CSV-Import sicher aufbauen
    description: Du baust einen Import für CSV-Dateien, die Kund:innen aus ihrer Tabellenkalkulation hochladen. Bringe die Schritte in eine sinnvolle Reihenfolge.
    items:
      - Zeichenkodierung prüfen und einen BOM am Anfang entfernen
      - Trennzeichen bestimmen (Komma oder Semikolon)
      - Kopfzeile lesen und die erwarteten Spalten prüfen
      - Jede Zeile mit einem echten CSV-Parser zerlegen
      - Werte in die richtigen Typen umwandeln (Zahlen, Datum)
      - Jeden Datensatz validieren und fehlerhafte Zeilen melden
    hints:
      - Erst musst du die Datei überhaupt richtig lesen können, bevor du dich um einzelne Werte kümmerst.
---
CSV ist das älteste und einfachste Format in diesem Kurs: Text, eine Zeile pro Datensatz, Spalten durch
Kommas getrennt. Jede Tabellenkalkulation liest und schreibt es. Genau deshalb landen CSV-Dateien ständig auf
deinem Tisch – und genau deshalb lohnt es sich, ihre Fallen zu kennen.

## Der Aufbau einer CSV-Datei

[[csv|CSV]] steht für *Comma-Separated Values*. Die erste Zeile ist meist eine Kopfzeile mit den
Spaltennamen, jede weitere Zeile ist ein [[datensatz|Datensatz]]:

```text title="kunden.csv"
id,name,stadt,plz
1,Ada,Musterstadt,01234
2,"Müller, Anna",Beispielhausen,12345
3,"Sie sagt ""Hallo""",Musterstadt,54321
```

Das Wichtigste regelt RFC 4180:

| Regel | Beispiel |
|---|---|
| Spalten durch ein [[trennzeichen\|Trennzeichen]] getrennt | `1,Ada,Musterstadt` |
| Feld mit Trennzeichen, `"` oder Zeilenumbruch → in `"…"` | `"Müller, Anna"` |
| `"` im Feld wird verdoppelt | `"Sie sagt ""Hallo"""` |
| jede Zeile hat gleich viele Felder | 4 Spalten überall |

Der Standard ist allerdings nur eine Empfehlung. Viele Programme halten sich nicht daran – das ist die Wurzel
fast aller CSV-Probleme.

> [!MERKSATZ]
> CSV ist eine Tabelle aus **Text**. Es gibt keine Typen, keine Verschachtelung und keinen festen Standard
> für Trennzeichen und Kodierung.

## Die typischen Fallen

| Falle | Was passiert | Gegenmittel |
|---|---|---|
| Semikolon statt Komma | Deutsches Excel nutzt `;`, weil `,` das Dezimalzeichen ist | Trennzeichen prüfen oder erkennen |
| Kodierung | Umlaute erscheinen als `Ã¼` | UTF-8 erzwingen, ggf. umwandeln |
| [[bom\|BOM]] | unsichtbare Bytes vor der ersten Spalte | am Anfang entfernen |
| keine Typen | `01234` wird zu `1234`, `1.10` zu `1.1` | Spalten bewusst umwandeln |
| Zeilenumbruch im Feld | ein Datensatz über zwei Zeilen | echten Parser verwenden |
| Formeln | `=SUMME(…)` wird beim Öffnen ausgeführt | Werte mit `=`, `+`, `-`, `@` absichern |

Die letzte Zeile heißt *CSV-Injection*: Erzeugt dein Programm eine CSV-Datei aus Nutzereingaben, kann ein Feld
wie `=HYPERLINK(…)` beim Öffnen in einer Tabellenkalkulation zur Formel werden. Exporte für Menschen solltest
du deshalb absichern.

> [!PRAXIS]
> Exporte aus Tabellenkalkulationen kommen in der Praxis oft mit Semikolon, Windows-Zeilenenden (`\r\n`) und
> BOM. Ein guter Import erkennt das selbst, statt Kund:innen zu bitten, „die Datei nochmal richtig zu speichern“.

## CSV richtig lesen: nie mit split

Der häufigste Fehler im Code ist, eine Zeile einfach am Komma zu zerschneiden:

```js
'2,"Müller, Anna",Beispielhausen'.split(',')
// [ '2', '"Müller', ' Anna"', 'Beispielhausen' ]  ← vier statt drei Felder
```

Nutze immer einen echten CSV-[[parser|Parser]]. In PHP sind das `str_getcsv` (für einen String) und
`fgetcsv` (Zeile für Zeile aus einer Datei):

```php
$handle = fopen('kunden.csv', 'r');
$header = fgetcsv($handle, null, ',', '"', '');
while (($row = fgetcsv($handle, null, ',', '"', '')) !== false) {
    $kunde = array_combine($header, $row);
    echo $kunde['name'], PHP_EOL;
}
fclose($handle);
```

Das letzte Argument `''` schaltet das PHP-eigene Backslash-Escaping ab, das nicht zum Standard gehört. Seit
PHP 8.4 erzeugt PHP eine Deprecation-Warnung, wenn du es nicht angibst. In JavaScript greifst du zu einer
Bibliothek wie Papa Parse.

> [!FEHLER]
> **CSV mit `explode(',')` oder `split(',')` zerlegen.** Das funktioniert mit Testdaten – bis zum ersten
> Namen mit Komma oder der ersten Adresse mit Zeilenumbruch. Dann verrutschen still alle Spalten.

## CSV schreiben und Alternativen

Auch beim Schreiben übernimmt die Bibliothek das Quoting: `fputcsv($handle, $zeile, ';', '"', '')` setzt
Anführungszeichen genau dort, wo sie nötig sind. Mit jq erzeugst du CSV über den Filter `@csv`.

Eine Variante ist **TSV** (*Tab-Separated Values*) mit dem Tabulator als Trennzeichen. Tabs kommen in
normalem Text selten vor, deshalb ist Quoting dort kaum nötig.

Wann CSV die richtige Wahl ist:

- **ja** für flache Tabellen, Exporte für Tabellenkalkulationen, große Datenmengen mit gleichem Aufbau,
- **nein** für verschachtelte Daten, Konfiguration oder alles, wo Typen wichtig sind – dafür gibt es JSON.

## Zusammenfassung

- CSV ist eine Tabelle aus Text: Kopfzeile, eine Zeile pro Datensatz, Spalten durch ein Trennzeichen getrennt.
- Felder mit Trennzeichen, Anführungszeichen oder Zeilenumbruch stehen in `"…"`, `"` wird verdoppelt.
- Typische Fallen: Semikolon, Kodierung und BOM, fehlende Typen, Formeln in Feldern.
- Zerlege CSV nie mit `split`/`explode`, sondern mit `str_getcsv`/`fgetcsv` oder einer Bibliothek.
- CSV passt für flache Tabellen, nicht für verschachtelte Daten oder Konfiguration.
