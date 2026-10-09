---
title: Einrichten und erstes Repository
summary: Git installieren, Name, E-Mail, Standard-Branch und Editor auf der richtigen Ebene konfigurieren und mit git init, git add und git commit dein erstes Repository anlegen.
duration: 25
sources:
  - title: Pro Git (deutsch) – Git Basis-Konfiguration
    url: https://git-scm.com/book/de/v2/Erste-Schritte-Git-Basis-Konfiguration
  - title: Pro Git (deutsch) – Ein Git-Repository anlegen
    url: https://git-scm.com/book/de/v2/Git-Grundlagen-Ein-Git-Repository-anlegen
  - title: git-config Dokumentation
    url: https://git-scm.com/docs/git-config
  - title: Git-Downloads für alle Betriebssysteme
    url: https://git-scm.com/downloads
quiz:
  - type: single
    question: "`user.email` ist global auf `ada@example.com` und lokal im Repository `shop` auf `ada@firma.example.com` gesetzt. Welche Adresse landet in einem Commit im Repository `shop`?"
    options:
      - "ada@example.com, weil global wichtiger ist als lokal"
      - "ada@firma.example.com, weil die lokale Einstellung die globale überschreibt"
      - Git bricht ab, weil die Einstellung doppelt vorhanden ist.
      - Beide Adressen werden gespeichert.
    answer: 1
    explanation: >
      Git liest die Ebenen nacheinander: system, dann global, dann local. Steht derselbe Schlüssel auf
      mehreren Ebenen, gewinnt der zuletzt gelesene – also die lokale Einstellung des Repositorys.
  - type: match
    question: Ordne jeder Option die Datei zu, in die `git config` schreibt.
    pairs:
      - { left: "git config --system", right: "/etc/gitconfig (für alle Benutzer:innen)" }
      - { left: "git config --global", right: "~/.gitconfig (für dich, überall)" }
      - { left: "git config --local", right: ".git/config (nur dieses Repository)" }
    explanation: >
      Ohne Option schreibt `git config` lokal – du musst dich dafür aber in einem Repository befinden.
  - type: find-bug
    question: Nach diesen Befehlen bricht Adas erster Commit mit „Author identity unknown“ ab. In welcher Zeile steckt der Fehler?
    language: bash
    code: |
      git config --global user.name "Ada Lovelace"
      git config --global user.mail "ada@example.com"
      git config --global init.defaultBranch main
      git commit -m "docs: add readme"
    bug_line: 2
    explanation: >
      Der Schlüssel heißt `user.email`, nicht `user.mail`. Git akzeptiert den Tippfehler stillschweigend,
      weil du beliebige eigene Schlüssel anlegen darfst – die E-Mail-Adresse fehlt trotzdem.
  - type: multiple
    question: Was findest du direkt nach `git init` im Ordner `.git`?
    options:
      - Die Datei `HEAD`, die auf den aktuellen Branch zeigt
      - Die Datei `config` mit den lokalen Einstellungen
      - Den Ordner `objects`, in dem Git später alle Inhalte speichert
      - Eine Sicherungskopie aller Dateien deines Projekts
    answers: [0, 1, 2]
    explanation: >
      Direkt nach `git init` ist die Objektdatenbank noch leer. Eine Kopie deiner Dateien entsteht erst,
      wenn du sie vormerkst und committest.
  - type: cloze
    text: "Neue Dateien, die Git noch nicht verfolgt, heißen ___-Dateien. Mit `git config --list --show-___` siehst du zu jeder Einstellung, aus welcher Datei sie stammt."
    blanks:
      - [untracked]
      - [origin]
    explanation: "Untracked heißt „nicht verfolgt“ – erst `git add` und `git commit` nehmen eine Datei auf. `--show-origin` zeigt die Herkunftsdatei jeder Einstellung."
tasks:
  - id: git-installieren-mac
    type: simulated
    title: Git auf dem Mac mit Homebrew installieren
    description: |
      Dein neuer Mac hat nur die vorinstallierte Apple-Version von Git. Bring Git auf einen aktuellen Stand:

      1. Prüfe mit `git --version`, welche Version gerade installiert ist.
      2. Installiere Git mit Homebrew.
      3. Prüfe mit `which git`, welches Programm jetzt gefunden wird.
      4. Kontrolliere mit `git --version`, dass die neue Version aktiv ist.
    prompt: "ada@macbook ~ %"
    steps:
      - expect: "^git\\s+--version$"
        output: |
          git version 2.39.5 (Apple Git-154)
        hint: Tippe `git --version`.
      - expect: "^brew\\s+install\\s+git$"
        output: |
          ==> Downloading https://ghcr.io/v2/homebrew/core/git/manifests/2.47.0
          ==> Fetching dependencies for git: gettext and pcre2
          ==> Fetching git
          ==> Downloading https://ghcr.io/v2/homebrew/core/git/blobs/sha256:4f1c…
          ==> Installing git
          ==> Pouring git--2.47.0.arm64_sequoia.bottle.tar.gz
          ==> Caveats
          The Tcl/Tk GUIs (e.g. gitk, git-gui) are now in the `git-gui` formula.
          ==> Summary
          /opt/homebrew/Cellar/git/2.47.0: 1,684 files, 54.6MB
        hint: Der Homebrew-Befehl lautet `brew install <paket>`.
      - expect: "^which\\s+git$"
        output: |
          /opt/homebrew/bin/git
        hint: "`which git` zeigt den Pfad des Programms, das die Shell startet."
      - expect: "^git\\s+--version$"
        output: |
          git version 2.47.0
        hint: Prüfe die Version noch einmal mit `git --version`.
    responses:
      - match: "^brew\\s+--version"
        output: "Homebrew 4.4.0"
      - match: "^ls"
        output: "Desktop  Documents  Downloads  Projekte"
  - id: erstes-repo-anlegen
    type: terminal
    title: Einrichten und erster Commit
    description: |
      Der Ordner `erstes-repo` ist leer. Mach daraus ein eingerichtetes Repository mit einem ersten Commit:

      1. Wechsle in den Ordner `erstes-repo` und lege dort mit `git init` ein Repository an.
      2. Setze deinen Namen und deine E-Mail-Adresse **lokal**, also nur für dieses Repository
         (`git config user.name "…"` und `git config user.email "…"`). Nimm eine Platzhalter-Adresse
         wie `ada@example.com`.
      3. Erstelle eine Datei `README.md` mit einer Überschrift, zum Beispiel `# Mein erstes Repository`.
      4. Merke `README.md` vor und erstelle einen Commit.
      5. Am Ende soll `git status` „nothing to commit, working tree clean“ melden.

      Achte darauf, `git init` **im** Ordner `erstes-repo` auszuführen, nicht im Ordner darüber.
    workdir: erstes-repo
    checks:
      - type: dir_exists
        path: .git
        message: Im Ordner erstes-repo gibt es noch kein Repository. Wechsle hinein und führe git init aus.
      - type: command
        run: git config --local --get user.name
        stdout_matches: "\\S"
        message: Im Repository ist noch kein lokaler Name gesetzt. Nutze git config user.name "Ada Lovelace" (ohne --global).
      - type: command
        run: git config --local --get user.email
        stdout_matches: "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$"
        message: Die lokale E-Mail-Adresse fehlt oder sieht nicht wie eine E-Mail-Adresse aus (z. B. ada@example.com).
      - type: command
        run: git rev-list --count HEAD
        stdout_matches: "^[1-9][0-9]*$"
        message: Es gibt noch keinen Commit. Merke README.md vor und committe sie.
      - type: command
        run: git ls-files README.md
        stdout_equals: README.md
        message: README.md ist noch nicht im Repository gespeichert (git add, dann git commit).
      - type: command
        run: git status --porcelain | wc -l
        stdout_matches: "^\\s*0\\s*$"
        message: Es gibt noch nicht committete Änderungen oder untracked Dateien. git status muss "working tree clean" melden.
    hints:
      - "Die Reihenfolge ist: `git init`, Name und E-Mail setzen, Datei anlegen, `git add`, `git commit`."
      - "Ohne `--global` schreibt `git config` in `.git/config` – das geht erst nach `git init`."
      - "Eine Datei mit Inhalt legst du mit `echo \"# Mein erstes Repository\" > README.md` an."
    solution: |
      ```bash
      cd erstes-repo
      git init
      git config user.name "Ada Lovelace"
      git config user.email "ada@example.com"
      git config --list --show-origin
      echo "# Mein erstes Repository" > README.md
      git status
      git add README.md
      git commit -m "docs: add readme"
      git status
      git log
      ```
---

Bevor du deinen ersten Commit machen kannst, muss Git auf deinem Rechner laufen und wissen, **wer** du
bist – wie ein Brief, der einen Absender braucht. In dieser Lektion installierst du [[git]], richtest es
ein und verwandelst einen normalen [[ordner|Ordner]] in ein [[repository|Repository]] mit erstem Commit.

## Git installieren

Git ist ein [[programm|Programm]], das du einmal pro Rechner installierst. Am bequemsten geht das über
den [[paketmanager|Paketmanager]] deines [[betriebssystem|Betriebssystems]]. Die Befehle tippst du in
ein [[terminal|Terminal]].

| System | Befehl |
|---|---|
| macOS ([[homebrew]]) | `brew install git` |
| Windows (winget) | `winget install --id Git.Git -e --source winget` |
| Debian/Ubuntu | `sudo apt install git` |
| Fedora/RHEL | `sudo dnf install git` |

Auf macOS ist meist eine ältere Apple-Version vorinstalliert, deshalb nehmen Profis Homebrew. Unter
Windows bekommst du **Git for Windows** samt **Git Bash**. Danach prüfst du überall gleich:

```bash title="Terminal"
git --version
```

```text title="Ausgabe"
git version 2.47.0
```

Erscheint `command not found`, fehlt Git – oder das Terminal war schon vor der Installation offen.
Öffne dann ein **neues** Terminalfenster. Mit `which git` siehst du, welches Programm deine
[[shell|Shell]] tatsächlich startet: `/opt/homebrew/bin/git` ist die Homebrew-Version.

Im Stacklab-Übungs-Terminal ist Git bereits installiert. Du kannst sofort loslegen.

## Die drei Ebenen der Konfiguration

Git speichert Einstellungen in Textdateien, der [[git-konfiguration|Git-Konfiguration]]. Es gibt drei
Ebenen – wie eine Hausordnung, eine Regel für deine Wohnung und eine nur für dein Zimmer.

![Die drei Konfigurationsebenen system, global und local mit ihren Dateien](/assets/git/config-ebenen.svg)

| Ebene | Option | [[datei|Datei]] | Gilt für |
|---|---|---|---|
| system | `--system` | `/etc/gitconfig` | alle Benutzer:innen des Rechners |
| global | `--global` | `~/.gitconfig` | dich, in allen Repositorys |
| local | `--local` | `.git/config` | nur dieses eine Repository |

`~` steht für dein [[home-verzeichnis|Home-Verzeichnis]]. Git liest die Ebenen nacheinander, der zuletzt
gelesene Wert gewinnt. So steht global deine private Adresse und im Firmen-Repository lokal die dienstliche.

> [!MERKSATZ]
> Je näher am Repository, desto stärker: **local schlägt global, global schlägt system.**

## Name, E-Mail, Branch und Editor

Jeder [[commit|Commit]] speichert Name und E-Mail – ohne sie verweigert Git den Commit.

```bash title="Einmalige Einrichtung"
git config --global user.name "Ada Lovelace"
git config --global user.email "ada@example.com"
git config --global init.defaultBranch main
git config --global core.editor nano
```

| Schlüssel | Wozu? |
|---|---|
| `user.name` | Dein Name in jedem Commit. Anführungszeichen wegen des Leerzeichens! |
| `user.email` | Sollte zu deinem GitHub- oder GitLab-Konto passen. |
| `init.defaultBranch` | Name des [[standard-branch|Standard-Branches]] bei `git init`, heute meist `main`. |
| `core.editor` | [[editor|Editor]] für längere Nachrichten, z. B. `nano` oder `"code --wait"`. |

Bei VS Code ist `--wait` Pflicht: Ohne die Option kehrt der Befehl sofort zurück, und Git sieht eine
leere Nachricht. Voreingestellt ist oft `vim`, den viele Einsteiger:innen nicht wieder verlassen können.

`git config --get user.email` zeigt den Wert, der am Ende gilt. `git config --list --show-origin` zeigt
alle Einstellungen samt Herkunftsdatei – so erkennst du, welche Ebene überschreibt.

Im Stacklab-Terminal gibt es keine globale Identität. Setzt du Name und E-Mail mit `--global`, gilt das
für alle weiteren Aufgaben. Ohne `--global` gilt es nur im jeweiligen Repository.

> [!FEHLER]
> `git config --global user.name Ada Lovelace` **ohne** Anführungszeichen speichert nur `Ada` – ohne
> Fehlermeldung. Prüfe nach dem Setzen immer mit `git config --get user.name`.

## git init und der Ordner .git

```bash title="Projektordner anlegen"
mkdir mein-projekt
cd mein-projekt
git init
```

```text title="Ausgabe"
Initialized empty Git repository in /home/ada/mein-projekt/.git/
```

`git init` legt nur den versteckten Unterordner `.git` an (`ls -a` zeigt ihn). Vorhandene Dateien fasst
es nicht an. Darin liegt das ganze Gedächtnis des Projekts:

![Aufbau des Ordners .git mit HEAD, config, objects und refs](/assets/git/git-ordner.svg)

| Eintrag | Aufgabe |
|---|---|
| `HEAD` | merkt sich den aktuellen Branch: `ref: refs/heads/main` |
| `config` | lokale Einstellungen (Ebene `--local`) |
| `objects/` | die [[git-objektdatenbank|Objektdatenbank]] mit allen gespeicherten Inhalten |
| `refs/` | lesbare Namen für Commits, etwa [[branch|Branches]] |

Du änderst in `.git` nie etwas von Hand. Löschst du den Ordner, ist die gesamte Historie weg – deine
aktuellen Dateien bleiben, alle früheren Stände sind verloren.

> [!FEHLER]
> **`git init` im Home-Verzeichnis** macht deinen ganzen persönlichen Ordner zum Repository. Prüfe vorher
> mit `pwd`, wo du bist. Pro Projekt gibt es genau einen Ordner `.git`, ganz oben – keine Repositorys im
> Repository.

## Der erste Commit

```bash title="Datei anlegen, vormerken, committen"
echo "# Mein Projekt" > README.md
git status
git add README.md
git commit -m "docs: add readme"
```

```text title="Ausgabe von git commit"
[main (root-commit) c7252ca] docs: add readme
 1 file changed, 1 insertion(+)
 create mode 100644 README.md
```

- Vor `git add` meldet `git status` die Datei als [[untracked-datei|untracked]]: Git sieht sie, verfolgt
  sie aber nicht.
- *root-commit* heißt: der allererste Commit. `c7252ca` ist der Anfang seiner Kennung.
- Danach meldet `git status` „nothing to commit, working tree clean“, und `git log` zeigt den Commit.

Erst legst du mit `git add` fest, **was** hineinkommt, dann speichert `git commit` den Schnappschuss
samt Nachricht (`-m` = *message*). Meldet Git „Author identity unknown“, fehlen Name und E-Mail.

> [!PRAXIS]
> Im Job legst du selten mit `git init` an – meist holst du ein bestehendes Repository mit `git clone`.
> Wer private und dienstliche Projekte mischt, prüft vor dem ersten Commit `git config --get user.email`.

## Zusammenfassung

- Git installierst du über den Paketmanager: `brew`, `winget`, `apt` oder `dnf`; `git --version` prüft.
- Einstellungen gibt es auf drei Ebenen – system, global, local. Die lokale gewinnt.
- Vor dem ersten Commit setzt du `user.name` und `user.email`, dazu `init.defaultBranch` und `core.editor`.
- `git init` legt den Ordner `.git` mit `HEAD`, `config`, `objects/` und `refs/` an.
- Der erste Commit entsteht mit `git add` und `git commit -m "…"`, `git log` zeigt ihn an.
