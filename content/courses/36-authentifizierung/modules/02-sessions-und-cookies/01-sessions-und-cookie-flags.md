---
title: Sessions und Cookie-Flags
summary: Wie eine Session-Anmeldung abläuft, welche Cookie-Flags sie schützen und wie du Session Hijacking und Session Fixation verhinderst.
duration: 25
sources:
  - title: OWASP Session Management Cheat Sheet
    url: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
  - title: MDN – Set-Cookie
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie
  - title: Laravel 13 – HTTP Session
    url: https://laravel.com/docs/13.x/session
quiz:
  - type: match
    question: Ordne jedem Cookie-Attribut seine Wirkung zu.
    pairs:
      - { left: "HttpOnly", right: "JavaScript kann das Cookie nicht lesen" }
      - { left: "Secure", right: "Cookie geht nur über HTTPS" }
      - { left: "SameSite=Lax", right: "Bei Anfragen von fremden Seiten nur für normale Link-Klicks mitgeschickt" }
      - { left: "Max-Age", right: "Lebensdauer in Sekunden" }
    explanation: >
      HttpOnly bremst XSS, Secure verhindert Mitlesen im Klartext, SameSite bremst CSRF, Max-Age bzw. Expires
      begrenzt die Lebensdauer.
  - type: single
    question: Was ist Session Fixation?
    options:
      - Der Server vergisst Sessions nach einem Neustart.
      - Ein Angreifer schiebt dem Opfer eine ihm bekannte Session-ID unter und übernimmt die Session nach dem Login.
      - Eine Session läuft nie ab.
      - Zwei Nutzer bekommen zufällig dieselbe Session-ID.
    answer: 1
    explanation: >
      Bleibt die Session-ID beim Login gleich, kennt der Angreifer sie bereits. Die Abwehr: beim Login eine
      **neue** Session-ID ausgeben – in Laravel `$request->session()->regenerate()`.
  - type: multiple
    question: Welche Aussagen über Sessions stimmen?
    options:
      - Im Cookie steht nur eine zufällige ID, die eigentlichen Daten liegen auf dem Server.
      - Der Server kann eine Session jederzeit sofort ungültig machen.
      - Wer die Session-ID kennt, ist für den Server angemeldet.
      - Sessions funktionieren nur mit Datenbanken.
    answers: [0, 1, 2]
    explanation: >
      Die Daten liegen im Session-Speicher (Datenbank, Redis, Dateien …). Weil der Server ihn kontrolliert,
      kann er Sessions sofort löschen. Die ID ist dafür so wertvoll wie ein Passwort.
  - type: cloze
    text: "Laravel liest die Lebensdauer einer Session in Minuten aus der Variablen ___ und das SameSite-Attribut aus ___."
    blanks:
      - [SESSION_LIFETIME]
      - [SESSION_SAME_SITE]
    explanation: Beide stehen in `config/session.php` und werden über die `.env` gesteuert.
tasks:
  - id: session-haerten
    type: terminal
    title: Eine verpfuschte Session-Konfiguration härten
    description: |
      In `session-app` liegt eine frische Laravel-Anwendung. Jemand hat in der `.env` gefährliche Werte
      eingetragen. Klicke zuerst auf **Aufgabe vorbereiten** (beim ersten Mal kann das gut eine Minute
      dauern), wechsle mit `cd session-app` hinein und:

      1. Sieh dir die Session-Zeilen an: `grep SESSION .env`.
      2. Setze die Lebensdauer auf **30 Minuten** (`SESSION_LIFETIME`).
      3. Sorge dafür, dass JavaScript das Cookie nicht lesen kann (`SESSION_HTTP_ONLY`).
      4. Setze `SESSION_SAME_SITE` auf `lax`.
      5. Erzwinge, dass das Cookie nur über HTTPS geht: `SESSION_SECURE_COOKIE=true`.
      6. Prüfe das Ergebnis, z. B. mit `php artisan tinker --execute="dump(config('session'));"`.
    workdir: session-app
    setup: |
      # Laravel-13-Basis einmal bauen und zwischenspeichern, dann hierher kopieren
      B="$HOME/.cache/stacklab/laravel13"
      if [ ! -f "$B/.fertig" ]; then
        T="$B.bau.$$"; rm -rf "$T"; mkdir -p "$(dirname "$B")"
        timeout 170 composer create-project laravel/laravel "$T" "^13.0" -n -q --prefer-dist </dev/null
        (cd "$T" && timeout 170 composer require pestphp/pest pestphp/pest-plugin-laravel --dev -W -n -q </dev/null)
        printf '%s\n' '<?php' '' "pest()->extend(Tests\\TestCase::class)->in('Feature');" > "$T/tests/Pest.php"
        touch "$T/.fertig"; rm -rf "$B"; mv "$T" "$B"
      fi
      cp -a "$B/." . && rm -f .fertig
      sed -i 's/^SESSION_LIFETIME=.*/SESSION_LIFETIME=43200/' .env
      printf 'SESSION_HTTP_ONLY=false\nSESSION_SAME_SITE=none\n' >> .env
    checks:
      - type: command
        run: php artisan tinker --execute="echo config('session.lifetime');"
        stdout_matches: "^30\\s*$"
        message: Die Session soll nach 30 Minuten Inaktivität ablaufen. Setze SESSION_LIFETIME=30.
      - type: command
        run: php artisan tinker --execute="var_export(config('session.http_only'));"
        stdout_matches: "^true\\s*$"
        message: Das Cookie ist noch für JavaScript lesbar. Setze SESSION_HTTP_ONLY=true (oder entferne die Zeile).
      - type: command
        run: php artisan tinker --execute="echo config('session.same_site');"
        stdout_matches: "^lax\\s*$"
        message: SameSite steht noch nicht auf lax. Ändere SESSION_SAME_SITE=lax.
      - type: command
        run: php artisan tinker --execute="var_export(config('session.secure'));"
        stdout_matches: "^true\\s*$"
        message: Das Cookie darf noch über unverschlüsseltes HTTP gehen. Ergänze SESSION_SECURE_COOKIE=true.
    hints:
      - "Mit `nano .env` bearbeitest du die Datei direkt. Speichern mit Strg+O, Enter, beenden mit Strg+X."
      - "Für einzelne Zeilen geht auch `sed -i 's/^SESSION_LIFETIME=.*/SESSION_LIFETIME=30/' .env`."
      - "`SESSION_SECURE_COOKIE` steht noch nicht in der Datei – hänge es an: `echo 'SESSION_SECURE_COOKIE=true' >> .env`."
    solution: |
      ```bash
      cd session-app
      sed -i 's/^SESSION_LIFETIME=.*/SESSION_LIFETIME=30/' .env
      sed -i 's/^SESSION_HTTP_ONLY=.*/SESSION_HTTP_ONLY=true/' .env
      sed -i 's/^SESSION_SAME_SITE=.*/SESSION_SAME_SITE=lax/' .env
      echo 'SESSION_SECURE_COOKIE=true' >> .env
      php artisan tinker --execute="dump(config('session'));"
      ```
  - id: session-ablauf
    type: order
    title: Der Weg einer Session-Anmeldung
    description: Bring die Schritte einer klassischen Anmeldung mit Session-Cookie in die richtige Reihenfolge.
    items:
      - Der Browser schickt E-Mail und Passwort per POST an /login.
      - Der Server prüft das Passwort gegen den gespeicherten Hash.
      - Der Server erzeugt eine neue Session-ID und speichert darin die Nutzer-ID.
      - Die Antwort enthält Set-Cookie mit der Session-ID (HttpOnly, Secure, SameSite).
      - Der Browser schickt das Cookie bei jeder weiteren Anfrage automatisch mit.
      - Der Server schlägt die Session nach und weiß, wer anfragt.
---
Du meldest dich bei einem Shop an und klickst dich danach durch zehn Seiten – ohne dein Passwort noch
einmal einzugeben. Dabei hat jede dieser Anfragen den Server ganz neu erreicht. Woher weiß er, dass du
es bist? Die Antwort heißt **Session** – und ihre Sicherheit hängt an ein paar kleinen Cookie-Flags.

## Wie eine Session funktioniert

Eine [[session|Session]] ist ein Datenspeicher auf dem Server, der zu einem Besucher gehört. Der Besucher
bekommt nur eine lange, zufällige [[session-id|Session-ID]] – wie eine Garderobenmarke. Die Jacke (deine
Daten) bleibt an der Garderobe.

![Ablauf einer Session-Anmeldung mit Cookie](/assets/authentifizierung/session-ablauf.svg)

1. Nach dem Login legt der Server eine Session an und speichert darin z. B. `user_id: 42`.
2. Er schickt die Session-ID per [[set-cookie|Set-Cookie]] an den Browser.
3. Der Browser schickt das [[cookie|Cookie]] ab jetzt bei **jeder** Anfrage an diese Domain mit.
4. Der Server schlägt die ID im Session-Speicher nach und weiß, wer anfragt.

In Laravel liegt der Speicher standardmäßig in der Datenbanktabelle `sessions`
(`SESSION_DRIVER=database`); Redis oder Dateien gehen auch.

> [!MERKSATZ]
> Im Cookie steht nur eine zufällige ID. Wer diese ID kennt, **ist** für den Server angemeldet.

## Die Cookie-Flags

Weil die Session-ID so wertvoll ist, schützt du das Cookie mit Attributen im `Set-Cookie`-Header:

```http title="Antwort nach dem Login"
HTTP/1.1 302 Found
Location: /dashboard
Set-Cookie: laravel_session=eyJpdiI6Ik…; Path=/; Max-Age=1800; HttpOnly; Secure; SameSite=Lax
```

| Attribut | Wirkung | Schützt vor |
|---|---|---|
| [[httponly|HttpOnly]] | `document.cookie` sieht das Cookie nicht | Diebstahl per [[xss|XSS]] |
| [[secure-attribut|Secure]] | nur über HTTPS | Mitlesen im WLAN |
| [[samesite|SameSite]] | regelt Mitsenden bei fremden Seiten | [[csrf|CSRF]] |
| `Max-Age` / `Expires` | Lebensdauer | ewig gültige Sessions |
| `Path`, `Domain` | wo das Cookie gilt | zu breite Gültigkeit |

Für `SameSite` gibt es drei Werte:

| Wert | Bei Anfragen von fremden Seiten … |
|---|---|
| `Strict` | nie mitgeschickt – auch nicht beim Klick auf einen Link zu dir |
| `Lax` | nur bei normaler Navigation (Link-Klick, GET), nicht bei POST-Formularen oder `fetch` |
| `None` | immer mitgeschickt – nur zusammen mit `Secure` erlaubt |

`Lax` ist der vernünftige Standard und in Laravel voreingestellt.

## Angriffe auf Sessions

**[[session-hijacking|Session Hijacking]]:** Der Angreifer stiehlt die Session-ID, etwa per XSS oder über unverschlüsseltes
WLAN. Abwehr: HttpOnly, Secure, HTTPS überall, kurze Lebensdauer.

**[[session-fixation|Session Fixation]]:** Der Angreifer besorgt sich eine gültige, aber noch anonyme
Session-ID und schiebt sie dem Opfer unter, z. B. über einen präparierten Link. Meldet sich das Opfer
an und die ID bleibt gleich, ist der Angreifer mit angemeldet.

Die Abwehr ist simpel: Beim Login – und bei jeder Rechteänderung – bekommt der Nutzer eine **neue**
Session-ID. Beim Logout wird die Session komplett gelöscht.

```php title="Laravel"
$request->session()->regenerate();      // nach dem Login: neue ID, neues CSRF-Token
$request->session()->invalidate();      // beim Logout: Session-Daten löschen, neue ID
$request->session()->regenerateToken(); // beim Logout: neues CSRF-Token
```

> [!FEHLER]
> „Abmelden“ löscht nur das Cookie im Browser, die Session auf dem Server lebt weiter. Wer die ID
> vorher kopiert hat, bleibt angemeldet. Beim Logout muss der **Server** die Session ungültig machen.

## Sessions in Laravel einstellen

Alle Einstellungen stehen in `config/session.php` und werden über die `.env` gesteuert:

| `.env`-Variable | Bedeutung | Standard |
|---|---|---|
| `SESSION_DRIVER` | Speicherort | `database` |
| `SESSION_LIFETIME` | Minuten Inaktivität bis zum Ablauf | `120` |
| `SESSION_EXPIRE_ON_CLOSE` | beim Schließen des Browsers beenden | `false` |
| `SESSION_SECURE_COOKIE` | Secure-Flag | leer (aus) |
| `SESSION_HTTP_ONLY` | HttpOnly-Flag | `true` |
| `SESSION_SAME_SITE` | SameSite-Wert | `lax` |
| `SESSION_DOMAIN` | Domain des Cookies | `null` (nur die aktuelle) |

Mit `php artisan tinker --execute="dump(config('session'));"` siehst du, was tatsächlich gilt.

> [!PRAXIS]
> In Produktion setzt man `SESSION_SECURE_COOKIE=true`, weil dort ausschließlich HTTPS läuft. Lokal
> über `http://localhost` würde der Browser ein Secure-Cookie nicht zurückschicken – darum ist es dort
> meist aus. Für Bank- oder Admin-Oberflächen wählt man zusätzlich kurze Lebensdauern von 15–30 Minuten.

## Zusammenfassung

- Eine Session speichert Daten auf dem Server, der Browser trägt nur eine zufällige Session-ID im Cookie.
- `HttpOnly`, `Secure` und `SameSite=Lax` schützen das Cookie vor XSS, Mitlesen und CSRF.
- Session Hijacking stiehlt die ID, Session Fixation schiebt eine bekannte ID unter.
- Nach dem Login `regenerate()`, beim Logout `invalidate()` und `regenerateToken()`.
- In Laravel steuerst du alles über `SESSION_*`-Variablen in der `.env`.
