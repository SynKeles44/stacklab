---
title: Code-Kommentare, die helfen
summary: Kommentare erklären das Warum, nicht das Was – und Docblocks lohnen sich nur, wenn sie mehr wissen als die Signatur.
duration: 20
sources:
  - title: PHP-Dokumentation – Kommentare
    url: https://www.php.net/manual/de/language.basic-syntax.comments.php
  - title: phpDocumentor – Typen in PHPDoc
    url: https://docs.phpdoc.org/guide/references/phpdoc/types.html
  - title: TypeScript Handbook – JSDoc-Referenz
    url: https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html
quiz:
  - type: single
    question: Welcher Kommentar ist wertvoll?
    options:
      - "// Zähler um eins erhöhen"
      - "// Die API liefert Preise in Cent, deshalb teilen wir durch 100."
      - "// Variable für den Namen"
      - "// Ende der Funktion"
    answer: 1
    explanation: >
      Nur der zweite Kommentar sagt etwas, das man im Code nicht sieht: den Grund für die Division. Die anderen
      wiederholen, was der Code ohnehin zeigt.
  - type: find-bug
    question: Welche Zeile ist gefährlicher als gar kein Kommentar?
    language: js
    code: |
      const MAX_RETRIES = 5

      // Wir versuchen es höchstens dreimal, damit der Nutzer nicht zu lange wartet.
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        if (await sendOrder()) break
      }
    bug_line: 3
    explanation: >
      Der Kommentar sagt „dreimal“, der Code macht fünf Versuche. Veraltete Kommentare führen in die Irre.
      Besser: den Grund ohne konkrete Zahl nennen oder Kommentar und Code gemeinsam ändern.
  - type: multiple
    question: Wann lohnt sich ein Docblock wie `/** @param list<Order> $orders */` in PHP?
    options:
      - Wenn er genauer ist als der native Typ – `array` sagt nicht, was im Array steckt.
      - Bei jeder Funktion, auch wenn er nur `@param string $name` wiederholt.
      - Wenn er Werkzeuge wie PHPStan und die IDE mit Typinformationen versorgt.
      - Wenn er den Code Zeile für Zeile nacherzählt.
    answers: [0, 2]
    explanation: >
      Ein Docblock zahlt sich aus, wenn er Information trägt, die der Code nicht ausdrücken kann – etwa den Inhalt
      eines Arrays. Wiederholt er nur die Signatur, ist er Ballast, der beim nächsten Refactoring veraltet.
  - type: cloze
    text: Ein guter Kommentar erklärt das ___, nicht das Was. Auskommentierten Code löschst du, denn er steht ohnehin in der ___.
    blanks:
      - [Warum]
      - [Git-Historie, Historie, Versionskontrolle, Git]
    explanation: Die Versionskontrolle merkt sich jeden alten Stand. Auskommentierter Code verwirrt nur.
tasks:
  - id: kommentare-aufraeumen
    type: terminal
    title: Kommentare aufräumen
    description: |
      Im Ordner `kommentare` liegt `preis.js`. Das Skript rechnet Bruttopreise aus – und ist voller Kommentare, die
      nur wiederholen, was der Code sagt.

      1. Führe das Skript einmal aus: `node preis.js`. Merk dir die Ausgabe.
      2. Lösche alle Kommentare, die nur das **Was** beschreiben, und den **auskommentierten Code**.
      3. Behalte genau einen Kommentar: den, der erklärt, **warum** gerundet wird.
      4. Ändere den Code selbst nicht – die Ausgabe muss gleich bleiben.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit die Datei angelegt wird.
    workdir: kommentare
    setup: |
      cat > preis.js <<'EOF'
      // Funktion zum Berechnen des Preises
      function bruttoPreis(netto) {
        // netto mal 1.19
        const brutto = netto * 1.19
        // console.log(brutto)
        // Auf ganze Cent runden, weil der Zahlungsanbieter nur zwei Nachkommastellen akzeptiert.
        return Math.round(brutto * 100) / 100
      }

      // Summe auf 0 setzen
      let summe = 0
      // i hochzählen
      for (let i = 0; i < 3; i++) {
        summe += bruttoPreis(10)
      }

      // Ausgabe
      console.log(summe)
      EOF
    checks:
      - type: command
        run: node preis.js
        stdout_equals: "35.7"
        message: Das Skript muss weiterhin 35.7 ausgeben. Hast du versehentlich Code gelöscht oder geändert?
      - type: command
        run: grep -cE '^\s*//' preis.js
        stdout_equals: "1"
        message: Es soll genau ein Kommentar übrig bleiben – der, der das Runden begründet.
      - type: command
        run: grep -E '^\s*//' preis.js | grep -c 'Zahlungsanbieter'
        stdout_equals: "1"
        message: Der verbleibende Kommentar soll erklären, warum gerundet wird (der Satz mit dem Zahlungsanbieter).
      - type: command
        run: grep -cE 'return Math\.round\(brutto \* 100\) / 100|for \(let i = 0; i < 3; i\+\+\)' preis.js
        stdout_equals: "2"
        message: Der eigentliche Code soll unverändert bleiben – lösche nur Kommentarzeilen.
    hints:
      - "Frag bei jeder Kommentarzeile: Erfahre ich daraus etwas, das nicht im Code steht?"
      - "`// console.log(brutto)` ist auskommentierter Code – weg damit, Git merkt sich alte Stände."
      - "Mit `sed -i '/^\\s*\\/\\/ \\(Funktion\\|netto\\|console\\|Summe\\|i hoch\\|Ausgabe\\)/d' preis.js` löschst du die überflüssigen Zeilen auf einmal – oder du nutzt `nano`."
    solution: |
      ```bash
      cd kommentare
      node preis.js
      cat > preis.js <<'EOF'
      function bruttoPreis(netto) {
        const brutto = netto * 1.19
        // Auf ganze Cent runden, weil der Zahlungsanbieter nur zwei Nachkommastellen akzeptiert.
        return Math.round(brutto * 100) / 100
      }

      let summe = 0
      for (let i = 0; i < 3; i++) {
        summe += bruttoPreis(10)
      }

      console.log(summe)
      EOF
      node preis.js
      ```
  - id: kommentar-behalten
    type: dragdrop
    title: Behalten oder löschen?
    description: Entscheide für jeden Kommentar, ob er seinen Platz im Code verdient.
    targets:
      - { id: behalten, label: Behalten – erklärt etwas Unsichtbares }
      - { id: loeschen, label: Löschen – wiederholt nur den Code }
    items:
      - { label: "// Workaround für einen Fehler in Safari 18, siehe Issue #482", target: behalten }
      - { label: "// Reihenfolge wichtig: erst Rechte prüfen, dann laden", target: behalten }
      - { label: "// Timeout in Millisekunden, die API bricht nach 30 s ab", target: behalten }
      - { label: "// Schleife über alle Nutzer", target: loeschen }
      - { label: "// gibt true zurück", target: loeschen }
      - { label: "// const altePreise = ladePreise()", target: loeschen }
      - { label: "/** @param string $name Der Name */ über function greet(string $name)", target: loeschen }
    hints:
      - Würde ein Mensch, der den Code liest, ohne den Kommentar etwas Wichtiges nicht wissen?
---
Du öffnest eine Datei und liest: `i++ // i um eins erhöhen`. Zehn Zeilen weiter steht ein komplizierter
Rechenschritt – ohne jeden Kommentar. Genau umgekehrt wäre es richtig. [[kommentar|Kommentare]] sind
Dokumentation an der Stelle, an der sie gebraucht wird. Aber nur, wenn sie das Richtige erklären.

## Das Warum, nicht das Was

Code zeigt schon, **was** passiert. Ein Kommentar, der das wiederholt, ist Lärm: Er kostet Lesezeit und
veraltet, sobald jemand den Code ändert.

```js
// Schlecht: wiederholt den Code
// Preis mal 1.19 rechnen
const brutto = netto * 1.19
```

```js
// Gut: erklärt, was man nicht sieht
// Die Shop-API liefert Nettopreise; 19 % ist der deutsche Regelsteuersatz.
const brutto = netto * 1.19
```

Oft ist sogar **kein** Kommentar die beste Lösung: Ein guter Name ersetzt viele Kommentare.

```js
const VAT_RATE = 1.19
const gross = net * VAT_RATE
```

> [!MERKSATZ]
> Ein Kommentar erklärt das **Warum** oder eine Bedingung, die der Code nicht zeigen kann. Was der Code tut,
> sagt der Code selbst.

## Wann ein Kommentar Gold wert ist

| Art | Beispiel |
|---|---|
| Begründung | `// Wir cachen nur 60 s, weil sich Lagerbestände oft ändern.` |
| Warnung | `// Nicht parallel ausführen: die Datei wird gesperrt.` |
| Workaround | `// Umgeht einen Fehler in Bibliothek X 2.3, siehe Issue #482.` |
| Bedingung | `// Muss vor initRoutes() laufen, sonst fehlt die Sprache.` |
| Externe Vorgabe | `// Format laut RFC 3339, so verlangt es die Partner-API.` |

All diese Informationen stecken **nicht** im Code. Ohne Kommentar würde jemand sie mühsam herausfinden – oder
den Code „aufräumen“ und damit einen Fehler einbauen.

> [!TIPP]
> Verweis bei Workarounds auf das Issue oder die Doku. Dann weiß man später, wann der Workaround wegkann.

## Kommentare, die du löschen kannst

- **Nacherzählungen:** `// Schleife über alle Nutzer` über einer Schleife über alle Nutzer.
- **Auskommentierter Code:** `// const old = load()` – die Versionskontrolle merkt sich alte Stände ohnehin.
- **Tagebuch-Einträge:** `// 12.03. geändert von Max` – das steht in `git log` und `git blame`.
- **Abschlussmarken:** `} // Ende der Funktion` – das zeigt der Editor.
- **TODOs ohne Plan:** `// TODO: verbessern` – besser ein Issue mit Beschreibung anlegen.

> [!FEHLER]
> Veraltete Kommentare. „Wir versuchen es dreimal“ über einer Schleife mit fünf Versuchen ist schlimmer als gar
> kein Kommentar, denn er lügt. Wer Code ändert, prüft die Kommentare daneben.

## Docblocks: nur mit echtem Mehrwert

Ein [[docblock|Docblock]] ist ein strukturierter Kommentar über einer Funktion oder Klasse, z. B. in PHP mit
`/** … */` und Tags wie `@param` und `@return`. Werkzeuge wie die IDE oder PHPStan lesen ihn aus.

Wiederholt er nur die Signatur, ist er überflüssig:

```php
/**
 * @param string $name
 * @return string
 */
function greet(string $name): string
```

Wertvoll wird er, wenn er **genauer** ist als der native Typ. `array` sagt nicht, was drinsteckt – ein Docblock schon:

```php
/**
 * @param list<Order> $orders
 * @return array<string, int> Anzahl der Bestellungen pro Kundennummer
 */
function countByCustomer(array $orders): array
```

In JavaScript ohne TypeScript erfüllt [[jsdoc|JSDoc]] dieselbe Aufgabe: `/** @param {number} netto */` gibt dem
Editor Typinformationen. Mit TypeScript stehen die Typen im Code, und JSDoc braucht es nur noch für Erklärungen.

## Vom Kommentar zur API-Dokumentation

Bei öffentlichen Bibliotheken und Web-APIs reicht ein Kommentar nicht. Nutzer:innen brauchen eine
**Referenz**: alle Funktionen oder Endpunkte mit Parametern, Rückgabewerten und Beispielen. Für Web-APIs ist dafür
OpenAPI der Standard – darum geht es ausführlich im Kurs „API-Dokumentation“.

> [!PRAXIS]
> In vielen Teams gilt beim Review die Regel: Wenn du einen Kommentar brauchst, um zu erklären, **was** der Code
> tut, benenne zuerst Variablen und Funktionen besser. Kommentare sind dann für das Warum übrig.

## Zusammenfassung

- Kommentare erklären das **Warum**: Gründe, Warnungen, Workarounds, Bedingungen.
- Kommentare, die das **Was** wiederholen, und auskommentierter Code werden gelöscht.
- Gute **Namen** ersetzen viele Kommentare.
- **Veraltete Kommentare** sind gefährlich – prüfe sie bei jeder Änderung mit.
- **Docblocks** nur, wenn sie mehr wissen als die Signatur, z. B. `list<Order>`.
- Für öffentliche APIs gibt es eigene Referenz-Doku, etwa mit OpenAPI.
