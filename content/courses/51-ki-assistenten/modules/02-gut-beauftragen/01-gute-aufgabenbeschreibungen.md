---
title: Gute Aufgabenbeschreibungen
summary: Ziel, Kontext, Einschränkungen und Akzeptanzkriterien – so beschreibst du eine Aufgabe, dass der erste Vorschlag schon passt.
duration: 20
sources:
  - title: Anthropic – Prompt engineering overview
    url: https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview
  - title: OpenAI – Prompt engineering
    url: https://platform.openai.com/docs/guides/prompt-engineering
  - title: GitHub Docs – Prompt engineering for GitHub Copilot Chat
    url: https://docs.github.com/en/copilot/concepts/prompting/prompt-engineering
quiz:
  - type: single
    question: Welche Aufgabenbeschreibung führt am wahrscheinlichsten zu brauchbarem Code?
    options:
      - "„Mach die Suche besser.“"
      - "„Die Produktsuche in `src/search.js` findet „Kaffee“ nicht, wenn man „kaffee“ tippt. Mach sie unabhängig von Groß- und Kleinschreibung, ändere die Funktionssignatur nicht und ergänze einen Test in `test/search.test.js`.“"
      - "„Schreib eine Suche wie bei großen Onlineshops.“"
      - "„Fix den Bug.“"
    answer: 1
    explanation: >
      Die zweite Beschreibung nennt Ort, beobachtetes Problem, gewünschtes Verhalten, eine Einschränkung und
      ein prüfbares Ergebnis. Die anderen lassen das Modell raten.
  - type: match
    question: Ordne jedem Satz den Baustein einer Aufgabenbeschreibung zu.
    pairs:
      - { left: "„Neue Nutzer sollen ihr Passwort zurücksetzen können.“", right: "Ziel" }
      - { left: "„Wir nutzen Laravel 13, Mails laufen über die Klasse `MailService`.“", right: "Kontext" }
      - { left: "„Füge keine neuen Abhängigkeiten hinzu.“", right: "Einschränkung" }
      - { left: "„Ein abgelaufener Link zeigt eine Fehlermeldung, ein Test deckt das ab.“", right: "Akzeptanzkriterium" }
    explanation: >
      Ziel, Kontext, Einschränkungen und Akzeptanzkriterien sind das Grundgerüst. Zusammen beantworten sie: Was,
      wo, wie nicht – und woran erkenne ich, dass es fertig ist?
  - type: multiple
    question: Warum helfen Beispiele (Eingabe → erwartete Ausgabe) in einer Aufgabenbeschreibung?
    options:
      - Sie machen Randfälle eindeutig, die man in Worten leicht vergisst.
      - Sie lassen sich direkt in Tests übersetzen.
      - Sie garantieren, dass der Code fehlerfrei ist.
      - Sie zeigen das gewünschte Format genauer als jede Beschreibung.
    answers: [0, 1, 3]
    explanation: Beispiele sind präzise und prüfbar. Eine Garantie sind sie nicht – Code kann Beispiele erfüllen und trotzdem andere Fälle falsch behandeln.
  - type: cloze
    text: Prüfbare Bedingungen, wann eine Aufgabe erledigt ist, heißen ___. Am besten werden sie direkt zu ___.
    blanks:
      - [Akzeptanzkriterien]
      - [Tests, Testfällen, automatisierten Tests]
    explanation: Was als Test formuliert ist, kann weder der Assistent noch du später „vergessen“.
tasks:
  - id: bausteine-sortieren
    type: dragdrop
    title: Zerlege eine gute Aufgabenbeschreibung
    description: |
      Diese Sätze stammen aus einer Aufgabe für einen Coding-Agenten. Ordne jeden Satz seinem Baustein zu.
    targets:
      - { id: ziel, label: Ziel }
      - { id: kontext, label: Kontext }
      - { id: grenzen, label: Einschränkungen }
      - { id: kriterien, label: Akzeptanzkriterien }
    items:
      - { label: "Rechnungen sollen als CSV exportiert werden können.", target: ziel }
      - { label: "Die Rechnungsdaten liefert `InvoiceRepository::forMonth()`.", target: kontext }
      - { label: "Ein bestehender Export für Kunden liegt in `src/Export/CustomerCsv.php` – nutze ihn als Vorbild.", target: kontext }
      - { label: "Keine neuen Composer-Pakete.", target: grenzen }
      - { label: "Ändere keine bestehenden Tests.", target: grenzen }
      - { label: "Beträge stehen mit Komma als Dezimaltrennzeichen in der Datei, z. B. `19,99`.", target: kriterien }
      - { label: "`composer test` ist grün, und ein neuer Test prüft einen Export mit zwei Rechnungen.", target: kriterien }
  - id: slugify-nachbessern
    type: code
    language: js
    title: Die vergessenen Anforderungen nachliefern
    description: |
      Jemand hat einen Assistenten nur gebeten: „Schreib eine slugify-Funktion.“ Herausgekommen ist der Code
      im Editor. Er erfüllt die eigentlichen Anforderungen nicht – weil sie nie genannt wurden.

      Ergänze die Funktion so, dass sie diese **Akzeptanzkriterien** erfüllt:

      1. Alles wird kleingeschrieben.
      2. Umlaute werden ersetzt: `ä → ae`, `ö → oe`, `ü → ue`, `ß → ss`.
      3. Jede Folge von Zeichen, die keine Kleinbuchstaben `a–z` oder Ziffern sind, wird zu **einem** `-`.
      4. Am Anfang und Ende steht kein `-`.
      5. Ein leerer Text ergibt einen leeren Text.

      Beispiel: `"  Größe & Gewicht: 2 kg!  "` → `"groesse-gewicht-2-kg"`
    starter: |
      function slugify(title) {
        return title.toLowerCase().replace(/ /g, '-');
      }
    tests:
      - name: einfacher Titel
        code: assertEqual(slugify('Hallo Welt'), 'hallo-welt')
      - name: Umlaute und ß werden ersetzt
        code: assertEqual(slugify('Über Größe'), 'ueber-groesse')
      - name: Sonderzeichen und mehrere Leerzeichen werden zu einem Bindestrich
        code: "assertEqual(slugify('  Größe & Gewicht: 2 kg!  '), 'groesse-gewicht-2-kg')"
      - name: leerer Text bleibt leer
        code: assertEqual(slugify(''), '')
      - name: nur Sonderzeichen ergeben einen leeren Text
        code: assertEqual(slugify('!!! ???'), '')
    hints:
      - "Ersetze die Umlaute zuerst, z. B. mit `replace(/[äöüß]/g, (c) => map[c])` und einem kleinen Objekt `map`."
      - "Danach ersetzt `replace(/[^a-z0-9]+/g, '-')` jede Folge unerwünschter Zeichen durch einen Bindestrich."
      - "Zum Schluss entfernt `replace(/^-+|-+$/g, '')` Bindestriche am Rand."
    solution: |
      function slugify(title) {
        const map = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' };
        return title
          .toLowerCase()
          .replace(/[äöüß]/g, (c) => map[c])
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }
---
„Schreib mir eine Funktion für die Suche.“ Der Assistent liefert prompt – eine Suche, die eine
Bibliothek verwendet, die ihr nicht nutzt, ein Datenformat erwartet, das es bei euch nicht gibt, und
deine Tests ignoriert. Er hat nicht schlecht gearbeitet. Er hatte nur keine Ahnung, was du eigentlich
wolltest.

## Das Modell füllt jede Lücke

Aus der ersten Lektion weißt du: Das Modell erzeugt den **wahrscheinlichsten** Text. Lässt deine
Aufgabe etwas offen, nimmt es den häufigsten Fall aus den Trainingsdaten – nicht den Fall aus deinem
Projekt.

Eine Aufgabenbeschreibung – oft einfach [[ki-prompt|Prompt]] genannt – ist deshalb wie ein Auftrag an
eine neue Kollegin, die zwar fachlich stark ist, aber zum ersten Mal in eurem Projekt sitzt. Sie kennt
weder eure Ordner noch eure Regeln, und sie fragt nicht immer nach.

| Unklar | Was das Modell dann wählt |
|---|---|
| welche Sprache, welches Framework | das häufigste |
| welcher Stil | den Durchschnitt des Internets |
| welche Randfälle | meist nur den Normalfall |
| wann es fertig ist | sobald der Code „plausibel aussieht“ |

> [!MERKSATZ]
> Alles, was du nicht sagst, entscheidet das Modell – nach Wahrscheinlichkeit, nicht nach deinem Projekt.

## Vier Bausteine

Eine gute Aufgabenbeschreibung beantwortet vier Fragen:

1. **Ziel** – Was soll am Ende anders sein? Beschreibe das Verhalten, nicht nur „bau X“.
2. **Kontext** – Wo im Code geht es los? Welche Dateien, Klassen, Versionen sind wichtig?
3. **Einschränkungen** – Was darf **nicht** passieren? Keine neuen Pakete, Signatur bleibt gleich,
   keine Datenbank-Änderung.
4. **[[akzeptanzkriterien|Akzeptanzkriterien]]** – Woran erkennst du, dass es fertig ist? Am besten
   als Test oder Befehl, der grün werden muss.

```text title="Vorher"
Mach die Suche besser.
```

```text title="Nachher"
Ziel: Die Produktsuche soll Groß- und Kleinschreibung ignorieren.
Kontext: Die Suche steckt in src/search.js (Funktion searchProducts),
Tests liegen in test/search.test.js und laufen mit `npm test`.
Einschränkungen: Signatur von searchProducts bleibt gleich,
keine neuen Abhängigkeiten.
Fertig, wenn: Ein neuer Test zeigt, dass "kaffee" das Produkt
"Kaffee" findet, und `npm test` grün ist.
```

## Beispiele schlagen Beschreibungen

Wörter sind mehrdeutig. „Formatiere den Betrag schön“ kann vieles heißen. Ein Beispiel nicht:

```text title="Beispiele machen das Format eindeutig"
formatPrice(1999)  -> "19,99 €"
formatPrice(5)     -> "0,05 €"
formatPrice(0)     -> "0,00 €"
```

Mehrere Beispiele mit Ein- und Ausgabe nennt man [[few-shot-prompting|Few-Shot-Prompting]]. Sie
helfen besonders bei:

- **Randfällen** – leere Liste, `0`, sehr lange Texte, Sonderzeichen.
- **Formaten** – Datumsformat, JSON-Struktur, Commit-Message-Stil.
- **Stil** – „so wie diese bestehende Funktion“ mit Verweis auf eine Datei.

Ein großer Vorteil: Jedes Beispiel ist schon fast ein Test. Du kannst es direkt in deine
[[test-suite|Testsuite]] übernehmen – und dann prüft nicht dein Gefühl, sondern der Computer.

> [!PRAXIS]
> Erfahrene Entwicklerinnen schreiben oft **zuerst** einen fehlschlagenden Test und geben ihn dem
> Assistenten mit: „Mach diesen Test grün, ohne ihn zu ändern.“ Das ist die präziseste
> Aufgabenbeschreibung, die es gibt.

## Typische Fehler beim Beauftragen

> [!FEHLER]
> **Die Lösung vorgeben statt das Problem.** „Füge ein `try/catch` in Zeile 40 ein“ verhindert, dass der
> Assistent die eigentliche Ursache findet. Beschreibe, was passiert und was passieren soll – und frage
> nach der Ursache.

Weitere Klassiker:

- **Zu viel auf einmal.** „Bau den kompletten Checkout“ ergibt einen riesigen Diff, den niemand prüfen
  kann. Teile auf (dazu mehr in Lektion 3 dieses Moduls).
- **Fehlermeldung zusammengefasst.** „Es kommt ein Fehler“ statt der vollständigen Meldung samt
  [[stack-trace|Stack-Trace]].
- **Höflichkeitsfloskeln statt Fakten.** Freundlich sein schadet nicht, aber es ersetzt keine
  Information.
- **Rückfragen verbieten.** Schreibe ausdrücklich: „Wenn etwas unklar ist, frag nach, bevor du Code
  schreibst.“

## Zusammenfassung

- Das Modell füllt jede Lücke mit dem häufigsten Fall – nicht mit deinem.
- Gute Aufgaben haben Ziel, Kontext, Einschränkungen und Akzeptanzkriterien.
- Beispiele mit Ein- und Ausgabe machen Randfälle und Formate eindeutig.
- Akzeptanzkriterien werden am besten zu Tests, die grün werden müssen.
- Beschreibe das Problem, nicht deine Wunschlösung – und erlaube Rückfragen.
