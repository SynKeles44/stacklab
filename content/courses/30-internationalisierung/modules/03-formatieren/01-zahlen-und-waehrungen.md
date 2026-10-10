---
title: Zahlen und Währungen formatieren
summary: Wie du Zahlen, Prozente und Preise mit Intl.NumberFormat und dem PHP-NumberFormatter richtig darstellst – und warum Geld in Cent gespeichert wird.
duration: 20
sources:
  - title: MDN – Intl.NumberFormat
    url: https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat
  - title: PHP-Handbuch – NumberFormatter
    url: https://www.php.net/manual/de/class.numberformatter.php
  - title: ISO 4217 – Währungscodes
    url: https://www.iso.org/iso-4217-currency-codes.html
quiz:
  - type: match
    question: Ordne jeder Locale die Darstellung von 1234567,5 zu.
    pairs:
      - { left: "de-DE", right: "1.234.567,5" }
      - { left: "en-US", right: "1,234,567.5" }
      - { left: "de-CH", right: "1'234'567.5" }
      - { left: "hi-IN", right: "12,34,567.5" }
    explanation: >
      Tausender- und Dezimaltrennzeichen hängen von der Region ab. Indien gruppiert sogar anders: nach den
      ersten drei Stellen in Zweiergruppen (Lakh und Crore).
  - type: single
    question: Woher bekommt `Intl.NumberFormat` die Währung eines Preises?
    options:
      - Aus der Locale – `en-US` bedeutet immer US-Dollar.
      - Aus der Option `currency` – die Locale bestimmt nur die Schreibweise.
      - Aus der IP-Adresse des Browsers.
      - Gar nicht, Währungen kann Intl nicht formatieren.
    answer: 1
    explanation: >
      Die Währung ist eine Eigenschaft des Preises, nicht der Person. Ein Hotel in Paris kostet auch für
      US-Gäste Euro: `new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" })` liefert „€1,234.56“.
  - type: multiple
    question: Welche Aussagen über Geldbeträge im Code stimmen?
    options:
      - Beträge speichert man als ganze Zahl in der kleinsten Einheit, z. B. 1999 Cent.
      - "`0.1 + 0.2` ergibt in JavaScript exakt `0.3`."
      - Nicht jede Währung hat zwei Nachkommastellen – der Yen hat keine.
      - Zu jedem Betrag gehört ein Währungscode wie `EUR`.
    answers: [0, 2, 3]
    explanation: >
      Gleitkommazahlen können Dezimalbrüche nicht exakt darstellen (`0.1 + 0.2` ist `0.30000000000000004`).
      Ganze Zahlen in der kleinsten Einheit plus ISO-4217-Code sind die sichere Wahl.
  - type: cloze
    text: "Für Prozente nutzt du `{ style: \"___\" }` – dann wird aus `0.256` in `de-DE` „26 %“."
    blanks:
      - [percent]
    explanation: >
      Mit `style: "percent"` multipliziert Intl den Wert mit 100 und setzt das Prozentzeichen passend zur
      Locale – in Deutsch mit geschütztem Leerzeichen davor.
tasks:
  - id: preis-formatieren
    type: code
    language: ts
    title: Preise aus der kleinsten Einheit formatieren
    description: |
      Deine API liefert Preise als ganze Zahl in der **kleinsten Einheit** der Währung (Cent bei Euro und
      Dollar, Yen beim Yen). Schreibe `formatMinor(amountMinor, currency, locale)`:

      1. Finde heraus, wie viele Nachkommastellen die Währung hat. Tipp:
         `new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits`
         liefert 2 für EUR und 0 für JPY.
      2. Rechne den Betrag in die Hauptwährung um (1999 Cent → 19.99).
      3. Formatiere ihn mit `Intl.NumberFormat` als Währung in der gewünschten Locale.

      Hinweis: Deutsch setzt zwischen Betrag und „€“ ein **geschütztes Leerzeichen** (` `). Die Tests
      erwarten genau das – Intl erledigt es automatisch.
    starter: |
      function formatMinor(amountMinor: number, currency: string, locale: string): string {
        return (amountMinor / 100).toFixed(2) + " " + currency;
      }
    tests:
      - name: Euro in Deutschland
        code: assertEqual(formatMinor(123456, "EUR", "de-DE"), "1.234,56 €")
      - name: Dollar in den USA
        code: assertEqual(formatMinor(199, "USD", "en-US"), "$1.99")
      - name: Euro für US-Kundschaft
        code: assertEqual(formatMinor(123456, "EUR", "en-US"), "€1,234.56")
      - name: Yen hat keine Nachkommastellen
        code: assertEqual(formatMinor(1500, "JPY", "ja-JP"), "￥1,500")
      - name: null Euro
        code: assertEqual(formatMinor(0, "EUR", "de-DE"), "0,00 €")
    solution: |
      function formatMinor(amountMinor: number, currency: string, locale: string): string {
        const digits = new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions()
          .maximumFractionDigits ?? 2;
        const amount = amountMinor / 10 ** digits;
        return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
      }
    hints:
      - Die Zahl der Nachkommastellen hängt von der Währung ab, nicht von der Locale.
      - "`10 ** digits` ist 100 für EUR und 1 für JPY."
      - "`new Intl.NumberFormat(locale, { style: \"currency\", currency }).format(betrag)`"
  - id: preisliste-php
    type: terminal
    title: Eine Preisliste mit dem NumberFormatter
    description: |
      Im Ordner `preisliste` liegt `produkte.json` mit Namen und Preisen in Cent (alle in Euro). Klicke zuerst
      auf **Aufgabe vorbereiten**.

      Schreibe `preisliste.php`, das als Argument eine Locale bekommt (`php preisliste.php de_DE`) und für jedes
      Produkt eine Zeile `Name: Preis` ausgibt, danach `Summe: Preis`. Formatiere mit
      `NumberFormatter::CURRENCY` und `formatCurrency()`. Für `de_DE` sieht das so aus:

      ```text
      Kaffee: 3,49 €
      Tee: 12,50 €
      Espressomaschine: 1.299,00 €
      Summe: 1.314,99 €
      ```

      Rechne die Summe in **Cent** (ganze Zahlen) und teile erst beim Formatieren durch 100.
    workdir: preisliste
    setup: |
      cat > produkte.json <<'JSON'
      [
        { "name": "Kaffee", "cents": 349 },
        { "name": "Tee", "cents": 1250 },
        { "name": "Espressomaschine", "cents": 129900 }
      ]
      JSON
    checks:
      - type: file_exists
        path: preisliste.php
        message: Das Skript preisliste.php fehlt noch.
      - type: file_contains
        path: preisliste.php
        pattern: "NumberFormatter"
        message: Nutze die Klasse NumberFormatter aus der intl-Erweiterung statt eigener Formatierung.
      - type: command
        run: php preisliste.php de_DE | sed 's/\xc2\xa0/ /g'
        stdout_matches: "^Kaffee: 3,49 €\\nTee: 12,50 €\\nEspressomaschine: 1\\.299,00 €\\nSumme: 1\\.314,99 €$"
        message: Die Ausgabe für de_DE stimmt noch nicht. Erwartet sind vier Zeilen wie im Beispiel – Komma als Dezimalzeichen, Punkt für Tausender, € hinten.
      - type: command
        run: php preisliste.php en_US | sed 's/\xc2\xa0/ /g'
        stdout_matches: "^Kaffee: €3\\.49\\nTee: €12\\.50\\nEspressomaschine: €1,299\\.00\\nSumme: €1,314\\.99$"
        message: "Für en_US erwartet die Prüfung z. B. „Kaffee: €3.49“ und „Summe: €1,314.99“. Übernimmst du die Locale aus $argv[1]?"
    hints:
      - "`$produkte = json_decode(file_get_contents('produkte.json'), true);`"
      - "`$fmt = new NumberFormatter($argv[1], NumberFormatter::CURRENCY);` und dann `$fmt->formatCurrency($cents / 100, 'EUR')`."
      - "Summiere `$p['cents']` in einer Ganzzahl-Variablen und gib am Ende `Summe: …` aus."
    solution: |
      ```php title="preisliste.php"
      <?php
      declare(strict_types=1);

      $locale = $argv[1] ?? 'de_DE';
      $produkte = json_decode(file_get_contents('produkte.json'), true);
      $fmt = new NumberFormatter($locale, NumberFormatter::CURRENCY);

      $summe = 0;
      foreach ($produkte as $p) {
          echo $p['name'] . ': ' . $fmt->formatCurrency($p['cents'] / 100, 'EUR') . "\n";
          $summe += $p['cents'];
      }
      echo 'Summe: ' . $fmt->formatCurrency($summe / 100, 'EUR') . "\n";
      ```
---
Eine Kundin aus Zürich schreibt: „Kostet das jetzt 1.299 Franken oder 1,299?“ In deinem Shop steht
`1.299,00 CHF` – für Deutschland richtig, für die Schweiz falsch. Dort schreibt man `CHF 1'299.00`. Zahlen
sehen in jeder Region anders aus, und bei Preisen ist ein Missverständnis besonders teuer.

## Gleiche Zahl, verschiedene Schreibweisen

| Locale | 1234567,5 | Besonderheit |
|---|---|---|
| `de-DE` | 1.234.567,5 | Punkt gruppiert, Komma trennt Dezimalstellen |
| `en-US` | 1,234,567.5 | genau umgekehrt |
| `de-CH` | 1'234'567.5 | Apostroph gruppiert |
| `fr-FR` | 1 234 567,5 | schmales geschütztes Leerzeichen gruppiert |
| `hi-IN` | 12,34,567.5 | Zweiergruppen nach den ersten drei Stellen |
| `ar-EG` | ١٬٢٣٤٬٥٦٧٫٥ | arabisch-indische Ziffern |

Selbst gebaute Formatierung mit `toFixed()` und `replace(".", ",")` kann das nicht leisten. Die Regeln aller
Regionen kennt die [[intl|Intl-API]] – sie bringt die Daten des [[cldr|CLDR]] mit.

> [!FEHLER]
> `preis.toFixed(2).replace(".", ",") + " €"` funktioniert genau für eine Region und vergisst die
> Tausendertrennzeichen. Formatiere Zahlen nie von Hand.

## Intl.NumberFormat

Du erzeugst einen Formatierer mit Locale und Optionen und rufst `format()` auf:

```js run
const zahl = new Intl.NumberFormat("de-DE");
console.log(zahl.format(1234567.891));                          // 1.234.567,891

const prozent = new Intl.NumberFormat("de-DE", { style: "percent" });
console.log(prozent.format(0.256));                             // 26 %

const kompakt = new Intl.NumberFormat("de-DE", { notation: "compact" });
console.log(kompakt.format(1234567));                           // 1,2 Mio.

const tempo = new Intl.NumberFormat("de-DE", { style: "unit", unit: "kilometer-per-hour" });
console.log(tempo.format(50));                                  // 50 km/h
```

Wichtige Optionen: `minimumFractionDigits` und `maximumFractionDigits` (Nachkommastellen), `style`
(`decimal`, `percent`, `currency`, `unit`) und `notation` (`standard`, `compact`, `scientific`).

> [!PRAXIS]
> Einen Formatierer zu erzeugen kostet Zeit. Erzeuge ihn einmal und nutze ihn für alle Zeilen einer
> Tabelle – in React z. B. mit `useMemo`, abhängig von der Locale.

## Währungen richtig darstellen

Für Preise brauchst du zwei Angaben: die **Locale** (Schreibweise) und den
[[waehrungscode|Währungscode]] nach ISO 4217 (welches Geld):

```js run
const eur = { style: "currency", currency: "EUR" };
console.log(new Intl.NumberFormat("de-DE", eur).format(1234.56)); // 1.234,56 €
console.log(new Intl.NumberFormat("en-US", eur).format(1234.56)); // €1,234.56
console.log(new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(1500)); // ￥1,500
```

Drei Regeln für Geld im Code:

1. **Die Währung gehört zum Preis**, nicht zur Person. Ein Hotel in Paris kostet auch für US-Gäste Euro.
2. Speichere Beträge als ganze Zahl in der [[kleinste-waehrungseinheit|kleinsten Einheit]]: `1999` Cent
   statt `19.99`. [[gleitkommazahl|Gleitkommazahlen]] rechnen ungenau: `0.1 + 0.2` ergibt `0.30000000000000004`.
3. Nicht jede Währung hat zwei Nachkommastellen: Yen hat keine, der kuwaitische Dinar drei.

> [!MERKSATZ]
> Ein Geldbetrag besteht aus zwei Teilen: einer ganzen Zahl in der kleinsten Einheit und einem
> Währungscode. Erst bei der Anzeige kommt die Locale dazu.

## Zahlen in PHP: NumberFormatter

In PHP übernimmt die Klasse `NumberFormatter` der Erweiterung intl dieselbe Aufgabe. Locales schreibt ICU
gern mit Unterstrich:

```php title="PHP"
$fmt = new NumberFormatter('de_DE', NumberFormatter::CURRENCY);
echo $fmt->formatCurrency(1234.56, 'EUR');   // 1.234,56 €

$prozent = new NumberFormatter('de_DE', NumberFormatter::PERCENT);
echo $prozent->format(0.256);                // 26 %

$zahl = new NumberFormatter('de_DE', NumberFormatter::DECIMAL);
var_dump($zahl->parse('1.234,5'));           // float(1234.5)
```

Mit `parse()` liest du auch Eingaben in der Schreibweise der Person zurück – praktisch für Formulare, in die
jemand „1.234,5“ tippt. In JavaScript gibt es dafür kein Gegenstück; dort nutzt du am besten
`<input type="number">`, das den Wert schon als Zahl liefert.

> [!ACHTUNG]
> Viele Locales setzen geschützte Leerzeichen (`U+00A0`, in Französisch sogar `U+202F`) statt normaler
> Leerzeichen. Tests, die formatierte Texte mit `"1.234,56 €"` vergleichen, schlagen dann scheinbar grundlos
> fehl. Vergleiche mit der Ausgabe des Formatierers selbst oder ersetze die Sonderzeichen vorher.

## Zusammenfassung

- Tausender- und Dezimaltrennzeichen, Ziffern und Gruppierung hängen von der Locale ab.
- `Intl.NumberFormat` (JavaScript) und `NumberFormatter` (PHP) kennen die Regeln aller Regionen.
- Ein Preis braucht **Locale** (Schreibweise) **und** **Währungscode** (welches Geld).
- Geld speicherst du als ganze Zahl in der **kleinsten Einheit** – nicht als Gleitkommazahl.
- Formatierte Ausgaben enthalten oft **geschützte Leerzeichen** – das musst du in Tests beachten.
