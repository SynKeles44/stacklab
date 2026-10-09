---
title: YAML in der Praxis
summary: Docker Compose, GitHub Actions und Kubernetes – wie die drei wichtigsten YAML-Dateien deines Alltags aufgebaut sind.
duration: 25
sources:
  - title: Docker Docs – Compose file reference
    url: https://docs.docker.com/reference/compose-file/
  - title: GitHub Docs – Workflow syntax for GitHub Actions
    url: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
  - title: Kubernetes – Objects In Kubernetes
    url: https://kubernetes.io/docs/concepts/overview/working-with-objects/
quiz:
  - type: match
    question: Ordne jeden Schlüssel dem Werkzeug zu, in dessen YAML-Datei er vorkommt.
    pairs:
      - { left: "runs-on", right: "GitHub Actions" }
      - { left: "depends_on", right: "Docker Compose" }
      - { left: "apiVersion und kind", right: "Kubernetes" }
    explanation: Jedes Werkzeug definiert eigene Schlüssel – das Format YAML ist nur der gemeinsame Rahmen.
  - type: single
    question: "Warum schreibt man in Compose-Dateien `ports: [\"8080:80\"]` mit Anführungszeichen?"
    options:
      - Weil Compose sonst den Port ignoriert.
      - "Damit der Wert garantiert als String gelesen wird – Werte mit Doppelpunkt können ein YAML-1.1-Parser sonst als Zahl in Basis 60 deuten."
      - Weil YAML Zahlen nur in Anführungszeichen erlaubt.
    answer: 1
    explanation: Ein Wert wie 22:22 wird nach YAML 1.1 zur Zahl 1342. Die Compose-Dokumentation empfiehlt deshalb, Port-Zuordnungen immer als String zu schreiben.
  - type: find-bug
    question: Die Pipeline startet nie. In welcher Zeile liegt der Fehler?
    language: yaml
    code: |
      name: Tests
      on:
        push:
          branches: [main]
      jobs:
        test:
          runs-on: ubuntu-latest
          steps:
          - uses: actions/checkout@v7
          - run: npm test
        lint:
        runs-on: ubuntu-latest
    bug_line: 12
    explanation: runs-on gehört zum Job lint und muss deshalb tiefer eingerückt sein als lint. So steht es auf derselben Ebene wie lint und ist ein eigener „Job“ ohne Inhalt.
  - type: cloze
    text: "Ein Kubernetes-Manifest beginnt mit `apiVersion` und `___`. Mehrere Objekte in einer Datei trennst du mit einer Zeile `___`."
    blanks:
      - [kind]
      - ["---"]
    explanation: kind sagt, welches Objekt beschrieben wird (Deployment, Service …). Drei Bindestriche trennen YAML-Dokumente.
tasks:
  - id: compose-schreiben
    type: terminal
    title: Eine compose.yaml schreiben
    description: |
      Im Ordner `compose-praxis` ist das npm-Paket `yaml` zum Prüfen installiert. Docker selbst brauchst du
      nicht – es geht um die Struktur der Datei.

      Lege `compose.yaml` mit zwei Diensten an:

      1. Dienst `web`: Image `nginx:1.29`, Port `8080:80` (als String!), startet erst nach `db`
         (`depends_on`).
      2. Dienst `db`: Image `postgres:18`, Umgebungsvariablen als **Mapping** mit `POSTGRES_DB: shop` und
         `POSTGRES_PASSWORD` (nimm einen Platzhalter wie `example`), und das Volume `db-daten`, eingehängt
         unter `/var/lib/postgresql`.
      3. Auf oberster Ebene deklarierst du das Volume `db-daten` unter `volumes:`.

      Prüfen kannst du mit:
      `node -e 'console.log(JSON.stringify(require("yaml").parse(require("fs").readFileSync("compose.yaml", "utf8")), null, 2))'`

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: compose-praxis
    setup: |
      npm init -y > /dev/null
      npm install yaml --silent --no-audit --no-fund
    checks:
      - type: command
        run: node -e 'const c = require("yaml").parse(require("fs").readFileSync("compose.yaml", "utf8")); console.log(Object.keys(c.services).sort().join(","))'
        stdout_equals: db,web
        message: compose.yaml soll gültiges YAML sein und unter services genau die Dienste web und db enthalten.
      - type: command
        run: node -e 'const w = require("yaml").parse(require("fs").readFileSync("compose.yaml", "utf8")).services.web; console.log(w.image, JSON.stringify(w.ports), JSON.stringify(w.depends_on))'
        stdout_equals: 'nginx:1.29 ["8080:80"] ["db"]'
        message: web braucht image nginx:1.29, ports als Liste mit dem String "8080:80" und depends_on als Liste mit db.
      - type: command
        run: node -e 'const d = require("yaml").parse(require("fs").readFileSync("compose.yaml", "utf8")).services.db; console.log(d.image, d.environment.POSTGRES_DB, typeof d.environment.POSTGRES_PASSWORD, d.environment.POSTGRES_PASSWORD.length > 0)'
        stdout_equals: postgres:18 shop string true
        message: db braucht image postgres:18 und environment als Mapping mit POSTGRES_DB shop und einem POSTGRES_PASSWORD.
      - type: command
        run: node -e 'const c = require("yaml").parse(require("fs").readFileSync("compose.yaml", "utf8")); console.log(JSON.stringify(c.services.db.volumes), Object.keys(c.volumes || {}).join(","))'
        stdout_equals: '["db-daten:/var/lib/postgresql"] db-daten'
        message: db soll das Volume als Liste mit "db-daten:/var/lib/postgresql" einhängen, und auf oberster Ebene braucht es volumes mit dem Schlüssel db-daten.
    hints:
      - "Das Grundgerüst: `services:` – darunter eingerückt `web:` und `db:`, ganz unten auf oberster Ebene `volumes:`."
      - "Listen wie ports, depends_on und volumes schreibst du mit `- `. Den Port in Anführungszeichen: `- \"8080:80\"`."
      - "Ein Volume ohne Optionen deklarierst du als `db-daten:` mit leerem Wert – das ergibt null, und das ist hier richtig."
    solution: |
      ```yaml
      services:
        web:
          image: nginx:1.29
          ports:
            - "8080:80"
          depends_on:
            - db
        db:
          image: postgres:18
          environment:
            POSTGRES_DB: shop
            POSTGRES_PASSWORD: example
          volumes:
            - db-daten:/var/lib/postgresql

      volumes:
        db-daten:
      ```
  - id: schluessel-zuordnen
    type: dragdrop
    title: Welche Datei, welcher Schlüssel?
    description: Ordne jeden Schlüssel dem Werkzeug zu, dessen YAML-Datei ihn verwendet.
    targets:
      - { id: compose, label: Docker Compose }
      - { id: actions, label: GitHub Actions }
      - { id: k8s, label: Kubernetes }
    items:
      - { label: services, target: compose }
      - { label: depends_on, target: compose }
      - { label: runs-on, target: actions }
      - { label: "uses: actions/checkout@v7", target: actions }
      - { label: kind, target: k8s }
      - { label: replicas, target: k8s }
      - { label: apiVersion, target: k8s }
    hints:
      - Kubernetes beschreibt Objekte – jedes hat eine apiVersion und eine kind.
---
YAML lernst du nicht für sich allein, sondern weil dir drei Werkzeuge ständig YAML-Dateien vorlegen: Docker
Compose, GitHub Actions und Kubernetes. Das Format ist überall gleich – die erlaubten Schlüssel legt aber
jedes Werkzeug selbst fest. Wer die Grundstruktur kennt, findet sich in jeder dieser Dateien schnell zurecht.

## Docker Compose

Mit [[docker-compose|Docker Compose]] beschreibst du mehrere [[container|Container]], die zusammen eine
Anwendung bilden. Die Datei heißt heute `compose.yaml` (früher `docker-compose.yml`):

```yaml title="compose.yaml"
services:
  web:
    image: nginx:1.29
    ports:
      - "8080:80"
    depends_on:
      - db
  db:
    image: postgres:18
    environment:
      POSTGRES_DB: shop
      POSTGRES_PASSWORD: example   # nur lokal, echte Werte in .env
    volumes:
      - db-daten:/var/lib/postgresql

volumes:
  db-daten:
```

| Schlüssel | Bedeutung |
|---|---|
| `services` | Mapping aller Dienste, der Name ist frei wählbar |
| `image` | welches [[docker-image\|Image]] gestartet wird |
| `ports` | Liste `"Host:Container"`, immer als String |
| `environment` | [[umgebungsvariable\|Umgebungsvariablen]] als Mapping oder als Liste `- KEY=wert` |
| `volumes` | Daten, die einen Neustart überleben |

Der früher übliche Schlüssel `version:` ganz oben ist veraltet und wird ignoriert.

> [!TIPP]
> `docker compose config` liest deine Datei, ergänzt Standardwerte und gibt das Ergebnis aus – oder meldet
> genau, welcher Schlüssel falsch ist.

## GitHub Actions

Eine [[workflow|Workflow]]-Datei für [[github-actions|GitHub Actions]] liegt unter `.github/workflows/` und
beschreibt, **wann** (`on`) welche **Jobs** auf welchem Rechner (`runs-on`) laufen:

```yaml title=".github/workflows/ci.yml"
name: CI
on:
  push:
    branches: [main]
  pull_request:
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 24
      - name: Tests
        run: |
          npm ci
          npm test
```

`steps` ist eine Liste von Mappings: Jeder Schritt nutzt entweder eine fertige Action (`uses`) oder führt
Befehle aus (`run`). Für mehrere Befehle nimmst du den Literal-Stil `|` aus der letzten Lektion.

> [!ACHTUNG]
> Der Schlüssel `on` ist in YAML 1.1 ein Boolean. GitHub liest ihn richtig, aber manche Linter oder ältere
> Werkzeuge zeigen dann `true:` statt `on:` an. Kein Grund zur Panik – das ist das Norway-Problem in klein.
> Die Versionen der Actions (`@v7`) ändern sich übrigens mit der Zeit; die aktuelle steht im jeweiligen Repository.

## Kubernetes

[[kubernetes|Kubernetes]] betreibt Container auf vielen Servern. Jedes Objekt – ein Deployment, ein Service –
wird in einem **Manifest** beschrieben, das immer mit denselben vier Schlüsseln beginnt:

```yaml title="deployment.yaml"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  labels:
    app: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: nginx:1.29
          ports:
            - containerPort: 80
```

| Schlüssel | Bedeutung |
|---|---|
| `apiVersion` | welche Version der Kubernetes-API |
| `kind` | welche Art Objekt |
| `metadata` | Name und Labels |
| `spec` | der gewünschte Zustand |

Oft stehen mehrere Objekte in einer Datei, getrennt durch `---`. Die tiefe Verschachtelung macht deutlich,
warum saubere Einrückung so wichtig ist.

## Typische Fehler und wie du sie findest

In allen drei Werkzeugen passieren dieselben Fehler:

- **falsche Ebene**: Ein Schlüssel ist ein Leerzeichen zu weit links und gehört plötzlich zum Elternelement,
- **Liste statt Mapping** (oder umgekehrt): `environment` als `- KEY=wert` und als `KEY: wert` gemischt,
- **Typfehler**: Ports, Versionen oder `on`/`off` ohne Anführungszeichen,
- **Tippfehler im Schlüssel**: `depend_on` statt `depends_on` – gültiges YAML, aber das Werkzeug ignoriert es
  oder meldet einen unbekannten Schlüssel.

> [!FEHLER]
> **„Der Parser meldet nichts, also ist alles richtig.“** Der YAML-Parser prüft nur die Syntax. Ob ein
> Schlüssel für Compose oder Kubernetes einen Sinn ergibt, weiß nur das Werkzeug selbst. Nutze deshalb immer
> dessen Prüfbefehl.

> [!PRAXIS]
> Hilfreiche Prüfbefehle: `docker compose config` für Compose, `kubectl apply --dry-run=client -f datei.yaml`
> für Kubernetes und der Linter `actionlint` für GitHub Actions. Dein Editor kennt für alle drei ein Schema und
> schlägt dir gültige Schlüssel vor.

## Zusammenfassung

- YAML ist nur der Rahmen – die erlaubten Schlüssel legt jedes Werkzeug selbst fest.
- **Compose**: `services`, `image`, `ports` (als String), `environment`, `volumes`, `depends_on`.
- **GitHub Actions**: `on`, `jobs`, `runs-on`, `steps` mit `uses` oder `run: |`.
- **Kubernetes**: jedes Manifest hat `apiVersion`, `kind`, `metadata` und `spec`; mehrere Objekte trennt `---`.
- Syntax prüft der Parser, Bedeutung prüft das Werkzeug: `docker compose config`, `kubectl --dry-run`, `actionlint`.
