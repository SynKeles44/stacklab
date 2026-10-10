---
title: Multi-Tenancy – Strategien und Global Scopes
summary: Welche Wege es gibt, die Daten mehrerer Kunden in einer App zu trennen, und wie du die tenant_id-Variante mit Mandanten-Kontext, Global Scope und Middleware umsetzt.
duration: 25
sources:
  - title: Laravel-Dokumentation – Eloquent Global Scopes
    url: https://laravel.com/docs/13.x/eloquent#global-scopes
  - title: Laravel-Dokumentation – Service Container (scoped)
    url: https://laravel.com/docs/13.x/container#binding-scoped
  - title: Laravel-Dokumentation – Middleware
    url: https://laravel.com/docs/13.x/middleware
quiz:
  - type: single
    question: Was ist ein Mandant (Tenant) in einer SaaS-Anwendung?
    options:
      - Ein einzelner Datenbankserver
      - Ein Kunde – meist eine Firma oder Organisation –, dessen Daten von denen aller anderen Kunden getrennt sein müssen
      - Ein Benutzer mit Admin-Rechten
      - Eine Laravel-Konfigurationsdatei
    answer: 1
    explanation: >
      Ein Mandant ist ein Kunde der Software, oft mit vielen eigenen Benutzern. Alle Mandanten teilen sich
      dieselbe App, sehen aber nur ihre eigenen Daten.
  - type: match
    question: Ordne jeder Strategie ihr Merkmal zu.
    pairs:
      - { left: "Gemeinsame Tabellen mit tenant_id", right: "Günstig und einfach, Trennung hängt an jeder Abfrage" }
      - { left: "Schema pro Mandant", right: "Gleiche Datenbank, getrennte Tabellensätze" }
      - { left: "Datenbank pro Mandant", right: "Stärkste Trennung, aufwendige Migrationen und Verbindungen" }
    explanation: Je stärker die Trennung, desto höher der Betriebsaufwand. Viele Apps starten mit tenant_id.
  - type: multiple
    question: Welche Bausteine gehören zur tenant_id-Variante in Laravel?
    options:
      - Ein Mandanten-Kontext, der pro Request bzw. Job gilt
      - Ein Global Scope, der jede Abfrage auf den Mandanten filtert
      - Eine Middleware, die den Mandanten aus der Anfrage bestimmt
      - Ein zweites Laravel-Projekt pro Mandant
    answers: [0, 1, 2]
    explanation: Kontext, Scope und Middleware arbeiten zusammen. Ein eigenes Projekt pro Mandant wäre das Gegenteil von Multi-Tenancy.
  - type: find-bug
    question: Dieser Global Scope soll nie fremde Daten liefern. Welche Zeile ist gefährlich?
    language: php
    code: |
      final class TenantScope implements Scope
      {
          public function apply(Builder $builder, Model $model): void
          {
              $tenant = app(TenantContext::class)->id();

              if ($tenant === null) {
                  return;
              }

              $builder->where($model->qualifyColumn('tenant_id'), $tenant);
          }
      }
    bug_line: 8
    explanation: >
      Ohne Mandant kehrt der Scope zurück, ohne zu filtern – die Abfrage liefert dann die Daten **aller**
      Mandanten. Sicher ist „fail closed“: `$builder->whereRaw('1 = 0');` liefert ohne Mandant nichts.
tasks:
  - id: mandanten-filter
    type: code
    language: php
    title: Ein mandantensicheres Verzeichnis
    description: |
      Baue das Prinzip eines Global Scopes in reinem PHP nach. `TenantContext` ist vorgegeben.

      Schreibe `TenantAwareStore`. Er bekommt den Kontext im Konstruktor und hält Zeilen (Arrays) intern.

      - `create(array $row): array` setzt `tenant_id` aus dem Kontext und speichert die Zeile.
        - Ist kein Mandant gesetzt, wirf eine `LogicException`.
        - Enthält `$row` schon eine **andere** `tenant_id`, wirf eine `DomainException`.
        - Gib die gespeicherte Zeile zurück.
      - `all(): array` liefert nur die Zeilen des aktuellen Mandanten (als Liste). Ohne Mandant: leere
        Liste – „fail closed“.
      - `allTenants(): array` liefert bewusst alle Zeilen (wie `withoutGlobalScopes()` für Admin-Werkzeuge).
    starter: |
      <?php

      declare(strict_types=1);

      final class TenantContext
      {
          private ?int $tenantId = null;

          public function set(?int $tenantId): void
          {
              $this->tenantId = $tenantId;
          }

          public function id(): ?int
          {
              return $this->tenantId;
          }
      }

      final class TenantAwareStore
      {
          private array $rows = [];

          public function __construct(private TenantContext $context) {}

          public function create(array $row): array
          {
          }

          public function all(): array
          {
          }

          public function allTenants(): array
          {
          }
      }
    tests:
      - name: jeder Mandant sieht nur seine Zeilen
        code: |
          $ctx = new TenantContext();
          $store = new TenantAwareStore($ctx);
          $ctx->set(1); $store->create(['title' => 'A']);
          $ctx->set(2); $store->create(['title' => 'B']); $store->create(['title' => 'C']);
          assert_same(['B', 'C'], array_column($store->all(), 'title'));
          $ctx->set(1);
          assert_same(['A'], array_column($store->all(), 'title'));
      - name: create setzt die tenant_id aus dem Kontext
        code: |
          $ctx = new TenantContext(); $ctx->set(7);
          $row = (new TenantAwareStore($ctx))->create(['title' => 'X']);
          assert_same(7, $row['tenant_id']);
      - name: ohne Mandant ist alles leer und Anlegen verboten
        code: |
          $ctx = new TenantContext();
          $store = new TenantAwareStore($ctx);
          $ctx->set(1); $store->create(['title' => 'A']);
          $ctx->set(null);
          assert_same([], $store->all());
          $thrown = false;
          try { $store->create(['title' => 'B']); } catch (LogicException $e) { $thrown = true; }
          assert_true($thrown);
      - name: eine fremde tenant_id wird abgelehnt, allTenants sieht alles
        code: |
          $ctx = new TenantContext(); $ctx->set(1);
          $store = new TenantAwareStore($ctx);
          $store->create(['title' => 'A', 'tenant_id' => 1]);
          $thrown = false;
          try { $store->create(['title' => 'B', 'tenant_id' => 2]); } catch (DomainException $e) { $thrown = true; }
          assert_true($thrown);
          $ctx->set(3); $store->create(['title' => 'C']);
          assert_same(2, count($store->allTenants()));
    solution: |
      <?php

      declare(strict_types=1);

      final class TenantContext
      {
          private ?int $tenantId = null;

          public function set(?int $tenantId): void
          {
              $this->tenantId = $tenantId;
          }

          public function id(): ?int
          {
              return $this->tenantId;
          }
      }

      final class TenantAwareStore
      {
          private array $rows = [];

          public function __construct(private TenantContext $context) {}

          public function create(array $row): array
          {
              $tenant = $this->context->id();

              if ($tenant === null) {
                  throw new LogicException('No tenant in context.');
              }

              if (isset($row['tenant_id']) && $row['tenant_id'] !== $tenant) {
                  throw new DomainException('Foreign tenant id.');
              }

              $row['tenant_id'] = $tenant;
              $this->rows[] = $row;

              return $row;
          }

          public function all(): array
          {
              $tenant = $this->context->id();

              if ($tenant === null) {
                  return [];
              }

              return array_values(array_filter($this->rows, fn (array $r) => $r['tenant_id'] === $tenant));
          }

          public function allTenants(): array
          {
              return $this->rows;
          }
      }
    hints:
      - "Hol dir den Mandanten in jeder Methode frisch mit `$this->context->id()` – er kann sich zwischen zwei Aufrufen ändern."
      - "`array_values(array_filter(...))` liefert eine Liste ab Index 0."
  - id: strategie-waehlen
    type: dragdrop
    title: Welche Strategie passt?
    description: Ordne jede Situation der Trennungs-Strategie zu, die am besten passt.
    targets:
      - { id: spalte, label: "Gemeinsame Tabellen mit tenant_id" }
      - { id: datenbank, label: Datenbank pro Mandant }
    items:
      - { label: "Eine Projektmanagement-App mit 4000 kleinen Firmen als Kunden", target: spalte }
      - { label: "Wenige Großkunden verlangen vertraglich eine eigene Datenbank", target: datenbank }
      - { label: "Ein Start-up will schnell starten und Berichte über alle Kunden fahren", target: spalte }
      - { label: "Ein Kunde will seine Daten in einer anderen Region speichern", target: datenbank }
      - { label: "Jeder Kunde hat nur ein paar hundert Datensätze", target: spalte }
    hints:
      - Viele kleine Kunden sprechen für geteilte Tabellen. Harte vertragliche oder regionale Anforderungen sprechen für getrennte Datenbanken.
---
Deine App verwaltet Projekte für Firmen. Firma A und Firma B nutzen dieselbe Installation, dieselbe
Datenbank, dieselben Tabellen. Ein einziges vergessenes `where` – und Firma A sieht die Projekte von
Firma B. Das ist kein Schönheitsfehler, sondern ein [[datenleck|Datenleck]] mit rechtlichen Folgen.
Multi-Tenancy heißt: Diese Trennung ist **eingebaut**, nicht erinnert.

## Mandanten und Multi-Tenancy

Ein [[mandant|Mandant]] (englisch *Tenant*) ist ein Kunde deiner Software – meist eine Organisation mit
eigenen Benutzern. [[multi-tenancy|Multi-Tenancy]] bedeutet: Eine einzige Installation bedient viele
Mandanten, und jeder sieht nur seine eigenen Daten.

Der Unterschied zu normaler Berechtigung: Bei [[autorisierung|Autorisierung]] fragst du „Darf dieser
Benutzer das?“. Bei Multi-Tenancy fragst du vorher „In welcher Welt befinden wir uns überhaupt?“. Erst
der Mandant, dann die Rechte innerhalb des Mandanten.

> [!MERKSATZ]
> Mandanten-Trennung ist eine Sicherheitsgrenze. Sie muss automatisch greifen – nicht nur dort, wo jemand
> daran gedacht hat.

## Drei Strategien

![Drei Strategien: gemeinsame Tabellen, Schema pro Mandant, Datenbank pro Mandant](/assets/laravel-architektur/mandanten-strategien.svg)

| Strategie | Trennung | Aufwand | Typisch für |
|---|---|---|---|
| Gemeinsame Tabellen + `tenant_id` | logisch, pro Abfrage | gering | viele kleine Mandanten |
| Schema pro Mandant | Tabellensätze getrennt | mittel | PostgreSQL-Setups |
| [[datenbank-pro-mandant\|Datenbank pro Mandant]] | physisch | hoch | wenige große, anspruchsvolle Kunden |

Bei der Datenbank pro Mandant musst du pro Request die Verbindung umschalten und jede
[[migration|Migration]] für hunderte Datenbanken ausführen. Dafür ist ein vergessenes `where` dort
harmlos. Bei `tenant_id` ist es umgekehrt: einfacher Betrieb, aber jede Abfrage muss filtern.

Für die getrennten Varianten gibt es fertige Pakete; die offizielle Laravel-Doku beschreibt sie nicht.
Diese Lektion zeigt die `tenant_id`-Variante, die du vollständig selbst verstehst.

## Der Mandanten-Kontext

Irgendwo muss stehen, für welchen Mandanten der aktuelle Request läuft. Dafür gibt es eine kleine Klasse,
den [[mandanten-kontext|Mandanten-Kontext]]:

```php title="app/Support/Tenancy/TenantContext.php"
final class TenantContext
{
    private ?int $tenantId = null;

    public function set(int $tenantId): void { $this->tenantId = $tenantId; }

    public function id(): ?int { return $this->tenantId; }
}
```

```php title="AppServiceProvider::register()"
$this->app->scoped(TenantContext::class);
```

`scoped` statt [[singleton|singleton]] ist hier entscheidend: Ein scoped-Objekt gilt für **einen**
Request oder **einen** Queue-Job und wird danach verworfen. Ein Singleton würde den Mandanten eines Jobs
in den nächsten Job mitnehmen.

Eine [[middleware|Middleware]] füllt den Kontext, etwa aus der [[subdomain|Subdomain]]
(`firma-a.example.com`), aus dem eingeloggten Benutzer oder aus einem Header. Fehlt der Mandant, bricht
sie ab.

## Der Global Scope filtert jede Abfrage

Ein [[global-scope|Global Scope]] hängt an jede Eloquent-Abfrage eines Models eine Bedingung. Zusammen
mit einem [[trait|Trait]] bekommt jedes mandantenfähige Model den Filter mit einer Zeile:

```php title="app/Support/Tenancy/BelongsToTenant.php"
trait BelongsToTenant
{
    public static function bootBelongsToTenant(): void
    {
        static::addGlobalScope(new TenantScope);

        static::creating(function (Model $model): void {
            $model->tenant_id ??= app(TenantContext::class)->id();
        });
    }
}
```

```php title="app/Support/Tenancy/TenantScope.php (apply)"
$tenant = app(TenantContext::class)->id();

$tenant === null
    ? $builder->whereRaw('1 = 0')
    : $builder->where($model->qualifyColumn('tenant_id'), $tenant);
```

Zwei Details machen den Unterschied: `creating` setzt die `tenant_id` beim Anlegen automatisch, und ohne
Mandant liefert der Scope **nichts** statt alles. Dieses Prinzip heißt [[fail-closed|fail closed]].

> [!FEHLER]
> Ein Scope, der ohne Mandant einfach nicht filtert. Im Request fällt es nie auf – aber im Artisan-Befehl
> oder im Queue-Job, wo kein Mandant gesetzt ist, sieht der Code plötzlich die Daten aller Kunden.

> [!PRAXIS]
> Für Admin-Werkzeuge über alle Mandanten nutzt du bewusst `Invoice::withoutGlobalScope(TenantScope::class)`.
> In großen Projekten ist genau diese Methode per Architekturtest auf wenige Namespaces beschränkt.

## Zusammenfassung

- Ein Mandant ist ein Kunde deiner SaaS-App; Multi-Tenancy trennt die Daten vieler Mandanten in einer Installation.
- Strategien: gemeinsame Tabellen mit `tenant_id`, Schema pro Mandant, Datenbank pro Mandant – mehr Trennung kostet mehr Betrieb.
- Ein Mandanten-Kontext hält den aktuellen Mandanten; registriere ihn als `scoped`, nie als Singleton.
- Eine Middleware bestimmt den Mandanten, ein Global Scope filtert jede Abfrage, `creating` setzt die `tenant_id`.
- Ohne Mandant liefert der Scope nichts – fail closed statt fremder Daten.
