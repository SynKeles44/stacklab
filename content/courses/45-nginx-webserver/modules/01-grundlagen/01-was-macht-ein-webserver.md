---
title: Was macht ein Webserver?
summary: Welche Aufgaben ein Webserver übernimmt, wie sich statische und dynamische Inhalte unterscheiden und warum nginx mit einem Master- und mehreren Worker-Prozessen so viele Verbindungen gleichzeitig schafft.
duration: 20
sources:
  - title: nginx – Beginner's Guide
    url: https://nginx.org/en/docs/beginners_guide.html
  - title: nginx – Controlling nginx (Signale, Master und Worker)
    url: https://nginx.org/en/docs/control.html
  - title: nginx – Connection processing methods
    url: https://nginx.org/en/docs/events.html
  - title: MDN – What is a web server?
    url: https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_web_server
quiz:
  - type: single
    question: Ein Browser fragt `/logo.png` an. Die Datei liegt fertig auf der Festplatte des Servers. Wie nennt man so einen Inhalt?
    options:
      - Dynamischer Inhalt
      - Statischer Inhalt
      - Proxy-Inhalt
      - Upstream-Inhalt
    answer: 1
    explanation: >
      Statische Inhalte liegen fertig als Datei vor und werden unverändert ausgeliefert. Dynamische Inhalte
      erzeugt erst ein Programm (z. B. PHP oder Node.js) für jede Anfrage neu.
  - type: multiple
    question: Welche Aufgaben übernimmt nginx in typischen Web-Projekten?
    options:
      - Statische Dateien wie HTML, CSS und Bilder ausliefern
      - Anfragen an eine Anwendung weiterreichen (Reverse Proxy)
      - TLS-Verschlüsselung für HTTPS abwickeln
      - Den PHP-Code einer Laravel-App selbst ausführen
    answers: [0, 1, 2]
    explanation: >
      nginx kann selbst kein PHP ausführen. Er reicht PHP-Anfragen an PHP-FPM weiter, das den Code
      ausführt. Dateien ausliefern, weiterreichen und HTTPS abwickeln sind dagegen seine Kernaufgaben.
  - type: match
    question: Ordne jedem nginx-Prozess seine Aufgabe zu.
    pairs:
      - { left: "Master-Prozess", right: "Liest die Konfiguration und startet und überwacht die Worker" }
      - { left: "Worker-Prozess", right: "Nimmt Verbindungen an und beantwortet Anfragen" }
      - { left: "nginx -s reload", right: "Signal: neue Konfiguration laden, ohne Verbindungen abzubrechen" }
    explanation: >
      Der Master arbeitet nie selbst an Anfragen. Er verteilt die Arbeit auf Worker und tauscht sie beim
      Reload behutsam gegen neue aus.
  - type: cloze
    text: "Ein nginx-Worker bearbeitet viele Verbindungen gleichzeitig, weil er nicht auf langsame Clients ___, sondern über eine Ereignisschleife (___) immer die Verbindung bedient, die gerade bereit ist."
    blanks:
      - [wartet, blockiert]
      - [event loop, event-loop, eventloop, ereignisschleife]
    explanation: >
      Statt pro Verbindung einen Prozess zu blockieren, fragt der Worker das Betriebssystem, welche
      Verbindungen gerade lesbar oder schreibbar sind, und arbeitet nur diese ab.
tasks:
  - id: nginx-erkunden
    type: simulated
    title: Einen laufenden nginx erkunden
    description: |
      Du bist per SSH auf einem frisch eingerichteten Server (`203.0.113.10`) angemeldet, auf dem nginx
      läuft. Verschaffe dir einen Überblick – das Übungs-Terminal hat kein nginx, deshalb ist dieses
      Terminal simuliert.

      1. Zeige die installierte Version mit `nginx -v`.
      2. Liste die nginx-Prozesse mit `ps -C nginx -o pid,user,cmd`.
      3. Frage die Startseite mit `curl -I http://localhost` ab und sieh dir die Antwort-Header an.
    prompt: "deploy@server:~$"
    steps:
      - expect: "^nginx\\s+-v$"
        output: |
          nginx version: nginx/1.30.5
        hint: Tippe nginx -v (kleines v).
      - expect: "^ps\\s+-C\\s+nginx\\s+-o\\s+pid,user,cmd$"
        output: |
              PID USER     CMD
              812 root     nginx: master process /usr/sbin/nginx -g daemon on; master_process on;
              813 www-data nginx: worker process
              814 www-data nginx: worker process
        hint: "Genau so: ps -C nginx -o pid,user,cmd"
      - expect: "^curl\\s+-I\\s+http://localhost/?$"
        output: |
          HTTP/1.1 200 OK
          Server: nginx/1.30.5
          Date: Sat, 10 Oct 2026 09:12:44 GMT
          Content-Type: text/html
          Content-Length: 615
          Last-Modified: Thu, 08 Oct 2026 14:02:11 GMT
          Connection: keep-alive
          ETag: "6705a0e3-267"
          Accept-Ranges: bytes
        hint: curl -I fragt nur die Header ab.
    responses:
      - match: "^nginx\\s+-V"
        output: "nginx version: nginx/1.30.5\nbuilt with OpenSSL 3.5.1\nconfigure arguments: --with-http_ssl_module --with-http_v2_module ..."
      - match: "^(sudo\\s+)?systemctl\\s+status\\s+nginx"
        output: "● nginx.service - A high performance web server and a reverse proxy server\n     Active: active (running) since Sat 2026-10-10 08:55:02 UTC"
      - match: "^ls"
        output: "app"
    hints:
      - Mit `ps` siehst du, dass ein Prozess als root und mehrere als www-data laufen.
      - Achte im curl-Ergebnis auf den Header `Server`.
    solution: |
      ```bash
      nginx -v
      ps -C nginx -o pid,user,cmd
      curl -I http://localhost
      ```
      Der Master läuft als `root`, weil nur root Port 80 öffnen darf. Die Worker laufen als
      unprivilegierter Benutzer `www-data` und beantworten die Anfragen.
  - id: anfrage-weg
    type: order
    title: Der Weg einer Anfrage durch nginx
    description: Ein Browser ruft `https://example.com/style.css` auf. Bringe die Schritte auf dem Server in die richtige Reihenfolge.
    items:
      - Ein Worker-Prozess nimmt die TCP-Verbindung an
      - Der Worker liest die HTTP-Anfrage und den Host-Header
      - nginx wählt den passenden server-Block
      - nginx wählt im server-Block den passenden location-Block
      - Die Datei style.css wird von der Festplatte gelesen
      - Der Worker schickt die Antwort mit Status 200 und Content-Type text/css
---

Stell dir ein Restaurant vor: Die Gäste wollen nicht in die Küche laufen, sie geben ihre Bestellung
an der Theke ab. Die Theke reicht Getränke direkt heraus und gibt warme Gerichte an die Küche weiter.
Genau diese Rolle spielt ein [[webserver|Webserver]] für Websites – und [[nginx]] ist die
meistgenutzte Theke im Internet.

## Die Aufgaben eines Webservers

Ein Webserver ist ein Programm, das auf einem [[port|Port]] (meist 80 für HTTP und 443 für HTTPS)
auf [[http-request|HTTP-Anfragen]] wartet und Antworten zurückschickt. Er läuft dauerhaft im
Hintergrund als [[daemon|Daemon]].

| Aufgabe | Beispiel |
|---|---|
| Statische Dateien ausliefern | `index.html`, `app.css`, `logo.png` |
| Anfragen weiterreichen | `/api/…` an eine Node.js-App auf Port 3000 |
| PHP anbinden | `/index.php` an PHP-FPM |
| HTTPS abwickeln | Zertifikat vorzeigen, Daten verschlüsseln |
| Schützen und optimieren | Kompression, Cache-Header, Rate Limiting |
| Protokollieren | jede Anfrage im Access-Log, Fehler im Error-Log |

Wichtig ist die Unterscheidung zwischen **statischen** und **dynamischen** Inhalten. Statisch heißt:
Die Datei liegt fertig auf der Festplatte und geht unverändert raus. Dynamisch heißt: Ein Programm
erzeugt die Antwort für jede Anfrage neu, etwa eine Produktliste aus der Datenbank.

> [!MERKSATZ]
> nginx liefert statische Dateien selbst aus. Dynamische Inhalte erzeugt er nie selbst – er reicht
> die Anfrage an ein Programm weiter und gibt dessen Antwort an den Client zurück.

## nginx und seine Alternativen

nginx (ausgesprochen „Engine X“) entstand Anfang der 2000er, um ein bekanntes Problem zu lösen:
Tausende gleichzeitige Verbindungen auf einem einzigen Server. Ältere Server starteten für jede
Verbindung einen eigenen [[prozess|Prozess]] oder [[thread|Thread]]. Bei 10 000 Besuchern sind das
10 000 Prozesse, die vor allem warten und [[arbeitsspeicher|Arbeitsspeicher]] belegen.

| Server | Typischer Einsatz |
|---|---|
| nginx | Webserver, Reverse Proxy, TLS-Endpunkt – sehr verbreitet |
| [[apache-httpd|Apache httpd]] | klassischer Webserver, Konfiguration auch per `.htaccess` pro Ordner |
| Caddy | holt HTTPS-Zertifikate automatisch, einfache Konfiguration |
| Traefik | Reverse Proxy, der sich aus Docker- und Kubernetes-Daten konfiguriert |

Die Konzepte dieses Kurses – virtuelle Hosts, Reverse Proxy, Cache-Header, TLS – gelten für alle.
Wir nutzen nginx, weil du ihm in Projekten am häufigsten begegnest. Aktuell (Oktober 2026) ist
1.30 die stabile Version, die Mainline-Version mit den neuesten Funktionen heißt 1.31.

## Master und Worker

Wenn nginx startet, entsteht zuerst ein [[master-prozess|Master-Prozess]]. Er liest die
[[konfigurationsdatei|Konfigurationsdatei]], öffnet die Ports und startet mehrere
[[worker-prozess|Worker-Prozesse]] – meist einen pro [[prozessor|CPU-Kern]].

![Aufbau von nginx: Ein Master-Prozess steuert mehrere Worker, jeder Worker bedient viele Verbindungen über eine Ereignisschleife](/assets/nginx-webserver/nginx-architektur.svg)

```bash title="Prozesse auf einem Server"
$ ps -C nginx -o pid,user,cmd
    PID USER     CMD
    812 root     nginx: master process /usr/sbin/nginx
    813 www-data nginx: worker process
    814 www-data nginx: worker process
```

Der Master läuft als `root`, weil nur root Ports unter 1024 öffnen darf. Die Worker laufen als
unprivilegierter [[benutzer|Benutzer]] wie `www-data`. Wird ein Worker angegriffen, hat der
Angreifer damit kaum Rechte.

> [!PRAXIS]
> Die Zahl der Worker steuert `worker_processes auto;` – nginx nimmt dann so viele, wie die Maschine
> CPU-Kerne hat. Diese Einstellung musst du in der Praxis fast nie ändern.

## Die Ereignisschleife

Jeder Worker arbeitet mit einer [[event-loop|Ereignisschleife]]. Er fragt das
[[betriebssystem|Betriebssystem]]: „Welche meiner Verbindungen sind gerade bereit?“ Dann bearbeitet
er genau diese ein Stück weit und fragt erneut. Ein langsamer Client blockiert so niemanden.

Zurück im Restaurant: Eine Kellnerin wartet nicht neben einem Gast, bis er sich entschieden hat. Sie
geht zum nächsten Tisch, an dem jemand winkt. So bedient eine Person viele Tische.

| Modell | Bei 10 000 Verbindungen |
|---|---|
| Ein Prozess pro Verbindung | 10 000 Prozesse, viel RAM, viel Umschalten |
| nginx: ereignisgesteuert | wenige Worker, je tausende Verbindungen |

Wie viele Verbindungen ein Worker gleichzeitig halten darf, legt `worker_connections` fest
(Standard: 512, oft auf 1024 gesetzt).

> [!FEHLER]
> **„nginx führt mein PHP aus.“** – Nein. nginx kann weder PHP noch JavaScript ausführen. Siehst du im
> Browser plötzlich den Quelltext deiner `index.php` oder lädt der Browser die Datei herunter, fehlt
> die Weiterleitung an PHP-FPM. Das lernst du im dritten Modul.

## Zusammenfassung

- Ein Webserver wartet auf einem Port auf HTTP-Anfragen und schickt Antworten zurück.
- Statische Dateien liefert nginx selbst aus, dynamische Anfragen reicht er an Programme weiter.
- nginx startet einen Master-Prozess (als root) und mehrere Worker-Prozesse (unprivilegiert).
- Worker arbeiten ereignisgesteuert und bedienen so tausende Verbindungen gleichzeitig.
- Alternativen wie Apache, Caddy oder Traefik nutzen dieselben Grundkonzepte.
