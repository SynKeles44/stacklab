---
title: XML, TOML, .env, INI und Markdown
summary: Fünf weitere Formate, die dir im Projektalltag begegnen – was sie können und woran du sie erkennst.
duration: 25
sources:
  - title: MDN – XML introduction
    url: https://developer.mozilla.org/en-US/docs/Web/XML/Guides/XML_introduction
  - title: PHP-Handbuch – SimpleXML
    url: https://www.php.net/manual/de/book.simplexml.php
  - title: TOML – Spezifikation
    url: https://toml.io/en/
  - title: Node.js – Umgebungsvariablen und --env-file
    url: https://nodejs.org/api/environment_variables.html
  - title: PHP-Handbuch – parse_ini_file
    url: https://www.php.net/manual/de/function.parse-ini-file.php
quiz:
  - type: match
    question: Ordne jede Zeile dem Format zu, aus dem sie stammt.
    pairs:
      - { left: "<preis waehrung=\"EUR\">29.90</preis>", right: "XML" }
      - { left: "[tools]", right: "TOML oder INI" }
      - { left: "DB_PASSWORD=<dein-passwort>", right: ".env" }
      - { left: "## Installation", right: "Markdown" }
    explanation: Spitze Klammern verraten XML, eckige Klammern um einen Namen eine Tabelle in TOML oder einen Abschnitt in INI, KEY=wert eine .env-Datei und Rauten am Zeilenanfang eine Markdown-Überschrift.
  - type: find-bug
    question: Dieses XML ist nicht wohlgeformt. In welcher Zeile liegt der Fehler?
    language: xml
    code: |
      <katalog>
        <buch id="b1">
          <titel>Tassen & Kannen</titel>
        </buch>
      </katalog>
    bug_line: 3
    explanation: Das Zeichen & leitet in XML eine Entität ein. Im Text musst du es als &amp; schreiben.
  - type: single
    question: Welchen Typ hat der Wert von `DB_PORT=5432` aus einer .env-Datei, wenn ein Programm ihn einliest?
    options:
      - Integer
      - String
      - Das hängt vom Wert ab
    answer: 1
    explanation: Umgebungsvariablen sind immer Strings. Braucht dein Programm eine Zahl, wandelt es den Wert selbst um, zum Beispiel mit Number() oder (int).
  - type: multiple
    question: Welche Aussagen über TOML stimmen?
    options:
      - Strings stehen in Anführungszeichen.
      - Einrückung bestimmt die Struktur wie in YAML.
      - Abschnitte heißen Tabellen und stehen in eckigen Klammern.
      - TOML kennt Datum und Uhrzeit als eigenen Typ.
    answers: [0, 2, 3]
    explanation: In TOML ist Einrückung nur Kosmetik – die Struktur ergibt sich aus Tabellen wie [server]. Anders als JSON kennt TOML Datums- und Zeitwerte.
tasks:
  - id: xml-auslesen
    type: code
    language: php
    title: Titel aus einem XML-Katalog lesen
    description: |
      Ein Verlag liefert seinen Katalog als XML:

      ```xml
      <katalog>
        <buch id="b1" sprache="de"><titel>Daten verstehen</titel></buch>
        <buch id="b2" sprache="en"><titel>Learning YAML</titel></buch>
      </katalog>
      ```

      Schreibe `titelNachSprache(string $xml, string $sprache): array`. Sie gibt die Titel aller Bücher mit
      dem Attribut `sprache` = `$sprache` zurück, **alphabetisch sortiert** als Array von Strings. Ist das XML
      nicht wohlgeformt, wirf eine `InvalidArgumentException`.
    starter: |
      function titelNachSprache(string $xml, string $sprache): array
      {
          libxml_use_internal_errors(true); // keine Warnungen ausgeben
          $katalog = simplexml_load_string($xml);

          // false bedeutet: kein wohlgeformtes XML
          // Elemente: $katalog->buch, Attribute: $buch['sprache'], Text: (string) $buch->titel
          return [];
      }
    tests:
      - name: Filtert nach Sprache und sortiert
        code: |
          $xml = '<katalog><buch sprache="de"><titel>Zahlen lesen</titel></buch><buch sprache="en"><titel>Learning YAML</titel></buch><buch sprache="de"><titel>Daten verstehen</titel></buch></katalog>';
          assert_same(['Daten verstehen', 'Zahlen lesen'], titelNachSprache($xml, 'de'));
      - name: Entitäten werden aufgelöst
        code: |
          $xml = '<katalog><buch sprache="de"><titel>Tassen &amp; Kannen</titel></buch></katalog>';
          assert_same(['Tassen & Kannen'], titelNachSprache($xml, 'de'));
      - name: Keine Treffer ergeben ein leeres Array
        code: |
          $xml = '<katalog><buch sprache="en"><titel>Learning YAML</titel></buch></katalog>';
          assert_same([], titelNachSprache($xml, 'fr'));
      - name: Kaputtes XML löst eine Exception aus
        code: |
          $thrown = false;
          try {
              titelNachSprache('<katalog><buch sprache="de"><titel>Offen</buch></katalog>', 'de');
          } catch (InvalidArgumentException $e) {
              $thrown = true;
          }
          assert_true($thrown);
    hints:
      - "`if ($katalog === false) { throw new InvalidArgumentException('Kein gültiges XML'); }`"
      - "`foreach ($katalog->buch as $buch) { if ((string) $buch['sprache'] === $sprache) { … } }` – die Umwandlung mit `(string)` ist wichtig."
      - "Zum Schluss `sort($titel);` und das Array zurückgeben."
    solution: |
      ```php
      function titelNachSprache(string $xml, string $sprache): array
      {
          libxml_use_internal_errors(true);
          $katalog = simplexml_load_string($xml);
          if ($katalog === false) {
              throw new InvalidArgumentException('Kein gültiges XML');
          }

          $titel = [];
          foreach ($katalog->buch as $buch) {
              if ((string) $buch['sprache'] === $sprache) {
                  $titel[] = (string) $buch->titel;
              }
          }
          sort($titel);

          return $titel;
      }
      ```
  - id: datei-format
    type: dragdrop
    title: Welches Format steckt in der Datei?
    description: Ordne jede Datei aus einem typischen Projekt ihrem Format zu.
    targets:
      - { id: xml, label: XML }
      - { id: toml, label: TOML }
      - { id: env, label: .env }
      - { id: ini, label: INI }
      - { id: markdown, label: Markdown }
    items:
      - { label: phpunit.xml, target: xml }
      - { label: logo.svg, target: xml }
      - { label: mise.toml, target: toml }
      - { label: Cargo.toml, target: toml }
      - { label: .env.example, target: env }
      - { label: php.ini, target: ini }
      - { label: README.md, target: markdown }
      - { label: CHANGELOG.md, target: markdown }
    hints:
      - SVG-Grafiken sind XML-Dokumente – öffne eine im Editor, und du siehst spitze Klammern.
---
JSON, YAML und CSV decken das meiste ab. Trotzdem stößt du in fast jedem Projekt auf weitere Formate: eine
`phpunit.xml`, eine `mise.toml`, die `.env` mit lokalen Einstellungen, die `php.ini` auf dem Server und
natürlich die `README.md`. Hier lernst du jedes so weit kennen, dass du es sicher lesen und ändern kannst.

## XML: Elemente und Attribute

[[xml|XML]] (*Extensible Markup Language*) war vor JSON das Austauschformat schlechthin. Es beschreibt Daten
als Baum aus **Elementen** mit Start- und End-Tag; zusätzliche Angaben stehen in **Attributen**:

```xml title="katalog.xml"
<?xml version="1.0" encoding="UTF-8"?>
<katalog>
  <buch id="b1" sprache="de">
    <titel>Daten verstehen</titel>
    <preis waehrung="EUR">29.90</preis>
  </buch>
</katalog>
```

Die Regeln für ein **wohlgeformtes** Dokument:

- genau ein Wurzelelement (hier `<katalog>`),
- jedes geöffnete Element wird geschlossen, Verschachtelung ohne Überkreuzung,
- Attributwerte stehen in Anführungszeichen,
- `<` und `&` im Text werden als `&lt;` und `&amp;` geschrieben.

Mit einem Schema (XSD) lässt sich zusätzlich prüfen, ob ein Dokument **gültig** ist, also die erwartete
Struktur hat. XML begegnet dir heute in SVG-Grafiken, `phpunit.xml`, RSS-Feeds, Sitemaps, Office-Dateien
(eine `.docx` ist ein ZIP voller XML) und älteren SOAP-Schnittstellen. In PHP liest du es bequem mit
SimpleXML.

Beim Umwandeln zwischen XML und JSON gibt es eine typische Frage: Wird `sprache="de"` zu einem normalen
Feld oder bleibt es als Attribut erkennbar? JSON kennt keine Attribute, deshalb hat jede Bibliothek ihre
eigene Konvention. Für neue Schnittstellen nimmt man darum fast immer JSON.

## TOML: Konfiguration ohne Einrückungsfallen

[[toml|TOML]] ist für Konfigurationsdateien gemacht und vermeidet die Fallen von YAML: Die Struktur ergibt
sich nicht aus der Einrückung, sondern aus **Tabellen** in eckigen Klammern.

```toml title="mise.toml"
[tools]
node = "24"
php = "8.5"

[env]
APP_ENV = "local"

[tasks.lint]
run = "npm run lint"
```

Strings stehen immer in Anführungszeichen, deshalb gibt es kein Norway-Problem. TOML kennt zudem Datum und
Uhrzeit als eigenen Typ (`2026-10-09T08:00:00Z`). Du findest es in `mise.toml`, Rusts `Cargo.toml` und
Pythons `pyproject.toml`.

> [!MERKSATZ]
> XML strukturiert über Tags, YAML über Einrückung, TOML über Tabellen in `[eckigen Klammern]`.

## .env: Umgebungsvariablen in einer Datei

Eine [[env-datei|.env-Datei]] enthält [[umgebungsvariable|Umgebungsvariablen]] für die lokale Entwicklung,
eine pro Zeile:

```bash title=".env"
APP_NAME="Mein Shop"
APP_DEBUG=true
DB_HOST=db.example.com
DB_PASSWORD=<dein-passwort>
```

Es gibt keinen offiziellen Standard. Laravel, Docker Compose und Node.js (`node --env-file=.env app.js`)
lesen sie leicht unterschiedlich – etwa bei Anführungszeichen oder Kommentaren am Zeilenende. Sicher ist nur:
Alle Werte sind **Strings**. `APP_DEBUG=true` ist der Text „true“, den dein Programm selbst umwandeln muss.

> [!FEHLER]
> **Die `.env` committen.** Sie enthält Passwörter und Schlüssel. Ins Repository gehört nur eine
> `.env.example` mit Platzhaltern, die echte `.env` steht in der `.gitignore`.

## INI: Abschnitte und Schlüssel

Das [[ini-datei|INI-Format]] ist der Vorgänger von TOML. Es kennt Abschnitte in eckigen Klammern und
Schlüssel-Wert-Paare; Kommentare beginnen mit `;`:

```ini title="php.ini (Ausschnitt)"
; Grenzen für Uploads
[PHP]
upload_max_filesize = 20M
memory_limit = 256M
display_errors = Off
```

Am häufigsten begegnet dir INI in der `php.ini`. PHP liest eigene INI-Dateien mit
`parse_ini_file('datei.ini', true, INI_SCANNER_TYPED)`: Das `true` erhält die Abschnitte, `INI_SCANNER_TYPED`
macht aus `19` eine Zahl und aus `Off` den Boolean `false`.

## Markdown und Frontmatter

[[markdown|Markdown]] ist kein Datenformat, sondern ein Format für formatierten Text: `#` für Überschriften,
`-` für Listen, Backticks für Code. Viele Werkzeuge kombinieren es aber mit Daten. Ein
[[frontmatter|Frontmatter]] ist ein YAML-Block am Anfang einer Markdown-Datei, eingerahmt von `---`:

```markdown title="lektion.md"
---
title: XML, TOML und Co.
duration: 25
---
# Text der Lektion …
```

> [!PRAXIS]
> Genau so ist diese Lektion gespeichert: Titel, Dauer, Quiz und Aufgaben stehen als YAML im Frontmatter,
> der Text darunter ist Markdown. Auch Static-Site-Generatoren und Dokumentations-Werkzeuge arbeiten so.

## Zusammenfassung

- **XML**: Elemente und Attribute, ein Wurzelelement, `&` und `<` escapen; heute vor allem in SVG, Office,
  `phpunit.xml` und älteren Schnittstellen.
- **TOML**: Tabellen in `[…]`, Strings immer in Anführungszeichen, eigene Datums-Typen.
- **.env**: `KEY=wert`, alle Werte sind Strings, nie committen – nur `.env.example`.
- **INI**: Abschnitte und Schlüssel, Kommentare mit `;`, bekanntestes Beispiel `php.ini`.
- **Markdown** formatiert Text, ein **Frontmatter** ergänzt Daten als YAML-Block.
