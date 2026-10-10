---
title: Deployment-Strategien
summary: Recreate, Rolling, Blue-Green, Canary und Feature-Flags – wie sie funktionieren, was sie kosten und wann du welche Strategie wählst.
duration: 22
sources:
  - title: Kubernetes – Deployments, Rolling Update
    url: https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#rolling-update-deployment
  - title: Martin Fowler – Blue Green Deployment
    url: https://martinfowler.com/bliki/BlueGreenDeployment.html
  - title: Martin Fowler – Canary Release
    url: https://martinfowler.com/bliki/CanaryRelease.html
  - title: Martin Fowler – Feature Toggles
    url: https://martinfowler.com/articles/feature-toggles.html
  - title: Laravel Docs – Pennant
    url: https://laravel.com/docs/13.x/pennant
quiz:
  - type: match
    question: Ordne jede Strategie ihrer Kernidee zu.
    pairs:
      - { left: "Recreate", right: "alles stoppen, neue Version starten" }
      - { left: "Rolling", right: "Server für Server austauschen" }
      - { left: "Blue-Green", right: "zweite komplette Umgebung, Router schaltet um" }
      - { left: "Canary", right: "erst ein kleiner Teil des Verkehrs auf die neue Version" }
      - { left: "Feature-Flag", right: "Code ist ausgeliefert, Funktion wird separat eingeschaltet" }
    explanation: Alle fünf lösen dasselbe Problem – unterschiedlich viel Risiko, Aufwand und Infrastruktur.
  - type: single
    question: Welche Strategie bietet den schnellsten Rollback der kompletten Anwendung?
    options:
      - Recreate
      - Rolling
      - Blue-Green
      - Gar keine, Rollbacks dauern immer gleich lang.
    answer: 2
    explanation: >
      Bei Blue-Green läuft die alte Umgebung noch. Der Router schaltet in Sekunden zurück – ohne neues Deployment.
  - type: multiple
    question: Was gilt für alle Strategien, bei denen alte und neue Version gleichzeitig laufen (Rolling, Canary, Blue-Green während der Umschaltung)?
    options:
      - Beide Versionen müssen mit demselben Datenbank-Schema funktionieren.
      - Eine neue Version darf eine Spalte löschen, die die alte noch liest.
      - Health-Checks entscheiden, ob eine neue Instanz Verkehr bekommt.
      - Sessions und Caches müssen von beiden Versionen gelesen werden können.
    answers: [0, 2, 3]
    explanation: >
      Gleichzeitig laufende Versionen teilen sich Datenbank, Sessions und Caches. Wer etwas löscht, das die alte
      Version noch braucht, legt sie lahm – mehr dazu im nächsten Modul.
  - type: cloze
    text: Eine Strategie, bei der zunächst nur etwa 5 Prozent der Nutzer die neue Version bekommen, heißt ___-Release. Den Endpunkt, über den der Load Balancer prüft, ob eine Instanz gesund ist, nennt man ___.
    blanks:
      - [Canary]
      - [Health-Check, Healthcheck, Health Check]
    explanation: Der Kanarienvogel warnte früher Bergleute vor Gas – die kleine Nutzergruppe warnt dich vor Fehlern.
tasks:
  - id: strategie-zuordnen
    type: dragdrop
    title: Welche Strategie passt?
    description: Ordne jede Situation der Strategie zu, die am besten passt.
    targets:
      - { id: recreate, label: Recreate }
      - { id: rolling, label: Rolling }
      - { id: bluegreen, label: Blue-Green }
      - { id: canary, label: Canary }
      - { id: flag, label: Feature-Flag }
    items:
      - { label: "Internes Tool, nachts darf es zwei Minuten weg sein", target: recreate }
      - { label: "Zehn gleiche Container hinter einem Load Balancer, kein Geld für doppelte Infrastruktur", target: rolling }
      - { label: "Rollback muss in Sekunden gehen, zweite Umgebung ist bezahlbar", target: bluegreen }
      - { label: "Neue Suchmaschine – erst messen, ob Fehlerquote und Antwortzeit stimmen", target: canary }
      - { label: "Neuer Checkout ist fertig, Marketing schaltet ihn erst zum Kampagnenstart frei", target: flag }
    hints:
      - Achte auf die Schlüsselwörter Ausfall erlaubt, Kosten, Rollback-Geschwindigkeit, Messen und Zeitpunkt.
  - id: canary-ablauf
    type: steps
    title: Ein Canary-Release begleiten
    description: Du lieferst Version 2.0 des Shops per Canary aus. Entscheide in jedem Schritt.
    steps:
      - situation: >
          v2.0 läuft auf einer Instanz, der Router schickt 5 Prozent des Verkehrs dorthin. Nach 15 Minuten liegt die
          Fehlerquote bei v2.0 bei 0,1 Prozent, bei v1.9 ebenfalls.
        question: Was tust du?
        options:
          - Auf 25 Prozent erhöhen und weiter beobachten.
          - Sofort auf 100 Prozent gehen.
          - Abbrechen, 0,1 Prozent sind zu viel.
        answer: 0
        explanation: Gleiche Fehlerquote wie die alte Version – du erhöhst schrittweise und misst weiter.
      - situation: >
          Bei 25 Prozent steigt die Antwortzeit von v2.0 auf das Dreifache, Nutzer brechen den Checkout ab.
        question: Was ist der richtige Schritt?
        options:
          - Abwarten, das legt sich sicher.
          - Den Canary-Anteil auf 0 Prozent setzen, alle Nutzer zurück auf v1.9 und die Ursache suchen.
          - Die Datenbank neu starten.
        answer: 1
        explanation: >
          Genau dafür gibt es Canary: Nur ein Viertel der Nutzer war betroffen, und der Rückweg ist ein Schalter.
      - situation: >
          Der Fehler ist behoben, v2.0.1 läuft bei 5, 25, 50 und schließlich 100 Prozent stabil.
        question: Was passiert mit den alten v1.9-Instanzen?
        options:
          - Sie laufen für immer weiter.
          - Sie werden abgebaut, sobald v2.0.1 eine Weile stabil läuft.
        answer: 1
        explanation: Nach einer Beobachtungszeit räumst du die alte Version ab – bis dahin bleibt sie dein Rückweg.
---

Ein Deployment ist ein Moment, in dem sich viel ändert: Code, manchmal Datenbank, oft Konfiguration. Die
Frage ist nicht, **ob** dabei einmal etwas schiefgeht, sondern **wie viele** Nutzer es merken und **wie
schnell** du zurückkommst. Darauf geben Deployment-Strategien unterschiedliche Antworten.

## Recreate und Rolling

Die einfachste Strategie heißt [[recreate-deployment|Recreate]]: alte Version stoppen, neue starten.
Dazwischen ist die Anwendung weg. Für ein internes Tool am Wochenende ist das in Ordnung, für einen Shop nicht.

Beim [[rolling-deployment|Rolling Deployment]] laufen mehrere Instanzen hinter einem
[[load-balancer|Load Balancer]]. Sie werden **nacheinander** ausgetauscht: eine aus dem Verkehr nehmen,
aktualisieren, prüfen, wieder rein – dann die nächste.

![Rolling, Blue-Green, Canary und Feature-Flag im Vergleich](/assets/deployments-cicd/deployment-strategien.svg)

Ob eine neue Instanz Verkehr bekommen darf, entscheidet ein [[health-endpunkt|Health-Check]]: ein Endpunkt
wie `/up`, den der Load Balancer regelmäßig abfragt. Antwortet er nicht mit `200`, bleibt die Instanz draußen.
Laravel bringt diesen Endpunkt standardmäßig mit.

> [!MERKSATZ]
> Während eines Rolling Deployments laufen alte und neue Version **gleichzeitig**. Beide müssen mit
> derselben Datenbank und denselben Sessions zurechtkommen.

## Blue-Green

Beim [[blue-green-deployment|Blue-Green-Deployment]] gibt es zwei komplette Umgebungen. „Blue“ bedient die
Nutzer, „Green“ bekommt in Ruhe die neue Version und wird getestet. Dann schaltet der Router alles auf einmal
um.

| Vorteil | Nachteil |
|---|---|
| Umschalten in einem Schritt | doppelte Infrastruktur |
| Rollback in Sekunden: zurückschalten | die Datenbank teilen sich meist beide |
| neue Version vorher unter echten Bedingungen prüfbar | Sessions und Caches müssen übertragbar sein |

Das Prinzip kennst du gleich im Kleinen: Ein Symlink, der von einem Release-Ordner auf den nächsten umspringt,
ist Blue-Green auf einem einzigen Server.

## Canary

Ein [[canary-release|Canary-Release]] schickt zunächst nur einen kleinen Teil des Verkehrs – etwa 5 Prozent –
auf die neue Version. Dann misst du: Fehlerquote, Antwortzeit, Abbrüche. Sind die Werte gut, erhöhst du
schrittweise auf 25, 50 und 100 Prozent. Sind sie schlecht, gehst du zurück auf 0.

Canary braucht zweierlei: einen Router, der Verkehr nach Anteilen verteilen kann, und Monitoring, das
beide Versionen getrennt auswertet. Ohne Messwerte ist Canary nur ein langsames Rolling.

> [!FEHLER]
> **Canary ohne Abbruchkriterium.** Lege **vorher** fest, ab welchen Werten du abbrichst, zum Beispiel
> „Fehlerquote über 1 Prozent oder Antwortzeit doppelt so hoch“. Wer erst im Ernstfall diskutiert, wartet zu lange.

## Feature-Flags: Deployment und Freischaltung trennen

Alle bisherigen Strategien tauschen Code aus. Ein [[feature-flag|Feature-Flag]] geht einen anderen Weg:
Der neue Code wird ausgeliefert, bleibt aber **ausgeschaltet**, bis du ihn freigibst – für alle, für ein Team
oder für 10 Prozent der Nutzer.

```php title="Feature-Flag mit Laravel Pennant"
use Laravel\Pennant\Feature;

if (Feature::active('new-checkout')) {
    return $this->newCheckout($cart);
}

return $this->legacyCheckout($cart);
```

So wird das Deployment langweilig und risikoarm, und die eigentliche Freischaltung ist ein Schalter ohne
neues Deployment. Der Preis: Alte Flags müssen nach der Einführung wieder entfernt werden, sonst wächst
der Code zu einem Dickicht aus `if`-Abfragen.

> [!PRAXIS]
> Viele Teams kombinieren: Rolling oder Blue-Green für das Deployment selbst, Feature-Flags für große neue
> Funktionen. Kubernetes macht Rolling Updates zum Standard; Canary-Verteilung übernehmen dort Ingress-Controller
> oder ein Service-Mesh.

## Zusammenfassung

- **Recreate**: einfach, aber mit Ausfallzeit.
- **Rolling**: Instanz für Instanz, gesteuert über Health-Checks – alte und neue Version laufen gleichzeitig.
- **Blue-Green**: zwei Umgebungen, Umschalten und Rollback in Sekunden, doppelte Kosten.
- **Canary**: erst wenige Nutzer, messen, schrittweise erhöhen – braucht Monitoring und Abbruchkriterien.
- **Feature-Flags** trennen Deployment und Freischaltung; alte Flags musst du aufräumen.
