---
title: Stacks und Queues
summary: Zwei einfache Strukturen mit klaren Regeln – zuletzt rein, zuerst raus und zuerst rein, zuerst raus – und wo sie dir im Weballtag ständig begegnen.
duration: 20
sources:
  - title: MDN – Array.prototype.push()
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push
  - title: MDN – Array.prototype.shift()
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/shift
  - title: PHP-Handbuch – SplStack
    url: https://www.php.net/manual/de/class.splstack.php
  - title: PHP-Handbuch – SplQueue
    url: https://www.php.net/manual/de/class.splqueue.php
quiz:
  - type: single
    question: "Du legst nacheinander A, B und C auf einen Stack und rufst dann zweimal `pop()` auf. Was liegt danach noch auf dem Stack?"
    options: ["A", "C", "A und B", "Nichts"]
    answer: 0
    explanation: Ein Stack arbeitet nach LIFO – zuerst kommt C heraus, dann B. Übrig bleibt A.
  - type: match
    question: Stack oder Queue? Ordne jedem Anwendungsfall die passende Struktur zu.
    pairs:
      - { left: "Rückgängig machen (Undo) im Editor", right: "Stack" }
      - { left: "E-Mails nacheinander in Eingangsreihenfolge versenden", right: "Queue" }
      - { left: "Der Zurück-Button im Browser", right: "Stack" }
      - { left: "Druckaufträge an einen Drucker", right: "Queue" }
    explanation: Wer das zuletzt Hinzugefügte zuerst braucht, nimmt einen Stack. Wer Fairness nach Ankunft braucht, eine Queue.
  - type: cloze
    text: "Ein Stack arbeitet nach dem Prinzip ___ (zuletzt rein, zuerst raus), eine Queue nach ___ (zuerst rein, zuerst raus)."
    blanks:
      - ["LIFO", "Last In First Out", "Last-In-First-Out"]
      - ["FIFO", "First In First Out", "First-In-First-Out"]
    explanation: LIFO = Last In, First Out. FIFO = First In, First Out.
  - type: find-bug
    question: "Diese Warteschlange soll Aufträge in der Reihenfolge ihres Eingangs abarbeiten. In welcher Zeile wird die Reihenfolge falsch?"
    language: js
    code: |
      const auftraege = [];
      auftraege.push("A");
      auftraege.push("B");
      auftraege.push("C");
      const naechster = auftraege.pop();
      console.log(naechster);
    bug_line: 5
    explanation: >
      `pop()` nimmt das zuletzt eingefügte Element („C“) – das ist Stack-Verhalten. Für eine Queue brauchst
      du das älteste Element, also `shift()` oder besser eine Queue mit Lese-Index.
  - type: multiple
    question: Welche Operationen sind O(1)?
    options:
      - "`stapel.push(x)` und `stapel.pop()` auf einem Array"
      - "`liste.shift()` auf einem Array mit 100 000 Elementen"
      - "Das nächste Element aus einer Queue mit Lese-Index holen"
      - "`array_shift($liste)` in PHP"
    answers: [0, 2]
    explanation: >
      Alles am Ende eines Arrays ist O(1). `shift` und `array_shift` verschieben bzw. nummerieren alle übrigen
      Elemente neu und sind deshalb O(n).
tasks:
  - id: klammern-pruefen
    type: code
    language: js
    title: Klammern prüfen mit einem Stack
    description: |
      Editoren und Linter prüfen ständig, ob Klammern korrekt geschlossen sind. Schreibe
      `pruefeKlammern(text)`, die `true` liefert, wenn alle Klammern `()`, `[]` und `{}` korrekt
      verschachtelt sind, sonst `false`.

      1. Andere Zeichen werden ignoriert.
      2. Jede schließende Klammer muss zur **zuletzt** geöffneten passen.
      3. Am Ende darf keine Klammer offen sein.
      4. Ein leerer String ist korrekt.
    starter: |
      function pruefeKlammern(text) {
        const passend = { ")": "(", "]": "[", "}": "{" };
        const stapel = [];
        for (const zeichen of text) {
          // öffnende Klammer → auf den Stapel
          // schließende Klammer → mit dem obersten Element vergleichen
        }
        return true;
      }
    tests:
      - name: korrekt verschachtelt
        code: |
          assertEqual(pruefeKlammern("if (a[0] === b) { run(); }"), true);
          assertEqual(pruefeKlammern("({[]})"), true);
      - name: leerer String
        code: assertEqual(pruefeKlammern(""), true)
      - name: falsche Reihenfolge
        code: |
          assertEqual(pruefeKlammern("(]"), false);
          assertEqual(pruefeKlammern("([)]"), false);
      - name: offene oder überzählige Klammern
        code: |
          assertEqual(pruefeKlammern("((x)"), false);
          assertEqual(pruefeKlammern("x)"), false);
          assertEqual(pruefeKlammern("}{"), false);
    hints:
      - "Öffnende Klammern erkennst du mit `\"([{\".includes(zeichen)` – bei drei Zeichen ist das unbedenklich."
      - "Bei einer schließenden Klammer: `if (stapel.pop() !== passend[zeichen]) return false;`"
      - "Am Ende muss der Stapel leer sein: `return stapel.length === 0;`"
    solution: |
      function pruefeKlammern(text) {
        const passend = { ")": "(", "]": "[", "}": "{" };
        const stapel = [];
        for (const zeichen of text) {
          if ("([{".includes(zeichen)) {
            stapel.push(zeichen);
          } else if (zeichen in passend) {
            if (stapel.pop() !== passend[zeichen]) return false;
          }
        }
        return stapel.length === 0;
      }
  - id: undo-redo
    type: steps
    title: Undo und Redo mit zwei Stacks
    description: >
      Ein Texteditor verwaltet „Rückgängig“ und „Wiederholen“ mit zwei Stacks: `undo` und `redo`.
      Jede neue Eingabe landet auf `undo` und leert `redo`. Spiel die Situation durch.
    steps:
      - situation: >
          Du tippst nacheinander „Hallo“, „ Welt“ und „!“. Jede Eingabe wird auf den Stack `undo` gelegt.
          `redo` ist leer.
        question: Du drückst einmal Strg+Z. Welche Eingabe wird rückgängig gemacht?
        options: ["„Hallo“", "„ Welt“", "„!“"]
        answer: 2
        explanation: Undo holt mit `pop()` das oberste Element von `undo` – das ist die letzte Eingabe „!“.
      - situation: >
          Das rückgängig gemachte „!“ wurde dabei auf den Stack `redo` gelegt. `undo` enthält jetzt „Hallo“ und „ Welt“.
        question: Du drückst Strg+Y (Wiederholen). Was passiert?
        options:
          - "„!“ wird von `redo` geholt, wieder eingefügt und auf `undo` gelegt."
          - "„Hallo“ wird erneut eingefügt."
          - Nichts – Wiederholen geht nur direkt nach dem Speichern.
        answer: 0
        explanation: Redo ist das Spiegelbild von Undo – `pop()` von `redo`, `push()` auf `undo`.
      - situation: >
          Du machst „!“ noch einmal rückgängig (`redo` enthält wieder „!“) und tippst danach „?“.
        question: Was sollte jetzt mit dem Stack `redo` passieren?
        options:
          - Er bleibt unverändert, damit „!“ später wiederholt werden kann.
          - Er wird geleert, weil eine neue Eingabe einen neuen Verlauf beginnt.
          - "„?“ wird auf `redo` gelegt."
        answer: 1
        explanation: >
          Nach einer neuen Eingabe passt der alte Redo-Verlauf nicht mehr zum Text. Deshalb leeren praktisch
          alle Editoren `redo`, sobald du etwas Neues tippst.
---
In der Kantine nimmst du den obersten Teller vom Stapel – den, der zuletzt abgestellt wurde. An der
Supermarktkasse ist es umgekehrt: Wer zuerst kam, wird zuerst bedient. Diese zwei Regeln sind so nützlich,
dass sie eigene Namen haben: [[stack|Stack]] und [[queue|Queue]]. Beide sind eigentlich nur Arrays oder
Listen mit Spielregeln.

## Der Stack: zuletzt rein, zuerst raus

Ein Stack (Stapel) erlaubt nur zwei Operationen am oberen Ende: **push** legt etwas drauf, **pop** nimmt
das Oberste herunter. Das Prinzip heißt LIFO – *Last In, First Out*.

```js
const stapel = [];
stapel.push("A");
stapel.push("B");
stapel.push("C");
stapel.pop();               // "C"
stapel[stapel.length - 1];  // "B" – oben nachschauen, ohne zu entfernen (peek)
```

In JavaScript ist ein Array mit `push` und `pop` bereits ein perfekter Stack: Beide Operationen
arbeiten am Ende und sind O(1).

![Stack und Queue im Vergleich](/assets/datenstrukturen-algorithmen/stack-und-queue.svg)

Stacks begegnen dir überall:

- **Undo** im Editor: Die letzte Änderung wird zuerst zurückgenommen.
- **Zurück-Button** im Browser: Die zuletzt besuchte Seite kommt zuerst.
- Der [[call-stack|Call Stack]]: Jede aufgerufene Funktion legt sich oben drauf und wird nach dem `return` wieder entfernt.

> [!MERKSATZ]
> Immer wenn du „das Zuletzt-Geöffnete zuerst schließen“ musst, ist ein Stack die richtige Struktur.

## Beispiel: Klammern prüfen

Ein Linter muss wissen, ob `{ [ ( ) ] }` korrekt verschachtelt ist. Jede schließende Klammer muss zur
**zuletzt** geöffneten passen – ein klarer Fall für einen Stack.

| Zeichen | Aktion | Stapel danach |
|---|---|---|
| `{` | push | `{` |
| `[` | push | `{ [` |
| `(` | push | `{ [ (` |
| `)` | pop, passt zu `(` | `{ [` |
| `]` | pop, passt zu `[` | `{` |
| `}` | pop, passt zu `{` | leer → korrekt |

Bleibt am Ende etwas auf dem Stapel oder passt ein `pop` nicht, ist der Text fehlerhaft. Diese Prüfung
programmierst du gleich selbst.

## Die Queue: zuerst rein, zuerst raus

Eine Queue (Warteschlange) fügt hinten an (**enqueue**) und nimmt vorne weg (**dequeue**). Das Prinzip
heißt FIFO – *First In, First Out*.

Typische Einsätze im Web:

- Eine [[job-queue|Job-Queue]] verschickt E-Mails in der Reihenfolge, in der sie beauftragt wurden.
- Die [[event-loop|Event Loop]] arbeitet Callbacks aus einer Warteschlange ab.
- Die Breitensuche in Graphen (Modul 3) besucht Knoten in der Reihenfolge, in der sie entdeckt wurden.

```js
const schlange = [];
schlange.push("Auftrag 1");   // hinten anstellen
schlange.push("Auftrag 2");
schlange.shift();             // "Auftrag 1" – vorne weg, aber O(n)!
```

> [!FEHLER]
> `shift()` sieht wie die perfekte Dequeue-Operation aus, verschiebt aber alle übrigen Elemente um einen
> Platz. Bei 100 000 wartenden Einträgen wird jede Entnahme teuer – die ganze Abarbeitung ist dann O(n²).

## Eine schnelle Queue bauen

Der Trick: Statt Elemente zu verschieben, merkst du dir, wo vorne gerade ist.

```js
class Queue {
  #elemente = [];
  #vorne = 0;

  enqueue(wert) { this.#elemente.push(wert); }   // O(1)

  dequeue() {                                    // O(1)
    if (this.#vorne >= this.#elemente.length) return undefined;
    const wert = this.#elemente[this.#vorne];
    this.#elemente[this.#vorne] = undefined;     // Speicher freigeben
    this.#vorne++;
    return wert;
  }

  get size() { return this.#elemente.length - this.#vorne; }
}
```

Die verkettete Liste aus Modul 1 mit `kopf` und `ende` ist ebenfalls eine O(1)-Queue.

## Stacks und Queues in PHP

PHP-Arrays haben `array_push()` und `array_pop()` (O(1)). `array_shift()` dagegen nummeriert alle
Schlüssel neu und ist O(n). Für Warteschlangen bringt die SPL eigene Klassen mit:

```php
$queue = new SplQueue();
$queue->enqueue('mail-1');
$queue->enqueue('mail-2');
echo $queue->dequeue(); // mail-1

$stack = new SplStack();
$stack->push('seite-1');
$stack->push('seite-2');
echo $stack->pop();     // seite-2
```

Eine Sonderform ist die **Prioritätswarteschlange**, bei der das wichtigste Element zuerst drankommt –
in PHP [`SplPriorityQueue`](https://www.php.net/manual/de/class.splpriorityqueue.php).

> [!PRAXIS]
> Laravel-Queues, Message-Broker und Webhook-Zustellung sind große, ausfallsichere Queues. Das Prinzip ist
> genau das aus dieser Lektion – nur dass die Warteschlange in einer Datenbank oder in Redis liegt.

## Zusammenfassung

- Ein Stack arbeitet nach LIFO: `push` legt oben drauf, `pop` nimmt oben weg – beides O(1).
- Undo, Zurück-Button und der Call Stack sind Stacks.
- Eine Queue arbeitet nach FIFO: hinten anstellen, vorne entnehmen.
- `shift()` und `array_shift()` sind O(n) – für große Queues nimm einen Lese-Index, eine verkettete Liste oder `SplQueue`.
- Job-Queues, die Event Loop und die Breitensuche sind Queues.
