---
title: Mehrzeilige Strings, Anker und YAML-Fallen
summary: Block-Strings mit | und >, Wiederverwendung mit Anker und Alias – und warum Norwegen in YAML manchmal „false“ heißt.
duration: 25
sources:
  - title: YAML 1.2.2 – Block Scalars (Kapitel 8.1)
    url: https://yaml.org/spec/1.2.2/#81-block-scalar-styles
  - title: YAML 1.2.2 – Anchors and Aliases (Kapitel 3.2.2.2)
    url: https://yaml.org/spec/1.2.2/#3222-anchors-and-aliases
  - title: YAML 1.1 – Boolean Type (Language-Independent Types)
    url: https://yaml.org/type/bool.html
  - title: Docker Docs – Fragments in Compose (Anker und Aliase)
    url: https://docs.docker.com/reference/compose-file/fragments/
quiz:
  - type: single
    question: "Was ergibt dieser YAML-Wert?\n\ntext: >\n  Hallo\n  Welt"
    options:
      - "\"Hallo\\nWelt\\n\""
      - "\"Hallo Welt\\n\""
      - "\"Hallo Welt\""
      - "\"  Hallo\\n  Welt\""
    answer: 1
    explanation: Der Folded-Stil > ersetzt einzelne Zeilenumbrüche durch Leerzeichen. Am Ende bleibt standardmäßig genau ein Zeilenumbruch stehen.
  - type: find-bug
    question: Ein älterer Parser liest die Liste der Lieferländer falsch. In welcher Zeile liegt das Problem?
    language: yaml
    code: |
      shop: demo
      laender:
        - DE
        - FR
        - NO
    bug_line: 5
    explanation: Ein Parser nach YAML 1.1 liest NO als Boolean false. Mit "NO" in Anführungszeichen bleibt es der Ländercode.
  - type: cloze
    text: "Mit `&` definierst du einen ___, mit `*` setzt du einen ___ ein, der auf dieselben Daten verweist."
    blanks:
      - [Anker, Anchor]
      - [Alias]
    explanation: "&name markiert einen Wert, *name wiederholt ihn an anderer Stelle. So vermeidest du Kopien in langen Konfigurationen."
  - type: multiple
    question: Welche Werte solltest du in YAML in Anführungszeichen setzen?
    options:
      - "Eine Version wie 1.10"
      - "Ein Text wie Hinweis: bitte lesen"
      - "Ein einfaches Wort wie nginx"
      - "Eine Postleitzahl wie 01234"
      - "Den Ländercode NO"
    answers: [0, 1, 3, 4]
    explanation: "1.10 würde zur Zahl 1.1, \"Hinweis: bitte lesen\" enthält einen Doppelpunkt mit Leerzeichen, 01234 verliert die führende Null, und NO wird in YAML 1.1 zu false. nginx ist eindeutig ein String."
  - type: match
    question: Ordne jedem Block-Indikator sein Ergebnis für die Zeilen „a“ und „b“ zu.
    pairs:
      - { left: "|", right: "\"a\\nb\\n\"" }
      - { left: "|-", right: "\"a\\nb\"" }
      - { left: ">", right: "\"a b\\n\"" }
    explanation: "| behält die Zeilenumbrüche, > faltet sie zu Leerzeichen. Das Minus entfernt den letzten Zeilenumbruch."
tasks:
  - id: norwegen-problem
    type: terminal
    title: Die Norwegen-Falle entschärfen
    description: |
      Im Ordner `yaml-fallen` liegt `config.yaml` für einen Online-Shop. Der Shop nutzt zwei Werkzeuge: eines
      liest YAML nach Version 1.2, ein älteres nach Version 1.1. Beide sollen **exakt dieselben** Werte sehen.
      Das Paket `yaml` ist installiert, mit diesem Befehl siehst du beide Lesarten:

      ```bash
      node -e 'const Y = require("yaml"), t = require("fs").readFileSync("config.yaml", "utf8"); for (const v of ["1.1", "1.2"]) console.log(v, JSON.stringify(Y.parse(t, { version: v })))'
      ```

      Ändere die Datei so, dass beide Versionen Folgendes lesen:

      1. `laender` ist die Liste der Strings `DE`, `AT` und `NO`.
      2. `version` ist der String `1.10`, `dateirechte` der String `0755`, `plz_lager` der String `01234`.
      3. `wartungsmodus` ist der Boolean `false`.
      4. `willkommen` ist der String `Hallo: schön, dass du da bist`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: yaml-fallen
    setup: |
      npm init -y > /dev/null
      npm install yaml --silent --no-audit --no-fund
      cat > config.yaml <<'YAML'
      # Länder, in die der Shop liefert
      laender:
        - DE
        - AT
        - NO
      version: 1.10
      dateirechte: 0755
      plz_lager: 01234
      wartungsmodus: off
      willkommen: Hallo: schön, dass du da bist
      YAML
    checks:
      - type: command
        run: |
          node -e 'const Y = require("yaml"), t = require("fs").readFileSync("config.yaml", "utf8"); Y.parse(t, { version: "1.1" }); Y.parse(t, { version: "1.2" }); console.log("ok")'
        stdout_equals: ok
        message: "config.yaml ist noch kein gültiges YAML. Achtung beim Willkommenstext – ein Doppelpunkt mit Leerzeichen beginnt sonst ein neues Mapping."
      - type: command
        run: |
          node -e 'const Y = require("yaml"), t = require("fs").readFileSync("config.yaml", "utf8"); console.log(["1.1", "1.2"].map(v => JSON.stringify(Y.parse(t, { version: v }).laender)).join(" "))'
        stdout_equals: '["DE","AT","NO"] ["DE","AT","NO"]'
        message: laender soll in beiden Versionen die Strings DE, AT und NO enthalten. In YAML 1.1 wird ein nacktes NO zu false.
      - type: command
        run: |
          node -e 'const Y = require("yaml"), t = require("fs").readFileSync("config.yaml", "utf8"); console.log(["1.1", "1.2"].map(v => { const d = Y.parse(t, { version: v }); return JSON.stringify([d.version, d.dateirechte, d.plz_lager]) }).join(" "))'
        stdout_equals: '["1.10","0755","01234"] ["1.10","0755","01234"]'
        message: version, dateirechte und plz_lager sollen Strings bleiben – mit allen Nullen. Setze sie in Anführungszeichen.
      - type: command
        run: |
          node -e 'const Y = require("yaml"), t = require("fs").readFileSync("config.yaml", "utf8"); console.log(["1.1", "1.2"].map(v => JSON.stringify(Y.parse(t, { version: v }).wartungsmodus)).join(" "))'
        stdout_equals: false false
        message: wartungsmodus soll in beiden Versionen der Boolean false sein. off ist nur in YAML 1.1 ein Boolean – schreibe ihn eindeutig.
      - type: command
        run: |
          node -e 'const Y = require("yaml"), t = require("fs").readFileSync("config.yaml", "utf8"); console.log(Y.parse(t).willkommen)'
        stdout_equals: "Hallo: schön, dass du da bist"
        message: 'willkommen soll genau den Text „Hallo: schön, dass du da bist“ enthalten – setze ihn in Anführungszeichen.'
    hints:
      - "Starte den Befehl aus der Beschreibung. Zuerst musst du den Syntaxfehler beim Willkommenstext beheben, sonst bricht der Parser ab."
      - "Alles, was ein String bleiben soll, aber wie eine Zahl, ein Boolean oder ein Mapping aussieht, kommt in Anführungszeichen: `- \"NO\"`, `version: \"1.10\"`."
      - "Für den Boolean schreibst du einfach `false` – das verstehen beide Versionen gleich."
    solution: |
      ```yaml
      # Länder, in die der Shop liefert
      laender:
        - DE
        - AT
        - "NO"
      version: "1.10"
      dateirechte: "0755"
      plz_lager: "01234"
      wartungsmodus: false
      willkommen: "Hallo: schön, dass du da bist"
      ```
  - id: wie-liest-yaml-11
    type: dragdrop
    title: Wie liest ein YAML-1.1-Parser?
    description: Ältere Parser (zum Beispiel PyYAML oder ältere Go-Bibliotheken) nutzen YAML 1.1. Ordne jeden Wert dem Typ zu, den so ein Parser daraus macht.
    targets:
      - { id: string, label: String }
      - { id: zahl, label: Zahl }
      - { id: boolean, label: Boolean }
      - { id: leer, label: "null" }
    items:
      - { label: "NO", target: boolean }
      - { label: "on", target: boolean }
      - { label: '"NO"', target: string }
      - { label: "'0755'", target: string }
      - { label: "nginx:1.29", target: string }
      - { label: "1.10", target: zahl }
      - { label: "0755", target: zahl }
      - { label: "~", target: leer }
    hints:
      - In YAML 1.1 sind y, yes, no, on und off in allen Schreibweisen Booleans.
      - Anführungszeichen machen immer einen String daraus.
---
Mit Mappings und Sequenzen schreibst du schon die meisten YAML-Dateien. Drei Themen fehlen noch: lange Texte
über mehrere Zeilen, Wiederverwendung von Blöcken – und eine Reihe von Fallen, in denen YAML einen Wert
anders liest, als du ihn gemeint hast.

## Mehrzeilige Strings mit | und >

In Pipelines stehen oft mehrere Shell-Befehle untereinander, in Konfigurationen lange Texte. Dafür gibt es
zwei [[block-scalar|Block-Scalars]]:

![Literal-Stil mit | und Folded-Stil mit > im Vergleich](/assets/datenformate/block-scalars.svg)

| Indikator | Name | Zeilenumbrüche | typischer Einsatz |
|---|---|---|---|
| `\|` | Literal | bleiben erhalten | Shell-Befehle, Skripte, Zertifikate |
| `>` | Folded | werden zu Leerzeichen | lange Fließtexte |

Der Text beginnt in der Zeile **nach** dem Indikator und wird tiefer eingerückt als der Schlüssel. Die
gemeinsame Einrückung gehört nicht zum Wert.

Ein angehängtes `-` oder `+` steuert das Ende: `|-` entfernt den letzten Zeilenumbruch, `|+` behält alle
Leerzeilen am Ende. Ohne Zusatz bleibt genau **ein** Zeilenumbruch stehen.

```yaml
run: |
  npm ci
  npm test
```

> [!MERKSATZ]
> `|` behält jede Zeile, `>` faltet Zeilen zu einem Absatz. Für Befehle nimmst du fast immer `|`.

## Anker und Aliase

Lange Konfigurationen wiederholen sich: Drei Dienste bekommen dieselben Umgebungsvariablen. Statt zu
kopieren, setzt du einen [[anker-und-alias|Anker]] mit `&name` und verweist mit dem Alias `*name` darauf:

```yaml
x-standard-env: &standard-env
  TZ: Europe/Berlin
  LOG_LEVEL: info

services:
  web:
    environment: *standard-env
  worker:
    environment: *standard-env
```

Willst du einen Block übernehmen **und ergänzen**, gibt es den Merge-Schlüssel `<<`:

```yaml
  worker:
    environment:
      <<: *standard-env
      QUEUE: emails
```

Der Merge-Schlüssel stammt aus YAML 1.1 und ist nicht Teil des 1.2-Kerns. Docker Compose und viele andere
Werkzeuge unterstützen ihn trotzdem. GitHub Actions unterstützt Anker erst seit Kurzem – prüfe im Zweifel die
Dokumentation des Werkzeugs.

> [!PRAXIS]
> In Docker Compose werden Schlüssel, die mit `x-` beginnen, ignoriert. Dort legt man deshalb gern
> wiederverwendbare Blöcke mit Ankern ab.

## Das Norway-Problem

YAML errät den Typ eines Werts ohne Anführungszeichen. Das ist bequem, aber gefährlich. Das berühmteste
Beispiel ist das [[norway-problem|Norway-Problem]]: Der Ländercode `NO` für Norwegen wird in YAML 1.1 zum
Boolean `false`.

Die Version 1.2 hat die Regeln stark vereinfacht. Viele Werkzeuge nutzen aber noch Parser nach 1.1 – und du
weißt nicht immer, welcher Parser deine Datei liest.

| Wert ohne Anführungszeichen | YAML 1.1 | YAML 1.2 |
|---|---|---|
| `NO`, `yes`, `on`, `off` | Boolean | String |
| `0755` | Oktalzahl 493 | Zahl 755 |
| `1.10` | Zahl 1.1 | Zahl 1.1 |
| `01234` (Postleitzahl) | Zahl | Zahl 1234 |
| `22:22` | Zahl 1342 (Basis 60) | String |
| `~`, `null` | null | null |

Beachte: `1.10` und `0755` gehen in **beiden** Versionen kaputt. Eine Version „1.10“ wird zu 1.1, die
Dateirechte verlieren ihre führende Null.

> [!FEHLER]
> **Versionen, Postleitzahlen, IDs und Ländercodes ohne Anführungszeichen.** Alles, was zwar wie eine Zahl
> oder ein Wort aussieht, aber ein **Text** sein soll, gehört in Anführungszeichen: `"1.10"`, `"01234"`, `"NO"`.

## Wann brauchst du Anführungszeichen?

Die Faustregel: Setze Anführungszeichen, sobald ein Wert **nicht eindeutig** ein normaler Text ist.

| Situation | Beispiel | Richtig |
|---|---|---|
| enthält `: ` | `Hinweis: lesen` | `"Hinweis: lesen"` |
| enthält ` #` | `Farbe #fff` | `"Farbe #fff"` |
| beginnt mit `*`, `&`, `!`, `[`, `{`, `>`, `\|`, `%`, `@` oder Backtick | `*wichtig*` | `"*wichtig*"` |
| sieht wie Zahl, Boolean oder null aus | `1.10`, `yes`, `null` | `"1.10"`, `"yes"`, `"null"` |
| leerer String | – | `""` |

Doppelte Anführungszeichen kennen Escapes wie `\n`, einfache nehmen alles wörtlich. Für normale Texte sind
beide gleich gut – wichtig ist nur, dass du sie in den kritischen Fällen setzt.

## Zusammenfassung

- `|` behält Zeilenumbrüche, `>` faltet sie zu Leerzeichen; `-` und `+` steuern das Ende.
- `&anker` markiert einen Wert, `*anker` verwendet ihn wieder, `<<: *anker` mischt ihn in ein Mapping.
- YAML errät Typen: `NO`, `on`, `0755`, `1.10` oder `01234` werden schnell zu etwas anderem.
- YAML 1.1 und 1.2 unterscheiden sich – viele Werkzeuge nutzen noch 1.1.
- Im Zweifel Anführungszeichen setzen: bei `: `, ` #`, Sonderzeichen am Anfang und allem, was nur aussieht wie eine Zahl oder ein Boolean.
