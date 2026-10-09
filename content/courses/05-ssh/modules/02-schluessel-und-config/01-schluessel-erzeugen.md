---
title: Schlüssel erzeugen, schützen und laden
summary: Du erzeugst ein Ed25519-Schlüsselpaar, verstehst die beiden Dateien, liest Fingerprints aus und nutzt Passphrase und ssh-agent.
duration: 25
sources:
  - title: ssh-keygen(1) – Handbuchseite
    url: https://man.openbsd.org/ssh-keygen
  - title: ssh-agent(1) und ssh-add(1)
    url: https://man.openbsd.org/ssh-agent
  - title: OpenSSH Release Notes (Standard-Schlüsseltyp, Entfernung von DSA)
    url: https://www.openssh.com/releasenotes.html
  - title: GitHub Docs – Generating a new SSH key and adding it to the ssh-agent
    url: https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent
quiz:
  - type: single
    question: Welchen Schlüsseltyp solltest du heute für einen neuen SSH-Schlüssel wählen?
    options:
      - DSA
      - RSA mit 1024 Bit
      - Ed25519
      - Der Typ ist egal, alle sind gleich sicher.
    answer: 2
    explanation: >
      Ed25519 ist kurz, schnell, sehr sicher und seit OpenSSH 9.5 der Standard von ssh-keygen.
      DSA wurde aus OpenSSH entfernt, RSA mit 1024 Bit gilt als zu schwach.
  - type: find-bug
    question: Ada will ein zweites Schlüsselpaar nur für die Arbeit anlegen – ohne ihren bisherigen Schlüssel zu verlieren. Welche Zeile ist das Problem?
    language: bash
    code: |
      cd ~/.ssh
      ls
      ssh-keygen -t ed25519 -C "ada@example.com"
      ssh-keygen -l -f id_ed25519_arbeit.pub
    bug_line: 3
    explanation: >
      Ohne -f schlägt ssh-keygen den Standardnamen id_ed25519 vor. Bestätigt Ada mit Enter und dann
      „Overwrite (y/n)? y“, ist ihr bisheriger Schlüssel weg. Richtig: -f ~/.ssh/id_ed25519_arbeit.
  - type: single
    question: Wovor schützt dich eine Passphrase auf deinem privaten Schlüssel?
    options:
      - Davor, dass jemand deine SSH-Verbindung mitliest.
      - Davor, dass jemand mit einer gestohlenen Kopie der Schlüsseldatei sofort auf deine Server kommt.
      - Davor, dass der Server einen falschen Host-Key hat.
    answer: 1
    explanation: >
      Die Passphrase verschlüsselt die Datei auf der Festplatte. Die Verbindung ist unabhängig davon
      verschlüsselt.
  - type: multiple
    question: Welche Aussagen über den ssh-agent stimmen?
    options:
      - Er hält entsperrte Schlüssel im Arbeitsspeicher und signiert für ssh.
      - Er gibt den entsperrten Schlüssel auf Anfrage an ssh heraus.
      - Mit ssh-add -l siehst du, welche Schlüssel er gerade hält.
      - Mit ssh-add -t legst du fest, wann ein Schlüssel wieder vergessen wird.
    answers: [0, 2, 3]
    explanation: Der Agent liefert nur Signaturen – den Schlüssel selbst gibt er nie heraus.
  - type: match
    question: Ordne jedem Befehl seine Wirkung zu.
    pairs:
      - { left: "ssh-keygen -l -f id_ed25519.pub", right: "Fingerprint anzeigen" }
      - { left: "ssh-keygen -p -f id_ed25519", right: "Passphrase ändern" }
      - { left: "ssh-add ~/.ssh/id_ed25519", right: "Schlüssel in den Agent laden" }
      - { left: "ssh-add -D", right: "Alle Schlüssel aus dem Agent entfernen" }
    explanation: ssh-keygen arbeitet mit den Dateien, ssh-add mit dem laufenden Agent.
tasks:
  - id: erstes-schluesselpaar
    type: terminal
    title: Dein erstes Schlüsselpaar
    description: |
      Erzeuge im Ordner `erster-schluessel` ein Ed25519-Schlüsselpaar. Für diese Übung verzichtest du
      auf eine Passphrase.

      1. Erzeuge das Paar mit dem Dateinamen `id_ed25519` (Option `-f`) und dem Kommentar `ada@example.com` (Option `-C`).
      2. Prüfe mit `ls -l`, welche zwei Dateien entstanden sind und welche Rechte sie haben.
      3. Schreib die Ausgabe von `ssh-keygen -l -f id_ed25519.pub` in eine Datei `fingerprint.txt`.
    workdir: erster-schluessel
    checks:
      - type: file_exists
        path: id_ed25519
        message: Der private Schlüssel id_ed25519 fehlt noch.
      - type: file_exists
        path: id_ed25519.pub
        message: Der öffentliche Schlüssel id_ed25519.pub fehlt noch.
      - type: command
        run: ssh-keygen -l -f id_ed25519.pub
        stdout_matches: "ada@example\\.com \\(ED25519\\)$"
        message: Der Schlüssel muss vom Typ ED25519 sein und den Kommentar ada@example.com tragen.
      - type: command
        run: stat -c '%a' id_ed25519
        stdout_equals: "600"
        message: Der private Schlüssel sollte die Rechte 600 haben.
      - type: command
        run: test "$(ssh-keygen -y -P '' -f id_ed25519 | cut -d' ' -f2)" = "$(cut -d' ' -f2 id_ed25519.pub)"
        message: Privater und öffentlicher Schlüssel passen nicht zusammen oder der private Schlüssel hat eine Passphrase.
      - type: command
        run: grep -qF "$(ssh-keygen -l -f id_ed25519.pub | awk '{print $2}')" fingerprint.txt
        message: fingerprint.txt enthält noch nicht den Fingerprint deines Schlüssels.
    hints:
      - "Die Optionen lauten `-t` (Typ), `-C` (Kommentar), `-f` (Dateiname) und `-N` (neue Passphrase)."
      - "`ssh-keygen -t ed25519 -C \"ada@example.com\" -f id_ed25519 -N \"\"` erzeugt das Paar ohne Rückfragen."
      - "Die Ausgabe eines Befehls lenkst du mit `>` in eine Datei um."
    solution: |
      ```bash
      cd erster-schluessel
      ssh-keygen -t ed25519 -C "ada@example.com" -f id_ed25519 -N ""
      ls -l
      ssh-keygen -l -f id_ed25519.pub > fingerprint.txt
      ```
  - id: wo-liegt-was
    type: dragdrop
    title: Datei, Agent oder Passwort-Manager?
    description: Ordne jede Aussage dem Ort zu, auf den sie zutrifft.
    targets:
      - { id: datei, label: Schlüsseldatei mit Passphrase }
      - { id: agent, label: ssh-agent }
      - { id: manager, label: Agent eines Passwort-Managers }
    items:
      - { label: Liegt verschlüsselt auf der Festplatte, target: datei }
      - { label: Wird mit ssh-keygen -p geändert, target: datei }
      - { label: Hält entsperrte Schlüssel im Arbeitsspeicher, target: agent }
      - { label: Wird über SSH_AUTH_SOCK gefunden, target: agent }
      - { label: Speichert den Schlüssel im Tresor und fragt per Fingerabdruck nach Freigabe, target: manager }
      - { label: Wird in der ssh-Config mit IdentityAgent eingebunden, target: manager }
    hints:
      - Die Datei kennt nur die Passphrase. Alles mit Arbeitsspeicher und Socket gehört zum Agent.
---

Bevor du dich mit einem Schlüssel anmelden kannst, brauchst du einen. Das erledigt `ssh-keygen`.
Danach schützt du ihn mit einer Passphrase – und damit dich das nicht nervt, übernimmt der
ssh-agent das Entsperren. Schau vorher mit `ls -l ~/.ssh` nach, ob schon ein Schlüssel existiert.

## Ein Ed25519-Schlüssel in einem Befehl

```bash title="Terminal"
ssh-keygen -t ed25519 -C "ada@example.com"
```

| Option | Bedeutung |
|---|---|
| `-t ed25519` | Typ des Schlüssels |
| `-C "…"` | Kommentar, meist E-Mail oder `name@rechner` |
| `-f pfad` | Dateiname, Standard ist `~/.ssh/id_ed25519` |
| `-N "…"` | Passphrase direkt mitgeben (`-N ""` = keine) |

[[ed25519|Ed25519]] ist die erste Wahl: kurz, schnell, sehr sicher und seit OpenSSH 9.5 Standard.
[[rsa|RSA]] nimmst du nur für alte Systeme, dann mit mindestens 3072 Bit. DSA ist entfernt.

> [!FEHLER]
> **Einen bestehenden Schlüssel überschreiben.** Fragt `ssh-keygen` „Overwrite (y/n)?“, liegt dort
> schon ein Schlüssel. Mit `y` ist er für immer weg – und damit der Zugang zu allen Servern, die ihn
> kennen. Für einen zweiten Schlüssel nimm `-f ~/.ssh/id_ed25519_arbeit`.

## Die beiden Dateien und ihr Fingerprint

| Datei | Inhalt | Rechte |
|---|---|---|
| `id_ed25519` | privater Schlüssel, beginnt mit `-----BEGIN OPENSSH PRIVATE KEY-----` | `600` |
| `id_ed25519.pub` | eine Zeile: Typ, Schlüssel (Base64), Kommentar | `644` |

```text title="id_ed25519.pub"
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDjYpZi1M7FQ8BPF2tj+tPY0a8dBps1c1p7xxuuMEoij ada@example.com
```

Der Kommentar ist nur ein Etikett für Menschen. Wiedererkennen lässt sich ein Schlüssel eindeutig am
[[fingerprint|Fingerprint]]:

```bash title="Fingerprint anzeigen"
ssh-keygen -l -f ~/.ssh/id_ed25519.pub
```

```text title="Ausgabe"
256 SHA256:Px8xS4IrakCrlOCdhDydCu0YZCiYdQqi7yU4QlPGqyc ada@example.com (ED25519)
```

GitHub und viele Dienste zeigen genau diesen Wert an. Geht die `.pub`-Datei verloren, erzeugt
`ssh-keygen -y -f ~/.ssh/id_ed25519` sie neu. Umgekehrt geht das nicht.

## Die Passphrase schützt die Datei

Eine [[passphrase|Passphrase]] verschlüsselt den privaten Schlüssel auf der Festplatte. Wer die
Datei kopiert, kann ohne Passphrase nichts damit anfangen. Sie geht nie über das Netz – der Server
erfährt nichts von ihr.

```bash title="Passphrase setzen oder ändern"
ssh-keygen -p -f ~/.ssh/id_ed25519
```

Der Schlüssel selbst bleibt dabei gleich, du musst auf keinem Server etwas ändern. Vergisst du die
Passphrase, hilft nur ein neues Schlüsselpaar – speichere sie im Passwort-Manager.

## Der ssh-agent: einmal entsperren, oft benutzen

Der [[ssh-agent|ssh-agent]] ist ein Hintergrundprogramm, dem du den Schlüssel einmal entsperrt
übergibst. Danach fragt `ssh` den Agent um Signaturen – den Schlüssel selbst gibt er nie heraus.
Gefunden wird er über die [[umgebungsvariable|Umgebungsvariable]] `SSH_AUTH_SOCK`, die auf einen
[[socket|Socket]] zeigt. Auf macOS und Linux-Desktops läuft meist schon einer.

```bash title="Den Agent bedienen"
eval "$(ssh-agent -s)"           # Agent starten, falls keiner läuft
ssh-add ~/.ssh/id_ed25519        # Schlüssel entsperren und laden
ssh-add -l                       # geladene Schlüssel anzeigen
ssh-add -t 8h ~/.ssh/id_ed25519  # nach 8 Stunden automatisch vergessen
ssh-add -D                       # alle Schlüssel entfernen
```

Mit `AddKeysToAgent yes` in der ssh-Config lädt `ssh` den Schlüssel beim ersten Benutzen
automatisch. Unter macOS speichert `UseKeychain yes` die Passphrase zusätzlich im Schlüsselbund.
Passwort-Manager mit eigenem Agent bindest du per `IdentityAgent` ein – dort liegt der Schlüssel
gar nicht mehr als Datei vor.

> [!MERKSATZ]
> Passphrase auf die Datei, Schlüssel einmal pro Sitzung in den Agent – so kombinierst du
> Sicherheit und Bequemlichkeit.

> [!PRAXIS]
> Viele Entwickler:innen nutzen einen Schlüssel pro Gerät. Wird ein Laptop gestohlen, entfernt man
> nur dessen öffentlichen Schlüssel – dafür braucht jeder Schlüssel einen sprechenden Kommentar wie
> `ada@laptop-2026`.

## Zusammenfassung

- `ssh-keygen -t ed25519 -C "kommentar"` erzeugt ein modernes Schlüsselpaar; `-f` wählt den Namen, `-N` die Passphrase.
- Privater Schlüssel mit Rechten 600, öffentlicher `.pub` mit 644; der Kommentar ist nur ein Etikett.
- `ssh-keygen -l` zeigt den Fingerprint, `-y` rekonstruiert den öffentlichen Schlüssel.
- Die Passphrase verschlüsselt die Datei; ändern mit `ssh-keygen -p`.
- Der ssh-agent hält entsperrte Schlüssel im Speicher; `ssh-add`, `-l`, `-t`, `-D` steuern ihn.
