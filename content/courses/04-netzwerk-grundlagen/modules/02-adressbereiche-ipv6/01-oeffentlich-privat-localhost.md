---
title: Öffentlich, privat, localhost und 0.0.0.0
summary: Welche Adressen nur lokal gelten (RFC 1918), was Loopback und localhost sind und warum die Bind-Adresse entscheidet, wer deinen Dienst erreicht.
duration: 25
sources:
  - title: RFC 1918 – Address Allocation for Private Internets
    url: https://www.rfc-editor.org/rfc/rfc1918
  - title: IANA IPv4 Special-Purpose Address Registry
    url: https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry.xhtml
  - title: PHP – Eingebauter Webserver
    url: https://www.php.net/manual/en/features.commandline.webserver.php
quiz:
  - type: multiple
    question: Welche Adressen sind private Adressen nach RFC 1918?
    options: ["10.250.3.1", "172.20.0.5", "172.40.0.5", "192.168.99.1", "192.169.0.1"]
    answers: [0, 1, 3]
    explanation: Privat sind 10.0.0.0/8, 172.16.0.0/12 (172.16 bis 172.31) und 192.168.0.0/16. 172.40 und 192.169 liegen knapp daneben.
  - type: single
    question: Dein Laptop hat plötzlich die Adresse `169.254.37.12`. Was ist vermutlich passiert?
    options:
      - Du bist mit einem öffentlichen WLAN verbunden.
      - Der Laptop hat keine Antwort von einem DHCP-Server bekommen und sich selbst eine Adresse gegeben.
      - Du bist per VPN mit der Firma verbunden.
    answer: 1
    explanation: 169.254.x.x vergibt ein Gerät sich selbst, wenn kein DHCP-Server antwortet. Damit kommt es nicht ins Internet.
  - type: single
    question: Ein Server lauscht auf `127.0.0.1:3000`. Wer kann ihn erreichen?
    options: [Jeder im Internet, Alle Geräte im selben WLAN, Nur Programme auf demselben Rechner]
    answer: 2
    explanation: 127.0.0.1 ist die Loopback-Adresse. Pakete an sie verlassen den Rechner nie.
  - type: find-bug
    question: Diese App läuft in einem Docker-Container. Von außen (Port 3000 ist veröffentlicht) bekommst du keine Verbindung. Welche Zeile ist schuld?
    language: js
    code: |
      const http = require('node:http')
      const server = http.createServer((req, res) => res.end('ok'))
      server.listen(3000, '127.0.0.1')
      console.log('läuft auf Port 3000')
    bug_line: 3
    explanation: Im Container ist 127.0.0.1 nur der Container selbst. Die App muss auf `0.0.0.0` lauschen, damit Docker Verbindungen weiterreichen kann.
tasks:
  - id: bereiche-sortieren
    type: dragdrop
    title: Öffentlich, privat oder Sonderfall?
    description: Ordne jede Adresse dem richtigen Bereich zu.
    targets:
      - { id: privat, label: Privat (RFC 1918) }
      - { id: oeffentlich, label: Öffentlich (im Internet routbar) }
      - { id: spezial, label: "Sonderbereich (Loopback, Link-local, Doku)" }
    items:
      - { label: "10.0.8.15", target: privat }
      - { label: "172.31.0.1", target: privat }
      - { label: "192.168.178.1", target: privat }
      - { label: "172.32.0.1", target: oeffentlich }
      - { label: "192.169.10.1", target: oeffentlich }
      - { label: "127.0.0.1", target: spezial }
      - { label: "169.254.1.1", target: spezial }
      - { label: "198.51.100.20", target: spezial }
    hints:
      - "Privat: 10.x, 172.16–31.x, 192.168.x."
      - 127 ist Loopback, 169.254 link-local, 198.51.100 Dokumentation.
  - id: lokaler-server
    type: terminal
    title: Einen Server auf 127.0.0.1 starten und abfragen
    description: |
      Im Ordner `localhost-test` liegt eine kleine PHP-Datei `index.php`. Starte einen Webserver, der
      nur auf der Loopback-Adresse lauscht, und frage ihn mit `curl` ab.

      1. `cd localhost-test`
      2. Starte den Server im Hintergrund: `php -S 127.0.0.1:8000 > server.log 2>&1 &`
      3. Frage ihn über die Adresse ab und speichere die Antwort: `curl -s http://127.0.0.1:8000/ > antwort-ip.txt`
      4. Frage ihn über den Namen ab: `curl -s http://localhost:8000/ > antwort-name.txt`
      5. Beende den Server wieder mit `kill %1` (oder `kill` und der Prozessnummer).

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: localhost-test
    setup: |
      cat > index.php <<'EOF'
      <?php
      echo "Hallo vom Loopback! Du hast mich über " . $_SERVER['HTTP_HOST'] . " erreicht.\n";
      EOF
    checks:
      - type: file_contains
        path: antwort-ip.txt
        pattern: "Hallo vom Loopback! Du hast mich über 127\\.0\\.0\\.1:8000"
        message: antwort-ip.txt enthält noch nicht die Antwort des Servers über 127.0.0.1:8000. Läuft der Server, als du curl ausgeführt hast?
      - type: file_contains
        path: antwort-name.txt
        pattern: "Hallo vom Loopback! Du hast mich über localhost:8000"
        message: antwort-name.txt enthält noch nicht die Antwort über den Namen localhost.
      - type: command
        run: "if nc -z 127.0.0.1 8000 2>/dev/null; then echo offen; else echo geschlossen; fi"
        stdout_equals: geschlossen
        message: Auf Port 8000 lauscht noch ein Server. Beende ihn mit `kill %1` oder `kill <PID>`.
    hints:
      - Das `&` am Ende startet den Server im Hintergrund, damit du im selben Terminal weitertippen kannst.
      - "Mit `jobs` siehst du deine Hintergrundprozesse, mit `kill %1` beendest du den ersten davon."
      - Falls `curl` „Connection refused“ meldet, warte eine Sekunde – der Server braucht einen Moment zum Starten.
    solution: |
      ```bash
      cd localhost-test
      php -S 127.0.0.1:8000 > server.log 2>&1 &
      sleep 1
      curl -s http://127.0.0.1:8000/ > antwort-ip.txt
      curl -s http://localhost:8000/ > antwort-name.txt
      cat antwort-ip.txt antwort-name.txt
      kill %1
      ```
---

Dein Laptop hat `192.168.178.23`, der Laptop deiner Nachbarin auch – und trotzdem gibt es keinen
Konflikt. Und wenn dein Entwicklungsserver „auf localhost“ läuft, kann ihn sonst niemand sehen. Beides
hat mit besonderen Adressbereichen zu tun.

## Öffentlich gegen privat

Eine [[oeffentliche-ip-adresse|öffentliche IP-Adresse]] ist weltweit eindeutig und im Internet routbar.
Vergeben werden sie über Vergabestellen an Internetanbieter ([[isp|ISPs]]), Cloud-Anbieter und Firmen.
Eine [[private-ip-adresse|private IP-Adresse]] darf dagegen jeder im eigenen Netz frei benutzen –
Router im Internet leiten Pakete an sie nicht weiter. Welche Bereiche privat sind, legt [[rfc|RFC]] 1918
fest:

| Bereich | Von – bis | Typischer Einsatz |
|---|---|---|
| `10.0.0.0/8` | 10.0.0.0 – 10.255.255.255 | Firmen, Cloud-Netze (VPC) |
| `172.16.0.0/12` | 172.16.0.0 – 172.31.255.255 | Docker, Firmennetze |
| `192.168.0.0/16` | 192.168.0.0 – 192.168.255.255 | Heimnetze, kleine Büros |

> [!FEHLER]
> **„Alles mit 172 ist privat.“** Nur `172.16` bis `172.31` gehören dazu. `172.40.0.1` ist öffentlich,
> genau wie `192.169.0.1` – nur `192.168` ist privat.

## Sonderbereiche

| Bereich | Bedeutung |
|---|---|
| `127.0.0.0/8` | [[loopback|Loopback]] – der eigene Rechner |
| `169.254.0.0/16` | Link-local – selbst vergebene Notfall-Adresse, wenn kein DHCP antwortet |
| `100.64.0.0/10` | Carrier-Grade-NAT bei Internetanbietern |
| `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24` | Dokumentation und Beispiele |
| `224.0.0.0/4` | [[multicast|Multicast]] |
| `0.0.0.0` | „unbekannt“ bzw. „alle Schnittstellen“ |

> [!MERKSATZ]
> Privat sind `10.x`, `172.16.x`–`172.31.x` und `192.168.x`. Ein Gerät mit nur privater Adresse ist aus
> dem Internet nicht direkt erreichbar – genau das nutzt man in der Cloud für Datenbanken.

## Loopback und localhost

Die Loopback-Schnittstelle (`lo`) ist eine virtuelle Netzwerkkarte: Alles, was du an `127.0.0.1` (IPv6:
`::1`) schickst, kommt sofort beim eigenen Rechner wieder an – ohne den Rechner je zu verlassen.
[[localhost]] ist nur ein **Name** dafür, eingetragen in `/etc/hosts`:

```text title="/etc/hosts"
127.0.0.1   localhost
::1         localhost ip6-localhost ip6-loopback
```

Weil `localhost` auf zwei Adressen zeigt, probieren viele Programme zuerst `::1` (IPv6) und dann
`127.0.0.1`. Lauscht dein Server nur auf IPv4, kann das zu kurzen Verzögerungen oder Fehlermeldungen
führen – dann hilft es, direkt `127.0.0.1` in die URL zu schreiben. Loopback funktioniert übrigens auch
ganz ohne WLAN oder Kabel; deshalb ist es ideal für die Entwicklung.

## Die Bind-Adresse entscheidet

Startet ein Server, muss er sich an Adresse und Port [[binden]]. Die Bind-Adresse legt fest, wer ihn
erreichen kann:

| Bind-Adresse | Erreichbar für |
|---|---|
| `127.0.0.1` | nur Programme auf demselben Rechner |
| `192.168.178.23` | Geräte im WLAN über diese Schnittstelle |
| `0.0.0.0` | alle Schnittstellen – Loopback, WLAN, Docker-Netz |

```bash title="Terminal"
php -S 127.0.0.1:8000     # nur lokal
php -S 0.0.0.0:8000       # auch für andere Geräte im Netz
```

`0.0.0.0` ist hier ein Platzhalter („überall lauschen“), kein Ziel, das man aufruft. In einem
Docker-Container ist `127.0.0.1` übrigens der Container selbst – Apps dort lauschen deshalb auf `0.0.0.0`.

> [!PRAXIS]
> „Lokal läuft es, im Container nicht“ – prüfe zuerst die Bind-Adresse. Vite braucht `--host`, Laravel
> `php artisan serve --host=0.0.0.0`. Und umgekehrt: Im Café-WLAN gehört ein Entwicklungsserver auf
> `127.0.0.1`, sonst kann jeder im WLAN mitsurfen.

## Zusammenfassung

- **Öffentliche** Adressen sind weltweit eindeutig, **private** (RFC 1918) gelten nur lokal.
- Privat: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`; Sonderbereiche wie `169.254/16` haben feste Bedeutungen.
- **Loopback** (`127.0.0.1`, `::1`) ist der eigene Rechner, **localhost** ein Name dafür.
- Die **Bind-Adresse** entscheidet: `127.0.0.1` nur lokal, `0.0.0.0` alle Schnittstellen.
