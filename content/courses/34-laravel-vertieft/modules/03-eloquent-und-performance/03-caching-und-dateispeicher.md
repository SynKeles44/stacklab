---
title: Caching und Dateispeicher
summary: Teure Ergebnisse mit Cache::remember zwischenspeichern, den Cache gezielt leeren und Dateien über Disks speichern, ausliefern und im Test faken.
duration: 25
sources:
  - title: Laravel – Cache
    url: https://laravel.com/docs/13.x/cache
  - title: Laravel – File Storage
    url: https://laravel.com/docs/13.x/filesystem
quiz:
  - type: single
    question: Was passiert bei `Cache::remember('stats', 600, fn () => Order::count())`, wenn der Schlüssel `stats` schon im Cache liegt?
    options:
      - Die Closure läuft trotzdem, und der Wert wird überschrieben
      - Der gespeicherte Wert wird zurückgegeben, die Closure läuft nicht
      - Die Lebensdauer wird auf 600 Sekunden zurückgesetzt
    answer: 1
    explanation: remember() führt die Closure nur bei einem Cache-Miss aus. Liegt ein gültiger Wert vor, kommt er direkt aus dem Cache.
  - type: match
    question: Welche Cache-Methode passt?
    pairs:
      - { left: "Cache::forget('stats')", right: Einen Eintrag löschen }
      - { left: "Cache::add('lock', 1, 10)", right: "Nur speichern, wenn der Schlüssel noch fehlt" }
      - { left: "Cache::increment('views')", right: Einen Zähler erhöhen }
      - { left: "Cache::flexible('stats', [60, 300], fn)", right: Veraltete Werte kurz weiter ausliefern und im Hintergrund erneuern }
    explanation: forget löscht, add ist atomar und schreibt nur einmal, increment zählt, flexible setzt das Muster „stale while revalidate“ um.
  - type: cloze
    text: "Dateien auf der Disk `local` landen in `storage/app/___`. Damit Dateien der Disk `public` im Browser erreichbar sind, legst du mit `php artisan storage:___` einen symbolischen Link an."
    blanks:
      - [private]
      - [link]
    explanation: Die local-Disk ist privat und nicht über das Web erreichbar. storage:link verlinkt storage/app/public nach public/storage.
  - type: find-bug
    question: Nach dem Speichern eines Produkts zeigt die Startseite noch zehn Minuten lang den alten Preis. Welche Zeile fehlt bzw. ist falsch?
    language: php
    code: |
      class ProductObserver
      {
          public function saved(Product $product): void
          {
              Cache::put('products.featured', null);
          }
      }
    bug_line: 5
    explanation: "put mit null speichert den Wert null statt den Eintrag zu entfernen – je nach Code wird dann nichts oder Falsches angezeigt. Richtig ist Cache::forget('products.featured');"
tasks:
  - id: ttl-cache
    type: code
    language: php
    title: remember() selbst gebaut
    description: |
      Baue das Herz von `Cache::remember()` nach – mit einem einfachen Array als Speicher.

      Schreibe die Klasse `TtlCache` mit der Methode
      `remember(string $key, int $ttl, int $now, Closure $callback): mixed`.

      - Gibt es für `$key` einen Eintrag, der noch gültig ist (`$now` kleiner als die Ablaufzeit), gib
        den gespeicherten Wert zurück – **ohne** `$callback` aufzurufen.
      - Sonst rufe `$callback()` auf, speichere das Ergebnis mit der Ablaufzeit `$now + $ttl` und gib es
        zurück.
      - `forget(string $key): void` entfernt einen Eintrag.

      `$now` ist eine Zeit in Sekunden – so lässt sich der Ablauf ohne Warten testen.
    starter: |
      <?php

      class TtlCache
      {
          private array $items = [];

          public function remember(string $key, int $ttl, int $now, Closure $callback): mixed
          {
              // gültigen Eintrag zurückgeben oder neu berechnen und speichern
          }

          public function forget(string $key): void
          {
          }
      }
    tests:
      - name: beim ersten Aufruf wird berechnet
        code: |
          $c = new TtlCache();
          assert_same(42, $c->remember('antwort', 60, 1000, fn () => 42));
      - name: innerhalb der TTL läuft die Closure nicht erneut
        code: |
          $c = new TtlCache();
          $aufrufe = new ArrayObject();
          $f = function () use ($aufrufe) { $aufrufe->append(1); return 'teuer'; };
          $c->remember('k', 60, 1000, $f);
          assert_same('teuer', $c->remember('k', 60, 1059, $f));
          assert_same(1, count($aufrufe));
      - name: nach Ablauf wird neu berechnet
        code: |
          $c = new TtlCache();
          $c->remember('k', 60, 1000, fn () => 'alt');
          assert_same('neu', $c->remember('k', 60, 1060, fn () => 'neu'));
      - name: forget entfernt den Eintrag
        code: |
          $c = new TtlCache();
          $c->remember('k', 60, 1000, fn () => 'alt');
          $c->forget('k');
          assert_same('neu', $c->remember('k', 60, 1001, fn () => 'neu'));
      - name: auch null und false werden gespeichert
        code: |
          $c = new TtlCache();
          $aufrufe = new ArrayObject();
          $c->remember('leer', 60, 1000, function () use ($aufrufe) { $aufrufe->append(1); return false; });
          assert_same(false, $c->remember('leer', 60, 1001, function () use ($aufrufe) { $aufrufe->append(1); return true; }));
          assert_same(1, count($aufrufe));
    hints:
      - "Speichere pro Schlüssel ein Array: `['value' => $wert, 'expires' => $now + $ttl]`."
      - "Prüfe mit `isset($this->items[$key]) && $now < $this->items[$key]['expires']` – nicht mit dem Wert selbst, sonst scheitert der Test mit `false`."
      - "`forget()` ist ein `unset($this->items[$key]);`."
    solution: |
      <?php

      class TtlCache
      {
          private array $items = [];

          public function remember(string $key, int $ttl, int $now, Closure $callback): mixed
          {
              if (isset($this->items[$key]) && $now < $this->items[$key]['expires']) {
                  return $this->items[$key]['value'];
              }

              $value = $callback();
              $this->items[$key] = ['value' => $value, 'expires' => $now + $ttl];

              return $value;
          }

          public function forget(string $key): void
          {
              unset($this->items[$key]);
          }
      }
  - id: cache-und-export
    type: terminal
    title: Gecachte Statistik und CSV-Export
    description: |
      Im Ordner `cache-uebung` liegt eine Laravel-Anwendung mit drei Testnutzern.

      1. Lege die Route `GET /stats` an. Sie liefert `{"users": <Anzahl>}` und speichert das Ergebnis
         mit `Cache::remember('stats.users', 300, …)` fünf Minuten im Cache.
      2. Erzeuge den Befehl `php artisan make:command ExportUsers` mit der Signatur `export:users`. Er
         schreibt auf die Disk `local` die Datei `exports/users.csv`: eine Kopfzeile `name,email` und
         darunter eine Zeile pro Nutzer. Danach gibt er `Export: exports/users.csv` aus.
      3. Lege die Route `GET /exports/users` an, die die Datei mit `Storage::download(...)` als Download
         ausliefert.
      4. Führe den Export einmal aus: `php artisan export:users`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: cache-uebung
    setup: |
      # Laravel-13-Basis (mit Pest) einmal bauen und zwischenspeichern, dann hierher kopieren
      B="$HOME/.cache/stacklab/laravel13"
      if [ ! -f "$B/.fertig" ]; then
        T="$B.bau.$$"; rm -rf "$T"; mkdir -p "$(dirname "$B")"
        timeout 170 composer create-project laravel/laravel "$T" "^13.0" -n -q --prefer-dist </dev/null
        cd "$T"
        timeout 170 composer require pestphp/pest pestphp/pest-plugin-laravel --dev -W -n -q </dev/null
        printf '%s\n' '<?php' '' "pest()->extend(Tests\\TestCase::class)->in('Feature');" > tests/Pest.php
        printf '%s\n' '<?php' '' "test('the application returns a successful response', function () {" "    \$this->get('/')->assertStatus(200);" '});' > tests/Feature/ExampleTest.php
        printf '%s\n' '<?php' '' "test('that true is true', function () {" '    expect(true)->toBeTrue();' '});' > tests/Unit/ExampleTest.php
        touch .fertig && cd - >/dev/null
        rm -rf "$B" && mv "$T" "$B"
      fi
      cp -a "$B/." . && rm -f .fertig
      php artisan tinker --execute="foreach (['Ada', 'Grace', 'Linus'] as \$n) { App\Models\User::create(['name' => \$n, 'email' => strtolower(\$n).'@example.com', 'password' => 'geheim123']); }"
    checks:
      - type: command
        run: |
          php <<'PHP'
          <?php
          require 'vendor/autoload.php';
          $app = require 'bootstrap/app.php';
          $kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
          $kernel->bootstrap();
          Illuminate\Support\Facades\Cache::put('stats.users', ['users' => 99], 300);
          $a = json_decode($kernel->handle(Illuminate\Http\Request::create('/stats'))->getContent(), true);
          Illuminate\Support\Facades\Cache::forget('stats.users');
          $b = json_decode($kernel->handle(Illuminate\Http\Request::create('/stats'))->getContent(), true);
          echo ($a['users'] ?? 'x'), '|', ($b['users'] ?? 'x'), "\n";
          PHP
        stdout_matches: "^99\\|3\\s*$"
        message: "GET /stats soll {\"users\": …} liefern und dafür Cache::remember('stats.users', 300, …) nutzen."
      - type: command
        run: |
          php artisan tinker --execute="echo Storage::disk('local')->exists('exports/users.csv') ? trim(Storage::disk('local')->get('exports/users.csv')) : 'fehlt';"
        stdout_matches: "^name,email\\nAda,ada@example\\.com\\nGrace,grace@example\\.com\\nLinus,linus@example\\.com\\s*$"
        message: storage/app/private/exports/users.csv fehlt oder hat nicht die Kopfzeile name,email plus eine Zeile pro Nutzer. Hast du php artisan export:users ausgeführt?
      - type: command
        run: php artisan export:users
        stdout_matches: "Export: exports/users\\.csv"
        message: "php artisan export:users soll „Export: exports/users.csv“ ausgeben."
      - type: command
        run: |
          php <<'PHP'
          <?php
          require 'vendor/autoload.php';
          $app = require 'bootstrap/app.php';
          $r = $app->make(Illuminate\Contracts\Http\Kernel::class)->handle(Illuminate\Http\Request::create('/exports/users'));
          echo $r->getStatusCode(), '|', str_contains((string) $r->headers->get('Content-Disposition'), 'attachment') ? 'download' : 'kein-download', "\n";
          PHP
        stdout_matches: "^200\\|download\\s*$"
        message: GET /exports/users soll die Datei als Download ausliefern (Storage::download('exports/users.csv')).
    hints:
      - "Die Route: `Route::get('/stats', fn () => Cache::remember('stats.users', 300, fn () => ['users' => App\\Models\\User::count()]));`"
      - "Im Befehl: Zeilen sammeln, z. B. `$lines = ['name,email']; foreach (User::orderBy('id')->lazy() as $user) { $lines[] = $user->name.','.$user->email; }` und dann `Storage::put('exports/users.csv', implode(\"\\n\", $lines));`"
      - "Der Download: `Route::get('/exports/users', fn () => Storage::download('exports/users.csv'));`"
    solution: |
      ```php title="routes/web.php"
      use App\Models\User;
      use Illuminate\Support\Facades\Cache;
      use Illuminate\Support\Facades\Storage;

      Route::get('/stats', fn () => Cache::remember('stats.users', 300, fn () => [
          'users' => User::count(),
      ]));

      Route::get('/exports/users', fn () => Storage::download('exports/users.csv'));
      ```

      ```php title="app/Console/Commands/ExportUsers.php"
      #[Signature('export:users')]
      #[Description('Exportiert alle Nutzer als CSV')]
      class ExportUsers extends Command
      {
          public function handle(): int
          {
              $lines = ['name,email'];

              foreach (User::orderBy('id')->lazy() as $user) {
                  $lines[] = $user->name.','.$user->email;
              }

              Storage::put('exports/users.csv', implode("\n", $lines)."\n");
              $this->info('Export: exports/users.csv');

              return self::SUCCESS;
          }
      }
      ```
---
Die Startseite zeigt „1 284 Bestellungen heute“. Dafür läuft bei **jedem** Aufruf eine Abfrage über eine
Tabelle mit Millionen Zeilen – obwohl sich die Zahl nur langsam ändert. Und der Export, den deine
Kollegin morgen herunterladen will, muss irgendwo liegen. Für beides bringt Laravel einheitliche
Werkzeuge mit: den **Cache** und das **Storage**-System.

## Cache::remember – das wichtigste Muster

Ein [[cache|Cache]] ist ein Zwischenspeicher für teure Ergebnisse. Das typische Muster heißt
„erst nachsehen, sonst berechnen und ablegen“:

```php
use Illuminate\Support\Facades\Cache;

$stats = Cache::remember('orders.today', 600, function () {
    return Order::whereDate('created_at', today())->count();
});
```

| Teil | Bedeutung |
|---|---|
| `'orders.today'` | Schlüssel – eindeutiger Name des Eintrags |
| `600` | Lebensdauer in Sekunden ([[ttl|TTL]]); auch `now()->addMinutes(10)` geht |
| Closure | läuft nur, wenn nichts (Gültiges) im Cache liegt |

Weitere Methoden:

```php
Cache::get('key', 'standard');      // lesen
Cache::put('key', $wert, 600);      // schreiben
Cache::forget('key');               // löschen
Cache::increment('views');          // Zähler
Cache::rememberForever('settings', fn () => Setting::all());
```

Wo die Daten liegen, bestimmt `CACHE_STORE` in `.env`: `database` (Standard), `file`, `redis` oder
`array` (nur für Tests, vergisst alles am Ende des Requests).

## Den Cache gezielt leeren

Die schwierigste Frage beim Caching: Wann ist ein Wert veraltet? Zwei Strategien:

1. **Ablaufen lassen** – kurze TTL, die Zahl darf ein paar Minuten alt sein.
2. **Aktiv löschen** – wenn sich die Daten ändern, wird der Eintrag entfernt, etwa im Observer:

```php title="app/Observers/OrderObserver.php"
public function saved(Order $order): void
{
    Cache::forget('orders.today');
}
```

Für sehr beliebte Einträge gibt es das Muster [[stale-while-revalidate|Stale While Revalidate]]: `Cache::flexible('stats', [60, 300], fn () => …)`: Nach 60 Sekunden
gilt der Wert als „alt“ und wird **nach** der Antwort im Hintergrund erneuert. Nutzer warten dadurch nie
auf die Neuberechnung.

> [!FEHLER]
> **Den Cache mit `put(..., null)` leeren wollen.** Damit speicherst du `null` als Wert. Zum Löschen dient
> `Cache::forget()`. Und `php artisan cache:clear` leert **alles** – in Produktion selten, was du willst.

> [!MERKSATZ]
> Cache nur, was teuer ist **und** etwas veralten darf. Lege für jeden Eintrag fest, wann er ungültig
> wird – durch Ablauf oder durch `forget()`.

## Dateien speichern: Disks

Laravels Storage-System arbeitet mit [[filesystem-disk|Disks]]. Eine Disk ist ein benannter Speicherort –
lokal oder in der Cloud. Der Code bleibt gleich, nur die Konfiguration in `config/filesystems.php`
ändert sich.

| Disk | Ort | Erreichbar im Browser? |
|---|---|---|
| `local` (Standard) | `storage/app/private` | nein |
| `public` | `storage/app/public` | ja, nach `php artisan storage:link` |
| `s3` | Objektspeicher in der Cloud | je nach Einstellung |

```php
use Illuminate\Support\Facades\Storage;

Storage::put('exports/users.csv', $inhalt);            // Disk local
Storage::disk('public')->put('logos/shop.svg', $svg);  // Disk public
Storage::get('exports/users.csv');
Storage::exists('exports/users.csv');
Storage::delete('exports/users.csv');
Storage::disk('public')->url('logos/shop.svg');        // /storage/logos/shop.svg
```

## Uploads und Downloads

Hochgeladene Dateien aus einem Formular speicherst du mit einer Zeile. Laravel vergibt einen
zufälligen Dateinamen und gibt den Pfad zurück:

```php
$path = $request->file('avatar')->store('avatars', 'public');
$user->update(['avatar_path' => $path]);
```

Ausliefern als Download – auch von der privaten Disk:

```php
Route::get('/exports/users', fn () => Storage::download('exports/users.csv'));
```

So entscheidet deine Route (und etwa eine Policy), wer die Datei bekommt. Dateien der Disk `public`
dagegen kann jeder abrufen, der die URL kennt.

> [!PRAXIS]
> Lokal nutzt man die Disk `local`, in Produktion `s3`. Weil der Code nur `Storage::` kennt, reicht ein
> anderer Wert in `FILESYSTEM_DISK`. Im Test ersetzt `Storage::fake('public')` die Disk durch einen
> leeren temporären Ordner – mehr dazu in Modul 4.

## Zusammenfassung

- `Cache::remember($key, $ttl, $closure)` berechnet nur beim Cache-Miss und speichert das Ergebnis.
- Veraltete Werte entfernst du mit `Cache::forget()` – oft in einem Observer; `flexible()` erneuert im Hintergrund.
- `CACHE_STORE` wählt den Speicher: `database`, `file`, `redis`, `array`.
- Das Storage-System arbeitet mit Disks: `local` (privat, `storage/app/private`), `public`, `s3`.
- Uploads speicherst du mit `->store('ordner', 'disk')`, Downloads lieferst du mit `Storage::download()`.
