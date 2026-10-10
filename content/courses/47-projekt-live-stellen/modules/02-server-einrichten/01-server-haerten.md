---
title: Den frischen Server härten
summary: Eigener Benutzer statt root, Anmeldung nur mit Schlüssel, eine Firewall mit drei offenen Ports und automatische Sicherheitsupdates.
duration: 25
sources:
  - title: Ubuntu Server – OpenSSH server
    url: https://documentation.ubuntu.com/server/how-to/security/openssh-server/
  - title: Ubuntu Server – Firewall (ufw)
    url: https://documentation.ubuntu.com/server/how-to/security/firewalls/
  - title: Ubuntu Server – Automatic updates
    url: https://documentation.ubuntu.com/server/how-to/software/automatic-updates/
  - title: sshd_config(5)
    url: https://man.openbsd.org/sshd_config
quiz:
  - type: single
    question: Warum legst du einen eigenen Benutzer wie `deploy` an, statt immer als root zu arbeiten?
    options:
      - Weil root keine Dateien anlegen darf.
      - Damit ein Tippfehler oder ein kompromittierter Zugang nicht sofort das ganze System betrifft und Admin-Rechte bewusst per sudo genutzt werden.
      - Weil SSH root grundsätzlich nicht kennt.
      - Damit der Server schneller startet.
    answer: 1
    explanation: >
      Das ist das Prinzip der geringsten Rechte. Mit sudo nutzt du Admin-Rechte nur, wenn du sie brauchst,
      und jede Nutzung wird protokolliert.
  - type: find-bug
    question: In welcher Zeile dieses Firewall-Skripts sperrst du dich aus?
    language: bash
    code: |
      ufw default deny incoming
      ufw default allow outgoing
      ufw --force enable
      ufw allow OpenSSH
      ufw allow 80/tcp
      ufw allow 443/tcp
    bug_line: 3
    explanation: >
      Die Firewall wird eingeschaltet, bevor SSH erlaubt ist. Ist deine Verbindung danach weg, kommst du nur
      noch über die Notfall-Konsole des Anbieters herein. Erst erlauben, dann einschalten.
  - type: multiple
    question: Welche Ports braucht ein Webserver mit SSH-Zugang aus dem Internet?
    options:
      - 22 (SSH)
      - 80 (HTTP, für die Weiterleitung und Let's Encrypt)
      - 443 (HTTPS)
      - 3306 (MySQL)
    answers: [0, 1, 2]
    explanation: Die Datenbank lauscht nur lokal. Ein offener Datenbank-Port im Internet ist eines der häufigsten Einfallstore.
  - type: cloze
    text: "Damit Sicherheitsupdates automatisch eingespielt werden, installierst du das Paket ___. Ob ein Neustart nötig ist, zeigt die Datei /var/run/___."
    blanks:
      - [unattended-upgrades]
      - [reboot-required]
    explanation: unattended-upgrades spielt Sicherheitsupdates täglich ein. Manche Updates (z. B. Kernel) wirken erst nach einem Neustart.
tasks:
  - id: haertung-schreiben
    type: terminal
    title: Härtung und Firewall als Dateien
    description: |
      Du bereitest die Härtung für deinen neuen Server vor – als Dateien, die du später hochlädst. Lege im
      Ordner `haertung` zwei Dateien an:

      1. `10-haertung.conf` (kommt später nach `/etc/ssh/sshd_config.d/`) mit diesen Einstellungen:
         `PasswordAuthentication no`, `KbdInteractiveAuthentication no`, `PermitRootLogin no`,
         `AllowUsers deploy`.
      2. `firewall.sh`, ein Bash-Skript mit `#!/usr/bin/env bash` und `set -euo pipefail`, das mit `ufw`:
         - eingehende Verbindungen standardmäßig verbietet (`ufw default deny incoming`),
         - ausgehende erlaubt (`ufw default allow outgoing`),
         - SSH, Port 80/tcp und 443/tcp erlaubt
         - und **erst ganz am Ende** die Firewall mit `ufw --force enable` einschaltet.

      Prüfe die Syntax deines Skripts mit `bash -n firewall.sh` (keine Ausgabe = in Ordnung).
    workdir: haertung
    checks:
      - type: file_exists
        path: 10-haertung.conf
        message: Die Datei 10-haertung.conf fehlt noch.
      - type: command
        run: |
          for k in PasswordAuthentication KbdInteractiveAuthentication PermitRootLogin; do
            grep -Eiq "^\s*$k\s+no\s*$" 10-haertung.conf || echo "fehlt $k"
          done
          grep -Eiq '^\s*AllowUsers\s+deploy\s*$' 10-haertung.conf || echo "fehlt AllowUsers"
        stdout_equals: ""
        message: In 10-haertung.conf fehlt mindestens eine der vier Einstellungen (jede in einer eigenen Zeile).
      - type: command
        run: grep -Eic '^\s*(PermitRootLogin|PasswordAuthentication)\s+yes' 10-haertung.conf
        expect_exit: 1
        message: Weder PermitRootLogin noch PasswordAuthentication dürfen auf yes stehen.
      - type: command
        run: bash -n firewall.sh && head -n1 firewall.sh
        stdout_matches: "^#!/usr/bin/env bash$"
        message: firewall.sh fehlt, hat einen Syntaxfehler oder beginnt nicht mit der Zeile #!/usr/bin/env bash.
      - type: file_contains
        path: firewall.sh
        pattern: "set -euo pipefail"
        message: Schreib `set -euo pipefail` an den Anfang, damit das Skript bei Fehlern abbricht.
      - type: command
        run: grep -E '^\s*ufw\s+default\s+deny\s+incoming' firewall.sh && grep -E '^\s*ufw\s+default\s+allow\s+outgoing' firewall.sh
        message: Es fehlen die Standardregeln `ufw default deny incoming` und `ufw default allow outgoing`.
      - type: command
        run: grep -Eq '^\s*ufw\s+allow\s+(OpenSSH|22(/tcp)?|ssh)\s*$' firewall.sh && grep -Eq '^\s*ufw\s+allow\s+80/tcp' firewall.sh && grep -Eq '^\s*ufw\s+allow\s+443/tcp' firewall.sh
        message: Erlaube SSH (`ufw allow OpenSSH`), `80/tcp` und `443/tcp`.
      - type: command
        run: grep -vE '^\s*(#|$)' firewall.sh | tail -n 1 | grep -Eq '^\s*ufw\s+(--force\s+)?enable\s*$'
        message: "`ufw --force enable` muss die letzte Zeile des Skripts sein – nach der Regel für SSH."
      - type: command
        run: grep -Eq '^\s*ufw\s+allow\s+(3306|5432|6379)' firewall.sh
        expect_exit: 1
        message: Datenbank- und Redis-Ports gehören nicht in die Firewall-Freigaben – sie lauschen nur lokal.
    hints:
      - "Die sshd-Datei ist eine einfache Liste: pro Zeile `Einstellung Wert`."
      - "Reihenfolge im Skript: Standardregeln → allow-Regeln → enable."
      - "`ufw --force enable` schaltet ohne Rückfrage ein – nötig, weil das Skript nicht interaktiv läuft."
    solution: |
      ```bash
      cd haertung
      cat > 10-haertung.conf <<'EOF'
      PasswordAuthentication no
      KbdInteractiveAuthentication no
      PermitRootLogin no
      AllowUsers deploy
      EOF
      cat > firewall.sh <<'EOF'
      #!/usr/bin/env bash
      set -euo pipefail

      ufw default deny incoming
      ufw default allow outgoing
      ufw allow OpenSSH
      ufw allow 80/tcp
      ufw allow 443/tcp
      ufw --force enable
      EOF
      bash -n firewall.sh
      ```
  - id: erster-login
    type: simulated
    title: Die erste Viertelstunde auf dem Server
    description: |
      Dein neuer VPS `203.0.113.10` ist bereit, dein öffentlicher Schlüssel wurde bei der Bestellung für root
      hinterlegt. Richte den Benutzer `deploy` ein:

      1. Melde dich an: `ssh root@203.0.113.10`
      2. Spiele alle Updates ein: `apt update && apt upgrade -y`
      3. Lege den Benutzer an: `adduser deploy`
      4. Gib ihm sudo-Rechte: `usermod -aG sudo deploy`
      5. Kopiere deinen Schlüssel zu ihm: `rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy`
      6. Installiere automatische Sicherheitsupdates: `apt install -y unattended-upgrades`
    prompt: "du@laptop:~$"
    steps:
      - expect: "^ssh\\s+root@203\\.0\\.113\\.10\\s*$"
        output: |
          Welcome to Ubuntu 26.04 LTS (GNU/Linux x86_64)
          Last login: Fri Oct  9 18:02:11 2026 from 198.51.100.7
        prompt: "root@web-01:~#"
        hint: "ssh root@203.0.113.10"
      - expect: "^apt(-get)?\\s+update\\s*&&\\s*apt(-get)?\\s+upgrade\\s+-y\\s*$"
        output: |
          Reading package lists... Done
          Calculating upgrade... Done
          27 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.
        hint: "apt update && apt upgrade -y"
      - expect: "^adduser\\s+deploy\\s*$"
        output: |
          info: Adding user `deploy' ...
          New password:
          Retype new password:
          passwd: password updated successfully
          info: Adding new user `deploy' to supplemental / extra groups `users' ...
        hint: "adduser deploy – das Passwort brauchst du später nur für sudo."
      - expect: "^usermod\\s+-aG\\s+sudo\\s+deploy\\s*$"
        output: ""
        hint: "usermod -aG sudo deploy"
      - expect: "^rsync\\s+--archive\\s+--chown=deploy:deploy\\s+~/\\.ssh\\s+/home/deploy/?\\s*$"
        output: ""
        hint: "rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy"
      - expect: "^apt(-get)?\\s+install\\s+-y\\s+unattended-upgrades\\s*$"
        output: |
          unattended-upgrades is already the newest version.
          0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.
        hint: "apt install -y unattended-upgrades"
    responses:
      - match: "^(ls|whoami|hostname)"
        output: "root"
    solution: |
      ```bash
      ssh root@203.0.113.10
      apt update && apt upgrade -y
      adduser deploy
      usermod -aG sudo deploy
      rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
      apt install -y unattended-upgrades
      ```
      Danach testest du in einem **zweiten** Terminal `ssh deploy@203.0.113.10` und `sudo -v`, bevor du die
      Härtung aktivierst.
---
Ein Server mit öffentlicher IP wird ab der ersten Minute von Bots abgeklopft: Sie probieren Passwörter für
`root`, suchen offene Datenbank-Ports und bekannte Lücken. Die gute Nachricht: Mit vier Maßnahmen, die
zusammen keine halbe Stunde dauern, laufen fast alle diese Angriffe ins Leere. Diese
[[server-haertung|Härtung]] machst du **bevor** deine App darauf landet.

## Updates zuerst, dann ein eigener Benutzer

Das Image deines Anbieters ist oft Wochen alt. Spiel deshalb als Erstes alle Updates ein – mit dem
Paketmanager [[apt|apt]]:

```bash title="Als root auf dem Server"
apt update && apt upgrade -y
adduser deploy
usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
```

Danach arbeitest du nie mehr direkt als [[root|root]]. Der Benutzer `deploy` darf per [[sudo|sudo]]
Admin-Befehle ausführen – bewusst, einzeln und protokolliert. Das ist das Prinzip der
[[least-privilege|geringsten Rechte]].

Der `rsync`-Befehl kopiert deine [[authorized-keys|authorized_keys]] samt richtiger Besitzrechte zum neuen
Benutzer. Teste **in einem zweiten Terminal**: `ssh deploy@203.0.113.10` und dann `sudo -v`.

> [!MERKSATZ]
> Erst testen, dann abschließen: Lass die root-Sitzung offen, bis der neue Zugang nachweislich funktioniert.

## SSH: nur Schlüssel, kein root

Jetzt schaltest du Passwörter ab. Eigene Einstellungen für den [[sshd|SSH-Server]] gehören in eine Datei
unter `/etc/ssh/sshd_config.d/`:

```text title="/etc/ssh/sshd_config.d/10-haertung.conf"
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
AllowUsers deploy
```

```bash title="Als deploy auf dem Server"
sudo sshd -t                 # Syntax prüfen – keine Ausgabe heißt: in Ordnung
sudo systemctl reload ssh    # neu laden, bestehende Sitzungen bleiben offen
```

Ohne Passwort-Anmeldung sind [[brute-force|Brute-Force-Angriffe]] nutzlos – wer deinen
[[ssh-schluessel|privaten Schlüssel]] nicht hat, kommt nicht herein. Optional sperrt [[fail2ban|fail2ban]]
zusätzlich Adressen mit vielen Fehlversuchen. Mehr Details stehen im SSH-Kurs.

## Die Firewall: drei Türen offen

Die Firewall entscheidet, welche [[port|Ports]] überhaupt erreichbar sind. Auf Ubuntu nutzt du [[ufw|ufw]]:

```bash title="firewall.sh"
#!/usr/bin/env bash
set -euo pipefail

ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

| Port | Wofür | Offen? |
|---|---|---|
| 22 | SSH | ja (besser nur von deiner IP, falls fest) |
| 80 | HTTP – Weiterleitung auf HTTPS und Let's Encrypt | ja |
| 443 | HTTPS | ja |
| 3306 / 5432 / 6379 | MySQL / PostgreSQL / Redis | **nein** – lauschen nur auf `127.0.0.1` |

> [!FEHLER]
> `ufw enable` vor `ufw allow OpenSSH`. Die Firewall blockt sofort alles – auch deine aktuelle Verbindung.
> Dann hilft nur noch die Notfall-Konsole im Webportal deines Anbieters.

Prüfe am Ende mit `sudo ufw status verbose`, was wirklich gilt.

Hast du zu Hause oder im Büro eine feste IP-Adresse, kannst du SSH noch enger fassen: `sudo ufw allow from 198.51.100.7 to any port 22 proto tcp` statt `ufw allow OpenSSH`. Dann sehen alle anderen Adressen Port 22 gar nicht erst. Bei wechselnden Adressen ist das zu riskant – sonst sperrst du dich unterwegs selbst aus.

## Automatische Sicherheitsupdates

Die meisten Einbrüche nutzen Lücken, für die es längst einen Patch gibt. Das Paket
[[unattended-upgrades|unattended-upgrades]] spielt [[sicherheitsupdate|Sicherheitsupdates]] täglich
automatisch ein. Auf Ubuntu Server ist es meist vorinstalliert; prüfe es mit:

```bash title="Terminal"
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades   # Abfrage mit "Yes" beantworten
cat /var/run/reboot-required                       # existiert nur, wenn ein Neustart nötig ist
```

Kernel-Updates wirken erst nach einem Neustart. Plane dafür ein festes Wartungsfenster ein, z. B. sonntags
früh, statt Neustarts monatelang aufzuschieben.

> [!PRAXIS]
> Viele Teams halten diese ersten Schritte in einem Skript oder einer Cloud-Init-Datei fest, die der
> Anbieter beim Erstellen des Servers ausführt. So sieht jeder neue Server gleich aus – auch der Ersatzserver
> nach einem Ausfall.

## Zusammenfassung

- Zuerst `apt update && apt upgrade`, dann ein eigener Benutzer mit **sudo**.
- SSH nur mit **Schlüsseln**, `PermitRootLogin no`, Änderungen mit `sshd -t` prüfen.
- Die Firewall erlaubt nur **22, 80 und 443**; Datenbanken bleiben lokal.
- **Erst erlauben, dann `ufw enable`** – und eine zweite Sitzung offen lassen.
- **unattended-upgrades** spielt Sicherheitsupdates automatisch ein; Neustarts planen.
