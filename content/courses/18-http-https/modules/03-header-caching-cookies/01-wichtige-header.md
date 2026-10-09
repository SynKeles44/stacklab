---
title: Die wichtigsten Header – Formate, Anmeldung und CORS
summary: Content-Type und Accept verhandeln das Format, Authorization meldet dich an, und CORS-Header entscheiden, welche fremden Websites mitlesen dürfen.
duration: 25
sources:
  - title: MDN – HTTP headers
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers
  - title: MDN – Content negotiation
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Content_negotiation
  - title: MDN – HTTP authentication
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Authentication
  - title: MDN – Cross-Origin Resource Sharing (CORS)
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS
  - title: MDN – Same-origin policy
    url: https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy
quiz:
  - type: single
    question: "Ein Client schickt `Accept: application/json`. Was sagt er damit?"
    options:
      - Mein Body ist JSON.
      - Ich hätte die Antwort gern als JSON.
      - Ich akzeptiere nur Anfragen mit JSON.
      - Der Server soll das JSON prüfen.
    answer: 1
    explanation: "`Accept` beschreibt den Wunsch für die **Antwort**. Das Format des eigenen Bodys nennt `Content-Type`."
  - type: multiple
    question: "Welche Aussagen über `Authorization: Basic YWRhOmdlaGVpbQ==` stimmen?"
    options:
      - Der Wert ist Base64 – jeder kann ihn sofort zurückverwandeln.
      - Basic Auth ist nur über HTTPS vertretbar.
      - Der Wert ist sicher verschlüsselt.
      - Nach dem Wort Basic folgen Benutzername und Passwort, getrennt durch einen Doppelpunkt, Base64-kodiert.
    answers: [0, 1, 3]
    explanation: Base64 ist eine Kodierung, keine Verschlüsselung. `YWRhOmdlaGVpbQ==` bedeutet `ada:geheim`.
  - type: match
    question: Gehören diese Adressen zum selben Origin wie `https://app.example.com`?
    pairs:
      - { left: "https://app.example.com/profil", right: "gleicher Origin" }
      - { left: "http://app.example.com", right: "anderes Schema" }
      - { left: "https://api.example.com", right: "anderer Host" }
      - { left: "https://app.example.com:8443", right: "anderer Port" }
    explanation: Ein Origin besteht aus Schema, Host und Port. Der Pfad spielt keine Rolle.
  - type: find-bug
    question: Das Frontend auf https://app.example.com ruft die API auf https://api.example.com mit fetch auf. Der Browser blockiert die Antwort. Welche Zeile der API-Antwort ist schuld?
    language: http
    code: |
      HTTP/1.1 200 OK
      Content-Type: application/json
      Access-Control-Allow-Origin: https://api.example.com

      {"notizen": []}
    bug_line: 3
    explanation: >
      `Access-Control-Allow-Origin` muss den Origin der **anfragenden Seite** nennen – also
      `https://app.example.com`, nicht den der API selbst.
  - type: cloze
    text: "Fehlt eine gültige Anmeldung, antwortet der Server mit Status ___ und nennt im Header ___ das erwartete Verfahren."
    blanks:
      - ["401"]
      - [WWW-Authenticate]
    explanation: "Beispiel: `401 Unauthorized` mit `WWW-Authenticate: Bearer`."
tasks:
  - id: profil-mit-token
    type: request
    title: Hol dein Profil mit Token
    description: |
      Die API unter `https://api.example.com` liefert dein Profil unter `/ich`. Sie verlangt einen
      Bearer-Token und kann die Antwort als JSON oder XML liefern.

      Baue die Anfrage so, dass du

      - nur **liest**,
      - dich mit dem Token `<dein-token>` anmeldest (Schema `Bearer`) und
      - die Antwort ausdrücklich als **JSON** anforderst.
    base_url: https://api.example.com
    expected:
      method: GET
      path: "^/ich/?$"
      headers:
        Authorization: "^Bearer\\s+\\S+"
        Accept: "application/json"
    response:
      status: 200
      body: '{"id": 5, "name": "Ada", "email": "ada@example.com"}'
    hints:
      - Lesen = GET. Der Token kommt in den Header Authorization.
      - "`Authorization: Bearer <dein-token>` und `Accept: application/json`."
    solution: |
      ```http
      GET /ich HTTP/1.1
      Host: api.example.com
      Authorization: Bearer <dein-token>
      Accept: application/json
      ```
  - id: gleicher-origin
    type: code
    language: php
    title: Gleicher Origin oder nicht?
    description: |
      Schreibe eine Funktion `gleicherOrigin(string $a, string $b): bool`, die prüft, ob zwei URLs zum
      selben Origin gehören. Ein Origin besteht aus **Schema, Host und Port**.

      - Fehlt der Port, gilt der Standard-Port: `80` für `http`, `443` für `https`.
      - Schema und Host vergleichst du ohne Rücksicht auf Groß- und Kleinschreibung.
      - Pfad, Query-String und Fragment spielen keine Rolle.

      `parse_url()` zerlegt eine URL in ein Array mit den Schlüsseln `scheme`, `host`, `port` (nur wenn angegeben) usw.
    starter: |
      <?php
      function gleicherOrigin(string $a, string $b): bool
      {
          // Zerlege beide URLs und vergleiche Schema, Host und Port
          return false;
      }
    tests:
      - name: Gleiche Seite mit anderem Pfad
        code: assert_same(true, gleicherOrigin('https://app.example.com/a', 'https://app.example.com/b?x=1'));
      - name: Anderes Schema
        code: assert_same(false, gleicherOrigin('http://app.example.com', 'https://app.example.com'));
      - name: Anderer Host (Subdomain)
        code: assert_same(false, gleicherOrigin('https://app.example.com', 'https://api.example.com'));
      - name: Anderer Port
        code: assert_same(false, gleicherOrigin('https://app.example.com', 'https://app.example.com:8443'));
      - name: Standard-Port ausgeschrieben
        code: assert_same(true, gleicherOrigin('https://app.example.com:443/', 'https://app.example.com'));
      - name: Groß- und Kleinschreibung im Host
        code: assert_same(true, gleicherOrigin('http://Example.COM', 'http://example.com:80/start'));
    hints:
      - "`$teile = parse_url($url);` – dann `$teile['scheme']`, `$teile['host']` und eventuell `$teile['port']`."
      - "Standard-Port: `$teile['port'] ?? ($schema === 'https' ? 443 : 80)`."
      - Baue für jede URL einen String wie `https://app.example.com:443` und vergleiche die beiden.
    solution: |
      <?php
      function origin(string $url): string
      {
          $teile = parse_url($url);
          $schema = strtolower($teile['scheme'] ?? '');
          $host = strtolower($teile['host'] ?? '');
          $port = $teile['port'] ?? ($schema === 'https' ? 443 : 80);

          return "$schema://$host:$port";
      }

      function gleicherOrigin(string $a, string $b): bool
      {
          return origin($a) === origin($b);
      }
---
Eine App lädt Daten, aber der Server liefert HTML statt JSON. Eine andere bekommt 401, obwohl der
Token stimmt. Eine dritte funktioniert mit curl, aber nicht im Browser. Alle drei Rätsel lösen sich,
wenn du die richtigen [[http-header|Header]] kennst. Diese Lektion zeigt die, die dir im Alltag
ständig begegnen.

## Content-Type und Accept: Formate aushandeln

Zwei Header regeln das Format – und werden oft verwechselt. [[content-type|Content-Type]] sagt: „**Mein**
Body hat dieses Format.“ Ihn schickt, wer einen Body sendet. [[accept-header|Accept]] sagt: „**Deine**
Antwort hätte ich gern so.“ Ihn schickt nur der Client.

```http title="Der Client wünscht JSON, Deutsch bevorzugt"
GET /produkte/42 HTTP/1.1
Host: api.example.com
Accept: application/json, text/html;q=0.5
Accept-Language: de, en;q=0.8
```

Die Gewichte `q=` (0 bis 1) ordnen die Wünsche. Der Server wählt das beste Format, das er liefern
kann. Das heißt [[content-negotiation|Content Negotiation]].

| Situation | Antwort des Servers |
|---|---|
| Wunsch erfüllbar | `200` mit passendem `Content-Type` |
| Kein gewünschtes Format möglich | `406 Not Acceptable` |
| Body in einem Format, das er nicht versteht | `415 Unsupported Media Type` |

Liefert ein Server je nach `Accept` Unterschiedliches, setzt er zusätzlich `Vary: Accept`. So wissen
Caches, dass es mehrere Varianten derselben URL gibt.

> [!FEHLER]
> `Content-Type: application/json` in einer GET-Anfrage ohne Body bewirkt nichts. Wer JSON **haben**
> möchte, schreibt `Accept: application/json`.

## Authorization: Wer bist du?

Geschützte Ressourcen verlangen eine Anmeldung. Der Client schickt sie im Header
[[authorization-header|Authorization]] mit – bei **jeder** Anfrage, denn HTTP ist zustandslos.

| Schema | Beispiel | Bedeutung |
|---|---|---|
| Basic | `Basic YWRhOmdlaGVpbQ==` | `benutzer:passwort` in Base64 |
| Bearer | `Bearer <dein-token>` | Ein Token, den du vorher bekommen hast |

Bei [[basic-auth|Basic Authentication]] ist der Wert nur in [[base64|Base64]] umgewandelt – das ist
eine Kodierung, keine Verschlüsselung. `echo YWRhOmdlaGVpbQ== | base64 -d` zeigt sofort `ada:geheim`.
Basic Auth gehört deshalb nur in HTTPS-Verbindungen.

Ein [[bearer-token|Bearer-Token]] ist eine lange Zeichenkette, die die API beim Login ausgibt. Wer sie
„trägt“ (englisch *bearer*), gilt als angemeldet.

```http title="Ohne gültige Anmeldung"
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer
```

> [!MERKSATZ]
> 401 plus `WWW-Authenticate` heißt: „Melde dich an, und zwar so.“ 403 heißt: „Ich kenne dich, aber
> du darfst das nicht.“

## Weitere Header, die du kennen solltest

| Header | Richtung | Wofür |
|---|---|---|
| `Location` | Antwort | Ziel einer Umleitung oder einer neu angelegten Ressource |
| `Allow` | Antwort | Erlaubte Methoden, z. B. bei 405 |
| `Retry-After` | Antwort | Wartezeit bei 429 oder 503 |
| `User-Agent` | Anfrage | Welches Programm fragt |
| `Referer` | Anfrage | Von welcher Seite der Klick kam (ja, mit einem r zu wenig) |
| `Content-Length` | beide | Größe des Bodys in Bytes |

Eigene Header sind erlaubt, etwa `X-Request-Id` zum Verfolgen einer Anfrage durch mehrere Dienste.
Das Präfix `X-` ist veraltet, aber noch weit verbreitet.

Caching-Header und Cookies sind so wichtig, dass sie je eine eigene Lektion bekommen.

## Same-Origin-Policy und CORS

Ein [[web-origin|Origin]] ist die Kombination aus Schema, Host und Port: `https://app.example.com:443`.
Die [[same-origin-policy|Same-Origin-Policy]] des Browsers sagt: JavaScript einer Seite darf Antworten
nur von **demselben** Origin lesen. Sonst könnte jede Website heimlich dein Webmail auslesen, während
du dort eingeloggt bist.

Will eine API fremde Seiten zulassen, erlaubt sie es mit [[cors|CORS]]-Headern:

```http title="Die API erlaubt eine bestimmte Seite"
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://app.example.com
Content-Type: application/json
```

Der Browser schickt bei fremden Anfragen den Header `Origin` mit und prüft die Antwort. Passt
`Access-Control-Allow-Origin` nicht, blockiert er den Zugriff – die Anfrage ist trotzdem beim Server
angekommen.

## Der Preflight-Request

Für „riskantere“ Anfragen fragt der Browser vorher um Erlaubnis. Dieser
[[preflight-request|Preflight-Request]] nutzt `OPTIONS`. Er kommt zum Beispiel bei `PUT` oder `DELETE`,
bei eigenen Headern wie `Authorization` oder bei `Content-Type: application/json`.

```http title="Preflight und Antwort"
OPTIONS /notizen/7 HTTP/1.1
Origin: https://app.example.com
Access-Control-Request-Method: DELETE
Access-Control-Request-Headers: authorization

HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET, POST, DELETE
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Max-Age: 600
```

Erst wenn die Antwort passt, schickt der Browser das eigentliche `DELETE`. `Max-Age` erlaubt ihm, die
Erlaubnis zehn Minuten zu merken.

> [!PRAXIS]
> „Mit curl geht es, im Browser nicht“ ist fast immer CORS. curl prüft keine CORS-Header – das tut nur
> der Browser. CORS ist ein Schutz für Nutzer:innen im Browser, keine Zugangskontrolle für die API.

## Zusammenfassung

- `Content-Type` beschreibt den eigenen Body, `Accept` das gewünschte Antwortformat.
- Content Negotiation wählt das passende Format; `406` und `415` melden Unpassendes.
- `Authorization` trägt die Anmeldung: Basic (nur Base64!) oder Bearer-Token.
- 401 mit `WWW-Authenticate` fordert zur Anmeldung auf.
- Ein Origin = Schema + Host + Port; die Same-Origin-Policy schützt Browser-Nutzer:innen.
- CORS-Header erlauben fremde Origins, ein Preflight mit `OPTIONS` fragt vorher um Erlaubnis.
