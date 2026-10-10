---
title: Metrik-Typen, RED und USE
summary: Counter, Gauge und Histogramm verstehen, warum Durchschnitte lügen und wie du mit den Methoden RED und USE entscheidest, was du misst.
duration: 25
sources:
  - title: Prometheus – Metric types
    url: https://prometheus.io/docs/concepts/metric_types/
  - title: Prometheus – Data model
    url: https://prometheus.io/docs/concepts/data_model/
  - title: Prometheus – Histograms and summaries
    url: https://prometheus.io/docs/practices/histograms/
  - title: OpenTelemetry – Metrics
    url: https://opentelemetry.io/docs/concepts/signals/metrics/
quiz:
  - type: match
    question: Welcher Metrik-Typ passt zu welchem Messwert?
    pairs:
      - { left: "Anzahl aller bisher bearbeiteten Anfragen", right: "Counter" }
      - { left: "Aktuelle Anzahl Jobs in der Queue", right: "Gauge" }
      - { left: "Verteilung der Antwortzeiten", right: "Histogramm" }
    explanation: Ein Counter zählt nur nach oben, ein Gauge ist ein aktueller Stand, der steigen und fallen kann, ein Histogramm sortiert Messwerte in Eimer (Buckets).
  - type: single
    question: 19 Anfragen dauern 100 ms, eine dauert 10 Sekunden. Was beschreibt das Erlebnis der Nutzer:innen am ehrlichsten?
    options:
      - Der Durchschnitt von etwa 595 ms.
      - Median und p99 zusammen – 100 ms für die meisten, 10 s für die langsamsten.
      - Nur der schnellste Wert.
      - Die Summe aller Dauern.
    answer: 1
    explanation: Der Durchschnitt beschreibt niemanden – keine einzige Anfrage dauerte 595 ms. Perzentile zeigen, wie es der Mehrheit und den Pechvögeln geht.
  - type: multiple
    question: Welche Werte gehören zur RED-Methode für einen Webdienst?
    options:
      - Rate – Anfragen pro Sekunde
      - Errors – fehlgeschlagene Anfragen pro Sekunde
      - Duration – Verteilung der Antwortzeiten
      - Disk – freier Speicherplatz
    answers: [0, 1, 2]
    explanation: RED steht für Rate, Errors, Duration und beschreibt Dienste aus Sicht ihrer Nutzer:innen. Speicherplatz ist eine Ressource und gehört zu USE.
  - type: cloze
    text: Die USE-Methode misst für jede Ressource Utilization, ___ und Errors.
    blanks:
      - [Saturation, Sättigung]
    explanation: Saturation (Sättigung) zeigt, wie viel Arbeit wartet, weil die Ressource voll ist – etwa die Länge einer Warteschlange.
  - type: single
    question: Warum ist `http_requests_total{user_id="83712"}` eine schlechte Idee?
    options:
      - Label dürfen keine Zahlen enthalten.
      - Jede User-ID erzeugt eine eigene Zeitreihe – bei vielen Nutzer:innen explodiert der Speicherbedarf.
      - Counter dürfen keine Label haben.
      - Prometheus kann nur ein Label pro Metrik speichern.
    answer: 1
    explanation: Jede Label-Kombination ist eine eigene Zeitreihe. Label mit unbegrenzt vielen Werten (User-IDs, E-Mails, Request-IDs) führen zu hoher Kardinalität und bringen die Datenbank in Not. Solche Details gehören in Logs oder Traces.
tasks:
  - id: metrik-typ-waehlen
    type: dragdrop
    title: Den richtigen Metrik-Typ wählen
    description: Ordne jeden Messwert dem passenden Metrik-Typ zu.
    targets:
      - { id: counter, label: Counter }
      - { id: gauge, label: Gauge }
      - { id: histogram, label: Histogramm }
    items:
      - { label: "Versendete E-Mails seit dem Start", target: counter }
      - { label: "Fehlgeschlagene Logins", target: counter }
      - { label: "Belegter Arbeitsspeicher", target: gauge }
      - { label: "Wartende Jobs in der Queue", target: gauge }
      - { label: "Antwortzeit von HTTP-Anfragen", target: histogram }
      - { label: "Größe hochgeladener Dateien", target: histogram }
    hints:
      - Kann der Wert sinken? Dann ist es kein Counter.
      - Interessiert dich die Verteilung vieler Einzelwerte (z. B. p95)? Dann brauchst du ein Histogramm.
  - id: durchschnitt-luegt
    type: terminal
    title: Warum der Durchschnitt lügt
    description: |
      Im Ordner `perzentile` liegt `dauer-ms.txt` mit den Antwortzeiten von 20 Anfragen (eine Zahl pro
      Zeile, unsortiert). Berechne mit `sort` und `awk` drei Kennzahlen und schreibe sie in `ergebnis.txt`,
      jeweils als `name=wert` in einer eigenen Zeile:

      1. `avg=` – der Durchschnitt, auf eine ganze Zahl gerundet (`printf "%.0f"`).
      2. `p50=` – der Median.
      3. `p95=` – das 95. Perzentil.

      Für die Perzentile nimmst du die **Nearest-Rank-Methode**: Sortiere aufsteigend und nimm den Wert an
      Position ⌈p/100 · n⌉. Bei 20 Werten ist p50 also der 10. Wert und p95 der 19. Wert.

      Klicke zuerst auf **Aufgabe vorbereiten**. Vergleiche danach: Welcher Wert beschreibt die Nutzer:innen?
    workdir: perzentile
    setup: |
      printf '%s\n' 102 85 3100 98 110 92 125 100 118 80 130 105 2900 95 108 112 90 120 100 115 > dauer-ms.txt
    checks:
      - type: file_exists
        path: ergebnis.txt
        message: Lege die Datei ergebnis.txt an.
      - type: file_contains
        path: ergebnis.txt
        pattern: "^avg=394$"
        message: "Die Zeile avg= stimmt noch nicht. Summe durch Anzahl, gerundet: awk '{s+=$1} END {printf \"avg=%.0f\\n\", s/NR}'"
      - type: file_contains
        path: ergebnis.txt
        pattern: "^p50=105$"
        message: Die Zeile p50= stimmt noch nicht. Sortiere mit sort -n und nimm den 10. Wert.
      - type: file_contains
        path: ergebnis.txt
        pattern: "^p95=2900$"
        message: Die Zeile p95= stimmt noch nicht. Sortiere mit sort -n und nimm den 19. Wert.
    hints:
      - "`sort -n dauer-ms.txt` sortiert numerisch. `sed -n '10p'` gibt die 10. Zeile aus."
      - "In awk speicherst du alle Werte in einem Array: `{a[NR]=$1; s+=$1}` – im `END`-Block hast du dann `NR` (Anzahl) und `s` (Summe)."
      - "Komplett: `sort -n dauer-ms.txt | awk '{a[NR]=$1; s+=$1} END {printf \"avg=%.0f\\np50=%d\\np95=%d\\n\", s/NR, a[10], a[19]}' > ergebnis.txt`"
    solution: |
      ```bash
      cd perzentile
      sort -n dauer-ms.txt | awk '{a[NR]=$1; s+=$1} END {printf "avg=%.0f\np50=%d\np95=%d\n", s/NR, a[10], a[19]}' > ergebnis.txt
      cat ergebnis.txt
      ```

      Ergebnis: `avg=394`, `p50=105`, `p95=2900`. Keine einzige Anfrage dauerte etwa 394 ms – der
      Durchschnitt beschreibt niemanden. Der Median zeigt den Normalfall, p95 die langsamen Ausreißer.
---
Dein Chef fragt: „Wie schnell ist unsere API?“ Du antwortest: „Im Schnitt 394 Millisekunden.“ Klingt
okay – dabei warten die meisten Nutzer:innen nur 100 ms, ein paar aber drei Sekunden. Welche Zahl du
misst und wie, entscheidet darüber, ob du Probleme siehst oder übersiehst.

## Was ist eine Metrik?

Eine [[metrik|Metrik]] ist ein Messwert mit Namen, der regelmäßig erfasst wird. Jede Messung hat einen
[[zeitstempel|Zeitstempel]]. Alle Messungen derselben Metrik mit denselben Labels bilden eine
[[zeitreihe|Zeitreihe]].

```text title="Eine Metrik mit Labels"
http_requests_total{route="/checkout", status="500"}  17
```

[[metrik-label|Label]] (Schlüssel-Wert-Paare) teilen eine Metrik auf: pro Route, pro Statuscode, pro
Server. **Jede Label-Kombination ist eine eigene Zeitreihe.** Deshalb müssen Label wenige, feste Werte
haben – mehr dazu gleich.

## Die drei wichtigsten Metrik-Typen

| Typ | Verhalten | Beispiele | Typische Frage |
|---|---|---|---|
| [[counter-metrik\|Counter]] | zählt nur nach oben (Neustart → 0) | Anfragen, Fehler, versendete Mails | Wie viele pro Sekunde? |
| [[gauge-metrik\|Gauge]] | aktueller Stand, steigt und fällt | Speicher, Queue-Länge, Verbindungen | Wie viel gerade jetzt? |
| [[histogramm-metrik\|Histogramm]] | zählt Messwerte in Eimern (*Buckets*) | Antwortzeiten, Dateigrößen | Wie ist die Verteilung, was ist p95? |

Den absoluten Stand eines Counters schaut man fast nie an. Spannend ist, **wie schnell** er wächst:
von 10 000 auf 10 600 in einer Minute heißt 10 Anfragen pro Sekunde. Das rechnet später die Abfrage aus.

Ein Histogramm speichert keine Einzelwerte, sondern Zähler pro Bucket, z. B. „≤ 0,1 s“, „≤ 0,5 s“,
„≤ unendlich“. Daraus lassen sich Perzentile schätzen. Eine *Summary* rechnet Perzentile schon in der
App aus – sie lässt sich aber nicht über mehrere Server zusammenfassen, deshalb nutzt man meist Histogramme.

## Warum Durchschnitte lügen

Antwortzeiten sind fast nie gleichmäßig verteilt. Ein paar sehr langsame Anfragen ziehen den
Durchschnitt nach oben – und verstecken sich trotzdem, weil der Wert „noch okay“ aussieht.

Besser sind [[perzentil|Perzentile]]: p50 (der [[median|Median]]) ist der Normalfall, p95 oder p99
zeigt die Pechvögel. Bei vielen tausend Anfragen pro Minute sind die „1 %“ bei p99 eine Menge Menschen.

| Kennzahl | Beispiel | Aussage |
|---|---|---|
| Durchschnitt | 394 ms | beschreibt niemanden |
| p50 | 105 ms | so erlebt es die Hälfte |
| p95 | 2900 ms | so schlecht ist es für jede 20. Anfrage |

> [!MERKSATZ]
> Für Dauern misst du Verteilungen, nicht Durchschnitte. Ein Histogramm plus p50/p95/p99 erzählt die
> ganze Geschichte.

## RED: Was misst du bei Diensten?

Statt wahllos Metriken zu sammeln, helfen zwei Methoden. Für alles, was **Anfragen bedient** – eine
API, einen Webserver, einen Queue-Worker – nutzt du die [[red-methode|RED-Methode]]:

| Buchstabe | Bedeutung | Metrik-Typ | Beispiel |
|---|---|---|---|
| **R**ate | Anfragen pro Sekunde | Counter | `http_requests_total` |
| **E**rrors | fehlgeschlagene Anfragen pro Sekunde | Counter mit Label `status` | `status=~"5.."` |
| **D**uration | wie lange Anfragen dauern | Histogramm | `http_request_duration_seconds` |

RED misst aus Sicht der Nutzer:innen. Ein RED-Dashboard pro Dienst ist der beste Startpunkt im Incident.

> [!PRAXIS]
> Viele Teams haben für jeden Dienst dasselbe Dashboard-Layout: oben Rate, Mitte Fehlerquote, unten p50/p95/p99.
> Wer nachts geweckt wird, muss sich nicht erst orientieren.

## USE: Was misst du bei Ressourcen?

Für **Ressourcen** – CPU, Arbeitsspeicher, Festplatte, Datenbank-Verbindungen, Worker-Prozesse –
passt die [[use-methode|USE-Methode]]:

| Buchstabe | Bedeutung | Beispiel |
|---|---|---|
| **U**tilization | Wie ausgelastet? | CPU zu 85 % belegt |
| **S**aturation | Wie viel Arbeit wartet? | 40 PHP-FPM-Anfragen in der Warteschlange |
| **E**rrors | Fehler der Ressource | Festplatte meldet I/O-Fehler |

Faustregel: **RED sagt dir, dass Nutzer:innen leiden, USE sagt dir oft, warum.** Die Fehlerquote steigt
(RED), weil alle PHP-FPM-Worker belegt sind (USE, Saturation).

> [!FEHLER]
> **Label mit unbegrenzten Werten.** `user_id`, `email` oder `request_id` als Label erzeugen Millionen
> Zeitreihen – man spricht von hoher *Kardinalität*. Das macht die Metrik-Datenbank langsam und teuer.
> Solche Details gehören in Logs und Traces, nicht in Metriken.

## Zusammenfassung

- Eine Metrik ist ein benannter Messwert über die Zeit; jede Label-Kombination ist eine eigene Zeitreihe.
- **Counter** zählen nur hoch, **Gauges** sind ein aktueller Stand, **Histogramme** zeigen Verteilungen.
- Für Dauern sind Perzentile (p50, p95, p99) ehrlicher als der Durchschnitt.
- **RED** (Rate, Errors, Duration) für Dienste, **USE** (Utilization, Saturation, Errors) für Ressourcen.
- Label nur mit wenigen, festen Werten – User- oder Request-IDs gehören nicht in Metriken.
