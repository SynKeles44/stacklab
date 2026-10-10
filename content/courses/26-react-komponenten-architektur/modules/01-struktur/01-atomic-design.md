---
title: Atomic Design und Dateistruktur
summary: Wie du Komponenten in Atome, Moleküle und Organismen einteilst, Dateien in kebab-case benennst und warum du auf Barrel-Dateien verzichtest.
duration: 20
sources:
  - title: Brad Frost – Atomic Design, Kapitel 2
    url: https://atomicdesign.bradfrost.com/chapter-2/
  - title: Vite – Performance, Abschnitt „Avoid Barrel Files“
    url: https://vite.dev/guide/performance.html#avoid-barrel-files
  - title: react.dev – Importing and Exporting Components
    url: https://react.dev/learn/importing-and-exporting-components
quiz:
  - type: single
    question: Eine Komponente `SearchField` besteht aus einem `Input` und einem `Button` und erfüllt genau eine Aufgabe – eine Suche abschicken. Zu welcher Ebene gehört sie?
    options:
      - Atom
      - Molekül
      - Organismus
      - Seite
    answer: 1
    explanation: >
      Ein Molekül kombiniert einige Atome zu einer kleinen Einheit mit einer klaren Aufgabe. Ein Organismus
      wäre ein ganzer Seitenabschnitt, etwa der Kopfbereich mit Logo, Navigation und Suchfeld.
  - type: multiple
    question: Welche Probleme verursachen Barrel-Dateien (`index.ts`, die alles wieder exportiert) typischerweise?
    options:
      - Der Dev-Server und die Tests laden viel mehr Module als nötig.
      - Es entstehen leicht zirkuläre Importe.
      - Komponenten können gar nicht mehr exportiert werden.
      - Beim Lesen eines Imports siehst du nicht sofort, in welcher Datei die Komponente liegt.
    answers: [0, 1, 3]
    explanation: >
      Eine Barrel-Datei ist eine Sammelstelle. Wer daraus eine Komponente importiert, zieht oft alle anderen
      mit. Das kostet Ladezeit, begünstigt Kreis-Importe und versteckt den echten Speicherort.
  - type: cloze
    text: "Die Komponente `SiteHeader` liegt in der Datei `___.tsx`. Diese Schreibweise mit Bindestrichen heißt ___."
    blanks:
      - [site-header]
      - [kebab-case, Kebab-Case]
    explanation: Dateinamen in kebab-case bestehen nur aus Kleinbuchstaben, Ziffern und Bindestrichen. Der Komponentenname im Code bleibt PascalCase.
  - type: match
    question: Ordne jedes Beispiel seiner Ebene zu.
    pairs:
      - { left: "Button, Input, Badge", right: "Atom" }
      - { left: "Suchfeld aus Input und Button", right: "Molekül" }
      - { left: "Kopfbereich mit Logo, Navigation und Suchfeld", right: "Organismus" }
    explanation: Atome sind nicht weiter teilbar, Moleküle lösen eine kleine Aufgabe, Organismen bilden eigenständige Abschnitte einer Seite.
tasks:
  - id: ebenen-zuordnen
    type: dragdrop
    title: Atom, Molekül oder Organismus?
    description: Ziehe jede Komponente auf die passende Ebene des Atomic Designs.
    targets:
      - { id: atom, label: Atom }
      - { id: molekuel, label: Molekül }
      - { id: organismus, label: Organismus }
    items:
      - { label: "Button", target: atom }
      - { label: "Checkbox", target: atom }
      - { label: "Avatar-Bild", target: atom }
      - { label: "Formularfeld aus Label, Input und Fehlertext", target: molekuel }
      - { label: "Suchfeld aus Input und Button", target: molekuel }
      - { label: "Benutzer-Chip aus Avatar und Name", target: molekuel }
      - { label: "Kopfbereich mit Logo, Navigation und Suche", target: organismus }
      - { label: "Produktliste mit Filterleiste", target: organismus }
    hints:
      - Frag dich bei jeder Komponente, ob sie andere eigene Komponenten enthält – und ob sie einen ganzen Seitenabschnitt bildet.
  - id: struktur-aufraeumen
    type: terminal
    title: Den Komponenten-Ordner aufräumen
    description: |
      Im Ordner `ordnerstruktur` liegt ein kleines React-Projekt. Alle Komponenten liegen durcheinander in
      `src/components/`, heißen in PascalCase und werden über eine Barrel-Datei `index.js` importiert.

      Räume nach den Regeln dieser Lektion auf:

      1. Verschiebe `Button.jsx` nach `src/components/atoms/button.jsx` und `Input.jsx` nach `src/components/atoms/input.jsx`.
      2. Verschiebe `SearchField.jsx` nach `src/components/molecules/search-field.jsx`.
      3. Verschiebe `SiteHeader.jsx` nach `src/components/organisms/site-header.jsx`.
      4. Lösche die Barrel-Datei `src/components/index.js`.
      5. Passe die Importe an: `search-field.jsx` importiert direkt aus `../atoms/button` und `../atoms/input`,
         `site-header.jsx` direkt aus `../molecules/search-field`.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit das Projekt angelegt wird.
    workdir: ordnerstruktur
    setup: |
      mkdir -p src/components
      cat > src/components/Button.jsx <<'EOF'
      export function Button(props) {
        return <button type="button" {...props} />
      }
      EOF
      cat > src/components/Input.jsx <<'EOF'
      export function Input(props) {
        return <input {...props} />
      }
      EOF
      cat > src/components/SearchField.jsx <<'EOF'
      import { Button, Input } from './index'

      export function SearchField() {
        return (
          <form role="search">
            <Input name="q" aria-label="Suche" />
            <Button type="submit">Suchen</Button>
          </form>
        )
      }
      EOF
      cat > src/components/SiteHeader.jsx <<'EOF'
      import { SearchField } from './index'

      export function SiteHeader() {
        return (
          <header>
            <strong>Shop</strong>
            <SearchField />
          </header>
        )
      }
      EOF
      cat > src/components/index.js <<'EOF'
      export * from './Button'
      export * from './Input'
      export * from './SearchField'
      export * from './SiteHeader'
      EOF
    checks:
      - type: file_exists
        path: src/components/atoms/button.jsx
        message: src/components/atoms/button.jsx fehlt noch – verschiebe Button.jsx mit mv dorthin.
      - type: file_exists
        path: src/components/atoms/input.jsx
        message: src/components/atoms/input.jsx fehlt noch.
      - type: file_exists
        path: src/components/molecules/search-field.jsx
        message: src/components/molecules/search-field.jsx fehlt noch.
      - type: file_exists
        path: src/components/organisms/site-header.jsx
        message: src/components/organisms/site-header.jsx fehlt noch.
      - type: file_absent
        path: src/components/index.js
        message: Die Barrel-Datei src/components/index.js existiert noch – lösche sie.
      - type: file_absent
        path: src/components/Button.jsx
        message: Die alte Datei src/components/Button.jsx liegt noch da – verschieben statt kopieren.
      - type: file_contains
        path: src/components/atoms/button.jsx
        pattern: "export function Button"
        message: In atoms/button.jsx muss weiterhin die Komponente Button exportiert werden.
      - type: file_contains
        path: src/components/molecules/search-field.jsx
        pattern: "from ['\"]\\.\\./atoms/button(\\.jsx)?['\"]"
        message: search-field.jsx soll Button direkt aus '../atoms/button' importieren.
      - type: file_contains
        path: src/components/molecules/search-field.jsx
        pattern: "from ['\"]\\.\\./atoms/input(\\.jsx)?['\"]"
        message: search-field.jsx soll Input direkt aus '../atoms/input' importieren.
      - type: file_contains
        path: src/components/organisms/site-header.jsx
        pattern: "from ['\"]\\.\\./molecules/search-field(\\.jsx)?['\"]"
        message: site-header.jsx soll SearchField direkt aus '../molecules/search-field' importieren.
      - type: command
        run: grep -rl "/index" src | wc -l
        stdout_matches: "^\\s*0\\s*$"
        message: Irgendwo wird noch aus './index' importiert. Ersetze jeden Barrel-Import durch einen direkten Import.
    hints:
      - "Lege die Ordner zuerst an: `mkdir -p src/components/atoms src/components/molecules src/components/organisms`."
      - "Verschieben und umbenennen in einem Schritt: `mv src/components/Button.jsx src/components/atoms/button.jsx`."
      - "Die Importzeilen änderst du mit `nano` – oder mit `sed -i`, z. B. `sed -i \"s#from './index'#from '../molecules/search-field'#\" src/components/organisms/site-header.jsx`."
    solution: |
      ```bash
      cd ordnerstruktur
      mkdir -p src/components/atoms src/components/molecules src/components/organisms
      mv src/components/Button.jsx src/components/atoms/button.jsx
      mv src/components/Input.jsx src/components/atoms/input.jsx
      mv src/components/SearchField.jsx src/components/molecules/search-field.jsx
      mv src/components/SiteHeader.jsx src/components/organisms/site-header.jsx
      rm src/components/index.js
      sed -i "s#import { Button, Input } from './index'#import { Button } from '../atoms/button'\nimport { Input } from '../atoms/input'#" src/components/molecules/search-field.jsx
      sed -i "s#from './index'#from '../molecules/search-field'#" src/components/organisms/site-header.jsx
      tree src
      ```
---
Dein React-Projekt ist gewachsen: Im Ordner `components/` liegen inzwischen 80 Dateien nebeneinander.
Niemand findet mehr etwas, und jede neue Kollegin fragt: „Gibt es schon einen Button – oder drei?“ Eine
klare **Struktur** beantwortet solche Fragen, bevor sie gestellt werden.

![Atomic Design: Atome bilden Moleküle, Moleküle bilden Organismen, daraus entstehen Seiten](/assets/react-komponenten-architektur/atomic-design.svg)

## Atomic Design: vom Atom zur Seite

[[atomic-design|Atomic Design]] ist eine Denkweise von Brad Frost. Sie vergleicht eine Oberfläche mit der
Chemie: Kleine Bausteine verbinden sich zu immer größeren.

| Ebene | Beschreibung | Beispiele |
|---|---|---|
| [[atom-komponente\|Atom]] | Kleinste Einheit, enthält keine eigenen [[komponente\|Komponenten]] | `Button`, `Input`, `Badge`, `Icon` |
| [[molekuel-komponente\|Molekül]] | Einige Atome, die zusammen **eine** Aufgabe lösen | Suchfeld, Formularfeld mit Label und Fehlertext |
| [[organismus-komponente\|Organismus]] | Eigenständiger Abschnitt einer Seite | Kopfbereich, Produktliste mit Filtern |
| Template / Seite | Anordnung von Organismen zu einer ganzen Ansicht | Startseite, Checkout |

In der Praxis nutzen viele Teams nur die ersten drei Ebenen als Ordner. Seiten liegen meist bei den
Routen der App, nicht im Komponenten-Ordner.

> [!MERKSATZ]
> Atome bauen Moleküle, Moleküle bauen Organismen – **nie umgekehrt**. Ein Atom importiert keine
> Moleküle.

## Woran du die Ebene erkennst

Die Einteilung ist keine exakte Wissenschaft. Drei Fragen helfen dir:

1. **Enthält die Komponente andere eigene Komponenten?** Nein → Atom.
2. **Löst sie genau eine kleine Aufgabe** (suchen, ein Feld ausfüllen, einen Nutzer anzeigen)? → Molekül.
3. **Ist sie ein ganzer Abschnitt**, den du auf einer Seite verschieben könntest? → Organismus.

Ein Beispiel aus einem Online-Shop:

```text
organisms/site-header.tsx     ← Logo + Navigation + Suchfeld
molecules/search-field.tsx    ← Input + Button
atoms/input.tsx
atoms/button.tsx
```

Je weiter unten eine Komponente steht, desto **allgemeiner** ist sie. Ein Button weiß nichts über
Bestellungen. Ein Organismus wie `OrderSummary` darf dagegen fachliches Wissen haben.

> [!FEHLER]
> **Ebenen nach Größe statt nach Aufbau wählen.** Eine sehr große Tabelle ist nicht automatisch ein
> Organismus. Entscheidend ist, ob sie aus eigenen Bausteinen besteht und welche Aufgabe sie erfüllt.

## Eine Datei, eine Komponente, kebab-case

Jede Komponente bekommt ihre **eigene Datei**. Der Dateiname steht in [[kebab-case]]: nur
Kleinbuchstaben, Wörter durch Bindestriche getrennt. Der Name im Code bleibt PascalCase.

| Datei | Exportierte Komponente |
|---|---|
| `button.tsx` | `Button` |
| `search-field.tsx` | `SearchField` |
| `site-header.tsx` | `SiteHeader` |

Warum nicht `SearchField.tsx`? macOS und Windows unterscheiden standardmäßig nicht zwischen Groß- und
Kleinschreibung, Linux schon. Benennst du `Searchfield.tsx` in `SearchField.tsx` um, bemerkt Git das auf
dem Mac oft nicht – und der Build auf dem Linux-Server bricht. Mit reinen Kleinbuchstaben gibt es dieses
Problem gar nicht.

Zusammengehörige Dateien liegen direkt nebeneinander:

```text
atoms/
  button.tsx           ← die Komponente
  button.stories.tsx   ← ihre Stories (Modul 4)
  button.test.tsx      ← ihre Tests (Modul 4)
```

## Keine Barrel-Dateien

Eine [[barrel-datei|Barrel-Datei]] ist eine `index.ts`, die nur andere Module wieder exportiert:

```ts title="components/index.ts – so lieber nicht"
export * from './atoms/button'
export * from './atoms/input'
export * from './organisms/site-header'
// … 80 weitere Zeilen
```

Das sieht bequem aus, hat aber Nebenwirkungen:

- **Langsamer:** Wer `Button` importiert, lässt den [[dev-server|Dev-Server]] und den [[test-runner|Test-Runner]]
  oft alle 80 Dateien laden. Die Vite-Dokumentation rät deshalb ausdrücklich davon ab.
- **Kreis-Importe:** Importiert `site-header.tsx` selbst aus `index.ts`, entsteht leicht ein Zirkel.
- **Unklarer Ursprung:** `from '../components'` verrät nicht, in welcher Datei die Komponente liegt.

Stattdessen importierst du direkt aus der Datei:

```ts
import { Button } from '../atoms/button'
import { SearchField } from '../molecules/search-field'
```

> [!PRAXIS]
> In großen React-Monorepos gilt oft die Teamregel: eine Komponente pro Datei, Dateinamen in
> kebab-case, keine `index.ts`-Sammeldateien. Ein [[linter|Linter]] kann die Namensregel automatisch
> prüfen.

## Zusammenfassung

- **Atomic Design** teilt Komponenten in Atome, Moleküle und Organismen (plus Seiten) ein.
- Atome sind klein und allgemein, Organismen größer und dürfen fachliches Wissen haben.
- Abhängigkeiten zeigen nur nach unten: Organismus → Molekül → Atom.
- Eine Komponente pro Datei, Dateiname in **kebab-case**, Komponentenname in PascalCase.
- Stories und Tests liegen direkt neben der Komponente.
- **Keine Barrel-Dateien** – importiere direkt aus der Datei der Komponente.
