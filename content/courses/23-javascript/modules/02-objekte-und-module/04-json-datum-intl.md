---
title: JSON, Datum und Intl
summary: Daten mit JSON.stringify und JSON.parse sicher umwandeln, die Fallen des Date-Objekts kennen und Zahlen, Beträge und Daten mit Intl für jede Sprache formatieren.
duration: 20
sources:
  - title: MDN – JSON.stringify()
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
  - title: MDN – JSON.parse()
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse
  - title: MDN – Date
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
  - title: MDN – Intl
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl
quiz:
  - type: single
    question: "Was ergibt `JSON.stringify({ a: 1, b: undefined, c: () => 1 })`?"
    options: ["'{\"a\":1}'", "'{\"a\":1,\"b\":null,\"c\":null}'", "'{\"a\":1,\"b\":undefined}'", "Einen Fehler"]
    answer: 0
    explanation: Eigenschaften mit undefined oder Funktionen als Wert lässt JSON.stringify in Objekten einfach weg. JSON kennt weder undefined noch Funktionen.
  - type: single
    question: "Welchen Monat beschreibt `new Date(2026, 1, 15)`?"
    options: ["Januar", "Februar", "Dezember", "Ungültiges Datum"]
    answer: 1
    explanation: Monate zählen im Date-Konstruktor ab 0. 0 ist Januar, 1 ist Februar.
  - type: multiple
    question: Welche Aussagen über JSON.parse stimmen?
    options:
      - Bei ungültigem Text wirft JSON.parse einen SyntaxError.
      - Datumswerte werden automatisch wieder zu Date-Objekten.
      - Schlüssel müssen in doppelten Anführungszeichen stehen.
      - Ein abschließendes Komma nach dem letzten Eintrag ist erlaubt.
    answers: [0, 2]
    explanation: JSON ist streng. Datumswerte bleiben Strings, bis du sie selbst umwandelst, z. B. mit einer reviver-Funktion.
  - type: match
    question: Welches Intl-Werkzeug passt?
    pairs:
      - { left: "1.234,50 €", right: "Intl.NumberFormat mit style currency" }
      - { left: "9. Oktober 2026", right: "Intl.DateTimeFormat mit dateStyle long" }
      - { left: "vor 3 Tagen", right: "Intl.RelativeTimeFormat" }
      - { left: "Äpfel vor Birnen sortieren", right: "Intl.Collator oder localeCompare" }
    explanation: Intl kennt die Regeln jeder Sprache – Tausendertrennzeichen, Monatsnamen, Grammatik und Sortierung.
tasks:
  - id: daten-werkzeuge
    type: code
    language: js
    title: Werkzeuge für JSON, Beträge und Daten
    description: |
      Schreibe vier kleine Helfer:

      1. `parseSicher(text, ersatz)` gibt das Ergebnis von `JSON.parse(text)` zurück. Ist der Text kein
         gültiges JSON, gibt die Funktion stattdessen `ersatz` zurück, statt einen Fehler zu werfen.
      2. `alsJson(wert)` liefert den Wert als JSON-Text, eingerückt mit **zwei** Leerzeichen.
      3. `euro(betrag)` formatiert einen Betrag deutsch als Euro, z. B. `1234.5` → `"1.234,50 €"`. Nutze
         `Intl.NumberFormat`. (Intl setzt vor das €-Zeichen ein geschütztes Leerzeichen – die Tests berücksichtigen das.)
      4. `tageZwischen(von, bis)` bekommt zwei Datums-Strings im Format `JJJJ-MM-TT` und liefert die Anzahl der
         Tage dazwischen. `tageZwischen("2026-10-01", "2026-10-09")` ergibt `8`; liegt `bis` vor `von`, ist das
         Ergebnis negativ.
    starter: |
      function parseSicher(text, ersatz) {
        return JSON.parse(text);
      }

      function alsJson(wert) {
        return JSON.stringify(wert);
      }

      function euro(betrag) {
        return betrag + " €";
      }

      function tageZwischen(von, bis) {
        return 0;
      }
    tests:
      - name: parseSicher liest gültiges JSON
        code: 'assertDeepEqual(parseSicher("{\"a\":[1,2]}", null), { a: [1, 2] })'
      - name: parseSicher fängt Fehler ab
        code: 'assertDeepEqual(parseSicher("{kaputt", { leer: true }), { leer: true }); assertEqual(parseSicher("", 0), 0)'
      - name: alsJson rückt mit zwei Leerzeichen ein
        code: 'assertEqual(alsJson({ a: 1 }), "{\n  \"a\": 1\n}")'
      - name: euro formatiert deutsch
        code: 'assertEqual(euro(1234.5).replace(/\s/g, " "), "1.234,50 €"); assertEqual(euro(0).replace(/\s/g, " "), "0,00 €")'
      - name: tageZwischen zählt Tage
        code: 'assertEqual(tageZwischen("2026-10-01", "2026-10-09"), 8); assertEqual(tageZwischen("2026-03-01", "2026-02-27"), -2); assertEqual(tageZwischen("2026-10-09", "2026-10-09"), 0)'
    hints:
      - "Für parseSicher brauchst du `try { … } catch { … }` – der Fehler selbst wird nicht gebraucht."
      - "`JSON.stringify(wert, null, 2)` – der zweite Parameter ist der replacer, der dritte die Einrückung."
      - "`new Intl.NumberFormat(\"de-DE\", { style: \"currency\", currency: \"EUR\" }).format(betrag)`. Tage: `(new Date(bis) - new Date(von)) / 86_400_000` – Strings im Format JJJJ-MM-TT werden als UTC gelesen, Sommerzeit stört also nicht."
    solution: |
      const euroFormat = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
      const MS_PRO_TAG = 24 * 60 * 60 * 1000;

      function parseSicher(text, ersatz) {
        try {
          return JSON.parse(text);
        } catch {
          return ersatz;
        }
      }

      function alsJson(wert) {
        return JSON.stringify(wert, null, 2);
      }

      function euro(betrag) {
        return euroFormat.format(betrag);
      }

      function tageZwischen(von, bis) {
        return Math.round((new Date(bis) - new Date(von)) / MS_PRO_TAG);
      }
  - id: json-vorhersagen
    type: steps
    title: Was macht JSON daraus?
    description: Sag voraus, was diese Aufrufe liefern. JSON kennt nur Strings, Zahlen, Booleans, null, Arrays und Objekte.
    steps:
      - situation: "`JSON.stringify([1, undefined, () => 2])`"
        question: Welcher Text entsteht?
        options: ["'[1]'", "'[1,null,null]'", "'[1,undefined,null]'"]
        answer: 1
        explanation: In Arrays können Positionen nicht einfach wegfallen, also ersetzt JSON.stringify undefined und Funktionen dort durch null.
      - situation: "`JSON.stringify({ am: new Date(Date.UTC(2026, 9, 9)) })`"
        question: Was steht im Ergebnis?
        options: ["'{\"am\":{}}'", "'{\"am\":\"2026-10-09T00:00:00.000Z\"}'", "'{\"am\":1791504000000}'"]
        answer: 1
        explanation: Date-Objekte haben eine Methode toJSON, die einen ISO-String in UTC liefert. Monat 9 ist Oktober.
      - situation: "`const kopie = JSON.parse(JSON.stringify({ am: new Date() }));`"
        question: Welchen Typ hat `kopie.am`?
        options: ["Date", "string", "number"]
        answer: 1
        explanation: Beim Zurücklesen bleibt der ISO-String ein String. Deshalb ist JSON kein guter Weg für tiefe Kopien – structuredClone behält Date-Objekte.
      - situation: "`JSON.parse(\"{'name': 'Ada'}\")`"
        question: Was passiert?
        options: ["Ergebnis { name: \"Ada\" }", "SyntaxError", "Ergebnis null"]
        answer: 1
        explanation: JSON verlangt doppelte Anführungszeichen für Schlüssel und Strings. Einfache Anführungszeichen sind ungültig.
---
Dein Frontend schickt einen Termin an den Server, und zurück kommt er einen Tag früher. Ein Preis erscheint
als `1234.5` statt `1.234,50 €`. Eine Liste wirft `SyntaxError: Unexpected token`, weil die Antwort gar kein
JSON war. Das sind Alltagsfehler beim Umgang mit Daten – und alle drei lassen sich vermeiden.

## JSON.stringify: Daten in Text verwandeln

[[json|JSON]] ist das Austauschformat zwischen Browser, Server und Dateien. `JSON.stringify` wandelt einen Wert
in JSON-Text um – das nennt man [[serialisierung|Serialisierung]]. `JSON.parse` liest ihn zurück. JSON ist aber ärmer als JavaScript. Beim Umwandeln passiert
deshalb Folgendes:

| Wert in JavaScript | Ergebnis in JSON |
|---|---|
| `undefined`, Funktion (in Objekten) | Eigenschaft fällt weg |
| `undefined`, Funktion (in Arrays) | `null` |
| `NaN`, `Infinity` | `null` |
| `Date` | ISO-String, z. B. `"2026-10-09T08:00:00.000Z"` |
| `Map`, `Set` | `{}` – Inhalt geht verloren |

```js run
const nutzer = { name: "Ada", passwort: undefined, geburtstag: new Date(Date.UTC(1815, 11, 10)) };
console.log(JSON.stringify(nutzer));
console.log(JSON.stringify(nutzer, ["name"]));        // nur ausgewählte Schlüssel
console.log(JSON.stringify({ a: [1, 2] }, null, 2));  // eingerückt mit 2 Leerzeichen
```

Der zweite Parameter (*replacer*) filtert oder verändert Werte, der dritte rückt das Ergebnis für Menschen
lesbar ein.

## JSON.parse: Text sicher lesen

`JSON.parse` ist streng: Doppelte Anführungszeichen sind Pflicht, Kommentare und abschließende Kommas sind
verboten. Ungültiger Text führt zu einem `SyntaxError`. Daten von außen liest du deshalb immer in einem
[[try-catch|try/catch]]:

```js run
function leseEinstellungen(text) {
  try {
    return JSON.parse(text);
  } catch (fehler) {
    console.warn("Ungültige Einstellungen:", fehler.message);
    return { thema: "hell" };          // sinnvoller Ersatzwert
  }
}
console.log(leseEinstellungen('{"thema":"dunkel"}'));
console.log(leseEinstellungen("{thema: dunkel}"));
```

Datumswerte kommen als Strings zurück. Mit einer *reviver*-Funktion als zweitem Parameter wandelst du sie
beim Lesen wieder um: `JSON.parse(text, (schluessel, wert) => schluessel === "am" ? new Date(wert) : wert)`.

> [!FEHLER]
> `JSON.parse(JSON.stringify(obj))` als „tiefe Kopie“ verliert Daten: Dates werden Strings, `undefined` und
> Funktionen verschwinden. Nimm `structuredClone(obj)`.

## Das Date-Objekt und seine Fallen

Ein `Date` speichert intern einen [[zeitstempel|Zeitstempel]]: Millisekunden seit dem 1. Januar 1970, 00:00
Uhr in [[utc|UTC]]. Angezeigt wird es dagegen in der [[zeitzone|Zeitzone]] des Geräts. Daraus entstehen die
typischen Fallen:

| Ausdruck | Ergebnis | Falle |
|---|---|---|
| `new Date(2026, 0, 31)` | 31. Januar 2026, lokal | Monate zählen ab **0** |
| `new Date("2026-10-09")` | 9. Oktober, 00:00 **UTC** | reines Datum gilt als UTC |
| `new Date("2026-10-09T10:00")` | 10:00 **lokale** Zeit | mit Uhrzeit gilt lokale Zeit |
| `datum.toISOString()` | `"2026-10-09T08:00:00.000Z"` | [[iso-8601\|ISO 8601]], immer UTC (`Z`) |
| `Date.now()` | Zeitstempel als Zahl | gut zum Messen von Dauern |

```js run
const start = new Date("2026-10-01");
const ende = new Date("2026-10-09");
const tage = (ende - start) / (24 * 60 * 60 * 1000);   // Subtraktion liefert Millisekunden
console.log(tage);                                      // 8
console.log(ende.getUTCMonth());                        // 9 – also Oktober!
```

Speichere und übertrage Zeitpunkte als ISO-String in UTC; umgerechnet wird erst bei der Anzeige. Die neue
Datums-API Temporal löst viele dieser Probleme und wird gerade in die Browser eingebaut – siehe die
[MDN-Seite zu Temporal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal).

> [!MERKSATZ]
> Speichern in UTC, anzeigen in der Zeitzone des Nutzers – und Monate im `Date`-Konstruktor zählen ab 0.

## Intl: formatieren für jede Sprache

Zahlen, Beträge und Daten sehen in jeder Sprache anders aus: `1,234.50` in den USA, `1.234,50` in Deutschland.
Das eingebaute Objekt [[intl|Intl]] kennt diese Regeln. Du gibst eine [[locale|Locale]] wie `"de-DE"` an:

```js run
const euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
console.log(euro.format(1234.5));                                       // 1.234,50 €

const datum = new Intl.DateTimeFormat("de-DE", { dateStyle: "long", timeZone: "Europe/Berlin" });
console.log(datum.format(new Date(Date.UTC(2026, 9, 9, 8))));           // 9. Oktober 2026

const relativ = new Intl.RelativeTimeFormat("de", { numeric: "auto" });
console.log(relativ.format(-1, "day"), relativ.format(-3, "day"));      // gestern vor 3 Tagen

console.log(["Zebra", "Äpfel", "Birnen"].toSorted((a, b) => a.localeCompare(b, "de")));
```

Erzeuge einen Formatierer einmal und verwende ihn wieder – das Anlegen ist teurer als das Formatieren.

> [!PRAXIS]
> Mehrsprachige Anwendungen formatieren nie mit `toFixed` und angehängtem `€`. Intl liefert für jede Sprache
> das richtige Format – das gehört zur [[internationalisierung|Internationalisierung]].

## Zusammenfassung

- `JSON.stringify` lässt `undefined` und Funktionen weg, macht aus Dates ISO-Strings und rückt mit dem dritten Parameter ein.
- `JSON.parse` wirft bei ungültigem Text einen `SyntaxError` – Daten von außen immer mit `try/catch` lesen.
- Für tiefe Kopien `structuredClone` statt JSON nutzen.
- Ein `Date` ist ein Zeitstempel in UTC; Monate zählen ab 0, reine Datums-Strings gelten als UTC.
- Zeitpunkte als ISO-String in UTC speichern, erst bei der Anzeige umrechnen.
- `Intl.NumberFormat`, `DateTimeFormat`, `RelativeTimeFormat` und `localeCompare` formatieren und sortieren sprachgerecht.
