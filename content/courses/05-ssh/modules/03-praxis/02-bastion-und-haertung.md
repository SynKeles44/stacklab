---
title: Bastion-Hosts und Server-Härtung
summary: Server im privaten Netz über einen Jump-Host erreichen und den SSH-Server selbst gegen Angriffe absichern.
duration: 25
sources:
  - title: ssh(1) – Option -J
    url: https://man.openbsd.org/ssh#J
  - title: ssh_config(5) – ProxyJump und ForwardAgent
    url: https://man.openbsd.org/ssh_config#ProxyJump
  - title: sshd_config(5) – Handbuchseite
    url: https://man.openbsd.org/sshd_config
  - title: Ubuntu Server Docs – OpenSSH server
    url: https://documentation.ubuntu.com/server/how-to/security/openssh-server/
quiz:
  - type: single
    question: Warum nutzt man einen Bastion-Host?
    options:
      - Damit SSH schneller wird.
      - Damit nur ein einziger, gut abgesicherter Server aus dem Internet per SSH erreichbar ist.
      - Damit man keine Schlüssel mehr braucht.
      - Damit die Server keine IP-Adresse brauchen.
    answer: 1
    explanation: >
      Die internen Server haben gar keinen öffentlichen SSH-Zugang. Der einzige Eingang ist die
      Bastion – sie lässt sich zentral absichern, überwachen und protokollieren.
  - type: find-bug
    question: Diese Config soll app über die Bastion erreichen. Welche Zeile ist ein Sicherheitsrisiko?
    language: text
    code: |
      Host bastion
        HostName 203.0.113.5
        User deploy
        ForwardAgent yes
      Host app
        HostName 10.0.1.20
        ProxyJump bastion
    bug_line: 4
    explanation: >
      Mit ForwardAgent yes kann jeder, der root auf der Bastion ist, deinen Agent benutzen, solange
      du verbunden bist – und sich damit als du überall anmelden. ProxyJump braucht keine
      Agent-Weiterleitung. Die Zeile gehört weg.
  - type: multiple
    question: Welche Einstellungen gehören zu einer typischen Härtung?
    options:
      - PasswordAuthentication no
      - PermitRootLogin no
      - StrictModes no
      - MaxAuthTries 3
    answers: [0, 1, 3]
    explanation: >
      Passwort-Login aus, kein direkter root-Login und wenige Versuche pro Verbindung sind Standard.
      StrictModes no würde dagegen die Rechteprüfung von authorized_keys abschalten – das schwächt den Server.
  - type: single
    question: Du hast PasswordAuthentication no gesetzt. Was tust du, bevor du sshd neu lädst?
    options:
      - Alle offenen SSH-Sitzungen schließen.
      - Mit sshd -t die Konfiguration prüfen und eine zweite Sitzung offen lassen.
      - Den Server neu starten.
      - Nichts, sshd prüft selbst.
    answer: 1
    explanation: >
      sshd -t findet Tippfehler, bevor sie wirken. Eine offene Sitzung bleibt beim Neuladen bestehen –
      sperrst du dich aus, kannst du über sie den Fehler rückgängig machen.
  - type: find-bug
    question: In welcher Zeile dieser Härtungs-Datei steckt ein Sicherheitsproblem?
    language: text
    code: |
      PasswordAuthentication no
      KbdInteractiveAuthentication no
      PermitRootLogin yes
      AllowUsers deploy
    bug_line: 3
    explanation: >
      PermitRootLogin yes erlaubt root sogar die Anmeldung per Passwort, falls diese anderswo wieder
      eingeschaltet wird. Für Admin-Arbeit meldest du dich als normaler Benutzer an und nutzt sudo; richtig ist PermitRootLogin no.
tasks:
  - id: bastion-config
    type: terminal
    title: Eine Config mit Jump-Host
    description: |
      Das Team betreibt eine Bastion unter `203.0.113.5` (Benutzer `deploy`, Port `22`). Dahinter liegen
      im privaten Netz der App-Server `10.0.1.20` und die Datenbank `10.0.1.30` (Benutzer jeweils `deploy`).

      Schreibe im Ordner `jump` eine Datei `config` mit drei Aliasen:

      1. `bastion` – HostName `203.0.113.5`, User `deploy`.
      2. `app` – HostName `10.0.1.20`, User `deploy`, ProxyJump `bastion`.
      3. `db` – HostName `10.0.1.30`, User `deploy`, ProxyJump `bastion`.

      Agent-Weiterleitung darf **nirgends** eingeschaltet sein. Prüfe dein Ergebnis mit
      `ssh -G app -F ./config | grep -E '^(hostname|user|proxyjump) '`.
    workdir: jump
    checks:
      - type: file_exists
        path: config
        message: Die Datei config fehlt noch.
      - type: command
        run: ssh -G bastion -F ./config 2>/dev/null | grep -E '^(user|hostname|proxyjump) ' | sort | tr '\n' ' '
        stdout_matches: "^hostname 203\\.0\\.113\\.5 user deploy$"
        message: bastion braucht HostName 203.0.113.5 und User deploy – und selbst keinen ProxyJump.
      - type: command
        run: ssh -G app -F ./config 2>/dev/null | grep -E '^(user|hostname|proxyjump) ' | sort | tr '\n' ' '
        stdout_matches: "^hostname 10\\.0\\.1\\.20 proxyjump bastion user deploy$"
        message: app braucht HostName 10.0.1.20, User deploy und ProxyJump bastion.
      - type: command
        run: ssh -G db -F ./config 2>/dev/null | grep -E '^(user|hostname|proxyjump) ' | sort | tr '\n' ' '
        stdout_matches: "^hostname 10\\.0\\.1\\.30 proxyjump bastion user deploy$"
        message: db braucht HostName 10.0.1.30, User deploy und ProxyJump bastion.
      - type: command
        run: for h in bastion app db; do ssh -G $h -F ./config 2>/dev/null | grep '^forwardagent '; done | sort -u
        stdout_equals: forwardagent no
        message: ForwardAgent ist irgendwo eingeschaltet – mit ProxyJump brauchst du das nicht.
    hints:
      - "Jeder Alias ist ein eigener `Host`-Block mit eingerückten Optionen darunter."
      - "Die Option heißt genau `ProxyJump` und bekommt den Alias der Bastion als Wert."
      - "Statt zwei Blöcken für app und db geht auch `Host app db` – aber HostName unterscheidet sich, also brauchst du zwei Blöcke."
    solution: |
      ```text title="jump/config"
      Host bastion
        HostName 203.0.113.5
        User deploy

      Host app
        HostName 10.0.1.20
        User deploy
        ProxyJump bastion

      Host db
        HostName 10.0.1.30
        User deploy
        ProxyJump bastion
      ```
  - id: haertung-aktivieren
    type: simulated
    title: Die Härtung sicher aktivieren
    description: |
      Du bist als `deploy` auf `203.0.113.10` angemeldet, die Datei
      `/etc/ssh/sshd_config.d/10-haertung.conf` liegt bereit. **Lass diese Sitzung offen.**

      1. Prüfe die Konfiguration mit `sudo sshd -t`.
      2. Kontrolliere mit `sudo sshd -T | grep -i passwordauthentication`, was wirklich gilt.
      3. Lade den Dienst neu: `sudo systemctl reload ssh`.
      4. Schau mit `sudo fail2ban-client status sshd`, wie viele Adressen schon gesperrt sind.
    prompt: "deploy@web-01:~$"
    steps:
      - expect: "^sudo\\s+sshd\\s+-t\\s*$"
        output: ""
        hint: Keine Ausgabe bedeutet bei sshd -t – alles in Ordnung.
      - expect: "^sudo\\s+sshd\\s+-T\\s*\\|\\s*grep\\s+(-i\\s+)?passwordauthentication\\s*$"
        output: passwordauthentication no
      - expect: "^sudo\\s+systemctl\\s+reload\\s+(ssh|sshd)(\\.service)?\\s*$"
        output: ""
      - expect: "^sudo\\s+fail2ban-client\\s+status\\s+sshd\\s*$"
        output: |
          Status for the jail: sshd
          |- Filter
          |  |- Currently failed:	4
          |  |- Total failed:	1873
          |  `- Journal matches:	_SYSTEMD_UNIT=sshd.service + _COMM=sshd
          `- Actions
             |- Currently banned:	12
             |- Total banned:	341
             `- Banned IP list:	198.51.100.7 198.51.100.44 203.0.113.99
    solution: |
      ```bash
      sudo sshd -t
      sudo sshd -T | grep -i passwordauthentication
      sudo systemctl reload ssh
      # in einem ZWEITEN Terminal testen: ssh deploy@203.0.113.10
      sudo fail2ban-client status sshd
      ```
---

Ein Server mit offenem Port 22 wird ab der ersten Minute von Bots angegriffen. Profis verkleinern
deshalb die Angriffsfläche von zwei Seiten: Interne Server sind nur über einen einzigen Eingang
erreichbar, und dieser Eingang ist so abgesichert, dass Raten zwecklos ist.

## Der Bastion-Host als einziger Eingang

![Ein Jump-Host als einziger Eingang ins private Netz](/assets/ssh/jump-host.svg)

Ein [[bastion-host|Bastion-Host]] (Jump-Host) ist der einzige Server, der aus dem Internet per SSH
erreichbar ist. App-Server und Datenbanken stehen in einem privaten Netz mit Adressen wie
`10.0.1.20` und akzeptieren SSH nur von dort.

| Vorteil | Warum |
|---|---|
| kleine Angriffsfläche | nur ein Rechner mit offenem Port 22 |
| zentrale Kontrolle | ein Ort für Zugriffsrechte, [[firewall|Firewall]]-Regeln und Protokolle |
| interne Server unsichtbar | ohne öffentliche [[ip-adresse|IP-Adresse]] kein direkter Angriff |

## ProxyJump statt Agent-Weiterleitung

```bash title="Ein Befehl, zwei Sprünge"
ssh -J deploy@203.0.113.5 deploy@10.0.1.20
```

Mit [[proxyjump|ProxyJump]] öffnet die Bastion nur einen Kanal zum Ziel. Durch ihn baut dein Laptop
eine eigene, Ende-zu-Ende verschlüsselte Verbindung auf. Der private Schlüssel bleibt bei dir. In der
Config genügt eine Zeile:

```text title="~/.ssh/config"
Host bastion
  HostName 203.0.113.5
  User deploy

Host app
  HostName 10.0.1.20
  User deploy
  ProxyJump bastion
```

Danach laufen `ssh app`, `scp` und Tunnel automatisch über die Bastion. Mehrere Sprünge trennst du
mit Kommas (`-J bastion1,bastion2`). Der Host-Key des Ziels wird ganz normal gegen deine
`known_hosts` geprüft – die Bastion sieht nur verschlüsselte Daten.

> [!FEHLER]
> **`ForwardAgent yes` für Jump-Hosts.** Damit kann jeder, der auf dem Server root ist, deinen
> Agent benutzen und sich als du überall anmelden. Für Jump-Hosts brauchst du das nicht – nimm ProxyJump.

## Den SSH-Server härten

Eigene sshd-Einstellungen gehören auf Debian und Ubuntu in eine Datei unter
`/etc/ssh/sshd_config.d/`. Wie beim Client gilt: Der erste gefundene Wert gewinnt.

```text title="/etc/ssh/sshd_config.d/10-haertung.conf"
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
PubkeyAuthentication yes
AllowUsers deploy
MaxAuthTries 3
```

| Einstellung | Wirkung |
|---|---|
| `PasswordAuthentication no` + `KbdInteractiveAuthentication no` | keine Passwort-Anmeldung mehr |
| `PermitRootLogin no` | [[root|root]] darf sich nicht direkt anmelden |
| `AllowUsers deploy` | nur benannte Benutzer kommen rein |
| `MaxAuthTries 3` | nach 3 Fehlversuchen wird getrennt |

Ohne Passwort-Login sind [[brute-force|Brute-Force-Angriffe]] wertlos. Zusätzlich sperrt
[[fail2ban|fail2ban]] Adressen mit vielen Fehlversuchen per Firewall-Regel.

> [!MERKSATZ]
> Schlüssel statt Passwörter, kein root, nur benannte Benutzer – und SSH aus dem Internet nur über
> die Bastion.

## Ohne Aussperren aktivieren

1. Prüfen, dass dein **Schlüssel-Login funktioniert**, bevor du Passwörter abschaltest.
2. Konfiguration mit `sudo sshd -t` prüfen; `sudo sshd -T` zeigt, was wirklich gilt.
3. Eine Sitzung **offen lassen** und `sudo systemctl reload ssh` ausführen.
4. In einem **zweiten Terminal** neu verbinden – erst wenn das klappt, die erste Sitzung schließen.

> [!PRAXIS]
> In professionellen Umgebungen verteilt Konfigurationsmanagement diese Einstellungen auf alle
> Server. Ein neuer Server ist so ab der ersten Minute gehärtet – und kein alter hat versehentlich
> noch Passwort-Login an.

## Zusammenfassung

- Ein Bastion-Host ist der einzige per SSH erreichbare Server; interne Server liegen im privaten Netz.
- `ssh -J` bzw. `ProxyJump` springt über die Bastion; der Schlüssel bleibt auf deinem Laptop.
- `ForwardAgent` ist riskant und für Jump-Hosts unnötig.
- Härtung: Passwort-Login aus, `PermitRootLogin no`, `AllowUsers`, `MaxAuthTries`, dazu fail2ban.
- Aktivieren nur mit `sshd -t`, offener Sitzung und Test im zweiten Terminal.
