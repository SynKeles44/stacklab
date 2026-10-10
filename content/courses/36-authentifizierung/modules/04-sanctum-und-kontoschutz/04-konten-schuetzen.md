---
title: Konten schützen – Rate Limiting, Sperren und Passwort-Reset
summary: Wie du Login-Versuche drosselst, warum harte Kontosperren gefährlich sind, wie ein sicherer Passwort-Reset funktioniert und was du protokollierst.
duration: 25
sources:
  - title: Laravel 13 – Rate Limiting
    url: https://laravel.com/docs/13.x/rate-limiting
  - title: Laravel 13 – Routing, Rate Limiting
    url: https://laravel.com/docs/13.x/routing#rate-limiting
  - title: Laravel 13 – Resetting Passwords
    url: https://laravel.com/docs/13.x/passwords
  - title: OWASP Forgot Password Cheat Sheet
    url: https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html
  - title: OWASP Authentication Cheat Sheet – Login Throttling
    url: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
quiz:
  - type: single
    question: Warum drosselt man Login-Versuche pro E-Mail **und** IP-Adresse statt nur pro IP?
    options:
      - Weil IP-Adressen geheim sind.
      - Weil viele Menschen sich eine IP teilen (Firma, Mobilfunk) und Angreifer mit vielen IPs sonst unbegrenzt ein Konto angreifen könnten.
      - Weil Laravel nur E-Mails speichern kann.
      - Weil es schneller ist.
    answer: 1
    explanation: >
      Nur pro IP sperrt ganze Büros aus und hält Botnetze nicht auf. Der Schlüssel aus E-Mail und IP begrenzt
      Versuche pro Konto und Quelle.
  - type: multiple
    question: Was gehört zu einem sicheren „Passwort vergessen“-Ablauf?
    options:
      - Immer dieselbe Antwort, egal ob die E-Mail existiert
      - Ein zufälliges, einmalig nutzbares Token mit kurzer Laufzeit
      - Das neue Passwort per E-Mail verschicken
      - Nach dem Reset alle bestehenden Sessions und Tokens ungültig machen
    answers: [0, 1, 3]
    explanation: >
      Passwörter per E-Mail zu verschicken ist tabu. Das Reset-Token gehört gehasht in die Datenbank und
      verfällt nach kurzer Zeit (in Laravel standardmäßig 60 Minuten).
  - type: match
    question: Welcher Statuscode passt?
    pairs:
      - { left: "Zu viele Versuche in kurzer Zeit", right: "429 Too Many Requests" }
      - { left: "Validierung fehlgeschlagen (falsche Zugangsdaten bei JSON)", right: "422 Unprocessable Content" }
      - { left: "Ungültiges CSRF-Token", right: "419 (Laravel)" }
      - { left: "Kein gültiger Login", right: "401 Unauthorized" }
    explanation: 429 kommt mit dem Header Retry-After, der sagt, wann es weitergeht.
  - type: cloze
    text: "Einen eigenen Limiter definierst du mit `RateLimiter::___('login', …)` und hängst ihn mit der Middleware `___:login` an eine Route."
    blanks:
      - [for]
      - [throttle]
    explanation: Die Definition steht in der Regel in `AppServiceProvider::boot()`.
tasks:
  - id: login-drosseln
    type: terminal
    title: Den Login gegen Rateversuche härten
    description: |
      In `drossel-app` liegt eine Laravel-Anwendung mit einem Login, der zwei Schwächen hat: Er verrät, ob
      eine E-Mail registriert ist, und er erlaubt unbegrenzt viele Versuche. Ein Test
      `tests/Feature/KontoschutzTest.php` beschreibt das Ziel. Klicke zuerst auf **Aufgabe vorbereiten** und
      wechsle mit `cd drossel-app` hinein.

      1. Sieh dir `POST /login` in `routes/web.php` an und vereinheitliche die Fehlermeldungen: Unbekannte
         E-Mail und falsches Passwort liefern beide `Diese Zugangsdaten sind ungültig.`
      2. Definiere in `app/Providers/AppServiceProvider.php` in `boot()` einen Limiter `login`:
         höchstens **5 Versuche pro Minute**, Schlüssel aus kleingeschriebener E-Mail und IP-Adresse.
      3. Hänge die Middleware `throttle:login` an die Route `POST /login`.
      4. Prüfe mit `./vendor/bin/pest tests/Feature/KontoschutzTest.php`.
    workdir: drossel-app
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
      mkdir -p "$(dirname 'routes/web.php')"
      cat > 'routes/web.php' <<'STACKLAB_EOF'
      <?php

      use App\Models\User;
      use Illuminate\Http\Request;
      use Illuminate\Support\Facades\Auth;
      use Illuminate\Support\Facades\Hash;
      use Illuminate\Support\Facades\Route;
      use Illuminate\Validation\ValidationException;

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

          $user = User::where('email', $credentials['email'])->first();

          if (! $user) {
              throw ValidationException::withMessages(['email' => 'Zu dieser E-Mail-Adresse gibt es kein Konto.']);
          }

          if (! Hash::check($credentials['password'], $user->password)) {
              throw ValidationException::withMessages(['email' => 'Das Passwort ist falsch.']);
          }

          Auth::login($user);
          $request->session()->regenerate();

          return redirect()->intended('/dashboard');
      });

      Route::get('/dashboard', function (Request $request) {
          return 'Hallo, '.e($request->user()->name).'!';
      })->middleware('auth');
      STACKLAB_EOF
      mkdir -p "$(dirname 'tests/Feature/KontoschutzTest.php')"
      cat > 'tests/Feature/KontoschutzTest.php' <<'STACKLAB_EOF'
      <?php

      use App\Models\User;
      use Illuminate\Foundation\Testing\RefreshDatabase;

      uses(RefreshDatabase::class);

      test('unbekannte E-Mail und falsches Passwort liefern dieselbe Meldung', function () {
          User::factory()->create(['email' => 'ada@example.com', 'password' => 'ein-langes-passwort']);

          $unbekannt = $this->postJson('/login', ['email' => 'niemand@example.com', 'password' => 'egal-egal-egal'])
              ->assertStatus(422)->json('errors.email.0');
          $falsch = $this->postJson('/login', ['email' => 'ada@example.com', 'password' => 'egal-egal-egal'])
              ->assertStatus(422)->json('errors.email.0');

          expect($unbekannt)->toBe($falsch);
      });

      test('nach 5 Fehlversuchen pro Minute antwortet /login mit 429', function () {
          User::factory()->create(['email' => 'ada@example.com', 'password' => 'ein-langes-passwort']);

          for ($i = 1; $i <= 5; $i++) {
              $this->postJson('/login', ['email' => 'ada@example.com', 'password' => 'falsch-'.$i])->assertStatus(422);
          }

          $this->postJson('/login', ['email' => 'ada@example.com', 'password' => 'falsch-6'])->assertStatus(429);
      });

      test('die Sperre gilt pro E-Mail-Adresse und nicht für alle Konten', function () {
          for ($i = 1; $i <= 6; $i++) {
              $this->postJson('/login', ['email' => 'ada@example.com', 'password' => 'falsch-'.$i]);
          }

          $this->postJson('/login', ['email' => 'grace@example.com', 'password' => 'falsch'])->assertStatus(422);
      });

      test('ein richtiger Login funktioniert weiterhin', function () {
          User::factory()->create(['email' => 'ada@example.com', 'password' => 'ein-langes-passwort']);

          $this->post('/login', ['email' => 'ada@example.com', 'password' => 'ein-langes-passwort'])
              ->assertRedirect('/dashboard');
          $this->assertAuthenticated();
      });
      STACKLAB_EOF
    checks:
      - type: file_contains
        path: app/Providers/AppServiceProvider.php
        pattern: "RateLimiter::for\\(\\s*['\"]login['\"]"
        message: In AppServiceProvider fehlt noch RateLimiter::for('login', …).
      - type: file_contains
        path: routes/web.php
        pattern: "throttle:login"
        message: Die Route POST /login nutzt die Middleware throttle:login noch nicht.
      - type: command
        run: grep -c "kein Konto\|Passwort ist falsch" routes/web.php
        expect_exit: 1
        message: routes/web.php enthält noch die verräterischen Meldungen. Nutze für beide Fälle „Diese Zugangsdaten sind ungültig.“
      - type: command
        run: ./vendor/bin/pest tests/Feature/KontoschutzTest.php --colors=never
        message: Noch nicht alle Tests in tests/Feature/KontoschutzTest.php sind grün. Führe sie aus und lies die erste Fehlermeldung.
    hints:
      - "Im Provider brauchst du `use Illuminate\\Cache\\RateLimiting\\Limit;`, `use Illuminate\\Http\\Request;`, `use Illuminate\\Support\\Facades\\RateLimiter;` und `use Illuminate\\Support\\Str;`."
      - "`return Limit::perMinute(5)->by(Str::lower((string) $request->input('email')).'|'.$request->ip());`"
      - "Die Middleware hängst du hinter die schließende Klammer der Route: `})->middleware('throttle:login');`"
    solution: |
      ```php title="app/Providers/AppServiceProvider.php (boot)"
      use Illuminate\Cache\RateLimiting\Limit;
      use Illuminate\Http\Request;
      use Illuminate\Support\Facades\RateLimiter;
      use Illuminate\Support\Str;

      public function boot(): void
      {
          RateLimiter::for('login', function (Request $request) {
              return Limit::perMinute(5)->by(Str::lower((string) $request->input('email')).'|'.$request->ip());
          });
      }
      ```

      ```php title="routes/web.php (Ausschnitt)"
      if (! $user) {
          throw ValidationException::withMessages(['email' => 'Diese Zugangsdaten sind ungültig.']);
      }

      if (! Hash::check($credentials['password'], $user->password)) {
          throw ValidationException::withMessages(['email' => 'Diese Zugangsdaten sind ungültig.']);
      }
      // …
      })->middleware('throttle:login');
      ```
  - id: reset-ablauf
    type: steps
    title: Ein Passwort-Reset unter der Lupe
    description: Entscheide in jeder Situation, wie sich ein sicherer „Passwort vergessen“-Ablauf verhält.
    steps:
      - situation: Jemand gibt im Formular „Passwort vergessen“ die Adresse `niemand@example.com` ein, zu der es kein Konto gibt.
        question: Was zeigt die Seite an?
        options:
          - „Zu dieser Adresse gibt es kein Konto.“
          - „Falls ein Konto existiert, haben wir dir eine E-Mail geschickt.“
        answer: 1
        explanation: Dieselbe Antwort für alle Adressen verhindert User Enumeration – auch die Antwortzeit sollte sich nicht verraten.
      - situation: Ada bekommt die Mail mit einem Link `https://notizen.example.com/reset/<token>?email=…`. Sie klickt erst am nächsten Tag darauf.
        question: Was sollte passieren?
        options:
          - Der Link funktioniert noch, Reset-Links gelten unbegrenzt.
          - Der Link ist abgelaufen, Ada fordert einen neuen an.
        answer: 1
        explanation: Reset-Tokens gelten nur kurz – in Laravel standardmäßig 60 Minuten (`expire` in config/auth.php).
      - situation: Ada setzt über einen gültigen Link ein neues Passwort. Auf einem alten Laptop ist sie noch angemeldet, und ein Skript nutzt ein API-Token.
        question: Was ist die sichere Folge?
        options:
          - Alles bleibt angemeldet, das ist bequemer.
          - Das Reset-Token wird gelöscht, alte Sessions und Tokens werden ungültig, Ada bekommt eine Bestätigungsmail.
        answer: 1
        explanation: >
          Vielleicht hat genau ein Angreifer die alten Sessions. Nach einem Reset gilt: Token verbrauchen,
          andere Sitzungen beenden, Nutzer benachrichtigen.
---
Ein Login-Formular steht im Internet und ist für jeden erreichbar – auch für Programme, die rund um die
Uhr Passwörter durchprobieren. Gute Passwort-Hashes und 2FA helfen, aber ein Konto braucht noch mehr
Schutz: Grenzen für Rateversuche, einen sicheren Weg zurück bei vergessenem Passwort und Spuren, die du
im Ernstfall auswerten kannst.

## Die Angriffe

| Angriff | Vorgehen |
|---|---|
| [[brute-force|Brute Force]] | viele Passwörter gegen **ein** Konto |
| [[credential-stuffing|Credential Stuffing]] | geleakte E-Mail-Passwort-Paare aus anderen Diensten durchprobieren |
| Password Spraying | **ein** häufiges Passwort (z. B. `Sommer2026!`) gegen viele Konten |
| [[user-enumeration|User Enumeration]] | herausfinden, welche E-Mails ein Konto haben |

Gegen alle vier hilft dieselbe Grundidee: Versuche begrenzen und nichts verraten.

## Rate Limiting in Laravel

Mit [[rate-limiting|Rate Limiting]] begrenzt du, wie oft jemand eine Route in einem Zeitfenster aufrufen
darf. In Laravel definierst du dafür einen benannten Limiter:

```php title="app/Providers/AppServiceProvider.php"
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

public function boot(): void
{
    RateLimiter::for('login', function (Request $request) {
        return Limit::perMinute(5)->by(Str::lower((string) $request->input('email')).'|'.$request->ip());
    });
}
```

```php title="routes/web.php"
Route::post('/login', /* … */)->middleware('throttle:login');
```

Ist das Limit erreicht, antwortet Laravel mit **429 Too Many Requests** und dem Header `Retry-After`.
Für schnelle Fälle geht auch `throttle:5,1` (5 Anfragen pro Minute) direkt an der Route.

> [!MERKSATZ]
> Drossle Logins pro **Konto und Quelle**. Nur pro IP sperrt ganze Büros aus, nur pro Konto lädt zum
> Aussperren fremder Konten ein.

## Sperren – aber weich

Eine harte Kontosperre („nach 5 Fehlversuchen 24 Stunden gesperrt“) klingt sicher, ist aber selbst eine
Angriffsfläche: Jeder kann jedes Konto aussperren, indem er absichtlich falsche Passwörter tippt. Besser
sind weiche Maßnahmen:

| Maßnahme | Wirkung |
|---|---|
| Wachsende Wartezeit | jeder Fehlversuch verlängert die Pause |
| Zeitlich begrenzte [[account-lockout|Sperre]] | z. B. 15 Minuten statt dauerhaft |
| Zusätzliche Hürde | CAPTCHA oder 2FA-Pflicht nach mehreren Fehlversuchen |
| Benachrichtigung | E-Mail bei auffälligen Anmeldeversuchen |

> [!FEHLER]
> Fehlermeldungen wie „Kein Konto mit dieser E-Mail“ und „Passwort falsch“. Sie machen aus dem
> Login-Formular ein Werkzeug für User Enumeration. Eine einzige Meldung für beide Fälle – und bei der
> Registrierung sowie beim Passwort-Reset genauso vorsichtig formulieren.

## Ein sicherer Passwort-Reset

Der „Passwort vergessen“-Ablauf ist eine zweite Login-Tür und braucht dieselbe Sorgfalt:

1. Formular nimmt die E-Mail entgegen und antwortet **immer gleich**.
2. Server erzeugt ein zufälliges [[passwort-reset|Reset-Token]], speichert nur seinen Hash und schickt
   einen Link per E-Mail.
3. Das Token gilt kurz (Laravel: 60 Minuten) und nur **einmal**.
4. Nach dem Reset: Token löschen, andere Sessions und API-Tokens beenden, Bestätigungsmail schicken.

Laravel bringt das fertig mit: `Password::sendResetLink()` und `Password::reset()` nutzen die Tabelle
`password_reset_tokens`; Laufzeit und Drosselung stehen in `config/auth.php` (`expire`, `throttle`).

## Protokollieren und benachrichtigen

Im Ernstfall willst du nachvollziehen, was passiert ist. Protokolliere sicherheitsrelevante Ereignisse
– Login erfolgreich oder fehlgeschlagen, Passwort geändert, 2FA aktiviert, Token erstellt – mit
Zeitpunkt, Nutzer-ID und IP-Adresse. Laravel feuert dafür Events wie `Illuminate\Auth\Events\Failed`
und `Login`.

**Nie** ins Log gehören Passwörter, Tokens, Session-IDs oder Reset-Links.

> [!PRAXIS]
> In großen Projekten landen diese Ereignisse in einem zentralen Logging-System mit Alarmen: Hunderte
> fehlgeschlagene Logins pro Minute über viele Konten sind ein typisches Zeichen für Credential
> Stuffing.

## Zusammenfassung

- Brute Force, Credential Stuffing, Password Spraying und User Enumeration zielen auf Login und Reset.
- `RateLimiter::for('login', …)` mit `Limit::perMinute(5)->by(E-Mail|IP)` und `throttle:login` drosseln Logins (429).
- Weiche, zeitlich begrenzte Sperren statt Aussperren auf Dauer.
- Einheitliche Fehlermeldungen im Login und im Reset-Formular.
- Reset-Tokens: zufällig, gehasht, kurzlebig, einmalig – danach alle anderen Sitzungen beenden.
- Sicherheitsereignisse protokollieren, Geheimnisse nie.
