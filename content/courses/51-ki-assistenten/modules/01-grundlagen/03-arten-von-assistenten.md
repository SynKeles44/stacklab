---
title: Arten von KI-Assistenten
summary: Vervollständigung im Editor, Chat und Coding-Agent – was jede Art kann, was sie darf und wann du welche nimmst.
duration: 20
sources:
  - title: GitHub Docs – Code-Vorschläge in der IDE
    url: https://docs.github.com/en/copilot/concepts/completions/code-suggestions
  - title: Claude Code – Überblick (Beispiel für einen Agenten im Terminal)
    url: https://code.claude.com/docs/en/overview
  - title: AGENTS.md – offenes Format für Anweisungen an Coding-Agenten
    url: https://agents.md/
quiz:
  - type: match
    question: Ordne jeder Assistenten-Art ihre typische Arbeitsweise zu.
    pairs:
      - { left: "Code-Vervollständigung", right: "schlägt beim Tippen die nächsten Zeilen vor" }
      - { left: "Chat-Assistent", right: "beantwortet Fragen und liefert Code zum Kopieren" }
      - { left: "Coding-Agent", right: "liest Dateien, ändert sie und führt Befehle selbst aus" }
    explanation: >
      Die Arten unterscheiden sich vor allem darin, wie viel sie selbstständig tun dürfen – und damit, wie viel
      du hinterher prüfen musst.
  - type: single
    question: Was unterscheidet einen Coding-Agenten grundsätzlich von einem Chat-Assistenten?
    options:
      - Er nutzt ein anderes, viel größeres Sprachmodell.
      - Er kann in einer Schleife Werkzeuge aufrufen – Dateien lesen, ändern, Befehle ausführen – und auf die Ergebnisse reagieren.
      - Er macht keine Fehler, weil er Tests ausführt.
      - Er braucht keine Aufgabenbeschreibung.
    answer: 1
    explanation: >
      Oft steckt dasselbe Modell dahinter. Der Unterschied ist die Agenten-Schleife mit Werkzeugen. Tests können
      Fehler finden – aber nur, wenn es passende Tests gibt.
  - type: multiple
    question: Welche Vorsichtsmaßnahmen sind bei einem Coding-Agenten sinnvoll?
    options:
      - Er arbeitet auf einem eigenen Branch mit sauberem Arbeitsverzeichnis.
      - Befehle mit Nebenwirkungen (z. B. `git push`, Deployments) brauchen deine Bestätigung.
      - Du gibst ihm das Produktionspasswort, damit er Fehler direkt beheben kann.
      - Du prüfst am Ende den kompletten Diff.
    answers: [0, 1, 3]
    explanation: >
      Ein Agent handelt mit deinen Rechten. Produktionszugänge gehören nicht in seine Reichweite; alles andere
      sorgt dafür, dass du jederzeit nachvollziehen und zurückrollen kannst.
  - type: cloze
    text: Ein Agent, der eine Datei liest oder einen Befehl ausführt, macht einen ___. Das Ergebnis landet wieder im ___ des Modells.
    blanks:
      - [Tool-Aufruf, Werkzeugaufruf, Tool-Call]
      - [Kontextfenster, Kontext]
    explanation: Die Ausgabe eines Testlaufs ist für das Modell einfach weiterer Text im Kontext.
tasks:
  - id: werkzeug-waehlen
    type: dragdrop
    title: Welche Art passt zur Aufgabe?
    description: Ordne jede Aufgabe der Assistenten-Art zu, die sich dafür am besten eignet.
    targets:
      - { id: completion, label: Code-Vervollständigung }
      - { id: chat, label: Chat-Assistent }
      - { id: agent, label: Coding-Agent }
    items:
      - { label: "Du tippst einen `switch` und willst die restlichen Fälle nach demselben Muster", target: completion }
      - { label: "Eine Getter-Zeile nach dem Vorbild der Zeile darüber", target: completion }
      - { label: "Du willst verstehen, was ein regulärer Ausdruck bedeutet", target: chat }
      - { label: "Du vergleichst zwei Lösungsansätze, bevor du Code schreibst", target: chat }
      - { label: "Eine umbenannte Funktion in 14 Dateien nachziehen und danach die Tests laufen lassen", target: agent }
      - { label: "Einen fehlschlagenden Test reproduzieren, die Ursache finden und einen Fix vorschlagen", target: agent }
  - id: agenten-schleife
    type: steps
    title: Ein Agent bei der Arbeit
    description: Ein Coding-Agent soll einen fehlschlagenden Test reparieren. Sage jeden Schritt vorher.
    steps:
      - situation: Du schreibst „Der Test `discount.test.js` schlägt fehl, bitte reparieren.“ Der Agent hat noch nichts gelesen.
        question: Was ist ein sinnvoller erster Schritt des Agenten?
        options:
          - Er schreibt sofort eine neue Implementierung.
          - Er führt den Test aus und liest die betroffenen Dateien.
          - Er löscht den Test.
        answer: 1
        explanation: Ein guter Agent sammelt zuerst Informationen – Ausgabe und Code landen im Kontext.
      - situation: Der Agent will `npm test` ausführen. In deinen Einstellungen steht, dass Befehle nur nach Nachfrage laufen dürfen.
        question: Was passiert?
        options:
          - Der Befehl läuft trotzdem sofort.
          - Das Werkzeug fragt dich, ob der Befehl ausgeführt werden darf.
          - Der Agent bricht die Aufgabe ab.
        answer: 1
        explanation: Berechtigungen sitzen zwischen Modell und Werkzeug. Du entscheidest, was ohne Nachfrage laufen darf.
      - situation: Der Agent hat eine Änderung gemacht, der Test ist jetzt grün. Er meldet „Fertig“.
        question: Was machst du?
        options:
          - Sofort committen und pushen – der Test ist ja grün.
          - Den Diff lesen und prüfen, ob der Test wirklich das Richtige prüft und nichts anderes kaputt ist.
          - Das Gespräch schließen, ohne etwas anzusehen.
        answer: 1
        explanation: Ein Agent kann einen Test auch „grün machen“, indem er die Erwartung ändert oder ihn überspringt. Deshalb liest du den Diff.
---
Drei Kolleginnen benutzen „KI“ – und meinen drei völlig verschiedene Dinge. Die eine bekommt beim Tippen
graue Vorschläge im Editor, der zweite stellt Fragen in einem Chatfenster, und die dritte lässt ein
Programm im Terminal selbstständig zwanzig Dateien ändern. Wer die Unterschiede kennt, weiß, wie viel
Vertrauen – und wie viel Prüfung – jede Art braucht.

## Code-Vervollständigung im Editor

Die [[code-vervollstaendigung|Code-Vervollständigung]] sitzt direkt in deiner [[ide|IDE]]. Während du
tippst, erscheint grauer Vorschlagstext; mit `Tab` übernimmst du ihn.

- **Kontext:** die aktuelle Datei, oft auch geöffnete Nachbardateien.
- **Stärke:** schnell und unaufdringlich bei Wiederholungen – Getter, Testfälle nach Muster, Fälle in
  einem `switch`.
- **Schwäche:** kleine Fehler rutschen durch, weil das Übernehmen so leicht ist.

```ts title="Nach zwei Zeilen errät die Vervollständigung die dritte"
const isAdmin = user.role === 'admin';
const isEditor = user.role === 'editor';
const isViewer = user.role === 'viewer'; // Vorschlag
```

> [!FEHLER]
> **Tab, Tab, Tab.** Wer Vorschläge im Takt übernimmt, liest sie nicht mehr. Ein vertauschtes `<` und
> `<=` sieht im Vorbeiflug genauso aus wie richtiger Code.

## Chat-Assistenten

Ein [[chat-assistent|Chat-Assistent]] ist ein Gesprächsfenster – im Browser oder als Seitenleiste in
der IDE. Du fragst, er antwortet, oft mit Code-Blöcken zum Kopieren.

- **Kontext:** was du hineinkopierst, in IDE-Varianten auch markierter Code oder ausgewählte Dateien.
- **Stärke:** Erklären, Ideen vergleichen, Fehlermeldungen deuten, Entwürfe schreiben.
- **Schwäche:** Er sieht nur, was du ihm gibst. Fehlt Kontext, rät er.

Die Verantwortung fürs Übernehmen liegt komplett bei dir: Du kopierst den Code, du fügst ihn ein, du
führst ihn aus.

## Coding-Agenten

Ein [[coding-agent|Coding-Agent]] geht einen Schritt weiter. Er bekommt Werkzeuge: Dateien lesen und
schreiben, im Projekt suchen, Befehle im Terminal ausführen. Solche Agenten gibt es als
Kommandozeilen-Programme, als Modus in der IDE oder als Dienst, der selbstständig einen
[[pull-request|Pull Request]] öffnet.

![Die Agenten-Schleife: Planen, Werkzeug aufrufen, Ergebnis beobachten, bis das Ziel erreicht ist](/assets/ki-assistenten/agenten-schleife.svg)

Das Herzstück ist die [[agenten-schleife|Agenten-Schleife]]:

1. Das Modell plant den nächsten Schritt.
2. Es fordert einen [[tool-aufruf|Tool-Aufruf]] an, z. B. „führe `npm test` aus“.
3. Das Werkzeug führt ihn aus – sofern die [[berechtigungsmodus|Berechtigungen]] es erlauben.
4. Die Ausgabe landet im Kontextfenster, und das Modell entscheidet neu.

> [!MERKSATZ]
> Ein Agent ist kein klügeres Modell, sondern ein Modell **mit Händen**. Er kann mehr erledigen – und
> mehr kaputt machen.

## Was ein Agent besser kann – und was riskanter wird

| | Chat | Agent |
|---|---|---|
| Sieht dein Projekt | nur, was du einfügst | sucht und liest selbst |
| Prüft eigene Vorschläge | nein | kann Tests und Linter ausführen |
| Ändert Dateien | nein | ja, oft viele auf einmal |
| Führt Befehle aus | nein | ja – mit deinen Rechten |
| Prüfaufwand für dich | einzelne Code-Blöcke | ein kompletter [[diff\|Diff]] |

Weil ein Agent mit **deinen** Rechten arbeitet, gelten feste Gewohnheiten:

- Arbeite auf einem eigenen [[branch|Branch]] mit sauberem Arbeitsverzeichnis – dann ist alles mit
  einem Befehl rückgängig zu machen.
- Lass Befehle mit Wirkung nach außen (`git push`, Deployments, Datenbank-Migrationen) nur nach deiner
  Bestätigung laufen.
- Gib dem Agenten nie Zugang zu Produktionssystemen oder echten Kundendaten.

> [!PRAXIS]
> In vielen Teams läuft ein Agent in einem Entwicklungscontainer statt direkt auf dem Laptop. Geht
> etwas schief, ist nur der Container betroffen – nicht deine SSH-Schlüssel und nicht dein Home-Ordner.

## Welches Werkzeug wann?

- **Vervollständigung** für das Tippen im Fluss, wenn du genau weißt, was kommt.
- **Chat** zum Denken: verstehen, vergleichen, planen.
- **Agent** für abgegrenzte Aufgaben über mehrere Dateien, die sich mit Tests überprüfen lassen.

Je mehr Selbstständigkeit, desto wichtiger werden gute Aufgabenbeschreibungen, sauberer Kontext und ein
gründliches Review. Genau darum geht es in den nächsten Modulen.

## Zusammenfassung

- Code-Vervollständigung schlägt beim Tippen vor – schnell, aber leicht ungeprüft übernommen.
- Chat-Assistenten erklären und entwerfen; du überträgst den Code selbst.
- Coding-Agenten rufen in einer Schleife Werkzeuge auf und ändern dein Projekt selbstständig.
- Mehr Selbstständigkeit heißt mehr Prüfaufwand: Branch, Berechtigungen, Diff lesen.
- Wähle das Werkzeug nach Aufgabe – nicht nach Gewohnheit.
