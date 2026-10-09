---
title: Verständlich schreiben
summary: Kurze Sätze, aktive Sprache, einheitliche Begriffe und Beispiele zuerst – so liest sich technische Doku leicht.
duration: 20
sources:
  - title: Google Developer Documentation Style Guide
    url: https://developers.google.com/style
  - title: Write the Docs – Style Guides
    url: https://www.writethedocs.org/guide/writing/style-guides/
quiz:
  - type: single
    question: Welcher Satz ist für eine Anleitung am besten geeignet?
    options:
      - Es wird empfohlen, dass die Konfigurationsdatei vor dem Start durch den Nutzer angepasst wird.
      - Passe die Konfigurationsdatei vor dem Start an.
      - Die Konfigurationsdatei sollte eventuell irgendwann angepasst werden.
    answer: 1
    explanation: >
      Aktiv, kurz und direkt: Wer handeln soll, steht im Satz (du), und das Verb steht vorne. Passiv und
      Füllwörter wie „eventuell“ machen Anleitungen schwammig.
  - type: multiple
    question: Welche Regeln machen technische Texte verständlicher?
    options:
      - Für dieselbe Sache immer dasselbe Wort verwenden.
      - Synonyme abwechseln, damit der Text nicht langweilig wird.
      - Ein Beispiel zeigen, bevor du die Theorie erklärst.
      - Einen Gedanken pro Satz.
    answers: [0, 2, 3]
    explanation: >
      In technischer Doku sind Synonyme gefährlich: Wer „Konto“ und „Account“ liest, fragt sich, ob das zwei
      verschiedene Dinge sind. Abwechslung ist hier kein Stilmittel, sondern eine Fehlerquelle.
  - type: find-bug
    question: In welcher Zeile bricht die Anleitung die Regel „einheitliche Begriffe“?
    language: markdown
    code: |
      ## Projekt starten

      1. Installiere die Abhängigkeiten mit `npm install`.
      2. Kopiere `.env.example` nach `.env`.
      3. Starte den Server mit `npm run dev`.
      4. Öffne die Anwendung im Browser und logge dich mit deinem Account ein.
      5. Lege in deinem Konto ein erstes Projekt an.
    bug_line: 6
    explanation: >
      Zeile 6 spricht von „Account“, Zeile 7 von „Konto“. Entscheide dich für ein Wort – und halte es in
      einem Glossar fest.
  - type: cloze
    text: Eine Liste mit festgelegten Fachbegriffen und ihrer Bedeutung heißt ___. Ein Regelwerk für Schreibweise und Ton heißt ___.
    blanks:
      - [Glossar]
      - [Styleguide, Style Guide, Style-Guide]
    explanation: Glossar und Styleguide sorgen dafür, dass alle im Team gleich schreiben.
tasks:
  - id: begriffe-vereinheitlichen
    type: terminal
    title: Begriffe vereinheitlichen, aktiv formulieren
    description: |
      Im Ordner `stil` liegt die Anleitung `anleitung.md` zum Zurücksetzen eines Passworts. Sie nennt dieselbe
      Person mal „Anwender“, mal „User“, mal „Benutzer“ und dasselbe Konto mal „Account“. Außerdem stehen
      zwei Schritte im Passiv.

      1. Lies die Datei mit `cat anleitung.md`.
      2. Nenne die Person überall **Nutzer** (bzw. „Nutzerin“/„Nutzern“ – Hauptsache, kein anderes Wort).
      3. Nenne das Konto überall **Konto**.
      4. Formuliere die Schritte im Aktiv – das Wort „wird“ soll nicht mehr vorkommen.
      5. Die fünf nummerierten Schritte bleiben erhalten.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit die Datei angelegt wird.
    workdir: stil
    setup: |
      cat > anleitung.md <<'EOF'
      # Passwort zurücksetzen

      Diese Anleitung zeigt, wie ein Anwender sein Passwort zurücksetzt.

      1. Der User öffnet die Login-Seite.
      2. Es wird auf „Passwort vergessen“ geklickt.
      3. Der Benutzer gibt die E-Mail-Adresse seines Accounts ein.
      4. Eine E-Mail mit einem Link wird verschickt.
      5. Der Nutzer klickt auf den Link und vergibt ein neues Passwort für sein Konto.
      EOF
    checks:
      - type: command
        run: grep -ciE '(^|[^a-zäöü])(user|anwender|benutzer)' anleitung.md || true
        stdout_equals: "0"
        message: Es kommen noch „User“, „Anwender“ oder „Benutzer“ vor. Nenne die Person überall „Nutzer“.
      - type: command
        run: grep -ciE 'account' anleitung.md || true
        stdout_equals: "0"
        message: Es steht noch „Account“ in der Anleitung. Verwende überall „Konto“.
      - type: command
        run: grep -ciE '(^|[^a-zäöü])wird([^a-zäöü]|$)' anleitung.md || true
        stdout_equals: "0"
        message: Mindestens ein Satz steht noch im Passiv („wird“). Formuliere aktiv, z. B. „Klicke auf …“ oder „Die App verschickt …“.
      - type: command
        run: grep -cE '^[1-5]\. ' anleitung.md
        stdout_equals: "5"
        message: Die Anleitung soll weiterhin genau fünf nummerierte Schritte (1. bis 5.) haben.
      - type: command
        run: grep -ciE 'nutzer' anleitung.md
        stdout_matches: "^[2-9]$"
        message: Das Wort „Nutzer“ sollte mehrmals vorkommen – mindestens in der Einleitung und in den Schritten.
    hints:
      - Öffne die Datei mit `nano anleitung.md` und ändere Zeile für Zeile.
      - "Aus „Es wird auf … geklickt“ wird zum Beispiel „Der Nutzer klickt auf …“."
      - "Für den Begriffstausch hilft `sed -i 's/Anwender/Nutzer/g; s/User/Nutzer/g; s/Benutzer/Nutzer/g; s/Accounts/Kontos/g' anleitung.md` – die Passiv-Sätze schreibst du danach von Hand um."
    solution: |
      ```bash
      cd stil
      cat > anleitung.md <<'EOF'
      # Passwort zurücksetzen

      Diese Anleitung zeigt, wie ein Nutzer sein Passwort zurücksetzt.

      1. Der Nutzer öffnet die Login-Seite.
      2. Der Nutzer klickt auf „Passwort vergessen“.
      3. Der Nutzer gibt die E-Mail-Adresse seines Kontos ein.
      4. Die App verschickt eine E-Mail mit einem Link.
      5. Der Nutzer klickt auf den Link und vergibt ein neues Passwort für sein Konto.
      EOF
      ```
  - id: abschnitt-aufbauen
    type: order
    title: Ein Doku-Abschnitt, der sich gut liest
    description: >
      Du beschreibst eine neue Kommandozeilen-Option `--dry-run`. Bring die Bausteine in die Reihenfolge, in der
      sie im Abschnitt stehen sollten – nach dem Prinzip „Beispiel zuerst“.
    items:
      - Ein Satz, was die Option bringt („Zeigt an, was passieren würde, ohne etwas zu ändern.“)
      - Ein Beispielaufruf mit der Ausgabe
      - Erklärung der Details (welche Schritte übersprungen werden)
      - Sonderfälle und Einschränkungen
      - Verweis auf weiterführende Doku
    hints:
      - Erst das Wofür, dann das Beispiel, dann die Details.
---
Du liest eine Anleitung: „Es ist zu beachten, dass seitens des Anwenders vor der Inbetriebnahme die
Konfiguration des Accounts vorgenommen werden sollte.“ Nach dem dritten Lesen verstehst du: Du sollst dein
Konto einrichten. Guter Inhalt hilft nichts, wenn niemand ihn versteht. Die gute Nachricht: Verständlich
schreiben ist keine Begabung, sondern eine Handvoll Regeln.

## Regel 1: Kurze Sätze

Ein Satz, ein Gedanke. Lange Schachtelsätze zwingen Leser:innen, sich den Anfang zu merken, bis das Verb am
Ende kommt.

| Statt | Besser |
|---|---|
| Nachdem du die Abhängigkeiten, die in der `package.json` stehen, installiert hast, kannst du, sofern die `.env` existiert, den Server starten. | Installiere die Abhängigkeiten. Lege die `.env` an. Starte dann den Server. |

Faustregeln:

- Ziel: unter 20 Wörter pro Satz.
- Ein Absatz behandelt eine Idee und hat 2–4 Sätze.
- Mehrere Schritte? Dann eine nummerierte Liste.

> [!MERKSATZ]
> Ein Satz, ein Gedanke. Mehrere Schritte gehören in eine nummerierte Liste.

## Regel 2: Aktiv statt Passiv

Im Passiv verschwindet, **wer** etwas tut: „Die Datei wird gelöscht.“ – Von wem? Von dir? Vom Programm?
In technischer Doku ist genau diese Information wichtig.

| Passiv (unklar) | Aktiv (klar) |
|---|---|
| Es wird auf „Speichern“ geklickt. | Klicke auf „Speichern“. |
| Die Daten werden nachts gesichert. | Ein Cronjob sichert die Daten jede Nacht um 2 Uhr. |
| Es sollte darauf geachtet werden, … | Achte darauf, … |

In Anleitungen sprichst du die Leser:innen direkt an und beginnst mit dem Verb: „Öffne“, „Kopiere“, „Starte“.
Lass Füllwörter wie „eigentlich“, „eventuell“ oder „einfach“ weg. „Einfach“ ist besonders gemein: Wer es
nicht sofort schafft, fühlt sich dumm.

## Regel 3: Einheitliche Begriffe

Im Deutschaufsatz soll man Wiederholungen vermeiden. In technischer Doku ist es umgekehrt: **Dasselbe Ding
heißt immer gleich.** Wer „Konto“, „Account“ und „Profil“ liest, vermutet drei verschiedene Dinge.

So bleibst du einheitlich:

- Leg Fachbegriffe in einem [[glossar|Glossar]] fest: Wort, Bedeutung, verbotene Synonyme.
- Nutze dieselben Wörter wie die Oberfläche. Heißt der Button „Speichern“, schreib nicht „Sichern“.
- Übernimm Namen aus dem Code genau: `user_id`, nicht „User-ID“ an einer und „Nutzerkennung“ an anderer Stelle.

> [!FEHLER]
> Abwechslung aus Stilgefühl: „Lege einen Nutzer an. Der Anwender erhält dann eine Mail. Danach kann sich der
> User einloggen.“ – Sind das drei Personen? Bleib bei einem Wort.

## Regel 4: Beispiele zuerst

Menschen verstehen Konkretes schneller als Abstraktes. Zeig deshalb zuerst ein Beispiel und erkläre danach
die Regel dahinter.

```markdown title="Erst Theorie – schwer zu folgen"
Die Option --format akzeptiert einen Formatbezeichner aus der Menge
der unterstützten Ausgabeformate, standardmäßig text.
```

```markdown title="Beispiel zuerst – sofort klar"
Gib die Ergebnisse als JSON aus:

    report --format json

Erlaubt sind `text` (Standard), `json` und `csv`.
```

Gute Beispiele sind **lauffähig** und **realistisch**: echte Befehle, echte Ausgaben, Platzhalter wie
`example.com` statt erfundener Fantasiewerte.

## Werkzeuge: Styleguide und Glossar

Damit ein ganzes Team gleich schreibt, gibt es einen [[styleguide|Styleguide]]. Er regelt zum Beispiel:

- Duzen oder Siezen?
- Englische oder deutsche Fachbegriffe?
- Wie werden Buttons, Dateinamen und Befehle hervorgehoben?

Du musst keinen eigenen erfinden. Viele Teams übernehmen einen bekannten, etwa den
[Google Developer Documentation Style Guide](https://developers.google.com/style), und notieren nur ihre
Abweichungen.

> [!PRAXIS]
> Lies deine Doku einmal laut. Überall, wo du stolperst oder Luft holen musst, ist ein Satz zu lang.

## Zusammenfassung

- **Kurze Sätze**: ein Gedanke pro Satz, Schritte als nummerierte Liste.
- **Aktiv**: Sag, wer handelt. In Anleitungen beginnt der Satz mit dem Verb.
- **Einheitliche Begriffe**: dasselbe Ding, dasselbe Wort – festgehalten im Glossar.
- **Beispiele zuerst**, danach die Regel.
- Ein **Styleguide** sorgt dafür, dass ein ganzes Team gleich schreibt.
