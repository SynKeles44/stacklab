---
title: authorized_keys und Dateirechte
summary: Wie dein öffentlicher Schlüssel auf den Server kommt, was in authorized_keys stehen darf und warum falsche Rechte den Login verhindern.
duration: 25
sources:
  - title: sshd(8) – Abschnitt AUTHORIZED_KEYS FILE FORMAT
    url: https://man.openbsd.org/sshd#AUTHORIZED_KEYS_FILE_FORMAT
  - title: sshd_config(5) – StrictModes und AuthorizedKeysFile
    url: https://man.openbsd.org/sshd_config
  - title: ssh-copy-id(1) – Handbuchseite
    url: https://man.openbsd.org/ssh-copy-id
quiz:
  - type: single
    question: Welche Rechte sind für den Ordner ~/.ssh auf dem Server richtig?
    options:
      - "777 – damit SSH auf jeden Fall hineinschreiben kann"
      - "755 – alle dürfen lesen"
      - "700 – nur der Besitzer darf lesen, schreiben und hineinwechseln"
      - "000 – niemand darf etwas"
    answer: 2
    explanation: >
      700 bedeutet rwx für den Besitzer und nichts für alle anderen. Ist ~/.ssh oder authorized_keys
      für andere beschreibbar, verweigert sshd mit StrictModes die Schlüssel-Anmeldung.
  - type: cloze
    text: "In der Rechte-Zahl steht r für ___, w für ___ und x für 1. Die Rechte rw------- entsprechen daher der Zahl ___."
    blanks:
      - ["4"]
      - ["2"]
      - ["600"]
    explanation: r=4, w=2, x=1 werden je Gruppe addiert. rw- = 4+2 = 6 für den Besitzer, Gruppe und Rest bekommen 0 – also 600.
  - type: find-bug
    question: Nach diesen Befehlen auf dem Server klappt die Anmeldung mit Schlüssel nicht mehr („Permission denied (publickey)“). Welche Zeile ist schuld?
    language: bash
    code: |
      mkdir -p ~/.ssh
      cat /tmp/laptop.pub >> ~/.ssh/authorized_keys
      chmod 600 ~/.ssh/authorized_keys
      chmod 777 ~/.ssh
    bug_line: 4
    explanation: >
      777 macht ~/.ssh für alle beschreibbar. Dann könnte jeder Nutzer auf dem Server einen eigenen
      Schlüssel unterschieben – sshd lehnt deshalb ab. Richtig ist chmod 700 ~/.ssh.
  - type: multiple
    question: Welche Optionen in einer authorized_keys-Zeile schränken einen Schlüssel ein?
    options:
      - from="203.0.113.0/24"
      - command="/usr/local/bin/backup.sh"
      - no-port-forwarding
      - ssh-ed25519
    answers: [0, 1, 2]
    explanation: >
      from begrenzt die erlaubten Absender-Adressen, command erzwingt einen festen Befehl und
      no-port-forwarding verbietet Tunnel. ssh-ed25519 ist dagegen nur der Schlüsseltyp.
tasks:
  - id: server-home-reparieren
    type: terminal
    title: Ein kaputtes ~/.ssh reparieren
    description: |
      Der Ordner `server-home/ada` spielt das Home-Verzeichnis von `ada` auf einem Server. Ein
      Kollege hat dort alles „freigeschaltet“ – und jetzt klappt keine Schlüssel-Anmeldung mehr.
      In `server-home` liegt außerdem `neuer-laptop.pub`, der öffentliche Schlüssel von Adas neuem Laptop.

      1. Hänge `neuer-laptop.pub` an `ada/.ssh/authorized_keys` an.
      2. Entferne die Zeile des gestohlenen alten Laptops (Kommentar `ada@alter-laptop`). Die Zeile `ada@desktop` bleibt.
      3. Setze die Rechte: `ada` auf `755`, `ada/.ssh` auf `700`, `ada/.ssh/authorized_keys` auf `600`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: server-home
    setup: |
      mkdir -p ada/.ssh .tmp
      for k in alter-laptop desktop neuer-laptop; do ssh-keygen -q -t ed25519 -N "" -C "ada@$k" -f ".tmp/$k"; done
      cat .tmp/alter-laptop.pub .tmp/desktop.pub > ada/.ssh/authorized_keys
      cp .tmp/neuer-laptop.pub neuer-laptop.pub
      rm -rf .tmp
      chmod 777 ada ada/.ssh
      chmod 666 ada/.ssh/authorized_keys
    checks:
      - type: command
        run: grep -c '' ada/.ssh/authorized_keys
        stdout_matches: "^2$"
        message: authorized_keys sollte genau zwei Zeilen haben (desktop und neuer-laptop).
      - type: command
        run: grep -qF "$(cut -d' ' -f2 neuer-laptop.pub)" ada/.ssh/authorized_keys
        message: Der Schlüssel aus neuer-laptop.pub fehlt in authorized_keys.
      - type: command
        run: grep -q 'ada@desktop$' ada/.ssh/authorized_keys && ! grep -q 'ada@alter-laptop' ada/.ssh/authorized_keys
        message: Der Schlüssel ada@desktop muss bleiben, ada@alter-laptop muss raus.
      - type: command
        run: ssh-keygen -l -f ada/.ssh/authorized_keys >/dev/null
        message: authorized_keys enthält eine kaputte Zeile – jede Zeile muss ein gültiger öffentlicher Schlüssel sein.
      - type: command
        run: stat -c '%a' ada ada/.ssh ada/.ssh/authorized_keys | tr '\n' ' '
        stdout_matches: "^755 700 600$"
        message: "Die Rechte stimmen noch nicht: ada → 755, ada/.ssh → 700, authorized_keys → 600."
    hints:
      - "`cat neuer-laptop.pub >> ada/.ssh/authorized_keys` hängt an, ohne zu überschreiben (zwei Größer-Zeichen!)."
      - "Eine Zeile entfernst du z. B. mit `grep -v 'ada@alter-laptop' datei > neu && mv neu datei` oder mit `sed -i '/ada@alter-laptop/d' datei`."
      - "`chmod 700 ada/.ssh` und `chmod 600 ada/.ssh/authorized_keys`; mit `stat -c '%a %n' …` prüfst du das Ergebnis."
    solution: |
      ```bash
      cd server-home
      cat neuer-laptop.pub >> ada/.ssh/authorized_keys
      sed -i '/ada@alter-laptop/d' ada/.ssh/authorized_keys
      chmod 755 ada
      chmod 700 ada/.ssh
      chmod 600 ada/.ssh/authorized_keys
      stat -c '%a %n' ada ada/.ssh ada/.ssh/authorized_keys
      ```
  - id: ssh-copy-id
    type: simulated
    title: Den Schlüssel mit ssh-copy-id verteilen
    description: |
      Der Server `203.0.113.10` erlaubt zur Einrichtung noch einmalig die Anmeldung per Passwort.

      1. Kopiere deinen öffentlichen Schlüssel mit `ssh-copy-id -i ~/.ssh/id_ed25519.pub ada@203.0.113.10` auf den Server.
      2. Gib das (beliebige) Passwort ein.
      3. Melde dich mit `ssh ada@203.0.113.10` an – diesmal ohne Passwort.
      4. Prüfe mit `ls -la ~/.ssh` die Rechte auf dem Server.
    prompt: "du@laptop:~$"
    steps:
      - expect: "^ssh-copy-id\\s+-i\\s+~/\\.ssh/id_ed25519\\.pub\\s+ada@203\\.0\\.113\\.10\\s*$"
        output: |
          /usr/bin/ssh-copy-id: INFO: Source of key(s) to be installed: "/home/du/.ssh/id_ed25519.pub"
          /usr/bin/ssh-copy-id: INFO: attempting to log in with the new key(s), to filter out any that are already installed
          /usr/bin/ssh-copy-id: INFO: 1 key(s) remain to be installed -- if you are prompted now it is to install the new keys
          ada@203.0.113.10's password:
        prompt: ""
        hint: "ssh-copy-id -i ~/.ssh/id_ed25519.pub ada@203.0.113.10"
      - expect: ".+"
        output: |

          Number of key(s) added: 1

          Now try logging into the machine, with: "ssh 'ada@203.0.113.10'"
          and check to make sure that only the key(s) you wanted were added.
        prompt: "du@laptop:~$"
        hint: Tippe irgendein Passwort und drücke Enter.
      - expect: "^ssh\\s+ada@203\\.0\\.113\\.10\\s*$"
        output: |
          Welcome to Ubuntu 24.04.3 LTS (GNU/Linux 6.8.0-79-generic x86_64)
        prompt: "ada@web-01:~$"
        hint: Jetzt ganz normal mit ssh ada@203.0.113.10 verbinden.
      - expect: "^ls\\s+-la?\\s+~/\\.ssh/?\\s*$"
        output: |
          total 12
          drwx------ 2 ada ada 4096 Oct  9 10:02 .
          drwxr-x--- 5 ada ada 4096 Oct  9 10:02 ..
          -rw------- 1 ada ada   97 Oct  9 10:02 authorized_keys
        prompt: "ada@web-01:~$"
        hint: "ls -la ~/.ssh"
    solution: |
      ```bash
      ssh-copy-id -i ~/.ssh/id_ed25519.pub ada@203.0.113.10
      ssh ada@203.0.113.10
      ls -la ~/.ssh    # drwx------ für .ssh, -rw------- für authorized_keys
      ```
---

Dein Schlüsselpaar liegt auf dem Laptop. Damit ein Server dich damit hereinlässt, muss er deinen
öffentlichen Schlüssel kennen – und zwar an einer ganz bestimmten Stelle, mit ganz bestimmten
Rechten. Genau hier scheitern die meisten ersten Versuche: Der Schlüssel liegt zwar auf dem Server,
aber `sshd` ignoriert ihn. In dieser Lektion lernst du, warum.

## Die Datei authorized_keys

Auf dem Server sucht der SSH-Daemon für den Benutzer `ada` in `/home/ada/.ssh/authorized_keys`.
Die Datei [[authorized-keys|authorized_keys]] ist eine Gästeliste: Jede Zeile ist ein öffentlicher
Schlüssel, der sich als `ada` anmelden darf.

```text title="/home/ada/.ssh/authorized_keys"
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDjYpZi1M7FQ8BPF2tj+tPY0a8dBps1c1p7xxuuMEoij ada@laptop-2026
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICX0yXIsjLVEAXHRjqzxldSDiEsA7J6o4PbGi+Li01FY ada@desktop
```

Das Format ist exakt das der `.pub`-Datei. Eine Zeile pro Schlüssel, keine Umbrüche mitten im
Schlüssel. Zeilen, die mit `#` beginnen, sind Kommentare. Willst du jemandem den Zugang entziehen,
löschst du einfach seine Zeile.

Der bequemste Weg ist `ssh-copy-id`. Es meldet sich (meist noch per Passwort) an, legt `~/.ssh`
an, hängt deinen Schlüssel an `authorized_keys` an und setzt die Rechte richtig:

```bash title="Schlüssel installieren"
ssh-copy-id -i ~/.ssh/id_ed25519.pub ada@203.0.113.10
```

Gibt es `ssh-copy-id` nicht (etwa unter Windows) oder willst du verstehen, was passiert, geht es
auch von Hand. Achte auf das doppelte `>>` – ein einfaches `>` würde alle bisherigen Schlüssel
überschreiben:

```bash title="Von Hand – auf dem Server ausgeführt"
mkdir -p ~/.ssh
chmod 700 ~/.ssh
cat /tmp/ada-laptop.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Bei Cloud-Servern trägst du den öffentlichen Schlüssel meist schon beim Anlegen in der Weboberfläche
des Anbieters ein. Der Anbieter schreibt ihn dann beim ersten Start in `authorized_keys`.

> [!FEHLER]
> **`>` statt `>>`.** `cat neu.pub > ~/.ssh/authorized_keys` ersetzt die gesamte Datei. Alle
> anderen, die sich bisher anmelden konnten – im schlimmsten Fall auch du selbst mit dem alten
> Schlüssel – sind ausgesperrt. Prüfe nach jeder Änderung mit `cat`, was in der Datei steht.

## Dateirechte in zwei Minuten

Unter Linux hat jede Datei [[dateirechte|Dateirechte]] für drei Gruppen: den **Besitzer**, die
**Gruppe** und **alle anderen**. Für jede gibt es drei Rechte: lesen (`r`), schreiben (`w`) und
ausführen (`x`; bei Ordnern: hineinwechseln). `ls -l` zeigt sie als Buchstaben:

```text title="ls -la ~/.ssh"
drwx------  2 ada ada 4096 Oct  9 10:02 .
-rw-------  1 ada ada   97 Oct  9 10:02 authorized_keys
```

Mit [[chmod|`chmod`]] setzt du die Rechte – meist als dreistellige Zahl. Jede Ziffer ist die Summe
aus `r = 4`, `w = 2` und `x = 1`, in der Reihenfolge Besitzer, Gruppe, andere:

| Zahl | Buchstaben | Bedeutung |
|---|---|---|
| `700` | `rwx------` | nur der Besitzer darf alles |
| `600` | `rw-------` | nur der Besitzer darf lesen und schreiben |
| `644` | `rw-r--r--` | Besitzer schreibt, alle dürfen lesen |
| `755` | `rwxr-xr-x` | Besitzer schreibt, alle dürfen lesen und hineinwechseln |
| `777` | `rwxrwxrwx` | alle dürfen alles – fast nie eine gute Idee |

## Warum sshd so pingelig ist

Wäre `~/.ssh` für alle beschreibbar, könnte jeder Benutzer auf dem Server seinen Schlüssel in
**deine** `authorized_keys` schreiben. Deshalb prüft `sshd` mit der Einstellung `StrictModes yes` (Standard) vor jeder Anmeldung die
Rechte. Ist dein Home-Verzeichnis, `~/.ssh` oder `authorized_keys` für Gruppe oder andere
beschreibbar, wird der Schlüssel ignoriert.

Die Empfehlung, mit der es immer funktioniert:

| Pfad | Rechte | Warum |
|---|---|---|
| Home-Verzeichnis (`/home/ada`) | höchstens `755` | darf nicht für andere beschreibbar sein |
| `~/.ssh` | `700` | nur du |
| `~/.ssh/authorized_keys` | `600` | nur du |
| privater Schlüssel (`id_ed25519`) | `600` | sonst bricht der Client mit „UNPROTECTED PRIVATE KEY FILE!“ ab |
| öffentlicher Schlüssel (`.pub`) | `644` | darf jeder lesen |

Auch der Besitzer muss stimmen: Hast du die Dateien als `root` angelegt, gehören sie nicht `ada`.
Das reparierst du mit `chown -R ada:ada /home/ada/.ssh`.

> [!MERKSATZ]
> **700 für den Ordner, 600 für die Dateien** – und das Home-Verzeichnis darf für niemand anderen
> beschreibbar sein. Fast jedes „Permission denied (publickey)“ trotz richtigem Schlüssel ist ein
> Rechteproblem.

Scheitert der Login trotzdem, hilft der Blick von beiden Seiten:

```bash title="Auf dem Laptop: Welcher Schlüssel wird angeboten?"
ssh -v ada@203.0.113.10
```

```text title="Ausschnitt"
debug1: Offering public key: /home/du/.ssh/id_ed25519 ED25519 SHA256:Px8x… agent
debug1: Authentications that can continue: publickey
debug1: No more authentication methods to try.
ada@203.0.113.10: Permission denied (publickey).
```

Auf dem Server steht der eigentliche Grund im Log des Daemons, etwa in `/var/log/auth.log` oder per
`journalctl -u ssh`: zum Beispiel `Authentication refused: bad ownership or modes for directory
/home/ada/.ssh`. Damit weißt du sofort, welcher Ordner falsche Rechte hat.

## Schlüssel einschränken mit Optionen

Vor den Schlüssel einer Zeile darfst du Optionen schreiben. Damit erlaubst du einem Schlüssel nur
genau das, was er braucht – ideal für Automatisierung:

```text title="authorized_keys mit Optionen"
from="203.0.113.0/24",no-port-forwarding,no-pty ssh-ed25519 AAAAC3Nz… ci@pipeline
command="/usr/local/bin/backup.sh",restrict ssh-ed25519 AAAAC3Nz… backup@nas
```

| Option | Wirkung |
|---|---|
| `from="…"` | nur von diesen Adressen oder Netzen erlaubt |
| `command="…"` | egal was der Client verlangt: es läuft immer dieser Befehl |
| `no-port-forwarding` | keine Tunnel über diesen Schlüssel |
| `no-pty` | keine interaktive Shell mit Terminal |
| `restrict` | schaltet alles Zusätzliche ab (Tunnel, Agent-Weiterleitung, Terminal …) |
| `expiry-time="20261231"` | Schlüssel gilt nur bis zu diesem Datum |

> [!PRAXIS]
> Backup-Systeme und Deploy-Pipelines bekommen in professionellen Setups eigene Schlüssel mit
> `restrict` und `command="…"`. Wird so ein Schlüssel gestohlen, kann der Angreifer damit nur genau
> das Backup-Skript starten – keine Shell, keine Tunnel.

## Zusammenfassung

- `~/.ssh/authorized_keys` auf dem Server listet alle öffentlichen Schlüssel, die sich als dieser Benutzer anmelden dürfen – eine Zeile pro Schlüssel.
- `ssh-copy-id -i schluessel.pub benutzer@host` installiert einen Schlüssel bequem; von Hand immer mit `>>` anhängen.
- Rechte als Zahl: r=4, w=2, x=1 je Besitzer, Gruppe, andere – `chmod 700 ~/.ssh`, `chmod 600 ~/.ssh/authorized_keys`.
- Wegen `StrictModes` ignoriert sshd Schlüssel, wenn Home, `~/.ssh` oder `authorized_keys` für andere beschreibbar sind.
- Fehlersuche: `ssh -v` auf dem Client, das Auth-Log auf dem Server.
- Optionen wie `from=`, `command=`, `no-port-forwarding` und `restrict` begrenzen, was ein Schlüssel darf.
