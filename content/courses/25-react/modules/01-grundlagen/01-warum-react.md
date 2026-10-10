---
title: Warum React? Deine erste App
summary: Welches Problem React löst, was eine Komponente ist und wie du mit Vite ein React-Projekt anlegst.
duration: 20
sources:
  - title: react.dev – Quick Start
    url: https://react.dev/learn
  - title: react.dev – Thinking in React
    url: https://react.dev/learn/thinking-in-react
  - title: Vite – Getting Started
    url: https://vite.dev/guide/
  - title: react.dev – createRoot
    url: https://react.dev/reference/react-dom/client/createRoot
quiz:
  - type: single
    question: Was ist der Kern der deklarativen Arbeitsweise von React?
    options:
      - Du änderst den DOM selbst Schritt für Schritt mit document.querySelector.
      - Du beschreibst, wie die Oberfläche für den aktuellen Zustand aussehen soll, und React bringt den DOM auf diesen Stand.
      - React lädt bei jeder Änderung die ganze Seite neu vom Server.
      - React erzeugt HTML-Dateien, die du manuell hochlädst.
    answer: 1
    explanation: >
      Deklarativ heißt: Du beschreibst das Ergebnis („bei 3 Einträgen zeige 3 Zeilen“), nicht die einzelnen
      DOM-Befehle. React vergleicht das neue Ergebnis mit dem alten und ändert nur, was nötig ist.
  - type: multiple
    question: Welche Aussagen über React-Komponenten stimmen?
    options:
      - Eine Komponente ist eine JavaScript-Funktion, die JSX zurückgibt.
      - Komponentennamen beginnen mit einem Großbuchstaben.
      - Eine Komponente darf nur einmal pro Seite verwendet werden.
      - Komponenten können andere Komponenten enthalten.
    answers: [0, 1, 3]
    explanation: >
      Komponenten sind Funktionen mit großem Anfangsbuchstaben, die Markup zurückgeben. Du kannst sie beliebig
      oft verwenden und ineinander verschachteln – so entsteht ein Komponentenbaum.
  - type: cloze
    text: Mit `createRoot(document.getElementById('root')).___(<App />)` hängt React die App in die Seite ein. Das Projekt legst du mit `npm create ___@latest` an.
    blanks:
      - [render]
      - [vite]
    explanation: createRoot erzeugt einen React-Wurzelknoten im DOM-Element, render zeigt die Komponente darin an. Vite ist das empfohlene Build-Werkzeug für neue React-Projekte ohne Framework.
  - type: match
    question: Ordne jeder Datei eines Vite-React-Projekts ihre Aufgabe zu.
    pairs:
      - { left: "index.html", right: "Die eine HTML-Seite mit dem leeren div#root" }
      - { left: "src/main.tsx", right: "Einstiegspunkt: ruft createRoot und render auf" }
      - { left: "src/App.tsx", right: "Die oberste eigene Komponente" }
      - { left: "package.json", right: "Abhängigkeiten und npm-Skripte wie dev und build" }
    explanation: Der Browser lädt index.html, das lädt main.tsx, und main.tsx rendert App in das div mit der id root.
tasks:
  - id: vite-app-anlegen
    type: terminal
    title: Lege deine erste React-App mit Vite an
    description: |
      Im Ordner `erste-app` ist noch nichts vorbereitet. Du legst ein React-Projekt mit TypeScript an und
      passt die App-Komponente an.

      1. Lege das Projekt an: `npm create vite@latest app -- --template react-ts --no-interactive`
      2. Wechsle mit `cd app` hinein und installiere die Abhängigkeiten mit `npm install`.
      3. Ersetze den Inhalt von `src/App.tsx` durch eine Komponente `App`, die eine Überschrift
         `<h1>Hallo React</h1>` zurückgibt und mit `export default App` exportiert wird.
      4. Baue das Projekt mit `npm run build`. Der Befehl muss ohne Fehler durchlaufen.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit der Ordner angelegt wird.
    workdir: erste-app
    setup: |
      echo "Hier entsteht deine erste React-App." > LIESMICH.txt
    checks:
      - type: file_exists
        path: app/package.json
        message: Es gibt noch kein Projekt im Unterordner app. Führe npm create vite@latest app -- --template react-ts --no-interactive aus.
      - type: file_contains
        path: app/package.json
        pattern: "\"react\""
        message: In app/package.json fehlt react als Abhängigkeit – hast du das Template react-ts gewählt?
      - type: dir_exists
        path: app/node_modules/react
        message: Die Abhängigkeiten sind noch nicht installiert. Führe im Ordner app npm install aus.
      - type: file_contains
        path: app/src/App.tsx
        pattern: "<h1>\\s*Hallo React\\s*</h1>"
        message: src/App.tsx soll eine Überschrift <h1>Hallo React</h1> zurückgeben.
      - type: command
        run: cd app && npm run build >/dev/null 2>&1
        message: npm run build schlägt noch fehl. Prüfe mit npm run build die Fehlermeldung – oft sind es übrig gebliebene, ungenutzte Imports in App.tsx.
      - type: file_exists
        path: app/dist/index.html
        message: Nach einem erfolgreichen Build liegt app/dist/index.html vor. Führe npm run build im Ordner app aus.
    hints:
      - Vite fragt mit `--no-interactive` nichts nach. Danach brauchst du `cd app` und `npm install`.
      - Am einfachsten überschreibst du App.tsx komplett, z. B. mit `nano src/App.tsx`. Entferne dabei alle alten Imports (Logos, useState, CSS), sonst meckert TypeScript über ungenutzte Imports.
      - "Die ganze Datei kann so aussehen: `function App() { return <h1>Hallo React</h1> }` und darunter `export default App`."
    solution: |
      ```bash
      npm create vite@latest app -- --template react-ts --no-interactive
      cd app
      npm install
      cat > src/App.tsx <<'EOF'
      function App() {
        return <h1>Hallo React</h1>
      }

      export default App
      EOF
      npm run build
      ```
  - id: vom-code-zum-bildschirm
    type: order
    title: Vom Aufruf bis zum Bildschirm
    description: Bring die Schritte in die Reihenfolge, in der eine Vite-React-App beim Öffnen im Browser startet.
    items:
      - Der Browser lädt index.html mit dem leeren div#root.
      - index.html lädt das Skript src/main.tsx.
      - main.tsx ruft createRoot mit dem div#root auf.
      - render(<App />) ruft die Komponentenfunktion App auf.
      - App gibt JSX zurück, React erzeugt daraus DOM-Elemente.
      - Der Browser zeigt die fertige Oberfläche an.
    hints:
      - Alles beginnt mit der HTML-Datei, alles endet mit dem, was du siehst.
---
Du baust eine Einkaufsliste im Browser. Mit reinem JavaScript suchst du für jede Änderung die passenden
Elemente, fügst `<li>`-Knoten ein, entfernst sie wieder und vergisst irgendwann, den Zähler „3 Einträge“
mitzuändern. Je größer die Oberfläche, desto schneller verlierst du den Überblick. Genau hier setzt
[[react]] an.

## Das Problem: Oberfläche und Daten auseinanderhalten

Im [[dom|DOM]] musst du jede Änderung selbst ausführen. Man nennt das **imperativ**: Du gibst Befehl für
Befehl vor, *wie* sich die Seite ändert.

```js title="Imperativ: jeder Schritt von Hand"
const li = document.createElement('li')
li.textContent = 'Milch'
document.querySelector('#liste').append(li)
document.querySelector('#anzahl').textContent = '3 Einträge'
```

Vergisst du eine Zeile, zeigt die Seite etwas anderes, als in deinen Daten steht. React dreht das um: Du
schreibst nur noch auf, **was** bei den aktuellen Daten zu sehen sein soll. Das heißt
[[deklarativ|deklarativ]].

| Imperativ (DOM von Hand) | Deklarativ (React) |
|---|---|
| „Füge ein li ein, ändere den Zähler“ | „Zu dieser Liste gehört diese Oberfläche“ |
| Du merkst dir den alten Zustand | React vergleicht alt und neu |
| Fehler durch vergessene Schritte | Oberfläche folgt immer den Daten |

## Komponenten: Bausteine aus Funktionen

Eine React-Oberfläche besteht aus [[komponente|Komponenten]]. Eine Komponente ist eine ganz normale
JavaScript-[[funktion]], die beschreibt, wie ein Teil der Seite aussieht.

```jsx title="Zwei Komponenten"
function Begruessung() {
  return <h1>Hallo React</h1>
}

function App() {
  return (
    <main>
      <Begruessung />
      <p>Schön, dass du da bist.</p>
    </main>
  )
}
```

Das HTML-ähnliche Markup heißt [[jsx|JSX]] – dazu gleich mehr. Zwei Regeln gelten immer:

- Der Name beginnt mit einem **Großbuchstaben** (`Begruessung`, nicht `begruessung`). Kleingeschriebene
  Tags hält React für HTML-Elemente.
- Die Funktion **gibt Markup zurück**. Du rufst sie nicht selbst auf, sondern verwendest sie als Tag:
  `<Begruessung />`.

Komponenten stecken ineinander und bilden so einen **Komponentenbaum**: `App` enthält `Begruessung`,
später enthält eine `Einkaufsliste` viele `Eintrag`-Komponenten.

> [!MERKSATZ]
> Eine Komponente ist eine Funktion mit großem Anfangsbuchstaben, die JSX zurückgibt. Du verwendest sie wie
> einen eigenen HTML-Tag.

## Wie React die Seite füllt

Eine React-App ist meist eine [[spa|Single-Page-Application]]: Es gibt eine einzige HTML-Seite mit einem
leeren Container. Alles Weitere erzeugt React im Browser.

```tsx title="src/main.tsx"
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- `createRoot` macht das `<div id="root">` zum Wurzelknoten, den React verwaltet.
- `render(<App />)` ruft deine Komponente auf und baut aus ihrem JSX echte DOM-Elemente.
- [[strict-mode-react|StrictMode]] ist ein Entwicklungshelfer: Er ruft Komponenten testweise doppelt auf,
  um versteckte Fehler früh zu zeigen. In der fertigen App hat er keine Wirkung.

Diesen Vorgang – Komponente aufrufen und DOM daraus machen – nennt man [[rendern|Rendern]].

## Ein Projekt mit Vite anlegen

React selbst ist nur eine [[library|Bibliothek]]. Für ein echtes Projekt brauchst du ein Werkzeug, das JSX
und TypeScript übersetzt, einen [[dev-server|Dev-Server]] startet und die App für die Auslieferung baut.
Die React-Doku empfiehlt dafür ohne Framework [[vite|Vite]].

```bash title="Terminal"
npm create vite@latest app -- --template react-ts --no-interactive
cd app
npm install
npm run dev     # Dev-Server, meist auf http://localhost:5173
npm run build   # prüft Typen (tsc -b) und baut nach dist/
```

| Datei | Aufgabe |
|---|---|
| `index.html` | die eine Seite mit `<div id="root">` |
| `src/main.tsx` | Einstiegspunkt mit `createRoot` |
| `src/App.tsx` | deine oberste Komponente |
| `package.json` | Abhängigkeiten und Skripte |

> [!FEHLER]
> Nach dem Umschreiben von `App.tsx` schlägt `npm run build` fehl: „'useState' is declared but its value is
> never read“. Das Template prüft streng auf ungenutzte Imports. Entferne alles, was du nicht mehr brauchst.

> [!PRAXIS]
> Größere Anwendungen starten oft mit einem Framework wie Next.js oder React Router im Framework-Modus.
> Für viele interne Werkzeuge und Dashboards reicht aber genau dieses Setup: Vite, React, TypeScript.
> Routing behandelt der Kurs „Moderner React-Stack“.

## Zusammenfassung

- React arbeitet **deklarativ**: Du beschreibst die Oberfläche für den aktuellen Zustand.
- Eine **Komponente** ist eine Funktion mit großem Anfangsbuchstaben, die JSX zurückgibt.
- Komponenten verschachtelt ergeben einen **Komponentenbaum**.
- `createRoot(...).render(<App />)` hängt die App in das `div#root` ein.
- Mit `npm create vite@latest … --template react-ts` legst du ein Projekt an, `npm run build` baut es.
