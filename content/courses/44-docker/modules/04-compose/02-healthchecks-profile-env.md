---
title: Healthchecks, Startreihenfolge, Profile und env-Dateien
summary: Wie du mit Healthchecks und depends_on eine verlässliche Startreihenfolge baust, optionale Services in Profile packst und Konfiguration aus env-Dateien liest.
duration: 25
sources:
  - title: Docker Docs – Control startup order
    url: https://docs.docker.com/compose/how-tos/startup-order/
  - title: Docker Docs – Using profiles with Compose
    url: https://docs.docker.com/compose/how-tos/profiles/
  - title: Docker Docs – Set environment variables in containers
    url: https://docs.docker.com/compose/how-tos/environment-variables/set-environment-variables/
  - title: Docker Docs – Interpolation
    url: https://docs.docker.com/reference/compose-file/interpolation/
quiz:
  - type: single
    question: "`php` hat `depends_on: [db]` (kurze Schreibweise). Worauf wartet Compose, bevor es `php` startet?"
    options:
      - Bis PostgreSQL Verbindungen annimmt.
      - Nur bis der Container `db` gestartet wurde – nicht, bis die Datenbank bereit ist.
      - Bis der Healthcheck von `php` grün ist.
      - Auf gar nichts, die Reihenfolge ist zufällig.
    answer: 1
    explanation: >
      Die kurze Form garantiert nur die Start-Reihenfolge der Container. PostgreSQL braucht danach aber noch einige
      Sekunden. Erst `condition: service_healthy` zusammen mit einem Healthcheck wartet auf echte Bereitschaft.
  - type: multiple
    question: "Ein Service `mailpit` hat `profiles: [tools]`. Welche Aussagen stimmen?"
    options:
      - "`docker compose up -d` startet ihn nicht."
      - "`docker compose --profile tools up -d` startet ihn zusammen mit den übrigen Services."
      - "`COMPOSE_PROFILES=tools docker compose up -d` startet ihn ebenfalls."
      - Services ohne `profiles` starten nur, wenn kein Profil aktiv ist.
    answers: [0, 1, 2]
    explanation: Services ohne Profil laufen immer. Profile schalten zusätzliche Services nur bei Bedarf dazu.
  - type: cloze
    text: "In `ports: [\"${APP_PORT:-8080}:80\"]` nutzt Compose den Wert von `APP_PORT` aus der Datei ___ im Projektordner – fehlt er, gilt der Standardwert ___."
    blanks:
      - [.env]
      - ["8080"]
    explanation: "Compose liest die `.env` im Projektordner für die Interpolation. `${VAR:-wert}` liefert einen Standardwert, wenn die Variable fehlt oder leer ist."
  - type: match
    question: Ordne jede Bedingung von `depends_on` ihrer Bedeutung zu.
    pairs:
      - { left: "service_started", right: "Warten, bis der Container gestartet ist" }
      - { left: "service_healthy", right: "Warten, bis der Healthcheck erfolgreich ist" }
      - { left: "service_completed_successfully", right: "Warten, bis ein Einmal-Job mit Exit-Code 0 beendet ist" }
    explanation: "`service_completed_successfully` passt z. B. zu einem Migrations-Service, der einmal läuft und sich dann beendet."
tasks:
  - id: stack-absichern
    type: terminal
    title: Den Stack verlässlich starten
    description: |
      Klicke zuerst auf **Aufgabe vorbereiten**. Im Ordner `stack-absichern` liegen eine `compose.yaml` mit den
      Services `php`, `db` und `mailpit` sowie eine `.env.example`. Erweitere die `compose.yaml`:

      1. `db` bekommt einen `healthcheck` mit
         `test: ["CMD-SHELL", "pg_isready -U postgres"]`, `interval: 5s`, `timeout: 3s` und `retries: 10`.
      2. `php` wartet per `depends_on` darauf, dass `db` **healthy** ist (`condition: service_healthy`).
      3. `php` liest seine Umgebungsvariablen aus der Datei `.env` (`env_file: .env`).
      4. `mailpit` gehört zum Profil `tools`, damit es nur bei Bedarf startet.
      5. Der Port von `mailpit` soll `"${MAILPIT_PORT:-8025}:8025"` lauten.
      6. Lege `.env` als Kopie von `.env.example` an.
    workdir: stack-absichern
    setup: |
      cat > .env.example <<'EOF'
      APP_ENV=local
      DB_HOST=db
      DB_PASSWORD=geheim
      MAILPIT_PORT=8025
      EOF
      cat > compose.yaml <<'EOF'
      services:
        php:
          image: php:8.5-fpm-alpine
          depends_on:
            - db

        db:
          image: postgres:18-alpine
          environment:
            POSTGRES_PASSWORD: geheim
          volumes:
            - pgdata:/var/lib/postgresql

        mailpit:
          image: axllent/mailpit:v1.31
          ports:
            - "8025:8025"

      volumes:
        pgdata:
      EOF
    checks:
      - type: command
        run: >-
          bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file("compose.yaml").text())))' | jq -r '.services | keys | sort | join(",")'
        stdout_equals: "db,mailpit,php"
        message: compose.yaml ist kein gültiges YAML mehr oder die Services php, db und mailpit fehlen.
      - type: command
        run: >-
          bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file("compose.yaml").text())))' | jq -r '.services.db.healthcheck.test | tostring | test("pg_isready")'
        stdout_equals: "true"
        message: "db braucht einen healthcheck mit test: [\"CMD-SHELL\", \"pg_isready -U postgres\"]."
      - type: command
        run: >-
          bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file("compose.yaml").text())))' | jq -r '.services.db.healthcheck | "\(.interval)|\(.timeout)|\(.retries)"'
        stdout_equals: "5s|3s|10"
        message: "Der healthcheck von db braucht interval: 5s, timeout: 3s und retries: 10."
      - type: command
        run: >-
          bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file("compose.yaml").text())))' | jq -r '.services.php.depends_on.db.condition // "fehlt"'
        stdout_equals: service_healthy
        message: "php braucht die lange Form: depends_on: → db: → condition: service_healthy."
      - type: command
        run: >-
          bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file("compose.yaml").text())))' | jq -r '[.services.php.env_file] | flatten | map(if type=="object" then .path else . end) | map(sub("^\\./";"")) | index(".env") != null'
        stdout_equals: "true"
        message: "Ergänze beim Service php: env_file: .env"
      - type: command
        run: >-
          bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file("compose.yaml").text())))' | jq -r '.services.mailpit.profiles // [] | index("tools") != null'
        stdout_equals: "true"
        message: "mailpit soll zum Profil tools gehören: profiles: [tools]"
      - type: command
        run: >-
          bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file("compose.yaml").text())))' | jq -r '.services.mailpit.ports // [] | map(tostring) | index("${MAILPIT_PORT:-8025}:8025") != null'
        stdout_equals: "true"
        message: 'Der Port von mailpit soll "${MAILPIT_PORT:-8025}:8025" lauten (in Anführungszeichen).'
      - type: command
        run: cmp -s .env .env.example && echo ok
        stdout_equals: ok
        message: Lege .env als Kopie von .env.example an (cp .env.example .env).
    hints:
      - "Die kurze Liste unter depends_on ersetzt du durch einen Block: depends_on: → db: → condition: service_healthy."
      - "healthcheck gehört eingerückt unter db – auf derselben Ebene wie image und environment."
      - Teste die Syntax zwischendurch mit dem bun-Befehl aus der letzten Lektion.
    solution: |
      ```bash
      cd stack-absichern
      cat > compose.yaml <<'EOF'
      services:
        php:
          image: php:8.5-fpm-alpine
          env_file: .env
          depends_on:
            db:
              condition: service_healthy

        db:
          image: postgres:18-alpine
          environment:
            POSTGRES_PASSWORD: geheim
          volumes:
            - pgdata:/var/lib/postgresql
          healthcheck:
            test: ["CMD-SHELL", "pg_isready -U postgres"]
            interval: 5s
            timeout: 3s
            retries: 10

        mailpit:
          image: axllent/mailpit:v1.31
          profiles: [tools]
          ports:
            - "${MAILPIT_PORT:-8025}:8025"

      volumes:
        pgdata:
      EOF
      cp .env.example .env
      ```
  - id: startreihenfolge
    type: steps
    title: Was passiert beim Start?
    description: |
      In deiner `compose.yaml` hat `db` einen Healthcheck (`pg_isready`, alle 5 Sekunden). `php` hängt mit
      `condition: service_healthy` von `db` ab, `mailpit` gehört zum Profil `tools`. Du tippst `docker compose up -d`.
    steps:
      - situation: Compose wertet die Datei aus und plant die Reihenfolge.
        question: Welcher Container startet zuerst?
        options:
          - db
          - php
          - mailpit
        answer: 0
        explanation: "`php` hängt von `db` ab, `mailpit` gehört zu einem inaktiven Profil und startet gar nicht."
      - situation: Der Container `db` läuft, PostgreSQL initialisiert aber noch seine Dateien. `pg_isready` schlägt zweimal fehl.
        question: Was macht Compose mit `php`?
        options:
          - Es startet php sofort, weil db läuft.
          - Es wartet weiter, bis der Healthcheck von db erfolgreich ist.
          - Es bricht sofort mit einem Fehler ab.
        answer: 1
        explanation: Der Status ist `starting`. Compose wartet, bis er auf `healthy` wechselt – oder bis `retries` aufgebraucht sind.
      - situation: "`pg_isready` meldet Erfolg, der Status von db wechselt auf `healthy`."
        question: Und jetzt?
        options:
          - Compose startet php.
          - Compose startet zusätzlich mailpit.
          - Compose startet db neu.
        answer: 0
        explanation: Jetzt ist die Bedingung erfüllt. mailpit bleibt aus, bis du `--profile tools` angibst.
---
Du startest deinen Stack, und die Laravel-App meldet „Connection refused“. Zwei Sekunden später läuft alles. Die
App war einfach schneller als die Datenbank. Außerdem willst du Mailpit nur manchmal starten und Passwörter nicht in
der `compose.yaml` stehen haben. Für all das hat Compose eingebaute Lösungen.

## Healthchecks: Ist der Dienst wirklich bereit?

„Container läuft“ heißt nicht „Dienst ist bereit“. PostgreSQL braucht nach dem Start einige Sekunden, bis es
Verbindungen annimmt. Ein [[healthcheck|Healthcheck]] ist ein Befehl, den Docker regelmäßig im Container ausführt.
Exit-Code 0 bedeutet gesund, alles andere krank.

```yaml title="Healthcheck für PostgreSQL"
services:
  db:
    image: postgres:18-alpine
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s      # alle 5 Sekunden prüfen
      timeout: 3s       # länger darf ein Versuch nicht dauern
      retries: 10       # nach 10 Fehlschlägen: unhealthy
      start_period: 10s # Anlaufzeit, Fehler zählen noch nicht
```

`docker compose ps` zeigt dann `(healthy)`, `(starting)` oder `(unhealthy)` hinter dem Status. Für [[valkey|Valkey]]
passt `["CMD", "valkey-cli", "ping"]`, für eine Web-App z. B. ein `curl` auf eine Health-Route.

> [!HINWEIS]
> `CMD` führt den Befehl direkt aus, `CMD-SHELL` startet ihn über eine Shell – nötig, wenn du Variablen oder
> Pipes brauchst. Der Befehl muss im Image vorhanden sein: Ohne `curl` im Image scheitert ein `curl`-Healthcheck.

## depends_on mit Bedingung

Mit `depends_on` legst du die Startreihenfolge fest. Die kurze Liste wartet aber nur auf den **Start** des
Containers. Erst die lange Form mit `condition` wartet auf echte Bereitschaft.

```yaml title="Warten, bis die Datenbank gesund ist"
services:
  php:
    build: .
    depends_on:
      db:
        condition: service_healthy
        restart: true    # php neu starten, wenn Compose db neu startet
```

| Bedingung | Compose wartet, bis … |
|---|---|
| `service_started` | der Container gestartet ist (Standard der kurzen Form) |
| `service_healthy` | der Healthcheck erfolgreich ist |
| `service_completed_successfully` | ein Einmal-Container mit Exit-Code 0 beendet ist |

> [!FEHLER]
> `depends_on: [db]` ohne Healthcheck fühlt sich sicher an, ist es aber nicht. Die App startet, bevor die
> Datenbank bereit ist, und stürzt sporadisch ab – besonders auf langsameren Rechnern in der CI.

## Profile: Services nur bei Bedarf

Manche Services brauchst du nur gelegentlich: einen Mail-Catcher wie [[mailpit|Mailpit]], ein Datenbank-Tool oder einen
Queue-Worker. Mit [[compose-profil|Profilen]] bleiben sie standardmäßig aus.

```yaml title="Optionaler Service"
services:
  mailpit:
    image: axllent/mailpit:v1.31
    profiles: [tools]
    ports:
      - "8025:8025"
```

```bash title="Profile aktivieren"
docker compose up -d                        # ohne mailpit
docker compose --profile tools up -d        # mit mailpit
COMPOSE_PROFILES=tools docker compose up -d # dasselbe per Variable
```

Services **ohne** `profiles` laufen immer. Nennst du einen Service mit Profil ausdrücklich
(`docker compose up -d mailpit`), startet Compose ihn auch ohne aktives Profil.

## Umgebungsvariablen und env-Dateien

Compose kennt zwei Arten, mit [[env-datei|env-Dateien]] zu arbeiten – sie werden ständig verwechselt:

| Mechanismus | Wofür | Wo wirkt es |
|---|---|---|
| `.env` im Projektordner | **Interpolation** von `${VAR}` in der `compose.yaml` | nur in der Compose-Datei |
| `env_file: .env` beim Service | Variablen **in den Container** reichen | in der laufenden App |
| `environment:` beim Service | einzelne Variablen direkt setzen | in der laufenden App |

```yaml title="Interpolation und env_file"
services:
  php:
    env_file: .env
    environment:
      APP_ENV: ${APP_ENV:-local}
  db:
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD:?DB_PASSWORD fehlt in .env}
```

`${VAR:-standard}` liefert einen Standardwert, `${VAR:?meldung}` bricht mit einer Fehlermeldung ab, wenn die
Variable fehlt. `docker compose config` zeigt dir, was nach der Interpolation herauskommt.

> [!PRAXIS]
> Die `.env` mit echten Werten steht in der `.gitignore`. Ins Repository kommt nur eine `.env.example` mit
> Platzhaltern. Neue Teammitglieder kopieren sie mit `cp .env.example .env` – genau wie bei Laravel.

## Zusammenfassung

- Ein **Healthcheck** prüft regelmäßig, ob ein Dienst wirklich bereit ist (`healthy`).
- `depends_on` in der kurzen Form wartet nur auf den Start; `condition: service_healthy` wartet auf Bereitschaft.
- **Profile** schalten optionale Services zu: `--profile tools` oder `COMPOSE_PROFILES=tools`.
- Die `.env` im Projektordner füllt `${VAR}` in der Compose-Datei; `env_file:` reicht Variablen in den Container.
- `${VAR:-wert}` setzt Standardwerte, `${VAR:?meldung}` erzwingt Pflichtwerte.
- `.env` gehört in die `.gitignore`, `.env.example` ins Repository.
