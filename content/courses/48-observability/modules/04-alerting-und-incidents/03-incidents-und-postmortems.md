---
title: Incidents führen und Postmortems schreiben
summary: Wie du einen Incident strukturiert durchführst – erkennen, eindämmen, kommunizieren, beheben – und danach ein schuldfreies Postmortem mit echten Folgeaufgaben schreibst.
duration: 20
sources:
  - title: Google SRE Book – Managing Incidents
    url: https://sre.google/sre-book/managing-incidents/
  - title: Google SRE Book – Postmortem Culture
    url: https://sre.google/sre-book/postmortem-culture/
  - title: Google SRE Workbook – Example Postmortem
    url: https://sre.google/workbook/postmortem-culture/
quiz:
  - type: single
    question: Der Checkout schlägt seit dem Deployment vor 10 Minuten fehl. Was ist der beste erste Schritt?
    options:
      - Die genaue Ursache im Code finden, bevor irgendetwas geändert wird.
      - Den Schaden begrenzen, z. B. das Deployment zurückrollen – die Ursache klärst du danach.
      - Ein Postmortem schreiben.
      - Abwarten, ob es sich von selbst erledigt.
    answer: 1
    explanation: Im Incident hat Eindämmen Vorrang vor Verstehen. Ein Rollback oder ein abgeschaltetes Feature-Flag stoppt den Schaden in Minuten. Die Ursachenanalyse folgt, wenn Nutzer:innen nicht mehr leiden.
  - type: match
    question: Welche Rolle übernimmt welche Aufgabe?
    pairs:
      - { left: "Incident Commander", right: "koordiniert, entscheidet, hält den Überblick" }
      - { left: "Kommunikation", right: "informiert Support, Stakeholder und die Statusseite" }
      - { left: "Operations / Fachexpert:innen", right: "untersuchen und setzen Maßnahmen um" }
    explanation: Getrennte Rollen verhindern, dass alle gleichzeitig debuggen und niemand den Überblick behält oder kommuniziert.
  - type: multiple
    question: Was gehört in ein gutes Postmortem?
    options:
      - Eine Zeitleiste mit Uhrzeiten
      - Auswirkungen auf Nutzer:innen und das Fehlerbudget
      - Der Name der Person, die den Fehler verursacht hat, als Schuldige:r
      - Folgeaufgaben mit verantwortlicher Person und Termin
    answers: [0, 1, 3]
    explanation: Postmortems sind schuldfrei. Sie fragen, welche Systeme und Abläufe den Fehler möglich gemacht haben – nicht, wer schuld ist. Folgeaufgaben ohne Verantwortliche verlaufen im Sand.
  - type: cloze
    text: Ein Postmortem, das nach Ursachen in Systemen und Abläufen statt nach Schuldigen sucht, nennt man ___ (englisch blameless).
    blanks:
      - [schuldfrei, schuldlos, blameless]
    explanation: Nur wenn niemand Strafe fürchtet, erzählen alle offen, was passiert ist. Genau diese Details braucht man, um Wiederholungen zu verhindern.
tasks:
  - id: incident-ablauf
    type: order
    title: Der Ablauf eines Incidents
    description: Bringe die Phasen eines Incidents in die richtige Reihenfolge.
    items:
      - Ein symptombasierter Alarm feuert und die Bereitschaft bestätigt ihn.
      - Die Bereitschaft erklärt einen Incident, legt die Schwere fest und übernimmt die Rolle des Incident Commanders.
      - Das Team dämmt den Schaden ein, z. B. per Rollback des letzten Deployments.
      - Support und Statusseite werden über Auswirkung und nächste Schritte informiert.
      - Die Metriken sind wieder normal – der Incident wird beendet.
      - Innerhalb weniger Tage schreibt das Team ein schuldfreies Postmortem mit Folgeaufgaben.
    hints:
      - Erst erkennen, dann eindämmen und kommunizieren, ganz am Ende lernen.
  - id: incident-entscheidungen
    type: steps
    title: Entscheidungen mitten im Incident
    description: Du bist Incident Commander. Triff die nächsten Entscheidungen.
    steps:
      - situation: 14:02 – Alarm „Checkout-Fehlerquote über 5 %“. Das Dashboard zeigt den Anstieg genau seit dem Deployment um 13:50.
        question: Was tust du zuerst?
        options:
          - Rollback auf die vorherige Version anstoßen.
          - Den Diff des Deployments Zeile für Zeile lesen.
          - Die Datenbank neu starten.
        answer: 0
        explanation: Der zeitliche Zusammenhang ist eindeutig, ein Rollback ist schnell und erprobt. Lesen kannst du den Diff, wenn der Schaden gestoppt ist.
      - situation: 14:09 – Der Rollback ist durch, die Fehlerquote sinkt auf 0,1 %. Der Support fragt im Chat, was los war.
        question: Wie reagierst du?
        options:
          - Gar nicht, du bist beschäftigt.
          - Die Kommunikationsrolle schickt ein kurzes Update – Auswirkung, Status, nächstes Update in 30 Minuten.
          - Du erklärst dem Support ausführlich den Code-Fehler.
        answer: 1
        explanation: Kurze, regelmäßige Updates in einfacher Sprache verhindern Gerüchte und Doppelarbeit. Technische Details gehören ins Postmortem.
      - situation: 15:00 – Alles stabil. Im Chat schreibt jemand „Das war doch der neue Kollege mit seinem Merge.“
        question: Wie gehst du damit um?
        options:
          - Du stimmst zu und vermerkst es im Postmortem.
          - Du weist darauf hin, dass das Postmortem schuldfrei ist, und fragst, warum Tests und Review den Fehler nicht gefunden haben.
          - Du ignorierst es.
        answer: 1
        explanation: Wenn ein einzelner Merge die Produktion lahmlegen kann, ist das ein Systemproblem – fehlende Tests, fehlender Canary, fehlende Alarme. Genau das soll das Postmortem finden.
---
Der Alarm ist da, das Dashboard rot, im Chat schreiben fünf Leute gleichzeitig. Einer debuggt, einer
startet Server neu, niemand informiert den Support. Nach zwei Stunden ist alles wieder gut – und drei
Wochen später passiert genau dasselbe. Ein Incident ist Teamarbeit unter Stress. Mit klaren Abläufen
wird daraus Routine – und mit einem guten Postmortem wird es seltener.

## Was ist ein Incident?

Ein [[incident|Incident]] ist eine ungeplante Störung, die Nutzer:innen betrifft oder bald betreffen
wird und **koordinierte** Reaktion braucht. Teams legen Schweregrade fest:

| Schwere | Beispiel | Reaktion |
|---|---|---|
| SEV1 | Checkout komplett ausgefallen | sofort, alle Rollen, Statusseite |
| SEV2 | Fehlerquote 5 % bei einer Funktion | sofort, kleines Team |
| SEV3 | einzelne Funktion langsam, Workaround vorhanden | während der Arbeitszeit |

Im Zweifel erklärst du lieber einen Incident zu viel. Ihn wieder herabzustufen kostet nichts.

## Rollen: nicht alle machen alles

| Rolle | Aufgabe |
|---|---|
| **Incident Commander** | koordiniert, verteilt Aufgaben, entscheidet – debuggt selbst **nicht** |
| **Kommunikation** | Updates an Support, Stakeholder und Statusseite in festen Abständen |
| **Operations / Fachexpert:innen** | untersuchen Dashboards, Traces, Logs und setzen Maßnahmen um |

In kleinen Teams übernimmt eine Person mehrere Rollen. Wichtig ist, dass klar ist, **wer** entscheidet.

> [!PRAXIS]
> Ein eigener Chat-Kanal pro Incident und ein angepinntes Protokoll („14:02 Alarm, 14:05 Rollback
> gestartet …“) machen später das Postmortem fast von selbst.

## Der Ablauf: erst eindämmen, dann verstehen

1. **Erkennen** – ein symptombasierter Alarm oder eine Meldung.
2. **Erklären** – Incident ausrufen, Schweregrad festlegen, Rollen verteilen.
3. **Eindämmen** – Schaden stoppen: Rollback, [[feature-flag|Feature-Flag]] aus, Last umleiten, skalieren.
4. **Kommunizieren** – kurz, regelmäßig, in einfacher Sprache: Auswirkung, Status, nächstes Update.
5. **Beheben** – die eigentliche Ursache dauerhaft beseitigen, oft erst Stunden später.
6. **Lernen** – das Postmortem.

> [!MERKSATZ]
> Im Incident gilt **Eindämmen vor Verstehen**. Ein Rollback in fünf Minuten ist besser als die perfekte
> Ursachenanalyse nach einer Stunde Ausfall.

Wie schnell das gelingt, messen Teams mit Kennzahlen wie der [[mttr|MTTR]] (*mean time to restore*) –
der durchschnittlichen Zeit bis zur Wiederherstellung.

## Das schuldfreie Postmortem

Ein [[postmortem|Postmortem]] ist ein schriftlicher Bericht nach dem Incident. Es ist
[[blameless|schuldfrei]]: Es fragt, welche Systeme und Abläufe den Fehler möglich gemacht haben – nicht,
wer schuld ist. Wer Strafe fürchtet, verschweigt Details. Genau die brauchst du.

```markdown title="postmortem-2026-10-05-checkout.md (Gliederung)"
# Postmortem: Checkout-Fehler am 05.10.2026
## Zusammenfassung      – zwei, drei Sätze
## Auswirkung           – 19 Minuten, ca. 4 % der Checkouts, 40 % des Fehlerbudgets
## Zeitleiste           – 13:50 Deployment, 14:02 Alarm, 14:05 Rollback, 14:09 stabil
## Ursachen             – Timeout-Konfiguration, fehlender Test, kein Canary
## Was gut lief         – Alarm nach 12 Minuten, Rollback geübt
## Was schlecht lief    – Trace-Sampling zu niedrig, Runbook veraltet
## Folgeaufgaben        – Aufgabe · verantwortlich · Termin
```

Für die Ursachen hilft die Frage „Warum?“ mehrmals hintereinander: Warum fiel der Checkout aus? Weil
der Timeout zu kurz war. Warum war er zu kurz? Weil die Konfiguration nicht getestet wird. Warum …?

> [!FEHLER]
> **Folgeaufgaben ohne Namen und Termin.** „Wir sollten mehr testen“ passiert nie. „Integrationstest für
> den Zahlungs-Timeout – Ada – bis 15.10.“ passiert. Verfolgt die Aufgaben wie normale Tickets.

## Zusammenfassung

- Ein **Incident** ist eine Störung, die koordinierte Reaktion braucht; Schweregrade legen das Tempo fest.
- Klare **Rollen**: Incident Commander koordiniert, Kommunikation informiert, Fachleute handeln.
- **Eindämmen vor Verstehen**: Rollback oder Feature-Flag zuerst, Ursachenanalyse danach.
- Regelmäßige, kurze Updates verhindern Chaos und Gerüchte.
- Das **Postmortem** ist schuldfrei, enthält Zeitleiste, Auswirkung, Ursachen und Folgeaufgaben mit Namen und Termin.
