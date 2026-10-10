---
title: DTOs und Value Objects
summary: Wie du lose Arrays durch typisierte, unveränderliche Objekte ersetzt – DTOs für den Transport, Value Objects für fachliche Werte mit Regeln.
duration: 25
sources:
  - title: PHP-Handbuch – Readonly-Klassen
    url: https://www.php.net/manual/de/language.oop5.basic.php#language.oop5.basic.class.readonly
  - title: PHP-Handbuch – Konstruktor-Promotion
    url: https://www.php.net/manual/de/language.oop5.decon.php#language.oop5.decon.constructor.promotion
  - title: Laravel-Dokumentation – Form Requests (validated)
    url: https://laravel.com/docs/13.x/validation#working-with-validated-input
quiz:
  - type: single
    question: Was unterscheidet ein Value Object von einem DTO?
    options:
      - Ein Value Object hat immer eine ID aus der Datenbank.
      - Ein Value Object bildet einen fachlichen Wert ab und erzwingt seine Regeln; ein DTO transportiert nur Daten.
      - Ein DTO darf nur Strings enthalten.
      - Es gibt keinen Unterschied.
    answer: 1
    explanation: >
      Money weiß, dass es nicht negativ sein darf und dass man Euro nicht zu Dollar addiert. Ein DTO wie
      CreateInvoiceData bündelt nur Felder in fester Form und enthält keine Geschäftsregeln.
  - type: multiple
    question: Welche Eigenschaften hat ein gutes Value Object?
    options:
      - Es ist unveränderlich (readonly).
      - Es prüft seine Regeln im Konstruktor.
      - Zwei Objekte mit gleichem Wert gelten als gleich.
      - Es speichert sich selbst in der Datenbank.
    answers: [0, 1, 2]
    explanation: Unveränderlich, selbstvalidierend und nach Wert vergleichbar. Speichern ist Aufgabe von Model oder Repository.
  - type: find-bug
    question: Die Klasse soll unveränderlich sein. In welcher Zeile verstößt sie dagegen?
    language: php
    code: |
      final readonly class Money
      {
          public function __construct(public int $cents) {}

          public function add(Money $other): self
          {
              $this->cents += $other->cents;

              return $this;
          }
      }
    bug_line: 7
    explanation: >
      In einer readonly-Klasse wirft diese Zuweisung sogar einen Fehler. Richtig ist
      `return new self($this->cents + $other->cents);` – ein neues Objekt statt Veränderung.
  - type: cloze
    text: "Eine Klasse, deren Eigenschaften nach dem Konstruktor nicht mehr geändert werden können, deklarierst du mit `final ___ class`."
    blanks:
      - [readonly]
    explanation: Seit PHP 8.2 macht `readonly class` alle Eigenschaften der Klasse schreibgeschützt.
tasks:
  - id: email-value-object
    type: code
    language: php
    title: Ein Value Object für E-Mail-Adressen
    description: |
      Schreibe die Klasse `EmailAddress` als `final readonly class`:

      - Konstruktor mit einem `string`. Er normalisiert die Adresse (`trim`, `strtolower`) und speichert
        sie in der öffentlichen Eigenschaft `$value`.
      - Ist die Adresse ungültig (`filter_var(..., FILTER_VALIDATE_EMAIL) === false`), wirft der
        Konstruktor eine `InvalidArgumentException`.
      - `domain(): string` gibt den Teil nach dem `@` zurück.
      - `equals(EmailAddress $other): bool` vergleicht nach Wert.

      Tipp: In einer readonly-Klasse kannst du eine Eigenschaft im Konstruktor genau einmal setzen. Lege
      `$value` deshalb als normale Eigenschaft an (`public string $value;`) statt per Promotion.
    starter: |
      <?php

      declare(strict_types=1);

      final readonly class EmailAddress
      {
          public string $value;

          public function __construct(string $value)
          {
          }

          public function domain(): string
          {
          }

          public function equals(EmailAddress $other): bool
          {
          }
      }
    tests:
      - name: normalisiert die Adresse
        code: assert_same('ada@example.com', (new EmailAddress('  Ada@Example.COM '))->value);
      - name: liefert die Domain
        code: assert_same('example.org', (new EmailAddress('team@example.org'))->domain());
      - name: vergleicht nach Wert
        code: |
          assert_true((new EmailAddress('ADA@example.com'))->equals(new EmailAddress('ada@example.com')));
          assert_same(false, (new EmailAddress('a@example.com'))->equals(new EmailAddress('b@example.com')));
      - name: lehnt ungültige und leere Adressen ab
        code: |
          foreach (['keine-adresse', '', '   '] as $input) {
              $thrown = false;
              try { new EmailAddress($input); } catch (InvalidArgumentException $e) { $thrown = true; }
              assert_true($thrown);
          }
      - name: ist unveränderlich
        code: assert_true((new ReflectionClass(EmailAddress::class))->isReadOnly());
    solution: |
      <?php

      declare(strict_types=1);

      final readonly class EmailAddress
      {
          public string $value;

          public function __construct(string $value)
          {
              $normalized = strtolower(trim($value));

              if (filter_var($normalized, FILTER_VALIDATE_EMAIL) === false) {
                  throw new InvalidArgumentException('Invalid email address.');
              }

              $this->value = $normalized;
          }

          public function domain(): string
          {
              return substr($this->value, strpos($this->value, '@') + 1);
          }

          public function equals(EmailAddress $other): bool
          {
              return $this->value === $other->value;
          }
      }
    hints:
      - Normalisiere in eine lokale Variable, prüfe sie, und weise erst danach `$this->value` zu.
      - "`substr($this->value, strpos($this->value, '@') + 1)` liefert alles nach dem `@`."
  - id: was-ist-was
    type: dragdrop
    title: DTO, Value Object oder keins von beiden?
    description: Ordne jede Klasse der passenden Kategorie zu.
    targets:
      - { id: dto, label: DTO }
      - { id: vo, label: Value Object }
      - { id: model, label: Eloquent-Model }
    items:
      - { label: "CreateInvoiceData(customer, net, taxRate)", target: dto }
      - { label: "Money(cents, currency) mit add()", target: vo }
      - { label: "Invoice extends Model", target: model }
      - { label: "EmailAddress mit domain()", target: vo }
      - { label: "ShipmentRequestData aus einem API-Aufruf", target: dto }
      - { label: "DateRange(start, end), prüft start <= end", target: vo }
      - { label: "Customer mit hasMany(Invoice::class)", target: model }
    hints:
      - "Hat das Objekt eine Identität in der Datenbank? Dann ist es ein Model. Erzwingt es eine fachliche Regel? Value Object. Transportiert es nur? DTO."
---
`$request->validated()` liefert ein Array. Du reichst es an eine Action weiter, die es an einen Service
weiterreicht, der es an einen Job weiterreicht. Drei Wochen später fragt jemand: „Heißt der Schlüssel
`net_cents` oder `net`? Ist `tax_rate` ein String oder eine Zahl? Darf er fehlen?“ Niemand weiß es, denn
ein Array verspricht nichts. Diese Lektion zeigt dir zwei Werkzeuge, die genau das ändern.

## Das Problem mit losen Arrays

[[array|Arrays]] sind in PHP bequem – und in großen Apps gefährlich:

- Tippfehler im Schlüssel (`$data['costumer']`) fallen erst zur Laufzeit auf.
- Die IDE kann nichts vorschlagen, weil sie die Schlüssel nicht kennt.
- Jede Schicht prüft vorsichtshalber noch einmal, ob ein Wert da ist.
- Fachliche Werte wie Geld sind nackte `int`-Zahlen. Nichts verhindert `-500` oder Cent plus Euro.

Dieses Muster hat einen Namen: [[primitive-obsession|Primitive Obsession]] – fachliche Begriffe werden
als einfache Strings und Zahlen herumgereicht, statt eigene Typen zu bekommen.

> [!MERKSATZ]
> Ein Array sagt dir nicht, was drinsteht. Eine Klasse mit typisierten Eigenschaften sagt es dir –
> und PHP prüft es für dich.

## DTOs: Daten mit fester Form

Ein [[dto|DTO]] (Data Transfer Object) bündelt Daten in einer festen, typisierten Form. Es hat keine
Geschäftslogik, nur Eigenschaften und meist eine Fabrikmethode.

```php title="app/Modules/Invoicing/Data/CreateInvoiceData.php"
final readonly class CreateInvoiceData
{
    public function __construct(
        public string $customer,
        public Money $net,
        public int $taxRate,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            customer: trim((string) $data['customer']),
            net: new Money((int) $data['net_cents']),
            taxRate: (int) $data['tax_rate'],
        );
    }
}
```

- `readonly class` (seit PHP 8.2) macht alle Eigenschaften schreibgeschützt – das DTO ist
  [[unveraenderlichkeit|unveränderlich]].
- [[konstruktor-promotion|Konstruktor-Promotion]] spart Eigenschaften und Zuweisungen.
- `fromArray` ist der **eine** Ort, an dem aus dem Array ein typisiertes Objekt wird.

Danach weiß jede Schicht: `$data->net` ist ein `Money`, `$data->taxRate` ist ein `int`. Punkt.

## Value Objects: Werte mit Regeln

Ein [[value-object|Value Object]] bildet einen fachlichen Wert ab und **erzwingt seine Regeln** selbst.
Typische Beispiele: Geld, E-Mail-Adresse, Zeitraum, Prozentsatz.

```php title="app/Modules/Invoicing/Domain/Money.php"
final readonly class Money
{
    public function __construct(public int $cents, public string $currency = 'EUR')
    {
        if ($cents < 0) {
            throw new InvalidArgumentException('Money cannot be negative.');
        }
    }

    public function add(Money $other): self
    {
        if ($other->currency !== $this->currency) {
            throw new InvalidArgumentException('Currencies do not match.');
        }

        return new self($this->cents + $other->cents, $this->currency);
    }
}
```

Drei Eigenschaften machen ein Value Object aus:

| Eigenschaft | Bedeutung |
|---|---|
| Unveränderlich | `add` verändert nichts, sondern liefert ein **neues** Objekt |
| Selbstvalidierend | Ein ungültiges `Money` kann gar nicht erst entstehen |
| Gleichheit nach Wert | Zwei `Money(500)` sind gleich, egal ob es dieselbe Instanz ist |

Die Regel, die immer gelten muss („nie negativ“), nennt man [[invariante|Invariante]]. Weil der
Konstruktor sie prüft, musst du sie nirgendwo sonst prüfen.

> [!FEHLER]
> Geld als `float` speichern: `0.1 + 0.2` ergibt in PHP nicht exakt `0.3`. Rechne immer in der kleinsten
> Einheit (Cent) als `int` – genau das kapselt `Money`.

## DTO oder Value Object – und wo die Grenze ist

| Frage | DTO | Value Object |
|---|---|---|
| Wozu? | Daten zwischen Schichten transportieren | Einen fachlichen Begriff darstellen |
| Logik? | keine (höchstens Umwandlung) | ja: Regeln, Rechnen, Vergleichen |
| Beispiel | `CreateInvoiceData` | `Money`, `EmailAddress` |
| Identität? | keine | keine – nur der Wert zählt |

Ein [[model|Eloquent-Model]] dagegen hat eine **Identität** (die ID): Zwei Rechnungen mit gleichem
Betrag sind trotzdem zwei verschiedene Rechnungen.

Für sehr viele DTOs gibt es Pakete, die Umwandlung und Validierung automatisieren. Für den Einstieg
reicht Plain PHP völlig – du siehst genau, was passiert.

> [!PRAXIS]
> Value Objects lassen sich in Eloquent über Custom Casts verwenden, sodass `$invoice->net` direkt ein
> `Money` liefert. Wie das geht, steht in der
> [Laravel-Dokumentation zu Custom Casts](https://laravel.com/docs/13.x/eloquent-mutators#custom-casts).

## Zusammenfassung

- Lose Arrays verstecken ihre Struktur; fachliche Werte als nackte `int`/`string` heißen Primitive Obsession.
- Ein DTO transportiert Daten typisiert und unveränderlich, meist mit einer Fabrikmethode wie `fromArray`.
- Ein Value Object stellt einen fachlichen Wert dar: unveränderlich, selbstvalidierend, gleich nach Wert.
- Die Invariante prüft der Konstruktor – danach ist jedes Objekt garantiert gültig.
- Geld rechnest du in Cent als `int`, nie als `float`.
- Models haben eine Identität, DTOs und Value Objects nicht.
