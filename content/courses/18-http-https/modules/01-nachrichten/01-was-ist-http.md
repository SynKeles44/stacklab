---
title: Was ist HTTP?
summary: HTTP ist ein Protokoll aus Text – eine Anfrage, eine Antwort, kein Gedächtnis. Du schickst eine Anfrage sogar von Hand.
duration: 20
sources:
  - title: MDN – An overview of HTTP
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview
  - title: RFC 9110 – HTTP Semantics
    url: https://www.rfc-editor.org/rfc/rfc9110
  - title: RFC 9112 – HTTP/1.1
    url: https://www.rfc-editor.org/rfc/rfc9112
  - title: PHP-Handbuch – Eingebauter Webserver
    url: https://www.php.net/manual/de/features.commandline.webserver.php
quiz:
  - type: single
    question: Was bedeutet es, dass HTTP zustandslos ist?
    options:
      - Der Server speichert keine Dateien.
      - Jede Anfrage steht für sich – der Server erinnert sich von sich aus nicht an frühere Anfragen.
      - Die Verbindung wird nach jedem Byte geschlossen.
      - HTTP funktioniert nur ohne Datenbank.
    answer: 1
    explanation: >
      Zustandslos heißt: Jede Anfrage muss alles mitbringen, was der Server zum Antworten braucht.
      Dass du trotzdem eingeloggt bleibst, erledigen Cookies – dazu später mehr.
  - type: multiple
    question: Welche Aussagen über HTTP stimmen?
    options:
      - Bei HTTP fängt immer der Client an, der Server antwortet.
      - HTTP/1.1-Nachrichten sind lesbarer Text.
      - HTTPS ist ein völlig anderes Protokoll mit anderen Methoden und Statuscodes.
      - Ohne Anfrage schickt ein Webserver keine HTTP-Antwort.
    answers: [0, 1, 3]
    explanation: >
      HTTP folgt dem Muster Anfrage → Antwort, und HTTP/1.1 ist reiner Text. HTTPS ist dasselbe HTTP –
      nur in einem verschlüsselten TLS-Tunnel. Methoden, Header und Statuscodes bleiben gleich.
  - type: cloze
    text: Ohne Verschlüsselung läuft HTTP standardmäßig auf Port ___, HTTPS auf Port ___.
    blanks:
      - ["80"]
      - ["443"]
    explanation: 80 ist der Standard-Port für http://, 443 für https://. Steht kein Port in der URL, nimmt der Browser diese.
  - type: match
    question: Ordne jedem Begriff die passende Beschreibung zu.
    pairs:
      - { left: "Client", right: "Stellt die Anfrage, z. B. Browser oder curl" }
      - { left: "Server", right: "Wartet auf Anfragen und beantwortet sie" }
      - { left: "Ressource", right: "Das Ding, das eine URL bezeichnet, z. B. ein Produkt" }
      - { left: "Response", right: "Die Antwort mit Statuscode, Headern und Inhalt" }
    explanation: Ein Client fragt nach einer Ressource, der Server schickt eine Response zurück.
tasks:
  - id: anfrage-ablauf
    type: order
    title: Eine Anfrage von Anfang bis Ende
    description: Bring die Schritte einer einfachen HTTP-Unterhaltung über http:// in die richtige Reihenfolge.
    items:
      - Der Client baut eine TCP-Verbindung zum Server auf.
      - Der Client schickt die Anfragezeile, die Header und eine Leerzeile.
      - Der Server liest die Anfrage und sucht die passende Ressource.
      - Der Server schickt Statuszeile, Header, Leerzeile und Inhalt zurück.
      - Der Client liest die Antwort und zeigt den Inhalt an.
    hints:
      - Ohne Verbindung kann nichts gesendet werden.
      - Erst kommt die komplette Anfrage, dann die komplette Antwort.
  - id: http-von-hand
    type: terminal
    title: Sprich HTTP von Hand
    description: |
      HTTP ist nur Text – das beweist du jetzt. Du schickst eine Anfrage ohne curl und ohne Browser,
      indem du die Zeilen selbst in eine TCP-Verbindung schreibst.

      Im Ordner `von-hand` liegt die Datei `hallo.txt`. Klicke zuerst auf **Aufgabe vorbereiten**.

      1. Starte im Ordner einen Webserver im Hintergrund: `php -S 127.0.0.1:8080 > server.log 2>&1 &` und warte kurz (`sleep 1`).
      2. Öffne mit Bash-Bordmitteln eine TCP-Verbindung: `exec 3<>/dev/tcp/127.0.0.1/8080`
      3. Schreibe die Anfrage hinein – jede Zeile endet mit `\r\n`, danach eine Leerzeile:
         `printf 'GET /hallo.txt HTTP/1.1\r\nHost: 127.0.0.1:8080\r\nConnection: close\r\n\r\n' >&3`
      4. Lies die Antwort und speichere sie: `cat <&3 > antwort.txt`
      5. Schau dir `antwort.txt` an und beende den Server mit `kill %1`.
    workdir: von-hand
    setup: |
      printf 'Hallo vom Server!\n' > hallo.txt
    checks:
      - type: file_exists
        path: antwort.txt
        message: Es gibt noch keine antwort.txt. Lies die Antwort mit `cat <&3 > antwort.txt` aus der Verbindung.
      - type: file_contains
        path: antwort.txt
        pattern: "^HTTP/1\\.1 200 OK"
        message: antwort.txt beginnt nicht mit der Statuszeile `HTTP/1.1 200 OK`. Lief der Server, und hast du `/hallo.txt` angefragt?
      - type: file_contains
        path: antwort.txt
        pattern: "^Content-Type: text/plain"
        message: In antwort.txt fehlt der Header `Content-Type` der Textdatei.
      - type: file_contains
        path: antwort.txt
        pattern: "^Hallo vom Server!"
        message: In antwort.txt fehlt der Inhalt der Datei. Hast du die komplette Antwort gelesen?
    hints:
      - "Ohne Host-Header lehnt ein HTTP/1.1-Server die Anfrage ab – er gehört in jede Anfrage."
      - "`Connection: close` sorgt dafür, dass der Server nach der Antwort auflegt – sonst wartet `cat` ewig (abbrechen mit Strg+C)."
      - "Die Datei 3 ist die offene Verbindung: `>&3` schreibt hinein, `<&3` liest heraus."
    solution: |
      ```bash
      cd von-hand
      php -S 127.0.0.1:8080 > server.log 2>&1 &
      sleep 1
      exec 3<>/dev/tcp/127.0.0.1/8080
      printf 'GET /hallo.txt HTTP/1.1\r\nHost: 127.0.0.1:8080\r\nConnection: close\r\n\r\n' >&3
      cat <&3 > antwort.txt
      cat antwort.txt
      kill %1
      ```
---
Du klickst auf einen Link, und Sekundenbruchteile später steht eine Seite da. Dein Browser hat dafür
einem Server eine kurze Nachricht geschickt, und der Server hat geantwortet. Die Sprache dieser
Unterhaltung heißt [[http|HTTP]]. Wenn du sie lesen kannst, verstehst du, was Browser, Apps und APIs
eigentlich tun – und warum etwas schiefgeht.

## Ein Protokoll aus Text

Ein [[protokoll|Protokoll]] ist eine Absprache: Wer sagt was, in welcher Reihenfolge, in welchem Format?
HTTP steht für *Hypertext Transfer Protocol*. Es regelt, wie ein [[client|Client]] (z. B. ein
[[browser|Browser]] oder [[curl|curl]]) etwas von einem [[server|Server]] haben möchte.

Das Besondere: HTTP/1.1 ist **lesbarer Text**. Eine Anfrage nach einer Datei sieht so aus:

```http title="Eine HTTP-Anfrage"
GET /hallo.txt HTTP/1.1
Host: example.com
Accept: text/plain
```

Die Nachricht reist über eine [[tcp|TCP]]-Verbindung, die vorher aufgebaut wird. TCP sorgt dafür, dass
alle Zeichen vollständig und in der richtigen Reihenfolge ankommen. HTTP kümmert sich nur um den Inhalt.

| Version | Jahr | Besonderheit |
|---|---|---|
| HTTP/1.1 | 1997 | Text, heute noch überall verstanden |
| HTTP/2 | 2015 | Binär, viele Anfragen gleichzeitig über eine Verbindung |
| HTTP/3 | 2022 | Läuft über QUIC statt TCP |

Die Bedeutung (Methoden, Header, Statuscodes) ist in allen Versionen gleich. Deshalb lernst du sie
am lesbaren HTTP/1.1.

## Anfrage und Antwort

HTTP folgt immer demselben Muster: Der Client schickt einen [[request|Request]] (Anfrage), der Server
antwortet mit einer [[response|Response]] (Antwort). Nie umgekehrt – ein Server meldet sich nicht von
sich aus.

```http title="Die passende Antwort"
HTTP/1.1 200 OK
Content-Type: text/plain; charset=UTF-8
Content-Length: 18

Hallo vom Server!
```

Die erste Zeile sagt, ob es geklappt hat: `200 OK`. Darunter folgen Zusatzangaben, die
[[http-header|Header]]. Nach einer Leerzeile kommt der eigentliche Inhalt.

> [!MERKSATZ]
> Eine HTTP-Unterhaltung besteht aus genau einer Anfrage und genau einer Antwort. Eine Webseite mit
> Bildern und Skripten braucht deshalb viele solche Paare.

Öffnest du eine typische Nachrichtenseite, schickt der Browser oft über hundert Anfragen: eine für
das HTML, dann je eine für jedes Bild, jedes Stylesheet und jedes Skript.

## Ressourcen und URLs

Worum der Client bittet, heißt [[ressource|Ressource]]. Das kann eine Datei sein, aber auch ein
Datensatz wie „Produkt 42“ oder „die Liste aller Bestellungen“. Die [[url|URL]] bezeichnet die
Ressource:

```text title="Teile einer URL, die HTTP braucht"
https://api.example.com:443/produkte/42?sprache=de
└─┬─┘   └──────┬──────┘ └┬┘ └────┬────┘ └───┬────┘
Schema       Host      Port    Pfad     Query-String
```

Schema, Host und Port entscheiden, **wohin** die Verbindung geht. Pfad und
[[query-string|Query-String]] landen in der Anfragezeile: `GET /produkte/42?sprache=de HTTP/1.1`.
Der Hostname wandert zusätzlich in den Header `Host`.

Eine Adresse, unter der ein Programm Ressourcen anbietet, nennt man [[endpunkt|Endpunkt]] – etwa
`/produkte` einer [[api|API]].

## Zustandslos – kein Gedächtnis

HTTP ist [[zustandslosigkeit|zustandslos]]: Jede Anfrage steht für sich. Der Server weiß von sich aus
nicht, dass dieselbe Person vor zwei Sekunden schon gefragt hat. Stell dir einen Bäcker vor, der jeden
Kunden zum ersten Mal sieht – wer Stammkunde ist, muss das jedes Mal sagen.

Das hat Vorteile: Jeder Server kann jede Anfrage beantworten, Ausfälle sind leicht zu verkraften, und
man kann Server einfach vervielfachen.

> [!FEHLER]
> „Ich bin doch eingeloggt, also weiß der Server, wer ich bin.“ – Nein. Der Browser schickt bei
> **jeder** Anfrage ein [[cookie|Cookie]] mit. Fehlt es, bist du für den Server ein Unbekannter.

## HTTP und HTTPS

[[https|HTTPS]] ist kein anderes Protokoll, sondern HTTP in einem verschlüsselten Tunnel aus
[[tls|TLS]]. Die Nachrichten sehen innen genau gleich aus.

| | HTTP | HTTPS |
|---|---|---|
| Standard-[[port|Port]] | 80 | 443 |
| Verschlüsselt | nein | ja, mit TLS |
| Server nachgewiesen | nein | ja, mit Zertifikat |

Im Übungs-Terminal startest du gleich einen eigenen Server mit `php -S` – PHPs
[[php-entwicklungsserver|eingebautem Webserver]]. Er spricht nur unverschlüsseltes HTTP und ist für die
Entwicklung gedacht, nicht für echte Websites.

> [!PRAXIS]
> Bei der Fehlersuche an einer API ist der erste Schritt fast immer: die rohe Anfrage und Antwort
> ansehen. Wer HTTP lesen kann, sieht sofort, ob ein Header fehlt oder der Server einen Fehler meldet.

## Zusammenfassung

- HTTP regelt, wie ein Client eine Ressource von einem Server anfragt.
- Es gibt immer ein Paar: eine Anfrage, eine Antwort. Der Client beginnt.
- HTTP/1.1 ist lesbarer Text; HTTP/2 und HTTP/3 transportieren dieselbe Bedeutung anders.
- HTTP ist zustandslos – Cookies helfen, sich zu „erinnern“.
- HTTPS ist HTTP in einem TLS-Tunnel: Port 443 statt 80.
