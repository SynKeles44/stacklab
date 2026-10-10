---
title: Secrets, Environments und OIDC
summary: Wie du Deployments mit Environments, Pflicht-Freigaben und minimalen Rechten absicherst und warum OIDC langlebige Cloud-Schlüssel überflüssig macht.
duration: 25
sources:
  - title: GitHub Docs – Managing environments for deployment
    url: https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments
  - title: GitHub Docs – Using secrets in GitHub Actions
    url: https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets
  - title: GitHub Docs – OpenID Connect
    url: https://docs.github.com/en/actions/concepts/security/openid-connect
  - title: GitHub Docs – Configuring OpenID Connect in Amazon Web Services
    url: https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws
  - title: GitHub Docs – Controlling permissions for GITHUB_TOKEN
    url: https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/control-jobs-permissions
quiz:
  - type: single
    question: "Ein Job hat `environment: production`, das Environment verlangt eine Freigabe durch das Team „ops“. Wann bekommt der Job die Environment-Secrets?"
    options:
      - Sofort beim Start des Workflows.
      - Erst nachdem jemand aus „ops“ die Freigabe erteilt hat.
      - Nie – Environment-Secrets sind nur für die Oberfläche.
      - Nur, wenn der Job auf einem eigenen Runner läuft.
    answer: 1
    explanation: >
      Der Job wartet, bis alle Schutzregeln erfüllt sind. Erst dann startet er – und erst dann sieht er die
      Secrets des Environments.
  - type: multiple
    question: Welche Vorteile hat OIDC gegenüber einem gespeicherten Cloud-Zugangsschlüssel?
    options:
      - Es liegt kein dauerhaft gültiger Schlüssel in GitHub, der gestohlen werden kann.
      - Die Zugangsdaten gelten nur kurz und laufen von selbst ab.
      - Die Cloud kann einschränken, welches Repository und welches Environment die Rolle bekommt.
      - Der Workflow braucht keinerlei Berechtigungen mehr.
    answers: [0, 1, 2]
    explanation: >
      OIDC braucht im Workflow genau eine zusätzliche Berechtigung: `id-token: write`. Dafür entfällt der
      langlebige Schlüssel, und die Trust Policy der Cloud prüft Repository, Branch oder Environment.
  - type: find-bug
    question: Der Deploy-Job soll sich per OIDC bei der Cloud anmelden, bekommt aber kein Token. In welcher Zeile steckt der Fehler?
    language: yaml
    code: |
      jobs:
        deploy:
          runs-on: ubuntu-latest
          environment: production
          permissions:
            contents: read
          steps:
            - uses: aws-actions/configure-aws-credentials@v6
              with:
                role-to-assume: arn:aws:iam::123456789012:role/deploy
                aws-region: eu-central-1
    bug_line: 6
    explanation: >
      Für das OIDC-Token braucht der Job `id-token: write`. Setzt du `permissions`, gilt nur, was dort steht – hier
      fehlt die Zeile neben `contents: read`.
  - type: cloze
    text: "Die Rechte des automatischen `GITHUB_TOKEN` legst du mit dem Schlüssel `___` fest. Werte, die nicht geheim sind, liest du aus dem Kontext `___`, Geheimnisse aus `secrets`."
    blanks:
      - [permissions]
      - [vars]
    explanation: Konfigurationsvariablen (`vars`) erscheinen im Klartext im Log, Secrets werden maskiert.
tasks:
  - id: oidc-oder-schluessel
    type: dragdrop
    title: Langlebiger Schlüssel oder OIDC?
    description: Ordne jede Eigenschaft der passenden Variante zu.
    targets:
      - { id: key, label: Gespeicherter Zugangsschlüssel als Secret }
      - { id: oidc, label: OIDC mit kurzlebigen Zugangsdaten }
    items:
      - { label: "Gilt, bis ihn jemand von Hand widerruft", target: key }
      - { label: "Muss regelmäßig rotiert werden", target: key }
      - { label: "Taucht er in einem Log auf, ist er sofort missbrauchbar", target: key }
      - { label: "Läuft nach kurzer Zeit von selbst ab", target: oidc }
      - { label: "Die Cloud prüft Repository und Environment im Token", target: oidc }
      - { label: "Braucht im Workflow id-token: write", target: oidc }
    hints:
      - Frag dich bei jeder Aussage, ob etwas Dauerhaftes gespeichert ist.
  - id: environment-secrets
    type: simulated
    title: Secrets und Variablen für ein Environment anlegen
    description: |
      Dein Repository hat die Environments `staging` und `production`. Lege mit der GitHub CLI an:

      1. Die **Variable** `APP_URL` mit dem Wert `https://shop.example.com` für das Environment `production`.
      2. Das **Secret** `DEPLOY_SSH_KEY` für `production` aus der Datei `deploy_key` (der Wert kommt über die
         Standardeingabe, damit er nicht in der Shell-Historie landet).
      3. Liste zum Schluss die Secrets von `production` auf.
    prompt: "du@laptop:~/shop$"
    steps:
      - expect: "^gh\\s+variable\\s+set\\s+APP_URL\\s+(--env|-e)\\s+production\\s+(--body|-b)\\s+[\"']?https://shop\\.example\\.com[\"']?\\s*$"
        output: "✓ Created variable APP_URL for example-org/shop in environment production"
        hint: "`gh variable set APP_URL --env production --body \"https://shop.example.com\"`"
      - expect: "^gh\\s+secret\\s+set\\s+DEPLOY_SSH_KEY\\s+(--env|-e)\\s+production\\s*<\\s*deploy_key\\s*$"
        output: "✓ Set Actions secret DEPLOY_SSH_KEY for example-org/shop in environment production"
        hint: "Den Inhalt einer Datei gibst du mit `< deploy_key` weiter: `gh secret set DEPLOY_SSH_KEY --env production < deploy_key`."
      - expect: "^gh\\s+secret\\s+list\\s+(--env|-e)\\s+production\\s*$"
        output: |
          NAME            UPDATED
          DEPLOY_SSH_KEY  less than a minute ago
        hint: "`gh secret list --env production`"
    responses:
      - match: "^cat\\s+deploy_key"
        output: "Lieber nicht – ein privater Schlüssel gehört nicht auf den Bildschirm."
---

Ein Deploy-Workflow ist der mächtigste Teil deines Repositorys: Er kommt an Server, Datenbanken und
Cloud-Konten. Wer ihn verändern oder seine Geheimnisse lesen kann, kontrolliert die Produktion. In dieser
Lektion sicherst du ihn ab – mit Environments, minimalen Rechten und OIDC.

## Secrets, Variablen und GITHUB_TOKEN

Ein [[secret|Secret]] liegt verschlüsselt bei GitHub und erscheint im Log als `***`. Es gibt drei Ebenen:

| Ebene | Gilt für | Beispiel |
|---|---|---|
| Repository | alle Workflows des Repos | Token für einen Linter-Dienst |
| Environment | nur Jobs mit diesem Environment | SSH-Schlüssel für Produktion |
| Organisation | ausgewählte Repos | gemeinsamer Registry-Zugang |

Nicht Geheimes wie eine URL legst du als **Variable** an und liest sie mit `${{ vars.APP_URL }}`.

Außerdem bekommt jeder Lauf automatisch das [[github-token|GITHUB_TOKEN]]. Es gilt nur für diesen Lauf und
nur für dieses Repository. Seine Rechte legst du mit `permissions` fest – nach dem Prinzip
[[least-privilege|Least Privilege]] so wenig wie möglich:

```yaml title="Minimale Rechte"
permissions:
  contents: read
```

> [!MERKSATZ]
> Setzt du `permissions`, gilt **nur** was dort steht. Alles andere ist verboten – genau das willst du.

## Environments mit Freigabe

Ein [[deployment-umgebung|Environment]] ist bei GitHub ein benanntes Ziel wie `staging` oder `production`
mit eigenen Secrets und Schutzregeln. Ein Job wählt es mit `environment`:

```yaml title="Deploy-Job mit Environment"
deploy:
  needs: build
  runs-on: ubuntu-latest
  environment:
    name: production
    url: https://shop.example.com
  steps:
    - run: ./deploy.sh
```

Unter **Settings → Environments** stellst du Schutzregeln ein:

| Regel | Wirkung |
|---|---|
| Required reviewers | bis zu sechs Personen oder Teams; eine Freigabe reicht |
| Prevent self-review | wer den Lauf ausgelöst hat, darf nicht selbst freigeben |
| Wait timer | Job wartet eine feste Zahl Minuten |
| Deployment branches and tags | nur z. B. `main` oder Tags `v*` dürfen deployen |

Mit [[pflicht-reviewer|Pflicht-Reviewern]] wartet der Job, bis jemand auf „Approve“ klickt. Erst dann
startet er und sieht die Environment-Secrets. Das ist Continuous Delivery in seiner reinsten Form.

## Das Problem mit langlebigen Schlüsseln

Klassisch legt man einen Cloud-Zugangsschlüssel als Secret ab. Der Haken:

- Er gilt **unbegrenzt**, bis ihn jemand widerruft.
- Taucht er versehentlich in einem Log oder Artefakt auf, kann ihn jeder benutzen.
- Er muss regelmäßig rotiert werden – und wird es oft nicht.

> [!FEHLER]
> **Ein Admin-Schlüssel für alles.** Ein Cloud-Schlüssel mit vollen Rechten, der seit Jahren in den
> Repository-Secrets liegt, ist eine der häufigsten Ursachen für Sicherheitsvorfälle in CI-Systemen.

## OIDC: Vertrauen statt Schlüssel

Mit [[openid-connect|OpenID Connect]] (OIDC) speicherst du gar keinen Schlüssel mehr. Stattdessen vertraut
die Cloud GitHub als Aussteller von Identitäten:

![OIDC-Ablauf zwischen Job, GitHub und Cloud](/assets/deployments-cicd/oidc-ablauf.svg)

1. Der Job fordert bei GitHub ein signiertes Token an. Darin steht, wer er ist – etwa
   `repo:example-org/shop:environment:production`.
2. Er zeigt es der Cloud. Deren [[trust-policy|Trust Policy]] prüft: Passt das Repository, passt das Environment?
3. Die Cloud gibt [[kurzlebige-zugangsdaten|kurzlebige Zugangsdaten]] heraus, die nach kurzer Zeit verfallen.

```yaml title="OIDC am Beispiel AWS"
deploy:
  runs-on: ubuntu-latest
  environment: production
  permissions:
    id-token: write
    contents: read
  steps:
    - uses: actions/checkout@v7
    - uses: aws-actions/configure-aws-credentials@v6
      with:
        role-to-assume: arn:aws:iam::123456789012:role/shop-deploy
        aws-region: eu-central-1
    - run: aws s3 sync public/ s3://shop-assets-example/
```

> [!PRAXIS]
> Bindest du die Trust Policy an das Environment `production`, kann nur ein freigegebener Deploy-Job die
> Rolle übernehmen – nicht ein Workflow aus einem Feature-Branch. Für Azure und Google Cloud funktioniert
> OIDC nach demselben Prinzip mit deren Login-Actions.

## Zusammenfassung

- Secrets gibt es auf Repository-, Environment- und Organisationsebene; Variablen (`vars`) sind nicht geheim.
- `permissions` begrenzt das `GITHUB_TOKEN` – so wenig Rechte wie möglich.
- **Environments** bündeln Secrets und Schutzregeln; Pflicht-Reviewer geben Deployments frei.
- Langlebige Schlüssel sind ein Dauerrisiko.
- **OIDC** tauscht ein signiertes Job-Token gegen kurzlebige Zugangsdaten; nötig ist `id-token: write`.
