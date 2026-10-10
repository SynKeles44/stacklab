---
title: Locales und BCP-47-Sprach-Tags
summary: Wie Sprach-Tags wie de-CH oder sr-Latn-RS aufgebaut sind, wie du sie in JavaScript und PHP liest und wie du die passende Sprache aushandelst.
duration: 20
sources:
  - title: MDN – Intl.Locale
    url: https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale
  - title: W3C – Language tags in HTML and XML
    url: https://www.w3.org/International/articles/language-tags/
  - title: RFC 4647 – Matching of Language Tags
    url: https://www.rfc-editor.org/rfc/rfc4647
  - title: PHP-Handbuch – Locale
    url: https://www.php.net/manual/de/class.locale.php
quiz:
  - type: single
    question: Was bedeutet der Tag `fr-CA`?
    options:
      - Französisch, wie es in Kanada gesprochen wird
      - Kanadisch, wie es in Frankreich gesprochen wird
      - Französisch mit kyrillischer Schrift
      - Die Währung Kanadischer Dollar in Frankreich
    answer: 0
    explanation: >
      Zuerst kommt die Sprache (ISO 639, klein geschrieben), dann optional die Region (ISO 3166, groß
      geschrieben). `fr-CA` ist kanadisches Französisch.
  - type: multiple
    question: Welche Aussagen über BCP-47-Tags stimmen?
    options:
      - Nur der Sprach-Teil ist Pflicht.
      - Die Schrift steht als vierbuchstabiger Code zwischen Sprache und Region, z. B. `Latn`.
      - Groß- und Kleinschreibung ändert die Bedeutung – `de-ch` ist eine andere Locale als `de-CH`.
      - PHP und ICU schreiben Locales oft mit Unterstrich (`de_CH`), Browser mit Bindestrich (`de-CH`).
    answers: [0, 1, 3]
    explanation: >
      Tags sind unabhängig von der Schreibweise gleich; Konvention ist Sprache klein, Schrift mit großem
      Anfangsbuchstaben, Region groß. Der Unterstrich ist eine ICU/POSIX-Schreibweise, die PHP ebenfalls akzeptiert.
  - type: cloze
    text: "`new Intl.Locale(\"sr-Latn-RS\").script` liefert ___ und `.region` liefert ___."
    blanks:
      - [Latn, "\"Latn\""]
      - [RS, "\"RS\""]
    explanation: >
      `Intl.Locale` zerlegt einen Tag in seine Teile: language `sr`, script `Latn`, region `RS`.
  - type: single
    question: "Der Browser schickt `Accept-Language: de-CH, de;q=0.9, en;q=0.8`. Deine App kann nur `en` und `de`. Welche Sprache ist richtig?"
    options:
      - en, weil `de-CH` nicht unterstützt wird
      - de, weil `de-CH` auf `de` zurückfällt und die höchste Priorität hat
      - Gar keine – der Server antwortet mit einem Fehler
      - de-CH, die App soll einfach so tun
    answer: 1
    explanation: >
      Beim Aushandeln kürzt du einen Tag von rechts (`de-CH` → `de`), bis eine unterstützte Sprache passt.
      Gibt es nichts Passendes, greift die Fallback-Sprache.
tasks:
  - id: tag-beschriften
    type: diagram
    title: Beschrifte den Sprach-Tag
    description: >
      Ziehe die richtigen Bezeichnungen unter die drei Teile des Tags `sr-Latn-RS`. Zwei Begriffe gehören
      nicht in einen Sprach-Tag.
    image: /assets/internationalisierung/bcp47-aufbau-leer.svg
    slots:
      - { x: 25, y: 63, answer: Sprache }
      - { x: 52.5, y: 63, answer: Schrift }
      - { x: 80, y: 63, answer: Region }
    distractors: [Währung, Zeitzone]
    hints:
      - Der erste Teil ist klein geschrieben und immer vorhanden.
      - Vier Buchstaben mit großem Anfangsbuchstaben stehen für ein Schriftsystem.
  - id: sprache-aushandeln
    type: code
    language: ts
    title: Die passende Sprache aushandeln
    description: |
      Schreibe `negotiate(requested, supported, fallback)`. `requested` sind die Wunschsprachen der Person in
      Prioritätsreihenfolge (z. B. aus `navigator.languages`), `supported` die Sprachen deiner App.

      1. Gehe die Wunschsprachen der Reihe nach durch.
      2. Passt ein Tag exakt zu einer unterstützten Sprache (ohne auf Groß-/Kleinschreibung zu achten), gib die
         unterstützte Sprache **in ihrer Schreibweise aus `supported`** zurück.
      3. Sonst kürze den Tag von rechts um einen Teil (`zh-Hant-TW` → `zh-Hant` → `zh`) und versuche es erneut.
      4. Passt keine Wunschsprache, gib `fallback` zurück.
    starter: |
      function negotiate(requested: string[], supported: string[], fallback: string): string {
        // Tipp: tag.split("-") zerlegt einen Tag in seine Teile
        return fallback;
      }
    tests:
      - name: de-CH fällt auf de zurück
        code: assertEqual(negotiate(["de-CH", "en"], ["en", "de"], "en"), "de")
      - name: Reihenfolge der Wünsche zählt
        code: assertEqual(negotiate(["fr-CA", "de"], ["de", "en", "fr"], "en"), "fr")
      - name: nichts passt – Fallback
        code: assertEqual(negotiate(["it-IT", "es"], ["de", "en"], "en"), "en")
      - name: keine Wünsche – Fallback
        code: assertEqual(negotiate([], ["de", "en"], "de"), "de")
      - name: Groß-/Kleinschreibung egal, Schreibweise aus supported
        code: assertEqual(negotiate(["EN-us"], ["de", "en-US"], "de"), "en-US")
      - name: Schrift bleibt beim Kürzen erhalten
        code: assertEqual(negotiate(["zh-Hant-TW"], ["zh", "zh-Hant"], "en"), "zh-Hant")
    solution: |
      function negotiate(requested: string[], supported: string[], fallback: string): string {
        const byLower = new Map(supported.map((tag) => [tag.toLowerCase(), tag]));
        for (const wish of requested) {
          const parts = wish.toLowerCase().split("-");
          while (parts.length > 0) {
            const match = byLower.get(parts.join("-"));
            if (match !== undefined) return match;
            parts.pop();
          }
        }
        return fallback;
      }
    hints:
      - Lege dir eine Map von kleingeschriebenem Tag zu Original-Tag an.
      - "Mit `parts.pop()` entfernst du den letzten Teil, mit `parts.join(\"-\")` baust du den Tag wieder zusammen."
---
Deine App soll „die Sprache des Nutzers“ sprechen. Aber was genau ist das? Eine Person aus Zürich liest
Deutsch – allerdings Schweizer Deutsch, mit `1'234.50` statt `1.234,50` und ohne „ß“. Eine Person in
Serbien liest Serbisch – in lateinischer oder kyrillischer Schrift. Damit Software das unterscheiden kann,
gibt es **Locales** und einen Standard für ihre Namen: **BCP 47**.

## Was eine Locale ist

Eine [[locale|Locale]] ist ein Kürzel, das Sprache und meist auch Region beschreibt. Sie beantwortet für
die Software zwei Fragen:

1. **Welche Texte** zeige ich? → Sprache
2. **Welche Formate** nutze ich? → Region (Zahlen, Datum, Währungssymbol-Position)

Die Namen folgen dem Standard [[bcp-47|BCP 47]] der IETF. Du kennst sie aus HTML (`<html lang="de">`),
aus dem HTTP-Header `Accept-Language` und aus `Intl`:

```js run
console.log(new Intl.NumberFormat("de-DE").format(1234.5)); // 1.234,5
console.log(new Intl.NumberFormat("de-CH").format(1234.5)); // 1'234.5
console.log(new Intl.NumberFormat("en-US").format(1234.5)); // 1,234.5
```

## Aufbau eines Sprach-Tags

![Aufbau des Tags sr-Latn-RS: Sprache, Schrift und Region](/assets/internationalisierung/bcp47-aufbau.svg)

Ein Tag besteht aus Teilen (Subtags), getrennt durch Bindestriche:

| Teil | Norm | Schreibweise | Beispiele |
|---|---|---|---|
| Sprache (Pflicht) | ISO 639 | 2–3 Kleinbuchstaben | `de`, `en`, `ar`, `zh` |
| Schrift (optional) | ISO 15924 | 4 Buchstaben, erster groß | `Latn`, `Cyrl`, `Hant` |
| Region (optional) | ISO 3166 / UN M.49 | 2 Großbuchstaben oder 3 Ziffern | `DE`, `CH`, `419` (Lateinamerika) |

Die Schreibweise ist **Konvention**, keine Bedeutung: `de-ch` und `de-CH` sind derselbe Tag. Es gibt noch
Erweiterungen wie `-u-ca-buddhist` (anderer Kalender) – die brauchst du selten.

> [!FEHLER]
> Ländercodes sind keine Sprachcodes: `en-UK` gibt es nicht, Großbritannien heißt `GB` → `en-GB`. Und `jp`
> ist kein Sprachcode – Japanisch ist `ja`, Japan ist `JP`.

## Locales im Code lesen

In JavaScript zerlegt `Intl.Locale` einen Tag. Mit `maximize()` ergänzt sie wahrscheinliche Teile aus den
Daten des [[cldr|CLDR]]-Projekts:

```js run
const tag = new Intl.Locale("zh-TW");
console.log(tag.language, tag.region);        // zh TW
console.log(tag.maximize().toString());       // zh-Hant-TW (Taiwan nutzt traditionelle Zeichen)
console.log(Intl.getCanonicalLocales("EN-us")); // [ 'en-US' ]
```

PHP hat dafür die Klasse `Locale` aus der Erweiterung [[intl]]. ICU und PHP schreiben gern mit Unterstrich
(`de_CH`), verstehen aber auch den Bindestrich:

```php title="PHP"
Locale::parseLocale('sr_Latn_RS'); // ['language' => 'sr', 'script' => 'Latn', 'region' => 'RS']
Locale::getDisplayName('ar_EG', 'de'); // "Arabisch (Ägypten)"
```

## Fallback-Ketten

Du wirst nie jede Locale der Welt übersetzen. Deshalb gibt es eine [[fallback-sprache|Fallback-Kette]]:
Fehlt etwas für die genaue Locale, nimmst du die nächstallgemeinere.

```text title="Typische Fallback-Kette"
de-CH  →  de  →  en (Standardsprache der App)
```

Das gilt für ganze Sprachen und für einzelne Texte: Hat `de-CH` nur zehn eigene Texte (z. B. „Velo“ statt
„Fahrrad“), kommen alle anderen aus `de`. Und fehlt ein Text auch dort, zeigt die App die Standardsprache
statt einer Lücke.

> [!MERKSATZ]
> Kürze einen Tag von rechts, bis etwas passt – `zh-Hant-TW` → `zh-Hant` → `zh` – und halte am Ende immer
> eine Standardsprache bereit.

## Die Sprache aushandeln

Woher weißt du, welche Sprache jemand möchte? Der Browser kennt die Einstellungen der Person und schickt
sie im Header [[accept-language|Accept-Language]] mit, sortiert nach Gewicht `q`:

```http title="Anfrage"
Accept-Language: de-CH, de;q=0.9, en;q=0.8
```

Im Browser liest du dieselbe Liste aus `navigator.languages`. Die Reihenfolge beim Aushandeln:

1. Eine **ausdrückliche Wahl** der Person (Sprachumschalter, Profil-Einstellung, `/en/` in der URL).
2. Die **Browser-Wünsche** aus `Accept-Language` bzw. `navigator.languages`.
3. Die **Standardsprache** der App.

PHP bringt mit `Locale::acceptFromHttp()` und `Locale::lookup()` Helfer dafür mit.

> [!PRAXIS]
> Leite die Sprache **nie** aus der IP-Adresse oder dem Land ab. Wer in Belgien wohnt, spricht vielleicht
> Niederländisch, Französisch oder Deutsch – oder ist nur im Urlaub. Speichere eine einmal gewählte Sprache
> im Profil oder in einem Cookie und respektiere sie.

## Zusammenfassung

- Eine **Locale** beschreibt Sprache und Region und steuert Texte und Formate.
- **BCP-47-Tags** bestehen aus Sprache (Pflicht), optionaler Schrift und optionaler Region: `sr-Latn-RS`.
- `Intl.Locale` (JavaScript) und `Locale` (PHP) zerlegen und vervollständigen Tags.
- Eine **Fallback-Kette** kürzt Tags von rechts und endet bei der Standardsprache.
- Ausdrückliche Wahl schlägt `Accept-Language`, und beides schlägt die Standardsprache – nie die IP-Adresse.
