---
title: Identitäten und Zugangsdaten
summary: IAM-Benutzer, Gruppen und Rollen unterscheiden – und verstehen, warum kurzlebige Zugangsdaten über IAM Identity Center besser sind als dauerhafte Access Keys.
duration: 25
sources:
  - title: IAM – IAM identities (users, user groups, and roles)
    url: https://docs.aws.amazon.com/IAM/latest/UserGuide/id.html
  - title: IAM – Temporary security credentials in IAM
    url: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp.html
  - title: AWS CLI – Configuring IAM Identity Center authentication
    url: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html
  - title: IAM – Manage access keys for IAM users
    url: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html
quiz:
  - type: single
    question: Was unterscheidet eine IAM-Rolle von einem IAM-Benutzer?
    options:
      - Eine Rolle hat kein dauerhaftes Passwort und keine dauerhaften Schlüssel – wer sie übernimmt, bekommt kurzlebige Zugangsdaten.
      - Eine Rolle hat immer Administratorrechte.
      - Eine Rolle ist nur ein anderer Name für eine Gruppe.
    answer: 0
    explanation: Rollen werden übernommen (assume). AWS STS stellt dafür temporäre Zugangsdaten aus, die automatisch ablaufen.
  - type: match
    question: Ordne jedem Fall die passende Identität zu.
    pairs:
      - { left: "Eine Entwicklerin meldet sich jeden Morgen an", right: "Benutzer in IAM Identity Center" }
      - { left: "Eine EC2-Instanz liest Dateien aus S3", right: "IAM-Rolle (über ein Instanzprofil)" }
      - { left: "Fünf Admins sollen dieselben Rechte bekommen", right: "Gruppe beziehungsweise gemeinsamer Berechtigungssatz" }
    explanation: Menschen melden sich zentral an, Dienste übernehmen Rollen, und Rechte für viele vergibst du gebündelt statt einzeln.
  - type: multiple
    question: Woran erkennst du temporäre Zugangsdaten von AWS STS?
    options:
      - Es gibt zusätzlich ein Session-Token.
      - Sie haben ein Ablaufdatum.
      - Die Access-Key-ID beginnt typischerweise mit ASIA statt mit AKIA.
      - Sie gelten für immer, bis man sie löscht.
    answers: [0, 1, 2]
    explanation: Temporäre Zugangsdaten bestehen aus Key-ID, Secret und Session-Token und laufen nach Minuten bis Stunden ab.
  - type: find-bug
    question: In welcher Zeile dieser `~/.aws/config` steckt ein Sicherheitsproblem?
    language: ini
    code: |
      [profile dev]
      sso_session = firma
      sso_account_id = 123456789012
      aws_secret_access_key = <geheimer-schluessel>
      region = eu-central-1
    bug_line: 4
    explanation: Ein dauerhaftes Secret hat in einem SSO-Profil nichts zu suchen. Die Zugangsdaten holt die CLI nach `aws sso login` selbst – kurzlebig und automatisch.
tasks:
  - id: sso-profile
    type: terminal
    title: CLI-Profile auf IAM Identity Center umstellen
    description: |
      Im Ordner `cli-profile` liegen zwei Dateien, wie sie früher im Ordner `~/.aws/` deines Laptops lagen:

      - `credentials` enthält einen alten, dauerhaften Access Key (nur ein Platzhalter).
      - `config` enthält ein Profil `dev`, das diesen Schlüssel nutzt.

      Stelle auf IAM Identity Center um:

      1. Lösche die Datei `credentials`.
      2. Schreibe `config` neu mit einem Abschnitt `[sso-session firma]` (Start-URL
         `https://example.awsapps.com/start`, `sso_region = eu-central-1`,
         `sso_registration_scopes = sso:account:access`).
      3. Lege das Profil `[profile dev]` an: Session `firma`, Konto `123456789012`, Rolle
         `DeveloperAccess`, Region `eu-central-1`.
      4. Lege das Profil `[profile prod]` an: Session `firma`, Konto `210987654321`, Rolle
         `ReadOnlyAccess`, Region `eu-central-1`.

      In `config` darf danach kein `aws_access_key_id` und kein `aws_secret_access_key` mehr stehen.
      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: cli-profile
    setup: |
      cat > credentials <<'EOF'
      [dev]
      aws_access_key_id = <alte-access-key-id>
      aws_secret_access_key = <altes-secret>
      EOF
      cat > config <<'EOF'
      [profile dev]
      region = eu-central-1
      output = json
      EOF
    checks:
      - type: file_absent
        path: credentials
        message: Die Datei credentials mit dem dauerhaften Schlüssel existiert noch – lösche sie.
      - type: command
        run: grep -cE 'aws_access_key_id|aws_secret_access_key' config || true
        stdout_equals: "0"
        message: In config stehen noch dauerhafte Schlüssel. Ein SSO-Profil braucht keine.
      - type: file_contains
        path: config
        pattern: "^\\[sso-session firma\\]"
        message: Der Abschnitt [sso-session firma] fehlt.
      - type: file_contains
        path: config
        pattern: "^sso_start_url\\s*=\\s*https://example\\.awsapps\\.com/start\\s*$"
        message: Im sso-session-Abschnitt fehlt sso_start_url = https://example.awsapps.com/start.
      - type: command
        run: awk '/^\[profile dev\]/{f=1;next} /^\[/{f=0} f' config | tr -d ' ' | sort | tr '\n' ';'
        stdout_matches: "region=eu-central-1;.*sso_account_id=123456789012;sso_role_name=DeveloperAccess;sso_session=firma;"
        message: Das Profil dev braucht sso_session = firma, sso_account_id = 123456789012, sso_role_name = DeveloperAccess und region = eu-central-1.
      - type: command
        run: awk '/^\[profile prod\]/{f=1;next} /^\[/{f=0} f' config | tr -d ' ' | sort | tr '\n' ';'
        stdout_matches: "region=eu-central-1;.*sso_account_id=210987654321;sso_role_name=ReadOnlyAccess;sso_session=firma;"
        message: Das Profil prod braucht sso_session = firma, sso_account_id = 210987654321, sso_role_name = ReadOnlyAccess und region = eu-central-1.
    hints:
      - "Mit `rm credentials` löschst du die alte Datei."
      - "Schreibe die neue config am einfachsten mit `cat > config <<'EOF'` … `EOF`."
      - Jedes Profil verweist mit `sso_session = firma` auf den gemeinsamen Abschnitt `[sso-session firma]`.
    solution: |
      ```bash
      cd cli-profile
      rm credentials
      cat > config <<'EOF'
      [sso-session firma]
      sso_start_url = https://example.awsapps.com/start
      sso_region = eu-central-1
      sso_registration_scopes = sso:account:access

      [profile dev]
      sso_session = firma
      sso_account_id = 123456789012
      sso_role_name = DeveloperAccess
      region = eu-central-1
      output = json

      [profile prod]
      sso_session = firma
      sso_account_id = 210987654321
      sso_role_name = ReadOnlyAccess
      region = eu-central-1
      output = json
      EOF
      ```
  - id: sso-login
    type: simulated
    title: Mit SSO anmelden und eine Rolle übernehmen
    description: |
      Deine `~/.aws/config` ist eingerichtet. Melde dich an und prüfe, welche Identität du bekommst.

      1. Melde dich an: `aws sso login --profile dev`
      2. Prüfe deine Identität: `aws sts get-caller-identity --profile dev`
      3. Übernimm zusätzlich die Rolle `deploy` im selben Konto, um zu sehen, wie temporäre
         Zugangsdaten aussehen:
         `aws sts assume-role --role-arn arn:aws:iam::123456789012:role/deploy --role-session-name test --profile dev`
    prompt: "du@laptop:~$"
    steps:
      - expect: "^aws\\s+sso\\s+login\\s+--profile\\s+dev$"
        output: |
          Attempting to automatically open the SSO authorization page in your default browser.
          Successfully logged into Start URL: https://example.awsapps.com/start
        hint: "Tippe `aws sso login --profile dev`."
      - expect: "^aws\\s+sts\\s+get-caller-identity\\s+--profile\\s+dev$"
        output: |
          {
              "UserId": "AROAEXAMPLEDEVROLE:du@example.com",
              "Account": "123456789012",
              "Arn": "arn:aws:sts::123456789012:assumed-role/AWSReservedSSO_DeveloperAccess_0123456789abcdef/du@example.com"
          }
        hint: "Tippe `aws sts get-caller-identity --profile dev`."
      - expect: "^aws\\s+sts\\s+assume-role(?=.*--role-arn\\s+arn:aws:iam::123456789012:role/deploy)(?=.*--role-session-name\\s+test)(?=.*--profile\\s+dev).*$"
        output: |
          {
              "Credentials": {
                  "AccessKeyId": "ASIA<temporaere-key-id>",
                  "SecretAccessKey": "<temporaeres-secret>",
                  "SessionToken": "<session-token>",
                  "Expiration": "2026-10-10T13:00:00+00:00"
              },
              "AssumedRoleUser": {
                  "AssumedRoleId": "AROAEXAMPLEDEPLOY:test",
                  "Arn": "arn:aws:sts::123456789012:assumed-role/deploy/test"
              }
          }

          Drei Teile, ein Ablaufdatum: Diese Zugangsdaten sind in einer Stunde wertlos.
        hint: "Nutze `--role-arn`, `--role-session-name test` und `--profile dev`."
    responses:
      - match: "^aws\\s+configure$"
        output: "Hinweis: `aws configure` fragt nach dauerhaften Access Keys. Genau die wollen wir vermeiden – nutze die SSO-Profile."
---

Ein Entwickler legt sich einen Access Key an, „nur kurz zum Testen“, und speichert ihn in einer
Konfigurationsdatei. Wochen später landet die Datei versehentlich in einem öffentlichen Git-Repository.
Bots durchsuchen solche Repositorys rund um die Uhr – nach wenigen Minuten laufen im Konto fremde Server.
Diese Lektion zeigt dir, wie du so etwas von vornherein vermeidest.

## Wer fragt? Der Principal

[[iam|IAM]] (*Identity and Access Management*) entscheidet bei **jeder** Anfrage an AWS, ob sie erlaubt ist.
Dafür muss AWS wissen, wer fragt. Dieses „Wer“ heißt [[principal|Principal]]. Es gibt drei Arten von
IAM-Identitäten:

| Identität | Was sie ist | Zugangsdaten |
|---|---|---|
| [[iam-benutzer\|IAM-Benutzer]] | Eine Person oder Anwendung mit eigenem Login | dauerhaft: Passwort, Access Keys |
| [[iam-gruppe\|IAM-Gruppe]] | Bündel von Benutzern mit gemeinsamen Rechten | keine – eine Gruppe kann sich nicht anmelden |
| [[iam-rolle\|IAM-Rolle]] | Eine Identität, die man **übernimmt** | nur temporär, bei jeder Übernahme neu |

Eine Rolle ist wie ein Dienstausweis, den man am Empfang abholt: Er gilt nur für heute und muss morgen
neu ausgestellt werden.

## Rollen übernehmen

Eine Rolle hat zwei Seiten:

1. Eine **[[trust-policy|Vertrauensrichtlinie]]** (*Trust Policy*): Wer darf die Rolle übernehmen? Zum Beispiel „der Dienst
   EC2“ oder „Personen aus der Gruppe Deploy“.
2. **Berechtigungen**: Was darf man, während man die Rolle trägt?

Wer die Rolle übernimmt, bekommt vom [[aws-sts|Security Token Service (STS)]]
[[kurzlebige-zugangsdaten|temporäre Zugangsdaten]]:

```json
{
  "AccessKeyId": "ASIA<temporaere-key-id>",
  "SecretAccessKey": "<temporaeres-secret>",
  "SessionToken": "<session-token>",
  "Expiration": "2026-10-10T13:00:00+00:00"
}
```

Typische Nutzer von Rollen: EC2-Instanzen und Container, Lambda-Funktionen, CI-Pipelines und auch
Menschen, die sich über IAM Identity Center anmelden.

## Access Keys – die riskante Variante

Ein [[access-key|Access Key]] besteht aus einer Key-ID (beginnt mit `AKIA`) und einem geheimen Schlüssel.
Er gilt, bis jemand ihn löscht – oft jahrelang.

| | Access Key (dauerhaft) | Temporäre Zugangsdaten |
|---|---|---|
| Gültigkeit | unbegrenzt | Minuten bis Stunden |
| Bei Leck | Angreifer hat Zugriff, bis jemand es merkt | Zugriff endet von selbst |
| Rotation | manuell, wird oft vergessen | automatisch bei jeder Anmeldung |

> [!FEHLER]
> **Access Keys im Code oder in Git.** Ein Schlüssel in `.env`, einem Skript oder einer Konfigurationsdatei
> im Repository gilt als veröffentlicht. Löschen aus dem Repository reicht nicht – der Schlüssel muss sofort
> in IAM deaktiviert und ersetzt werden.

## IAM Identity Center und die CLI

Für Menschen ist [[iam-identity-center|IAM Identity Center]] der empfohlene Weg. Die
[[aws-cli|AWS CLI]] kann sich darüber anmelden und holt sich die kurzlebigen Zugangsdaten selbst. Die
Einstellungen stehen in `~/.aws/config`, aufgeteilt in [[aws-profil|Profile]]:

```ini title="~/.aws/config"
[sso-session firma]
sso_start_url = https://example.awsapps.com/start
sso_region = eu-central-1
sso_registration_scopes = sso:account:access

[profile dev]
sso_session = firma
sso_account_id = 123456789012
sso_role_name = DeveloperAccess
region = eu-central-1
```

```bash title="Terminal"
aws configure sso                       # Assistent, schreibt die Datei oben
aws sso login --profile dev             # öffnet den Browser zur Anmeldung
aws sts get-caller-identity --profile dev
```

Statt `--profile` kannst du auch `export AWS_PROFILE=dev` setzen.

> [!MERKSATZ]
> Menschen melden sich über IAM Identity Center an, Anwendungen übernehmen Rollen. Dauerhafte Access Keys
> sind die Ausnahme – und nie im Code.

## Welcher Weg für wen?

| Wer braucht Zugriff? | Empfohlener Weg |
|---|---|
| Entwickler:innen, Admins | IAM Identity Center, CLI mit `aws sso login` |
| App auf EC2, ECS, Lambda | IAM-Rolle, die der Dienst automatisch übernimmt |
| CI-Pipeline außerhalb von AWS | Rolle über OpenID Connect (siehe Kurs „Deployments & CI/CD“) |
| Altes System ohne Rollen-Unterstützung | Notfalls ein Access Key mit minimalen Rechten und Rotation |

> [!PRAXIS]
> Bei Sicherheits-Audits ist eine der ersten Fragen: „Gibt es IAM-Benutzer mit Access Keys, die älter als
> 90 Tage sind?“ Teams, die konsequent auf Rollen und Identity Center setzen, beantworten das mit „Wir haben
> gar keine IAM-Benutzer.“

## Zusammenfassung

- Jede Anfrage an AWS kommt von einem **Principal**; IAM entscheidet, ob sie erlaubt ist.
- **Benutzer** haben dauerhafte Zugangsdaten, **Gruppen** bündeln Rechte, **Rollen** werden übernommen.
- Rollen liefern über **STS** temporäre Zugangsdaten: Key-ID, Secret, Session-Token und Ablaufzeit.
- **Access Keys** gelten unbegrenzt – ein Leck ist gefährlich, deshalb gehören sie nie in Code oder Git.
- Menschen nutzen **IAM Identity Center**; die CLI meldet sich mit `aws sso login --profile …` an.
