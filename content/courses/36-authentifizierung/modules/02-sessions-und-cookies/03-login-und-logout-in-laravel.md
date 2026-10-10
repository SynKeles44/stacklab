---
title: Login und Logout in Laravel
summary: Du baust einen Session-Login von Hand – mit Auth::attempt, Session-Erneuerung, der auth-Middleware und einem sauberen Logout – und prüfst ihn mit Pest.
duration: 25
sources:
  - title: Laravel 13 – Authentication (Manually Authenticating Users)
    url: https://laravel.com/docs/13.x/authentication#authenticating-users
  - title: Laravel 13 – Starter Kits
    url: https://laravel.com/docs/13.x/starter-kits
  - title: OWASP Authentication Cheat Sheet
    url: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
quiz:
  - type: single
    question: Was macht `Auth::attempt($credentials)`?
    options:
      - Es legt einen neuen Nutzer an.
      - Es sucht den Nutzer anhand der E-Mail, prüft das Passwort gegen den Hash und meldet ihn bei Erfolg in der Session an.
      - Es verschickt eine Login-Mail.
      - Es prüft nur, ob die E-Mail existiert.
    answer: 1
    explanation: >
      `attempt()` sucht per E-Mail (alle Felder außer `password`), vergleicht das Passwort mit `Hash::check()`
      und speichert bei Erfolg die Nutzer-ID in der Session. Rückgabe: `true` oder `false`.
  - type: match
    question: Welche Methode gehört zu welchem Zweck?
    pairs:
      - { left: "Auth::attempt()", right: "Zugangsdaten prüfen und anmelden" }
      - { left: "$request->session()->regenerate()", right: "Neue Session-ID nach dem Login" }
      - { left: "Auth::logout()", right: "Nutzer aus dem Guard entfernen" }
      - { left: "$request->session()->invalidate()", right: "Session-Daten auf dem Server löschen" }
      - { left: "redirect()->intended()", right: "Zur ursprünglich gewünschten Seite weiterleiten" }
    explanation: Zusammen ergeben sie einen sicheren Login- und Logout-Ablauf.
  - type: find-bug
    question: Welche Zeile verrät Angreifern zu viel?
    language: php
    code: |
      $user = User::where('email', $request->email)->first();
      if (! $user) {
          return back()->withErrors(['email' => 'Diese E-Mail ist nicht registriert.']);
      }
      if (! Hash::check($request->password, $user->password)) {
          return back()->withErrors(['email' => 'Diese Zugangsdaten sind ungültig.']);
      }
    bug_line: 3
    explanation: >
      Unterschiedliche Meldungen verraten, welche E-Mail-Adressen ein Konto haben (User Enumeration). Beide
      Fälle brauchen dieselbe neutrale Meldung.
  - type: cloze
    text: "Die Middleware ___ leitet Gäste zur Route mit dem Namen ___ weiter."
    blanks:
      - [auth]
      - [login]
    explanation: Ohne eine Route mit `->name('login')` kann Laravel Gäste nicht umleiten und wirft eine Ausnahme.
tasks:
  - id: login-routen
    type: terminal
    title: Login, Dashboard und Logout bauen
    description: |
      In `login-app` liegt eine frische Laravel-Anwendung und ein vorbereiteter Test
      `tests/Feature/LoginTest.php`, der beschreibt, was fertig sein soll. Klicke zuerst auf
      **Aufgabe vorbereiten**, wechsle mit `cd login-app` hinein und ergänze `routes/web.php`:

      1. `GET /login` mit dem Namen `login` – gib einfach einen Text wie „Bitte melde dich an.“ zurück.
      2. `POST /login` validiert `email` und `password`, meldet mit `Auth::attempt()` an, erneuert die
         Session mit `$request->session()->regenerate()` und leitet mit `redirect()->intended('/dashboard')`
         weiter. Bei falschen Daten: zurück mit einem Fehler am Feld `email`.
      3. `GET /dashboard` ist nur mit der Middleware `auth` erreichbar und begrüßt mit
         `Hallo, <Name>!` (Namen mit `e()` ausgeben).
      4. `POST /logout` meldet ab, löscht die Session, erneuert das CSRF-Token und leitet zu `/` weiter.
      5. Prüfe mit `./vendor/bin/pest tests/Feature/LoginTest.php`, bis alles grün ist.
    workdir: login-app
    setup: |
      # Laravel-13-Basis einmal bauen und zwischenspeichern, dann hierher kopieren
      B="$HOME/.cache/stacklab/laravel13"
      if [ ! -f "$B/.fertig" ]; then
        T="$B.bau.$$"; rm -rf "$T"; mkdir -p "$(dirname "$B")"
        timeout 170 composer create-project laravel/laravel "$T" "^13.0" -n -q --prefer-dist </dev/null
        (cd "$T" && timeout 170 composer require pestphp/pest pestphp/pest-plugin-laravel --dev -W -n -q </dev/null)
        printf '%s\n' '<?php' '' "pest()->extend(Tests\\TestCase::class)->in('Feature');" > "$T/tests/Pest.php"
        touch "$T/.fertig"; rm -rf "$B"; mv "$T" "$B"
      fi
      cp -a "$B/." . && rm -f .fertig
      mkdir -p "$(dirname 'tests/Feature/LoginTest.php')"
      cat > 'tests/Feature/LoginTest.php' <<'STACKLAB_EOF'
      <?php

      use App\Models\User;
      use Illuminate\Foundation\Testing\RefreshDatabase;

      uses(RefreshDatabase::class);

      test('Gäste werden von /dashboard zu /login umgeleitet', function () {
          $this->get('/dashboard')->assertRedirect('/login');
      });

      test('GET /login zeigt eine Seite', function () {
          $this->get('/login')->assertOk();
      });

      test('richtige Zugangsdaten melden an und leiten zu /dashboard', function () {
          $user = User::factory()->create(['email' => 'ada@example.com', 'password' => 'ein-langes-passwort']);

          $this->post('/login', ['email' => 'ada@example.com', 'password' => 'ein-langes-passwort'])
              ->assertRedirect('/dashboard');

          $this->assertAuthenticatedAs($user);
      });

      test('ein falsches Passwort meldet nicht an', function () {
          User::factory()->create(['email' => 'ada@example.com', 'password' => 'ein-langes-passwort']);

          $this->post('/login', ['email' => 'ada@example.com', 'password' => 'falsch'])
              ->assertSessionHasErrors('email');

          $this->assertGuest();
      });

      test('das Dashboard begrüßt angemeldete Nutzer mit Namen', function () {
          $user = User::factory()->create(['name' => 'Ada Lovelace']);

          $this->actingAs($user)->get('/dashboard')->assertOk()->assertSee('Ada Lovelace');
      });

      test('POST /logout meldet ab und leitet zur Startseite', function () {
          $user = User::factory()->create();

          $this->actingAs($user)->post('/logout')->assertRedirect('/');

          $this->assertGuest();
      });
      STACKLAB_EOF
    checks:
      - type: file_contains
        path: routes/web.php
        pattern: "Auth::attempt\\("
        message: Nutze Auth::attempt() in der POST-Route /login, um die Zugangsdaten zu prüfen.
      - type: file_contains
        path: routes/web.php
        pattern: "session\\(\\)->regenerate\\(\\)"
        message: Erneuere nach dem erfolgreichen Login die Session mit $request->session()->regenerate().
      - type: file_contains
        path: routes/web.php
        pattern: "session\\(\\)->invalidate\\(\\)"
        message: Beim Logout soll die Session mit $request->session()->invalidate() gelöscht werden.
      - type: command
        run: ./vendor/bin/pest tests/Feature/LoginTest.php --colors=never
        message: Noch nicht alle Tests in tests/Feature/LoginTest.php sind grün. Führe sie aus und lies, welcher fehlschlägt.
    hints:
      - "Oben in `routes/web.php` brauchst du `use Illuminate\\Http\\Request;` und `use Illuminate\\Support\\Facades\\Auth;`."
      - "Die Gast-Weiterleitung funktioniert nur, wenn eine Route `->name('login')` heißt."
      - "Für den Fehler: `return back()->withErrors(['email' => 'Diese Zugangsdaten sind ungültig.'])->onlyInput('email');`"
    solution: |
      ```php title="routes/web.php"
      <?php

      use Illuminate\Http\Request;
      use Illuminate\Support\Facades\Auth;
      use Illuminate\Support\Facades\Route;

      Route::get('/', function () {
          return view('welcome');
      });

      Route::get('/login', function () {
          return 'Bitte melde dich an.';
      })->name('login');

      Route::post('/login', function (Request $request) {
          $credentials = $request->validate([
              'email' => ['required', 'email'],
              'password' => ['required', 'string'],
          ]);

          if (! Auth::attempt($credentials)) {
              return back()->withErrors(['email' => 'Diese Zugangsdaten sind ungültig.'])->onlyInput('email');
          }

          $request->session()->regenerate();

          return redirect()->intended('/dashboard');
      });

      Route::get('/dashboard', function (Request $request) {
          return 'Hallo, '.e($request->user()->name).'!';
      })->middleware('auth');

      Route::post('/logout', function (Request $request) {
          Auth::logout();
          $request->session()->invalidate();
          $request->session()->regenerateToken();

          return redirect('/');
      });
      ```

      ```bash
      ./vendor/bin/pest tests/Feature/LoginTest.php
      ```
  - id: logout-reihenfolge
    type: order
    title: Ein vollständiger Logout
    description: Bring die Schritte eines sicheren Logouts in Laravel in die richtige Reihenfolge.
    items:
      - Der Browser schickt POST /logout mit gültigem CSRF-Token.
      - Auth::logout() entfernt den Nutzer aus dem Guard.
      - $request->session()->invalidate() löscht die Session-Daten und vergibt eine neue ID.
      - $request->session()->regenerateToken() erzeugt ein neues CSRF-Token.
      - Die Antwort leitet zur Startseite weiter.
---
Du kennst jetzt Passwort-Hashes, Sessions und CSRF. Höchste Zeit, alles zusammenzusetzen: ein Login,
der die Session sauber erneuert, eine geschützte Seite und ein Logout, der wirklich abmeldet. Laravel
nimmt dir die Kleinarbeit ab – aber du musst die richtigen Bausteine in der richtigen Reihenfolge
nutzen.

## Guards und Provider

Laravel trennt zwei Fragen:

| Baustein | Frage | Standard |
|---|---|---|
| [[auth-guard|Guard]] | **Wie** wird eine Anfrage authentifiziert? | `web` – über die Session |
| Provider | **Woher** kommen die Nutzer? | `users` – Eloquent-Model `App\Models\User` |

Beides steht in `config/auth.php`. Für Session-Logins nutzt du den Guard `web`; Laravel Sanctum bringt
später den Guard `sanctum` für Tokens mit. Über die Fassade `Auth` sprichst du immer mit dem
Standard-Guard.

> [!TIPP]
> Für echte Projekte gibt es fertige [Starter Kits](https://laravel.com/docs/13.x/starter-kits) mit
> Registrierung, Passwort-Reset und 2FA. Hier baust du den Kern von Hand, damit du verstehst, was darin
> passiert.

## Der Login

```php title="routes/web.php"
Route::post('/login', function (Request $request) {
    $credentials = $request->validate([
        'email' => ['required', 'email'],
        'password' => ['required', 'string'],
    ]);

    if (! Auth::attempt($credentials)) {
        return back()
            ->withErrors(['email' => 'Diese Zugangsdaten sind ungültig.'])
            ->onlyInput('email');
    }

    $request->session()->regenerate();

    return redirect()->intended('/dashboard');
});
```

`Auth::attempt()` sucht den Nutzer per E-Mail, prüft das Passwort mit `Hash::check()` und speichert bei
Erfolg seine ID in der Session. Danach erneuerst du die Session gegen [[session-fixation|Session Fixation]].
Laravels Guard macht das intern zwar auch schon, die Dokumentation empfiehlt den Aufruf trotzdem – er
macht die Absicht im Code sichtbar.

`redirect()->intended()` schickt zur Seite, die der Nutzer ursprünglich aufrufen wollte, sonst zum
angegebenen Ziel. `onlyInput('email')` füllt das E-Mail-Feld wieder aus – das Passwort aber nicht.

Für eine Checkbox „Angemeldet bleiben“ übergibst du als zweites Argument einen Boolean:
`Auth::attempt($credentials, $request->boolean('remember'))`. Laravel setzt dann zusätzlich ein
langlebiges Remember-Cookie und speichert dessen Gegenstück in der Spalte `remember_token`. Bequem – aber
auch ein weiterer wertvoller Nachweis, der beim Logout und beim Passwortwechsel ungültig werden muss.

> [!FEHLER]
> Unterschiedliche Fehlermeldungen wie „E-Mail nicht registriert“ und „Passwort falsch“. Damit kann
> jeder testen, welche Adressen ein Konto haben ([[user-enumeration|User Enumeration]]). Eine Meldung
> für beide Fälle!

## Geschützte Routen

Die Middleware `auth` lässt nur angemeldete Nutzer durch. Gäste leitet sie zur Route mit dem Namen
`login` weiter, bei JSON-Anfragen antwortet sie mit 401.

```php title="routes/web.php"
Route::get('/login', fn () => 'Bitte melde dich an.')->name('login');

Route::get('/dashboard', function (Request $request) {
    return 'Hallo, '.e($request->user()->name).'!';
})->middleware('auth');
```

Den angemeldeten Nutzer bekommst du über `$request->user()` oder `Auth::user()`, nur die ID über
`Auth::id()`. Mit `Auth::check()` fragst du, ob überhaupt jemand angemeldet ist.

## Der Logout

```php title="routes/web.php"
Route::post('/logout', function (Request $request) {
    Auth::logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return redirect('/');
});
```

Drei Schritte, drei Gründe: Der Guard vergisst den Nutzer, die Session-Daten auf dem Server
verschwinden, und das alte CSRF-Token wird wertlos. Der Logout ist ein **POST** mit CSRF-Token – sonst
könnte jede fremde Seite dich per Bild-Link abmelden.

## Mit Pest prüfen

Tests machen dein Verständnis überprüfbar. Laravel bringt passende Helfer mit:

```php title="tests/Feature/LoginTest.php"
test('ein falsches Passwort meldet nicht an', function () {
    User::factory()->create(['email' => 'ada@example.com', 'password' => 'ein-langes-passwort']);

    $this->post('/login', ['email' => 'ada@example.com', 'password' => 'falsch'])
        ->assertSessionHasErrors('email');

    $this->assertGuest();
});
```

| Helfer | Prüft |
|---|---|
| `$this->actingAs($user)` | Anfrage als angemeldeter Nutzer schicken |
| `assertAuthenticatedAs($user)` | genau dieser Nutzer ist angemeldet |
| `assertGuest()` | niemand ist angemeldet |
| `assertSessionHasErrors('email')` | Validierungsfehler am Feld |

> [!PRAXIS]
> Login und Logout gehören zu den Funktionen, die in jedem Projekt Tests haben sollten. Ein kaputter
> Login fällt sofort auf – ein Login, der heimlich **zu viel** erlaubt, nur im Test.

## Zusammenfassung

- Guards legen fest, **wie** authentifiziert wird (`web` = Session), Provider, **woher** die Nutzer kommen.
- `Auth::attempt()` prüft Zugangsdaten und meldet an, danach `session()->regenerate()`.
- Eine einzige neutrale Fehlermeldung verhindert User Enumeration.
- Die Middleware `auth` schützt Routen und braucht eine Route namens `login`.
- Logout: `Auth::logout()`, `invalidate()`, `regenerateToken()` – immer als POST.
