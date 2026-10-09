---
title: Firewalls und ufw
summary: Wie eine Firewall Pakete nach Regeln erlaubt oder verwirft, warum sie „stateful“ arbeitet und wie du mit ufw einen Server absicherst, ohne dich auszusperren.
duration: 25
sources:
  - title: ufw(8) – Ubuntu Manpage
    url: https://manpages.ubuntu.com/manpages/noble/man8/ufw.8.html
  - title: Ubuntu Server – Firewalls
    url: https://documentation.ubuntu.com/server/how-to/security/firewalls/
  - title: Docker – Packet filtering and firewalls
    url: https://docs.docker.com/engine/network/packet-filtering-firewalls/
quiz:
  - type: single
    question: Was bedeutet „Default Deny“ für eingehenden Verkehr?
    options:
      - Alles ist erlaubt, außer was ausdrücklich verboten ist.
      - Alles ist verboten, außer was ausdrücklich erlaubt ist.
      - Nur Ping ist erlaubt.
    answer: 1
    explanation: Vergessene Dienste bleiben dadurch automatisch zu.
  - type: single
    question: Eine stateful Firewall erlaubt eingehend nur Port 443. Dein Server ruft selbst eine externe API auf. Kommt die Antwort an?
    options:
      - Nein, eingehend ist nur 443 erlaubt.
      - Ja, die Firewall merkt sich die ausgehende Verbindung und lässt Antworten darauf durch.
    answer: 1
    explanation: Genau das heißt stateful.
  - type: find-bug
    question: Dieses Skript soll einen frischen Server absichern, ohne die Admin-Verbindung zu kappen. Welche Zeile steht an der falschen Stelle?
    language: bash
    code: |
      ufw default deny incoming
      ufw default allow outgoing
      ufw --force enable
      ufw allow from 198.51.100.0/24 to any port 22 proto tcp
      ufw allow 443/tcp
    bug_line: 3
    explanation: Die Firewall wird eingeschaltet, bevor SSH erlaubt ist. `ufw --force enable` gehört ans Ende.
  - type: cloze
    text: "Verwirft eine Firewall ein Paket stillschweigend, heißt das ___. Schickt sie sofort eine Ablehnung zurück, heißt das ___."
    blanks:
      - [DROP, verwerfen]
      - [REJECT, ablehnen]
    explanation: Bei DROP läuft der Absender in einen Timeout, bei REJECT bekommt er sofort „Connection refused“.
tasks:
  - id: regeln-anwenden
    type: dragdrop
    title: Kommt das Paket durch?
    description: |
      Ein Server mit der Adresse `203.0.113.10` hat diese Regeln für **eingehenden** Verkehr:

      | Nr. | Regel |
      |---|---|
      | 1 | Standard: alles verwerfen |
      | 2 | 443/tcp von überall erlauben |
      | 3 | 22/tcp nur von `198.51.100.0/24` erlauben |
      | 4 | 5432/tcp nur von `10.0.2.0/24` erlauben |

      Ordne jedes eingehende Paket zu.
    targets:
      - { id: erlaubt, label: Wird durchgelassen }
      - { id: verworfen, label: Wird verworfen }
    items:
      - { label: "192.0.2.77 → Port 443", target: erlaubt }
      - { label: "198.51.100.5 → Port 22", target: erlaubt }
      - { label: "192.0.2.77 → Port 22", target: verworfen }
      - { label: "10.0.2.20 → Port 5432", target: erlaubt }
      - { label: "10.0.3.20 → Port 5432", target: verworfen }
      - { label: "198.51.100.5 → Port 80", target: verworfen }
      - { label: "Antwort auf eine Anfrage, die der Server selbst gestellt hat", target: erlaubt }
    hints:
      - Für jedes Paket brauchst du eine passende Erlaubnis – sonst greift der Standard.
      - Prüfe bei Regel 3 und 4, ob die Quelladresse im angegebenen Netz liegt.
      - Eine stateful Firewall lässt Antworten auf eigene Verbindungen automatisch durch.
  - id: ufw-einrichten
    type: simulated
    title: Einen frischen Server mit ufw absichern
    description: |
      Du bist per SSH aus dem Admin-Netz `198.51.100.0/24` auf einem neuen Server eingeloggt. Richte die
      Firewall ein – in sicherer Reihenfolge:

      1. `sudo ufw default deny incoming`
      2. `sudo ufw default allow outgoing`
      3. SSH nur aus dem Admin-Netz: `sudo ufw allow from 198.51.100.0/24 to any port 22 proto tcp`
      4. HTTPS für alle: `sudo ufw allow 443/tcp`
      5. Einschalten: `sudo ufw enable` (Rückfrage mit `y` bestätigen)
      6. Kontrolle: `sudo ufw status numbered`
    prompt: "admin@server:~$"
    steps:
      - expect: "^sudo\\s+ufw\\s+default\\s+deny\\s+incoming$"
        output: |
          Default incoming policy changed to 'deny'
          (be sure to update your rules accordingly)
        hint: Beginne mit dem Standard für eingehenden Verkehr.
      - expect: "^sudo\\s+ufw\\s+default\\s+allow\\s+outgoing$"
        output: "Default outgoing policy changed to 'allow'"
        hint: Jetzt der Standard für ausgehenden Verkehr.
      - expect: "^sudo\\s+ufw\\s+allow\\s+from\\s+198\\.51\\.100\\.0/24\\s+to\\s+any\\s+port\\s+22(\\s+proto\\s+tcp)?$"
        output: "Rules updated"
        hint: "sudo ufw allow from 198.51.100.0/24 to any port 22 proto tcp"
      - expect: "^sudo\\s+ufw\\s+allow\\s+(443/tcp|https)$"
        output: |
          Rules updated
          Rules updated (v6)
        hint: sudo ufw allow 443/tcp
      - expect: "^sudo\\s+ufw\\s+enable$"
        output: |
          Command may disrupt existing ssh connections. Proceed with operation (y|n)? y
          Firewall is active and enabled on system startup
        hint: Jetzt erst einschalten – SSH ist ja erlaubt.
      - expect: "^sudo\\s+ufw\\s+status(\\s+numbered|\\s+verbose)?$"
        output: |
          Status: active

               To                         Action      From
               --                         ------      ----
          [ 1] 22/tcp                     ALLOW IN    198.51.100.0/24
          [ 2] 443/tcp                    ALLOW IN    Anywhere
          [ 3] 443/tcp (v6)               ALLOW IN    Anywhere (v6)
        hint: sudo ufw status numbered
    responses:
      - match: "^sudo\\s+ufw\\s+allow\\s+(22|ssh|OpenSSH)(/tcp)?$"
        output: "Lieber nicht: Das öffnet SSH für die ganze Welt. Erlaube Port 22 nur aus 198.51.100.0/24."
      - match: "^ufw"
        output: "ERROR: You need to be root to run this script – setze sudo davor."
---

Jeder offene Port ist eine Angriffsfläche – auch wenn der Dienst dahinter gut abgesichert ist. Eine
[[firewall|Firewall]] entscheidet, welche Pakete überhaupt bis zu den Diensten durchkommen. Auf Ubuntu
und Debian richtest du sie mit [[ufw]] ein.

## Was eine Firewall prüft

Wie ein Pförtner schaut die Firewall für jedes Paket in ihre Regelliste:

| Merkmal | Beispiel |
|---|---|
| Richtung | eingehend (*inbound*) / ausgehend (*outbound*) |
| Protokoll und Port | `22/tcp`, `443/tcp`, `53/udp` |
| Quelle / Ziel | `198.51.100.0/24` oder `0.0.0.0/0` |
| Aktion | erlauben, verwerfen (*DROP*), ablehnen (*REJECT*) |

Bewährt ist: **eingehend alles verbieten** (*Default Deny*) und gezielt öffnen, **ausgehend erlauben**.
Und öffne Ports nur für die Quellen, die sie brauchen: SSH für das Admin-Netz, die Datenbank nur für das
App-Subnetz.

> [!MERKSATZ]
> Eingehend gilt: Was nicht ausdrücklich erlaubt ist, ist verboten – und jede Erlaubnis so eng wie
> möglich.

## Stateful: Antworten kommen von selbst

Moderne Firewalls arbeiten [[stateful-firewall|stateful]]: Sie merken sich aktive Verbindungen. Ein
Paket, das zu einer erlaubten Verbindung gehört – etwa die Antwort auf einen API-Aufruf des Servers –,
wird automatisch durchgelassen. Du schreibst Regeln also nur für den **Verbindungsaufbau**.

```text
Server → 198.51.100.80:443   ausgehend erlaubt → Verbindung gemerkt
198.51.100.80:443 → Server   Antwort gehört zur bekannten Verbindung → durchgelassen
```

Ältere *stateless* Filter kennen keine Zustände – dort braucht jede Richtung eine eigene Regel, und
vergessene Rückwege führen zu schwer verständlichen Fehlern.

Verbotene Pakete werden verworfen (DROP, der Absender wartet auf einen Timeout) oder abgelehnt (REJECT,
sofort „Connection refused“). Nach außen nimmt man meist DROP.

## ufw in der Praxis

```bash title="Terminal auf dem Server"
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow from 198.51.100.0/24 to any port 22 proto tcp   # SSH nur aus dem Admin-Netz
sudo ufw allow 443/tcp                                          # HTTPS für alle
sudo ufw enable
sudo ufw status numbered                                        # Regeln mit Nummern
sudo ufw delete 2                                               # Regel 2 löschen
```

ufw braucht Root-Rechte, deshalb steht `sudo` davor. Eine Regel für IPv4 legt ufw automatisch auch für
IPv6 an – in `ufw status` erkennst du sie am Zusatz `(v6)`. Statt Portnummern kannst du auch Profile wie
`OpenSSH` verwenden; `sudo ufw app list` zeigt, welche es gibt.

**Nicht aussperren:** Erlaube SSH, **bevor** du `ufw enable` ausführst. Lass danach die alte Sitzung
offen und teste in einem zweiten Terminal einen neuen Login. In Skripten gehört `ufw --force enable`
ans Ende.

> [!FEHLER]
> **SSH „nur kurz zum Testen“ für `0.0.0.0/0` öffnen.** Automatisierte Scanner probieren innerhalb von
> Minuten Passwörter durch. Erlaube SSH nur für bekannte Quellen.

## Docker und ufw

Docker schreibt beim Veröffentlichen von Ports (`-p 5432:5432`) eigene Paketfilter-Regeln, die **vor**
ufw greifen. Der Port ist dann von außen erreichbar, obwohl `ufw status` ihn nicht erlaubt.
Veröffentliche lokal gebrauchte Ports deshalb nur auf Loopback: `-p 127.0.0.1:5432:5432`.

> [!PRAXIS]
> Hängt eine Verbindung „einfach“ und bricht erst nach 30 Sekunden ab, ist oft eine Firewall mit DROP im
> Spiel. Kommt sofort „Connection refused“, erreicht das Paket den Server, aber dort lauscht nichts.

## Zusammenfassung

- Eine **Firewall** prüft Richtung, Protokoll, Port und Quelle/Ziel jedes Pakets.
- Bewährt: **eingehend Default Deny**, ausgehend erlaubt, Freigaben so eng wie möglich.
- **Stateful** Firewalls lassen Antworten auf bestehende Verbindungen automatisch durch.
- ufw: Standardregeln, gezielte `allow`-Regeln, **SSH vor `enable`**, mit zweitem Terminal testen.
- Docker-Ports umgehen ufw – lokal gebrauchte Ports nur auf `127.0.0.1` veröffentlichen.
