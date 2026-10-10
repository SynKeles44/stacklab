---
title: JWT prüfen – und die typischen Fallstricke
summary: Wie ein Server ein JWT Schritt für Schritt prüft, warum „alg none“ und Algorithmus-Verwechslung gefährlich sind und wo Tokens im Browser hingehören.
duration: 25
sources:
  - title: RFC 8725 – JSON Web Token Best Current Practices
    url: https://www.rfc-editor.org/rfc/rfc8725
  - title: RFC 7519 – JSON Web Token (JWT)
    url: https://www.rfc-editor.org/rfc/rfc7519
  - title: OWASP JSON Web Token Cheat Sheet
    url: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html
  - title: PHP-Handbuch – hash_hmac() und hash_equals()
    url: https://www.php.net/manual/de/function.hash-equals.php
quiz:
  - type: single
    question: Ein Token kommt mit dem Header `{"alg":"none"}` und ohne Signatur an. Was tut ein korrekt gebauter Server?
    options:
      - Er akzeptiert es, weil keine Signatur nötig ist.
      - Er lehnt es ab – der Server legt die erlaubten Algorithmen selbst fest und nimmt sie nicht aus dem Token.
      - Er prüft es mit SHA-256.
      - Er fragt beim Aussteller nach.
    answer: 1
    explanation: >
      Der Header stammt vom Angreifer. Der Server hat eine feste Liste erlaubter Algorithmen (z. B. nur `HS256`
      oder nur `RS256`) und lehnt alles andere ab.
  - type: multiple
    question: Was gehört zur Prüfung eines JWT?
    options:
      - Den Algorithmus gegen eine feste Erlaubt-Liste prüfen
      - Die Signatur mit dem richtigen Schlüssel prüfen
      - exp (und ggf. nbf) gegen die aktuelle Zeit prüfen
      - iss und aud mit den erwarteten Werten vergleichen
      - Den Payload mit json_decode lesen und sofort vertrauen
    answers: [0, 1, 2, 3]
    explanation: >
      Erst wenn Algorithmus, Signatur und Claims geprüft sind, darfst du dem Inhalt trauen. Dekodieren allein
      ist keine Prüfung.
  - type: find-bug
    question: Welche Zeile macht die Signaturprüfung angreifbar?
    language: php
    code: |
      [$h, $p, $s] = explode('.', $jwt);
      $header = json_decode(b64url_decode($h), true);
      $erwartet = b64url_encode(hash_hmac('sha256', "$h.$p", $schluessel, true));
      if ($erwartet != $s) {
          return null;
      }
    bug_line: 4
    explanation: >
      Ein normaler Vergleich bricht beim ersten abweichenden Zeichen ab und verrät über die Laufzeit, wie viele
      Zeichen stimmen (Timing-Angriff). Nutze `hash_equals($erwartet, $s)`. Außerdem fehlt die Prüfung des
      Algorithmus aus dem Header.
  - type: single
    question: Wo bewahrt eine Browser-App ein Token am sichersten auf?
    options:
      - In localStorage, weil es dort bequem lesbar ist.
      - Am besten gar nicht – für die eigene SPA ist ein HttpOnly-Session-Cookie sicherer.
      - In der URL, damit Links funktionieren.
      - Im Payload eines anderen JWT.
    answer: 1
    explanation: >
      Alles in localStorage kann jedes eingeschleuste Skript (XSS) auslesen. Für die eigene SPA empfiehlt sich
      ein HttpOnly-Cookie mit Session – genau das macht Laravel Sanctum.
tasks:
  - id: jwt-pruefen
    type: code
    language: php
    title: Ein HS256-JWT sicher prüfen
    description: |
      Schreibe `pruefeJwt(string $jwt, string $schluessel, int $jetzt): ?array`. Die Funktion gibt den
      Payload als Array zurück, wenn das Token gültig ist, sonst `null`.

      Ein Token ist nur gültig, wenn **alle** Bedingungen erfüllt sind:

      1. Es besteht aus genau drei Teilen, getrennt durch Punkte.
      2. Der Header enthält `"alg": "HS256"` – jeder andere Wert (auch `none`) wird abgelehnt.
      3. Die Signatur stimmt: `b64urlEncode(hash_hmac('sha256', "$header.$payload", $schluessel, true))`.
         Vergleiche mit `hash_equals()`.
      4. Der Payload enthält `exp`, und `exp` liegt nach `$jetzt`.

      Die Helfer `b64urlEncode()` und `b64urlDecode()` sind schon da. `$jetzt` übergeben die Tests, damit sie
      nicht von der Uhr abhängen.
    starter: |
      <?php
      declare(strict_types=1);

      function b64urlEncode(string $daten): string
      {
          return rtrim(strtr(base64_encode($daten), '+/', '-_'), '=');
      }

      function b64urlDecode(string $text): string|false
      {
          return base64_decode(strtr($text, '-_', '+/'), true);
      }

      function pruefeJwt(string $jwt, string $schluessel, int $jetzt): ?array
      {
          // Dein Code
          return null;
      }
    tests:
      - name: ein gültiges Token liefert den Payload
        code: |
          $s = 'uebungs-schluessel';
          $h = b64urlEncode('{"alg":"HS256","typ":"JWT"}');
          $p = b64urlEncode('{"sub":"42","exp":2000}');
          $jwt = "$h.$p." . b64urlEncode(hash_hmac('sha256', "$h.$p", $s, true));
          $payload = pruefeJwt($jwt, $s, 1000);
          assert_same('42', $payload['sub'] ?? null);
      - name: ein veränderter Payload wird abgelehnt
        code: |
          $s = 'uebungs-schluessel';
          $h = b64urlEncode('{"alg":"HS256","typ":"JWT"}');
          $p = b64urlEncode('{"sub":"42","exp":2000}');
          $sig = b64urlEncode(hash_hmac('sha256', "$h.$p", $s, true));
          $boese = b64urlEncode('{"sub":"1","exp":2000}');
          assert_same(null, pruefeJwt("$h.$boese.$sig", $s, 1000));
      - name: alg none ohne Signatur wird abgelehnt
        code: |
          $h = b64urlEncode('{"alg":"none","typ":"JWT"}');
          $p = b64urlEncode('{"sub":"42","exp":2000}');
          assert_same(null, pruefeJwt("$h.$p.", 'uebungs-schluessel', 1000));
      - name: ein anderer Algorithmus wird abgelehnt, selbst mit passender Signatur
        code: |
          $s = 'uebungs-schluessel';
          $h = b64urlEncode('{"alg":"HS512","typ":"JWT"}');
          $p = b64urlEncode('{"sub":"42","exp":2000}');
          $jwt = "$h.$p." . b64urlEncode(hash_hmac('sha256', "$h.$p", $s, true));
          assert_same(null, pruefeJwt($jwt, $s, 1000));
      - name: ein falscher Schlüssel wird abgelehnt
        code: |
          $h = b64urlEncode('{"alg":"HS256","typ":"JWT"}');
          $p = b64urlEncode('{"sub":"42","exp":2000}');
          $jwt = "$h.$p." . b64urlEncode(hash_hmac('sha256', "$h.$p", 'anderer-schluessel', true));
          assert_same(null, pruefeJwt($jwt, 'uebungs-schluessel', 1000));
      - name: abgelaufene Tokens und Tokens ohne exp werden abgelehnt
        code: |
          $s = 'uebungs-schluessel';
          $h = b64urlEncode('{"alg":"HS256","typ":"JWT"}');
          $p = b64urlEncode('{"sub":"42","exp":2000}');
          $jwt = "$h.$p." . b64urlEncode(hash_hmac('sha256', "$h.$p", $s, true));
          assert_same(null, pruefeJwt($jwt, $s, 2000));
          $ohne = b64urlEncode('{"sub":"42"}');
          $jwt2 = "$h.$ohne." . b64urlEncode(hash_hmac('sha256', "$h.$ohne", $s, true));
          assert_same(null, pruefeJwt($jwt2, $s, 1000));
      - name: kaputte Tokens werden abgelehnt, ohne Fehler zu werfen
        code: |
          assert_same(null, pruefeJwt('nur.zwei', 'uebungs-schluessel', 1000));
          assert_same(null, pruefeJwt('', 'uebungs-schluessel', 1000));
          assert_same(null, pruefeJwt('a.b.c.d', 'uebungs-schluessel', 1000));
    hints:
      - "`$teile = explode('.', $jwt);` – prüfe dann `count($teile) === 3`."
      - "`json_decode(b64urlDecode($teile[0]) ?: '', true)` liefert den Header als Array oder `null`. Prüfe `($header['alg'] ?? null) === 'HS256'`."
      - "Für die Zeit: `isset($payload['exp']) && is_int($payload['exp']) && $payload['exp'] > $jetzt`."
    solution: |
      <?php
      declare(strict_types=1);

      function b64urlEncode(string $daten): string
      {
          return rtrim(strtr(base64_encode($daten), '+/', '-_'), '=');
      }

      function b64urlDecode(string $text): string|false
      {
          return base64_decode(strtr($text, '-_', '+/'), true);
      }

      function pruefeJwt(string $jwt, string $schluessel, int $jetzt): ?array
      {
          $teile = explode('.', $jwt);
          if (count($teile) !== 3) {
              return null;
          }
          [$h, $p, $s] = $teile;

          $header = json_decode(b64urlDecode($h) ?: '', true);
          if (! is_array($header) || ($header['alg'] ?? null) !== 'HS256') {
              return null;
          }

          $erwartet = b64urlEncode(hash_hmac('sha256', "$h.$p", $schluessel, true));
          if (! hash_equals($erwartet, $s)) {
              return null;
          }

          $payload = json_decode(b64urlDecode($p) ?: '', true);
          if (! is_array($payload) || ! isset($payload['exp']) || ! is_int($payload['exp']) || $payload['exp'] <= $jetzt) {
              return null;
          }

          return $payload;
      }
  - id: jwt-fallen
    type: steps
    title: Drei Fallen beim Umgang mit JWTs
    description: Entscheide in jeder Situation, was richtig ist.
    steps:
      - situation: >
          Eine API prüft JWTs, die ein Login-Server mit `RS256` signiert (privater Schlüssel signiert,
          öffentlicher Schlüssel prüft). Die Bibliothek nimmt den Algorithmus aus dem Token-Header.
          Ein Angreifer schickt ein Token mit `"alg":"HS256"`, signiert mit dem **öffentlichen** Schlüssel als HMAC-Geheimnis.
        question: Was droht?
        options:
          - Nichts, der öffentliche Schlüssel ist ja öffentlich.
          - Die API prüft HMAC mit dem öffentlichen Schlüssel – die Fälschung ist gültig.
        answer: 1
        explanation: >
          Das ist die Algorithmus-Verwechslung. Abhilfe: Der Server legt den erwarteten Algorithmus fest
          (nur RS256) und ignoriert, was im Header steht.
      - situation: Ein Nutzer wird gesperrt. Seine API-Zugriffe laufen über JWTs mit 30 Tagen Laufzeit.
        question: Was ist das Problem?
        options:
          - Keins – das JWT wird sofort ungültig.
          - Das JWT bleibt bis exp gültig, weil der Server es ohne Datenbank prüft.
        answer: 1
        explanation: >
          Selbsttragende Tokens kennen keinen Widerruf. Darum kurze Laufzeiten (z. B. 5–15 Minuten) plus
          Refresh-Token, das der Server widerrufen kann.
      - situation: Ein Entwickler signiert JWTs mit HS256 und dem Schlüssel `secret`.
        question: Ist das in Ordnung?
        options:
          - Ja, der Algorithmus ist sicher.
          - Nein – ein kurzer, erratbarer Schlüssel lässt sich offline per Brute Force finden.
        answer: 1
        explanation: >
          Wer ein einziges Token hat, kann Schlüssel offline durchprobieren. HMAC-Schlüssel müssen lang und
          zufällig sein (mindestens 256 Bit) und gehören in ein Secret, nicht in den Code.
---
Ein Token zu **lesen** ist leicht – das hast du in der letzten Lektion im Terminal gemacht. Ein Token zu
**prüfen** ist die eigentliche Arbeit, und hier passieren die teuersten Fehler. Mehrere bekannte
Sicherheitslücken in JWT-Bibliotheken entstanden, weil sie dem Token mehr vertraut haben als ihrer
eigenen Konfiguration.

## Signaturen: HMAC oder Schlüsselpaar

Der Header nennt den Algorithmus. Zwei Familien sind üblich:

| Algorithmus | Prinzip | Wer kann prüfen? |
|---|---|---|
| `HS256` | [[hmac|HMAC]] mit SHA-256 und **einem** geheimen Schlüssel | nur wer das Geheimnis kennt – und der könnte auch signieren |
| `RS256`, `ES256` | [[asymmetrische-kryptografie|asymmetrisch]]: privater Schlüssel signiert, öffentlicher prüft | jeder mit dem öffentlichen Schlüssel |

HS256 passt, wenn Aussteller und Prüfer derselbe Dienst sind. Sobald fremde Dienste Tokens prüfen
sollen, nimmt man RS256 oder ES256: Login-Anbieter veröffentlichen ihre öffentlichen Schlüssel dafür
als JWKS-Datei.

```php title="So entsteht eine HS256-Signatur"
$daten = "$header.$payload";                       // die ersten zwei Teile, Base64URL
$roh = hash_hmac('sha256', $daten, $schluessel, true);
$signatur = rtrim(strtr(base64_encode($roh), '+/', '-_'), '=');
```

## Die Prüfung Schritt für Schritt

Ein Server, der ein JWT annimmt, geht in fester Reihenfolge vor:

1. **Format:** genau drei Teile, alles gültiges Base64URL und JSON.
2. **Algorithmus:** steht `alg` auf der eigenen Erlaubt-Liste? Der Server **erwartet** einen Algorithmus,
   er übernimmt ihn nicht aus dem Token.
3. **Signatur:** selbst berechnen und mit `hash_equals()` vergleichen.
4. **Zeit:** `exp` muss in der Zukunft liegen, `nbf` (falls vorhanden) in der Vergangenheit.
5. **Aussteller und Empfänger:** `iss` und `aud` müssen genau die erwarteten Werte haben.

Erst danach darfst du `sub`, `role` und Co. glauben.

> [!MERKSATZ]
> Dekodieren ist keine Prüfung. Ein JWT ist erst vertrauenswürdig, wenn Algorithmus, Signatur, Zeit,
> Aussteller und Empfänger geprüft sind.

## Klassische Fallen

| Falle | Was passiert | Abwehr |
|---|---|---|
| `alg: none` | Token ohne Signatur wird akzeptiert | feste Erlaubt-Liste |
| Algorithmus-Verwechslung | RS256-Prüfer akzeptiert HS256 mit öffentlichem Schlüssel als Geheimnis | Algorithmus pro Schlüssel fest vorgeben |
| Schwacher HMAC-Schlüssel | Offline-Brute-Force findet `secret` in Sekunden | ≥ 256 Bit Zufall aus einem Secret-Speicher |
| Vergleich mit `==` | Laufzeit verrät, wie viele Zeichen stimmen ([[timing-angriff|Timing-Angriff]]) | `hash_equals()` |
| Fehlende `aud`-Prüfung | Token für Dienst A funktioniert bei Dienst B | `aud` vergleichen |
| Ewige Laufzeit | gestohlenes Token bleibt gültig | kurze `exp` + Refresh-Token |

> [!FEHLER]
> Eine eigene JWT-Prüfung für Produktion schreiben. In der Übung lernst du, was eine Bibliothek tut –
> im Projekt nimmst du eine etablierte Bibliothek und konfigurierst Algorithmus, Schlüssel, `iss` und
> `aud` ausdrücklich.

## Wohin mit dem Token im Browser?

Tokens in Browser-Apps sind ein Dauerstreitthema. Die Fakten:

| Ort | Risiko |
|---|---|
| `localStorage` / `sessionStorage` | jedes per [[xss|XSS]] eingeschleuste Skript liest das Token |
| JavaScript-Variable | weg beim Neuladen, bei XSS ebenfalls lesbar |
| [[httponly|HttpOnly]]-Cookie | für Skripte unlesbar, braucht aber CSRF-Schutz |

Für die **eigene** SPA auf derselben Hauptdomain ist deshalb ein HttpOnly-Session-Cookie die
empfohlene Wahl – genau das bietet Laravel Sanctum. Tokens im Browser sind vor allem dann nötig, wenn
eine fremde API über OAuth angesprochen wird.

> [!PRAXIS]
> Wenn du in einem Projekt Tokens in `localStorage` findest, ist das nicht automatisch eine Lücke – aber
> es macht jede XSS-Lücke deutlich teurer. Eine strenge Content Security Policy und kurze Laufzeiten
> sind dann Pflicht.

## Zusammenfassung

- HS256 nutzt ein gemeinsames Geheimnis, RS256/ES256 ein Schlüsselpaar mit öffentlichem Prüfschlüssel.
- Prüfreihenfolge: Format, Algorithmus (Erlaubt-Liste), Signatur, `exp`/`nbf`, `iss`/`aud`.
- `alg: none`, Algorithmus-Verwechslung und schwache Schlüssel sind die klassischen Fallen.
- Signaturen immer mit `hash_equals()` vergleichen.
- In Browsern sind HttpOnly-Cookies für die eigene SPA sicherer als `localStorage`.
