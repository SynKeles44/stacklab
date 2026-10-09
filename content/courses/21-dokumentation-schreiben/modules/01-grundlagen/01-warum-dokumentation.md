---
title: Warum Dokumentation?
summary: Welche Probleme gute Dokumentation löst – vom Onboarding über den Bus-Faktor bis zu deinem zukünftigen Ich.
duration: 20
sources:
  - title: Write the Docs – Documentation Guide
    url: https://www.writethedocs.org/guide/
  - title: GitHub Docs – Über README-Dateien
    url: https://docs.github.com/de/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes
quiz:
  - type: single
    question: Was beschreibt der Bus-Faktor eines Projekts?
    options:
      - Wie viele Menschen das Projekt täglich benutzen.
      - Wie viele Personen ausfallen müssten, bis niemand mehr weiß, wie das Projekt funktioniert.
      - Wie schnell ein Server auf Anfragen antwortet.
      - Wie viele Branches gleichzeitig offen sind.
    answer: 1
    explanation: >
      Der Bus-Faktor zählt die Personen, deren Ausfall das Projekt lahmlegt. Ein Bus-Faktor von 1 heißt:
      Fällt eine Person aus, ist das Wissen weg. Dokumentation erhöht den Bus-Faktor, weil das Wissen nicht
      mehr nur in Köpfen steckt.
  - type: multiple
    question: Welche Aussagen über Dokumentation stimmen?
    options:
      - Code zeigt, was passiert – aber selten, warum es so gebaut wurde.
      - Gute Dokumentation verkürzt das Onboarding neuer Teammitglieder.
      - Dokumentation lohnt sich erst, wenn ein Projekt fertig ist.
      - Die wichtigste Leserin deiner Doku bist oft du selbst in sechs Monaten.
    answers: [0, 1, 3]
    explanation: >
      Doku entsteht am besten während der Arbeit, nicht am Ende – dann ist das Wissen noch frisch. Ein
      „fertiges“ Projekt gibt es in der Softwareentwicklung ohnehin selten.
  - type: cloze
    text: Der Prozess, in dem ein neues Teammitglied arbeitsfähig wird, heißt ___. Die Einstiegsdatei eines Repositorys heißt ___.
    blanks:
      - [Onboarding]
      - [README, README.md, Readme]
    explanation: Die README ist die Visitenkarte des Repositorys und der erste Schritt im Onboarding.
  - type: match
    question: Ordne jeder Frage die Stelle zu, an der die Antwort am besten aufgehoben ist.
    pairs:
      - { left: "Wie starte ich das Projekt?", right: "README.md" }
      - { left: "Was hat sich in Version 2.1 geändert?", right: "CHANGELOG.md" }
      - { left: "Warum diese merkwürdige Zeile im Code?", right: "Kommentar direkt an der Zeile" }
      - { left: "Warum nutzen wir PostgreSQL statt MySQL?", right: "Architecture Decision Record" }
    explanation: >
      Jede Information hat einen natürlichen Ort. Wer weiß, wo was steht, findet es in Sekunden – genau das
      ist das Ziel guter Dokumentation.
tasks:
  - id: ohne-doku
    type: steps
    title: Ein Montag ohne Dokumentation
    description: Spiel eine typische Situation aus dem Berufsalltag durch und entscheide, was passiert.
    steps:
      - situation: >
          Du startest in einem neuen Team. Das Projekt hat keine README. Dein Kollege, der alles eingerichtet
          hat, ist zwei Wochen im Urlaub.
        question: Wie lange dauert es wahrscheinlich, bis du das Projekt lokal startest?
        options:
          - Fünf Minuten – das Terminal verrät alles Nötige.
          - Stunden oder Tage – du rätst Befehle, Versionen und Einstellungen zusammen.
          - Gar nicht – ohne README startet kein Projekt.
        answer: 1
        explanation: Ohne Doku musst du jede Information selbst ausgraben. Genau dieses Wissen hätte in fünf Zeilen README gepasst.
      - situation: >
          Du findest im Code die Zeile `sleep(2)` vor einem Datenbankaufruf. Kein Kommentar, die Commit-Message
          lautet „fix“.
        question: Was ist die sicherste Entscheidung?
        options:
          - Die Zeile löschen, sie macht das Programm nur langsamer.
          - Die Zeile stehen lassen und herausfinden, warum sie existiert – und das Ergebnis aufschreiben.
          - Die Wartezeit auf 10 Sekunden erhöhen, sicher ist sicher.
        answer: 1
        explanation: >
          Vielleicht umgeht die Zeile einen echten Fehler, vielleicht ist sie Unsinn. Ohne dokumentiertes Warum
          weiß das niemand – und jede Änderung wird zum Risiko.
      - situation: >
          Nach einem halben Jahr öffnest du dein eigenes Projekt wieder. Du hattest damals eine kurze README
          mit „Schnellstart“ und eine Notiz, warum du SQLite gewählt hast.
        question: Was passiert?
        options:
          - Du bist nach wenigen Minuten wieder drin und verstehst deine alten Entscheidungen.
          - Du musst trotzdem alles neu lernen.
        answer: 0
        explanation: Doku ist ein Brief an dein zukünftiges Ich. Fünf Minuten Schreiben sparen dir später Stunden.
  - id: erste-readme
    type: terminal
    title: Deine erste Mini-Dokumentation
    description: |
      Im Ordner `erste-doku` liegt das Skript `backup.sh`. Es kopiert einen Ordner in ein Backup-Verzeichnis –
      aber niemand weiß, wie man es benutzt. Ändere das.

      1. Schau dir das Skript an: `cat backup.sh`.
      2. Lege eine Datei `README.md` an. Die erste Zeile ist die Überschrift `# backup`.
      3. Schreibe darunter einen Satz, was das Skript tut (das Wort „Backup“ soll vorkommen).
      4. Füge einen Abschnitt `## Benutzung` hinzu, in dem der Aufruf `bash backup.sh <quelle> <ziel>` steht.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit das Skript angelegt wird.
    workdir: erste-doku
    setup: |
      cat > backup.sh <<'EOF'
      #!/usr/bin/env bash
      set -euo pipefail
      quelle="$1"
      ziel="$2"
      stempel=$(date +%Y-%m-%d)
      mkdir -p "$ziel"
      cp -r "$quelle" "$ziel/$(basename "$quelle")-$stempel"
      echo "Backup von $quelle nach $ziel erstellt."
      EOF
    checks:
      - type: file_exists
        path: README.md
        message: Es gibt noch keine Datei README.md im Ordner erste-doku.
      - type: command
        run: head -n 1 README.md
        stdout_matches: "^#\\s+backup\\s*$"
        message: "Die erste Zeile von README.md soll die Überschrift `# backup` sein."
      - type: file_contains
        path: README.md
        pattern: "[Bb]ackup.*([Kk]opier|[Ss]icher|[Ee]rstell)|([Kk]opier|[Ss]icher|[Ee]rstell).*[Bb]ackup"
        message: Beschreibe in einem Satz, was das Skript tut – zum Beispiel „Erstellt ein Backup eines Ordners“.
      - type: file_contains
        path: README.md
        pattern: "^##\\s+Benutzung"
        message: "Es fehlt der Abschnitt `## Benutzung`."
      - type: file_contains
        path: README.md
        pattern: "bash backup\\.sh"
        message: "Zeig im Abschnitt Benutzung den Aufruf, z. B. `bash backup.sh <quelle> <ziel>`."
    hints:
      - Mit `nano README.md` öffnest du einen Editor im Terminal. Speichern mit Strg+O, Beenden mit Strg+X.
      - "Eine Überschrift beginnt mit `#` und einem Leerzeichen, ein Unterabschnitt mit `##`."
      - "Schneller geht es mit `printf '# backup\\n\\nErstellt ein Backup eines Ordners.\\n\\n## Benutzung\\n\\nbash backup.sh <quelle> <ziel>\\n' > README.md`."
    solution: |
      ```bash
      cd erste-doku
      cat backup.sh
      cat > README.md <<'EOF'
      # backup

      Erstellt ein Backup eines Ordners mit dem heutigen Datum im Namen.

      ## Benutzung

      bash backup.sh <quelle> <ziel>
      EOF
      cat README.md
      ```
---
Du kommst morgens ins Büro, und die Kollegin, die das Abrechnungsmodul gebaut hat, ist für drei Wochen krank.
Ausgerechnet heute bricht der Export ab. Im Code findest du kryptische Funktionen, in der Historie Commits wie
„fix“ und „wip“. Niemand weiß, warum etwas so gebaut ist. Genau hier entscheidet sich, ob ein Team
**Dokumentation** hat – oder nur Code.

## Was ist Dokumentation?

[[dokumentation|Dokumentation]] ist jeder Text, der einem Menschen hilft, Software zu benutzen, zu verstehen
oder zu ändern. Dazu gehören:

| Art | Beispiel |
|---|---|
| Einstieg | Die [[readme|README]] im Repository |
| Anleitungen | „So richtest du die Datenbank ein“ |
| Nachschlagewerk | Liste aller Konfigurationsoptionen |
| Hintergrund | Warum das Team sich für eine Architektur entschieden hat |
| Änderungen | Der [[changelog|Changelog]] mit allen Versionen |
| Im Code | [[kommentar|Kommentare]], die erklären, *warum* eine Zeile nötig ist |

Code beantwortet die Frage **„Was passiert?“**. Er beantwortet fast nie **„Warum?“**, **„Wie fange ich an?“**
oder **„Was darf ich auf keinen Fall ändern?“**. Diese Lücke füllt Dokumentation.

> [!MERKSATZ]
> Code zeigt, **was** ein Programm tut. Dokumentation erklärt, **warum** es so ist und **wie** man damit arbeitet.

## Grund 1: Onboarding

[[onboarding|Onboarding]] heißt: Ein neues Teammitglied wird arbeitsfähig. Ohne Doku läuft das so ab: Die neue
Person fragt alle zehn Minuten nach, und die erfahrenen Leute werden ständig unterbrochen.

Mit guter Doku sieht der erste Tag anders aus:

1. Repository klonen.
2. README lesen: Voraussetzungen, Installation, ein Befehl zum Starten.
3. Projekt läuft – nach einer halben Stunde statt nach zwei Tagen.

Jede Frage, die zweimal gestellt wird, gehört in die Doku. Dann beantwortest du sie einmal für alle.

> [!PRAXIS]
> In vielen Teams ist die erste Aufgabe neuer Kolleg:innen: „Richte das Projekt nach der README ein und
> verbessere alles, was dir unklar war.“ Wer frisch dazukommt, sieht die Lücken am besten.

## Grund 2: Der Bus-Faktor

Der [[bus-faktor|Bus-Faktor]] ist eine etwas makabre Frage: *Wie viele Personen müssten (sprichwörtlich) vom
Bus überfahren werden, bis niemand mehr weiß, wie das Projekt funktioniert?*

- **Bus-Faktor 1:** Nur eine Person kennt das Deployment. Ist sie krank, im Urlaub oder hat gekündigt,
  steht alles still.
- **Bus-Faktor 4:** Vier Leute kennen das Deployment – oder es steht so gut beschrieben in der Doku, dass
  es jede:r im Team kann.

Wissen, das nur in einem Kopf steckt, ist ein Risiko für das ganze Team. Aufgeschriebenes Wissen bleibt,
auch wenn Menschen gehen.

> [!FEHLER]
> „Das weiß doch jeder.“ – Genau dieser Satz verhindert Dokumentation. Er stimmt nur, bis die erste Person
> das Team verlässt oder eine neue dazukommt.

## Grund 3: Dein zukünftiges Ich

Die häufigste Leserin deiner Doku bist **du selbst** – in sechs Monaten. Bis dahin hast du vergessen:

- welchen Befehl du zum Starten brauchtest,
- warum du Bibliothek A statt B genommen hast,
- welche Umgebungsvariable gesetzt sein muss.

Stell dir Dokumentation als **Brief an dein zukünftiges Ich** vor. Fünf Minuten Schreiben heute sparen dir
eine Stunde Rätseln später.

```markdown title="Eine Notiz, die dir später Zeit spart"
## Warum SQLite?

Die App läuft nur auf einem Rechner und speichert wenige tausend Einträge.
Ein eigener Datenbankserver wäre hier Overkill. Wechsel zu PostgreSQL,
sobald mehrere Nutzer gleichzeitig schreiben.
```

## Wann und wie viel?

Doku entsteht am besten **während** der Arbeit, nicht am Ende. Dann ist das Wissen frisch, und die Doku
wird im selben [[pull-request|Pull Request]] wie der Code geprüft. Diese Idee heißt „Docs as Code“ – mehr
dazu im letzten Modul.

Und wie viel? So wenig wie möglich, so viel wie nötig:

- Eine kurze, **aktuelle** README ist besser als ein langes, veraltetes Wiki.
- Veraltete Doku ist gefährlich: Sie führt Menschen zuverlässig in die Irre.
- Schreib zuerst das auf, wonach am häufigsten gefragt wird.

> [!TIPP]
> Im Kurs [[git|Git]] hast du gelernt, gute Commit-Messages zu schreiben. Auch das ist Dokumentation – die
> kleinste Einheit, die es gibt.

## Zusammenfassung

- Dokumentation erklärt das **Warum** und **Wie**, das im Code fehlt.
- Gute Doku verkürzt das **Onboarding** von Tagen auf Stunden.
- Sie erhöht den **Bus-Faktor**: Wissen steckt nicht mehr nur in einzelnen Köpfen.
- Die wichtigste Leserin bist oft **du selbst** in sechs Monaten.
- Schreib Doku **während** der Arbeit – kurz, aktuell und dort, wo man sie sucht.
