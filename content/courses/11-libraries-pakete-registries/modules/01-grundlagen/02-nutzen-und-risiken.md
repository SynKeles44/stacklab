---
title: Nutzen und Risiken von Abhängigkeiten
summary: Was dir fremder Code bringt, wie aus zwei Paketen fünf werden – und was Dependency Hell, verwaiste Pakete, left-pad und Lizenzen damit zu tun haben.
duration: 25
sources:
  - title: npm Docs – npm ls
    url: https://docs.npmjs.com/cli/v11/commands/npm-ls
  - title: npm Docs – npm unpublish policy
    url: https://docs.npmjs.com/policies/unpublish
  - title: Composer – composer show und depends
    url: https://getcomposer.org/doc/03-cli.md#show-info
  - title: Choose a License – Lizenzen im Vergleich
    url: https://choosealicense.com/licenses/
quiz:
  - type: single
    question: Du installierst nur das Paket `debug`. Danach liegt auch `ms` in node_modules. Warum?
    options:
      - npm installiert immer ein paar beliebte Pakete mit.
      - "`debug` braucht selbst `ms` – es ist eine transitive Abhängigkeit."
      - "`ms` war schon vorher global installiert."
      - Das ist ein Fehler, `ms` sollte gelöscht werden.
    answer: 1
    explanation: Pakete haben eigene Abhängigkeiten. npm installiert den ganzen Baum, damit `debug` funktioniert.
  - type: multiple
    question: Welche Aussagen über den left-pad-Vorfall von 2016 stimmen?
    options:
      - Ein elfzeiliges Paket wurde aus der Registry entfernt.
      - Tausende Projekte konnten plötzlich nicht mehr installiert werden, weil sie es transitiv nutzten.
      - Der Code enthielt Schadsoftware.
      - npm hat danach die Regeln zum Zurückziehen von Paketen verschärft.
    answers: [0, 1, 3]
    explanation: left-pad war harmlos, aber es fehlte plötzlich. Seitdem darf ein Paket, von dem andere abhängen, nicht mehr einfach gelöscht werden.
  - type: match
    question: Ordne jedem Risiko die passende Beschreibung zu.
    pairs:
      - { left: "Dependency Hell", right: "Zwei Pakete verlangen unvereinbare Versionen desselben Pakets" }
      - { left: "Verwaistes Paket", right: "Niemand pflegt es mehr, Lücken bleiben offen" }
      - { left: "Copyleft-Lizenz", right: "Kann verlangen, dass dein Code unter derselben Lizenz steht" }
      - { left: "Transitive Abhängigkeit", right: "Ein Paket, das du nie selbst installiert hast" }
    explanation: Jedes dieser Risiken lässt sich erkennen, bevor es wehtut – mit npm ls, einem Blick auf das letzte Release und auf das Lizenzfeld.
  - type: cloze
    text: Die Lizenz eines npm-Pakets steht im Feld `___` seiner package.json. Die häufigste freizügige Lizenz heißt ___.
    blanks:
      - [license]
      - [MIT]
    explanation: MIT, Apache-2.0 und BSD sind freizügig (permissiv). GPL ist eine Copyleft-Lizenz mit strengeren Bedingungen.
tasks:
  - id: abhaengigkeitsbaum
    type: terminal
    title: Baum und Lizenz untersuchen
    description: |
      Im Ordner `baum` liegt ein leeres Node-Projekt.

      1. Installiere das Paket `debug` (eine kleine Library für Debug-Ausgaben).
      2. Lass dir mit `npm ls --all` den kompletten Baum anzeigen.
      3. Finde heraus, welches Paket `debug` **selbst** braucht (`npm explain <name>` bestätigt es).
         Schreibe nur den Namen dieses transitiven Pakets in die Datei `transitiv.txt`.
      4. Lies mit `jq` die Lizenz von `debug` aus `node_modules/debug/package.json` und schreibe sie
         in die Datei `lizenz.txt`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: baum
    setup: |
      npm init -y > /dev/null
    checks:
      - type: command
        run: jq -r '.dependencies.debug // empty' package.json
        stdout_matches: "\\d"
        message: debug steht noch nicht in den dependencies. Installiere es mit npm install debug.
      - type: command
        run: jq -r '.dependencies.ms // "nicht-direkt"' package.json
        stdout_equals: nicht-direkt
        message: ms soll nicht als direkte Abhängigkeit in der package.json stehen – es kommt über debug mit.
      - type: file_contains
        path: transitiv.txt
        pattern: "^\\s*ms\\s*$"
        message: In transitiv.txt soll genau der Name des Pakets stehen, das debug selbst braucht.
      - type: file_contains
        path: lizenz.txt
        pattern: "^\\s*MIT\\s*$"
        message: In lizenz.txt soll die Lizenz von debug stehen, so wie sie im Feld license steht.
    hints:
      - "`npm ls --all` zeigt eingerückt, welches Paket unter `debug` hängt."
      - "`jq -r .license node_modules/debug/package.json` gibt das Lizenzfeld aus. Mit `>` leitest du die Ausgabe in eine Datei um."
    solution: |
      ```bash
      cd baum
      npm install debug
      npm ls --all
      npm explain ms
      echo ms > transitiv.txt
      jq -r .license node_modules/debug/package.json > lizenz.txt
      ```
  - id: selbst-oder-paket
    type: steps
    title: Paket oder selbst schreiben?
    description: Entscheide in jeder Situation, was sinnvoller ist.
    steps:
      - situation: Dein Projekt braucht eine Funktion, die einen String links mit Leerzeichen auffüllt.
        question: Brauchst du dafür ein Paket?
        options:
          - Ja, ein Paket wie left-pad
          - Nein, `"7".padStart(3, " ")` kann JavaScript schon selbst
          - Ja, am besten ein ganzes Framework
        answer: 1
        explanation: Die Sprache bringt das mit. Jede unnötige Abhängigkeit ist zusätzliches Risiko ohne Nutzen.
      - situation: Du musst Passwörter sicher hashen.
        question: Was ist die bessere Wahl?
        options:
          - Einen eigenen Hash-Algorithmus erfinden
          - Die eingebaute, geprüfte Funktion der Sprache oder eine etablierte Library
          - Das Passwort einfach umdrehen
        answer: 1
        explanation: Kryptografie selbst zu schreiben ist gefährlich. PHP hat `password_hash()`, Node.js das Modul `node:crypto`.
      - situation: Du findest ein passendes Paket. Das letzte Release ist vier Jahre alt, 80 Issues sind offen, niemand antwortet.
        question: Wie gehst du vor?
        options:
          - Sofort installieren, Hauptsache es funktioniert
          - Nach einer gepflegten Alternative suchen oder bewusst entscheiden, das Risiko zu tragen
          - Das Paket installieren und die Versionsnummer löschen
        answer: 1
        explanation: Ein verwaistes Paket bekommt keine Sicherheits-Updates. Manchmal ist es trotzdem okay – aber dann als bewusste Entscheidung.
      - situation: Du willst ein Paket mit GPL-3.0-Lizenz in eine Software einbauen, die deine Firma verkauft.
        question: Was tust du?
        options:
          - Einfach nutzen, Open Source ist immer erlaubt
          - Vorher klären, welche Pflichten die Lizenz mitbringt
          - Die Lizenzdatei aus dem Paket löschen
        answer: 1
        explanation: Copyleft-Lizenzen können verlangen, dass du deinen Quellcode offenlegst. Das klärst du vorher – im Zweifel mit der Rechtsabteilung.
---
Bevor es Paketmanager gab, kopierten Entwickler:innen Code-Schnipsel aus Foren in ihre Projekte. Updates?
Fehlanzeige. Heute tippst du einen Befehl – und bekommst getesteten, versionierten Code samt allem, was er
braucht. Aber du holst dir damit auch fremde Menschen, fremde Fehler und fremde Lizenzen ins Haus.

## Was dir Pakete bringen

| Vorteil | Was das konkret heißt |
|---|---|
| **Zeit** | Du löst nicht zum hundertsten Mal dasselbe Problem. |
| **Erfahrung** | Tausende Nutzer:innen haben Randfälle schon gefunden und gemeldet. |
| **Pflege** | [[maintainer\|Maintainer]] beheben Fehler, du aktualisierst nur. |
| **Standards** | Alle im Team kennen dieselben Werkzeuge, z. B. Laravel oder React. |

Die meisten Pakete sind [[open-source|Open Source]]: Ihr Quellcode ist öffentlich, und du darfst ihn unter
den Bedingungen der Lizenz nutzen.

> [!MERKSATZ]
> Pakete lohnen sich für Probleme, die **viele** haben und die **schwer richtig** zu lösen sind:
> Datum, Kryptografie, HTTP, Formatierung, Tests.

## Direkte und transitive Abhängigkeiten

Was du selbst installierst, ist eine **direkte** Abhängigkeit. Sie steht in deinem Manifest. Aber auch
Pakete haben Abhängigkeiten – und die kommen automatisch mit. Diese heißen
[[transitive-abhaengigkeit|transitive Abhängigkeiten]].

![Abhängigkeitsbaum: Zwei direkte Abhängigkeiten ziehen drei weitere Pakete nach](/assets/libraries-pakete-registries/abhaengigkeitsbaum.svg)

Ein typisches Frontend-Projekt hat zehn bis zwanzig direkte Abhängigkeiten – und mehrere hundert Pakete
in [[node-modules|node_modules]]. Jedes davon ist Code, dem du vertraust.

```bash title="Den Baum ansehen"
npm ls --all               # npm: kompletter Baum
npm explain ms             # npm: warum ist ms installiert?
composer show --tree       # Composer: kompletter Baum
composer depends psr/log   # Composer: wer braucht psr/log?
```

## Dependency Hell

Paket A braucht `ms` in Version 2, Paket B braucht `ms` in Version 3. Was nun? Diese Lage heißt
[[dependency-hell|Dependency Hell]] – Abhängigkeiten, die sich gegenseitig blockieren.

Die Paketmanager gehen unterschiedlich damit um:

| Paketmanager | Strategie |
|---|---|
| npm, Bun | Können **mehrere Versionen** nebeneinander installieren (verschachtelt in node_modules). |
| Composer | Erlaubt **genau eine Version** pro Paket – findet er keine passende, bricht er mit einer Fehlermeldung ab. |

Bei npm läuft also fast immer alles, dafür wird node_modules groß. Composer zwingt dich, den Konflikt zu
lösen – etwa indem du ein Paket aktualisierst.

> [!FEHLER]
> **`composer require` scheitert mit „Your requirements could not be resolved“ – und du löschst die
> composer.lock.** Das verschiebt das Problem nur. Lies die Meldung: Sie nennt die beiden Pakete, deren
> Versionswünsche sich widersprechen.

## Verwaiste Pakete und der left-pad-Vorfall

Viele Pakete werden von einer einzigen Person in ihrer Freizeit gepflegt. Hört sie auf, wird das Paket zum
[[verwaistes-paket|verwaisten Paket]]: Fehler und Sicherheitslücken bleiben offen.

Wie verletzlich das System ist, zeigte 2016 **left-pad**: ein Paket mit elf Zeilen Code, das einen String
links auffüllt. Der Autor entfernte es nach einem Streit aus der [[npm-registry|npm-Registry]]. Weil viele
große Pakete es transitiv nutzten, schlugen weltweit tausende Installationen fehl.

Die Lehren daraus:

- npm verbietet seitdem, Pakete zu löschen, von denen andere abhängen.
- Winzige Pakete für Dinge, die die Sprache kann, sind ein unnötiges Risiko. Heute gibt es `padStart`.
- [[lockfile|Lockfiles]] und eigene Kopien (Caches) machen Builds unabhängiger.

## Lizenzen

Open Source heißt nicht „alles erlaubt“. Die [[lizenz|Lizenz]] legt fest, was du darfst:

| Art | Beispiele | Was du beachten musst |
|---|---|---|
| [[permissive-lizenz\|Freizügig]] | MIT, Apache-2.0, BSD | Lizenztext und Copyright-Hinweis beibehalten |
| [[copyleft\|Copyleft]] | GPL-3.0, AGPL-3.0 | Weitergegebene Software muss ggf. selbst unter dieser Lizenz stehen |

Das Lizenzfeld findest du im Manifest (`"license": "MIT"`) und in der Datei `LICENSE`.

> [!PRAXIS]
> Viele Teams prüfen neue Abhängigkeiten mit einer kurzen Checkliste: Brauchen wir das wirklich? Wann war
> das letzte Release? Wie viele Maintainer? Welche Lizenz? Wer ein Paket hinzufügt, begründet das im Pull
> Request.

## Zusammenfassung

- Pakete sparen Zeit und bündeln die Erfahrung vieler Nutzer:innen.
- **Direkte** Abhängigkeiten stehen im Manifest, **transitive** kommen automatisch mit.
- **Dependency Hell**: npm installiert notfalls mehrere Versionen, Composer verlangt genau eine.
- **Verwaiste Pakete** bekommen keine Updates mehr – left-pad zeigte, wie fragil lange Ketten sind.
- **Lizenzen** sind Pflicht-Lektüre: MIT ist freizügig, GPL bringt Copyleft-Pflichten mit.
- Vor jedem neuen Paket fragst du: Kann die Sprache das? Wie gesund ist das Paket? Welche Lizenz?
