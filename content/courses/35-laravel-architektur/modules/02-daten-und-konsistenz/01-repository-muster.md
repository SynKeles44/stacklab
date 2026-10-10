---
title: Das Repository-Muster und Eloquent
summary: Was ein Repository ist, wann es sich in Laravel lohnt und warum es mit Eloquent oft mehr kostet als es bringt.
duration: 20
sources:
  - title: Laravel-Dokumentation – Eloquent
    url: https://laravel.com/docs/13.x/eloquent
  - title: Laravel-Dokumentation – Service Container (Binding Interfaces)
    url: https://laravel.com/docs/13.x/container#binding-interfaces-to-implementations
  - title: Laravel-Dokumentation – Eloquent Query Scopes
    url: https://laravel.com/docs/13.x/eloquent#query-scopes
quiz:
  - type: single
    question: Welches Problem soll das Repository-Muster lösen?
    options:
      - Es macht Datenbankabfragen automatisch schneller.
      - Es versteckt, woher Daten kommen, hinter einer Schnittstelle, sodass der übrige Code nicht von der Speichertechnik abhängt.
      - Es ersetzt Migrationen.
      - Es ist Pflicht, damit Eloquent funktioniert.
    answer: 1
    explanation: >
      Ein Repository bietet Methoden wie findOpenFor(customerId) an. Wer es benutzt, weiß nicht, ob
      dahinter Eloquent, eine externe API oder ein Array im Test steckt.
  - type: multiple
    question: Welche Aussagen über Repositories in Laravel-Projekten stimmen?
    options:
      - Ein Repository, das nur find(), all() und save() an Eloquent durchreicht, bringt kaum Nutzen.
      - Eloquent ist selbst schon eine Abstraktion über die Datenbank.
      - Repositories lohnen sich, wenn Daten aus mehreren Quellen kommen oder Abfragen fachlich benannt und gebündelt werden sollen.
      - Ohne Repository kann man Laravel-Code nicht testen.
    answers: [0, 1, 2]
    explanation: >
      Laravel-Code lässt sich auch ohne Repository gut testen, z. B. mit RefreshDatabase und Factories.
      Repositories lohnen sich bei echtem Mehrwert, nicht als Pflichtübung.
  - type: find-bug
    question: Das Repository soll Eloquent vor dem Rest der App verstecken. Welche Zeile verrät das Versteck?
    language: php
    code: |
      interface InvoiceRepository
      {
          public function find(int $id): ?Invoice;

          public function query(): Builder;

          public function save(Invoice $invoice): void;
      }
    bug_line: 5
    explanation: >
      Wer einen Eloquent-Builder zurückgibt, lässt jeden Aufrufer beliebige Abfragen bauen. Das
      Repository versteckt dann nichts mehr – es ist nur ein Umweg.
  - type: match
    question: Ordne jeder Situation die passende Entscheidung zu.
    pairs:
      - { left: "CRUD-App mit einer Datenbank", right: "Eloquent direkt in Actions nutzen" }
      - { left: "Kundendaten kommen aus einem externen CRM", right: "Interface plus Implementierung je Quelle" }
      - { left: "Komplexe Abfrage an fünf Stellen kopiert", right: "Benannte Abfrage zentral bündeln" }
    explanation: Entscheide nach dem Problem, nicht nach Dogma. Oft reicht ein Query Scope oder eine Query-Klasse statt eines vollen Repositorys.
tasks:
  - id: in-memory-repository
    type: code
    language: php
    title: Ein Repository mit In-Memory-Implementierung
    description: |
      Die Action `OverdueReminder` soll alle überfälligen, offenen Rechnungen eines Kunden finden. Woher
      die Rechnungen kommen, soll sie nicht wissen – sie bekommt ein `InvoiceRepository`.

      1. Implementiere `InMemoryInvoiceRepository` (das Interface ist vorgegeben). Es speichert
         Rechnungen in einem Array. `openFor(int $customerId)` liefert alle Rechnungen des Kunden mit
         `paid === false`.
      2. Implementiere `OverdueReminder::handle(int $customerId, string $today): array`. Sie gibt die IDs
         aller offenen Rechnungen zurück, deren `dueDate` **vor** `$today` liegt (Datumsstrings im Format
         `YYYY-MM-DD` kannst du direkt mit `<` vergleichen).

      Im echten Projekt gäbe es zusätzlich ein `EloquentInvoiceRepository`. Die Action merkt davon nichts.
    starter: |
      <?php

      declare(strict_types=1);

      final readonly class InvoiceRecord
      {
          public function __construct(
              public int $id,
              public int $customerId,
              public string $dueDate,
              public bool $paid,
          ) {}
      }

      interface InvoiceRepository
      {
          public function add(InvoiceRecord $invoice): void;

          /** @return list<InvoiceRecord> */
          public function openFor(int $customerId): array;
      }

      final class InMemoryInvoiceRepository implements InvoiceRepository
      {
          private array $invoices = [];

          public function add(InvoiceRecord $invoice): void
          {
          }

          public function openFor(int $customerId): array
          {
          }
      }

      final class OverdueReminder
      {
          public function __construct(private InvoiceRepository $invoices) {}

          public function handle(int $customerId, string $today): array
          {
          }
      }
    tests:
      - name: findet überfällige offene Rechnungen
        code: |
          $repo = new InMemoryInvoiceRepository();
          $repo->add(new InvoiceRecord(1, 7, '2026-09-01', false));
          $repo->add(new InvoiceRecord(2, 7, '2026-12-01', false));
          $repo->add(new InvoiceRecord(3, 7, '2026-08-01', true));
          assert_same([1], (new OverdueReminder($repo))->handle(7, '2026-10-10'));
      - name: ignoriert andere Kunden
        code: |
          $repo = new InMemoryInvoiceRepository();
          $repo->add(new InvoiceRecord(1, 8, '2026-01-01', false));
          assert_same([], (new OverdueReminder($repo))->handle(7, '2026-10-10'));
      - name: ein leeres Repository liefert eine leere Liste
        code: assert_same([], (new OverdueReminder(new InMemoryInvoiceRepository()))->handle(7, '2026-10-10'));
      - name: openFor liefert nur unbezahlte Rechnungen des Kunden
        code: |
          $repo = new InMemoryInvoiceRepository();
          $repo->add(new InvoiceRecord(1, 7, '2026-01-01', true));
          $repo->add(new InvoiceRecord(2, 7, '2026-01-01', false));
          assert_same(1, count($repo->openFor(7)));
          assert_same(2, $repo->openFor(7)[0]->id);
    solution: |
      <?php

      declare(strict_types=1);

      final readonly class InvoiceRecord
      {
          public function __construct(
              public int $id,
              public int $customerId,
              public string $dueDate,
              public bool $paid,
          ) {}
      }

      interface InvoiceRepository
      {
          public function add(InvoiceRecord $invoice): void;

          /** @return list<InvoiceRecord> */
          public function openFor(int $customerId): array;
      }

      final class InMemoryInvoiceRepository implements InvoiceRepository
      {
          private array $invoices = [];

          public function add(InvoiceRecord $invoice): void
          {
              $this->invoices[] = $invoice;
          }

          public function openFor(int $customerId): array
          {
              return array_values(array_filter(
                  $this->invoices,
                  fn (InvoiceRecord $i) => $i->customerId === $customerId && ! $i->paid,
              ));
          }
      }

      final class OverdueReminder
      {
          public function __construct(private InvoiceRepository $invoices) {}

          public function handle(int $customerId, string $today): array
          {
              $overdue = array_filter(
                  $this->invoices->openFor($customerId),
                  fn (InvoiceRecord $i) => $i->dueDate < $today,
              );

              return array_values(array_map(fn (InvoiceRecord $i) => $i->id, $overdue));
          }
      }
    hints:
      - "`array_filter` behält die alten Schlüssel. Mit `array_values(...)` bekommst du wieder eine Liste ab Index 0."
      - "In der Action: erst `$this->invoices->openFor($customerId)`, dann nach `dueDate < $today` filtern, dann mit `array_map` die IDs holen."
  - id: repository-abwaegen
    type: dragdrop
    title: Vorteil oder Kosten?
    description: Ordne jede Aussage über das Repository-Muster in einer Laravel-App zu.
    targets:
      - { id: vorteil, label: Vorteil }
      - { id: kosten, label: Kosten / Risiko }
    items:
      - { label: Fachlich benannte Abfragen statt kopierter where-Ketten, target: vorteil }
      - { label: "Die Datenquelle lässt sich austauschen (Datenbank, API, Array im Test)", target: vorteil }
      - { label: Jede neue Abfrage braucht eine Methode in Interface und Implementierung, target: kosten }
      - { label: Eloquent-Features wie Eager Loading und Scopes werden hinter Durchreich-Methoden versteckt, target: kosten }
      - { label: Tests der Action laufen ohne Datenbank, target: vorteil }
      - { label: Neue Teammitglieder müssen eine zusätzliche Schicht lernen, target: kosten }
---
In vielen Architektur-Artikeln steht: „Greif nie direkt auf die Datenbank zu, benutze ein Repository!“
Also baust du für jedes Model ein Interface und eine Klasse, die `find()`, `all()` und `save()` an
Eloquent durchreicht. Nach einem Monat hast du doppelt so viele Dateien – und nichts ist einfacher
geworden. In dieser Lektion lernst du, was das Muster wirklich leistet und wann es sich in Laravel lohnt.

## Die Idee des Repositorys

Das [[repository-muster|Repository-Muster]] stellt eine Sammlung von Objekten bereit, als lägen sie im
Speicher. Wer es benutzt, fragt fachlich („alle offenen Rechnungen von Kunde 7“) und weiß nicht, woher
die Daten kommen.

```php title="Ein Repository-Interface"
interface InvoiceRepository
{
    public function find(int $id): ?Invoice;

    /** @return list<Invoice> */
    public function openFor(int $customerId): array;

    public function save(Invoice $invoice): void;
}
```

Eine Implementierung spricht mit Eloquent, eine andere mit einer externen API, eine dritte hält im Test
einfach ein [[array|Array]]. Über den [[service-container|Service-Container]] legst du fest, welche
gilt:

```php title="AppServiceProvider::register()"
$this->app->bind(InvoiceRepository::class, EloquentInvoiceRepository::class);
```

> [!MERKSATZ]
> Ein Repository versteckt die Datenquelle hinter fachlich benannten Methoden. Wer es benutzt, hängt nur
> vom [[interface|Interface]] ab.

## Eloquent ist schon eine Abstraktion

[[eloquent|Eloquent]] folgt dem Active-Record-Prinzip: Das Model **ist** zugleich die Zeile in der
Tabelle und kennt seine Datenbank. Es abstrahiert bereits SQL, Verbindungen und Datenbanksysteme.

Ein Repository darüber, das nur durchreicht, hat deshalb drei Kosten:

| Kosten | Warum |
|---|---|
| Doppelte Arbeit | Jede neue Abfrage braucht Methode in Interface **und** Implementierung |
| Verlorene Features | Eager Loading, Scopes, Pagination musst du einzeln durchreichen |
| Scheinsicherheit | Die Methoden geben trotzdem Eloquent-Models zurück – die Abhängigkeit bleibt |

> [!FEHLER]
> Ein Repository mit `query(): Builder` oder `where(...)`-Durchreichern. Damit kann jeder Aufrufer
> wieder beliebige Abfragen bauen – das Muster ist ausgehebelt, die Schicht kostet nur noch.

## Wann ein Repository sich lohnt

Es gibt gute Gründe – aber sie müssen in deinem Projekt **wirklich** vorliegen:

1. **Mehrere Datenquellen:** Kundendaten kommen teils aus der eigenen Datenbank, teils aus einem
   externen System.
2. **Fachlich komplexe Abfragen**, die an vielen Stellen gebraucht werden und einen Namen verdienen.
3. **Ein reiner Domain-Kern**, der bewusst nichts von Laravel weiß, z. B. eine Preis- oder
   Tarif-Engine, die du ohne Datenbank testen willst.

Für den häufigen Fall „benannte Abfrage“ gibt es leichtere Alternativen:

- einen Query Scope am Model (kennst du aus „Laravel vertieft“),
- eine kleine **Query-Klasse** pro Abfrage, z. B. `OverdueInvoicesQuery` mit einer Methode `get()`.

## Testen mit einer In-Memory-Implementierung

Der stärkste praktische Vorteil zeigt sich im Test. Eine In-Memory-Implementierung ist ein
[[test-double|Test-Double]]: Sie verhält sich wie das echte Repository, braucht aber keine Datenbank.

```php title="Ein Test ohne Datenbank"
$repo = new InMemoryInvoiceRepository();
$repo->add(new InvoiceRecord(1, customerId: 7, dueDate: '2026-09-01', paid: false));

expect((new OverdueReminder($repo))->handle(7, '2026-10-10'))->toBe([1]);
```

Solche Tests laufen in Millisekunden. Bedenke aber: Laravel-Feature-Tests mit `RefreshDatabase` und
SQLite im Arbeitsspeicher sind ebenfalls schnell und testen die **echten** Abfragen mit. Viele Teams
fahren gut damit, Eloquent direkt zu nutzen und gegen eine Testdatenbank zu prüfen.

> [!PRAXIS]
> In großen Laravel-Codebasen findest du oft einen Mittelweg: Eloquent direkt in Actions für normale
> Fälle, Repositories nur an den Grenzen zu externen Systemen. Wichtig ist, dass das Team die Regel
> kennt und einheitlich anwendet.

## Zusammenfassung

- Ein Repository versteckt die Datenquelle hinter fachlich benannten Methoden und einem Interface.
- Eloquent ist selbst schon eine Abstraktion; Durchreich-Repositories kosten mehr, als sie bringen.
- Ein Repository, das Builder oder `where` durchreicht, hebelt das Muster aus.
- Es lohnt sich bei mehreren Datenquellen, fachlich wichtigen Abfragen oder einem bewusst framework-freien Kern.
- Leichtere Alternativen: Query Scopes und kleine Query-Klassen.
- In-Memory-Implementierungen machen Tests schnell – Feature-Tests mit Testdatenbank prüfen die echten Abfragen.
