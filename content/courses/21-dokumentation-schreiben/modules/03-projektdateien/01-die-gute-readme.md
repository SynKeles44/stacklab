---
title: Die gute README
summary: Welche Abschnitte eine README braucht, wie ein schlechtes und ein gutes Beispiel aussehen und wozu Badges dienen.
duration: 25
sources:
  - title: GitHub Docs – Informationen zu README-Dateien
    url: https://docs.github.com/de/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes
  - title: Make a README
    url: https://www.makeareadme.com/
  - title: Shields.io – Badges
    url: https://shields.io/
quiz:
  - type: single
    question: Was muss eine Besucherin in den ersten zehn Sekunden auf deiner README erfahren?
    options:
      - Die komplette Liste aller Konfigurationsoptionen.
      - Was das Projekt ist und für wen es gedacht ist.
      - Die Geschichte, wie das Projekt entstanden ist.
      - Die Namen aller Mitwirkenden.
    answer: 1
    explanation: >
      Titel und ein bis zwei Sätze darunter entscheiden, ob jemand weiterliest. Erst danach kommen Schnellstart,
      Voraussetzungen und Details.
  - type: multiple
    question: Was macht einen guten Schnellstart aus?
    options:
      - Die Befehle lassen sich kopieren und laufen ohne Änderung.
      - Er erklärt alle Varianten der Installation für jedes Betriebssystem.
      - Er endet mit einem sichtbaren Ergebnis, z. B. „Öffne http://localhost:3000“.
      - Er ist so kurz wie möglich.
    answers: [0, 2, 3]
    explanation: >
      Der Schnellstart ist der kürzeste Weg zu einem Erfolgserlebnis. Varianten und Sonderfälle gehören in eigene
      Abschnitte oder in eine How-to-Anleitung.
  - type: find-bug
    question: In welcher Zeile steckt das größte Problem dieser README?
    language: markdown
    code: |
      # wetter-api

      Liefert Wetterdaten als JSON für Städte in Europa.

      ## Schnellstart

      npm install
      export API_KEY=a8f5e2c91b7d4e06
      npm start
    bug_line: 8
    explanation: >
      Zeile 8 enthält einen echten Schlüssel. Was in der README steht, landet in der Git-Historie und ist für alle
      sichtbar. Richtig wäre ein Platzhalter wie `<dein-api-key>`. (Die Befehle gehören außerdem in einen Codeblock.)
  - type: match
    question: Ordne jede Frage dem README-Abschnitt zu, der sie beantwortet.
    pairs:
      - { left: "Was muss ich vorher installieren?", right: "Voraussetzungen" }
      - { left: "Wie ändere ich den Port?", right: "Konfiguration" }
      - { left: "Was tun bei EADDRINUSE?", right: "Fehlerbehebung" }
      - { left: "Darf ich den Code in meiner Firma nutzen?", right: "Lizenz" }
      - { left: "Wie schicke ich eine Änderung ein?", right: "Mitwirken" }
    explanation: Wer eine Frage hat, springt direkt zum passenden Abschnitt. Deshalb helfen klare, vorhersehbare Überschriften.
tasks:
  - id: readme-reihenfolge
    type: order
    title: Bring die README in Form
    description: Bring die Abschnitte einer README in die Reihenfolge, in der Besucher:innen sie brauchen.
    items:
      - Titel und Ein-Satz-Beschreibung
      - Badges (Build-Status, Lizenz)
      - Schnellstart
      - Voraussetzungen
      - Konfiguration
      - Fehlerbehebung
      - Mitwirken
      - Lizenz
    hints:
      - Zuerst „Was ist das?“, dann „Wie starte ich?“, ganz am Ende die rechtlichen und organisatorischen Fragen.
  - id: readme-ueberarbeiten
    type: terminal
    title: Aus einer schlechten README eine gute machen
    description: |
      Im Ordner `readme-ueberarbeiten` liegt ein kleiner Node-Server (`server.js`, `package.json`) mit einer
      README, die niemandem hilft. Lies den Code (`cat server.js package.json`) und schreibe `README.md` neu:

      1. Titel `# hallo-server` und darunter ein Satz, was der Server tut.
      2. `## Schnellstart` mit einem `bash`-Codeblock, der `npm start` enthält.
      3. `## Voraussetzungen`, in dem die nötige Node.js-Version (siehe `engines` in der package.json) steht.
      4. `## Konfiguration` mit einer Tabelle, die **beide** Umgebungsvariablen aus `server.js` mit ihrem
         Standardwert nennt.
      5. `## Fehlerbehebung` mit einem Tipp zur Fehlermeldung `EADDRINUSE` (der Port ist schon belegt).
      6. `## Lizenz` mit dem Hinweis auf die MIT-Lizenz.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit das Projekt angelegt wird.
    workdir: readme-ueberarbeiten
    setup: |
      cat > server.js <<'EOF'
      import { createServer } from 'node:http'

      const port = Number(process.env.PORT ?? 3000)
      const greeting = process.env.GREETING ?? 'Hallo'

      createServer((request, response) => {
        response.end(`${greeting}, Welt!\n`)
      }).listen(port, () => console.log(`Läuft auf http://localhost:${port}`))
      EOF
      cat > package.json <<'EOF'
      {
        "name": "hallo-server",
        "type": "module",
        "license": "MIT",
        "engines": { "node": ">=24" },
        "scripts": { "start": "node server.js" }
      }
      EOF
      printf '# projekt\n\nmein server. starten mit node. viel spass\n' > README.md
    checks:
      - type: command
        run: head -n 1 README.md
        stdout_matches: "^# hallo-server\\s*$"
        message: "Die erste Zeile soll `# hallo-server` sein."
      - type: command
        run: awk 'NR>1 && NF {print; exit}' README.md
        stdout_matches: "^[^#|`>-].{15,}"
        message: Direkt unter dem Titel fehlt ein vollständiger Satz, was der Server tut.
      - type: command
        run: awk '/^## Schnellstart/{f=1;next} /^## /{f=0} f' README.md | awk '/^```bash/{c=1;next} /^```/{c=0} c' | grep -c 'npm start'
        stdout_matches: "^[1-9]"
        message: "Unter `## Schnellstart` fehlt ein ```bash-Codeblock mit `npm start`."
      - type: command
        run: awk '/^## Voraussetzungen/{f=1;next} /^## /{f=0} f' README.md | grep -cE 'Node(\.js)?.*24'
        stdout_matches: "^[1-9]"
        message: "Unter `## Voraussetzungen` soll die nötige Version stehen, z. B. „Node.js 24 oder neuer“."
      - type: command
        run: awk '/^## Konfiguration/{f=1;next} /^## /{f=0} f' README.md | grep -E '^\|' | grep -cE 'PORT.*3000|GREETING.*Hallo'
        stdout_equals: "2"
        message: "Die Tabelle unter `## Konfiguration` braucht je eine Zeile für PORT (3000) und GREETING (Hallo)."
      - type: command
        run: awk '/^## Fehlerbehebung/{f=1;next} /^## /{f=0} f' README.md | grep -c 'EADDRINUSE'
        stdout_matches: "^[1-9]"
        message: "Unter `## Fehlerbehebung` fehlt ein Tipp zu `EADDRINUSE`."
      - type: command
        run: awk '/^## Lizenz/{f=1;next} /^## /{f=0} f' README.md | grep -c 'MIT'
        stdout_matches: "^[1-9]"
        message: "Unter `## Lizenz` soll stehen, dass das Projekt unter der MIT-Lizenz steht."
    hints:
      - "Die Umgebungsvariablen findest du in `server.js` an `process.env.…` – der Wert hinter `??` ist der Standardwert."
      - "Eine Tabellenzeile sieht so aus: `| PORT | 3000 | Port, auf dem der Server lauscht |`."
      - "Schreib die ganze Datei mit `cat > README.md <<'EOF'` … `EOF` oder in `nano README.md`."
    solution: |
      ~~~bash
      cd readme-ueberarbeiten
      cat > README.md <<'EOF'
      # hallo-server

      Ein winziger HTTP-Server, der jede Anfrage mit einem anpassbaren Gruß beantwortet.

      ## Schnellstart

      ```bash
      npm start
      ```

      Öffne danach <http://localhost:3000>.

      ## Voraussetzungen

      - Node.js 24 oder neuer

      ## Konfiguration

      | Variable | Standardwert | Bedeutung |
      |---|---|---|
      | PORT | 3000 | Port, auf dem der Server lauscht |
      | GREETING | Hallo | Gruß in der Antwort |

      ## Fehlerbehebung

      **EADDRINUSE:** Der Port ist schon belegt. Beende das andere Programm oder starte mit `PORT=3001 npm start`.

      ## Lizenz

      MIT – siehe `package.json`.
      EOF
      ~~~
---
Du findest auf GitHub ein Projekt, das genau dein Problem lösen könnte. Die README besteht aus einem Satz:
„Mein cooles Tool, viel Spaß!“ Nach zwei Minuten bist du wieder weg. Die [[readme|README]] ist die
**Visitenkarte** deines Projekts – GitHub zeigt sie direkt unter der Dateiliste an. Sie entscheidet, ob jemand
bleibt.

## Die Fragen, die eine README beantwortet

Eine gute README beantwortet die Fragen der Besucher:innen **in der Reihenfolge, in der sie entstehen**:

![Aufbau einer guten README von oben nach unten](/assets/dokumentation-schreiben/readme-anatomie.svg)

| Abschnitt | Frage |
|---|---|
| Titel + ein Satz | Was ist das, und ist es für mich? |
| Schnellstart | Wie sehe ich es in zwei Minuten laufen? |
| Voraussetzungen | Was muss ich vorher installieren – in welcher Version? |
| Konfiguration | Welche Einstellungen gibt es? |
| Fehlerbehebung | Was tue ich, wenn es nicht klappt? |
| Mitwirken | Wie kann ich helfen? |
| Lizenz | Was darf ich mit dem Code machen? |

Nicht jedes Projekt braucht alle Abschnitte. Titel, Beschreibung und Schnellstart braucht aber **jedes**.

> [!MERKSATZ]
> Eine README beantwortet zuerst „Was ist das?“ und dann „Wie starte ich?“. Alles andere kommt danach.

## Schlecht: die README, die niemandem hilft

```markdown title="README.md – so bitte nicht"
# projekt

mein server. starten mit node. bei fragen mich anschreiben.
```

Was fehlt hier alles?

- **Der Name** sagt nichts über den Zweck – „projekt“ heißt jedes zweite Repository.
- **Kein Zweck:** Was macht der Server? Für wen ist er?
- **Kein kopierbarer Befehl:** `node` – aber welche Datei? Vorher `npm install`?
- **Keine Voraussetzungen:** Läuft das mit jeder Node-Version?
- **Keine Konfiguration:** Auf welchem Port läuft er? Welche [[umgebungsvariable|Umgebungsvariablen]] gibt es? Kann man das ändern?
- **„Mich anschreiben“:** Wer ist „mich“? Und wenn die Person weg ist?

> [!FEHLER]
> Die README als Notiz an sich selbst schreiben. Du weißt alles, was fehlt – Fremde nicht. Lies deine README
> so, als hättest du das Projekt noch nie gesehen.

## Gut: dasselbe Projekt, ordentlich beschrieben

~~~markdown title="README.md – so hilft sie"
# hallo-server

Ein winziger HTTP-Server, der jede Anfrage mit einem anpassbaren Gruß beantwortet.
Gedacht als Vorlage für eigene Experimente mit Node.js.

## Schnellstart

```bash
npm install
npm start
```

Öffne danach <http://localhost:3000>.

## Voraussetzungen

- Node.js 24 oder neuer

## Konfiguration

| Variable | Standardwert | Bedeutung |
|---|---|---|
| PORT | 3000 | Port, auf dem der Server lauscht |
| GREETING | Hallo | Gruß in der Antwort |
~~~

Jeder Abschnitt beantwortet genau eine Frage, die Befehle lassen sich kopieren, und der Schnellstart endet
mit einem sichtbaren Ergebnis.

## Fehlerbehebung, Mitwirken, Lizenz

Die letzten Abschnitte sind kurz, aber wertvoll.

**Fehlerbehebung** sammelt Probleme, die wirklich auftreten. Nenne die genaue Fehlermeldung – danach wird gesucht:

```markdown
## Fehlerbehebung

**EADDRINUSE: address already in use** – Der Port ist belegt.
Starte mit einem anderen Port: `PORT=3001 npm start`.
```

**Mitwirken** verlinkt auf die [[contributing|CONTRIBUTING.md]], statt alle Regeln in die README zu kippen.

**Lizenz** nennt die [[lizenz|Lizenz]] und verweist auf die Datei `LICENSE`. Ohne Lizenz dürfen andere den
Code rechtlich gesehen gar nicht verwenden – auch wenn er öffentlich ist.

> [!PRAXIS]
> In Firmenprojekten ersetzt der Abschnitt „Mitwirken“ oft ein Link zur internen Teamseite, und „Lizenz“
> heißt „Proprietär, nur für den internen Gebrauch“. Der Aufbau bleibt gleich.

## Badges: Status auf einen Blick

[[badge|Badges]] sind kleine Bilder unter dem Titel, die den Zustand des Projekts zeigen: Ist der letzte Build
grün? Welche Version ist aktuell? Welche Lizenz gilt? Ein beliebter Dienst dafür ist
[Shields.io](https://shields.io/).

```markdown
![Build](https://github.com/example/hallo-server/actions/workflows/ci.yml/badge.svg)
![Lizenz: MIT](https://img.shields.io/badge/Lizenz-MIT-blue)
```

Technisch ist ein Badge einfach ein Markdown-Bild. Setze nur Badges, die eine echte Information tragen.
Zwölf bunte Badges lenken mehr ab, als sie helfen.

## Zusammenfassung

- Die README ist die **Visitenkarte**: GitHub zeigt sie direkt im Repository an.
- Reihenfolge: **Was ist das?** → **Schnellstart** → Voraussetzungen → Konfiguration → Fehlerbehebung → Mitwirken → Lizenz.
- Der Schnellstart enthält **kopierbare Befehle** und endet mit einem sichtbaren Ergebnis.
- Nenne Versionen, Standardwerte und genaue Fehlermeldungen.
- **Keine echten Geheimnisse** – nur Platzhalter.
- Badges zeigen den Status – sparsam einsetzen.
