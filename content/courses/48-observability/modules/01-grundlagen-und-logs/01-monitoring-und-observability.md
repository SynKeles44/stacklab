---
title: Monitoring, Observability und die drei Signale
summary: Warum „läuft der Server?“ nicht reicht und wie Logs, Metriken und Traces zusammen die Frage „Warum ist es kaputt?“ beantworten.
duration: 20
sources:
  - title: OpenTelemetry – Observability primer
    url: https://opentelemetry.io/docs/concepts/observability-primer/
  - title: OpenTelemetry – Signals
    url: https://opentelemetry.io/docs/concepts/signals/
  - title: Prometheus – Overview
    url: https://prometheus.io/docs/introduction/overview/
quiz:
  - type: single
    question: Was unterscheidet Observability von klassischem Monitoring am besten?
    options:
      - Observability braucht keine Metriken mehr.
      - Monitoring beantwortet vorher bekannte Fragen, Observability erlaubt auch neue Fragen an das System, ohne neuen Code auszurollen.
      - Monitoring ist nur für Server, Observability nur für Browser.
      - Observability ist der Name eines bestimmten Produkts von Grafana.
    answer: 1
    explanation: Monitoring prüft bekannte Zustände („Ist die CPU über 90 %?“). Observability heißt, dass deine Telemetrie so reichhaltig ist, dass du auch unerwartete Fragen beantworten kannst – etwa „Sind nur Kund:innen mit Gutschein betroffen?“.
  - type: match
    question: Welches Signal beantwortet welche Frage am besten?
    pairs:
      - { left: "Logs", right: "Was ist bei genau dieser Anfrage passiert?" }
      - { left: "Metriken", right: "Wie viele Fehler pro Sekunde haben wir gerade?" }
      - { left: "Traces", right: "In welchem Dienst ging die Zeit verloren?" }
    explanation: Metriken zeigen Trends billig und schnell, Traces zeigen den Weg einer einzelnen Anfrage, Logs liefern die Details zu einem Ereignis.
  - type: multiple
    question: Welche Aussagen über Metriken stimmen?
    options:
      - Sie sind Zahlen, die über die Zeit gespeichert werden.
      - Sie sind sehr günstig zu speichern und schnell abzufragen.
      - Sie enthalten den vollständigen Text jeder Fehlermeldung.
      - Sie eignen sich gut als Grundlage für Alarme.
    answers: [0, 1, 3]
    explanation: Metriken sind verdichtete Zahlen. Den Fehlertext findest du in den Logs – Metriken sagen dir nur, dass und wie oft etwas passiert.
  - type: cloze
    text: Damit du von einem Trace zu den passenden Logzeilen springen kannst, schreibst du in jede Logzeile dieselbe ___ wie im Trace.
    blanks:
      - [trace_id, trace-id, Trace-ID, traceid]
    explanation: Gemeinsame IDs verbinden die Signale. Ohne sie hast du drei getrennte Datenberge.
tasks:
  - id: signale-zuordnen
    type: dragdrop
    title: Welches Signal hilft hier?
    description: Ordne jede Frage aus dem Arbeitsalltag dem Signal zu, das sie am schnellsten beantwortet.
    targets:
      - { id: logs, label: Logs }
      - { id: metriken, label: Metriken }
      - { id: traces, label: Traces }
    items:
      - { label: "Welche Fehlermeldung bekam Bestellung 4711?", target: logs }
      - { label: "Mit welchen Parametern wurde der Job gestartet?", target: logs }
      - { label: "Wie hat sich die Fehlerquote seit dem Deployment entwickelt?", target: metriken }
      - { label: "Wie voll ist die Festplatte des Datenbank-Servers?", target: metriken }
      - { label: "Warum dauert dieser eine Checkout 4 Sekunden?", target: traces }
      - { label: "Welcher nachgelagerte Dienst bremst die Anfrage aus?", target: traces }
    hints:
      - Metriken sind Zahlen über die Zeit, Logs sind Einzelereignisse mit Text, Traces zeigen einen Weg durch mehrere Dienste.
  - id: von-alarm-zu-ursache
    type: steps
    title: Vom Alarm zur Ursache
    description: Du hast Bereitschaft. Geh die Untersuchung Schritt für Schritt durch.
    steps:
      - situation: Um 14:02 kommt ein Alarm „Fehlerquote Checkout über 5 %“.
        question: Wo schaust du zuerst hin?
        options:
          - Auf das Checkout-Dashboard mit Anfragen, Fehlern und Dauer.
          - Direkt in die Logdatei und lese alles seit heute Morgen.
          - Du startest den Server neu.
        answer: 0
        explanation: Das Dashboard zeigt in Sekunden, seit wann, wie stark und welche Route betroffen ist. Neustarten ohne Diagnose zerstört Hinweise.
      - situation: Das Dashboard zeigt, dass seit 13:55 vor allem `POST /checkout` mit Status 502 fehlschlägt und die Dauer auf 10 Sekunden springt.
        question: Wie findest du heraus, wo die Zeit verloren geht?
        options:
          - Du öffnest einen langsamen Beispiel-Trace dieser Route.
          - Du erhöhst das Log-Level auf debug für alle Dienste.
          - Du schaust auf die CPU-Auslastung des Laptops.
        answer: 0
        explanation: Ein Trace zeigt die Spans der Anfrage. Dort siehst du, dass der Aufruf an den Zahlungsdienst 10 Sekunden dauert und dann abbricht.
      - situation: Der Trace zeigt einen Timeout beim Zahlungsdienst. Der Span hat die trace_id `4bf92f35…`.
        question: Wie bekommst du die genaue Fehlermeldung?
        options:
          - Du filterst die Logs nach dieser trace_id.
          - Du rätst anhand des Statuscodes.
          - Du wartest, bis Nutzer:innen den Fehler beschreiben.
        answer: 0
        explanation: Weil jede Logzeile die trace_id enthält, findest du genau die Zeilen dieser Anfrage – inklusive „connection timed out after 10000 ms“.
---
Montag, 14 Uhr: Im Support-Chat häufen sich Meldungen, dass der Checkout „hängt“. Der Server läuft, die
CPU ist entspannt, die Startseite lädt. Trotzdem verliert der Shop gerade Geld. Genau für solche Momente
brauchst du Observability – und darum geht es in diesem Kurs.

![Die drei Signale: Logs, Metriken und Traces, verbunden über gemeinsame IDs](/assets/observability/drei-signale.svg)

## Monitoring: bekannte Fragen beantworten

[[monitoring|Monitoring]] heißt: Du überwachst Werte, von denen du vorher weißt, dass sie wichtig sind.
Läuft der Prozess? Ist die Festplatte unter 90 %? Antwortet `/health` mit 200?

Monitoring ist wie die Anzeigen im Auto-Armaturenbrett. Tank, Temperatur und Öldruck sind festgelegt.
Leuchtet eine Lampe, weißt du: Hier stimmt etwas nicht.

Das Problem: Moderne Fehler sind selten so eindeutig. Im Beispiel oben ist **kein** Messwert rot – und
trotzdem ist der Checkout kaputt. Dein Armaturenbrett kennt diese Frage schlicht nicht.

## Observability: neue Fragen stellen können

[[observability|Observability]] (Beobachtbarkeit) beschreibt, wie gut du aus den Daten, die dein System
nach außen gibt, auf seinen inneren Zustand schließen kannst. Diese Daten heißen [[telemetrie|Telemetrie]].

Der entscheidende Unterschied: Bei guter Observability kannst du **neue** Fragen beantworten, ohne neuen
Code auszurollen. Zum Beispiel:

- Betrifft das Problem nur Bestellungen mit Gutschein?
- Nur Anfragen, die über den neuen Zahlungsdienst laufen?
- Erst seit dem Deployment von 13:50?

| | Monitoring | Observability |
|---|---|---|
| Fragestellung | vorher bekannt | auch unbekannt |
| Typische Frage | „Ist es kaputt?“ | „Warum ist es kaputt?“ |
| Voraussetzung | ein paar Messwerte | reichhaltige, verknüpfte Telemetrie |

> [!MERKSATZ]
> Monitoring sagt dir, **dass** etwas kaputt ist. Observability hilft dir herauszufinden, **warum**.
> Das eine ersetzt das andere nicht – Monitoring ist ein Teil davon.

## Die drei Signale

Telemetrie besteht vor allem aus drei Arten von Daten, den *Signalen*:

| Signal | Was es ist | Stärke | Schwäche |
|---|---|---|---|
| **Logs** | ein Eintrag pro Ereignis, mit Details | genaue Ursache, Kontext | groß, teuer, schwer zu überblicken |
| **[[metrik\|Metriken]]** | Zahlen über die Zeit | billig, schnell, ideal für Alarme | keine Details zum Einzelfall |
| **[[trace\|Traces]]** | der Weg einer Anfrage durch alle Dienste | zeigt, wo Zeit verloren geht | aufwendiger einzurichten |

Ein Trace besteht aus [[span|Spans]] – je ein Span pro Arbeitsschritt, etwa „SQL-Abfrage“ oder „Aufruf
des Zahlungsdienstes“. Mehr dazu in Modul 3.

> [!PRAXIS]
> Viele Teams starten mit Logs, weil sie schon da sind. Den größten Sprung macht man meist mit
> **Metriken pro Route** – plötzlich sieht man auf einen Blick, *welche* Seite Probleme hat.

## Die Signale verbinden

Drei getrennte Datenberge helfen wenig. Ihre Stärke entsteht durch **Verknüpfung**. Der typische Weg
im Ernstfall:

1. Ein Alarm auf einer **Metrik** meldet: Fehlerquote steigt.
2. Ein [[dashboard|Dashboard]] zeigt: betroffen ist `POST /checkout` seit 13:55.
3. Ein **Trace** einer langsamen Anfrage zeigt: Der Zahlungsdienst braucht 10 Sekunden.
4. Die **Logs** dieser Anfrage nennen die genaue Ursache: ein Timeout.

Damit Schritt 3 → 4 klappt, braucht jede Logzeile dieselbe [[trace-id|Trace-ID]] wie der Trace – bzw.
eine [[korrelations-id|Korrelations-ID]], die alle Zeilen einer Anfrage verbindet.

```json title="Eine Logzeile, die zum Trace passt"
{"level":"error","message":"Payment request failed","route":"POST /checkout",
 "trace_id":"4bf92f3577b34da6a3ce929d0e0e4736","duration_ms":10002}
```

> [!FEHLER]
> **Erst loggen, wenn es brennt.** Wer erst im Incident anfängt, Telemetrie einzubauen, hat für genau
> diesen Incident keine Daten. Observability baut man vorher – wie einen Rauchmelder.

## Zusammenfassung

- **Monitoring** überwacht vorher bekannte Werte und sagt dir, *dass* etwas kaputt ist.
- **Observability** erlaubt auch neue Fragen und hilft dir, das *Warum* zu finden.
- Die drei Signale: **Logs** (Details), **Metriken** (Zahlen über die Zeit), **Traces** (Weg einer Anfrage).
- Metriken eignen sich für Alarme und Trends, Logs für die genaue Ursache, Traces für die Frage „Wo?“.
- Gemeinsame IDs wie `trace_id` verbinden die Signale – erst dadurch wird aus Daten eine Diagnose.
