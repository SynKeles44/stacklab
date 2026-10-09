---
title: Klassen und Objekte
summary: Die Grundideen der Objektorientierung – Klassen als Bauplan, Konstruktor, Methoden, Kapselung, Vererbung und Interfaces in JavaScript und PHP.
duration: 25
sources:
  - title: MDN – Klassen
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes
  - title: MDN – Private Eigenschaften (#)
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_properties
  - title: PHP-Handbuch – Klassen und Objekte
    url: https://www.php.net/manual/de/language.oop5.basic.php
  - title: PHP-Handbuch – Interfaces
    url: https://www.php.net/manual/de/language.oop5.interfaces.php
quiz:
  - type: match
    question: Ordne jedem Begriff die passende Beschreibung zu.
    pairs:
      - { left: "Klasse", right: "Bauplan für Objekte einer Art" }
      - { left: "Instanz", right: "Konkretes Objekt, mit new erzeugt" }
      - { left: "Konstruktor", right: "Legt beim Erzeugen die Startwerte fest" }
      - { left: "Methode", right: "Funktion, die zu einem Objekt gehört" }
    explanation: Aus einer Klasse entstehen mit new beliebig viele Instanzen. Der Konstruktor läuft dabei einmal, Methoden rufst du danach beliebig oft auf.
  - type: find-bug
    question: "`konto.saldo` ist nach dem Einzahlen immer noch 0. Welche Zeile ist falsch?"
    language: js
    code: |
      class Konto {
        constructor() {
          this.saldo = 0;
        }
        einzahlen(betrag) {
          saldo = saldo + betrag;
        }
      }
    bug_line: 6
    explanation: Ohne this sucht JavaScript eine Variable saldo statt der Eigenschaft des Objekts. Richtig ist this.saldo = this.saldo + betrag.
  - type: multiple
    question: Welche Aussagen über Vererbung und Interfaces stimmen?
    options:
      - Mit extends übernimmt eine Klasse Eigenschaften und Methoden einer anderen.
      - super(...) ruft den Konstruktor der Elternklasse auf.
      - Ein Interface enthält die fertige Umsetzung aller Methoden.
      - PHP und TypeScript kennen Interfaces, reines JavaScript nicht.
    answers: [0, 1, 3]
    explanation: Ein Interface beschreibt nur, welche Methoden es geben muss – das „Was", nicht das „Wie".
  - type: cloze
    text: In JavaScript machst du ein Feld mit dem Zeichen ___ privat. In PHP greifst du in einer Methode mit `$___->saldo` auf das eigene Objekt zu.
    blanks:
      - ["#"]
      - [this]
    explanation: "#saldo ist von außen nicht erreichbar. PHP nutzt $this-> statt this."
tasks:
  - id: konto-klasse
    type: code
    language: js
    title: Ein gekapseltes Bankkonto
    description: |
      Schreibe eine Klasse `Konto`:

      1. Der Konstruktor bekommt den `inhaber` (String) und speichert ihn als öffentliche Eigenschaft. Der Kontostand liegt im **privaten** Feld `#saldo` und beginnt bei 0.
      2. `einzahlen(betrag)` erhöht den Saldo. Beträge kleiner oder gleich 0 werden ignoriert. Die Methode gibt den neuen Saldo zurück.
      3. `abheben(betrag)` verringert den Saldo, aber nur, wenn genug Geld da ist. Sie gibt `true` zurück, wenn es geklappt hat, sonst `false`.
      4. Ein Getter `saldo` liefert den Kontostand (lesbar als `konto.saldo`, ohne Klammern).
    starter: |
      class Konto {
        constructor(inhaber) {
        }
      }
    tests:
      - name: neues Konto hat Inhaber und Saldo 0
        code: 'const k = new Konto("Ada"); assertTrue(k.inhaber === "Ada" && k.saldo === 0)'
      - name: einzahlen erhöht und gibt den Saldo zurück
        code: 'const k = new Konto("Ada"); k.einzahlen(50); assertEqual(k.einzahlen(25), 75)'
      - name: negative Einzahlungen werden ignoriert
        code: 'const k = new Konto("Ada"); k.einzahlen(-10); k.einzahlen(0); assertEqual(k.saldo, 0)'
      - name: abheben klappt nur mit Deckung
        code: 'const k = new Konto("Ada"); k.einzahlen(30); assertTrue(k.abheben(50) === false && k.abheben(20) === true && k.saldo === 10)'
      - name: saldo lässt sich von außen nicht setzen
        code: 'const k = new Konto("Ada"); try { k.saldo = 1000; } catch {} assertEqual(k.saldo, 0)'
    hints:
      - "Private Felder deklarierst du in der Klasse: `#saldo = 0;` und nutzt sie mit `this.#saldo`."
      - "Getter: `get saldo() { return this.#saldo; }`"
    solution: |
      class Konto {
        #saldo = 0;

        constructor(inhaber) {
          this.inhaber = inhaber;
        }

        get saldo() {
          return this.#saldo;
        }

        einzahlen(betrag) {
          if (betrag > 0) {
            this.#saldo += betrag;
          }
          return this.#saldo;
        }

        abheben(betrag) {
          if (betrag > this.#saldo) {
            return false;
          }
          this.#saldo -= betrag;
          return true;
        }
      }
  - id: php-formen
    type: code
    language: php
    title: Formen mit Interface und Vererbung in PHP
    description: |
      Das Interface `Form` ist vorgegeben: Jede Form muss `flaeche(): float` anbieten.

      1. Schreibe eine Klasse `Rechteck`, die `Form` implementiert. Der Konstruktor bekommt `breite` und `hoehe` (beide `float`) – nutze Constructor Property Promotion (`private float $breite`).
      2. Schreibe eine Klasse `Quadrat`, die von `Rechteck` **erbt** und im Konstruktor nur eine `seite` bekommt. Rufe darin `parent::__construct($seite, $seite)` auf.
      3. Die Funktion `gesamtflaeche(array $formen)` ist schon fertig – sie funktioniert für jede Form (Polymorphie).
    starter: |
      <?php
      interface Form
      {
          public function flaeche(): float;
      }

      // Deine Klassen hier

      function gesamtflaeche(array $formen): float
      {
          $summe = 0.0;
          foreach ($formen as $form) {
              $summe += $form->flaeche();
          }
          return $summe;
      }
    tests:
      - name: Rechteck berechnet seine Fläche
        code: assert_same(12.0, (new Rechteck(3, 4))->flaeche());
      - name: Quadrat erbt von Rechteck
        code: $q = new Quadrat(5); assert_same(25.0, $q->flaeche()); assert_true($q instanceof Rechteck);
      - name: beide sind eine Form
        code: assert_true(new Quadrat(1) instanceof Form);
      - name: gesamtflaeche nutzt Polymorphie
        code: assert_same(16.0, gesamtflaeche([new Rechteck(2, 6), new Quadrat(2)]));
    hints:
      - "`class Rechteck implements Form { public function __construct(private float $breite, private float $hoehe) {} … }`"
      - "`class Quadrat extends Rechteck { public function __construct(float $seite) { parent::__construct($seite, $seite); } }`"
    solution: |
      <?php
      interface Form
      {
          public function flaeche(): float;
      }

      class Rechteck implements Form
      {
          public function __construct(private float $breite, private float $hoehe)
          {
          }

          public function flaeche(): float
          {
              return $this->breite * $this->hoehe;
          }
      }

      class Quadrat extends Rechteck
      {
          public function __construct(float $seite)
          {
              parent::__construct($seite, $seite);
          }
      }

      function gesamtflaeche(array $formen): float
      {
          $summe = 0.0;
          foreach ($formen as $form) {
              $summe += $form->flaeche();
          }
          return $summe;
      }
---

Ein Bankkonto hat Daten (Inhaber, Kontostand) und Fähigkeiten (einzahlen, abheben). Bisher hättest du dafür ein
Objekt und ein paar lose Funktionen gebaut. Die [[oop|objektorientierte Programmierung]] bündelt beides: Daten
und die Funktionen, die mit ihnen arbeiten, gehören in **ein** Objekt. Und sie sorgt dafür, dass niemand den
Kontostand einfach auf eine Million setzen kann.

## Klasse, Instanz, Konstruktor

Eine [[klasse|Klasse]] ist ein Bauplan – wie eine Ausstechform für Plätzchen. Die Form selbst kann man nicht
essen, aber aus ihr entstehen beliebig viele gleich geformte Plätzchen, jedes mit eigener Glasur. Mit `new` erzeugst du daraus eine [[instanz|Instanz]] – ein konkretes
Objekt. Der [[konstruktor|Konstruktor]] legt dabei die Startwerte fest:

```js run
class Hund {
  constructor(name) {
    this.name = name;
  }
  bellen() {
    return `${this.name} sagt: Wuff!`;
  }
}

const bello = new Hund("Bello");
const luna = new Hund("Luna");
console.log(bello.bellen(), luna.bellen());
```

`bellen` ist eine [[methode|Methode]] – eine Funktion, die zum Objekt gehört. Darin verweist [[this]] auf das
Objekt, auf dem die Methode gerade aufgerufen wurde. Beide Hunde teilen sich den Bauplan, haben aber eigene Namen.

> [!FEHLER]
> `this` vergessen: `name` statt `this.name` sucht eine Variable statt der Eigenschaft – Ergebnis ist ein
> `ReferenceError` oder ein falscher Wert.

## Kapselung: Daten schützen

[[kapselung|Kapselung]] heißt: Ein Objekt versteckt seine inneren Daten und lässt sie nur über eigene Methoden
verändern. In JavaScript machst du ein Feld mit `#` privat:

```js run
class Konto {
  #saldo = 0;
  einzahlen(betrag) {
    if (betrag > 0) this.#saldo += betrag;   // Regel wird immer geprüft
  }
  get saldo() {
    return this.#saldo;                       // lesen ja, setzen nein
  }
}
const konto = new Konto();
konto.einzahlen(50);
konto.einzahlen(-1000);
console.log(konto.saldo);   // 50
```

`get saldo()` ist ein Getter: Er sieht von außen aus wie eine Eigenschaft, ist aber eine Methode. Zusammen mit
Settern heißen sie [[getter-und-setter|Getter und Setter]].

> [!MERKSATZ]
> Ein gut gekapseltes Objekt kann nie in einen ungültigen Zustand geraten – weil jede Änderung durch seine
> Methoden läuft, die die Regeln prüfen.

## Vererbung und Polymorphie

Mit [[vererbung|Vererbung]] übernimmt eine Klasse alles von einer anderen und ergänzt Eigenes. `super(...)` ruft
den Konstruktor der Elternklasse auf:

![Vererbung: Kreis und Rechteck erben von Form](/assets/programmieren-grundlagen/m4-vererbung.svg)

```js run
class Form {
  constructor(name) { this.name = name; }
  beschreibung() { return `${this.name} mit Fläche ${this.flaeche().toFixed(1)}`; }
}
class Kreis extends Form {
  constructor(r) { super("Kreis"); this.r = r; }
  flaeche() { return Math.PI * this.r ** 2; }
}
class Rechteck extends Form {
  constructor(b, h) { super("Rechteck"); this.b = b; this.h = h; }
  flaeche() { return this.b * this.h; }
}
for (const form of [new Kreis(1), new Rechteck(2, 3)]) {
  console.log(form.beschreibung());
}
```

Die Schleife ruft bei jeder Form dieselbe Methode auf, und jede rechnet auf ihre Weise – das ist
[[polymorphie|Polymorphie]]. Vererbung passt nur bei echten „ist ein"-Beziehungen; sonst setzt man Objekte lieber
aus kleineren zusammen (Komposition).

## Interfaces und der Blick auf PHP

Ein [[interface|Interface]] ist ein Vertrag: Es legt fest, **welche** Methoden eine Klasse haben muss, nicht wie
sie funktionieren. Reines JavaScript kennt keine Interfaces – dort zählt nur, ob ein Objekt die Methode hat.
[[typescript|TypeScript]] und PHP prüfen solche Verträge:

```php
<?php
interface Form
{
    public function flaeche(): float;
}

class Rechteck implements Form
{
    public function __construct(private float $breite, private float $hoehe) {}

    public function flaeche(): float
    {
        return $this->breite * $this->hoehe;
    }
}

$r = new Rechteck(2, 3);
echo $r->flaeche(), "\n";   // 6
```

| | JavaScript | PHP |
|---|---|---|
| Konstruktor | `constructor(…)` | `__construct(…)` |
| eigenes Objekt | `this.name` | `$this->name` |
| privat | `#name` | `private` |
| Methode aufrufen | `obj.methode()` | `$obj->methode()` |
| Vertrag | nur in TypeScript: `interface` | `interface` + `implements` |

> [!PRAXIS]
> Frameworks wie Laravel sind durch und durch objektorientiert: Controller, Models und Services sind Klassen,
> Interfaces beschreiben austauschbare Bausteine – etwa verschiedene Zahlungsanbieter mit derselben Methode `bezahlen()`.

## Zusammenfassung

- Eine **Klasse** ist ein Bauplan, eine **Instanz** ein konkretes Objekt (`new`); der **Konstruktor** setzt Startwerte.
- **Methoden** sind Funktionen im Objekt; `this` (PHP: `$this->`) meint das aktuelle Objekt.
- **Kapselung** schützt Daten mit privaten Feldern (`#`, `private`) und Methoden mit Regeln.
- **Vererbung** (`extends`, `super`) übernimmt Verhalten; **Polymorphie** lässt jede Klasse auf ihre Weise reagieren.
- Ein **Interface** ist ein Vertrag über Methoden – in PHP und TypeScript, nicht in reinem JavaScript.
