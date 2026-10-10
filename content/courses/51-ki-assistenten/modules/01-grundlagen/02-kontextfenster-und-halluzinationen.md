---
title: Kontextfenster und Halluzinationen
summary: Was ein Modell gerade „sieht“, warum es Dinge erfindet und wie du das Risiko vorher einschätzt.
duration: 20
sources:
  - title: Anthropic – Context windows
    url: https://docs.claude.com/en/docs/build-with-claude/context-windows
  - title: Anthropic – Reduce hallucinations
    url: https://docs.claude.com/en/docs/test-and-evaluate/strengthen-guardrails/reduce-hallucinations
  - title: OpenAI – Why language models hallucinate
    url: https://openai.com/index/why-language-models-hallucinate/
quiz:
  - type: single
    question: Was ist das Kontextfenster eines Sprachmodells?
    options:
      - Das Fenster der IDE, in dem der Assistent angezeigt wird
      - Die maximale Menge an Tokens, die das Modell in einem Durchgang berücksichtigen kann
      - Die Liste aller Dateien im Repository
      - Der Zeitraum, aus dem die Trainingsdaten stammen
    answer: 1
    explanation: >
      Das Kontextfenster umfasst Anweisungen, Dateien, Verlauf, deine Frage und die Antwort. Was nicht darin
      steht, kann das Modell nicht berücksichtigen.
  - type: multiple
    question: In welchen Situationen ist das Halluzinationsrisiko besonders hoch?
    options:
      - Frage nach einer seltenen, internen Bibliothek, deren Code nicht im Kontext ist
      - Frage nach genauen Versionsnummern und Konfigurationsschaltern
      - Umbenennen einer Variablen in einer Datei, die vollständig im Kontext steht
      - Frage nach einer Quelle oder einem Link zu einer Aussage
    answers: [0, 1, 3]
    explanation: >
      Wenn die Antwort nicht im Kontext steht und selten in den Trainingsdaten vorkam, füllt das Modell die
      Lücke mit Plausiblem. Eine Umbenennung in sichtbarem Code ist dagegen gut abgesichert.
  - type: find-bug
    question: Ein Assistent hat diesen Node.js-Code vorgeschlagen. Welche Zeile nutzt eine API, die es nicht gibt?
    language: js
    code: |
      import { readFile } from 'node:fs/promises';

      const raw = await readFile('config.json', 'utf8');
      const config = JSON.parse(raw);
      const port = config.port ?? 3000;
      const merged = Object.deepMerge(config, { port });
      console.log(merged);
    bug_line: 6
    explanation: >
      `Object.deepMerge` existiert in JavaScript nicht. Der Name klingt plausibel, weil viele Hilfsbibliotheken
      eine solche Funktion anbieten – eine typische Halluzination.
  - type: cloze
    text: Wenn der Gesprächsverlauf zu lang wird, passt er nicht mehr ins ___. Ältere Teile werden dann abgeschnitten oder ___.
    blanks:
      - [Kontextfenster]
      - [zusammengefasst]
    explanation: Deshalb ist ein frisches Gespräch mit einer klaren Aufgabe oft besser als ein endloser Verlauf.
tasks:
  - id: kontextfenster-beschriften
    type: diagram
    title: Was steckt im Kontextfenster?
    description: Beschrifte die Teile des Kontextfensters eines Coding-Assistenten – von den festen Anweisungen oben bis zu deiner Aufgabe unten.
    image: /assets/ki-assistenten/kontextfenster-leer.svg
    slots:
      - { x: 50, y: 22, answer: Systemanweisung des Werkzeugs }
      - { x: 50, y: 34, answer: Projekt-Anweisungsdatei }
      - { x: 50, y: 46, answer: Dateien und Werkzeug-Ergebnisse }
      - { x: 50, y: 57, answer: Gesprächsverlauf }
      - { x: 50, y: 69, answer: Deine aktuelle Aufgabe }
    distractors: [Trainingsdaten, Wissensstichtag]
    hints:
      - Die Trainingsdaten stecken im Modell selbst, nicht im Kontextfenster.
      - Ganz oben steht, was das Werkzeug immer mitschickt; ganz unten, was du gerade fragst.
  - id: risiko-einschaetzen
    type: dragdrop
    title: Wie hoch ist das Halluzinationsrisiko?
    description: Ordne jede Anfrage dem passenden Risiko zu. Überlege jeweils, ob die Antwort im Kontext steht.
    targets:
      - { id: niedrig, label: Eher niedrig – die Antwort steht im Kontext oder ist allgemein bekannt }
      - { id: hoch, label: Eher hoch – das Modell muss Lücken füllen }
    items:
      - { label: "„Erkläre diese Funktion“ – die Datei ist geöffnet und im Kontext", target: niedrig }
      - { label: "„Benenne die Variable `tmp` in `total` um“ in sichtbarem Code", target: niedrig }
      - { label: "„Was bedeutet diese Fehlermeldung?“ – mit vollständigem Stack-Trace", target: niedrig }
      - { label: "„Welche Konfigurationsoption der Version 4.2 schaltet das Caching ab?“", target: hoch }
      - { label: "„Wie heißt die Methode in unserer internen Abrechnungs-Bibliothek?“ – ohne Code", target: hoch }
      - { label: "„Gib mir drei Links zu Studien, die das belegen.“", target: hoch }
---
Du arbeitest seit einer Stunde mit einem Assistenten am selben Feature. Plötzlich schlägt er eine Lösung
vor, die eine Regel bricht, die ihr ganz am Anfang vereinbart habt. Er hat sie nicht „vergessen“ wie ein
Mensch – sie passte schlicht nicht mehr in sein **Kontextfenster**.

![Das Kontextfenster enthält Systemanweisung, Projektanweisungen, Dateien, Verlauf, Aufgabe und Platz für die Antwort](/assets/ki-assistenten/kontextfenster.svg)

## Das Kontextfenster: das Arbeitsgedächtnis

Ein Sprachmodell hat kein Gedächtnis zwischen zwei Anfragen. Bei **jeder** Anfrage bekommt es den
kompletten Text neu: das [[kontextfenster|Kontextfenster]]. Darin steckt alles, was es gerade
berücksichtigen kann:

| Teil | Woher er kommt |
|---|---|
| [[systemanweisung\|Systemanweisung]] | vom Werkzeug, du siehst sie meist nicht |
| Projekt-Anweisungen | aus einer Datei wie [[agents-md\|AGENTS.md]] in deinem Repository |
| Dateien und Werkzeug-Ergebnisse | geöffnete Dateien, Suchergebnisse, Testausgaben |
| Gesprächsverlauf | alle bisherigen Fragen und Antworten |
| deine Aufgabe | dein aktueller [[ki-prompt\|Prompt]] |

Die Größe wird in [[llm-token|Tokens]] gemessen. Aktuelle Modelle schaffen oft Hunderttausende Tokens –
das klingt nach viel, ist aber schnell voll, wenn ein Agent große Dateien und lange Testausgaben liest.

> [!MERKSATZ]
> Was nicht im Kontextfenster steht, existiert für das Modell nicht – egal wie wichtig es ist.

## Wenn das Fenster voll wird

Wird der Text zu lang, müssen Teile weichen. Werkzeuge lösen das unterschiedlich: Sie schneiden alte
Nachrichten ab oder fassen den Verlauf automatisch zusammen. Bei beidem gehen Details verloren.

Auch **innerhalb** des Fensters wird nicht alles gleich gut beachtet. Bei sehr langen Kontexten werden
Informationen in der Mitte leichter übersehen als Anfang und Ende.

Daraus folgen drei Gewohnheiten:

1. **Ein Thema pro Gespräch.** Für eine neue Aufgabe startest du ein frisches Gespräch.
2. **Wichtige Regeln in eine Datei.** Projekt-Anweisungen werden bei jeder Sitzung neu geladen und
   gehen nicht im Verlauf verloren.
3. **Gezielt statt alles.** Lieber die zwei relevanten Dateien als den ganzen Ordner.

> [!PRAXIS]
> Merkst du, dass ein Assistent sich wiederholt oder frühere Absprachen ignoriert, hilft selten ein
> weiterer Hinweis im selben Gespräch. Fasse den Stand in drei Sätzen zusammen und beginne neu.

## Warum Modelle halluzinieren

Eine [[halluzination|Halluzination]] ist eine überzeugend klingende, aber erfundene Antwort: eine
Methode, die es nicht gibt, ein falscher Konfigurationsschalter, ein ausgedachter Link.

Das ist kein seltener Defekt, sondern folgt direkt aus dem Prinzip der letzten Lektion. Das Modell
erzeugt **plausiblen** Text. Steht die Antwort weder im Kontext noch sicher in den Trainingsdaten,
entsteht trotzdem eine Antwort – eben die plausibelste.

```js title="Plausibel, aber erfunden"
const total = items.sumBy(item => item.price);
// Array-Methode "sumBy" gibt es in JavaScript nicht.
// Viele Hilfsbibliotheken haben sie – also klingt sie wahrscheinlich.
```

Hinzu kommt: Beim Training wird ein Modell eher für eine Antwort belohnt als für ein „Ich weiß es
nicht“. Raten zahlt sich aus – also rät es.

## Wo Halluzinationen typischerweise stecken

| Bereich | Beispiel |
|---|---|
| APIs und Methoden | `Object.deepMerge()`, `$collection->sumBy()` |
| Optionen und Schalter | `git push --force-safe` |
| Paketnamen | ein npm-Paket, das plausibel heißt, aber nicht existiert |
| Versionen | „Seit Version 5 kann man …“ – stimmt für Version 6 |
| Quellen | Links zu Doku-Seiten, die es nie gab |

Gut abgesichert sind dagegen Aufgaben, bei denen alles Nötige im Kontext steht: Code umformen,
erklären, umbenennen, Tests nach einem vorhandenen Muster ergänzen.

> [!FEHLER]
> **„Der Assistent klang so sicher.“** Ein Modell hat keinen eingebauten Zweifel-Ton. Ein erfundener
> Schalter wird genauso selbstbewusst formuliert wie ein echter. Sicherheit im Ton ist kein Hinweis auf
> Richtigkeit.

## Das Risiko senken

Du kannst Halluzinationen nicht abschalten, aber deutlich seltener machen:

- **Echte Quellen in den Kontext geben** – die relevante Datei, die README der Bibliothek, die
  vollständige Fehlermeldung.
- **Unsicherheit erlauben** – „Wenn du es nicht sicher weißt, sag das.“
- **Nachprüfbar fragen** – „Nenne die Datei und Zeile, auf die du dich beziehst.“
- **Ausführen statt glauben** – Tests, Typprüfung und [[linter|Linter]] decken erfundene APIs sofort auf.

## Zusammenfassung

- Das Kontextfenster ist alles, was das Modell bei einer Anfrage sieht – gemessen in Tokens.
- Ist es voll, gehen alte Teile verloren; ein Thema pro Gespräch hält es sauber.
- Halluzinationen entstehen, wenn das Modell Lücken mit plausiblem Text füllt.
- Besonders gefährdet: APIs, Optionen, Paketnamen, Versionen und Quellen.
- Echter Kontext und ausgeführte Tests sind die wirksamsten Gegenmittel.
