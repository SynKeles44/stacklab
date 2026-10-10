---
title: Build-Artefakte und Images
summary: Warum du einmal baust und dasselbe Paket überall auslieferst, wie du Artefakte eindeutig benennst und prüfst und welche Rolle Docker-Images und Registries spielen.
duration: 22
sources:
  - title: git-archive Documentation
    url: https://git-scm.com/docs/git-archive
  - title: gitattributes – export-ignore
    url: https://git-scm.com/docs/gitattributes#_creating_an_archive
  - title: Docker Docs – Tag images
    url: https://docs.docker.com/get-started/docker-concepts/building-images/build-tag-and-publish-an-image/
  - title: The Twelve-Factor App – Build, release, run
    url: https://12factor.net/build-release-run
quiz:
  - type: single
    question: Was bedeutet „Build once, deploy many“?
    options:
      - Jede Umgebung baut ihre eigene Version aus dem Quellcode.
      - Ein Artefakt wird einmal gebaut und dann unverändert auf Staging und Produktion ausgeliefert.
      - Man darf nur einmal pro Tag deployen.
      - Docker-Images werden auf jedem Server neu gebaut.
    answer: 1
    explanation: >
      Nur wenn exakt dasselbe Paket auf Staging getestet und auf Produktion ausgeliefert wird, sagt der Test auf
      Staging etwas über die Produktion aus.
  - type: multiple
    question: Welche Image-Tags eignen sich, um eine Version eindeutig wiederzufinden?
    options:
      - "shop:3f2a9c1 (Commit-Hash)"
      - "shop:1.4.2 (Versionsnummer)"
      - "shop:latest"
      - "shop:neu"
    answers: [0, 1]
    explanation: >
      Commit-Hash und Versionsnummer zeigen immer auf denselben Stand. `latest` oder `neu` wandern weiter – morgen
      bedeuten sie etwas anderes, ein Rollback darauf ist Glückssache.
  - type: cloze
    text: Mit `git ___ --format=tar.gz -o app.tar.gz HEAD` packst du genau den committeten Stand. Ob ein Paket unterwegs verändert wurde, prüfst du mit einer ___.
    blanks:
      - [archive]
      - [Prüfsumme, Pruefsumme, Checksumme, Hash, SHA-256]
    explanation: git archive nimmt nur committete Dateien. Eine SHA-256-Prüfsumme verrät jede Veränderung.
  - type: match
    question: Ordne jedem Begriff seine Bedeutung zu.
    pairs:
      - { left: "Build-Artefakt", right: "fertiges, auslieferbares Paket aus dem Build" }
      - { left: "Container-Registry", right: "Speicher für Docker-Images" }
      - { left: "Image-Tag", right: "Name einer bestimmten Image-Version" }
      - { left: "Prüfsumme", right: "Fingerabdruck, der Veränderungen sichtbar macht" }
    explanation: Das Artefakt ist das Ergebnis, die Registry der Lagerplatz, der Tag das Etikett, die Prüfsumme das Siegel.
tasks:
  - id: artefakt-bauen
    type: terminal
    title: Baue ein eindeutig benanntes Artefakt
    description: |
      Im Ordner `artefakt` liegt das Git-Repository einer kleinen PHP-App. Darin gibt es auch `tests/` und eine
      lokale `.env` mit einem Passwort – beides gehört **nicht** ins Auslieferungspaket.

      1. Lege eine `.gitattributes` mit der Zeile `tests export-ignore` an und committe sie.
      2. Schreib ein ausführbares Skript `build.sh` (mit `set -euo pipefail`), das
         - den kurzen Commit-Hash ermittelt (`git rev-parse --short HEAD`),
         - mit `git archive` die Datei `dist/app-<hash>.tar.gz` erzeugt und
         - daneben `dist/app-<hash>.tar.gz.sha256` mit `sha256sum` schreibt (im Ordner `dist` ausführen,
           damit nur der Dateiname in der Prüfsummen-Datei steht).
      3. Führe `./build.sh` aus. Das Artefakt muss zum **aktuellen** Commit passen.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: artefakt
    setup: |
      git init -q -b main
      git config user.name "Stacklab"
      git config user.email "stacklab@example.com"
      mkdir -p public src tests
      printf '<?php\n\nrequire __DIR__ . "/../src/hello.php";\n\necho hello();\n' > public/index.php
      printf '<?php\n\nfunction hello(): string\n{\n    return "Hallo vom Server";\n}\n' > src/hello.php
      printf '<?php\n\nrequire __DIR__ . "/../src/hello.php";\n\nexit(hello() === "Hallo vom Server" ? 0 : 1);\n' > tests/HelloTest.php
      printf 'dist/\n.env\n' > .gitignore
      printf 'APP_ENV=production\nDB_PASSWORD=\n' > .env.example
      printf 'APP_ENV=local\nDB_PASSWORD=nur-lokal-geheim\n' > .env
      git add .
      git commit -q -m "feat: add hello page"
    checks:
      - type: command
        run: git ls-files .gitattributes
        stdout_equals: .gitattributes
        message: .gitattributes ist noch nicht committet – git archive beachtet sie erst, wenn sie im Commit steckt.
      - type: file_contains
        path: .gitattributes
        pattern: "^/?tests/?\\s+export-ignore"
        message: In .gitattributes fehlt die Zeile "tests export-ignore".
      - type: command
        run: test -x build.sh && grep -q "set -euo pipefail" build.sh
        message: build.sh fehlt, ist nicht ausführbar oder hat kein set -euo pipefail.
      - type: command
        run: test -f "dist/app-$(git rev-parse --short HEAD).tar.gz"
        message: Es gibt kein dist/app-<hash>.tar.gz zum aktuellen Commit. Hast du nach dem letzten Commit ./build.sh ausgeführt?
      - type: command
        run: tar -tzf "dist/app-$(git rev-parse --short HEAD).tar.gz" | sort | tr '\n' ' '
        stdout_matches: "public/index\\.php.*src/hello\\.php"
        message: Im Archiv fehlen public/index.php oder src/hello.php.
      - type: command
        run: |
          f="dist/app-$(git rev-parse --short HEAD).tar.gz"
          test -f "$f" && ! tar -tzf "$f" | grep -Eq "(^|/)(tests/|\.env$)"
        message: Im Archiv stecken tests/ oder die lokale .env – sie gehören nicht ins Auslieferungspaket.
      - type: command
        run: cd dist && sha256sum -c "app-$(git rev-parse --short HEAD).tar.gz.sha256"
        message: Die Prüfsummen-Datei fehlt oder passt nicht zum Archiv. Erzeuge sie im Ordner dist mit sha256sum.
    hints:
      - "Erst `.gitattributes` anlegen, `git add .gitattributes` und committen – danach bauen."
      - "Im Skript: `SHA=$(git rev-parse --short HEAD)` und `git archive --format=tar.gz -o \"dist/app-$SHA.tar.gz\" HEAD`."
      - "Prüfsumme: `(cd dist && sha256sum \"app-$SHA.tar.gz\" > \"app-$SHA.tar.gz.sha256\")`."
    solution: |
      ```bash
      cd artefakt
      echo "tests export-ignore" > .gitattributes
      git add .gitattributes
      git commit -m "build: exclude tests from archives"
      cat > build.sh <<'EOF'
      #!/usr/bin/env bash
      set -euo pipefail

      SHA=$(git rev-parse --short HEAD)
      mkdir -p dist
      git archive --format=tar.gz -o "dist/app-$SHA.tar.gz" HEAD
      (cd dist && sha256sum "app-$SHA.tar.gz" > "app-$SHA.tar.gz.sha256")
      echo "dist/app-$SHA.tar.gz"
      EOF
      chmod +x build.sh
      ./build.sh
      tar -tzf dist/app-*.tar.gz
      ```
  - id: tag-wahl
    type: steps
    title: Welche Version läuft da eigentlich?
    description: Spiel durch, was mit verschiedenen Image-Tags im Ernstfall passiert.
    steps:
      - situation: >
          Euer Team baut bei jedem Merge ein Image und schiebt es als `shop:latest` in die Registry.
          Produktion startet immer `shop:latest`.
        question: Nach einem Deployment ist der Checkout kaputt. Ihr wollt zurück zur Version von gestern. Was ist das Problem?
        options:
          - Es gibt keins – latest zeigt immer auf gestern.
          - "`latest` wurde überschrieben. Welches Image gestern lief, weiß niemand sicher."
          - Docker kann keine alten Images starten.
        answer: 1
        explanation: Ein wandernder Tag hat kein Gedächtnis. Für Rollbacks brauchst du Tags, die sich nie ändern.
      - situation: >
          Ab jetzt taggt die Pipeline jedes Image zusätzlich mit dem Commit-Hash, z. B. `shop:3f2a9c1`, und
          Produktion startet genau diesen Tag.
        question: Wie sieht ein Rollback jetzt aus?
        options:
          - Den Container mit dem Tag des vorigen Commits starten, z. B. shop:8be41d0.
          - Den alten Code auschecken und auf dem Produktionsserver neu bauen.
          - Die Registry löschen.
        answer: 0
        explanation: >
          Das alte Image liegt unverändert in der Registry. Kein Neubau, kein Risiko, dass der Neubau anders aussieht.
      - situation: >
          Staging hat Image `shop:3f2a9c1` zwei Tage lang getestet. Für Produktion will jemand das Image „zur
          Sicherheit“ noch einmal frisch aus demselben Commit bauen.
        question: Ist das eine gute Idee?
        options:
          - Ja, frisch gebaut ist immer besser.
          - Nein – ein Neubau kann andere Paketversionen oder Basis-Images ziehen. Ausgeliefert wird das getestete Image.
        answer: 1
        explanation: Build once, deploy many – nur das getestete Artefakt ist das, dem du vertrauen kannst.
---

Stell dir eine Bäckerei vor, die jede Torte für den Laden **noch einmal neu** backt, nachdem die Probetorte
in der Küche geschmeckt hat. Ob die zweite genauso gelingt? Niemand weiß es. Bei Software ist es genauso:
Ausgeliefert wird das Paket, das getestet wurde – nicht ein Nachbau.

## Was ist ein Build-Artefakt?

Ein [[build-artefakt|Build-Artefakt]] ist das fertige Ergebnis eines Builds, das du ausliefern kannst. Je
nach Projekt sieht es anders aus:

| Projekt | Artefakt |
|---|---|
| Laravel-App klassisch | `.tar.gz` mit Code, `vendor/` und gebauten Assets |
| Laravel-App im Container | ein [[docker-image|Docker-Image]] |
| React-Frontend | der Ordner `dist/` mit HTML, JS und CSS |
| PHP-Bibliothek | ein Git-Tag, Composer lädt den Code selbst |

Wichtig ist, was **nicht** hineingehört: Tests, lokale `.env`-Dateien, Entwicklerwerkzeuge. Ein
Artefakt enthält genau das, was zum Laufen nötig ist.

## Build once, deploy many

Das wichtigste Prinzip dieser Lektion heißt [[build-once-deploy-many|Build once, deploy many]]: Du baust
**einmal** und lieferst dasselbe Artefakt an Staging und Produktion aus. Nur die Konfiguration unterscheidet
sich (dazu mehr im dritten Modul).

Warum? Jeder Neubau kann anders ausfallen: Ein Paket bekommt über Nacht ein Update, ein Basis-Image ändert
sich, ein Build-Server hat eine andere PHP-Version. Hast du auf Staging Artefakt A getestet und lieferst
Artefakt B aus, hast du B nie getestet.

> [!MERKSATZ]
> Getestet und ausgeliefert wird **dasselbe** Artefakt. Unterschiede zwischen Umgebungen stecken nur in
> der Konfiguration, nie im Code.

## Eindeutig benennen und prüfen

Ein Artefakt braucht einen Namen, der genau einen Stand bezeichnet. Der kurze [[commit-hash|Commit-Hash]]
ist ideal, später kommt eine Versionsnummer dazu.

```bash title="Ein Artefakt aus dem committeten Stand"
SHA=$(git rev-parse --short HEAD)
git archive --format=tar.gz -o "dist/app-$SHA.tar.gz" HEAD
(cd dist && sha256sum "app-$SHA.tar.gz" > "app-$SHA.tar.gz.sha256")
```

`git archive` packt nur committete Dateien – eine lokale `.env` rutscht so nie hinein. Was trotzdem nicht ins
Paket soll, markierst du in `.gitattributes` mit `export-ignore`. Die [[pruefsumme|Prüfsumme]] ist das
Siegel: Mit `sha256sum -c` prüft der Server vor dem Auspacken, dass das Paket unterwegs nicht verändert wurde.

> [!FEHLER]
> **Auf dem Server bauen.** `git pull && composer install && npm run build` direkt in Produktion heißt: Der
> Server baut einen ungetesteten Stand, braucht Internet und Build-Werkzeuge – und ist während des Builds
> halb alt, halb neu.

## Images, Tags und Registries

Läuft deine App in Containern, ist das Artefakt ein Image. Es landet in einer
[[container-registry|Container-Registry]], zum Beispiel GitHub Container Registry (`ghcr.io`) oder
Docker Hub. Jede Version bekommt einen [[image-tag|Image-Tag]]:

```bash title="Ein Image mehrfach taggen"
docker build -t ghcr.io/example-org/shop:3f2a9c1 .
docker tag ghcr.io/example-org/shop:3f2a9c1 ghcr.io/example-org/shop:1.4.2
docker push ghcr.io/example-org/shop:3f2a9c1
docker push ghcr.io/example-org/shop:1.4.2
```

| Tag | Ändert sich? | Wofür |
|---|---|---|
| `3f2a9c1` (Commit) | nie | Deployments, Rollbacks |
| `1.4.2` (Version) | nie | Releases, Menschen |
| `latest` | ständig | höchstens zum Ausprobieren |

> [!PRAXIS]
> In Container-Umgebungen startet die Produktion fast immer einen unveränderlichen Tag oder sogar den
> Image-Digest (`shop@sha256:…`). So steht im Deployment-Protokoll exakt, welcher Code lief.

## Zusammenfassung

- Ein **Build-Artefakt** ist das fertige, auslieferbare Paket – ohne Tests und lokale Geheimnisse.
- **Build once, deploy many**: dasselbe Artefakt geht auf Staging und Produktion.
- Benenne Artefakte nach Commit-Hash oder Version und sichere sie mit einer **Prüfsumme**.
- `git archive` packt nur Committetes, `export-ignore` schließt weitere Pfade aus.
- Images liegen in einer **Registry**; für Deployments nutzt du unveränderliche Tags statt `latest`.
