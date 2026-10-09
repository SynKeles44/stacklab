---
title: Rebase und GitHub
summary: Wie rebase deine Commits auf eine neue Basis setzt, warum du geteilte Historie nie umschreibst und wie du dein Projekt per Token oder SSH zu GitHub bringst.
duration: 25
sources:
  - title: Pro Git – Rebasing
    url: https://git-scm.com/book/de/v2/Git-Branching-Rebasing
  - title: git-rebase Dokumentation
    url: https://git-scm.com/docs/git-rebase
  - title: GitHub Docs – Verbindung über SSH
    url: https://docs.github.com/de/authentication/connecting-to-github-with-ssh
  - title: GitHub REST API – Repository für den authentifizierten Benutzer erstellen
    url: https://docs.github.com/en/rest/repos/repos#create-a-repository-for-the-authenticated-user
quiz:
  - type: single
    question: Du bist auf `feat/suche` und führst `git rebase main` aus. Was passiert mit deinen zwei Feature-Commits?
    options:
      - Sie werden unverändert hinter `main` gehängt und behalten ihre Hashes.
      - Git erzeugt zwei neue Commits mit denselben Änderungen auf Basis von `main` – mit neuen Hashes.
      - Sie werden zu einem Merge-Commit zusammengefasst.
      - Sie landen auf dem Branch `main`.
    answer: 1
    explanation: >
      Rebase spielt deine Änderungen Commit für Commit auf der neuen Basis erneut ab. Weil sich der Elterncommit
      ändert, entstehen neue Commits mit neuen Hashes. `main` selbst bleibt unverändert.
  - type: match
    question: Was bewirkt das jeweilige Schlüsselwort im interaktiven Rebase?
    pairs:
      - { left: "pick", right: "Commit unverändert übernehmen" }
      - { left: "reword", right: "Nur die Commit-Message ändern" }
      - { left: "squash", right: "Mit dem vorherigen Commit verschmelzen, Messages kombinieren" }
      - { left: "fixup", right: "Mit dem vorherigen Commit verschmelzen, eigene Message verwerfen" }
      - { left: "drop", right: "Commit komplett weglassen" }
    explanation: >
      Im Editor ersetzt du das Wort `pick` vor einem Commit. `edit` (hier nicht dabei) hält an, damit du den
      Commit selbst noch ändern kannst.
  - type: cloze
    text: "Ein Rebase-Konflikt ist gelöst und vorgemerkt – weiter geht es mit `git rebase ___`. Willst du alles rückgängig machen, nutzt du `git rebase ___`."
    blanks:
      - ["--continue"]
      - ["--abort"]
    explanation: >
      `--continue` macht mit dem nächsten Commit weiter, `--abort` stellt den Zustand von vor dem Rebase wieder
      her. Mit `--skip` würdest du den aktuellen Commit auslassen.
  - type: find-bug
    question: Grace hat ihren schon gepushten Branch `feat/login` per Rebase aktualisiert. In welcher Zeile steckt das Risiko?
    language: bash
    code: |
      git switch feat/login
      git fetch origin
      git rebase origin/main
      git push --force
    bug_line: 4
    explanation: >
      Nach einem Rebase muss gepusht werden, weil sich die Hashes geändert haben. `--force` überschreibt aber
      blind – auch Commits, die eine Kollegin inzwischen auf `feat/login` gepusht hat. Sicherer ist
      `git push --force-with-lease`.
  - type: multiple
    question: Welche Aussagen über die Anmeldung bei GitHub stimmen?
    options:
      - Für Git über HTTPS nutzt du statt deines Passworts einen Personal Access Token.
      - Bei SSH lädst du den öffentlichen Schlüssel (`.pub`) bei GitHub hoch.
      - Den privaten Schlüssel schickst du an GitHub, damit es dich erkennt.
      - Ein Token sollte nur die Rechte und die Laufzeit haben, die du wirklich brauchst.
    answers: [0, 1, 3]
    explanation: >
      Der private Schlüssel verlässt nie deinen Rechner – GitHub bekommt nur den öffentlichen Teil. Tokens
      vergibst du sparsam: wenige Rechte, begrenzte Laufzeit, nur für die nötigen Repositorys.
tasks:
  - id: repo-per-api
    type: request
    title: Ein Repository per REST-API anlegen
    description: |
      Lege über die GitHub-REST-API ein neues, **privates** Repository namens `portfolio` an. Baue dazu
      den Request zusammen:

      - Methode und Pfad für „Repository für den angemeldeten Benutzer erstellen“
      - Header `Authorization` mit `Bearer <dein-token>` (nutze genau diesen Platzhalter, niemals einen echten Token)
      - Header `Accept: application/vnd.github+json` und `X-GitHub-Api-Version: 2026-03-10`
      - Header `Content-Type: application/json`
      - Einen JSON-Body mit `name` und `private`
    base_url: https://api.github.com
    expected:
      method: POST
      path: "^/user/repos$"
      headers:
        Authorization: "^Bearer\\s+\\S+"
        Accept: "application/vnd\\.github\\+json"
        X-GitHub-Api-Version: "^(2026-03-10|2022-11-28)$"
        Content-Type: "application/json"
      body_contains: ['"name"', '"portfolio"', '"private"']
    response:
      status: 201
      body: |
        {
          "id": 123456789,
          "name": "portfolio",
          "full_name": "dein-name/portfolio",
          "private": true,
          "visibility": "private",
          "owner": { "login": "dein-name", "type": "User" },
          "html_url": "https://github.com/dein-name/portfolio",
          "clone_url": "https://github.com/dein-name/portfolio.git",
          "ssh_url": "git@github.com:dein-name/portfolio.git",
          "default_branch": "main"
        }
    hints:
      - Etwas Neues anlegen heißt in REST fast immer `POST`. Der Pfad beginnt mit `/user/`.
      - 'Der Body ist JSON, z. B. `{"name": "portfolio", "private": true}`.'
    solution: |
      ```http
      POST /user/repos HTTP/1.1
      Host: api.github.com
      Authorization: Bearer <dein-token>
      Accept: application/vnd.github+json
      X-GitHub-Api-Version: 2026-03-10
      Content-Type: application/json

      {"name": "portfolio", "private": true}
      ```
  - id: erster-push-github
    type: simulated
    title: Das Projekt per SSH zu GitHub pushen
    description: |
      Dein SSH-Schlüssel ist bei GitHub hinterlegt, das leere Repository `dein-name/portfolio` existiert.
      Lokal hast du im Ordner `portfolio` schon einige Commits auf `main`.

      1. Teste die SSH-Verbindung mit `ssh -T git@github.com`.
      2. Lege das Remote `origin` mit der SSH-Adresse `git@github.com:dein-name/portfolio.git` an.
      3. Kontrolliere es mit `git remote -v`.
      4. Pushe `main` und setze dabei den Upstream.
    prompt: "du@laptop:~/portfolio$"
    steps:
      - expect: "^ssh\\s+-T\\s+git@github\\.com\\s*$"
        output: |
          Hi dein-name! You've successfully authenticated, but GitHub does not provide shell access.
        hint: Tippe ssh -T git@github.com
      - expect: "^git\\s+remote\\s+add\\s+origin\\s+git@github\\.com:dein-name/portfolio\\.git\\s*$"
        output: ""
        hint: "Die Form ist git remote add <name> <adresse> – also git remote add origin git@github.com:dein-name/portfolio.git"
      - expect: "^git\\s+remote\\s+-v\\s*$"
        output: |
          origin	git@github.com:dein-name/portfolio.git (fetch)
          origin	git@github.com:dein-name/portfolio.git (push)
        hint: Tippe git remote -v
      - expect: "^git\\s+push\\s+(-u|--set-upstream)\\s+origin\\s+main\\s*$"
        output: |
          Enumerating objects: 9, done.
          Counting objects: 100% (9/9), done.
          Delta compression using up to 8 threads
          Compressing objects: 100% (6/6), done.
          Writing objects: 100% (9/9), 1.21 KiB | 1.21 MiB/s, done.
          Total 9 (delta 1), reused 0 (delta 0), pack-reused 0 (from 0)
          To github.com:dein-name/portfolio.git
           * [new branch]      main -> main
          branch 'main' set up to track 'origin/main'.
        hint: Mit -u merkt sich Git die Verbindung – git push -u origin main
    responses:
      - match: "^git\\s+status"
        output: |
          On branch main
          nothing to commit, working tree clean
      - match: "^git\\s+log"
        output: |
          4e1a2b3 (HEAD -> main) docs: add project list
          9c8d7e6 feat: add about page
          1f2e3d4 docs: add readme
      - match: "^git\\s+push\\s+origin\\s*$"
        output: |
          fatal: The current branch main has no upstream branch.
          To push the current branch and set the remote as upstream, use

              git push --set-upstream origin main
    solution: |
      ```bash
      ssh -T git@github.com
      git remote add origin git@github.com:dein-name/portfolio.git
      git remote -v
      git push -u origin main
      ```
---

Dein Feature-Branch ist ein paar Tage alt, und auf `main` ist viel passiert. Ein Merge holt die
Neuerungen herein – mit einer Abzweigung mehr in der Historie. **Rebase** ist der zweite Weg. Danach
bringst du dein Projekt zu GitHub, wo du dich erst einmal ausweisen musst.

## Was rebase macht

[[rebase|Rebase]] heißt „neue Basis“. Stell dir deine Commits als Notizzettel auf einer alten Seite
vor: Rebase löst sie ab und klebt sie der Reihe nach auf die neueste Seite.

```bash title="feat/suche auf den neuesten Stand von main setzen"
git switch feat/suche
git rebase main
```

Git spielt jeden deiner Commits als Änderung erneut auf `main` ab. Weil sich der Elterncommit ändert,
entstehen **neue Commits mit neuen Hashes**. Die alten Commits existieren noch eine Weile, aber kein Branch
zeigt mehr auf sie. Genau das passiert übrigens auch bei `git pull --rebase` aus der letzten Lektion:
Deine lokalen Commits werden auf `origin/main` neu abgespielt.

![Merge und Rebase im Vergleich: gleiche Ausgangslage, unterschiedliche Historie](/assets/git/rebase-vs-merge.svg)

| | `git merge main` | `git rebase main` |
|---|---|---|
| Historie | Bleibt, plus [[merge-commit|Merge-Commit]] | Gerade Linie |
| Hashes deiner Commits | Unverändert | Neu |
| Konflikte | Einmal, gesammelt | Pro Commit, nacheinander |
| Typischer Einsatz | Fertiges Feature in `main` bringen | Eigenen Branch aktualisieren |

Bei einem [[merge-konflikt|Konflikt]] hält Git an. Du löst ihn wie beim Merge, schließt aber anders ab:
`git add <datei>` und `git rebase --continue`. Mit `git rebase --abort` kehrst du zum Zustand vor dem
Rebase zurück.

> [!MERKSATZ]
> Rebase verschiebt nicht, er **kopiert**: `E` wird zu `E'`. Gleicher Inhalt, neuer Hash.

## Die goldene Regel und interaktiver Rebase

Die wichtigste Regel: **Schreibe niemals Historie um, die andere schon haben.** Hat eine Kollegin deine
alten Commits geholt, passen nach deinem Rebase eure Historien nicht mehr zusammen. Eigene, private
Branches darfst du rebasen – gemeinsame Branches wie `main` werden nur gemergt.

Hast du einen **eigenen** Branch schon gepusht und dann rebased, lehnt der Server den normalen Push ab.
Jetzt brauchst du einen [[force-push|Force-Push]] – aber den vorsichtigen:

```bash title="Sicher überschreiben"
git push --force-with-lease
```

`--force-with-lease` überschreibt nur, wenn der Branch auf dem Server noch so aussieht, wie du ihn zuletzt
gesehen hast. Sonst bricht Git ab, statt fremde Arbeit zu löschen.

Vor einem [[pull-request|Pull Request]] räumst du mit dem [[interaktiver-rebase|interaktiven Rebase]]
Zwischenstände wie „WIP“ auf. `git rebase -i HEAD~3` öffnet deinen [[editor|Editor]] mit einer Liste:

| Befehl | Wirkung |
|---|---|
| `pick` | Commit übernehmen |
| `reword` | Message ändern |
| `squash` / `fixup` | Mit dem vorherigen verschmelzen (fixup verwirft die eigene Message) |
| `drop` | Commit löschen |

## GitHub anbinden: HTTPS oder SSH

[[git|Git]] ist das Programm auf deinem Rechner, [[github|GitHub]] ein Online-Dienst, der Repositorys als
Remotes bereitstellt. Für die Anmeldung gibt es zwei Wege:

| Weg | Adresse | Du brauchst |
|---|---|---|
| [[https|HTTPS]] | `https://github.com/dein-name/portfolio.git` | [[personal-access-token|Personal Access Token]] |
| [[ssh|SSH]] | `git@github.com:dein-name/portfolio.git` | [[ssh-schluessel|SSH-Schlüssel]] |

**HTTPS:** Dein GitHub-Passwort funktioniert für Git nicht. Du erzeugst unter *Settings → Developer
settings* einen Token – am besten *fine-grained*: nur ausgewählte Repositorys, wenige Rechte, mit
Ablaufdatum. Ein [[credential-helper|Credential Helper]] speichert ihn sicher.

**SSH:** Ein Schlüssel hat einen privaten Teil, der deinen Rechner nie verlässt, und einen öffentlichen
(`.pub`), den du unter *Settings → SSH and GPG keys* hinterlegst.

```bash title="Schlüssel erzeugen und Verbindung testen"
ssh-keygen -t ed25519 -C "user@example.com"
cat ~/.ssh/id_ed25519.pub
ssh -T git@github.com
```

Antwortet GitHub mit `Hi dein-name! You've successfully authenticated`, klappt alles. Beim allerersten
Verbinden fragt SSH, ob du dem Host vertraust – vergleiche den Fingerabdruck mit dem aus der GitHub-Doku,
bevor du `yes` tippst.

> [!FEHLER]
> **Den Token in die Remote-Adresse schreiben**, etwa `https://<dein-token>@github.com/...`. Dann steht
> er im Klartext in `.git/config` und in der Shell-Historie. Überlass das Speichern dem Credential Helper
> und widerrufe einen sichtbar gewordenen Token sofort.

## Repository anlegen und erster Push

Ein neues Repository legst du über die Weboberfläche (*New repository*), mit `gh repo create portfolio
--private` oder über die REST-[[api|API]] an. Lass „Add a README“ leer, damit dein lokaler Stand ohne
Konflikt hineinpasst.

Per API brauchst du einen Token im [[http-header|Header]] `Authorization` und einen [[json|JSON]]-Body:

```bash title="Repository per API anlegen"
curl -X POST https://api.github.com/user/repos \
  -H "Authorization: Bearer <dein-token>" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2026-03-10" \
  -d '{"name": "portfolio", "private": true}'
```

Danach verbindest du dein lokales Repository und lädst es hoch:

```bash title="Lokales Projekt mit GitHub verbinden"
git remote add origin git@github.com:dein-name/portfolio.git
git push -u origin main
```

> [!PRAXIS]
> Im Team pushst du einen Feature-Branch und öffnest einen Pull Request. Feature-Branches gehören oft
> einer Person und dürfen vor dem Review gerebased werden – mit `--force-with-lease`. Auf `main` ist
> Force-Push serverseitig verboten.

## Zusammenfassung

- `git rebase main` spielt deine Commits auf der neuesten Basis ab – mit **neuen Hashes** und gerader Historie.
- Konflikte: lösen, `git add`, `git rebase --continue`; Ausweg: `--abort`.
- Goldene Regel: Geteilte Historie nie umschreiben. Eigene gepushte Branches nach dem Rebase mit
  `git push --force-with-lease` aktualisieren.
- `git rebase -i` räumt Commits auf: `pick`, `reword`, `squash`, `fixup`, `drop`.
- GitHub-Anmeldung: HTTPS mit **Personal Access Token** oder SSH mit **Schlüssel** (`ssh-keygen -t ed25519`).
- `git remote add origin <adresse>` und `git push -u origin main` bringen dein Projekt online.
