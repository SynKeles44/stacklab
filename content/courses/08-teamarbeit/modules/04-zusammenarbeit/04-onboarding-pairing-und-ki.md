---
title: Onboarding, Pairing und KI-Assistenten
summary: Gut in ein Team starten, mit Pair und Mob Programming gemeinsam entwickeln, gemeinsame Commits kennzeichnen und KI-Assistenten nach klaren Teamregeln nutzen.
duration: 25
sources:
  - title: GitHub Docs – Creating a commit with multiple authors
    url: https://docs.github.com/en/pull-requests/committing-changes-to-your-project/creating-and-editing-commits/creating-a-commit-with-multiple-authors
  - title: Martin Fowler – On Pair Programming
    url: https://martinfowler.com/articles/on-pair-programming.html
  - title: AGENTS.md – ein offenes Format für Anweisungen an Coding-Agenten
    url: https://agents.md/
quiz:
  - type: match
    question: Welche Rolle beim Pair Programming macht was?
    pairs:
      - { left: "Driver", right: "Tippt den Code und denkt an den nächsten kleinen Schritt" }
      - { left: "Navigator", right: "Behält das große Ganze im Blick, prüft und denkt voraus" }
    explanation: Die Rollen wechseln regelmäßig, zum Beispiel alle 15 bis 30 Minuten.
  - type: single
    question: Wie vermerkst du in Git, dass ein Commit zu zweit entstanden ist?
    options:
      - Mit einer Zeile `Co-authored-by Name <E-Mail>` am Ende der Commit-Message (mit Doppelpunkt nach by)
      - Indem beide Personen nacheinander denselben Commit erstellen
      - Gar nicht, Git kennt nur eine Person pro Commit
    answer: 0
    explanation: Der Trailer `Co-authored-by` steht nach einer Leerzeile am Ende der Message. GitHub zeigt dann beide Personen als Autor:innen.
  - type: multiple
    question: Was hilft dir in den ersten Wochen in einem neuen Team? (mehrere Antworten)
    options:
      - Eine Liste mit Fragen führen und sie gesammelt stellen
      - Mit kleinen, gut beschriebenen Tickets anfangen
      - Fehler in der Setup-Doku direkt korrigieren
      - Möglichst wenig fragen, um kompetent zu wirken
    answers: [0, 1, 2]
    explanation: Fragen ist am Anfang ausdrücklich erwünscht. Kleine Tickets und Doku-Verbesserungen sind ideale Einstiege.
  - type: cloze
    text: Arbeitet das ganze Team gleichzeitig an einer Aufgabe an einem Bildschirm, spricht man von ___ Programming.
    blanks:
      - [Mob, Ensemble]
    explanation: Mob Programming (auch Ensemble Programming) eignet sich für schwierige Probleme und zum Wissensaustausch.
  - type: multiple
    question: Welche Regeln sind für KI-Assistenten im Team sinnvoll? (mehrere Antworten)
    options:
      - Jede KI-generierte Änderung wird von einem Menschen verstanden und reviewt
      - Keine Zugangsdaten oder Kundendaten in Prompts
      - Code aus dem Assistenten darf ohne Tests gemergt werden, weil er meist stimmt
      - Gemeinsame Projekt-Anweisungen für Assistenten liegen versioniert im Repository
    answers: [0, 1, 3]
    explanation: Die Verantwortung bleibt bei der Person, die committet. KI-Code wird geprüft und getestet wie jeder andere Code.
tasks:
  - id: gemeinsamer-commit
    type: terminal
    title: Einen Commit zu zweit erstellen
    description: |
      Im Ordner `m5-pairing` liegt ein Repository. Du (Anna) hast mit Ben im Pair Programming die Datei
      `kasse.js` geändert. Die Änderung ist noch nicht committet.

      1. Merke `kasse.js` vor.
      2. Committe mit der Message `feat(SHOP-90): show total with tax at checkout` und füge den Trailer
         `Co-authored-by: Ben <ben@example.com>` hinzu – als eigene Zeile am Ende der Message, getrennt
         durch eine Leerzeile.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: m5-pairing
    setup: |
      git init -q -b main
      git config user.name "Anna"
      git config user.email "anna@example.com"
      printf 'export const total = (items) => items.reduce((a, b) => a + b, 0)\n' > kasse.js
      git add . && git commit -q -m "feat(SHOP-89): add checkout total"
      printf 'export const total = (items) => items.reduce((a, b) => a + b, 0)\nexport const totalWithTax = (items) => Math.round(total(items) * 1.19)\n' > kasse.js
    checks:
      - type: command
        run: git log --format=%s | wc -l
        stdout_matches: "^\\s*2\\s*$"
        message: Es sollte genau einen neuen Commit geben.
      - type: command
        run: git log -1 --format=%s
        stdout_equals: "feat(SHOP-90): show total with tax at checkout"
        message: "Die erste Zeile der Message soll `feat(SHOP-90): show total with tax at checkout` lauten."
      - type: command
        run: git log -1 --format='%(trailers:key=Co-authored-by,valueonly)'
        stdout_matches: "^Ben <ben@example\\.com>$"
        message: "Der Trailer `Co-authored-by: Ben <ben@example.com>` fehlt oder ist nicht als eigene Zeile am Ende erkennbar."
      - type: command
        run: git status --porcelain kasse.js | wc -l
        stdout_matches: "^\\s*0\\s*$"
        message: kasse.js ist noch nicht vollständig committet.
    hints:
      - "Ein zweites `-m` erzeugt einen neuen Absatz: `git commit -m \"Betreff\" -m \"Co-authored-by: …\"`."
      - "Alternativ: `git commit -m \"Betreff\" --trailer \"Co-authored-by: Ben <ben@example.com>\"`."
    solution: |
      ```bash
      cd m5-pairing
      git add kasse.js
      git commit -m "feat(SHOP-90): show total with tax at checkout" -m "Co-authored-by: Ben <ben@example.com>"
      git log -1
      ```
  - id: ki-regeln
    type: dragdrop
    title: Okay oder nicht okay?
    description: Euer Team hat Regeln für KI-Assistenten vereinbart. Ordne jedes Verhalten ein.
    targets:
      - { id: ok, label: Passt zu den Teamregeln }
      - { id: nicht-ok, label: Verstößt gegen die Teamregeln }
    items:
      - { label: "Du lässt dir einen Testentwurf erzeugen, liest ihn genau und passt ihn an", target: ok }
      - { label: "Du bittest den Assistenten, eine Fehlermeldung zu erklären, und prüfst die Antwort in der Doku", target: ok }
      - { label: "Du ergänzt AGENTS.md um eine Projektregel, die der Assistent immer wieder falsch macht", target: ok }
      - { label: "Du kopierst einen Kundendatensatz mit E-Mail-Adressen in den Prompt", target: nicht-ok }
      - { label: "Du committest 300 generierte Zeilen, die du selbst nicht erklären kannst", target: nicht-ok }
      - { label: "Du fügst den Produktions-API-Schlüssel ein, damit der Assistent den Fehler findet", target: nicht-ok }
    hints:
      - "Frag dich: Bleibt die Verantwortung bei einem Menschen, und verlassen keine Geheimnisse oder Kundendaten das Team?"
---

Erster Tag im neuen Team. Der Laptop ist da, aber das Projekt startet nicht. Du weißt nicht, wen du fragen
darfst. Ein KI-Assistent schlägt dir eine Lösung vor – darfst du die einfach übernehmen? Wie gut der Start
gelingt, hängt von dir **und** von den Regeln des Teams ab.

## Onboarding: gut ankommen

[[onboarding|Onboarding]] heißt die Einarbeitung neuer Teammitglieder. Gutes Onboarding ist geplant:

| Das Team stellt bereit | Du als neue Person |
|---|---|
| README mit Setup-Anleitung | Setup durchgehen, Lücken im README korrigieren |
| eine feste Ansprechperson („Buddy“) | eine Fragenliste führen und regelmäßig besprechen |
| kleine, gut beschriebene Einstiegs-Tickets | früh einen ersten kleinen Pull Request öffnen |
| Überblick über Architektur und Abläufe | `CONTRIBUTING.md` und Teamregeln lesen |

Dein erster Pull Request ist oft eine Korrektur der Setup-Doku – niemand sieht Lücken so klar wie die
Person, die gerade darüber gestolpert ist.

> [!MERKSATZ]
> Am Anfang erwartet niemand, dass du alles weißt. Erwartet wird, dass du fragst.

## Pair und Mob Programming

Beim [[pair-programming|Pair Programming]] arbeiten zwei Personen an einer Aufgabe. Der **Driver** tippt und
denkt an den nächsten Schritt, der **Navigator** behält das Ziel im Blick, denkt an Sonderfälle und
schlägt nach. Die Rollen wechseln alle 15 bis 30 Minuten. Beim [[mob-programming|Mob Programming]] arbeitet
das ganze Team an einer Aufgabe, der Driver wechselt nach wenigen Minuten – ideal für knifflige Fragen und
schnellen Wissensaustausch.

Pairing lohnt sich besonders bei schwierigen Problemen, kritischem Code und beim Einarbeiten neuer Kolleg:innen. Für reine Routinearbeit ist es oft zu teuer – dort reicht ein gutes Review.

Damit sichtbar wird, dass ein Commit zu zweit entstand, gibt es einen [[commit-trailer|Commit-Trailer]] am
Ende der Message:

```bash title="Gemeinsamer Commit"
git commit -m "feat(SHOP-90): show total with tax at checkout" \
  -m "Co-authored-by: Ben <ben@example.com>"
```

> [!FEHLER]
> **Die erfahrene Person tippt die ganze Zeit.** Dann schaut die neue Person nur zu. Besser: Die weniger
> erfahrene Person ist Driver, die erfahrenere navigiert.

## KI-Assistenten im Team

Ein [[ki-assistent|KI-Assistent]] kann Code vorschlagen, Fehlermeldungen erklären oder Tests entwerfen. Im
Team braucht es dafür klare Vereinbarungen:

- **Verantwortung bleibt beim Menschen.** Wer committet, muss den Code verstehen und erklären können.
- **Review und Tests wie immer.** KI-Code bekommt kein schnelleres Review, eher ein gründlicheres.
- **Keine Geheimnisse und keine Kundendaten** in Prompts – nur Platzhalter wie `<dein-token>`.
- **Ergebnisse prüfen.** Assistenten erfinden manchmal Funktionen oder Optionen, die es nicht gibt – eine
  [[halluzination|Halluzination]]. Ein Blick in die offizielle Doku klärt das.
- **Gemeinsamer Kontext:** Projektregeln für Assistenten stehen versioniert im Repository, etwa in einer
  [[agents-md|AGENTS.md]].

```markdown title="AGENTS.md (Ausschnitt)"
# Hinweise für KI-Assistenten
- PHP-Dateien beginnen mit declare(strict_types=1);
- Tests mit Pest, Befehl: composer test
- Commit-Messages nach Conventional Commits mit Ticket-Scope
```

> [!PRAXIS]
> Viele Teams vermerken in der PR-Beschreibung, wenn größere Teile KI-generiert sind. Das ist kein Makel,
> sondern hilft Reviewer:innen, besonders auf erfundene APIs und fehlende Sonderfälle zu achten.

## Zusammenfassung

- Gutes Onboarding braucht Setup-Doku, einen Buddy und kleine Einstiegs-Tickets; Neue fragen aktiv.
- Pair Programming mit Driver und Navigator, Mob Programming mit dem ganzen Team.
- `Co-authored-by: Name <E-Mail>` macht gemeinsame Commits sichtbar.
- KI-Assistenten nutzt ihr nach Teamregeln: Mensch verantwortet, Review und Tests, keine Geheimnisse.
- Projektregeln für Assistenten liegen versioniert im Repository, z. B. in `AGENTS.md`.
