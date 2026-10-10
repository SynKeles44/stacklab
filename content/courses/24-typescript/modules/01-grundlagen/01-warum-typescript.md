---
title: Warum TypeScript?
summary: Was statische Typen sind, welche Fehler sie abfangen und warum TypeScript-Typen beim Ausführen spurlos verschwinden.
duration: 20
sources:
  - title: TypeScript Handbook – The Basics
    url: https://www.typescriptlang.org/docs/handbook/2/basic-types.html
  - title: TypeScript for JavaScript Programmers
    url: https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html
  - title: Announcing TypeScript 7.0
    url: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
quiz:
  - type: single
    question: Wann meldet TypeScript einen Typfehler?
    options:
      - Erst, wenn die fehlerhafte Zeile im Browser ausgeführt wird.
      - Beim Prüfen des Codes, bevor das Programm überhaupt läuft.
      - Nur, wenn man den Code mit Node.js startet.
    answer: 1
    explanation: Die Typprüfung ist statisch – `tsc` und der Editor lesen den Code und melden Fehler, ohne ihn auszuführen.
  - type: multiple
    question: Welche Aussagen über TypeScript stimmen?
    options:
      - Jedes gültige JavaScript ist auch gültiges TypeScript, nur ohne Typangaben.
      - Typangaben werden beim Übersetzen entfernt und existieren zur Laufzeit nicht mehr.
      - TypeScript prüft zur Laufzeit automatisch, ob JSON von einer API zum Typ passt.
      - Der Editor nutzt die Typen für Autovervollständigung und sicheres Umbenennen.
    answers: [0, 1, 3]
    explanation: >
      TypeScript ist eine Obermenge von JavaScript. Die Typen gibt es nur beim Prüfen – zur Laufzeit ist es
      ganz normales JavaScript. Daten von außen musst du deshalb selbst prüfen (dazu später mehr mit Zod).
  - type: cloze
    text: "Der TypeScript-Compiler heißt `___`. Mit `npx tsc --___` prüft er nur die Typen und schreibt keine Dateien."
    blanks:
      - [tsc]
      - [noEmit]
    explanation: "`tsc` steht für TypeScript Compiler. `--noEmit` heißt: nur prüfen, nichts ausgeben."
  - type: find-bug
    question: Dieser Code läuft in JavaScript ohne Absturz, liefert aber Unsinn. TypeScript meldet den Fehler sofort. In welcher Zeile?
    language: ts
    code: |
      const user = { firstName: "Ada", lastName: "Lovelace" };
      function fullName(u: { firstName: string; lastName: string }) {
        return u.firstName + " " + u.lastname;
      }
      console.log(fullName(user));
    bug_line: 3
    explanation: "`lastname` ist kleingeschrieben. JavaScript liefert still `undefined` und gibt „Ada undefined“ aus – TypeScript meldet: Property 'lastname' does not exist."
tasks:
  - id: pipeline-beschriften
    type: diagram
    title: Beschrifte den Weg von .ts zu .js
    description: |
      Aus einer `.ts`-Datei passieren zwei getrennte Dinge: Die Typen werden **geprüft**, und die Typen
      werden **entfernt**, damit JavaScript übrig bleibt. Ordne jedem leeren Kasten seine Bedeutung zu.
    image: /assets/typescript/ts-pipeline-leer.svg
    slots:
      - { x: 46, y: 26, answer: Typprüfung }
      - { x: 46, y: 74, answer: Typen entfernen }
      - { x: 84, y: 26, answer: Fehlermeldungen }
      - { x: 84, y: 74, answer: JavaScript-Datei }
    distractors: [Typen zur Laufzeit prüfen, Maschinencode]
    hints:
      - Nur einer der beiden Wege führt zu Code, der im Browser läuft.
      - Fehler entstehen bei der Prüfung, nicht beim Entfernen der Typen.
  - id: erster-typfehler
    type: terminal
    title: Dein erster Typfehler
    description: |
      Im Ordner `erster-typfehler` liegt ein kleines TypeScript-Projekt. TypeScript ist schon installiert,
      und `src/cart.ts` berechnet den Preis eines Warenkorbs – leider mit zwei Fehlern in den Daten.

      1. Wechsle mit `cd erster-typfehler` in den Ordner und starte die Typprüfung: `npx tsc --noEmit`.
      2. Lies die Fehlermeldungen: Datei, Zeile, Spalte und Text zeigen dir, wo es klemmt.
      3. Korrigiere **die Daten** in `src/cart.ts` (nicht den Typ `Item`!). Der Kaffee kostet 3.50 €.
      4. Prüfe erneut, bis `npx tsc --noEmit` ohne Ausgabe endet.
      5. Starte das Programm mit `node src/cart.ts`. Es soll `9.20` ausgeben.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit das Projekt angelegt wird.
    workdir: erster-typfehler
    setup: |
      npm init -y >/dev/null
      npm pkg set type=module
      npm install --save-dev --no-audit --no-fund typescript@7.0.2 >/dev/null
      cat > tsconfig.json <<'JSON'
      {
        "compilerOptions": {
          "target": "es2024",
          "module": "nodenext",
          "strict": true,
          "noEmit": true,
          "skipLibCheck": true
        },
        "include": ["src"]
      }
      JSON
      mkdir -p src
      cat > src/cart.ts <<'TS'
      type Item = { name: string; price: number; quantity: number };

      function total(items: Item[]): number {
        return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      }

      const items: Item[] = [
        { name: "Kaffee", price: "3.50", quantity: 2 },
        { name: "Tee", price: 2.2, quantiy: 1 },
      ];

      console.log(total(items).toFixed(2));
      TS
    checks:
      - type: file_contains
        path: src/cart.ts
        pattern: "price: number; quantity: number"
        message: Der Typ `Item` soll unverändert bleiben – korrigiere die Daten, nicht den Typ.
      - type: command
        run: npx tsc --noEmit
        expect_exit: 0
        message: "`npx tsc --noEmit` meldet noch Fehler. Ein Preis ist ein String statt einer Zahl, und eine Eigenschaft ist falsch geschrieben."
      - type: command
        run: node src/cart.ts
        stdout_matches: "^9\\.20$"
        message: "`node src/cart.ts` soll 9.20 ausgeben. Prüfe Preis (3.5) und Menge (quantity) der beiden Artikel."
    hints:
      - Die erste Meldung sagt `Type 'string' is not assignable to type 'number'` – schau dir die Anführungszeichen an.
      - Die zweite Meldung nennt eine Eigenschaft, die es in `Item` nicht gibt. Vergleiche die Schreibweise mit `quantity`.
      - "Richtig ist `{ name: \"Kaffee\", price: 3.5, quantity: 2 }` und `{ name: \"Tee\", price: 2.2, quantity: 1 }`."
    solution: |
      In `src/cart.ts` die Daten korrigieren:

      ```ts
      const items: Item[] = [
        { name: "Kaffee", price: 3.5, quantity: 2 },
        { name: "Tee", price: 2.2, quantity: 1 },
      ];
      ```

      Danach endet `npx tsc --noEmit` ohne Ausgabe, und `node src/cart.ts` gibt `9.20` aus.
---
Stell dir vor, du schreibst `user.lastname` statt `user.lastName`. JavaScript beschwert sich nicht – es
liefert still `undefined`, und dein Kunde sieht „Hallo Ada undefined“. Solche Fehler fallen oft erst
auf, wenn echte Menschen die Seite benutzen. [[typescript|TypeScript]] findet sie, **bevor** dein Code
überhaupt läuft.

## Das Problem: JavaScript prüft zu spät

[[javascript|JavaScript]] hat eine [[dynamische-typisierung|dynamische Typisierung]]: Eine
[[variable|Variable]] kann erst eine Zahl und später einen Text enthalten. Ob eine Operation passt,
merkt JavaScript erst in dem Moment, in dem die Zeile ausgeführt wird.

```js title="JavaScript – alles läuft, nichts stimmt"
const price = "3.50";
console.log(price * 2);      // 7 – zufällig richtig
console.log(price + 2);      // "3.502" – Text statt Zahl
const user = { name: "Ada" };
console.log(user.nmae);      // undefined – Tippfehler, keine Meldung
user.greet();                // TypeError – Absturz erst zur Laufzeit
```

Das ist ein [[laufzeitfehler|Laufzeitfehler]]: Er passiert beim Ausführen. Steckt er in einem selten
benutzten Zweig, merkt ihn vielleicht wochenlang niemand.

## Die Lösung: statische Typen

TypeScript ist JavaScript plus **Typangaben**. Du schreibst dazu, welchen [[datentyp|Datentyp]] ein Wert
haben soll. Ein Prüfprogramm liest deinen Code und vergleicht – ohne ihn auszuführen. Das heißt
[[statische-typisierung|statische Typisierung]].

```ts title="TypeScript – Fehler vor dem Start"
const user: { name: string } = { name: "Ada" };
console.log(user.nmae);
// error TS2551: Property 'nmae' does not exist on type '{ name: string; }'.
//               Did you mean 'name'?
```

Die Angabe `: { name: string }` ist eine [[typ-annotation|Typ-Annotation]]. Wie ein Etikett auf einem
Umzugskarton sagt sie: Hier darf nur das hinein. Der Prüfer schlägt Alarm, wenn etwas anderes drin ist.

> [!MERKSATZ]
> TypeScript prüft **vor** dem Ausführen. Jedes gültige JavaScript ist auch gültiges TypeScript –
> die Typen sind eine zusätzliche Schicht obendrauf.

## Typen verschwinden zur Laufzeit

Browser und [[nodejs|Node.js]] führen nur JavaScript aus. Deshalb passieren mit einer `.ts`-Datei zwei
getrennte Dinge:

![Aus einer .ts-Datei wird einmal geprüft und einmal JavaScript erzeugt](/assets/typescript/ts-pipeline.svg)

1. **Typprüfung:** Der [[compiler|Compiler]] `tsc` meldet Fehler im [[editor|Editor]] und im Terminal.
2. **Typen entfernen:** Die Annotationen werden gelöscht, übrig bleibt JavaScript. Das erledigt `tsc`,
   ein [[bundler|Bundler]] wie [[vite|Vite]] – oder Node.js selbst. Node.js 24 kann `.ts`-Dateien direkt
   starten, indem es die Typen einfach wegschneidet ([[type-stripping|Type Stripping]]).

Wichtig: Beides ist unabhängig. Node.js führt eine `.ts`-Datei auch dann aus, wenn sie Typfehler hat –
es prüft nichts. Die Prüfung machst du mit `tsc`.

> [!FEHLER]
> „TypeScript prüft doch, ob die API-Antwort stimmt.“ – Nein. Zur Laufzeit gibt es keine Typen mehr.
> Was von außen kommt (JSON, Formulare), musst du selbst prüfen. Das lernst du in Modul 4 mit Zod.

## Mehr als Fehlersuche: Werkzeuge

Typen helfen nicht nur beim Fehlerfinden. Dein Editor fragt über den [[language-server|Language Server]]
von TypeScript ständig nach, was ein Wert ist. Dadurch bekommst du:

| Funktion | Was du davon hast |
|---|---|
| Autovervollständigung | Nach `user.` siehst du alle Eigenschaften mit ihrem Typ. |
| Sofortige Fehler | Rote Wellenlinie, noch bevor du speicherst. |
| Sicheres Umbenennen | Ein [[refactoring|Refactoring]] ändert jede Verwendung im ganzen Projekt. |
| Dokumentation | Die Signatur einer Funktion zeigt, was sie erwartet und zurückgibt. |

Das wirkt sogar in reinen JavaScript-Projekten: VS Code nutzt TypeScript im Hintergrund, um dir
Vorschläge für JavaScript-Code zu machen.

> [!PRAXIS]
> In großen Codebasen ist TypeScript heute Standard. Neue Teammitglieder lesen an den Typen ab, wie
> Daten aussehen – ohne die Datenbank oder die API-Dokumentation zu öffnen.

## TypeScript 7: der native Compiler

TypeScript wurde lange in TypeScript selbst geschrieben. Mit **TypeScript 7** (Juli 2026) hat Microsoft
den Compiler in die Programmiersprache [[go-sprache|Go]] portiert. Ergebnis: Große Projekte werden laut
Microsoft etwa **acht- bis zwölfmal schneller** geprüft, weil der Compiler jetzt nativ und auf mehreren
Prozessorkernen läuft.

Für dich ändert sich am Arbeiten wenig: Du installierst weiter `typescript` über [[npm]] und startest
`tsc`. Neu sind strengere Voreinstellungen – zum Beispiel ist `strict` jetzt standardmäßig an. Alte
Optionen wie `target: "es5"` gibt es nicht mehr. Die Details lernst du in der nächsten Lektion.

```bash title="Terminal"
npm install --save-dev typescript
npx tsc --version      # Version 7.0.2
npx tsc --noEmit       # nur prüfen, keine Dateien schreiben
```

## Zusammenfassung

- JavaScript entdeckt viele Fehler erst beim Ausführen – oft zu spät.
- TypeScript ergänzt **statische Typen** und prüft deinen Code, ohne ihn auszuführen.
- Zur Laufzeit gibt es keine Typen: Sie werden vorher entfernt (von `tsc`, einem Bundler oder Node.js).
- Typprüfung (`tsc --noEmit`) und Ausführen sind zwei getrennte Schritte.
- Typen verbessern Autovervollständigung, Refactoring und Lesbarkeit.
- TypeScript 7 bringt einen nativen, deutlich schnelleren Compiler und strengere Standardwerte.
