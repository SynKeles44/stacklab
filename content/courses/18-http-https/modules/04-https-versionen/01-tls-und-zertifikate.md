---
title: TLS, Zertifikate und die Vertrauenskette
summary: Was in einem Zertifikat steht, wie Browser über die Zertifikatskette prüfen, wem sie vertrauen, und was im TLS-1.3-Handshake passiert.
duration: 25
sources:
  - title: MDN – Transport Layer Security
    url: https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Transport_Layer_Security
  - title: RFC 8446 – TLS 1.3
    url: https://www.rfc-editor.org/rfc/rfc8446
  - title: Let's Encrypt – Chain of Trust
    url: https://letsencrypt.org/certificates/
  - title: OpenSSL – openssl-s_client
    url: https://docs.openssl.org/3.5/man1/openssl-s_client/
  - title: OpenSSL – openssl-verify
    url: https://docs.openssl.org/3.5/man1/openssl-verify/
quiz:
  - type: multiple
    question: Was prüft der Browser, bevor er einem Server-Zertifikat vertraut?
    options:
      - Die Kette führt zu einem Root-Zertifikat in seinem Vertrauensspeicher.
      - Jede Signatur in der Kette ist gültig.
      - Das Zertifikat ist zeitlich gültig.
      - Der aufgerufene Hostname steht im Zertifikat (Subject Alternative Name).
      - Die Website hat ein Impressum.
    answers: [0, 1, 2, 3]
    explanation: Kette, Signaturen, Zeitraum und Name – fehlt eines davon, zeigt der Browser eine Warnung.
  - type: single
    question: Welches Zertifikat schickt der Server im Handshake normalerweise NICHT mit?
    options: [Das Server-Zertifikat, Das Zwischenzertifikat, Das Root-Zertifikat]
    answer: 2
    explanation: Das Root-Zertifikat hat der Client schon in seinem Vertrauensspeicher. Mitschicken bringt nichts – vertraut wird nur der eigenen Kopie.
  - type: match
    question: Ordne jedem Begriff zu, was er im TLS-Zusammenhang leistet.
    pairs:
      - { left: "Asymmetrische Kryptografie", right: "Signaturen prüfen und den Schlüssel sicher aushandeln" }
      - { left: "Symmetrische Verschlüsselung", right: "Die eigentlichen Daten schnell verschlüsseln" }
      - { left: "SNI", right: "Dem Server schon im ClientHello sagen, welcher Hostname gemeint ist" }
      - { left: "Zertifizierungsstelle", right: "Bestätigt mit ihrer Signatur, wem ein Schlüssel gehört" }
    explanation: TLS kombiniert beides – asymmetrisch zum Aushandeln und Beweisen, symmetrisch für die Daten.
  - type: cloze
    text: "Mit TLS 1.3 braucht der Handshake nur ___ Hin-und-zurück (Round Trip), bevor verschlüsselte HTTP-Daten fließen. Der Hostname steht im Zertifikat im Feld ___."
    blanks:
      - ["1", "eine", "einen", "ein"]
      - [Subject Alternative Name, SAN, subjectAltName]
    explanation: TLS 1.2 brauchte zwei Round Trips. Den Hostnamen prüfen Browser heute nur noch im SAN, nicht im Common Name.
tasks:
  - id: kette-beschriften
    type: diagram
    title: Beschrifte die Zertifikatskette
    description: Ziehe die Begriffe an die richtigen Stellen der Kette.
    image: /assets/http-https/zertifikatskette-leer.svg
    slots:
      - { x: 50, y: 18.1, answer: Root-Zertifikat }
      - { x: 50, y: 49, answer: Zwischenzertifikat }
      - { x: 50, y: 80, answer: Server-Zertifikat }
      - { x: 85.6, y: 17.1, answer: Vertrauensspeicher }
    distractors: [Session-ID, Cookie-Jar]
    hints:
      - Das oberste Zertifikat hat sich selbst unterschrieben.
      - Das unterste nennt den Hostnamen der Website.
  - id: kette-pruefen
    type: terminal
    title: Lies und prüfe eine Zertifikatskette
    description: |
      Im Ordner `kette` liegen drei Zertifikate einer Beispiel-Website: `root.pem` (Root-CA),
      `zwischen.pem` (Zwischen-CA) und `server.pem` (für `shop.example.com`). Alle sind lokal erzeugt.

      Klicke zuerst auf **Aufgabe vorbereiten** (das Erzeugen dauert ein paar Sekunden).

      1. Lies das Server-Zertifikat: `openssl x509 -in server.pem -noout -subject -issuer -dates -ext subjectAltName`
      2. Lege `antworten.txt` mit zwei Zeilen an:
         - `aussteller=` gefolgt vom Common Name (CN) des Ausstellers von `server.pem`
         - `namen=` gefolgt von allen DNS-Namen aus dem Subject Alternative Name, durch Komma getrennt (ohne `DNS:`)
      3. Prüfe die Kette **nur** mit der Root-CA und speichere die Ausgabe samt Fehlermeldung:
         `openssl verify -CAfile root.pem server.pem > verify-ohne.txt 2>&1`
      4. Prüfe noch einmal und gib das Zwischenzertifikat als nicht vertrauenswürdigen Zwischenschritt mit:
         `openssl verify -CAfile root.pem -untrusted zwischen.pem server.pem > verify-mit.txt 2>&1`
    workdir: kette
    setup: |
      openssl req -x509 -newkey rsa:2048 -nodes -keyout root.key -out root.pem -days 3650 -subj "/O=Beispiel Trust/CN=Beispiel Root CA" 2>/dev/null
      openssl req -newkey rsa:2048 -nodes -keyout zwischen.key -out zwischen.csr -subj "/O=Beispiel Trust/CN=Beispiel TLS CA 1" 2>/dev/null
      printf 'basicConstraints=critical,CA:TRUE,pathlen:0\nkeyUsage=critical,keyCertSign,cRLSign\n' > ca.ext
      openssl x509 -req -in zwischen.csr -CA root.pem -CAkey root.key -CAcreateserial -out zwischen.pem -days 1825 -extfile ca.ext 2>/dev/null
      openssl req -newkey rsa:2048 -nodes -keyout server.key -out server.csr -subj "/CN=shop.example.com" 2>/dev/null
      printf 'subjectAltName=DNS:shop.example.com,DNS:www.shop.example.com\nbasicConstraints=CA:FALSE\nextendedKeyUsage=serverAuth\n' > server.ext
      openssl x509 -req -in server.csr -CA zwischen.pem -CAkey zwischen.key -CAcreateserial -out server.pem -days 90 -extfile server.ext 2>/dev/null
      rm -f ./*.csr ./*.ext ./*.srl ./*.key
    checks:
      - type: file_contains
        path: antworten.txt
        pattern: "^aussteller=\\s*Beispiel TLS CA 1\\s*$"
        message: In antworten.txt fehlt die Zeile aussteller=… mit dem CN des Ausstellers. Schau in die Zeile issuer der openssl-Ausgabe.
      - type: file_contains
        path: antworten.txt
        pattern: "^namen=\\s*(shop\\.example\\.com,\\s*www\\.shop\\.example\\.com|www\\.shop\\.example\\.com,\\s*shop\\.example\\.com)\\s*$"
        message: "In antworten.txt fehlt die Zeile namen=… mit beiden DNS-Namen aus dem Subject Alternative Name, z. B. namen=a.example.com,b.example.com."
      - type: file_contains
        path: verify-ohne.txt
        pattern: "unable to get local issuer certificate"
        message: verify-ohne.txt soll die Fehlermeldung der Prüfung ohne Zwischenzertifikat enthalten. Vergiss `2>&1` nicht.
      - type: file_contains
        path: verify-mit.txt
        pattern: "^server\\.pem: OK$"
        message: "verify-mit.txt soll „server.pem: OK“ enthalten. Gib das Zwischenzertifikat mit -untrusted zwischen.pem an."
    hints:
      - "Der Aussteller steht hinter `issuer=` – nimm nur den Teil nach `CN=`."
      - "Die DNS-Namen stehen unter `X509v3 Subject Alternative Name`."
      - "`printf 'aussteller=Beispiel TLS CA 1\\nnamen=shop.example.com,www.shop.example.com\\n' > antworten.txt`"
    solution: |
      ```bash
      cd kette
      openssl x509 -in server.pem -noout -subject -issuer -dates -ext subjectAltName
      printf 'aussteller=Beispiel TLS CA 1\nnamen=shop.example.com,www.shop.example.com\n' > antworten.txt
      openssl verify -CAfile root.pem server.pem > verify-ohne.txt 2>&1
      openssl verify -CAfile root.pem -untrusted zwischen.pem server.pem > verify-mit.txt 2>&1
      cat verify-ohne.txt verify-mit.txt
      ```
  - id: s-client
    type: simulated
    title: Ein echtes TLS-Zertifikat untersuchen
    description: |
      Im Übungs-Terminal sind fremde Server nicht erreichbar – deshalb simulieren wir hier, was du auf
      deinem eigenen Rechner sehen würdest.

      1. Baue mit `openssl s_client` eine TLS-Verbindung zu `shop.example.com` auf Port 443 auf und gib
         dabei mit `-servername` den Hostnamen für SNI an. Hänge `</dev/null` an, damit der Befehl sofort endet.
      2. Schicke die Ausgabe von `s_client` (Fehler mit `2>/dev/null` ausblenden) per Pipe an
         `openssl x509 -noout -issuer -dates`, um Aussteller und Laufzeit zu sehen.
    prompt: "du@laptop:~$"
    steps:
      - expect: "^openssl\\s+s_client\\s+(-connect\\s+shop\\.example\\.com:443\\s+-servername\\s+shop\\.example\\.com|-servername\\s+shop\\.example\\.com\\s+-connect\\s+shop\\.example\\.com:443)\\s*(<\\s*/dev/null)?\\s*$"
        output: |
          Connecting to 203.0.113.25
          CONNECTED(00000003)
          depth=2 O=Beispiel Trust, CN=Beispiel Root CA
          verify return:1
          depth=1 O=Beispiel Trust, CN=Beispiel TLS CA 1
          verify return:1
          depth=0 CN=shop.example.com
          verify return:1
          ---
          Certificate chain
           0 s:CN=shop.example.com
             i:O=Beispiel Trust, CN=Beispiel TLS CA 1
             a:PKEY: EC, (prime256v1); sigalg: ecdsa-with-SHA256
             v:NotBefore: Sep  1 08:12:40 2026 GMT; NotAfter: Nov 30 08:12:39 2026 GMT
           1 s:O=Beispiel Trust, CN=Beispiel TLS CA 1
             i:O=Beispiel Trust, CN=Beispiel Root CA
          ---
          SSL handshake has read 2817 bytes and written 1598 bytes
          Verification: OK
          ---
          New, TLSv1.3, Cipher is TLS_AES_256_GCM_SHA384
          Protocol: TLSv1.3
          Server public key is 256 bit
          Verify return code: 0 (ok)
          ---
          DONE
        hint: "openssl s_client -connect shop.example.com:443 -servername shop.example.com </dev/null"
      - expect: "^openssl\\s+s_client\\s+.*shop\\.example\\.com.*2>\\s*/dev/null\\s*\\|\\s*openssl\\s+x509\\s+-noout\\s+(-issuer\\s+-dates|-dates\\s+-issuer)\\s*$"
        output: |
          issuer=O=Beispiel Trust, CN=Beispiel TLS CA 1
          notBefore=Sep  1 08:12:40 2026 GMT
          notAfter=Nov 30 08:12:39 2026 GMT
        hint: "openssl s_client -connect shop.example.com:443 -servername shop.example.com </dev/null 2>/dev/null | openssl x509 -noout -issuer -dates"
    responses:
      - match: "^curl"
        output: "Im Simulator ist hier nur openssl vorgesehen."
---
Du tippst `https://` und siehst ein Schloss. Aber woher weiß dein Browser, dass am anderen Ende wirklich
`shop.example.com` sitzt und nicht jemand, der sich dazwischengeschaltet hat? Die Antwort heißt
[[tls|TLS]] mit [[zertifikat|Zertifikaten]] – und einer Kette von Unterschriften, die bei einer Stelle
endet, der dein Browser schon vertraut.

## Was TLS leistet

TLS schützt die Verbindung, über die HTTP läuft. Es liefert drei Dinge:

| Ziel | Bedeutung |
|---|---|
| Vertraulichkeit | Niemand unterwegs kann mitlesen |
| Integrität | Niemand kann Daten unbemerkt verändern |
| Authentizität | Du sprichst wirklich mit dem Server, der im Zertifikat steht |

Dafür kombiniert TLS zwei Verfahren. Mit [[asymmetrische-kryptografie|asymmetrischer Kryptografie]]
(Schlüsselpaar aus öffentlichem und privatem Schlüssel) beweist der Server seine Identität, und beide
Seiten handeln einen gemeinsamen Schlüssel aus. Die eigentlichen Daten verschlüsselt dann schnelle
[[symmetrische-verschluesselung|symmetrische Verschlüsselung]].

Ohne Authentizität wäre Verschlüsselung wertlos: Ein [[man-in-the-middle|Man-in-the-Middle]] könnte
sich einfach als Server ausgeben.

## Was in einem Zertifikat steht

Ein Zertifikat ist ein digital unterschriebener Ausweis für einen öffentlichen Schlüssel:

| Feld | Beispiel |
|---|---|
| Subject (für wen) | `CN=shop.example.com` |
| Subject Alternative Name | `DNS:shop.example.com, DNS:www.shop.example.com` |
| Issuer (von wem) | `CN=Beispiel TLS CA 1` |
| Gültigkeit | `notBefore` bis `notAfter` |
| Öffentlicher Schlüssel | EC P-256 oder RSA 2048 |
| Signatur | Unterschrift des Ausstellers über alles oben |

Browser prüfen den Hostnamen **nur** im [[subject-alternative-name|Subject Alternative Name]] (SAN). Die [[signatur|Signatur]] des Ausstellers macht jede Änderung am Zertifikat sichtbar. Der Common Name im Subject ist
historisch und zählt dafür nicht mehr.

```bash title="Ein Zertifikat lesen"
openssl x509 -in server.pem -noout -subject -issuer -dates -ext subjectAltName
```

[[openssl|OpenSSL]] ist das Standardwerkzeug, um Zertifikate zu erzeugen, zu lesen und zu prüfen.

## Die Zertifikatskette

Ausgestellt werden Zertifikate von einer [[zertifizierungsstelle|Zertifizierungsstelle]] (CA). Sie
unterschreibt aber nicht direkt mit ihrem wertvollsten Schlüssel, sondern über eine
[[zertifikatskette|Kette]]:

![Die Zertifikatskette von der Root-CA bis zum Server](/assets/http-https/zertifikatskette.svg)

- Das [[root-zertifikat|Root-Zertifikat]] hat sich selbst signiert. Es liegt im
  [[vertrauensspeicher|Vertrauensspeicher]] von Betriebssystem oder Browser.
- Ein [[zwischenzertifikat|Zwischenzertifikat]] wurde von der Root-CA signiert. Mit ihm unterschreibt
  die CA im Alltag – der Root-Schlüssel bleibt offline im Tresor.
- Das Server-Zertifikat wurde vom Zwischenzertifikat signiert.

Der Server schickt Server- und Zwischenzertifikat mit. Der Client prüft von unten nach oben, bis er bei
einer Root ankommt, der er vertraut.

> [!FEHLER]
> Der Server liefert nur sein eigenes Zertifikat, ohne Zwischenzertifikat. Manche Browser finden den
> Rest trotzdem, curl, Apps und andere Server aber nicht: „unable to get local issuer certificate“.
> Konfiguriere immer die komplette Kette (bei Let's Encrypt: `fullchain.pem`).

## Der TLS-1.3-Handshake

Bevor HTTP-Daten fließen, einigen sich Client und Server im [[handshake|Handshake]]. Mit TLS 1.3
braucht das nur einen Round Trip:

1. **ClientHello** – Der Client nennt unterstützte Verfahren, schickt seinen Teil für den
   [[schluesselaustausch|Schlüsselaustausch]] und per [[sni|SNI]] den gewünschten Hostnamen.
2. **ServerHello** – Der Server wählt eine [[cipher-suite|Cipher Suite]] und schickt seinen Teil des
   Schlüsselaustauschs. Ab jetzt ist alles verschlüsselt.
3. Der Server schickt seine **Zertifikatskette** und beweist mit einer Signatur, dass er den passenden
   privaten Schlüssel besitzt.
4. Beide bestätigen mit **Finished**. Danach läuft HTTP durch den Tunnel.

SNI ist nötig, weil viele Websites auf einer IP-Adresse liegen: Der Server muss das passende Zertifikat
auswählen, bevor er den Host-Header überhaupt sehen kann.

> [!MERKSATZ]
> Ein Zertifikat beweist nichts allein – erst die Kette bis zu einer vertrauenswürdigen Root und die
> Signatur im Handshake zeigen, dass der Server echt ist.

## Zertifikate mit OpenSSL untersuchen

```bash title="Verbindung aufbauen und Kette anzeigen"
openssl s_client -connect shop.example.com:443 -servername shop.example.com </dev/null
```

Die Ausgabe zeigt unter `Certificate chain` jedes Glied mit `s:` (Subject) und `i:` (Issuer), dazu
TLS-Version, Cipher und am Ende `Verify return code: 0 (ok)`.

```bash title="Eine Kette lokal prüfen"
openssl verify -CAfile root.pem -untrusted zwischen.pem server.pem
```

`-CAfile` ist das, dem du vertraust. `-untrusted` sind Zwischenzertifikate, die erst geprüft werden.

> [!PRAXIS]
> Läuft ein Zertifikat ab, ist die Website für alle Besucher:innen „unsicher“. Viele Teams überwachen
> deshalb `notAfter` automatisch und schlagen Alarm, lange bevor es so weit ist.

## Zusammenfassung

- TLS liefert Vertraulichkeit, Integrität und Authentizität.
- Ein Zertifikat bindet einen öffentlichen Schlüssel an Namen (SAN), unterschrieben von einer CA.
- Die Kette: Server-Zertifikat → Zwischenzertifikat → Root im Vertrauensspeicher.
- Der Server muss die Zwischenzertifikate mitschicken.
- TLS 1.3 braucht einen Round Trip; SNI nennt den Hostnamen schon im ClientHello.
- `openssl x509`, `openssl s_client` und `openssl verify` machen alles sichtbar.
