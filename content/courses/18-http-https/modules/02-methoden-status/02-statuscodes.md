---
title: Statuscodes – die Antwort in drei Ziffern
summary: Die fünf Klassen und die Codes, die du täglich brauchst – von 200 und 201 über 401, 403, 404, 409, 422 und 429 bis 500, 502, 503 und 504.
duration: 25
sources:
  - title: MDN – HTTP response status codes
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status
  - title: RFC 9110 – Abschnitt 15, Status Codes
    url: https://www.rfc-editor.org/rfc/rfc9110#name-status-codes
  - title: RFC 6585 – Additional HTTP Status Codes (429)
    url: https://www.rfc-editor.org/rfc/rfc6585
  - title: PHP-Handbuch – http_response_code
    url: https://www.php.net/manual/de/function.http-response-code.php
quiz:
  - type: single
    question: Ein Nutzer ist angemeldet, ruft aber die Admin-Seite auf, für die ihm die Rechte fehlen. Welcher Code passt?
    options: ["401 Unauthorized", "403 Forbidden", "404 Not Found", "400 Bad Request"]
    answer: 1
    explanation: >
      401 heißt „nicht angemeldet“ – der Server weiß nicht, wer du bist. 403 heißt „ich weiß, wer du bist,
      aber du darfst das nicht“. Hier ist die Person bekannt, ihr fehlen nur Rechte.
  - type: match
    question: Ordne jeder Situation den passenden Statuscode zu.
    pairs:
      - { left: "Notiz wurde neu angelegt", right: "201" }
      - { left: "Notiz wurde gelöscht, es gibt nichts zurückzuschicken", right: "204" }
      - { left: "Der Body ist kein gültiges JSON", right: "400" }
      - { left: "JSON ist gültig, aber das Pflichtfeld titel ist leer", right: "422" }
      - { left: "Der Benutzername ist schon vergeben", right: "409" }
      - { left: "Zu viele Anfragen in kurzer Zeit", right: "429" }
    explanation: >
      400 = Anfrage kaputt, 422 = Anfrage lesbar, aber inhaltlich ungültig, 409 = Konflikt mit dem
      aktuellen Zustand. 201 und 204 sind Erfolgsmeldungen mit besonderer Bedeutung.
  - type: multiple
    question: Welche Codes deuten auf ein Problem auf der Serverseite hin, nicht beim Client?
    options: ["500", "502", "404", "503", "429", "504"]
    answers: [0, 1, 3, 5]
    explanation: Alle 5xx-Codes sind Serverfehler. 404 und 429 sind 4xx – das Problem liegt bei der Anfrage.
  - type: cloze
    text: "Ein Reverse Proxy bekommt vom App-Server keine gültige Antwort: ___. Der App-Server antwortet ihm zu langsam: ___."
    blanks:
      - ["502", "502 Bad Gateway"]
      - ["504", "504 Gateway Timeout"]
    explanation: "502 = Bad Gateway (kaputte oder keine Antwort), 504 = Gateway Timeout (Antwort kam zu spät)."
tasks:
  - id: code-zuordnen
    type: dragdrop
    title: Welche Klasse passt?
    description: Ordne jede Antwort der richtigen Statuscode-Klasse zu.
    targets:
      - { id: erfolg, label: "2xx – Erfolg" }
      - { id: umleitung, label: "3xx – Umleitung" }
      - { id: client, label: "4xx – Fehler des Clients" }
      - { id: server, label: "5xx – Fehler des Servers" }
    items:
      - { label: "201 Created", target: erfolg }
      - { label: "204 No Content", target: erfolg }
      - { label: "304 Not Modified", target: umleitung }
      - { label: "308 Permanent Redirect", target: umleitung }
      - { label: "401 Unauthorized", target: client }
      - { label: "422 Unprocessable Content", target: client }
      - { label: "503 Service Unavailable", target: server }
      - { label: "504 Gateway Timeout", target: server }
    hints:
      - Die erste Ziffer entscheidet.
  - id: status-router
    type: terminal
    title: Ein Server für alle Fälle
    description: |
      Du baust einen Testserver, der für bestimmte Pfade bestimmte Statuscodes liefert – so etwas nutzen
      Teams, um zu prüfen, ob ihre App mit jedem Fehler klarkommt.

      Klicke zuerst auf **Aufgabe vorbereiten**. Im Ordner `status-router` liegt ein `router.php`, das
      schon `/ok` beantwortet. Ergänze es:

      | Pfad | Status | Besonderheit |
      |---|---|---|
      | `/ok` | 200 | (schon fertig) |
      | `/neu` | 201 | Header `Location: /dinge/1` |
      | `/leer` | 204 | kein Body |
      | `/verboten` | 403 | |
      | `/zu-viele` | 429 | Header `Retry-After: 30` |
      | `/kaputt` | 500 | |
      | alles andere | 404 | |

      Teste mit `php -S 127.0.0.1:8080 router.php > server.log 2>&1 &` und
      `curl -i http://127.0.0.1:8080/neu`.
    workdir: status-router
    setup: |
      cat > router.php <<'PHP'
      <?php
      $pfad = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

      switch ($pfad) {
          case '/ok':
              http_response_code(200);
              echo "alles gut\n";
              break;
          // TODO: weitere Fälle ergänzen
          default:
              http_response_code(200);
              echo "noch nicht gebaut\n";
      }
      PHP
    checks:
      - type: command
        run: |
          T=$(mktemp -d "$PWD/.pruefung-XXXXXX"); cp router.php "$T"/; cd "$T"
          php -S 127.0.0.1:18201 router.php >/dev/null 2>&1 & P=$!; sleep 1
          for p in ok neu leer verboten zu-viele kaputt gibts-nicht; do curl -s -o /dev/null -w '%{http_code} ' "http://127.0.0.1:18201/$p"; done
          kill $P; cd ..; rm -rf "$T"
        stdout_matches: "^200 201 204 403 429 500 404$"
        message: "Die Statuscodes stimmen noch nicht. Erwartet für /ok, /neu, /leer, /verboten, /zu-viele, /kaputt, /gibts-nicht: 200 201 204 403 429 500 404."
      - type: command
        run: |
          T=$(mktemp -d "$PWD/.pruefung-XXXXXX"); cp router.php "$T"/; cd "$T"
          php -S 127.0.0.1:18202 router.php >/dev/null 2>&1 & P=$!; sleep 1
          curl -s -o /dev/null -D - http://127.0.0.1:18202/neu | tr -d '\r' | grep -i '^location:'
          curl -s -o /dev/null -D - http://127.0.0.1:18202/zu-viele | tr -d '\r' | grep -i '^retry-after:'
          kill $P; cd ..; rm -rf "$T"
        stdout_matches: "^[Ll]ocation: /dinge/1\\n[Rr]etry-[Aa]fter: 30$"
        message: "Es fehlt ein Header: /neu braucht Location: /dinge/1, /zu-viele braucht Retry-After: 30."
      - type: command
        run: |
          T=$(mktemp -d "$PWD/.pruefung-XXXXXX"); cp router.php "$T"/; cd "$T"
          php -S 127.0.0.1:18203 router.php >/dev/null 2>&1 & P=$!; sleep 1
          curl -s -o /dev/null -w '%{size_download}' http://127.0.0.1:18203/leer
          kill $P; cd ..; rm -rf "$T"
        stdout_equals: "0"
        message: Die Antwort auf /leer (204) darf keinen Body haben – lass das echo dort weg.
    hints:
      - "Jeder Fall bekommt einen eigenen `case '/neu':` mit `http_response_code(201);` und `break;`."
      - "Header setzt du mit `header('Location: /dinge/1');` – immer vor einem `echo`."
      - "Ändere im `default`-Zweig den Code von 200 auf 404."
    solution: |
      ```bash
      cd status-router
      cat > router.php <<'PHP'
      <?php
      $pfad = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

      switch ($pfad) {
          case '/ok':
              http_response_code(200);
              echo "alles gut\n";
              break;
          case '/neu':
              http_response_code(201);
              header('Location: /dinge/1');
              echo "angelegt\n";
              break;
          case '/leer':
              http_response_code(204);
              break;
          case '/verboten':
              http_response_code(403);
              echo "keine Berechtigung\n";
              break;
          case '/zu-viele':
              http_response_code(429);
              header('Retry-After: 30');
              echo "bitte warten\n";
              break;
          case '/kaputt':
              http_response_code(500);
              echo "interner Fehler\n";
              break;
          default:
              http_response_code(404);
              echo "nicht gefunden\n";
      }
      PHP
      php -S 127.0.0.1:8080 router.php > server.log 2>&1 &
      sleep 1
      curl -i http://127.0.0.1:8080/neu
      curl -i http://127.0.0.1:8080/zu-viele
      kill %1
      ```
---
Ein Paket kommt zurück. Auf dem Aufkleber steht „Empfänger unbekannt“ oder „Annahme verweigert“ oder
„Adresse geändert“ – du weißt sofort, was los ist, ohne das Paket zu öffnen. Genau das leistet der
[[statuscode|Statuscode]] einer HTTP-Antwort: drei Ziffern, die das Ergebnis zusammenfassen, bevor
irgendwer den Body liest.

## Fünf Klassen

Die erste Ziffer bestimmt die Klasse. Die anderen beiden präzisieren.

| Klasse | Bedeutung | Merkhilfe |
|---|---|---|
| `1xx` | Information, Zwischenstand | selten sichtbar |
| `2xx` | Erfolg | „Hat geklappt.“ |
| `3xx` | Umleitung | „Schau woanders nach.“ |
| `4xx` | Fehler des Clients | „Du hast etwas falsch gemacht.“ |
| `5xx` | Fehler des Servers | „Ich habe etwas falsch gemacht.“ |

Kennt ein Client einen Code nicht, behandelt er ihn wie das `x00` seiner Klasse. Ein unbekanntes `418`
gilt also wie `400`.

> [!MERKSATZ]
> 4xx: Die Anfrage muss sich ändern, damit es klappt. 5xx: Dieselbe Anfrage kann später funktionieren.

## Erfolg: 200, 201, 204

| Code | Wann |
|---|---|
| `200 OK` | Standard-Erfolg mit Inhalt, z. B. bei `GET` |
| `201 Created` | Etwas wurde angelegt – meist mit Header `Location: /notizen/7` |
| `204 No Content` | Erfolgreich, aber kein Body, z. B. nach `DELETE` |

Bei `201` zeigt der Header [[location-header|Location]] auf die neue Ressource. So muss der Client
nicht raten, unter welcher ID sie gespeichert wurde.

Ein `204` hat **nie** einen Body. Schickt der Server trotzdem Text, wird er ignoriert oder bringt die
Verbindung durcheinander.

## Client-Fehler: die 4xx-Familie

| Code | Bedeutung |
|---|---|
| `400 Bad Request` | Anfrage kaputt, z. B. ungültiges JSON |
| `401 Unauthorized` | Nicht angemeldet – „Wer bist du?“ |
| `403 Forbidden` | Angemeldet, aber keine Berechtigung |
| `404 Not Found` | Ressource gibt es nicht |
| `405 Method Not Allowed` | Methode hier nicht erlaubt, Header `Allow` nennt die erlaubten |
| `409 Conflict` | Widerspricht dem aktuellen Zustand, z. B. Name schon vergeben |
| `422 Unprocessable Content` | Lesbar, aber inhaltlich ungültig, z. B. Pflichtfeld leer |
| `429 Too Many Requests` | Zu viele Anfragen, Header `Retry-After` sagt, wie lange warten |

`429` ist die Antwort auf [[rate-limiting|Rate Limiting]]: APIs begrenzen, wie oft ein Client pro
Minute fragen darf.

> [!FEHLER]
> 401 und 403 verwechseln. Der Name „Unauthorized“ ist historisch unglücklich – gemeint ist „nicht
> **authentifiziert**“. Fehlende **Rechte** bei bekannter Person sind 403.

## Server-Fehler: die 5xx-Familie

| Code | Bedeutung |
|---|---|
| `500 Internal Server Error` | Unerwarteter Fehler im Programm, z. B. eine Exception |
| `502 Bad Gateway` | Ein vorgeschalteter Server bekam keine gültige Antwort |
| `503 Service Unavailable` | Server überlastet oder in Wartung, oft mit `Retry-After` |
| `504 Gateway Timeout` | Ein vorgeschalteter Server wartete zu lange |

502 und 504 kommen von einem [[reverse-proxy|Reverse Proxy]] wie nginx, der Anfragen an den eigentlichen
App-Server weiterreicht. Läuft die App gar nicht, gibt es 502. Hängt sie bei einer langsamen
Datenbankabfrage, gibt es 504.

> [!PRAXIS]
> Bei einem 502 schaust du zuerst, ob der App-Prozess überhaupt läuft. Bei einem 504 suchst du nach
> langsamen Abfragen. Bei einem 500 steht die Ursache fast immer im Log der Anwendung.

## Statuscodes in PHP setzen

Im Router-Skript setzt `http_response_code()` den Code und `header()` zusätzliche Header. Beides muss
vor der ersten Ausgabe passieren:

```php title="router.php – ein Ausschnitt"
<?php
if ($titel === '') {
    http_response_code(422);
    header('Content-Type: application/json');
    echo json_encode(['fehler' => 'titel darf nicht leer sein']);
    exit;
}
```

Mit `curl -s -o /dev/null -w '%{http_code}'` prüfst du schnell, ob dein Server den richtigen Code liefert.

## Zusammenfassung

- Die erste Ziffer ist die Klasse: 2xx Erfolg, 3xx Umleitung, 4xx Client, 5xx Server.
- 201 kommt mit `Location`, 204 hat nie einen Body.
- 400 = kaputt, 422 = ungültig, 409 = Konflikt, 404 = gibt es nicht.
- 401 = nicht angemeldet, 403 = keine Berechtigung.
- 429 und 503 sagen mit `Retry-After`, wann du es wieder versuchen darfst.
- 502 und 504 meldet ein Proxy, wenn der App-Server nicht oder zu langsam antwortet.
