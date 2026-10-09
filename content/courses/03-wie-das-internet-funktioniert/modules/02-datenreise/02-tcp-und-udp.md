---
title: TCP, UDP und Ports
summary: Wie TCP aus unzuverlässigen Paketen eine verlässliche Verbindung macht, wann das schlanke UDP besser passt und wie Ports das richtige Programm finden.
duration: 25
sources:
  - title: RFC 9293 – Transmission Control Protocol (TCP)
    url: https://www.rfc-editor.org/rfc/rfc9293
  - title: RFC 768 – User Datagram Protocol
    url: https://www.rfc-editor.org/rfc/rfc768
  - title: MDN – TCP handshake
    url: https://developer.mozilla.org/en-US/docs/Glossary/TCP_handshake
  - title: IANA – Service Name and Transport Protocol Port Number Registry
    url: https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml
  - title: PHP – Built-in web server
    url: https://www.php.net/manual/en/features.commandline.webserver.php
quiz:
  - type: single
    question: In welcher Reihenfolge laufen die drei Nachrichten des TCP-Handshakes?
    options:
      - ACK → SYN → SYN-ACK
      - SYN → SYN-ACK → ACK
      - SYN → ACK → FIN
      - HELLO → OK → START
    answer: 1
    explanation: >
      Der Client fragt mit SYN an, der Server antwortet mit SYN-ACK („verstanden, und ich will auch“),
      der Client bestätigt mit ACK. Danach steht die Verbindung.
  - type: match
    question: Welche TCP-Nachricht hat welche Bedeutung?
    pairs:
      - { left: "SYN", right: "Ich möchte eine Verbindung aufbauen" }
      - { left: "ACK", right: "Ich habe deine Daten bis hierhin erhalten" }
      - { left: "FIN", right: "Ich habe nichts mehr zu senden" }
      - { left: "RST", right: "Verbindung sofort abbrechen" }
    explanation: >
      SYN (synchronize) startet, ACK (acknowledge) bestätigt, FIN (finish) beendet geordnet, RST (reset)
      bricht hart ab – zum Beispiel, wenn auf einem Port gar kein Programm lauscht.
  - type: single
    question: Warum nutzt ein Videocall meist UDP statt TCP?
    options:
      - Weil UDP verschlüsselt ist.
      - Weil ein verspätet nachgeliefertes Bild nutzlos ist – lieber weiter, als auf Neusendungen warten.
      - Weil TCP keine Bilder übertragen kann.
      - Weil UDP garantiert, dass alle Pakete ankommen.
    answer: 1
    explanation: >
      Bei Live-Übertragungen zählt Aktualität. Wartet TCP auf ein verlorenes Paket, friert das Bild ein.
      UDP schickt einfach weiter; ein fehlendes Bildstückchen fällt kaum auf.
  - type: match
    question: Ordne jedem Standard-Port seinen Dienst zu.
    pairs:
      - { left: "22", right: "SSH" }
      - { left: "53", right: "DNS" }
      - { left: "80", right: "HTTP" }
      - { left: "443", right: "HTTPS" }
    explanation: >
      Diese bekannten Ports sind bei der IANA registriert. Ein Dienst kann technisch auch auf einem anderen
      Port laufen, dann muss man den Port aber ausdrücklich angeben.
  - type: find-bug
    question: Du willst prüfen, ob dein lokaler Webserver auf Port 8080 antwortet. Er läuft aber auf Port 8081. Welche Zeile führt zu „Connection refused“?
    language: bash
    code: |
      php -S 127.0.0.1:8081 &
      sleep 1
      curl http://127.0.0.1:8080/
    bug_line: 3
    explanation: >
      Der Server lauscht auf 8081, curl fragt aber 8080 an. Auf 8080 lauscht niemand, also antwortet der
      Rechner mit RST – curl meldet „Connection refused“ und beendet sich mit Exit-Code 7.
tasks:
  - id: handshake-beschriften
    type: diagram
    title: Beschrifte den Handshake
    description: Ziehe die richtige TCP-Nachricht auf jeden Pfeil. Der oberste Pfeil ist die erste Nachricht.
    image: /assets/wie-das-internet-funktioniert/tcp-handshake-leer.svg
    slots:
      - { x: 50, y: 30.5, answer: SYN }
      - { x: 50, y: 47, answer: SYN-ACK }
      - { x: 50, y: 63.5, answer: ACK }
    distractors: [FIN, RST]
    hints:
      - Der Client fängt an. Der Server antwortet mit einer Nachricht, die zwei Dinge auf einmal tut.
  - id: ports-ausprobieren
    type: terminal
    title: Wer lauscht auf welchem Port?
    description: |
      Im Ordner `ports` liegt eine kleine Webseite `index.html`. Du startest einen Webserver auf einem
      Port und erlebst, was passiert, wenn auf einem Port **niemand** lauscht.

      Klicke zuerst auf **Aufgabe vorbereiten**.

      1. Starte im Ordner `ports` einen Webserver im Hintergrund: `php -S 127.0.0.1:8081 &` und warte mit
         `sleep 1` eine Sekunde, bis er bereit ist.
      2. Frag ihn mit curl ab und speichere die Antwort: `curl -s http://127.0.0.1:8081/ > antwort-8081.txt`
      3. Frag Port **8082** ab, auf dem nichts läuft, und speichere direkt danach curls Exit-Code mit
         `echo $? > fehlercode.txt` (`$?` enthält den Exit-Code des letzten Befehls).
      4. Lege eine Datei `ports.txt` an, die vier Zeilen im Format `dienst port` enthält:
         `ssh 22`, `dns 53`, `http 80`, `https 443`.
      5. Beende den Server wieder mit `kill %1` (oder `pkill -f "php -S"`).
    workdir: ports
    setup: |
      cat > index.html <<'HTML'
      <!doctype html>
      <title>Port-Test</title>
      <h1>Hallo von Port 8081</h1>
      HTML
    checks:
      - type: file_contains
        path: antwort-8081.txt
        pattern: "Hallo von Port 8081"
        message: In antwort-8081.txt fehlt die Antwort des Servers. Läuft der Server auf 8081, und hast du die curl-Ausgabe mit > umgeleitet?
      - type: file_contains
        path: fehlercode.txt
        pattern: "^7\\s*$"
        message: fehlercode.txt sollte curls Exit-Code 7 (keine Verbindung) enthalten. Führe `echo $? > fehlercode.txt` direkt nach dem curl auf Port 8082 aus.
      - type: command
        run: grep -Ec '^(ssh 22|dns 53|http 80|https 443)$' ports.txt
        stdout_matches: "^4$"
        message: ports.txt braucht genau diese vier Zeilen – ssh 22, dns 53, http 80, https 443 – jeweils eine pro Zeile.
    hints:
      - "Das `&` am Ende startet den Server im Hintergrund, sodass du im selben Terminal weitertippen kannst."
      - "Der Exit-Code ist nur direkt nach dem Befehl in `$?` – kein anderer Befehl dazwischen!"
      - "`printf 'ssh 22\\ndns 53\\nhttp 80\\nhttps 443\\n' > ports.txt` schreibt alle vier Zeilen auf einmal."
    solution: |
      ```bash
      cd ports
      php -S 127.0.0.1:8081 &
      sleep 1
      curl -s http://127.0.0.1:8081/ > antwort-8081.txt
      curl -s http://127.0.0.1:8082/
      echo $? > fehlercode.txt        # enthält 7: Connection refused
      printf 'ssh 22\ndns 53\nhttp 80\nhttps 443\n' > ports.txt
      kill %1
      ```
  - id: tcp-oder-udp
    type: dragdrop
    title: TCP oder UDP?
    description: Welches Transportprotokoll passt am besten zu der jeweiligen Anwendung?
    targets:
      - { id: tcp, label: TCP – zuverlässig und sortiert }
      - { id: udp, label: UDP – schnell und schlank }
    items:
      - { label: Eine Webseite über HTTP/1.1 laden, target: tcp }
      - { label: Eine Datei herunterladen, target: tcp }
      - { label: Eine E-Mail verschicken, target: tcp }
      - { label: Videocall in Echtzeit, target: udp }
      - { label: Online-Spiel mit Positionsdaten, target: udp }
      - { label: Kurze DNS-Anfrage, target: udp }
    hints:
      - Frag dich jeweils, ob ein verspätet nachgeliefertes Paket noch nützlich wäre.
---

Das Internet liefert Pakete wie eine Post, die Karten verliert, doppelt zustellt und durcheinanderbringt.
Trotzdem kommen Webseiten und Downloads vollständig an. Das verdankst du [[tcp|TCP]]. Für Live-Video und
DNS gibt es dagegen das schlanke [[udp|UDP]]. Und damit Daten beim richtigen Programm landen, gibt es [[port|Ports]].

## Das Problem: IP verspricht nichts

Das [[internet-protocol|Internet Protocol]] bringt Pakete auf den Weg – ohne Garantie. Router dürfen Pakete
verwerfen, Pakete können sich überholen. TCP und UDP sitzen eine Schicht darüber, auf den beiden
Endgeräten, nicht auf den Routern.

| | TCP | UDP |
|---|---|---|
| Verbindungsaufbau | Ja, Drei-Wege-Handshake | Nein, sofort losschicken |
| Zustellung und Reihenfolge garantiert | Ja | Nein |
| Overhead | Größer | Klein |
| Typisch für | Webseiten, Downloads, E-Mail, Datenbanken | DNS, Videocalls, Online-Spiele |

## TCP: Handshake und Bestätigungen

Bevor Daten fließen, vereinbaren beide Seiten eine Verbindung mit dem [[handshake|Handshake]]:

![Der TCP-Drei-Wege-Handshake](/assets/wie-das-internet-funktioniert/tcp-handshake.svg)

1. **SYN** – Client: „Ich möchte eine Verbindung.“
2. **SYN-ACK** – Server: „Verstanden, ich auch.“
3. **ACK** – Client: „Los geht's.“

Das kostet eine [[round-trip-time|Round-Trip-Time]], bevor das erste Byte Inhalt fließt.

Danach nummeriert TCP die Daten mit [[sequenznummer|Sequenznummern]]. Der Empfänger bestätigt mit ACKs,
bis wohin alles lückenlos da ist. Fehlt etwas, sendet der Sender genau das neu. Erst dann bekommt das
Programm die Daten – sortiert und vollständig. Zusätzlich bremst TCP, wenn der Empfänger oder das Netz
überlastet ist. Mit **FIN** wird die Verbindung geordnet beendet, mit **RST** hart abgebrochen.

> [!MERKSATZ]
> IP bringt Pakete **irgendwie** ans Ziel. TCP macht daraus einen **lückenlosen, sortierten Datenstrom**.

## UDP: abschicken und vergessen

UDP kennt keinen Handshake, keine Bestätigung und keine Neusendung. Genau das ist manchmal ein Vorteil:
Bei einem Videocall ist ein verspätetes Bild wertlos – TCP würde darauf warten und das Bild einfrieren
lassen, UDP schickt einfach das nächste. Auch DNS-Anfragen laufen meist über UDP: Frage und Antwort passen
je in ein Paket, und bei Verlust fragt man einfach noch einmal. HTTP/3 nutzt QUIC, das auf UDP aufsetzt.

## Ports und „Connection refused“

Auf einem Server laufen viele Programme. Der Port (0–65535) ist die „Zimmernummer“: Ein Programm
**lauscht** auf einem Port, und das [[betriebssystem|Betriebssystem]] übergibt ihm alle Pakete dafür.

| Port | Dienst |
|---|---|
| 22 | SSH |
| 53 | DNS |
| 80 | HTTP |
| 443 | HTTPS |

IP-Adresse plus Protokoll plus Port bilden einen [[socket|Socket]]. Lauscht auf einem Port **niemand**,
antwortet der Rechner mit RST – Programme melden „Connection refused“. Das probierst du mit einem lokalen
Server auf [[localhost|`127.0.0.1`]] aus:

```bash title="Ein Server lauscht, einer nicht"
php -S 127.0.0.1:8081 &          # Server lauscht auf 8081
curl -s http://127.0.0.1:8081/   # Antwort kommt
curl -s http://127.0.0.1:8082/   # niemand da
echo $?                          # 7 = keine Verbindung
```

> [!FEHLER]
> Ein offener Firewall-Port allein bringt nichts – es muss auch ein **Programm** darauf lauschen. Verwirft
> dagegen eine Firewall die Pakete, gibt es kein „refused“, sondern einen Timeout.

> [!PRAXIS]
> „Connection refused“ ist Alltag: Die Datenbank läuft noch nicht, der Dev-Server nutzt einen anderen Port.
> Die erste Frage lautet immer: **Läuft das Programm, und auf welchem Port?**

## Zusammenfassung

- **TCP** baut mit **SYN, SYN-ACK, ACK** eine Verbindung auf und liefert vollständig und sortiert.
- **Sequenznummern** und **ACKs** erkennen Lücken; Fehlendes wird neu gesendet.
- **UDP** ist schnell und schlank, ohne Garantie – ideal für DNS, Videocalls und Spiele.
- **Ports** adressieren Programme; bekannte Ports sind 22, 53, 80 und 443.
- Lauscht niemand auf einem Port, gibt es **Connection refused** (curl-Exit-Code 7).
