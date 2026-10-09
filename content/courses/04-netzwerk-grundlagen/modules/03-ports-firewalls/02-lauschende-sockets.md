---
title: Wer lauscht auf welchem Port?
summary: Mit ss, lsof und netstat findest du heraus, welche Prozesse auf welchen Ports und Adressen lauschen – und liest die Ausgabe richtig.
duration: 25
sources:
  - title: man ss (iproute2)
    url: https://man7.org/linux/man-pages/man8/ss.8.html
  - title: man lsof
    url: https://man7.org/linux/man-pages/man8/lsof.8.html
  - title: Linux-Kernel-Doku – /proc/net/tcp
    url: https://www.kernel.org/doc/html/latest/networking/proc_net_tcp.html
quiz:
  - type: match
    question: Was bedeuten die Optionen von `ss -tlnp`?
    pairs:
      - { left: "-t", right: nur TCP-Sockets }
      - { left: "-l", right: nur lauschende Sockets (LISTEN) }
      - { left: "-n", right: Zahlen statt Namen (Port 22 statt ssh) }
      - { left: "-p", right: zeigt den Prozess dazu }
    explanation: "`ss -tlnp` ist die Standardfrage: Welche TCP-Ports sind offen und welches Programm steckt dahinter?"
  - type: single
    question: "`ss -tln` zeigt die Zeile `LISTEN 0 244 127.0.0.1:5432 0.0.0.0:*`. Was bedeutet das?"
    options:
      - PostgreSQL ist aus dem ganzen Internet erreichbar.
      - PostgreSQL lauscht nur auf Loopback und ist nur vom Server selbst erreichbar.
      - PostgreSQL ist gerade mit 127.0.0.1 verbunden.
    answer: 1
    explanation: Die lokale Adresse 127.0.0.1 heißt – nur Loopback. Von außen kommt niemand an diesen Port, egal was die Firewall sagt.
  - type: single
    question: "Welche lokale Adresse in `ss -tln` bedeutet „auf allen IPv4-Schnittstellen“?"
    options: ["127.0.0.1:80", "0.0.0.0:80", "*:*", "10.0.2.15:80"]
    answer: 1
    explanation: "0.0.0.0 ist der Platzhalter für alle IPv4-Schnittstellen. Für IPv6 steht dort `[::]` oder `*`."
  - type: cloze
    text: "Um nur die Prozesse auf Port 5432 zu sehen, nutzt du `sudo lsof -i :___`."
    blanks:
      - ["5432"]
    explanation: lsof -i filtert Netzwerk-Verbindungen, `:5432` beschränkt auf diesen Port.
tasks:
  - id: ss-lesen
    type: simulated
    title: Offene Ports auf einem Server finden
    description: |
      Auf einem Server läuft „irgendwas“ auf Port 8080, das dort nicht hingehört. Finde es und beende es.

      1. Zeige alle lauschenden TCP-Ports samt Prozess mit `sudo ss -tlnp`.
      2. Schau dir den Prozess auf Port 8080 genauer an: `sudo lsof -i :8080`.
      3. Beende ihn mit `kill 2741`.
      4. Prüfe mit `sudo ss -tlnp`, dass Port 8080 verschwunden ist.
    prompt: "admin@server:~$"
    steps:
      - expect: "^sudo\\s+ss\\s+-(tlnp|tnlp|ltnp|lntp|ntlp|nltp|tlpn|tpln|plnt)$"
        output: |
          State   Recv-Q  Send-Q  Local Address:Port  Peer Address:Port  Process
          LISTEN  0       128           0.0.0.0:22         0.0.0.0:*      users:(("sshd",pid=812,fd=3))
          LISTEN  0       511           0.0.0.0:80         0.0.0.0:*      users:(("nginx",pid=930,fd=6))
          LISTEN  0       511           0.0.0.0:443        0.0.0.0:*      users:(("nginx",pid=930,fd=7))
          LISTEN  0       244         127.0.0.1:5432       0.0.0.0:*      users:(("postgres",pid=1104,fd=5))
          LISTEN  0       511           0.0.0.0:8080       0.0.0.0:*      users:(("node",pid=2741,fd=19))
          LISTEN  0       128              [::]:22            [::]:*      users:(("sshd",pid=812,fd=4))
        hint: Tippe `sudo ss -tlnp`.
      - expect: "^sudo\\s+lsof\\s+-i\\s*:8080$"
        output: |
          COMMAND  PID    USER   FD   TYPE  DEVICE SIZE/OFF NODE NAME
          node    2741  deploy   19u  IPv4   48213      0t0  TCP *:http-alt (LISTEN)

          Ein vergessener Entwicklungsserver, gestartet vom Benutzer deploy – und auf 0.0.0.0, also von außen erreichbar!
        hint: Tippe `sudo lsof -i :8080`.
      - expect: "^(sudo\\s+)?kill\\s+2741$"
        output: ""
        hint: Tippe `kill 2741`.
      - expect: "^sudo\\s+ss\\s+-(tlnp|tnlp|ltnp|lntp|ntlp|nltp|tlpn|tpln|plnt)$"
        output: |
          State   Recv-Q  Send-Q  Local Address:Port  Peer Address:Port  Process
          LISTEN  0       128           0.0.0.0:22         0.0.0.0:*      users:(("sshd",pid=812,fd=3))
          LISTEN  0       511           0.0.0.0:80         0.0.0.0:*      users:(("nginx",pid=930,fd=6))
          LISTEN  0       511           0.0.0.0:443        0.0.0.0:*      users:(("nginx",pid=930,fd=7))
          LISTEN  0       244         127.0.0.1:5432       0.0.0.0:*      users:(("postgres",pid=1104,fd=5))
          LISTEN  0       128              [::]:22            [::]:*      users:(("sshd",pid=812,fd=4))

          Port 8080 ist weg. Gut gemacht!
        hint: Tippe noch einmal `sudo ss -tlnp`.
    responses:
      - match: "^ss\\s+-"
        output: "Ohne sudo siehst du die Prozess-Spalte nur für deine eigenen Prozesse. Nutze sudo ss -tlnp."
      - match: "^(sudo\\s+)?netstat"
        output: "netstat ist auf diesem Server nicht installiert – nutze das modernere ss."
  - id: proc-net-tcp
    type: terminal
    title: Lauschende Ports aus /proc/net/tcp entziffern
    description: |
      `ss` liest seine Informationen unter anderem aus der Datei `/proc/net/tcp`. Dort stehen Adressen
      und Ports in **Hexadezimal**. Im Ordner `proc-auszug` liegt ein Auszug davon von einem Server.

      1. Klicke auf **Aufgabe vorbereiten** und schau dir `tcp-auszug.txt` an.
      2. In der Spalte `local_address` steht nach dem Doppelpunkt der Port in Hex. In der Spalte `st`
         bedeutet `0A` „LISTEN“, `01` „ESTABLISHED“ (bestehende Verbindung).
      3. Schreibe die Ports **aller lauschenden Sockets** als Dezimalzahlen in `ports.txt` – eine pro Zeile,
         aufsteigend sortiert.

      Tipp: `printf "%d\n" 0x0016` rechnet Hex in Dezimal um.
    workdir: proc-auszug
    setup: |
      cat > tcp-auszug.txt <<'EOF'
        sl  local_address rem_address   st tx_queue rx_queue tr tm->when retrnsmt   uid  timeout inode
         0: 00000000:0016 00000000:0000 0A 00000000:00000000 00:00000000 00000000     0        0 18342
         1: 0100007F:1538 00000000:0000 0A 00000000:00000000 00:00000000 00000000   112        0 21877
         2: 00000000:01BB 00000000:0000 0A 00000000:00000000 00:00000000 00000000     0        0 19021
         3: 0F02000A:0016 0A01A8C0:D431 01 00000000:00000000 02:000A2B1C 00000000     0        0 30411
      EOF
    checks:
      - type: file_exists
        path: ports.txt
        message: Die Datei ports.txt fehlt noch.
      - type: command
        run: grep -c . ports.txt
        stdout_matches: "^3$"
        message: Im Auszug gibt es genau drei lauschende Sockets (st = 0A). ports.txt braucht drei Zeilen.
      - type: command
        run: "tr -d ' \\r' < ports.txt | grep . | tr '\\n' ' '"
        stdout_equals: "22 443 5432"
        message: Die Ports stimmen noch nicht oder sind nicht aufsteigend sortiert. Rechne die Hex-Werte nach dem Doppelpunkt in local_address um.
    hints:
      - "Zeile 3 ist mit `01` eine bestehende Verbindung, kein lauschender Socket – sie zählt nicht."
      - "0x0016 = 22, die anderen beiden rechnest du mit `printf \"%d\\n\" 0x1538 0x01BB` aus."
      - "Sortiert schreiben: `printf '%s\\n' 22 443 5432 > ports.txt`."
    solution: |
      ```bash
      cd proc-auszug
      cat tcp-auszug.txt
      printf "%d\n" 0x0016 0x1538 0x01BB     # 22, 5432, 443
      printf '%s\n' 22 443 5432 > ports.txt
      ```
---

„Der Port ist schon belegt“, „Ist die Datenbank von außen erreichbar?“, „Warum antwortet der Server auf
Port 3000 nicht?“ – alle drei Fragen beantwortest du mit derselben Fähigkeit: herausfinden, **welcher
Prozess auf welcher Adresse und welchem Port lauscht**.

## ss: die Liste der offenen Ports

Unter Linux ist `ss` (*socket statistics*) das Standardwerkzeug. Die wichtigste Kombination
lautet:

```bash title="Terminal"
sudo ss -tlnp
```

| Option | Bedeutung |
|---|---|
| `-t` | nur TCP (`-u` für UDP) |
| `-l` | nur lauschende Sockets |
| `-n` | Portnummern statt Dienstnamen |
| `-p` | zugehöriger [[prozess|Prozess]] mit PID (braucht oft `sudo`) |

```text title="Ausgabe"
State   Recv-Q Send-Q  Local Address:Port  Peer Address:Port  Process
LISTEN  0      128           0.0.0.0:22         0.0.0.0:*     users:(("sshd",pid=812,fd=3))
LISTEN  0      511           0.0.0.0:443        0.0.0.0:*     users:(("nginx",pid=930,fd=7))
LISTEN  0      244         127.0.0.1:5432       0.0.0.0:*     users:(("postgres",pid=1104,fd=5))
LISTEN  0      128              [::]:22            [::]:*     users:(("sshd",pid=812,fd=4))
```

Ältere Anleitungen nutzen `netstat -tlnp` – die Ausgabe ist ähnlich, das Werkzeug ist aber auf vielen
Systemen nicht mehr installiert.

## Die Local-Address-Spalte richtig lesen

Die wichtigste Spalte ist **Local Address:Port**. Sie verrät nicht nur den Port, sondern auch die
Bind-Adresse – und damit, **wer** den Dienst erreichen kann:

| Local Address | Bedeutung |
|---|---|
| `0.0.0.0:443` | alle IPv4-Schnittstellen – von außen erreichbar, sofern die Firewall es zulässt |
| `[::]:22` oder `*:22` | alle IPv6- (oft auch IPv4-)Schnittstellen |
| `127.0.0.1:5432` | nur Loopback – nur der Server selbst |
| `10.0.2.15:8080` | nur diese eine Schnittstelle, z. B. das private Netz |

> [!MERKSATZ]
> `ss -tlnp` zeigt dir für jeden offenen Port die Bind-Adresse und den Prozess. `0.0.0.0` heißt
> „überall“, `127.0.0.1` heißt „nur lokal“.

> [!FEHLER]
> **Nur auf den Port schauen.** „5432 ist offen, die Datenbank ist von außen erreichbar!“ – nicht, wenn
> sie auf `127.0.0.1` lauscht. Umgekehrt ist ein Entwicklungsserver auf `0.0.0.0:3000` sehr wohl
> erreichbar, obwohl du ihn nur lokal benutzen wolltest.

## lsof: Wer hält diesen Port?

`lsof` (*list open files*) zeigt alle geöffneten Dateien – und für Linux sind Sockets auch Dateien. Mit
`-i` filterst du auf Netzwerkverbindungen:

```bash title="Terminal"
sudo lsof -i :5432          # wer benutzt Port 5432?
sudo lsof -i -P -n          # alle Netzwerk-Sockets, Zahlen statt Namen
```

Die Spalte `PID` nennt die Prozessnummer, `USER` den Benutzer, unter dem der Prozess läuft – praktisch,
um herauszufinden, wer einen vergessenen Server gestartet hat. Auf macOS gibt es kein `ss`; dort ist `lsof -iTCP -sTCP:LISTEN -P -n` die übliche Wahl. Hast du die PID
gefunden, beendest du den Prozess mit `kill <PID>`.

## Ein Blick unter die Haube: /proc/net/tcp

`ss` holt sich seine Daten direkt vom Linux-Kernel. Eine lesbare Quelle dafür ist `/proc/net/tcp`. Dort
stehen Adressen und Ports in Hexadezimal, die IPv4-Adresse sogar in umgekehrter Byte-Reihenfolge:

```text
  sl  local_address rem_address   st
   0: 0100007F:1F40 00000000:0000 0A
```

- `0100007F` rückwärts gelesen ist `7F.00.00.01` = `127.0.0.1`.
- `1F40` in Hex ist `8000` – ein Server auf `127.0.0.1:8000`.
- `st` = `0A` bedeutet LISTEN.

Das brauchst du im Alltag selten. Es hilft aber in minimalen Containern, in denen weder `ss` noch `lsof`
installiert sind – wie in deinem Übungs-Terminal.

> [!PRAXIS]
> Nach jedem Deployment lohnt ein kurzer Blick auf `sudo ss -tlnp`: Lauscht der neue Dienst auf dem
> richtigen Port? Und lauscht nichts, was dort nicht hingehört – etwa ein vergessener Debug-Server auf
> `0.0.0.0`?

## Zusammenfassung

- `sudo ss -tlnp` listet lauschende TCP-Ports mit Bind-Adresse und Prozess.
- Die **Local Address** zeigt, wer den Dienst erreichen kann: `0.0.0.0`/`[::]` überall, `127.0.0.1` nur lokal.
- `lsof -i :PORT` zeigt, welcher Prozess einen Port belegt; `kill <PID>` beendet ihn.
- Auf macOS: `lsof -iTCP -sTCP:LISTEN -P -n`; das alte `netstat` ist oft nicht mehr installiert.
- `/proc/net/tcp` enthält dieselben Daten in Hexadezimal – nützlich in minimalen Containern.
