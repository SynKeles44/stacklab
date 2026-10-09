---
title: Webserver, Hosting, Caches und CDNs
summary: Was ein Webserver tut, wie ein Server viele Websites ausliefert, welche Hosting-Arten es gibt und wie Caches und CDNs Seiten schnell machen.
duration: 25
sources:
  - title: MDN – What is a web server?
    url: https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_web_server
  - title: nginx – How nginx processes a request
    url: https://nginx.org/en/docs/http/request_processing.html
  - title: MDN – HTTP caching
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching
  - title: MDN – CDN (Glossary)
    url: https://developer.mozilla.org/en-US/docs/Glossary/CDN
  - title: PHP – Built-in web server
    url: https://www.php.net/manual/en/features.commandline.webserver.php
quiz:
  - type: single
    question: Was unterscheidet eine dynamische von einer statischen Seite?
    options:
      - Dynamische Seiten haben Animationen.
      - Bei dynamischen Seiten erzeugt ein Programm die Antwort für jede Anfrage neu.
      - Statische Seiten liegen nicht auf einem Server.
      - Statische Seiten können kein CSS enthalten.
    answer: 1
    explanation: Eine statische Seite ist eine fertige Datei, die der Webserver einfach ausliefert. Eine dynamische entsteht bei jeder Anfrage durch Code, oft mit Daten aus einer Datenbank.
  - type: multiple
    question: Wie kann ein einziger Server mit einer IP-Adresse mehrere Websites ausliefern?
    options:
      - Über den Host-Header der Anfrage (virtuelle Hosts).
      - Gar nicht, jede Website braucht eine eigene IP-Adresse.
      - Bei HTTPS hilft zusätzlich der Name, den der Browser im TLS-Handshake mitschickt (SNI).
      - Über unterschiedliche Pfade wie /seite1 und /seite2 – das ist die einzige Möglichkeit.
    answers: [0, 2]
    explanation: Der Webserver schaut auf den Host-Header (und bei HTTPS auf SNI) und wählt die passende Konfiguration. So teilen sich viele Websites einen Server.
  - type: match
    question: Was bedeutet welche Cache-Control-Angabe?
    pairs:
      - { left: "max-age=3600", right: "Eine Stunde lang ohne Nachfrage wiederverwenden" }
      - { left: "no-cache", right: "Speichern erlaubt, aber vor jeder Nutzung beim Server nachfragen" }
      - { left: "no-store", right: "Gar nicht speichern" }
      - { left: "immutable", right: "Ändert sich nie – auch beim Neuladen nicht nachfragen" }
    explanation: "Achtung bei no-cache: Der Name klingt nach „nicht cachen“, bedeutet aber „nur nach Rückfrage verwenden“."
  - type: single
    question: Der Browser schickt `If-None-Match` mit dem gespeicherten ETag. Die Datei hat sich nicht geändert. Was antwortet der Server?
    options:
      - 200 OK mit der kompletten Datei
      - 304 Not Modified ohne Body
      - 404 Not Found
      - 500 Internal Server Error
    answer: 1
    explanation: 304 heißt „deine Kopie ist noch aktuell“. Es wird kein Inhalt übertragen, nur Header – das spart Daten und Zeit.
  - type: cloze
    text: Liegt eine Datei schon im Cache eines Edge-Servers, spricht man von einem Cache-___. Muss er sie erst vom Origin holen, ist es ein Cache-___.
    blanks:
      - [Hit, Treffer]
      - [Miss]
    explanation: "Viele CDNs zeigen das in einem Antwort-Header an, zum Beispiel `x-cache: HIT`."
tasks:
  - id: dynamischer-server
    type: terminal
    title: Dein erster dynamischer Webserver
    description: |
      Im Ordner `webserver` liegen eine statische `index.html` und eine `router.php`. Die Router-Datei entscheidet
      für jede Anfrage: Antwortet ein Programm (dynamisch), oder wird eine Datei ausgeliefert (statisch)?
      Die Route `/zeit` gibt es schon.

      Klicke zuerst auf **Aufgabe vorbereiten**.

      1. Öffne `router.php` (z. B. mit `nano router.php`) und füge eine Route `/hallo` hinzu, die den Text
         `Hallo vom Server` ausgibt – genau wie die Route `/zeit` aufgebaut.
      2. Starte den Server mit der Router-Datei: `php -S 127.0.0.1:8080 router.php > server.log 2>&1 &`
      3. Teste mit `curl http://127.0.0.1:8080/hallo`, `curl http://127.0.0.1:8080/zeit` und
         `curl http://127.0.0.1:8080/`. Die letzte Anfrage liefert die statische Datei.
      4. Beende den Server mit `kill %1`.
    workdir: webserver
    setup: |
      printf '<!doctype html>\n<title>Statisch</title>\n<h1>Ich bin eine statische Datei</h1>\n' > index.html
      cat > router.php <<'PHP'
      <?php
      $pfad = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

      if ($pfad === '/zeit') {
          header('Content-Type: text/plain; charset=utf-8');
          echo 'Serverzeit: ' . date('H:i:s') . "\n";
          return true;
      }

      // Hier deine Route /hallo einfügen

      return false; // false = Datei aus dem Ordner ausliefern (statisch)
      PHP
    checks:
      - type: command
        run: php -l router.php
        message: router.php enthält einen Syntaxfehler. Prüfe Klammern, Anführungszeichen und Semikolons.
      - type: command
        run: "php -S 127.0.0.1:8161 router.php >/dev/null 2>&1 & P=$!; sleep 1; curl -s http://127.0.0.1:8161/hallo; kill $P"
        stdout_matches: "^Hallo vom Server"
        message: Die Route /hallo antwortet noch nicht mit „Hallo vom Server“.
      - type: command
        run: "php -S 127.0.0.1:8162 router.php >/dev/null 2>&1 & P=$!; sleep 1; curl -s http://127.0.0.1:8162/zeit; kill $P"
        stdout_matches: "^Serverzeit: \\d\\d:\\d\\d:\\d\\d"
        message: Die Route /zeit funktioniert nicht mehr – hast du sie versehentlich verändert?
      - type: command
        run: "php -S 127.0.0.1:8163 router.php >/dev/null 2>&1 & P=$!; sleep 1; curl -s http://127.0.0.1:8163/; kill $P"
        stdout_matches: "Ich bin eine statische Datei"
        message: Die Startseite wird nicht mehr als statische Datei ausgeliefert. Steht `return false;` noch am Ende?
    hints:
      - Kopiere den Block für /zeit und ändere Pfad und Text.
      - "Jede Route endet mit `return true;` – sonst liefert PHP danach noch die Datei aus."
    solution: |
      ```bash
      cd webserver
      ```
      In `router.php` vor `return false;` einfügen:
      ```php
      if ($pfad === '/hallo') {
          header('Content-Type: text/plain; charset=utf-8');
          echo "Hallo vom Server\n";
          return true;
      }
      ```
      ```bash
      php -S 127.0.0.1:8080 router.php > server.log 2>&1 &
      sleep 1
      curl http://127.0.0.1:8080/hallo
      curl http://127.0.0.1:8080/zeit
      curl http://127.0.0.1:8080/
      kill %1
      ```
  - id: cache-header-lesen
    type: simulated
    title: Cache-Header eines CDNs untersuchen
    description: |
      Simuliertes Terminal mit Beispieldaten: `www.example.com` liegt hinter einem CDN. Mit `curl -I` holst du nur die
      Header einer Antwort.

      1. `curl -I https://www.example.com/logo.png` – das erste Mal (Cache-Miss am Edge).
      2. Dieselbe Anfrage noch einmal – jetzt ein Cache-Hit. Achte auf `x-cache` und `age`.
      3. Frag mit dem ETag nach, ob sich das Logo geändert hat:
         `curl -I -H 'If-None-Match: "abc123"' https://www.example.com/logo.png`
    prompt: "du@laptop:~$"
    steps:
      - expect: "^curl\\s+-I\\s+https://www\\.example\\.com/logo\\.png$"
        output: |
          HTTP/2 200
          content-type: image/png
          content-length: 18342
          cache-control: public, max-age=86400
          etag: "abc123"
          x-cache: MISS
          age: 0
        hint: "`curl -I https://www.example.com/logo.png`"
      - expect: "^curl\\s+-I\\s+https://www\\.example\\.com/logo\\.png$"
        output: |
          HTTP/2 200
          content-type: image/png
          content-length: 18342
          cache-control: public, max-age=86400
          etag: "abc123"
          x-cache: HIT
          age: 42
        hint: Tippe einfach denselben Befehl noch einmal.
      - expect: "^curl\\s+-I\\s+-H\\s+['\"]If-None-Match:\\s*\\\\?\"abc123\\\\?\"['\"]\\s+https://www\\.example\\.com/logo\\.png$"
        output: |
          HTTP/2 304
          cache-control: public, max-age=86400
          etag: "abc123"
          x-cache: HIT
        hint: "`curl -I -H 'If-None-Match: \"abc123\"' https://www.example.com/logo.png`"
    hints:
      - "`age` zeigt, wie viele Sekunden die Kopie schon im Cache liegt."
      - "304 bedeutet: Deine Kopie ist aktuell, es kommt kein Body."
    solution: |
      ```bash
      curl -I https://www.example.com/logo.png
      curl -I https://www.example.com/logo.png
      curl -I -H 'If-None-Match: "abc123"' https://www.example.com/logo.png
      ```
      Beim ersten Mal musste der Edge-Server das Logo vom Origin holen (`MISS`), danach lag es im Cache (`HIT`,
      `age: 42`). Die bedingte Anfrage mit ETag ergibt `304 Not Modified` – das Logo hat sich nicht geändert.
  - id: hosting-arten
    type: dragdrop
    title: Welche Hosting-Art passt?
    description: Ordne jede Situation der passenden Hosting-Art zu.
    targets:
      - { id: static, label: Static Hosting }
      - { id: shared, label: Shared Hosting }
      - { id: vps, label: VPS / eigener Server }
      - { id: paas, label: PaaS / Container-Plattform }
    items:
      - { label: "Eine Portfolio-Seite aus reinem HTML, CSS und Bildern", target: static }
      - { label: "Ein kleiner Blog mit PHP – möglichst günstig und ohne Serverpflege", target: shared }
      - { label: "Du willst eigene Software installieren und brauchst Root-Zugriff", target: vps }
      - { label: "Du lieferst ein Container-Image, Skalierung übernimmt die Plattform", target: paas }
---

Auf der anderen Seite jeder Anfrage wartet ein Programm: der [[webserver|Webserver]]. Er beantwortet Anfragen
rund um die Uhr. Damit das schnell geht, helfen Caches im Browser und Kopien in der Nähe der Nutzer:innen.

## Was ein Webserver tut

Für jede Anfrage erledigt ein Webserver dieselben Schritte: auf einem Port lauschen (80/443), Verbindung
annehmen und bei HTTPS TLS aushandeln, die HTTP-Anfrage lesen, entscheiden, Antwort schicken, Log schreiben.
Bekannte Webserver sind [[nginx|nginx]], Apache und Caddy; zum Entwickeln reicht `php -S`.

| | Statisch | Dynamisch |
|---|---|---|
| Auf dem Server | Fertige Dateien (HTML, CSS, Bilder) | Code (PHP, Node.js …) plus Daten |
| Pro Anfrage | Datei lesen und schicken | Programm erzeugt die Antwort |
| Beispiel | Portfolio, Dokumentation | Shop, Login-Bereich |

Eine [[statische-website|statische Website]] ist am einfachsten. Oft liefert nginx Dateien direkt aus und
reicht alles andere als **Reverse Proxy** an eine Anwendung im Hintergrund weiter.

> [!MERKSATZ]
> Ein Webserver liefert **entweder eine Datei** (statisch) **oder die Ausgabe eines Programms** (dynamisch).

## Viele Websites, ein Server – und wo er steht

Ein Server mit einer IP-Adresse kann hunderte Websites ausliefern. Er unterscheidet sie am `Host`-Header
(bei HTTPS zusätzlich am Namen im TLS-Handshake, *SNI*). Jede Konfiguration heißt
[[virtual-host|virtueller Host]].

[[hosting|Hosting]] heißt: Jemand stellt Rechner, Netz und Wartung bereit.

| Art | Du kümmerst dich um | Typisch für |
|---|---|---|
| Static Hosting | Nur deine Dateien | Portfolios, Single-Page-Apps |
| Shared Hosting | Dateien und etwas Konfiguration | Kleine PHP-Seiten |
| VPS / eigener Server | Betriebssystem, Webserver, Updates | Volle Kontrolle |
| PaaS / Container-Plattform | Code oder Container-Image | Skalierende Anwendungen |

## Caching: Kopien wiederverwenden

Der Browser speichert Antworten. Wie lange, sagt der Server mit [[cache-control|Cache-Control]]:

| Angabe | Bedeutung |
|---|---|
| `max-age=3600` | Eine Stunde ohne Nachfrage wiederverwenden |
| `no-cache` | Speichern erlaubt, aber vor jeder Nutzung nachfragen |
| `no-store` | Gar nicht speichern |
| `immutable` | Ändert sich nie |

Ist eine Kopie abgelaufen, fragt der Browser mit dem [[etag|ETag]] (Fingerabdruck der Version) nach:
`If-None-Match: "abc123"`. Ist sie noch aktuell, antwortet der Server mit `304 Not Modified` – ohne Body.

> [!FEHLER]
> `no-cache` heißt **nicht** „nicht cachen“, sondern „vor der Nutzung nachfragen“. Wer nichts speichern will,
> schreibt `no-store`.

## CDNs: Kopien in der Nähe

Ein [[cdn|CDN]] (*Content Delivery Network*) verteilt Kopien auf [[edge-server|Edge-Server]] in vielen Städten.
Das Original liegt auf dem [[origin-server|Origin-Server]]. Liegt eine Datei schon beim Edge, ist das ein
Cache-Hit; sonst holt der Edge sie einmal vom Origin (Cache-Miss). Kurze Wege bedeuten wenig
[[latenz|Latenz]].

![Ein CDN mit Origin-Server und Edge-Servern](/assets/wie-das-internet-funktioniert/cdn.svg)

Damit Änderungen trotzdem schnell ankommen, bekommen Dateien einen Fingerabdruck im Namen
(`app.3f9a2c.js`) – oder man leert den CDN-Cache gezielt (*Purge*).

> [!PRAXIS]
> „Ich sehe meine Änderung nicht!“ – prüfe mit `curl -I` die Header `cache-control`, `age` und `x-cache`, und
> lade im Browser mit deaktiviertem Cache neu (DevTools).

## Zusammenfassung

- Ein **Webserver** liefert Dateien (**statisch**) oder Programmausgaben (**dynamisch**).
- Über den **Host-Header** unterscheidet ein Server viele Websites: **virtuelle Hosts**.
- **Hosting**-Arten reichen von Static Hosting bis PaaS.
- **Cache-Control** steuert den Browser-Cache; mit **ETag** gibt es `304 Not Modified`.
- Ein **CDN** bringt Kopien vom **Origin** auf **Edge-Server** nahe bei den Nutzer:innen.
