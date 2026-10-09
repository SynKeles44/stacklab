---
title: Die ganze Reise – von der URL bis zur Antwort
summary: Was passiert, wenn du eine URL eintippst – DNS, TCP, TLS, HTTP-Anfrage und -Antwort – und wie du jede Phase misst.
duration: 25
sources:
  - title: MDN – An overview of HTTP
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview
  - title: MDN – HTTP response status codes
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status
  - title: RFC 8446 – The Transport Layer Security (TLS) Protocol Version 1.3
    url: https://www.rfc-editor.org/rfc/rfc8446
  - title: web.dev – Time to First Byte (TTFB)
    url: https://web.dev/articles/ttfb
  - title: Everything curl – Write out (-w)
    url: https://everything.curl.dev/usingcurl/verbose/writeout.html
quiz:
  - type: single
    question: Was muss passieren, bevor der Browser die HTTP-Anfrage an https://www.example.com schicken kann?
    options:
      - Nur der TLS-Handshake
      - DNS-Auflösung, TCP-Handshake und TLS-Handshake
      - Nur die DNS-Auflösung
      - Der Server muss die Seite zuerst rendern
    answer: 1
    explanation: Ohne IP-Adresse keine Verbindung, ohne TCP-Verbindung kein TLS, ohne TLS bei https keine Anfrage.
  - type: match
    question: Ordne jeder Statuscode-Klasse ihre Bedeutung zu.
    pairs:
      - { left: "2xx", right: "Erfolg" }
      - { left: "3xx", right: "Umleitung – woanders nachsehen" }
      - { left: "4xx", right: "Fehler auf Seite des Clients" }
      - { left: "5xx", right: "Fehler auf Seite des Servers" }
    explanation: "Beispiele: 200 OK, 301 Moved Permanently, 404 Not Found, 500 Internal Server Error."
  - type: multiple
    question: Welche drei Dinge leistet TLS?
    options:
      - Vertraulichkeit – niemand unterwegs kann mitlesen
      - Integrität – niemand kann die Daten unbemerkt verändern
      - Authentizität – du sprichst wirklich mit dem richtigen Server
      - Garantie, dass die Website seriös ist
    answers: [0, 1, 2]
    explanation: >
      TLS schützt die Verbindung. Ob die Betreiber der Seite ehrlich sind, kann TLS nicht prüfen – auch eine
      Betrugsseite kann ein gültiges Zertifikat haben.
  - type: find-bug
    question: In welcher Zeile dieser HTTP-Antwort steckt ein Fehler?
    language: http
    code: |
      HTTP/1.1 200 Not Found
      Content-Type: text/html; charset=utf-8
      Content-Length: 42

      <h1>Hallo</h1>
    bug_line: 1
    explanation: Statuscode und Text passen nicht. 200 heißt „OK“; „Not Found“ gehört zu 404.
  - type: match
    question: Ordne jeder Phase zu, was dabei herauskommt.
    pairs:
      - { left: "DNS-Auflösung", right: "Die IP-Adresse des Servers" }
      - { left: "TCP-Handshake", right: "Eine zuverlässige Verbindung" }
      - { left: "TLS-Handshake", right: "Ein gemeinsamer geheimer Schlüssel" }
      - { left: "HTTP-Request und -Response", right: "Das HTML der Seite" }
      - { left: "Rendering", right: "Pixel auf dem Bildschirm" }
    explanation: Jede Phase liefert genau das, was die nächste braucht.
tasks:
  - id: reise-beschriften
    type: diagram
    title: Beschrifte die Reise einer Anfrage
    description: Setze die sechs Phasen in der richtigen Reihenfolge in die nummerierten Kästen.
    image: /assets/wie-das-internet-funktioniert/anfrage-reise-leer.svg
    slots:
      - { x: 17.8, y: 26.5, answer: DNS-Auflösung }
      - { x: 50, y: 26.5, answer: TCP-Handshake }
      - { x: 82.2, y: 26.5, answer: TLS-Handshake }
      - { x: 17.8, y: 64.7, answer: HTTP-Request }
      - { x: 50, y: 64.7, answer: Serververarbeitung }
      - { x: 82.2, y: 64.7, answer: Rendering }
    distractors: [Traceroute, Kompilieren]
    hints:
      - Die Untertitel in den Kästen verraten dir, was in jeder Phase passiert.
  - id: http-anschauen
    type: terminal
    title: Eine HTTP-Unterhaltung mitlesen
    description: |
      Im Ordner `http-anschauen` liegt eine Seite `hallo.html`. Du startest einen lokalen Webserver und liest mit
      `curl -v` jede Zeile der HTTP-Unterhaltung mit.

      Klicke zuerst auf **Aufgabe vorbereiten**.

      1. Starte den Server im Hintergrund: `php -S 127.0.0.1:8080 > server.log 2>&1 &` (danach kurz warten).
      2. Rufe `http://127.0.0.1:8080/hallo.html` mit `curl -v` ab. Die Protokoll-Zeilen landen auf stderr – speichere sie mit
         `2> verlauf.txt` in einer Datei.
      3. Frag eine Seite ab, die es nicht gibt (`/gibts-nicht`), und speichere **nur den Statuscode** in
         `status.txt`: `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/gibts-nicht > status.txt`
      4. Beende den Server mit `kill %1`.

      Gut zu wissen: Läge im Ordner eine `index.html`, würde der PHP-Server sie für **jeden** unbekannten Pfad
      ausliefern – dann gäbe es nie ein 404. Deshalb heißt die Seite hier `hallo.html`.
    workdir: http-anschauen
    setup: |
      printf '<!doctype html>\n<title>Hallo HTTP</title>\n<h1>Hallo HTTP</h1>\n' > hallo.html
    checks:
      - type: file_contains
        path: verlauf.txt
        pattern: "^> GET /hallo\\.html HTTP/1\\.1"
        message: In verlauf.txt fehlt die Anfragezeile `> GET /hallo.html HTTP/1.1`. Hast du `curl -v` genutzt und stderr mit `2>` umgeleitet?
      - type: file_contains
        path: verlauf.txt
        pattern: "^> Host: 127\\.0\\.0\\.1:8080"
        message: In verlauf.txt fehlt der Host-Header. Rufe genau http://127.0.0.1:8080/hallo.html ab.
      - type: file_contains
        path: verlauf.txt
        pattern: "^< HTTP/1\\.1 200"
        message: In verlauf.txt fehlt die Antwortzeile mit Status 200. Lief der Server, als du curl ausgeführt hast?
      - type: file_contains
        path: status.txt
        pattern: "^404\\s*$"
        message: status.txt soll genau den Statuscode 404 enthalten.
    hints:
      - "Ohne `sleep 1` nach dem Serverstart kann curl zu früh anfragen."
      - "`curl -v http://127.0.0.1:8080/hallo.html 2> verlauf.txt` – der Seiteninhalt erscheint im Terminal, das Protokoll in der Datei."
      - "Zeilen mit `>` hat curl gesendet, Zeilen mit `<` hat der Server geantwortet."
    solution: |
      ```bash
      cd http-anschauen
      php -S 127.0.0.1:8080 > server.log 2>&1 &
      sleep 1
      curl -v http://127.0.0.1:8080/hallo.html 2> verlauf.txt
      curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/gibts-nicht > status.txt
      cat verlauf.txt
      kill %1
      ```
  - id: produkte-abrufen
    type: request
    title: Hol dir die zweite Produktseite
    description: |
      Die Shop-API unter `https://shop.example.com` liefert Produkte seitenweise. Baue eine Anfrage, die die
      **zweite Seite** der Produktliste **liest**. Die Seitennummer übergibst du im Query-String als `seite`.
    base_url: https://shop.example.com
    expected:
      method: GET
      path: "^/produkte\\?seite=2$"
    response:
      status: 200
      body: '{"seite": 2, "produkte": [{"id": 21, "name": "Wanderschuh"}, {"id": 22, "name": "Laufschuh"}]}'
    hints:
      - Lesen heißt GET.
      - "Der Pfad lautet `/produkte`, der Query-String beginnt mit `?`."
---

Jetzt kennst du URLs, DNS, Pakete, TCP und Ports. In dieser Lektion setzt du alles zusammen. Du tippst
`https://www.example.com/` ein, drückst Enter – und nach weniger als einer Sekunde steht die Seite da.
Was passiert in diesem Moment?

![Die Reise einer Anfrage in sechs Phasen](/assets/wie-das-internet-funktioniert/anfrage-reise.svg)

## Eingabe, Caches und DNS

Der Browser prüft, ob du eine [[url|URL]] getippt hast, und zerlegt sie: Schema `https`, Host
`www.example.com`, Port 443, Pfad `/`. Dann schaut er in seine Caches: Kennt er die Seite oder hat er noch
eine offene Verbindung zum Server? Wenn nicht, fragt er per [[dns|DNS]] nach der IP-Adresse – Browser-Cache,
Betriebssystem, hosts-Datei, Resolver. Am Ende steht `192.0.2.10`.

## Verbindung: TCP und TLS

Mit SYN, SYN-ACK, ACK entsteht die TCP-Verbindung zu `192.0.2.10:443`. Bei `https` folgt der zweite
Handshake: [[tls|TLS]]. Er sorgt für drei Dinge:

| Schutzziel | Bedeutung |
|---|---|
| Vertraulichkeit | Niemand unterwegs kann mitlesen ([[verschluesselung\|Verschlüsselung]]) |
| Integrität | Niemand kann Daten unbemerkt verändern |
| Authentizität | Du sprichst wirklich mit dem richtigen Server |

Der Server zeigt dazu ein [[zertifikat|Zertifikat]] vor – einen Ausweis mit seinem Namen, signiert von einer
[[zertifizierungsstelle|Zertifizierungsstelle]], der dein Browser vertraut. Bei TLS 1.3 kostet das
nur einen Hin- und Rückweg. Danach ist alles verschlüsselt, auch die HTTP-Anfrage. Das Ganze heißt dann
[[https|HTTPS]].

> [!FEHLER]
> „Schloss-Symbol = seriöse Seite.“ – Das Schloss heißt nur: verschlüsselt, und das Zertifikat passt zum
> Namen. Auch eine Betrugsseite kann ein gültiges Zertifikat haben.

## HTTP: Anfrage und Antwort

Durch den Tunnel geht eine [[request|Anfrage]] in [[http|HTTP]], zurück kommt eine [[response|Antwort]].
Jede Nachricht hat Startzeile, [[http-header|Header]], Leerzeile und Body:

```http title="Anfrage und Antwort"
GET / HTTP/1.1
Host: www.example.com

HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8

<!doctype html>…
```

Die [[http-methode|Methode]] sagt, was passieren soll (`GET` lesen, `POST` Daten schicken). Der
[[statuscode|Statuscode]] fasst das Ergebnis zusammen:

| Klasse | Bedeutung | Beispiele |
|---|---|---|
| 2xx | Erfolg | 200 OK |
| 3xx | Umleitung | 301, 304 Not Modified |
| 4xx | Fehler beim Client | 404 Not Found |
| 5xx | Fehler beim Server | 500 Internal Server Error |

Mit `curl -v` siehst du die Unterhaltung: Zeilen mit `>` hat [[curl|curl]] gesendet, Zeilen mit `<` kamen
vom Server. Die Zeit bis zum ersten Byte der Antwort heißt [[time-to-first-byte|Time to First Byte]] (TTFB).

> [!MERKSATZ]
> Die Reihenfolge ist zwingend: **DNS → TCP → TLS → HTTP**. Jede Phase liefert, was die nächste braucht:
> Adresse, Verbindung, Schlüssel, Inhalt.

## Danach: Rendering und messen

Der Browser liest das HTML, findet CSS, JavaScript und Bilder und startet dafür weitere Anfragen – oft über
dieselbe Verbindung. Wie er daraus Pixel macht, lernst du in der nächsten Lektion. Die Phasen misst du so:

```bash title="Phasen einer Anfrage messen"
curl -s -o /dev/null -w "dns=%{time_namelookup} connect=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer} total=%{time_total}\n" https://www.example.com/
```

> [!PRAXIS]
> Der Tab „Netzwerk“ in den DevTools zeigt für jede Anfrage dieselben Phasen als Balken. So findest du
> heraus, ob eine Seite wegen DNS, Verbindungsaufbau, Server oder Download langsam ist.

## Zusammenfassung

- Der Browser **zerlegt die URL**, prüft **Caches** und holt per **DNS** die IP-Adresse.
- **TCP** baut die Verbindung, **TLS** verschlüsselt sie und prüft das **Zertifikat** des Servers.
- **HTTP**-Nachrichten bestehen aus Startzeile, Headern und Body; **Statuscodes** fassen das Ergebnis zusammen.
- Danach **rendert** der Browser und lädt weitere Dateien nach.
- Mit `curl -v` und `curl -w` beobachtest und misst du jede Phase.
