---
title: Monorepo oder Polyrepo?
summary: Was ein Monorepo ist, welche Probleme es löst und welche neuen es mitbringt – im Vergleich zum Polyrepo.
duration: 20
sources:
  - title: Bun Docs – Workspaces
    url: https://bun.com/docs/pm/workspaces
  - title: Turborepo Docs – What is a monorepo?
    url: https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository
  - title: Nx Docs – Introduction
    url: https://nx.dev/docs/getting-started/intro
quiz:
  - type: single
    question: Was unterscheidet ein Monorepo von einem Polyrepo?
    options:
      - Ein Monorepo enthält nur ein einziges Paket.
      - Ein Monorepo enthält mehrere Projekte in einem Repository, ein Polyrepo verteilt sie auf mehrere Repositorys.
      - Ein Monorepo funktioniert nur mit Bun.
      - Ein Polyrepo hat keinen Standard-Branch.
    answer: 1
    explanation: Mono heißt „eins“, poly heißt „viele“. Gemeint ist die Zahl der Repositorys, nicht die Zahl der Pakete.
  - type: multiple
    question: Welche Vorteile bringt ein Monorepo typischerweise? (mehrere richtig)
    options:
      - Eine Änderung über mehrere Pakete passt in einen einzigen Commit.
      - Gemeinsamer Code lässt sich ohne Veröffentlichen in einer Registry nutzen.
      - Jedes Team kann völlig eigene Werkzeuge und Versionen wählen.
      - Einheitliche Konfiguration für Linter, TypeScript und Tests.
    answers: [0, 1, 3]
    explanation: Völlige Freiheit pro Team ist eher ein Vorteil von Polyrepos. Monorepos leben von gemeinsamen Regeln.
  - type: match
    question: Ordne jedes Problem dem Ansatz zu, bei dem es typischerweise auftritt.
    pairs:
      - { left: "Bibliothek ändern, veröffentlichen, in drei Repos updaten", right: "Polyrepo" }
      - { left: "CI baut bei jeder Änderung alles neu", right: "Monorepo ohne Task-Runner" }
      - { left: "Zwei Apps nutzen unterschiedliche React-Versionen, ohne es zu merken", right: "Polyrepo" }
      - { left: "Ein Git-Clone dauert sehr lange", right: "Großes Monorepo" }
    explanation: Jeder Ansatz hat typische Schmerzen. Werkzeuge wie Workspaces, Catalogs und Task-Runner nehmen dem Monorepo seine größten.
  - type: cloze
    text: In einem Monorepo liegen ausgelieferte Anwendungen meist im Ordner ___ und wiederverwendbare Bibliotheken im Ordner ___.
    blanks:
      - [apps, apps/]
      - [packages, packages/]
    explanation: Die Aufteilung in apps/ und packages/ ist keine Pflicht, aber eine weit verbreitete Konvention.
tasks:
  - id: mono-oder-poly
    type: dragdrop
    title: Mono oder Poly?
    description: Ordne jede Aussage dem Ansatz zu, auf den sie am besten passt.
    targets:
      - { id: mono, label: Spricht für ein Monorepo }
      - { id: poly, label: Spricht für Polyrepos }
    items:
      - { label: Web-App und API teilen sich viele Typen, target: mono }
      - { label: "Eine Änderung soll App und Bibliothek in einem Pull Request anpassen", target: mono }
      - { label: Einheitliche Lint- und TypeScript-Regeln für alle, target: mono }
      - { label: Zwei Teams ohne gemeinsamen Code und mit eigenen Release-Zyklen, target: poly }
      - { label: Ein Teil des Codes darf für viele Mitarbeitende nicht sichtbar sein, target: poly }
      - { label: Ein Projekt in einer ganz anderen Sprache mit eigener Toolchain, target: poly }
    hints:
      - Frage dich jeweils, ob die Projekte Code oder Regeln miteinander teilen.
  - id: entscheidung-treffen
    type: steps
    title: Die Team-Entscheidung
    description: Ein kleines Team baut einen Online-Kiosk. Entscheide in jeder Situation, was sinnvoll ist.
    steps:
      - situation: Es gibt eine Web-App und eine API. Beide nutzen dieselben Typen für Bestellungen, bisher per Copy-and-paste.
        question: Was ist der naheliegende nächste Schritt?
        options:
          - Die Typen in ein gemeinsames Paket auslagern und beide Projekte in ein Monorepo legen
          - Die Typen in beiden Projekten weiter von Hand synchron halten
          - Die API in die Web-App einbauen
        answer: 0
        explanation: Geteilter Code ist das stärkste Argument für ein Monorepo. Ein gemeinsames Paket ersetzt die Kopien.
      - situation: Das Monorepo wächst auf zwölf Pakete. Die CI braucht für jeden Pull Request 25 Minuten, weil alles gebaut wird.
        question: Was hilft am meisten?
        options:
          - Das Monorepo wieder aufteilen
          - Nur betroffene Pakete bauen und Ergebnisse cachen, z. B. mit einem Task-Runner
          - Weniger Tests schreiben
        answer: 1
        explanation: Lange Builds sind ein bekanntes Monorepo-Problem. Affected-Builds und Caching lösen es, ohne die Vorteile aufzugeben.
      - situation: Eine Partnerfirma soll künftig nur den Quellcode der Bezahl-Komponente sehen dürfen.
        question: Was ist hier sinnvoll?
        options:
          - Die Komponente bleibt im Monorepo, die Firma bekommt Zugriff aufs ganze Repo
          - Die Komponente in ein eigenes Repository auslagern und als Paket veröffentlichen
          - Den Code per E-Mail verschicken
        answer: 1
        explanation: Zugriffsrechte gelten meist pro Repository. Wenn Sichtbarkeit getrennt sein muss, ist ein eigenes Repo die saubere Lösung.
---
Stell dir vor, deine Web-App und deine API brauchen dieselbe Funktion, die Preise formatiert. Bisher
liegt sie in beiden Projekten als Kopie. Jemand behebt einen Rundungsfehler in der Web-App – und die API
rechnet weiter falsch. Genau dieses Problem lösen Monorepos.

## Zwei Wege, Code zu organisieren

Ein [[monorepo|Monorepo]] ist ein einziges [[repository|Repository]], das mehrere zusammengehörige Projekte
enthält: zum Beispiel eine Web-App, eine API und gemeinsame Bibliotheken. Beim [[polyrepo|Polyrepo]] bekommt
jedes Projekt sein eigenes Repository.

![Monorepo und Polyrepo im Vergleich](/assets/monorepos-workspaces/monorepo-vs-polyrepo.svg)

```text title="Typischer Aufbau eines Monorepos"
kiosk/
├── package.json          # Root: hält alles zusammen
├── apps/
│   ├── web/              # ausgelieferte Web-App
│   └── api/              # ausgelieferte API
└── packages/
    ├── preise/           # gemeinsame Bibliothek
    └── tsconfig/         # gemeinsame Konfiguration
```

In `apps/` liegt, was am Ende ausgeliefert wird. In `packages/` liegt, was andere Teile wiederverwenden.
Jeder Unterordner ist ein eigenes [[paket|Paket]] mit eigener [[package-json|package.json]].

> [!MERKSATZ]
> „Mono“ zählt die **Repositorys**, nicht die Pakete. Ein Monorepo enthält viele Pakete – aber nur ein Repository.

## Warum ein Monorepo?

Die Vorteile entstehen alle daraus, dass der Code an **einem** Ort liegt:

| Vorteil | Was das im Alltag heißt |
|---|---|
| Geteilter Code ohne Umweg | Die Web-App nutzt `packages/preise` direkt – ohne Veröffentlichen in einer [[registry\|Registry]]. |
| [[atomarer-commit\|Atomare Commits]] | Bibliothek und alle Nutzer ändern sich im selben Commit und im selben Pull Request. |
| Einheitliche Regeln | Eine TypeScript-Basis, ein Linter, eine Test-Konfiguration für alle Pakete. |
| Einheitliche Versionen | Alle Pakete nutzen dieselbe React- oder TypeScript-Version. |
| Sichtbarkeit | Wer eine Funktion ändert, sieht sofort alle Stellen, die sie nutzen. |

Beim Polyrepo sieht derselbe Fix so aus: Bibliothek ändern, neue Version veröffentlichen, dann in jedem
abhängigen Repository die Version erhöhen und neu testen. Bei drei Nutzern sind das vier Pull Requests.

> [!PRAXIS]
> Viele große Open-Source-Projekte wie React, Vite oder Babel sind Monorepos. Auch in Firmen ist der
> Aufbau „Frontend, Backend und UI-Bibliothek in einem Repository“ heute sehr verbreitet.

## Was ein Monorepo kostet

Ein Monorepo ist kein Selbstläufer. Ohne passende Werkzeuge entstehen neue Probleme:

- **Lange Builds:** Die [[ci-pipeline|CI-Pipeline]] baut und testet bei jeder Änderung alles.
- **Unklare Grenzen:** Jedes Paket kann jedes andere importieren – schnell entsteht ein Knäuel.
- **Große Repositorys:** Clone und Suche werden mit der Zeit langsamer.
- **Rechte:** Zugriff gilt meist für das ganze Repository, nicht für einzelne Ordner.
- **Gemeinsame Entscheidungen:** Ein React-Update betrifft alle Teams gleichzeitig.

Die gute Nachricht: Für fast jedes dieser Probleme gibt es ein Werkzeug, das du in diesem Kurs kennenlernst.

| Problem | Lösung im Kurs |
|---|---|
| Pakete verknüpfen | [[workspace\|Workspaces]] und das `workspace:`-Protokoll |
| Versionen auseinanderlaufen | [[catalog\|Catalogs]] |
| Lange Builds | `--filter`, Projektreferenzen, Task-Runner mit Cache |
| Releases | Changesets |

> [!FEHLER]
> **„Monorepo“ mit einem Riesenpaket verwechseln.** Wer alles in einen einzigen `src/`-Ordner wirft, hat
> kein Monorepo, sondern einen Monolithen. Ein Monorepo besteht aus klar getrennten Paketen mit eigener
> package.json und eigenen Abhängigkeiten.

## Wann welcher Ansatz passt

Es gibt keine allgemein richtige Antwort, aber gute Faustregeln:

| Situation | Eher … |
|---|---|
| Projekte teilen Code oder Typen | Monorepo |
| Änderungen betreffen oft mehrere Projekte gleichzeitig | Monorepo |
| Ein kleines Team, ein Produkt | Monorepo |
| Projekte ohne jede Gemeinsamkeit | Polyrepo |
| Strenge Trennung von Zugriffsrechten nötig | Polyrepo |
| Völlig verschiedene Sprachen und Release-Zyklen | Polyrepo |

Auch Mischformen sind normal: Ein Produkt-Monorepo für Web, API und UI – und daneben ein eigenes
Repository für ein Open-Source-Paket, das die Welt nutzen soll.

> [!TIPP]
> Starte nicht mit einem Monorepo, nur weil es modern klingt. Wenn du merkst, dass du Code zwischen
> Repositorys kopierst, ist das der richtige Zeitpunkt.

## Zusammenfassung

- Ein **Monorepo** enthält mehrere Projekte in einem Repository, ein **Polyrepo** verteilt sie auf viele.
- Konvention: `apps/` für Ausgeliefertes, `packages/` für Wiederverwendetes – jedes mit eigener package.json.
- Vorteile: geteilter Code ohne Registry, atomare Commits, einheitliche Regeln und Versionen.
- Kosten: lange Builds, unklare Grenzen, große Repos, grobe Zugriffsrechte.
- Werkzeuge wie Workspaces, Catalogs, Filter und Task-Runner machen Monorepos alltagstauglich.
