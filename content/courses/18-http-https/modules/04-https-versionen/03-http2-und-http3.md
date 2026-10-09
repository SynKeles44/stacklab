---
title: HTTP/1.1, HTTP/2 und HTTP/3
summary: Was die neueren HTTP-Versionen anders transportieren – Multiplexing, Header-Komprimierung und QUIC – und wie du siehst, welche Version eine Verbindung nutzt.
duration: 20
sources:
  - title: MDN – Evolution of HTTP
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Evolution_of_HTTP
  - title: RFC 9113 – HTTP/2
    url: https://www.rfc-editor.org/rfc/rfc9113
  - title: RFC 9114 – HTTP/3
    url: https://www.rfc-editor.org/rfc/rfc9114
  - title: RFC 9000 – QUIC
    url: https://www.rfc-editor.org/rfc/rfc9000
  - title: Everything curl – HTTP versions
    url: https://everything.curl.dev/http/versions/index.html
quiz:
  - type: single
    question: Welches Problem von HTTP/1.1 löst HTTP/2 mit Multiplexing?
    options:
      - Dass HTTP/1.1 keine Header kennt
      - Dass über eine Verbindung immer nur eine Anfrage gleichzeitig laufen kann
      - Dass HTTP/1.1 keine Statuscodes hat
      - Dass HTTP/1.1 nicht verschlüsselt werden kann
    answer: 1
    explanation: HTTP/2 teilt Nachrichten in Frames auf und verschachtelt viele Streams in einer einzigen TCP-Verbindung.
  - type: match
    question: Ordne jedem Merkmal die HTTP-Version zu, die es eingeführt hat.
    pairs:
      - { left: "Lesbare Text-Nachrichten", right: "HTTP/1.1" }
      - { left: "Binäre Frames und Header-Komprimierung mit HPACK", right: "HTTP/2" }
      - { left: "Transport über QUIC und UDP", right: "HTTP/3" }
    explanation: Die Bedeutung von Methoden, Headern und Statuscodes ist bei allen gleich – nur der Transport ändert sich.
  - type: multiple
    question: Welche Vorteile bringt QUIC gegenüber TCP + TLS?
    options:
      - Ein verlorenes Paket hält nur seinen eigenen Stream auf, nicht alle.
      - Verbindungs- und TLS-Aufbau sind zusammengelegt und damit schneller.
      - Eine Verbindung überlebt den Wechsel von WLAN zu Mobilfunk.
      - QUIC kommt ohne Verschlüsselung aus und ist deshalb schneller.
    answers: [0, 1, 2]
    explanation: QUIC verschlüsselt immer mit TLS 1.3 – unverschlüsseltes HTTP/3 gibt es nicht.
  - type: cloze
    text: "Welche HTTP-Version genutzt wird, handeln Client und Server im TLS-Handshake per ___ aus. Dass HTTP/3 verfügbar ist, verrät der Header ___."
    blanks:
      - [ALPN]
      - [Alt-Svc]
    explanation: "ALPN-Kennungen sind z. B. `h2` und `http/1.1`. `Alt-Svc: h3=\":443\"` lädt zu HTTP/3 ein."
tasks:
  - id: versionen-zuordnen
    type: dragdrop
    title: Welche Version macht was?
    description: Ordne jede Eigenschaft der HTTP-Version zu, auf die sie zutrifft.
    targets:
      - { id: h1, label: "HTTP/1.1" }
      - { id: h2, label: "HTTP/2" }
      - { id: h3, label: "HTTP/3" }
    items:
      - { label: "Browser öffnen bis zu 6 Verbindungen pro Host", target: h1 }
      - { label: "Nachrichten als lesbarer Text", target: h1 }
      - { label: "Viele Streams über eine TCP-Verbindung", target: h2 }
      - { label: "Header-Komprimierung mit HPACK", target: h2 }
      - { label: "Läuft über UDP", target: h3 }
      - { label: "Verbindung überlebt einen Netzwechsel", target: h3 }
    hints:
      - Nur eine Version verzichtet auf TCP.
  - id: version-pruefen
    type: simulated
    title: Welche HTTP-Version spricht der Server?
    description: |
      Du untersuchst `https://www.example.com/` (hier simuliert).

      1. Hole mit `curl -sI` nur die Header. Welche Version steht in der Statuszeile, und gibt es einen `alt-svc`-Header?
      2. Hol die Header noch einmal und erzwinge dabei mit `--http3` HTTP/3.
      3. Schau dir mit `curl -sv -o /dev/null https://www.example.com/ 2>&1 | grep ALPN` an, wie die Version ausgehandelt wurde.
    prompt: "du@laptop:~$"
    steps:
      - expect: "^curl\\s+-s?I\\s+(-s\\s+)?https://www\\.example\\.com/?\\s*$"
        output: |
          HTTP/2 200
          content-type: text/html; charset=UTF-8
          cache-control: no-cache
          alt-svc: h3=":443"; ma=86400
          strict-transport-security: max-age=31536000
        hint: "curl -sI https://www.example.com/"
      - expect: "^curl\\s+(-s?I\\s+--http3|--http3\\s+-s?I|-s\\s+-I\\s+--http3)\\s+https://www\\.example\\.com/?\\s*$"
        output: |
          HTTP/3 200
          content-type: text/html; charset=UTF-8
          cache-control: no-cache
          alt-svc: h3=":443"; ma=86400
          strict-transport-security: max-age=31536000
        hint: "curl -sI --http3 https://www.example.com/"
      - expect: "^curl\\s+-sv\\s+-o\\s+/dev/null\\s+https://www\\.example\\.com/?\\s+2>&1\\s*\\|\\s*grep\\s+(-i\\s+)?['\"]?[Aa][Ll][Pp][Nn]['\"]?\\s*$"
        output: |
          * ALPN: curl offers h2,http/1.1
          * ALPN: server accepted h2
        hint: "curl -sv -o /dev/null https://www.example.com/ 2>&1 | grep ALPN"
---
Eine moderne Webseite besteht aus Dutzenden Dateien: HTML, Stylesheets, Skripte, Schriften, Bilder.
Mit HTTP/1.1 wird das zur Warteschlange – wie eine Supermarktkasse, an der jede Person einzeln
abkassiert wird. HTTP/2 und HTTP/3 öffnen sozusagen alle Kassen gleichzeitig. Die gute Nachricht:
Alles, was du über Methoden, Header und Statuscodes gelernt hast, bleibt gültig.

## HTTP/1.1 und seine Warteschlange

HTTP/1.1 hält Verbindungen offen und nutzt sie für mehrere Anfragen nacheinander – eine
[[persistente-verbindung|persistente Verbindung]]. Gleichzeitig geht aber nur **eine** Anfrage pro
Verbindung. Hängt eine langsame Antwort, warten alle dahinter. Das nennt man
[[head-of-line-blocking|Head-of-Line-Blocking]].

Browser behelfen sich, indem sie bis zu sechs Verbindungen pro Host öffnen. Früher hat man deshalb
Dateien zusammengefasst oder auf mehrere Subdomains verteilt – alles Notlösungen.

| Merkmal | HTTP/1.1 |
|---|---|
| Format | Text |
| Anfragen pro Verbindung gleichzeitig | 1 |
| Header | Bei jeder Anfrage komplett, unkomprimiert |
| Transport | TCP, optional TLS |

## HTTP/2: viele Streams, eine Verbindung

[[http-2|HTTP/2]] (2015) ändert den Transport, nicht die Bedeutung:

- **Binäre Frames** statt Text. Eine Nachricht wird in kleine Stücke zerlegt.
- **[[multiplexing|Multiplexing]]**: Jede Anfrage bekommt einen eigenen Stream. Frames vieler Streams
  laufen verschachtelt über **eine** TCP-Verbindung.
- **Header-Komprimierung** mit [[hpack|HPACK]]: Wiederholte Header wie `User-Agent` oder `Cookie`
  werden nicht jedes Mal neu übertragen.

![HTTP/1.1, HTTP/2 und HTTP/3 im Schichtenvergleich](/assets/http-https/http-versionen.svg)

In der Praxis sprechen Browser HTTP/2 nur über HTTPS. curl zeigt die Statuszeile dann als `HTTP/2 200`
– ohne Begründungstext, denn den gibt es ab HTTP/2 nicht mehr. Header-Namen schreibt HTTP/2 immer klein.

> [!FEHLER]
> „HTTP/2 kann man nicht mehr lesen, also funktioniert curl -v nicht mehr.“ – Doch. curl und der
> Netzwerk-Tab übersetzen die binären Frames zurück in die bekannte Darstellung.

## Das verbleibende Problem: TCP

HTTP/2 löst die Warteschlange auf HTTP-Ebene. Darunter liegt aber weiter [[tcp|TCP]], und TCP liefert
Daten strikt in Reihenfolge. Geht ein einziges Paket verloren, warten **alle** Streams, bis es neu
übertragen ist – auch die, deren Daten längst da sind. In wackeligen Mobilfunknetzen ist HTTP/2 deshalb
manchmal nicht schneller als HTTP/1.1.

> [!MERKSATZ]
> HTTP/2 beseitigt Head-of-Line-Blocking auf HTTP-Ebene, nicht auf TCP-Ebene. Genau dort setzt HTTP/3 an.

## HTTP/3 und QUIC

[[http-3|HTTP/3]] (2022) läuft über [[quic|QUIC]], ein Protokoll auf Basis von [[udp|UDP]]. QUIC bringt
selbst mit, was sonst TCP und TLS erledigen:

| Eigenschaft | Wirkung |
|---|---|
| Streams im Transport | Verlorenes Paket hält nur seinen Stream auf |
| TLS 1.3 eingebaut | Verbindung und Verschlüsselung in einem Schritt – meist ein Round Trip |
| Verbindungs-IDs | Wechsel von WLAN zu Mobilfunk ohne Neuaufbau |
| Immer verschlüsselt | Es gibt kein unverschlüsseltes HTTP/3 |

Die Header-Komprimierung heißt bei HTTP/3 QPACK und funktioniert ähnlich wie HPACK.

## Wer spricht welche Version?

Client und Server einigen sich im TLS-Handshake per [[alpn|ALPN]]: Der Client bietet z. B. `h2` und
`http/1.1` an, der Server wählt. HTTP/3 kann so nicht ausgehandelt werden, weil es gar nicht über TCP
läuft. Der Server lädt deshalb mit einem Header dazu ein:

```http title="Einladung zu HTTP/3"
alt-svc: h3=":443"; ma=86400
```

Beim nächsten Mal versucht der Browser QUIC über UDP-Port 443 und fällt auf HTTP/2 zurück, wenn eine
Firewall UDP blockiert.

```bash title="Versionen mit curl ausprobieren"
curl -sI https://www.example.com/           # meist HTTP/2
curl -sI --http1.1 https://www.example.com/ # HTTP/1.1 erzwingen
curl -sI --http3 https://www.example.com/   # HTTP/3, falls curl es unterstützt
```

Im Netzwerk-Tab blendest du per Rechtsklick auf die Spaltenköpfe die Spalte „Protocol“ ein: `http/1.1`,
`h2` oder `h3`.

> [!PRAXIS]
> Ein lokaler Entwicklungsserver wie `php -S` spricht nur HTTP/1.1. HTTP/2 und HTTP/3 aktiviert man in
> Produktion am Reverse Proxy oder CDN – die Anwendung dahinter merkt davon nichts.

## Zusammenfassung

- HTTP/1.1: Text, eine Anfrage gleichzeitig pro Verbindung, bis zu sechs Verbindungen pro Host.
- HTTP/2: binäre Frames, Multiplexing vieler Streams über eine TCP-Verbindung, HPACK.
- TCP-Paketverlust bremst bei HTTP/2 weiterhin alle Streams.
- HTTP/3 nutzt QUIC über UDP mit eingebautem TLS 1.3 – unabhängige Streams, schneller Aufbau.
- ALPN handelt h2/http/1.1 aus, `Alt-Svc` lädt zu HTTP/3 ein.
- Methoden, Header und Statuscodes bleiben in allen Versionen gleich.
