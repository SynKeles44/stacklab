---
title: Das richtige Maß – Over-Engineering erkennen
summary: Ein ehrlicher Blick auf die Kosten aller Muster aus diesem Kurs, woran du Over-Engineering erkennst und wie du Architektur schrittweise nachziehst, statt sie vorab zu stapeln.
duration: 20
sources:
  - title: Laravel-Dokumentation – Directory Structure
    url: https://laravel.com/docs/13.x/structure
  - title: Laravel-Dokumentation – Eloquent
    url: https://laravel.com/docs/13.x/eloquent
quiz:
  - type: single
    question: Ein Team startet ein kleines internes Tool mit drei Tabellen. Was ist der sinnvollste Start?
    options:
      - Module, Repositories, DTOs und Events für jede Tabelle, damit es später skaliert.
      - Laravels Standardstruktur; Actions oder Module erst, wenn konkrete Schmerzen auftreten.
      - Microservices, eine pro Tabelle.
      - Gar keine Tests, weil das Tool klein ist.
    answer: 1
    explanation: >
      Muster kosten Zeit, Dateien und Lernaufwand. Sie lohnen sich erst, wenn sie ein echtes Problem lösen.
      Die Standardstruktur lässt sich später gut umbauen – vor allem mit Tests als Sicherheitsnetz.
  - type: multiple
    question: Welche Beobachtungen deuten auf Over-Engineering hin?
    options:
      - Für ein neues Feld musst du sieben Dateien anfassen, die alle nur durchreichen.
      - Ein Interface hat genau eine Implementierung und wird nie im Test ersetzt.
      - Eine Preisregel ist in drei Klassen kopiert.
      - Neue Teammitglieder brauchen Wochen, um zu verstehen, wo eine einfache Abfrage hingehört.
    answers: [0, 1, 3]
    explanation: >
      Durchreich-Schichten, Interfaces ohne zweiten Nutzen und hohe Einarbeitungskosten sind typische
      Zeichen. Kopierte Regeln sind das Gegenteil – dort fehlt Struktur.
  - type: cloze
    text: "Das Prinzip „Du wirst es nicht brauchen“ heißt auf Englisch kurz ___. Die „Rule of ___“ sagt: Abstrahiere erst bei der dritten Wiederholung."
    blanks:
      - [YAGNI]
      - [three, drei, 3]
    explanation: Beide Faustregeln bremsen Abstraktionen auf Vorrat. Erst wenn sich ein Muster wirklich wiederholt, kennst du seine richtige Form.
  - type: match
    question: Ordne jedem Muster die Situation zu, in der es sich lohnt.
    pairs:
      - { left: "Action", right: "Derselbe Anwendungsfall hat mehrere Eingänge" }
      - { left: "Repository", right: "Daten kommen aus mehreren Quellen" }
      - { left: "Domain Event", right: "Mehrere Module reagieren auf dasselbe Geschehen" }
      - { left: "Modul mit Arch-Tests", right: "Mehrere Teams arbeiten an einer Codebasis" }
    explanation: Jedes Muster hat einen Auslöser. Fehlt der Auslöser, fehlt meist auch der Nutzen.
tasks:
  - id: angemessen-oder-zu-viel
    type: dragdrop
    title: Angemessen oder zu viel?
    description: Ordne jede Entscheidung zu – bezogen auf die beschriebene Situation.
    targets:
      - { id: angemessen, label: Angemessen }
      - { id: zuviel, label: Over-Engineering }
    items:
      - { label: "Kontaktformular mit einer Tabelle bekommt Repository, Interface und DTO", target: zuviel }
      - { label: "Rechnungen werden per API, CSV-Import und Nacht-Job angelegt → eine Action", target: angemessen }
      - { label: "Ein Event mit genau einem Listener im selben Modul, nur „für später“", target: zuviel }
      - { label: "SaaS mit vielen Kunden → tenant_id, Global Scope und Zwei-Mandanten-Tests", target: angemessen }
      - { label: "Zwei Entwickler, ein Produkt → sechs Module mit eigenen Service Providern", target: zuviel }
      - { label: "Geld als Money-Value-Object statt als float", target: angemessen }
    hints:
      - Frage bei jedem Punkt, welches konkrete Problem die Entscheidung heute löst.
  - id: schrittweise-wachsen
    type: steps
    title: Architektur nachziehen statt vorstapeln
    description: Begleite eine App, die über drei Jahre wächst, und entscheide an jeder Stelle, was jetzt dran ist.
    steps:
      - situation: >
          Start: Eine Terminbuchung für eine Praxis. Ein Controller pro Ressource, Form Requests, Pest-Tests.
          Ein Kollege schlägt vor, sofort einen modularen Monolithen mit Repositories aufzusetzen.
        question: Was antwortest du?
        options:
          - Gute Idee, dann sind wir vorbereitet.
          - Noch nicht. Wir halten uns an Laravels Standard und schreiben Tests; Struktur ziehen wir nach, wenn es wehtut.
        answer: 1
        explanation: Ohne konkretes Problem weißt du nicht, wo die Grenzen liegen werden. Tests machen den späteren Umbau sicher.
      - situation: >
          Monat 9: Termine werden jetzt auch über eine Partner-API und einen Import gebucht. Die
          Prüfung auf Doppelbuchungen steht in drei Klassen, eine davon ist veraltet.
        question: Was ist der kleinste sinnvolle Schritt?
        options:
          - Eine Action BookAppointment, die alle drei Eingänge nutzen.
          - Die App in Microservices aufteilen.
        answer: 0
        explanation: Der Schmerz ist kopierte Logik. Eine Action löst genau ihn – nicht mehr.
      - situation: >
          Jahr 3: Die App ist ein SaaS für 400 Praxen. Drei Teams arbeiten an Terminen, Abrechnung und
          Statistik und brechen sich regelmäßig gegenseitig den Code.
        question: Was ist jetzt angemessen?
        options:
          - Fachliche Module mit öffentlichen Schnittstellen, Events zwischen den Modulen und Architekturtests.
          - Alles so lassen, Kommunikation per Chat reicht.
        answer: 0
        explanation: Jetzt gibt es das Problem, das Module lösen. Die Tests aus den Jahren davor machen den Umbau beherrschbar.
---
Du hast in diesem Kurs Actions, DTOs, Value Objects, Repositories, Events, Module, Architekturtests,
Mandanten-Scopes und Feature Flags kennengelernt. Die gefährlichste Folge wäre, sie ab morgen **alle
überall** einzusetzen. Diese Lektion ist das ehrliche Gegenstück: Was kosten die Muster, und woran
merkst du, dass es zu viel wird?

## Jedes Muster hat einen Preis

Architektur ist ein Tausch: Du bezahlst heute mit Dateien, Indirektion und Lernaufwand, damit morgen
Änderungen billiger werden. Lohnt sich das nicht, bleibt nur der Preis.

| Muster | Kostet | Lohnt sich, wenn … |
|---|---|---|
| Action | eine Klasse pro Anwendungsfall | ein Ablauf mehrere Eingänge hat oder groß ist |
| DTO | Klasse plus Umwandlung | Daten durch mehrere Schichten wandern |
| Value Object | Klasse, ggf. Cast | ein Wert fachliche Regeln hat (Geld, E-Mail) |
| Repository | Interface plus Implementierung, Eloquent-Features gehen verloren | es mehrere Datenquellen gibt |
| Domain Event | indirekter Ablauf, schwerer zu verfolgen | mehrere Module reagieren sollen |
| Modul + Arch-Tests | Struktur, Provider, Regeln | mehrere Teams, viele hundert Klassen |

[[over-engineering|Over-Engineering]] heißt: Du hast den Preis gezahlt, ohne dass der Auslöser in der
rechten Spalte vorliegt.

> [!MERKSATZ]
> Ein Muster ist eine Antwort. Ohne die passende Frage ist es nur zusätzlicher Code.

## Woran du es erkennst

Typische Warnsignale in großen und kleinen Projekten:

- **Durchreich-Ketten:** Controller → Service → Repository → Model, und jede Schicht ruft nur die nächste
  auf, ohne etwas hinzuzufügen.
- **Interfaces mit genau einer Implementierung**, die auch im Test nie ersetzt wird.
- **Ein neues Feld, sieben Dateien:** Migration, Model, DTO, Mapper, Resource, Interface, Implementierung.
- **Abstraktionen „für später“:** ein generisches Plugin-System für eine Funktion, die es einmal gibt.
- **Lange Einarbeitung** für Dinge, die in Laravels Standard jeder sofort findet.

Das Gegenteil, also zu wenig Struktur, erkennst du an den Symptomen aus Lektion 1.1: kopierte Logik,
riesige Controller, Regeln nur über HTTP testbar.

> [!FEHLER]
> Einen Architektur-Stil aus einem Blogartikel über eine App mit 200 Entwickler:innen auf ein Projekt mit
> zweien übertragen. Was dort Ordnung schafft, ist hier nur Bürokratie.

## Faustregeln, die helfen

- **[[yagni|YAGNI]]** – „You aren't gonna need it“: Baue nichts für Anforderungen, die noch niemand
  gestellt hat.
- **Rule of three:** Einmal schreiben, beim zweiten Mal kopieren und notieren, beim dritten Mal
  abstrahieren. Erst dann kennst du die richtige Form.
- **Laravel-Standard zuerst:** Eloquent, Form Requests, Policies, Jobs sind schon gute Abstraktionen.
  Weiche nur ab, wenn du begründen kannst, welches Problem es löst.
- **Einheitlichkeit schlägt Perfektion:** Eine mittelgute Regel, die alle befolgen, ist besser als drei
  brillante Stile nebeneinander.

## Schrittweise nachziehen

Architektur muss nicht am ersten Tag fertig sein. Sie lässt sich nachziehen, wenn du eine Voraussetzung
erfüllst: **Tests**. Mit einer grünen Testsuite ist ein [[refactoring|Refactoring]] wie „Logik in eine
Action ziehen“ oder „Model ins Modul verschieben“ eine Sache von Stunden, nicht Wochen.

Eine bewährte Reihenfolge, jeweils erst beim passenden Schmerz:

1. Form Requests und Tests – von Anfang an.
2. Actions, sobald Abläufe groß werden oder mehrere Eingänge haben.
3. Value Objects für fachliche Werte mit Regeln.
4. Events und Module, wenn Teams und Bereiche sich gegenseitig stören.
5. Architekturtests, sobald es Grenzen gibt, die geschützt werden müssen.

> [!PRAXIS]
> Halte Architekturentscheidungen kurz schriftlich fest – mit dem Problem, das sie lösen. Fällt das
> Problem weg, darfst du die Entscheidung auch wieder zurücknehmen. Das ist kein Scheitern, sondern
> Pflege.

## Zusammenfassung

- Jedes Muster kostet Dateien, Indirektion und Lernaufwand – es lohnt sich nur bei seinem Auslöser.
- Warnsignale: Durchreich-Schichten, Interfaces mit einer Implementierung, viele Dateien für ein Feld, Abstraktionen für später.
- YAGNI und die Rule of three bremsen Abstraktionen auf Vorrat.
- Laravels Standard ist ein guter Start; einheitliche Regeln schlagen perfekte.
- Mit Tests lässt sich Architektur schrittweise nachziehen, wenn echte Schmerzen auftreten.
