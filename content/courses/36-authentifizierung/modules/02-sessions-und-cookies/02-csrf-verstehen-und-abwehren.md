---
title: CSRF verstehen und abwehren
summary: Wie eine fremde Website Anfragen in deinem Namen auslöst, warum Cookies das möglich machen und wie CSRF-Tokens, SameSite und Sec-Fetch-Site dich schützen.
duration: 20
sources:
  - title: OWASP Cross-Site Request Forgery Prevention Cheat Sheet
    url: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
  - title: Laravel 13 – CSRF Protection
    url: https://laravel.com/docs/13.x/csrf
  - title: MDN – Sec-Fetch-Site
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Fetch-Site
quiz:
  - type: single
    question: Warum funktioniert ein CSRF-Angriff überhaupt?
    options:
      - Weil der Angreifer das Passwort kennt.
      - Weil der Browser Cookies automatisch mitschickt – auch wenn eine fremde Seite die Anfrage auslöst.
      - Weil HTTPS die Anfrage nicht verschlüsselt.
      - Weil der Server die Session-ID im HTML ausgibt.
    answer: 1
    explanation: >
      Der Angreifer sieht weder Passwort noch Cookie. Er bringt nur deinen Browser dazu, eine Anfrage zu
      schicken – und der Browser hängt dein Session-Cookie freundlich an.
  - type: find-bug
    question: In welcher Zeile fehlt der CSRF-Schutz?
    language: html
    code: |
      <form method="POST" action="/konto/loeschen">
          @method('DELETE')
          <input type="password" name="password">
          <button type="submit">Konto löschen</button>
      </form>
    bug_line: 2
    explanation: >
      Direkt nach dem öffnenden Formular-Tag gehört `@csrf`. Ohne das versteckte Feld `_token` lehnt Laravel
      die Anfrage mit Status 419 ab – oder, schlimmer, eine selbst gebaute Prüfung fehlt ganz.
  - type: multiple
    question: Welche Maßnahmen helfen gegen CSRF?
    options:
      - Ein geheimes CSRF-Token in jedem Formular, das der Server prüft
      - Session-Cookies mit SameSite=Lax oder Strict
      - Zustandsändernde Aktionen nie per GET ausführen
      - Ein besonders langes Passwort
    answers: [0, 1, 2]
    explanation: >
      Das Passwort spielt bei CSRF keine Rolle – der Angreifer nutzt eine bereits bestehende Session.
      Token, SameSite und „GET ändert nichts“ greifen zusammen.
  - type: cloze
    text: "Laravel lehnt eine Anfrage mit fehlendem oder falschem CSRF-Token mit dem Statuscode ___ ab. Das versteckte Formularfeld heißt ___."
    blanks:
      - ["419"]
      - [_token]
    explanation: 419 („Page Expired“) ist ein Laravel-eigener Code für eine ungültige CSRF-Prüfung.
tasks:
  - id: csrf-angriff
    type: steps
    title: Ein CSRF-Angriff in Zeitlupe
    description: Verfolge einen Angriff Schritt für Schritt und überlege, was als Nächstes passiert.
    steps:
      - situation: >
          Ada ist im Shop `shop.example.com` angemeldet. Ihr Session-Cookie hat **kein** SameSite-Attribut
          (ein sehr alter Browser behandelt das wie `None`). Dann öffnet sie eine Seite auf `boese.example.net`.
        question: "Die böse Seite enthält ein verstecktes Formular `POST https://shop.example.com/profil/email` und schickt es per JavaScript ab. Was passiert?"
        options:
          - Der Browser blockiert die Anfrage, weil sie von einer anderen Domain kommt.
          - Der Browser schickt die Anfrage samt Adas Session-Cookie – der Shop hält sie für echt.
          - Die böse Seite kann Adas Cookie auslesen.
        answer: 1
        explanation: >
          Formulare dürfen an fremde Domains gehen, und ohne SameSite hängt der Browser das Cookie an. Lesen
          kann die böse Seite das Cookie trotzdem nicht – sie muss es auch gar nicht.
      - situation: Der Shop verlangt jetzt in jedem Formular ein CSRF-Token, das in Adas Session gespeichert ist.
        question: Kann die böse Seite das richtige Token mitschicken?
        options:
          - Ja, sie liest es aus dem Cookie.
          - Nein – sie kann die Seiten des Shops wegen der Same-Origin-Policy nicht lesen und kennt das Token nicht.
        answer: 1
        explanation: >
          Die Same-Origin-Policy verhindert, dass `boese.example.net` die Antworten von `shop.example.com` liest.
          Ohne Token antwortet der Shop mit 419.
      - situation: Zusätzlich setzt der Shop sein Session-Cookie mit `SameSite=Lax`.
        question: Was passiert jetzt mit dem versteckten POST-Formular?
        options:
          - Das Cookie wird nicht mitgeschickt, Ada ist für diese Anfrage gar nicht angemeldet.
          - Das Cookie wird mitgeschickt, weil es ein Formular ist.
        answer: 0
        explanation: Lax schickt Cookies bei fremd ausgelösten Anfragen nur bei normaler Navigation per GET mit. Zwei Schutzschichten sind besser als eine.
  - id: csrf-header-senden
    type: request
    title: Eine AJAX-Anfrage mit CSRF-Token
    description: |
      Eine Blade-Seite enthält im `<head>` das CSRF-Token:

      ```html
      <meta name="csrf-token" content="Zx8hQ2wT0dVbK1mY7rPq3sLnE6uJ9cAf4gHiOkRe">
      ```

      Dein JavaScript soll die E-Mail-Adresse per `fetch` ändern. Baue die Anfrage:

      - Methode `PUT` auf den Pfad `/profil/email`
      - Header `Content-Type: application/json` und `Accept: application/json`
      - Header `X-CSRF-TOKEN` mit dem Wert aus dem Meta-Tag
      - JSON-Body mit dem Feld `email`, z. B. `{"email": "ada@example.org"}`
    base_url: https://shop.example.com
    expected:
      method: PUT
      path: "^/profil/email$"
      headers:
        Content-Type: "application/json"
        X-CSRF-TOKEN: "^Zx8hQ2wT0dVbK1mY7rPq3sLnE6uJ9cAf4gHiOkRe$"
      body_contains: ['"email"']
    response:
      status: 200
      body: '{"message": "E-Mail-Adresse geändert."}'
    hints:
      - Den Wert des Headers kopierst du exakt aus dem `content`-Attribut des Meta-Tags.
      - Ohne `X-CSRF-TOKEN` würde Laravel mit 419 antworten.
    solution: |
      ```http
      PUT /profil/email HTTP/1.1
      Host: shop.example.com
      Content-Type: application/json
      Accept: application/json
      X-CSRF-TOKEN: Zx8hQ2wT0dVbK1mY7rPq3sLnE6uJ9cAf4gHiOkRe

      {"email": "ada@example.org"}
      ```
---
Du bist bei deinem Online-Shop angemeldet und liest nebenbei einen Blog. Ohne dass du etwas klickst,
ändert sich im Shop deine E-Mail-Adresse – auf die eines Angreifers. Mit „Passwort vergessen“ gehört
ihm jetzt dein Konto. Dieser Angriff heißt **Cross-Site Request Forgery** und nutzt eine Eigenschaft
aus, die Sessions so bequem macht.

## Der Angriff

Bei [[csrf|CSRF]] („Anfragefälschung über Seitengrenzen“) bringt eine fremde Seite deinen Browser dazu,
eine Anfrage an eine andere Anwendung zu schicken:

```html title="Auf boese.example.net"
<form id="f" method="POST" action="https://shop.example.com/profil/email">
    <input type="hidden" name="email" value="angreifer@example.net">
</form>
<script>document.getElementById('f').submit();</script>
```

Der Browser schickt diese Anfrage – und hängt **dein** Session-Cookie für `shop.example.com` an. Der Shop
sieht eine gültige Session und führt die Änderung aus.

Wichtig: Der Angreifer kann dein Cookie nicht lesen und die Antwort nicht sehen. Er kann nur „blind“
etwas auslösen. Für eine Zustandsänderung reicht das völlig.

> [!MERKSATZ]
> CSRF funktioniert, weil der Browser Cookies **automatisch** mitschickt – egal, welche Seite die
> Anfrage ausgelöst hat.

## Abwehr 1: Das CSRF-Token

Die klassische Abwehr ist ein [[csrf-token|CSRF-Token]]: ein zufälliger Wert, der in deiner Session
gespeichert ist und zusätzlich in jedem Formular steht. Der Server vergleicht beide.

```blade title="resources/views/profil.blade.php"
<form method="POST" action="/profil/email">
    @csrf
    @method('PUT')
    <input type="email" name="email">
    <button>Speichern</button>
</form>
```

`@csrf` erzeugt ein verstecktes Feld `<input type="hidden" name="_token" value="…">`. Die böse Seite
kennt diesen Wert nicht: Wegen der [[same-origin-policy|Same-Origin-Policy]] darf sie die Seiten des
Shops nicht lesen. Fehlt das Token oder ist es falsch, antwortet Laravel mit **419**.

Für JavaScript-Anfragen schickst du das Token als Header `X-CSRF-TOKEN` mit, z. B. aus einem Meta-Tag.

> [!FEHLER]
> Zustandsändernde Aktionen über `GET`, etwa `<a href="/konto/loeschen">`. Ein `<img src="…">` auf einer
> fremden Seite löst sie aus, und GET-Anfragen prüft keine CSRF-Middleware. Ändern nur mit POST, PUT,
> PATCH oder DELETE.

## Abwehr 2: SameSite und Sec-Fetch-Site

Moderne Browser bringen zwei weitere Schutzschichten mit:

- **SameSite-Cookies:** Mit `SameSite=Lax` schickt der Browser das Session-Cookie bei fremd ausgelösten
  POST-Anfragen gar nicht mit. Die Anfrage kommt ohne Anmeldung an.
- **`Sec-Fetch-Site`-Header:** Der Browser verrät bei jeder Anfrage über HTTPS, woher sie kommt:
  `same-origin`, `same-site`, `cross-site` oder `none` (direkt eingetippt).

```http title="Anfrage, die von einer fremden Seite ausgelöst wurde"
POST /profil/email HTTP/1.1
Host: shop.example.com
Origin: https://boese.example.net
Sec-Fetch-Site: cross-site
Cookie: laravel_session=…
```

Laravel 13 nutzt beides: Die Middleware `PreventRequestForgery` (in der `web`-Gruppe aktiv) lässt
Anfragen mit `Sec-Fetch-Site: same-origin` direkt durch. Alle anderen müssen ein gültiges CSRF-Token
mitbringen.

## Laravel in der Praxis

| Situation | Was du tust |
|---|---|
| Blade-Formular | `@csrf` direkt nach `<form>` |
| `fetch` oder jQuery | Header `X-CSRF-TOKEN` aus `<meta name="csrf-token">` |
| Axios, Angular | lesen das Cookie `XSRF-TOKEN` und senden `X-XSRF-TOKEN` automatisch |
| Webhooks fremder Dienste | Route in `routes/api.php` oder per `preventRequestForgery(except: [...])` ausnehmen |
| Tests | Laravel deaktiviert die CSRF-Prüfung in Tests automatisch |

Ausnahmen sind gefährlich: Nimm nur Routen aus, die **keine** Session-Cookies nutzen und sich anders
absichern, etwa über eine Signatur des Webhook-Absenders.

> [!PRAXIS]
> Reine Token-APIs mit `Authorization: Bearer …` sind nicht für CSRF anfällig: Der Browser hängt diesen
> Header nie von selbst an. CSRF ist ein Problem von **Cookie**-Anmeldungen – und genau deshalb wird es
> bei Sanctums SPA-Anmeldung später wieder wichtig.

## Zusammenfassung

- CSRF lässt deinen Browser Anfragen mit deinen Cookies an eine andere Anwendung schicken.
- Ein CSRF-Token in Session und Formular stoppt den Angriff: Die fremde Seite kennt es nicht.
- `SameSite=Lax` und der Header `Sec-Fetch-Site` sind zusätzliche Schutzschichten des Browsers.
- In Laravel: `@csrf` in Formularen, `X-CSRF-TOKEN` bzw. `X-XSRF-TOKEN` bei JavaScript, Status 419 bei Fehlern.
- Zustandsänderungen nie per GET. Token-APIs ohne Cookies sind nicht betroffen.
