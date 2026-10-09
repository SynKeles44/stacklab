---
title: Geheimnisse niemals committen
summary: Warum Passwörter, Tokens und Schlüssel nie in ein Repository gehören, wie .env-Dateien und .gitignore helfen und was Secret Scanning und Push Protection tun.
duration: 25
sources:
  - title: GitHub Docs – Informationen zu Secret Scanning
    url: https://docs.github.com/de/code-security/secret-scanning/introduction/about-secret-scanning
  - title: GitHub Docs – Push Protection
    url: https://docs.github.com/de/code-security/secret-scanning/introduction/about-push-protection
  - title: gitignore Dokumentation
    url: https://git-scm.com/docs/gitignore
quiz:
  - type: single
    question: Du hast versehentlich ein echtes API-Token in ein öffentliches Repository gepusht. Was ist der wichtigste erste Schritt?
    options:
      - Den Commit mit git revert rückgängig machen
      - Das Token beim Anbieter sofort widerrufen und ein neues erzeugen
      - Das Repository auf privat stellen
    answer: 1
    explanation: Ein veröffentlichtes Geheimnis gilt als verbrannt. Bots durchsuchen öffentliche Repositorys in Sekunden. Nur das Widerrufen (Rotieren) macht das alte Token wertlos – revert oder privat stellen löschen es nicht aus der Historie oder aus fremden Kopien.
  - type: multiple
    question: Welche Dateien gehören typischerweise NICHT ins Repository?
    options:
      - ".env"
      - ".env.example"
      - "id_ed25519"
      - "README.md"
      - "credentials.json mit echten Zugangsdaten"
    answers: [0, 2, 4]
    explanation: .env, private Schlüssel und Dateien mit echten Zugangsdaten bleiben lokal. .env.example enthält nur die Namen der Variablen ohne echte Werte und wird bewusst committet.
  - type: find-bug
    question: Ein Team will verhindern, dass die lokale Konfiguration im Repository landet. Welche Zeile der .gitignore ist falsch?
    language: bash
    code: |
      node_modules/
      .env.example
      dist/
      *.log
    bug_line: 2
    explanation: .env.example ist die Vorlage für alle im Team und soll committet werden. Ignoriert werden muss .env – die Datei mit den echten Werten.
  - type: cloze
    text: GitHubs Funktion ___ Protection blockiert einen Push, wenn darin ein erkanntes Geheimnis steckt. Die Werte für deine lokale Umgebung liegen in der Datei `.___`.
    blanks:
      - [Push]
      - [env]
    explanation: Push Protection prüft Pushes, bevor sie gespeichert werden. In .env stehen die echten Werte, die nie committet werden.
tasks:
  - id: env-absichern
    type: terminal
    title: Sichere die .env-Datei ab
    description: |
      Im Ordner `geheimnisse` liegt ein kleines Projekt mit einem Commit. Daneben liegt eine Datei `.env`
      mit (erfundenen) Zugangsdaten. Sie ist noch nicht committet – und das soll so bleiben.

      1. Lege eine `.gitignore` an, die `.env` ignoriert.
      2. Lege eine Vorlage `.env.example` an, die **dieselben Variablennamen** wie `.env` enthält
         (`DB_HOST`, `DB_PASSWORD`, `API_TOKEN`), aber **ohne** die echten Werte.
      3. Committe `.gitignore` und `.env.example` in einem neuen Commit.
      4. `.env` muss auf deiner Festplatte bleiben.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: geheimnisse
    setup: |
      git init -q
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      printf 'const host = process.env.DB_HOST;\nconsole.log(`Verbinde mit ${host}`);\n' > app.js
      git add app.js
      git commit -q -m "feat: add app entry"
      printf 'DB_HOST=db.example.com\nDB_PASSWORD=uebungs-passwort-123\nAPI_TOKEN=uebung-token-nicht-echt\n' > .env
    checks:
      - type: file_exists
        path: .env
        message: .env soll lokal erhalten bleiben – lösche sie nicht, ignoriere sie nur.
      - type: file_contains
        path: .gitignore
        pattern: "^/?\\.env\\s*$"
        message: In .gitignore fehlt eine Zeile, die .env ignoriert.
      - type: command
        run: git ls-files .env
        stdout_equals: ""
        message: .env ist im Repository gelandet. Nimm sie mit git rm --cached .env wieder heraus.
      - type: command
        run: git ls-files .env.example .gitignore | sort | tr '\n' ' '
        stdout_matches: "\\.env\\.example \\.gitignore"
        message: .env.example und .gitignore müssen beide committet sein.
      - type: file_contains
        path: .env.example
        pattern: "API_TOKEN"
        message: .env.example soll alle Variablennamen aus .env enthalten (auch API_TOKEN).
      - type: command
        run: "! grep -qE 'uebungs-passwort-123|uebung-token' .env.example"
        message: In .env.example stehen noch echte Werte. Lass die Werte leer, z. B. DB_PASSWORD=
      - type: command
        run: git status --porcelain --untracked-files=all | grep -c . || true
        stdout_matches: "^0$"
        message: Es gibt noch nicht committete Änderungen. Committe .gitignore und .env.example.
    hints:
      - "Eine `.gitignore` ist eine einfache Textdatei. Jede Zeile ist ein Muster, z. B. `.env`."
      - "`sed 's/=.*/=/' .env > .env.example` übernimmt die Namen und schneidet die Werte ab."
      - "Danach `git add .gitignore .env.example` und `git commit -m \"chore: ignore env file\"`."
    solution: |
      ```bash
      cd geheimnisse
      echo ".env" > .gitignore
      sed 's/=.*/=/' .env > .env.example
      cat .env.example        # DB_HOST=  DB_PASSWORD=  API_TOKEN=
      git status              # .env taucht nicht mehr auf
      git add .gitignore .env.example
      git commit -m "chore: ignore local env file"
      ```
  - id: push-protection
    type: simulated
    title: Push Protection schlägt Alarm
    description: |
      Du hast `.env` versehentlich mitcommittet und willst pushen. GitHub blockiert den Push.
      Der Commit ist noch **nicht** auf GitHub – du kannst ihn lokal reparieren.

      1. Versuche zu pushen: `git push`.
      2. Nimm den letzten Commit zurück, behalte aber die Änderungen vorgemerkt: `git reset --soft HEAD~1`.
      3. Nimm `.env` aus dem Staging-Bereich: `git restore --staged .env`.
      4. Trage `.env` in die `.gitignore` ein: `echo ".env" >> .gitignore`.
      5. Merke `.gitignore` vor und committe erneut, dann pushe noch einmal.
    prompt: "du@laptop:~/shop$"
    steps:
      - expect: "^git\\s+push"
        output: |
          remote: error: GH013: Repository rule violations found for refs/heads/main.
          remote:
          remote: - GITHUB PUSH PROTECTION
          remote:   Resolve the following violations before pushing again
          remote:
          remote:   - Push cannot contain secrets
          remote:
          remote:     GitHub Personal Access Token
          remote:       locations:
          remote:         - commit: 3f2c1ab
          remote:           path: .env:3
          remote:
          To github.com:du/shop.git
           ! [remote rejected] main -> main (push declined due to repository rule violations)
          error: failed to push some refs to 'github.com:du/shop.git'
        hint: Tippe git push und lies die Fehlermeldung genau.
      - expect: "^git\\s+reset\\s+--soft\\s+HEAD(~1|\\^)$"
        output: ""
        hint: git reset --soft HEAD~1 nimmt den Commit zurück, die Änderungen bleiben vorgemerkt.
      - expect: "^git\\s+(restore\\s+--staged|rm\\s+--cached)\\s+\\.env$"
        output: ""
        hint: git restore --staged .env nimmt die Datei aus dem Staging-Bereich.
      - expect: "^echo\\s+[\"']?\\.env[\"']?\\s+>>\\s+\\.gitignore$"
        output: ""
        hint: Mit >> hängst du eine Zeile an die .gitignore an.
      - expect: "^git\\s+add\\s+\\.gitignore$"
        output: ""
        hint: git add .gitignore
      - expect: "^git\\s+commit\\s+-m\\s+.+"
        output: |
          [main 7d4e9a2] feat: add checkout page
           3 files changed, 42 insertions(+)
        hint: 'Committe mit einer Nachricht, z. B. git commit -m "feat: add checkout page"'
      - expect: "^git\\s+push"
        output: |
          Enumerating objects: 7, done.
          Writing objects: 100% (5/5), 1.12 KiB | 1.12 MiB/s, done.
          To github.com:du/shop.git
             a1b2c3d..7d4e9a2  main -> main
        hint: Jetzt noch einmal git push.
    responses:
      - match: "^git\\s+status"
        output: |
          On branch main
          Changes to be committed:
                  new file:   checkout.js
                  modified:   .gitignore
      - match: "^cat\\s+\\.env"
        output: "API_TOKEN=<dein-token>"
---

Ein Entwickler will nur kurz etwas ausprobieren, schreibt sein Cloud-Passwort direkt in den Code,
committet und pusht in ein öffentliches Repository. Wenige Minuten später laufen auf seinem Konto
Dutzende teure Server, die jemand anders gestartet hat. Solche Geschichten passieren jeden Tag.
In dieser Lektion lernst du, wie du dafür sorgst, dass dir das nie passiert.

## Was ist ein Geheimnis?

Ein [[secret|Geheimnis]] (englisch *secret*) ist jede Information, mit der man sich als du oder als deine
Anwendung ausweisen kann:

- Passwörter für Datenbanken oder Mailserver
- [[api|API]]-Schlüssel und [[personal-access-token|Tokens]] (GitHub, Zahlungsanbieter, Cloud-Dienste)
- private [[ssh-schluessel|SSH-Schlüssel]] und Zertifikatsschlüssel
- Verbindungs-URLs, in denen ein Passwort steckt, z. B. `postgres://admin:geheim@db.example.com/shop`

Die Regel ist einfach und ohne Ausnahme: **Geheimnisse gehören nie in ein Repository** – nicht in
öffentliche, und auch nicht in private.

## Warum auch private Repositorys tabu sind

„Mein Repository ist privat, da sieht das keiner.“ Leider falsch gedacht:

1. **Die Historie vergisst nichts.** Selbst wenn du die Datei im nächsten Commit löschst, steckt das
   Geheimnis im alten Commit. Jeder, der das Repository klont, bekommt alle alten Commits mit.
2. **Zugriff ändert sich.** Neue Kolleg:innen, externe Dienstleister, ein späterer Wechsel auf
   öffentlich – jede dieser Personen sieht plötzlich alle jemals committeten Passwörter.
3. **Kopien wandern.** [[fork|Forks]], Klone auf Laptops, Backups, CI-Systeme: Ein Repository existiert
   an vielen Orten. Du kannst nicht alle Kopien zurückholen.
4. **Bots sind schnell.** Öffentliche Repositorys werden automatisiert nach Tokens durchsucht. Zwischen
   Push und Missbrauch liegen manchmal nur Sekunden.

> [!MERKSATZ]
> Ein Geheimnis, das einmal in einem gepushten Commit stand, gilt als **verbrannt**. Löschen hilft nicht –
> nur **widerrufen und neu erzeugen** (rotieren).

## Die .env-Datei: Werte außerhalb des Codes

Wie bekommt deine Anwendung ihre Passwörter, wenn sie nicht im Code stehen dürfen? Über
[[umgebungsvariable|Umgebungsvariablen]]. Das sind benannte Werte, die das Betriebssystem einem Programm
mitgibt. Der Code liest nur den **Namen** der Variablen, den **Wert** liefert die Umgebung.

```js title="app.js – der Code kennt nur den Namen"
const password = process.env.DB_PASSWORD
```

Für die lokale Entwicklung schreibt man diese Werte in eine [[env-datei|.env-Datei]] im Projektordner.
Frameworks wie Laravel oder Vite lesen sie beim Start automatisch ein:

```bash title=".env – bleibt auf deinem Rechner"
DB_HOST=localhost
DB_PASSWORD=mein-lokales-passwort
API_TOKEN=<dein-token>
```

Damit Kolleg:innen wissen, **welche** Variablen sie brauchen, committet man eine Vorlage ohne Werte:

```bash title=".env.example – kommt ins Repository"
DB_HOST=
DB_PASSWORD=
API_TOKEN=
```

Und damit `.env` nie versehentlich mit `git add .` mitrutscht, steht sie in der
[[gitignore|.gitignore]]:

```text title=".gitignore"
.env
```

| Datei | Inhalt | Committen? |
|---|---|---|
| `.env` | echte Werte für deinen Rechner | **nein**, steht in `.gitignore` |
| `.env.example` | nur Variablennamen, evtl. harmlose Standardwerte | **ja** |
| `.gitignore` | Liste der ignorierten Muster | **ja** |

> [!FEHLER]
> **Die `.gitignore` erst nach dem Commit anlegen.** Eine Datei, die Git bereits verfolgt, wird durch
> einen späteren Eintrag in der `.gitignore` **nicht** entfernt. Du musst sie zusätzlich mit
> `git rm --cached .env` aus dem Index nehmen – und wenn der Commit schon gepusht war, das Geheimnis rotieren.

## GitHubs Schutznetz: Secret Scanning und Push Protection

GitHub hilft dir mit zwei Funktionen, die zusammenarbeiten:

**[[secret-scanning|Secret Scanning]]** durchsucht Repositorys nach bekannten Geheimnis-Mustern – etwa
Tokens, die mit `ghp_` oder `github_pat_` beginnen, oder Schlüssel großer Cloud-Anbieter. Findet GitHub
einen Treffer, bekommst du eine Warnung. Viele Anbieter arbeiten mit GitHub zusammen und widerrufen
gefundene Tokens sogar automatisch.

**[[push-protection|Push Protection]]** geht einen Schritt weiter: Sie prüft deinen Push, **bevor** er
gespeichert wird. Enthält ein Commit ein erkanntes Geheimnis, lehnt GitHub den ganzen Push ab. Das ist
der beste Moment, denn der Commit existiert noch nirgends außer auf deinem Rechner. Für öffentliche
Repositorys ist dieser Schutz für alle Konten standardmäßig aktiv; für Organisationen lässt er sich in
den Sicherheitseinstellungen erzwingen.

Wird ein Push blockiert, reparierst du den Commit lokal: Commit zurücknehmen, Geheimnis entfernen,
neu committen. Den Button zum „Trotzdem erlauben“ gibt es zwar, er ist aber nur für echte Fehlalarme
gedacht, etwa Testdaten.

> [!ACHTUNG]
> Secret Scanning kennt nur **bekannte Muster**. Ein selbst ausgedachtes Datenbankpasswort wie
> `Sommer2026!` erkennt es nicht. Die Werkzeuge sind ein Sicherheitsnetz, keine Ausrede für Unachtsamkeit.

## Wenn es doch passiert ist

Die Reihenfolge ist entscheidend:

1. **Rotieren:** Das Geheimnis beim Anbieter sofort widerrufen und ein neues erzeugen. Erst das stoppt
   den Schaden.
2. **Prüfen:** In den Logs des Anbieters nachsehen, ob es missbraucht wurde.
3. **Aufräumen:** Neues Geheimnis in `.env` oder in den [[secret|Secrets]] der Plattform ablegen,
   `.gitignore` ergänzen.
4. **Optional Historie bereinigen:** Mit Werkzeugen wie `git filter-repo` lässt sich die Datei aus allen
   Commits entfernen. Das ist aufwendig, alle müssen neu klonen – und es ersetzt Schritt 1 nie.

> [!PRAXIS]
> In professionellen Teams liegen Produktionsgeheimnisse gar nicht auf Entwickler-Laptops, sondern in
> einem zentralen Secret-Store oder in den verschlüsselten Secrets von GitHub Actions. Entwickler:innen
> kennen oft nur die Werte ihrer lokalen Testdatenbank. Viele Teams lassen zusätzlich vor jedem Commit
> einen Secret-Scanner als Git-Hook laufen.

## Zusammenfassung

- **Geheimnisse** (Passwörter, Tokens, private Schlüssel) gehören in kein Repository – auch nicht in private.
- Ein gepushtes Geheimnis ist **verbrannt**: zuerst widerrufen und neu erzeugen, dann aufräumen.
- Echte Werte stehen in `.env` (ignoriert), die Vorlage `.env.example` ohne Werte wird committet.
- Eine `.gitignore` wirkt nur auf noch nicht verfolgte Dateien; sonst zusätzlich `git rm --cached`.
- **Secret Scanning** findet bekannte Muster, **Push Protection** blockiert sie schon beim Push.
- Die Werkzeuge sind ein Netz – deine Sorgfalt mit `git status` vor jedem Commit bleibt der erste Schutz.
