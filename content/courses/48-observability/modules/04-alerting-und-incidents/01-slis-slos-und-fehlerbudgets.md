---
title: SLIs, SLOs und Fehlerbudgets
summary: Wie du Zuverlässigkeit messbar machst – mit SLIs als Messgröße, SLOs als Ziel und dem Fehlerbudget als gemeinsamer Entscheidungsgrundlage für Features und Stabilität.
duration: 25
sources:
  - title: Google SRE Book – Service Level Objectives
    url: https://sre.google/sre-book/service-level-objectives/
  - title: Google SRE Workbook – Implementing SLOs
    url: https://sre.google/workbook/implementing-slos/
  - title: Google SRE Workbook – Alerting on SLOs
    url: https://sre.google/workbook/alerting-on-slos/
  - title: Grafana – Introduction to SLOs
    url: https://grafana.com/docs/grafana-cloud/alerting-and-irm/slo/introduction/
quiz:
  - type: match
    question: Ordne die Begriffe zu.
    pairs:
      - { left: "SLI", right: "Messgröße, z. B. Anteil erfolgreicher Anfragen" }
      - { left: "SLO", right: "internes Ziel, z. B. 99,9 % über 30 Tage" }
      - { left: "SLA", right: "Vertrag mit Kund:innen, oft mit Vertragsstrafe" }
      - { left: "Fehlerbudget", right: "erlaubte Unzuverlässigkeit, z. B. 0,1 % der Anfragen" }
    explanation: Das SLI misst, das SLO setzt das Ziel, das SLA ist das Versprechen nach außen. Das SLA ist meist lockerer als das SLO, damit du vor einem Vertragsbruch gewarnt wirst.
  - type: single
    question: Dein SLO ist 99,9 % Verfügbarkeit über 30 Tage. Wie viel vollständigen Ausfall darfst du dir rechnerisch leisten?
    options:
      - etwa 4,3 Minuten
      - etwa 43 Minuten
      - etwa 7,2 Stunden
      - gar keinen
    answer: 1
    explanation: 30 Tage sind 43 200 Minuten. 0,1 % davon sind 43,2 Minuten. Bei 99,99 % wären es nur noch etwa 4,3 Minuten.
  - type: cloze
    text: "In 30 Tagen gab es 2 000 000 Anfragen. Bei einem SLO von 99,9 % dürfen ___ Anfragen fehlschlagen. Sind bereits 500 fehlgeschlagen, sind noch ___ % des Budgets übrig."
    blanks:
      - ["2000", "2.000", "2 000"]
      - ["75"]
    explanation: Budget = 2 000 000 × 0,001 = 2 000. Verbraucht sind 500, also 25 % – es bleiben 75 %.
  - type: single
    question: Was bedeutet eine Burn Rate von 10?
    options:
      - Es sind 10 % des Budgets verbraucht.
      - Fehler treten zehnmal so schnell auf, wie es das SLO auf Dauer erlaubt – das 30-Tage-Budget wäre nach 3 Tagen leer.
      - Es gab 10 Fehler.
      - Der Dienst ist zu 10 % ausgelastet.
    answer: 1
    explanation: Burn Rate = aktuelle Fehlerquote ÷ erlaubte Fehlerquote. Bei 1 reicht das Budget genau bis zum Ende des Zeitraums, bei 10 nur ein Zehntel davon.
tasks:
  - id: slo-bericht
    type: terminal
    title: Einen SLO-Bericht ausrechnen
    description: |
      Im Ordner `slo-bericht` liegt `tage.json` mit den Anfragen und Fehlern (5xx) der Checkout-API für die
      ersten fünf Tage des Monats. Das SLO lautet: **99,9 %** der Anfragen sind erfolgreich.

      Erzeuge mit `jq` die Datei `bericht.json` mit genau diesen vier Feldern (Zahlen, keine Strings):

      1. `requests` – Summe aller Anfragen,
      2. `errors` – Summe aller Fehler,
      3. `availability` – Anteil erfolgreicher Anfragen, also `1 - errors / requests`,
      4. `budget_remaining` – übriger Anteil des Fehlerbudgets: `1 - errors / (requests * 0.001)`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: slo-bericht
    setup: |
      cat > tage.json <<'EOF'
      [
        { "day": "2026-10-01", "requests": 200000, "errors": 40 },
        { "day": "2026-10-02", "requests": 220000, "errors": 30 },
        { "day": "2026-10-03", "requests": 210000, "errors": 600 },
        { "day": "2026-10-04", "requests": 190000, "errors": 50 },
        { "day": "2026-10-05", "requests": 180000, "errors": 30 }
      ]
      EOF
    checks:
      - type: command
        run: jq -e . bericht.json > /dev/null
        message: bericht.json fehlt oder ist kein gültiges JSON.
      - type: command
        run: jq -r '[.requests, .errors] | map(tostring) | join(" ")' bericht.json
        stdout_equals: "1000000 750"
        message: requests oder errors stimmen nicht. Summiere mit jq 'map(.requests) | add' bzw. 'map(.errors) | add'.
      - type: command
        run: jq -e '(.availability | type) == "number" and ((.availability - 0.99925) | fabs) < 0.000001' bericht.json
        message: availability stimmt nicht – sie ist 1 - errors / requests und muss eine Zahl sein.
      - type: command
        run: jq -e '(.budget_remaining | type) == "number" and ((.budget_remaining - 0.25) | fabs) < 0.000001' bericht.json
        message: budget_remaining stimmt nicht – erlaubt sind requests * 0.001 Fehler; übrig ist 1 - errors / erlaubte Fehler.
    hints:
      - "`jq 'map(.requests) | add' tage.json` summiert alle Anfragen."
      - "Mit `as` speicherst du Zwischenwerte: `(map(.requests) | add) as $r | (map(.errors) | add) as $e | {requests: $r, …}`."
      - "Komplett: `jq '(map(.requests) | add) as $r | (map(.errors) | add) as $e | {requests: $r, errors: $e, availability: (1 - $e / $r), budget_remaining: (1 - $e / ($r * 0.001))}' tage.json > bericht.json`"
    solution: |
      ```bash
      cd slo-bericht
      jq '(map(.requests) | add) as $r
        | (map(.errors) | add) as $e
        | {requests: $r, errors: $e, availability: (1 - $e / $r), budget_remaining: (1 - $e / ($r * 0.001))}' tage.json > bericht.json
      cat bericht.json
      ```

      Ergebnis: 1 000 000 Anfragen, 750 Fehler, Verfügbarkeit 99,925 %. Nach fünf Tagen ist schon drei
      Viertel des Monatsbudgets verbraucht – fast alles am 3. Oktober. Zeit für mehr Stabilität statt neuer
      Features.
  - id: budget-rechner
    type: code
    language: js
    title: Fehlerbudget und Burn Rate berechnen
    description: |
      Schreibe zwei Funktionen:

      - `budgetMinutes(slo, days)` – wie viele Minuten vollständiger Ausfall im Zeitraum erlaubt sind.
        Beispiel: `budgetMinutes(0.999, 30)` ergibt ungefähr `43.2`.
      - `burnRate(errors, total, slo)` – aktuelle Fehlerquote geteilt durch die erlaubte Fehlerquote
        `1 - slo`. Gibt es keine Anfragen (`total` ist `0`), ist die Burn Rate `0`.
    starter: |
      function budgetMinutes(slo, days) {
      }

      function burnRate(errors, total, slo) {
      }
    tests:
      - name: 99,9 % über 30 Tage sind 43,2 Minuten
        code: assertTrue(Math.abs(budgetMinutes(0.999, 30) - 43.2) < 1e-6)
      - name: 99,99 % über 28 Tage
        code: assertTrue(Math.abs(budgetMinutes(0.9999, 28) - 4.032) < 1e-6)
      - name: Burn Rate 3
        code: assertTrue(Math.abs(burnRate(30, 10000, 0.999) - 3) < 1e-9)
      - name: keine Anfragen ergibt 0
        code: assertEqual(burnRate(0, 0, 0.999), 0)
    solution: |
      function budgetMinutes(slo, days) {
        return days * 24 * 60 * (1 - slo)
      }

      function burnRate(errors, total, slo) {
        if (total === 0) return 0
        return (errors / total) / (1 - slo)
      }
---
„Die App soll immer funktionieren“ klingt gut, ist aber kein Ziel: 100 % schafft niemand, und jeder
Versuch macht das Team langsam. Was du brauchst, ist eine **Zahl**, auf die sich Entwicklung, Betrieb
und Produkt einigen – und eine Regel, was passiert, wenn sie gerissen wird.

![Fehlerbudget über 30 Tage mit einem Incident an Tag 12](/assets/observability/error-budget.svg)

## SLI: Was misst du?

Ein [[sli|SLI]] (*Service Level Indicator*) ist eine Messgröße für Zuverlässigkeit aus Sicht der
Nutzer:innen – fast immer als **Anteil guter Ereignisse an allen Ereignissen**:

| SLI | Gute Ereignisse | Alle Ereignisse |
|---|---|---|
| Verfügbarkeit | Anfragen ohne 5xx | alle Anfragen |
| Latenz | Anfragen schneller als 300 ms | alle Anfragen |
| Frische (Queue) | Jobs innerhalb von 1 Minute verarbeitet | alle Jobs |

```text title="PromQL – Verfügbarkeits-SLI über 30 Tage"
sum(rate(http_requests_total{route="/checkout",status!~"5.."}[30d]))
  / sum(rate(http_requests_total{route="/checkout"}[30d]))
```

> [!MERKSATZ]
> Ein gutes SLI misst, was Nutzer:innen spüren – nicht, was Server spüren. „CPU unter 80 %“ ist kein SLI.

## SLO und SLA

Ein [[slo|SLO]] (*Service Level Objective*) ist das **Ziel** für ein SLI über einen Zeitraum:
„99,9 % der Checkout-Anfragen sind in 30 Tagen erfolgreich.“

Ein [[sla|SLA]] (*Service Level Agreement*) ist ein **Vertrag** mit Kund:innen, oft mit Gutschriften
bei Verstoß. Das SLA ist lockerer als das interne SLO – so merkst du Probleme, bevor es teuer wird.

| Ziel | erlaubter Ausfall pro 30 Tage |
|---|---|
| 99 % | 7,2 Stunden |
| 99,5 % | 3,6 Stunden |
| 99,9 % | 43,2 Minuten |
| 99,99 % | 4,3 Minuten |

Jede weitere „Neun“ kostet viel Aufwand. Wähle das Ziel danach, was deine Nutzer:innen brauchen.

## Das Fehlerbudget

Das [[fehlerbudget|Fehlerbudget]] ist die Kehrseite des SLOs: `1 - SLO`. Bei 99,9 % darfst du 0,1 %
der Anfragen „verbrauchen“.

```text title="Rechnung"
Anfragen im Zeitraum:   1 000 000
Fehlerbudget (0,1 %):       1 000 fehlgeschlagene Anfragen
Bisher fehlgeschlagen:        750
Budget übrig:          1 - 750 / 1 000 = 25 %
```

Das Budget macht Zuverlässigkeit zu einer **gemeinsamen Entscheidung**:

- Viel Budget übrig → das Team darf Risiken eingehen: schneller ausrollen, experimentieren.
- Budget leer → Stabilität hat Vorrang: Feature-Stopp, Fehler beheben, Tests verbessern.

> [!PRAXIS]
> Haltet diese Regeln vorher als *Error Budget Policy* fest. Dann gibt es im Ernstfall keine Diskussion,
> ob das nächste Feature noch rausgeht – die Zahl entscheidet.

## Burn Rate: wie schnell schmilzt das Budget?

Die [[burn-rate|Burn Rate]] sagt, wie schnell du das Budget gerade verbrauchst:

```text title="Burn Rate"
Burn Rate = aktuelle Fehlerquote / (1 - SLO)
```

| Burn Rate | Bedeutung bei 30 Tagen |
|---|---|
| 1 | Budget reicht genau 30 Tage |
| 6 | Budget ist nach 5 Tagen leer |
| 14,4 | 2 % des Monatsbudgets in einer Stunde – nach gut 2 Tagen leer |

Die Burn Rate ist die Grundlage für gute Alarme: Nicht „Fehlerquote über 1 %“, sondern „das Budget
schmilzt so schnell, dass jemand handeln muss“. Das schauen wir uns in der nächsten Lektion an.

> [!FEHLER]
> **Ein SLO von 100 %.** Es gibt kein Fehlerbudget, jeder Fehler ist ein Verstoß, und jedes Deployment
> wird zum Risiko. Außerdem merken Nutzer:innen den Unterschied zwischen 99,99 % und 100 % meist nicht –
> ihr eigenes WLAN ist unzuverlässiger.

## Zusammenfassung

- Ein **SLI** misst Zuverlässigkeit aus Nutzersicht: gute Ereignisse ÷ alle Ereignisse.
- Ein **SLO** ist das interne Ziel über einen Zeitraum, ein **SLA** das lockerere Versprechen nach außen.
- Das **Fehlerbudget** ist `1 - SLO` – bei 99,9 % in 30 Tagen 43,2 Minuten Ausfall oder 0,1 % der Anfragen.
- Ist das Budget leer, hat Stabilität Vorrang vor neuen Features.
- Die **Burn Rate** zeigt, wie schnell das Budget schmilzt, und ist die Basis für gute Alarme.
