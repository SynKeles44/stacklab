---
title: Laravel mehrsprachig machen
summary: Sprachdateien, __() und trans_choice, die Locale pro Request setzen und Zahlen und Datum in Laravel lokalisiert ausgeben.
duration: 25
sources:
  - title: Laravel – Localization
    url: https://laravel.com/docs/13.x/localization
  - title: Laravel – Middleware
    url: https://laravel.com/docs/13.x/middleware
  - title: Laravel – Helpers (Number)
    url: https://laravel.com/docs/13.x/helpers#numbers
  - title: Carbon – Localization
    url: https://carbon.nesbot.com/docs/#api-localization
quiz:
  - type: single
    question: Was liefert `__('shop.welcome')`, wenn es den Schlüssel in keiner Sprache gibt?
    options:
      - Einen leeren String
      - Den Schlüssel `shop.welcome` selbst
      - "`null`"
      - Laravel wirft eine Exception
    answer: 1
    explanation: >
      Laravel gibt den Schlüssel zurück. Dadurch fallen fehlende Übersetzungen auf der Seite sofort auf, ohne
      dass die Seite abstürzt.
  - type: match
    question: Ordne jeder Zeile aus `lang/de/time.php` zu, was `trans_choice('time.minutes', $n, ['value' => $n])` für das passende `$n` liefert.
    pairs:
      - { left: "'{0} gerade eben|{1} vor einer Minute|[2,*] vor :value Minuten' mit $n = 0", right: "gerade eben" }
      - { left: "dasselbe mit $n = 1", right: "vor einer Minute" }
      - { left: "dasselbe mit $n = 7", right: "vor 7 Minuten" }
      - { left: "'Ein Apfel|:count Äpfel' mit $n = 3", right: "3 Äpfel" }
    explanation: >
      `{0}` und `{1}` treffen genaue Werte, `[2,*]` einen Bereich. Ohne solche Angaben wählt Laravel die Form
      nach den Pluralregeln der Sprache, und `:count` setzt die Zahl ein.
  - type: multiple
    question: Welche Aussagen über die Locale in Laravel stimmen?
    options:
      - "`APP_LOCALE` legt die Standardsprache fest, `APP_FALLBACK_LOCALE` die Rückfallsprache."
      - "`App::setLocale('en')` ändert die Sprache für den aktuellen Request."
      - Laravel wählt die Sprache automatisch nach `Accept-Language` – du musst nichts tun.
      - Eine Middleware ist ein guter Ort, um die Locale pro Request zu setzen.
    answers: [0, 1, 3]
    explanation: >
      Laravel nutzt standardmäßig immer `APP_LOCALE`. Die Auswahl pro Request (Profil, URL, Accept-Language)
      baust du selbst – typischerweise in einer Middleware.
  - type: cloze
    text: "Platzhalter in Laravel-Übersetzungen beginnen mit einem ___. Schreibst du ihn als `:NAME`, wird der eingesetzte Wert in ___ ausgegeben."
    blanks:
      - [Doppelpunkt, ":"]
      - [Großbuchstaben, Großschreibung, "GROSSBUCHSTABEN"]
    explanation: >
      `:name` setzt den Wert ein, `:Name` schreibt den ersten Buchstaben groß, `:NAME` alles groß.
tasks:
  - id: laravel-sprachdateien
    type: terminal
    title: Sprachdateien und Pluralisierung in Laravel
    description: |
      Im Ordner `laravel-sprachen` liegt eine frische Laravel-13-Anwendung. Klicke zuerst auf **Aufgabe
      vorbereiten** (beim allerersten Mal dauert das etwas länger).

      1. Lege den `lang`-Ordner mit `php artisan lang:publish` an.
      2. Setze in `.env` die Standardsprache auf Deutsch (`APP_LOCALE=de`) und die Rückfallsprache auf
         Englisch (`APP_FALLBACK_LOCALE=en`).
      3. Lege `lang/de/shop.php` an mit
         - `welcome` → `Willkommen, :name!`
         - `cart` → `{0} Dein Warenkorb ist leer.|{1} Ein Produkt im Warenkorb.|[2,*] :count Produkte im Warenkorb.`
      4. Lege `lang/en/shop.php` an mit denselben Schlüsseln auf Englisch (`Welcome, :name!` und
         `{0} Your cart is empty.|{1} One item in your cart.|[2,*] :count items in your cart.`) und einem
         zusätzlichen Schlüssel `checkout` → `Check out`, den es **nur** auf Englisch gibt.
      5. Probiere es aus: `php artisan tinker --execute="echo trans_choice('shop.cart', 5);"`
    workdir: laravel-sprachen
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
    checks:
      - type: file_exists
        path: lang/en/validation.php
        message: Der lang-Ordner fehlt noch. Führe php artisan lang:publish aus.
      - type: command
        run: |
          php artisan tinker --execute="echo config('app.locale') . '/' . config('app.fallback_locale');"
        stdout_matches: "^de/en\\s*$"
        message: Setze in .env APP_LOCALE=de und APP_FALLBACK_LOCALE=en.
      - type: command
        run: |
          php artisan tinker --execute="echo __('shop.welcome', ['name' => 'Ada']);"
        stdout_matches: "^Willkommen, Ada!\\s*$"
        message: "__('shop.welcome', ['name' => 'Ada']) soll „Willkommen, Ada!“ liefern. Prüfe lang/de/shop.php und den Platzhalter :name."
      - type: command
        run: |
          php artisan tinker --execute="echo trans_choice('shop.cart', 0) . '|' . trans_choice('shop.cart', 1) . '|' . trans_choice('shop.cart', 5);"
        stdout_matches: "^Dein Warenkorb ist leer\\.\\|Ein Produkt im Warenkorb\\.\\|5 Produkte im Warenkorb\\.\\s*$"
        message: trans_choice('shop.cart', …) liefert für 0, 1 und 5 noch nicht die drei deutschen Formen. Nutze {0}, {1} und [2,*] und den Platzhalter :count.
      - type: command
        run: |
          php artisan tinker --execute="App::setLocale('en'); echo __('shop.welcome', ['name' => 'Ada']) . '|' . trans_choice('shop.cart', 2);"
        stdout_matches: "^Welcome, Ada!\\|2 items in your cart\\.\\s*$"
        message: Die englischen Texte in lang/en/shop.php fehlen oder stimmen nicht.
      - type: command
        run: |
          php artisan tinker --execute="echo __('shop.checkout');"
        stdout_matches: "^Check out\\s*$"
        message: "__('shop.checkout') soll auf Deutsch über die Rückfallsprache „Check out“ liefern. Steht der Schlüssel nur in lang/en/shop.php?"
    hints:
      - "Eine Sprachdatei gibt ein Array zurück: `<?php return ['welcome' => 'Willkommen, :name!'];`"
      - "Mit `sed -i 's/^APP_LOCALE=.*/APP_LOCALE=de/' .env` änderst du eine Zeile in `.env`."
      - "Siehst du alte Werte, hilft `php artisan config:clear`."
    solution: |
      ```bash
      cd laravel-sprachen
      php artisan lang:publish
      sed -i 's/^APP_LOCALE=.*/APP_LOCALE=de/' .env
      sed -i 's/^APP_FALLBACK_LOCALE=.*/APP_FALLBACK_LOCALE=en/' .env
      mkdir -p lang/de
      ```

      ```php title="lang/de/shop.php"
      <?php

      return [
          'welcome' => 'Willkommen, :name!',
          'cart' => '{0} Dein Warenkorb ist leer.|{1} Ein Produkt im Warenkorb.|[2,*] :count Produkte im Warenkorb.',
      ];
      ```

      ```php title="lang/en/shop.php"
      <?php

      return [
          'welcome' => 'Welcome, :name!',
          'cart' => '{0} Your cart is empty.|{1} One item in your cart.|[2,*] :count items in your cart.',
          'checkout' => 'Check out',
      ];
      ```
  - id: wohin-gehoert-es
    type: dragdrop
    title: Wo gehört es hin?
    description: Ordne jede Aufgabe der Stelle in einem Laravel-Projekt zu, an der du sie erledigst.
    targets:
      - { id: php, label: "PHP-Datei in lang/de/ (kurze Schlüssel)" }
      - { id: json, label: "lang/de.json (Text als Schlüssel)" }
      - { id: env, label: ".env bzw. config/app.php" }
      - { id: middleware, label: Eine eigene Middleware }
    items:
      - { label: "Übersetzung für `__('shop.cart_title')`", target: php }
      - { label: Deutsche Validierungsmeldungen anpassen, target: php }
      - { label: "Übersetzung für `__('Save changes')`", target: json }
      - { label: Standardsprache der Anwendung festlegen, target: env }
      - { label: Rückfallsprache festlegen, target: env }
      - { label: Die Sprache pro Request aus dem Profil oder Accept-Language wählen, target: middleware }
    hints:
      - "Ein Punkt im Schlüssel (`shop.cart_title`) bedeutet: Datei `shop.php`, Schlüssel `cart_title`."
---
Euer Laravel-Backend verschickt Bestätigungs-Mails, Validierungsfehler und Rechnungen – bisher nur auf
Deutsch. Jetzt sollen englischsprachige Kund:innen alles auf Englisch bekommen. Laravel bringt dafür alles
mit: Sprachdateien, Hilfsfunktionen für Übersetzung und Pluralisierung und eine Locale, die du pro Request
umschalten kannst.

## Der lang-Ordner und die Konfiguration

Eine frische Laravel-Anwendung hat noch keinen `lang`-Ordner. Du legst ihn mit Artisan an – zusammen mit
Laravels eigenen englischen Texten (Validierung, Passwort-Reset, Paginierung):

```bash title="Terminal"
php artisan lang:publish
```

```text title="Struktur"
lang/
├── en/
│   ├── auth.php
│   ├── pagination.php
│   ├── passwords.php
│   └── validation.php
├── de/            ← legst du an
│   └── shop.php
└── de.json        ← optional: Text als Schlüssel
```

Welche Sprache gilt, steht in `config/app.php` und kommt aus der [[env-datei|.env-Datei]]:

```dotenv title=".env"
APP_LOCALE=de
APP_FALLBACK_LOCALE=en
```

Fehlt ein Schlüssel in `de`, nimmt Laravel ihn aus der [[fallback-sprache|Rückfallsprache]] `en`. Fehlt er
auch dort, gibt es den Schlüssel selbst zurück. Regionale Varianten heißen in Laravel übrigens `en_GB`
(mit Unterstrich).

## Übersetzen mit __()

Laravel kennt beide Stile aus Lektion 4 – sprechende Schlüssel in PHP-Dateien und Text als Schlüssel in
JSON-Dateien. Beide holst du mit der Hilfsfunktion `__()`:

```php title="lang/de/shop.php"
<?php

return [
    'welcome' => 'Willkommen, :name!',
    'cart_title' => 'Warenkorb',
];
```

```json title="lang/de.json"
{
    "Save changes": "Änderungen speichern"
}
```

```php title="Verwendung"
__('shop.welcome', ['name' => 'Ada']);   // Willkommen, Ada!
__('Save changes');                      // Änderungen speichern
```

```blade title="In Blade"
<h1>{{ __('shop.cart_title') }}</h1>
```

[[platzhalter|Platzhalter]] beginnen mit einem Doppelpunkt. Die Schreibweise steuert die Großschreibung:
`:name` → „ada“, `:Name` → „Ada“, `:NAME` → „ADA“.

> [!FEHLER]
> `__('shop.welcome') . ' ' . $user->name` zerstückelt den Satz – genau wie in JavaScript. Übergib Werte
> immer als Platzhalter im zweiten Argument.

## Pluralisierung mit trans_choice

Pluralformen trennst du mit `|`. `trans_choice()` wählt anhand einer Zahl die passende Form:

```php title="lang/de/shop.php"
'cart' => '{0} Dein Warenkorb ist leer.|{1} Ein Produkt im Warenkorb.|[2,*] :count Produkte im Warenkorb.',
```

```php title="Verwendung"
trans_choice('shop.cart', 0);   // Dein Warenkorb ist leer.
trans_choice('shop.cart', 1);   // Ein Produkt im Warenkorb.
trans_choice('shop.cart', 5);   // 5 Produkte im Warenkorb.
```

- `{0}` und `{1}` treffen genau eine Zahl, `[2,*]` einen Bereich.
- `:count` setzt die Zahl ein; weitere Platzhalter übergibst du im dritten Argument.
- Ohne solche Angaben (`'Ein Apfel|:count Äpfel'`) wählt Laravel die Form nach den Pluralregeln der Sprache –
  für Polnisch schreibst du dann drei Formen hintereinander.

> [!MERKSATZ]
> `__()` für normale Texte, `trans_choice()` für alles mit Anzahl – und Werte immer als Platzhalter.

## Die Locale pro Request setzen

Laravel nutzt immer `APP_LOCALE`, bis du etwas anderes sagst. Die Wahl pro Request gehört in eine
[[middleware|Middleware]]:

```php title="app/Http/Middleware/SetLocale.php"
public function handle(Request $request, Closure $next): Response
{
    $supported = ['de', 'en'];

    $locale = $request->user()?->locale
        ?? $request->getPreferredLanguage($supported)
        ?? config('app.locale');

    App::setLocale($locale);

    return $next($request);
}
```

`getPreferredLanguage()` wertet den Header [[accept-language|Accept-Language]] aus und liefert die beste
unterstützte Sprache. Registriert wird die Middleware in `bootstrap/app.php` mit
`$middleware->web(append: [SetLocale::class])`.

> [!ACHTUNG]
> Übernimm nie ungeprüft einen Wert wie `?lang=…` als Locale. Prüfe ihn gegen eine Liste unterstützter
> Sprachen – sonst landen beliebige Werte in Dateipfaden und Caches.

## Zahlen und Datum in Laravel

Für Zahlen und Geld gibt es die Klasse `Illuminate\Support\Number` – sie nutzt intl:

```php title="Number-Helfer"
use Illuminate\Support\Number;

Number::currency(1314.99, in: 'EUR', locale: 'de');  // 1.314,99 €
Number::format(1234567.891, precision: 2, locale: 'de'); // 1.234.567,89
Number::useLocale('de');  // Standard-Locale für alle folgenden Aufrufe
```

Datumswerte lokalisiert Carbon: `now()->locale('de')->isoFormat('LLLL')` ergibt etwa „Sonntag, 29. März 2026
03:30“. Deutsche Validierungsmeldungen musst du nicht selbst schreiben – Community-Pakete wie
[Laravel Lang](https://laravel-lang.com) liefern sie für viele Sprachen.

> [!PRAXIS]
> In API-Projekten liefert das Backend oft nur Schlüssel oder Fehlercodes, und das Frontend übersetzt. Texte,
> die der Server selbst verschickt – E-Mails, PDFs, Push-Nachrichten –, übersetzt dagegen immer Laravel. Für
> Mails an andere Personen setzt du die Locale mit `Mail::to($user)->locale($user->locale)`.

## Zusammenfassung

- `php artisan lang:publish` legt den `lang`-Ordner an; `APP_LOCALE` und `APP_FALLBACK_LOCALE` steuern Standard- und Rückfallsprache.
- `__()` übersetzt Schlüssel aus `lang/de/*.php` oder Texte aus `lang/de.json`; Platzhalter schreibst du als `:name`.
- `trans_choice()` wählt Pluralformen mit `|`, `{0}`, `{1}`, `[2,*]` und `:count`.
- Die Locale pro Request setzt eine Middleware mit `App::setLocale()` und einer Liste erlaubter Sprachen.
- `Number::currency()`, `Number::format()` und Carbon geben Zahlen und Datum lokalisiert aus.
