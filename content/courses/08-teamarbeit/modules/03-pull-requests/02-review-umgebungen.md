---
title: Review-Umgebungen und automatische Checks
summary: Wie CI-Pipelines jeden Pull Request prüfen, wie Review-Umgebungen pro PR funktionieren und wie du Reviewer:innen auch per API anforderst.
duration: 20
sources:
  - title: GitHub Docs – About status checks
    url: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks
  - title: GitHub Docs – About continuous integration with GitHub Actions
    url: https://docs.github.com/en/actions/get-started/continuous-integration
  - title: GitHub REST API – Review requests
    url: https://docs.github.com/en/rest/pulls/review-requests
quiz:
  - type: single
    question: Was ist eine Review-Umgebung?
    options:
      - Eine eigene, vorübergehende Installation der Anwendung mit genau dem Stand eines Pull Requests
      - Der Bildschirm, auf dem man Code-Reviews liest
      - Die Produktionsumgebung, auf die alle Pull Requests gleichzeitig ausgeliefert werden
    answer: 0
    explanation: Jeder Pull Request bekommt eine eigene, kurzlebige Umgebung mit eigener Adresse. Dort kann das Team die Änderung ausprobieren.
  - type: multiple
    question: Welche Daten gehören in eine Review-Umgebung? (mehrere Antworten)
    options:
      - Erfundene Testdaten
      - Eine Kopie der echten Kundendatenbank
      - Anonymisierte Beispieldaten aus einem Seeder
      - Produktions-Zugangsschlüssel für Zahlungen
    answers: [0, 2]
    explanation: Review-Umgebungen sind weniger geschützt als die Produktion. Echte Kundendaten und Produktionsschlüssel haben dort nichts zu suchen.
  - type: match
    question: Welcher Status-Check meldet was?
    pairs:
      - { left: "lint", right: "Code hält die Stil- und Qualitätsregeln ein" }
      - { left: "tests", right: "Alle automatischen Tests sind grün" }
      - { left: "build", right: "Die Anwendung lässt sich bauen" }
      - { left: "preview", right: "Die Review-Umgebung wurde bereitgestellt" }
    explanation: Jeder Schritt der Pipeline erscheint als eigener Status-Check im Pull Request.
  - type: cloze
    text: Reviewer:innen forderst du über die GitHub-API mit einer ___-Anfrage an den Pfad `/repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers` an.
    blanks:
      - [POST]
    explanation: POST legt die Review-Anfrage an. Mit DELETE auf denselben Pfad nimmst du sie zurück.
tasks:
  - id: reviewer-anfordern
    type: request
    title: Reviewer per API anfordern
    description: |
      Euer Team automatisiert Abläufe mit der GitHub-REST-API. Fordere für den Pull Request **42** im
      Repository `example-org/shop` den Reviewer `ben` an.

      - Methode und Pfad: siehe Lektion (`…/pulls/42/requested_reviewers`)
      - Header: `Accept: application/vnd.github+json` und `Authorization: Bearer <dein-token>`
      - Body (JSON): eine Liste `reviewers` mit dem Benutzernamen
    base_url: https://api.github.com
    expected:
      method: POST
      path: "^/repos/example-org/shop/pulls/42/requested_reviewers$"
      headers:
        Accept: "application/vnd\\.github\\+json"
        Authorization: "^Bearer .+"
      body_contains: ['"reviewers"', '"ben"']
    response:
      status: 201
      body: '{"number": 42, "title": "feat(SHOP-123): add wishlist button", "requested_reviewers": [{"login": "ben"}]}'
    hints:
      - "Der Pfad beginnt mit `/repos/example-org/shop/pulls/42/`."
      - "Der Body lautet `{\"reviewers\": [\"ben\"]}`."
    solution: |
      ```http
      POST /repos/example-org/shop/pulls/42/requested_reviewers
      Accept: application/vnd.github+json
      Authorization: Bearer <dein-token>
      Content-Type: application/json

      {"reviewers": ["ben"]}
      ```
  - id: pipeline-ablauf
    type: steps
    title: Was passiert als Nächstes?
    description: Verfolge einen Pull Request durch die automatische Pipeline.
    steps:
      - situation: Du pushst deinen Branch und öffnest einen Pull Request.
        question: Was startet automatisch?
        options:
          - Die CI-Pipeline mit Linter, Tests und Build
          - Die Auslieferung auf die Produktion
          - Nichts, bis jemand auf Approve klickt
        answer: 0
        explanation: Jeder Push in einen Pull Request löst die Pipeline aus. Ihre Ergebnisse erscheinen als Status-Checks.
      - situation: Linter und Tests sind grün, der Build ist fertig.
        question: Was passiert mit dem gebauten Stand?
        options:
          - Er wird in eine eigene Review-Umgebung ausgeliefert, deren Link im PR erscheint
          - Er wird gelöscht
          - Er ersetzt sofort die Produktion
        answer: 0
        explanation: Die Review-Umgebung macht die Änderung für das ganze Team ausprobierbar – auch ohne lokales Setup.
      - situation: Die Produktmanagerin klickt sich durch die Review-Umgebung und findet einen falschen Text.
        question: Wie geht es weiter?
        options:
          - Du korrigierst den Text, pushst – Pipeline und Review-Umgebung aktualisieren sich
          - Du öffnest einen neuen Pull Request für den Text
          - Sie korrigiert ihn direkt auf dem Server
        answer: 0
        explanation: Jeder neue Push aktualisiert dieselbe Review-Umgebung.
      - situation: Der Pull Request wird gemergt.
        question: Was passiert mit der Review-Umgebung?
        options:
          - Sie wird automatisch abgebaut
          - Sie läuft für immer weiter
          - Sie wird zur neuen Produktion
        answer: 0
        explanation: Review-Umgebungen sind kurzlebig. Nach Merge oder Schließen werden sie abgebaut, um Kosten zu sparen.
---

„Funktioniert bei mir.“ – Diesen Satz hört man in Teams ohne Automatik ständig. Die Reviewerin muss den
Branch auschecken, Abhängigkeiten installieren, die Datenbank vorbereiten, nur um eine Änderung kurz
anzuschauen. Moderne Teams lassen das eine Maschine erledigen: Jeder Pull Request wird automatisch geprüft
und bekommt seine eigene, klickbare Umgebung.

## Die CI-Pipeline prüft jeden Pull Request

Eine [[ci-pipeline|CI-Pipeline]] ist eine Folge automatischer Schritte, die bei jedem Push läuft. Sie
gehört zur [[continuous-integration|Continuous Integration]]. Typische Schritte:

| Schritt | Prüft |
|---|---|
| `lint` | Stil- und Qualitätsregeln |
| `tests` | automatische Tests |
| `build` | ob sich die Anwendung bauen lässt |
| `preview` | ob die Review-Umgebung bereitsteht |

Jeder Schritt erscheint im Pull Request als [[status-check|Status-Check]] mit grünem Haken oder rotem
Kreuz. Mit einer Branch-Schutzregel kann das Team festlegen, dass nur mit grünen Checks gemergt werden darf.

> [!MERKSATZ]
> Was eine Maschine prüfen kann, prüft eine Maschine. Menschen kümmern sich im Review um den Rest.

## Review-Umgebungen pro Pull Request

Eine [[review-umgebung|Review-Umgebung]] (auch *Preview* oder *Deploy Preview*) ist eine eigene,
vorübergehende Installation der Anwendung – mit genau dem Stand eines Pull Requests. Sie hat eine eigene
Adresse, zum Beispiel `https://pr-42.preview.example.com`.

Der Ablauf ist fast immer gleich:

1. Pull Request wird geöffnet oder aktualisiert.
2. Die Pipeline baut die Anwendung.
3. Ein [[deployment|Deployment]] liefert den Stand in eine eigene Umgebung aus.
4. Ein Bot schreibt den Link in den Pull Request.
5. Nach Merge oder Schließen wird die Umgebung automatisch abgebaut.

Technisch steckt dahinter meist ein Container pro Pull Request und eine eigene, kleine Datenbank. Die Pipeline kennt die Nummer des Pull Requests und baut daraus Adresse und Namen der Umgebung. Der große Gewinn: Auch Menschen ohne Entwicklungsumgebung können mitreden. Produktmanagement, Design
oder Support klicken auf den Link und probieren die Änderung aus, bevor sie live geht.

## Daten und Kosten

Review-Umgebungen brauchen Daten. Dafür gilt eine klare Regel: **niemals echte Kundendaten**. Preview-
Umgebungen sind weniger geschützt, oft für viele Personen erreichbar und kurzlebig. Stattdessen füllt ein
Seeder die Datenbank mit erfundenen Beispieldaten.

Auch Zugangsschlüssel für Zahlungsdienste oder E-Mail-Versand müssen Test-Schlüssel sein. Sonst verschickt
die Review-Umgebung womöglich echte E-Mails an echte Menschen.

> [!FEHLER]
> **Review-Umgebungen nicht abbauen.** Jede laufende Umgebung kostet Geld. Wer das automatische Aufräumen
> vergisst, bezahlt nach ein paar Wochen für hunderte vergessene Server.

## Reviewer:innen anfordern – auch per API

Wer reviewt, legst du im Pull Request unter „Reviewers“ fest. Viele Teams automatisieren das, etwa mit
einer `CODEOWNERS`-Datei oder einem Skript über die [[api|API]] von GitHub:

```bash title="Reviewer per GitHub-REST-API anfordern"
curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer <dein-token>" \
  https://api.github.com/repos/example-org/shop/pulls/42/requested_reviewers \
  -d '{"reviewers": ["ben"]}'
```

Bei Erfolg antwortet GitHub mit Status `201` und dem aktualisierten Pull Request als [[json|JSON]].

> [!PRAXIS]
> In vielen Teams ist der Link zur Review-Umgebung das Erste, was Reviewer:innen öffnen. Sie probieren
> die Änderung aus wie eine Nutzerin – und lesen erst danach den Code.

## Zusammenfassung

- Eine CI-Pipeline prüft jeden Push automatisch: Linter, Tests, Build.
- Ergebnisse erscheinen als Status-Checks; Branch-Schutz kann grüne Checks verlangen.
- Eine Review-Umgebung ist eine kurzlebige Installation pro Pull Request mit eigener Adresse.
- In Review-Umgebungen gehören nur Testdaten und Test-Schlüssel.
- Reviewer:innen forderst du in der Oberfläche oder per `POST …/requested_reviewers` an.
