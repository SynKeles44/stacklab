---
title: Das passende Hosting wählen
summary: VPS, Managed Server oder Plattform – was du jeweils selbst erledigst, was es kostet und wie du dich begründet entscheidest.
duration: 20
sources:
  - title: Laravel 13 – Deployment
    url: https://laravel.com/docs/13.x/deployment
  - title: The Twelve-Factor App
    url: https://12factor.net/de/
  - title: Ubuntu Server – Dokumentation
    url: https://documentation.ubuntu.com/server/
quiz:
  - type: single
    question: Was unterscheidet einen VPS am deutlichsten von einer Plattform (PaaS)?
    options:
      - Ein VPS ist immer schneller.
      - Beim VPS bekommst du ein eigenes Betriebssystem mit root-Rechten und kümmerst dich selbst um Updates, Webserver und Prozesse.
      - Auf einem VPS kann man kein PHP ausführen.
      - Eine Plattform hat keine Datenbank.
    answer: 1
    explanation: >
      Ein VPS ist ein virtueller Rechner, den du komplett selbst verwaltest. Eine Plattform nimmt dir
      Betriebssystem, Webserver und Prozessverwaltung ab – du lieferst nur Code oder ein Container-Image.
  - type: multiple
    question: Welche Kosten vergisst man bei einem günstigen VPS leicht?
    options:
      - Deine Arbeitszeit für Updates, Härtung und Fehlersuche
      - Backup-Speicher außerhalb des Servers
      - Den Preis für den Quellcode von Laravel
      - Snapshots und zusätzliche öffentliche IPv4-Adressen
    answers: [0, 1, 3]
    explanation: >
      Laravel ist kostenlos. Der Monatspreis eines VPS ist nur ein Teil der Rechnung – Zeit, externer
      Backup-Speicher und Extras wie Snapshots oder IPv4-Adressen kommen dazu.
  - type: match
    question: Ordne jedem Hosting-Modell zu, wer das Betriebssystem aktualisiert.
    pairs:
      - { left: "VPS", right: "du selbst" }
      - { left: "Managed Server", right: "der Hosting-Anbieter" }
      - { left: "Plattform (PaaS)", right: "die Plattform, du merkst davon nichts" }
    explanation: Genau diese Frage – wer patcht das Betriebssystem? – trennt die drei Modelle am klarsten.
  - type: cloze
    text: "Wenn du ohne großen Umbau nicht mehr zu einem anderen Anbieter wechseln kannst, spricht man von ___."
    blanks:
      - [Vendor-Lock-in, Vendor Lock-in, Lock-in]
    explanation: Je mehr anbieterspezifische Funktionen du nutzt, desto teurer wird ein späterer Wechsel.
tasks:
  - id: modell-zuordnen
    type: dragdrop
    title: Welches Hosting passt?
    description: >
      Fünf Teams beschreiben ihre Lage. Ordne jedes Team dem Hosting-Modell zu, das am besten passt.
    targets:
      - { id: vps, label: VPS }
      - { id: managed, label: Managed Server }
      - { id: paas, label: Plattform (PaaS) }
    items:
      - { label: "Du willst Linux-Administration lernen und jeden Handgriff selbst verstehen.", target: vps }
      - { label: "Eine Agentur ohne eigene Admins braucht einen klassischen Server, auf dem Updates jemand anderes einspielt.", target: managed }
      - { label: "Ein Start-up will nur `git push` machen und sich nie um Server kümmern.", target: paas }
      - { label: "Du brauchst eine spezielle Software, die du selbst kompilieren und als Dienst betreiben musst.", target: vps }
      - { label: "Die Last schwankt stark und die App soll automatisch mehr Instanzen bekommen.", target: paas }
    hints:
      - "Frag dich jeweils: Wer soll sich um das Betriebssystem kümmern?"
  - id: kosten-abwaegen
    type: steps
    title: Eine Entscheidung durchrechnen
    description: Spiel eine typische Entscheidung durch – von der ersten Idee bis zum Monatsbudget.
    steps:
      - situation: >
          Du stellst einen kleinen Online-Shop mit Laravel live. Es gibt eine Datenbank, einen Queue-Worker
          für Bestellmails und einen nächtlichen Export per Scheduler. Du kannst SSH und Linux-Grundlagen.
        question: Welches Modell ist für den Anfang realistisch?
        options:
          - Ein Cluster mit fünf Servern und Load Balancer
          - Ein einzelner VPS oder Managed Server, auf dem App, Worker, Scheduler und Datenbank laufen
          - Ein Static-Hosting-Dienst für HTML-Dateien
        answer: 1
        explanation: >
          Für eine kleine App reicht ein einzelner Server völlig. Static Hosting kann kein PHP ausführen,
          und ein Cluster wäre teuer und kompliziert, ohne dass es nötig ist.
      - situation: >
          Ein VPS kostet im Beispiel 8 € im Monat, eine vergleichbare Plattform mit Datenbank 35 €. Du schätzt,
          dass du für Updates und Pflege des VPS etwa zwei Stunden im Monat brauchst.
        question: Wie vergleichst du die Angebote fair?
        options:
          - Nur die Monatspreise vergleichen – 8 € ist günstiger.
          - Deine Arbeitszeit, Backups und Extras mitrechnen und dann entscheiden, was dir die Zeit wert ist.
          - Immer das teuerste Angebot nehmen, weil es sicherer ist.
        answer: 1
        explanation: >
          Die Gesamtkosten (englisch „total cost of ownership“) enthalten auch deine Zeit. Zwei Stunden
          Pflege im Monat können teurer sein als der Preisunterschied – oder eine gute Lerninvestition.
      - situation: Du entscheidest dich für einen VPS. Bei der Bestellung fragt das Formular nach dem Standort des Rechenzentrums.
        question: Wonach wählst du ihn?
        options:
          - Möglichst nah an deinen Nutzer:innen und passend zu den Datenschutz-Anforderungen deiner Kundschaft
          - Möglichst weit weg, damit Angreifer ihn nicht finden
          - Egal, das hat keine Auswirkung
        answer: 0
        explanation: >
          Nähe senkt die Latenz. Und wenn du personenbezogene Daten verarbeitest, musst du prüfen, wo sie
          gespeichert werden dürfen und ob du einen Vertrag zur Auftragsverarbeitung brauchst.
---
Deine App läuft auf `localhost:8000`, die Tests sind grün, die erste Kundin wartet. Jetzt brauchst du einen
Rechner, der rund um die Uhr erreichbar ist. Die erste Entscheidung ist gleichzeitig die folgenreichste:
**Wo** läuft deine App – und **wie viel** davon verwaltest du selbst?

## Drei Modelle, eine Frage

[[hosting|Hosting]] heißt: Jemand stellt Rechner, Strom und Internetanbindung bereit. Die Modelle
unterscheiden sich darin, wo die Verantwortung des Anbieters endet und deine beginnt.

| Modell | Was du bekommst | Was du selbst machst |
|---|---|---|
| [[vps\|VPS]] (Virtual Private Server) | einen virtuellen Rechner mit root-Zugang | alles ab dem [[betriebssystem\|Betriebssystem]]: Updates, Firewall, Webserver, PHP, Deploy |
| [[managed-hosting\|Managed Server]] | einen Server, den der Anbieter pflegt | deinen Code, das Deployment, oft Worker und Cron |
| [[paas\|Plattform (PaaS)]] | eine Umgebung, die Code oder Container-Images entgegennimmt | Code, Konfiguration, Datenbank-Migrationen |

Daneben gibt es **Shared Hosting** (viele Kund:innen teilen einen Webserver) – für eine Laravel-App mit
Queue-Worker meist zu eingeschränkt – und große Cloud-Anbieter, die alle drei Modelle als Bausteine anbieten.

![Wer kümmert sich um was – VPS, Managed Server und PaaS im Vergleich](/assets/projekt-live-stellen/hosting-verantwortung.svg)

> [!MERKSATZ]
> Die wichtigste Frage beim Hosting lautet: **Wer spielt die Sicherheitsupdates des Betriebssystems ein?**

## Der VPS: volle Kontrolle, volle Verantwortung

Ein VPS ist ein Stück eines großen physischen Rechners, das sich wie ein eigener [[server|Server]]
verhält. Du bekommst eine öffentliche [[ip-adresse|IP-Adresse]] wie `203.0.113.10`, meldest dich per
[[ssh|SSH]] an und installierst, was du willst.

**Vorteile:**

- Günstig: kleine VPS mit 2 CPU-Kernen und 4 GB RAM kosten typischerweise einstellige bis niedrige
  zweistellige Eurobeträge pro Monat.
- Volle Kontrolle über jede Einstellung und jede Version.
- Du lernst, wie ein Server wirklich funktioniert.

**Nachteile:**

- Jede Sicherheitslücke im System ist dein Problem.
- Backups, Überwachung und Ausfallsicherheit musst du selbst bauen.
- Fällt der Rechner nachts aus, klingelt bei niemandem außer dir das Telefon.

Dieser Kurs nimmt den VPS als Beispiel, weil du dabei jeden Baustein siehst. Was du hier lernst, hilft dir
auch auf jeder Plattform, denn dort passiert dasselbe – nur automatisch.

## Managed Server und Plattformen

Beim **Managed Server** pflegt der Anbieter Betriebssystem, Webserver und PHP-Versionen. Du deployst
weiterhin selbst, oft per SSH oder über eine Weboberfläche. Das kostet mehr, spart aber Admin-Zeit.

Eine **Plattform** geht noch weiter: Du verbindest dein Repository, und bei jedem Push baut die Plattform
deine App, startet sie und verteilt die Last. [[skalierung|Skalierung]] – also mehr Instanzen bei mehr
Besuch – ist oft ein Schieberegler.

| Kriterium | VPS | Managed | PaaS |
|---|---|---|---|
| Einstiegspreis | niedrig | mittel | niedrig bis mittel, wächst mit Nutzung |
| eigener Aufwand | hoch | mittel | niedrig |
| Kontrolle | voll | eingeschränkt | gering |
| Wechsel zu anderem Anbieter | leicht | mittel | oft schwer |

Der letzte Punkt heißt [[vendor-lock-in|Vendor-Lock-in]]: Wer viele anbieterspezifische Funktionen nutzt,
kann später nur mit großem Umbau wechseln.

> [!FEHLER]
> „Der VPS kostet nur 6 € – also ist er am günstigsten.“ Rechne deine Arbeitszeit, externen Backup-Speicher,
> Snapshots und zusätzliche IPv4-Adressen mit. Oft ist das Gesamtbild ein anderes.

## So entscheidest du

Stell dir diese Fragen der Reihe nach:

1. **Kann und will ich einen Linux-Server pflegen?** Nein → Managed oder Plattform.
2. **Braucht die App Spezialsoftware** oder ungewöhnliche Dienste? Ja → eher VPS.
3. **Wie stark schwankt die Last?** Stark → Plattform mit automatischer Skalierung.
4. **Wo müssen die Daten liegen?** Personenbezogene Daten → Standort und Vertrag zur Auftragsverarbeitung prüfen.
5. **Wie hoch ist das Budget** – inklusive deiner Zeit?

Für die meisten kleinen Projekte gilt: Ein einzelner Server reicht lange. Plane trotzdem so, dass ein Umzug
möglich bleibt – mit einer `.env`-Datei statt fest eingetragener Werte und mit Backups, die du woanders
wiederherstellen kannst. Genau dieses Prinzip beschreibt auch die [[twelve-factor-app|Twelve-Factor-App]].

> [!PRAXIS]
> Viele Teams starten auf einem einzelnen Server und ziehen erst um, wenn echte Zahlen zeigen, dass es nötig
> ist. Eine vorschnell gebaute, teure Architektur ist ein häufigerer Fehler als ein zu kleiner Server.

## Zusammenfassung

- Hosting-Modelle unterscheiden sich darin, **was du selbst verwaltest**.
- Ein **VPS** gibt dir root-Zugang und volle Verantwortung – günstig, aber arbeitsintensiv.
- Ein **Managed Server** nimmt dir Betriebssystem und Dienste ab, das Deployment bleibt bei dir.
- Eine **Plattform (PaaS)** baut und startet deine App selbst – bequem, aber mit Lock-in-Risiko.
- Vergleiche **Gesamtkosten** inklusive Zeit, Backups und Extras, nicht nur Monatspreise.
- Standort des Rechenzentrums und Datenschutz gehören zur Entscheidung.
