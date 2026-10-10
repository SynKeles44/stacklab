---
title: Wie Sprachmodelle arbeiten
summary: Tokens, Wahrscheinlichkeiten und Temperatur – das Minimum an Theorie, mit dem du KI-Assistenten realistisch einschätzt.
duration: 20
sources:
  - title: OpenAI – What are tokens and how to count them?
    url: https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them
  - title: Anthropic – Glossary (Tokens, Temperature, Context window)
    url: https://docs.claude.com/en/docs/about-claude/glossary
  - title: Google – Introduction to Large Language Models
    url: https://developers.google.com/machine-learning/resources/intro-llms
quiz:
  - type: single
    question: Was berechnet ein Sprachmodell bei jedem Schritt?
    options:
      - Die eine richtige Antwort auf deine Frage
      - Eine Wahrscheinlichkeitsverteilung für das nächste Token
      - Eine Datenbankabfrage über alle Webseiten
      - Den Quellcode aus seinen Trainingsdaten, Zeichen für Zeichen kopiert
    answer: 1
    explanation: >
      Das Modell schätzt für jedes mögliche nächste Token, wie wahrscheinlich es ist. Danach wird eins
      ausgewählt und angehängt. Eine Faktendatenbank fragt es dabei nicht ab.
  - type: multiple
    question: Welche Aussagen über Tokens stimmen?
    options:
      - Ein Token kann ein ganzes Wort, ein Wortteil oder ein Satzzeichen sein.
      - Ein Token ist immer genau ein Buchstabe.
      - Kosten und Limits von Sprachmodellen werden meist in Tokens gemessen.
      - Deutscher Text und Code brauchen oft mehr Tokens als gleich langer englischer Fließtext.
    answers: [0, 2, 3]
    explanation: >
      Tokens sind häufige Zeichenfolgen. Englischer Fließtext ist im Training am häufigsten und wird deshalb
      besonders effizient zerlegt; deutsche Wortzusammensetzungen und Code-Sonderzeichen ergeben mehr Tokens.
  - type: cloze
    text: Die Einstellung ___ steuert, wie zufällig das nächste Token gewählt wird. Ist sie niedrig, wählt das Modell fast immer das ___ Token.
    blanks:
      - [Temperatur, temperature]
      - [wahrscheinlichste, wahrscheinlichstes]
    explanation: >
      Niedrige Temperatur ergibt beständigere, hohe Temperatur abwechslungsreichere Antworten. Richtiger werden
      Antworten dadurch nicht automatisch.
  - type: single
    question: Ein Assistent kennt eine Bibliotheksversion nicht, die vor drei Monaten erschienen ist. Was ist die wahrscheinlichste Ursache?
    options:
      - Der Assistent ist kaputt.
      - Die Version erschien nach dem Wissensstichtag seiner Trainingsdaten.
      - Die Temperatur ist zu hoch eingestellt.
      - Das Kontextfenster ist zu klein.
    answer: 1
    explanation: >
      Was nach dem Stichtag passiert ist, steht nicht in den Trainingsdaten. Hilft nur, wenn du die aktuelle
      Doku in den Kontext gibst oder das Werkzeug selbst nachschlagen kann.
tasks:
  - id: token-ablauf
    type: order
    title: Wie entsteht eine Antwort?
    description: Bringe die Schritte in die Reihenfolge, in der ein Sprachmodell eine Antwort erzeugt.
    items:
      - Dein Text wird vom Tokenizer in Tokens zerlegt.
      - Jedes Token wird in eine Zahl (Token-ID) übersetzt.
      - Das Modell berechnet Wahrscheinlichkeiten für das nächste Token.
      - Abhängig von der Temperatur wird ein Token ausgewählt.
      - Das gewählte Token wird an den Text angehängt.
      - Der Vorgang wiederholt sich, bis ein Stopp-Token oder das Limit erreicht ist.
    hints:
      - Am Anfang steht dein Text, am Ende die Schleife.
  - id: modell-verhalten
    type: steps
    title: Was macht das Modell als Nächstes?
    description: Sage vorher, wie sich ein Sprachmodell in diesen Situationen verhält.
    steps:
      - situation: Du fragst zweimal hintereinander exakt dasselbe, die Temperatur ist mittel eingestellt.
        question: Was passiert?
        options:
          - Die Antworten sind garantiert Wort für Wort gleich.
          - Die Antworten können sich unterscheiden, weil bei der Auswahl Zufall im Spiel ist.
          - Das Modell verweigert die zweite Antwort.
        answer: 1
        explanation: Bei Temperatur über 0 wird aus der Verteilung gezogen. Gleiche Frage, andere Antwort ist normal.
      - situation: Du fragst nach einer Funktion `formatCurrency()` in einer Bibliothek, in der es sie nicht gibt. Viele ähnliche Bibliotheken haben aber genau so eine Funktion.
        question: Was ist ein typisches Ergebnis?
        options:
          - Das Modell sagt immer zuverlässig, dass es die Funktion nicht gibt.
          - Das Modell beschreibt die Funktion überzeugend, weil der Name sehr wahrscheinlich klingt.
          - Das Modell lädt die Bibliothek herunter und prüft nach.
        answer: 1
        explanation: Ein reines Sprachmodell prüft nichts nach. Wahrscheinlich klingende Namen werden gern erfunden – eine Halluzination.
      - situation: Du gibst dem Assistenten den Inhalt der echten `README.md` der Bibliothek in den Chat und fragst dann erneut.
        question: Was ändert sich?
        options:
          - Nichts, das Modell nutzt nur seine Trainingsdaten.
          - Die Antwort stützt sich jetzt stark auf den Text, der im Kontext steht – die Trefferquote steigt.
          - Das Modell wird neu trainiert.
        answer: 1
        explanation: Text im Kontext beeinflusst die Wahrscheinlichkeiten direkt. Deshalb ist guter Kontext dein stärkstes Werkzeug.
---
Du tippst „Schreib mir eine Funktion, die ein Datum formatiert“, und Sekunden später steht dort sauberer
Code. Das wirkt wie Verstehen. Tatsächlich passiert etwas viel Einfacheres – und wer das Prinzip kennt,
sieht auch, **wo** ein [[ki-assistent|KI-Assistent]] Fehler macht.

![Ein Sprachmodell zerlegt Text in Tokens, berechnet Wahrscheinlichkeiten und wählt das nächste Token](/assets/ki-assistenten/token-vorhersage.svg)

## Das Modell sagt das nächste Stück Text voraus

Hinter jedem Assistenten steckt ein [[sprachmodell|Sprachmodell]] (englisch *Large Language Model*, kurz
LLM). Es wurde mit riesigen Mengen Text und Code trainiert und kann genau eine Sache: Es schätzt, wie
ein Text **weitergehen** könnte.

Stell dir die Autovervollständigung deiner Handy-Tastatur vor – nur unvorstellbar viel größer. Sie hat
nicht „verstanden“, was du schreibst. Sie hat gelernt, welche Wörter typischerweise aufeinander folgen.

Dieses Prinzip heißt [[next-token-prediction|Next-Token-Prediction]]:

1. Das Modell bekommt den bisherigen Text.
2. Es berechnet, welches Stück Text als Nächstes passt.
3. Dieses Stück wird angehängt, und alles beginnt von vorn.

Eine ganze Funktion entsteht also Stück für Stück, ohne dass das Modell vorher einen fertigen Plan hat.

> [!MERKSATZ]
> Ein Sprachmodell erzeugt den **wahrscheinlichsten Text**, nicht den **richtigen**. Meistens fällt
> beides zusammen – aber nicht immer.

## Tokens: die Bausteine

Das Modell arbeitet nicht mit Buchstaben oder Wörtern, sondern mit [[llm-token|Tokens]]. Ein
[[tokenizer|Tokenizer]] zerlegt Text in häufige Zeichenfolgen und ordnet jeder eine Nummer zu.

| Text | mögliche Zerlegung | Tokens (ungefähr) |
|---|---|---|
| `function` | `function` | 1 |
| `Rechnungsbetrag` | `Rech` · `nungs` · `betrag` | 3 |
| `$user->id;` | `$` · `user` · `->` · `id` · `;` | 5 |

Die genaue Zerlegung hängt vom Modell ab. Als Faustregel gilt für englischen Text: ein Token entspricht
etwa vier Zeichen. Deutsch und Code brauchen meist mehr.

Warum ist das wichtig für dich?

- **Limits** – wie viel Text ein Modell auf einmal verarbeitet, wird in Tokens gemessen.
- **Kosten** – Bezahlmodelle rechnen pro Token ab, für Eingabe und Ausgabe.
- **Schwächen** – weil das Modell Wortteile sieht, tut es sich mit Buchstaben zählen oder exakter
  Zeichenarbeit schwer.

## Wahrscheinlichkeiten und Temperatur

Für jedes mögliche nächste Token berechnet das Modell eine Wahrscheinlichkeit. Nach `Der Test ist`
könnte `grün` vorne liegen, `fehlgeschlagen` knapp dahinter.

Welches Token tatsächlich gewählt wird, steuert die [[temperatur-llm|Temperatur]]:

| Temperatur | Verhalten | geeignet für |
|---|---|---|
| niedrig (nahe 0) | fast immer das wahrscheinlichste Token | Code, Extraktion, feste Formate |
| mittel | etwas Abwechslung | Erklärungen, Texte |
| hoch | viel Zufall, überraschende Wörter | Ideensammlung |

In vielen Assistenten kannst du die Temperatur gar nicht einstellen – das Werkzeug wählt sie. Wichtig
ist das Prinzip: Dieselbe Frage kann zwei verschiedene Antworten liefern. Das Modell ist nicht
[[deterministisch]].

> [!FEHLER]
> **„Ich habe es zweimal gefragt, beide Male kam dasselbe – also stimmt es.“** Eine stabile Antwort zeigt
> nur, dass sie sehr wahrscheinlich ist. Ein verbreiteter Irrtum aus den Trainingsdaten ist ebenfalls
> sehr wahrscheinlich.

## Trainingsdaten und Wissensstichtag

Was ein Modell „weiß“, stammt aus seinen [[trainingsdaten|Trainingsdaten]]. Die werden an einem
bestimmten Datum eingefroren – dem [[wissensstichtag|Wissensstichtag]].

Daraus folgen drei typische Probleme:

- **Neue Versionen fehlen.** Eine Bibliothek, die nach dem Stichtag erschienen ist, kennt das Modell nicht.
- **Alte Muster überwiegen.** Gab es eine API zehn Jahre lang in der alten Form, schlägt das Modell gern
  die alte Form vor – auch wenn sie inzwischen veraltet ist.
- **Seltenes ist unsicher.** Über interne Bibliotheken deines Teams weiß das Modell gar nichts.

Moderne Werkzeuge mildern das: Sie lesen Dateien aus deinem Projekt oder schlagen in der Dokumentation
nach. Das Wissen kommt dann aus dem **Kontext**, nicht aus dem Training – mehr dazu in der nächsten Lektion.

> [!PRAXIS]
> Nennt dir ein Assistent eine Funktion oder einen Kommandozeilen-Schalter, den du nicht kennst, öffne
> die offizielle Dokumentation der **Version, die dein Projekt nutzt**. Das dauert eine Minute und
> erspart dir eine Stunde Fehlersuche.

## Zusammenfassung

- Ein Sprachmodell sagt Token für Token voraus, wie ein Text weitergeht.
- Tokens sind häufige Zeichenfolgen; Limits und Kosten werden in Tokens gemessen.
- Die Temperatur steuert den Zufall bei der Auswahl – gleiche Frage, andere Antwort ist normal.
- Wahrscheinlich ist nicht dasselbe wie richtig.
- Das Wissen aus den Trainingsdaten endet am Wissensstichtag; aktuelles Wissen muss in den Kontext.
