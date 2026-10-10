---
title: OAuth 2.0 und OpenID Connect
summary: Wie „Mit … anmelden“ funktioniert – die Rollen von OAuth, der Authorization Code Flow mit PKCE, warum der Implicit Flow tot ist und was OpenID Connect ergänzt.
duration: 25
sources:
  - title: RFC 6749 – The OAuth 2.0 Authorization Framework
    url: https://www.rfc-editor.org/rfc/rfc6749
  - title: RFC 7636 – Proof Key for Code Exchange (PKCE)
    url: https://www.rfc-editor.org/rfc/rfc7636
  - title: RFC 9700 – Best Current Practice for OAuth 2.0 Security
    url: https://www.rfc-editor.org/rfc/rfc9700
  - title: OAuth 2.1 (Internet-Draft)
    url: https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/
  - title: OpenID Connect Core 1.0
    url: https://openid.net/specs/openid-connect-core-1_0.html
quiz:
  - type: match
    question: Ordne jeder OAuth-Rolle die Beschreibung zu.
    pairs:
      - { left: "Resource Owner", right: "Die Person, der die Daten gehören" }
      - { left: "Client", right: "Die App, die Zugriff haben möchte" }
      - { left: "Authorization Server", right: "Meldet die Person an und stellt Tokens aus" }
      - { left: "Resource Server", right: "Die API mit den Daten, die Tokens prüft" }
    explanation: Bei „Mit Konto anmelden“ ist deine App der Client, der Login-Anbieter Authorization Server und seine API der Resource Server.
  - type: single
    question: Wogegen schützt PKCE?
    options:
      - Gegen schwache Passwörter.
      - Dagegen, dass ein abgefangener Autorisierungscode von jemand anderem gegen Tokens eingetauscht wird.
      - Gegen XSS auf der Login-Seite.
      - Gegen abgelaufene Zertifikate.
    answer: 1
    explanation: >
      Nur wer den geheimen code_verifier kennt, kann den Code einlösen. Der Autorisierungsserver hat vorher
      nur dessen Hash (code_challenge) gesehen.
  - type: multiple
    question: Welche Aussagen stimmen?
    options:
      - Der Implicit Flow (Token direkt in der URL) soll nicht mehr verwendet werden.
      - OAuth 2.0 allein sagt dir zuverlässig, wer sich angemeldet hat.
      - OpenID Connect ergänzt OAuth um ein ID-Token mit Infos zur Anmeldung.
      - Der state-Parameter schützt den Rückweg vor CSRF.
    answers: [0, 2, 3]
    explanation: >
      OAuth regelt **Zugriff** (Autorisierung). Wer sich angemeldet hat, liefert erst OpenID Connect mit dem
      ID-Token. Implicit und Password Grant sind nach RFC 9700 und im Entwurf von OAuth 2.1 gestrichen.
  - type: cloze
    text: "Beim Login fragt die App mit dem Parameter ___ nach bestimmten Rechten. Für OpenID Connect muss darin der Wert ___ stehen."
    blanks:
      - [scope]
      - [openid]
    explanation: "Typisch ist `scope=openid email profile`."
tasks:
  - id: code-gegen-token
    type: simulated
    title: Den Autorisierungscode einlösen
    description: |
      Deine App `notizen-app` hat den Login-Server `auth.example.com` mit PKCE aufgerufen. Gemerkt hat sie
      sich vorher:

      - `code_verifier`: `dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk`
      - `state`: `af0ifjsldkj`

      Der Browser kommt zurück auf
      `https://app.example.com/callback?code=SplxlOBeZQQYbYS6WxSbIA&state=af0ifjsldkj`. Der `state` stimmt
      überein – weiter geht's im Terminal deines App-Servers:

      1. Tausche den Code gegen Tokens: ein `curl -X POST` an `https://auth.example.com/token` mit den
         Formularfeldern (`-d`) `grant_type=authorization_code`, `code=…`,
         `redirect_uri=https://app.example.com/callback`, `client_id=notizen-app` und `code_verifier=…`.
      2. Rufe mit dem erhaltenen Access-Token den Endpunkt `https://api.example.com/userinfo` auf:
         `curl https://api.example.com/userinfo -H "Authorization: Bearer <access_token>"`.
    prompt: "app-server:~$"
    steps:
      - expect: "^curl\\b(?=.*-X\\s*POST)(?=.*grant_type=authorization_code)(?=.*code=SplxlOBeZQQYbYS6WxSbIA)(?=.*redirect_uri=https://app\\.example\\.com/callback)(?=.*client_id=notizen-app)(?=.*code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk).*https://auth\\.example\\.com/token"
        output: |
          {
            "access_token": "at_Zt7Kq2vX9pLmN4wR",
            "token_type": "Bearer",
            "expires_in": 600,
            "refresh_token": "rt_8hFqW3nYc0LpA6sD",
            "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleS0xIn0.eyJpc3MiOiJodHRwczovL2F1dGguZXhhbXBsZS5jb20iLCJzdWIiOiI0MiIsImF1ZCI6Im5vdGl6ZW4tYXBwIn0.c2lnbmF0dXItZGVtbw",
            "scope": "openid email profile"
          }
        hint: "curl -X POST https://auth.example.com/token -d grant_type=authorization_code -d code=SplxlOBeZQQYbYS6WxSbIA -d redirect_uri=https://app.example.com/callback -d client_id=notizen-app -d code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
      - expect: "^curl\\b(?=.*Authorization:\\s*Bearer\\s+at_Zt7Kq2vX9pLmN4wR).*https://api\\.example\\.com/userinfo"
        output: |
          {"sub": "42", "email": "ada@example.com", "email_verified": true, "name": "Ada Lovelace"}
        hint: "curl https://api.example.com/userinfo -H \"Authorization: Bearer at_Zt7Kq2vX9pLmN4wR\""
    responses:
      - match: "^curl\\b.*auth\\.example\\.com/token"
        output: |
          {"error": "invalid_grant", "error_description": "Code, redirect_uri oder code_verifier passen nicht."}
      - match: "^curl\\b.*userinfo"
        output: |
          {"error": "invalid_token"}
    hints:
      - Alle Werte stehen in der Beschreibung. Jedes Formularfeld bekommt ein eigenes `-d`.
      - Ohne `code_verifier` lehnt der Server ab – das ist PKCE in Aktion.
    solution: |
      ```bash
      curl -X POST https://auth.example.com/token \
        -d grant_type=authorization_code \
        -d code=SplxlOBeZQQYbYS6WxSbIA \
        -d redirect_uri=https://app.example.com/callback \
        -d client_id=notizen-app \
        -d code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk

      curl https://api.example.com/userinfo -H "Authorization: Bearer at_Zt7Kq2vX9pLmN4wR"
      ```
  - id: code-flow-beschriften
    type: diagram
    title: Den Code Flow beschriften
    description: Beschrifte die vier Beteiligten und die zwei entscheidenden Werte im Authorization Code Flow mit PKCE.
    image: /assets/authentifizierung/oauth-code-flow-leer.svg
    slots:
      - { x: 12.5, y: 8.8, answer: Browser }
      - { x: 37.5, y: 8.8, answer: Deine App (Client) }
      - { x: 62.5, y: 8.8, answer: Autorisierungsserver }
      - { x: 87.5, y: 8.8, answer: API (Ressourcenserver) }
      - { x: 37.5, y: 50.9, answer: Autorisierungscode }
      - { x: 50, y: 68.4, answer: code_verifier }
    distractors: [Session-Cookie, client_secret im Browser]
---
„Mit Google anmelden“, „Mit GitHub anmelden“: Du klickst, landest kurz bei einem anderen Anbieter und
bist zurück – ohne dass die App je dein Passwort gesehen hat. Dahinter stecken zwei Standards:
**OAuth 2.0** regelt, wie eine App Zugriff bekommt, **OpenID Connect** ergänzt, wer sich angemeldet hat.

## Das Problem, das OAuth löst

Früher fragten Apps einfach nach deinem Passwort für den anderen Dienst – und hatten damit vollen
Zugriff auf alles, für immer. [[oauth2|OAuth 2.0]] ersetzt das durch einen Ausweis mit begrenzten
Rechten: ein [[access-token|Access-Token]].

| Rolle | Im Beispiel |
|---|---|
| Resource Owner | du, die Person mit dem Konto |
| Client | deine App `notizen-app` |
| [[authorization-server|Authorization Server]] | der Login-Anbieter `auth.example.com` |
| Resource Server | die API `api.example.com` mit deinen Daten |

Welche Rechte die App will, steht im [[oauth-scope|Scope]], etwa `scope=openid email`. Die App
registriert sich vorher beim Anbieter und bekommt eine [[client-id|Client-ID]] sowie eine erlaubte
[[redirect-uri|Redirect-URI]].

## Der Authorization Code Flow

Der Standardweg für alle Apps heißt [[authorization-code-flow|Authorization Code Flow]]:

![OAuth 2.0 Authorization Code Flow mit PKCE](/assets/authentifizierung/oauth-code-flow.svg)

```http title="Schritt 2–3: Weiterleitung zum Login"
GET /authorize?response_type=code
    &client_id=notizen-app
    &redirect_uri=https://app.example.com/callback
    &scope=openid%20email%20profile
    &state=af0ifjsldkj
    &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
    &code_challenge_method=S256 HTTP/1.1
Host: auth.example.com
```

Nach Login und Zustimmung schickt der Anbieter den Browser mit einem kurzlebigen **Autorisierungscode**
zurück. Den tauscht deine App dann **direkt** beim Anbieter gegen Tokens – auf einem Weg, den der
Browser nie sieht:

```bash title="Schritt 6: Code gegen Token"
curl -X POST https://auth.example.com/token \
  -d grant_type=authorization_code \
  -d code=SplxlOBeZQQYbYS6WxSbIA \
  -d redirect_uri=https://app.example.com/callback \
  -d client_id=notizen-app \
  -d code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
```

> [!MERKSATZ]
> Über den Browser läuft nur ein kurzlebiger Code. Die Tokens holt die App selbst – mit PKCE als Beweis,
> dass sie den Login auch gestartet hat.

## PKCE und state

Ein Autorisierungscode kann abgefangen werden, etwa von einer bösartigen App auf dem Handy, die sich
für dieselbe Redirect-URI registriert. [[pkce|PKCE]] („Pixie“, RFC 7636) macht ihn wertlos:

1. Die App würfelt einen geheimen `code_verifier` (43–128 Zeichen).
2. Sie schickt beim Login nur dessen Hash als `code_challenge`:
   `BASE64URL(SHA-256(code_verifier))`, Methode `S256`.
3. Beim Eintausch muss sie den `code_verifier` selbst vorlegen. Der Server hasht ihn und vergleicht.

Der [[state-parameter|state-Parameter]] schützt zusätzlich den Rückweg: Die App merkt sich einen
Zufallswert in ihrer Session und prüft beim Callback, dass genau dieser zurückkommt. Sonst könnte ein
Angreifer dir per [[csrf|CSRF]] seinen eigenen Code unterschieben.

> [!FEHLER]
> Den **Implicit Flow** (`response_type=token`, Token direkt in der URL) oder den Password Grant (App
> fragt nach dem Passwort) neu einsetzen. RFC 9700 rät von beiden ab, und der Entwurf von OAuth 2.1
> streicht sie. Für alle Apps gilt: Authorization Code mit PKCE.

## OpenID Connect: Wer bist du?

OAuth beantwortet „Was darf die App?“ – nicht „Wer ist das?“. Ein Access-Token kann für die API gedacht
sein und sagt deiner App nichts Verlässliches über die Person. [[openid-connect|OpenID Connect]] (OIDC)
setzt darauf auf:

| Ergänzung | Zweck |
|---|---|
| `scope=openid` | schaltet OIDC ein |
| [[id-token|ID-Token]] | ein JWT für **deine App** mit `iss`, `sub`, `aud`, `exp`, ggf. `email` |
| `/userinfo` | Endpunkt für weitere Profildaten |
| Discovery | `/.well-known/openid-configuration` listet alle Endpunkte und Schlüssel |

Deine App prüft das ID-Token wie in der letzten Lektion: Signatur mit dem öffentlichen Schlüssel des
Anbieters, `iss`, `aud` = deine Client-ID, `exp`. Die stabile Nutzerkennung ist die Kombination aus
`iss` und `sub` – nicht die E-Mail-Adresse, die sich ändern kann.

## Ein Blick auf Laravel und OAuth 2.1

In Laravel nutzt du für „Mit … anmelden“ [Laravel Socialite](https://laravel.com/docs/13.x/socialite);
es erledigt Weiterleitung, state und Code-Tausch. Willst du selbst ein OAuth-Server sein, gibt es
[Laravel Passport](https://laravel.com/docs/13.x/passport).

OAuth 2.1 ist (Stand Oktober 2026) noch ein Internet-Draft. Es fasst die heute empfohlene Praxis
zusammen: PKCE für alle Clients, exakte Redirect-URIs, keine Tokens in URLs.

> [!PRAXIS]
> In Firmen läuft der Login oft über einen zentralen Identitätsanbieter per OIDC ([[single-sign-on|Single Sign-on]]).
> Deine Anwendung prüft dann nur noch ID-Tokens und legt beim ersten Login ein lokales Konto zu
> `iss` + `sub` an.

## Zusammenfassung

- OAuth 2.0 gibt Apps begrenzten Zugriff per Access-Token, ohne dass sie Passwörter sehen.
- Rollen: Resource Owner, Client, Authorization Server, Resource Server.
- Standard für alle Apps: Authorization Code Flow mit PKCE (`code_challenge` und `code_verifier`).
- `state` schützt den Rückweg, exakte Redirect-URIs verhindern umgeleitete Codes.
- Implicit Flow und Password Grant sind veraltet.
- OpenID Connect ergänzt das ID-Token – erst damit weiß deine App, **wer** sich angemeldet hat.
