---
title: Opake Tokens und JWT
summary: Was ein Token ist, worin sich opake Tokens und JSON Web Tokens unterscheiden und wie du ein JWT im Terminal zerlegst.
duration: 25
sources:
  - title: RFC 7519 – JSON Web Token (JWT)
    url: https://www.rfc-editor.org/rfc/rfc7519
  - title: RFC 7515 – JSON Web Signature (JWS)
    url: https://www.rfc-editor.org/rfc/rfc7515
  - title: OWASP REST Security Cheat Sheet – JWT
    url: https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html
  - title: jq Manual – @base64d
    url: https://jqlang.org/manual/
quiz:
  - type: single
    question: Wer kann den Payload eines signierten JWT lesen?
    options:
      - Nur der Server mit dem geheimen Schlüssel.
      - Jeder, der das Token hat – der Payload ist nur Base64URL-kodiert.
      - Niemand, er ist verschlüsselt.
      - Nur der Browser.
    answer: 1
    explanation: >
      Ein signiertes JWT (JWS) ist **nicht** verschlüsselt. Die Signatur schützt vor Veränderung, nicht vor
      Mitlesen. Darum gehören keine Geheimnisse in den Payload.
  - type: match
    question: Ordne jedem registrierten Claim seine Bedeutung zu.
    pairs:
      - { left: "iss", right: "Wer hat das Token ausgestellt?" }
      - { left: "sub", right: "Um wen geht es (z. B. Nutzer-ID)?" }
      - { left: "aud", right: "Für welchen Empfänger ist es gedacht?" }
      - { left: "exp", right: "Ab wann ist es ungültig (Unix-Zeit)?" }
      - { left: "iat", right: "Wann wurde es ausgestellt?" }
    explanation: Diese Claims sind in RFC 7519 festgelegt. Eigene Claims wie `role` darfst du ergänzen.
  - type: multiple
    question: Welche Aussagen über opake Tokens stimmen?
    options:
      - Der Server muss bei jeder Anfrage in seiner Datenbank nachschlagen.
      - Man kann sie sofort widerrufen, indem man den Datensatz löscht.
      - Sie enthalten die Rechte des Nutzers lesbar im Token.
      - Laravel Sanctum nutzt opake Tokens.
    answers: [0, 1, 3]
    explanation: >
      Ein opakes Token ist nur ein zufälliger Schlüssel ohne Inhalt. Die Bedeutung kennt allein der Server –
      das kostet eine Datenbankabfrage, erlaubt aber sofortigen Widerruf.
  - type: cloze
    text: "Ein JWT besteht aus drei Teilen, getrennt durch Punkte: Header, ___ und Signatur. Die Teile sind ___-kodiert."
    blanks:
      - [Payload, Nutzdaten, Claims]
      - [Base64URL, Base64 URL, base64url]
    explanation: Base64URL ist Base64 mit `-` und `_` statt `+` und `/` und ohne `=` am Ende.
tasks:
  - id: jwt-zerlegen
    type: terminal
    title: Ein JWT im Terminal zerlegen
    description: |
      In `jwt-labor` liegt die Datei `token.txt` mit einem JWT, das ein Autorisierungsserver ausgestellt hat.
      Klicke zuerst auf **Aufgabe vorbereiten** und wechsle mit `cd jwt-labor` hinein.

      1. Sieh dir das Token an: `cat token.txt`. Erkennst du die zwei Punkte?
      2. Dekodiere den **Payload** (den zweiten Teil) und speichere ihn als JSON in `payload.json`.
         Tipp aus der Lektion: `jq -R 'split(".") | .[1] | gsub("-";"+") | gsub("_";"/") | @base64d | fromjson' token.txt > payload.json`
      3. Lies daraus mit `jq` ab, wer das Subjekt (`sub`) und welche Rolle (`role`) es hat.
      4. Wandle die Ablaufzeit `exp` in ein lesbares Datum um und schreibe sie im Format
         `JJJJ-MM-TTThh:mm:ssZ` (UTC) in die Datei `ablauf.txt`, z. B. mit
         `date -u -d @<zahl> +%Y-%m-%dT%H:%M:%SZ`.
    workdir: jwt-labor
    setup: |
      printf '%s\n' 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2F1dGguZXhhbXBsZS5jb20iLCJzdWIiOiI0MiIsIm5hbWUiOiJBZGEgTG92ZWxhY2UiLCJyb2xlIjoiZWRpdG9yIiwiaWF0IjoxNzkxNTQ3MjAwLCJleHAiOjE3OTE1NTA4MDB9.gP6O6RvEWr6zTc_moJLyqh9UI90mih4Kl_JL-N8perI' > token.txt
    checks:
      - type: file_exists
        path: payload.json
        message: Die Datei payload.json fehlt noch. Dekodiere den zweiten Teil des Tokens und leite die Ausgabe in payload.json um.
      - type: command
        run: jq -r '.sub' payload.json
        stdout_equals: "42"
        message: payload.json enthält noch nicht den dekodierten Payload mit "sub":"42". Nimm den zweiten Teil (Index 1) des Tokens.
      - type: command
        run: jq -r '.role' payload.json
        stdout_equals: editor
        message: Im Payload fehlt das Feld role. Hast du den ganzen zweiten Teil dekodiert?
      - type: file_exists
        path: ablauf.txt
        message: Die Datei ablauf.txt fehlt noch.
      - type: file_contains
        path: ablauf.txt
        pattern: "^2026-10-09T13:00:00Z\\s*$"
        message: ablauf.txt soll die Ablaufzeit in UTC im Format 2026-…T…Z enthalten. Rechne den Wert von exp mit date -u -d @<zahl> um.
    hints:
      - "`cut -d. -f2 token.txt` schneidet den Payload heraus. Base64URL nutzt `-` und `_` statt `+` und `/` – das musst du vor dem Dekodieren zurücktauschen."
      - "Mit `jq -r '.exp' payload.json` bekommst du die Unix-Zeit als Zahl."
      - "`date -u -d @$(jq -r '.exp' payload.json) +%Y-%m-%dT%H:%M:%SZ > ablauf.txt`"
    solution: |
      ```bash
      cd jwt-labor
      cat token.txt
      jq -R 'split(".") | .[1] | gsub("-";"+") | gsub("_";"/") | @base64d | fromjson' token.txt > payload.json
      jq -r '.sub, .role' payload.json
      date -u -d @$(jq -r '.exp' payload.json) +%Y-%m-%dT%H:%M:%SZ > ablauf.txt
      cat ablauf.txt
      ```
  - id: opak-oder-jwt
    type: dragdrop
    title: Opakes Token oder JWT?
    description: Ordne jede Eigenschaft dem passenden Token-Typ zu.
    targets:
      - { id: opak, label: Opakes Token }
      - { id: jwt, label: JWT (selbsttragend) }
    items:
      - { label: Server prüft es per Datenbankabfrage, target: opak }
      - { label: Lässt sich sofort widerrufen, target: opak }
      - { label: "Sieht aus wie 7|kq3VbZ… – ohne lesbaren Inhalt", target: opak }
      - { label: Enthält Claims wie sub und exp, target: jwt }
      - { label: Server prüft es nur mit Schlüssel und Uhr, target: jwt }
      - { label: "Bleibt bis exp gültig, auch wenn der Nutzer gesperrt wird", target: jwt }
---
Nach dem Login per Session klebt eine ID in einem Cookie. Eine Smartphone-App oder ein anderer Server hat
aber keinen Browser, der Cookies verwaltet. Er bekommt stattdessen ein **Token** – eine Zeichenkette, die
er bei jeder Anfrage selbst mitschickt. Es gibt zwei grundverschiedene Arten davon, und beide begegnen
dir ständig.

## Was ein Token ist

Ein Token ist ein Nachweis, den der Client im [[authorization-header|Authorization-Header]] mitsendet:

```http title="Anfrage mit Token"
GET /api/notizen HTTP/1.1
Host: api.example.com
Authorization: Bearer 7|kq3VbZ9xYtR2mN8pL0wQ4sE6uH1jC5aD
Accept: application/json
```

„Bearer“ heißt „Überbringer“: Wer das [[bearer-token|Bearer-Token]] vorzeigt, bekommt Zugriff – wie bei
einer Kinokarte ohne Namen. Darum gehören Tokens nur über HTTPS übertragen, nie in URLs und nie in Logs.

Tokens sind praktisch für alles ohne Browser: mobile Apps, Kommandozeilen-Werkzeuge, Integrationen
zwischen Servern. Und sie sind nicht anfällig für [[csrf|CSRF]], weil der Browser sie nicht von selbst
mitschickt.

## Opake Tokens

Ein [[opakes-token|opakes Token]] ist eine lange Zufallszahl ohne Inhalt – undurchsichtig, „opak“. Was
es bedeutet, weiß nur der Server, der es in seiner Datenbank nachschlägt.

| Vorteil | Nachteil |
|---|---|
| Sofort widerrufbar: Datensatz löschen, fertig | Jede Anfrage kostet eine Datenbankabfrage |
| Verrät nichts über Nutzer oder Rechte | Andere Dienste können es nicht selbst prüfen |
| Kurz und einfach | Der Server muss Zustand speichern |

Laravel Sanctum nutzt genau das: Das Token `7|kq3V…` besteht aus der Datensatz-ID und einem zufälligen
Teil. In der Datenbank liegt nur ein SHA-256-[[hash|Hash]] davon – ein Datenbankleck verrät also keine
nutzbaren Tokens.

## JSON Web Tokens

Ein [[jwt|JSON Web Token]] (JWT, gesprochen „Jot“) ist **selbsttragend**: Es enthält die Informationen
selbst und ist digital signiert. Der Server prüft die [[signatur|Signatur]] mit einem Schlüssel und
muss nichts nachschlagen.

![Aufbau eines JSON Web Tokens](/assets/authentifizierung/jwt-aufbau.svg)

| Teil | Inhalt |
|---|---|
| Header | Algorithmus (`alg`) und Typ, z. B. `{"alg":"HS256","typ":"JWT"}` |
| Payload | die [[claim|Claims]], z. B. `sub`, `exp`, `role` |
| Signatur | berechnet aus Header und Payload mit einem Schlüssel |

Alle drei Teile sind [[base64url|Base64URL]]-kodiert: wie [[base64|Base64]], aber mit `-` und `_` statt
`+` und `/` und ohne `=`-Auffüllung, damit das Token gefahrlos in URLs und Headern steht.

> [!MERKSATZ]
> Ein signiertes JWT ist **lesbar für alle**, aber **fälschungssicher**. Die Signatur schützt vor
> Veränderung, nicht vor Neugier.

## Claims lesen

Die wichtigsten registrierten Claims aus RFC 7519:

| Claim | Bedeutung | Beispiel |
|---|---|---|
| `iss` | Aussteller (issuer) | `https://auth.example.com` |
| `sub` | Subjekt, meist die Nutzer-ID | `"42"` |
| `aud` | Empfänger (audience) | `https://api.example.com` |
| `exp` | Ablaufzeit in Unix-Sekunden | `1791550800` |
| `iat` / `nbf` | ausgestellt am / gültig ab | `1791547200` |

Im Terminal zerlegst du ein JWT mit `jq`. Der Ausdruck nimmt den zweiten Teil, tauscht die
URL-Zeichen zurück und dekodiert:

```bash title="Terminal"
jq -R 'split(".") | .[1] | gsub("-";"+") | gsub("_";"/") | @base64d | fromjson' token.txt
date -u -d @1791550800 +%Y-%m-%dT%H:%M:%SZ
```

> [!FEHLER]
> Passwörter, Kontonummern oder interne Notizen im Payload. Jeder, der das Token sieht – auch im
> Browser-Speicher oder in einem Log –, kann sie lesen. Gleiches gilt für Webseiten, die Tokens
> „dekodieren“: Dort Produktions-Tokens einzufügen, gibt sie aus der Hand.

## Welches Token wann?

Der größte Nachteil von JWTs: Sie lassen sich **nicht** einfach widerrufen. Ein gestohlenes JWT bleibt
bis `exp` gültig, auch wenn der Nutzer längst gesperrt ist. Darum gibt man JWTs kurze Laufzeiten
(Minuten) und kombiniert sie mit einem langlebigen, widerrufbaren [[refresh-token|Refresh-Token]].

| Situation | Gute Wahl |
|---|---|
| Eigene API mit eigener Datenbank | opakes Token (z. B. Sanctum) |
| Viele Dienste sollen ein Token unabhängig prüfen | JWT mit kurzer Laufzeit |
| Login über einen fremden Anbieter (OpenID Connect) | ID-Token als JWT |

> [!PRAXIS]
> „Wir nehmen JWT, weil das modern ist“ ist ein häufiger Grund – und selten ein guter. Für eine
> klassische Laravel-App mit eigener Datenbank sind Sessions oder opake Sanctum-Tokens meist einfacher
> und sicherer.

## Zusammenfassung

- Tokens werden im Header `Authorization: Bearer …` mitgeschickt – wer sie hat, hat Zugriff.
- Opake Tokens sind Zufallswerte, die der Server nachschlägt: sofort widerrufbar, aber mit Datenbankabfrage.
- JWTs bestehen aus Header, Payload und Signatur, alles Base64URL-kodiert.
- Der Payload eines JWT ist für jeden lesbar – keine Geheimnisse hineinschreiben.
- JWTs lassen sich schlecht widerrufen: kurze Laufzeit plus Refresh-Token.
