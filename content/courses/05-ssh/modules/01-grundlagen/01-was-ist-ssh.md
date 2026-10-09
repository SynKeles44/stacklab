---
title: Was ist SSH?
summary: Warum es SSH gibt, welches Problem es gegenüber Telnet löst und was bei einer SSH-Verbindung grob passiert.
duration: 20
sources:
  - title: OpenSSH – Projektseite und Handbuchseiten
    url: https://www.openssh.com/manual.html
  - title: ssh(1) – Handbuchseite des SSH-Clients
    url: https://man.openbsd.org/ssh
  - title: RFC 4251 – The Secure Shell (SSH) Protocol Architecture
    url: https://www.rfc-editor.org/rfc/rfc4251
quiz:
  - type: single
    question: Warum hat SSH das ältere Telnet fast vollständig verdrängt?
    options:
      - SSH ist schneller, weil es weniger Daten überträgt.
      - Telnet überträgt alles im Klartext, SSH verschlüsselt die gesamte Verbindung.
      - Telnet funktioniert nur unter Windows.
      - SSH braucht keinen Server auf der Gegenseite.
    answer: 1
    explanation: >
      Bei Telnet gehen Benutzername, Passwort und jeder Befehl lesbar über das Netz. Wer den Verkehr
      mitschneidet, liest alles mit. SSH verschlüsselt den kompletten Kanal – das war der Grund für seine Erfindung.
  - type: multiple
    question: Wofür wird SSH im Entwickleralltag benutzt?
    options:
      - Befehle auf einem entfernten Server ausführen
      - Code per git push zu GitHub übertragen
      - Webseiten im Browser anzeigen
      - Dateien sicher auf einen Server kopieren
    answers: [0, 1, 3]
    explanation: >
      SSH ist eine entfernte Shell, ein Transportweg für Git und die Basis für scp, sftp und rsync.
      Webseiten lädt der Browser dagegen über HTTP bzw. HTTPS.
  - type: cloze
    text: Ein SSH-Server lauscht standardmäßig auf Port ___. Das Programm, das auf dem Server im Hintergrund auf Verbindungen wartet, heißt ___.
    blanks:
      - ["22"]
      - [sshd]
    explanation: Port 22 ist der Standard-Port für SSH. Der Server-Dienst heißt sshd – das d steht für Daemon, ein Hintergrundprogramm.
  - type: match
    question: Ordne jedem Begriff die passende Rolle zu.
    pairs:
      - { left: "ssh", right: "Client-Programm auf deinem Laptop" }
      - { left: "sshd", right: "Server-Dienst, der Verbindungen annimmt" }
      - { left: "Port 22", right: "Standard-Tür, an der der Server lauscht" }
      - { left: "Telnet", right: "Unverschlüsselter Vorgänger" }
    explanation: Der Client (ssh) baut die Verbindung auf, der Daemon (sshd) nimmt sie auf Port 22 an. Telnet erfüllte früher dieselbe Aufgabe, aber ohne Verschlüsselung.
tasks:
  - id: telnet-oder-ssh
    type: dragdrop
    title: Telnet oder SSH?
    description: Ordne jede Eigenschaft dem Protokoll zu, auf das sie zutrifft.
    targets:
      - { id: telnet, label: Telnet }
      - { id: ssh, label: SSH }
    items:
      - { label: Passwort geht lesbar über das Netz, target: telnet }
      - { label: Standard-Port 23, target: telnet }
      - { label: Heute nur noch in abgeschotteten Altsystemen, target: telnet }
      - { label: Gesamte Verbindung ist verschlüsselt, target: ssh }
      - { label: Standard-Port 22, target: ssh }
      - { label: Prüft die Identität des Servers, target: ssh }
      - { label: Anmeldung mit Schlüsselpaar möglich, target: ssh }
    hints:
      - Telnet kennt keinerlei Verschlüsselung – alles, was sicherheitsrelevant klingt, gehört zu SSH.
  - id: erster-login
    type: simulated
    title: Deine erste SSH-Sitzung
    description: |
      Auf dem Server `203.0.113.10` gibt es einen Account `ada`, dein Schlüssel ist dort bereits
      hinterlegt. Spiel eine komplette Sitzung durch:

      1. Verbinde dich mit `ssh ada@203.0.113.10`.
      2. Prüfe mit `whoami`, als wer du angemeldet bist.
      3. Prüfe mit `hostname`, auf welchem Rechner du bist.
      4. Beende die Sitzung mit `exit`.

      Achte darauf, wie sich der Prompt verändert – er verrät dir immer, wo deine Befehle laufen.
    prompt: "du@laptop:~$"
    steps:
      - expect: "^ssh\\s+ada@203\\.0\\.113\\.10\\s*$"
        output: |
          Welcome to Ubuntu 24.04.3 LTS (GNU/Linux 6.8.0-79-generic x86_64)

          Last login: Thu Oct  8 17:42:11 2026 from 198.51.100.23
        prompt: "ada@web-01:~$"
        hint: "Das Muster lautet ssh benutzer@adresse – also ssh ada@203.0.113.10"
      - expect: "^whoami\\s*$"
        output: ada
        prompt: "ada@web-01:~$"
        hint: Tippe whoami
      - expect: "^hostname\\s*$"
        output: web-01
        prompt: "ada@web-01:~$"
        hint: Tippe hostname
      - expect: "^(exit|logout)\\s*$"
        output: |
          logout
          Connection to 203.0.113.10 closed.
        prompt: "du@laptop:~$"
        hint: Mit exit verlässt du die entfernte Shell.
    responses:
      - match: "^ls"
        output: "app  logs  backup.sql"
      - match: "^pwd"
        output: /home/ada
    solution: |
      ```bash
      ssh ada@203.0.113.10
      whoami      # ada
      hostname    # web-01
      exit
      ```
---

Stell dir vor, deine Website läuft auf einem [[server|Server]] in einem Rechenzentrum in Frankfurt.
Du sitzt zu Hause, und eine Log-Datei auf diesem Server verrät, warum der Checkout kaputt ist. Du
kannst nicht hinfahren und eine Tastatur anschließen. Du brauchst ein [[terminal|Terminal]], das auf
deinem Laptop läuft – dessen Befehle aber auf dem Server ausgeführt werden. Genau das ist SSH.

![Telnet überträgt Passwörter im Klartext, SSH verschlüsselt die ganze Verbindung](/assets/ssh/ssh-ueberblick.svg)

## Eine entfernte Shell

[[ssh|SSH]] steht für **Secure Shell**, also „sichere Shell“. Eine [[shell|Shell]] kennst du schon:
Das ist das Programm, das deine eingetippten [[befehl|Befehle]] liest und ausführt. Bei SSH läuft
diese Shell nicht auf deinem Rechner, sondern auf einem anderen. Du tippst lokal, die Befehle laufen
entfernt, die Ausgabe kommt zurück auf deinen Bildschirm.

Daran sind immer zwei Programme beteiligt:

| Seite | Programm | Aufgabe |
|---|---|---|
| Dein Laptop | `ssh` (der [[client|Client]]) | baut die Verbindung auf, schickt deine Tastatureingaben |
| Der Server | `sshd` (der [[sshd|SSH-Daemon]]) | wartet auf Verbindungen, prüft dich, startet eine Shell für dich |

Ein [[daemon|Daemon]] ist ein Programm, das im Hintergrund läuft und auf Arbeit wartet – ähnlich
wie ein Pförtner, der den ganzen Tag am Eingang sitzt. Der SSH-Daemon lauscht an einer bestimmten
„Tür“ des Servers, dem [[port|Port]] 22. Ein Port ist eine Nummer, mit der ein Rechner
unterscheidet, welches Programm eine eingehende Verbindung bekommen soll: Port 443 für HTTPS,
Port 5432 für PostgreSQL, Port 22 für SSH.

Die einfachste Verbindung sieht so aus:

```bash title="Terminal"
ssh ada@203.0.113.10
```

Vor dem `@` steht der Benutzername **auf dem Server**, dahinter die Adresse des Servers – eine
[[ip-adresse|IP-Adresse]] oder ein [[hostname|Hostname]] wie `server.example.com`. Danach siehst du
einen neuen Prompt, zum Beispiel `ada@web-01:~$`. Ab jetzt läuft jeder Befehl auf dem Server, bis du
`exit` tippst.

> [!MERKSATZ]
> Der Prompt verrät dir immer, **wo** deine Befehle laufen. Steht dort der Servername, wirkt
> jedes `rm` auf dem Server – nicht auf deinem Laptop.

## Das Problem, das SSH löst: Telnet

Entfernte Shells gab es lange vor SSH. Das bekannteste Werkzeug war [[telnet|Telnet]] aus den
1970er-Jahren. Telnet hatte einen gewaltigen Haken: Es überträgt alles im [[klartext|Klartext]].
Benutzername, Passwort, jeder Befehl und jede Ausgabe gehen lesbar über das Netz.

Das klingt harmlos, solange du an „dein“ Netz denkst. Aber zwischen deinem Laptop und einem Server
liegen viele Stationen: das WLAN im Café, der Router deines Internetanbieters, Knotenpunkte im
Internet, das Netz des Rechenzentrums. Jeder, der an einer dieser Stationen den Verkehr mitschneidet,
kann das Passwort einfach ablesen.

1995 wurde an einer finnischen Universität genau so ein Mitschnitt-Angriff entdeckt, bei dem
Tausende Passwörter abgegriffen wurden. Als Reaktion entstand SSH. Heute ist **OpenSSH** die mit
Abstand verbreitetste Umsetzung – sie steckt in praktisch jedem [[linux|Linux]]-System, in macOS
und seit einigen Jahren auch in Windows.

> [!FEHLER]
> **„In unserem Firmennetz ist Telnet doch sicher.“** – Auch interne Netze werden angegriffen,
> und ein einziger kompromittierter Rechner im selben Netz reicht zum Mitlesen. Klartext-Protokolle
> für Anmeldungen sind heute nirgends mehr akzeptabel.

## Was SSH genau schützt

SSH löst drei Probleme gleichzeitig. Merk dir die drei Fragen, die SSH bei jeder Verbindung
beantwortet:

1. **Vertraulichkeit – Kann jemand mitlesen?** Nein. Der gesamte Datenverkehr ist mit
   [[verschluesselung|Verschlüsselung]] geschützt. Ein Mitschnitt zeigt nur Zeichensalat.
2. **Server-Identität – Spreche ich mit dem richtigen Server?** SSH prüft beim Verbinden einen
   Schlüssel des Servers. Gibt sich jemand anderes als dein Server aus, schlägt SSH Alarm.
3. **Nutzer-Identität – Darf diese Person rein?** Der Server prüft dich – per Passwort oder, viel
   besser, per Schlüsselpaar.

Zusätzlich sichert SSH die **Integrität**: Wird ein Datenpaket unterwegs verändert, merkt die
Gegenseite das sofort und bricht ab. Niemand kann dir also unbemerkt einen anderen Befehl
unterschieben.

Wie das technisch funktioniert, lernst du in den nächsten beiden Lektionen. Für jetzt reicht dir
das grobe Bild einer Verbindung:

1. Der Client verbindet sich mit Port 22 des Servers.
2. Beide einigen sich auf Verschlüsselungsverfahren und einen gemeinsamen geheimen Schlüssel.
3. Der Server weist sich mit seinem **Host-Key** aus, dein Client prüft ihn.
4. Du weist dich aus (Passwort oder Schlüssel).
5. Der Server startet eine Shell für dich – alles Weitere läuft durch den verschlüsselten Kanal.

## Mehr als nur eine Shell

SSH ist nicht nur „Fernbedienung für Server“. Weil es einen sicheren, geprüften Kanal herstellt,
bauen viele andere Werkzeuge darauf auf:

| Anwendung | Beispiel |
|---|---|
| Entfernte Shell | `ssh ada@203.0.113.10` |
| Einzelnen Befehl ausführen | `ssh ada@203.0.113.10 "df -h"` |
| Dateien kopieren | `scp backup.sql ada@203.0.113.10:/tmp/` |
| Git über SSH | `git clone git@github.com:example/app.git` |
| Tunnel zu einer Datenbank | `ssh -L 5433:localhost:5432 ada@203.0.113.10` |

Du wirst all das in diesem Kurs ausprobieren. Ein einzelner Befehl ohne interaktive Shell ist
übrigens oft praktischer, als du denkst – zum Beispiel um schnell den freien Speicherplatz zu prüfen:

```bash title="Einzelner Befehl auf dem Server"
ssh ada@203.0.113.10 "df -h /"
```

```text title="Ausgabe"
Filesystem      Size  Used Avail Use% Mounted on
/dev/vda1        80G   61G   19G  77% /
```

Nach der Ausgabe bist du sofort wieder auf deinem Laptop.

> [!PRAXIS]
> Im Berufsalltag begegnet dir SSH ständig: beim Deployment auf Server, beim Lesen von Logs, beim
> Zugriff auf eine Datenbank hinter einer Firewall und jedes Mal, wenn du per SSH-URL zu GitHub
> pushst. Wer SSH sicher beherrscht, ist in Infrastruktur-Fragen deutlich selbstständiger.

Der SSH-Client ist auf macOS und Linux vorinstalliert, auf Windows 10 und 11 ebenfalls als
optionales Feature (meist schon aktiv). Prüfe es mit:

```bash title="Terminal"
ssh -V
```

```text title="Ausgabe (Beispiel)"
OpenSSH_10.0p2, OpenSSL 3.5.0 8 Apr 2025
```

Die Option `-V` (großes V) zeigt die Version. Den Server-Teil `sshd` brauchst du auf deinem
Laptop normalerweise nicht – der läuft auf den Servern, zu denen du dich verbindest.

> [!TIPP]
> Das kleine `-v` bedeutet dagegen *verbose* (gesprächig): `ssh -v ada@203.0.113.10` zeigt jeden
> Schritt des Verbindungsaufbaus. Das ist dein wichtigstes Werkzeug, wenn eine Verbindung nicht
> klappt.

## Zusammenfassung

- SSH (Secure Shell) gibt dir eine Shell auf einem entfernten Rechner – du tippst lokal, die Befehle laufen auf dem Server.
- Beteiligt sind der Client `ssh` auf deinem Laptop und der Daemon `sshd` auf dem Server, der standardmäßig auf Port 22 lauscht.
- Telnet übertrug alles im Klartext; SSH wurde 1995 als sicherer Ersatz entwickelt.
- SSH schützt Vertraulichkeit (Verschlüsselung), prüft die Identität des Servers und die des Nutzers und erkennt veränderte Daten.
- Auf SSH bauen viele Werkzeuge auf: einzelne Befehle, scp/sftp/rsync, Git und Tunnel.
- Der Prompt zeigt dir immer, auf welchem Rechner deine Befehle gerade laufen.
