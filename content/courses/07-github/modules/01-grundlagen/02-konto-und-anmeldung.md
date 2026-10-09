---
title: Konto und sichere Anmeldung
summary: Wie du dein GitHub-Konto mit Zwei-Faktor-Authentifizierung schützt und dich per SSH-Schlüssel oder Token mit Git anmeldest.
duration: 25
sources:
  - title: GitHub Docs – Zwei-Faktor-Authentifizierung konfigurieren
    url: https://docs.github.com/de/authentication/securing-your-account-with-two-factor-authentication-2fa/configuring-two-factor-authentication
  - title: GitHub Docs – Neuen SSH-Schlüssel generieren
    url: https://docs.github.com/de/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent
  - title: GitHub Docs – Personal Access Tokens verwalten
    url: https://docs.github.com/de/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens
  - title: Pro Git – Git auf dem Server, SSH-Schlüssel erzeugen
    url: https://git-scm.com/book/de/v2/Git-auf-dem-Server-Erstellung-eines-SSH-Public-Keys
quiz:
  - type: single
    question: Welchen Teil eines SSH-Schlüsselpaars lädst du bei GitHub hoch?
    options:
      - Den privaten Schlüssel `id_ed25519`
      - Den öffentlichen Schlüssel `id_ed25519.pub`
      - Beide Dateien
    answer: 1
    explanation: Der öffentliche Schlüssel ist wie ein Schloss, das du bei GitHub einbaust. Der private Schlüssel verlässt nie deinen Rechner.
  - type: multiple
    question: Welche Aussagen über Personal Access Tokens stimmen?
    options:
      - Ein Token ersetzt beim Push über HTTPS dein Passwort
      - Fine-grained Tokens können auf einzelne Repositorys beschränkt werden
      - Ein Token sollte kein Ablaufdatum haben, damit es nie stört
      - Tokens gehören niemals in den Code oder in einen Commit
    answers: [0, 1, 3]
    explanation: Tokens ersetzen Passwörter bei HTTPS. Fine-grained Tokens begrenzen Repositorys und Rechte. Ein Ablaufdatum begrenzt den Schaden, falls ein Token doch einmal verloren geht.
  - type: cloze
    text: Einen modernen SSH-Schlüssel erzeugst du mit `ssh-keygen -t ___`. Ob die Anmeldung bei GitHub klappt, testest du mit `ssh -___ git@github.com`.
    blanks:
      - [ed25519]
      - [T]
    explanation: Ed25519 ist der empfohlene Schlüsseltyp. ssh -T testet die Verbindung, ohne eine Shell zu öffnen.
  - type: match
    question: Welche Remote-Adresse nutzt welches Verfahren?
    pairs:
      - { left: "git@github.com:du/app.git", right: "SSH mit Schlüsselpaar" }
      - { left: "https://github.com/du/app.git", right: "HTTPS mit Token oder Credential Manager" }
    explanation: Die SSH-Adresse beginnt mit dem Benutzer git@ und einem Doppelpunkt, die HTTPS-Adresse mit https://.
tasks:
  - id: ssh-schluessel-erzeugen
    type: terminal
    title: Erzeuge ein SSH-Schlüsselpaar
    description: |
      Im echten Leben liegen SSH-Schlüssel im Ordner `~/.ssh`. Zum Üben erzeugst du ein Paar direkt im
      Aufgabenordner `schluessel`, damit Stacklab es prüfen kann.

      1. Wechsle in den Ordner `schluessel`.
      2. Erzeuge ein Ed25519-Schlüsselpaar mit dem Dateinamen `id_ed25519` im aktuellen Ordner.
         Als Kommentar verwendest du `user@example.com`. Für die Übung darf die Passphrase leer sein.
      3. Schau dir den öffentlichen Schlüssel mit `cat` an – genau diese eine Zeile würdest du bei GitHub einfügen.
    workdir: schluessel
    checks:
      - type: file_exists
        path: id_ed25519
        message: Der private Schlüssel id_ed25519 fehlt noch. Nutze die Option -f ./id_ed25519.
      - type: file_contains
        path: id_ed25519.pub
        pattern: "^ssh-ed25519 \\S+"
        message: id_ed25519.pub muss mit "ssh-ed25519" beginnen. Hast du -t ed25519 angegeben?
      - type: file_contains
        path: id_ed25519.pub
        pattern: "user@example\\.com"
        message: Der Kommentar user@example.com fehlt im öffentlichen Schlüssel (Option -C).
      - type: command
        run: stat -c %a id_ed25519
        stdout_matches: "^600$"
        message: Der private Schlüssel darf nur für dich lesbar sein (Rechte 600). ssh-keygen setzt das automatisch – hast du die Datei verändert?
    hints:
      - "Der Befehl heißt `ssh-keygen`. Mit `-t` wählst du den Typ, mit `-C` den Kommentar, mit `-f` den Dateinamen."
      - "Mit `-N \"\"` setzt du eine leere Passphrase, dann fragt ssh-keygen nicht nach."
      - "`ssh-keygen -t ed25519 -C \"user@example.com\" -f ./id_ed25519 -N \"\"`"
    solution: |
      ```bash
      cd schluessel
      ssh-keygen -t ed25519 -C "user@example.com" -f ./id_ed25519 -N ""
      cat id_ed25519.pub
      ```
      Im echten Alltag lässt du `-f` weg (dann landet der Schlüssel in `~/.ssh/id_ed25519`) und vergibst
      eine Passphrase.
  - id: ssh-verbindung-testen
    type: simulated
    title: Teste die SSH-Verbindung zu GitHub
    description: |
      Du hast deinen öffentlichen Schlüssel bei GitHub unter **Settings → SSH and GPG keys** eingetragen.
      Jetzt prüfst du die Verbindung und stellst dein bestehendes Repository von HTTPS auf SSH um.

      1. Teste die Anmeldung mit `ssh -T git@github.com`.
      2. Bestätige beim ersten Mal den Fingerabdruck mit `yes`.
      3. Zeige die aktuellen Remotes mit `git remote -v`.
      4. Stelle `origin` auf die SSH-Adresse `git@github.com:du/notizen.git` um.
    prompt: "du@laptop:~/notizen$"
    steps:
      - expect: "^ssh\\s+-T\\s+git@github\\.com$"
        output: |
          The authenticity of host 'github.com (192.0.2.30)' can't be established.
          ED25519 key fingerprint is SHA256:<fingerprint-von-github>.
          Are you sure you want to continue connecting (yes/no/[fingerprint])?
        hint: Tippe ssh -T git@github.com
      - expect: "^yes$"
        output: |
          Warning: Permanently added 'github.com' (ED25519) to the list of known hosts.
          Hi du! You've successfully authenticated, but GitHub does not provide shell access.
        prompt: "du@laptop:~/notizen$"
        hint: Vergleiche den Fingerabdruck mit der GitHub-Dokumentation und tippe dann yes.
      - expect: "^git\\s+remote\\s+-v$"
        output: |
          origin  https://github.com/du/notizen.git (fetch)
          origin  https://github.com/du/notizen.git (push)
        hint: git remote -v zeigt alle Remotes mit Adresse.
      - expect: "^git\\s+remote\\s+set-url\\s+origin\\s+git@github\\.com:du/notizen\\.git$"
        output: ""
        hint: git remote set-url origin <neue-adresse>
    responses:
      - match: "^git\\s+push"
        output: "Everything up-to-date"
      - match: "^ls"
        output: "README.md  ideen.txt"
---

Ein GitHub-Konto ist schnell angelegt: E-Mail-Adresse, Benutzername, Passwort, fertig. Doch dieses Konto
ist mehr als ein Forum-Login. Wer es übernimmt, kann Code in deine Projekte schmuggeln, Repositorys
löschen oder – bei Firmenkonten – auf fremden Code zugreifen. Deshalb lernst du in dieser Lektion zwei
Dinge: wie du das Konto selbst absicherst und wie sich **Git** bei GitHub anmeldet.

## Das Konto: Benutzername und E-Mail

Dein **Benutzername** wird Teil jeder Adresse (`github.com/<benutzername>`) und ist öffentlich. Wähle
einen, den du auch in Bewerbungen zeigen würdest. Die **E-Mail-Adresse** im Konto dient zur Anmeldung
und für Benachrichtigungen.

Wichtig ist die Verbindung zu Git: Jeder [[commit|Commit]] enthält Name und E-Mail aus deiner
[[git-konfiguration|Git-Konfiguration]]. GitHub ordnet Commits deinem Profil zu, wenn diese E-Mail in deinem Konto
hinterlegt ist. Wenn du deine echte Adresse nicht öffentlich in jedem Commit haben willst, bietet GitHub
eine anonyme `noreply`-Adresse an, die du in den E-Mail-Einstellungen findest.

```bash title="Git-Identität für GitHub einrichten"
git config --global user.name "Ada Beispiel"
git config --global user.email "123456+ada@users.noreply.github.com"
```

## Zwei-Faktor-Authentifizierung

Ein Passwort allein reicht nicht. Passwörter werden erraten, in Datenlecks veröffentlicht oder mit
gefälschten Login-Seiten abgegriffen. Die [[zwei-faktor-authentifizierung|Zwei-Faktor-Authentifizierung]]
(kurz 2FA) verlangt beim Anmelden einen **zweiten Beweis**: etwas, das du besitzt.

Die Analogie: Dein Passwort ist der Haustürschlüssel. 2FA ist der zusätzliche Code an der Alarmanlage.
Ein Dieb mit kopiertem Schlüssel kommt trotzdem nicht rein.

| Zweiter Faktor | Wie es funktioniert |
|---|---|
| Authenticator-App (TOTP) | Eine App erzeugt alle 30 Sekunden einen sechsstelligen Code |
| [[passkey|Passkey]] | Kryptografische Anmeldung über Fingerabdruck, Gesichtserkennung oder Geräte-PIN |
| Sicherheitsschlüssel | Ein kleiner USB- oder NFC-Stick |
| SMS | Code per SMS – nur als Notlösung, weil SMS abgefangen werden können |

GitHub verlangt 2FA inzwischen von allen, die Code beitragen. Beim Einrichten bekommst du
**Wiederherstellungscodes** (*recovery codes*). Speichere sie in einem Passwort-Manager oder drucke sie aus.
Verlierst du dein Handy und hast keine Codes, ist dein Konto im schlimmsten Fall verloren.

> [!MERKSATZ]
> 2FA aktivieren, Wiederherstellungscodes sicher ablegen, und zwar sofort nach dem Anlegen des Kontos –
> nicht erst, wenn etwas passiert ist.

## Wie sich Git anmeldet: zwei Wege

Sobald du `git push` tippst, muss Git beweisen, dass du schreiben darfst. Dein GitHub-Passwort
funktioniert dafür **nicht** – GitHub hat das schon vor Jahren abgeschaltet. Welcher der zwei Wege
genutzt wird, entscheidet die Adresse des Remotes:

```text title="Zwei Adressen für dasselbe Repository"
SSH:   git@github.com:du/notizen.git
HTTPS: https://github.com/du/notizen.git
```

| Weg | Stärken | Schwächen |
|---|---|---|
| **SSH** | einmal einrichten, nie wieder Passwörter | manche Firmennetze sperren Port 22 |
| **HTTPS** | funktioniert fast überall, Standard der GitHub CLI | braucht ein Token und einen Credential Helper |

Wechseln kannst du jederzeit mit `git remote set-url origin <neue-adresse>`. Die Commits bleiben
gleich, nur der Weg dorthin ändert sich.

## Weg 1: SSH-Schlüssel

[[ssh|SSH]] arbeitet mit einem [[ssh-schluessel|Schlüsselpaar]]. Stell dir den öffentlichen Schlüssel als
Vorhängeschloss vor, das du GitHub schenkst: Jeder darf es sehen, öffnen kann es nur dein privater Schlüssel.

```bash title="Schlüsselpaar erzeugen"
ssh-keygen -t ed25519 -C "user@example.com"
```

`-t ed25519` wählt einen modernen, sicheren Typ, `-C` ist nur ein Kommentar. Vergib eine
**Passphrase** – sonst ist der Schlüssel bei einem gestohlenen Laptop sofort benutzbar. Der `ssh-agent`
merkt sich den entsperrten Schlüssel für die Sitzung.

| Datei in `~/.ssh/` | Inhalt | Wohin? |
|---|---|---|
| `id_ed25519` | privater Schlüssel | bleibt auf dem Rechner, niemals teilen |
| `id_ed25519.pub` | öffentlicher Schlüssel | GitHub → **Settings → SSH and GPG keys** |

Getestet wird mit `ssh -T git@github.com`. Beim ersten Mal zeigt SSH einen **Fingerabdruck** – vergleiche
ihn mit den Werten in der GitHub-Dokumentation.

> [!ACHTUNG]
> Die Datei `id_ed25519` **ohne** `.pub` ist dein privater Schlüssel. Ist sie versehentlich hochgeladen
> oder verschickt, lösche den Schlüssel sofort bei GitHub und erzeuge einen neuen.

> [!PRAXIS]
> In vielen Teams hat jede Person einen Schlüssel **pro Gerät**. Geht ein Laptop verloren, wird genau
> dieser eine Schlüssel bei GitHub gelöscht – alle anderen funktionieren weiter.

## Weg 2: HTTPS mit Token

Bei [[https|HTTPS]] gibst du als „Passwort“ ein [[personal-access-token|Personal Access Token]] (PAT) ein.
Du erzeugst es in GitHub unter **Settings → Developer settings**.

| Token-Art | Eigenschaften |
|---|---|
| **Fine-grained** (empfohlen) | auf einzelne Repositorys begrenzt, feine Rechte, Ablaufdatum Pflicht |
| **Classic** | gilt für alle deine Repositorys, grobe Rechte-Bereiche |

Gib einem Token nur die nötigen Rechte und ein Ablaufdatum. Fine-grained Tokens beginnen mit
`github_pat_`, klassische mit `ghp_` – das hilft Scannern, veröffentlichte Tokens zu erkennen.

Damit du das Token nicht bei jedem Push einfügst, speichert ein [[credential-helper|Credential Helper]]
es im Schlüsselbund deines Betriebssystems. Am bequemsten: Git Credential Manager oder `gh auth login`.

> [!FEHLER]
> **Das Token in die Remote-Adresse schreiben**, etwa `https://ghp_abc…@github.com/du/app.git`. Dann
> steht es im Klartext in `.git/config` und in der Shell-Historie. Nutze immer einen Credential Helper.

## Zusammenfassung

- Dein Benutzername ist öffentlich, Commits werden über die E-Mail-Adresse deinem Profil zugeordnet.
- **2FA** schützt dein Konto mit einem zweiten Faktor; sichere die Wiederherstellungscodes.
- Git meldet sich nicht mit deinem Passwort an, sondern per **SSH-Schlüssel** oder **Token über HTTPS**.
- SSH: privater Schlüssel bleibt lokal, der öffentliche (`.pub`) kommt zu GitHub; testen mit `ssh -T git@github.com`.
- HTTPS: **fine-grained Personal Access Tokens** mit wenigen Rechten und Ablaufdatum, gespeichert über einen Credential Helper.
- Die Remote-Adresse entscheidet über den Weg; wechseln mit `git remote set-url`.
