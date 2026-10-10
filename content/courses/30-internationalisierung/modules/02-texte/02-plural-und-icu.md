---
title: Pluralformen und ICU MessageFormat
summary: Warum „1 Datei / 2 Dateien“ nicht reicht, wie die CLDR-Pluralkategorien funktionieren und wie du Nachrichten in ICU MessageFormat schreibst.
duration: 25
sources:
  - title: Unicode CLDR – Language Plural Rules
    url: https://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html
  - title: MDN – Intl.PluralRules
    url: https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules
  - title: ICU – Formatting Messages
    url: https://unicode-org.github.io/icu/userguide/format_parse/messages/
  - title: PHP-Handbuch – MessageFormatter
    url: https://www.php.net/manual/de/class.messageformatter.php
  - title: FormatJS – Message Syntax
    url: https://formatjs.github.io/docs/core-concepts/icu-syntax/
quiz:
  - type: single
    question: Welche Pluralkategorie muss in einer ICU-Nachricht mit `plural` immer vorhanden sein?
    options: ["`one`", "`other`", "`zero`", "`many`"]
    answer: 1
    explanation: >
      `other` ist die Pflicht-Kategorie und fängt alles auf, was keine andere Kategorie trifft. Ohne `other`
      ist die Nachricht ungültig.
  - type: multiple
    question: Welche Aussagen über Pluralregeln stimmen?
    options:
      - Deutsch und Englisch kennen die Kategorien `one` und `other`.
      - Polnisch unterscheidet `one`, `few`, `many` und `other`.
      - Japanisch hat nur `other` – Substantive ändern sich dort nicht.
      - Jede Sprache hat genau zwei Pluralformen.
    answers: [0, 1, 2]
    explanation: >
      Die Zahl der Formen schwankt zwischen einer (Japanisch, Chinesisch) und sechs (Arabisch). Die Regeln
      stehen im CLDR, und `Intl.PluralRules` bzw. ICU kennen sie.
  - type: cloze
    text: "In `{count, plural, one {# Datei} other {# Dateien}}` wird das Zeichen ___ durch die formatierte Zahl ersetzt."
    blanks:
      - ["#"]
    explanation: >
      `#` steht innerhalb eines Plural-Zweigs für die Zahl – bereits passend zur Locale formatiert, also z. B.
      „1.234“ in Deutsch.
  - type: match
    question: Ordne jedem Ausdruck sein Ergebnis zu.
    pairs:
      - { left: "new Intl.PluralRules(\"de\").select(1)", right: "\"one\"" }
      - { left: "new Intl.PluralRules(\"pl\").select(3)", right: "\"few\"" }
      - { left: "new Intl.PluralRules(\"pl\").select(5)", right: "\"many\"" }
      - { left: "new Intl.PluralRules(\"en\", { type: \"ordinal\" }).select(2)", right: "\"two\" (2nd)" }
    explanation: >
      `select()` liefert nur die Kategorie, nicht den Text. Mit `type: "ordinal"` bekommst du die Regeln für
      Ordnungszahlen wie 1st, 2nd, 3rd.
tasks:
  - id: polnisch-zuordnen
    type: dragdrop
    title: Polnische Pluralkategorien
    description: >
      Im Polnischen heißt es „1 plik“, „2 pliki“, „5 plików“ (Datei/Dateien). Ordne jede Zahl der
      CLDR-Kategorie zu, die `new Intl.PluralRules("pl").select(zahl)` liefert.
    targets:
      - { id: one, label: "one (1 plik)" }
      - { id: few, label: "few (2 pliki)" }
      - { id: many, label: "many (5 plików)" }
    items:
      - { label: "1", target: one }
      - { label: "2", target: few }
      - { label: "4", target: few }
      - { label: "22", target: few }
      - { label: "0", target: many }
      - { label: "5", target: many }
      - { label: "12", target: many }
      - { label: "25", target: many }
    hints:
      - Endet eine Zahl auf 2, 3 oder 4, ist sie meist `few` – außer 12, 13 und 14.
      - Alle anderen ganzen Zahlen außer 1 sind `many`.
  - id: dateien-zaehlen
    type: code
    language: php
    title: Pluralformen mit MessageFormatter
    description: |
      Der Starter-Code zeigt die typische `$n === 1`-Lösung. Sie funktioniert nur für Englisch. Baue sie auf ICU
      MessageFormat um:

      1. Ergänze in `MUSTER` die Nachricht für `de`: bei 0 „Keine Dateien“, sonst „1 Datei“ bzw. „5 Dateien“.
      2. Ergänze die Nachricht für `pl` mit den Formen `one` → „# plik“, `few` → „# pliki“,
         `many` → „# plików“ und `other` → „# pliku“.
      3. Schreibe `dateienText()` so um, dass es `MessageFormatter::formatMessage()` nutzt. Gibt es für die
         Locale kein Muster, nimm `en`.
    starter: |
      <?php
      declare(strict_types=1);

      const MUSTER = [
          'en' => '{n, plural, =0 {No files} one {# file} other {# files}}',
          'de' => '',
          'pl' => '',
      ];

      function dateienText(string $locale, int $anzahl): string
      {
          return $anzahl === 1 ? "$anzahl file" : "$anzahl files";
      }
    tests:
      - name: Deutsch – keine Dateien
        code: assert_same('Keine Dateien', dateienText('de', 0))
      - name: Deutsch – eine Datei
        code: assert_same('1 Datei', dateienText('de', 1))
      - name: Deutsch – große Zahl mit Tausenderpunkt
        code: assert_same('1.234 Dateien', dateienText('de', 1234))
      - name: Polnisch – few und many
        code: |
          assert_same('2 pliki', dateienText('pl', 2));
          assert_same('5 plików', dateienText('pl', 5));
          assert_same('22 pliki', dateienText('pl', 22));
      - name: unbekannte Locale fällt auf Englisch zurück
        code: |
          assert_same('3 files', dateienText('fr', 3));
          assert_same('No files', dateienText('fr', 0));
    solution: |
      <?php
      declare(strict_types=1);

      const MUSTER = [
          'en' => '{n, plural, =0 {No files} one {# file} other {# files}}',
          'de' => '{n, plural, =0 {Keine Dateien} one {# Datei} other {# Dateien}}',
          'pl' => '{n, plural, one {# plik} few {# pliki} many {# plików} other {# pliku}}',
      ];

      function dateienText(string $locale, int $anzahl): string
      {
          $sprache = isset(MUSTER[$locale]) ? $locale : 'en';
          return MessageFormatter::formatMessage($sprache, MUSTER[$sprache], ['n' => $anzahl]);
      }
    hints:
      - "Das deutsche Muster ist fast wie das englische: `{n, plural, =0 {…} one {# …} other {# …}}`."
      - "`MessageFormatter::formatMessage($locale, $muster, ['n' => $anzahl])` liefert den fertigen Text."
      - "`#` formatiert die Zahl passend zur Locale – deshalb erscheint „1.234“ mit Punkt."
---
Die Benachrichtigung „Du hast 1 neue Nachrichten“ hast du sicher schon gesehen. Die schnelle Reparatur
`n === 1 ? "Nachricht" : "Nachrichten"` hilft im Deutschen. Im Polnischen braucht derselbe Satz aber
drei verschiedene Wortformen, im Arabischen bis zu sechs. Sobald mehr als eine Sprache im Spiel ist, brauchst
du ein System für Pluralformen.

## Warum `n === 1` nicht reicht

So unterschiedlich zählen Sprachen „Datei“:

| Sprache | 0 | 1 | 2 | 5 | 22 |
|---|---|---|---|---|---|
| Deutsch | 0 Dateien | 1 Datei | 2 Dateien | 5 Dateien | 22 Dateien |
| Polnisch | 0 plików | 1 plik | 2 pliki | 5 plików | 22 pliki |
| Japanisch | 0 ファイル | 1 ファイル | 2 ファイル | 5 ファイル | 22 ファイル |

Polnisch hat eine eigene Form für Zahlen, die auf 2–4 enden (außer 12–14). Japanisch verändert das Wort gar
nicht. Mit `if`-Abfragen im Code würdest du die Grammatik aller Sprachen nachbauen – das wäre unwartbar.

> [!FEHLER]
> `count + " " + (count === 1 ? t("file") : t("files"))` ist doppelt falsch: Der Satz ist zerstückelt, und die
> Regel „1 oder nicht 1“ stimmt nur für manche Sprachen.

## Die CLDR-Pluralkategorien

Das [[cldr|CLDR]]-Projekt hat für jede Sprache aufgeschrieben, welche Formen es gibt. Dafür nutzt es sechs
Namen, die [[pluralkategorie|Pluralkategorien]]:

| Kategorie | Bedeutung (grob) | Beispiel-Sprachen |
|---|---|---|
| `zero` | Null | Arabisch, Lettisch |
| `one` | Einzahl | Deutsch, Englisch, Polnisch |
| `two` | Zweizahl | Arabisch, Walisisch |
| `few` | „wenige“ | Polnisch, Tschechisch, Arabisch |
| `many` | „viele“ | Polnisch, Russisch, Arabisch |
| `other` | alles andere – **immer vorhanden** | alle |

Die Namen sind nur Etiketten: `few` bedeutet im Polnischen „endet auf 2–4“. Die Regel kennt
`Intl.PluralRules`:

```js run
const pl = new Intl.PluralRules("pl");
console.log([1, 2, 5, 22].map((n) => pl.select(n))); // [ 'one', 'few', 'many', 'few' ]
console.log(new Intl.PluralRules("de").resolvedOptions().pluralCategories); // [ 'one', 'other' ]
```

## ICU MessageFormat

Statt für jede Kategorie einen eigenen Schlüssel zu bauen, kannst du alle Formen in **eine** Nachricht
schreiben. Das Format dafür heißt [[icu-messageformat|ICU MessageFormat]]:

```text title="Eine Nachricht mit allen Formen"
{count, plural,
  =0 {Keine Dateien}
  one {# Datei}
  other {# Dateien}
}
```

- `count` ist der Name des Arguments, `plural` die Art der Auswahl.
- `=0` trifft genau die Zahl 0 – noch vor den Kategorien.
- `#` wird durch die Zahl ersetzt, schon passend formatiert („1.234“).
- `other` ist Pflicht.

Mit `select` wählst du nach einem Text-Wert aus, etwa nach der Anrede. Beides lässt sich verschachteln:

```text title="select und plural kombiniert"
{gender, select,
  female {Sie hat}
  male {Er hat}
  other {Sie haben}
} {count, plural, one {einen Kommentar} other {# Kommentare}} geschrieben.
```

> [!MERKSATZ]
> Der Code liefert nur die Zahl. Welche Formen eine Sprache braucht, steht in ihrer Übersetzung.

## ICU in PHP und JavaScript

Die [[icu|ICU]]-Bibliothek steckt in der PHP-Erweiterung [[intl]]. Dort heißt die Klasse `MessageFormatter`:

```php title="PHP"
$muster = '{n, plural, one {# plik} few {# pliki} many {# plików} other {# pliku}}';
echo MessageFormatter::formatMessage('pl', $muster, ['n' => 22]); // 22 pliki
```

In JavaScript gibt es kein eingebautes MessageFormat. Die Bibliothek `intl-messageformat` aus
[[formatjs|FormatJS]] übernimmt das (Modul-Übung). [[i18next]] löst Plurale anders: Es hängt die Kategorie an
den Schlüssel an und wählt per `Intl.PluralRules` aus:

```json title="i18next-Stil"
{
  "file_one": "{{count}} Datei",
  "file_other": "{{count}} Dateien"
}
```

## Typische Fallstricke

- **Fehlende Formen:** Wer die polnische Übersetzung liefert, muss `one`, `few`, `many` und `other`
  füllen. Prüfe das automatisch (Lektion 12).
- **Ordnungszahlen:** „1st, 2nd, 3rd“ folgen eigenen Regeln – `new Intl.PluralRules("en", { type: "ordinal" })`.
- **Dezimalzahlen:** `1.5` ist im Polnischen `other`. Teste nicht nur ganze Zahlen.
- **Zahl im Text vergessen:** Ohne `#` oder Platzhalter steht nur „Dateien“ da.

> [!PRAXIS]
> Übersetzungs-Werkzeuge kennen die Pluralregeln jeder Sprache und zeigen Übersetzer:innen automatisch die
> nötigen Felder an. Du lieferst in der Ausgangssprache nur `one` und `other`; die anderen Formen ergänzt das
> Werkzeug pro Zielsprache.

## Zusammenfassung

- Sprachen haben **eine bis sechs** Pluralformen – `n === 1` funktioniert nur für manche.
- Das **CLDR** benennt die Formen mit `zero`, `one`, `two`, `few`, `many` und `other`; `other` gibt es immer.
- `Intl.PluralRules` und ICU kennen die Regeln aller Sprachen.
- **ICU MessageFormat** schreibt alle Formen in eine Nachricht: `{n, plural, one {# Datei} other {# Dateien}}`.
- In PHP formatiert `MessageFormatter` solche Nachrichten, in JavaScript `intl-messageformat`; i18next nutzt Schlüssel-Suffixe wie `_one` und `_other`.
