---
title: Konfiguration pro Umgebung
summary: local, staging und production sauber trennen – und Umgebungsvariablen in Laravel (env und config) und Vite (import.meta.env) richtig lesen.
duration: 25
sources:
  - title: Laravel – Configuration
    url: https://laravel.com/docs/configuration
  - title: Laravel – Deployment (Optimizing Configuration Loading)
    url: https://laravel.com/docs/deployment#optimizing-configuration-loading
  - title: Vite – Env Variables and Modes
    url: https://vite.dev/guide/env-and-mode
  - title: The Twelve-Factor App – Dev/prod parity
    url: https://12factor.net/dev-prod-parity
quiz:
  - type: single
    question: Wo rufst du in Laravel `env()` auf?
    options:
      - Überall, wo du einen Wert brauchst, etwa in Controllern.
      - Nur in den Dateien in config/ – im übrigen Code nutzt du config().
      - Nur in Blade-Templates.
      - Nirgends, env() ist veraltet.
    answer: 1
    explanation: Nach php artisan config:cache wird die .env nicht mehr gelesen. env() außerhalb von config/ liefert dann null. config() funktioniert immer.
  - type: find-bug
    question: Im Frontend ist `import.meta.env.API_URL` immer undefined, obwohl der Wert in der .env steht. Welche Zeile ist falsch?
    language: bash
    code: |
      # .env im Frontend
      API_URL=https://api.example.com
      VITE_APP_TITLE=Notizen
    bug_line: 2
    explanation: Vite gibt nur Variablen mit dem Präfix VITE_ an den Browser-Code weiter. Richtig wäre VITE_API_URL – und im Code import.meta.env.VITE_API_URL.
  - type: multiple
    question: Welche Aussagen über Variablen mit dem Präfix `VITE_` stimmen?
    options:
      - Ihre Werte landen im ausgelieferten JavaScript.
      - Jeder Besucher der Website kann sie lesen.
      - Sie sind ein sicherer Ort für Datenbank-Passwörter.
      - Vite setzt sie beim Build fest ein.
    answers: [0, 1, 3]
    explanation: Alles, was ins Frontend gelangt, ist öffentlich. Geheimnisse gehören ausschließlich ins Backend.
  - type: match
    question: Ordne jede Umgebung ihrem Zweck zu.
    pairs:
      - { left: "local", right: "Entwickeln auf dem eigenen Rechner" }
      - { left: "testing", right: "Automatische Tests mit Testdatenbank" }
      - { left: "staging", right: "Letzte Probe auf einem produktionsähnlichen Server" }
      - { left: "production", right: "Die echte Anwendung für echte Nutzerinnen" }
    explanation: Derselbe Code durchläuft alle Umgebungen. Nur die Konfiguration unterscheidet sich.
tasks:
  - id: konfiguration-laden
    type: code
    language: ts
    title: Frontend-Konfiguration sicher laden
    description: |
      Schreibe `loadConfig(env)`. Die Funktion bekommt ein Objekt wie `import.meta.env` und gibt die
      Konfiguration der App zurück:

      - `apiUrl`: Wert von `VITE_API_URL`. Fehlt er oder ist er leer, wirf einen `Error` – die App soll
        lieber sofort abbrechen als später mit kaputter URL laufen.
      - `debug`: `true` nur dann, wenn `VITE_DEBUG` genau den Text `"true"` hat, sonst `false`.
      - `mode`: Wert von `MODE`, oder `"development"`, wenn er fehlt.
    starter: |
      type AppConfig = { apiUrl: string; debug: boolean; mode: string }

      function loadConfig(env: Record<string, string | undefined>): AppConfig {
        // dein Code
      }
    tests:
      - name: liest alle Werte
        code: |
          const c = loadConfig({ VITE_API_URL: 'https://api.example.com', VITE_DEBUG: 'true', MODE: 'staging' })
          assertDeepEqual(c, { apiUrl: 'https://api.example.com', debug: true, mode: 'staging' })
      - name: debug ist ohne Wert false und mode hat einen Standard
        code: |
          const c = loadConfig({ VITE_API_URL: 'https://api.example.com' })
          assertEqual(c.debug, false)
          assertEqual(c.mode, 'development')
      - name: nur der Text "true" schaltet debug ein
        code: |
          assertEqual(loadConfig({ VITE_API_URL: 'https://api.example.com', VITE_DEBUG: '1' }).debug, false)
      - name: fehlende API-URL wirft einen Fehler
        code: |
          assertThrows(() => loadConfig({ MODE: 'production' }))
      - name: leere API-URL wirft einen Fehler
        code: |
          assertThrows(() => loadConfig({ VITE_API_URL: '' }))
    hints:
      - "`if (!env.VITE_API_URL) throw new Error('VITE_API_URL fehlt')` fängt fehlende und leere Werte ab."
      - "`env.MODE ?? 'development'` liefert einen Standardwert, wenn MODE undefined ist."
    solution: |
      ```ts
      type AppConfig = { apiUrl: string; debug: boolean; mode: string }

      function loadConfig(env: Record<string, string | undefined>): AppConfig {
        const apiUrl = env.VITE_API_URL
        if (!apiUrl) {
          throw new Error('VITE_API_URL fehlt')
        }
        return {
          apiUrl,
          debug: env.VITE_DEBUG === 'true',
          mode: env.MODE ?? 'development',
        }
      }
      ```
  - id: staging-konfiguration
    type: simulated
    title: Konfiguration auf dem Staging-Server neu laden
    description: |
      Auf dem Staging-Server wurde in der `.env` ein neuer Wert eingetragen, die Anwendung nutzt aber
      noch den alten. Der Grund: Die Konfiguration ist gecacht.

      1. Melde dich mit `ssh deploy@203.0.113.10` am Server an.
      2. Wechsle in den Ordner `/var/www/notizen`.
      3. Prüfe mit `grep APP_ENV .env`, dass du wirklich auf Staging bist.
      4. Baue den Konfigurations-Cache mit `php artisan config:cache` neu.
    prompt: "du@laptop:~$"
    steps:
      - expect: "^ssh\\s+deploy@203\\.0\\.113\\.10$"
        output: |
          Welcome to Ubuntu 24.04 LTS
          Last login: Thu Oct  8 09:12:44 2026 from 198.51.100.7
        prompt: "deploy@staging:~$"
        hint: Nutze ssh deploy@203.0.113.10
      - expect: "^cd\\s+/var/www/notizen/?$"
        output: ""
        prompt: "deploy@staging:/var/www/notizen$"
        hint: Wechsle mit cd /var/www/notizen in den Projektordner.
      - expect: "^grep\\s+APP_ENV\\s+\\.env$"
        output: "APP_ENV=staging"
        hint: Tippe grep APP_ENV .env
      - expect: "^php\\s+artisan\\s+config:cache$"
        output: |

             INFO  Configuration cached successfully.
        hint: Der Befehl lautet php artisan config:cache
    responses:
      - match: "^ls"
        output: "app  artisan  bootstrap  config  database  public  resources  routes  storage  vendor"
      - match: "^cat\\s+\\.env"
        output: "Die .env enthält Geheimnisse – lass dir lieber nur einzelne Schlüssel mit grep anzeigen."
---
Bisher kennst du die `.env` auf deinem Rechner. Doch ein Projekt läuft an mehreren Orten. Jede dieser
Stationen heißt [[umgebung|Umgebung]] und bekommt ihre eigenen Werte. In dieser Lektion lernst du,
wie Laravel und Vite die Werte lesen – und welche Falle im Frontend lauert.

## Eine Codebasis, mehrere Umgebungen

| Umgebung | Wo | Typische Werte |
|---|---|---|
| `local` | dein Laptop | `APP_DEBUG=true`, lokale Datenbank |
| `testing` | Testlauf, CI | In-Memory-Datenbank, keine echten Mails |
| `staging` | Testserver | produktionsähnlich, Testdaten |
| `production` | echter Server | `APP_DEBUG=false`, echte Datenbank |

Der Code ist in allen Umgebungen **identisch**. Nur die Umgebungsvariablen unterscheiden sich. Die
[[staging-umgebung|Staging-Umgebung]] ist dabei die Generalprobe: Was dort läuft, sollte auch in der
[[produktionsumgebung|Produktion]] laufen.

> [!MERKSATZ]
> Nie `if (umgebung === 'production')` quer durch den Code verteilen. Besser: ein Schalter pro
> Funktion in der Konfiguration, z. B. `MAIL_ENABLED=false` lokal und `true` in Produktion.

## Laravel: env() nur in config/

Laravel liest die `.env` und stellt die Werte über `env()` bereit. Die Dateien in `config/` übersetzen
sie in benannte Einstellungen:

```php title="config/app.php (Ausschnitt)"
'name' => env('APP_NAME', 'Laravel'),
'debug' => (bool) env('APP_DEBUG', false),
```

Im restlichen Code fragst du dann **nur** `config()`:

```php title="irgendwo in app/"
$name = config('app.name');
```

Den Namen der aktuellen Umgebung liest du ebenfalls über die Konfiguration, zum Beispiel mit
`app()->environment('production')`. Für Tests kann eine eigene Datei `.env.testing` bereitliegen; die
Werte aus `phpunit.xml` haben beim Testen Vorrang.

Warum der Umweg? Auf Servern führt man `php artisan config:cache` aus. Dann fasst Laravel alle
Konfiguration in einer schnellen Cache-Datei zusammen und liest die `.env` gar nicht mehr.

> [!FEHLER]
> **`env()` in Controllern oder Services.** Lokal funktioniert es, auf dem Server liefert es nach
> `config:cache` plötzlich `null`. Der Fehler fällt also erst nach dem Deployment auf. Nutze `env()`
> ausschließlich in `config/`.

## Vite: import.meta.env und das VITE_-Präfix

Im Frontend liest Vite ebenfalls eine `.env`. Im Code stehen die Werte unter `import.meta.env`:

```ts title="src/lib/api.ts"
const apiUrl = import.meta.env.VITE_API_URL
console.log(import.meta.env.MODE) // "development" oder "production"
```

Aber: Vite gibt **nur** Variablen mit dem Präfix `VITE_` an deinen Code weiter. Der Grund ist
Sicherheit. Beim Build schreibt Vite die Werte fest in das JavaScript, das jeder Browser herunterlädt.

| Variable in `.env` | Im Browser-Code? |
|---|---|
| `VITE_API_URL=https://api.example.com` | ja – öffentlich lesbar |
| `DB_PASSWORD=…` | nein – wird ignoriert |

> [!ACHTUNG]
> Alles mit `VITE_` ist **öffentlich**. Ein API-Schlüssel mit `VITE_`-Präfix steht im Klartext im
> Bundle. Geheimnisse gehören nur ins Backend.

## Dateien pro Modus

Vite lädt je nach Modus zusätzliche Dateien:

```text title="Ladereihenfolge in Vite (spätere gewinnen)"
.env                 # immer
.env.local           # immer, von Git ignoriert
.env.production      # nur bei vite build
.env.production.local
```

`npm run dev` läuft im Modus `development`, `npm run build` im Modus `production`. Dateien mit
`.local` sind für persönliche Werte gedacht und gehören in die `.gitignore`.

> [!PRAXIS]
> Prüfe Pflicht-Variablen gleich beim Start an **einer** Stelle, statt sie überall im Code zu lesen.
> Fehlt ein Wert, bricht die App sofort mit klarer Meldung ab – genau das übst du in der Aufgabe.

## Zusammenfassung

- Derselbe Code läuft in `local`, `testing`, `staging` und `production`; nur die Konfiguration wechselt.
- Laravel: `env()` nur in `config/`, sonst `config('datei.schluessel')`.
- Nach `php artisan config:cache` wird die `.env` nicht mehr gelesen.
- Vite: Werte stehen unter `import.meta.env`, aber nur mit Präfix `VITE_`.
- `VITE_`-Werte landen im Bundle und sind öffentlich – keine Geheimnisse!
- `.env.[modus]` und `.env.local` ergänzen die `.env` je nach Modus.
