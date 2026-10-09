---
title: Makefile-Grundlagen
summary: Targets, Voraussetzungen, Rezepte, Variablen und .PHONY – wie du mit make wiederkehrende Befehle eines Projekts bündelst.
duration: 25
sources:
  - title: GNU make – Manual
    url: https://www.gnu.org/software/make/manual/make.html
  - title: GNU make – Rule Introduction
    url: https://www.gnu.org/software/make/manual/html_node/Rule-Introduction.html
  - title: GNU make – Phony Targets
    url: https://www.gnu.org/software/make/manual/html_node/Phony-Targets.html
quiz:
  - type: find-bug
    question: "`make test` bricht mit „missing separator. Stop.“ ab. In welcher Zeile liegt der Fehler?"
    language: makefile
    code: |
      .PHONY: test lint

      test:
      	./vendor/bin/pest

      lint:
          ./vendor/bin/pint --test
    bug_line: 7
    explanation: Vor Zeile 7 stehen Leerzeichen statt eines Tabs. make erkennt Rezeptzeilen nur am Tab-Zeichen am Zeilenanfang.
  - type: single
    question: "Wozu dient `.PHONY: clean`?"
    options:
      - Es versteckt das Target vor `make help`.
      - Es sagt make, dass `clean` keine Datei ist – das Rezept läuft also immer, auch wenn eine Datei namens `clean` existiert.
      - Es macht das Target zum Standard-Target.
    answer: 1
    explanation: Ohne `.PHONY` prüft make, ob eine Datei `clean` existiert und aktuell ist. Liegt zufällig so eine Datei herum, passiert sonst einfach nichts.
  - type: match
    question: Was bedeuten diese Zeichen im Makefile?
    pairs:
      - { left: "@echo Hallo", right: "Befehl wird ausgeführt, aber nicht vorher angezeigt" }
      - { left: "$(PORT)", right: "Wert der make-Variable PORT" }
      - { left: "$$HOME", right: "Shell-Variable HOME (make macht aus $$ ein $)" }
      - { left: "test: build", right: "test hat build als Voraussetzung" }
    explanation: "make ersetzt `$(...)` selbst. Für die Shell bestimmte Dollarzeichen musst du deshalb verdoppeln."
  - type: cloze
    text: Ohne Angabe eines Targets führt `make` das ___ Target in der Datei aus. Mit `make ___` siehst du nur, welche Befehle laufen würden.
    blanks:
      - [erste, oberste]
      - [-n, --dry-run]
    explanation: "Das erste Target ist der Standard (änderbar mit `.DEFAULT_GOAL`). `make -n` ist ein Probelauf ohne Ausführung."
tasks:
  - id: erstes-makefile
    type: terminal
    title: Dein erstes Makefile
    description: |
      Im Ordner `make-grundlagen` liegen ein Skript `src/hallo.sh` und ein Test `tests/test.sh`. Der Test
      erwartet eine „gebaute“ Kopie des Skripts unter `dist/hallo.sh`.

      Schreibe ein `Makefile` mit diesen Targets:

      1. `build`: legt den Ordner `dist` an und kopiert `src/hallo.sh` nach `dist/hallo.sh`.
      2. `test`: hat `build` als Voraussetzung und führt `./tests/test.sh` aus.
      3. `clean`: löscht den Ordner `dist`.
      4. Erkläre alle drei Targets mit `.PHONY` zu Nicht-Datei-Targets.

      Teste mit `make clean`, `make test` und `make test` (zweimal). Achte auf **Tabs** vor den Befehlen.
      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: make-grundlagen
    setup: |
      mkdir -p src tests
      printf '#!/usr/bin/env bash\necho "Hallo, ${1:-Welt}!"\n' > src/hallo.sh
      chmod +x src/hallo.sh
      cat > tests/test.sh <<'EOF'
      #!/usr/bin/env bash
      ergebnis=$(./dist/hallo.sh Ada) || { echo "dist/hallo.sh fehlt"; exit 1; }
      if [ "$ergebnis" = "Hallo, Ada!" ]; then echo "Tests bestanden"; else echo "Falsch: $ergebnis"; exit 1; fi
      EOF
      chmod +x tests/test.sh
    checks:
      - type: file_exists
        path: Makefile
        message: Die Datei Makefile fehlt noch (Großes M, keine Endung).
      - type: command
        run: make clean > /dev/null && test ! -e dist
        message: make clean soll fehlerfrei laufen und den Ordner dist löschen.
      - type: command
        run: make clean > /dev/null && make test
        stdout_matches: "Tests bestanden"
        message: Nach make clean soll make test erst bauen (Voraussetzung build) und dann die Tests bestehen.
      - type: command
        run: make build > /dev/null && test -x dist/hallo.sh
        message: make build soll dist/hallo.sh anlegen (ausführbar, cp behält die Rechte).
      - type: file_contains
        path: Makefile
        pattern: "^\\.PHONY:.*\\bbuild\\b"
        message: Trage build, test und clean in .PHONY ein.
      - type: command
        run: d=$(mktemp -d "$PWD/.pruefung-XXXXXX") && cp -r Makefile src tests "$d/" && cd "$d" && make build > /dev/null && touch clean && make clean > /dev/null && test ! -e dist; rc=$?; cd ..; rm -rf "$d"; exit $rc
        message: Liegt eine Datei namens clean im Ordner, tut make clean nichts – fehlt clean in .PHONY?
    hints:
      - "Ein Target sieht so aus: `name: voraussetzungen`, darunter jede Befehlszeile mit einem **Tab** eingerückt."
      - "In nano fügst du ein Tab mit der Tab-Taste ein. Mit `cat -A Makefile` siehst du Tabs als `^I`."
      - "`.PHONY: build test clean` gehört in eine eigene Zeile, meist ganz oben."
    solution: |
      ```bash
      cd make-grundlagen
      printf '.PHONY: build test clean\n\nbuild:\n\tmkdir -p dist\n\tcp src/hallo.sh dist/hallo.sh\n\ntest: build\n\t./tests/test.sh\n\nclean:\n\trm -rf dist\n' > Makefile
      cat -A Makefile
      make clean
      make test
      ```
  - id: make-ablauf
    type: order
    title: Was macht make bei „make test“?
    description: "Das Makefile enthält `test: build` und `build: dist/app.js`. Bringe die Schritte, die make bei `make test` ausführt, in die richtige Reihenfolge."
    items:
      - make liest das Makefile im aktuellen Ordner
      - make sucht das Target test
      - make stellt fest, dass test die Voraussetzung build hat
      - make prüft und baut zuerst die Voraussetzungen von build
      - make führt das Rezept von build aus
      - make führt das Rezept von test aus
---

Jedes Projekt hat Befehle, die man immer wieder braucht: Abhängigkeiten installieren, Tests starten,
Container hochfahren, aufräumen. Oft sind sie lang (`docker compose exec app php artisan migrate --seed`)
und niemand kann sie sich merken. Ein [[task-runner|Task-Runner]] gibt ihnen kurze Namen. Der älteste
und am weitesten verbreitete ist **make**.

## make und das Makefile

`make` ist ein Programm, das seit den 1970ern Teil von Unix ist und auf praktisch jedem Linux- und
macOS-System vorhanden ist. Es liest eine Datei namens [[makefile|`Makefile`]] im aktuellen Ordner und
führt die darin beschriebenen Aufgaben aus.

Ursprünglich wurde make erfunden, um C-Programme zu kompilieren – und zwar nur die Dateien, die sich
geändert haben. Heute nutzen Web-Teams es vor allem als **Bedienfeld**: `make test`, `make start`,
`make logs`. Ein Befehl, den jede Person im Team gleich tippt, egal wie kompliziert er dahinter ist.

## Die Regel: Target, Voraussetzungen, Rezept

Ein Makefile besteht aus Regeln. Jede Regel hat drei Teile:

```makefile title="Aufbau einer Regel"
target: voraussetzung1 voraussetzung2
	befehl1
	befehl2
```

| Teil | Bedeutung |
|---|---|
| [[make-target|Target]] | Der Name der Aufgabe (oder der Datei, die entsteht) |
| Voraussetzungen | Targets oder Dateien, die vorher erledigt bzw. aktuell sein müssen |
| Rezept | Die Shell-Befehle, jeweils mit einem **Tab** eingerückt |

```makefile title="Makefile"
install:
	npm install

test: install
	npm test
```

`make test` prüft zuerst die Voraussetzung `install`, führt deren Rezept aus und erst dann `npm test`.
Rufst du `make` ohne Target auf, läuft das **erste** Target der Datei.

> [!FEHLER]
> **Leerzeichen statt Tab.** Rezeptzeilen müssen mit einem echten Tab-Zeichen beginnen. Mit Leerzeichen
> bricht make mit `missing separator. Stop.` ab. Deshalb gehört `[Makefile] indent_style = tab` in jede
> `.editorconfig`. Mit `cat -A Makefile` siehst du Tabs als `^I`.

## Datei-Targets und .PHONY

Eigentlich denkt make in **Dateien**: Ein Target ist eine Datei, die gebaut wird. make führt das Rezept
nur aus, wenn die Datei fehlt oder älter ist als eine ihrer Voraussetzungen:

```makefile title="Datei-Target"
.env: .env.example
	cp .env.example .env
```

Das ist praktisch: `make .env` legt die Datei nur an, wenn sie noch nicht existiert.

Targets wie `test` oder `clean` erzeugen aber keine Datei. Liegt zufällig eine Datei namens `clean` im
Ordner, meldet make „ist aktuell“ und tut nichts. Deshalb erklärst du solche Targets zu
[[phony-target|Phony-Targets]]:

```makefile title="Makefile"
.PHONY: install test clean
```

> [!MERKSATZ]
> Jedes Target, das keine Datei erzeugt, gehört in `.PHONY`. Dann läuft sein Rezept bei jedem Aufruf.

## Rezepte und Variablen

Jede Rezeptzeile läuft in einer **eigenen** Shell. Ein `cd` in Zeile 1 gilt in Zeile 2 nicht mehr – verbinde
solche Befehle mit `&&` in einer Zeile. Vorangestellte Zeichen ändern das Verhalten:

| Präfix | Wirkung |
|---|---|
| `@` | Befehl wird nicht vor der Ausführung angezeigt |
| `-` | Ein Fehler in dieser Zeile bricht make nicht ab |

Bricht ein Befehl mit einem [[exit-code|Exit-Code]] ungleich 0 ab, stoppt make sofort. Genau das willst
du bei `make test`.

Variablen machen Makefiles lesbar und anpassbar:

```makefile title="Variablen"
COMPOSE := docker compose
PORT ?= 8000

start:
	$(COMPOSE) up -d
	@echo "App läuft auf http://localhost:$(PORT)"
```

`:=` setzt einen Wert, `?=` nur, wenn die Variable noch nicht gesetzt ist. Überschreiben kannst du sie
beim Aufruf: `make start PORT=9000`. Dollarzeichen für die Shell verdoppelst du: `echo $$HOME`.

> [!PRAXIS]
> `make -n test` zeigt, welche Befehle laufen **würden**, ohne sie auszuführen. Bevor du ein fremdes
> Makefile benutzt, ist das ein guter erster Schritt.

## Zusammenfassung

- make liest das `Makefile` und führt Targets aus; ohne Angabe das erste Target.
- Eine Regel besteht aus Target, Voraussetzungen und Rezept; Rezeptzeilen beginnen mit einem Tab.
- Datei-Targets werden nur gebaut, wenn die Datei fehlt oder veraltet ist.
- Targets ohne Datei (test, clean, start) gehören in `.PHONY`.
- `@` unterdrückt die Anzeige, `$(VAR)` liest Variablen, `?=` erlaubt Überschreiben per `make VAR=wert`.
- Jede Rezeptzeile läuft in einer eigenen Shell; ein Fehler stoppt make.
