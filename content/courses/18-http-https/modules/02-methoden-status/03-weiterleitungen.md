---
title: Weiterleitungen – 301, 302, 303, 307 und 308
summary: Wie der Header Location Clients umlenkt, worin sich die Umleitungs-Codes unterscheiden und wie du mit curl -L folgst.
duration: 20
sources:
  - title: MDN – Redirections in HTTP
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Redirections
  - title: RFC 9110 – Abschnitt 15.4, Redirection 3xx
    url: https://www.rfc-editor.org/rfc/rfc9110#name-redirection-3xx
  - title: Everything curl – Redirects
    url: https://everything.curl.dev/http/redirects.html
quiz:
  - type: single
    question: Deine Website zieht für immer von `/blog` nach `/artikel` um. Suchmaschinen sollen die neue Adresse übernehmen. Welcher Code passt am besten für normale Seitenaufrufe?
    options: ["302 Found", "301 Moved Permanently", "307 Temporary Redirect", "404 Not Found"]
    answer: 1
    explanation: 301 (oder 308) sagt „für immer umgezogen“. Suchmaschinen ersetzen dann die alte URL durch die neue. 302 und 307 sind nur vorübergehend.
  - type: match
    question: Ordne jedem Code seine Eigenschaften zu.
    pairs:
      - { left: "301", right: "Dauerhaft – POST darf zu GET werden" }
      - { left: "308", right: "Dauerhaft – Methode und Body bleiben" }
      - { left: "302", right: "Vorübergehend – POST darf zu GET werden" }
      - { left: "307", right: "Vorübergehend – Methode und Body bleiben" }
      - { left: "303", right: "Hol das Ergebnis per GET woanders ab" }
    explanation: 307 und 308 sind die strengen Varianten von 302 und 301. 303 wechselt immer zu GET.
  - type: multiple
    question: Welche Aussagen über 304 Not Modified stimmen?
    options:
      - Es ist keine echte Weiterleitung – es gibt keinen Location-Header.
      - Es sagt dem Client, dass seine zwischengespeicherte Kopie noch aktuell ist.
      - Es leitet auf eine neuere Version der Seite um.
      - Es kommt als Antwort auf eine bedingte Anfrage, z. B. mit If-None-Match.
    answers: [0, 1, 3]
    explanation: 304 gehört zum Caching, nicht zum Umleiten. Dazu mehr in Modul 3.
  - type: cloze
    text: "Damit curl einer Weiterleitung folgt, gibst du die Option ___ an. Das Ziel steht im Header ___."
    blanks:
      - ["-L", "--location"]
      - [Location]
    explanation: Ohne `-L` zeigt curl nur die 3xx-Antwort und hört auf.
tasks:
  - id: umleitungs-ablauf
    type: steps
    title: Post/Redirect/Get – was passiert als Nächstes?
    description: Ein Kontaktformular wird abgeschickt. Verfolge die Unterhaltung zwischen Browser und Server.
    steps:
      - situation: >
          Du füllst das Kontaktformular aus und klickst „Senden“. Der Browser schickt `POST /kontakt` mit
          den Formulardaten.
        question: Was ist die beste Antwort des Servers, nachdem er die Nachricht gespeichert hat?
        options:
          - "200 OK mit der Danke-Seite als HTML"
          - "303 See Other mit Location: /kontakt/danke"
          - "308 Permanent Redirect mit Location: /kontakt/danke"
        answer: 1
        explanation: >
          303 sagt: „Erledigt – hol dir das Ergebnis per GET unter dieser Adresse.“ Das ist das Muster
          Post/Redirect/Get. Mit 308 würde der Browser die Daten erneut per POST schicken.
      - situation: "Der Browser bekommt `303 See Other` mit `Location: /kontakt/danke`."
        question: Welche Anfrage schickt er als Nächstes?
        options:
          - "POST /kontakt/danke mit denselben Formulardaten"
          - "GET /kontakt/danke ohne Body"
          - "Gar keine – er zeigt eine leere Seite"
        answer: 1
        explanation: Nach 303 wechselt der Client immer zu GET und lässt den Body weg.
      - situation: Du siehst die Danke-Seite und drückst F5 zum Neuladen.
        question: Was passiert?
        options:
          - Die Nachricht wird ein zweites Mal gesendet.
          - Der Browser lädt nur `GET /kontakt/danke` neu – keine doppelte Nachricht.
          - Der Browser fragt „Formular erneut senden?“.
        answer: 1
        explanation: >
          Genau dafür gibt es Post/Redirect/Get: Die letzte Anfrage war ein harmloses GET. Ohne die
          Umleitung hätte F5 den POST wiederholt.
  - id: umleitungs-router
    type: terminal
    title: Baue einen Server mit Umleitungen
    description: |
      Im Ordner `umleitungen` schreibst du ein `router.php` mit vier Wegweisern. Klicke zuerst auf
      **Aufgabe vorbereiten** – dann liegt dort ein Gerüst mit den beiden Ziel-Seiten.

      Ergänze diese Fälle:

      | Anfrage | Antwort |
      |---|---|
      | `/alt` (jede Methode) | `301`, `Location: /neu` |
      | `POST /formular` | `303`, `Location: /danke` |
      | `/api-alt` (jede Methode) | `308`, `Location: /api/v2` |

      Die Ziele `/neu`, `/danke` und `/api/v2` sind schon fertig (`/api/v2` gibt die Methode aus).

      Probiere dann mit dem laufenden Server (Port 8080):

      1. `curl -i http://127.0.0.1:8080/alt` – ohne `-L` siehst du nur die Umleitung.
      2. `curl -L -d 'name=Ada' http://127.0.0.1:8080/formular` – du landest per GET auf der Danke-Seite.
      3. `curl -L -d 'name=Ada' http://127.0.0.1:8080/api-alt` – bei 308 bleibt es ein POST.
    workdir: umleitungen
    setup: |
      cat > router.php <<'PHP'
      <?php
      $pfad = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
      $methode = $_SERVER['REQUEST_METHOD'];

      // TODO: Umleitungen für /alt, POST /formular und /api-alt ergänzen

      if ($pfad === '/neu') {
          echo "Neue Seite\n";
      } elseif ($pfad === '/danke') {
          echo "Danke ($methode)\n";
      } elseif ($pfad === '/api/v2') {
          echo "API v2 bekam: $methode\n";
      } else {
          http_response_code(404);
          echo "nicht gefunden\n";
      }
      PHP
    checks:
      - type: command
        run: |
          T=$(mktemp -d "$PWD/.pruefung-XXXXXX"); cp router.php "$T"/; cd "$T"
          php -S 127.0.0.1:18301 router.php >/dev/null 2>&1 & P=$!; sleep 1
          curl -s -o /dev/null -w '%{http_code} %{redirect_url}' http://127.0.0.1:18301/alt
          kill $P; cd ..; rm -rf "$T"
        stdout_equals: "301 http://127.0.0.1:18301/neu"
        message: /alt soll mit 301 und Location /neu antworten.
      - type: command
        run: |
          T=$(mktemp -d "$PWD/.pruefung-XXXXXX"); cp router.php "$T"/; cd "$T"
          php -S 127.0.0.1:18302 router.php >/dev/null 2>&1 & P=$!; sleep 1
          curl -s -o /dev/null -w '%{http_code} %{redirect_url}' -d 'name=Ada' http://127.0.0.1:18302/formular; echo
          curl -s -L -d 'name=Ada' http://127.0.0.1:18302/formular
          kill $P; cd ..; rm -rf "$T"
        stdout_matches: "^303 http://127\\.0\\.0\\.1:18302/danke\\nDanke \\(GET\\)$"
        message: POST /formular soll mit 303 und Location /danke antworten – curl -L landet dann per GET auf der Danke-Seite.
      - type: command
        run: |
          T=$(mktemp -d "$PWD/.pruefung-XXXXXX"); cp router.php "$T"/; cd "$T"
          php -S 127.0.0.1:18303 router.php >/dev/null 2>&1 & P=$!; sleep 1
          curl -s -o /dev/null -w '%{http_code} %{redirect_url}' http://127.0.0.1:18303/api-alt; echo
          curl -s -L -d 'x=1' http://127.0.0.1:18303/api-alt
          kill $P; cd ..; rm -rf "$T"
        stdout_matches: "^308 http://127\\.0\\.0\\.1:18303/api/v2\\nAPI v2 bekam: POST$"
        message: /api-alt soll mit 308 und Location /api/v2 antworten, damit ein POST ein POST bleibt.
      - type: command
        run: |
          T=$(mktemp -d "$PWD/.pruefung-XXXXXX"); cp router.php "$T"/; cd "$T"
          php -S 127.0.0.1:18304 router.php >/dev/null 2>&1 & P=$!; sleep 1
          curl -s -L http://127.0.0.1:18304/alt
          kill $P; cd ..; rm -rf "$T"
        stdout_equals: Neue Seite
        message: curl -L auf /alt soll bei „Neue Seite“ ankommen. Hast du nach header('Location …') mit exit aufgehört?
    hints:
      - "Eine Umleitung sind zwei Zeilen: `http_response_code(301); header('Location: /neu');` – danach `exit;`."
      - "Für das Formular brauchst du zwei Bedingungen: `$methode === 'POST' && $pfad === '/formular'`."
      - "Setze die Umleitungen an die Stelle des TODO-Kommentars, also vor die Ziel-Seiten."
    solution: |
      ```bash
      cd umleitungen
      cat > router.php <<'PHP'
      <?php
      $pfad = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
      $methode = $_SERVER['REQUEST_METHOD'];

      function umleiten(int $code, string $ziel): never
      {
          http_response_code($code);
          header('Location: ' . $ziel);
          exit;
      }

      if ($pfad === '/alt') {
          umleiten(301, '/neu');
      }
      if ($methode === 'POST' && $pfad === '/formular') {
          umleiten(303, '/danke');
      }
      if ($pfad === '/api-alt') {
          umleiten(308, '/api/v2');
      }

      if ($pfad === '/neu') {
          echo "Neue Seite\n";
      } elseif ($pfad === '/danke') {
          echo "Danke ($methode)\n";
      } elseif ($pfad === '/api/v2') {
          echo "API v2 bekam: $methode\n";
      } else {
          http_response_code(404);
          echo "nicht gefunden\n";
      }
      PHP
      php -S 127.0.0.1:8080 router.php > server.log 2>&1 &
      sleep 1
      curl -i http://127.0.0.1:8080/alt
      curl -L -d 'name=Ada' http://127.0.0.1:8080/formular
      curl -L -d 'name=Ada' http://127.0.0.1:8080/api-alt
      kill %1
      ```
---
Ein Geschäft zieht um. An der alten Tür hängt ein Zettel: „Wir sind jetzt in der Hauptstraße 12.“
Kund:innen gehen einfach dorthin. Im Web heißt dieser Zettel [[weiterleitung|Weiterleitung]]
(Redirect): Der Server antwortet mit einem 3xx-Code und nennt im Header [[location-header|Location]]
die neue Adresse. Der Client fragt dort automatisch noch einmal an.

## So funktioniert eine Weiterleitung

```http title="Anfrage und Umleitung"
GET /blog HTTP/1.1
Host: example.com

HTTP/1.1 301 Moved Permanently
Location: https://example.com/artikel
```

Der Browser liest `Location` und schickt sofort eine **neue** Anfrage: `GET /artikel`. In der
Adresszeile steht danach die neue URL. Im Netzwerk-Tab siehst du beide Anfragen.

`Location` darf eine vollständige URL oder ein Pfad sein. Ein Pfad wie `/artikel` bezieht sich auf
denselben Host.

Typische Anlässe für Weiterleitungen sind umbenannte Seiten, der Wechsel von `http://` auf `https://`,
eine Domain mit oder ohne `www.` und das Ziel nach einem Login. Jede Umleitung kostet einen zusätzlichen
Round Trip – Ketten aus mehreren Umleitungen machen eine Seite spürbar langsamer.

> [!MERKSATZ]
> Eine Weiterleitung besteht aus einem 3xx-Statuscode **und** dem Header `Location`. Fehlt `Location`,
> weiß der Client nicht, wohin.

## Dauerhaft oder vorübergehend?

Die Codes unterscheiden sich in zwei Fragen: Gilt die Umleitung für immer? Und darf aus einem `POST`
unterwegs ein `GET` werden?

| Code | Dauer | Methode beim Folgen |
|---|---|---|
| `301 Moved Permanently` | dauerhaft | POST darf zu GET werden |
| `308 Permanent Redirect` | dauerhaft | bleibt gleich, Body bleibt |
| `302 Found` | vorübergehend | POST darf zu GET werden |
| `307 Temporary Redirect` | vorübergehend | bleibt gleich, Body bleibt |
| `303 See Other` | „Ergebnis liegt dort“ | wird immer GET |

Dauerhafte Umleitungen merken sich Browser und Suchmaschinen. Ein `301` bleibt deshalb oft lange im
Browser-Cache, auch wenn du ihn auf dem Server längst entfernt hast.

> [!FEHLER]
> Eine API-Route mit `301` verschieben und sich wundern, dass `POST`-Anfragen als `GET` ankommen und
> der Body fehlt. Für APIs nimmst du `308` (dauerhaft) oder `307` (vorübergehend).

## Post/Redirect/Get mit 303

Nach einem abgeschickten Formular antwortet der Server am besten mit `303 See Other`. Der Browser holt
die Ergebnisseite dann per `GET`. Drückt jemand danach F5, wird nur diese Seite neu geladen – nicht das
Formular erneut gesendet.

```php title="PHP: Umleitung nach dem Speichern"
<?php
speichereNachricht($_POST);
http_response_code(303);
header('Location: /kontakt/danke');
exit;
```

Das `exit` ist wichtig: Ohne es läuft das Skript weiter und hängt vielleicht noch HTML an die Umleitung.

## Weiterleitungen mit curl verfolgen

curl folgt Umleitungen nur, wenn du es mit `-L` darum bittest:

```bash title="Ohne und mit -L"
curl -i http://127.0.0.1:8080/alt          # zeigt nur den 301
curl -L http://127.0.0.1:8080/alt          # landet bei /neu
curl -sL -o /dev/null -w '%{url_effective}\n' http://127.0.0.1:8080/alt
```

`%{url_effective}` zeigt die URL, bei der curl am Ende gelandet ist, `%{redirect_url}` das Ziel einer
einzelnen Umleitung. curl hält sich dabei an die Regeln der Tabelle: Bei 301, 302 und 303 wird aus
einem `POST` ein `GET`.

> [!PRAXIS]
> Ein Klassiker im Betrieb ist die Endlosschleife: `/a` leitet auf `/b`, `/b` zurück auf `/a`. Der
> Browser bricht nach etwa 20 Schritten mit „zu viele Weiterleitungen“ ab. Mit `curl -v -L` siehst du
> die Kette sofort.

## Zusammenfassung

- Eine Weiterleitung = 3xx-Code + Header `Location` mit dem Ziel.
- 301 und 308 sind dauerhaft, 302 und 307 vorübergehend.
- 307 und 308 behalten Methode und Body, 301 und 302 dürfen POST zu GET machen.
- 303 lenkt nach einem Formular per GET auf die Ergebnisseite (Post/Redirect/Get).
- curl folgt Umleitungen nur mit `-L`; `-w '%{url_effective}'` zeigt das Endziel.
- 304 ist keine Umleitung, sondern gehört zum Caching.
