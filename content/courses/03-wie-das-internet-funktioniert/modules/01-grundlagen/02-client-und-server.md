---
title: Client und Server
summary: Wer im Internet fragt und wer antwortet – das Client-Server-Modell, Request und Response, Peer-to-Peer und dein eigener Server auf localhost.
duration: 25
sources:
  - title: MDN – Client-Server overview
    url: https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/First_steps/Client-Server_overview
  - title: MDN – What is a web server?
    url: https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_web_server
  - title: PHP-Handbuch – Der eingebaute Webserver
    url: https://www.php.net/manual/de/features.commandline.webserver.php
  - title: curl – Manpage
    url: https://curl.se/docs/manpage.html
  - title: RFC 6761 – Special-Use Domain Names (localhost)
    url: https://www.rfc-editor.org/rfc/rfc6761
quiz:
  - type: single
    question: Wer beginnt im Client-Server-Modell die Kommunikation?
    options:
      - Der Server schickt von sich aus Seiten an alle Browser.
      - Der Client schickt eine Anfrage, der Server antwortet darauf.
      - Beide senden gleichzeitig, wer schneller ist, gewinnt.
    answer: 1
    explanation: >
      Der Client ergreift die Initiative und schickt einen Request. Der Server wartet geduldig und
      antwortet mit einer Response. Ohne Anfrage schickt ein klassischer Webserver nichts.
  - type: multiple
    question: Welche Aussagen über localhost stimmen?
    options:
      - localhost meint immer den eigenen Rechner.
      - Die IPv4-Adresse 127.0.0.1 zeigt auf den eigenen Rechner.
      - Ein Server auf 127.0.0.1 ist automatisch für das ganze Internet erreichbar.
      - Mit localhost kannst du Client und Server auf demselben Gerät ausprobieren.
    answers: [0, 1, 3]
    explanation: >
      localhost und 127.0.0.1 bezeichnen den eigenen Rechner (Loopback). Was dort lauscht, ist nur
      von diesem Rechner aus erreichbar – perfekt zum Entwickeln, aber nicht von außen sichtbar.
  - type: match
    question: Ordne jedem Beispiel die passende Rolle zu.
    pairs:
      - { left: "Dein Browser beim Öffnen einer Seite", right: "Client" }
      - { left: "Rechner, der eine Shop-Website ausliefert", right: "Server" }
      - { left: "Die Frage: Gib mir /index.html", right: "Request" }
      - { left: "Das zurückgeschickte HTML-Dokument", right: "Response" }
    explanation: Client und Server sind Rollen, Request und Response die beiden Nachrichten, die zwischen ihnen hin und her gehen.
  - type: find-bug
    question: Ada startet einen lokalen Server und will ihn abfragen, bekommt aber „Connection refused“. In welcher Zeile liegt der Fehler?
    language: bash
    code: |
      cd mini-server
      php -S 127.0.0.1:8080 &
      curl http://127.0.0.1:8000/
    bug_line: 3
    explanation: "Der Server lauscht auf Port 8080, curl fragt aber Port 8000 an. Dort antwortet niemand – richtig wäre `curl http://127.0.0.1:8080/`."
tasks:
  - id: mini-webserver
    type: terminal
    title: Dein erster eigener Webserver
    description: |
      Du spielst jetzt beide Rollen gleichzeitig: Dein Rechner wird Server **und** Client.
      Der Ordner `mini-server` ist leer.

      1. Wechsle mit `cd mini-server` in den Ordner.
      2. Lege eine Datei `index.html` an, die den Text `Mein erster Server` enthält.
      3. Starte im Hintergrund einen Webserver, der seine Meldungen in `server.log` schreibt:
         `php -S 127.0.0.1:8080 > server.log 2>&1 &`
      4. Frage die Startseite mit `curl` ab und speichere die Antwort in `antwort.txt`.
      5. Schau dir mit `cat server.log` an, was der Server von deiner Anfrage mitbekommen hat.
      6. Beende den Server wieder mit `kill %1`.
    workdir: mini-server
    checks:
      - type: file_contains
        path: index.html
        pattern: "Mein erster Server"
        message: In index.html fehlt noch der Text „Mein erster Server“.
      - type: command
        run: "php -S 127.0.0.1:8090 -t . >/dev/null 2>&1 & P=$!; sleep 1; curl -s http://127.0.0.1:8090/ ; kill $P"
        stdout_matches: "Mein erster Server"
        message: Ein Webserver in diesem Ordner liefert noch nicht „Mein erster Server“ aus – liegt index.html direkt in mini-server?
      - type: file_contains
        path: antwort.txt
        pattern: "Mein erster Server"
        message: antwort.txt fehlt oder enthält nicht die Antwort des Servers. Speichere die Ausgabe von curl mit `> antwort.txt`.
      - type: file_contains
        path: server.log
        pattern: "\\[200\\]: GET /"
        message: In server.log ist noch keine erfolgreiche Anfrage (GET / mit Status 200) zu sehen. Starte den Server mit `> server.log 2>&1 &` und frage ihn dann mit curl ab.
    hints:
      - "Eine Datei mit Inhalt legst du am schnellsten mit `echo \"<h1>Mein erster Server</h1>\" > index.html` an."
      - "Das `&` am Ende startet den Server im Hintergrund, sodass du im selben Terminal weitertippen kannst."
      - "Abfragen und speichern in einem Schritt: `curl http://127.0.0.1:8080/ > antwort.txt`."
    solution: |
      ```bash
      cd mini-server
      echo "<h1>Mein erster Server</h1>" > index.html
      php -S 127.0.0.1:8080 > server.log 2>&1 &
      sleep 1
      curl http://127.0.0.1:8080/ > antwort.txt
      cat antwort.txt
      cat server.log
      kill %1
      ```
  - id: anfrage-ablauf
    type: steps
    title: Was passiert als Nächstes?
    description: Spiel einen Besuch auf `www.example.com` aus Sicht von Client und Server durch.
    steps:
      - situation: >
          Du tippst `www.example.com` in die Adresszeile deines Browsers und drückst Enter. Der Server
          von example.com läuft seit Tagen und wartet.
        question: Wer schickt die erste Nachricht?
        options:
          - Der Server, weil er weiß, dass du gleich kommst.
          - Dein Browser als Client – er schickt einen Request.
          - Dein Router, er fragt im Namen des Browsers.
        answer: 1
        explanation: Der Client ergreift immer die Initiative. Der Server lauscht nur und reagiert auf eingehende Anfragen.
      - situation: >
          Der Request kommt beim Server an. Darin steht sinngemäß: „Gib mir bitte die Startseite `/`.“
        question: Was macht der Server?
        options:
          - Er sucht die passende Datei oder erzeugt die Seite und schickt eine Response zurück.
          - Er öffnet selbst einen Browser und zeigt die Seite an.
          - Er leitet die Anfrage an alle anderen Besucher weiter.
        answer: 0
        explanation: Der Server beantwortet die Anfrage mit einer Response. Darin stecken ein Statuscode (zum Beispiel 200 für „OK“) und der Inhalt, hier HTML.
      - situation: >
          Im selben Moment öffnen 5.000 andere Menschen dieselbe Seite.
        question: Wie geht der Server damit um?
        options:
          - Er bedient nur den ersten Client, alle anderen müssen warten, bis er neu startet.
          - Er beantwortet jeden Request einzeln – ein Server bedient viele Clients.
          - Die Clients teilen sich die Seite untereinander, der Server ist dann unbeteiligt.
        answer: 1
        explanation: >
          Ein Server ist darauf gebaut, sehr viele Anfragen parallel zu beantworten. Wird es zu viel,
          verteilen große Websites die Last auf mehrere Server.
      - situation: >
          Ein Freund schlägt vor, ein großes Video nicht von einem Server zu laden, sondern Stücke
          direkt von anderen Leuten, die es schon haben.
        question: Wie heißt dieses Modell?
        options:
          - Client-Server
          - Peer-to-Peer
          - localhost
        answer: 1
        explanation: Bei Peer-to-Peer sind alle Teilnehmenden gleichberechtigt und geben Daten direkt aneinander weiter – ohne zentralen Server für die eigentlichen Daten.
---

Wenn du eine Website öffnest, fühlt es sich an, als würdest du einfach „hingehen“. Tatsächlich
passiert etwas viel Konkreteres: Dein Gerät schickt eine Frage an einen anderen Rechner, und der
schickt eine Antwort zurück. Fast alles im Internet folgt diesem Muster aus Frage und Antwort. In
dieser Lektion lernst du die beiden Rollen kennen – und startest am Ende deinen eigenen Server.

## Zwei Rollen: Client und Server

Denk an ein Restaurant. Du bist Gast, setzt dich an den Tisch und bestellst. Die Küche wartet auf
Bestellungen, bereitet das Essen zu und schickt es raus. Du ergreifst die Initiative, die Küche
reagiert.

Im Internet heißen diese Rollen:

| Rolle | Restaurant | Internet |
|---|---|---|
| [[client|Client]] | Gast, der bestellt | Programm, das eine Anfrage stellt, z. B. dein [[browser|Browser]] |
| [[server|Server]] | Küche, die liefert | Programm, das auf Anfragen wartet und antwortet |

Wichtig: Client und Server sind **Rollen von Programmen**, keine besonderen Gerätetypen. Ein Server
ist meist ein leistungsstarker Rechner in einem Rechenzentrum, aber auch dein Laptop kann Server
sein – das probierst du gleich aus. Und Clients sind nicht nur Browser: Eine Wetter-App, ein
Mail-Programm oder das Kommandozeilenwerkzeug [[curl]] sind ebenfalls Clients.

## Request und Response

Die Frage des Clients heißt [[request|Request]] (Anfrage), die Rückmeldung des Servers heißt
[[response|Response]] (Antwort). Im Web sieht ein Request sehr vereinfacht so aus:

```text title="Ein Request (vereinfacht)"
GET /index.html
Host: www.example.com
```

Der Client sagt: „Ich möchte etwas **holen** (GET), und zwar `/index.html` von `www.example.com`.“
Der Server antwortet mit einem Status und dem Inhalt:

```text title="Die passende Response (vereinfacht)"
200 OK
Content-Type: text/html

<h1>Willkommen bei example.com</h1>
```

`200 OK` bedeutet: Alles hat geklappt. Hätte es die Datei nicht gegeben, käme `404 Not Found`
zurück. Diese Zahlen heißen [[statuscode|Statuscodes]] – du lernst sie im Modul „Von der URL bis zum fertigen Bild“ genauer
kennen.

> [!MERKSATZ]
> Im Client-Server-Modell fragt **immer der Client zuerst**. Der Server lauscht, empfängt den
> Request und schickt genau eine Response zurück. Danach wartet er auf die nächste Anfrage.

## Ein Server, viele Clients

![Viele Clients – Browser, Handy-App und ein curl-Skript – schicken Anfragen an einen Server und erhalten Antworten](/assets/wie-das-internet-funktioniert/client-server.svg)

Ein einziger Server bedient oft tausende Clients gleichzeitig: Browser auf Laptops, Apps auf Handys,
Skripte auf anderen Servern. Jeder Client schickt seine eigenen Requests und bekommt seine eigenen
Responses. Damit der Server die Antworten richtig zustellt, kennt er die Absenderadresse jeder
Anfrage – dazu mehr in der Lektion über IP-Adressen.

Das Modell hat klare Vorteile:

- **Zentrale Daten**: Alle sehen denselben Stand, zum Beispiel dieselben Produkte im Shop.
- **Einfache Clients**: Dein Handy muss nicht den ganzen Shop speichern, es fragt einfach nach.
- **Kontrolle**: Der Betreiber kann den Server aktualisieren, absichern und überwachen.

Der Nachteil: Fällt der Server aus, kommt niemand mehr an die Daten. Deshalb betreiben große Websites
viele Server parallel.

## Das Gegenmodell: Peer-to-Peer

Beim [[peer-to-peer|Peer-to-Peer]]-Modell (kurz P2P, „unter Gleichen“) gibt es keine feste
Rollenverteilung. Jeder Teilnehmer ist gleichzeitig Client und Server: Er lädt Daten von anderen und
gibt Daten an andere weiter.

| | Client-Server | Peer-to-Peer |
|---|---|---|
| Wer liefert Daten? | Ein zentraler Server | Alle Teilnehmenden |
| Was passiert bei Ausfall? | Ein Serverausfall trifft alle | Andere Peers springen ein |
| Wer hat die Kontrolle? | Der Betreiber des Servers | Niemand allein |
| Beispiele | Websites, Online-Banking, Mail-Server | Dateitausch per BitTorrent, manche Videoanrufe |

Im Alltag sind viele Systeme Mischformen. Ein Videoanruf baut die Verbindung oft über einen Server
auf, schickt Bild und Ton dann aber möglichst direkt von Gerät zu Gerät.

## localhost: Server und Client auf einem Rechner

Jeder Rechner hat eine besondere Adresse, die immer auf ihn selbst zeigt: [[localhost]], als
[[ip-adresse|IP-Adresse]] `127.0.0.1`. Daten an diese Adresse verlassen den Rechner nie
(*Loopback*). So spielst du Server und Client auf einem Gerät. [[php|PHP]] bringt dafür einen
eingebauten Webserver mit:

```bash title="Terminal"
php -S 127.0.0.1:8080 > server.log 2>&1 &
curl http://127.0.0.1:8080/
```

Was passiert hier?

| Teil | Bedeutung |
|---|---|
| `php -S` | Starte den eingebauten Webserver von PHP |
| `127.0.0.1` | Lausche nur auf dem eigenen Rechner |
| `:8080` | Die Nummer der „Tür“, an der der Server wartet – ein [[port|Port]] |
| `> server.log 2>&1` | Schreibe alle Meldungen des Servers in die Datei `server.log` |
| `&` | Starte das Programm im Hintergrund, damit das Terminal frei bleibt |
| `curl http://…` | Spiele den Client und frage die Startseite ab |

Der Server liefert Dateien aus dem aktuellen Ordner; für `/` schickt er `index.html`. In
`server.log` siehst du jede Anfrage aus Serversicht, etwa `[200]: GET /`. Am Ende beendest du den
Hintergrund-Server mit `kill %1` (oder `pkill -f "php -S"`).

> [!FEHLER]
> „Connection refused“ heißt: Auf dieser Adresse und diesem Port lauscht kein Server. Prüfe, ob er
> noch läuft und ob Adresse **und** Port exakt übereinstimmen.

> [!PRAXIS]
> Entwickler:innen arbeiten täglich mit localhost. Bevor eine Website live geht, läuft sie lokal auf
> Adressen wie `http://localhost:5173` – Änderungen sind sofort testbar, ohne dass andere sie sehen.

## Zusammenfassung

- Im **Client-Server-Modell** stellt der Client einen **Request**, der Server schickt eine
  **Response** zurück.
- Client und Server sind **Rollen von Programmen** – dein Browser, eine App oder curl sind Clients.
- Ein Server bedient viele Clients gleichzeitig; fällt er aus, sind alle betroffen.
- Bei **Peer-to-Peer** sind alle Teilnehmenden gleichzeitig Client und Server.
- **localhost** bzw. `127.0.0.1` zeigt immer auf den eigenen Rechner – ideal zum Ausprobieren.
- Mit `php -S 127.0.0.1:8080 &` startest du einen lokalen Webserver, mit `curl` fragst du ihn ab.
