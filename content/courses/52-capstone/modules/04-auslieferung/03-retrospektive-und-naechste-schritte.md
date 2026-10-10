---
title: Retrospektive und nächste Schritte
summary: Mit einer Retrospektive aus dem Projekt lernen, das Ergebnis als Portfolio-Stück präsentieren und Version 2 planen.
duration: 20
sources:
  - title: Scrum Guide 2020 – Sprint Retrospective
    url: https://scrumguides.org/scrum-guide.html#sprint-retrospective
  - title: Atlassian Team Playbook – Retrospektive
    url: https://www.atlassian.com/team-playbook/plays/retrospective
  - title: GitHub Docs – About READMEs
    url: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes
quiz:
  - type: single
    question: Welche Maßnahme aus einer Retrospektive ist am hilfreichsten?
    options:
      - „Wir testen besser.“
      - „Vor jedem neuen Endpunkt schreiben wir zuerst den Feature-Test für den Fehlerfall.“
      - „Nächstes Mal läuft alles glatt.“
    answer: 1
    explanation: Eine gute Maßnahme ist konkret und überprüfbar. „Besser testen“ ändert nichts, eine feste Regel schon.
  - type: multiple
    question: Was gehört in die README eines Portfolio-Projekts?
    options:
      - Was die App kann, in zwei, drei Sätzen
      - Wie man sie lokal startet
      - Wichtige Entscheidungen und ihre Gründe
      - Die echten Zugangsdaten zur Produktionsdatenbank
    answers: [0, 1, 2]
    explanation: Eine README erklärt, startet und begründet – Geheimnisse haben darin nichts verloren.
  - type: cloze
    text: Die drei Leitfragen der Retrospektive lauten - Was lief ___? Was war ___? Was mache ich beim nächsten Mal ___?
    blanks:
      - [gut]
      - [schwierig, schwer]
      - [anders]
    explanation: Drei einfache Fragen genügen, wenn die Antworten ehrlich und konkret sind.
tasks:
  - id: retro-sortieren
    type: dragdrop
    title: Notizen aus der Retrospektive
    description: Nach dem Projekt liegen viele Notizen auf dem Tisch. Ordne sie der passenden Spalte zu.
    targets:
      - { id: gut, label: Was lief gut }
      - { id: schwierig, label: Was war schwierig }
      - { id: anders, label: Was ich beim nächsten Mal anders mache }
    items:
      - { label: Die vorab geschriebenen Tests haben jeden Umbau abgesichert, target: gut }
      - { label: Die MoSCoW-Liste hat zwei Bauchentscheidungen verhindert, target: gut }
      - { label: Datumsformat zwischen API und Frontend hat einen Tag gekostet, target: schwierig }
      - { label: Der erste Deploy scheiterte an einer vergessenen Migration, target: schwierig }
      - { label: Den API-Vertrag zuerst als OpenAPI-Datei festhalten, target: anders }
      - { label: Das Walking Skeleton schon am ersten Tag deployen, target: anders }
    hints:
      - Vorschläge für die Zukunft sind Maßnahmen, keine Beobachtungen.
  - id: portfolio-readme
    type: terminal
    title: Eine README, die dein Projekt verkauft
    description: |
      Wer dein Repository öffnet – eine Kollegin, ein Recruiter, du selbst in einem Jahr –, liest zuerst die
      README. Schreibe im Ordner `portfolio` eine `README.md` für Vereinskurse:

      1. Eine Überschrift erster Ebene mit dem Projektnamen (`# Vereinskurse`) und darunter ein kurzer
         Absatz, was die App kann.
      2. Die Abschnitte `## Funktionen`, `## Tech-Stack`, `## Lokal starten`, `## Entscheidungen` und
         `## Nächste Schritte`.
      3. Unter `## Funktionen` mindestens drei Listenpunkte, unter `## Nächste Schritte` mindestens zwei.
      4. Unter `## Lokal starten` mindestens einen Code-Block mit ```` ```bash ````.
      5. Unter `## Entscheidungen` ein Link auf die Entscheidungsdatei: `[Entscheidungen](docs/entscheidungen.md)`.

      Tipp: Zeige die README mit `less README.md` an, um zu sehen, ob sie sich gut liest.
    workdir: portfolio
    checks:
      - type: command
        run: head -n 1 README.md
        stdout_matches: "^# Vereinskurse\\s*$"
        message: Die README beginnt noch nicht mit der Überschrift „# Vereinskurse“.
      - type: command
        run: for h in 'Funktionen' 'Tech-Stack' 'Lokal starten' 'Entscheidungen' 'Nächste Schritte'; do grep -qE "^## $h\s*$" README.md || echo "$h"; done
        stdout_equals: ""
        message: "Es fehlt mindestens ein Abschnitt: ## Funktionen, ## Tech-Stack, ## Lokal starten, ## Entscheidungen, ## Nächste Schritte."
      - type: command
        run: for h in 'Funktionen:3' 'Nächste Schritte:2'; do n="${h%%:*}"; min="${h##*:}"; c=$(awk -v h="## $n" '$0==h{f=1;next} /^## /{f=0} f && /^[-*] /{c++} END{print c+0}' README.md); [ "$c" -ge "$min" ] || echo "$n"; done
        stdout_equals: ""
        message: Unter ## Funktionen brauchst du mindestens drei, unter ## Nächste Schritte mindestens zwei Listenpunkte.
      - type: command
        run: awk '/^## Lokal starten/{f=1;next} /^## /{f=0} f && /^```bash/{print "ok"; exit}' README.md
        stdout_equals: ok
        message: Unter ## Lokal starten fehlt ein Code-Block, der mit ```bash beginnt.
      - type: file_contains
        path: README.md
        pattern: "\\]\\(docs/entscheidungen\\.md\\)"
        message: "Verlinke die Entscheidungen: [Entscheidungen](docs/entscheidungen.md)."
    hints:
      - "Mit `nano README.md` schreibst du die Datei; Überschriften beginnen mit `#` bzw. `##` und einem Leerzeichen."
      - "Ein Code-Block beginnt mit einer Zeile ```` ```bash ```` und endet mit ```` ``` ````."
      - Die Listenpunkte beginnen mit „- “ direkt am Zeilenanfang.
    solution: |
      ````markdown title="README.md"
      # Vereinskurse

      Mitglieder eines Sportvereins finden kommende Workshops und buchen einen Platz – ohne Überbuchung.

      ## Funktionen

      - Kommende Workshops mit freien Plätzen ansehen
      - Einen Platz buchen und wieder stornieren
      - Workshops als Organisatorin anlegen

      ## Tech-Stack

      Laravel 13 mit Sanctum und Pest, React 19 mit React Router, Zod und TanStack Query, PostgreSQL, Docker, GitHub Actions.

      ## Lokal starten

      ```bash
      cd api && composer install && php artisan migrate && php artisan serve
      cd web && npm install && npm run dev
      ```

      ## Entscheidungen

      Die wichtigsten Architektur-Entscheidungen stehen in [Entscheidungen](docs/entscheidungen.md).

      ## Nächste Schritte

      - Warteliste für ausgebuchte Workshops
      - Erinnerungs-Mail am Vortag
      ````
---
Vereinskurse ist live. Bevor du dich in das nächste Projekt stürzt, nimmst du dir eine Stunde Zeit für zwei
Dinge, die viele überspringen: **zurückschauen** und **zeigen**. Die Retrospektive macht aus Erfahrungen
Lehren für das nächste Mal. Eine gute README macht aus deinem Repository ein Portfolio-Stück.

## Warum eine Retrospektive?

Ohne Rückblick wiederholst du Fehler und vergisst, was gut funktioniert hat. Eine
[[retrospektive|Retrospektive]] ist ein kurzer, ehrlicher Blick auf das Projekt – nicht auf Personen. Drei
Fragen reichen:

| Frage | Ziel | Beispiel |
|---|---|---|
| Was lief gut? | beibehalten | Tests vor jedem Schritt gaben Sicherheit |
| Was war schwierig? | verstehen | Datumsformate zwischen API und Frontend |
| Was mache ich nächstes Mal anders? | handeln | API-Vertrag zuerst als OpenAPI festhalten |

Halte die Antworten in `docs/retro.md` fest. Im Team sammelt jede Person zuerst still ihre Notizen, dann
werden sie gemeinsam sortiert – so kommen auch leise Stimmen zu Wort.

> [!MERKSATZ]
> Eine Retrospektive ohne konkrete Maßnahme ist nur ein Gespräch. Jede Lehre endet in einer überprüfbaren
> Regel oder einem Checklistenpunkt.

## Gute Maßnahmen formulieren

Vergleiche zwei Lehren aus demselben Problem:

- „Wir müssen besser auf Migrationen achten.“
- „Das Deploy-Skript bricht mit `set -euo pipefail` ab, und auf der Go-Live-Checkliste steht: Migration auf
  einer Kopie der Produktionsdaten testen.“

Die zweite ist **konkret, überprüfbar und an einem Ort verankert**. Gute Maßnahmen landen dort, wo du beim
nächsten Mal ohnehin vorbeikommst: in der [[definition-of-done|Definition of Done]], in der Checkliste, im
Qualitäts-Gate oder als Test.

> [!FEHLER]
> Die Retrospektive auf „irgendwann“ verschieben. Nach zwei Wochen sind die Details vergessen. Mach sie
> direkt nach dem Go-Live, solange alles frisch ist.

## Dein Projekt als Portfolio

Dein Repository erzählt eine Geschichte – wenn du es lässt. Die [[readme|README]] ist die erste Seite:

1. **Was** die App kann, in zwei Sätzen.
2. **Funktionen** als kurze Liste.
3. **Tech-Stack** – welche Werkzeuge und warum.
4. **Lokal starten** – Befehle zum Kopieren.
5. **Entscheidungen** – Link auf `docs/entscheidungen.md`.
6. **Nächste Schritte** – zeigt, dass du weiterdenkst.

Dazu kommt eine saubere Git-Historie mit [[conventional-commits|Conventional Commits]], eine grüne CI und
Tests, die man lesen kann. Genau darauf schauen erfahrene Entwicklerinnen, wenn sie ein Projekt beurteilen.

> [!PRAXIS]
> In Bewerbungsgesprächen ist ein eigenes, vollständiges Projekt oft wertvoller als jedes Zertifikat. Erzähl
> dabei nicht nur, **was** du gebaut hast, sondern **warum** – deine ADRs und deine Retrospektive liefern
> genau diese Geschichten.

## Wie es weitergeht

Version 1 ist klein – mit Absicht. Für Version 2 nimmst du die Liste „Nicht jetzt“ und die Lehren aus der
Retrospektive und beginnst wieder bei Phase 1. Ideen, die in anderen Kursen der Plattform vertieft werden:

| Idee | Kurs |
|---|---|
| Fehler und Antwortzeiten im Betrieb sehen | Observability |
| Mehrsprachige Oberfläche | Internationalisierung |
| Erinnerungs-Mails über eine Queue | Laravel vertieft |
| Login per SPA-Cookie statt Token | Authentifizierung |
| Betrieb in der Cloud | AWS Fargate |
| Typfehler im PHP-Code mit Larastan finden | Code-Qualität |

![Die vier Phasen des Projekts mit Rückfluss aus der Retrospektive in die Planung](/assets/capstone/projektphasen.svg)

## Zusammenfassung

- Die **Retrospektive** fragt: Was lief gut, was war schwierig, was mache ich anders?
- Jede Lehre wird zu einer **konkreten, überprüfbaren Maßnahme** an einem festen Ort.
- Mach die Retrospektive **direkt nach dem Go-Live**.
- Eine gute **README** erklärt, startet und begründet dein Projekt – sie macht es zum Portfolio-Stück.
- Version 2 beginnt wieder mit der Planung – gespeist aus „Nicht jetzt“ und den Lehren.
