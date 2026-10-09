---
title: Merge-Konflikte im Team
summary: Warum im Team Konflikte entstehen, wie ihr ihnen vorbeugt und wie du einen Konflikt gemeinsam mit der anderen Person sauber löst.
duration: 25
sources:
  - title: Pro Git – Einfaches Branching und Merging (Konflikte)
    url: https://git-scm.com/book/de/v2/Git-Branching-Einfaches-Branching-und-Merging
  - title: git-merge Dokumentation
    url: https://git-scm.com/docs/git-merge
  - title: git-push Dokumentation (--force-with-lease)
    url: https://git-scm.com/docs/git-push
quiz:
  - type: single
    question: Ben will pushen, aber Git lehnt ab, weil im Remote neuere Commits von Anna liegen. Was tut er?
    options:
      - Er holt Annas Commits mit git pull, löst eventuelle Konflikte und pusht dann
      - Er pusht mit --force, damit seine Version gewinnt
      - Er löscht sein Repository und klont neu
    answer: 0
    explanation: Erst integrieren, dann pushen. --force würde Annas Arbeit im Remote überschreiben.
  - type: find-bug
    question: Ben hat einen Konflikt gelöst und committet. Welche Zeile hätte nie im Commit landen dürfen?
    language: text
    code: |
      Öffnungszeiten
      <<<<<<< HEAD
      Mo–Sa 9–18 Uhr
      Telefon: 0123 456789
    bug_line: 2
    explanation: Konfliktmarker wie `<<<<<<<`, `=======` und `>>>>>>>` müssen beim Lösen vollständig entfernt werden.
  - type: multiple
    question: Wie beugt ein Team Merge-Konflikten vor? (mehrere Antworten)
    options:
      - Kleine Pull Requests und kurze Branches
      - Täglich den aktuellen main-Stand in den eigenen Branch holen
      - Absprechen, wenn zwei Personen an derselben Datei arbeiten
      - Möglichst selten pushen
    answers: [0, 1, 2]
    explanation: Konflikte wachsen mit der Zeit, die Branches getrennt sind. Selten pushen macht sie größer, nicht kleiner.
  - type: cloze
    text: Musst du einen eigenen, bereits gepushten Branch nach einem Rebase überschreiben, nutzt du `git push ___` statt `--force`.
    blanks:
      - [--force-with-lease]
    explanation: "`--force-with-lease` bricht ab, wenn inzwischen jemand anderes auf den Branch gepusht hat – so überschreibst du keine fremde Arbeit."
tasks:
  - id: remote-beschriften
    type: diagram
    title: Wer arbeitet wo?
    description: Beschrifte das Diagramm. Es zeigt ein Team aus zwei Personen, das über ein gemeinsames Remote zusammenarbeitet.
    image: /assets/teamarbeit/zwei-klone-leer.svg
    slots:
      - { x: 50, y: 25, answer: Remote (Bare-Repository) }
      - { x: 19, y: 77, answer: Klon von Person A }
      - { x: 81, y: 77, answer: Klon von Person B }
    distractors: [Staging-Bereich, Feature-Flag]
    hints:
      - Das Remote liegt in der Mitte und hat kein Arbeitsverzeichnis.
  - id: konflikt-zu-zweit
    type: terminal
    title: Einen Konflikt zu zweit lösen
    description: |
      Im Ordner `m3-konflikt` simulierst du ein Team: `origin.git` ist das Remote, `anna` und `ben` sind
      zwei Klone. Beide haben die Öffnungszeiten in `oeffnungszeiten.txt` geändert:

      - Anna hat „bis 18 Uhr“ eingetragen und **schon gepusht**.
      - Ben hat „auch samstags“ eingetragen und committet, aber noch nicht gepusht.

      Du bist Ben:

      1. Wechsle in den Ordner `ben` und hole Annas Stand mit `git pull`. Es entsteht ein Konflikt.
      2. Löse ihn so, dass **beide** Informationen erhalten bleiben: `Mo–Sa 9–18 Uhr`.
      3. Schließe den Merge mit einem Commit ab und pushe nach `origin`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: m3-konflikt
    setup: |
      git init -q --bare -b main origin.git
      git clone -q origin.git anna 2>/dev/null
      cd anna
      git config user.name "Anna"
      git config user.email "anna@example.com"
      printf 'Öffnungszeiten\nMo–Fr 9–17 Uhr\n' > oeffnungszeiten.txt
      git add . && git commit -q -m "docs: add opening hours"
      git push -q origin main
      cd ..
      git clone -q origin.git ben
      cd ben
      git config user.name "Ben"
      git config user.email "ben@example.com"
      git config pull.rebase false
      cd ../anna
      printf 'Öffnungszeiten\nMo–Fr 9–18 Uhr\n' > oeffnungszeiten.txt
      git commit -q -am "docs(SHOP-20): open until 6 pm"
      git push -q origin main
      cd ../ben
      printf 'Öffnungszeiten\nMo–Sa 9–17 Uhr\n' > oeffnungszeiten.txt
      git commit -q -am "docs(SHOP-21): open on saturdays"
    checks:
      - type: command
        run: git -C origin.git show main:oeffnungszeiten.txt | grep -cE "^(<<<<<<<|=======|>>>>>>>)"
        expect_exit: 1
        message: Im Remote stehen noch Konfliktmarker in oeffnungszeiten.txt – oder du hast noch nicht gepusht.
      - type: command
        run: git -C origin.git show main:oeffnungszeiten.txt
        stdout_matches: "^Mo–Sa 9–18 Uhr$"
        message: Im Remote soll die Zeile `Mo–Sa 9–18 Uhr` stehen – mit Annas und Bens Änderung.
      - type: command
        run: git -C origin.git log --format=%s main | grep -cE "SHOP-2[01]"
        stdout_matches: "^\\s*2\\s*$"
        message: Im Remote müssen die Commits von Anna (SHOP-20) und Ben (SHOP-21) enthalten sein.
      - type: command
        run: git -C origin.git rev-list --merges --count main
        stdout_matches: "^\\s*[1-9]\\s*$"
        message: Im Remote fehlt der Merge-Commit. Schließe den Merge mit `git commit` ab und pushe.
      - type: command
        run: git -C ben status --porcelain | wc -l
        stdout_matches: "^\\s*0\\s*$"
        message: In Bens Klon gibt es noch offene Änderungen. Hast du die gelöste Datei mit git add vorgemerkt und committet?
    hints:
      - "Nach `git pull` zeigt `git status`, welche Datei im Konflikt steht."
      - "Öffne die Datei (z. B. mit nano), entferne die Zeilen mit `<<<<<<<`, `=======` und `>>>>>>>` und lass nur `Mo–Sa 9–18 Uhr` stehen."
      - "Danach: `git add oeffnungszeiten.txt`, `git commit --no-edit`, `git push`."
    solution: |
      ```bash
      cd m3-konflikt
      cd ben
      git pull
      printf 'Öffnungszeiten\nMo–Sa 9–18 Uhr\n' > oeffnungszeiten.txt
      git add oeffnungszeiten.txt
      git commit --no-edit
      git push
      ```
---

Anna und Ben haben gleichzeitig dieselbe Zeile geändert. Anna war schneller mit dem Push. Ben bekommt eine
Fehlermeldung und kurz darauf seinen ersten [[merge-konflikt|Merge-Konflikt]] im Team. Das ist kein Unfall,
sondern Alltag – und mit dem richtigen Vorgehen in wenigen Minuten erledigt.

![Zwei Personen arbeiten über ein gemeinsames Remote zusammen](/assets/teamarbeit/zwei-klone.svg)

## Warum Konflikte im Team entstehen

Jede Person arbeitet in einem eigenen [[clone|Klon]]. Das gemeinsame [[remote]] – oft ein
[[bare-repository|Bare-Repository]] ohne Arbeitsverzeichnis – sammelt die Stände. Git führt Änderungen
automatisch zusammen, solange sie verschiedene Stellen betreffen. Nur wenn zwei Personen **dieselbe Zeile**
unterschiedlich ändern, kann Git nicht entscheiden. Dann fragt es dich.

```text title="Ben will pushen"
! [rejected]        main -> main (fetch first)
hint: Updates were rejected because the remote contains work that you do not have locally.
```

> [!MERKSATZ]
> Ein Konflikt ist keine Fehlfunktion. Git sagt nur: „Hier haben zwei Menschen unterschiedlich entschieden –
> bitte entscheide du.“

## Vorbeugen ist billiger als Lösen

Die meisten Konflikte lassen sich vermeiden:

| Maßnahme | Warum sie hilft |
|---|---|
| Kleine Pull Requests, kurze Branches | weniger Zeit, in der Unterschiede wachsen |
| Morgens `git pull` auf `main` | du startest vom aktuellen Stand |
| Täglich `main` in den eigenen Branch holen | Konflikte bleiben klein |
| Absprechen bei gleichen Dateien | „Ich baue gerade die Preisklasse um“ im Team-Chat |
| Automatischer Formatter | keine Konflikte durch Leerzeichen und Einrückung |

## Einen Konflikt lösen

Läuft `git pull` in einen Konflikt, markiert Git die Stelle mit [[konfliktmarker|Konfliktmarkern]]:

```text title="oeffnungszeiten.txt während des Konflikts"
Öffnungszeiten
<<<<<<< HEAD
Mo–Sa 9–17 Uhr
=======
Mo–Fr 9–18 Uhr
>>>>>>> 3f2a1c9…
```

Oben steht deine Version (`HEAD`), unten die eingehende. So gehst du vor:

Wichtig: Ein Konflikt betrifft immer zwei Menschen. Die andere Person hat ihre Änderung aus gutem Grund gemacht – vielleicht wegen eines Tickets, das du nicht kennst. Nimm dir deshalb Zeit, beide Seiten zu verstehen, bevor du entscheidest.

1. **Verstehen:** Was wollte die andere Person? Lies ihren Commit mit `git log --merge -p`.
2. **Entscheiden:** Oft ist die richtige Lösung eine Kombination – hier `Mo–Sa 9–18 Uhr`.
3. **Marker entfernen**, Datei speichern, mit `git add` als gelöst markieren.
4. **Testen**, dann `git commit` und `git push`.

> [!FEHLER]
> **Einfach die eigene Version nehmen.** Wer bei jedem Konflikt „meine Seite“ wählt, löscht stillschweigend
> die Arbeit der Kollegin. Bist du unsicher, frag sie – eine Nachricht kostet weniger als ein verlorenes
> Feature.

## Merge oder Rebase – und niemals blind forcen

Deinen Feature-Branch kannst du per [[merge]] oder [[rebase]] auf den neuesten Stand bringen. Wichtig ist,
was ihr im Team vereinbart habt. Eine Regel gilt aber immer: Geteilte Branches wie `main` werden nie mit
`--force` überschrieben.

Hast du deinen **eigenen** Branch nach einem Rebase umgeschrieben, nutze `--force-with-lease`. Es bricht ab,
falls inzwischen jemand anderes darauf gepusht hat.

```bash title="Eigenen Branch aktualisieren"
git fetch
git rebase origin/main
git push --force-with-lease
```

> [!PRAXIS]
> Bei großen Konflikten lösen erfahrene Teams sie zu zweit: Beide Autor:innen setzen sich zusammen oder
> teilen den Bildschirm. Wer die Änderung geschrieben hat, weiß am besten, was erhalten bleiben muss.

## Zusammenfassung

- Konflikte entstehen, wenn zwei Personen dieselbe Stelle unterschiedlich ändern.
- Kleine PRs, regelmäßiges Integrieren und Absprachen beugen Konflikten vor.
- Lösen: verstehen, kombinieren, Marker entfernen, `git add`, testen, committen, pushen.
- Im Zweifel die andere Person fragen statt ihre Arbeit zu überschreiben.
- Geteilte Branches nie mit `--force`; für den eigenen Branch `--force-with-lease`.
