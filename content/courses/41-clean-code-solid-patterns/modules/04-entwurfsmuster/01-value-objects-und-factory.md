---
title: Value Objects und Factories
summary: Was Entwurfsmuster sind, wie Value Objects fachliche Werte samt Regeln bündeln und wie eine Factory das Erzeugen von Objekten an einer Stelle bündelt.
duration: 25
sources:
  - title: PHP-Handbuch – Readonly-Eigenschaften und -Klassen
    url: https://www.php.net/manual/de/language.oop5.properties.php#language.oop5.properties.readonly-properties
  - title: PHP-Handbuch – Statische Methoden
    url: https://www.php.net/manual/de/language.oop5.static.php
  - title: TypeScript Handbook – Classes (readonly, private)
    url: https://www.typescriptlang.org/docs/handbook/2/classes.html
  - title: Martin Fowler – ValueObject
    url: https://martinfowler.com/bliki/ValueObject.html
quiz:
  - type: multiple
    question: Welche Eigenschaften hat ein Value Object?
    options:
      - Es ist unveränderlich – Operationen liefern ein neues Objekt.
      - Zwei Value Objects mit gleichen Werten gelten als gleich.
      - Es hat eine eindeutige ID, die über seine Lebenszeit gleich bleibt.
      - Es prüft beim Erzeugen, dass sein Wert gültig ist.
    answers: [0, 1, 3]
    explanation: Ein Value Object ist durch seinen Wert definiert, nicht durch eine Identität. Eine ID über die Lebenszeit hat eine Entität, etwa ein Kunde.
  - type: find-bug
    question: "`Geld` soll ein unveränderliches Value Object sein. Welche Zeile bricht diese Regel?"
    language: php
    code: |
      final class Geld
      {
          public function __construct(private int $cent) {}

          public function plus(Geld $anderes): Geld
          {
              $this->cent += $anderes->cent;
              return $this;
          }
      }
    bug_line: 7
    explanation: Die Methode verändert das bestehende Objekt. Wer denselben Betrag an anderer Stelle benutzt, sieht plötzlich einen anderen Wert. Richtig wäre `return new Geld($this->cent + $anderes->cent);`.
  - type: single
    question: Wann lohnt sich eine Factory am meisten?
    options:
      - Immer, wenn ein Objekt erzeugt wird.
      - Wenn die Entscheidung, welche Klasse erzeugt wird, an mehreren Stellen getroffen würde oder das Erzeugen aufwendig ist.
      - Nur bei Klassen ohne Konstruktor.
      - Wenn eine Klasse genau ein Feld hat.
    answer: 1
    explanation: Eine Factory bündelt die Auswahl und das Zusammenbauen an einer Stelle. Für ein simples `new Datum()` brauchst du keine.
  - type: match
    question: Value Object oder Entität?
    pairs:
      - { left: "Ein Betrag von 12,50 EUR", right: "Value Object – gleich, wenn der Wert gleich ist" }
      - { left: "Kundin mit Kundennummer 4711", right: "Entität – bleibt dieselbe, auch wenn sich ihr Name ändert" }
      - { left: "Eine E-Mail-Adresse", right: "Value Object – nur der Text zählt" }
      - { left: "Bestellung Nr. 2026-0815", right: "Entität – hat eine Identität und einen Lebenslauf" }
    explanation: Entscheidend ist die Frage - Zählt nur der Wert oder geht es um ein bestimmtes, identifizierbares Ding?
tasks:
  - id: geld-value-object
    type: code
    language: php
    title: Ein Value Object für Geld
    description: |
      Beträge werden bisher als veränderliches Objekt mit öffentlichen Eigenschaften herumgereicht. Baue ein
      echtes Value Object:

      1. `final readonly class Geld` mit den Eigenschaften `int $cent` und `string $waehrung`.
      2. Der Konstruktor ist `private`. Erzeugt wird über den benannten Konstruktor
         `Geld::ausCent(int $cent, string $waehrung = 'EUR')`. Ist die Währung kein Code aus genau drei
         Großbuchstaben, wirft er eine `InvalidArgumentException`.
      3. `plus(Geld $anderes): Geld` liefert ein **neues** Objekt. Unterschiedliche Währungen werfen eine
         `InvalidArgumentException`.
      4. `istGleich(Geld $anderes): bool` vergleicht Betrag und Währung.
      5. `formatiert(): string` liefert z. B. `12,50 EUR` (Tausenderpunkt: `1.234,56 EUR`).
    starter: |
      <?php

      declare(strict_types=1);

      class Geld
      {
          public int $cent;
          public string $waehrung;

          public function addiere(Geld $anderes): void
          {
              $this->cent += $anderes->cent;
          }
      }
    tests:
      - name: plus liefert ein neues Objekt und lässt das alte unverändert
        code: |
          $a = Geld::ausCent(1000);
          $summe = $a->plus(Geld::ausCent(250));
          assert_same([1250, 1000], [$summe->cent, $a->cent]);
      - name: Gleiche Werte sind gleich
        code: "assert_true(Geld::ausCent(500, 'USD')->istGleich(Geld::ausCent(500, 'USD')) && !Geld::ausCent(500)->istGleich(Geld::ausCent(500, 'USD')));"
      - name: Unterschiedliche Währungen dürfen nicht addiert werden
        code: |
          try {
              Geld::ausCent(100, 'EUR')->plus(Geld::ausCent(100, 'USD'));
              assert_true(false, 'Es wurde keine Exception geworfen.');
          } catch (InvalidArgumentException) {
              assert_true(true);
          }
      - name: Ungültiger Währungscode wird abgelehnt
        code: |
          try {
              Geld::ausCent(100, 'euro');
              assert_true(false, 'Es wurde keine Exception geworfen.');
          } catch (InvalidArgumentException) {
              assert_true(true);
          }
      - name: Formatierung
        code: "assert_same(['12,50 EUR', '1.234,56 EUR', '0,00 EUR'], [Geld::ausCent(1250)->formatiert(), Geld::ausCent(123456)->formatiert(), Geld::ausCent(0)->formatiert()]);"
      - name: Unveränderlich und nur über ausCent erzeugbar
        code: |
          $klasse = new ReflectionClass('Geld');
          assert_true($klasse->isReadOnly() && $klasse->getConstructor()->isPrivate());
    hints:
      - "`private function __construct(public int $cent, public string $waehrung) {}` – in einer `readonly class` sind die Eigenschaften automatisch schreibgeschützt."
      - "Der benannte Konstruktor prüft und ruft dann `new self($cent, $waehrung)` auf. Für den Währungscode passt `preg_match('/^[A-Z]{3}$/', $waehrung)`."
      - "`plus` prüft zuerst die Währung (Guard Clause) und gibt dann `new self($this->cent + $anderes->cent, $this->waehrung)` zurück."
    solution: |
      <?php

      declare(strict_types=1);

      final readonly class Geld
      {
          private function __construct(
              public int $cent,
              public string $waehrung,
          ) {
          }

          public static function ausCent(int $cent, string $waehrung = 'EUR'): self
          {
              if (preg_match('/^[A-Z]{3}$/', $waehrung) !== 1) {
                  throw new InvalidArgumentException(sprintf('Ungültiger Währungscode "%s".', $waehrung));
              }

              return new self($cent, $waehrung);
          }

          public function plus(Geld $anderes): self
          {
              if ($anderes->waehrung !== $this->waehrung) {
                  throw new InvalidArgumentException(sprintf(
                      'Kann %s nicht zu %s addieren.',
                      $anderes->waehrung,
                      $this->waehrung,
                  ));
              }

              return new self($this->cent + $anderes->cent, $this->waehrung);
          }

          public function istGleich(Geld $anderes): bool
          {
              return $this->cent === $anderes->cent && $this->waehrung === $anderes->waehrung;
          }

          public function formatiert(): string
          {
              return number_format($this->cent / 100, 2, ',', '.') . ' ' . $this->waehrung;
          }
      }
  - id: factory-ts
    type: code
    language: ts
    title: Eine Factory für Exportformate
    description: |
      An drei Stellen im Projekt steht dieselbe Fallunterscheidung, welches Exportformat erzeugt wird. Bündele
      sie in einer **Factory-Funktion**:

      1. Die Klassen `CsvExport` und `JsonExport` sind vorgegeben. Beide haben die Methode
         `exportiere(zeilen: Record<string, string | number>[]): string`.
      2. Schreibe `exportFuer(format: string): Export`. Groß- und Kleinschreibung spielt keine Rolle
         (`'CSV'` ist dasselbe wie `'csv'`).
      3. Unbekannte Formate werfen einen `Error` mit dem Text `Unbekanntes Exportformat: <format>`.
    starter: |
      interface Export {
        exportiere(zeilen: Record<string, string | number>[]): string;
      }

      class CsvExport implements Export {
        exportiere(zeilen: Record<string, string | number>[]): string {
          if (zeilen.length === 0) return '';
          const kopf = Object.keys(zeilen[0]).join(';');
          return [kopf, ...zeilen.map((z) => Object.values(z).join(';'))].join('\n');
        }
      }

      class JsonExport implements Export {
        exportiere(zeilen: Record<string, string | number>[]): string {
          return JSON.stringify(zeilen);
        }
      }

      function exportFuer(format: string): Export {
        // Hier fehlt die Factory
        throw new Error('noch nicht gebaut');
      }
    tests:
      - name: csv liefert einen CsvExport
        code: assertTrue(exportFuer('csv') instanceof CsvExport)
      - name: Großschreibung ist egal
        code: "assertEqual(exportFuer('JSON').exportiere([{ id: 1 }]), '[{\"id\":1}]')"
      - name: Unbekanntes Format wirft mit hilfreicher Nachricht
        code: |
          try { exportFuer('xml'); assertTrue(false); } catch (e) { assertEqual(e.message, 'Unbekanntes Exportformat: xml'); }
      - name: Leerer String ist ebenfalls unbekannt
        code: assertThrows(() => exportFuer(''))
    hints:
      - "`switch (format.toLowerCase()) { case 'csv': return new CsvExport(); … }`"
      - "Im `default`-Zweig wirfst du den Fehler: `throw new Error('Unbekanntes Exportformat: ' + format);`"
    solution: |
      interface Export {
        exportiere(zeilen: Record<string, string | number>[]): string;
      }

      class CsvExport implements Export {
        exportiere(zeilen: Record<string, string | number>[]): string {
          if (zeilen.length === 0) return '';
          const kopf = Object.keys(zeilen[0]).join(';');
          return [kopf, ...zeilen.map((z) => Object.values(z).join(';'))].join('\n');
        }
      }

      class JsonExport implements Export {
        exportiere(zeilen: Record<string, string | number>[]): string {
          return JSON.stringify(zeilen);
        }
      }

      function exportFuer(format: string): Export {
        switch (format.toLowerCase()) {
          case 'csv':
            return new CsvExport();
          case 'json':
            return new JsonExport();
          default:
            throw new Error(`Unbekanntes Exportformat: ${format}`);
        }
      }
---
Zum dritten Mal in dieser Woche schreibst du Code, der prüft, ob ein Betrag negativ ist und ob die Währung
passt. Und zum dritten Mal fragst du dich: Hat das schon jemand anderes geprüft? Entwurfsmuster geben
wiederkehrenden Lösungen einen Namen. Heute lernst du zwei der nützlichsten kennen.

## Was Entwurfsmuster sind

Ein [[entwurfsmuster|Entwurfsmuster]] ist eine bewährte, benannte Lösung für ein Problem, das in vielen
Projekten immer wieder auftaucht. Es ist kein fertiger Code, den du kopierst, sondern eine **Idee**, die du
an deine Situation anpasst.

Muster helfen auf zwei Arten:

- **Lösung:** Du musst das Rad nicht neu erfinden.
- **Vokabular:** „Das ist ein Decorator“ erklärt im Code-Review in drei Worten, wofür sonst ein Absatz nötig wäre.

In diesem Modul lernst du sechs Muster, die dir im PHP- und TypeScript-Alltag ständig begegnen: Value Object,
Factory, Strategy, Adapter, Decorator und Observer. Viele weitere beschreibt der Klassiker der
„Gang of Four“ – lies sie nach, wenn du ein konkretes Problem hast, nicht auf Vorrat.

> [!MERKSATZ]
> Ein Muster ist ein Werkzeug für ein Problem. Ohne das Problem ist es nur zusätzlicher Code.

## Value Objects

Ein [[value-object|Value Object]] ist ein kleines Objekt, das einen fachlichen Wert darstellt: einen
Geldbetrag, eine E-Mail-Adresse, einen Zeitraum. Es ist die Antwort auf die Primitive Obsession aus Modul 2.

Drei Regeln machen ein Value Object aus:

| Regel | Bedeutung |
|---|---|
| Unveränderlich | Operationen liefern ein **neues** Objekt, das alte bleibt gleich |
| Gleichheit über Werte | Zwei Objekte mit gleichem Betrag und gleicher Währung sind gleich |
| Immer gültig | Der Wert wird beim Erzeugen geprüft – ein ungültiges Objekt kann es nicht geben |

```php
final readonly class Email
{
    private function __construct(public string $wert) {}

    public static function aus(string $wert): self
    {
        $normalisiert = strtolower(trim($wert));
        if (filter_var($normalisiert, FILTER_VALIDATE_EMAIL) === false) {
            throw new InvalidArgumentException(sprintf('Ungültige E-Mail-Adresse "%s".', $wert));
        }

        return new self($normalisiert);
    }
}
```

Wer eine `Email` bekommt, muss nichts mehr prüfen – die Prüfung ist im Typ eingebaut. Mit einer
`readonly class` sorgt PHP selbst für die [[unveraenderlichkeit|Unveränderlichkeit]].

## Value Objects in TypeScript

In TypeScript erreichst du dasselbe mit `readonly` und einem privaten Konstruktor:

```ts
const MILLISEKUNDEN_PRO_TAG = 24 * 60 * 60 * 1000;

class Zeitraum {
  private constructor(readonly von: Date, readonly bis: Date) {}

  static zwischen(von: Date, bis: Date): Zeitraum {
    if (bis < von) {
      throw new Error('Ein Zeitraum darf nicht vor seinem Beginn enden.');
    }
    return new Zeitraum(von, bis);
  }

  tage(): number {
    return Math.round((this.bis.getTime() - this.von.getTime()) / MILLISEKUNDEN_PRO_TAG);
  }
}
```

Achtung: `readonly` schützt nur die Zuweisung. Ein `Date` darin kann man trotzdem mit `setDate()`
verändern – kopiere veränderliche Werte deshalb beim Erzeugen oder speichere sie als Zahl.

> [!FEHLER]
> **Setter an einem Value Object.** Eine Methode `setCent()` macht aus dem Wert wieder einen veränderlichen
> Zustand. Teilen sich zwei Rechnungen dasselbe Objekt, ändert sich der Betrag plötzlich an beiden. Gib
> stattdessen ein neues Objekt zurück, etwa mit `mitCent()`.

## Factories und benannte Konstruktoren

Eine [[factory-muster|Factory]] bündelt das **Erzeugen** von Objekten an einer Stelle. Es gibt sie in zwei
Größen.

Der **[[benannter-konstruktor|benannte Konstruktor]]** ist eine statische Methode mit sprechendem Namen,
wie `Geld::ausCent()` oder `Email::aus()`. Er macht den Aufruf lesbar und kann prüfen, bevor er das Objekt
erzeugt:

```php
$preis = Geld::ausCent(1250);
$preis = Geld::ausEuro('12,50'); // zweite Art, dasselbe Objekt zu erzeugen
```

Die **Factory-Funktion** oder **Factory-Klasse** entscheidet, **welche** Klasse erzeugt wird:

```php
function zahlungsartFuer(string $kennung): Zahlungsart
{
    return match ($kennung) {
        'karte' => new Kartenzahlung(),
        'rechnung' => new Rechnungskauf(),
        default => throw new InvalidArgumentException(sprintf('Unbekannte Zahlungsart "%s".', $kennung)),
    };
}
```

Das `match` steht jetzt an genau **einer** Stelle. Der restliche Code arbeitet nur mit dem Interface
`Zahlungsart` – genau wie beim Open-Closed-Prinzip.

> [!PRAXIS]
> Die Factory-Funktion ist der natürliche Partner der Strategy aus der nächsten Lektion: Die Strategy
> macht Verhalten austauschbar, die Factory wählt aus, welches gebraucht wird. Für ein einfaches
> `new Datum()` brauchst du dagegen keine Factory.

## Zusammenfassung

- Entwurfsmuster sind benannte, bewährte Lösungsideen – und ein gemeinsames Vokabular im Team.
- Ein Value Object ist unveränderlich, über seine Werte vergleichbar und immer gültig.
- In PHP hilft `readonly class` mit privatem Konstruktor, in TypeScript `readonly` und `private constructor`.
- Value Objects ersetzen nackte Strings und Zahlen mit Regeln (Primitive Obsession).
- Benannte Konstruktoren machen das Erzeugen lesbar und prüfbar.
- Eine Factory bündelt die Entscheidung, welche Klasse erzeugt wird, an einer einzigen Stelle.
