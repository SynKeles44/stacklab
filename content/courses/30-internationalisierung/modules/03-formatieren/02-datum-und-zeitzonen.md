---
title: Datum, Uhrzeit und Zeitzonen
summary: Zeitpunkte in UTC speichern, in der richtigen Zeitzone anzeigen und mit Intl.DateTimeFormat, RelativeTimeFormat und IntlDateFormatter formatieren.
duration: 25
sources:
  - title: MDN – Intl.DateTimeFormat
    url: https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat
  - title: MDN – Intl.RelativeTimeFormat
    url: https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat
  - title: IANA Time Zone Database
    url: https://www.iana.org/time-zones
  - title: PHP-Handbuch – IntlDateFormatter
    url: https://www.php.net/manual/de/class.intldateformatter.php
  - title: MDN – Temporal
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal
quiz:
  - type: single
    question: Wie speicherst du den Zeitpunkt einer Bestellung am besten in der Datenbank?
    options:
      - Als Text in deutscher Schreibweise, z. B. „29.03.2026 03:30“
      - Als Zeitpunkt in UTC, z. B. `2026-03-29T01:30:00Z`
      - Als Uhrzeit ohne Datum
      - In der Zeitzone des Servers, ohne Angabe welche das ist
    answer: 1
    explanation: >
      Ein Zeitpunkt in UTC ist eindeutig. Die Umrechnung in die Zeitzone und Schreibweise der Person passiert
      erst bei der Anzeige.
  - type: multiple
    question: Warum ist `Europe/Berlin` besser als `+01:00`?
    options:
      - "`+01:00` kennt keine Sommerzeit – im Sommer gilt in Berlin `+02:00`."
      - Zeitzonen-Namen enthalten die Regeln, auch wenn ein Land sie ändert.
      - "`+01:00` ist ungültiges ISO 8601."
      - Der Name ist für Menschen verständlicher.
    answers: [0, 1, 3]
    explanation: >
      Ein Offset beschreibt nur einen Moment. Der IANA-Name beschreibt ein Gebiet mit allen Regeln –
      Sommerzeit und politische Änderungen inklusive. `+01:00` selbst ist gültiges ISO 8601.
  - type: cloze
    text: "`new Intl.RelativeTimeFormat(\"de\", { numeric: \"auto\" }).format(-1, \"day\")` liefert ___."
    blanks:
      - [gestern, "\"gestern\""]
    explanation: >
      Mit `numeric: "auto"` nutzt Intl Wörter wie „gestern“ und „morgen“. Ohne die Option käme „vor 1 Tag“.
  - type: find-bug
    question: Die Anzeige soll die Uhrzeit für Menschen in New York zeigen, zeigt aber auf dem Server immer die Serverzeit. Welche Zeile fehlt bzw. ist falsch?
    language: js
    code: |
      const termin = new Date("2026-03-29T01:30:00Z");
      const fmt = new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });
      console.log(fmt.format(termin));
    bug_line: 4
    explanation: >
      Ohne Option `timeZone` nutzt Intl die Zeitzone der Umgebung – im Browser die der Person, auf dem Server
      die des Servers. Ergänze `timeZone: "America/New_York"` bzw. die Zeitzone aus dem Profil.
tasks:
  - id: termin-anzeigen
    type: code
    language: ts
    title: Termine in der richtigen Zeitzone
    description: |
      Termine kommen aus der API als UTC-Zeitpunkt (ISO 8601 mit `Z`). Schreibe zwei Funktionen:

      1. `formatAppointment(isoUtc, timeZone)` gibt Datum und Uhrzeit in deutscher Schreibweise in der
         angegebenen Zeitzone zurück, z. B. `"29.03.2026, 03:30"`. Nutze `Intl.DateTimeFormat("de-DE", …)` mit
         `year: "numeric"`, `month: "2-digit"`, `day: "2-digit"`, `hour: "2-digit"`, `minute: "2-digit"`.
      2. `localDay(isoUtc, timeZone)` gibt den **Kalendertag** in dieser Zeitzone als `"JJJJ-MM-TT"` zurück.
         Tipp: `formatToParts()` liefert die Teile `year`, `month` und `day` einzeln.
    starter: |
      function formatAppointment(isoUtc: string, timeZone: string): string {
        const d = new Date(isoUtc);
        return d.toISOString().slice(0, 16);
      }

      function localDay(isoUtc: string, timeZone: string): string {
        return isoUtc.slice(0, 10);
      }
    tests:
      - name: Berlin im Winter
        code: assertEqual(formatAppointment("2026-03-29T00:30:00Z", "Europe/Berlin"), "29.03.2026, 01:30")
      - name: Berlin nach der Zeitumstellung
        code: assertEqual(formatAppointment("2026-03-29T01:30:00Z", "Europe/Berlin"), "29.03.2026, 03:30")
      - name: New York ist noch am Vortag
        code: assertEqual(formatAppointment("2026-03-29T01:30:00Z", "America/New_York"), "28.03.2026, 21:30")
      - name: Kalendertag hängt von der Zeitzone ab
        code: |
          assertEqual(localDay("2026-03-29T01:30:00Z", "America/New_York"), "2026-03-28");
          assertEqual(localDay("2026-03-29T01:30:00Z", "Asia/Tokyo"), "2026-03-29");
      - name: Silvester in Berlin ist schon Neujahr
        code: assertEqual(localDay("2026-12-31T23:30:00Z", "Europe/Berlin"), "2027-01-01")
    solution: |
      function formatAppointment(isoUtc: string, timeZone: string): string {
        return new Intl.DateTimeFormat("de-DE", {
          timeZone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(isoUtc));
      }

      function localDay(isoUtc: string, timeZone: string): string {
        const parts = new Intl.DateTimeFormat("en", {
          timeZone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).formatToParts(new Date(isoUtc));
        const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
        return `${get("year")}-${get("month")}-${get("day")}`;
      }
    hints:
      - "Die Option `timeZone` bestimmt, in welcher Zeitzone Intl den Zeitpunkt darstellt."
      - "`formatToParts(date)` liefert ein Array wie `[{ type: \"month\", value: \"03\" }, …]`."
      - "Mit `parts.find((p) => p.type === \"year\")?.value` holst du einen Teil heraus."
  - id: sommerzeit-falle
    type: steps
    title: Die Sommerzeit-Falle
    description: Ein Team baut einen Kalender. Spiel die Entscheidungen durch.
    steps:
      - situation: >
          Ein wöchentliches Team-Meeting findet immer montags um 9:00 Uhr in Berlin statt. Das Team speichert
          beim Anlegen im Januar den UTC-Zeitpunkt `08:00Z` und rechnet für jede Woche einfach 7 Tage weiter.
        question: Was passiert nach der Umstellung auf Sommerzeit Ende März?
        options:
          - Nichts, UTC ist ja eindeutig.
          - Das Meeting erscheint in Berlin um 10:00 Uhr, weil 08:00Z im Sommer 10:00 Ortszeit ist.
          - Das Meeting verschwindet.
        answer: 1
        explanation: >
          Für Ereignisse in der Vergangenheit ist UTC perfekt. Wiederkehrende oder zukünftige Termine, die an
          eine Ortszeit gebunden sind, speicherst du als Ortszeit **plus** IANA-Zeitzone (`09:00`,
          `Europe/Berlin`) und rechnest jeden Termin einzeln um.
      - situation: >
          Eine Bestellung wurde am `2026-03-29T01:30:00Z` aufgegeben. Der Server läuft in UTC, die Kundin lebt
          in Berlin.
        question: Welches Datum und welche Uhrzeit soll die Rechnung zeigen?
        options:
          - "29.03.2026, 01:30 – die Serverzeit"
          - "29.03.2026, 03:30 – Ortszeit Berlin nach der Umstellung"
          - "29.03.2026, 02:30 – UTC plus eine Stunde"
        answer: 1
        explanation: >
          In der Nacht zum 29. März 2026 springt Berlin von 02:00 auf 03:00. `+1 Stunde` von Hand wäre falsch –
          die Zeitzonen-Datenbank kennt den Sprung.
      - situation: >
          Das Team will in der Liste „vor 3 Tagen“ statt eines Datums anzeigen – in allen Sprachen.
        question: Was nutzt es dafür?
        options:
          - Eigene Texte für jede Sprache und jede Zahl
          - "`Intl.RelativeTimeFormat` mit der Locale der Person"
          - "`Date.prototype.toString()`"
        answer: 1
        explanation: >
          `new Intl.RelativeTimeFormat("de").format(-3, "day")` liefert „vor 3 Tagen“, in Englisch „3 days ago“
          – inklusive Pluralformen.
---
Ein Kunde in New York beschwert sich: „Eure Mail sagt, meine Lieferung kommt am 29. März – das Tracking sagt
28. März.“ Beide haben recht. Der Zeitpunkt ist derselbe, aber in New York ist es noch der Vortag. Datum und
Uhrzeit gehören zu den häufigsten Fehlerquellen in internationaler Software – weil ein Zeitpunkt in jeder
[[zeitzone|Zeitzone]] anders aussieht.

## Ein Zeitpunkt, viele Uhrzeiten

Ein **Zeitpunkt** (*instant*) ist ein Moment auf der Weltzeitlinie. Welche Uhrzeit er hat, hängt davon ab,
wo du auf die Uhr schaust:

![Ein UTC-Zeitpunkt wird in Berlin, Tokio und New York unterschiedlich angezeigt](/assets/internationalisierung/zeitzonen-utc.svg)

Die Regel dafür ist einfach:

- **Speichern und übertragen** in [[utc|UTC]], im Format [[iso-8601|ISO 8601]]: `2026-03-29T01:30:00Z`.
- **Anzeigen** in der Zeitzone und Locale der Person – erst ganz am Ende, im Browser oder beim Rendern.

```js run
const zeitpunkt = new Date("2026-03-29T01:30:00Z");
console.log(zeitpunkt.toISOString()); // 2026-03-29T01:30:00.000Z – immer UTC
```

> [!MERKSATZ]
> Speichere Zeitpunkte, zeige Ortszeiten. Die Umrechnung passiert erst bei der Anzeige.

## Zeitzonen sind mehr als Offsets

`+01:00` ist ein **Offset** – die Abweichung von UTC in einem bestimmten Moment. Eine Zeitzone wie
`Europe/Berlin` ist dagegen eine [[iana-zeitzone|IANA-Zeitzone]]: ein Gebiet mit allen Regeln, die dort je
galten und gelten.

| | Offset `+01:00` | IANA-Name `Europe/Berlin` |
|---|---|---|
| Sommerzeit | kennt sie nicht | im Sommer `+02:00`, im Winter `+01:00` |
| Regeländerungen | – | werden über Updates der Zeitzonen-Datenbank nachgezogen |
| Wofür | einen einzelnen Zeitpunkt beschreiben | Ortszeiten berechnen, Termine planen |

Die [[sommerzeit|Sommerzeit]] erzeugt Lücken und Doppelungen: In der Nacht zum 29. März 2026 gibt es in
Berlin keine 02:30, im Oktober gibt es 02:30 zweimal.

> [!FEHLER]
> Wiederkehrende Termine („jeden Montag 9:00 Uhr in Berlin“) als UTC zu speichern und Wochen
> dazuzurechnen, verschiebt sie nach der Zeitumstellung um eine Stunde. Speichere für solche Termine die
> Ortszeit **und** den Zeitzonen-Namen.

## Anzeigen mit Intl.DateTimeFormat

`Intl.DateTimeFormat` formatiert einen Zeitpunkt in Locale **und** Zeitzone:

```js run
const d = new Date("2026-03-29T01:30:00Z");
const berlin = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: "Europe/Berlin",
});
console.log(berlin.format(d)); // Sonntag, 29. März 2026 um 03:30

const ny = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/New_York",
});
console.log(ny.format(d)); // 28.03.2026, 21:30
```

- `dateStyle` / `timeStyle`: fertige Stile (`full`, `long`, `medium`, `short`).
- Einzelne Teile: `year`, `month`, `day`, `hour`, `minute`, `weekday` – kombinierbar.
- `timeZone`: Fehlt sie, nimmt Intl die Zeitzone der Umgebung. Auf dem Server ist das die des Servers!
- `formatToParts()` liefert die Teile einzeln, wenn du eigene Layouts brauchst.

Die Zeitzone der Person liest du im Browser mit `Intl.DateTimeFormat().resolvedOptions().timeZone`.

## Relative Zeiten

„Vor 3 Tagen“ oder „morgen“ sind freundlicher als ein Datum. Auch dafür gibt es eine Klasse:

```js run
const rtf = new Intl.RelativeTimeFormat("de", { numeric: "auto" });
console.log(rtf.format(-1, "day"));  // gestern
console.log(rtf.format(-3, "day"));  // vor 3 Tagen
console.log(rtf.format(2, "hour"));  // in 2 Stunden
```

Welche Einheit passt („vor 90 Minuten“ oder „vor 2 Stunden“?), entscheidest du selbst – die Klasse
übernimmt nur Sprache und Pluralformen.

## Datum in PHP

PHP rechnet mit `DateTimeImmutable` und formatiert mit `IntlDateFormatter` aus der Erweiterung intl:

```php title="PHP"
$zeitpunkt = new DateTimeImmutable('2026-03-29T01:30:00Z');

$fmt = new IntlDateFormatter('de_DE', IntlDateFormatter::FULL, IntlDateFormatter::SHORT, 'Europe/Berlin');
echo $fmt->format($zeitpunkt); // Sonntag, 29. März 2026 um 03:30

$tokio = new IntlDateFormatter('de_DE', IntlDateFormatter::NONE, IntlDateFormatter::NONE, 'Asia/Tokyo', null, 'dd.MM.yyyy HH:mm');
echo $tokio->format($zeitpunkt); // 29.03.2026 10:30
```

`date('d.m.Y')` kennt dagegen keine Monatsnamen in anderen Sprachen. In Laravel liefert Carbon mit
`->locale('de')->isoFormat('LLLL')` lokalisierte Datumswerte. Die neue JavaScript-API
[Temporal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal) trennt
Zeitpunkte, Ortszeiten und Zeitzonen noch sauberer – prüfe vor dem Einsatz die Browser-Unterstützung.

> [!PRAXIS]
> Server, Datenbank und Logs laufen in UTC. Die Zeitzone jeder Person steht im Profil (vorausgefüllt aus dem
> Browser). So zeigt dieselbe Bestellung in Berlin und New York jeweils die richtige Ortszeit.

## Zusammenfassung

- Ein **Zeitpunkt** ist eindeutig; seine Uhrzeit hängt von der Zeitzone ab.
- Speichere Zeitpunkte in **UTC** (ISO 8601 mit `Z`), zeige sie in der Zeitzone der Person an.
- **IANA-Zeitzonen** wie `Europe/Berlin` kennen Sommerzeit und Regeländerungen, Offsets nicht.
- Zukünftige Termine in Ortszeit speicherst du mit Ortszeit **und** Zeitzonen-Namen.
- `Intl.DateTimeFormat` braucht Locale **und** `timeZone`; `Intl.RelativeTimeFormat` formuliert „vor 3 Tagen“.
- In PHP formatiert `IntlDateFormatter` lokalisierte Datumswerte in jeder Zeitzone.
