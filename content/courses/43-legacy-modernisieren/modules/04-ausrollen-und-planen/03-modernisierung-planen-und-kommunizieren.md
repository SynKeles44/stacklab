---
title: Eine Modernisierung planen und kommunizieren
summary: Wie du entscheidest, wo du anfängst, eine Modernisierung in lieferbare Etappen schneidest und sie so erklärst, dass Management, Fachbereich und Team mitziehen.
duration: 20
sources:
  - title: Martin Fowler – Technical Debt Quadrant
    url: https://martinfowler.com/bliki/TechnicalDebtQuadrant.html
  - title: Git-Dokumentation – git log
    url: https://git-scm.com/docs/git-log
  - title: Architecture Decision Records (adr.github.io)
    url: https://adr.github.io/
quiz:
  - type: single
    question: Welche Stellen einer Altanwendung modernisierst du zuerst?
    options:
      - Die ältesten Dateien.
      - Stellen, die oft geändert werden und gleichzeitig schwer verständlich sind.
      - Stellen, die seit Jahren niemand angefasst hat.
      - Alle Dateien in alphabetischer Reihenfolge.
    answer: 1
    explanation: >
      Hässlicher Code, den nie jemand ändert, kostet fast nichts. Teuer sind Hotspots: häufig geänderte und
      gleichzeitig komplizierte Stellen. Dort bringt jede Verbesserung sofort Nutzen.
  - type: multiple
    question: Was macht eine gute Etappe in einem Modernisierungsplan aus?
    options:
      - Sie ist einzeln auslieferbar und bringt für sich schon Nutzen.
      - Sie hat ein überprüfbares Ergebnis, z. B. „Preisseite läuft über neuen Code, alte Datei gelöscht“.
      - Sie dauert mindestens ein halbes Jahr.
      - Sie lässt sich zurücknehmen, falls etwas schiefgeht.
    answers: [0, 1, 3]
    explanation: >
      Kurze, einzeln lieferbare Etappen halten das Risiko klein und machen Fortschritt sichtbar. Halbjahresetappen
      sind ein Big-Bang-Rewrite in Raten.
  - type: match
    question: Welches Argument überzeugt welche Zielgruppe am ehesten?
    pairs:
      - { left: "Geschäftsführung", right: "Risiko eines Ausfalls und Kosten jeder Änderung sinken" }
      - { left: "Fachbereich", right: "Neue Rabattaktionen gehen in Tagen statt Wochen live" }
      - { left: "Entwicklungsteam", right: "Weniger Angst vor Änderungen, moderne Werkzeuge, weniger nächtliche Notfälle" }
      - { left: "Sicherheitsbeauftragte", right: "Unterstützte PHP-Version und geschlossene SQL-Injection" }
    explanation: Dieselbe Modernisierung, vier Perspektiven. Erkläre den Nutzen in der Sprache der Zuhörenden.
  - type: cloze
    text: "Häufig geänderte Dateien findest du mit `git ___ --format= --name-only | sort | uniq -c | sort -rn | head`. Wichtige Architekturentscheidungen hältst du in einem ___ fest."
    blanks:
      - [log]
      - [ADR, Architecture Decision Record]
    explanation: Die Änderungshäufigkeit steht in der Git-Historie. Ein ADR dokumentiert, warum ihr euch für einen Weg entschieden habt.
tasks:
  - id: plan-etappen
    type: dragdrop
    title: Gute Etappe oder Big Bang in Raten?
    description: Ein Team hat Etappen für die Modernisierung der Gemüsekiste vorgeschlagen. Ordne jede Etappe ein.
    targets:
      - { id: gut, label: Gute Etappe }
      - { id: schlecht, label: Zu groß oder ohne prüfbares Ergebnis }
    items:
      - { label: "Golden Master für alle Seiten anlegen und in der CI-Pipeline ausführen", target: gut }
      - { label: "Preisseite über neuen Code ausliefern, alte Datei löschen", target: gut }
      - { label: "PHP 7.4 → 8.0 mit Rector, Golden Master grün, ausgerollt", target: gut }
      - { label: "Alles auf Laravel umstellen", target: schlecht }
      - { label: "Code allgemein aufräumen", target: schlecht }
      - { label: "Neue Datenbankstruktur entwerfen und am Ende auf einen Schlag migrieren", target: schlecht }
    hints:
      - Kannst du nach der Etappe zeigen, was fertig ist – und ist es einzeln auslieferbar?
  - id: modernisierung-verkaufen
    type: steps
    title: Das Gespräch mit der Geschäftsführung
    description: Du stellst die Modernisierung der Gemüsekiste vor. Wähle jeweils die überzeugendste Antwort.
    steps:
      - situation: >
          Die Geschäftsführerin fragt: „Warum sollen wir Geld in etwas stecken, das heute schon funktioniert?“
        question: Welche Antwort trifft den Kern?
        options:
          - „Der Code ist hässlich und macht keinen Spaß.“
          - „Jede Änderung dauert heute dreimal so lange wie nötig, und die PHP-Version bekommt keine Sicherheitsupdates mehr. Beides kostet uns jeden Monat Geld und erhöht das Ausfallrisiko.“
          - „Alle anderen Firmen nutzen Laravel.“
        answer: 1
        explanation: Argumentiere mit Kosten, Risiko und Geschwindigkeit – nicht mit Geschmack oder Mode.
      - situation: >
          „Gut. Dann macht ihr drei Monate keine neuen Features und schreibt alles neu?“
        question: Was schlägst du vor?
        options:
          - Ja, ein Feature-Stopp ist der einzige Weg.
          - Nein. Wir modernisieren schrittweise mit einem festen Anteil jedes Sprints und liefern Features weiter aus – jede Etappe ist für sich nutzbar.
        answer: 1
        explanation: >
          Ein Feature-Stopp macht die Modernisierung zum Gegner des Geschäfts. Ein fester Anteil (zum Beispiel ein
          Fünftel der Kapazität) hält beides am Laufen.
      - situation: >
          „Woran sehe ich in einem halben Jahr, dass es sich gelohnt hat?“
        question: Welche Messgrößen bietest du an?
        options:
          - Anzahl der geänderten Codezeilen.
          - Durchlaufzeit von Änderungen, Anzahl der Produktionsfehler und Anteil der Routen, die über neuen Code laufen.
        answer: 1
        explanation: >
          Codezeilen sagen nichts über Nutzen. Durchlaufzeit, Fehler und sichtbarer Fortschritt (Routenliste) zeigen,
          ob die Modernisierung wirkt.
---
Du weißt jetzt, **wie** man modernisiert: verstehen, absichern, in kleinen Schritten umbauen, kontrolliert ausrollen.
Offen ist noch: **Wo** fängst du an, wie viel Zeit bekommst du dafür – und wie überzeugst du die Menschen, die das
Budget verantworten? Ohne Plan und gute Kommunikation stirbt die beste Technik im nächsten Prioritäten-Meeting.

## Wo anfangen? Hotspots finden

Nicht jeder hässliche Code ist ein Problem. Teuer ist Code, den ihr **oft ändert** und der **schwer zu verstehen** ist.
Solche Stellen heißen [[hotspot|Hotspots]].

```bash title="Häufig geänderte Dateien des letzten Jahres"
git log --since="1 year ago" --format= --name-only | sort | uniq -c | sort -rn | head
```

```text title="Ausgabe"
     47 inc/functions.php
     31 seiten/bestellungen.php
      4 classes/Bestellung.php
      1 seiten/start.php
```

| | Selten geändert | Oft geändert |
|---|---|---|
| **Einfach** | ignorieren | gut so |
| **Kompliziert** | später, bei Bedarf | **zuerst modernisieren** |

> [!MERKSATZ]
> Modernisiere dort, wo es weh tut: häufig geänderter, schwer verständlicher Code. Perfektion an Stellen, die nie
> jemand anfasst, bringt keinen Nutzen.

## Etappen schneiden

Ein Modernisierungsplan besteht aus Etappen, die jeweils **einzeln auslieferbar** sind und für sich Nutzen bringen.
Für die Gemüsekiste könnte er so aussehen:

| Etappe | Prüfbares Ergebnis |
|---|---|
| 1. Sicherheitsnetz | Golden Master läuft in der CI-Pipeline |
| 2. Sofortmaßnahmen | SQL-Injection geschlossen, Composer eingeführt |
| 3. PHP-Upgrade | Rector-Stufen bis 8.4, ausgerollt |
| 4. Strangler: Preise | Preisseite über neuen Code, alte Datei gelöscht |
| 5. Strangler: Bestellungen | Query Builder, alte Datei gelöscht |
| 6. Neue Preislogik | Schattenbetrieb, dann Umstellung, Flag entfernt |

Jede Etappe endet mit **gelöschtem** Altcode oder einem gemessenen Ergebnis – nicht mit „zu 70 Prozent fertig“.

> [!FEHLER]
> „Etappe 1: alles auf Laravel umstellen.“ Eine Etappe ohne prüfbares Zwischenergebnis ist ein Big-Bang-Rewrite mit
> anderem Namen.

## Entscheidungen festhalten

In einer Modernisierung fallen Entscheidungen, die in einem Jahr niemand mehr nachvollziehen kann: Warum
Illuminate-Komponenten statt eines anderen Frameworks? Warum erst Preise, dann Bestellungen? Halte sie in einem
[[adr|Architecture Decision Record]] fest:

```markdown title="docs/adr/0003-illuminate-database.md"
# 3. Datenzugriff über illuminate/database

Status: angenommen
Kontext: SQL wird in 12 Dateien per Hand gebaut, ein Wechsel zu Laravel ist mittelfristig geplant.
Entscheidung: Neuer Datenzugriff nutzt den Query Builder über Capsule.
Folgen: Composer-Abhängigkeit, späterer Umzug nach Laravel ohne Umschreiben.
```

Dazu gehört eine **Routenliste** (alt, in Arbeit, neu) und eine Liste offener Befunde. Beides zusammen zeigt jederzeit,
wo die Modernisierung steht.

## Kommunizieren: Nutzen in der Sprache der Zuhörenden

Eine Modernisierung braucht Unterstützung von Menschen, die keinen Code lesen. Erkläre sie jeder Gruppe – jedem
[[stakeholder|Stakeholder]] – in ihrer Sprache:

| Zielgruppe | Interessiert sich für | Beispiel-Argument |
|---|---|---|
| Geschäftsführung | Kosten, Risiko | „Ohne Upgrade laufen wir ab Januar ohne Sicherheitsupdates.“ |
| Fachbereich | Tempo, Zuverlässigkeit | „Rabattaktionen gehen in Tagen statt Wochen live.“ |
| Team | Arbeitsalltag | „Kein Bauchweh mehr bei Änderungen an der Preislogik.“ |

Drei Regeln helfen:

- **Kein Feature-Stopp.** Ein fester Anteil jedes Sprints geht in die Modernisierung, Features laufen weiter.
- **Fortschritt sichtbar machen.** Routenliste, Durchlaufzeit von Änderungen, Zahl der Produktionsfehler.
- **Ehrlich über Risiken sprechen.** Datenmigrationen und Umschalttage werden angekündigt, mit Rückfallplan.

> [!PRAXIS]
> Ein kurzes Update alle zwei Wochen („Preisseite läuft seit zehn Tagen im neuen Code, null Abweichungen im
> Schattenbetrieb“) schafft mehr Vertrauen als eine große Präsentation pro Quartal.

## Zusammenfassung

- Starte bei **Hotspots**: oft geänderter, schwer verständlicher Code. Die Git-Historie zeigt die Häufigkeit.
- Schneide **Etappen**, die einzeln auslieferbar sind und ein prüfbares Ergebnis haben.
- Halte Entscheidungen in **ADRs** fest und führe eine Routenliste als Fortschrittsanzeige.
- Erkläre den Nutzen jeder Zielgruppe in **ihrer** Sprache: Kosten, Tempo, Arbeitsalltag.
- Kein Feature-Stopp: Modernisierung bekommt einen festen Anteil jedes Sprints.
- Miss den Erfolg an Durchlaufzeit, Fehlern und gelöschtem Altcode – nicht an Codezeilen.
