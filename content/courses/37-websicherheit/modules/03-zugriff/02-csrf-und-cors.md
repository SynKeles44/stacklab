---
title: CSRF abwehren und CORS richtig einstellen
summary: Verstehen, warum der Browser Cookies an fremde Anfragen hängt, Formulare mit Token, SameSite und Origin-Prüfung schützen – und CORS nicht versehentlich weit öffnen.
duration: 25
sources:
  - title: OWASP Cheat Sheet – Cross-Site Request Forgery Prevention
    url: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
  - title: MDN – Cross-site request forgery (CSRF)
    url: https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/CSRF
  - title: MDN – Cross-Origin Resource Sharing (CORS)
    url: https://developer.mozilla.org/de/docs/Web/HTTP/Guides/CORS
  - title: MDN – Sec-Fetch-Site
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Fetch-Site
  - title: PHP Manual – hash_equals
    url: https://www.php.net/manual/de/function.hash-equals.php
quiz:
  - type: single
    question: Warum funktioniert ein CSRF-Angriff überhaupt?
    options:
      - Weil die fremde Seite das Passwort der Nutzerin kennt.
      - Weil der Browser bei Anfragen an deine Domain automatisch die passenden Cookies mitschickt – auch wenn eine fremde Seite die Anfrage auslöst.
      - Weil HTTPS die Anfrage nicht verschlüsselt.
    answer: 1
    explanation: >
      Die fremde Seite muss das Session-Cookie gar nicht kennen. Sie bringt nur den Browser dazu, eine Anfrage zu
      senden – und der hängt das Cookie selbst an.
  - type: multiple
    question: Welche Maßnahmen schützen ein Formular zum Ändern der E-Mail-Adresse vor CSRF?
    options:
      - Ein zufälliges CSRF-Token in Session und Formular, das der Server vergleicht.
      - Session-Cookie mit `SameSite=Lax` oder `Strict`.
      - Prüfen, dass `Origin` bzw. `Sec-Fetch-Site` auf den eigenen Origin zeigt.
      - Die Änderung per GET-Link statt POST-Formular auslösen.
    answers: [0, 1, 2]
    explanation: >
      Token, SameSite und Origin-Prüfung ergänzen sich. Zustandsändernde GET-Anfragen machen CSRF dagegen besonders
      leicht – ein simples `<img src="…">` genügt.
  - type: find-bug
    question: Diese CORS-Konfiguration einer API öffnet eine Lücke. In welcher Zeile?
    language: php
    code: |
      $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
      header('Vary: Origin');
      header('Access-Control-Allow-Origin: ' . $origin);
      header('Access-Control-Allow-Credentials: true');
      header('Access-Control-Allow-Methods: GET, POST');
    bug_line: 3
    explanation: >
      Der Server spiegelt **jeden** Origin zurück und erlaubt Cookies. Damit kann jede fremde Seite eingeloggte
      Anfragen stellen und die Antworten lesen. Richtig: Origin gegen eine Allowlist prüfen.
  - type: cloze
    text: "Tokens vergleichst du in PHP mit `hash____()`, weil diese Funktion immer gleich lange braucht und so keine Rückschlüsse über die Laufzeit erlaubt."
    blanks:
      - [_equals]
    explanation: Ein normaler `===`-Vergleich bricht beim ersten falschen Zeichen ab. Bei Geheimnissen nutzt du deshalb einen zeitkonstanten Vergleich.
tasks:
  - id: csrf-diagramm
    type: diagram
    title: Den CSRF-Ablauf beschriften
    description: Beschrifte die Stationen eines CSRF-Angriffs. Die Nummern zeigen die Reihenfolge der Anfragen.
    image: /assets/websicherheit/csrf-ablauf-leer.svg
    slots:
      - { x: 18, y: 44, answer: Browser der Nutzerin }
      - { x: 82, y: 22, answer: Fremde Seite }
      - { x: 82, y: 74, answer: Deine App }
      - { x: 50, y: 89, answer: Session-Cookie }
    distractors: [CSRF-Token, Datenbank]
    hints:
      - "Die Nutzerin ist bei deiner App eingeloggt und besucht nebenbei eine fremde Seite."
      - "Was hängt der Browser bei Schritt 3 automatisch an die Anfrage an deine App?"
  - id: csrf-und-cors-pruefen
    type: code
    language: php
    title: CSRF-Token und CORS-Origin prüfen
    description: |
      Schreibe zwei Prüffunktionen:

      1. `pruefeCsrf(?string $sessionToken, ?string $gesendet): bool` – `true` nur, wenn beide Werte nicht leer sind
         und mit `hash_equals()` übereinstimmen.
      2. `corsOrigin(?string $origin, array $erlaubt): ?string` – liefert den Origin zurück, wenn er **exakt** in der
         Allowlist steht, sonst `null`. Kein Spiegeln, keine Teilstring-Treffer, kein `null`-Origin.
    starter: |
      <?php
      declare(strict_types=1);

      function pruefeCsrf(?string $sessionToken, ?string $gesendet): bool
      {
          return $sessionToken == $gesendet;
      }

      function corsOrigin(?string $origin, array $erlaubt): ?string
      {
          return $origin;
      }
    tests:
      - name: Gültiges Token
        code: assert_true(pruefeCsrf('a1b2c3d4e5', 'a1b2c3d4e5'));
      - name: Falsches, leeres oder fehlendes Token
        code: |
          assert_same(false, pruefeCsrf('a1b2c3d4e5', 'zzz'));
          assert_same(false, pruefeCsrf('', ''));
          assert_same(false, pruefeCsrf(null, null));
          assert_same(false, pruefeCsrf('a1b2c3d4e5', null));
      - name: Erlaubter Origin
        code: assert_same('https://app.example.com', corsOrigin('https://app.example.com', ['https://app.example.com']));
      - name: Fremde und trickreiche Origins
        code: |
          $liste = ['https://app.example.com'];
          assert_same(null, corsOrigin('https://evil.example', $liste));
          assert_same(null, corsOrigin('https://app.example.com.evil.example', $liste));
          assert_same(null, corsOrigin('null', $liste));
          assert_same(null, corsOrigin(null, $liste));
    hints:
      - "Prüfe zuerst `$sessionToken === null || $sessionToken === ''` und dasselbe für `$gesendet`."
      - "`in_array($origin, $erlaubt, true)` vergleicht exakt – ein Teilstring reicht dann nicht."
    solution: |
      <?php
      declare(strict_types=1);

      function pruefeCsrf(?string $sessionToken, ?string $gesendet): bool
      {
          if ($sessionToken === null || $sessionToken === '' || $gesendet === null || $gesendet === '') {
              return false;
          }

          return hash_equals($sessionToken, $gesendet);
      }

      function corsOrigin(?string $origin, array $erlaubt): ?string
      {
          if ($origin === null || !in_array($origin, $erlaubt, true)) {
              return null;
          }

          return $origin;
      }
---
Ada ist in ihrem Online-Banking eingeloggt. In einem zweiten Tab öffnet sie einen Link aus einem Forum. Die
Seite zeigt Katzenbilder – und schickt im Hintergrund ein unsichtbares Formular an die Bank:
„Überweise 500 € an Konto X“. Der Browser hängt Adas Session-Cookie an. Für die Bank sieht das aus wie eine
echte Anfrage von Ada.

## Wie CSRF funktioniert

Bei [[csrf|Cross-Site Request Forgery]] bringt eine fremde Seite den Browser dazu, eine Anfrage an deine App zu
senden. Weil der Browser zu jeder Anfrage an deine Domain die passenden [[cookie|Cookies]] mitschickt, ist die
Anfrage „eingeloggt“.

![Ablauf eines CSRF-Angriffs: Nutzerin, fremde Seite und deine App](/assets/websicherheit/csrf-ablauf.svg)

1. Ada loggt sich bei deiner App ein und bekommt ein Session-Cookie.
2. Ada besucht eine fremde Seite. Diese enthält ein verstecktes Formular, das sich selbst abschickt.
3. Der Browser sendet das Formular an deine App – **mit** Adas Cookie.
4. Deine App führt die Aktion aus, weil sie nur auf das Cookie schaut.

Die fremde Seite kann die Antwort nicht lesen – das verhindert die [[same-origin-policy|Same-Origin Policy]].
Aber die Aktion ist bereits passiert.

> [!MERKSATZ]
> CSRF betrifft **zustandsändernde** Anfragen mit Cookie-Login: Überweisen, Passwort ändern, Löschen. Darum
> ändert eine GET-Anfrage niemals Daten.

## Abwehr 1: CSRF-Token

Ein [[csrf-token|CSRF-Token]] ist ein zufälliger Wert, den der Server in der Session speichert und in jedes
Formular einbaut. Eine fremde Seite kennt ihn nicht und kann ihn nicht auslesen.

```php
// Beim Anzeigen des Formulars
$_SESSION['csrf'] ??= bin2hex(random_bytes(32));
echo '<input type="hidden" name="_token" value="' . $_SESSION['csrf'] . '">';

// Beim Verarbeiten
$gesendet = $_POST['_token'] ?? '';
if (!is_string($gesendet) || !hash_equals($_SESSION['csrf'] ?? '', $gesendet)) {
    http_response_code(419);
    exit('Sitzung abgelaufen – bitte Formular neu laden.');
}
```

`hash_equals()` vergleicht zeitkonstant und verrät so nicht über die Antwortzeit, wie viele Zeichen schon
stimmen. Laravel baut genau das mit `@csrf` und einer Middleware ein.

## Abwehr 2: SameSite und Origin-Prüfung

Zwei weitere Schichten machen CSRF zusätzlich schwer:

| Maßnahme | Wirkung |
|---|---|
| [[samesite\|SameSite]]`=Lax` | Cookie wird bei Formular-POSTs von fremden Seiten nicht mitgeschickt |
| `SameSite=Strict` | Cookie wird bei keiner Anfrage von fremden Seiten mitgeschickt |
| `Origin`-Header prüfen | Bei POST nennt der Browser den Origin der auslösenden Seite |
| [[fetch-metadata\|Sec-Fetch-Site]] prüfen | Moderne Browser melden `same-origin`, `same-site` oder `cross-site` |

```php
$site = $_SERVER['HTTP_SEC_FETCH_SITE'] ?? null;
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $site === 'cross-site') {
    http_response_code(403);
    exit;
}
```

> [!FEHLER]
> Sich nur auf SameSite verlassen. Ältere Browser, Subdomains unter fremder Kontrolle oder GET-Anfragen, die
> doch etwas ändern, umgehen den Schutz. Das Token bleibt die Hauptabwehr.

## CORS ist kein CSRF-Schutz

[[cors|CORS]] regelt, welche fremden Origins die **Antworten** deiner API im Browser lesen dürfen. Ohne
CORS-Header gilt die Same-Origin Policy – das ist der sichere Standard.

Gefährlich wird es, wenn CORS zu weit geöffnet wird:

| Konfiguration | Folge |
|---|---|
| Origin ungeprüft zurückspiegeln + `Allow-Credentials: true` | Jede Seite liest eingeloggte Antworten |
| `Access-Control-Allow-Origin: null` erlaubt | Sandboxed iframes und lokale Dateien bekommen Zugriff |
| Prüfung per `str_contains($origin, 'example.com')` | `https://example.com.evil.example` passt auch |

```php
$erlaubt = ['https://app.example.com'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? null;

if ($origin !== null && in_array($origin, $erlaubt, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Vary: Origin');
}
```

> [!PRAXIS]
> Single-Page-Apps mit Laravel Sanctum nutzen Cookie-Login und brauchen deshalb CSRF-Schutz **und** eine enge
> CORS-Allowlist. APIs mit Bearer-Token im Header sind von CSRF kaum betroffen, weil der Browser diesen Header
> nicht automatisch anhängt.

## Zusammenfassung

- **CSRF** nutzt aus, dass der Browser Cookies an jede Anfrage zu deiner Domain hängt.
- Hauptabwehr: ein zufälliges **CSRF-Token**, verglichen mit `hash_equals()`.
- **SameSite**-Cookies und eine **Origin-/Sec-Fetch-Site-Prüfung** sind zusätzliche Schichten.
- GET-Anfragen ändern niemals Daten.
- **CORS** öffnet Lesezugriff – nur exakt geprüfte Origins aus einer Allowlist, nie spiegeln.
