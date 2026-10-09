---
title: Branching-Strategien und Releases
summary: GitHub Flow, Git Flow und Trunk-based Development verstehen, Releases mit Release-Branches und Tags vorbereiten und Feature-Flags als Alternative kennen.
duration: 25
sources:
  - title: GitHub Docs – GitHub flow
    url: https://docs.github.com/en/get-started/using-github/github-flow
  - title: Vincent Driessen – A successful Git branching model
    url: https://nvie.com/posts/a-successful-git-branching-model/
  - title: Trunk Based Development
    url: https://trunkbaseddevelopment.com/
  - title: Pro Git – Taggen
    url: https://git-scm.com/book/de/v2/Git-Grundlagen-Taggen
  - title: Martin Fowler – Feature Toggles
    url: https://martinfowler.com/articles/feature-toggles.html
quiz:
  - type: single
    question: Wie viele langlebige Branches gibt es im GitHub Flow?
    options:
      - Einen (main)
      - Zwei (main und develop)
      - Für jedes Feature einen
    answer: 0
    explanation: Im GitHub Flow gibt es nur main. Alle anderen Branches sind kurzlebige Feature-Branches, die nach dem Merge gelöscht werden.
  - type: match
    question: Ordne jeder Strategie ihr Kennzeichen zu.
    pairs:
      - { left: "GitHub Flow", right: "main plus kurze Feature-Branches, Merge per Pull Request" }
      - { left: "Git Flow", right: "main und develop plus Release- und Hotfix-Branches" }
      - { left: "Trunk-based Development", right: "Alle integrieren mindestens täglich direkt in main" }
    explanation: Die drei Strategien unterscheiden sich vor allem darin, wie viele langlebige Branches es gibt und wie oft Code zusammengeführt wird.
  - type: cloze
    text: Im Trunk-based Development wird unfertiger Code hinter einem ___ versteckt, damit er schon in main liegen darf.
    blanks:
      - [Feature-Flag, Feature Flag, Featureflag, Feature-Toggle, Flag]
    explanation: Ein Feature-Flag ist ein Schalter im Code. Solange er aus ist, sehen Nutzer:innen den neuen Code nicht – obwohl er bereits ausgeliefert ist.
  - type: multiple
    question: Welche Risiken haben Feature-Flags? (mehrere Antworten)
    options:
      - Alte Flags bleiben im Code liegen und machen ihn unübersichtlich
      - Jede Kombination von Flags müsste eigentlich getestet werden
      - Code hinter einem Flag kann nie ausgeliefert werden
      - Ein falsch gesetztes Flag schaltet eine Funktion unbeabsichtigt frei
    answers: [0, 1, 3]
    explanation: Flags sind mächtig, erzeugen aber Aufräumarbeit (Flag-Schulden) und zusätzliche Kombinationen. Code hinter Flags wird sehr wohl ausgeliefert – nur eben ausgeschaltet.
  - type: match
    question: Welcher Befehl passt zu welchem Ziel?
    pairs:
      - { left: "git switch -c release/1.4", right: "Release-Stand abzweigen" }
      - { left: "git cherry-pick a1b2c3d", right: "Einen einzelnen Fix in einen anderen Branch übernehmen" }
      - { left: "git push origin v1.4.0", right: "Einen Tag zum Remote hochladen" }
    explanation: Release-Branch, Cherry-Pick und Tag sind die drei Bausteine eines kontrollierten Releases.
tasks:
  - id: strategie-zuordnen
    type: dragdrop
    title: Welche Strategie passt?
    description: Ordne jedes Team der Branching-Strategie zu, die am besten zu seiner Situation passt.
    targets:
      - { id: github-flow, label: GitHub Flow }
      - { id: git-flow, label: Git Flow }
      - { id: trunk, label: Trunk-based Development }
    items:
      - { label: "Fünf Personen bauen einen Online-Shop und liefern nach jedem gemergten Pull Request aus", target: github-flow }
      - { label: "Ein Team pflegt Version 2 und Version 3 einer installierbaren Buchhaltungssoftware gleichzeitig", target: git-flow }
      - { label: "Ein erfahrenes Team mit sehr guter Testabdeckung integriert mehrmals täglich und nutzt Feature-Flags", target: trunk }
      - { label: "Eine Mobile-App erscheint alle vier Wochen nach einer Testphase im App-Store", target: git-flow }
      - { label: "Ein kleines Team startet ein neues internes Werkzeug und möchte einfache Regeln", target: github-flow }
      - { label: "Hunderte Entwickler:innen arbeiten in einem großen Repository und vermeiden lange Branches", target: trunk }
    hints:
      - Frage dich bei jedem Team, wie oft es ausliefert und ob es mehrere Versionen gleichzeitig pflegt.
  - id: release-und-tag
    type: terminal
    title: Ein Release für das Team vorbereiten
    description: |
      Im Ordner `m1-release` arbeitet ein kleines Team: `origin.git` ist das gemeinsame Remote,
      `anna` und `ben` sind die Klone zweier Personen. Auf `main` liegen schon drei Commits.

      Du bist Anna und bereitest Version 1.0.0 vor:

      1. Wechsle in den Ordner `anna` und lege von `main` den Branch `release/1.0` an.
      2. Setze auf diesem Branch einen **annotierten** Tag `v1.0.0` mit einer Nachricht.
      3. Pushe den Branch **und** den Tag nach `origin`.
      4. Wechsle in den Ordner `ben` und hole die Neuigkeiten mit `git fetch --tags`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: m1-release
    setup: |
      git init -q --bare -b main origin.git
      git clone -q origin.git anna 2>/dev/null
      cd anna
      git config user.name "Anna"
      git config user.email "anna@example.com"
      printf '# Shop\n' > README.md
      git add README.md && git commit -q -m "chore: initial commit"
      printf 'export const version = "1.0.0"\n' > version.js
      git add version.js && git commit -q -m "feat(SHOP-1): add version file"
      printf '# Shop\n\nOnline-Shop für Pflanzen.\n' > README.md
      git commit -q -am "docs(SHOP-2): describe project"
      git push -q origin main
      cd ..
      git clone -q origin.git ben
      git -C ben config user.name "Ben"
      git -C ben config user.email "ben@example.com"
    checks:
      - type: command
        run: git -C origin.git rev-parse --verify -q refs/heads/release/1.0
        message: Im Remote gibt es noch keinen Branch release/1.0. Hast du ihn aus dem Ordner anna gepusht?
      - type: command
        run: git -C origin.git cat-file -t v1.0.0
        stdout_equals: tag
        message: Im Remote fehlt der annotierte Tag v1.0.0 (git tag -a … und git push origin v1.0.0).
      - type: command
        run: test "$(git -C origin.git rev-parse v1.0.0^{commit})" = "$(git -C origin.git rev-parse release/1.0)" && echo ok
        stdout_equals: ok
        message: Der Tag v1.0.0 soll auf die Spitze von release/1.0 zeigen.
      - type: command
        run: git -C ben tag -l v1.0.0
        stdout_equals: v1.0.0
        message: Ben kennt den Tag noch nicht. Führe im Ordner ben `git fetch --tags` aus.
    hints:
      - "Ein annotierter Tag entsteht mit `git tag -a v1.0.0 -m \"Release 1.0.0\"`."
      - "Den Branch pushst du mit `git push -u origin release/1.0`, den Tag mit `git push origin v1.0.0`."
      - "Für Ben: `cd ../ben` und dann `git fetch --tags`."
    solution: |
      ```bash
      cd m1-release
      cd anna
      git switch -c release/1.0
      git tag -a v1.0.0 -m "Release 1.0.0"
      git push -u origin release/1.0
      git push origin v1.0.0
      cd ../ben
      git fetch --tags
      git tag
      ```
---

Fünf Personen arbeiten am selben Online-Shop. Anna baut eine Suche, Ben repariert den Warenkorb, Chris
bereitet die nächste Version vor, Dana behebt dringend einen Fehler in der Kasse. Wer darf wann in welchen
Branch? Was wird ausgeliefert? Diese Fragen beantwortet eine **Branching-Strategie**.

![Drei Branching-Strategien im Vergleich: GitHub Flow, Git Flow und Trunk-based Development](/assets/teamarbeit/branching-strategien.svg)

## Warum ein Team eine Strategie braucht

Ein [[branch]] ist nur ein beweglicher Zeiger auf einen [[commit]]. Diese Freiheit wird im Team zum
Problem: Hat jede Person ihre eigene Logik, weiß niemand, welcher Branch den auslieferbaren Stand enthält.

Eine [[branching-strategie|Branching-Strategie]] ist eine **Vereinbarung** wie die Vorfahrtsregeln an
einer Kreuzung. Sie legt fest, welche Branches es dauerhaft gibt und wie Arbeit zurückfließt. Zwei Begriffe
brauchst du dafür:

- Ein [[langlebiger-branch|langlebiger Branch]] existiert dauerhaft, zum Beispiel `main`.
- Ein [[feature-branch|Feature-Branch]] lebt nur bis zum Ende einer Aufgabe, wird gemergt und gelöscht.

> [!MERKSATZ]
> Je länger ein Branch getrennt lebt, desto größer werden die Unterschiede – und desto schmerzhafter das
> Zusammenführen.

## GitHub Flow: einfach und schnell

Der [[github-flow|GitHub Flow]] kennt nur einen langlebigen Branch: `main`. Alles in `main` ist
auslieferbar. Der Ablauf:

1. Von `main` einen Feature-Branch abzweigen, etwa `feat/login`.
2. Committen und einen [[pull-request|Pull Request]] öffnen.
3. Nach Review und Freigabe in `main` mergen, Branch löschen, ausliefern.

```bash title="GitHub Flow im Terminal"
git switch main && git pull
git switch -c feat/login
# … committen …
git push -u origin feat/login   # danach Pull Request öffnen
```

Er passt zu Web-Anwendungen, die häufig ausgeliefert werden. Es gibt nur eine aktuelle Version – die auf
dem [[server]].

## Git Flow: Struktur für feste Releases

[[git-flow|Git Flow]] hat zwei langlebige Branches: `main` (nur ausgelieferte Versionen) und `develop`
(Stand für das nächste Release). Dazu kommen kurzlebige Branches:

| Branch | Zweck |
|---|---|
| `feature/…` | neue Funktionen, von `develop` nach `develop` |
| `release/…` | Version vorbereiten, nur noch Fehlerbehebungen |
| `hotfix/…` | dringende Korrektur, von `main` nach `main` **und** `develop` |

Ein [[release-branch|Release-Branch]] friert einen Stand ein – wie eine Zeitung nach Redaktionsschluss:
Korrigieren ja, erweitern nein. Ein [[hotfix|Hotfix]] korrigiert eine bereits ausgelieferte Version. Einzelne
Commits überträgst du mit [[cherry-pick|Cherry-Pick]] in andere Branches (`git cherry-pick a1b2c3d`).

Git Flow lohnt sich für installierbare Software, Mobile-Apps mit Store-Prüfung oder Bibliotheken mit
mehreren gepflegten Versionen. Für Web-Apps mit ständiger Auslieferung ist es meist zu schwerfällig.

![Release-Branch mit Tags und Hotfix](/assets/teamarbeit/release-branch.svg)

## Trunk-based Development und Feature-Flags

Beim [[trunk-based-development|Trunk-based Development]] integrieren alle **mindestens täglich** in `main`.
Feature-Branches leben höchstens ein bis zwei Tage. Unfertiges steckt hinter einem
[[feature-flag|Feature-Flag]]: Der Code ist ausgeliefert, aber ausgeschaltet.

```js title="Unfertiges hinter einem Flag verstecken"
if (flags.isEnabled('neue-suche', user)) {
  zeigeNeueSuche()
} else {
  zeigeAlteSuche()
}
```

Flags erlauben schrittweises Freischalten und schnelles Abschalten ohne neue Auslieferung. Aber jedes Flag
verdoppelt die Wege durch den Code, und alte Flags werden zu Altlasten. Trunk-based Development braucht
außerdem sehr gute Tests und [[continuous-integration|Continuous Integration]].

> [!FEHLER]
> **„Wir machen Trunk-based, haben aber kaum Tests.“** Dann landet jeder Fehler sofort bei allen – und oft
> bei den Nutzer:innen.

## Releases taggen und wählen

Jede ausgelieferte Version bekommt einen [[annotierter-tag|annotierten Tag]] nach
[[semantic-versioning|Semantic Versioning]] (`MAJOR.MINOR.PATCH`). Tags pushst du ausdrücklich:

```bash title="Version taggen und teilen"
git tag -a v1.4.0 -m "Release 1.4.0"
git push origin v1.4.0      # andere holen ihn mit: git fetch --tags
```

| Frage | GitHub Flow | Git Flow | Trunk-based |
|---|---|---|---|
| Auslieferung | täglich bis wöchentlich | geplante Versionen | mehrmals täglich |
| Mehrere gepflegte Versionen? | nein | ja | nein |
| Testqualität | ordentlich | beliebig | sehr gut |

> [!PRAXIS]
> Die gewählte Strategie steht meist in `CONTRIBUTING.md`. [[geschuetzter-branch|Branch-Schutzregeln]] auf
> [[github|GitHub]] setzen sie durch: kein direkter Push nach `main`, Freigabe und grüne Tests nötig.

## Zusammenfassung

- Eine Branching-Strategie regelt, welche Branches es gibt und wie Arbeit zusammenfließt.
- **GitHub Flow**: `main` plus kurze Feature-Branches – ideal für Web-Apps.
- **Git Flow**: `main` und `develop` plus Release- und Hotfix-Branches – für feste Versionen.
- **Trunk-based**: tägliche Integration, Unfertiges hinter Feature-Flags – braucht starke Tests.
- Ausgelieferte Versionen bekommen annotierte Tags, die du ausdrücklich pushst.
