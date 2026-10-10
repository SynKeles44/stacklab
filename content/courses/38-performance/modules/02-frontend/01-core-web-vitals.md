---
title: Core Web Vitals
summary: Die drei Kennzahlen LCP, INP und CLS, ihre Grenzwerte, der Unterschied zwischen Labor- und Felddaten und wie du sie misst.
duration: 25
sources:
  - title: web.dev – Web Vitals
    url: https://web.dev/articles/vitals
  - title: web.dev – Largest Contentful Paint (LCP)
    url: https://web.dev/articles/lcp
  - title: web.dev – Interaction to Next Paint (INP)
    url: https://web.dev/articles/inp
  - title: web.dev – Cumulative Layout Shift (CLS)
    url: https://web.dev/articles/cls
  - title: GitHub – web-vitals (JavaScript-Bibliothek)
    url: https://github.com/GoogleChrome/web-vitals
quiz:
  - type: match
    question: Ordne jeder Kennzahl zu, was sie misst.
    pairs:
      - { left: "LCP", right: "Wann das größte sichtbare Element fertig gezeichnet ist" }
      - { left: "INP", right: "Wie schnell die Seite nach Klicks und Tastendrücken sichtbar reagiert" }
      - { left: "CLS", right: "Wie stark Inhalte unerwartet verrutschen" }
      - { left: "TTFB", right: "Wann das erste Byte der HTML-Antwort ankommt" }
    explanation: LCP steht für Laden, INP für Reaktionsfähigkeit, CLS für visuelle Stabilität. TTFB ist eine unterstützende Kennzahl.
  - type: single
    question: Welches Perzentil der Seitenaufrufe muss einen Grenzwert einhalten, damit eine Seite als „gut“ gilt?
    options: [p50, p75, p95, p99]
    answer: 1
    explanation: >
      Bewertet wird das 75. Perzentil der echten Seitenaufrufe, getrennt nach Mobilgeräten und Desktop. So zählt nicht nur
      der Glücksfall mit schnellem WLAN.
  - type: cloze
    text: "Gut sind ein LCP bis ___ Sekunden, ein INP bis ___ Millisekunden und ein CLS bis ___."
    blanks:
      - ["2,5", "2.5"]
      - ["200"]
      - ["0,1", "0.1"]
    explanation: Diese Grenzwerte gelten für das 75. Perzentil. Darüber beginnt „verbesserungswürdig“, ab 4 s / 500 ms / 0,25 „schlecht“.
  - type: multiple
    question: Welche Aussagen über Labor- und Felddaten stimmen?
    options:
      - Lighthouse misst unter festgelegten Bedingungen auf einem einzigen Gerät (Labordaten).
      - Felddaten stammen von echten Besuchen mit echten Geräten und Netzen.
      - INP lässt sich im Labor ohne echte Interaktionen vollständig messen.
      - Ein gutes Lighthouse-Ergebnis garantiert gute Felddaten.
    answers: [0, 1]
    explanation: >
      INP braucht echte Klicks und Eingaben, darum ist er vor allem ein Feldwert; Lighthouse zeigt ersatzweise die
      Total Blocking Time. Labordaten helfen beim Debuggen, entscheidend ist, was Nutzer:innen erleben.
tasks:
  - id: vital-bewerten
    type: code
    language: js
    title: Bewerte einen Web-Vital-Messwert
    description: |
      Schreibe `rateVital(name, value)`, die einen Messwert einordnet und `"gut"`, `"verbesserungswürdig"` oder
      `"schlecht"` zurückgibt. LCP und INP kommen in Millisekunden, CLS ohne Einheit.

      | Kennzahl | gut bis einschließlich | schlecht ab über |
      |---|---|---|
      | `LCP` | 2500 | 4000 |
      | `INP` | 200 | 500 |
      | `CLS` | 0.1 | 0.25 |

      Werte genau auf der Grenze zählen noch zur besseren Stufe. Bei einem unbekannten Namen wirfst du einen `Error`.
    starter: |
      const THRESHOLDS = {
        LCP: [2500, 4000],
        // INP und CLS ergänzen
      };

      function rateVital(name, value) {
      }
    tests:
      - name: schneller LCP ist gut
        code: assertEqual(rateVital('LCP', 1800), 'gut')
      - name: Grenzwert zählt noch als gut
        code: assertEqual(rateVital('INP', 200), 'gut')
      - name: INP dazwischen
        code: assertEqual(rateVital('INP', 350), 'verbesserungswürdig')
      - name: CLS schlecht
        code: assertEqual(rateVital('CLS', 0.3), 'schlecht')
      - name: CLS 0 ist gut
        code: assertEqual(rateVital('CLS', 0), 'gut')
      - name: LCP genau 4000 ist noch verbesserungswürdig
        code: assertEqual(rateVital('LCP', 4000), 'verbesserungswürdig')
      - name: unbekannte Kennzahl wirft
        code: assertThrows(() => rateVital('FID', 50))
    hints:
      - "Lege für jede Kennzahl ein Paar `[gutBis, schlechtAb]` an."
      - "`if (!(name in THRESHOLDS)) throw new Error(...)` fängt unbekannte Namen ab."
      - "Vergleiche mit `<=`, damit der Grenzwert zur besseren Stufe gehört."
    solution: |
      const THRESHOLDS = {
        LCP: [2500, 4000],
        INP: [200, 500],
        CLS: [0.1, 0.25],
      };

      function rateVital(name, value) {
        if (!(name in THRESHOLDS)) {
          throw new Error(`Unbekannte Kennzahl: ${name}`);
        }
        const [good, poor] = THRESHOLDS[name];
        if (value <= good) return 'gut';
        if (value <= poor) return 'verbesserungswürdig';
        return 'schlecht';
      }
  - id: symptom-kennzahl
    type: dragdrop
    title: Welche Kennzahl leidet?
    description: Ordne jedes Symptom der Core-Web-Vital-Kennzahl zu, die es verschlechtert.
    targets:
      - { id: lcp, label: "LCP (Laden)" }
      - { id: inp, label: "INP (Reaktion)" }
      - { id: cls, label: "CLS (Stabilität)" }
    items:
      - { label: "Das 3-MB-Titelbild lädt erst nach allen Skripten", target: lcp }
      - { label: "Der Server braucht 1,5 s für das HTML", target: lcp }
      - { label: "Nach dem Klick auf „In den Warenkorb“ friert die Seite 800 ms ein", target: inp }
      - { label: "Ein Suchfeld filtert bei jedem Tastendruck 20 000 Einträge im Main Thread", target: inp }
      - { label: "Ein Werbebanner schiebt den Text nach dem Laden nach unten", target: cls }
      - { label: "Ein Bild ohne width und height drückt den Inhalt beim Laden weg", target: cls }
---
Deine Seite lädt in deinem Büro mit Glasfaser in einer Sekunde. Eine Kundin im Zug mit einem drei Jahre alten
Smartphone wartet sechs Sekunden – und tippt dann auf einen Button, der gerade nach unten verrutscht. Damit Teams
solche Erlebnisse vergleichbar messen können, hat Google die [[core-web-vitals|Core Web Vitals]] definiert.

## Drei Fragen, drei Kennzahlen

Die Core Web Vitals beantworten drei Fragen aus Sicht der Nutzer:innen:

| Frage | Kennzahl | gut | schlecht ab über |
|---|---|---|---|
| Ist der Hauptinhalt schnell da? | [[lcp|LCP]] – Largest Contentful Paint | ≤ 2,5 s | 4 s |
| Reagiert die Seite flott auf Eingaben? | [[inp|INP]] – Interaction to Next Paint | ≤ 200 ms | 500 ms |
| Bleibt das Layout ruhig? | [[cls|CLS]] – Cumulative Layout Shift | ≤ 0,1 | 0,25 |

Dazwischen liegt jeweils „verbesserungswürdig“. Bewertet wird das **75. [[perzentil|Perzentil]]** aller echten
Seitenaufrufe, getrennt nach Mobilgerät und Desktop. INP hat im März 2024 die ältere Kennzahl FID ersetzt.

> [!MERKSATZ]
> LCP = Laden, INP = Reaktion, CLS = Stabilität. Gut ist eine Seite, wenn 75 % der Besuche unter 2,5 s, 200 ms und 0,1 bleiben.

## LCP – wann ist der Hauptinhalt da?

LCP misst, wann das **größte sichtbare Element** im Viewport fertig gezeichnet ist – meist ein Titelbild,
ein Video-Vorschaubild oder ein großer Textblock. Die Zeit setzt sich aus vier Teilen zusammen:

1. **[[time-to-first-byte|TTFB]]** – bis das HTML ankommt (Server, Netz, Weiterleitungen)
2. **Ladeverzögerung** – bis der Browser das Bild überhaupt anfordert
3. **Ladedauer** – die Übertragung des Bildes
4. **Renderverzögerung** – bis es tatsächlich gezeichnet wird

Typische Ursachen: ein langsamer Server, ein riesiges Bild, ein Bild, das erst per JavaScript nachgeladen wird,
und [[render-blocking|render-blockierendes]] CSS oder JavaScript. Wie du das behebst, lernst du in der nächsten Lektion.

## INP – reagiert die Seite?

INP misst bei **allen** Klicks, Taps und Tastendrücken eines Besuchs die Zeit bis zum nächsten sichtbaren Bild
und meldet einen der schlechtesten Werte. Schlecht wird er, wenn der [[main-thread|Main Thread]] des Browsers
beschäftigt ist – denn dort laufen JavaScript, Layout und Zeichnen nacheinander.

```js title="Ein Klick-Handler, der den Main Thread blockiert"
button.addEventListener('click', () => {
  const sorted = hugeList.toSorted(compareProducts); // 600 ms Rechnen
  render(sorted);                                     // erst danach sieht man etwas
});
```

Abhilfe: weniger Arbeit pro Interaktion, sofort sichtbares Feedback zeigen und lange Aufgaben in kleine Stücke
teilen, z. B. mit `await scheduler.yield()` (wo verfügbar) oder `setTimeout`. Jede Aufgabe über 50 ms gilt
als [[long-task|Long Task]].

## CLS – bleibt alles an seinem Platz?

CLS summiert unerwartete Layout-Verschiebungen: Wie viel der sichtbaren Fläche verrutscht, und wie weit?
Klassische Auslöser:

- Bilder und Videos **ohne** `width`/`height` – der Platz wird erst beim Laden reserviert.
- Banner, Cookie-Hinweise oder Anzeigen, die oben **eingefügt** werden.
- Webfonts, die beim Austausch die Textbreite stark ändern.

Verschiebungen innerhalb von 500 ms nach einer Eingabe zählen nicht – wer ein Menü aufklappt, erwartet Bewegung.

> [!FEHLER]
> „Bei mir springt nichts.“ – Auf deinem schnellen Rechner ist das Bild schon im Cache, bevor du hinsiehst. Auf
> langsamen Verbindungen schiebt es den Text sichtbar nach unten. Reserviere den Platz immer im HTML oder CSS.

## Labor- und Felddaten

| | Labordaten | Felddaten |
|---|---|---|
| Quelle | Ein Testlauf unter festen Bedingungen | Echte Besuche, echte Geräte |
| Werkzeuge | [[lighthouse|Lighthouse]], DevTools Performance-Tab | Chrome UX Report, eigenes [[real-user-monitoring|RUM]] |
| Stärke | Reproduzierbar, gut zum Debuggen | Zeigt, was Nutzer:innen wirklich erleben |
| INP | nicht messbar (ersatzweise Total Blocking Time) | ja |

Eigene Felddaten sammelst du mit der kleinen Bibliothek `web-vitals`:

```js title="Felddaten an den eigenen Server schicken"
import { onLCP, onINP, onCLS } from 'web-vitals';

function send(metric) {
  navigator.sendBeacon('/api/vitals', JSON.stringify({ name: metric.name, value: metric.value }));
}

onLCP(send);
onINP(send);
onCLS(send);
```

> [!PRAXIS]
> Viele Teams zeigen die p75-Werte der Felddaten auf einem Dashboard neben den Fehlerraten. Ein neues Release, das
> den LCP auf Mobilgeräten um 800 ms verschlechtert, fällt dann am nächsten Tag auf – nicht erst, wenn die Umsätze sinken.

## Zusammenfassung

- **LCP** misst das Laden des Hauptinhalts (gut ≤ 2,5 s), **INP** die Reaktion auf Eingaben (gut ≤ 200 ms), **CLS** die Stabilität des Layouts (gut ≤ 0,1).
- Bewertet wird das **75. Perzentil** echter Besuche, getrennt nach Mobil und Desktop.
- LCP leidet unter langsamem Server, großen Bildern und blockierenden Ressourcen.
- INP leidet unter langen Aufgaben im **Main Thread**, CLS unter fehlendem reserviertem Platz.
- **Labordaten** (Lighthouse) helfen beim Debuggen, **Felddaten** (`web-vitals`, RUM) zeigen die Wahrheit.
