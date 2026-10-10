---
title: Prototypen und Klassen
summary: Wie JavaScript Eigenschaften über die Prototypenkette findet, was eine Klasse wirklich ist und wie du private Felder, statische Mitglieder und Vererbung einsetzt.
duration: 25
sources:
  - title: MDN – Inheritance and the prototype chain
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain
  - title: MDN – Classes
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes
  - title: MDN – Private elements
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_elements
  - title: MDN – static
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/static
quiz:
  - type: single
    question: "`const a = { gruss: \"Hallo\" }; const b = Object.create(a); b.name = \"Ada\";` – was liefert `b.gruss`?"
    options: ["undefined", "\"Hallo\"", "Einen Fehler", "\"Ada\""]
    answer: 1
    explanation: "`b` hat selbst kein `gruss`. JavaScript sucht deshalb im Prototyp `a` weiter und findet es dort."
  - type: multiple
    question: Welche Aussagen über Klassen in JavaScript stimmen?
    options:
      - "`typeof class {}` ergibt \"function\"."
      - Methoden einer Klasse liegen auf dem Prototyp und werden von allen Instanzen geteilt.
      - Auf ein Feld `#saldo` kann man von außen mit `konto.#saldo` zugreifen.
      - Statische Methoden ruft man an der Klasse auf, nicht an einer Instanz.
    answers: [0, 1, 3]
    explanation: Klassen sind Konstruktorfunktionen mit Prototyp. Private Felder mit # sind außerhalb der Klasse ein Syntaxfehler.
  - type: cloze
    text: "In einer abgeleiteten Klasse musst du im Konstruktor erst ___() aufrufen, bevor du `this` benutzen darfst."
    blanks:
      - [super]
    explanation: "`super(...)` führt den Konstruktor der Elternklasse aus und erzeugt dabei erst das Objekt, auf das `this` zeigt."
  - type: find-bug
    question: Die Klasse soll den Kontostand schützen, wirft aber beim Laden einen Syntaxfehler. Welche Zeile ist falsch?
    language: js
    code: |
      class Konto {
        #saldo = 0;
        einzahlen(betrag) {
          this.#saldo += betrag;
        }
        get saldo() {
          return #saldo;
        }
      }
    bug_line: 7
    explanation: "Private Felder werden immer über ein Objekt angesprochen: `return this.#saldo;`. Ein nacktes `#saldo` ist kein gültiger Ausdruck."
  - type: match
    question: Ordne jedem Begriff die passende Beschreibung zu.
    pairs:
      - { left: "#feld", right: "nur innerhalb der Klasse lesbar" }
      - { left: "static", right: "gehört zur Klasse statt zur Instanz" }
      - { left: "extends", right: "erbt von einer anderen Klasse" }
      - { left: "get", right: "Methode, die wie eine Eigenschaft gelesen wird" }
    explanation: Diese vier Schlüsselwörter decken den Großteil moderner Klassen ab.
tasks:
  - id: konto-klassen
    type: code
    language: js
    title: Konten mit privaten Feldern und Vererbung
    description: |
      Baue zwei Klassen:

      1. `Konto` mit dem privaten Feld `#saldo` (Start 0) und dem Konstruktor `constructor(inhaber)`, der
         `this.inhaber` setzt.
         - `einzahlen(betrag)` erhöht den Saldo. Bei einem Betrag `<= 0` wirft die Methode einen `RangeError`.
         - `abheben(betrag)` verringert den Saldo, wirft aber einen `RangeError`, wenn das Konto ins Minus ginge.
         - Der Getter `saldo` liefert den aktuellen Stand.
         - Die statische Methode `Konto.vonStartbetrag(inhaber, betrag)` erzeugt ein Konto und zahlt `betrag` ein.
      2. `Sparkonto extends Konto` mit zusätzlichem Konstruktor-Parameter `zinssatz` (z. B. `0.02`).
         - `verzinse()` zahlt `saldo * zinssatz` ein (gerundet auf zwei Nachkommastellen).

      Der Saldo darf **nicht** als normale Eigenschaft sichtbar sein.
    starter: |
      class Konto {
        constructor(inhaber) {
          this.inhaber = inhaber;
          this.saldo = 0;
        }

        einzahlen(betrag) {
          this.saldo += betrag;
        }

        abheben(betrag) {
          this.saldo -= betrag;
        }
      }

      class Sparkonto {}
    tests:
      - name: einzahlen und abheben
        code: 'const k = new Konto("Ada"); k.einzahlen(100); k.abheben(30); assertEqual(k.saldo, 70); assertEqual(k.inhaber, "Ada")'
      - name: ungültige Beträge werfen
        code: 'const k = new Konto("Ada"); assertThrows(() => k.einzahlen(0)); assertThrows(() => k.abheben(1)); assertEqual(k.saldo, 0)'
      - name: Saldo ist privat
        code: 'const k = new Konto("Ada"); k.einzahlen(5); assertDeepEqual(Object.keys(k), ["inhaber"])'
      - name: statische Fabrikmethode
        code: 'const k = Konto.vonStartbetrag("Linus", 50); assertTrue(k instanceof Konto); assertEqual(k.saldo, 50)'
      - name: Sparkonto erbt und verzinst
        code: 'const s = new Sparkonto("Grace", 0.02); s.einzahlen(1000); s.verzinse(); assertEqual(s.saldo, 1020); assertTrue(s instanceof Konto)'
      - name: Fehlertyp ist RangeError
        code: 'try { new Konto("A").abheben(10); assertTrue(false, "Es wurde kein Fehler geworfen"); } catch (e) { assertTrue(e instanceof RangeError) }'
    hints:
      - "Private Felder deklarierst du im Klassenkörper: `#saldo = 0;` und liest sie mit `this.#saldo`."
      - "Getter: `get saldo() { return this.#saldo; }`. In `Sparkonto` greifst du über `this.saldo` darauf zu – `#saldo` gehört nur `Konto`."
      - "`static vonStartbetrag(inhaber, betrag) { const k = new Konto(inhaber); k.einzahlen(betrag); return k; }`"
    solution: |
      class Konto {
        #saldo = 0;

        constructor(inhaber) {
          this.inhaber = inhaber;
        }

        static vonStartbetrag(inhaber, betrag) {
          const konto = new Konto(inhaber);
          konto.einzahlen(betrag);
          return konto;
        }

        get saldo() {
          return this.#saldo;
        }

        einzahlen(betrag) {
          if (betrag <= 0) {
            throw new RangeError("Der Betrag muss positiv sein.");
          }
          this.#saldo += betrag;
        }

        abheben(betrag) {
          if (betrag > this.#saldo) {
            throw new RangeError("Das Konto darf nicht ins Minus gehen.");
          }
          this.#saldo -= betrag;
        }
      }

      class Sparkonto extends Konto {
        constructor(inhaber, zinssatz) {
          super(inhaber);
          this.zinssatz = zinssatz;
        }

        verzinse() {
          const zinsen = Math.round(this.saldo * this.zinssatz * 100) / 100;
          if (zinsen > 0) {
            this.einzahlen(zinsen);
          }
        }
      }
  - id: eigenschaft-suchen
    type: order
    title: So sucht JavaScript eine Eigenschaft
    description: |
      `sparkonto.toString()` – `sparkonto` ist eine Instanz von `Sparkonto extends Konto`, und keine der beiden
      Klassen definiert `toString`. Bring die Suchschritte in die richtige Reihenfolge.
    items:
      - "Eigene Eigenschaften der Instanz sparkonto prüfen"
      - "Sparkonto.prototype prüfen (Methoden von Sparkonto)"
      - "Konto.prototype prüfen (Methoden von Konto)"
      - "Object.prototype prüfen – dort wird toString gefunden"
      - "Gäbe es auch dort nichts, wäre das Ergebnis undefined"
    hints:
      - Die Suche läuft von der Instanz über die Prototypen nach oben, bis zum Ende der Kette.
---
Du schreibst `const liste = [3, 1, 2];` und rufst sofort `liste.sort()` auf. Aber wo kommt `sort` her? Du
hast es nie definiert, und das Array-Objekt selbst enthält nur drei Zahlen. Die Antwort ist eines der
wichtigsten Konzepte von JavaScript: Prototypen. Wer sie versteht, versteht auch, was Klassen wirklich sind.

## Prototypen: Objekte erben von Objekten

Jedes Objekt in JavaScript hat einen versteckten Verweis auf ein anderes Objekt, seinen
[[prototyp|Prototyp]]. Fragst du nach einer Eigenschaft, die das Objekt selbst nicht hat, sucht JavaScript im
Prototyp weiter – dann in dessen Prototyp, und so fort. Diese Kette heißt
[[prototypenkette|Prototypenkette]]. Sie endet bei `Object.prototype`, dessen Prototyp `null` ist.

```js run
const tier = { atmet: true, beschreibe() { return `${this.name} atmet: ${this.atmet}`; } };
const katze = Object.create(tier);   // Prototyp von katze ist tier
katze.name = "Mia";

console.log(katze.beschreibe());                       // Mia atmet: true
console.log(Object.hasOwn(katze, "atmet"));             // false – geerbt
console.log(Object.getPrototypeOf(katze) === tier);     // true
```

Beim Array ist es genauso: `sort`, `map` und `push` liegen auf `Array.prototype`. Alle Arrays teilen sich diese
Methoden, statt jede selbst zu speichern.

![Die Prototypenkette einer Instanz: sparkonto zeigt auf Sparkonto.prototype, dieses auf Konto.prototype, dieses auf Object.prototype und am Ende auf null.](/assets/javascript/prototypenkette.svg)

> [!MERKSATZ]
> Lesen sucht entlang der Prototypenkette. **Schreiben** legt die Eigenschaft immer direkt am Objekt selbst an.

## Klassen sind Prototypen mit schöner Syntax

Aus den Grundlagen kennst du [[klasse|Klassen]], [[konstruktor|Konstruktoren]] und [[instanz|Instanzen]].
Unter der Haube ist eine Klasse eine Funktion, und ihre Methoden landen auf `Klasse.prototype`:

```js run
class Punkt {
  constructor(x, y) {
    this.x = x;            // eigene Eigenschaft jeder Instanz
    this.y = y;
  }
  abstand() {              // liegt auf Punkt.prototype – einmal für alle
    return Math.hypot(this.x, this.y);
  }
}
const p = new Punkt(3, 4);
console.log(typeof Punkt, p.abstand());              // function 5
console.log(Object.keys(p));                          // ["x", "y"]
console.log(Object.getPrototypeOf(p) === Punkt.prototype);   // true
```

`new` erzeugt ein leeres Objekt, setzt dessen Prototyp auf `Punkt.prototype` und ruft den Konstruktor mit
diesem Objekt als `this` auf. Mit [[instanceof|`instanceof`]] prüfst du, ob ein Prototyp in der Kette eines
Objekts vorkommt.

## Private Felder mit #

Früher markierte man interne Eigenschaften mit einem Unterstrich (`_saldo`) und hoffte, dass sich alle
daran halten. Heute gibt es echte [[private-feld|private Felder]]: Ein Name mit `#` ist außerhalb des
Klassenkörpers nicht erreichbar – der Versuch ist ein Syntaxfehler.

```js run
class Konto {
  #saldo = 0;                       // Felddeklaration im Klassenkörper
  einzahlen(betrag) {
    this.#pruefe(betrag);
    this.#saldo += betrag;
  }
  get saldo() { return this.#saldo; }   // nur lesen erlaubt
  #pruefe(betrag) {                     // auch Methoden können privat sein
    if (betrag <= 0) throw new RangeError("Betrag muss positiv sein");
  }
}
const k = new Konto();
k.einzahlen(50);
console.log(k.saldo, Object.keys(k));   // 50 []
```

Das ist echte [[kapselung|Kapselung]]: Niemand kann den Saldo ohne die Prüfung verändern. Mit einem
[[getter-und-setter|Getter]] machst du ihn trotzdem lesbar.

> [!FEHLER]
> Private Felder musst du im Klassenkörper **deklarieren**. `this.#neu = 1` im Konstruktor ohne vorherige
> Deklaration `#neu;` ist ein Syntaxfehler.

## Statische Mitglieder

Manche Werte und Funktionen gehören zur Klasse als Ganzes, nicht zu einem einzelnen Objekt. Diese
[[statisches-mitglied|statischen Mitglieder]] markierst du mit `static` und rufst sie an der Klasse auf:

```js run
class Temperatur {
  static #anzahl = 0;                   // privat und statisch
  static ABSOLUTER_NULLPUNKT = -273.15;

  constructor(celsius) {
    this.celsius = celsius;
    Temperatur.#anzahl += 1;
  }
  static ausFahrenheit(f) {             // statische Fabrikmethode
    return new Temperatur(((f - 32) * 5) / 9);
  }
  static get anzahl() { return Temperatur.#anzahl; }
}
const t = Temperatur.ausFahrenheit(212);
console.log(t.celsius, Temperatur.anzahl, Temperatur.ABSOLUTER_NULLPUNKT);   // 100 1 -273.15
```

Typische Einsätze: Fabrikmethoden wie `Date.now()` oder `Array.from()`, Konstanten und Zähler über alle
Instanzen.

## Vererbung mit extends und super

[[vererbung|Vererbung]] verlängert die Prototypenkette. `class Sparkonto extends Konto` sorgt dafür, dass
`Sparkonto.prototype` als Prototyp `Konto.prototype` hat. Mit [[super|`super`]] erreichst du die Elternklasse:

```js run
class Konto {
  constructor(inhaber) { this.inhaber = inhaber; }
  beschreibe() { return `Konto von ${this.inhaber}`; }
}
class Sparkonto extends Konto {
  constructor(inhaber, zinssatz) {
    super(inhaber);                  // Pflicht, bevor this benutzt wird
    this.zinssatz = zinssatz;
  }
  beschreibe() {
    return `${super.beschreibe()} mit ${this.zinssatz * 100} % Zinsen`;
  }
}
const s = new Sparkonto("Ada", 0.02);
console.log(s.beschreibe(), s instanceof Konto);   // … true
```

> [!PRAXIS]
> In modernem Frontend-Code sind tiefe Vererbungsketten selten. Häufiger sind kleine Klassen für klar
> abgegrenzte Dinge – etwa eine eigene Fehlerklasse `class HttpError extends Error`, die du im Modul über
> asynchrones JavaScript baust.

## Zusammenfassung

- Jedes Objekt hat einen Prototyp; fehlende Eigenschaften werden entlang der Prototypenkette gesucht.
- Eine Klasse ist eine Funktion; ihre Methoden liegen auf `Klasse.prototype` und werden geteilt.
- `new` erzeugt das Objekt, verknüpft den Prototyp und ruft den Konstruktor auf.
- Felder und Methoden mit `#` sind wirklich privat; deklariere sie im Klassenkörper.
- `static` hängt Werte und Methoden an die Klasse selbst, z. B. Fabrikmethoden.
- `extends` verlängert die Kette, `super()` muss im Konstruktor vor `this` aufgerufen werden.
