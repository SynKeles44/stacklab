---
title: Warum API-Dokumentation – und warum automatisch?
summary: Wer eine API nutzt, braucht eine verlässliche Anleitung. Du lernst, warum handgeschriebene Doku veraltet und wie OpenAPI das Problem löst.
duration: 15
sources:
  - title: OpenAPI Initiative – What is OpenAPI?
    url: https://www.openapis.org/what-is-openapi
  - title: OpenAPI Specification 3.1.1
    url: https://spec.openapis.org/oas/v3.1.1.html
  - title: Learn OpenAPI – Getting Started
    url: https://learn.openapis.org/
quiz:
  - type: single
    question: Was bedeutet Dokumentations-Drift?
    options:
      - Die Dokumentation wird automatisch in andere Sprachen übersetzt.
      - Code und Dokumentation laufen nach und nach auseinander, weil die Doku bei Änderungen nicht mitgepflegt wird.
      - Die API wird auf einen anderen Server verschoben.
      - Die Dokumentation wird zu lang.
    answer: 1
    explanation: >
      Drift entsteht leise: Jemand ändert einen Endpunkt, vergisst die Doku – und ab dann beschreibt sie
      etwas, das es so nicht mehr gibt. Automatisierung verhindert genau das.
  - type: multiple
    question: Welche Aussagen über OpenAPI stimmen?
    options:
      - OpenAPI ist ein Standard, um HTTP-APIs maschinenlesbar zu beschreiben.
      - Eine OpenAPI-Datei kann in YAML oder JSON geschrieben werden.
      - OpenAPI ist eine Programmiersprache, in der man APIs implementiert.
      - Aus einer OpenAPI-Datei lassen sich Doku-Seiten, Tests und Clients erzeugen.
    answers: [0, 1, 3]
    explanation: >
      OpenAPI beschreibt eine API, es implementiert sie nicht. Weil die Beschreibung maschinenlesbar ist,
      können Werkzeuge daraus Dokumentation, Clients oder Prüfungen erzeugen.
  - type: match
    question: Ordne jedem Ansatz die passende Beschreibung zu.
    pairs:
      - { left: "Design-first", right: "Erst die Spezifikation schreiben, dann den Code bauen" }
      - { left: "Code-first", right: "Die Spezifikation aus dem vorhandenen Code erzeugen" }
      - { left: "Handgeschriebene Wiki-Seite", right: "Für Menschen lesbar, aber nicht maschinell prüfbar" }
    explanation: Beide OpenAPI-Ansätze sind verbreitet. Eine Wiki-Seite dagegen kann kein Werkzeug prüfen.
  - type: cloze
    text: Der frühere Name von OpenAPI ist ___. Die Datei, die eine API beschreibt, nennt man Spezifikation oder kurz ___.
    blanks:
      - [Swagger]
      - [Spec]
    explanation: Bis Version 2.0 hieß der Standard Swagger. Heute heißt die Spezifikation OpenAPI, „Swagger“ lebt in Werkzeugnamen wie Swagger UI weiter.
tasks:
  - id: drift-szenario
    type: steps
    title: Wie Doku veraltet – Schritt für Schritt
    description: Spiel eine typische Situation aus einem Team durch und überlege jeweils, was passiert.
    steps:
      - situation: >
          Euer Team hat eine API für Bestellungen. Die Doku ist eine Wiki-Seite, die eine Kollegin vor
          einem Jahr geschrieben hat. Heute benennt ein Entwickler das Feld `price` in `total` um und
          committet den Code.
        question: Was passiert mit der Wiki-Seite?
        options:
          - Sie aktualisiert sich automatisch.
          - Nichts – sie beschreibt weiterhin das Feld `price`.
          - Sie wird gelöscht.
        answer: 1
        explanation: Eine Wiki-Seite weiß nichts vom Code. Ohne Mensch, der daran denkt, bleibt sie alt.
      - situation: >
          Ein Frontend-Team baut eine neue Bestellansicht und liest dafür die Wiki-Seite.
        question: Was zeigt die neue Ansicht beim ersten Test?
        options:
          - Den richtigen Preis.
          - Keinen Preis, weil das Frontend nach `price` sucht, die API aber `total` liefert.
          - Eine Fehlermeldung im Code-Editor.
        answer: 1
        explanation: >
          Das Frontend vertraut der Doku. Der Fehler fällt erst zur Laufzeit auf – oft erst beim Kunden.
      - situation: >
          Das Team entscheidet: Ab jetzt wird die OpenAPI-Datei bei jedem Build aus dem Code erzeugt,
          und die CI bricht ab, wenn die eingecheckte Datei nicht zur erzeugten passt.
        question: Was passiert bei der nächsten Umbenennung?
        options:
          - Die CI meldet sofort, dass die Spezifikation neu erzeugt werden muss.
          - Gar nichts, die CI prüft nur Tests.
          - Die API wird automatisch zurückbenannt.
        answer: 0
        explanation: >
          Genau das ist der Kern dieses Kurses: Code ist die einzige Quelle der Wahrheit, die Doku wird
          daraus erzeugt und automatisch geprüft.
  - id: ansaetze-zuordnen
    type: dragdrop
    title: Design-first oder Code-first?
    description: Ordne jede Aussage dem Ansatz zu, zu dem sie am besten passt.
    targets:
      - { id: design, label: Design-first }
      - { id: code, label: Code-first }
    items:
      - { label: Die YAML-Datei entsteht vor der ersten Zeile PHP, target: design }
      - { label: Frontend und Backend einigen sich vorab auf einen Vertrag, target: design }
      - { label: PHP-Attribute an Controllern beschreiben die Endpunkte, target: code }
      - { label: Ein Werkzeug liest den Code und schreibt die openapi.yaml, target: code }
      - { label: "Mock-Server können gebaut werden, bevor es eine Implementierung gibt", target: design }
      - { label: Doku und Code liegen in derselben Datei nebeneinander, target: code }
    hints:
      - Frag dich bei jeder Aussage, was zuerst da ist – die Beschreibung oder der Code.
---
Du sollst eine fremde [[api|API]] anbinden. Welche Adresse? Welche Felder schickst du mit? Was kommt
zurück, wenn etwas schiefgeht? Ohne Anleitung probierst du stundenlang herum. Mit einer guten
[[api-dokumentation|API-Dokumentation]] weißt du es in fünf Minuten – **wenn** sie stimmt. Genau darum
geht es in diesem Kurs: Doku, die stimmt, weil sie automatisch entsteht.

## Was eine API-Dokumentation leisten muss

Eine API-Dokumentation ist die Bedienungsanleitung einer Schnittstelle. Sie beantwortet für jeden
[[endpunkt|Endpunkt]] dieselben Fragen:

| Frage | Beispiel |
|---|---|
| Welche Adresse und [[http-methode|Methode]]? | `GET /books/{id}` |
| Welche Eingaben? | Pfadparameter `id`, Header `Authorization` |
| Was kommt zurück? | `200` mit einem Buch als [[json|JSON]], `404` wenn es fehlt |
| Wie melde ich mich an? | Bearer-Token im `Authorization`-Header |

Wer die API nutzt, sind oft andere Teams: das Frontend, eine mobile App, Partnerfirmen. Sie sehen
deinen [[code|Code]] nicht. Die Doku ist das Einzige, worauf sie sich verlassen können.

> [!MERKSATZ]
> Eine API-Dokumentation ist ein **Vertrag**: Sie verspricht, wie sich die API verhält.

## Das Problem: Doku veraltet still

Die klassische Doku ist eine Wiki-Seite oder ein PDF. Am ersten Tag ist sie perfekt. Dann ändert
jemand ein Feld, fügt einen Parameter hinzu oder entfernt einen [[statuscode|Statuscode]] – und vergisst
die Wiki-Seite. Dieses Auseinanderlaufen heißt [[dokumentations-drift|Dokumentations-Drift]].

Drift ist gefährlich, weil niemand sie bemerkt:

- Der Code läuft, alle Tests sind grün.
- Die Doku sieht ordentlich aus.
- Erst wenn ein anderes Team sich auf die Doku verlässt, kracht es.

![Code und handgepflegte Doku laufen auseinander, erzeugte Doku bleibt synchron](/assets/api-dokumentation/doku-drift.svg)

> [!FEHLER]
> „Ich passe die Doku später an.“ – Später kommt selten. Jede manuelle Pflege ist eine Stelle,
> an der Drift entstehen kann.

## Die Lösung: eine maschinenlesbare Beschreibung

Die Antwort heißt [[openapi|OpenAPI]]: ein offener Standard, mit dem du eine HTTP-API in einer
[[yaml|YAML]]- oder JSON-Datei beschreibst. Diese Datei nennt man [[api-spezifikation|Spezifikation]],
kurz „Spec“. Bis Version 2.0 hieß der Standard [[swagger|Swagger]].

Weil die Datei maschinenlesbar ist, können Werkzeuge damit arbeiten:

- **Anzeigen:** Swagger UI, Redoc oder Scalar machen daraus eine schöne Doku-Seite.
- **Prüfen:** Ein [[linter|Linter]] wie Redocly CLI findet Fehler und Lücken.
- **Erzeugen:** Aus der Datei entstehen API-Clients, Postman-Collections oder Mock-Server.

```yaml title="Ein Endpunkt in OpenAPI – du lernst das gleich Zeile für Zeile"
paths:
  /books/{id}:
    get:
      summary: Ein Buch laden
      responses:
        '200':
          description: Das gefundene Buch
```

## Zwei Wege zur Spezifikation

Es gibt zwei Ansätze, wie die OpenAPI-Datei entsteht:

| | [[design-first|Design-first]] | [[code-first|Code-first]] |
|---|---|---|
| Reihenfolge | Erst die Spec, dann der Code | Erst der Code, die Spec wird erzeugt |
| Quelle der Wahrheit | Die YAML-Datei | Der Code mit seinen Attributen |
| Stärke | Teams einigen sich früh auf einen Vertrag | Doku kann kaum veralten |
| Werkzeuge | Editor, Redocly, Mock-Server | swagger-php, Scramble, Scribe |

Beide sind legitim. In vielen PHP-Projekten wird Code-first genutzt: Die Endpunkte werden mit
[[php-attribut|PHP-Attributen]] beschrieben, ein Werkzeug erzeugt daraus die Spec, und die
[[ci-pipeline|CI-Pipeline]] prüft sie bei jedem Push.

> [!PRAXIS]
> In größeren Teams liegt die erzeugte `openapi.yaml` im Repository. So sieht jeder Pull Request
> sofort, wie sich die API ändert – ein `diff` der Spezifikation ist ein ehrliches Änderungsprotokoll.

## Dein Weg durch den Kurs

1. **OpenAPI verstehen:** Aufbau, Parameter, Bodies, Antworten.
2. **Schreiben und prüfen:** Schemas, `$ref`, Authentifizierung, Linting mit Redocly, Doku-Ansichten.
3. **Aus Code erzeugen:** swagger-php mit Attributen, Scramble und Scribe für Laravel.
4. **Automatisieren:** Versionen trennen, CI-Prüfung, Clients und Collections erzeugen.

Wir verwenden **OpenAPI 3.1** – die Version, die heute fast alle Werkzeuge unterstützen. Die neuere
Version 3.2 ist erschienen, wird aber noch nicht überall unterstützt
([Spezifikation](https://spec.openapis.org/oas/latest.html)).

## Zusammenfassung

- API-Dokumentation ist ein **Vertrag** zwischen deiner API und allen, die sie nutzen.
- Handgepflegte Doku veraltet unbemerkt – das nennt man **Dokumentations-Drift**.
- **OpenAPI** beschreibt HTTP-APIs maschinenlesbar in YAML oder JSON (früher: Swagger).
- Werkzeuge erzeugen aus der Spec Doku-Seiten, Clients und Prüfungen.
- **Design-first** startet mit der Spec, **Code-first** erzeugt sie aus dem Code.
- Automatisierung heißt: erzeugen, prüfen, und bei Abweichungen die CI rot werden lassen.
