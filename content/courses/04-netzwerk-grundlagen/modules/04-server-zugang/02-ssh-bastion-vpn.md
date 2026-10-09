---
title: SSH, Bastion-Host und VPN
summary: Wie du Server in privaten Netzen über einen Bastion-Host (ProxyJump), einen SSH-Tunnel oder ein VPN erreichst – ohne sie dem Internet zu öffnen.
duration: 25
sources:
  - title: OpenSSH – ssh(1), Optionen -J, -L und -N
    url: https://man.openbsd.org/ssh
  - title: OpenSSH – ssh_config(5), ProxyJump
    url: https://man.openbsd.org/ssh_config
  - title: WireGuard
    url: https://www.wireguard.com/
quiz:
  - type: single
    question: Was ist ein Bastion-Host?
    options:
      - Ein besonders schneller Datenbankserver
      - Ein gehärteter, öffentlich erreichbarer Server, über den man in ein privates Netz springt
      - Der DNS-Server einer VPC
    answer: 1
    explanation: Der Bastion-Host (Jump Host) ist der einzige Eingang. Alle anderen Server bleiben privat.
  - type: cloze
    text: "Mit `ssh ___ deploy@203.0.113.10 deploy@10.0.2.15` springst du über den Bastion-Host direkt auf den App-Server."
    blanks:
      - ["-J"]
    explanation: "-J steht für ProxyJump. In der Konfigurationsdatei heißt die Option `ProxyJump`."
  - type: find-bug
    question: Mit dieser `~/.ssh/config` soll `ssh app` über den Bastion-Host gehen. Welche Zeile ist falsch?
    language: text
    code: |
      Host bastion
        HostName 203.0.113.10
        User deploy

      Host app
        HostName 10.0.2.15
        User deploy
        ProxyJump 10.0.2.15
    bug_line: 8
    explanation: ProxyJump muss auf den Sprung-Host zeigen – also `ProxyJump bastion`.
  - type: single
    question: Nach dem Verbinden mit dem Firmen-VPN ist dein Drucker zu Hause (192.168.1.20) nicht mehr erreichbar. Das Firmennetz nutzt 192.168.0.0/16. Warum?
    options:
      - Der Drucker ist kaputt.
      - Die Netze überschneiden sich – der Laptop schickt Pakete für 192.168.1.20 in den VPN-Tunnel.
      - VPNs blockieren grundsätzlich Drucker.
    answer: 1
    explanation: Deshalb planen Firmen ihre Netze in 10.x und meiden typische Heimnetz-Bereiche.
tasks:
  - id: bastion-beschriften
    type: diagram
    title: Beschrifte die Bastion-Architektur
    description: Setze die fehlenden Beschriftungen ein. Der Laptop erreicht die Server im privaten Netz nur über einen einzigen Eingang.
    image: /assets/netzwerk-grundlagen/bastion-leer.svg
    slots:
      - { x: 44, y: 29.8, answer: Öffentliches Subnetz }
      - { x: 44, y: 48.8, answer: Bastion-Host }
      - { x: 78.4, y: 29.8, answer: Private Subnetze }
      - { x: 78.4, y: 45.2, answer: App-Server }
    distractors: [NAT-Gateway, Load Balancer]
    hints:
      - Der Kasten mit der öffentlichen Adresse 203.0.113.10 ist der einzige Eingang.
      - Die Datenbank liegt im selben Bereich wie der App-Server – dort gibt es nur private Adressen.
  - id: ssh-jump
    type: simulated
    title: Über den Bastion-Host auf den App-Server
    description: |
      Du willst auf den App-Server `10.0.2.15` im privaten Subnetz. Er ist nur über den Bastion-Host
      `203.0.113.10` erreichbar.

      1. Versuch es zuerst direkt: `ssh deploy@10.0.2.15` – und beobachte, was passiert.
      2. Spring über den Bastion-Host: `ssh -J deploy@203.0.113.10 deploy@10.0.2.15`
      3. Prüfe auf dem App-Server, wo du bist: `hostname -I`
      4. Melde dich ab: `exit`
    prompt: "du@laptop:~$"
    steps:
      - expect: "^ssh\\s+deploy@10\\.0\\.2\\.15$"
        output: |
          ssh: connect to host 10.0.2.15 port 22: Connection timed out

          Klar: 10.0.2.15 ist eine private Adresse – von deinem Laptop aus gibt es keinen Weg dorthin.
        hint: Tippe `ssh deploy@10.0.2.15`.
      - expect: "^ssh\\s+-J\\s+deploy@203\\.0\\.113\\.10\\s+deploy@10\\.0\\.2\\.15$"
        output: |
          Welcome to Ubuntu 24.04 LTS (GNU/Linux x86_64)
          Last login: Thu Oct  8 09:12:44 2026 from 10.0.1.25
        prompt: "deploy@app-1:~$"
        hint: Tippe `ssh -J deploy@203.0.113.10 deploy@10.0.2.15`.
      - expect: "^hostname\\s+-I$"
        output: "10.0.2.15"
        hint: Tippe `hostname -I`.
      - expect: "^(exit|logout)$"
        output: "Connection to 10.0.2.15 closed."
        prompt: "du@laptop:~$"
        hint: Tippe `exit`.
    responses:
      - match: "^ssh\\s+deploy@203\\.0\\.113\\.10$"
        output: "Das brächte dich nur auf den Bastion-Host. Nutze -J, um direkt bis zum App-Server zu springen."
---

Datenbank und App-Server deines Projekts liegen – richtig so – in privaten Subnetzen. Aber irgendwann
musst du doch hin: Logs lesen, eine Abfrage prüfen. Wie kommst du an private Adressen, ohne die Server
dem Internet zu öffnen?

## SSH in Kürze

[[ssh|SSH]] verbindet dich verschlüsselt mit einem entfernten Rechner, der Server lauscht auf
**Port 22/tcp**. Statt eines Passworts nutzt man ein Schlüsselpaar: Der öffentliche Schlüssel liegt auf
dem Server, der private bleibt auf deinem Laptop.

```bash title="Terminal"
ssh deploy@203.0.113.10
```

Schlüssel und Härtung vertieft der Kurs „SSH“. Hier geht es um die Netzwerk-Frage: **Wie kommt die
Verbindung beim Server an?**

## Der Bastion-Host

Ein [[bastion-host|Bastion-Host]] (*Jump Host*) ist ein kleiner, gehärteter Server im öffentlichen
Subnetz – der **einzige** Eingang ins private Netz:

![Laptop verbindet sich per SSH mit dem Bastion-Host im öffentlichen Subnetz und von dort mit dem App-Server im privaten Subnetz](/assets/netzwerk-grundlagen/bastion.svg)

- Er lässt SSH nur aus bekannten Netzen zu.
- Die privaten Server erlauben SSH nur vom Bastion-Host (in AWS: Quelle `sg-bastion`).
- Auf ihm läuft sonst nichts – keine App, keine Datenbank, keine Schlüssel.

Mit [[proxyjump|ProxyJump]] (`-J`) springst du in einem Befehl über ihn hinweg. SSH tunnelt die zweite Verbindung
durch die erste; dein privater Schlüssel verlässt nie den Laptop:

```bash title="Terminal"
ssh -J deploy@203.0.113.10 deploy@10.0.2.15
```

In `~/.ssh/config` gibst du Hosts kurze Namen und schreibst `ProxyJump bastion` – dann genügt `ssh app`.
Mit `ssh -G app` prüfst du die Einstellungen, ohne zu verbinden.

> [!FEHLER]
> **Den privaten Schlüssel auf den Bastion-Host kopieren**, damit der zweite Sprung klappt. Wird der
> Bastion-Host übernommen, hat ein Angreifer Zugriff auf alle Server. ProxyJump braucht das nicht.

## SSH-Tunnel: ein einzelner Port

Willst du mit einem Werkzeug auf deinem Laptop direkt einen privaten Dienst ansprechen, reicht ein
Tunnel über den Bastion-Host:

```bash title="Terminal"
ssh -N -L 15432:10.0.3.20:5432 deploy@203.0.113.10
#        lokaler Port : Ziel aus Sicht des Bastion-Hosts
```

SSH lauscht dann auf deinem Laptop auf Port 15432 und schickt alles verschlüsselt zum Bastion-Host, der
es an `10.0.3.20:5432` weiterreicht. Dein Datenbank-Client verbindet sich danach mit `localhost:15432`. Der Tunnel lauscht nur auf Loopback;
`-N` heißt „keine Shell, nur tunneln“. In der Konfiguration schreibst du `LocalForward 15432 10.0.3.20:5432`.

## VPN: der Laptop im entfernten Netz

Ein [[vpn|VPN]] baut einen verschlüsselten Tunnel zu einem VPN-Server und gibt deinem Laptop eine
zusätzliche, virtuelle Schnittstelle mit Adresse im entfernten Netz. Danach sind private Adressen direkt
erreichbar. Bei einem *Split-Tunnel* geht nur der Verkehr für das Firmennetz (z. B. `10.0.0.0/16`) in den
Tunnel.

| Situation | Weg |
|---|---|
| Kurz eine Shell auf einem Server | SSH mit ProxyJump |
| Ein Dienst mit lokalem Werkzeug | SSH-Tunnel (`-L`) |
| Viele interne Dienste, ganzes Team, täglich | VPN |

> [!MERKSATZ]
> Ein kontrollierter Eingang statt offener Ports: Bastion-Host, Tunnel oder VPN – private Server bleiben
> privat.

> [!PRAXIS]
> Überlappen Firmen- und Heimnetz (beide `192.168.1.0/24`), sind mit VPN plötzlich Drucker oder
> Datenbank unerreichbar. Teams planen ihre Netze deshalb in `10.0.0.0/8`.

## Zusammenfassung

- **SSH** verbindet verschlüsselt auf Port 22, am besten mit Schlüssel statt Passwort.
- Ein **Bastion-Host** ist der einzige öffentliche Eingang; private Server erlauben SSH nur von ihm.
- **ProxyJump** (`ssh -J`) springt hinüber, ohne dass dein Schlüssel den Laptop verlässt.
- Ein **SSH-Tunnel** (`-L`) holt einen einzelnen Port auf deinen Laptop.
- Ein **VPN** macht den Laptop zum Teil des entfernten Netzes – Netze dürfen sich nicht überschneiden.
