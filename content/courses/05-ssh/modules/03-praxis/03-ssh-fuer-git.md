---
title: SSH-Schlüssel für Git und GitHub
summary: Schlüssel bei GitHub hinterlegen, Remotes auf SSH umstellen, zwei Konten trennen und Commits mit SSH signieren.
duration: 25
sources:
  - title: GitHub Docs – Connecting to GitHub with SSH
    url: https://docs.github.com/en/authentication/connecting-to-github-with-ssh
  - title: GitHub Docs – About commit signature verification
    url: https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification
  - title: git-config – gpg.format, user.signingKey, gpg.ssh.allowedSignersFile
    url: https://git-scm.com/docs/git-config
  - title: ssh-keygen(1) – Abschnitt ALLOWED SIGNERS
    url: https://man.openbsd.org/ssh-keygen#ALLOWED_SIGNERS
quiz:
  - type: single
    question: "Mit welchem Benutzer verbindest du dich per SSH zu GitHub?"
    options:
      - Mit deinem GitHub-Benutzernamen
      - Mit git – GitHub erkennt dich am Schlüssel
      - Mit root
      - Mit deiner E-Mail-Adresse
    answer: 1
    explanation: >
      Alle verbinden sich als git@github.com. Welches Konto du bist, erkennt GitHub ausschließlich
      daran, welcher öffentliche Schlüssel zur Signatur passt.
  - type: match
    question: Welche Remote-Adresse nutzt welches Verfahren?
    pairs:
      - { left: "https://github.com/example/shop.git", right: "HTTPS mit Token" }
      - { left: "git@github.com:example/shop.git", right: "SSH mit Standard-Schlüssel" }
      - { left: "git@github-arbeit:example/shop.git", right: "SSH über einen Alias aus der ssh-Config" }
    explanation: Die SSH-Form hat einen Doppelpunkt zwischen Host und Pfad. Statt github.com darf dort jeder Alias aus deiner ssh-Config stehen.
  - type: find-bug
    question: Ada hat zwei GitHub-Konten. Pushes ins Firmen-Repository landen trotzdem mit ihrem privaten Schlüssel und scheitern. Welche Zeile fehlt bzw. ist falsch?
    language: text
    code: |
      Host github-arbeit
        HostName github.com
        User git
        IdentityFile ~/.ssh/id_ed25519_arbeit
        IdentitiesOnly no
    bug_line: 5
    explanation: >
      Mit IdentitiesOnly no bietet ssh zuerst alle Schlüssel aus dem Agent an – oft den privaten. GitHub
      akzeptiert ihn (er gehört ja zu einem gültigen Konto) und Ada ist im falschen Konto. Richtig ist IdentitiesOnly yes.
  - type: match
    question: Welche Einstellung bewirkt was?
    pairs:
      - { left: "gpg.format ssh", right: "SSH statt GPG zum Signieren verwenden" }
      - { left: "user.signingkey", right: "Welcher Schlüssel signiert" }
      - { left: "commit.gpgsign true", right: "Jeden Commit automatisch signieren" }
      - { left: "gpg.ssh.allowedSignersFile", right: "Liste vertrauenswürdiger Schlüssel zum Prüfen" }
    explanation: Die Einstellungen heißen aus historischen Gründen „gpg“, gelten mit gpg.format ssh aber für SSH-Schlüssel.
  - type: cloze
    text: "`git log --format='%G?'` zeigt ___ für eine gültige Signatur und ___ für einen Commit ohne Signatur."
    blanks:
      - [G]
      - [N]
    explanation: G = good, N = no signature. Daneben gibt es z. B. B (bad) und U (good, aber Vertrauen unbekannt).
tasks:
  - id: commit-signieren
    type: terminal
    title: Deinen ersten signierten Commit erstellen
    description: |
      Im Ordner `signieren` liegen ein Schlüsselpaar `signing-key` (ohne Passphrase) und das
      Repository `projekt` mit einem unsignierten Commit.

      1. Wechsle in `projekt` und stelle das Repository (lokal, ohne `--global`) auf SSH-Signaturen um:
         `gpg.format ssh`, `user.signingkey` mit dem **absoluten** Pfad zu `signing-key.pub`, `commit.gpgsign true`.
      2. Lege im Ordner `signieren` die Datei `allowed_signers` an: `ada@example.com namespaces="git" ` gefolgt vom Inhalt von `signing-key.pub`.
      3. Trage sie mit absolutem Pfad als `gpg.ssh.allowedSignersFile` ein.
      4. Ändere `README.md` und erstelle einen Commit. Prüfe ihn mit `git log --show-signature -1`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: signieren
    setup: |
      ssh-keygen -q -t ed25519 -N "" -C "ada@example.com" -f signing-key
      git init -q projekt
      cd projekt
      git config user.name "Ada"
      git config user.email "ada@example.com"
      echo "# Projekt" > README.md
      git add README.md
      git commit -q -m "chore: initial commit"
    checks:
      - type: command
        run: git -C projekt log --oneline | wc -l
        stdout_matches: "^\\s*2\\s*$"
        message: Es sollte genau einen neuen Commit geben (insgesamt 2).
      - type: command
        run: git -C projekt config --get gpg.format
        stdout_equals: ssh
        message: gpg.format ist im Repository noch nicht auf ssh gesetzt.
      - type: command
        run: git -C projekt config --get commit.gpgsign
        stdout_equals: "true"
        message: commit.gpgsign ist noch nicht auf true gesetzt.
      - type: command
        run: git -C projekt log -1 --format='%G? %GS'
        stdout_equals: G ada@example.com
        message: Der neueste Commit hat noch keine gültige Signatur von ada@example.com. Sind allowed_signers und gpg.ssh.allowedSignersFile eingerichtet?
      - type: command
        run: git -C projekt verify-commit HEAD
        message: git verify-commit HEAD schlägt noch fehl.
    hints:
      - "`$PWD` liefert den absoluten Pfad des aktuellen Ordners – z. B. `git config user.signingkey \"$PWD/../signing-key.pub\"` aus `projekt` heraus."
      - "Die allowed_signers-Zeile baust du mit `echo \"ada@example.com namespaces=\\\"git\\\" $(cat signing-key.pub)\" > allowed_signers` im Ordner signieren."
      - "Ist der Commit schon unsigniert entstanden, signiere ihn nachträglich mit `git commit --amend --no-edit -S`."
    solution: |
      ```bash
      cd signieren
      echo "ada@example.com namespaces=\"git\" $(cat signing-key.pub)" > allowed_signers
      cd projekt
      git config gpg.format ssh
      git config user.signingkey "$(cd .. && pwd)/signing-key.pub"
      git config commit.gpgsign true
      git config gpg.ssh.allowedSignersFile "$(cd .. && pwd)/allowed_signers"
      echo "Signiert!" >> README.md
      git commit -am "docs: extend readme"
      git log --show-signature -1
      ```
  - id: github-testen
    type: simulated
    title: Verbindung zu GitHub testen
    description: |
      Dein privater Schlüssel liegt in `~/.ssh/id_ed25519`, der Arbeits-Schlüssel ist über den Alias
      `github-arbeit` eingerichtet.

      1. Teste die Verbindung mit dem Standard-Schlüssel: `ssh -T git@github.com`.
      2. Teste den Arbeits-Alias: `ssh -T git@github-arbeit`.
      3. Pushe im Firmen-Repository mit `git push origin main`.
    prompt: "du@laptop:~/shop$"
    steps:
      - expect: "^ssh\\s+-T\\s+git@github\\.com\\s*$"
        output: "Hi ada-privat! You've successfully authenticated, but GitHub does not provide shell access."
        hint: ssh -T git@github.com
      - expect: "^ssh\\s+-T\\s+git@github-arbeit\\s*$"
        output: "Hi ada-arbeit! You've successfully authenticated, but GitHub does not provide shell access."
        hint: ssh -T git@github-arbeit
      - expect: "^git\\s+push(\\s+origin\\s+main)?\\s*$"
        output: |
          Enumerating objects: 5, done.
          Counting objects: 100% (5/5), done.
          Writing objects: 100% (3/3), 312 bytes | 312.00 KiB/s, done.
          To github-arbeit:example/shop.git
             4f1c2a9..8b3e7d1  main -> main
    responses:
      - match: "^ssh\\s+git@github\\.com\\s*$"
        output: |
          PTY allocation request failed on channel 0
          Hi ada-privat! You've successfully authenticated, but GitHub does not provide shell access.
          Connection to github.com closed.
    solution: |
      ```bash
      ssh -T git@github.com        # Hi ada-privat!
      ssh -T git@github-arbeit     # Hi ada-arbeit!
      git push origin main
      ```
---

Jedes `git push` zu einer Adresse wie `git@github.com:…` ist eine SSH-Verbindung. Mit einem
Schlüssel entfällt das Eintippen von Tokens, mit einem Alias trennst du privat und Arbeit – und
derselbe Schlüssel kann beweisen, dass ein Commit wirklich von dir stammt.

## Den Schlüssel bei GitHub hinterlegen und testen

1. Inhalt der `.pub`-Datei kopieren: `cat ~/.ssh/id_ed25519.pub`.
2. Auf [[github|GitHub]]: **Settings → SSH and GPG keys → New SSH key**, Typ **Authentication Key**.
3. Verbindung testen:

```bash title="Terminal"
ssh -T git@github.com
```

```text title="Ausgabe"
Hi ada-privat! You've successfully authenticated, but GitHub does not provide shell access.
```

Alle verbinden sich als Benutzer `git` – GitHub erkennt dich allein am Schlüssel. Deshalb begrüßt
dich die Antwort mit deinem Kontonamen. Die Option `-T` verzichtet auf ein Terminal, denn eine Shell
bietet GitHub ohnehin nicht an. Den Titel des Schlüssels wählst du so, dass du das Gerät
wiedererkennst, etwa „Laptop 2026“. GitHub zeigt außerdem den SHA256-Fingerprint an – vergleiche ihn
mit `ssh-keygen -l -f ~/.ssh/id_ed25519.pub`. Vergleiche beim
ersten Kontakt den Host-Key mit den Fingerprints aus der GitHub-Dokumentation. Ist Port 22 gesperrt,
hilft `ssh.github.com` auf Port 443.

## Remotes auf SSH umstellen

| Form | Beispiel | Anmeldung |
|---|---|---|
| HTTPS | `https://github.com/example/shop.git` | Token |
| SSH | `git@github.com:example/shop.git` | SSH-Schlüssel |

```bash title="Remote umstellen"
git remote set-url origin git@github.com:example/shop.git
git remote -v
```

> [!FEHLER]
> **Zwei Konten, ein Agent.** Ohne `IdentitiesOnly yes` bietet `ssh` zuerst die Schlüssel aus dem
> Agent an. GitHub nimmt den ersten, der zu irgendeinem Konto passt – und du landest im falschen.

Für ein zweites Konto brauchst du einen zweiten Schlüssel und einen Alias in der
[[ssh-config|ssh-Config]]:

```text title="~/.ssh/config"
Host github-arbeit
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_arbeit
  IdentitiesOnly yes
```

Im Firmen-Repository lautet der Remote dann `git@github-arbeit:example/shop.git`. Git ruft `ssh`
mit dem Alias auf, `ssh` liest die Config, ersetzt den Alias durch `github.com` und wählt den
Arbeits-Schlüssel. Einen Schlüssel darfst du übrigens nur bei **einem** GitHub-Konto als
Authentication Key hinterlegen – deshalb führt an zwei Schlüsseln kein Weg vorbei.

## Commits mit SSH signieren

Name und E-Mail im Commit kann jeder frei eintragen. Eine [[commit-signatur|Commit-Signatur]] mit
deinem [[privater-schluessel|privaten Schlüssel]] beweist dagegen die Herkunft – und dass der Commit
nicht verändert wurde. Weil jeder Commit den Hash seines Vorgängers enthält, sichert eine Signatur
zugleich die Geschichte bis zu diesem Punkt ab. Früher brauchte man dafür GPG, heute genügt dein
vorhandener SSH-Schlüssel.

```bash title="Einrichten"
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519.pub
git config --global commit.gpgsign true
```

Zum Prüfen braucht Git eine Liste vertrauenswürdiger Schlüssel:

```text title="~/.ssh/allowed_signers"
ada@example.com namespaces="git" ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDjYpZi1M7FQ8BPF2tj+tPY0a8dBps1c1p7xxuuMEoij
```

```bash title="Prüfen"
git config --global gpg.ssh.allowedSignersFile ~/.ssh/allowed_signers
git log --show-signature -1
git log --format='%h %G? %GS'      # G = gültig, N = keine Signatur
```

> [!MERKSATZ]
> Signiert wird mit dem privaten, geprüft mit dem öffentlichen Schlüssel. In `user.signingkey`
> steht trotzdem der Pfad zur `.pub`-Datei – Git findet den privaten Teil daneben oder im Agent.

## „Verified“ bei GitHub

Hinterlege denselben öffentlichen Schlüssel ein zweites Mal, diesmal mit dem Typ **Signing Key**.
Danach zeigt GitHub deine Commits als **Verified** – sofern die Commit-E-Mail in deinem Konto
bestätigt ist.

> [!PRAXIS]
> Viele Teams schützen ihren Haupt-Branch mit „Require signed commits“. Für Server, die nur ein
> einzelnes Repository klonen sollen, nutzt man **Deploy Keys** – Schlüssel, die nur für genau
> dieses Repository gelten.

## Zusammenfassung

- Öffentlichen Schlüssel bei GitHub hinterlegen, mit `ssh -T git@github.com` testen; alle nutzen den Benutzer `git`.
- SSH-Remotes haben die Form `git@host:besitzer/repo.git`; umstellen mit `git remote set-url`.
- Zwei Konten: zwei Schlüssel, ein Host-Alias und `IdentitiesOnly yes`.
- Signieren: `gpg.format ssh`, `user.signingkey`, `commit.gpgsign true`; prüfen mit `allowed_signers`.
- Als Signing Key bei GitHub hinterlegt, erscheinen Commits als „Verified“.
