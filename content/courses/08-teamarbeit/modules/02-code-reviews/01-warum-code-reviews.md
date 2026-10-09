---
title: Warum Code-Reviews?
summary: Wozu Teams fremden Code lesen, worauf ein Review achtet – Korrektheit, Lesbarkeit, Sicherheit, Tests – und was Reviews nicht leisten müssen.
duration: 20
sources:
  - title: Google Engineering Practices – What to look for in a code review
    url: https://google.github.io/eng-practices/review/reviewer/looking-for.html
  - title: GitHub Docs – About pull request reviews
    url: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/about-pull-request-reviews
  - title: OWASP Code Review Guide
    url: https://owasp.org/www-project-code-review-guide/
quiz:
  - type: multiple
    question: Welche Ziele verfolgt ein Code-Review? (mehrere Antworten)
    options:
      - Fehler finden, bevor sie ausgeliefert werden
      - Wissen über den Code im Team verteilen
      - Herausfinden, wer im Team am schlechtesten programmiert
      - Den Code für alle verständlich halten
    answers: [0, 1, 3]
    explanation: Reviews verbessern Code und verteilen Wissen. Sie sind kein Werkzeug, um Menschen zu bewerten.
  - type: find-bug
    question: Ein Pull Request enthält diese PHP-Funktion. Welche Zeile solltest du im Review als Sicherheitsproblem markieren?
    language: php
    code: |
      function findUser(PDO $db, string $email): array|false
      {
          $sql = "SELECT * FROM users WHERE email = '$email'";
          return $db->query($sql)->fetch();
      }
    bug_line: 3
    explanation: "Die E-Mail wird direkt in den SQL-Text eingesetzt – das ermöglicht SQL-Injection. Richtig ist ein Prepared Statement mit Platzhalter: `WHERE email = ?`."
  - type: match
    question: Welche Review-Entscheidung passt zu welcher Situation?
    pairs:
      - { left: "Approve", right: "Alles passt, der Code darf gemergt werden" }
      - { left: "Request changes", right: "Es gibt einen Fehler, der vor dem Merge behoben werden muss" }
      - { left: "Comment", right: "Du hast nur Fragen oder Anmerkungen, ohne zu blockieren" }
    explanation: Auf GitHub schließt du ein Review mit einer dieser drei Entscheidungen ab.
  - type: single
    question: Worüber sollte im Review möglichst NICHT diskutiert werden?
    options:
      - Ob ein Sonderfall vergessen wurde
      - Ob Einrückung und Leerzeichen richtig sind
      - Ob ein Test für den Fehlerfall fehlt
    answer: 1
    explanation: Stilfragen erledigt ein Formatter automatisch. Menschliche Aufmerksamkeit ist für Logik, Sicherheit und Verständlichkeit da.
tasks:
  - id: funde-einordnen
    type: dragdrop
    title: Review-Funde einordnen
    description: Ordne jeden Fund aus einem Code-Review der passenden Kategorie zu.
    targets:
      - { id: korrektheit, label: Korrektheit }
      - { id: lesbarkeit, label: Lesbarkeit }
      - { id: sicherheit, label: Sicherheit }
      - { id: tests, label: Tests }
    items:
      - { label: "Die Schleife lässt das letzte Element der Liste aus", target: korrektheit }
      - { label: "Rabatt wird bei einem leeren Warenkorb negativ", target: korrektheit }
      - { label: "Die Variable heißt $x statt $grossPriceInCents", target: lesbarkeit }
      - { label: "Eine Funktion ist 200 Zeilen lang und macht fünf Dinge", target: lesbarkeit }
      - { label: "Ein API-Schlüssel steht im Klartext im Code", target: sicherheit }
      - { label: "Jede angemeldete Person kann fremde Bestellungen abrufen", target: sicherheit }
      - { label: "Für den neuen Fehlerfall gibt es keinen Test", target: tests }
      - { label: "Der Test prüft nichts, er ruft die Funktion nur auf", target: tests }
    hints:
      - Frag dich: Ist das Verhalten falsch, schwer zu verstehen, gefährlich oder nicht abgesichert?
  - id: review-szenario
    type: steps
    title: Dein erstes Review
    description: Du bist neu im Team und wirst als Reviewerin für einen Pull Request von Ben eingetragen.
    steps:
      - situation: Du öffnest den Pull Request. Er ändert 40 Zeilen in zwei Dateien und hat eine kurze Beschreibung mit Ticket-Link.
        question: Womit beginnst du?
        options:
          - Mit der Beschreibung und dem Ticket, um das Ziel zu verstehen
          - Direkt mit der ersten geänderten Zeile
          - Mit dem Approve-Button, Ben ist erfahrener als du
        answer: 0
        explanation: Ohne das Ziel zu kennen, kannst du nicht beurteilen, ob der Code es erreicht.
      - situation: Dir fällt auf, dass bei einer leeren Bestellung durch null geteilt wird.
        question: Wie reagierst du?
        options:
          - Ich schreibe einen Kommentar an der Zeile mit einem Beispiel und wähle „Request changes“
          - Ich sage nichts, vielleicht ist das gewollt
          - Ich behebe es selbst still in Bens Branch
        answer: 0
        explanation: Ein echter Fehler blockiert den Merge. Ein konkreter Kommentar mit Beispiel hilft Ben, ihn nachzuvollziehen.
      - situation: Du verstehst eine Funktion nicht, obwohl du sie zweimal gelesen hast.
        question: Was tust du?
        options:
          - Ich stelle eine Frage – vielleicht braucht der Code einen besseren Namen oder einen Kommentar
          - Ich überspringe sie, das ist sicher mein Fehler
          - Ich lehne den Pull Request ab
        answer: 0
        explanation: Wenn Code für dich schwer verständlich ist, geht es anderen genauso. Deine Frage ist wertvolles Feedback.
---

Ben hat drei Tage an einer neuen Rabattfunktion gearbeitet. Alles läuft auf seinem Rechner. Bevor sein
Code ausgeliefert wird, liest Anna ihn – und entdeckt, dass Rabatte bei leeren Warenkörben negativ werden.
Fünf Minuten Lesen haben einen Fehler verhindert, der sonst Geld gekostet hätte.

## Was ein Code-Review ist

Bei einem [[code-review|Code-Review]] liest mindestens eine andere Person deine Änderungen, bevor sie in
den gemeinsamen Code einfließen. Meist geschieht das in einem [[pull-request|Pull Request]]. Die Person,
die prüft, heißt [[reviewer|Reviewer]] oder Reviewerin.

Das Prinzip kennst du aus anderen Berufen. Ein Artikel geht vor dem Druck durch das Lektorat. Ein Bauplan
wird von einer zweiten Ingenieurin geprüft. Man spricht vom [[vier-augen-prinzip|Vier-Augen-Prinzip]].

> [!MERKSATZ]
> Ein Review prüft den **Code**, nicht den Menschen. Jeder Code wird reviewt – auch der von erfahrenen
> Kolleginnen.

## Warum Teams reviewen

Reviews haben mehr Nutzen, als man zuerst denkt:

| Ziel | Was das konkret bedeutet |
|---|---|
| Fehler finden | Vergessene Sonderfälle, falsche Bedingungen, Sicherheitslücken |
| Wissen verteilen | Mindestens zwei Personen kennen jede Änderung |
| Verständlichkeit sichern | Was die Reviewerin nicht versteht, versteht später auch sonst niemand |
| Voneinander lernen | Neue lernen Muster des Projekts, Erfahrene lernen neue Ideen |
| Gemeinsame Standards | Der Code bleibt einheitlich und wartbar |

Besonders der zweite Punkt wird unterschätzt. Ist die einzige Person, die einen Code-Teil kennt, im
Urlaub, steht das Team still. Reviews verteilen dieses Wissen ganz nebenbei.

## Worauf du achtest

Ein gutes Review geht die Änderung mit einigen festen Fragen durch:

- **Korrektheit:** Tut der Code, was das Ticket verlangt? Was passiert bei leeren Listen, `null`, sehr
  großen Zahlen oder doppelten Klicks?
- **Lesbarkeit:** Verraten Namen, was etwas tut? Ist eine Funktion zu lang? Würdest du den Code in einem
  Jahr noch verstehen?
- **Sicherheit:** Werden Eingaben geprüft? Darf jede Person nur ihre eigenen Daten sehen? Stehen
  Passwörter oder Tokens im Code?
- **Tests:** Gibt es Tests für den Normalfall und für die Fehlerfälle? Prüfen sie wirklich etwas?

```php title="Ein typischer Review-Fund"
// Vorher: Rabatt kann negativ werden
$discount = $cart->total() - 10;

// Nachher: Rabatt höchstens so hoch wie die Summe
$discount = min(10, $cart->total());
```

Ignoriert man Probleme dauerhaft, entstehen [[technische-schulden|technische Schulden]]: Jede spätere
Änderung wird langsamer und riskanter.

> [!FEHLER]
> **Nur den Diff lesen.** Manchmal steckt der Fehler in dem, was **fehlt**: ein Aufrufer, der nicht
> angepasst wurde, oder ein Test, den es nicht gibt. Öffne bei Bedarf die ganze Datei.

## Was ein Review nicht leisten muss

Menschen sind schlecht darin, fehlende Leerzeichen zu zählen – und es ist Zeitverschwendung. Stilfragen
gehören in automatische Werkzeuge: Ein Formatter wie Pint oder Prettier und ein [[linter|Linter]] laufen
vor dem Review. Was sie prüfen, muss niemand mehr kommentieren.

Ein Review ersetzt auch keine Tests. Es ergänzt sie: Tests prüfen, ob Code funktioniert. Menschen prüfen,
ob es der **richtige** Code ist und ob andere ihn verstehen.

> [!PRAXIS]
> Auf GitHub endet ein Review mit einer von drei Entscheidungen: **Comment**, **Approve** oder
> **Request changes**. Viele Teams verlangen mindestens eine [[approval|Freigabe]], bevor gemergt werden
> darf. So kann niemand Code ohne zweite Meinung ausliefern.

## Zusammenfassung

- Beim Code-Review liest eine andere Person deine Änderung, bevor sie gemergt wird.
- Reviews finden Fehler, verteilen Wissen und halten den Code verständlich.
- Worauf du achtest: Korrektheit, Lesbarkeit, Sicherheit, Tests.
- Stilfragen erledigen Formatter und Linter, nicht Menschen.
- Ein Review bewertet Code, niemals Personen.
