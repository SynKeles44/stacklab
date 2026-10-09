---
title: Was ist eine Entwicklungsumgebung?
summary: Editor, Runtimes, Datenbanken, Werkzeuge und Container – woraus deine Umgebung besteht und warum „bei mir läuft's“ kein Argument ist.
duration: 20
sources:
  - title: The Twelve-Factor App – Dev/prod parity
    url: https://12factor.net/de/dev-prod-parity
  - title: Node.js – Release-Zeitplan
    url: https://nodejs.org/en/about/previous-releases
  - title: Docker Docs – What is a container?
    url: https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/
quiz:
  - type: single
    question: Was ist die häufigste Ursache für „Bei mir läuft's aber“?
    options:
      - Der Code ist auf dem anderen Rechner kaputtgegangen.
      - Die beiden Rechner haben unterschiedliche Umgebungen, z. B. andere Runtime-Versionen oder fehlende Variablen.
      - Git hat beim Klonen Dateien verändert.
    answer: 1
    explanation: Der Code ist auf beiden Rechnern identisch – aber er läuft in unterschiedlichen Umgebungen. Versionen, Variablen, Dienste und Betriebssystem unterscheiden sich.
  - type: multiple
    question: Welche Dinge gehören zur Entwicklungsumgebung eines Web-Projekts?
    options:
      - Die installierte Node.js- oder PHP-Version
      - Eine lokale Datenbank
      - Die Farbe deines Schreibtischs
      - Umgebungsvariablen wie `DB_PASSWORD`
      - Der Editor mit seinen Erweiterungen
    answers: [0, 1, 3, 4]
    explanation: Alles, was beeinflusst, wie dein Code gebaut, gestartet und geprüft wird, gehört zur Umgebung. Der Schreibtisch zum Glück nicht.
  - type: match
    question: Ordne jedem Bestandteil ein Beispiel zu.
    pairs:
      - { left: "Laufzeitumgebung", right: "Node.js 24" }
      - { left: "Dienst", right: "PostgreSQL-Datenbank" }
      - { left: "Werkzeug", right: "make" }
      - { left: "Editor / IDE", right: "PhpStorm" }
    explanation: Laufzeitumgebungen führen deinen Code aus, Dienste stellt dein Code als Gegenstelle bereit, Werkzeuge automatisieren Arbeit, der Editor ist dein Arbeitsplatz.
  - type: cloze
    text: Der Befehl `command -___ node` gibt den Pfad zu `node` aus – oder nichts, wenn es nicht installiert ist.
    blanks:
      - [v]
    explanation: "`command -v` ist die portable Art, in einem Shell-Skript zu prüfen, ob ein Programm verfügbar ist."
tasks:
  - id: bestandteile-zuordnen
    type: dragdrop
    title: Was gehört in welche Schicht?
    description: Ordne jedes Element der passenden Schicht einer Entwicklungsumgebung zu.
    targets:
      - { id: editor, label: Editor / IDE }
      - { id: runtime, label: Laufzeitumgebung }
      - { id: dienst, label: Dienst }
      - { id: werkzeug, label: Werkzeug }
    items:
      - { label: VS Code, target: editor }
      - { label: Zed, target: editor }
      - { label: PHP 8.5, target: runtime }
      - { label: Bun 1.4, target: runtime }
      - { label: MySQL-Datenbank, target: dienst }
      - { label: Redis-Cache, target: dienst }
      - { label: make, target: werkzeug }
      - { label: Git, target: werkzeug }
    hints:
      - Eine Laufzeitumgebung führt Code direkt aus. Ein Dienst läuft im Hintergrund und wird von deinem Code angesprochen.
  - id: werkzeug-inventur
    type: terminal
    title: Inventur deiner Umgebung
    description: |
      Bevor du eine Umgebung beschreiben kannst, musst du wissen, was installiert ist. Schreibe
      im Ordner `inventur` ein kleines Skript, das genau das herausfindet.

      1. Lege die Datei `inventur.sh` an. Erste Zeile: `#!/usr/bin/env bash`.
      2. Prüfe für jedes der Programme `git`, `node`, `php` und `make` mit `command -v`, ob es da ist.
      3. Gib für jedes Programm eine Zeile im Format `git: ok` oder `git: FEHLT` aus.
      4. Mach das Skript ausführbar und führe es aus: `./inventur.sh > ergebnis.txt`.

      Der Ordner ist leer – du musst nichts vorbereiten.
    workdir: inventur
    checks:
      - type: file_exists
        path: inventur.sh
        message: Die Datei inventur.sh fehlt noch.
      - type: command
        run: test -x inventur.sh
        message: inventur.sh ist noch nicht ausführbar (chmod +x inventur.sh).
      - type: command
        run: ./inventur.sh
        stdout_matches: "^git: ok$[\\s\\S]*^node: ok$[\\s\\S]*^php: ok$[\\s\\S]*^make: ok$"
        message: "Das Skript soll für git, node, php und make jeweils eine Zeile wie „git: ok“ ausgeben – in dieser Reihenfolge."
      - type: command
        run: env PATH=/nirgendwo /bin/bash ./inventur.sh
        stdout_matches: "^node: FEHLT$"
        message: "Wenn ein Programm nicht gefunden wird, soll „node: FEHLT“ erscheinen. Nutze if command -v … > /dev/null."
      - type: file_contains
        path: ergebnis.txt
        pattern: "^php: ok$"
        message: Speichere die Ausgabe mit ./inventur.sh > ergebnis.txt.
    hints:
      - Eine Schleife spart Tipparbeit, `for tool in git node php make; do … done`.
      - "`if command -v \"$tool\" > /dev/null; then echo \"$tool: ok\"; else echo \"$tool: FEHLT\"; fi`"
    solution: |
      ```bash
      cd inventur
      cat > inventur.sh <<'SKRIPT'
      #!/usr/bin/env bash
      for tool in git node php make; do
        if command -v "$tool" > /dev/null; then
          echo "$tool: ok"
        else
          echo "$tool: FEHLT"
        fi
      done
      SKRIPT
      chmod +x inventur.sh
      ./inventur.sh > ergebnis.txt
      cat ergebnis.txt
      ```
---

Du klonst das Projekt deiner neuen Kollegin, tippst `npm run dev` – und bekommst eine rote
Fehlermeldung. Sie schaut dir über die Schulter und sagt den berühmtesten Satz der Softwareentwicklung:
„Komisch, bei mir läuft's.“ Der Code ist auf beiden Rechnern Zeichen für Zeichen gleich. Trotzdem
verhält er sich anders. Warum? Weil Code nie alleine läuft, sondern immer in einer **Umgebung**.

![Die Schichten einer Entwicklungsumgebung: Editor, Werkzeuge, Laufzeitumgebungen, Dienste und Betriebssystem](/assets/entwicklungsumgebung/umgebung-schichten.svg)

## Was eine Entwicklungsumgebung ist

Eine [[entwicklungsumgebung|Entwicklungsumgebung]] ist alles auf deinem Rechner, was nötig ist, um an
einem Projekt zu arbeiten: es zu bearbeiten, zu starten, zu testen und zu prüfen. Stell sie dir wie
eine Werkstatt vor. Das Projekt ist das Möbelstück, an dem du baust. Die Werkstatt sind Werkbank,
Werkzeuge, Strom, Licht und das Material im Regal. Eine Tischlerin, die in eine fremde Werkstatt kommt,
kann nicht sofort loslegen, wenn dort die Säge fehlt oder der Strom eine andere Spannung hat.

In der Softwareentwicklung besteht die Werkstatt aus fünf Schichten:

| Schicht | Beispiele | Typische Frage |
|---|---|---|
| Editor / IDE | VS Code, PhpStorm, Zed | Womit schreibe ich den Code? |
| Werkzeuge | Git, make, Linter, Formatter | Was automatisiert meine Arbeit? |
| Laufzeitumgebungen | Node.js 24, PHP 8.5, Bun 1.4 | Was führt meinen Code aus? |
| Dienste | Datenbank, Cache, Mail-Testserver | Womit spricht mein Code? |
| Betriebssystem & Konfiguration | macOS, Linux, Windows, Umgebungsvariablen | Wo und mit welchen Einstellungen läuft alles? |

Der [[editor]] oder die [[ide|IDE]] ist dein Arbeitsplatz – darum geht es in der nächsten Lektion.
Eine [[laufzeitumgebung|Laufzeitumgebung]] (englisch *runtime*) ist das [[programm|Programm]], das deinen
Code tatsächlich ausführt: `node app.js` startet die Node.js-Runtime, `php artisan serve` die PHP-Runtime.
Eine [[datenbank|Datenbank]] ist ein typischer Dienst: Sie läuft im Hintergrund, und dein Code schickt ihr
Anfragen.

## Warum „works on my machine“ entsteht

Das Problem hat sogar einen eigenen Namen: [[works-on-my-machine|„Works on my machine“]]. Es entsteht
immer dann, wenn sich zwei Umgebungen unterscheiden, ohne dass es jemand merkt. Die häufigsten Ursachen:

1. **Andere Versionen.** Du hast Node.js 22, das Projekt nutzt aber eine Funktion aus Node.js 24.
   Auf dem Rechner der Kollegin läuft Node.js 24 – bei dir knallt es.
2. **Fehlende Konfiguration.** Das Projekt erwartet eine Variable `DB_PASSWORD`. Die Kollegin hat sie
   vor einem Jahr einmal gesetzt und längst vergessen. Bei dir fehlt sie.
3. **Fehlende Dienste.** Der Code verbindet sich mit einer Datenbank auf Port 5432. Bei der Kollegin
   läuft dort PostgreSQL, bei dir nichts.
4. **Betriebssystem-Unterschiede.** Windows trennt Zeilen in Textdateien anders als Linux, macOS
   unterscheidet bei Dateinamen standardmäßig nicht zwischen Groß- und Kleinschreibung, Linux schon.
5. **Unsichtbare Handarbeit.** Irgendwann hat jemand „schnell mal“ ein Paket global installiert oder
   eine Datei von Hand kopiert. Niemand hat es aufgeschrieben.

Allen fünf Ursachen ist eines gemeinsam: Die Umgebung existiert nur **im Kopf** oder **auf einem
einzigen Rechner**. Sie ist nirgends festgehalten.

> [!MERKSATZ]
> Code ist nur die halbe Wahrheit. Ob er läuft, entscheidet die Umgebung – und die muss genauso
> festgehalten werden wie der Code selbst.

## Die Lösung: Umgebung als Datei

Die Idee, die dieser ganze Kurs verfolgt, ist einfach: **Alles, was die Umgebung ausmacht, wird als
Datei ins [[repository|Repository]] gelegt.** Dann bekommt jede Person, die das Projekt klont, automatisch
auch die Beschreibung der Werkstatt mit. Für jede Schicht gibt es dafür ein bewährtes Werkzeug:

| Problem | Datei im Repository | Lektion |
|---|---|---|
| Unterschiedliche Einrückung und Zeilenenden | `.editorconfig` | EditorConfig |
| Unterschiedliche Runtime-Versionen | `mise.toml` oder `.nvmrc` | Versionsmanager |
| Fehlende Konfiguration | `.env.example` | Umgebungsvariablen |
| „Wie starte ich das noch mal?“ | `Makefile` | Task-Runner |
| Vergessene Prüfungen vor dem Commit | `.githooks/` oder `lefthook.yml` | Git-Hooks |
| Fehlende Dienste, anderes Betriebssystem | `compose.yaml`, `.devcontainer/` | Container |

> [!HINWEIS]
> Persönliche Einstellungen wie Shell-Aliase, Prompt oder deine Git-Identität gehören nicht ins
> Projekt, sondern in deine [[dotfiles|Dotfiles]] (`~/.zshrc`, `~/.gitconfig`). Viele Entwickler:innen
> versionieren sie in einem eigenen Repository und verlinken sie mit `ln -s` ins Home-Verzeichnis –
> natürlich ohne Secrets.

Am Ende dieses Kurses sieht der Einstieg in ein neues Projekt dann so aus:

```bash title="Ein neues Projekt in drei Befehlen"
git clone git@github.com:example/shop.git
cd shop
make setup
```

`make setup` installiert die richtigen Versionen, legt die `.env` an, startet die Datenbank und
richtet die Git-Hooks ein. Niemand muss eine Wiki-Seite mit 40 Schritten abarbeiten.

> [!PRAXIS]
> In professionellen Teams misst man oft, wie lange ein neues Teammitglied bis zum ersten lauffähigen
> Projekt braucht. Gute Teams schaffen das in unter einer Stunde – dank genau der Dateien aus der
> Tabelle oben. Schlechte Teams brauchen zwei Tage und drei Kolleg:innen, die nebenher helfen.

## Lokal, Container oder Cloud?

Es gibt drei grundsätzliche Wege, die Laufzeitumgebungen und Dienste bereitzustellen:

- **Lokal installiert:** Node.js, PHP und die Datenbank laufen direkt auf deinem
  [[betriebssystem|Betriebssystem]]. Das ist schnell und einfach, aber jede Person hat eine leicht
  andere Installation. Ein Versionsmanager wie [[mise]] macht diesen Weg trotzdem verlässlich.
- **In [[container|Containern]]:** Mit [[docker|Docker]] laufen Dienste (oder sogar die ganze Umgebung)
  in abgeschotteten Paketen, die auf jedem Rechner gleich sind. Sehr verbreitet für Datenbanken.
- **In der Cloud:** Dienste wie [[codespaces|GitHub Codespaces]] stellen dir eine fertige Umgebung im
  Browser bereit. Dein Rechner braucht dann fast nichts mehr außer einem Browser.

> [!FEHLER]
> **Programme global installieren und vergessen.** Ein `npm install -g irgendwas` oder ein
> `brew install` „nur mal schnell“ macht dein Projekt abhängig von etwas, das niemand sonst hat.
> Wenn ein Projekt ein Werkzeug braucht, gehört es in die Projektdateien – als Abhängigkeit in
> `package.json` bzw. `composer.json` oder als Tool in `mise.toml`.

## Inventur: Was ist eigentlich installiert?

Bevor du eine Umgebung beschreibst, musst du wissen, was da ist. Dafür gibt es zwei einfache Befehle:

```bash title="Ist ein Programm installiert?"
command -v node
# /home/learner/.nvm/versions/node/v24.11.0/bin/node
command -v gibtsnicht
# (keine Ausgabe, Exit-Code 1)
```

```bash title="Welche Version ist installiert?"
node --version     # v24.11.0
php --version      # PHP 8.5.0 (cli) ...
git --version      # git version 2.47.3
```

`command -v` ist in [[skript|Skripten]] die beste Wahl, weil es in jeder POSIX-[[shell]] funktioniert und
über den [[exit-code|Exit-Code]] meldet, ob das Programm gefunden wurde. Damit kannst du ein kleines
Prüfskript schreiben, das jedem neuen Teammitglied sofort sagt, was fehlt:

```bash title="check-tools.sh"
#!/usr/bin/env bash
fehlt=0
for tool in git node php; do
  if command -v "$tool" > /dev/null; then
    echo "$tool: ok ($("$tool" --version | head -n 1))"
  else
    echo "$tool: FEHLT"
    fehlt=1
  fi
done
exit $fehlt
```

Die Zeile `#!/usr/bin/env bash` ist der [[shebang|Shebang]]: Sie sagt dem System, mit welchem Programm
das Skript ausgeführt wird. `exit $fehlt` sorgt dafür, dass das Skript mit Exit-Code 1 endet, wenn etwas
fehlt – so können andere Werkzeuge (etwa ein Makefile) darauf reagieren.

## Zusammenfassung

- Eine Entwicklungsumgebung besteht aus Editor/IDE, Werkzeugen, Laufzeitumgebungen, Diensten und
  Betriebssystem samt Konfiguration.
- „Works on my machine“ entsteht, wenn sich Umgebungen unbemerkt unterscheiden: Versionen,
  Variablen, Dienste, Betriebssystem oder vergessene Handarbeit.
- Die Lösung: Die Umgebung wird als Dateien im Repository beschrieben (`.editorconfig`, `mise.toml`,
  `.env.example`, `Makefile`, Hooks, Dev-Container).
- Runtimes und Dienste können lokal, in Containern oder in der Cloud laufen – oft gemischt.
- Mit `command -v` und `--version` machst du Inventur und kannst sie in einem Skript automatisieren.
