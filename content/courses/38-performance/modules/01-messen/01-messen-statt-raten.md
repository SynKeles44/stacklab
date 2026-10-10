---
title: Messen statt raten
summary: Was „schnell“ eigentlich bedeutet, wie sich Latenz und Durchsatz unterscheiden und warum Perzentile mehr verraten als der Durchschnitt.
duration: 20
sources:
  - title: web.dev – Why does speed matter?
    url: https://web.dev/learn/performance/why-speed-matters
  - title: MDN – Web performance
    url: https://developer.mozilla.org/en-US/docs/Web/Performance
  - title: Google SRE Book – Monitoring Distributed Systems (Latenz und Perzentile)
    url: https://sre.google/sre-book/monitoring-distributed-systems/
quiz:
  - type: single
    question: Eine API antwortet bei 100 Anfragen 98-mal in 20 ms und 2-mal in 3000 ms. Welche Kennzahl beschreibt die Erfahrung der meisten Nutzer:innen am besten?
    options:
      - Der Durchschnitt (rund 80 ms)
      - Der Median (20 ms) – ergänzt um das p99 für die Ausreißer
      - Der Maximalwert (3000 ms)
      - Die Summe aller Antwortzeiten
    answer: 1
    explanation: >
      Der Durchschnitt (rund 80 ms) trifft auf keine einzige echte Anfrage zu. Der Median zeigt den typischen Fall,
      ein hohes Perzentil wie p99 zeigt, wie schlimm es für die Pechvögel wird. Beides zusammen ergibt ein ehrliches Bild.
  - type: match
    question: Ordne jedem Begriff die passende Beschreibung zu.
    pairs:
      - { left: "Latenz", right: "Wie lange eine einzelne Anfrage dauert" }
      - { left: "Durchsatz", right: "Wie viele Anfragen pro Sekunde erledigt werden" }
      - { left: "p95", right: "95 % der Messwerte sind kleiner oder gleich diesem Wert" }
      - { left: "Engpass", right: "Die langsamste Stelle, die das Gesamtsystem bremst" }
    explanation: Latenz und Durchsatz sind zwei verschiedene Fragen – ein System kann viele Anfragen schaffen und trotzdem jede einzelne langsam beantworten.
  - type: cloze
    text: "Der Wert, unter dem die Hälfte aller Messwerte liegt, heißt ___ oder p50. Man optimiert zuerst den ___, also die langsamste Stelle."
    blanks:
      - [Median]
      - [Engpass, Flaschenhals, Bottleneck]
    explanation: Der Median ist p50. Eine Optimierung außerhalb des Engpasses verändert die Gesamtzeit kaum.
  - type: multiple
    question: Welche Aussagen über Perzentile stimmen?
    options:
      - p99 ist immer größer oder gleich p50.
      - Ein einziger extremer Ausreißer verschiebt den Durchschnitt stärker als den Median.
      - Für p99 reichen zehn Messwerte völlig aus.
      - Lädt eine Seite 20 Ressourcen, trifft fast jede Seitenansicht mindestens einmal auf das p95 einer Ressource.
    answers: [0, 1, 3]
    explanation: >
      Für p99 brauchst du deutlich mehr als 100 Messwerte, sonst ist das Ergebnis Zufall. Und weil eine Seite viele
      Anfragen braucht, erleben fast alle Nutzer:innen irgendwann das langsame Ende der Verteilung.
tasks:
  - id: perzentil-funktion
    type: code
    language: js
    title: Schreibe eine Perzentil-Funktion
    description: |
      Schreibe `percentile(values, p)`, die das p-te Perzentil einer Liste von Messwerten nach der
      **Nearest-Rank-Methode** berechnet:

      1. Sortiere eine **Kopie** der Werte aufsteigend (das Original darf sich nicht ändern).
      2. Berechne den Rang `rank = Math.ceil(p / 100 * n)` (n = Anzahl der Werte).
      3. Gib den Wert an Position `rank - 1` zurück. Ist `rank` kleiner als 1, nimm den ersten Wert.
      4. Bei einer leeren Liste gibst du `null` zurück.
    starter: |
      function percentile(values, p) {
        // 1. leere Liste abfangen
        // 2. Kopie sortieren
        // 3. Rang berechnen und Wert zurückgeben
      }
    tests:
      - name: Median einer kleinen Liste
        code: assertEqual(percentile([30, 10, 20], 50), 20)
      - name: p90 von zehn Werten
        code: assertEqual(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 90), 9)
      - name: p99 erwischt den Ausreißer
        code: assertEqual(percentile([20, 21, 19, 22, 3000, 20, 18, 21, 20, 19], 99), 3000)
      - name: leere Liste ergibt null
        code: assertEqual(percentile([], 95), null)
      - name: p0 ergibt den kleinsten Wert
        code: assertEqual(percentile([5, 3, 9], 0), 3)
      - name: Original bleibt unverändert
        code: |
          const data = [3, 1, 2];
          percentile(data, 50);
          assertDeepEqual(data, [3, 1, 2]);
    hints:
      - "`[...values]` erzeugt eine Kopie, `sort((a, b) => a - b)` sortiert Zahlen richtig."
      - "Ohne Vergleichsfunktion sortiert `sort()` als Text – dann landet 100 vor 20."
      - "`Math.max(rank, 1)` verhindert Position -1 bei p0."
    solution: |
      function percentile(values, p) {
        if (values.length === 0) return null;
        const sorted = [...values].sort((a, b) => a - b);
        const rank = Math.max(Math.ceil((p / 100) * sorted.length), 1);
        return sorted[rank - 1];
      }
  - id: kennzahlen-zuordnen
    type: dragdrop
    title: Welche Kennzahl beantwortet die Frage?
    description: Ordne jede Frage aus dem Team-Alltag der Kennzahl zu, mit der du sie beantwortest.
    targets:
      - { id: latenz, label: "Latenz (Median/Perzentil)" }
      - { id: durchsatz, label: "Durchsatz (Anfragen pro Sekunde)" }
      - { id: fehler, label: "Fehlerrate" }
    items:
      - { label: "Wie lange wartet eine typische Nutzerin auf die Suchergebnisse?", target: latenz }
      - { label: "Wie lange warten die langsamsten 5 % beim Checkout?", target: latenz }
      - { label: "Schafft der Server 500 Bestellungen pro Sekunde am Black Friday?", target: durchsatz }
      - { label: "Wie viele Bilder kann der Upload-Dienst pro Minute verarbeiten?", target: durchsatz }
      - { label: "Wie viele Anfragen enden unter Last mit Status 503?", target: fehler }
---
Ein Kollege sagt: „Die Startseite ist langsam, ich baue mal einen Cache ein.“ Zwei Tage später ist der Cache
fertig – und die Seite genauso langsam, weil die Zeit in Wahrheit beim Laden eines riesigen Bildes verloren ging.
Performance-Arbeit beginnt deshalb nie mit Optimieren, sondern immer mit **Messen**.

## Was heißt eigentlich „schnell“?

[[performance|Performance]] beschreibt, wie zügig und effizient ein System seine Arbeit erledigt. Dafür gibt es
zwei grundverschiedene Fragen:

| Frage | Fachbegriff | Einheit |
|---|---|---|
| Wie lange dauert **eine** Anfrage? | [[antwortzeit|Antwortzeit]] bzw. [[latenz|Latenz]] | Millisekunden (ms) |
| Wie **viele** Anfragen schafft das System? | [[durchsatz|Durchsatz]] | Anfragen pro Sekunde |

Beides hängt zusammen, ist aber nicht dasselbe. Eine Autobahn mit acht Spuren hat einen hohen Durchsatz –
im Stau dauert deine einzelne Fahrt trotzdem ewig.

Für Nutzer:innen zählt fast immer die Antwortzeit. Untersuchungen zeigen seit Jahren: Wird eine Seite
spürbar langsamer, brechen mehr Menschen den Kauf oder die Anmeldung ab.

> [!MERKSATZ]
> Latenz misst die Wartezeit einer Anfrage, Durchsatz die Menge pro Zeit. Optimiere für die Frage, die dein Problem wirklich beschreibt.

## Warum der Durchschnitt lügt

Stell dir zehn Messungen einer API vor: neunmal 20 ms, einmal 3000 ms. Der **Durchschnitt** liegt bei 318 ms –
einen Wert, den keine einzige Anfrage tatsächlich hatte. Ausreißer ziehen ihn nach oben, und gleichmäßig
langsame Systeme sehen damit genauso aus wie meist schnelle mit gelegentlichen Hängern.

Besser sind [[perzentil|Perzentile]]: Du sortierst alle Messwerte und liest ab, unter welchem Wert ein bestimmter
Anteil liegt.

| Kennzahl | Bedeutung | Beispiel oben |
|---|---|---|
| p50 ([[median|Median]]) | Die Hälfte ist schneller | 20 ms |
| p95 | 95 % sind schneller | 3000 ms bei nur 10 Werten |
| p99 | 99 % sind schneller | braucht mindestens einige hundert Werte |

![Verteilung von Antwortzeiten mit Median, p95 und p99](/assets/performance/perzentile.svg)

> [!FEHLER]
> „Unsere API antwortet im Schnitt in 80 ms, alles gut.“ – Ohne p95 oder p99 weißt du nicht, ob jede zehnte
> Anfrage drei Sekunden hängt. Berichte immer Median **und** ein hohes Perzentil.

## Warum das langsame Ende so wichtig ist

Ein p99 von zwei Sekunden klingt nach „betrifft nur 1 %“. Aber eine Webseite lädt oft 50 Dateien und ruft
mehrere APIs auf. Die Wahrscheinlichkeit, dass **alle** 50 Anfragen schneller als ihr p99 sind, beträgt nur
0,99⁵⁰ ≈ 60 %. Vier von zehn Seitenaufrufen erleben also mindestens einen Ausreißer.

Darum formulieren Teams Ziele fast immer als Perzentil, zum Beispiel:

- „p95 der Produkt-API unter 300 ms“
- „p75 des Largest Contentful Paint unter 2,5 s“ (das lernst du in Modul 2)

Für aussagekräftige hohe Perzentile brauchst du viele Messwerte. Bei 20 Werten ist p99 schlicht der
größte Wert – ein Zufallstreffer.

## Erst den Engpass finden

Ein System ist nur so schnell wie seine langsamste Stelle, der [[engpass|Engpass]]. Dauert eine Anfrage
1000 ms, davon 900 ms in der Datenbank, dann bringt es fast nichts, das HTML-Rendering von 50 auf 25 ms zu
halbieren: Die Gesamtzeit sinkt von 1000 auf 975 ms.

So gehst du deshalb immer vor:

1. **Ziel festlegen** – welche Kennzahl, welcher Wert? („p95 unter 300 ms“)
2. **Messen** – den Ist-Zustand mit echten Zahlen festhalten.
3. **Engpass finden** – mit einem [[profiling|Profiler]] oder gezielten Messpunkten.
4. **Eine** Änderung umsetzen.
5. **Erneut messen** – hat es geholfen? Sonst rückgängig machen.

> [!PRAXIS]
> In Code-Reviews ist „Das macht es schneller“ ohne Zahlen ein schwaches Argument. Ein Satz wie „p95 von
> 420 ms auf 180 ms, Messung im PR beschrieben“ überzeugt – und schützt vor Optimierungen, die nur den Code
> komplizierter machen.

## Zusammenfassung

- Performance-Arbeit beginnt mit Messen, nicht mit Vermutungen.
- **Latenz** ist die Dauer einer Anfrage, **Durchsatz** die Menge pro Zeit.
- Der Durchschnitt versteckt Ausreißer; nutze **Median (p50)** und hohe **Perzentile** wie p95 oder p99.
- Weil Seiten viele Anfragen brauchen, trifft das langsame Ende fast alle Nutzer:innen.
- Optimiere zuerst den **Engpass** und miss nach jeder Änderung erneut.
