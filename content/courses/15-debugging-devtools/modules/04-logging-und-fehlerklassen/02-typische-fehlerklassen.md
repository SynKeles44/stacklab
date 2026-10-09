---
title: Die vier häufigsten Fehlerklassen
summary: Off-by-one, null und undefined, Race Conditions bei asynchronem Code und Type Juggling – wie du sie erkennst, bevor du lange suchst.
duration: 25
sources:
  - title: MDN – Using promises
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises
  - title: MDN – Equality comparisons and sameness
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Equality_comparisons_and_sameness
  - title: PHP-Handbuch – Typ-Jonglage
    url: https://www.php.net/manual/de/language.types.type-juggling.php
  - title: PHP-Handbuch – Vergleichsoperatoren
    url: https://www.php.net/manual/de/language.operators.comparison.php
quiz:
  - type: find-bug
    question: Die Funktion soll die letzten drei Einträge eines Arrays liefern, gibt aber nur zwei zurück. In welcher Zeile steckt der Fehler?
    language: js
    code: |
      function letzteDrei(liste) {
        const ergebnis = [];
        for (let i = liste.length - 3; i < liste.length - 1; i++) {
          ergebnis.push(liste[i]);
        }
        return ergebnis;
      }
    bug_line: 3
    explanation: >
      Die Bedingung `i < liste.length - 1` hört einen Durchlauf zu früh auf – ein klassischer Off-by-one-Fehler.
      Richtig ist `i < liste.length`.
  - type: single
    question: "Was gibt dieser Code aus? `let n = 0; [1, 2, 3].forEach(async (x) => { await warte(10); n += x; }); console.log(n);`"
    options:
      - "6"
      - "0"
      - "3"
      - Einen Fehler
    answer: 1
    explanation: >
      `forEach` wartet nicht auf async-Funktionen. `console.log` läuft, bevor auch nur eine Addition passiert ist.
      Mit `for…of` und `await` oder `Promise.all` wartest du richtig.
  - type: match
    question: "Was ergeben diese Vergleiche in PHP 8?"
    pairs:
      - { left: "'1' == '01'", right: "true – beide Strings sehen wie Zahlen aus und werden numerisch verglichen" }
      - { left: "'1' === '01'", right: "false – strikter Vergleich, die Strings sind verschieden" }
      - { left: "0 == 'abc'", right: "false – seit PHP 8 wird hier als String verglichen" }
      - { left: "null == false", right: "true – beide gelten als „leer“" }
    explanation: >
      `==` wandelt Typen vor dem Vergleich um (Type Juggling). Mit `===` vergleichst du Typ und Wert und vermeidest
      solche Überraschungen.
  - type: cloze
    text: "In JavaScript ergibt `'5' + 1` den Wert ___, `'5' - 1` dagegen ___."
    blanks:
      - ["'51'", "\"51\"", "51"]
      - ["4"]
    explanation: >
      `+` mit einem String verkettet Text. `-` gibt es nur für Zahlen, also wandelt JavaScript den String in eine
      Zahl um.
  - type: multiple
    question: Welche Maßnahmen schützen vor null/undefined-Fehlern?
    options:
      - Optional Chaining wie `kunde?.adresse?.ort`
      - Ein Standardwert mit `??`, z. B. `menge ?? 1`
      - Rückgabewerte von `find()` vor der Verwendung prüfen
      - Mehr `console.log`-Ausgaben in Produktion
    answers: [0, 1, 2]
    explanation: >
      Wer mit „nichts“ rechnet, prüft oder ersetzt es. Ausgaben helfen beim Finden, verhindern den Fehler aber nicht.
tasks:
  - id: zwei-klassiker
    type: code
    language: js
    title: Off-by-one und undefined beheben
    description: |
      Zwei kleine Funktionen aus einer Kundenverwaltung, zwei klassische Fehler:

      - `seite(liste, nummer, groesse)` soll die Einträge einer Seite liefern. Seite **1** sind die ersten
        `groesse` Einträge, Seite 2 die nächsten. Im Moment fehlt auf jeder Seite der erste Eintrag – und die
        Seite enthält einen Eintrag der nächsten Seite.
      - `ort(kunden, id)` soll den Ort des Kunden mit dieser ID liefern. Gibt es den Kunden nicht oder hat er
        keine Adresse, soll `'unbekannt'` zurückkommen. Im Moment stürzt die Funktion dann mit einem
        `TypeError` ab.
    starter: |
      function seite(liste, nummer, groesse) {
        const start = nummer * groesse - groesse + 1;
        return liste.slice(start, start + groesse);
      }

      function ort(kunden, id) {
        const kunde = kunden.find((k) => k.id === id);
        return kunde.adresse.ort;
      }
    tests:
      - name: Seite 1 enthält die ersten Einträge
        code: assertDeepEqual(seite(['a', 'b', 'c', 'd', 'e'], 1, 2), ['a', 'b'])
      - name: Seite 3 enthält den Rest
        code: assertDeepEqual(seite(['a', 'b', 'c', 'd', 'e'], 3, 2), ['e'])
      - name: Seite einer leeren Liste ist leer
        code: assertDeepEqual(seite([], 1, 10), [])
      - name: ort findet einen vorhandenen Kunden
        code: "assertEqual(ort([{ id: 1, adresse: { ort: 'Kassel' } }], 1), 'Kassel')"
      - name: ort bei unbekannter ID
        code: "assertEqual(ort([{ id: 1, adresse: { ort: 'Kassel' } }], 2), 'unbekannt')"
      - name: ort bei Kunde ohne Adresse
        code: "assertEqual(ort([{ id: 3 }], 3), 'unbekannt')"
    hints:
      - "Rechne `start` für Seite 1 mit Größe 2 im Kopf aus. Welcher Index sollte herauskommen?"
      - "Arrays beginnen bei Index 0: `const start = (nummer - 1) * groesse;`"
      - "Für `ort`: `return kunde?.adresse?.ort ?? 'unbekannt';`"
    solution: |
      function seite(liste, nummer, groesse) {
        const start = (nummer - 1) * groesse;
        return liste.slice(start, start + groesse);
      }

      function ort(kunden, id) {
        const kunde = kunden.find((k) => k.id === id);
        return kunde?.adresse?.ort ?? 'unbekannt';
      }
  - id: race-condition-durchspielen
    type: steps
    title: Eine Race Condition entlarven
    description: >
      Ein Suchfeld schickt bei jeder Eingabe eine Anfrage an die API und zeigt die Antwort an. Manchmal zeigt
      die Liste Ergebnisse für einen älteren Suchbegriff. Spiel durch, was passiert.
    steps:
      - situation: Du tippst schnell `ka`, dann `kat`. Zwei Anfragen gehen los – erst für `ka`, dann für `kat`.
        question: Kommen die Antworten garantiert in derselben Reihenfolge zurück?
        options:
          - Ja, das Netzwerk hält immer die Reihenfolge ein.
          - Nein, jede Anfrage braucht unterschiedlich lange – die Antwort für `ka` kann auch später ankommen.
        answer: 1
        explanation: Asynchrone Vorgänge laufen unabhängig voneinander. Wer zuerst fertig ist, hängt von Server und Netzwerk ab.
      - situation: Im Network-Tab siehst du, dass die Antwort für `kat` nach 120 ms kam und die für `ka` nach 480 ms. Der Code schreibt jede Antwort sofort in die Liste.
        question: Was steht am Ende in der Liste?
        options:
          - Die Ergebnisse für `kat`.
          - Die Ergebnisse für `ka`, weil diese Antwort zuletzt ankam und die richtige überschrieben hat.
        answer: 1
        explanation: Das ist eine Race Condition – das Ergebnis hängt davon ab, welcher Vorgang das „Rennen“ gewinnt.
      - situation: Du willst den Fehler zuverlässig reproduzieren.
        question: Welches Werkzeug hilft dir?
        options:
          - Throttling im Network-Tab, damit Antworten langsamer und unregelmäßiger kommen.
          - Den Bildschirm heller stellen.
          - Den Browser neu installieren.
        answer: 0
        explanation: Race Conditions treten oft nur unter bestimmten Zeitverhältnissen auf. Langsame Verbindungen machen sie sichtbar.
      - situation: Du suchst eine Lösung.
        question: Welche passt?
        options:
          - Jede Antwort nur anzeigen, wenn sie noch zum **aktuellen** Suchbegriff gehört – oder die alte Anfrage mit einem AbortController abbrechen.
          - Ein `setTimeout` von 1 Sekunde vor dem Anzeigen einbauen.
        answer: 0
        explanation: Ein Timeout versteckt das Problem nur. Robust ist es, veraltete Antworten zu verwerfen oder abzubrechen.
---
Wenn du eine Weile debuggst, merkst du: Viele Fehler sehen sich ähnlich. Statt jedes Mal bei null anzufangen,
lohnt es sich, die häufigsten **Fehlerklassen** zu kennen. Dann denkst du bei „letzter Eintrag fehlt“ sofort an
Off-by-one und bei „manchmal falsch“ an eine Race Condition. In dieser Lektion lernst du die vier Klassiker.

## Off-by-one: einer zu viel, einer zu wenig

Ein [[off-by-one-fehler|Off-by-one-Fehler]] passiert, wenn eine Schleife oder ein Index um genau eins
danebenliegt. Ursache sind fast immer **Grenzen**: Fängt die Zählung bei 0 oder 1 an? Ist das Ende eingeschlossen?

```js title="Typische Varianten"
for (let i = 0; i <= liste.length; i++)   // ein Durchlauf zu viel → liste[i] ist undefined
for (let i = 1; i < liste.length; i++)    // erstes Element fehlt
liste.slice(1, 3)                          // liefert Index 1 und 2 – das Ende ist ausgeschlossen
if (betrag > 50)                           // genau 50 wird falsch behandelt
```

| Symptom | Verdacht |
|---|---|
| erstes oder letztes Element fehlt | Startwert oder Abbruchbedingung |
| `undefined` am Ende einer Liste | `<=` statt `<` |
| Fehler genau an einem Grenzwert | `>` statt `>=` |

> [!MERKSATZ]
> Teste jede Schleife und jede Grenze gedanklich mit einem [[randfall|Randfall]]: leere Liste, ein Element,
> genau der Grenzwert. Off-by-one-Fehler fallen dort sofort auf.

## null und undefined: mit „nichts“ rechnen

Der vielleicht häufigste Laufzeitfehler überhaupt: Ein Wert ist [[null]] oder [[undefined]], und der Code greift
trotzdem darauf zu. In JavaScript endet das mit `TypeError: Cannot read properties of undefined`, in PHP mit
`Attempt to read property on null` oder einer Warnung `Undefined array key`.

Typische Quellen für „nichts“:

- `find()` findet nichts und liefert `undefined`.
- Eine API lässt ein Feld weg oder schickt `null`.
- Ein optionaler Parameter wird nicht übergeben.

```js title="Absichern"
const ort = kunde?.adresse?.ort ?? 'unbekannt';   // Optional Chaining plus Standardwert
```

```php title="Absichern in PHP"
$ort = $kunde?->adresse?->ort ?? 'unbekannt';      // Nullsafe-Operator
$menge = $daten['menge'] ?? 1;                      // fehlender Schlüssel → Standardwert
```

> [!FEHLER]
> **Den Fehler „wegsichern“, ohne die Ursache zu verstehen.** `?.` überall einzubauen, macht den Absturz weg –
> aber vielleicht fehlt die Adresse, weil beim Speichern etwas schiefging. Frag erst: Darf der Wert hier
> überhaupt fehlen? Wenn nein, liegt der eigentliche Bug woanders.

## Race Conditions: wenn die Reihenfolge zufällig ist

Asynchroner Code läuft nicht in der Reihenfolge, in der er dasteht. Eine [[race-condition|Race Condition]]
entsteht, wenn das Ergebnis davon abhängt, welcher von mehreren Vorgängen zuerst fertig wird. Typisch: Eine
[[promise|Promise]] wird nicht abgewartet.

```js title="Der Klassiker: forEach mit async"
let gesamt = 0;
dateien.forEach(async (datei) => {
  gesamt += await zaehleZeilen(datei);   // läuft später …
});
console.log(gesamt);                      // … diese Zeile sofort: 0
```

`forEach` wartet nicht auf [[async-await|async-Funktionen]]. Besser:

```js title="Richtig abwarten"
for (const datei of dateien) {
  gesamt += await zaehleZeilen(datei);                    // nacheinander
}
const anzahlen = await Promise.all(dateien.map(zaehleZeilen));  // parallel
```

Race Conditions sind tückisch, weil sie oft nur **manchmal** auftreten. Fehlt ein `await` oder tritt ein Fehler
nur bei langsamen Verbindungen auf, ist das ein starker Hinweis.

## Type Juggling: wenn Typen still umgewandelt werden

JavaScript und PHP wandeln Typen automatisch um, wenn es „passt“. Dieses [[type-juggling|Type Juggling]] spart
Tipparbeit und erzeugt Bugs, die keine Fehlermeldung haben:

| Ausdruck | JavaScript | PHP 8 |
|---|---|---|
| `'5' + 1` | `'51'` (Text) | `6` (PHP addiert mit `+`, verkettet mit `.`) |
| `'10' < '9'` | `true` (Zeichenvergleich) | `false` (beide numerisch → Zahlen) |
| `'1' == '01'` | `false` | `true` |
| `0 == ''` | `true` | `false` |

Werte aus Formularen, URLs, CSV-Dateien und Umgebungsvariablen sind **immer Strings**. Wandle sie an der
Grenze ausdrücklich um – mit `Number()` in JavaScript, `(int)` oder `(float)` in PHP – und vergleiche mit
[[strikte-gleichheit|strikter Gleichheit]] `===`.

> [!PRAXIS]
> In PHP-Projekten hilft `declare(strict_types=1);` am Dateianfang zusammen mit Typangaben bei Parametern: Dann
> wirft PHP einen `TypeError`, statt einen String still in eine Zahl umzuwandeln. Werkzeuge wie PHPStan und
> TypeScript finden viele dieser Fehler, bevor der Code überhaupt läuft.

## Zusammenfassung

- **Off-by-one:** Grenzen prüfen – Start bei 0 oder 1, `<` oder `<=`, `>` oder `>=`; immer mit Randfällen testen.
- **null/undefined:** Quellen wie `find()`, fehlende Felder und Parameter kennen; mit `?.`, `?->` und `??` absichern – aber erst die Ursache verstehen.
- **Race Conditions:** Jede Promise abwarten; `forEach` mit `async` ist ein Warnsignal; „manchmal falsch“ deutet auf Timing hin.
- **Type Juggling:** Eingaben sind Strings; an der Grenze umwandeln und mit `===` vergleichen.
- Wer die Klassen kennt, springt schneller zur richtigen Hypothese im Debugging-Kreislauf.
