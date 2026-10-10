---
title: "SOLID I: Single Responsibility und Open-Closed"
summary: Was SOLID ist, warum eine Klasse nur einen Grund zur Änderung haben sollte und wie du Code erweiterst, ohne ihn zu ändern.
duration: 25
sources:
  - title: PHP-Handbuch – Interfaces
    url: https://www.php.net/manual/de/language.oop5.interfaces.php
  - title: TypeScript Handbook – Classes (implements)
    url: https://www.typescriptlang.org/docs/handbook/2/classes.html
  - title: Robert C. Martin – The Single Responsibility Principle
    url: https://blog.cleancoder.com/uncle-bob/2014/05/08/SingleReponsibilityPrinciple.html
quiz:
  - type: single
    question: Was bedeutet „eine Verantwortung“ im Single-Responsibility-Prinzip am genauesten?
    options:
      - Die Klasse hat genau eine Methode.
      - Die Klasse hat genau einen Grund, sich zu ändern – sie dient einer Personengruppe bzw. einem fachlichen Anliegen.
      - Die Klasse wird nur an einer Stelle benutzt.
      - Die Klasse hat höchstens 100 Zeilen.
    answer: 1
    explanation: Es geht nicht um Methoden- oder Zeilenzahl, sondern um Änderungsgründe. Ändern Buchhaltung und Marketing aus unterschiedlichen Gründen dieselbe Klasse, hat sie zwei Verantwortungen.
  - type: multiple
    question: Welche Anzeichen sprechen dafür, dass eine Klasse gegen das Open-Closed-Prinzip verstößt?
    options:
      - Für jede neue Zahlungsart musst du ein weiteres `case` in dieselbe Methode schreiben.
      - Neue Varianten entstehen als neue Klassen, die ein Interface erfüllen.
      - Dasselbe `match` über den Typ steht in mehreren Methoden.
      - Die Klasse ist als `final` deklariert.
    answers: [0, 2]
    explanation: Wenn neue Varianten bestehenden, getesteten Code ändern müssen, ist der Code nicht offen für Erweiterung. `final` hat damit nichts zu tun – Erweiterung geschieht über Interfaces, nicht über Vererbung.
  - type: cloze
    text: Das ___-Prinzip sagt, Software soll offen für ___ und geschlossen für ___ sein.
    blanks:
      - [Open-Closed, Open Closed, OCP]
      - [Erweiterung, Erweiterungen]
      - [Änderung, Änderungen, Aenderung]
    explanation: Neues Verhalten kommt durch neuen Code dazu, statt alten, funktionierenden Code umzuschreiben.
  - type: find-bug
    question: Diese Klasse soll nur Rechnungsbeträge berechnen. Welche Zeile verletzt das Single-Responsibility-Prinzip am deutlichsten?
    language: php
    code: |
      final class RechnungsRechner
      {
          public function brutto(int $nettoCent): int
          {
              $brutto = (int) round($nettoCent * 1.19);
              mail('buchhaltung@example.com', 'Neue Rechnung', (string) $brutto);
              return $brutto;
          }
      }
    bug_line: 6
    explanation: Der Mailversand ist ein zweiter Änderungsgrund (neuer Empfänger, anderer Versandweg). Er gehört in eine eigene Klasse – der Rechner rechnet nur.
tasks:
  - id: verantwortungen
    type: dragdrop
    title: Wer ist verantwortlich?
    description: |
      Die Gottklasse `RechnungsManager` wird nach dem Single-Responsibility-Prinzip in drei Klassen zerlegt.
      Ordne jede Aufgabe der Klasse zu, in die sie gehört.
    targets:
      - { id: rechner, label: "RechnungsRechner – Beträge" }
      - { id: pdf, label: "RechnungsPdf – Darstellung" }
      - { id: versand, label: "RechnungsVersand – Zustellung" }
    items:
      - { label: Mehrwertsteuer berechnen, target: rechner }
      - { label: Rabatte abziehen, target: rechner }
      - { label: Logo und Schriftart festlegen, target: pdf }
      - { label: Seitenumbruch bei vielen Positionen, target: pdf }
      - { label: E-Mail an die Kundin schicken, target: versand }
      - { label: Bei Fehlversand erneut zustellen, target: versand }
    hints:
      - Frag dich bei jeder Aufgabe, wer die Änderung anstoßen würde - die Buchhaltung, die Designerin oder das Team für Kundenkommunikation?
  - id: versandarten-ocp
    type: code
    language: php
    title: Versandarten erweiterbar machen
    description: |
      `versandkosten()` entscheidet mit einem `match` über einen String. Für jede neue Versandart müsste man
      die Funktion ändern. Mach den Code **offen für Erweiterung**:

      1. Lege das Interface `Versandart` mit der Methode `kostenCent(int $gewichtGramm): int` an.
      2. `Standardversand`: 490 Cent, ab 5000 g 690 Cent.
      3. `Expressversand`: 990 Cent plus 100 Cent für jedes **angefangene** Kilogramm (1 g → 1090, 1000 g → 1090, 1001 g → 1190).
      4. Die neue Versandart `Abholung` kostet immer 0 Cent.
      5. `versandkosten(Versandart $art, int $gewichtGramm): int` delegiert nur noch an die Versandart.
    starter: |
      <?php

      declare(strict_types=1);

      function versandkosten(string $art, int $gewichtGramm): int
      {
          return match ($art) {
              'standard' => $gewichtGramm >= 5000 ? 690 : 490,
              'express' => 990 + (int) ceil($gewichtGramm / 1000) * 100,
          };
      }
    tests:
      - name: Standardversand unter und ab 5 kg
        code: "assert_same([490, 690], [versandkosten(new Standardversand(), 4999), versandkosten(new Standardversand(), 5000)]);"
      - name: Express rechnet angefangene Kilogramm
        code: "assert_same([1090, 1090, 1190], [versandkosten(new Expressversand(), 1), versandkosten(new Expressversand(), 1000), versandkosten(new Expressversand(), 1001)]);"
      - name: Abholung kostet nichts
        code: "assert_same(0, versandkosten(new Abholung(), 25000));"
      - name: Alle Versandarten erfüllen das Interface
        code: "assert_true(new Standardversand() instanceof Versandart && new Expressversand() instanceof Versandart && new Abholung() instanceof Versandart);"
      - name: Ein neuer Versand funktioniert ohne Änderung an versandkosten()
        code: |
          $lastenrad = new class implements Versandart {
              public function kostenCent(int $gewichtGramm): int { return 300; }
          };
          assert_same(300, versandkosten($lastenrad, 8000));
    hints:
      - "`interface Versandart { public function kostenCent(int $gewichtGramm): int; }`"
      - "`final class Abholung implements Versandart { public function kostenCent(int $gewichtGramm): int { return 0; } }`"
      - "`versandkosten` besteht danach nur noch aus `return $art->kostenCent($gewichtGramm);`"
    solution: |
      <?php

      declare(strict_types=1);

      interface Versandart
      {
          public function kostenCent(int $gewichtGramm): int;
      }

      final class Standardversand implements Versandart
      {
          private const SCHWER_AB_GRAMM = 5000;

          public function kostenCent(int $gewichtGramm): int
          {
              return $gewichtGramm >= self::SCHWER_AB_GRAMM ? 690 : 490;
          }
      }

      final class Expressversand implements Versandart
      {
          private const GRUNDPREIS_CENT = 990;
          private const PREIS_PRO_KG_CENT = 100;

          public function kostenCent(int $gewichtGramm): int
          {
              return self::GRUNDPREIS_CENT + (int) ceil($gewichtGramm / 1000) * self::PREIS_PRO_KG_CENT;
          }
      }

      final class Abholung implements Versandart
      {
          public function kostenCent(int $gewichtGramm): int
          {
              return 0;
          }
      }

      function versandkosten(Versandart $art, int $gewichtGramm): int
      {
          return $art->kostenCent($gewichtGramm);
      }
---
Dein Team baut seit zwei Jahren an einem Shop. Jede neue Anforderung landet in denselben drei Klassen, und
jedes Mal geht etwas anderes kaputt: Wer die Rechnungs-PDF anpasst, bricht den Mailversand. Die fünf
[[solid|SOLID]]-Prinzipien sind Leitplanken gegen genau diese Art von Code.

## SOLID im Überblick

SOLID ist ein Merkwort aus den Anfangsbuchstaben von fünf Prinzipien für objektorientierten Entwurf. Sie
alle verfolgen dasselbe Ziel: Code, den du **ändern** kannst, ohne dass an anderer Stelle etwas umfällt.

![Die fünf SOLID-Prinzipien im Überblick](/assets/clean-code-solid-patterns/solid-uebersicht.svg)

| Buchstabe | Prinzip | Kurz gesagt |
|---|---|---|
| S | Single Responsibility | Eine Klasse hat genau einen Grund, sich zu ändern |
| O | Open-Closed | Erweitern durch neuen Code statt durch Umschreiben |
| L | Liskov Substitution | Jede Implementierung ist überall gegen eine andere austauschbar |
| I | Interface Segregation | Lieber kleine, passgenaue Interfaces als ein riesiges |
| D | Dependency Inversion | Hänge von Abstraktionen ab, nicht von Details |

Diese Lektion behandelt S und O, die nächste L, I und D.

> [!MERKSATZ]
> SOLID sind Prinzipien, keine Gesetze. Sie helfen dir, Entscheidungen zu begründen – aber eine
> Klasse mit drei Zeilen braucht kein Interface, nur weil es ein Prinzip gibt.

## S – Single Responsibility

Das [[single-responsibility-prinzip|Single-Responsibility-Prinzip]] (SRP) sagt: Eine Klasse hat genau
**einen Grund, sich zu ändern**. Ein Grund ist meist eine Personengruppe oder ein fachliches Anliegen.

```php
// vorher: drei Gründe zur Änderung in einer Klasse
final class Rechnung
{
    public function brutto(): int { /* Steuerregeln – Buchhaltung */ }
    public function alsPdf(): string { /* Layout – Design */ }
    public function versende(): void { /* Mailserver – IT-Betrieb */ }
}
```

Ändert die Buchhaltung eine Steuerregel, berührst du dieselbe Datei wie die Designerin, die nur das Logo
tauschen will. Die Lösung teilt nach Änderungsgründen:

```php
final class RechnungsRechner { public function brutto(Rechnung $r): int { /* … */ } }
final class RechnungsPdf     { public function erzeuge(Rechnung $r): string { /* … */ } }
final class RechnungsVersand { public function versende(Rechnung $r): void { /* … */ } }
```

Jetzt hat jede Klasse einen klaren Namen, ist klein genug zum Testen und ändert sich nur, wenn ihr
Anliegen sich ändert. Ein guter Test für das SRP: Frag dich, **wer** eine Änderung an dieser Klasse
anstoßen könnte. Nennst du mehr als eine Personengruppe, hat die Klasse mehr als eine Verantwortung.

## SRP in TypeScript

In TypeScript gilt dasselbe – auch für Funktionen und Module. Ein typischer Verstoß ist eine Funktion, die
gleichzeitig Daten holt, umrechnet und anzeigt:

```ts
// vorher
async function zeigeKontostand(id: string): Promise<void> {
  const antwort = await fetch(`https://api.example.com/konten/${id}`);
  const konto = await antwort.json();
  const euro = (konto.saldoCent / 100).toFixed(2).replace('.', ',');
  document.querySelector('#saldo')!.textContent = `${euro} €`;
}

// nachher: drei Aufgaben, drei Funktionen
async function ladeKonto(id: string): Promise<Konto> { /* nur HTTP */ }
function formatiereEuro(cent: number): string { /* nur Format */ }
function zeigeSaldo(text: string): void { /* nur DOM */ }
```

Die Formatierung kannst du jetzt mit einem einfachen [[unit-test|Unit-Test]] prüfen – ohne Netzwerk und
ohne Browser.

> [!FEHLER]
> **SRP als „eine Methode pro Klasse“ missverstehen.** Wer jede Methode in eine eigene Klasse steckt,
> zerreißt zusammengehörigen Code. Eine `Rechnung` darf viele Methoden haben, solange alle demselben
> Anliegen dienen.

## O – Open-Closed

Das [[open-closed-prinzip|Open-Closed-Prinzip]] (OCP) sagt: Code soll **offen für Erweiterung, aber
geschlossen für Änderung** sein. Neues Verhalten kommt durch **neuen** Code dazu, statt bestehenden,
getesteten Code umzuschreiben.

```php
// vorher: jede neue Zahlungsart ändert diese Funktion
function gebuehrCent(string $art, int $betragCent): int
{
    return match ($art) {
        'karte' => (int) round($betragCent * 0.015),
        'rechnung' => 150,
        'vorkasse' => 0,
    };
}
```

Mit einem [[interface|Interface]] und [[polymorphie|Polymorphie]] wird jede Zahlungsart zu einer eigenen
Klasse:

```php
interface Zahlungsart
{
    public function gebuehrCent(int $betragCent): int;
}

final class Kartenzahlung implements Zahlungsart
{
    public function gebuehrCent(int $betragCent): int
    {
        return (int) round($betragCent * 0.015);
    }
}

// Eine neue Zahlungsart ist eine neue Klasse – bestehender Code bleibt unberührt.
final class Ratenkauf implements Zahlungsart { /* … */ }
```

> [!PRAXIS]
> Das OCP lohnt sich dort, wo Varianten **tatsächlich** dazukommen: Zahlungsarten, Versandarten,
> Exportformate. Für eine Fallunterscheidung, die sich seit Jahren nicht geändert hat, ist ein einfaches
> `match` völlig in Ordnung.

## Zusammenfassung

- SOLID fasst fünf Prinzipien zusammen, die Code änderbar halten.
- **SRP:** Eine Klasse (oder Funktion) hat genau einen Grund, sich zu ändern.
- Verantwortungen trennst du nach Änderungsgründen, nicht nach Zeilen- oder Methodenzahl.
- **OCP:** Neue Varianten kommen als neuer Code dazu, statt alten Code umzuschreiben.
- Interfaces und Polymorphie sind das typische Werkzeug für das OCP.
- Beide Prinzipien lohnen sich dort, wo Änderungen wirklich passieren.
