---
title: Das AWS-Konto absichern
summary: Warum der Root-Benutzer in den Tresor gehört, wie MFA das Konto schützt und wie AWS Organizations mehrere Konten für Entwicklung und Produktion trennt.
duration: 20
sources:
  - title: IAM – AWS account root user
    url: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_root-user.html
  - title: IAM – Multi-factor authentication for AWS account root user
    url: https://docs.aws.amazon.com/IAM/latest/UserGuide/enable-mfa-for-root.html
  - title: AWS Organizations – Terminology and concepts
    url: https://docs.aws.amazon.com/organizations/latest/userguide/orgs_getting-started_concepts.html
  - title: IAM – Security best practices in IAM
    url: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html
quiz:
  - type: single
    question: Wofür solltest du den Root-Benutzer im Alltag verwenden?
    options:
      - Für alle Admin-Aufgaben, weil er alle Rechte hat
      - Nur für die wenigen Aufgaben, die ausschließlich der Root-Benutzer erledigen kann
      - Für Deployments aus der CI-Pipeline
    answer: 1
    explanation: Der Root-Benutzer hat uneingeschränkte Rechte, die sich nicht beschränken lassen. Für den Alltag nutzt du eigene Identitäten mit passenden Rechten.
  - type: multiple
    question: Welche Maßnahmen schützen den Root-Benutzer?
    options:
      - MFA einrichten, am besten mit einem Passkey oder Sicherheitsschlüssel
      - Keine Access Keys für den Root-Benutzer anlegen
      - Das Root-Passwort im Team-Chat teilen, damit es niemand verliert
      - Eine E-Mail-Adresse verwenden, auf die das Team kontrolliert Zugriff hat
    answers: [0, 1, 3]
    explanation: MFA, keine Access Keys und eine gut verwaltete E-Mail-Adresse sind die Basis. Passwörter gehören in einen Passwortmanager, nicht in einen Chat.
  - type: single
    question: Was ist eine Service Control Policy (SCP) in AWS Organizations?
    options:
      - Eine Regel, die festlegt, welche Rechte in den Konten einer Organisation höchstens erlaubt sind
      - Eine Rechnung für einen einzelnen Dienst
      - Ein Passwort für die AWS-Konsole
    answer: 0
    explanation: Eine SCP vergibt selbst keine Rechte, sie setzt eine Obergrenze. Ein Konto kann nie mehr dürfen, als die SCP zulässt.
  - type: find-bug
    question: Ein Team schreibt eine Checkliste für ein neues AWS-Konto. Welche Zeile ist gefährlich?
    language: text
    code: |
      1. Root-Benutzer: starkes Passwort im Passwortmanager speichern
      2. Root-Benutzer: Passkey als MFA registrieren
      3. Root-Benutzer: Access Key für das Deploy-Skript anlegen
      4. IAM Identity Center einrichten und Admin-Zugang für das Team anlegen
      5. Budget mit E-Mail-Benachrichtigung anlegen
    bug_line: 3
    explanation: Ein Access Key für den Root-Benutzer gibt jedem, der ihn findet, die volle Kontrolle über das Konto. Deploys laufen über eine Rolle mit minimalen Rechten.
tasks:
  - id: erste-schritte
    type: order
    title: Die ersten Schritte mit einem neuen Konto
    description: Du hast gerade ein neues AWS-Konto angelegt. Bringe die Schritte in eine sinnvolle Reihenfolge.
    items:
      - Mit dem Root-Benutzer anmelden und ein starkes Passwort sicher ablegen
      - MFA für den Root-Benutzer einrichten (Passkey oder Sicherheitsschlüssel)
      - Ein Budget mit E-Mail-Benachrichtigung anlegen
      - IAM Identity Center aktivieren und eine eigene Admin-Identität anlegen
      - Vom Root-Benutzer abmelden und ab jetzt nur noch die eigene Identität nutzen
      - Für Anwendungen und Pipelines Rollen mit minimalen Rechten anlegen
    hints:
      - Erst den mächtigsten Zugang schützen, dann alles andere aufbauen.
      - Der Root-Benutzer wird am Ende nicht mehr gebraucht.
  - id: konto-pruefen
    type: simulated
    title: Den Sicherheitszustand des Kontos prüfen
    description: |
      Du bist über IAM Identity Center mit dem Profil `admin` angemeldet. Prüfe, wer du bist und ob der
      Root-Benutzer abgesichert ist.

      1. Zeige an, mit welcher Identität du angemeldet bist:
         `aws sts get-caller-identity --profile admin`
      2. Rufe die Kontozusammenfassung von IAM ab:
         `aws iam get-account-summary --profile admin`
    prompt: "du@laptop:~$"
    steps:
      - expect: "^aws\\s+sts\\s+get-caller-identity\\s+--profile\\s+admin$"
        output: |
          {
              "UserId": "AROAEXAMPLEROLEID:du@example.com",
              "Account": "123456789012",
              "Arn": "arn:aws:sts::123456789012:assumed-role/AWSReservedSSO_AdministratorAccess_0123456789abcdef/du@example.com"
          }

          Du bist kein IAM-Benutzer, sondern hast über IAM Identity Center eine Rolle übernommen ("assumed-role").
        hint: "Tippe `aws sts get-caller-identity --profile admin`."
      - expect: "^aws\\s+iam\\s+get-account-summary\\s+--profile\\s+admin$"
        output: |
          {
              "SummaryMap": {
                  "AccountMFAEnabled": 1,
                  "AccountAccessKeysPresent": 0,
                  "Users": 0,
                  "Groups": 0,
                  "Roles": 7,
                  "Policies": 3
              }
          }

          AccountMFAEnabled 1     → der Root-Benutzer hat MFA.
          AccountAccessKeysPresent 0 → der Root-Benutzer hat keine Access Keys. Genau so soll es sein.
        hint: "Tippe `aws iam get-account-summary --profile admin`."
    responses:
      - match: "create-access-key"
        output: "Stopp: Für diese Übung legst du keine Access Keys an. Prüfe nur den Zustand des Kontos."
---

Beim Anlegen eines AWS-Kontos gibst du eine E-Mail-Adresse und ein Passwort an. Damit entsteht ein
Zugang, der **alles** darf: Server starten, Daten löschen, das Konto schließen. Wer dieses Passwort
erbeutet, kann in einer Nacht Rechnungen über Tausende Euro erzeugen. Deshalb ist die Absicherung des
Kontos der allererste Schritt – noch vor dem ersten Server.

## Das AWS-Konto als Container

Ein [[aws-konto|AWS-Konto]] ist ein abgeschlossener Container für Ressourcen, Rechnungen und Rechte. Es hat
eine zwölfstellige Konto-ID wie `123456789012`. Ressourcen eines Kontos sind für andere Konten unsichtbar,
solange du nicht ausdrücklich etwas freigibst.

Diese Trennung ist ein Sicherheitswerkzeug: Viele Teams nutzen **ein Konto pro Umgebung** – eins für
Entwicklung, eins für Staging, eins für Produktion. Ein Fehler im Entwicklungskonto kann dann die
Produktion nicht beschädigen.

## Der Root-Benutzer

Der [[root-benutzer|Root-Benutzer]] ist die Identität mit der E-Mail-Adresse, mit der das Konto angelegt
wurde. Er hat uneingeschränkten Zugriff – und anders als bei allen anderen Identitäten lässt sich das
im eigenen Konto nicht einschränken.

Nur wenige Aufgaben erfordern ihn wirklich, zum Beispiel:

- bestimmte Konto-Einstellungen ändern (etwa die Root-E-Mail-Adresse),
- das Konto schließen,
- den Support-Plan wechseln.

Für alles andere legst du eigene Identitäten an.

> [!MERKSATZ]
> Der Root-Benutzer gehört in den Tresor: starkes Passwort, MFA, **keine** Access Keys – und im
> Alltag wird er nicht benutzt.

## MFA – der zweite Faktor

[[zwei-faktor-authentifizierung|Multi-Faktor-Authentifizierung (MFA)]] verlangt neben dem Passwort einen
zweiten Nachweis. AWS verlangt MFA inzwischen für den Root-Benutzer aller Kontoarten. Unterstützt werden:

| MFA-Typ | Beispiel | Bewertung |
|---|---|---|
| Passkey / Sicherheitsschlüssel | Hardware-Schlüssel, Passkey im Passwortmanager | Empfohlen – schützt auch vor [[phishing\|Phishing]] |
| Authenticator-App | App mit sechsstelligen [[totp\|TOTP]]-Codes | Gut, aber Codes können abgefischt werden |
| Hardware-TOTP-Token | Kleines Gerät mit Code-Anzeige | Möglich, Passkeys sind bequemer |

> [!FEHLER]
> **MFA auf dem privaten Handy einer einzelnen Person.** Verlässt sie das Team oder verliert das Handy,
> wird die Wiederherstellung mühsam. Hinterlege das Konto mit einer Team-E-Mail-Adresse (`aws-root@example.com`)
> und registriere mehrere MFA-Geräte, die das Team kontrolliert verwahrt.

## Identitäten für den Alltag

Für die tägliche Arbeit empfiehlt AWS das [[iam-identity-center|IAM Identity Center]]. Dort legst du
Personen an (oder bindest euren Firmen-Login per [[single-sign-on|Single Sign-On]] an) und gibst ihnen
Berechtigungen für bestimmte Konten.

Die Anmeldung liefert dann **kurzlebige** Zugangsdaten, die nach wenigen Stunden ablaufen. Wie das
genau funktioniert und warum es besser ist als dauerhafte Schlüssel, lernst du im Modul zu IAM.

## Viele Konten mit AWS Organizations

Sobald es mehrere Konten gibt, fasst [[aws-organizations|AWS Organizations]] sie zusammen:

```text
Verwaltungskonto (Management Account) – Abrechnung, Organisation
└── Root
    ├── OU "Produktion"
    │   └── Konto "prod"      123456789012
    └── OU "Entwicklung"
        ├── Konto "dev"       210987654321
        └── Konto "sandbox"   111122223333
```

- **Organisationseinheiten (OUs)** gruppieren Konten wie Ordner.
- Eine gemeinsame Rechnung läuft über das Verwaltungskonto.
- [[service-control-policy|Service Control Policies (SCPs)]] setzen Obergrenzen, etwa: „In der OU
  Entwicklung dürfen nur die Regionen `eu-central-1` und `eu-west-1` genutzt werden.“

> [!PRAXIS]
> Im Verwaltungskonto selbst laufen in gut organisierten Firmen **keine** Anwendungen. Es dient nur der
> Abrechnung und Verwaltung – so bleibt das mächtigste Konto klein und leicht zu überwachen.

## Zusammenfassung

- Ein **AWS-Konto** trennt Ressourcen, Rechte und Rechnungen; viele Teams nutzen ein Konto pro Umgebung.
- Der **Root-Benutzer** darf alles – sichere ihn mit starkem Passwort und **MFA** ab und lege keine Access Keys an.
- Passkeys und Sicherheitsschlüssel sind die stärkste MFA-Form.
- Für den Alltag nutzt du **IAM Identity Center** mit kurzlebigen Zugangsdaten.
- **AWS Organizations** bündelt Konten in OUs; **SCPs** legen fest, was dort höchstens erlaubt ist.
