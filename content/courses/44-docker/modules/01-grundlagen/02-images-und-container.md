---
title: Images und Container
summary: Wie Images benannt und getaggt werden, wie du sie holst und wie ein Container vom Start bis zum Löschen lebt.
duration: 20
sources:
  - title: Docker Docs – What is an image?
    url: https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-an-image/
  - title: Docker Docs – docker container run
    url: https://docs.docker.com/reference/cli/docker/container/run/
  - title: Docker Docs – docker image tag
    url: https://docs.docker.com/reference/cli/docker/image/tag/
quiz:
  - type: single
    question: Wie hängen Image und Container zusammen?
    options:
      - Ein Image ist ein gestoppter Container.
      - Ein Image ist eine unveränderliche Vorlage, aus der beliebig viele Container entstehen können.
      - Jedes Image kann genau einen Container haben.
      - Ein Container ist eine komprimierte Kopie eines Images.
    answer: 1
    explanation: >
      Wie bei Backform und Kuchen: Aus einem Image (der Form) entstehen beliebig viele Container (Kuchen).
      Jeder Container bekommt eine eigene, beschreibbare Schicht – das Image selbst ändert sich nie.
  - type: single
    question: Was bedeutet der Tag `latest` bei `nginx:latest`?
    options:
      - Docker prüft bei jedem Start, ob es eine neuere Version gibt.
      - Es ist garantiert die neueste stabile Version.
      - Es ist nur der Standard-Tag, den Docker nimmt, wenn du keinen angibst – sein Inhalt kann sich jederzeit ändern.
      - Es ist eine feste, nie veränderte Version.
    answer: 2
    explanation: >
      `latest` ist ein ganz normaler Tag ohne Sonderbedeutung. Der Herausgeber kann ihn jederzeit auf ein anderes
      Image zeigen lassen. Für reproduzierbare Setups gibst du deshalb immer eine Version an.
  - type: match
    question: Ordne jedem Befehl seine Wirkung zu.
    pairs:
      - { left: "docker ps", right: "Zeigt laufende Container" }
      - { left: "docker ps -a", right: "Zeigt auch gestoppte Container" }
      - { left: "docker stop web", right: "Beendet den Container web, behält ihn aber" }
      - { left: "docker rm web", right: "Löscht den gestoppten Container web" }
      - { left: "docker image ls", right: "Listet die lokal gespeicherten Images" }
    explanation: >
      Ein gestoppter Container existiert weiter (samt seiner Änderungen), bis du ihn mit `docker rm` löschst.
  - type: cloze
    text: Der vollständige Name `registry.example.com/team/shop:2.1.0` besteht aus Registry `registry.example.com`, Repository `team/shop` und dem ___ `2.1.0`. Mit der Option `___` wird ein Container nach dem Beenden automatisch gelöscht.
    blanks:
      - [Tag, Image-Tag]
      - [--rm, "-rm", rm]
    explanation: Der Teil nach dem Doppelpunkt ist der Tag. `docker run --rm …` räumt den Container nach dem Ende von selbst weg.
tasks:
  - id: erster-container
    type: simulated
    title: Dein erster Container
    description: |
      Übe den Lebenszyklus eines Containers. Das Terminal ist simuliert – auf deinem eigenen Rechner mit Docker
      funktionieren die Befehle genauso.

      1. Lade das Image `nginx:1.30-alpine` herunter.
      2. Starte daraus im Hintergrund einen Container mit dem Namen `web`.
      3. Zeige die laufenden Container an.
      4. Stoppe den Container `web`.
      5. Lösche den Container `web`.
    prompt: "du@laptop:~$"
    steps:
      - expect: "^docker\\s+(image\\s+)?pull\\s+nginx:1\\.30-alpine\\s*$"
        output: |
          1.30-alpine: Pulling from library/nginx
          a1b2c3d4e5f6: Pull complete
          b2c3d4e5f6a1: Pull complete
          Digest: sha256:3f1c0a…
          Status: Downloaded newer image for nginx:1.30-alpine
          docker.io/library/nginx:1.30-alpine
        hint: "docker pull nginx:1.30-alpine"
      - expect: "^docker\\s+(container\\s+)?run\\s+(-d\\s+--name[\\s=]web|--name[\\s=]web\\s+-d|--detach\\s+--name[\\s=]web|--name[\\s=]web\\s+--detach)\\s+nginx:1\\.30-alpine\\s*$"
        output: |
          4f9d2c1b8e7a6d5c4b3a2918f7e6d5c4b3a2918f7e6d5c4b3a2918f7e6d5c4b
        hint: "docker run -d --name web nginx:1.30-alpine – -d startet im Hintergrund."
      - expect: "^docker\\s+(ps|container\\s+ls)\\s*$"
        output: |
          CONTAINER ID   IMAGE               COMMAND                  CREATED          STATUS          PORTS     NAMES
          4f9d2c1b8e7a   nginx:1.30-alpine   "/docker-entrypoint.…"   12 seconds ago   Up 11 seconds   80/tcp    web
        hint: docker ps
      - expect: "^docker\\s+(container\\s+)?stop\\s+web\\s*$"
        output: web
        hint: docker stop web
      - expect: "^docker\\s+(container\\s+)?rm\\s+web\\s*$"
        output: web
        hint: docker rm web
    responses:
      - match: "^docker\\s+ps\\s+-a"
        output: |
          CONTAINER ID   IMAGE               COMMAND                  CREATED         STATUS                     PORTS     NAMES
          4f9d2c1b8e7a   nginx:1.30-alpine   "/docker-entrypoint.…"   2 minutes ago   Exited (0) 5 seconds ago             web
      - match: "^docker\\s+image\\s+ls"
        output: |
          REPOSITORY   TAG           IMAGE ID       CREATED      SIZE
          nginx        1.30-alpine   7d3e1f2a9b8c   9 days ago   52.6MB
    hints:
      - Für jeden Schritt gibt es genau einen Befehl.
      - "Reihenfolge: pull, run -d --name web, ps, stop, rm."
    solution: |
      ```bash
      docker pull nginx:1.30-alpine
      docker run -d --name web nginx:1.30-alpine
      docker ps
      docker stop web
      docker rm web
      ```
  - id: lebenszyklus
    type: order
    title: Der Lebenszyklus eines Containers
    description: Bring die Stationen eines Containers in die richtige Reihenfolge.
    items:
      - Das Image liegt in einer Registry.
      - docker pull lädt das Image auf deinen Rechner.
      - docker run erzeugt aus dem Image einen Container und startet ihn.
      - Der Hauptprozess läuft – der Container hat den Status „Up“.
      - docker stop beendet den Prozess – der Container hat den Status „Exited“.
      - docker rm löscht den Container samt seiner beschreibbaren Schicht.
    hints:
      - Ein Container kann nur gelöscht werden, nachdem er gestoppt wurde (oder du erzwingst es mit -f).
---
In der letzten Lektion hast du gesehen, dass Docker „Images“ herunterlädt und daraus „Container“ startet.
Diese beiden Begriffe werden oft verwechselt. Wenn du den Unterschied einmal verstanden hast, ergeben fast
alle Docker-Befehle plötzlich Sinn.

## Image = Vorlage, Container = laufende Instanz

Denk an eine Backform und Kuchen. Die Form legt fest, wie jeder Kuchen aussieht. Aus einer Form backst du
beliebig viele Kuchen – und wenn du einen Kuchen anschneidest, bleibt die Form unverändert.

- Ein [[docker-image|Image]] ist die **Form**: ein unveränderliches Paket mit Dateisystem, Programmen und der
  Angabe, welcher Befehl beim Start laufen soll.
- Ein [[container]] ist der **Kuchen**: eine laufende Instanz des Images. Docker legt dafür eine dünne,
  beschreibbare Schicht über das Image.

Schreibt dein Programm im Container eine Datei, landet sie nur in dieser Schicht. Ein zweiter Container aus
demselben Image sieht davon nichts.

> [!MERKSATZ]
> Images sind unveränderliche Vorlagen. Container sind laufende Instanzen mit eigener beschreibbarer Schicht.

## Image-Namen und Tags

Ein vollständiger Image-Name hat bis zu drei Teile:

```text title="Aufbau eines Image-Namens"
registry.example.com/team/shop:2.1.0
└──── Registry ────┘ └ Repository ┘ └ Tag ┘
```

| Teil | Bedeutung | Standard, wenn weggelassen |
|---|---|---|
| Registry | Server, der das Image speichert | `docker.io` (Docker Hub) |
| Repository | Name des Images, oft mit Team-Präfix | – (Pflicht) |
| [[image-tag|Tag]] | Version oder Variante | `latest` |

`nginx` bedeutet also ausgeschrieben `docker.io/library/nginx:latest`. `library` ist der Bereich für die
offiziellen Images auf Docker Hub.

Tags beschreiben oft Version **und** Variante: `node:24-alpine` ist Node.js 24 auf dem winzigen
[[alpine-linux|Alpine Linux]], `php:8.5-fpm` ist PHP 8.5 mit [[php-fpm|PHP-FPM]].

> [!FEHLER]
> `latest` heißt nicht „neueste stabile Version“. Es ist nur der Standard-Tag. Heute zeigt er auf Version 1,
> morgen auf Version 2 – und dein Setup bricht ohne Vorwarnung. Gib immer eine Version an.

## Images holen und ansehen

```bash title="Images verwalten"
docker pull nginx:1.30-alpine     # Image herunterladen
docker image ls                   # lokale Images auflisten
docker image rm nginx:1.30-alpine # Image löschen
```

`docker run` lädt fehlende Images automatisch. `docker pull` brauchst du trotzdem, wenn du ein Image vorab
holen oder auf eine neuere Version mit demselben Tag aktualisieren willst.

Jedes Image hat außerdem einen [[image-digest|Digest]] wie `sha256:3f1c…` – eine [[pruefsumme|Prüfsumme]]
über den Inhalt. Ein Tag kann sich ändern, ein Digest nie.

## Container starten und verwalten

Der wichtigste Befehl ist `docker run`. Er erzeugt einen Container und startet ihn.

```bash title="Container-Lebenszyklus"
docker run -d --name web nginx:1.30-alpine   # im Hintergrund starten
docker ps                                    # laufende Container
docker ps -a                                 # alle, auch gestoppte
docker stop web                              # Hauptprozess beenden
docker start web                             # wieder starten
docker rm web                                # Container löschen
docker run --rm hello-world                  # nach dem Ende automatisch löschen
```

| Option | Wirkung |
|---|---|
| `-d` / `--detach` | Container läuft im Hintergrund, du bekommst dein Terminal zurück |
| `--name web` | Fester Name statt eines Zufallsnamens wie `quirky_turing` |
| `--rm` | Container wird nach dem Beenden gelöscht |
| `-it` | Interaktiv mit Terminal, z. B. für eine Shell |

Ein Container lebt genau so lange wie sein **Hauptprozess**. Beendet sich der Prozess, stoppt der Container.
Deshalb endet `hello-world` sofort, während `nginx` als Webserver dauerhaft läuft.

> [!PRAXIS]
> In Teams startet man Container selten mit langen `docker run`-Befehlen von Hand. Man beschreibt sie in einer
> Compose-Datei. Die Bausteine – Image, Name, Hintergrundbetrieb – bleiben aber dieselben.

> [!TIPP]
> Gestoppte Container sammeln sich an. `docker ps -a` zeigt sie, `docker container prune` räumt alle
> gestoppten auf einmal weg.

## Zusammenfassung

- Ein **Image** ist eine unveränderliche Vorlage, ein **Container** eine laufende Instanz davon.
- Image-Namen bestehen aus Registry, Repository und Tag; ohne Angabe gelten `docker.io` und `latest`.
- `latest` ist kein Versprechen – gib immer eine konkrete Version an. Ein Digest ist unveränderlich.
- `docker run -d --name web image:tag` startet einen Container im Hintergrund.
- `docker ps`, `stop`, `start`, `rm` steuern den Lebenszyklus; `--rm` räumt automatisch auf.
- Ein Container läuft genau so lange wie sein Hauptprozess.
