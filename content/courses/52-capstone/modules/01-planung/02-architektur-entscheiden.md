---
title: Architektur entscheiden und festhalten
summary: Welche Bausteine Vereinskurse hat, warum API und SPA getrennt sind und wie du Entscheidungen in wenigen Zeilen dokumentierst.
duration: 20
sources:
  - title: Michael Nygard – Documenting Architecture Decisions
    url: https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
  - title: ADR GitHub-Organisation – Vorlagen und Beispiele
    url: https://adr.github.io/
  - title: Laravel-Dokumentation – Sanctum
    url: https://laravel.com/docs/13.x/sanctum
quiz:
  - type: single
    question: Warum liegen API und Frontend in Vereinskurse in getrennten Ordnern (`api/` und `web/`)?
    options:
      - Weil Laravel kein HTML ausliefern kann.
      - Weil beide unabhängig gebaut, getestet und ausgeliefert werden können und über einen klaren Vertrag (JSON) reden.
      - Weil Git sonst zu langsam wird.
    answer: 1
    explanation: >
      Laravel kann sehr wohl HTML liefern (Blade). Die Trennung ist eine **Entscheidung**: Die API bleibt für
      weitere Clients nutzbar, und jede Seite hat ihre eigene Toolchain.
  - type: multiple
    question: Was gehört in einen Architecture Decision Record (ADR)?
    options:
      - Der Kontext, also welches Problem gelöst werden soll
      - Die getroffene Entscheidung
      - Die Begründung und die Folgen
      - Der komplette Quellcode der Lösung
    answers: [0, 1, 2]
    explanation: Ein ADR ist kurz – Kontext, Entscheidung, Begründung, Folgen. Code gehört ins Repository, nicht ins ADR.
  - type: cloze
    text: Eine erste, durchgehend lauffähige Mini-Version aller Schichten nennt man ___ ___.
    blanks:
      - [Walking]
      - [Skeleton]
    explanation: >
      Ein Walking Skeleton verbindet früh alle Schichten – Frontend, API, Datenbank, Pipeline – mit minimaler
      Funktion. So fallen Integrationsprobleme am Anfang auf.
  - type: find-bug
    question: In diesem ADR fehlt etwas Entscheidendes. In welcher Zeile?
    language: markdown
    code: |
      ## ADR 2: Login mit Sanctum-Tokens
      Status: angenommen
      Kontext: Die SPA und später eine App brauchen einen Login.
      Entscheidung: Wir nutzen Sanctum-API-Tokens.
      Begründung: Weil es cool ist.
      Folgen: Tokens liegen im Speicher der SPA und gehen beim Neuladen verloren.
    bug_line: 5
    explanation: >
      „Weil es cool ist“ ist keine Begründung. Eine gute Begründung nennt Gründe, die andere nachvollziehen
      können – etwa „einfach zu testen, für spätere Clients wiederverwendbar“.
tasks:
  - id: architektur-beschriften
    type: diagram
    title: Beschrifte die Architektur
    description: >
      Das ist die Architektur von Vereinskurse. Ziehe die Bausteine an die richtige Stelle: Wo läuft der Code,
      der im Browser rendert? Wer verteilt Anfragen? Wo liegen die Daten? Was prüft jede Änderung?
    image: /assets/capstone/architektur-leer.svg
    slots:
      - { x: 14, y: 44, answer: React-SPA }
      - { x: 39, y: 44, answer: Nginx }
      - { x: 65, y: 44, answer: Laravel-API }
      - { x: 89, y: 44, answer: PostgreSQL }
      - { x: 53, y: 86, answer: CI-Pipeline }
    distractors: [Redis, Blade-Views]
  - id: phasen-ordnen
    type: order
    title: Die Phasen des Projekts
    description: Bringe die Arbeitsschritte von Vereinskurse in eine sinnvolle Reihenfolge.
    items:
      - Anforderungen und MVP festlegen
      - Architektur-Entscheidungen als ADR notieren
      - Datenmodell entwerfen und migrieren
      - API-Endpunkte mit Tests bauen
      - Frontend an den API-Vertrag anbinden
      - Container und CI-Pipeline einrichten
      - Deployen und mit Checkliste live gehen
      - Retrospektive halten
    hints:
      - Das Frontend braucht einen fertigen API-Vertrag.
      - Die Retrospektive schaut auf das ganze Projekt zurück.
---
Du hast deine Anforderungen. Jetzt stellt sich die Frage: **Aus welchen Bausteinen** besteht die App, und wie
reden sie miteinander? Diese Entscheidungen sind teuer zu ändern, sobald Code darauf aufbaut. Deshalb
triffst du sie bewusst – und schreibst sie auf, damit dein zukünftiges Ich (oder dein Team) weiß, **warum**.

## Die Bausteine von Vereinskurse

![Architektur von Vereinskurse: Browser mit React-SPA, Nginx, Laravel-API, PostgreSQL und CI-Pipeline](/assets/capstone/architektur.svg)

| Baustein | Aufgabe | Gelernt in |
|---|---|---|
| React-[[spa\|SPA]] | Oberfläche, Routen, Formulare | Moderner React-Stack |
| [[nginx\|Nginx]] | liefert die SPA aus, reicht `/api` weiter | Nginx & Webserver |
| Laravel-[[rest-api\|REST-API]] | Login, Regeln, Validierung | Laravel |
| [[postgresql\|PostgreSQL]] | speichert Workshops und Buchungen | Datenbanken & SQL |
| [[ci-pipeline\|CI-Pipeline]] | prüft jede Änderung automatisch | Deployments & CI/CD |

Frontend und API teilen sich in Produktion **einen** [[web-origin|Origin]]: Nginx liefert unter `/` die SPA
und unter `/api` die Laravel-Antworten. Dadurch brauchst du dort kein [[cors|CORS]].

## Warum API und SPA getrennt?

Laravel könnte die Oberfläche auch selbst mit Blade rendern. Für Vereinskurse spricht trotzdem einiges für die
Trennung:

- **Ein klarer Vertrag:** Beide Seiten reden nur über JSON. Das Format legst du einmal fest.
- **Wiederverwendbar:** Eine spätere Smartphone-App nutzt dieselbe API.
- **Getrennte Werkzeuge:** Composer und Pest hier, npm und Vite dort – jede Seite bleibt übersichtlich.

Der Preis: zwei Build-Prozesse und ein Login, der über Tokens oder Cookies laufen muss. Diesen Preis zu
benennen, gehört zu einer ehrlichen Entscheidung.

> [!MERKSATZ]
> Es gibt keine „richtige“ Architektur, nur passende. Eine gute Entscheidung nennt **Gründe und Kosten**.

## Ein Repository, zwei Apps

Du legst beide Teile in **ein** Repository – ein kleines [[monorepo|Monorepo]]:

```text title="Struktur von vereinskurse/"
vereinskurse/
├── api/                 ← Laravel 13 (Composer, Pest)
├── web/                 ← Vite + React 19 (npm)
├── docs/                ← Anforderungen, Entscheidungen, Checklisten
├── deploy/              ← Deploy-Skript und Beispiel-Umgebung
├── compose.yaml         ← alle Container zusammen
└── .github/workflows/   ← CI-Pipeline
```

Vorteil: Eine Änderung am API-Format und die passende Änderung im Frontend landen im **selben Commit** und im
selben Pull Request. Für ein kleines Team ist das fast immer einfacher als zwei Repositorys.

## Entscheidungen als ADR

Ein [[adr|Architecture Decision Record]] hält eine Entscheidung in wenigen Zeilen fest. Du brauchst kein
Werkzeug, eine Markdown-Datei reicht:

```markdown title="docs/entscheidungen.md"
## Sanctum-Tokens für den Login
Status: angenommen
Kontext: Die SPA und später eine App brauchen einen Login.
Entscheidung: Wir geben nach dem Login ein Sanctum-API-Token aus.
Begründung: Einfach zu testen, auch für andere Clients nutzbar.
Folgen: Das Token liegt nur im Speicher der SPA; nach dem Neuladen meldet man sich neu an.
```

Liegen SPA und API später fest auf derselben Domain, kann Sanctum auch Cookie-Sessions für die SPA nutzen.
Das wäre ein neuer ADR, der den alten ablöst – alte ADRs löschst du nicht.

> [!FEHLER]
> Entscheidungen nur im Kopf oder im Chat treffen. Nach drei Monaten weiß niemand mehr, warum etwas so ist –
> und jemand „repariert“ es versehentlich.

## Walking Skeleton statt Big Bang

Baue nicht erst die komplette API, dann das komplette Frontend und am Ende die Pipeline. Besser ist ein
[[walking-skeleton|Walking Skeleton]]: Eine winzige Funktion läuft früh durch **alle** Schichten.

1. Eine Route `GET /api/workshops`, die eine leere Liste liefert.
2. Eine React-Seite, die diese Liste lädt und „keine Workshops“ anzeigt.
3. Ein Test und ein CI-Lauf, die beides prüfen.

Danach wächst jede Schicht Funktion für Funktion in [[vertikaler-schnitt|vertikalen Schnitten]].
Integrationsprobleme – falsche URLs, CORS, Datumsformate – fallen so am ersten Tag auf statt am letzten.

> [!PRAXIS]
> In Produktteams ist der erste Pull Request eines neuen Projekts oft genau so ein Skelett: Build, Test,
> Deployment einer „Hallo Welt“-Version. Erst wenn die Strecke steht, beginnt die Fachlogik.

## Zusammenfassung

- Vereinskurse besteht aus **React-SPA, Nginx, Laravel-API, PostgreSQL** und einer **CI-Pipeline**.
- API und SPA sind getrennt und reden über einen **JSON-Vertrag**; in Produktion teilen sie einen Origin.
- Ein **Monorepo** hält zusammengehörige Änderungen in einem Commit.
- **ADRs** halten Kontext, Entscheidung, Begründung und Folgen kurz fest.
- Ein **Walking Skeleton** verbindet früh alle Schichten, danach wächst die App in vertikalen Schnitten.
