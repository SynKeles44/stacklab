---
title: .env und .env.example
summary: Warum Einstellungen und Geheimnisse in Umgebungsvariablen gehören, wie .env und .env.example zusammenspielen und warum du nie ein Geheimnis committest.
duration: 20
sources:
  - title: The Twelve-Factor App – Config
    url: https://12factor.net/config
  - title: Laravel – Configuration (Environment Configuration)
    url: https://laravel.com/docs/configuration#environment-configuration
  - title: Vite – Env Variables and Modes
    url: https://vite.dev/guide/env-and-mode
quiz:
  - type: single
    question: Was gehört in die `.env.example`?
    options:
      - Alle Variablen mit den echten Passwörtern des Produktivservers.
      - Alle Variablen, die das Projekt braucht – Geheimnisse ohne Wert oder mit Platzhalter.
      - Nur die Variablen, die sich nie ändern.
      - Gar nichts, sie ist eine leere Datei.
    answer: 1
    explanation: Die .env.example ist die Vorlage. Sie zeigt, welche Schlüssel es gibt, verrät aber keine Geheimnisse.
  - type: multiple
    question: Welche Werte gehören in eine Umgebungsvariable statt in den Code?
    options:
      - Das Datenbank-Passwort
      - Die URL der API, die je nach Umgebung anders ist
      - Der Name einer React-Komponente
      - Ein API-Schlüssel für den Mailversand
    answers: [0, 1, 3]
    explanation: Alles, was sich zwischen Umgebungen unterscheidet oder geheim ist, gehört in die Konfiguration. Komponentennamen sind Code.
  - type: find-bug
    question: Diese .env.example landet im Repository. Welche Zeile ist ein Problem?
    language: bash
    code: |
      APP_NAME=Notizen
      APP_DEBUG=true
      DB_HOST=127.0.0.1
      DB_PASSWORD=Sommer2026!
      MAIL_API_KEY=
    bug_line: 4
    explanation: In der Vorlage steht ein echt aussehendes Passwort. Geheimnisse bleiben in der Vorlage leer oder bekommen einen offensichtlichen Platzhalter.
  - type: cloze
    text: Nach dem Klonen erzeugst du deine lokale Konfiguration mit `cp .env.___ .env`. Die Datei `.env` steht in der `___`.
    blanks:
      - [example]
      - [.gitignore, gitignore]
    explanation: Die Vorlage wird kopiert und mit eigenen Werten gefüllt. Die Kopie ist durch die .gitignore vor Commits geschützt.
tasks:
  - id: env-example-schreiben
    type: terminal
    title: Eine .env.example aus der .env ableiten
    description: |
      Im Ordner `env-vorlage` liegt ein Repository mit einer `.env`, die echte (lokale) Werte enthält.
      Es gibt aber noch keine Vorlage, und die `.env` ist nicht geschützt.

      1. Schau dir die `.env` mit `cat .env` an.
      2. Lege eine `.env.example` mit **denselben Schlüsseln** in derselben Form `SCHLUESSEL=wert` an.
         Unkritische Werte wie `APP_NAME` darfst du übernehmen, aber `DB_PASSWORD` und `MAIL_API_KEY`
         bleiben **leer**.
      3. Sorge per `.gitignore` dafür, dass `.env` ignoriert wird, `.env.example` aber nicht.
      4. Committe `.gitignore` und `.env.example`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: env-vorlage
    setup: |
      git init -q
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      printf 'APP_NAME=Notizen\nAPP_ENV=local\nAPP_DEBUG=true\nDB_HOST=127.0.0.1\nDB_DATABASE=notizen\nDB_PASSWORD=lokal-geheim-42\nMAIL_API_KEY=<dein-token>\n' > .env
      echo '<?php echo "Notizen";' > index.php
      git add index.php
      git commit -q -m "chore: initial commit"
    checks:
      - type: file_exists
        path: .env.example
        message: Die Datei .env.example fehlt noch.
      - type: command
        run: diff <(grep -E '^[A-Z_]+=' .env | cut -d= -f1 | sort) <(grep -E '^[A-Z_]+=' .env.example | cut -d= -f1 | sort)
        message: .env.example muss genau dieselben Schlüssel enthalten wie .env.
      - type: file_contains
        path: .env.example
        pattern: "^DB_PASSWORD=\\s*$"
        message: DB_PASSWORD soll in der Vorlage leer sein (DB_PASSWORD=).
      - type: file_contains
        path: .env.example
        pattern: "^MAIL_API_KEY=\\s*$"
        message: MAIL_API_KEY soll in der Vorlage leer sein.
      - type: command
        run: git check-ignore -q .env && ! git check-ignore -q .env.example
        message: .env muss ignoriert werden, .env.example darf nicht ignoriert werden.
      - type: command
        run: git ls-files | LC_ALL=C sort | tr '\n' ' '
        stdout_matches: "^\\.env\\.example \\.gitignore index\\.php\\s*$"
        message: Committe .env.example und .gitignore (die .env darf nicht im Repository sein).
      - type: command
        run: git log --all --name-only --format= | grep -cx '.env' || true
        stdout_matches: "^0$"
        message: Die .env wurde irgendwann committet. Sie darf in keinem Commit vorkommen.
    hints:
      - "`sed -E 's/^(DB_PASSWORD|MAIL_API_KEY)=.*/\\1=/' .env > .env.example` kopiert die Datei und leert die zwei Werte."
      - "`echo .env > .gitignore` reicht als Regel. Prüfe mit `git check-ignore -v .env`."
      - Merke mit `git add .gitignore .env.example` gezielt nur diese beiden Dateien vor.
    solution: |
      ```bash
      cd env-vorlage
      cat .env
      sed -E 's/^(DB_PASSWORD|MAIL_API_KEY)=.*/\1=/' .env > .env.example
      echo ".env" > .gitignore
      git check-ignore -v .env
      git add .gitignore .env.example
      git commit -m "chore: add env template"
      ```
  - id: env-fluss-beschriften
    type: diagram
    title: Der Weg eines Werts
    description: Beschrifte die vier Stationen, die ein Wert in einem Laravel-Projekt durchläuft – von der Vorlage bis in deinen Code.
    image: /assets/projektaufbau/env-fluss-leer.svg
    slots:
      - { x: 13, y: 23, answer: .env.example }
      - { x: 38, y: 23, answer: .env }
      - { x: 64, y: 23, answer: config/app.php }
      - { x: 88, y: 23, answer: Dein Code }
    distractors: [.gitignore, vendor/]
    hints:
      - Die linke Datei ist committet, die zweite ignoriert.
---
Dein Projekt läuft auf deinem Laptop mit einer lokalen Datenbank, auf dem Testserver mit einer
anderen und in Produktion mit einer dritten. Der Code ist überall derselbe – nur die **Einstellungen**
unterscheiden sich. Wo gehören diese Einstellungen hin?

## Konfiguration gehört nicht in den Code

Würdest du das Datenbank-Passwort direkt in den Code schreiben, hättest du drei Probleme:

1. Jede Person mit Zugriff auf das [[repository|Repository]] kennt das Passwort.
2. Für jede Umgebung bräuchtest du eine andere Code-Version.
3. Ein Passwortwechsel würde eine Code-Änderung und ein neues Deployment erzwingen.

Die Lösung beschreibt die [[twelve-factor-app|Twelve-Factor App]], eine bekannte Sammlung von
Regeln für moderne Anwendungen: Konfiguration wird in [[umgebungsvariable|Umgebungsvariablen]]
gespeichert, getrennt vom Code.

> [!MERKSATZ]
> Der Test für saubere Trennung: Könntest du dein Repository **sofort veröffentlichen**, ohne ein
> einziges Geheimnis zu verraten? Wenn ja, ist deine Konfiguration richtig getrennt.

## Die .env-Datei

Umgebungsvariablen für jeden Befehl einzeln zu setzen, wäre mühsam. Deshalb schreibt man sie in eine
[[env-datei|.env-Datei]] in der Projektwurzel. Laravel und Vite lesen sie beim Start automatisch ein.

```bash title=".env – nur auf deinem Rechner"
APP_NAME=Notizen
APP_ENV=local
APP_DEBUG=true
DB_HOST=127.0.0.1
DB_PASSWORD=lokal-geheim-42
MAIL_API_KEY=<dein-token>
```

Das Format ist einfach: eine Variable pro Zeile, `SCHLUESSEL=wert`, ohne Leerzeichen um das `=`.
Die Schlüssel schreibt man in Großbuchstaben. Enthält ein Wert Leerzeichen, setzt du ihn in
Anführungszeichen, etwa `APP_NAME="Meine Notizen"`.

> [!FEHLER]
> **Die .env committen.** Das ist einer der häufigsten und teuersten Fehler überhaupt. Selbst wenn du
> sie sofort wieder löschst, bleibt das [[secret|Geheimnis]] in der Historie. Trage `.env` gleich zu
> Beginn in die `.gitignore` ein.

## Die Vorlage: .env.example

Wenn die `.env` nicht im Repository liegt – woher weiß eine neue Kollegin, welche Variablen sie
braucht? Aus der [[env-example|.env.example]]. Sie enthält **alle Schlüssel**, aber keine Geheimnisse:

```bash title=".env.example – wird committet"
APP_NAME=Notizen
APP_ENV=local
APP_DEBUG=true
DB_HOST=127.0.0.1
DB_PASSWORD=
MAIL_API_KEY=
```

| | `.env` | `.env.example` |
|---|---|---|
| Inhalt | echte Werte | Schlüssel, unkritische Standardwerte |
| Geheimnisse | ja | nie |
| Im Repository | nein (`.gitignore`) | ja |
| Wer pflegt sie | jede Person für sich | das Team gemeinsam |

Die Vorlage darf auch erklären. Ein kurzer Kommentar über einer Variable spart Rückfragen:

```bash title=".env.example mit Kommentaren"
# Schlüssel für den Mailversand – im Team-Passwort-Manager unter "Mail"
MAIL_API_KEY=
```

Zeilen, die mit `#` beginnen, ignorieren Laravel und Vite beim Einlesen.

## Der Ablauf im Team

![Der Weg eines Werts von .env.example bis in den Code](/assets/projektaufbau/env-fluss.svg)

1. Das Repository enthält `.env.example`.
2. Nach dem Klonen kopierst du sie: `cp .env.example .env`.
3. Du trägst deine eigenen Werte ein, etwa dein lokales Datenbank-Passwort.
4. Braucht das Projekt eine neue Variable, ergänzt du sie in **beiden** Dateien und committest nur die
   Vorlage.

```bash title="Typischer Start in einem Laravel-Projekt"
cp .env.example .env
php artisan key:generate   # erzeugt APP_KEY in deiner .env
```

> [!PRAXIS]
> Die echten Werte für Server legt man nicht als Datei ins Repository, sondern in einem
> Passwort-Manager oder im Secret-Speicher der Hosting-Plattform ab. Die Plattform setzt sie beim
> Start als Umgebungsvariablen – die Anwendung merkt keinen Unterschied.

## Zusammenfassung

- Konfiguration, die sich je Umgebung unterscheidet oder geheim ist, gehört nicht in den Code.
- Die Twelve-Factor App speichert sie in Umgebungsvariablen.
- Die `.env` enthält die echten Werte für einen Rechner und steht in der `.gitignore`.
- Die `.env.example` listet alle Schlüssel ohne Geheimnisse und wird committet.
- Nach dem Klonen: `cp .env.example .env` und eigene Werte eintragen.
- Ein committetes Geheimnis muss sofort ausgetauscht werden.
