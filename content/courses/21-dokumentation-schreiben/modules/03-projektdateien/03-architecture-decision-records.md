---
title: Architecture Decision Records
summary: Wichtige Entscheidungen mit Kontext, Entscheidung und Konsequenzen festhalten – damit das Warum nicht verloren geht.
duration: 25
sources:
  - title: Michael Nygard – Documenting Architecture Decisions
    url: https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
  - title: adr.github.io – Architectural Decision Records
    url: https://adr.github.io/
  - title: MADR – Markdown Architectural Decision Records
    url: https://adr.github.io/madr/
quiz:
  - type: single
    question: Was ist der Hauptzweck eines Architecture Decision Records?
    options:
      - Er ersetzt die README.
      - Er hält fest, warum eine wichtige Entscheidung so getroffen wurde – mit Kontext und Folgen.
      - Er listet alle Änderungen einer Version auf.
      - Er beschreibt, wie man das Projekt installiert.
    answer: 1
    explanation: >
      Ein ADR beantwortet später die Frage „Warum ist das so?“. Ohne ihn diskutiert das Team dieselbe
      Entscheidung immer wieder – oder macht sie aus Unwissen rückgängig.
  - type: match
    question: Ordne jedem Abschnitt eines ADR seinen Inhalt zu.
    pairs:
      - { left: "Status", right: "Vorgeschlagen, akzeptiert, abgelöst …" }
      - { left: "Kontext", right: "Die Lage und die Kräfte, die zur Entscheidung drängen" }
      - { left: "Entscheidung", right: "Was das Team tun wird, in aktiver Sprache" }
      - { left: "Konsequenzen", right: "Was danach leichter und was schwerer wird" }
    explanation: Das ist das klassische Schema von Michael Nygard. Viele Vorlagen ergänzen noch betrachtete Alternativen.
  - type: multiple
    question: Was stimmt über ADRs?
    options:
      - Ein akzeptierter ADR wird nicht nachträglich umgeschrieben.
      - Ändert sich die Entscheidung, schreibst du einen neuen ADR, der den alten ablöst.
      - ADRs werden fortlaufend nummeriert, z. B. 0001, 0002.
      - Jede kleine Entscheidung, etwa ein Variablenname, braucht einen ADR.
    answers: [0, 1, 2]
    explanation: >
      ADRs sind ein Tagebuch der wichtigen Entscheidungen. Kleinigkeiten gehören in den Code-Review oder einen
      Kommentar, nicht in einen ADR.
  - type: cloze
    text: ADRs liegen oft im Ordner `docs/___`. Wird ein ADR durch einen neuen ersetzt, bekommt er den Status ___.
    blanks:
      - [adr, adr/, decisions, decisions/]
      - [Abgelöst, Superseded, ersetzt, Ersetzt]
    explanation: Der alte ADR bleibt erhalten, damit die Geschichte nachvollziehbar ist – nur sein Status zeigt auf den Nachfolger.
tasks:
  - id: adr-oder-nicht
    type: steps
    title: Braucht das einen ADR?
    description: Entscheide für jede Situation, ob ein Architecture Decision Record angebracht ist.
    steps:
      - situation: Das Team entscheidet, Nutzerdaten künftig in PostgreSQL statt in MongoDB zu speichern.
        question: ADR oder nicht?
        options:
          - Ja – die Entscheidung ist schwer umkehrbar und betrifft das ganze Projekt.
          - Nein – das steht doch im Code.
        answer: 0
        explanation: Eine Datenbank wechselt man nicht nebenbei. Später will jemand wissen, warum – genau dafür ist der ADR da.
      - situation: In einem Pull Request wird die Variable `tmp` in `pendingOrders` umbenannt.
        question: ADR oder nicht?
        options:
          - Ja – jede Änderung braucht einen ADR.
          - Nein – das ist eine kleine, leicht umkehrbare Änderung.
        answer: 1
        explanation: ADRs sind für wichtige, schwer umkehrbare Entscheidungen. Für Namen reicht der Code-Review.
      - situation: Das Team beschließt, alle Hintergrundaufgaben über eine Warteschlange statt direkt im Request zu erledigen.
        question: ADR oder nicht?
        options:
          - Ja – das ändert die Architektur und hat Folgen für Betrieb und Fehlersuche.
          - Nein – das ist ein Implementierungsdetail.
        answer: 0
        explanation: Eine Warteschlange bringt neue Infrastruktur, neue Fehlerquellen und neue Abläufe. Das Warum gehört festgehalten.
      - situation: Ein Jahr später stellt sich heraus, dass die Warteschlange zu teuer ist. Das Team kehrt zum alten Weg zurück.
        question: Was passiert mit dem bestehenden ADR?
        options:
          - Er wird gelöscht.
          - Er wird umgeschrieben, als hätte es die Warteschlange nie gegeben.
          - Ein neuer ADR beschreibt die neue Entscheidung, der alte bekommt den Status „Abgelöst durch …“.
        answer: 2
        explanation: Die Historie bleibt erhalten. Gerade das Scheitern einer Entscheidung ist wertvolles Wissen.
  - id: adr-schreiben
    type: terminal
    title: Einen ADR schreiben und den alten ablösen
    description: |
      Im Ordner `adr-schreiben` liegt ein Projekt mit dem ADR `docs/adr/0001-sqlite-als-datenbank.md`. Inzwischen
      nutzen mehrere Personen die App gleichzeitig, und SQLite stößt an Grenzen. Das Team hat entschieden, auf
      PostgreSQL umzusteigen.

      1. Lies den bestehenden ADR: `cat docs/adr/0001-sqlite-als-datenbank.md`.
      2. Lege `docs/adr/0002-postgresql-statt-sqlite.md` an. Erste Zeile: `# 2. PostgreSQL statt SQLite`.
      3. Er braucht die Abschnitte `## Status` (mit „Akzeptiert“), `## Kontext`, `## Entscheidung` und
         `## Konsequenzen` – jeder mit mindestens einer Zeile Text.
      4. Erwähne im Status, dass er ADR 0001 ablöst (z. B. „Akzeptiert, löst ADR 0001 ab“).
      5. Ändere in ADR 0001 **nur** den Status auf „Abgelöst durch ADR 0002“. Der restliche Inhalt bleibt unverändert.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit das Projekt angelegt wird.
    workdir: adr-schreiben
    setup: |
      mkdir -p docs/adr
      cat > docs/adr/0001-sqlite-als-datenbank.md <<'EOF'
      # 1. SQLite als Datenbank

      ## Status

      Akzeptiert

      ## Kontext

      Die App läuft auf einem einzelnen Rechner und wird von einer Person benutzt. Wir wollen keinen eigenen
      Datenbankserver betreiben.

      ## Entscheidung

      Wir speichern alle Daten in einer SQLite-Datei.

      ## Konsequenzen

      Die Einrichtung ist trivial und Backups sind eine Dateikopie. Gleichzeitige Schreibzugriffe vieler
      Nutzer:innen sind damit nicht möglich.
      EOF
    checks:
      - type: command
        run: head -n 1 docs/adr/0002-postgresql-statt-sqlite.md
        stdout_matches: "^# 2\\. PostgreSQL statt SQLite\\s*$"
        message: "docs/adr/0002-postgresql-statt-sqlite.md fehlt oder beginnt nicht mit `# 2. PostgreSQL statt SQLite`."
      - type: command
        run: |
          f=docs/adr/0002-postgresql-statt-sqlite.md
          for s in Status Kontext Entscheidung Konsequenzen; do
            n=$(awk -v s="## $s" '$0 ~ "^"s"[[:space:]]*$" {f=1;next} /^## /{f=0} f && NF' "$f" | wc -l)
            [ "$n" -ge 1 ] || echo "leer oder fehlt: $s"
          done
        stdout_equals: ""
        message: "ADR 0002 braucht die Abschnitte `## Status`, `## Kontext`, `## Entscheidung` und `## Konsequenzen` – jeder mit Text darunter."
      - type: command
        run: awk '/^## Status/{f=1;next} /^## /{f=0} f' docs/adr/0002-postgresql-statt-sqlite.md | grep -iE 'akzeptiert|accepted' | grep -c '0001'
        stdout_matches: "^[1-9]"
        message: "Im Status von ADR 0002 soll stehen, dass er akzeptiert ist und ADR 0001 ablöst, z. B. „Akzeptiert, löst ADR 0001 ab“."
      - type: command
        run: awk '/^## Status/{f=1;next} /^## /{f=0} f' docs/adr/0001-sqlite-als-datenbank.md | grep -iE 'abgelöst|ersetzt|superseded' | grep -c '0002'
        stdout_matches: "^[1-9]"
        message: "Setze den Status von ADR 0001 auf „Abgelöst durch ADR 0002“."
      - type: command
        run: grep -c 'Wir speichern alle Daten in einer SQLite-Datei.' docs/adr/0001-sqlite-als-datenbank.md
        stdout_equals: "1"
        message: Der Inhalt von ADR 0001 soll unverändert bleiben – nur der Status ändert sich. Die alte Entscheidung muss weiter darin stehen.
    hints:
      - "Kopiere die Struktur: `cp docs/adr/0001-sqlite-als-datenbank.md docs/adr/0002-postgresql-statt-sqlite.md` und ändere dann den Inhalt."
      - "Im Kontext beschreibst du, was sich geändert hat (mehrere gleichzeitige Nutzer:innen), in den Konsequenzen, was leichter und was schwerer wird (z. B. eigener Datenbankserver nötig)."
      - "Für ADR 0001: `sed -i 's/^Akzeptiert$/Abgelöst durch ADR 0002/' docs/adr/0001-sqlite-als-datenbank.md`."
    solution: |
      ```bash
      cd adr-schreiben
      cat > docs/adr/0002-postgresql-statt-sqlite.md <<'EOF'
      # 2. PostgreSQL statt SQLite

      ## Status

      Akzeptiert, löst ADR 0001 ab

      ## Kontext

      Die App wird inzwischen von mehreren Personen gleichzeitig genutzt. SQLite sperrt bei Schreibzugriffen
      die ganze Datei, dadurch kommt es zu Wartezeiten und Fehlern.

      ## Entscheidung

      Wir speichern alle Daten in PostgreSQL 18.

      ## Konsequenzen

      Viele gleichzeitige Schreibzugriffe sind möglich. Dafür brauchen wir einen Datenbankserver, Backups und
      ein Migrationsskript für die bestehenden Daten.
      EOF
      sed -i 's/^Akzeptiert$/Abgelöst durch ADR 0002/' docs/adr/0001-sqlite-als-datenbank.md
      ```
---
Ein neues Teammitglied fragt: „Warum benutzen wir eigentlich eine Warteschlange für E-Mails? Das ist doch
umständlich.“ Niemand erinnert sich. Die Person, die es entschieden hat, ist längst weg. Also baut jemand die
Warteschlange aus – und drei Wochen später fällt der Mailversand unter Last wieder aus, genau wie damals.
Ein **Architecture Decision Record** hätte das verhindert.

## Was ist ein ADR?

Ein [[adr|Architecture Decision Record]] (ADR) ist ein kurzes Dokument, das **eine** wichtige Entscheidung
festhält: Was wurde entschieden, warum, und was folgt daraus? ADRs sind [[erklaerung-doku|Erklärungen]] im Sinne
von Diátaxis – sie beantworten das Warum.

Wann lohnt sich ein ADR? Faustregel: Wenn die Entscheidung

- **schwer umkehrbar** ist (Datenbank, Framework, Programmiersprache),
- **mehrere Teile** des Systems betrifft (Authentifizierung, Kommunikation zwischen Diensten),
- oder **umstritten** war und Alternativen ernsthaft diskutiert wurden.

Kleine Dinge wie Variablennamen oder die Wahl einer Hilfsfunktion brauchen keinen ADR.

> [!MERKSATZ]
> Ein ADR hält **eine** wichtige Entscheidung mit ihrem **Warum** fest – so kurz, dass man ihn in fünf Minuten liest.

## Der Aufbau: Kontext, Entscheidung, Konsequenzen

Das bekannteste Schema stammt von Michael Nygard und hat fünf Teile:

| Abschnitt | Inhalt |
|---|---|
| Titel | Nummer und kurze Beschreibung: „3. Warteschlange für E-Mails“ |
| Status | Vorgeschlagen, Akzeptiert, Abgelöst, Veraltet |
| Kontext | Die Lage: Welches Problem, welche Rahmenbedingungen, welche Kräfte? |
| Entscheidung | Was das Team tun wird – aktiv formuliert: „Wir verschicken …“ |
| Konsequenzen | Was danach leichter **und** was schwerer wird |

Die Konsequenzen sind der ehrlichste Teil. Jede Entscheidung hat Nachteile. Wer sie aufschreibt, zeigt, dass
sie bewusst in Kauf genommen wurden.

Erweiterte Vorlagen wie [MADR](https://adr.github.io/madr/) ergänzen einen Abschnitt mit den **betrachteten
Alternativen** und warum sie verworfen wurden.

## Ein Beispiel

```markdown title="docs/adr/0003-warteschlange-fuer-e-mails.md"
# 3. Warteschlange für E-Mails

## Status

Akzeptiert

## Kontext

Beim Newsletter-Versand schickt der Server 10 000 E-Mails im Request.
Der Request bricht nach 30 Sekunden ab, und ein Teil der Mails fehlt.

## Entscheidung

Wir legen jede E-Mail als Auftrag in eine Warteschlange.
Ein Hintergrund-Worker verschickt die Aufträge nacheinander.

## Konsequenzen

Der Request antwortet sofort, und fehlgeschlagene Mails werden erneut versucht.
Dafür müssen wir den Worker betreiben und überwachen.
```

> [!FEHLER]
> Ein Kontext wie „Wir brauchten eine bessere Lösung.“ Besser ist konkret: Zahlen, Fehlermeldungen,
> Einschränkungen. Nur so kann man später beurteilen, ob die Gründe noch gelten.

## Nummern, Ablage und Lebenszyklus

ADRs liegen im Repository, meist in `docs/adr/` oder `docs/decisions/`. Sie werden **fortlaufend nummeriert**:
`0001-…`, `0002-…`. Die Nummer wird nie neu vergeben.

![Lebenszyklus eines ADR: vorgeschlagen, akzeptiert, abgelöst oder veraltet](/assets/dokumentation-schreiben/adr-lebenszyklus.svg)

Das Wichtigste: Ein akzeptierter ADR wird **nicht umgeschrieben**. Ändert sich die Entscheidung, schreibst du
einen **neuen** ADR. Im alten änderst du nur den Status:

```markdown
## Status

Abgelöst durch ADR 0007
```

So bleibt die Geschichte nachvollziehbar: Man sieht, was damals galt, warum es galt und warum es sich geändert hat.

## ADRs im Team-Alltag

Weil ADRs Markdown-Dateien im Repository sind, laufen sie durch denselben Prozess wie Code:

1. Jemand schreibt einen ADR mit Status „Vorgeschlagen“ und öffnet einen [[pull-request|Pull Request]].
2. Das Team diskutiert im Review – Einwände und Alternativen landen direkt im Text.
3. Nach der Einigung wird der Status „Akzeptiert“, und der Pull Request wird gemergt.

> [!PRAXIS]
> In größeren Projekten verlinkt man ADRs im Code dort, wo die Entscheidung sichtbar wird – etwa als kurzer
> Kommentar über der Konfiguration der Warteschlange: „Siehe docs/adr/0003“.

## Zusammenfassung

- Ein **ADR** hält eine wichtige, schwer umkehrbare Entscheidung fest.
- Aufbau: **Titel, Status, Kontext, Entscheidung, Konsequenzen** – Konsequenzen mit Vor- und Nachteilen.
- ADRs liegen in `docs/adr/` und sind fortlaufend nummeriert.
- Akzeptierte ADRs werden nicht umgeschrieben; ein neuer ADR **löst** den alten **ab**.
- ADRs werden wie Code im Pull Request vorgeschlagen und reviewt.
