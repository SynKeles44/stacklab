---
title: Cookies und Sessions
summary: Wie Set-Cookie und Cookie einem zustandslosen Protokoll ein Gedächtnis geben, was HttpOnly, Secure und SameSite schützen und wie Sessions funktionieren.
duration: 25
sources:
  - title: MDN – Using HTTP cookies
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies
  - title: MDN – Set-Cookie
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie
  - title: RFC 6265 – HTTP State Management Mechanism
    url: https://www.rfc-editor.org/rfc/rfc6265
  - title: Everything curl – Cookies
    url: https://everything.curl.dev/http/cookies/index.html
  - title: PHP-Handbuch – Sessions
    url: https://www.php.net/manual/de/book.session.php
quiz:
  - type: single
    question: Wie kommt ein Cookie vom Server zum Browser und wieder zurück?
    options:
      - Der Server schickt `Cookie`, der Browser antwortet mit `Set-Cookie`.
      - Der Server schickt `Set-Cookie`, der Browser schickt danach bei passenden Anfragen `Cookie` mit.
      - Beide schicken immer `Set-Cookie`.
      - Cookies werden im Body der Antwort übertragen.
    answer: 1
    explanation: "Antwort: `Set-Cookie: name=wert` – ab dann jede passende Anfrage: `Cookie: name=wert`."
  - type: match
    question: Ordne jedem Cookie-Attribut seine Wirkung zu.
    pairs:
      - { left: "HttpOnly", right: "JavaScript kann das Cookie nicht lesen" }
      - { left: "Secure", right: "Nur über HTTPS mitschicken" }
      - { left: "SameSite=Lax", right: "Bei Anfragen von fremden Seiten meist nicht mitschicken" }
      - { left: "Max-Age=3600", right: "Nach einer Stunde löschen" }
      - { left: "Path=/admin", right: "Nur für URLs unter /admin mitschicken" }
    explanation: HttpOnly schützt vor Diebstahl per XSS, SameSite vor CSRF, Secure vor Mitlesen im Klartext.
  - type: multiple
    question: Welche Aussagen über eine Session stimmen?
    options:
      - Die Daten der Session liegen auf dem Server.
      - Im Cookie steht nur eine schwer zu erratende Session-ID.
      - Wer die Session-ID kennt, kann sich als diese Person ausgeben.
      - Das Passwort steht im Cookie, damit der Server es jedes Mal prüfen kann.
    answers: [0, 1, 2]
    explanation: Die Session-ID ist wie ein Garderobenschein. Deshalb muss sie geheim bleiben – HttpOnly und Secure helfen dabei.
  - type: find-bug
    question: Dieses Session-Cookie einer Bank-Website ist zu schwach geschützt. Welche Zeile ist problematisch?
    language: http
    code: |
      HTTP/1.1 200 OK
      Content-Type: text/html; charset=UTF-8
      Set-Cookie: theme=dunkel; Path=/; Max-Age=31536000
      Set-Cookie: sitzung=k3Jx9QpL2v; Path=/
      Cache-Control: no-store
    bug_line: 4
    explanation: >
      Das Session-Cookie braucht mindestens `HttpOnly`, `Secure` und `SameSite=Lax` (oder `Strict`).
      Ohne HttpOnly kann eingeschleustes JavaScript die Session-ID stehlen. Das Theme-Cookie ist harmlos.
tasks:
  - id: login-mit-curl
    type: terminal
    title: Einloggen mit curl und Cookie-Jar
    description: |
      Im Ordner `login` liegt ein `router.php`, das eine einfache Session nachbaut:

      - `POST /login` mit dem Formularfeld `benutzer` legt eine Session an und schickt ein Cookie `sitzung`.
      - `GET /profil` antwortet nur mit gültigem Cookie – sonst mit `401`.

      Klicke zuerst auf **Aufgabe vorbereiten**.

      1. Starte den Server: `php -S 127.0.0.1:8080 router.php > server.log 2>&1 &`
      2. Prüfe, dass `/profil` ohne Cookie `401` liefert: `curl -i http://127.0.0.1:8080/profil`
      3. Logge dich als `ada` ein und speichere die Cookies in der Datei `jar.txt`:
         `curl -c jar.txt -d benutzer=ada http://127.0.0.1:8080/login`
      4. Rufe `/profil` **mit** den gespeicherten Cookies auf und speichere den Body in `profil.txt`.
      5. Schau dir `jar.txt` und `sitzungen.json` an und beende den Server.
    workdir: login
    setup: |
      cat > router.php <<'PHP'
      <?php
      $pfad = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
      $speicher = __DIR__ . '/sitzungen.json';
      $sitzungen = is_file($speicher) ? json_decode(file_get_contents($speicher), true) : [];

      if ($_SERVER['REQUEST_METHOD'] === 'POST' && $pfad === '/login') {
          $benutzer = trim($_POST['benutzer'] ?? '');
          if ($benutzer === '') {
              http_response_code(422);
              exit("benutzer fehlt\n");
          }
          $id = bin2hex(random_bytes(16));
          $sitzungen[$id] = ['benutzer' => $benutzer];
          file_put_contents($speicher, json_encode($sitzungen, JSON_PRETTY_PRINT));
          setcookie('sitzung', $id, ['path' => '/', 'httponly' => true, 'samesite' => 'Lax']);
          exit("Eingeloggt als $benutzer\n");
      }

      if ($pfad === '/profil') {
          $id = $_COOKIE['sitzung'] ?? '';
          if (!isset($sitzungen[$id])) {
              http_response_code(401);
              exit("Bitte zuerst einloggen\n");
          }
          exit('Hallo ' . $sitzungen[$id]['benutzer'] . "\n");
      }

      http_response_code(404);
      PHP
    checks:
      - type: file_contains
        path: jar.txt
        pattern: "^#HttpOnly_127\\.0\\.0\\.1\\s.*\\ssitzung\\s+[0-9a-f]{32}$"
        message: In jar.txt fehlt das Cookie sitzung. Speichere die Cookies beim Login mit `curl -c jar.txt`.
      - type: file_contains
        path: sitzungen.json
        pattern: "\"benutzer\": \"ada\""
        message: Es gibt noch keine Session für ada. Logge dich mit `-d benutzer=ada` per POST ein.
      - type: file_contains
        path: profil.txt
        pattern: "^Hallo ada$"
        message: profil.txt soll „Hallo ada“ enthalten. Schicke die Cookies aus jar.txt mit `curl -b jar.txt` mit.
    hints:
      - "`-c datei` speichert empfangene Cookies, `-b datei` schickt gespeicherte Cookies mit."
      - "`-d benutzer=ada` macht aus der Anfrage automatisch ein POST mit Formulardaten."
      - "`curl -b jar.txt http://127.0.0.1:8080/profil > profil.txt`"
    solution: |
      ```bash
      cd login
      php -S 127.0.0.1:8080 router.php > server.log 2>&1 &
      sleep 1
      curl -i http://127.0.0.1:8080/profil
      curl -c jar.txt -d benutzer=ada http://127.0.0.1:8080/login
      curl -b jar.txt http://127.0.0.1:8080/profil > profil.txt
      cat jar.txt profil.txt sitzungen.json
      kill %1
      ```
  - id: set-cookie-bauen
    type: code
    language: php
    title: Baue einen Set-Cookie-Header
    description: |
      Schreibe `setCookieHeader(string $name, string $wert, array $optionen = []): string`. Die Funktion
      liefert den **Wert** eines `Set-Cookie`-Headers (ohne `Set-Cookie: ` davor).

      - Beginne mit `name=wert`. Der Wert wird mit `rawurlencode()` kodiert.
      - Hänge danach – nur wenn in `$optionen` vorhanden – in **dieser Reihenfolge** an, jeweils mit `; ` getrennt:
        `Max-Age=…` (Schlüssel `max_age`), `Path=…` (`path`), `Secure` (`secure` ist `true`),
        `HttpOnly` (`httponly` ist `true`), `SameSite=…` (`samesite`).
      - Ist `samesite` gleich `None`, muss auch `Secure` dabei sein – auch wenn `secure` fehlt.
    starter: |
      <?php
      function setCookieHeader(string $name, string $wert, array $optionen = []): string
      {
          $teile = [$name . '=' . rawurlencode($wert)];
          // Attribute in der richtigen Reihenfolge anhängen
          return implode('; ', $teile);
      }
    tests:
      - name: Nur Name und Wert
        code: assert_same('theme=dunkel', setCookieHeader('theme', 'dunkel'));
      - name: Sicheres Session-Cookie
        code: "assert_same('sitzung=abc; Path=/; Secure; HttpOnly; SameSite=Lax', setCookieHeader('sitzung', 'abc', ['path' => '/', 'secure' => true, 'httponly' => true, 'samesite' => 'Lax']));"
      - name: Max-Age und Kodierung
        code: "assert_same('gruss=Hallo%20Welt; Max-Age=3600', setCookieHeader('gruss', 'Hallo Welt', ['max_age' => 3600]));"
      - name: SameSite=None erzwingt Secure
        code: "assert_same('id=1; SameSite=None', str_replace('Secure; ', '', setCookieHeader('id', '1', ['samesite' => 'None']))); assert_true(str_contains(setCookieHeader('id', '1', ['samesite' => 'None']), 'Secure'));"
      - name: Max-Age 0 löscht das Cookie
        code: "assert_same('alt=; Max-Age=0', setCookieHeader('alt', '', ['max_age' => 0]));"
    hints:
      - "Prüfe mit `isset($optionen['max_age'])` – so funktioniert auch der Wert 0."
      - "`$secure = !empty($optionen['secure']) || ($optionen['samesite'] ?? '') === 'None';`"
      - "Am Ende: `return implode('; ', $teile);`"
    solution: |
      <?php
      function setCookieHeader(string $name, string $wert, array $optionen = []): string
      {
          $teile = [$name . '=' . rawurlencode($wert)];
          if (isset($optionen['max_age'])) {
              $teile[] = 'Max-Age=' . $optionen['max_age'];
          }
          if (isset($optionen['path'])) {
              $teile[] = 'Path=' . $optionen['path'];
          }
          $samesite = $optionen['samesite'] ?? null;
          if (!empty($optionen['secure']) || $samesite === 'None') {
              $teile[] = 'Secure';
          }
          if (!empty($optionen['httponly'])) {
              $teile[] = 'HttpOnly';
          }
          if ($samesite !== null) {
              $teile[] = 'SameSite=' . $samesite;
          }

          return implode('; ', $teile);
      }
---
Du legst im Online-Shop etwas in den Warenkorb, klickst auf die nächste Seite – und der Warenkorb ist
noch da. Dabei ist HTTP [[zustandslosigkeit|zustandslos]]: Jede Anfrage steht für sich. Das Gedächtnis
liefern [[cookie|Cookies]] – kleine Wertepaare, die der Browser speichert und bei jeder passenden
Anfrage mitschickt.

## Set-Cookie und Cookie

Ein Cookie entsteht, wenn der Server den Header [[set-cookie|Set-Cookie]] schickt. Danach hängt der
Browser es bei jeder Anfrage an dieselbe Website im Header `Cookie` an:

```http title="Der Server setzt ein Cookie"
HTTP/1.1 200 OK
Set-Cookie: sprache=de; Path=/; Max-Age=31536000
```

```http title="Jede weitere Anfrage trägt es mit"
GET /produkte HTTP/1.1
Host: shop.example.com
Cookie: sprache=de
```

Pro Cookie gibt es eine eigene `Set-Cookie`-Zeile. Im `Cookie`-Header stehen dagegen alle zusammen,
getrennt durch Semikolon: `Cookie: sprache=de; sitzung=k3Jx9QpL2v`. Ein Cookie darf etwa 4 KB groß sein.

> [!MERKSATZ]
> Der Server **setzt** mit `Set-Cookie`, der Browser **schickt zurück** mit `Cookie` – automatisch,
> bei jeder passenden Anfrage.

## Die Attribute eines Cookies

Hinter Name und Wert folgen Attribute, die steuern, wann und wohin das Cookie mitgeht:

| Attribut | Wirkung |
|---|---|
| `Max-Age=3600` / `Expires=…` | Lebensdauer; ohne beides ist es ein Sitzungs-Cookie, das beim Schließen des Browsers verschwindet |
| `Path=/` | Für welche Pfade es mitgeht |
| `Domain=example.com` | Auch für Subdomains mitschicken (ohne: nur exakt dieser Host) |
| `Secure` | Nur über HTTPS mitschicken |
| `HttpOnly` | Für JavaScript unsichtbar |
| `SameSite=Strict / Lax / None` | Ob es bei Anfragen von fremden Seiten mitgeht |

Löschen heißt: dasselbe Cookie mit `Max-Age=0` erneut setzen. Ein Cookie mit `SameSite=None` muss
zusätzlich `Secure` haben, sonst verwirft der Browser es.

## Sessions: das Gedächtnis auf dem Server

Wichtige Daten wie „angemeldet als Ada“ gehören nicht ins Cookie – das könnte jeder verändern.
Stattdessen speichert der Server sie in einer [[session|Session]] und gibt dem Browser nur eine
[[session-id|Session-ID]]:

1. Ada schickt Benutzername und Passwort per `POST /login`.
2. Der Server prüft sie, legt eine Session an und merkt sich: `k3Jx9QpL2v → Ada`.
3. Er antwortet mit `Set-Cookie: sitzung=k3Jx9QpL2v; HttpOnly; Secure; SameSite=Lax`.
4. Jede weitere Anfrage trägt das Cookie, der Server schlägt nach: „Das ist Ada.“

Die Session-ID funktioniert wie ein Garderobenschein: Er enthält nichts Wertvolles, aber wer ihn hat,
bekommt die Jacke. PHP erledigt das mit `session_start()` und dem Cookie `PHPSESSID`.

> [!FEHLER]
> Benutzername oder Rolle direkt ins Cookie schreiben (`rolle=admin`). Cookies kann jeder im Browser
> ändern – der Server muss Rechte immer aus seinen eigenen Daten ableiten.

## Schutz: HttpOnly, Secure, SameSite

Eine gestohlene Session-ID ist so gut wie ein gestohlenes Passwort. Drei Attribute schützen sie:

- [[httponly|HttpOnly]] – Gelingt Angreifern, eigenes JavaScript in eine Seite zu schleusen
  ([[xss|XSS]]), kann es das Cookie trotzdem nicht lesen.
- [[secure-attribut|Secure]] – Das Cookie reist nie unverschlüsselt über `http://`.
- [[samesite|SameSite]] – `Lax` schickt das Cookie bei Formular-POSTs von fremden Seiten nicht mit.
  Das bremst [[csrf|CSRF]]: Eine böse Seite kann dann nicht in deinem Namen etwas auslösen.

Moderne Browser behandeln Cookies ohne SameSite-Angabe bereits wie `Lax`. Verlass dich nicht darauf –
setze die Attribute ausdrücklich.

> [!PRAXIS]
> Ein Session-Cookie in Produktion sieht so aus:
> `Set-Cookie: sitzung=…; Path=/; HttpOnly; Secure; SameSite=Lax`. Frameworks wie Laravel setzen das
> standardmäßig – prüfe es trotzdem einmal im Netzwerk-Tab unter „Cookies“.

## Cookies mit curl

curl vergisst Cookies normalerweise sofort. Mit einer [[cookie-jar|Cookie-Jar]]-Datei merkt es sie sich:

| Option | Wirkung |
|---|---|
| `-c jar.txt` | Empfangene Cookies in `jar.txt` speichern |
| `-b jar.txt` | Cookies aus `jar.txt` mitschicken |
| `-b 'sprache=de'` | Ein Cookie direkt angeben |

```bash title="Einloggen und eingeloggt bleiben"
curl -c jar.txt -d 'benutzer=ada' http://127.0.0.1:8080/login
curl -b jar.txt http://127.0.0.1:8080/profil
```

Die Datei hat ein einfaches Textformat. Cookies mit HttpOnly stehen dort mit dem Präfix `#HttpOnly_`.

## Zusammenfassung

- `Set-Cookie` setzt ein Cookie, der Browser schickt es danach im Header `Cookie` mit.
- Attribute steuern Lebensdauer (`Max-Age`), Gültigkeit (`Path`, `Domain`) und Schutz.
- Eine Session speichert Daten auf dem Server, das Cookie trägt nur die Session-ID.
- `HttpOnly` schützt vor XSS-Diebstahl, `Secure` vor Mitlesen, `SameSite` vor CSRF.
- Nie Rechte oder Passwörter ins Cookie schreiben.
- Mit `curl -c` speicherst du Cookies, mit `-b` schickst du sie mit.
