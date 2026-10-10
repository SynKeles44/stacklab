---
title: Fehlkonfiguration, Fehlerbehandlung und Security-Header
summary: Debug-Ausgaben abschalten, Fehler sicher behandeln und mit wenigen HTTP-Headern dem Browser zusätzliche Schutzregeln mitgeben.
duration: 25
sources:
  - title: OWASP Top 10:2025 – A02 Security Misconfiguration
    url: https://top10.owasp.org/2025/A02_2025-Security_Misconfiguration/
  - title: OWASP Top 10:2025 – A10 Mishandling of Exceptional Conditions
    url: https://top10.owasp.org/2025/A10_2025-Mishandling_of_Exceptional_Conditions/
  - title: OWASP Cheat Sheet – HTTP Headers
    url: https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html
  - title: MDN – X-Content-Type-Options
    url: https://developer.mozilla.org/de/docs/Web/HTTP/Reference/Headers/X-Content-Type-Options
  - title: MDN – Referrer-Policy
    url: https://developer.mozilla.org/de/docs/Web/HTTP/Reference/Headers/Referrer-Policy
  - title: PHP Manual – header_remove
    url: https://www.php.net/manual/de/function.header-remove.php
quiz:
  - type: single
    question: Auf der Live-Seite erscheint bei einem Datenbankfehler die komplette Exception mit SQL-Text und Dateipfad. Was ist das Problem?
    options:
      - Nur ein Schönheitsfehler, Besucher verstehen das ohnehin nicht.
      - Eine Fehlkonfiguration, die Angreifern Aufbau, Pfade und Abfragen der App verrät.
      - Kein Problem, solange HTTPS aktiv ist.
    answer: 1
    explanation: >
      Detaillierte Fehlermeldungen sind eine Landkarte für Angreifer. In Produktion gehören sie ins Log, Besucher
      sehen nur eine allgemeine Meldung.
  - type: match
    question: Ordne jedem Header seine Schutzwirkung zu.
    pairs:
      - { left: "Strict-Transport-Security", right: "Browser nutzt die Domain nur noch per HTTPS" }
      - { left: "X-Content-Type-Options: nosniff", right: "Browser rät den Dateityp nicht selbst" }
      - { left: "Content-Security-Policy: frame-ancestors 'none'", right: "Seite darf nicht in fremde iframes eingebettet werden" }
      - { left: "Referrer-Policy: strict-origin-when-cross-origin", right: "Fremde Seiten sehen nur den Origin, nicht den Pfad" }
    explanation: >
      Jeder Header schaltet eine bestimmte Schutzfunktion des Browsers ein. Zusammen machen sie viele Angriffe
      schwerer, ersetzen aber keinen sicheren Code.
  - type: find-bug
    question: Der Login soll bei jedem Fehler den Zugang verweigern. In welcher Zeile öffnet die Fehlerbehandlung eine Lücke?
    language: php
    code: |
      function darfRein(string $token): bool
      {
          try {
              return pruefeTokenBeimDienst($token);
          } catch (Throwable $e) {
              error_log($e->getMessage());
              return true;
          }
      }
    bug_line: 7
    explanation: >
      Ist der Prüfdienst nicht erreichbar, lässt die Funktion jeden herein („fail open“). Sicher ist `return false;`
      – bei Fehlern wird der Zugriff verweigert („fail secure“).
  - type: cloze
    text: "Mit `header____('X-Powered-By');` entfernst du in PHP den Header, der die PHP-Version verrät."
    blanks:
      - [_remove]
    explanation: "`header_remove()` löscht einen bereits gesetzten Header. Alternativ stellst du in der php.ini `expose_php = Off` ein."
tasks:
  - id: header-setzen
    type: terminal
    title: Security-Header im Front Controller setzen
    description: |
      Im Ordner `header-check` liegt eine Mini-App: `public/index.php` gibt eine Startseite aus. Sie verrät die
      PHP-Version und setzt keinen einzigen Security-Header.

      1. Starte die App testweise: `php -S 127.0.0.1:8080 -t public` und prüfe in einem zweiten Schritt mit
         `curl -sI http://127.0.0.1:8080/` die Header (beende den Server mit `Strg+C`). Tipp: Du kannst auch
         `php -S 127.0.0.1:8080 -t public & sleep 1; curl -sI http://127.0.0.1:8080/; kill %1` in einer Zeile nutzen.
      2. Ergänze **ganz oben** in `public/index.php` (vor jeder Ausgabe):
         - `header_remove('X-Powered-By');`
         - `X-Content-Type-Options: nosniff`
         - `Referrer-Policy: strict-origin-when-cross-origin`
         - `Content-Security-Policy: frame-ancestors 'none'`
      3. Prüfe erneut mit `curl -sI`.

      Bearbeite die Datei mit `nano public/index.php`. Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: header-check
    setup: |
      mkdir -p public
      cat > public/index.php <<'PHP'
      <?php
      declare(strict_types=1);

      echo "<h1>Willkommen im Notizblock</h1>\n";
      PHP
    checks:
      - type: file_exists
        path: public/index.php
        message: public/index.php fehlt. Klicke auf „Aufgabe vorbereiten“.
      - type: command
        run: php -l public/index.php >/dev/null && echo ok
        stdout_equals: ok
        message: public/index.php enthält einen Syntaxfehler. Prüfe Semikolons und Anführungszeichen.
      - type: command
        run: |
          P=$((20000 + RANDOM % 30000)); php -S 127.0.0.1:$P -t public >/dev/null 2>&1 & S=$!; sleep 0.7
          curl -sI "http://127.0.0.1:$P/" | tr -d '\r' | tr 'A-Z' 'a-z' | grep -c '^x-content-type-options: nosniff$'
          kill $S 2>/dev/null
        stdout_equals: "1"
        message: "Die Antwort enthält noch keinen Header X-Content-Type-Options: nosniff."
      - type: command
        run: |
          P=$((20000 + RANDOM % 30000)); php -S 127.0.0.1:$P -t public >/dev/null 2>&1 & S=$!; sleep 0.7
          curl -sI "http://127.0.0.1:$P/" | tr -d '\r' | tr 'A-Z' 'a-z' | grep -c '^referrer-policy: strict-origin-when-cross-origin$'
          kill $S 2>/dev/null
        stdout_equals: "1"
        message: "Die Antwort enthält noch keinen Header Referrer-Policy: strict-origin-when-cross-origin."
      - type: command
        run: |
          P=$((20000 + RANDOM % 30000)); php -S 127.0.0.1:$P -t public >/dev/null 2>&1 & S=$!; sleep 0.7
          curl -sI "http://127.0.0.1:$P/" | tr -d '\r' | grep -ic "^content-security-policy:.*frame-ancestors 'none'"
          kill $S 2>/dev/null
        stdout_equals: "1"
        message: "Die Antwort enthält noch keine Content-Security-Policy mit frame-ancestors 'none'."
      - type: command
        run: |
          P=$((20000 + RANDOM % 30000)); php -S 127.0.0.1:$P -t public >/dev/null 2>&1 & S=$!; sleep 0.7
          curl -sI "http://127.0.0.1:$P/" | tr -d '\r' | grep -ic '^x-powered-by:'
          kill $S 2>/dev/null
        stdout_equals: "0"
        message: Die Antwort verrät noch die PHP-Version im Header X-Powered-By. Nutze header_remove('X-Powered-By').
      - type: command
        run: |
          P=$((20000 + RANDOM % 30000)); php -S 127.0.0.1:$P -t public >/dev/null 2>&1 & S=$!; sleep 0.7
          curl -s "http://127.0.0.1:$P/" | grep -c 'Willkommen im Notizblock'
          kill $S 2>/dev/null
        stdout_equals: "1"
        message: Die Startseite zeigt die Überschrift „Willkommen im Notizblock“ nicht mehr. Lass die Ausgabe stehen.
    hints:
      - "Header müssen vor der ersten Ausgabe gesetzt werden – also direkt unter `declare(strict_types=1);`."
      - "Ein Header pro Aufruf: `header('X-Content-Type-Options: nosniff');`"
      - "Innerhalb eines PHP-Strings in doppelten Anführungszeichen kannst du `'none'` direkt schreiben: `header(\"Content-Security-Policy: frame-ancestors 'none'\");`"
    solution: |
      ```php
      <?php
      declare(strict_types=1);

      header_remove('X-Powered-By');
      header('X-Content-Type-Options: nosniff');
      header('Referrer-Policy: strict-origin-when-cross-origin');
      header("Content-Security-Policy: frame-ancestors 'none'");

      echo "<h1>Willkommen im Notizblock</h1>\n";
      ```

      ```bash
      php -S 127.0.0.1:8080 -t public & sleep 1; curl -sI http://127.0.0.1:8080/; kill %1
      ```
---
Eine Agentur stellt einen neuen Shop online. Der Code ist sauber – aber der Debug-Modus ist noch an, im
Webroot liegt eine `info.php` mit `phpinfo()`, und unter `/.env` lässt sich die Konfigurationsdatei
herunterladen. Kein Programmierfehler, nur eine falsche Einstellung. Genau das meint OWASP mit
**Security Misconfiguration**.

## Typische Fehlkonfigurationen

Eine Fehlkonfiguration ist eine unsichere Einstellung, kein Fehler im Programmcode. Sie entsteht oft beim
Umzug von der Entwicklung in die [[produktionsumgebung|Produktion]].

| Fehlkonfiguration | Folge | Abhilfe |
|---|---|---|
| Debug-Modus an (`APP_DEBUG=true`) | Stacktraces, SQL, Pfade sichtbar | In Produktion abschalten |
| [[display-errors\|display_errors]] an | PHP-Fehler im HTML | `display_errors = Off`, Fehler ins Log |
| `phpinfo()`-Seite im Webroot | Versionen, Pfade, Umgebungsvariablen | Datei löschen |
| `.env` oder `.git` erreichbar | Passwörter, kompletter Quellcode | [[document-root\|Document Root]] auf `public/` |
| Standard-Passwörter | Admin-Zugang für alle | Bei Installation ändern |
| Verzeichnis-Listing an | Alle Dateien eines Ordners sichtbar | Im Webserver abschalten |

> [!MERKSATZ]
> Der Document Root zeigt **nur** auf den Ordner `public/`. Alles andere – Code, `.env`, `vendor/` – liegt
> außerhalb und ist damit nie per URL erreichbar.

## Fehler sicher behandeln

Seit 2025 hat OWASP eine eigene Kategorie dafür: **A10 Mishandling of Exceptional Conditions**. Gemeint sind
zwei Fehlerbilder:

1. **Zu viel verraten**: Die [[exception|Exception]] mit [[stack-trace|Stacktrace]] landet beim Besucher.
2. **Unsicher weitermachen**: Bei einem Fehler wird der Zugriff erlaubt statt verweigert („fail open“).

```php
set_exception_handler(function (Throwable $e): void {
    error_log((string) $e);              // Details ins Log
    http_response_code(500);
    echo 'Es ist ein Fehler aufgetreten.'; // Besucher sieht nur das
});
```

> [!FEHLER]
> `catch (Throwable $e) { return true; }` in einer Berechtigungsprüfung. Fällt ein Dienst aus, kommt plötzlich
> jeder herein. Sicher ist **fail secure**: im Zweifel ablehnen.

## Security-Header: Schutzregeln für den Browser

Ein [[security-header|Security-Header]] ist ein HTTP-Header, mit dem der Server zusätzliche Schutzfunktionen
im Browser einschaltet. Sie kosten eine Zeile und wirken für jede Seite.

| Header | Empfohlener Wert | Schützt vor |
|---|---|---|
| [[hsts\|Strict-Transport-Security]] | `max-age=31536000; includeSubDomains` | Abrutschen auf unverschlüsseltes HTTP |
| [[x-content-type-options\|X-Content-Type-Options]] | `nosniff` | Browser hält Upload-Text für Skript |
| [[content-security-policy\|Content-Security-Policy]] | `frame-ancestors 'none'` (mehr in Modul 2) | [[clickjacking\|Clickjacking]], XSS |
| [[referrer-policy\|Referrer-Policy]] | `strict-origin-when-cross-origin` | Datenlecks über die Referrer-URL |
| [[permissions-policy\|Permissions-Policy]] | `camera=(), microphone=(), geolocation=()` | Missbrauch von Gerätefunktionen |

`X-Frame-Options: DENY` ist der ältere Vorgänger von `frame-ancestors`. Setzt du beide, gewinnt in modernen
Browsern die CSP.

## Header setzen und prüfen

In PHP setzt du Header mit `header()` – **vor** der ersten Ausgabe. Am besten zentral im Front Controller oder in
einer Middleware, damit keine Seite sie vergisst.

```php
<?php
header_remove('X-Powered-By');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header("Content-Security-Policy: frame-ancestors 'none'");
```

Kontrollieren kannst du das Ergebnis mit `curl -I`, das nur die Header anzeigt:

```bash title="Terminal"
curl -sI http://127.0.0.1:8080/
```

```text
HTTP/1.1 200 OK
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: frame-ancestors 'none'
```

> [!PRAXIS]
> In größeren Setups setzt oft der Webserver oder [[reverse-proxy|Reverse Proxy]] die Header für alle Apps
> zentral, bei nginx etwa mit `add_header … always;`. Prüfe trotzdem mit `curl -I`, was wirklich ankommt.

## Zusammenfassung

- **Fehlkonfiguration** ist eine unsichere Einstellung: Debug-Modus, `phpinfo()`, erreichbare `.env`, Standard-Passwörter.
- Der Document Root zeigt nur auf `public/`.
- Fehler: Details ins Log, Besucher sehen eine neutrale Meldung, im Zweifel **fail secure**.
- **Security-Header** wie `nosniff`, `Referrer-Policy`, HSTS und CSP schalten Browser-Schutz ein.
- Header setzt du zentral vor jeder Ausgabe und prüfst sie mit `curl -I`.
