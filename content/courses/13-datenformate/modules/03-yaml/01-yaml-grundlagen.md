---
title: YAML-Grundlagen
summary: Mappings, Sequenzen, Skalare und Kommentare – wie YAML Struktur über Einrückung ausdrückt.
duration: 25
sources:
  - title: YAML 1.2.2 – Spezifikation
    url: https://yaml.org/spec/1.2.2/
  - title: yaml (npm) – Dokumentation
    url: https://eemeli.org/yaml/
  - title: Docker Docs – Compose file reference
    url: https://docs.docker.com/reference/compose-file/
quiz:
  - type: single
    question: Womit drückt YAML aus, dass ein Schlüssel zu einem anderen gehört?
    options:
      - Mit geschweiften Klammern
      - Mit der Einrückung durch Leerzeichen
      - Mit Tabs
      - Mit Semikolons am Zeilenende
    answer: 1
    explanation: Struktur entsteht in YAML durch Einrückung mit Leerzeichen. Tabs sind zur Einrückung ausdrücklich verboten.
  - type: match
    question: Welche YAML-Schreibweise ergibt welches JSON?
    pairs:
      - { left: "- a\n- b", right: "[\"a\", \"b\"]" }
      - { left: "a: 1", right: "{\"a\": 1}" }
      - { left: "a: ~", right: "{\"a\": null}" }
      - { left: "a: [1, 2]", right: "{\"a\": [1, 2]}" }
    explanation: Bindestriche bilden Sequenzen, Doppelpunkte Mappings, die Tilde ist null. Die Flow-Schreibweise mit Klammern ist ebenfalls erlaubt.
  - type: find-bug
    question: Ein Parser meldet einen Fehler. In welcher Zeile?
    language: yaml
    code: |
      app:
        name: shop
        port: 8080
         debug: true
    bug_line: 4
    explanation: debug ist drei statt zwei Leerzeichen eingerückt. Gleichrangige Schlüssel müssen exakt untereinander stehen.
  - type: multiple
    question: Welche Aussagen über YAML stimmen?
    options:
      - Kommentare beginnen mit `#`.
      - Nach dem Doppelpunkt eines Schlüssels muss ein Leerzeichen stehen.
      - Strings müssen immer in Anführungszeichen stehen.
      - Fast jedes gültige JSON ist auch gültiges YAML.
    answers: [0, 1, 3]
    explanation: Anführungszeichen sind in YAML meist optional – man braucht sie nur in bestimmten Fällen, die du in der nächsten Lektion kennenlernst. YAML 1.2 wurde so gestaltet, dass JSON (fast) eine Teilmenge ist.
tasks:
  - id: json-zu-yaml
    type: terminal
    title: JSON von Hand in YAML übersetzen
    description: |
      Im Ordner `yaml-grundlagen` liegt `team.json`. Zum Prüfen ist das npm-Paket `yaml` installiert.

      1. Sieh dir die Datei mit `jq . team.json` an.
      2. Lege `team.yaml` mit **genau denselben Daten** an – aber in YAML-Blockschreibweise: ohne `{`, `}`,
         `[` und `]`, Listen mit `-`.
      3. Prüfe dein Ergebnis mit:
         `node -e 'console.log(JSON.stringify(require("yaml").parse(require("fs").readFileSync("team.yaml", "utf8"))))'`

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: yaml-grundlagen
    setup: |
      npm init -y > /dev/null
      npm install yaml --silent --no-audit --no-fund
      cat > team.json <<'JSON'
      {
        "team": "Plattform",
        "remote": true,
        "sprintTage": 10,
        "tags": ["backend", "ops"],
        "mitglieder": [
          {"name": "Ada", "rolle": "lead"},
          {"name": "Linus", "rolle": "dev"}
        ],
        "slack": null
      }
      JSON
    checks:
      - type: file_exists
        path: team.yaml
        message: Lege die Datei team.yaml an.
      - type: command
        run: node -e 'require("yaml").parse(require("fs").readFileSync("team.yaml", "utf8"))' && echo ok
        stdout_equals: ok
        message: team.yaml ist kein gültiges YAML. Prüfe Einrückung (nur Leerzeichen) und das Leerzeichen nach jedem Doppelpunkt.
      - type: command
        run: |
          node -e 'const fs = require("fs"); const a = require("yaml").parse(fs.readFileSync("team.yaml", "utf8")); const b = JSON.parse(fs.readFileSync("team.json", "utf8")); console.log(require("util").isDeepStrictEqual(a, b) ? "gleich" : "anders")'
        stdout_equals: gleich
        message: team.yaml enthält nicht dieselben Daten wie team.json. Achte auf Typen – true, 10 und null ohne Anführungszeichen – und auf die Schlüsselnamen.
      - type: command
        run: grep -c '[][{}]' team.yaml
        expect_exit: 1
        message: Nutze die Blockschreibweise ohne Klammern – Listen schreibst du mit Bindestrichen untereinander.
    hints:
      - "Ein Mapping schreibst du als `schluessel: wert`, eine Liste als eingerückte Zeilen mit `- `."
      - "Ein Listeneintrag, der ein Objekt ist: `- name: Ada` und darunter `rolle: lead` – genau unter `name` eingerückt."
      - "`null` kannst du als `null` oder `~` schreiben."
    solution: |
      ```yaml
      team: Plattform
      remote: true
      sprintTage: 10
      tags:
        - backend
        - ops
      mitglieder:
        - name: Ada
          rolle: lead
        - name: Linus
          rolle: dev
      slack: null
      ```
  - id: was-liest-der-parser
    type: steps
    title: Was liest der Parser?
    description: Du schreibst eine kleine `compose.yaml` Zeile für Zeile. Sag voraus, was der Parser daraus macht.
    steps:
      - situation: "Du schreibst `services:` und darunter, zwei Leerzeichen eingerückt, `web:`."
        question: Was ist `web` aus Sicht des Parsers?
        options:
          - Ein Schlüssel im Mapping, das zu `services` gehört
          - Ein neuer Schlüssel auf oberster Ebene
          - Ein Listeneintrag
        answer: 0
        explanation: Die tiefere Einrückung macht web zu einem Kind von services.
      - situation: "Unter `web:` schreibst du `image: nginx:1.29`."
        question: Wird der Wert korrekt als String gelesen, obwohl ein Doppelpunkt darin steht?
        options:
          - "Ja – ein Doppelpunkt ohne folgendes Leerzeichen ist Teil des Werts."
          - "Nein – jeder Doppelpunkt beginnt ein neues Mapping."
        answer: 0
        explanation: "Ein Mapping beginnt nur bei Doppelpunkt **mit** Leerzeichen danach. nginx:1.29 bleibt ein String."
      - situation: "Darunter folgt `ports:` und eine Zeile `- \"8080:80\"`."
        question: Was ergibt das?
        options:
          - "Den String \"8080:80\""
          - "Eine Liste mit dem einen String \"8080:80\""
          - "Ein Mapping 8080 → 80"
        answer: 1
        explanation: Der Bindestrich macht eine Sequenz. Die Anführungszeichen sorgen dafür, dass der Wert sicher ein String bleibt.
      - situation: "Du rückst die nächste Zeile `environment:` mit einem **Tab** ein."
        question: Was passiert?
        options:
          - Der Parser zählt den Tab als zwei Leerzeichen.
          - Der Parser bricht mit einem Fehler ab.
          - Die Zeile wird ignoriert.
        answer: 1
        explanation: Tabs sind zur Einrückung in YAML verboten. Stell deinen Editor so ein, dass er bei YAML-Dateien Leerzeichen einfügt.
---
JSON ist für Programme gemacht. Wenn aber Menschen eine Datei täglich lesen und von Hand ändern – eine
CI-Pipeline, eine Container-Konfiguration –, stören die vielen Klammern und Anführungszeichen. Dafür gibt es
[[yaml|YAML]]: dasselbe Datenmodell, aber mit Einrückung statt Klammern und mit Kommentaren.

## Warum YAML?

YAML (*YAML Ain't Markup Language*) ist ein Format für Daten, die Menschen schreiben. Die aktuelle Version
1.2 ist so gestaltet, dass fast jedes JSON auch gültiges YAML ist. Der Unterschied liegt in der Schreibweise:

![Dieselben Daten links als JSON, rechts als YAML](/assets/datenformate/json-vs-yaml.svg)

YAML bietet dir:

- **weniger Rauschen**: keine Klammern, meist keine Anführungszeichen,
- **Kommentare** mit `#`, um Entscheidungen direkt in der Datei zu erklären,
- **mehrzeilige Texte**, etwa für Shell-Befehle in einer Pipeline.

Der Preis: Einrückung trägt Bedeutung. Ein Leerzeichen zu viel ändert die Struktur oder bricht den Parser.

> [!MERKSATZ]
> YAML und JSON beschreiben dieselben Daten – YAML für Menschen, JSON für den Austausch zwischen Programmen.

## Mappings: Schlüssel und Wert

Ein [[yaml-mapping|Mapping]] ist das YAML-Gegenstück zum JSON-Objekt. Jede Zeile enthält einen Schlüssel,
einen Doppelpunkt, **ein Leerzeichen** und den Wert:

```yaml
name: shop
port: 8080
debug: false
```

Verschachtelung entsteht durch [[einrueckung|Einrückung]] mit Leerzeichen. Alle Schlüssel derselben Ebene
stehen exakt untereinander:

```yaml
db:
  host: db.example.com   # gehört zu db
  port: 5432             # gehört zu db
cache: redis             # wieder oberste Ebene
```

Wie viele Leerzeichen du nimmst, ist egal – Hauptsache, du bleibst innerhalb einer Ebene konsistent. Üblich
sind zwei. **Tabs sind verboten.**

> [!FEHLER]
> **Tabs oder gemischte Einrückung.** Kopierst du YAML aus einer Webseite oder einem Chat, rutschen oft Tabs
> oder geschützte Leerzeichen hinein. Der Parser meldet dann „Tabs are not allowed as indentation“ – oder
> schlimmer: Ein Schlüssel landet still auf der falschen Ebene.

## Sequenzen: Listen mit Bindestrich

Eine [[yaml-sequenz|Sequenz]] ist eine Liste. Jeder Eintrag beginnt mit `- ` auf derselben Einrückung:

```yaml
tags:
  - backend
  - ops
```

Spannend wird es, wenn die Einträge selbst Mappings sind – das ist die häufigste Form in Konfigurationen:

```yaml
mitglieder:
  - name: Ada
    rolle: lead
  - name: Linus
    rolle: dev
```

Hier ist `mitglieder` eine Liste mit **zwei** Objekten. `rolle` steht genau unter `name`, weil beide zum
selben Listeneintrag gehören. Ein neuer Bindestrich beginnt ein neues Objekt.

## Skalare, Kommentare und Flow-Schreibweise

Werte ohne Anführungszeichen heißen *plain scalars*. Der Parser erkennt ihren Typ selbst:

| YAML | Typ | JSON |
|---|---|---|
| `name: Ada` | String | `"Ada"` |
| `port: 8080` | Zahl | `8080` |
| `aktiv: true` | Boolean | `true` |
| `slack: null` oder `slack: ~` | null | `null` |
| `name: "Ada"` / `name: 'Ada'` | String | `"Ada"` |

In **doppelten** Anführungszeichen gelten Escape-Sequenzen wie `\n`. In **einfachen** steht alles wörtlich da;
ein einfaches Anführungszeichen schreibst du dort doppelt: `'It''s fine'`.

Kurze Listen und Objekte darfst du auch wie in JSON schreiben – das heißt *Flow-Schreibweise*:

```yaml
branches: [main, develop]
limits: {cpu: 1, memory: 512M}
```

Eine Datei kann mehrere Dokumente enthalten, getrennt durch eine Zeile mit `---`. Das nutzt etwa Kubernetes,
um mehrere Objekte in einer Datei zu beschreiben.

## YAML prüfen

Anders als für JSON gibt es kein Standardwerkzeug, das auf jedem System installiert ist. Du hast drei Wege:

- **Im Editor**: VS Code und PhpStorm markieren YAML-Fehler sofort und kennen viele Schemas, etwa für
  GitHub Actions oder Docker Compose.
- **Mit dem Werkzeug selbst**: `docker compose config` prüft und zeigt die fertige Konfiguration.
- **Mit einer Bibliothek**: In Node.js liest das npm-Paket `yaml` eine Datei ein.

```bash title="Terminal"
node -e 'console.log(require("yaml").parse(require("fs").readFileSync("team.yaml", "utf8")))'
```

> [!PRAXIS]
> Lass dir YAML im Zweifel als JSON ausgeben. Dann siehst du sofort, ob ein Wert dort gelandet ist, wo du ihn
> vermutest – und welchen Typ er bekommen hat.

## Zusammenfassung

- YAML beschreibt dasselbe Datenmodell wie JSON, aber für Menschen lesbar und mit Kommentaren (`#`).
- **Mappings**: `schluessel: wert` – mit Leerzeichen nach dem Doppelpunkt.
- **Sequenzen**: Einträge mit `- `, häufig sind Listen von Mappings.
- Struktur entsteht durch Einrückung mit **Leerzeichen**, Tabs sind verboten.
- Anführungszeichen sind meist optional; `[…]` und `{…}` sind als Flow-Schreibweise erlaubt.
- Prüfe YAML im Editor, mit dem Zielwerkzeug oder per Bibliothek – am besten als JSON-Ausgabe.
