---
title: Wiederverwendbare Workflows
summary: Deploy-Logik einmal schreiben und für Staging und Produktion aufrufen – mit workflow_call, Eingaben, Secrets, Composite Actions und sicher gepinnten Versionen.
duration: 22
sources:
  - title: GitHub Docs – Reuse workflows
    url: https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows
  - title: GitHub Docs – Creating a composite action
    url: https://docs.github.com/en/actions/tutorials/create-actions/create-a-composite-action
  - title: GitHub Docs – Security hardening, using third-party actions
    url: https://docs.github.com/en/actions/reference/security/secure-use
quiz:
  - type: single
    question: Wo steht `uses`, wenn du einen wiederverwendbaren Workflow aufrufst?
    options:
      - In einem Step, wie bei einer Action.
      - Direkt im Job, anstelle von runs-on und steps.
      - Unter on, als eigener Trigger.
      - In einer separaten Datei action.yml.
    answer: 1
    explanation: >
      Ein wiederverwendbarer Workflow ersetzt einen ganzen Job. Der aufrufende Job hat deshalb `uses`, `with` und
      `secrets`, aber keine eigenen `steps`.
  - type: multiple
    question: Welche Aussagen über wiederverwendbare Workflows stimmen?
    options:
      - Der aufgerufene Workflow braucht den Trigger workflow_call.
      - Secrets werden nicht automatisch weitergegeben, sondern einzeln oder mit secrets inherit.
      - Ein Aufruf aus einem anderen Repository nennt eine Version hinter @, am sichersten einen Commit-Hash.
      - In uses darfst du Ausdrücke wie ${{ inputs.file }} verwenden.
    answers: [0, 1, 2]
    explanation: >
      `uses` muss ein fester Pfad sein – Ausdrücke sind dort nicht erlaubt. Alles andere stimmt.
  - type: match
    question: Wofür nimmst du was?
    pairs:
      - { left: "Wiederverwendbarer Workflow", right: "ganzer Job oder mehrere Jobs, inklusive Environment" }
      - { left: "Composite Action", right: "eine Folge von Steps innerhalb eines Jobs" }
      - { left: "secrets: inherit", right: "alle Secrets des Aufrufers durchreichen" }
      - { left: "Commit-Hash nach @", right: "unveränderliche Version einer fremden Action" }
    explanation: Workflows bündeln Jobs, Composite Actions bündeln Steps. Gepinnte Hashes schützen vor manipulierten Tags.
tasks:
  - id: deploy-wiederverwenden
    type: terminal
    title: Einen Deploy-Workflow für zwei Umgebungen
    description: |
      Im Ordner `wiederverwenden` liegt ein Projekt mit dem Skript `deploy.sh <umgebung>`. Statt zwei fast gleiche
      Deploy-Jobs zu kopieren, baust du einen wiederverwendbaren Workflow.

      1. `.github/workflows/deploy.yml`: Trigger `workflow_call` mit der **Pflicht**-Eingabe `environment`
         (`type: string`) und dem **Pflicht**-Secret `SSH_KEY`.
         Ein Job `deploy` auf `ubuntu-latest` mit `environment: ${{ inputs.environment }}`, Checkout
         (`actions/checkout@v7`) und `run: ./deploy.sh ${{ inputs.environment }}`; das Secret kommt als
         Umgebungsvariable `SSH_KEY` in diesen Step.
      2. `.github/workflows/release.yml`: Trigger `push` auf `main`. Job `staging` ruft
         `./.github/workflows/deploy.yml` mit `environment: staging` und dem Secret
         `SSH_KEY: ${{ secrets.STAGING_SSH_KEY }}` auf. Job `production` braucht `staging` und ruft denselben
         Workflow mit `environment: production` und `SSH_KEY: ${{ secrets.PRODUCTION_SSH_KEY }}` auf.
      3. Teste das Skript lokal: `SSH_KEY=test ./deploy.sh staging`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: wiederverwenden
    setup: |
      cat > deploy.sh <<'EOF'
      #!/usr/bin/env bash
      set -euo pipefail
      target="${1:?Aufruf: ./deploy.sh staging|production}"
      : "${SSH_KEY:?SSH_KEY fehlt}"
      echo "Deploye nach $target"
      EOF
      chmod +x deploy.sh
    checks:
      - type: command
        run: |
          for f in deploy release; do bun -e "Bun.YAML.parse(await Bun.file('.github/workflows/$f.yml').text())" || exit 1; done
        message: deploy.yml oder release.yml fehlt in .github/workflows oder ist kein gültiges YAML.
      - type: command
        run: |
          bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file(".github/workflows/deploy.yml").text())))' | jq -e '.on.workflow_call.inputs.environment.required == true and .on.workflow_call.inputs.environment.type == "string" and .on.workflow_call.secrets.SSH_KEY.required == true'
        message: deploy.yml braucht on.workflow_call mit der Pflicht-Eingabe environment (type string) und dem Pflicht-Secret SSH_KEY.
      - type: command
        run: |
          bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file(".github/workflows/deploy.yml").text())))' | jq -e '.jobs.deploy | ((.environment | tostring | test("inputs\\.environment")) and (.steps | map(.uses // "") | index("actions/checkout@v7") != null))'
        message: Der Job deploy braucht environment aus inputs.environment und einen Checkout mit actions/checkout@v7.
      - type: command
        run: |
          bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file(".github/workflows/deploy.yml").text())))' | jq -e '.jobs.deploy.steps | map(select((.run // "") | test("\\./deploy\\.sh"))) | .[0] | (.run | test("inputs\\.environment")) and (.env.SSH_KEY | test("secrets\\.SSH_KEY"))'
        message: Der Step mit ./deploy.sh soll inputs.environment übergeben und env SSH_KEY aus secrets.SSH_KEY bekommen.
      - type: command
        run: |
          bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file(".github/workflows/release.yml").text())))' | jq -e '.on.push.branches == ["main"] and .jobs.staging.uses == "./.github/workflows/deploy.yml" and .jobs.staging.with.environment == "staging" and (.jobs.staging.secrets.SSH_KEY | test("secrets\\.STAGING_SSH_KEY"))'
        message: release.yml braucht push auf main und einen Job staging mit uses ./.github/workflows/deploy.yml, with environment staging und dem Secret STAGING_SSH_KEY.
      - type: command
        run: |
          bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file(".github/workflows/release.yml").text())))' | jq -e '.jobs.production.uses == "./.github/workflows/deploy.yml" and .jobs.production.with.environment == "production" and (.jobs.production.secrets.SSH_KEY | test("secrets\\.PRODUCTION_SSH_KEY")) and (.jobs.production.needs == "staging" or .jobs.production.needs == ["staging"])'
        message: Der Job production soll staging brauchen und deploy.yml mit environment production und dem Secret PRODUCTION_SSH_KEY aufrufen.
      - type: command
        run: SSH_KEY=test ./deploy.sh staging
        stdout_matches: "Deploye nach staging"
        message: SSH_KEY=test ./deploy.sh staging läuft nicht durch.
    hints:
      - "Der aufgerufene Workflow beginnt mit `on:` → `workflow_call:` → `inputs:` und `secrets:`."
      - "Im aufrufenden Job stehen statt `runs-on` und `steps` nur `uses:`, `with:` und `secrets:`."
      - "Prüfe beide Dateien mit `bun -e 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file(\".github/workflows/release.yml\").text())))' | jq .`"
    solution: |
      ```bash
      cd wiederverwenden
      mkdir -p .github/workflows
      cat > .github/workflows/deploy.yml <<'EOF'
      name: Deploy

      on:
        workflow_call:
          inputs:
            environment:
              required: true
              type: string
          secrets:
            SSH_KEY:
              required: true

      jobs:
        deploy:
          runs-on: ubuntu-latest
          environment: ${{ inputs.environment }}
          steps:
            - uses: actions/checkout@v7
            - run: ./deploy.sh ${{ inputs.environment }}
              env:
                SSH_KEY: ${{ secrets.SSH_KEY }}
      EOF
      cat > .github/workflows/release.yml <<'EOF'
      name: Release

      on:
        push:
          branches: [main]

      jobs:
        staging:
          uses: ./.github/workflows/deploy.yml
          with:
            environment: staging
          secrets:
            SSH_KEY: ${{ secrets.STAGING_SSH_KEY }}

        production:
          needs: staging
          uses: ./.github/workflows/deploy.yml
          with:
            environment: production
          secrets:
            SSH_KEY: ${{ secrets.PRODUCTION_SSH_KEY }}
      EOF
      SSH_KEY=test ./deploy.sh staging
      ```
  - id: pinning
    type: steps
    title: Wem vertraust du in deinem Workflow?
    description: Spiel durch, was bei fremden Actions passieren kann.
    steps:
      - situation: >
          Dein Deploy-Workflow nutzt `uses: some-vendor/upload-action@v2` aus dem Marketplace. Er hat Zugriff auf
          deinen Produktions-SSH-Schlüssel.
        question: Die Betreuer:innen der Action verschieben den Tag v2 auf einen neuen Commit. Was passiert beim nächsten Lauf?
        options:
          - Nichts, Tags sind unveränderlich.
          - Dein Workflow führt ab sofort den neuen Code aus – ungeprüft, mit deinen Secrets.
          - GitHub fragt vorher nach.
        answer: 1
        explanation: >
          Git-Tags lassen sich verschieben. Wird das Konto der Betreuer:innen übernommen, läuft fremder Code mit
          deinen Geheimnissen.
      - situation: >
          Du änderst die Zeile auf `uses: some-vendor/upload-action@8f4b7c2e…` (voller Commit-Hash) und schreibst
          die Version als Kommentar dahinter.
        question: Was hast du damit erreicht?
        options:
          - Der Code der Action kann sich nicht mehr unbemerkt ändern; Updates kommen bewusst per Pull Request.
          - Die Action läuft schneller.
          - Die Action bekommt keine Secrets mehr.
        answer: 0
        explanation: >
          Ein Commit-Hash ist unveränderlich. Werkzeuge wie Dependabot schlagen Updates dann als Pull Request vor,
          den du prüfst.
---

Dein Team hat drei Projekte, jedes mit einem Deploy-Workflow für Staging und einem für Produktion. Sechs
Dateien, die fast gleich aussehen – und bei jeder Änderung vergisst jemand eine. Mit wiederverwendbaren
Workflows schreibst du die Deploy-Logik **einmal** und rufst sie überall auf.

## workflow_call: ein Workflow als Baustein

Ein [[wiederverwendbarer-workflow|wiederverwendbarer Workflow]] ist ein normaler Workflow mit dem Trigger
`workflow_call`. Er legt fest, welche Eingaben und Secrets er erwartet:

```yaml title=".github/workflows/deploy.yml"
name: Deploy

on:
  workflow_call:
    inputs:
      environment:
        required: true
        type: string
    secrets:
      SSH_KEY:
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    concurrency:
      group: deploy-${{ inputs.environment }}
      cancel-in-progress: false
    steps:
      - uses: actions/checkout@v7
      - run: ./deploy.sh ${{ inputs.environment }}
        env:
          SSH_KEY: ${{ secrets.SSH_KEY }}
```

Eingaben haben die Typen `string`, `number` oder `boolean`. Die Datei muss direkt in `.github/workflows/`
liegen – Unterordner gehen nicht.

## Den Workflow aufrufen

Der Aufruf ersetzt einen ganzen Job. Statt `runs-on` und `steps` stehen dort `uses`, `with` und `secrets`:

```yaml title=".github/workflows/release.yml"
jobs:
  staging:
    uses: ./.github/workflows/deploy.yml
    with:
      environment: staging
    secrets:
      SSH_KEY: ${{ secrets.STAGING_SSH_KEY }}

  production:
    needs: staging
    uses: ./.github/workflows/deploy.yml
    with:
      environment: production
    secrets:
      SSH_KEY: ${{ secrets.PRODUCTION_SSH_KEY }}
```

| Aufruf | Schreibweise |
|---|---|
| gleiches Repository | `./.github/workflows/deploy.yml` |
| anderes Repository | `example-org/ci-templates/.github/workflows/deploy.yml@v3` |

Secrets werden nicht automatisch weitergegeben. Entweder nennst du sie einzeln oder schreibst
`secrets: inherit` – das funktioniert nur innerhalb derselben Organisation.

Ein paar Regeln solltest du kennen, bevor du Workflows verschachtelst:

| Regel | Bedeutung |
|---|---|
| Rechte | Ein aufgerufener Workflow kann `permissions` nur beibehalten oder verringern, nie erhöhen. |
| Secrets | Sie gehen nur an den direkt aufgerufenen Workflow. Ruft dieser einen weiteren auf, muss er sie selbst weiterreichen. |
| Tiefe | Höchstens zehn Ebenen: der Aufrufer plus neun Ebenen wiederverwendbarer Workflows. Schleifen sind verboten. |
| Matrix | Ein Job mit Matrix kann einen wiederverwendbaren Workflow aufrufen – dann läuft er einmal pro Kombination. |

> [!FEHLER]
> **Ausdrücke in `uses`.** `uses: ./.github/workflows/${{ inputs.file }}` ist nicht erlaubt. Der Pfad muss
> fest im Workflow stehen; variabel sind nur `with` und `secrets`.

## Composite Actions: Steps bündeln

Manchmal willst du keinen ganzen Job teilen, sondern nur wiederkehrende Steps – etwa „PHP einrichten,
Composer cachen, installieren“. Dafür gibt es die [[composite-action|Composite Action]]: eine Datei
`action.yml` mit `runs: using: composite`, die du wie jede Action per `uses` in einem Step einbindest.

| | Wiederverwendbarer Workflow | Composite Action |
|---|---|---|
| ersetzt | einen ganzen Job | mehrere Steps |
| eigener Runner | ja | nein, läuft im aufrufenden Job |
| Environment und Secrets | ja | nur über Eingaben |

> [!MERKSATZ]
> Workflows teilen **Jobs**, Composite Actions teilen **Steps**.

## Fremde Actions sicher einbinden

Jede Action ist fremder Code, der in deinem Job läuft – mit Zugriff auf seine Secrets. Ein Tag wie `@v2`
kann jederzeit auf einen anderen Commit verschoben werden. Für Actions außerhalb deiner Organisation ist
[[action-pinning|Pinning]] auf einen vollen Commit-Hash deshalb die sicherste Variante:

```yaml title="Eine fremde Action pinnen"
- uses: some-vendor/upload-action@8f4b7c2e9d1a3b5c7e9f0a2b4c6d8e0f1a3b5c7d # v2.4.1
```

> [!PRAXIS]
> Größere Teams legen gemeinsame Workflows in ein eigenes Repository wie `ci-templates` und versionieren
> sie mit Tags. Projekte rufen dann `…/deploy.yml@v3` auf – Verbesserungen kommen über eine neue Version
> zu allen Projekten.

## Zusammenfassung

- Ein **wiederverwendbarer Workflow** hat den Trigger `workflow_call` mit `inputs` und `secrets`.
- Aufgerufen wird er per `uses` direkt im Job, zusammen mit `with` und `secrets`.
- Secrets reichst du einzeln weiter oder mit `secrets: inherit`.
- **Composite Actions** bündeln Steps, wiederverwendbare Workflows bündeln Jobs.
- Fremde Actions pinnst du auf einen Commit-Hash.
