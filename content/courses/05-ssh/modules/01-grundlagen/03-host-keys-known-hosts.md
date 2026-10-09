---
title: Host-Keys, Fingerprints und known_hosts
summary: Wie SSH prüft, ob du wirklich mit deinem Server sprichst – und was die gefürchtete Warnung „REMOTE HOST IDENTIFICATION HAS CHANGED“ bedeutet.
duration: 25
sources:
  - title: ssh(1) – Abschnitt VERIFYING HOST KEYS
    url: https://man.openbsd.org/ssh#VERIFYING_HOST_KEYS
  - title: ssh-keygen(1) – Optionen -F, -R, -H und -l
    url: https://man.openbsd.org/ssh-keygen
  - title: sshd(8) – Abschnitt SSH_KNOWN_HOSTS FILE FORMAT
    url: https://man.openbsd.org/sshd#SSH_KNOWN_HOSTS_FILE_FORMAT
quiz:
  - type: single
    question: "Du verbindest dich zum ersten Mal mit einem neuen Server und siehst: „The authenticity of host … can't be established.“ Was ist die sicherste Reaktion?"
    options:
      - Sofort yes tippen – das ist bei jedem neuen Server so.
      - Den angezeigten Fingerprint mit dem vergleichen, den du auf einem anderen, vertrauenswürdigen Weg bekommen hast.
      - known_hosts löschen und es erneut versuchen.
      - StrictHostKeyChecking=no setzen, damit die Frage verschwindet.
    answer: 1
    explanation: >
      Beim ersten Kontakt kennt dein Laptop den Server noch nicht. Ob der Fingerprint stimmt, kannst
      nur du prüfen – etwa mit dem Wert aus der Server-Konsole deines Hosters oder der Dokumentation des Dienstes.
  - type: multiple
    question: "Wann kann die Warnung „REMOTE HOST IDENTIFICATION HAS CHANGED“ auftauchen?"
    options:
      - Der Server wurde neu installiert und hat neue Host-Keys.
      - Jemand schaltet sich zwischen dich und den Server (Man-in-the-Middle).
      - Die IP-Adresse wurde einem anderen Server zugewiesen.
      - Du hast deinen eigenen Benutzer-Schlüssel neu erzeugt.
    answers: [0, 1, 2]
    explanation: >
      Die Warnung bedeutet nur: Der Server präsentiert einen anderen Host-Key als den gemerkten. Das
      kann harmlos sein (Neuinstallation, neue Maschine) oder ein Angriff. Dein eigener Benutzer-Schlüssel spielt dabei keine Rolle.
  - type: match
    question: Ordne jedem Befehl seine Wirkung zu.
    pairs:
      - { left: "ssh-keygen -F 203.0.113.10", right: "Eintrag für einen Host in known_hosts suchen" }
      - { left: "ssh-keygen -R 203.0.113.10", right: "Eintrag für einen Host aus known_hosts entfernen" }
      - { left: "ssh-keygen -l -f datei.pub", right: "Fingerprint eines Schlüssels anzeigen" }
      - { left: "ssh-keygen -H", right: "Hostnamen in known_hosts unkenntlich machen (hashen)" }
    explanation: Alle vier Aufgaben erledigt ssh-keygen – -F findet, -R entfernt, -l zeigt Fingerprints und -H hasht die Einträge.
  - type: find-bug
    question: "Ein Kollege bekommt die Warnung REMOTE HOST IDENTIFICATION HAS CHANGED und „löst“ das Problem so. Welche Zeile ist gefährlich?"
    language: bash
    code: |
      ssh deploy@203.0.113.20
      # WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!
      ssh -o StrictHostKeyChecking=no deploy@203.0.113.20
      ssh-keygen -l -f ~/.ssh/id_ed25519.pub
    bug_line: 3
    explanation: >
      StrictHostKeyChecking=no schaltet die Prüfung aus – genau in dem Moment, in dem vielleicht ein
      Angreifer dazwischensitzt. Richtig ist: herausfinden, warum sich der Key geändert hat, den neuen
      Fingerprint auf anderem Weg prüfen und erst dann den alten Eintrag mit ssh-keygen -R entfernen.
tasks:
  - id: known-hosts-aufraeumen
    type: terminal
    title: Einen neu installierten Server eintragen
    description: |
      Im Ordner `known-hosts` liegt eine Datei `known_hosts` mit drei Servern. Der Server
      `203.0.113.20` wurde neu installiert und hat einen neuen Host-Key bekommen. Dessen öffentlichen
      Schlüssel hat dir die Admin-Kollegin auf sicherem Weg geschickt: `neuer-host-key.pub`.

      1. Lass dir mit `ssh-keygen -l -f known_hosts` alle Fingerprints anzeigen.
      2. Entferne den **veralteten** Eintrag für `203.0.113.20` mit `ssh-keygen -R`.
      3. Trage den neuen Schlüssel ein: eine Zeile im Format `203.0.113.20 ssh-ed25519 AAAA…`
         (Tipp: Die ersten zwei Felder der `.pub`-Datei sind Typ und Schlüssel).
      4. Schreib den Fingerprint von `203.0.113.10` (der Teil `SHA256:…`) in eine Datei `fingerprint.txt`.

      Die beiden anderen Einträge müssen erhalten bleiben. Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: known-hosts
    setup: |
      mkdir -p .tmp
      for h in web db old cache; do ssh-keygen -q -t ed25519 -N "" -C "" -f ".tmp/$h"; done
      {
        echo "203.0.113.10 $(cut -d' ' -f1,2 .tmp/web.pub)"
        echo "203.0.113.20 $(cut -d' ' -f1,2 .tmp/old.pub)"
        echo "[203.0.113.30]:2222 $(cut -d' ' -f1,2 .tmp/cache.pub)"
      } > known_hosts
      cp .tmp/db.pub neuer-host-key.pub
      rm -rf .tmp
    checks:
      - type: command
        run: ssh-keygen -F 203.0.113.20 -f known_hosts | grep -v '^#' | wc -l
        stdout_matches: "^\\s*1\\s*$"
        message: Für 203.0.113.20 sollte genau ein Eintrag in known_hosts stehen – der alte entfernt, der neue eingetragen.
      - type: command
        run: ssh-keygen -F 203.0.113.20 -f known_hosts | grep -v '^#' | grep -qF "$(cut -d' ' -f2 neuer-host-key.pub)"
        message: Der Eintrag für 203.0.113.20 enthält noch nicht den Schlüssel aus neuer-host-key.pub.
      - type: command
        run: ssh-keygen -F 203.0.113.10 -f known_hosts >/dev/null && ssh-keygen -F "[203.0.113.30]:2222" -f known_hosts >/dev/null
        message: Die Einträge für 203.0.113.10 und [203.0.113.30]:2222 müssen erhalten bleiben.
      - type: command
        run: grep -qF "$(ssh-keygen -F 203.0.113.10 -f known_hosts | grep -v '^#' | ssh-keygen -l -f - | awk '{print $2}')" fingerprint.txt
        message: fingerprint.txt enthält noch nicht den SHA256-Fingerprint von 203.0.113.10.
    hints:
      - "`ssh-keygen -R 203.0.113.20 -f known_hosts` entfernt den alten Eintrag (eine Sicherung landet in known_hosts.old)."
      - "Den neuen Eintrag hängst du mit `echo \"203.0.113.20 $(cut -d' ' -f1,2 neuer-host-key.pub)\" >> known_hosts` an."
      - "`ssh-keygen -l -f known_hosts` zeigt pro Zeile `256 SHA256:… host (ED25519)`. Kopiere den SHA256-Teil der Zeile mit 203.0.113.10 in fingerprint.txt."
    solution: |
      ```bash
      cd known-hosts
      ssh-keygen -l -f known_hosts
      ssh-keygen -R 203.0.113.20 -f known_hosts
      echo "203.0.113.20 $(cut -d' ' -f1,2 neuer-host-key.pub)" >> known_hosts
      ssh-keygen -l -f known_hosts | grep '203.0.113.10' | awk '{print $2}' > fingerprint.txt
      cat fingerprint.txt
      ```
  - id: host-key-geaendert
    type: simulated
    title: Die Warnung richtig behandeln
    description: |
      Du willst dich mit `deploy@203.0.113.20` verbinden. Der Server wurde gestern neu aufgesetzt –
      das hat das Team angekündigt, und der neue Fingerprint lautet laut Admin-Konsole
      `SHA256:PKCXNGvNrHNpI+X59kkwMI27wXRAH3pMx+4DvGltoDQ`.

      1. Verbinde dich mit `ssh deploy@203.0.113.20` und lies die Warnung.
      2. Entferne den veralteten Eintrag mit `ssh-keygen -R 203.0.113.20`.
      3. Verbinde dich erneut, vergleiche den Fingerprint und bestätige mit `yes`.
    prompt: "du@laptop:~$"
    steps:
      - expect: "^ssh\\s+deploy@203\\.0\\.113\\.20\\s*$"
        output: |
          @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
          @    WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!     @
          @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
          IT IS POSSIBLE THAT SOMEONE IS DOING SOMETHING NASTY!
          Someone could be eavesdropping on you right now (man-in-the-middle attack)!
          It is also possible that a host key has just been changed.
          The fingerprint for the ED25519 key sent by the remote host is
          SHA256:PKCXNGvNrHNpI+X59kkwMI27wXRAH3pMx+4DvGltoDQ.
          Please contact your system administrator.
          Add correct host key in /home/du/.ssh/known_hosts to get rid of this message.
          Offending ED25519 key in /home/du/.ssh/known_hosts:7
          Host key for 203.0.113.20 has changed and you have requested strict checking.
          Host key verification failed.
        hint: Verbinde dich zuerst ganz normal mit ssh deploy@203.0.113.20
      - expect: "^ssh-keygen\\s+-R\\s+203\\.0\\.113\\.20\\s*$"
        output: |
          # Host 203.0.113.20 found: line 7
          /home/du/.ssh/known_hosts updated.
          Original contents retained as /home/du/.ssh/known_hosts.old
        hint: Mit ssh-keygen -R und der Adresse entfernst du den alten Eintrag.
      - expect: "^ssh\\s+deploy@203\\.0\\.113\\.20\\s*$"
        output: |
          The authenticity of host '203.0.113.20 (203.0.113.20)' can't be established.
          ED25519 key fingerprint is SHA256:PKCXNGvNrHNpI+X59kkwMI27wXRAH3pMx+4DvGltoDQ.
          This key is not known by any other names.
          Are you sure you want to continue connecting (yes/no/[fingerprint])?
        prompt: ""
        hint: Verbinde dich erneut mit demselben Befehl.
      - expect: "^yes\\s*$"
        output: |
          Warning: Permanently added '203.0.113.20' (ED25519) to the list of known hosts.
          Welcome to Ubuntu 24.04.3 LTS (GNU/Linux 6.8.0-79-generic x86_64)
        prompt: "deploy@db-01:~$"
        hint: Der Fingerprint stimmt mit dem aus der Admin-Konsole überein – bestätige mit yes.
    solution: |
      ```bash
      ssh deploy@203.0.113.20          # Warnung lesen, nicht ignorieren
      ssh-keygen -R 203.0.113.20       # alten Eintrag entfernen
      ssh deploy@203.0.113.20          # Fingerprint vergleichen, dann: yes
      ```
---

Schlüsselpaare beweisen dem Server, wer **du** bist. Aber was, wenn der Server gar nicht der Server
ist? Wenn sich jemand im Café-WLAN zwischen dich und dein Ziel schaltet und sich als
`203.0.113.10` ausgibt, nützt dir die beste Verschlüsselung nichts – du würdest dich ja verschlüsselt
mit dem Angreifer unterhalten. Deshalb muss sich auch der Server ausweisen.

Jeder SSH-Server erzeugt bei der Installation eigene Schlüsselpaare, die [[host-key|Host-Keys]].
Sie liegen auf dem Server unter `/etc/ssh/`, zum Beispiel `ssh_host_ed25519_key` (privat) und
`ssh_host_ed25519_key.pub` (öffentlich). Beim Verbindungsaufbau signiert der Server Daten der
aktuellen Sitzung mit seinem privaten Host-Key. Dein Client prüft die Signatur – genau wie der
Server bei deiner Anmeldung, nur in die andere Richtung.

Woher weiß dein Client aber, welcher öffentliche Host-Key der richtige ist? Er merkt ihn sich beim
ersten Besuch in der Datei [[known-hosts|`~/.ssh/known_hosts`]].

## Der erste Besuch und der Fingerprint

Beim allerersten Kontakt kennt dein Laptop den Server noch nicht und fragt nach:

```text title="Erste Verbindung"
The authenticity of host '203.0.113.10 (203.0.113.10)' can't be established.
ED25519 key fingerprint is SHA256:Px8xS4IrakCrlOCdhDydCu0YZCiYdQqi7yU4QlPGqyc.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

Ein öffentlicher Schlüssel ist sehr lang. Damit Menschen ihn vergleichen können, zeigt SSH einen
[[fingerprint|Fingerprint]]: eine kurze Prüfsumme, die aus dem Schlüssel berechnet wird – technisch
ein [[hash|Hash]] mit dem Verfahren SHA-256. Ändert sich der Schlüssel um ein einziges Bit, sieht
der Fingerprint komplett anders aus.

Den richtigen Fingerprint bekommst du auf einem **zweiten, vertrauenswürdigen Weg**: aus der
Web-Konsole deines Hosters, von der Kollegin, die den Server aufgesetzt hat, oder bei großen Diensten
wie GitHub aus der offiziellen Dokumentation. Stimmen beide Werte überein, tippst du `yes` (oder
fügst den erwarteten Fingerprint direkt ein – dann vergleicht SSH für dich). Danach steht der Server
in `known_hosts`.

Dieses Prinzip heißt [[tofu|TOFU]] – *Trust On First Use*, „Vertrauen beim ersten Kontakt“. Der
erste Kontakt ist der verwundbare Moment. Danach schützt dich SSH automatisch.

> [!FEHLER]
> **Bei der Fingerprint-Frage blind `yes` tippen.** Fast alle machen das – und genau dann hat ein
> Angreifer leichtes Spiel, weil du seinen Schlüssel dauerhaft als „vertrauenswürdig“ speicherst.
> Wenigstens bei Produktionsservern lohnt der Vergleich jedes Mal.

## Die Datei known_hosts lesen

Jede Zeile in `known_hosts` hat drei Teile: Host, Schlüsseltyp, öffentlicher Schlüssel.

```text title="~/.ssh/known_hosts"
203.0.113.10 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDjYpZi1M7FQ8BPF2tj+tPY0a8dBps1c1p7xxuuMEoij
[203.0.113.30]:2222 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICX0yXIsjLVEAXHRjqzxldSDiEsA7J6o4PbGi+Li01FY
|1|b1x3d0M3…=|9QkZ…= ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOq…
```

- Läuft SSH auf einem anderen Port als 22, steht der Host in eckigen Klammern mit Port:
  `[203.0.113.30]:2222`.
- Die dritte Zeile ist **gehasht**: Statt des Hostnamens steht dort eine unkenntliche Prüfsumme.
  Viele Linux-Distributionen schalten das standardmäßig ein (`HashKnownHosts yes`). Wird dein Laptop
  gestohlen, sieht der Dieb nicht sofort, mit welchen Servern du arbeitest.

Weil gehashte Zeilen nicht mit `grep` zu finden sind, gibt es dafür eigene Befehle:

```bash title="Mit known_hosts arbeiten"
ssh-keygen -F 203.0.113.10            # Eintrag suchen (funktioniert auch bei gehashten Zeilen)
ssh-keygen -l -f ~/.ssh/known_hosts   # Fingerprints aller Einträge anzeigen
ssh-keygen -R 203.0.113.10            # Eintrag entfernen (Sicherung: known_hosts.old)
ssh-keygen -H                         # alle Hostnamen in known_hosts hashen
```

`-f datei` wählt eine andere Datei als die Standard-Datei – praktisch zum Üben.

## Wenn sich der Host-Key ändert

![Host-Key-Prüfung: passender Fingerprint gegen Angreifer](/assets/ssh/host-key-pruefung.svg)

Präsentiert ein bekannter Server plötzlich einen anderen Host-Key, bricht SSH mit einer großen
Warnung ab: **REMOTE HOST IDENTIFICATION HAS CHANGED**. Es gibt dafür harmlose und gefährliche
Gründe:

| Ursache | Harmlos? |
|---|---|
| Server wurde neu installiert, neue Host-Keys erzeugt | ja |
| Die IP-Adresse gehört jetzt einer anderen Maschine (Cloud!) | meistens |
| Ein [[man-in-the-middle|Man-in-the-Middle]] sitzt zwischen dir und dem Server | **nein** |

Ein Man-in-the-Middle-Angriff heißt so, weil der Angreifer „in der Mitte“ sitzt: Er gibt sich dir
gegenüber als Server aus und dem Server gegenüber als du. Ohne Host-Key-Prüfung würdest du es nie
merken. Mit Prüfung kann er sich nicht als dein Server ausgeben, denn den privaten Host-Key des echten
Servers hat er nicht.

Das richtige Vorgehen bei der Warnung ist deshalb immer gleich:

1. **Nicht** einfach weitermachen. Herausfinden, ob es eine Erklärung gibt (Neuinstallation angekündigt?).
2. Den neuen Fingerprint über einen zweiten Weg bestätigen lassen.
3. Erst dann den alten Eintrag mit `ssh-keygen -R host` entfernen und neu verbinden.

> [!MERKSATZ]
> Die Host-Key-Warnung ist keine Störung, sondern die Alarmanlage von SSH. Klär die Ursache,
> bevor du den alten Eintrag löschst.

## StrictHostKeyChecking

Wie streng dein Client ist, steuert die Option `StrictHostKeyChecking`:

| Wert | Unbekannter Server | Geänderter Key |
|---|---|---|
| `ask` (Standard) | fragt nach | bricht ab |
| `accept-new` | wird automatisch gemerkt | bricht ab |
| `yes` | bricht ab | bricht ab |
| `no` | wird automatisch gemerkt | verbindet trotzdem (gefährlich!) |

> [!PRAXIS]
> In automatisierten Abläufen (CI-Pipelines, Deploy-Skripte) gibt es niemanden, der `yes` tippt.
> Gute Pipelines hinterlegen deshalb die bekannten Host-Keys vorab als Datei und nutzen
> `StrictHostKeyChecking yes`. `accept-new` ist ein vertretbarer Kompromiss, `no` dagegen ein
> Sicherheitsloch.

## Zusammenfassung

- Jeder SSH-Server hat eigene Host-Keys; damit beweist er dir seine Identität.
- Der Fingerprint ist eine kurze SHA-256-Prüfsumme des öffentlichen Schlüssels, gedacht für den Vergleich durch Menschen.
- Beim ersten Kontakt gilt Trust On First Use: Prüf den Fingerprint auf einem zweiten Weg, dann landet der Server in `~/.ssh/known_hosts`.
- `ssh-keygen -F` sucht, `-R` entfernt, `-l` zeigt Fingerprints und `-H` hasht Einträge in known_hosts.
- „REMOTE HOST IDENTIFICATION HAS CHANGED“ kann eine Neuinstallation oder ein Man-in-the-Middle-Angriff sein – Ursache klären, nie blind weitermachen.
- `StrictHostKeyChecking no` schaltet den Schutz ab; nutze `ask`, `accept-new` oder `yes`.
