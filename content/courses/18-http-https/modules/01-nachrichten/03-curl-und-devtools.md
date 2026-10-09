---
title: Werkzeuge – curl und der Netzwerk-Tab
summary: Mit curl schickst du jede denkbare Anfrage aus dem Terminal, mit dem Netzwerk-Tab siehst du, was dein Browser wirklich sendet.
duration: 25
sources:
  - title: curl – Handbuch (man page)
    url: https://curl.se/docs/manpage.html
  - title: Everything curl – HTTP with curl
    url: https://everything.curl.dev/http/index.html
  - title: Chrome DevTools – Network features reference
    url: https://developer.chrome.com/docs/devtools/network/reference
  - title: Firefox – Network Monitor
    url: https://firefox-source-docs.mozilla.org/devtools-user/network_monitor/index.html
quiz:
  - type: match
    question: Ordne jeder curl-Option ihre Wirkung zu.
    pairs:
      - { left: "-i", right: "Antwort-Header mit ausgeben" }
      - { left: "-v", right: "Gesendete und empfangene Zeilen anzeigen" }
      - { left: "-X DELETE", right: "Methode festlegen" }
      - { left: "-H 'Accept: application/json'", right: "Eigenen Header mitschicken" }
      - { left: "-L", right: "Weiterleitungen folgen" }
    explanation: Mit diesen fünf Optionen kommst du bei der Fehlersuche schon sehr weit.
  - type: single
    question: Was macht `curl --json '{"titel":"Test"}' http://127.0.0.1:8080/notizen`?
    options:
      - Es schickt eine GET-Anfrage und gibt die Antwort als JSON formatiert aus.
      - Es schickt eine POST-Anfrage mit dem JSON als Body und setzt Content-Type und Accept auf application/json.
      - Es prüft nur, ob der Text gültiges JSON ist.
      - Es schickt den Text als Formulardaten.
    answer: 1
    explanation: "`--json` ist eine Abkürzung für `-d` plus die beiden Header `Content-Type: application/json` und `Accept: application/json`."
  - type: multiple
    question: Wofür ist der Netzwerk-Tab der Browser-Entwicklerwerkzeuge gut?
    options:
      - Alle Anfragen einer Seite mit Status, Typ, Größe und Dauer sehen
      - Anfrage- und Antwort-Header einer einzelnen Anfrage lesen
      - Den Quellcode des Servers ändern
      - Eine Anfrage als curl-Befehl kopieren und im Terminal wiederholen
    answers: [0, 1, 3]
    explanation: Der Netzwerk-Tab zeigt, was der Browser sendet und bekommt. Den Server ändert er nicht.
  - type: cloze
    text: "Mit `curl ___ http://example.com/` holst du nur die Header – curl schickt dafür die Methode HEAD."
    blanks:
      - ["-I", "--head"]
    explanation: "`-I` (großes i) sendet HEAD. `-i` (kleines i) sendet GET und zeigt die Header zusätzlich zum Body."
tasks:
  - id: echo-server
    type: terminal
    title: Verhöre einen Echo-Server
    description: |
      Im Ordner `echo-server` liegt ein vorbereitetes `router.php`. Es antwortet auf **jede** Anfrage
      mit einer JSON-Beschreibung dessen, was es empfangen hat, und schreibt jede Anfrage zusätzlich als
      Zeile in `anfragen.log`. So siehst du genau, was curl verschickt.

      Klicke zuerst auf **Aufgabe vorbereiten**.

      1. Starte den Server: `php -S 127.0.0.1:8080 router.php > server.log 2>&1 &` und warte kurz.
      2. Hole `/info` mit `curl -i` und speichere die komplette Ausgabe (Header + Body) in `antwort-i.txt`.
      3. Schicke eine **DELETE**-Anfrage an `/notizen/3`.
      4. Schicke mit `--json` das JSON `{"titel":"Test"}` an `/notizen`.
      5. Schicke eine Anfrage an `/hallo` mit dem eigenen Header `Accept-Language: de`.
      6. Sieh dir `anfragen.log` an (z. B. mit `jq . anfragen.log`) und beende den Server mit `kill %1`.
    workdir: echo-server
    setup: |
      cat > router.php <<'PHP'
      <?php
      $eintrag = [
          'methode' => $_SERVER['REQUEST_METHOD'],
          'pfad' => $_SERVER['REQUEST_URI'],
          'header' => array_change_key_case(getallheaders(), CASE_LOWER),
          'body' => file_get_contents('php://input'),
      ];
      file_put_contents(__DIR__ . '/anfragen.log', json_encode($eintrag, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND);
      header('Content-Type: application/json');
      header('X-Echo: stacklab');
      echo json_encode($eintrag, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n";
      PHP
    checks:
      - type: file_contains
        path: antwort-i.txt
        pattern: "^HTTP/1\\.1 200 OK"
        message: antwort-i.txt soll mit der Statuszeile beginnen. Hast du `curl -i http://127.0.0.1:8080/info > antwort-i.txt` ausgeführt?
      - type: file_contains
        path: antwort-i.txt
        pattern: "^X-Echo: stacklab"
        message: In antwort-i.txt fehlen die Antwort-Header (z. B. X-Echo). Nutze die Option -i.
      - type: command
        run: jq -r 'select(.methode == "DELETE" and .pfad == "/notizen/3") | .pfad' anfragen.log | head -n 1
        stdout_equals: /notizen/3
        message: Im Log fehlt eine DELETE-Anfrage an /notizen/3. Die Methode setzt du mit -X DELETE.
      - type: command
        run: jq -r 'select(.methode == "POST" and .pfad == "/notizen" and (.header["content-type"] // "" | startswith("application/json"))) | .body | fromjson | .titel' anfragen.log | head -n 1
        stdout_equals: Test
        message: Im Log fehlt ein POST an /notizen mit Content-Type application/json und dem Body {"titel":"Test"}. Nutze --json.
      - type: command
        run: jq -r 'select(.pfad == "/hallo") | .header["accept-language"] // empty' anfragen.log | head -n 1
        stdout_equals: de
        message: Im Log fehlt eine Anfrage an /hallo mit dem Header Accept-Language de. Eigene Header setzt du mit -H.
    hints:
      - "Die Ausgabe von `curl -i URL` leitest du mit `> antwort-i.txt` in eine Datei um."
      - "`curl -X DELETE URL` und `curl --json '{\"titel\":\"Test\"}' URL` – auf die Anführungszeichen achten."
      - "`curl -H 'Accept-Language: de' http://127.0.0.1:8080/hallo`"
    solution: |
      ```bash
      cd echo-server
      php -S 127.0.0.1:8080 router.php > server.log 2>&1 &
      sleep 1
      curl -i http://127.0.0.1:8080/info > antwort-i.txt
      curl -X DELETE http://127.0.0.1:8080/notizen/3
      curl --json '{"titel":"Test"}' http://127.0.0.1:8080/notizen
      curl -H 'Accept-Language: de' http://127.0.0.1:8080/hallo
      jq . anfragen.log
      kill %1
      ```
  - id: netzwerk-tab
    type: steps
    title: Detektivarbeit im Netzwerk-Tab
    description: Du untersuchst eine Seite mit den Entwicklerwerkzeugen deines Browsers. Was tust du als Nächstes?
    steps:
      - situation: >
          Eine Seite zeigt „Keine Notizen gefunden“, obwohl es welche geben müsste. Du öffnest die
          Entwicklerwerkzeuge (F12) und den Netzwerk-Tab – er ist leer.
        question: Warum ist die Liste leer?
        options:
          - Die Seite hat keine Anfragen geschickt.
          - Der Netzwerk-Tab zeichnet erst auf, wenn er offen ist – du musst die Seite neu laden.
          - Der Browser blockiert alle Anfragen.
        answer: 1
        explanation: Anfragen, die vor dem Öffnen passiert sind, sieht der Netzwerk-Tab nicht. Nach dem Neuladen erscheinen alle.
      - situation: >
          Nach dem Neuladen siehst du die Anfrage `GET /api/notizen`. In der Spalte Status steht `401`.
        question: Was bedeutet das für die Fehlersuche?
        options:
          - Der Server ist abgestürzt.
          - Die Anfrage kam an, aber der Server kennt dich nicht – die Anmeldung fehlt oder ist ungültig.
          - Die Seite ist umgezogen.
        answer: 1
        explanation: 4xx heißt Fehler auf Seite des Clients. 401 bedeutet „nicht angemeldet“.
      - situation: >
          Du klickst die Anfrage an und öffnest den Bereich mit den Request-Headern. Ein Header
          `Authorization` ist nicht dabei.
        question: Wie prüfst du am schnellsten, ob die API mit Anmeldung funktioniert?
        options:
          - Rechtsklick auf die Anfrage → „Copy as cURL“, im Terminal einen gültigen Authorization-Header ergänzen und erneut senden.
          - Den Browser neu installieren.
          - Die Seite fünfmal neu laden.
        answer: 0
        explanation: >
          „Copy as cURL“ liefert die exakte Anfrage als Befehl. Im Terminal kannst du einen Header ändern
          und die Antwort vergleichen – ohne die App anzufassen.
---
Eine App zeigt einen Fehler, aber du weißt nicht, ob die Anfrage falsch ist oder die Antwort. Raten
hilft nicht – du musst die Unterhaltung **sehen**. Dafür gibt es zwei Werkzeuge, die jede Entwicklerin
täglich nutzt: [[curl|curl]] im Terminal und den [[netzwerk-tab|Netzwerk-Tab]] im Browser.

## curl: HTTP aus dem Terminal

curl („client for URLs“) schickt eine Anfrage und gibt den Body der Antwort aus. Ohne weitere Optionen
sendet es `GET`:

```bash title="Einfachste Anfrage"
curl http://127.0.0.1:8080/info
```

Die wichtigsten Optionen zum **Anschauen**:

| Option | Wirkung |
|---|---|
| `-i` | Statuszeile und Antwort-Header vor dem Body ausgeben |
| `-I` | Nur Header holen (sendet `HEAD`) |
| `-v` | Alles zeigen: `>` gesendet, `<` empfangen, `*` Infos von curl |
| `-s` | Fortschrittsanzeige und Fehlermeldungen ausblenden |
| `-o datei` | Body in eine Datei schreiben |
| `-w '%{http_code}'` | Nach der Anfrage Werte ausgeben, z. B. den Statuscode |

```bash title="Nur den Statuscode ausgeben"
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8080/info
```

> [!FEHLER]
> `-i` und `-I` verwechseln: `-I` schickt `HEAD` statt `GET`. Manche Server behandeln `HEAD` anders –
> dann siehst du ein Ergebnis, das mit der echten `GET`-Anfrage nichts zu tun hat.

## curl: Anfragen gestalten

Mit diesen Optionen baust du jede Anfrage nach:

| Option | Wirkung |
|---|---|
| `-X METHODE` | Methode festlegen, z. B. `-X DELETE` |
| `-H 'Name: Wert'` | Header hinzufügen (mehrfach möglich) |
| `-d 'a=1&b=2'` | Body senden – macht automatisch `POST` mit Formular-Format |
| `--json '{...}'` | JSON-Body senden, setzt `Content-Type` und `Accept` auf `application/json` |
| `-L` | Weiterleitungen folgen |

```bash title="Eine JSON-API ansprechen"
curl -i --json '{"titel":"Einkaufen"}' \
  -H 'Authorization: Bearer <dein-token>' \
  https://api.example.com/notizen
```

`--json` gibt es seit curl 7.82. Bei älteren Versionen schreibst du
`-H 'Content-Type: application/json' -d '{...}'`.

> [!MERKSATZ]
> `-i` zum schnellen Hinsehen, `-v` für die ganze Unterhaltung, `-X`, `-H` und `--json` zum Nachbauen.

## Ein Echo-Server zum Üben

Um zu sehen, was curl wirklich verschickt, hilft ein Server, der jede Anfrage einfach zurückspiegelt.
Mit `php -S` und einem [[router-skript|Router-Skript]] ist das schnell gebaut: PHP ruft das Skript für
**jede** Anfrage auf, egal welcher Pfad.

```php title="router.php – Kern des Echo-Servers"
<?php
$eintrag = [
    'methode' => $_SERVER['REQUEST_METHOD'],
    'pfad'    => $_SERVER['REQUEST_URI'],
    'header'  => getallheaders(),
    'body'    => file_get_contents('php://input'),
];
header('Content-Type: application/json');
echo json_encode($eintrag, JSON_PRETTY_PRINT);
```

```bash title="Starten und ausprobieren"
php -S 127.0.0.1:8080 router.php > server.log 2>&1 &
curl -X DELETE http://127.0.0.1:8080/notizen/3
```

`$_SERVER['REQUEST_METHOD']` enthält die Methode, `php://input` den rohen Body. Genau diesen Server
nutzt du gleich in der Übung.

## Der Netzwerk-Tab im Browser

Jeder moderne Browser bringt [[devtools|Entwicklerwerkzeuge]] mit (F12 oder Rechtsklick →
„Untersuchen“). Im Netzwerk-Tab erscheint jede Anfrage als Zeile:

| Spalte | Zeigt |
|---|---|
| Name | Pfad der Ressource |
| Status | Statuscode, z. B. `200`, `304`, `404` |
| Type | Art, z. B. document, script, fetch |
| Size | Übertragene Größe – oder „(disk cache)“ |
| Time | Dauer bis zur fertigen Antwort |

Klickst du eine Zeile an, siehst du Request- und Response-Header, den gesendeten Body („Payload“), die
Antwort und eine Zeitleiste.

Drei Schalter solltest du kennen: **Preserve log** behält Anfragen über Seitenwechsel hinweg,
**Disable cache** schaltet den Browser-[[cache|Cache]] ab, und **Copy as cURL** (Rechtsklick) kopiert
eine Anfrage als curl-Befehl.

> [!PRAXIS]
> Meldet jemand „die App lädt nicht“, ist der Netzwerk-Tab der erste Blick: Ist die Anfrage rot? Welcher
> Status? Mit „Copy as cURL“ landet die Anfrage dann im Terminal, wo du sie in Ruhe variierst.

## Zusammenfassung

- curl schickt Anfragen aus dem Terminal; ohne Optionen ist es `GET`.
- `-i`, `-I`, `-v` zeigen Header und die ganze Unterhaltung, `-s -o /dev/null -w` liefert einzelne Werte.
- `-X`, `-H`, `-d` und `--json` bauen jede Anfrage nach, `-L` folgt Weiterleitungen.
- Mit `php -S` und einem Router-Skript beantwortet ein PHP-Skript jede Anfrage.
- Der Netzwerk-Tab zeigt jede Browser-Anfrage mit Status, Headern und Zeiten.
- „Copy as cURL“ bringt eine Browser-Anfrage ins Terminal.
