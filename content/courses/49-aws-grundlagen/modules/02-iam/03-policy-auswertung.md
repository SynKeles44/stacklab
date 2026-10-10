---
title: Wie AWS Policies auswertet
summary: Impliziter Deny, explizites Allow, expliziter Deny – und wie SCPs und Permissions Boundaries als Obergrenzen wirken. So sagst du voraus, ob eine Anfrage erlaubt wird.
duration: 25
sources:
  - title: IAM – Policy evaluation logic
    url: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html
  - title: IAM – Permissions boundaries for IAM entities
    url: https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html
  - title: AWS Organizations – Service control policies (SCPs)
    url: https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html
  - title: IAM – Troubleshoot access denied error messages
    url: https://docs.aws.amazon.com/IAM/latest/UserGuide/troubleshoot_access-denied.html
quiz:
  - type: single
    question: Eine Rolle hat keine einzige Policy. Was passiert, wenn sie `s3:GetObject` aufruft?
    options:
      - Die Anfrage wird erlaubt, weil nichts verboten ist.
      - Die Anfrage wird abgelehnt – das ist der implizite Deny.
      - AWS fragt den Root-Benutzer.
    answer: 1
    explanation: In AWS ist alles verboten, was nicht ausdrücklich erlaubt wurde.
  - type: single
    question: Eine Policy erlaubt `s3:*` auf allen Buckets, eine zweite Policy derselben Rolle verbietet `s3:DeleteObject`. Darf die Rolle Objekte löschen?
    options:
      - Ja, weil `s3:*` auch DeleteObject enthält.
      - Nein, ein expliziter Deny gewinnt immer gegen ein Allow.
      - Das hängt von der Reihenfolge der Policies ab.
    answer: 1
    explanation: Die Reihenfolge spielt keine Rolle. Ein passender expliziter Deny überstimmt jedes Allow.
  - type: multiple
    question: Welche Policy-Arten vergeben selbst keine Rechte, sondern setzen nur eine Obergrenze?
    options:
      - Service Control Policies (SCPs)
      - Permissions Boundaries
      - Identitätsbasierte Policies
      - Bucket-Policies
    answers: [0, 1]
    explanation: SCPs und Permissions Boundaries begrenzen, was höchstens möglich ist. Erlauben müssen es zusätzlich die identitäts- oder ressourcenbasierten Policies.
  - type: cloze
    text: "Erlaubt ist eine Anfrage nur, wenn es mindestens ein passendes ___ gibt und kein passendes explizites ___."
    blanks:
      - [Allow]
      - [Deny]
    explanation: Diese Kurzformel deckt die meisten Fälle in einem einzelnen Konto ab.
tasks:
  - id: auswerten-js
    type: code
    language: js
    title: Die Auswertung selbst programmieren
    description: |
      Schreibe `evaluate(statements, request)`. `statements` ist eine Liste von Statements aus allen
      identitätsbasierten Policies einer Rolle, `request` hat die Form `{ action, resource }`.

      - Ein Statement passt, wenn eine seiner Actions **und** eine seiner Resources passt. `Action` und
        `Resource` können ein String oder ein Array sein. Platzhalter `*` (beliebig viele Zeichen) sind erlaubt.
      - Gibt es ein passendes Statement mit `"Effect": "Deny"`, liefere `"ExplicitDeny"`.
      - Sonst: Gibt es ein passendes Statement mit `"Effect": "Allow"`, liefere `"Allow"`.
      - Sonst liefere `"ImplicitDeny"`.

      Bei Actions spielt Groß- und Kleinschreibung keine Rolle, bei Resources schon. Die Hilfsfunktion
      `matches` ist schon vorbereitet.
    starter: |
      function matches(pattern, value, ignoreCase) {
        const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
        return new RegExp('^' + escaped + '$', ignoreCase ? 'i' : '').test(value)
      }

      function evaluate(statements, request) {
        // Dein Code
      }
    tests:
      - name: Ohne passende Statements gilt der implizite Deny
        code: |
          assertEqual(evaluate([], { action: 's3:GetObject', resource: 'arn:aws:s3:::example/a.txt' }), 'ImplicitDeny')
          assertEqual(evaluate([{ Effect: 'Allow', Action: 'ec2:*', Resource: '*' }], { action: 's3:GetObject', resource: 'arn:aws:s3:::example/a.txt' }), 'ImplicitDeny')
      - name: Ein passendes Allow erlaubt
        code: |
          const s = [{ Effect: 'Allow', Action: ['s3:GetObject', 's3:PutObject'], Resource: 'arn:aws:s3:::example/*' }]
          assertEqual(evaluate(s, { action: 'S3:getobject', resource: 'arn:aws:s3:::example/bild.png' }), 'Allow')
          assertEqual(evaluate(s, { action: 's3:GetObject', resource: 'arn:aws:s3:::anderer/bild.png' }), 'ImplicitDeny')
      - name: Ein expliziter Deny gewinnt – egal in welcher Reihenfolge
        code: |
          const allow = { Effect: 'Allow', Action: 's3:*', Resource: '*' }
          const deny = { Effect: 'Deny', Action: 's3:DeleteObject', Resource: ['arn:aws:s3:::example/*'] }
          assertEqual(evaluate([allow, deny], { action: 's3:DeleteObject', resource: 'arn:aws:s3:::example/a.txt' }), 'ExplicitDeny')
          assertEqual(evaluate([deny, allow], { action: 's3:DeleteObject', resource: 'arn:aws:s3:::example/a.txt' }), 'ExplicitDeny')
          assertEqual(evaluate([deny, allow], { action: 's3:GetObject', resource: 'arn:aws:s3:::example/a.txt' }), 'Allow')
      - name: Resources unterscheiden Groß- und Kleinschreibung
        code: |
          const s = [{ Effect: 'Allow', Action: 's3:GetObject', Resource: 'arn:aws:s3:::example/Berichte/*' }]
          assertEqual(evaluate(s, { action: 's3:GetObject', resource: 'arn:aws:s3:::example/berichte/q1.pdf' }), 'ImplicitDeny')
    hints:
      - "Mach aus `Action` und `Resource` immer ein Array: `[].concat(statement.Action)`."
      - "Filtere zuerst alle passenden Statements, dann prüfe mit `some`, ob ein Deny dabei ist."
      - "Für Actions `matches(p, request.action, true)`, für Resources `matches(p, request.resource, false)`."
    solution: |
      ```js
      function matches(pattern, value, ignoreCase) {
        const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
        return new RegExp('^' + escaped + '$', ignoreCase ? 'i' : '').test(value)
      }

      function evaluate(statements, request) {
        const matching = statements.filter((statement) =>
          [].concat(statement.Action).some((p) => matches(p, request.action, true)) &&
          [].concat(statement.Resource).some((p) => matches(p, request.resource, false))
        )
        if (matching.some((s) => s.Effect === 'Deny')) return 'ExplicitDeny'
        if (matching.some((s) => s.Effect === 'Allow')) return 'Allow'
        return 'ImplicitDeny'
      }
      ```
  - id: auswertung-schritte
    type: steps
    title: Erlaubt oder abgelehnt?
    description: |
      Die Rolle `deploy` im Konto `123456789012` hat die Managed Policy `PowerUserAccess` (erlaubt fast alles
      außer IAM). Das Konto gehört zu einer Organisation. Gehe die Anfragen Schritt für Schritt durch.
    steps:
      - situation: Die Rolle ruft `s3:PutObject` auf einem Bucket in `eu-central-1` auf. Keine SCP und keine Bucket-Policy verbietet etwas.
        question: Wie entscheidet AWS?
        options: [Erlaubt, Abgelehnt (implizit), Abgelehnt (explizit)]
        answer: 0
        explanation: Es gibt ein passendes Allow aus PowerUserAccess und keinen Deny – also erlaubt.
      - situation: Die Rolle ruft `iam:CreateUser` auf.
        question: Wie entscheidet AWS?
        options: [Erlaubt, Abgelehnt (implizit), Abgelehnt (explizit)]
        answer: 1
        explanation: PowerUserAccess erlaubt IAM-Aktionen nicht. Kein Allow heißt impliziter Deny.
      - situation: Eine SCP der Organisation verbietet per Deny alle Aktionen außerhalb von `eu-central-1` und `eu-west-1`. Die Rolle startet eine EC2-Instanz in `us-east-1`.
        question: Wie entscheidet AWS?
        options: [Erlaubt, Abgelehnt (implizit), Abgelehnt (explizit)]
        answer: 2
        explanation: Die SCP enthält einen passenden expliziten Deny. Der gewinnt, auch wenn PowerUserAccess EC2 erlaubt.
      - situation: Das Team gibt der Rolle zusätzlich `AdministratorAccess`, um das Problem zu umgehen, und versucht es erneut in `us-east-1`.
        question: Was passiert jetzt?
        options: [Erlaubt – Administrator darf alles, Weiterhin abgelehnt – die SCP gilt für alle Identitäten im Konto]
        answer: 1
        explanation: SCPs sind eine Obergrenze für das ganze Konto. Keine Policy im Konto kann sie aufheben.
---

„Access Denied“ – und keiner weiß, warum. Die Rolle hat doch eine Policy mit `s3:*`! Wer die Regeln
kennt, nach denen AWS entscheidet, findet die Ursache in Minuten statt in Stunden. Die gute Nachricht:
Für die allermeisten Fälle reichen drei Regeln.

## Regel 1: Alles ist verboten

Jede Anfrage beginnt mit der Annahme „abgelehnt“. Das heißt [[impliziter-deny|impliziter Deny]]: Was
nirgends erlaubt ist, ist verboten. Eine neue Rolle ohne Policies darf deshalb **nichts**.

Das ist das Prinzip *Deny by default* – genau wie bei einer Firewall, die nur durchlässt, was in einer
Regel steht.

## Regel 2: Ein Allow öffnet

Findet AWS in den passenden Policies ein Statement mit `"Effect": "Allow"`, dessen Action, Resource und
Condition zur Anfrage passen, wird die Anfrage erlaubt – sofern Regel 3 nicht zuschlägt.

Innerhalb eines Kontos zählen dabei identitätsbasierte **und** ressourcenbasierte Policies zusammen: Es
reicht, wenn **eine** der beiden ein Allow enthält.

```json title="Allow aus einer identitätsbasierten Policy"
{ "Effect": "Allow", "Action": "s3:*", "Resource": "*" }
```

## Regel 3: Ein expliziter Deny gewinnt immer

Ein Statement mit `"Effect": "Deny"`, das zur Anfrage passt, ist ein [[expliziter-deny|expliziter Deny]].
Er überstimmt **jedes** Allow – egal in welcher Policy, egal in welcher Reihenfolge.

```json title="Deny: Objekte dürfen nie gelöscht werden"
{ "Effect": "Deny", "Action": "s3:DeleteObject", "Resource": "arn:aws:s3:::example-backups/*" }
```

![Ablauf der Policy-Auswertung: expliziter Deny, Obergrenzen, Allow, sonst impliziter Deny](/assets/aws-grundlagen/policy-auswertung.svg)

> [!MERKSATZ]
> Expliziter Deny schlägt Allow. Allow schlägt den impliziten Deny. Ohne Allow bleibt es beim Nein.

## Obergrenzen: SCPs und Permissions Boundaries

Zwei Policy-Arten vergeben selbst **keine** Rechte, sondern setzen Grenzen:

| Art | Gilt für | Typischer Einsatz |
|---|---|---|
| [[service-control-policy\|SCP]] | alle Identitäten eines Kontos in einer Organisation | „Nur EU-Regionen erlaubt“ |
| [[permissions-boundary\|Permissions Boundary]] | eine einzelne Rolle oder einen Benutzer | „Diese Rolle darf nie mehr als S3 und Logs“ |

Eine Aktion ist nur dann erlaubt, wenn sie in der Obergrenze **und** in einer normalen Policy erlaubt ist.
Rechnerisch ist das die Schnittmenge. Eine Rolle mit `AdministratorAccess` darf in einem Konto mit einer
„Nur EU“-SCP trotzdem nichts in `us-east-1` starten.

> [!FEHLER]
> **Noch mehr Rechte geben, wenn etwas abgelehnt wird.** Steckt der Deny in einer SCP oder Permissions
> Boundary, hilft keine zusätzliche Policy. Lies zuerst die Fehlermeldung: Sie nennt oft, welche
> Policy-Art abgelehnt hat.

## Fehlermeldungen lesen

AWS schreibt in vielen Fehlermeldungen dazu, woran es lag:

```text
User: arn:aws:sts::123456789012:assumed-role/deploy/ci is not authorized to perform:
ec2:RunInstances on resource: arn:aws:ec2:us-east-1:123456789012:instance/*
with an explicit deny in a service control policy
```

| Teil der Meldung | Bedeutung |
|---|---|
| `because no identity-based policy allows …` | Kein Allow – impliziter Deny |
| `with an explicit deny in an identity-based policy` | Ein Deny in den eigenen Policies |
| `with an explicit deny in a service control policy` | Die Organisation verbietet es |

> [!PRAXIS]
> Bevor du eine Policy ausrollst, kannst du sie mit dem IAM Policy Simulator gegen Beispiel-Anfragen
> testen. In Code-Reviews hilft die Frage: „Welche Anfrage wird durch diese Änderung neu erlaubt – und
> gibt es dafür einen Grund?“

## Zusammenfassung

- Standard ist der **implizite Deny**: Ohne passendes Allow wird abgelehnt.
- Ein passendes **Allow** erlaubt – im selben Konto reicht eins aus identitäts- oder ressourcenbasierten Policies.
- Ein passender **expliziter Deny** gewinnt immer, unabhängig von der Reihenfolge.
- **SCPs** und **Permissions Boundaries** sind Obergrenzen: Erlaubt ist nur die Schnittmenge.
- Fehlermeldungen verraten, ob ein Allow fehlt oder ein Deny greift – lies sie, bevor du Rechte erweiterst.
