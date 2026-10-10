---
title: API-Tokens mit Laravel Sanctum
summary: Du installierst Sanctum, gibst Nutzern opake API-Tokens mit Fähigkeiten aus, schützt Routen mit auth:sanctum und widerrufst Tokens wieder.
duration: 25
sources:
  - title: Laravel 13 – Sanctum
    url: https://laravel.com/docs/13.x/sanctum
  - title: Laravel 13 – Routing (API-Routen und install:api)
    url: https://laravel.com/docs/13.x/routing#api-routes
  - title: OWASP REST Security Cheat Sheet
    url: https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html
quiz:
  - type: single
    question: Was speichert Sanctum in der Tabelle `personal_access_tokens`?
    options:
      - Das Token im Klartext.
      - Einen SHA-256-Hash des Tokens, dazu Name, Fähigkeiten, Besitzer und Zeitstempel.
      - Das Passwort des Nutzers.
      - Ein JWT.
    answer: 1
    explanation: >
      Das Klartext-Token siehst du nur einmal direkt nach `createToken()` als `plainTextToken`. Gespeichert wird
      nur der Hash – ein Datenbankleck verrät keine nutzbaren Tokens.
  - type: match
    question: Ordne jedem Aufruf seine Wirkung zu.
    pairs:
      - { left: "$user->createToken('cli', ['notizen:lesen'])", right: "Token mit einer Fähigkeit ausstellen" }
      - { left: "$user->tokenCan('notizen:lesen')", right: "Fähigkeit des aktuellen Tokens prüfen" }
      - { left: "$request->user()->currentAccessToken()->delete()", right: "Genau das benutzte Token widerrufen" }
      - { left: "$user->tokens()->delete()", right: "Alle Tokens des Nutzers widerrufen" }
    explanation: Fähigkeiten (abilities) sind Sanctums Gegenstück zu OAuth-Scopes.
  - type: multiple
    question: Welche Aussagen über Sanctum-API-Tokens stimmen?
    options:
      - Sie laufen standardmäßig nie ab, außer du setzt `expiration` oder ein Ablaufdatum.
      - Der Client schickt sie als `Authorization: Bearer …`.
      - Die eigene SPA sollte besser API-Tokens als Session-Cookies nutzen.
      - Ohne gültiges Token antwortet `auth:sanctum` bei JSON-Anfragen mit 401.
    answers: [0, 1, 3]
    explanation: >
      Für die eigene SPA empfiehlt die Laravel-Doku ausdrücklich die Cookie-Anmeldung, nicht API-Tokens.
      Tokens sind für mobile Apps, CLIs und Integrationen.
  - type: cloze
    text: "Sanctum installierst du mit `php artisan ___`. Der Trait, der `createToken()` ins User-Model bringt, heißt ___."
    blanks:
      - ["install:api"]
      - [HasApiTokens]
    explanation: "`install:api` legt `routes/api.php` an, installiert Sanctum und erstellt die Migration für die Token-Tabelle."
tasks:
  - id: token-ausgeben
    type: terminal
    title: Ein Token-Endpunkt für die Kommandozeile
    description: |
      In `token-app` liegt eine Laravel-Anwendung, in der `php artisan install:api` schon gelaufen ist, und ein
      Test `tests/Feature/TokenTest.php`. Klicke zuerst auf **Aufgabe vorbereiten** (beim ersten Mal kann das
      etwas dauern) und wechsle mit `cd token-app` hinein.

      1. Ergänze im Model `app/Models/User.php` den Trait `Laravel\Sanctum\HasApiTokens`.
      2. Lege in `routes/api.php` die Route `POST /tokens` an (sie ist dann unter `/api/tokens` erreichbar):
         - Validiere `email`, `password` und `device_name` (alle Pflicht).
         - Suche den Nutzer per E-Mail und prüfe das Passwort mit `Hash::check()`.
         - Passt etwas nicht: wirf `ValidationException::withMessages(['email' => 'Diese Zugangsdaten sind ungültig.'])`.
         - Sonst gib `['token' => $user->createToken($request->device_name)->plainTextToken]` zurück.
      3. Die vorhandene Route `GET /user` mit `auth:sanctum` lässt du stehen.
      4. Prüfe mit `./vendor/bin/pest tests/Feature/TokenTest.php`.
    workdir: token-app
    setup: |
      # Laravel-13-Basis mit Sanctum (install:api) einmal bauen und zwischenspeichern, dann hierher kopieren
      B="$HOME/.cache/stacklab/laravel13"
      A="$HOME/.cache/stacklab/laravel13-sanctum"
      if [ ! -f "$A/.fertig" ]; then
        if [ ! -f "$B/.fertig" ]; then
          T="$B.bau.$$"; rm -rf "$T"; mkdir -p "$(dirname "$B")"
          timeout 170 composer create-project laravel/laravel "$T" "^13.0" -n -q --prefer-dist </dev/null
          (cd "$T" && timeout 170 composer require pestphp/pest pestphp/pest-plugin-laravel --dev -W -n -q </dev/null)
          printf '%s\n' '<?php' '' "pest()->extend(Tests\\TestCase::class)->in('Feature');" > "$T/tests/Pest.php"
          touch "$T/.fertig"; rm -rf "$B"; mv "$T" "$B"
        fi
        T="$A.bau.$$"; rm -rf "$T"; cp -a "$B" "$T"
        (cd "$T" && timeout 120 php artisan install:api --without-migration-prompt -n -q </dev/null && php artisan migrate --force -q)
        rm -rf "$A"; mv "$T" "$A"
      fi
      cp -a "$A/." . && rm -f .fertig
      mkdir -p "$(dirname 'tests/Feature/TokenTest.php')"
      cat > 'tests/Feature/TokenTest.php' <<'STACKLAB_EOF'
      <?php

      use App\Models\User;
      use Illuminate\Foundation\Testing\RefreshDatabase;

      uses(RefreshDatabase::class);

      test('POST /api/tokens gibt für richtige Zugangsdaten ein Token zurück', function () {
          User::factory()->create(['email' => 'ada@example.com', 'password' => 'ein-langes-passwort']);

          $token = $this->postJson('/api/tokens', [
              'email' => 'ada@example.com',
              'password' => 'ein-langes-passwort',
              'device_name' => 'cli',
          ])->assertOk()->json('token');

          expect($token)->toBeString()->toContain('|');
          $this->assertDatabaseCount('personal_access_tokens', 1);
      });

      test('mit dem Token liefert GET /api/user den eigenen Datensatz', function () {
          User::factory()->create(['email' => 'ada@example.com', 'password' => 'ein-langes-passwort']);
          $token = $this->postJson('/api/tokens', [
              'email' => 'ada@example.com',
              'password' => 'ein-langes-passwort',
              'device_name' => 'cli',
          ])->json('token');

          $this->withToken((string) $token)->getJson('/api/user')
              ->assertOk()
              ->assertJsonPath('email', 'ada@example.com')
              ->assertJsonMissingPath('password');
      });

      test('ohne Token antwortet GET /api/user mit 401', function () {
          $this->getJson('/api/user')->assertStatus(401);
      });

      test('falsche Zugangsdaten liefern 422 und kein Token', function () {
          User::factory()->create(['email' => 'ada@example.com', 'password' => 'ein-langes-passwort']);

          $this->postJson('/api/tokens', [
              'email' => 'ada@example.com',
              'password' => 'falsch',
              'device_name' => 'cli',
          ])->assertStatus(422)->assertJsonMissingPath('token');

          $this->assertDatabaseCount('personal_access_tokens', 0);
      });

      test('der Name des Geräts ist Pflicht', function () {
          User::factory()->create(['email' => 'ada@example.com', 'password' => 'ein-langes-passwort']);

          $this->postJson('/api/tokens', ['email' => 'ada@example.com', 'password' => 'ein-langes-passwort'])
              ->assertStatus(422)->assertJsonValidationErrors('device_name');
      });
      STACKLAB_EOF
    checks:
      - type: file_contains
        path: app/Models/User.php
        pattern: "use\\s+[^;]*HasApiTokens"
        message: Das User-Model nutzt den Trait HasApiTokens noch nicht. Ergänze den Import und use HasApiTokens in der Klasse.
      - type: file_contains
        path: routes/api.php
        pattern: "createToken\\("
        message: In routes/api.php wird noch kein Token mit createToken() ausgestellt.
      - type: command
        run: ./vendor/bin/pest tests/Feature/TokenTest.php --colors=never
        message: Noch nicht alle Tests in tests/Feature/TokenTest.php sind grün. Führe sie aus und lies die erste Fehlermeldung.
    hints:
      - "Im Model: oben `use Laravel\\Sanctum\\HasApiTokens;` und in der Klasse `use HasApiTokens, HasFactory, Notifiable;`."
      - "In `routes/api.php` brauchst du `use App\\Models\\User;`, `use Illuminate\\Support\\Facades\\Hash;` und `use Illuminate\\Validation\\ValidationException;`."
      - "Prüfe den Endpunkt im Terminal mit Tinker: `php artisan tinker --execute=\"echo App\\Models\\User::factory()->create()->createToken('test')->plainTextToken;\"`"
    solution: |
      ```php title="app/Models/User.php (Ausschnitt)"
      use Laravel\Sanctum\HasApiTokens;

      class User extends Authenticatable
      {
          use HasApiTokens, HasFactory, Notifiable;
          // …
      }
      ```

      ```php title="routes/api.php"
      <?php

      use App\Models\User;
      use Illuminate\Http\Request;
      use Illuminate\Support\Facades\Hash;
      use Illuminate\Support\Facades\Route;
      use Illuminate\Validation\ValidationException;

      Route::get('/user', function (Request $request) {
          return $request->user();
      })->middleware('auth:sanctum');

      Route::post('/tokens', function (Request $request) {
          $request->validate([
              'email' => ['required', 'email'],
              'password' => ['required', 'string'],
              'device_name' => ['required', 'string', 'max:100'],
          ]);

          $user = User::where('email', $request->email)->first();

          if (! $user || ! Hash::check($request->password, $user->password)) {
              throw ValidationException::withMessages([
                  'email' => 'Diese Zugangsdaten sind ungültig.',
              ]);
          }

          return ['token' => $user->createToken($request->device_name)->plainTextToken];
      });
      ```
  - id: welcher-weg
    type: dragdrop
    title: Session-Cookie, Sanctum-Token oder OAuth?
    description: Welche Anmeldung passt zu welchem Client? Ordne zu.
    targets:
      - { id: cookie, label: Sanctum SPA (Session-Cookie) }
      - { id: token, label: Sanctum API-Token }
      - { id: oauth, label: OAuth 2.0 (z. B. Passport) }
    items:
      - { label: "Eigenes React-Frontend auf app.example.com, API auf api.example.com", target: cookie }
      - { label: Klassische Blade-Seiten derselben Laravel-App, target: cookie }
      - { label: Eigene Smartphone-App, target: token }
      - { label: "Ein Skript, mit dem Nutzer ihre Notizen exportieren", target: token }
      - { label: "Fremde Firmen bauen Apps, die im Namen deiner Nutzer zugreifen", target: oauth }
---
Deine Notiz-App bekommt eine Smartphone-App und ein Kommandozeilen-Werkzeug. Beide haben keinen Browser,
der Session-Cookies verwaltet. Sie brauchen Tokens – aber gleich einen kompletten OAuth-Server aufsetzen?
Für eigene Apps ist das zu viel. Genau dafür gibt es **Laravel Sanctum**.

## Was Sanctum ist

[[sanctum|Laravel Sanctum]] ist ein leichtgewichtiges Paket für zwei Aufgaben:

![Die zwei Wege von Laravel Sanctum](/assets/authentifizierung/sanctum-zwei-wege.svg)

| Aufgabe | Wie | Für wen |
|---|---|---|
| API-Tokens | [[opakes-token|opake Tokens]] im `Authorization`-Header | mobile Apps, CLIs, Integrationen |
| SPA-Anmeldung | normale Session-Cookies plus CSRF-Schutz | deine eigene Single-Page-App |

Die Middleware `auth:sanctum` erledigt beides: Sie schaut zuerst nach einem Session-Cookie von einer
vertrauenswürdigen Domain und danach nach einem Bearer-Token. Diese Lektion behandelt die Tokens, die
nächste die SPA.

## Installation

```bash title="Terminal"
php artisan install:api
php artisan migrate
```

`install:api` installiert Sanctum per Composer, legt `routes/api.php` (Präfix `/api`) und
`config/sanctum.php` an und erstellt die Migration für `personal_access_tokens`. Danach braucht das
User-Model den Trait `HasApiTokens`:

```php title="app/Models/User.php"
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;
}
```

## Tokens ausstellen

Eine typische Token-Route nimmt Zugangsdaten entgegen und gibt ein Token zurück:

```php title="routes/api.php"
Route::post('/tokens', function (Request $request) {
    $request->validate([
        'email' => ['required', 'email'],
        'password' => ['required', 'string'],
        'device_name' => ['required', 'string', 'max:100'],
    ]);

    $user = User::where('email', $request->email)->first();

    if (! $user || ! Hash::check($request->password, $user->password)) {
        throw ValidationException::withMessages(['email' => 'Diese Zugangsdaten sind ungültig.']);
    }

    return ['token' => $user->createToken($request->device_name)->plainTextToken];
});
```

`plainTextToken` hat die Form `7|kq3VbZ…` (Datensatz-ID, senkrechter Strich, Zufallsteil). Du siehst es
**nur jetzt** – in der Datenbank landet ein SHA-256-[[hash|Hash]]. Der `device_name` erscheint später in
einer Liste, in der Nutzer ihre Tokens wiedererkennen und widerrufen.

> [!FEHLER]
> Das Token in der Antwort einer GET-Anfrage, in einer URL (`?token=…`) oder in Log-Dateien. URLs landen
> in Browser-Verläufen und Server-Logs. Tokens gehören nur in den Header `Authorization: Bearer …`.

## Ein Token benutzen

Die App speichert das Token sicher – auf dem Smartphone im Schlüsselbund des Betriebssystems, auf dem
Rechner z. B. in einer Konfigurationsdatei nur für den eigenen Benutzer. Bei jeder Anfrage schickt sie es
im Header mit:

```bash title="Terminal"
curl https://api.example.com/api/user \
  -H "Accept: application/json" \
  -H "Authorization: Bearer 7|kq3VbZ9xYtR2mN8pL0wQ4sE6uH1jC5aD"
```

Sanctum zerlegt das Token am senkrechten Strich, sucht den Datensatz mit der ID 7, hasht den Zufallsteil
und vergleicht. Passt alles, ist `$request->user()` der Besitzer des Tokens, und Sanctum vermerkt
nebenbei den Zeitpunkt in `last_used_at`. So sehen Nutzer in ihrer Token-Liste, welche Geräte noch aktiv
sind.

Der Header `Accept: application/json` ist wichtig: Ohne ihn behandelt Laravel Fehler wie bei einer
Browser-Anfrage und leitet zum Login um, statt sauber mit 401 zu antworten.

## Fähigkeiten und geschützte Routen

Ein Token kann [[token-faehigkeit|Fähigkeiten]] (abilities) bekommen – Sanctums Gegenstück zu
OAuth-Scopes. So erhält ein Export-Skript nur Leserechte:

```php title="Fähigkeiten vergeben und prüfen"
$token = $user->createToken('export-skript', ['notizen:lesen'])->plainTextToken;

if ($request->user()->tokenCan('notizen:lesen')) {
    // …
}
```

Routen schützt du mit der Middleware `auth:sanctum`. Für Fähigkeiten gibt es die Middleware
`abilities` (alle genannten nötig) und `ability` (eine reicht); ihre Aliase registrierst du in
`bootstrap/app.php`:

```php title="bootstrap/app.php"
->withMiddleware(function (Middleware $middleware): void {
    $middleware->alias([
        'abilities' => \Laravel\Sanctum\Http\Middleware\CheckAbilities::class,
        'ability' => \Laravel\Sanctum\Http\Middleware\CheckForAnyAbility::class,
    ]);
})
```

```php title="routes/api.php"
Route::get('/notizen', fn () => ['notizen' => []])
    ->middleware(['auth:sanctum', 'abilities:notizen:lesen']);
```

Fehlt das Token, gibt es 401, fehlt die Fähigkeit, 403.

> [!MERKSATZ]
> Fähigkeiten begrenzen, was ein **Token** darf. Ob der **Nutzer** etwas darf (z. B. nur eigene
> Notizen), prüfst du zusätzlich mit Policies.

## Widerrufen und ablaufen lassen

```php title="Tokens widerrufen"
$request->user()->currentAccessToken()->delete(); // Logout: nur dieses Token
$user->tokens()->delete();                         // alle Geräte abmelden
$user->tokens()->where('id', $tokenId)->delete();  // ein bestimmtes Token
```

Standardmäßig laufen Sanctum-Tokens **nie** ab. Setze in `config/sanctum.php` den Wert `expiration`
(in Minuten) oder gib `createToken()` ein Ablaufdatum als drittes Argument mit. Abgelaufene Datensätze
räumt `php artisan sanctum:prune-expired` auf.

> [!PRAXIS]
> In Tests musst du keine echten Tokens erzeugen: `Sanctum::actingAs($user, ['notizen:lesen'])` meldet
> einen Nutzer mit genau diesen Fähigkeiten an.

## Zusammenfassung

- Sanctum bietet opake API-Tokens für Apps ohne Browser und Cookie-Anmeldung für die eigene SPA.
- `php artisan install:api` installiert alles, das User-Model braucht `HasApiTokens`.
- `createToken($name, $faehigkeiten)->plainTextToken` gibt das Token einmalig im Klartext aus, gespeichert wird ein Hash.
- `auth:sanctum` schützt Routen, `abilities:`/`ability:` prüfen Fähigkeiten (401 vs. 403).
- Widerruf per `currentAccessToken()->delete()`, Ablauf über `expiration` oder ein Ablaufdatum.
