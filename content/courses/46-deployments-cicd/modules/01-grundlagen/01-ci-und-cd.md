---
title: CI und CD – was steckt dahinter?
summary: Warum Teams Änderungen automatisch prüfen und ausliefern und worin sich Continuous Integration, Continuous Delivery und Continuous Deployment unterscheiden.
duration: 18
sources:
  - title: GitHub Docs – Continuous Integration
    url: https://docs.github.com/en/actions/get-started/continuous-integration
  - title: GitHub Docs – Continuous Deployment
    url: https://docs.github.com/en/actions/get-started/continuous-deployment
  - title: Martin Fowler – Continuous Integration
    url: https://martinfowler.com/articles/continuousIntegration.html
  - title: Martin Fowler – Continuous Delivery
    url: https://martinfowler.com/bliki/ContinuousDelivery.html
quiz:
  - type: match
    question: Ordne jedem Begriff die passende Beschreibung zu.
    pairs:
      - { left: "Continuous Integration", right: "Jede Änderung wird automatisch gebaut und getestet." }
      - { left: "Continuous Delivery", right: "Jeder grüne Stand ist auslieferbar, Produktion startet per Freigabe." }
      - { left: "Continuous Deployment", right: "Jeder grüne Stand geht ohne Freigabe automatisch live." }
      - { left: "Deployment", right: "Eine Version in eine Umgebung bringen, in der sie läuft." }
    explanation: >
      CI prüft, Continuous Delivery hält jeden Stand auslieferbar, Continuous Deployment liefert sogar
      ohne menschlichen Klick aus. Deployment ist der eigentliche Vorgang des Auslieferns.
  - type: single
    question: Was ist der entscheidende Unterschied zwischen Continuous Delivery und Continuous Deployment?
    options:
      - Continuous Deployment testet nicht mehr.
      - Bei Continuous Delivery gibt ein Mensch die Produktion frei, bei Continuous Deployment geht es automatisch.
      - Continuous Delivery funktioniert nur mit Docker.
      - Es gibt keinen Unterschied, beide Begriffe sind Synonyme.
    answer: 1
    explanation: >
      Beide Varianten prüfen und bauen alles automatisch. Nur der letzte Schritt in die Produktion
      unterscheidet sich: Freigabe per Klick oder vollautomatisch.
  - type: multiple
    question: Welche Probleme löst Continuous Integration?
    options:
      - Fehler fallen Minuten nach dem Push auf statt Tage später.
      - „Bei mir läuft es“ – CI prüft auf einer frischen, gleichen Maschine.
      - Code muss nie mehr reviewt werden.
      - Kleine Änderungen lassen sich leichter zusammenführen als riesige.
    answers: [0, 1, 3]
    explanation: >
      CI liefert schnelles Feedback auf einer sauberen Umgebung und fördert kleine, häufige Merges.
      Code-Reviews ersetzt sie nicht – sie ergänzt sie.
  - type: cloze
    text: Eine automatische Abfolge von Prüf- und Auslieferungsschritten heißt ___. Die Umgebung, in der echte Nutzer arbeiten, heißt ___.
    blanks:
      - [Pipeline, CI-Pipeline, Deployment-Pipeline]
      - [Produktion, Produktionsumgebung, Production]
    explanation: Die Pipeline führt Stufe für Stufe aus; ganz am Ende steht die Produktionsumgebung.
tasks:
  - id: ci-cd-zuordnen
    type: dragdrop
    title: CI, Delivery oder Deployment?
    description: >
      Drei Teams beschreiben ihren Ablauf. Ordne jede Aussage der Praxis zu, die sie beschreibt.
    targets:
      - { id: ci, label: Continuous Integration }
      - { id: delivery, label: Continuous Delivery }
      - { id: deployment, label: Continuous Deployment }
    items:
      - { label: "Bei jedem Pull Request laufen Linter und Tests.", target: ci }
      - { label: "Alle mergen mindestens täglich in main.", target: ci }
      - { label: "Staging wird automatisch aktualisiert, Produktion per Klick auf „Approve“.", target: delivery }
      - { label: "Jeder Commit auf main könnte jederzeit live gehen – wir entscheiden, wann.", target: delivery }
      - { label: "Ist main grün, läuft der neue Stand zehn Minuten später für alle Nutzer.", target: deployment }
      - { label: "Niemand klickt mehr auf einen Freigabe-Knopf.", target: deployment }
    hints:
      - Die Frage ist immer, wie weit die Automatik reicht – bis zum Test, bis zur Freigabe oder bis zur Produktion?
  - id: pipeline-beschriften
    type: diagram
    title: Beschrifte die Pipeline
    description: >
      Das Bild zeigt eine typische CI/CD-Pipeline von links nach rechts. Ziehe die Begriffe an die richtigen Stellen.
    image: /assets/deployments-cicd/ci-cd-pipeline-leer.svg
    slots:
      - { x: 25.5, y: 46, answer: "Lint & Test" }
      - { x: 43.5, y: 46, answer: Build-Artefakt }
      - { x: 61, y: 46, answer: Staging }
      - { x: 77, y: 46, answer: Freigabe }
      - { x: 92, y: 46, answer: Produktion }
    distractors: [Merge-Konflikt, Code-Review]
    hints:
      - Erst wird geprüft, dann gebaut, dann geprobt, dann freigegeben.
---

Freitag, 16 Uhr: Fünf Leute haben die ganze Woche auf eigenen Branches gearbeitet und wollen jetzt alles
zusammenführen und hochladen. Es knallt – Tests rot, Server down, das Wochenende ist gelaufen. Genau dieses
Szenario verhindern **CI** und **CD**: Änderungen werden ständig, klein und automatisch geprüft und
ausgeliefert.

## Das Problem: seltene, große Auslieferungen

Früher wurde Software in großen Paketen ausgeliefert, oft nur alle paar Wochen. Das hat drei Folgen:

- **Fehler fallen spät auf.** Zwischen Ursache und Symptom liegen Wochen und hunderte Änderungen.
- **Zusammenführen tut weh.** Je länger Branches leben, desto größer die Konflikte.
- **Ausliefern ist Handarbeit.** Jemand loggt sich per [[ssh|SSH]] ein, tippt Befehle – und vergisst einen.

Die Lösung klingt paradox: **öfter** ausliefern. Wer täglich kleine Änderungen ausliefert, hat kleine
Risiken. Damit das nicht in Arbeit ausartet, übernimmt eine Maschine die Routine.

> [!MERKSATZ]
> Was wehtut, machst du öfter – und automatisierst es, bis es nicht mehr wehtut.

## Continuous Integration

[[continuous-integration|Continuous Integration]] (CI) heißt: Alle führen ihre Arbeit häufig – mindestens
täglich – in den Haupt-[[branch]] zusammen, und **jede** Änderung wird automatisch gebaut und getestet.

Das erledigt eine [[ci-pipeline|CI-Pipeline]] auf einem Server, zum Beispiel mit
[[github-actions|GitHub Actions]]. Sie startet bei jedem Push und jedem Pull Request auf einer frischen
Maschine. Das Ergebnis erscheint als [[status-check|Status-Check]]: grün oder rot.

| Ohne CI | Mit CI |
|---|---|
| „Bei mir läuft es“ | läuft auf einer sauberen, immer gleichen Maschine |
| Fehler nach Tagen | Fehler nach Minuten |
| Tests werden vergessen | Tests laufen immer |

> [!FEHLER]
> **CI ohne Konsequenz.** Eine Pipeline, deren rote Ergebnisse niemand beachtet, ist nur Dekoration.
> Rot heißt: zuerst reparieren, dann weiterarbeiten.

## Continuous Delivery und Continuous Deployment

Das „CD“ hat zwei Bedeutungen, die gern verwechselt werden.

**[[continuous-delivery|Continuous Delivery]]** geht einen Schritt weiter als CI: Jeder grüne Stand wird
automatisch zu einem auslieferbaren Paket gebaut und landet etwa in der
[[staging-umgebung|Staging-Umgebung]]. Für die [[produktionsumgebung|Produktion]] klickt ein Mensch auf
„Freigeben“.

**[[continuous-deployment|Continuous Deployment]]** lässt auch diesen Klick weg: Ist alles grün, geht die
Änderung automatisch live.

![Eine CI/CD-Pipeline vom Push bis in die Produktion](/assets/deployments-cicd/ci-cd-pipeline.svg)

| Praxis | automatisch bis … | Wer entscheidet über Produktion? |
|---|---|---|
| Continuous Integration | Test | – |
| Continuous Delivery | Staging, auslieferbar | ein Mensch per Freigabe |
| Continuous Deployment | Produktion | die Pipeline |

## Die Deployment-Pipeline

Ein [[deployment|Deployment]] ist das Ausliefern einer Version in eine Umgebung. Die
[[deployment-pipeline|Deployment-Pipeline]] verbindet alles zu einer Kette: Push → prüfen → bauen →
Staging → Freigabe → Produktion. Jede Stufe ist ein Filter: Was durchfällt, kommt nicht weiter.

Zwei Grundsätze ziehen sich durch den ganzen Kurs:

1. **Automatisch und wiederholbar.** Ein Deployment ist ein Knopfdruck, kein Handbuch mit 20 Schritten.
2. **Jederzeit zurück.** Geht etwas schief, ist der vorige Stand in Sekunden wieder da.

> [!PRAXIS]
> In vielen Teams ist `main` geschützt: Mergen geht nur, wenn die CI grün ist. Staging bekommt jeden Merge
> automatisch, Produktion braucht eine Freigabe – das ist Continuous Delivery, das häufigste Modell.

## Zusammenfassung

- Seltene, große Auslieferungen sind riskant; häufige, kleine sind sicher.
- **CI**: Jede Änderung wird automatisch gebaut und getestet, Ergebnis als Status-Check.
- **Continuous Delivery**: Jeder grüne Stand ist auslieferbar, Produktion per Freigabe.
- **Continuous Deployment**: Grün geht ohne Klick live.
- Eine **Deployment-Pipeline** führt Stufe für Stufe aus und stoppt beim ersten Fehler.
