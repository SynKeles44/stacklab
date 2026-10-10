---
title: Das Deploy-Skript mit Release-Ordnern
summary: Jede Version in einen eigenen Ordner, vorbereiten, dann blitzschnell per Symlink umschalten – und genauso schnell zurück.
duration: 25
sources:
  - title: Laravel 13 – Deployment, Optimization und Reloading Services
    url: https://laravel.com/docs/13.x/deployment#optimization
  - title: Laravel 13 – Migrations, Forcing Migrations to Run in Production
    url: https://laravel.com/docs/13.x/migrations#forcing-migrations-to-run-in-production
  - title: Laravel 13 – Queues, Queue Workers and Deployment
    url: https://laravel.com/docs/13.x/queues#queue-workers-and-deployment
  - title: GNU coreutils – mv (--no-target-directory)
    url: https://www.gnu.org/software/coreutils/manual/html_node/mv-invocation.html
quiz:
  - type: single
    question: Warum kopiert man neuen Code nicht einfach über den laufenden Ordner?
    options:
      - Weil Kopieren auf Servern verboten ist.
      - Weil während des Kopierens alte und neue Dateien gemischt sind und Anfragen in dieser Zeit fehlschlagen können.
      - Weil Git das nicht erlaubt.
      - Weil der Ordner dann zu groß wird.
    answer: 1
    explanation: >
      Ein Kopiervorgang dauert Sekunden bis Minuten. In dieser Zeit passt alter Code zu neuen Abhängigkeiten
      oder umgekehrt. Mit Release-Ordnern wird erst fertig vorbereitet und dann in einem Schritt umgeschaltet.
  - type: multiple
    question: Was liegt in `shared/` und wird per Symlink in jedes Release eingebunden?
    options:
      - die .env
      - der Ordner storage (Logs, Uploads, Sessions)
      - der Ordner vendor
      - der Ordner app
    answers: [0, 1]
    explanation: vendor und app gehören zum Release. Was über Deploys hinweg erhalten bleiben muss – Konfiguration und Uploads – liegt in shared.
  - type: cloze
    text: "In Produktion fragt `php artisan migrate` nach einer Bestätigung. Im Skript überspringst du sie mit der Option ___."
    blanks:
      - ["--force"]
    explanation: Ohne --force würde das Skript auf eine Eingabe warten oder abbrechen.
  - type: find-bug
    question: In welcher Zeile wird die neue Version zu früh live geschaltet?
    language: bash
    code: |
      git clone --depth 1 "$REPO" "$RELEASE"
      ln -s "$BASE/shared/.env" "$RELEASE/.env"
      ln -sfn "$RELEASE" "$BASE/current"
      cd "$RELEASE" && composer install --no-dev --no-interaction
      php artisan migrate --force
      php artisan optimize
    bug_line: 3
    explanation: >
      Der Symlink wird umgestellt, bevor Abhängigkeiten installiert, Migrationen ausgeführt und Caches gebaut
      sind. Besucher landen so auf einem halb fertigen Release. Umschalten ist der vorletzte Schritt.
tasks:
  - id: release-aktivieren
    type: terminal
    title: Ein Release atomar aktivieren
    description: |
      Im Ordner `release-wechsel` liegt unter `server/` ein nachgebauter Deploy-Ordner mit fünf Releases;
      `server/current` zeigt auf das älteste. Klicke zuerst auf **Aufgabe vorbereiten**.

      Schreibe ein Skript `aktivieren.sh`, das so aufgerufen wird: `BASE=./server bash aktivieren.sh 20261005120000`

      1. `#!/usr/bin/env bash` und `set -euo pipefail`; Standardwert `BASE="${BASE:-/var/www/example.com}"`.
      2. Das Release aus dem ersten Argument (`$1`) muss als Ordner in `$BASE/releases` existieren – sonst
         Fehlermeldung und `exit 1`, ohne etwas zu ändern.
      3. Schalte `current` **atomar** um: erst einen Symlink `current.neu` anlegen, dann mit
         `mv -T "$BASE/current.neu" "$BASE/current"` an seinen Platz bewegen.
      4. Lösche alle Releases bis auf die **drei neuesten** (die Namen sind Zeitstempel, also sortierbar).

      Teste mit `BASE=./server bash aktivieren.sh 20261005120000`, dann `ls server/releases` und
      `readlink server/current`.
    workdir: release-wechsel
    setup: |
      mkdir -p server/shared
      for r in 20261001120000 20261002120000 20261003120000 20261004120000 20261005120000; do
        mkdir -p "server/releases/$r/public"
        echo "<?php echo '$r';" > "server/releases/$r/public/index.php"
      done
      ln -s "$PWD/server/releases/20261001120000" server/current
    checks:
      - type: command
        run: bash -n aktivieren.sh && head -n1 aktivieren.sh
        stdout_matches: "^#!/usr/bin/env bash$"
        message: aktivieren.sh fehlt, hat einen Syntaxfehler oder beginnt nicht mit #!/usr/bin/env bash.
      - type: command
        run: grep -Eq '\bmv\s+(-[a-zA-Z]*T[a-zA-Z]*|--no-target-directory)\b' aktivieren.sh
        message: "Schalte mit `mv -T` um – nur so wird der Symlink in einem Schritt ersetzt."
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX"); for r in 20261001120000 20261002120000 20261003120000 20261004120000 20261005120000; do mkdir -p "$d/releases/$r/public"; done
          ln -s "$d/releases/20261001120000" "$d/current"
          BASE="$d" bash aktivieren.sh 20261005120000 >/dev/null 2>&1
          [ -L "$d/current" ] && [ "$(readlink -f "$d/current")" = "$(readlink -f "$d/releases/20261005120000")" ] && echo ok
          rm -rf "$d"
        stdout_equals: ok
        message: Nach dem Aufruf soll current ein Symlink auf releases/20261005120000 sein.
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX"); for r in 20261001120000 20261002120000 20261003120000 20261004120000 20261005120000; do mkdir -p "$d/releases/$r/public"; done
          ln -s "$d/releases/20261001120000" "$d/current"
          BASE="$d" bash aktivieren.sh 20261005120000 >/dev/null 2>&1
          ls "$d/releases" | tr '\n' ' '; test ! -e "$d/current.neu" || echo "current.neu liegt noch herum"
          rm -rf "$d"
        stdout_equals: "20261003120000 20261004120000 20261005120000"
        message: Es sollen genau die drei neuesten Releases übrig bleiben (und kein current.neu).
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX"); for r in 20261001120000 20261002120000 20261003120000 20261004120000 20261005120000; do mkdir -p "$d/releases/$r/public"; done
          ln -s "$d/releases/20261001120000" "$d/current"
          BASE="$d" bash aktivieren.sh 20990101000000 >/dev/null 2>&1; rc=$?
          echo "$rc $(basename "$(readlink -f "$d/current")") $(ls "$d/releases" | wc -l)"
          rm -rf "$d"
        stdout_matches: "^[1-9][0-9]* 20261001120000 5$"
        message: Bei einem unbekannten Release muss das Skript mit einem Fehler enden und nichts verändern – weder current noch die Releases.
    hints:
      - "Prüfen: `[ -d \"$BASE/releases/$1\" ] || { echo \"Release fehlt\" >&2; exit 1; }`"
      - "Umschalten: `ln -s \"$BASE/releases/$1\" \"$BASE/current.neu\"` und danach `mv -T \"$BASE/current.neu\" \"$BASE/current\"`."
      - "Aufräumen: `ls -1 \"$BASE/releases\" | sort | head -n -3` liefert alle außer den drei neuesten – mit `while read -r alt` und `rm -rf \"${BASE:?}/releases/${alt:?}\"` löschen."
    solution: |
      ```bash title="release-wechsel/aktivieren.sh"
      #!/usr/bin/env bash
      set -euo pipefail

      BASE="${BASE:-/var/www/example.com}"
      RELEASE="${1:?Bitte ein Release angeben}"

      if [ ! -d "$BASE/releases/$RELEASE" ]; then
        echo "Release $RELEASE gibt es nicht" >&2
        exit 1
      fi

      ln -sfn "$BASE/releases/$RELEASE" "$BASE/current.neu"
      mv -T "$BASE/current.neu" "$BASE/current"

      ls -1 "$BASE/releases" | sort | head -n -3 | while read -r alt; do
        rm -rf "${BASE:?}/releases/${alt:?}"
      done
      ```
  - id: deploy-reihenfolge
    type: order
    title: Die Reihenfolge eines Deploys
    description: Bring die Schritte eines Deploys mit Release-Ordnern in die richtige Reihenfolge.
    items:
      - Neuen Release-Ordner mit Zeitstempel anlegen und den Code hineinklonen
      - .env und storage aus shared/ per Symlink einbinden
      - composer install --no-dev ausführen
      - php artisan migrate --force ausführen
      - Caches mit php artisan optimize bauen
      - current atomar auf das neue Release umschalten
      - Queue-Worker mit php artisan queue:restart neu starten lassen
      - Alte Releases bis auf die letzten fünf löschen
---
Der einfachste Deploy ist `git pull` im laufenden Ordner. Das klappt – bis ein `composer install` mitten im
Betrieb abbricht und die Seite mit halb aktualisierten Abhängigkeiten dasteht. Profis trennen deshalb
**Vorbereiten** und **Umschalten**: Jede Version bekommt einen eigenen Ordner, und live geht sie erst, wenn
alles fertig ist.

## Release-Ordner, shared und current

![Release-Ordner, shared-Ordner und der current-Symlink](/assets/projekt-live-stellen/release-ordner.svg)

```text title="/var/www/example.com"
releases/
  20261009141500/      ← vorige Version
  20261010120000/      ← neue Version
shared/
  .env                 ← liegt nur einmal da
  storage/             ← Logs, Uploads, Sessions
current -> releases/20261010120000
```

| Ordner | Inhalt | Bei einem Deploy |
|---|---|---|
| `releases/<zeitstempel>` | kompletter Code samt `vendor/` | wird neu angelegt |
| `shared/` | `.env` und `storage/` | bleibt unverändert |
| `current` | ein [[symlink\|Symlink]] | zeigt danach auf das neue Release |

nginx zeigt immer auf `current/public`. Das Prinzip heißt [[release-ordner|Release-Ordner-Deployment]] –
viele Deploy-Werkzeuge arbeiten genau so.

## Die Schritte in der richtigen Reihenfolge

```bash title="deploy.sh (Kern)"
RELEASE="$BASE/releases/$(date +%Y%m%d%H%M%S)"
git clone --depth 1 --branch main "$REPO" "$RELEASE"

ln -s "$BASE/shared/.env" "$RELEASE/.env"
rm -rf "$RELEASE/storage" && ln -s "$BASE/shared/storage" "$RELEASE/storage"

cd "$RELEASE"
composer install --no-dev --optimize-autoloader --no-interaction
php artisan migrate --force
php artisan storage:link
php artisan optimize

ln -sfn "$RELEASE" "$BASE/current.neu" && mv -T "$BASE/current.neu" "$BASE/current"
php artisan queue:restart
```

- **`composer install --no-dev`** installiert nur Produktionspakete aus der `composer.lock`.
- **`migrate --force`**: Ohne `--force` fragt Laravel in Produktion nach einer Bestätigung.
- **`storage:link`** verlinkt `public/storage` auf `storage/app/public`, damit Uploads erreichbar sind.
- **`optimize`** cacht Konfiguration, Events, Routen und Views in einem Befehl.
- **`queue:restart`** bittet laufende Worker, nach dem aktuellen Job neu zu starten – mit neuem Code.
  Laravel 13 kennt zusätzlich `php artisan reload`, das alle lang laufenden Dienste anstößt.

> [!FEHLER]
> `current` umschalten, **bevor** Composer und Migrationen fertig sind. Dann landen Besucher auf einem
> Release ohne `vendor/` oder mit fehlenden Tabellen. Umgeschaltet wird erst, wenn alles vorbereitet ist.

## Atomar umschalten

`ln -sfn neu current` sieht aus wie ein Schritt, ist aber zwei: alten Link löschen, neuen anlegen.
Dazwischen gibt es einen winzigen Moment ohne `current`. Atomar – also in einem einzigen, unteilbaren
Schritt – wird es mit `mv`:

```bash title="Terminal"
ln -sfn "$BASE/releases/20261010120000" "$BASE/current.neu"
mv -T "$BASE/current.neu" "$BASE/current"
```

`mv` ersetzt einen Namen in einem Schritt. `-T` sorgt dafür, dass `mv` den Symlink `current` ersetzt,
statt in den Ordner zu wechseln, auf den er zeigt.

> [!MERKSATZ]
> Vorbereiten im neuen Ordner, umschalten mit `mv -T`, dann Worker neu starten. Ein Rollback ist derselbe
> Umschalt-Befehl mit dem vorigen Release.

## Aufräumen und zurückrollen

Jedes Release belegt Platz. Behalte die letzten drei bis fünf und lösche den Rest:

```bash title="Terminal"
ls -1 "$BASE/releases" | sort | head -n -5 | while read -r alt; do
  rm -rf "${BASE:?}/releases/${alt:?}"
done
```

`${BASE:?}` bricht mit einer Fehlermeldung ab, falls die Variable leer ist – so wird aus einem Tippfehler
nie ein `rm -rf /releases/…`.

Geht eine Version schief, schaltest du `current` auf das vorige Release zurück und startest die Worker neu.
Achtung: Migrationen werden dabei **nicht** zurückgedreht. Schreibe Migrationen deshalb so, dass auch die
alte Version mit dem neuen Schema läuft – erst Spalten hinzufügen, später entfernen. Mehr dazu im Kurs zu
Deployments und CI/CD.

> [!PRAXIS]
> Meist ruft die CI-Pipeline das Deploy-Skript auf: Nach grünen Tests verbindet sie sich per SSH als
> `deploy` mit dem Server und startet `deploy.sh`. Von Hand deployt dann niemand mehr.

## Zusammenfassung

- Jede Version bekommt einen eigenen Ordner in `releases/`; `.env` und `storage` kommen aus `shared/`.
- Reihenfolge: klonen → verlinken → `composer install --no-dev` → `migrate --force` → `optimize` → umschalten → `queue:restart`.
- **Atomar umschalten** mit `ln -s … current.neu` und `mv -T`.
- Alte Releases regelmäßig löschen; ein Rollback ist ein erneutes Umschalten.
- Migrationen müssen mit der vorigen Code-Version verträglich sein.
