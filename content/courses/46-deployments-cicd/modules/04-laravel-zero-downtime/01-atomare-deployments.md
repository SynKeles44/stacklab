---
title: Atomare Deployments mit Symlink-Wechsel
summary: Wie Release-Ordner, ein geteiltes shared-Verzeichnis und ein atomarer Symlink-Wechsel eine Laravel-App ohne Ausfallzeit aktualisieren – und wie ein Rollback in Sekunden gelingt.
duration: 25
sources:
  - title: Laravel Docs – Deployment
    url: https://laravel.com/docs/13.x/deployment
  - title: GNU Coreutils – ln invocation
    url: https://www.gnu.org/software/coreutils/manual/html_node/ln-invocation.html
  - title: GNU Coreutils – mv invocation
    url: https://www.gnu.org/software/coreutils/manual/html_node/mv-invocation.html
  - title: Deployer – Laravel recipe
    url: https://deployer.org/docs/8.x/recipe/laravel
quiz:
  - type: single
    question: Warum ist `git pull` direkt im Live-Ordner kein Zero-Downtime-Deployment?
    options:
      - Weil git pull zu langsam ist.
      - Weil während des Pulls, composer install und des Builds ein Mix aus alten und neuen Dateien ausgeliefert wird.
      - Weil Git auf Servern nicht erlaubt ist.
      - Weil git pull die .env löscht.
    answer: 1
    explanation: >
      Ein Request, der mitten im Aktualisieren ankommt, sieht halb alten, halb neuen Code – oder ein leeres
      vendor/. Atomar heißt: Der Wechsel passiert in einem einzigen, unteilbaren Schritt.
  - type: match
    question: Ordne jeden Ordner seiner Aufgabe zu.
    pairs:
      - { left: "releases/<zeitstempel>", right: "ein vollständiger, unveränderlicher Stand der App" }
      - { left: "shared/", right: "Daten, die jedes Release braucht: .env und storage" }
      - { left: "current", right: "Symlink auf das aktive Release" }
      - { left: "public/ im Webserver", right: "Document Root über current/public" }
    explanation: Releases sind austauschbar, shared bleibt, current entscheidet, was ausgeliefert wird.
  - type: find-bug
    question: Dieses Skript soll den Symlink atomar umschalten. Welche Zeile macht es nicht atomar?
    language: bash
    code: |
      #!/usr/bin/env bash
      set -euo pipefail
      cd /var/www/shop
      NEW=releases/20261010-1200
      rm -f current
      ln -s "$NEW" current
      echo "Aktiv: $(readlink current)"
    bug_line: 5
    explanation: >
      Zwischen `rm` und `ln` gibt es keinen `current`-Link – Requests in diesem Moment landen im Leeren. Atomar:
      `ln -sfn "$NEW" current.tmp && mv -T current.tmp current`.
  - type: cloze
    text: "Einen neuen Symlink legst du zuerst unter einem Hilfsnamen an und benennst ihn dann mit `mv -___ current.tmp current` um. Ein Rollback lässt `current` wieder auf das ___ Release zeigen."
    blanks:
      - [T]
      - [vorige, vorherige, alte, letzte]
    explanation: Das Umbenennen ist auf Linux ein einziger Systemaufruf – entweder alt oder neu, nie dazwischen.
tasks:
  - id: struktur-beschriften
    type: diagram
    title: Beschrifte die Release-Struktur
    description: Das Bild zeigt den Ordner einer Laravel-App auf dem Server. Ziehe die Namen an die richtigen Stellen.
    image: /assets/deployments-cicd/atomares-deployment-leer.svg
    slots:
      - { x: 14, y: 27.7, answer: current }
      - { x: 50, y: 23.5, answer: releases/ }
      - { x: 86.5, y: 23.5, answer: shared/ }
    distractors: [vendor/, .git/]
    hints:
      - Der Symlink zeigt auf ein Release. Die Dateien rechts brauchen alle Releases gemeinsam.
  - id: symlink-wechsel
    type: terminal
    title: Ein Release atomar aktivieren
    description: |
      Im Ordner `atomar` ist ein Server nachgebaut: `server/releases/20261009-0900` ist aktiv, `server/current`
      zeigt darauf, und in `server/shared` liegen `.env` und `storage/`. Daneben liegt das neue Build-Artefakt
      `app-v2.tar.gz`.

      1. Lege `server/releases/20261010-1200` an und entpacke das Artefakt hinein.
      2. Verlinke im neuen Release `.env` und `storage` auf die Einträge in `server/shared`
         (die Links dürfen relativ oder absolut sein).
      3. Schalte `server/current` **atomar** auf das neue Release um: erst einen Link `current.tmp` anlegen, dann
         mit `mv -T` über `current` schieben.
      4. Prüfe mit `cat server/current/public/index.php`, dass jetzt Version 2 ausgeliefert wird. Das alte Release
         bleibt für einen Rollback liegen.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: atomar
    setup: |
      mkdir -p server/releases/20261009-0900/public server/shared/storage/logs build/public build/app
      printf '<?php echo "Version 1";\n' > server/releases/20261009-0900/public/index.php
      printf 'APP_ENV=production\nAPP_DEBUG=false\n' > server/shared/.env
      printf 'log\n' > server/shared/storage/logs/laravel.log
      ln -s "$(pwd)/server/shared/.env" server/releases/20261009-0900/.env
      ln -s "$(pwd)/server/shared/storage" server/releases/20261009-0900/storage
      ln -s releases/20261009-0900 server/current
      printf '<?php echo "Version 2";\n' > build/public/index.php
      printf '<?php // app code\n' > build/app/Kernel.php
      tar -czf app-v2.tar.gz -C build .
      rm -rf build
    checks:
      - type: command
        run: test -f server/releases/20261010-1200/public/index.php && test -f server/releases/20261010-1200/app/Kernel.php
        message: Das Artefakt ist noch nicht nach server/releases/20261010-1200 entpackt.
      - type: command
        run: test -L server/releases/20261010-1200/.env && test "$(readlink -f server/releases/20261010-1200/.env)" = "$(readlink -f server/shared/.env)"
        message: Im neuen Release fehlt der Symlink .env auf server/shared/.env.
      - type: command
        run: test -L server/releases/20261010-1200/storage && test "$(readlink -f server/releases/20261010-1200/storage)" = "$(readlink -f server/shared/storage)"
        message: Im neuen Release fehlt der Symlink storage auf server/shared/storage.
      - type: command
        run: test -L server/current && test "$(readlink -f server/current)" = "$(readlink -f server/releases/20261010-1200)"
        message: server/current ist kein Symlink auf das neue Release. Nutze ln -sfn … current.tmp und mv -T current.tmp current.
      - type: file_absent
        path: server/current.tmp
        message: server/current.tmp liegt noch herum – mv -T benennt den Hilfslink um, danach darf er nicht mehr existieren.
      - type: command
        run: cat server/current/public/index.php
        stdout_matches: "Version 2"
        message: Über server/current wird noch nicht Version 2 ausgeliefert.
      - type: command
        run: test -f server/releases/20261009-0900/public/index.php
        message: Das alte Release wurde gelöscht – es soll für einen Rollback liegen bleiben.
      - type: file_exists
        path: server/shared/storage/logs/laravel.log
        message: server/shared/storage/logs/laravel.log fehlt – die geteilten Daten dürfen nicht verloren gehen.
    hints:
      - "Entpacken: `mkdir -p server/releases/20261010-1200 && tar -xzf app-v2.tar.gz -C server/releases/20261010-1200`."
      - "Relative Links funktionieren gut: `ln -s ../../shared/.env server/releases/20261010-1200/.env` (gleich für storage)."
      - "Umschalten: `ln -sfn releases/20261010-1200 server/current.tmp && mv -T server/current.tmp server/current`."
    solution: |
      ```bash
      cd atomar
      NEW=20261010-1200
      mkdir -p server/releases/$NEW
      tar -xzf app-v2.tar.gz -C server/releases/$NEW
      ln -s ../../shared/.env server/releases/$NEW/.env
      ln -s ../../shared/storage server/releases/$NEW/storage
      ln -sfn releases/$NEW server/current.tmp
      mv -T server/current.tmp server/current
      cat server/current/public/index.php
      ls -l server
      ```
---

Ein Shop, Mittwoch 11 Uhr, 200 Bestellungen pro Stunde. Ihr müsst einen Fehler im Warenkorb beheben – jetzt,
nicht nachts. Mit `git pull` im Live-Ordner riskierst du kaputte Requests, mit einer Wartungsseite verlierst
du Bestellungen. Die Lösung heißt [[zero-downtime-deployment|Zero-Downtime-Deployment]]: Die Nutzer merken
vom Deployment schlicht nichts.

## Warum „im Live-Ordner aktualisieren“ scheitert

Ein klassisches Update auf dem Server dauert: Code holen, `composer install`, Assets bauen, Caches
erzeugen. In dieser Zeit beantwortet PHP weiter Requests – mit einem **Mix** aus alten und neuen Dateien.

- Neue Klasse da, `vendor/` noch alt → `Class not found`.
- `vendor/` gerade gelöscht und neu geschrieben → jeder Request scheitert.
- Abbruch mittendrin → der Server ist in einem Zustand, den es nie gab.

Die Lösung: Der neue Stand wird **daneben** vollständig vorbereitet. Umgeschaltet wird erst, wenn er fertig
ist – in einem einzigen, unteilbaren Schritt. Das nennt man ein [[atomares-deployment|atomares Deployment]].

## Release-Ordner und shared

Auf dem Server liegt nicht ein App-Ordner, sondern mehrere:

```text title="/var/www/shop"
current -> releases/20261010-1200
releases/
├── 20261009-0900/
└── 20261010-1200/
    ├── app/  public/  vendor/ ...
    ├── .env      -> ../../shared/.env
    └── storage   -> ../../shared/storage
shared/
├── .env
└── storage/
```

![Release-Ordner, shared-Verzeichnis und der current-Symlink](/assets/deployments-cicd/atomares-deployment.svg)

| Teil | Inhalt |
|---|---|
| [[release-verzeichnis|Release-Ordner]] | ein vollständiger Stand, nach dem Entpacken unverändert |
| [[shared-verzeichnis|shared]] | `.env`, `storage/` mit Uploads, Logs und Sessions – überlebt jedes Release |
| `current` | ein [[symlink|Symlink]] auf das aktive Release |

Der Webserver zeigt mit seinem Document Root auf `/var/www/shop/current/public`.

> [!MERKSATZ]
> Releases sind austauschbar, `shared` bleibt, `current` entscheidet, was ausgeliefert wird.

## Der atomare Wechsel

Der entscheidende Moment ist das Umbiegen von `current`. `rm current && ln -s …` hätte eine Lücke ohne Link.
Stattdessen legst du einen neuen Link unter einem Hilfsnamen an und benennst ihn um:

```bash title="Umschalten ohne Lücke"
ln -sfn releases/20261010-1200 current.tmp
mv -T current.tmp current
```

`mv` benennt auf demselben Dateisystem mit einem einzigen Systemaufruf um. Jeder Request sieht entweder das
alte oder das neue Release – nie einen Zwischenzustand. `-T` sorgt dafür, dass `mv` `current` als Ziel
ersetzt, statt den Link **in** den Ordner zu schieben, auf den `current` zeigt.

> [!FEHLER]
> **PHP-FPM sieht den alten Code.** OPcache und PHPs Realpath-Cache merken sich aufgelöste Pfade. Nach dem
> Wechsel lädst du PHP-FPM neu (`sudo systemctl reload php8.5-fpm`), und nginx übergibt mit `$realpath_root`
> den echten Release-Pfad statt `current`.

## Ablauf und Rollback

Ein vollständiges Deployment mit dieser Struktur:

1. Artefakt hochladen, [[pruefsumme|Prüfsumme]] prüfen, nach `releases/<zeitstempel>` entpacken.
2. `.env` und `storage` auf `shared` verlinken.
3. Caches bauen (`php artisan optimize`), Migrationen ausführen (nächste Lektion).
4. `current` atomar umschalten, PHP-FPM neu laden, Queue-Worker neu starten.
5. Alte Releases aufräumen, die letzten drei bis fünf behalten.

Und wenn das neue Release Fehler zeigt? Ein [[deployment-rollback|Rollback]] ist derselbe Wechsel in die
andere Richtung:

```bash title="Zurück zum vorigen Release"
PREV=$(ls -1 releases | sort | tail -n 2 | head -n 1)
ln -sfn "releases/$PREV" current.tmp
mv -T current.tmp current
```

> [!PRAXIS]
> Werkzeuge wie Deployer oder Envoy und Hosting-Dienste wie Laravel Forge mit Zero-Downtime-Deployments
> setzen genau diese Struktur um. Wer sie einmal von Hand gebaut hat, versteht, was dort passiert.

## Zusammenfassung

- Im Live-Ordner zu aktualisieren liefert zeitweise einen Mix aus altem und neuem Code aus.
- Jedes Release bekommt einen eigenen Ordner, `.env` und `storage` liegen in `shared`.
- `ln -sfn … current.tmp && mv -T current.tmp current` schaltet atomar um.
- Nach dem Wechsel PHP-FPM neu laden, damit OPcache den neuen Pfad nutzt.
- Ein Rollback lässt `current` wieder auf das vorige Release zeigen; alte Releases werden aufgeräumt.
