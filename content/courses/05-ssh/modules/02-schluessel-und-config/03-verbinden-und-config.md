---
title: Verbinden und die ssh-Config
summary: Port, Schlüsseldatei und einzelne Befehle, typische Fehlermeldungen – und wie die ~/.ssh/config daraus kurze Aliase macht.
duration: 25
sources:
  - title: ssh(1) – Handbuchseite (Optionen -p, -i, -v, -t, -G, -F)
    url: https://man.openbsd.org/ssh
  - title: ssh_config(5) – Handbuchseite
    url: https://man.openbsd.org/ssh_config
quiz:
  - type: match
    question: Welche Option macht was?
    pairs:
      - { left: "-p 2222", right: "Anderen Port als 22 verwenden" }
      - { left: "-i ~/.ssh/id_ed25519_arbeit", right: "Bestimmte Schlüsseldatei verwenden" }
      - { left: "-v", right: "Verbindungsaufbau ausführlich anzeigen" }
      - { left: "-t", right: "Terminal für einen interaktiven Befehl erzwingen" }
    explanation: Diese vier Optionen brauchst du ständig. -v kannst du bis -vvv steigern, wenn du noch mehr Details brauchst.
  - type: find-bug
    question: Der SSH-Server von example.com läuft auf Port 2222. Welche Zeile funktioniert nicht?
    language: bash
    code: |
      ssh -p 2222 deploy@example.com
      ssh deploy@example.com -p 2222
      ssh deploy@example.com:2222
      ssh -p 2222 -i ~/.ssh/id_ed25519 deploy@example.com
    bug_line: 3
    explanation: >
      Anders als bei URLs kennt ssh die Schreibweise host:port nicht – es würde nach einem Rechner
      namens „example.com:2222“ suchen. Den Port gibst du mit -p an (oder als ssh://deploy@example.com:2222).
  - type: single
    question: In einer ssh-Config steht dieselbe Option in zwei passenden Host-Blöcken. Welcher Wert gilt?
    options:
      - Der aus dem letzten passenden Block
      - Der aus dem ersten passenden Block
      - Der kleinere Wert
      - ssh bricht mit einem Fehler ab
    answer: 1
    explanation: >
      ssh liest die Datei von oben nach unten und nimmt für jede Option den ersten gefundenen Wert.
      Deshalb gehören spezielle Hosts nach oben und `Host *` mit allgemeinen Vorgaben ans Ende.
  - type: find-bug
    question: "`ssh web` meldet sich als root an statt als deploy. Welche Zeile ist das Problem?"
    language: text
    code: |
      Host *
        User root
        ServerAliveInterval 60
      Host web
        HostName 203.0.113.10
        User deploy
    bug_line: 1
    explanation: >
      Der Block `Host *` passt auf jeden Host und steht zuerst – also gewinnt User root. Verschiebe
      ihn ans Ende der Datei, dann gilt für web der Wert deploy.
  - type: cloze
    text: "Mit `ssh ___ web` zeigt ssh die endgültige Konfiguration für den Alias web an, ohne sich zu verbinden. Eine andere Config-Datei wählst du mit der Option ___."
    blanks:
      - [-G]
      - [-F]
    explanation: -G gibt alle aufgelösten Optionen aus, -F liest statt ~/.ssh/config die angegebene Datei.
tasks:
  - id: config-reparieren
    type: terminal
    title: Eine Config reparieren und erweitern
    description: |
      Im Ordner `ssh-config` liegt eine Datei `config`. Sie hat einen Fehler: `ssh -G web -F ./config`
      zeigt `user root` statt `user deploy`.

      1. Prüfe mit `ssh -G web -F ./config | grep -E '^(user|hostname|port) '`, was aktuell gilt.
      2. Repariere die Datei, sodass für `web` der Benutzer `deploy` gilt. Alle anderen Hosts sollen weiterhin `root` bekommen.
      3. Füge einen Alias `db` hinzu: HostName `203.0.113.20`, User `postgres-admin`, Port `2222`,
         IdentityFile `~/.ssh/id_ed25519_arbeit`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: ssh-config
    setup: |
      cat > config <<'CONF'
      Host *
        User root
        IdentitiesOnly yes
        ServerAliveInterval 60

      Host web
        HostName 203.0.113.10
        User deploy
      CONF
    checks:
      - type: command
        run: ssh -G web -F ./config 2>/dev/null | grep -E '^(user|hostname) ' | sort | tr '\n' ' '
        stdout_matches: "^hostname 203\\.0\\.113\\.10 user deploy$"
        message: Für web muss hostname 203.0.113.10 und user deploy gelten. Steht Host * noch vor Host web?
      - type: command
        run: ssh -G irgendwas -F ./config 2>/dev/null | grep '^user '
        stdout_equals: user root
        message: Andere Hosts sollen weiterhin den Benutzer root bekommen – der Host-*-Block muss erhalten bleiben.
      - type: command
        run: ssh -G db -F ./config 2>/dev/null | grep -E '^(user|hostname|port|identityfile) ' | sort | tr '\n' ' '
        stdout_matches: "^hostname 203\\.0\\.113\\.20 identityfile ~/\\.ssh/id_ed25519_arbeit port 2222 user postgres-admin$"
        message: "Für db stimmt noch nicht alles: HostName 203.0.113.20, User postgres-admin, Port 2222, IdentityFile ~/.ssh/id_ed25519_arbeit."
      - type: command
        run: ssh -G db -F ./config 2>/dev/null | grep '^identitiesonly '
        stdout_equals: identitiesonly yes
        message: Die allgemeinen Vorgaben aus Host * (IdentitiesOnly yes) sollen auch für db gelten.
    hints:
      - ssh nimmt für jede Option den ersten passenden Wert. Was passiert, wenn Host * ganz oben steht?
      - Verschiebe den Block `Host *` ans Ende der Datei, z. B. mit `nano config`.
      - "Der neue Block beginnt mit `Host db`, darunter eingerückt je eine Option pro Zeile."
    solution: |
      ```text title="config"
      Host web
        HostName 203.0.113.10
        User deploy

      Host db
        HostName 203.0.113.20
        User postgres-admin
        Port 2222
        IdentityFile ~/.ssh/id_ed25519_arbeit

      Host *
        User root
        IdentitiesOnly yes
        ServerAliveInterval 60
      ```

      Prüfen: `ssh -G db -F ./config | grep -E '^(user|hostname|port|identityfile) '`
  - id: fehler-deuten
    type: steps
    title: Fehlermeldungen deuten
    description: Lies jede Meldung und entscheide, wo das Problem liegt.
    steps:
      - situation: "`ssh deploy@203.0.113.10` antwortet sofort: `ssh: connect to host 203.0.113.10 port 22: Connection refused`"
        question: Was bedeutet das?
        options:
          - Der Rechner ist erreichbar, aber auf Port 22 lauscht kein SSH-Server.
          - Dein Schlüssel wurde abgelehnt.
          - Der Server existiert nicht.
        answer: 0
        explanation: „Refused“ ist eine aktive Absage des Rechners. Er lebt – aber sshd läuft nicht oder lauscht auf einem anderen Port.
      - situation: "`ssh deploy@app.example.com` meldet: `Could not resolve hostname app.example.com: Name or service not known`"
        question: Wo liegt das Problem?
        options:
          - Bei der Namensauflösung – der Hostname ist falsch geschrieben oder existiert nicht.
          - Bei den Dateirechten auf dem Server.
          - Beim Host-Key.
        answer: 0
        explanation: Die Verbindung wurde noch gar nicht versucht. ssh konnte den Namen nicht in eine IP-Adresse übersetzen.
      - situation: "`ssh deploy@203.0.113.10` meldet: `deploy@203.0.113.10: Permission denied (publickey).`"
        question: Was weißt du jetzt sicher?
        options:
          - Die Verbindung zum SSH-Server stand, aber die Anmeldung wurde abgelehnt.
          - Der Server ist ausgeschaltet.
          - Port 22 ist durch eine Firewall gesperrt.
        answer: 0
        explanation: Die Netzwerkseite ist in Ordnung. Jetzt helfen ssh -v (welcher Schlüssel wird angeboten?) und das Auth-Log auf dem Server.
      - situation: "Du hast acht Schlüssel im Agent. `ssh deploy@203.0.113.10` meldet: `Received disconnect … Too many authentication failures`"
        question: Was hilft?
        options:
          - Mit -i den richtigen Schlüssel wählen und IdentitiesOnly=yes setzen.
          - Den Agent neu starten und alle acht Schlüssel erneut laden.
          - StrictHostKeyChecking=no setzen.
        answer: 0
        explanation: ssh probiert alle Schlüssel aus dem Agent durch. Nach zu vielen Fehlversuchen trennt der Server. Mit IdentitiesOnly=yes nimmt ssh nur die angegebene Datei.
---

`ssh -p 2222 -i ~/.ssh/id_ed25519_arbeit deploy@203.0.113.10` – so sieht ein Aufruf im echten
Leben oft aus. In dieser Lektion lernst du die wichtigsten Optionen, liest Fehlermeldungen richtig
und machst mit der ssh-Config aus dem langen Befehl ein kurzes `ssh web`.

## Die wichtigsten Optionen

```text title="Aufbau"
ssh [Optionen] [benutzer@]host [befehl]
```

| Aufruf | Bedeutung |
|---|---|
| `ssh -p 2222 deploy@203.0.113.10` | Server lauscht auf [[port|Port]] 2222 |
| `ssh -i ~/.ssh/id_ed25519_arbeit …` | bestimmte Schlüsseldatei verwenden |
| `ssh deploy@203.0.113.10 "df -h /"` | nur einen Befehl ausführen, dann zurück |
| `ssh -t deploy@203.0.113.10 "htop"` | Terminal für interaktive Programme erzwingen |
| `ssh -v deploy@203.0.113.10` | Verbindungsaufbau Schritt für Schritt anzeigen |

Ohne Benutzer nimmt `ssh` deinen **lokalen** Benutzernamen. Den entfernten Befehl setzt du in
Anführungszeichen – sonst wertet deine lokale Shell Zeichen wie `&&` oder `>` aus.

> [!FEHLER]
> **Port mit Doppelpunkt.** `ssh deploy@example.com:2222` sucht einen Rechner, der wörtlich
> `example.com:2222` heißt. Richtig ist `ssh -p 2222 deploy@example.com`.

> [!TIPP]
> Hängt eine Sitzung nach einem WLAN-Wechsel, tippe am Zeilenanfang Enter, dann `~` und `.` – der
> Client beendet die Verbindung sofort.

## Fehlermeldungen lesen

| Meldung | Stufe | Typische Ursache |
|---|---|---|
| `Could not resolve hostname` | Name → Adresse | Tippfehler im Hostnamen |
| `Connection timed out` | Netzwerk | falsche IP, Server aus, [[firewall|Firewall]] verwirft Pakete |
| `Connection refused` | Netzwerk | Rechner lebt, aber auf dem Port lauscht kein sshd |
| `Host key verification failed` | Server-Identität | Host-Key geändert |
| `Permission denied (publickey)` | Anmeldung | falscher Benutzer, falscher Schlüssel, Rechte auf dem Server |

Ab „Permission denied“ hilft `ssh -v`: Steht dort nie `Offering public key` mit dem erwarteten
Schlüssel, liegt das Problem bei dir. Wird er angeboten, aber abgelehnt, liegt es am Server.

Hast du viele Schlüssel im Agent, probiert `ssh` alle durch – bis der Server mit „Too many
authentication failures“ abbricht. Mit `-o IdentitiesOnly=yes` bietet `ssh` nur die per `-i`
genannte Datei an.

## Die ssh-Config

Die [[ssh-config|ssh-Config]] in `~/.ssh/config` besteht aus Blöcken, die mit `Host` beginnen:

```text title="~/.ssh/config"
Host web
  HostName 203.0.113.10
  User deploy
  Port 2222
  IdentityFile ~/.ssh/id_ed25519_arbeit

Host *
  IdentitiesOnly yes
  ServerAliveInterval 30
```

| Option | Entspricht |
|---|---|
| `HostName` | Adresse hinter `@` |
| `User` | Teil vor `@` |
| `Port` | `-p` |
| `IdentityFile` | `-i` |
| `IdentitiesOnly yes` | nur die genannten Schlüssel anbieten |
| `ServerAliveInterval 30` | [[keepalive|Keepalive]] gegen eingefrorene Sitzungen |

Jetzt reicht `ssh web` – und der Alias funktioniert auch für `scp`, `rsync` und `git`.

## Erster Treffer gewinnt – und ssh -G zeigt es

Hinter `Host` dürfen Muster stehen: `Host *.example.com` oder `Host *`. Passt ein Host zu mehreren
Blöcken, gilt **für jede Option der erste gefundene Wert**. Deshalb: spezielle Hosts oben, `Host *`
mit allgemeinen Vorgaben ganz unten.

```bash title="Was gilt wirklich?"
ssh -G web | grep -E '^(user|hostname|port|identityfile) '
```

```text title="Ausgabe"
user deploy
hostname 203.0.113.10
port 2222
identityfile ~/.ssh/id_ed25519_arbeit
```

`ssh -G` verbindet sich nicht, sondern zeigt die endgültige Konfiguration. Mit `-F datei` testest du
eine andere Config-Datei gefahrlos.

> [!MERKSATZ]
> Spezielle Hosts oben, `Host *` unten – und im Zweifel mit `ssh -G alias` nachsehen, was gilt.

> [!PRAXIS]
> Wer im Team „SSH geht nicht“ meldet, schickt am besten gleich die Ausgabe von `ssh -v` mit. Und
> eine gemeinsame Config-Vorlage mit allen Server-Aliasen spart jeder neuen Kollegin Stunden.

## Zusammenfassung

- `ssh [Optionen] [benutzer@]host [befehl]`: `-p` Port, `-i` Schlüssel, `-t` Terminal, `-v` Fehlersuche.
- Fehlermeldungen verraten die Stufe: Namensauflösung, Netzwerk, Server-Identität oder Anmeldung.
- `IdentitiesOnly yes` verhindert das Durchprobieren aller Schlüssel.
- `~/.ssh/config` macht aus Optionen Aliase; sie gelten auch für scp, rsync und git.
- Erster Treffer gewinnt; `ssh -G` zeigt die wirksame Konfiguration, `-F` testet eine andere Datei.
