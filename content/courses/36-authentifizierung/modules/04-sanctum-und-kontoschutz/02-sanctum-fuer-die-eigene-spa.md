---
title: Sanctum für die eigene SPA
summary: Wie deine React- oder Vue-App sich per Session-Cookie an einer Laravel-API anmeldet – mit statefulApi, Stateful-Domains, CORS mit Credentials und dem CSRF-Cookie.
duration: 20
sources:
  - title: Laravel 13 – Sanctum, SPA Authentication
    url: https://laravel.com/docs/13.x/sanctum#spa-authentication
  - title: Laravel 13 – Routing, CORS
    url: https://laravel.com/docs/13.x/routing#cors
  - title: MDN – Cross-Origin Resource Sharing (CORS)
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS
quiz:
  - type: single
    question: Welche Voraussetzung nennt die Laravel-Doku für Sanctums SPA-Anmeldung?
    options:
      - SPA und API laufen auf völlig verschiedenen Domains.
      - SPA und API teilen sich dieselbe Hauptdomain, z. B. app.example.com und api.example.com.
      - Die SPA speichert ein API-Token in localStorage.
      - Die SPA nutzt OAuth.
    answer: 1
    explanation: >
      Session-Cookies funktionieren nur innerhalb derselben Website. Subdomains derselben Hauptdomain sind in
      Ordnung, dafür setzt man `SESSION_DOMAIN=.example.com`.
  - type: multiple
    question: Was braucht die CORS-Konfiguration, damit die SPA Cookies mitschicken darf?
    options:
      - "`supports_credentials` auf `true`"
      - Eine konkrete Liste erlaubter Origins statt `*`
      - "`allowed_methods` auf `GET` begrenzen"
      - "Im Frontend `withCredentials` (Axios) bzw. `credentials: 'include'` (fetch)"
    answers: [0, 1, 3]
    explanation: >
      Browser verbieten die Kombination aus Credentials und dem Platzhalter `*`. Server und Client müssen
      Credentials ausdrücklich erlauben.
  - type: cloze
    text: "Bevor die SPA sich anmeldet, ruft sie `GET /sanctum/___` auf. Laravel setzt dabei das Cookie ___, dessen Wert die SPA im Header X-XSRF-TOKEN zurückschickt."
    blanks:
      - [csrf-cookie]
      - [XSRF-TOKEN]
    explanation: Axios und der Angular-HttpClient übernehmen das Kopieren in den Header automatisch.
tasks:
  - id: spa-konfigurieren
    type: terminal
    title: Die API für eine SPA vorbereiten
    description: |
      Deine React-App läuft später auf `https://app.example.com` (lokal unter `http://localhost:5173`), die
      Laravel-API auf `https://api.example.com`. In `spa-app` liegt die Laravel-Anwendung mit installiertem
      Sanctum. Klicke zuerst auf **Aufgabe vorbereiten** und wechsle mit `cd spa-app` hinein.

      1. Aktiviere die Cookie-Anmeldung für die API: Rufe in `bootstrap/app.php` im Block
         `withMiddleware` die Methode `$middleware->statefulApi();` auf.
      2. Trage in der `.env` die vertrauenswürdigen SPA-Domains ein:
         `SANCTUM_STATEFUL_DOMAINS=app.example.com,localhost:5173`.
      3. Lass das Session-Cookie für alle Subdomains gelten: `SESSION_DOMAIN=.example.com`
         (die Zeile gibt es schon, sie steht auf `null`).
      4. Veröffentliche die CORS-Konfiguration mit `php artisan config:publish cors` und setze in
         `config/cors.php`:
         - `allowed_origins` auf `['https://app.example.com', 'http://localhost:5173']`
         - `supports_credentials` auf `true`
      5. Prüfe mit `php artisan tinker --execute="dump(config('cors'), config('sanctum.stateful'));"`.
    workdir: spa-app
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
    checks:
      - type: file_contains
        path: bootstrap/app.php
        pattern: "->statefulApi\\(\\)"
        message: In bootstrap/app.php fehlt noch $middleware->statefulApi(); im Block withMiddleware.
      - type: command
        run: php artisan tinker --execute="echo implode(',', config('sanctum.stateful'));"
        stdout_matches: "(^|,)app\\.example\\.com(,|$)"
        message: app.example.com steht noch nicht in den Stateful-Domains. Setze SANCTUM_STATEFUL_DOMAINS in der .env.
      - type: command
        run: php artisan tinker --execute="echo implode(',', config('sanctum.stateful'));"
        stdout_matches: "(^|,)localhost:5173(,|$)"
        message: localhost:5173 (mit Port!) fehlt noch in SANCTUM_STATEFUL_DOMAINS.
      - type: command
        run: php artisan tinker --execute="echo config('session.domain');"
        stdout_matches: "^\\.example\\.com\\s*$"
        message: SESSION_DOMAIN soll .example.com sein (mit führendem Punkt), damit das Cookie für app. und api. gilt.
      - type: file_exists
        path: config/cors.php
        message: config/cors.php gibt es noch nicht. Führe php artisan config:publish cors aus.
      - type: command
        run: php artisan tinker --execute="var_export(config('cors.supports_credentials'));"
        stdout_matches: "^true\\s*$"
        message: supports_credentials ist in config/cors.php noch nicht true.
      - type: command
        run: php artisan tinker --execute="echo json_encode(config('cors.allowed_origins'), JSON_UNESCAPED_SLASHES);"
        stdout_matches: "^\\[(?!.*\"\\*\")(?=.*\"https://app\\.example\\.com\")(?=.*\"http://localhost:5173\").*\\]\\s*$"
        message: allowed_origins soll genau die SPA-Origins https://app.example.com und http://localhost:5173 enthalten – und nicht mehr '*'.
    hints:
      - "In `bootstrap/app.php` steht ein leerer Block `->withMiddleware(function (Middleware $middleware): void { // })`. Ersetze den Kommentar durch `$middleware->statefulApi();`."
      - "`sed -i 's/^SESSION_DOMAIN=.*/SESSION_DOMAIN=.example.com/' .env` und `echo 'SANCTUM_STATEFUL_DOMAINS=app.example.com,localhost:5173' >> .env`."
      - "In `config/cors.php` änderst du nur die zwei Zeilen `'allowed_origins' => [...]` und `'supports_credentials' => true`."
    solution: |
      ```php title="bootstrap/app.php (Ausschnitt)"
      ->withMiddleware(function (Middleware $middleware): void {
          $middleware->statefulApi();
      })
      ```

      ```bash
      echo 'SANCTUM_STATEFUL_DOMAINS=app.example.com,localhost:5173' >> .env
      sed -i 's/^SESSION_DOMAIN=.*/SESSION_DOMAIN=.example.com/' .env
      php artisan config:publish cors
      ```

      ```php title="config/cors.php (Ausschnitt)"
      'allowed_origins' => ['https://app.example.com', 'http://localhost:5173'],
      'supports_credentials' => true,
      ```
  - id: spa-login-ablauf
    type: order
    title: So meldet sich die SPA an
    description: Bring die Anfragen deiner React-App in die richtige Reihenfolge.
    items:
      - "GET /sanctum/csrf-cookie – Laravel setzt das Cookie XSRF-TOKEN."
      - "POST /login mit E-Mail, Passwort und Header X-XSRF-TOKEN."
      - Laravel prüft die Zugangsdaten, erneuert die Session und setzt das Session-Cookie.
      - "GET /api/user – der Browser schickt das Session-Cookie automatisch mit."
      - auth:sanctum erkennt die Stateful-Domain und authentifiziert über die Session.
---
Deine React-App unter `app.example.com` soll mit deiner Laravel-API unter `api.example.com` sprechen.
Die naheliegende Idee – Login, Token holen, Token in `localStorage` legen – hat einen Haken: Jedes per
XSS eingeschleuste Skript kann das Token stehlen. Sanctum bietet für die **eigene** SPA einen besseren
Weg: ganz normale Session-Cookies.

## Die Idee

Für die SPA nutzt Sanctum **keine Tokens**. Die SPA meldet sich an wie eine klassische Web-App, und der
Browser verwaltet das [[httponly|HttpOnly]]-Session-Cookie. JavaScript sieht es nie.

Damit das klappt, muss Laravel zwei Arten von Anfragen an `/api/*` unterscheiden:

| Anfrage kommt von … | Sanctum prüft |
|---|---|
| einer **[[stateful-domain|Stateful-Domain]]** (deine SPA) | Session-Cookie + CSRF-Schutz |
| irgendwoher sonst | Bearer-Token |

Woher eine Anfrage kommt, liest Sanctum aus den Headern `Origin` oder `Referer`. Die SPA schickt außerdem
`Accept: application/json` mit.

Der Vorteil gegenüber einem Token in `localStorage`: Selbst wenn ein Angreifer per XSS eigenes JavaScript
in deine Seite schmuggelt, kann er das Session-Cookie nicht auslesen und auf einen anderen Rechner
mitnehmen. Er kann zwar Anfragen im Namen des Nutzers auslösen, solange die Seite offen ist – aber kein
dauerhaft gültiges Geheimnis stehlen.

> [!MERKSATZ]
> Eigene SPA auf derselben Hauptdomain → Session-Cookie. Fremde Clients und Apps → Tokens.

## Die Konfiguration

Drei Stellen müssen zusammenpassen:

```php title="bootstrap/app.php"
->withMiddleware(function (Middleware $middleware): void {
    $middleware->statefulApi();
})
```

`statefulApi()` schaltet für die API-Routen Session, Cookie-Verschlüsselung und CSRF-Prüfung ein –
allerdings nur für Anfragen von Stateful-Domains.

```dotenv title=".env"
SANCTUM_STATEFUL_DOMAINS=app.example.com,localhost:5173
SESSION_DOMAIN=.example.com
SESSION_SECURE_COOKIE=true
```

- `SANCTUM_STATEFUL_DOMAINS`: Domains deiner SPA – **mit Port**, wenn einer in der URL steht.
- `SESSION_DOMAIN=.example.com`: Der führende Punkt lässt das Cookie für alle Subdomains gelten.

> [!FEHLER]
> `localhost` eintragen, die SPA läuft aber auf `localhost:5173`. Sanctum vergleicht inklusive Port –
> die Anfrage gilt dann nicht als stateful und landet bei der Token-Prüfung: 401.

## CORS mit Credentials

SPA und API haben verschiedene [[web-origin|Origins]]. Damit der Browser die Antworten an die SPA
herausgibt, muss die API [[cors|CORS]] erlauben – und zwar ausdrücklich **mit Credentials**
(Cookies):

```bash title="Terminal"
php artisan config:publish cors
```

```php title="config/cors.php"
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_origins' => ['https://app.example.com', 'http://localhost:5173'],
'supports_credentials' => true,
```

Browser lehnen `Access-Control-Allow-Credentials: true` zusammen mit `Access-Control-Allow-Origin: *`
ab. Darum stehen in `allowed_origins` die konkreten Adressen deiner SPA. Im Frontend schaltest du
Credentials ebenfalls ein:

```js title="Frontend"
axios.defaults.withCredentials = true;
axios.defaults.withXSRFToken = true;
// mit fetch: fetch(url, { credentials: 'include' })
```

## Der Login-Ablauf

1. `GET /sanctum/csrf-cookie` – Laravel setzt das Cookie `XSRF-TOKEN`.
2. `POST /login` mit Zugangsdaten. Axios kopiert den Cookie-Wert in den Header `X-XSRF-TOKEN`.
3. Laravel meldet über den `web`-Guard an und setzt das Session-Cookie.
4. Alle folgenden Anfragen an `/api/*` tragen das Cookie und sind über `auth:sanctum` angemeldet.

Die `/login`-Route baust du selbst wie in Modul 2 oder nutzt ein Paket wie
[Laravel Fortify](https://laravel.com/docs/13.x/fortify). Läuft die Session ab, antwortet die API mit
401 oder 419 – die SPA leitet dann zur Login-Seite.

## Typische Stolpersteine

| Symptom | Häufige Ursache |
|---|---|
| 401 bei `/api/user` direkt nach dem Login | Domain fehlt in `SANCTUM_STATEFUL_DOMAINS` oder Port vergessen |
| 419 bei jedem POST | `/sanctum/csrf-cookie` nicht aufgerufen oder `X-XSRF-TOKEN` fehlt |
| CORS-Fehler in der Browser-Konsole | `supports_credentials` aus oder Origin nicht in `allowed_origins` |
| Cookie kommt im Browser nie an | `SESSION_DOMAIN` passt nicht zur Domain der SPA |
| Lokal geht alles, in Produktion nicht | `SESSION_SECURE_COOKIE` und HTTPS passen nicht zusammen |

Die Netzwerk-Ansicht der Browser-Entwicklertools zeigt dir bei jedem Request, welche Cookies und Header
tatsächlich mitgeschickt wurden – dort findest du die meisten dieser Fehler in Sekunden.

> [!PRAXIS]
> Weil hier wieder Cookies im Spiel sind, ist [[csrf|CSRF]] wieder ein Thema. Genau dafür gibt es den
> CSRF-Cookie-Schritt. Wer ihn weglässt, bekommt bei jedem POST die Antwort 419.

## Zusammenfassung

- Für die eigene SPA nutzt Sanctum Session-Cookies statt Tokens – sicher vor Token-Diebstahl per XSS.
- SPA und API müssen dieselbe Hauptdomain teilen; `SESSION_DOMAIN=.example.com` deckt Subdomains ab.
- `$middleware->statefulApi()` und `SANCTUM_STATEFUL_DOMAINS` (mit Port!) aktivieren den Cookie-Weg.
- CORS braucht `supports_credentials: true` und konkrete Origins statt `*`.
- Ablauf: `/sanctum/csrf-cookie`, dann `POST /login` mit `X-XSRF-TOKEN`, danach geht das Cookie automatisch mit.
