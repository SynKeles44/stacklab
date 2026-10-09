---
title: Versionsmanager – mise, nvm und Co.
summary: Warum jedes Projekt seine eigenen Runtime-Versionen braucht und wie du sie mit mise (oder nvm und .nvmrc) im Repository festlegst.
duration: 25
sources:
  - title: mise – Getting Started
    url: https://mise.jdx.dev/getting-started.html
  - title: mise – Konfiguration (mise.toml)
    url: https://mise.jdx.dev/configuration.html
  - title: mise – mise use
    url: https://mise.jdx.dev/cli/use.html
  - title: nvm – README (.nvmrc)
    url: https://github.com/nvm-sh/nvm#nvmrc
quiz:
  - type: single
    question: Was macht `mise use node@24` in einem Projektordner?
    options:
      - Es installiert Node.js 24 global für alle Projekte und ändert sonst nichts.
      - Es installiert Node.js 24 bei Bedarf und trägt `node = "24"` in die `mise.toml` des Projekts ein.
      - Es löscht alle anderen Node.js-Versionen.
    answer: 1
    explanation: "`mise use` installiert die Version, falls sie fehlt, und hält sie in der Projekt-Konfiguration fest. Mit `-g` schreibt es stattdessen in die globale Konfiguration."
  - type: match
    question: Ordne jede Datei ihrem Werkzeug zu.
    pairs:
      - { left: ".nvmrc", right: "nvm (nur Node.js)" }
      - { left: "mise.toml", right: "mise (viele Tools)" }
      - { left: ".tool-versions", right: "asdf (von mise ebenfalls gelesen)" }
    explanation: nvm kennt nur Node.js. mise und asdf verwalten viele Tools; mise liest auch `.tool-versions` von asdf.
  - type: multiple
    question: Welche Vorteile hat es, die Versionen im Repository festzuhalten?
    options:
      - Alle im Team nutzen dieselben Versionen.
      - Der Code wird automatisch schneller.
      - Beim Wechsel in einen anderen Projektordner wird automatisch die passende Version aktiv.
      - Ein Versionssprung ist als Commit nachvollziehbar.
    answers: [0, 2, 3]
    explanation: Versionen im Repository machen die Umgebung reproduzierbar und Änderungen daran prüfbar. Schneller wird der Code dadurch nicht.
  - type: cloze
    text: "In der `mise.toml` stehen die Versionen im Abschnitt `[___]`, zum Beispiel `node = \"24\"`."
    blanks:
      - [tools]
    explanation: Der Abschnitt `[tools]` listet alle Werkzeuge und ihre Versionen.
tasks:
  - id: mise-simulation
    type: simulated
    title: Ein Projekt mit mise einrichten
    description: |
      mise ist im Übungs-Terminal nicht installiert – hier probierst du es in einer Simulation aus.
      Du bist im Ordner eines neuen Projekts.

      1. Lege Node.js 24 für das Projekt fest: `mise use node@24`
      2. Lege zusätzlich PHP 8.5 fest: `mise use php@8.5`
      3. Schau dir die entstandene Datei an: `cat mise.toml`
      4. Prüfe, welche Node-Version jetzt aktiv ist: `node --version`
    prompt: "du@laptop:~/projekte/shop$"
    steps:
      - expect: "^mise\\s+use\\s+node@24$"
        output: |
          mise node@24.11.0 ✓ installed
          mise ~/projekte/shop/mise.toml tools: node@24.11.0
        hint: "Der Befehl lautet mise use node@24."
      - expect: "^mise\\s+use\\s+php@8\\.5$"
        output: |
          mise php@8.5.0 ✓ installed
          mise ~/projekte/shop/mise.toml tools: php@8.5.0
        hint: "Genauso wie bei Node: mise use php@8.5"
      - expect: "^cat\\s+mise\\.toml$"
        output: |
          [tools]
          node = "24"
          php = "8.5"
        hint: "Mit cat mise.toml siehst du den Inhalt."
      - expect: "^node\\s+(--version|-v)$"
        output: "v24.11.0"
        hint: "node --version"
    responses:
      - match: "^ls"
        output: "mise.toml"
      - match: "^mise\\s+ls"
        output: |
          Tool  Version  Source                       Requested
          node  24.11.0  ~/projekte/shop/mise.toml    24
          php   8.5.0    ~/projekte/shop/mise.toml    8.5
  - id: nvmrc-anlegen
    type: terminal
    title: Versionen für ein Projekt festhalten
    description: |
      Im Übungs-Terminal ist **nvm** installiert. Halte im Ordner `versionen` fest, welche Versionen das
      Projekt braucht – einmal für nvm, einmal für mise (die `mise.toml` kann mise später lesen, auch
      wenn es hier nicht installiert ist).

      1. Lege eine Datei `.nvmrc` an, die nur `24` enthält.
      2. Führe `nvm use` aus und prüfe mit `node --version`, dass Node.js 24 aktiv ist.
      3. Lege eine `mise.toml` an mit einem Abschnitt `[tools]` und den Einträgen
         `node = "24"`, `php = "8.5"` und `bun = "1.4"`.

      Der Ordner ist leer.
    workdir: versionen
    checks:
      - type: file_contains
        path: .nvmrc
        pattern: "^24\\s*$"
        message: Die .nvmrc soll nur die Zeile 24 enthalten.
      - type: command
        run: . "$NVM_DIR/nvm.sh" && nvm use > /dev/null && node --version
        stdout_matches: "^v24\\."
        message: Mit nvm use sollte Node.js 24 aktiv werden – prüfe den Inhalt der .nvmrc.
      - type: file_contains
        path: mise.toml
        pattern: "^\\[tools\\]"
        message: In der mise.toml fehlt der Abschnitt [tools].
      - type: file_contains
        path: mise.toml
        pattern: "^node\\s*=\\s*\"24\""
        message: In der mise.toml fehlt node = "24".
      - type: file_contains
        path: mise.toml
        pattern: "^php\\s*=\\s*\"8\\.5\""
        message: In der mise.toml fehlt php = "8.5".
      - type: file_contains
        path: mise.toml
        pattern: "^bun\\s*=\\s*\"1\\.4\""
        message: In der mise.toml fehlt bun = "1.4".
    hints:
      - "`echo 24 > .nvmrc` legt die Datei an."
      - "Strings stehen in TOML in doppelten Anführungszeichen: `node = \"24\"`."
    solution: |
      ```bash
      cd versionen
      echo 24 > .nvmrc
      nvm use
      node --version
      cat > mise.toml <<'EOF'
      [tools]
      node = "24"
      php = "8.5"
      bun = "1.4"
      EOF
      ```
---

Du arbeitest an zwei Projekten: Der alte Online-Shop läuft mit Node.js 22, die neue App braucht
Node.js 24. Installierst du Node einfach global, kann immer nur **eine** Version aktiv sein. Jedes Mal
umzuinstallieren ist mühsam und fehleranfällig. Genau dieses Problem lösen Versionsmanager.

![Ein Versionsmanager wählt pro Projektordner die passende Version](/assets/entwicklungsumgebung/versionsmanager.svg)

## Was ein Versionsmanager tut

Ein [[versionsmanager|Versionsmanager]] installiert mehrere Versionen einer
[[laufzeitumgebung|Laufzeitumgebung]] nebeneinander und schaltet je nach Projekt die richtige ein.
Er arbeitet in drei Schritten:

1. Er installiert Versionen in einen eigenen Ordner, zum Beispiel unter `~/.local/share/mise`.
2. Er liest aus einer Datei im Projekt, welche Version gewünscht ist.
3. Er passt die Variable [[path-variable|`PATH`]] so an, dass `node` auf die richtige Version zeigt.

Die Datei mit der Versionsangabe wird committet. So nutzt das ganze Team automatisch dieselbe Version.

> [!MERKSATZ]
> Die gewünschte Version ist Teil des Projekts – sie gehört als Datei ins Repository, nicht in den Kopf
> der Entwickler:innen.

## nvm und .nvmrc

[[nvm]] (*Node Version Manager*) ist der Klassiker für Node.js. Die Version steht in einer Datei
`.nvmrc` im Projektordner:

```bash title="nvm im Alltag"
echo 24 > .nvmrc      # Projekt braucht Node.js 24
nvm install           # installiert die Version aus .nvmrc
nvm use               # aktiviert sie in dieser Shell
node --version        # v24.11.0
```

nvm kann aber **nur Node.js**. Ein Laravel-Projekt mit React-Frontend braucht zusätzlich PHP, vielleicht
Bun und ein Datenbank-Werkzeug. Dafür bräuchtest du drei verschiedene Versionsmanager.

## mise: ein Werkzeug für alles

[[mise]] (gesprochen „mies“, französisch für „Aufstellung“) ist ein **polyglotter** Versionsmanager:
Er verwaltet Node.js, PHP, Bun, Python, Go und Hunderte weitere Tools mit einer einzigen Datei, der
`mise.toml`. Er ist der Nachfolger von asdf, mit dem er kompatibel ist – mise liest auch dessen
`.tool-versions`.

```toml title="mise.toml"
[tools]
node = "24"
php = "8.5"
bun = "1.4"
```

Die Datei ist im [[toml|TOML-Format]] geschrieben: Abschnitte in eckigen Klammern, darunter
`schluessel = "wert"`. `node = "24"` heißt „die neueste installierte 24er-Version“. Willst du eine exakte
Version, schreibst du `node = "24.11.0"`. mise akzeptiert neben `mise.toml` auch `.mise.toml`.

> [!TIPP]
> Mit `idiomatic_version_file_enable_tools` in den globalen Einstellungen kann mise auch eine
> vorhandene `.nvmrc` lesen. So kann ein Teil des Teams nvm nutzen, der andere mise.

## mise im Alltag

| Befehl | Wirkung |
|---|---|
| `mise use node@24` | Installiert bei Bedarf und trägt die Version in die `mise.toml` ein |
| `mise use -g node@24` | Dasselbe für die globale Konfiguration (alle Projekte) |
| `mise install` | Installiert alle Tools aus der `mise.toml` – ideal nach dem Klonen |
| `mise ls` | Zeigt installierte und aktive Versionen |
| `mise exec -- node app.js` | Führt einen Befehl mit den Projekt-Versionen aus |
| `mise trust` | Erlaubt mise, die Konfiguration eines fremden Projekts zu laden |

Damit mise beim Ordnerwechsel automatisch umschaltet, trägst du einmalig eine Zeile in deine
Shell-Konfiguration ein, etwa `eval "$(mise activate zsh)"` in `~/.zshrc`. Danach reicht ein `cd`.

> [!FEHLER]
> **„Ich habe mise installiert, aber node zeigt die alte Version.“** Meist fehlt die
> `mise activate`-Zeile in der Shell-Konfiguration, oder das Terminal wurde danach nicht neu gestartet.
> Prüfe mit `mise doctor`, ob mise richtig eingebunden ist.

> [!PRAXIS]
> In Projekten mit Laravel-Backend und JavaScript-Frontend legt eine einzige `mise.toml` Node, PHP und
> Bun fest. Hebt das Team auf eine neue Node-Version an, ist das ein Commit mit einer geänderten Zeile –
> und nach `mise install` haben alle die neue Version.

## Zusammenfassung

- Ein Versionsmanager installiert mehrere Versionen nebeneinander und aktiviert pro Projekt die richtige.
- nvm verwaltet nur Node.js; die Version steht in `.nvmrc`, aktiviert mit `nvm use`.
- mise verwaltet viele Tools in einer `mise.toml` (Abschnitt `[tools]`) und liest auch asdf-Dateien.
- `mise use node@24` installiert und trägt ein, `mise install` holt alle Tools nach dem Klonen.
- Die Versionsdatei wird committet – so arbeitet das ganze Team mit denselben Versionen.
