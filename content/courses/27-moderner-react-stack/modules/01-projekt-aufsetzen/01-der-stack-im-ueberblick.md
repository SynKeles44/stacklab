---
title: Der Stack im Überblick
summary: Welche Aufgabe Bun, Vite, Tailwind, shadcn/ui, Zod und React Router in einer React-App übernehmen und wie sie zusammenspielen.
duration: 15
sources:
  - title: Vite – Getting Started
    url: https://vite.dev/guide/
  - title: Bun – Dokumentation
    url: https://bun.com/docs
  - title: shadcn/ui – Introduction
    url: https://ui.shadcn.com/docs
  - title: React Router – Picking a Mode
    url: https://reactrouter.com/start/modes
  - title: Zod – Intro
    url: https://zod.dev/
quiz:
  - type: single
    question: Welches Werkzeug im Stack verwandelt deine TSX-Dateien für die Auslieferung in JavaScript, das der Browser versteht?
    options:
      - Zod
      - Vite
      - React Router
      - shadcn/ui
    answer: 1
    explanation: >
      Vite ist das Build-Werkzeug: Im Dev-Server übersetzt es Dateien bei Bedarf, beim Build bündelt es das ganze
      Projekt in den Ordner `dist`. Zod prüft Daten, React Router wählt Seiten aus, shadcn/ui liefert Komponenten-Code.
  - type: multiple
    question: Welche Aussagen über den Stack stimmen?
    options:
      - Bun installiert Pakete und startet die Skripte aus der package.json.
      - shadcn/ui ist ein npm-Paket, das du wie jede Bibliothek importierst und nie selbst änderst.
      - Zod prüft Daten zur Laufzeit, also erst, wenn sie wirklich ankommen.
      - Im Data Mode lädt React Router die Daten einer Seite, bevor sie angezeigt wird.
    answers: [0, 2, 3]
    explanation: >
      shadcn/ui ist gerade **keine** klassische Bibliothek: Die CLI kopiert den Quellcode der Komponenten in dein
      Projekt, und du darfst ihn ändern. Alle anderen Aussagen stimmen.
  - type: match
    question: Ordne jedem Werkzeug die Frage zu, die es beantwortet.
    pairs:
      - { left: "React Router", right: "Welche Seite gehört zu dieser URL, und welche Daten braucht sie?" }
      - { left: "Zod", right: "Sehen diese Daten wirklich so aus, wie mein Code erwartet?" }
      - { left: "Tailwind CSS", right: "Wie gestalte ich Elemente direkt mit Klassen?" }
      - { left: "Bun", right: "Wie installiere ich Pakete und starte Skripte?" }
    explanation: Jedes Werkzeug hat genau eine Hauptaufgabe. Gemeinsam decken sie den Weg vom leeren Ordner bis zur ausgelieferten App ab.
  - type: cloze
    text: TypeScript prüft Typen nur beim ___. Daten aus einer API kommen aber erst zur ___ an – deshalb braucht es Zod.
    blanks:
      - [Kompilieren, Build, Übersetzen]
      - [Laufzeit]
    explanation: >
      Nach dem Build sind alle Typen verschwunden. Liefert die API plötzlich `null` statt eines Textes, merkt das
      nur eine Prüfung zur Laufzeit – genau die übernimmt Zod.
tasks:
  - id: werkzeuge-zuordnen
    type: dragdrop
    title: Wer ist zuständig?
    description: Ordne jede Aufgabe dem Werkzeug zu, das sie in unserem Stack übernimmt.
    targets:
      - { id: bun, label: Bun }
      - { id: vite, label: Vite }
      - { id: router, label: React Router }
      - { id: zod, label: Zod }
      - { id: shadcn, label: shadcn/ui + Tailwind }
    items:
      - { label: "Pakete installieren und bun.lock schreiben", target: bun }
      - { label: "Skripte wie dev und build starten", target: bun }
      - { label: "Dev-Server mit sofortigem Neuladen", target: vite }
      - { label: "Produktions-Build in den Ordner dist", target: vite }
      - { label: "Daten vor dem Anzeigen einer Seite laden", target: router }
      - { label: "Formular-Absendungen verarbeiten", target: router }
      - { label: "API-Antwort gegen ein Schema prüfen", target: zod }
      - { label: "TypeScript-Typ aus einem Schema ableiten", target: zod }
      - { label: "Button-Code mit Varianten ins Projekt kopieren", target: shadcn }
      - { label: "Farben über CSS-Variablen festlegen", target: shadcn }
    hints:
      - Bun und Vite arbeiten auf deinem Rechner, die anderen drei sind Teil der App im Browser.
  - id: wer-hilft
    type: steps
    title: Welches Werkzeug hilft hier?
    description: Typische Situationen aus einem Frontend-Projekt. Überlege jeweils, welcher Teil des Stacks das Problem löst.
    steps:
      - situation: >
          Die App zeigt eine Bücherliste. Nach einem Update des Backends liefert die API das Feld `year` plötzlich
          als Text `"1973"` statt als Zahl. Die Seite zeigt „NaN Jahre alt“ an.
        question: Welches Werkzeug hätte den Fehler direkt an der Quelle gemeldet?
        options: [Tailwind CSS, Zod, Vite]
        answer: 1
        explanation: Ein Zod-Schema mit `year` als Zahl schlägt beim Prüfen der Antwort sofort Alarm – statt dass der Fehler erst tief in der Oberfläche auffällt.
      - situation: >
          Eine Kollegin möchte, dass alle Buttons etwas rundere Ecken bekommen und im Dark Mode heller werden.
        question: Wo änderst du das?
        options:
          - In jeder Seite einzeln
          - In den CSS-Variablen und im Button-Code von shadcn/ui, der in deinem Projekt liegt
          - In der package.json
        answer: 1
        explanation: Weil der Komponenten-Code dir gehört und das Theme über CSS-Variablen läuft, änderst du es an genau einer Stelle.
      - situation: >
          Beim Öffnen von `/buecher/42` blitzt kurz eine leere Seite auf, bevor die Daten da sind. Der Code lädt die
          Daten in einem `useEffect`.
        question: Was hilft?
        options:
          - Ein loader in React Router, der die Daten vor dem Anzeigen lädt
          - Ein größerer Monitor
          - Ein zweiter useEffect
        answer: 0
        explanation: Im Data Mode lädt der Router die Daten, bevor er die Seite rendert. Die Komponente bekommt sie fertig über `useLoaderData()`.
---
Du kannst React: Komponenten, Props, State, Hooks. Trotzdem stehst du vor einem leeren Ordner und fragst dich:
Wie wird daraus eine App, die ein Team jahrelang pflegt? Wo kommen Styling, Formulare, Seiten und Daten her?
Die Antwort ist ein **Stack** – eine Auswahl von Werkzeugen, die zusammenarbeiten. In diesem Kurs baust du einen
modernen [[tech-stack|React-Stack]], wie ihn viele Teams heute einsetzen.

## Warum React allein nicht reicht

[[react|React]] beantwortet genau eine Frage: Wie beschreibe ich eine Oberfläche als Funktion des Zustands? Für
eine echte Anwendung fehlen dir aber noch einige Dinge:

| Frage | Ohne Stack |
|---|---|
| Wie starte ich das Projekt und sehe Änderungen sofort? | Eigene Build-Skripte basteln |
| Wie bekomme ich ein einheitliches Design? | Jede Komponente bekommt eigenes CSS |
| Woher kommen Buttons, Dialoge, Formularfelder? | Alles selbst schreiben – inklusive Tastaturbedienung |
| Welche Seite gehört zu welcher URL? | Eigene `if`-Abfragen auf `window.location` |
| Stimmen die Daten von der API? | Hoffen |

Jedes dieser Probleme hat ein Werkzeug, das es gut löst. Die Kunst ist, die Werkzeuge so zu kombinieren, dass
sie sich nicht in die Quere kommen.

> [!MERKSATZ]
> Ein Stack ist kein Sammelsurium. Jedes Werkzeug hat **eine** klare Aufgabe, und du weißt, wo seine Zuständigkeit endet.

## Die sechs Bausteine

![Überblick über den Stack: Bun und Vite als Werkzeuge, darüber React Router, Zod und shadcn/ui in der App](/assets/moderner-react-stack/stack-ueberblick.svg)

| Werkzeug | Aufgabe | Version (Okt. 2026) |
|---|---|---|
| [[bun|Bun]] | Laufzeit und [[paketmanager|Paketmanager]]: installiert, startet Skripte | 1.4 |
| [[vite|Vite]] | [[dev-server|Dev-Server]] und Build-Werkzeug | 8 |
| [[tailwind-css|Tailwind CSS]] | Styling mit [[utility-klasse|Utility-Klassen]] | 4 |
| [[shadcn-ui|shadcn/ui]] | Komponenten-Code zum Kopieren und Anpassen | CLI `shadcn@latest` |
| [[zod|Zod]] | Daten zur Laufzeit prüfen, Typen ableiten | 4 |
| [[react-router|React Router]] | URLs auf Seiten abbilden, Daten laden | 8, Data Mode |

Bun und Vite laufen auf deinem Rechner (und später auf dem Build-Server). React Router, Zod und die
shadcn-Komponenten landen im JavaScript, das der Browser ausführt.

## Wie die Teile zusammenspielen

Verfolge einen einzigen Seitenaufruf durch den Stack:

1. Du tippst `bun run dev`. Bun startet Vite, Vite liefert `index.html` und deine Module aus.
2. Der Browser öffnet `/buecher/momo`. React Router findet die passende [[route-objekt|Route]] und ruft ihren
   [[route-loader|Loader]] auf.
3. Der Loader holt JSON von der API. Zod prüft, ob die Antwort wirklich ein Buch ist.
4. Die Seitenkomponente bekommt die geprüften Daten und zeigt sie mit shadcn-Komponenten an, gestaltet mit
   Tailwind-Klassen und Theme-Variablen.
5. Für die Auslieferung baut `bun run build` alles in den Ordner `dist`.

> [!PRAXIS]
> Genau so ist auch das Frontend dieser Lernplattform aufgebaut: Vite, Bun, Tailwind 4, shadcn/ui als einzige
> Komponentenbibliothek, React Router im Data Mode und Zod-Schemas für jede API-Antwort.

## Warum gerade diese Auswahl?

Es gibt Alternativen zu jedem Baustein – npm statt Bun, Next.js statt Vite plus Router, eine fertige
[[komponentenbibliothek|Komponentenbibliothek]] statt shadcn/ui. Diese Kombination hat drei Stärken:

- **Wenig Magie:** Vite und React Router im Data Mode erzeugen eine normale [[spa|Single-Page-Application]]. Du
  brauchst keinen eigenen Server, um sie auszuliefern.
- **Volle Kontrolle:** shadcn/ui legt den Komponenten-Code in dein Projekt. Nichts ist in einem Paket versteckt.
- **Sicherheit an den Rändern:** TypeScript schützt deinen Code, Zod schützt die Grenze zur Außenwelt.

> [!FEHLER]
> „TypeScript prüft doch schon alles.“ – TypeScript prüft nur, was du **selbst** schreibst. Was eine API zur
> [[laufzeitvalidierung|Laufzeit]] schickt, kennt der Compiler nicht. Ohne Zod glaubt dein Code einfach, was
> ankommt.

React Router kennt neben dem Data Mode noch den Declarative Mode und den Framework Mode mit Server-Rendering.
Wir lehren den Data Mode, weil er Datenladen und Formulare sauber löst, ohne einen Server vorauszusetzen. Die
Unterschiede beschreibt die Seite [Picking a Mode](https://reactrouter.com/start/modes).

## Zusammenfassung

- Ein Stack kombiniert Werkzeuge mit jeweils **einer** klaren Aufgabe.
- **Bun** installiert und startet, **Vite** liefert Dev-Server und Build.
- **Tailwind** und **shadcn/ui** gestalten die Oberfläche – der Komponenten-Code gehört dir.
- **Zod** prüft alles, was von außen kommt, zur Laufzeit.
- **React Router im Data Mode** ordnet URLs Seiten zu und lädt Daten, bevor die Seite erscheint.
