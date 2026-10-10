---
title: Registries, Tags und Container-Sicherheit
summary: Wie du Images sinnvoll taggst und in eine Registry pushst, wie Secrets aus deinen Images draußen bleiben und welche Grundregeln Container sicherer machen.
duration: 25
sources:
  - title: Docker Docs – docker image push
    url: https://docs.docker.com/reference/cli/docker/image/push/
  - title: Docker Docs – Build secrets
    url: https://docs.docker.com/build/building/secrets/
  - title: Docker Docs – Secrets in Compose
    url: https://docs.docker.com/compose/how-tos/use-secrets/
  - title: Docker Docs – Docker Engine security
    url: https://docs.docker.com/engine/security/
  - title: Docker Docs – Docker Scout
    url: https://docs.docker.com/scout/
quiz:
  - type: single
    question: Deine CI baut bei jedem Merge ein Image. Welches Tag macht später eindeutig nachvollziehbar, welcher Code in Produktion läuft?
    options:
      - "`latest`"
      - "`prod`"
      - Der kurze Git-Commit-Hash, z. B. `3f9c2ab`.
      - Das heutige Datum ohne Uhrzeit.
    answer: 2
    explanation: >
      Der Commit-Hash verweist genau auf einen Stand des Codes und wird nie wiederverwendet. `latest` und `prod`
      wandern ständig weiter, ein Datum ist nicht eindeutig, wenn es mehrere Builds pro Tag gibt.
  - type: multiple
    question: Wie gelangt ein Passwort ungewollt in ein Image?
    options:
      - "`ENV DB_PASSWORD=geheim` im Dockerfile."
      - "`COPY . .` ohne `.dockerignore`, während eine `.env` im Projekt liegt."
      - "`ARG NPM_TOKEN` und `RUN npm ci` mit dem Token – der Wert steht in der Image-Historie."
      - "`RUN --mount=type=secret,id=npm_token …`"
    answers: [0, 1, 2]
    explanation: >
      ENV, kopierte Dateien und Build-Argumente bleiben im Image bzw. in seiner Historie lesbar. Ein Secret-Mount
      ist dagegen nur während dieses einen `RUN` sichtbar und landet in keinem Layer.
  - type: match
    question: Ordne jedem Befehl seine Aufgabe zu.
    pairs:
      - { left: "docker login registry.example.com", right: "Bei der Registry anmelden" }
      - { left: "docker tag shop:1.4.2 registry.example.com/team/shop:1.4.2", right: "Dem Image einen weiteren Namen geben" }
      - { left: "docker push registry.example.com/team/shop:1.4.2", right: "Das Image in die Registry hochladen" }
      - { left: "docker scout cves shop:1.4.2", right: "Bekannte Sicherheitslücken im Image auflisten" }
    explanation: Der Registry-Name steckt im Image-Namen. Erst wenn das Image so heißt, weiß `docker push`, wohin es gehört.
  - type: cloze
    text: Ein Build-Secret liest du im Dockerfile mit `RUN --mount=type=___,id=npm_token` ein. Ohne `env=` liegt es während dieses `RUN` als Datei unter `/run/___/npm_token`.
    blanks:
      - [secret]
      - [secrets]
    explanation: Secret-Mounts erscheinen als Datei unter `/run/secrets/<id>` – nur während des jeweiligen `RUN`.
tasks:
  - id: image-veroeffentlichen
    type: simulated
    title: Ein Image taggen und veröffentlichen
    description: |
      Du veröffentlichst Version 1.4.2 deiner Shop-App in der privaten Registry `registry.example.com` im Bereich
      `team`. Das Terminal ist simuliert.

      1. Melde dich bei `registry.example.com` an (Benutzername `ci`, das Passwort wird abgefragt).
      2. Baue das Image aus dem aktuellen Ordner mit dem Namen `registry.example.com/team/shop:1.4.2`.
      3. Gib demselben Image zusätzlich das Tag `registry.example.com/team/shop:1.4`.
      4. Pushe beide Tags (zwei Befehle, erst `1.4.2`, dann `1.4`).
    prompt: "du@laptop:~/shop$"
    steps:
      - expect: "^docker\\s+login\\s+(-u\\s+ci\\s+registry\\.example\\.com|registry\\.example\\.com\\s+-u\\s+ci|--username[\\s=]ci\\s+registry\\.example\\.com)\\s*$"
        output: |
          Password:
          Login Succeeded
        hint: docker login -u ci registry.example.com
      - expect: "^docker\\s+(image\\s+)?(build|buildx\\s+build)\\s+(-t|--tag)[\\s=]registry\\.example\\.com/team/shop:1\\.4\\.2\\s+\\.\\s*$"
        output: |
          [+] Building 41.3s (14/14) FINISHED
           => [build 4/5] RUN npm ci                                   18.2s
           => [stage-1 5/6] COPY --from=build /app/dist ./dist          0.1s
           => exporting to image                                        0.4s
           => => naming to registry.example.com/team/shop:1.4.2         0.0s
        hint: docker build -t registry.example.com/team/shop:1.4.2 .
      - expect: "^docker\\s+(image\\s+)?tag\\s+registry\\.example\\.com/team/shop:1\\.4\\.2\\s+registry\\.example\\.com/team/shop:1\\.4\\s*$"
        output: ""
        hint: docker tag registry.example.com/team/shop:1.4.2 registry.example.com/team/shop:1.4
      - expect: "^docker\\s+(image\\s+)?push\\s+registry\\.example\\.com/team/shop:1\\.4\\.2\\s*$"
        output: |
          The push refers to repository [registry.example.com/team/shop]
          5f70bf18a086: Pushed
          a1c2e3d4b5f6: Pushed
          1.4.2: digest: sha256:9b2f4c… size: 1782
        hint: docker push registry.example.com/team/shop:1.4.2
      - expect: "^docker\\s+(image\\s+)?push\\s+registry\\.example\\.com/team/shop:1\\.4\\s*$"
        output: |
          The push refers to repository [registry.example.com/team/shop]
          5f70bf18a086: Layer already exists
          a1c2e3d4b5f6: Layer already exists
          1.4: digest: sha256:9b2f4c… size: 1782
        hint: docker push registry.example.com/team/shop:1.4
    responses:
      - match: "^docker\\s+image\\s+ls"
        output: |
          REPOSITORY                       TAG     IMAGE ID       CREATED          SIZE
          registry.example.com/team/shop   1.4.2   7c1d2e3f4a5b   1 minute ago     71.2MB
          registry.example.com/team/shop   1.4     7c1d2e3f4a5b   1 minute ago     71.2MB
    hints:
      - Der vollständige Name enthält Registry, Bereich und Tag – `docker push` liest das Ziel daraus.
      - Beim zweiten Push meldet Docker „Layer already exists“ – beide Tags zeigen auf dasselbe Image.
    solution: |
      ```bash
      docker login -u ci registry.example.com
      docker build -t registry.example.com/team/shop:1.4.2 .
      docker tag registry.example.com/team/shop:1.4.2 registry.example.com/team/shop:1.4
      docker push registry.example.com/team/shop:1.4.2
      docker push registry.example.com/team/shop:1.4
      ```
  - id: wohin-mit-dem-secret
    type: dragdrop
    title: Wohin gehört dieses Geheimnis?
    description: Ordne jedes Vorgehen ein – schützt es das Geheimnis oder landet es lesbar im Image?
    targets:
      - { id: sicher, label: Geheimnis bleibt geschützt }
      - { id: leck, label: Geheimnis landet im Image }
    items:
      - { label: "RUN --mount=type=secret,id=npm_token npm ci", target: sicher }
      - { label: "ENV API_KEY=… im Dockerfile", target: leck }
      - { label: "env_file: .env in der compose.yaml (Datei nicht im Image)", target: sicher }
      - { label: "COPY . . ohne .dockerignore, mit .env im Ordner", target: leck }
      - { label: "docker build --build-arg NPM_TOKEN=…", target: leck }
      - { label: "Compose-secrets, gemountet unter /run/secrets", target: sicher }
    hints:
      - Alles, was in einem Layer oder in der Image-Historie steht, kann jeder lesen, der das Image hat.
---
Dein Image ist fertig gebaut. Jetzt soll es auf den Server – und nebenbei möchtest du sicher sein, dass weder dein
npm-Token noch das Datenbank-Passwort darin stecken. In dieser letzten Lektion geht es um den Weg vom Laptop in die
Registry und um die wichtigsten Sicherheitsregeln.

## Images in eine Registry pushen

Server laden Images aus einer [[registry|Registry]]. Neben Docker Hub gibt es Registries von GitHub
(`ghcr.io`), GitLab und allen Cloud-Anbietern sowie selbst betriebene [[private-registry|private Registries]].

Wohin ein Image gehört, steht in seinem **Namen**. Deshalb gibst du ihm vor dem Push einen vollständigen Namen:

```bash title="Bauen, taggen, pushen"
docker login -u ci registry.example.com
docker build -t registry.example.com/team/shop:1.4.2 .
docker tag registry.example.com/team/shop:1.4.2 registry.example.com/team/shop:1.4
docker push registry.example.com/team/shop:1.4.2
docker push registry.example.com/team/shop:1.4
```

`docker tag` kopiert nichts – es hängt nur einen weiteren Namen an dasselbe Image. Beim zweiten Push überträgt
Docker deshalb keine Layer mehr, sondern meldet „Layer already exists“.

> [!HINWEIS]
> Server mit x86-Prozessor brauchen ein `linux/amd64`-Image, ein Mac mit Apple Silicon baut aber `linux/arm64`.
> Mit `docker buildx build --platform linux/amd64,linux/arm64` baust du beide auf einmal.

## Eine sinnvolle Tag-Strategie

| Tag | Beispiel | Ändert sich? | Gut für |
|---|---|---|---|
| Vollständige Version | `1.4.2` | nie | Releases, Rollbacks |
| Kurze Version | `1.4`, `1` | wandert zum neuesten Patch | Nutzer, die Updates wollen |
| Git-Commit-Hash | `3f9c2ab` | nie | CI-Builds, Nachvollziehbarkeit |
| `latest` | `latest` | ständig | nur lokale Experimente |

In der Praxis taggt die [[ci-pipeline|CI-Pipeline]] jedes Image mit dem Commit-Hash und Releases zusätzlich mit
[[semantic-versioning|Semantic Versioning]]. Deployt wird immer ein unveränderliches Tag oder gleich der Digest.

> [!MERKSATZ]
> Deploye nie `latest`. Nur ein festes Tag oder ein Digest sagt dir später, welcher Code wirklich läuft.

## Secrets gehören nicht ins Image

Alles im Image kann jeder lesen, der es ziehen darf – auch Jahre später. `ENV`, kopierte Dateien und sogar
Build-Argumente (`ARG`) bleiben in Layern oder in der Historie (`docker image history`) sichtbar.

Braucht der **Build** ein Geheimnis, etwa ein Token für eine private Paket-Registry, nutzt du einen
[[build-secret|Build-Secret]]. Er ist nur während eines einzigen `RUN` als Datei vorhanden:

```dockerfile title="Build-Secret"
RUN --mount=type=secret,id=npm_token,env=NPM_TOKEN npm ci
```

```bash title="Secret beim Build übergeben"
NPM_TOKEN=<dein-token> docker build --secret id=npm_token,env=NPM_TOKEN -t shop:1.4.2 .
```

Geheimnisse für die **Laufzeit** (Datenbank-Passwort, `APP_KEY`) kommen beim Start dazu: per `env_file`, als
Umgebungsvariablen deiner Plattform oder als Compose-`secrets`, die als Datei unter `/run/secrets/` erscheinen.

> [!FEHLER]
> „Ich lösche die Datei im nächsten `RUN` wieder.“ – Zu spät. Sie steckt im Layer davor und lässt sich jederzeit
> herausholen. Ein geleaktes Secret musst du austauschen, nicht verstecken.

## Grundregeln für sichere Container

1. **Kleine, gepinnte Basis-Images** und regelmäßig neu bauen – sonst bleiben behobene Lücken im Image.
2. **Images scannen:** Mit [[docker-scout|Docker Scout]] listet `docker scout cves shop:1.4.2` bekannte [[cve|CVEs]] in allen Paketen auf.
3. **Nicht als root laufen** (`USER`), und wo möglich das Dateisystem schreibschützen (`read_only: true` in Compose).
4. **Nur nötige Ports veröffentlichen**, Entwicklungsdienste an `127.0.0.1` binden.
5. **Nie `/var/run/docker.sock` einhängen** – wer diesen [[socket|Socket]] erreicht, steuert den ganzen Docker-Host
   und ist damit praktisch root.
6. **Kein `--privileged`**, außer du weißt genau, warum. Es hebt fast die gesamte Isolation auf.

> [!PRAXIS]
> In vielen Teams prüft die CI jedes neue Image automatisch auf CVEs und bricht bei kritischen Funden ab. Ein
> wöchentlicher Neubau holt Sicherheitsupdates des Basis-Images, auch wenn sich dein Code nicht geändert hat.

## Zusammenfassung

- Der Image-Name bestimmt das Ziel: `docker tag` gibt einen vollständigen Namen, `docker push` lädt hoch.
- Feste Versionen und Commit-Hashes deployen, `latest` nur lokal nutzen.
- `ENV`, `ARG` und kopierte Dateien sind im Image lesbar – Build-Secrets nutzt du mit `RUN --mount=type=secret`.
- Laufzeit-Secrets kommen beim Start dazu (`env_file`, Plattform-Variablen, Compose-`secrets`).
- Scanne Images auf CVEs und baue sie regelmäßig neu.
- Kein root, kein `docker.sock`, kein `--privileged`, nur nötige Ports.
