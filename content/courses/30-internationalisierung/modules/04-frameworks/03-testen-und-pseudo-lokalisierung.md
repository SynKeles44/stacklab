---
title: Testen und Pseudo-Lokalisierung
summary: Kataloge automatisch prüfen, mit fester Locale und Zeitzone testen und mit Pseudo-Lokalisierung fest eingebaute Texte und zu knappe Layouts finden.
duration: 25
sources:
  - title: Node.js – Test runner (node:test)
    url: https://nodejs.org/api/test.html
  - title: Laravel – Localization (Missing Keys)
    url: https://laravel.com/api/13.x/Illuminate/Translation/Translator.html
  - title: Microsoft – Pseudo-localization
    url: https://learn.microsoft.com/en-us/globalization/methodology/pseudolocalization
  - title: i18next-cli (status, lint)
    url: https://github.com/i18next/i18next-cli
quiz:
  - type: single
    question: Was macht Pseudo-Lokalisierung?
    options:
      - Sie übersetzt die App automatisch in alle Sprachen.
      - Sie verwandelt die Texte der Ausgangssprache in eine künstliche Sprache – mit Akzenten, Klammern und Verlängerung –, damit i18n-Fehler sichtbar werden.
      - Sie entfernt alle Texte aus der App.
      - Sie testet nur die Rechtschreibung.
    answer: 1
    explanation: >
      „Settings“ wird zu „[Šéţţíñĝš~~~]“. Fest eingebaute Texte bleiben dabei unverändert und fallen sofort auf,
      abgeschnittene Klammern verraten zu knappe Layouts.
  - type: multiple
    question: Welche Prüfungen lassen sich für Übersetzungskataloge automatisieren?
    options:
      - Jeder Schlüssel der Ausgangssprache existiert in jeder Zielsprache.
      - Jede Übersetzung nutzt dieselben Platzhalter wie das Original.
      - Jede Zielsprache hat die Pluralformen, die ihre Sprache braucht.
      - Jede Übersetzung klingt natürlich.
    answers: [0, 1, 2]
    explanation: >
      Struktur, Platzhalter und Pluralformen prüft ein Skript. Ob eine Übersetzung gut klingt, beurteilen nur
      Menschen.
  - type: find-bug
    question: Der Test ist auf deinem Rechner grün, in der CI rot. Welche Zeile ist die wahrscheinliche Ursache?
    language: ts
    code: |
      import { test } from "node:test";
      import assert from "node:assert/strict";

      test("zeigt das Lieferdatum", () => {
        const text = new Date("2026-03-29T01:30:00Z").toLocaleString();
        assert.equal(text, "29.3.2026, 03:30:00");
      });
    bug_line: 5
    explanation: >
      `toLocaleString()` ohne Argumente nutzt Locale und Zeitzone der Umgebung. Auf deinem Rechner sind das
      Deutsch und Berlin, in der CI meist Englisch und UTC. Übergib Locale und `timeZone` immer ausdrücklich.
  - type: cloze
    text: "In Laravel meldet `Lang::___(fn ($key, $replace, $locale) => …)` fehlende Übersetzungsschlüssel an eine eigene Funktion, z. B. zum Loggen."
    blanks:
      - [handleMissingKeysUsing]
    explanation: >
      Der Callback wird für jeden fehlenden Schlüssel aufgerufen. So landen Lücken im Log statt unbemerkt auf der
      Seite.
tasks:
  - id: pseudo-lokalisieren
    type: code
    language: ts
    title: Eine Pseudo-Locale bauen
    description: |
      Schreibe `pseudoLocalize(text)`, das einen Text der Ausgangssprache in eine Pseudo-Sprache verwandelt:

      1. Ersetze jeden Buchstaben, der in `ACCENTS` steht, durch sein Gegenstück (`a` → `á` …).
      2. **Platzhalter** wie `{name}` oder `{{count}}` bleiben unverändert – sonst würden sie kaputtgehen.
      3. Verlängere den Text um `Math.ceil(text.length * 3 / 10)` Tilden `~` (rund 30 %).
      4. Umschließe alles mit eckigen Klammern.

      Beispiel: `"Save"` → `"[Sávé~~]"`.
    starter: |
      const ACCENTS: Record<string, string> = {
        a: "á", e: "é", i: "í", o: "ó", u: "ú",
        A: "Á", E: "É", I: "Í", O: "Ó", U: "Ú",
      };

      function pseudoLocalize(text: string): string {
        return text;
      }
    tests:
      - name: einfaches Wort
        code: assertEqual(pseudoLocalize("Save"), "[Sávé~~]")
      - name: Platzhalter bleibt unverändert
        code: assertEqual(pseudoLocalize("Hallo {name}!"), "[Hálló {name}!~~~~]")
      - name: doppelte geschweifte Klammern (i18next)
        code: assertEqual(pseudoLocalize("{{count}} items"), "[{{count}} ítéms~~~~~]")
      - name: Großbuchstaben
        code: assertEqual(pseudoLocalize("AEIOU"), "[ÁÉÍÓÚ~~]")
      - name: leerer Text
        code: assertEqual(pseudoLocalize(""), "[]")
    solution: |
      const ACCENTS: Record<string, string> = {
        a: "á", e: "é", i: "í", o: "ó", u: "ú",
        A: "Á", E: "É", I: "Í", O: "Ó", U: "Ú",
      };

      function pseudoLocalize(text: string): string {
        const parts = text.split(/(\{\{?\w+\}\}?)/);
        const accented = parts
          .map((part) =>
            /^\{\{?\w+\}\}?$/.test(part) ? part : [...part].map((ch) => ACCENTS[ch] ?? ch).join(""),
          )
          .join("");
        return `[${accented}${"~".repeat(Math.ceil((text.length * 3) / 10))}]`;
      }
    hints:
      - "`text.split(/(\\{\\{?\\w+\\}\\}?)/)` zerlegt den Text und behält die Platzhalter als eigene Teile (wegen der runden Klammern)."
      - "Für normale Teile: `[...part].map((ch) => ACCENTS[ch] ?? ch).join(\"\")`."
      - "Die Länge berechnest du aus dem **Originaltext**: `Math.ceil(text.length * 3 / 10)`."
  - id: katalog-tests
    type: terminal
    title: Kataloge mit node:test absichern
    description: |
      Im Ordner `katalog-tests` liegen drei Kataloge: `locales/de.json` (Ausgangssprache), `en.json` und
      `pl.json`. In `test/helpers.mjs` gibt es die Funktion `flatten()`, die einen verschachtelten Katalog in
      Punkt-Schlüssel umwandelt. Klicke zuerst auf **Aufgabe vorbereiten**.

      1. Schreibe `test/kataloge.test.mjs` mit dem eingebauten Test-Runner `node:test`. Für `en` und `pl`
         prüft je ein Test:
         - **Alle Schlüssel vorhanden:** Jeder Schlüssel aus `de` existiert auch in der Zielsprache. Endet ein
           Schlüssel auf eine Pluralendung (`_zero`, `_one`, `_two`, `_few`, `_many`, `_other`), vergleichst du ihn
           **ohne** diese Endung – Polnisch hat ja andere Formen als Deutsch.
         - **Gleiche Platzhalter:** Für jeden gemeinsamen Schlüssel kommen dieselben `{{…}}`-Platzhalter vor.
      2. Lies die Kataloge relativ zur Testdatei ein:
         `new URL("../locales/de.json", import.meta.url)`.
      3. Führe `node --test` aus. Die Tests für `pl` schlagen fehl – repariere `locales/pl.json`
         (`cart.title` heißt auf Polnisch `Koszyk`), bis alles grün ist.
    workdir: katalog-tests
    setup: |
      npm init -y >/dev/null
      npm pkg set type=module
      mkdir -p locales test
      cat > locales/de.json <<'JSON'
      {
        "greeting": "Hallo, {{name}}!",
        "cart": {
          "title": "Warenkorb",
          "items_one": "{{count}} Produkt",
          "items_other": "{{count}} Produkte"
        }
      }
      JSON
      cat > locales/en.json <<'JSON'
      {
        "greeting": "Hello, {{name}}!",
        "cart": {
          "title": "Cart",
          "items_one": "{{count}} item",
          "items_other": "{{count}} items"
        }
      }
      JSON
      cat > locales/pl.json <<'JSON'
      {
        "greeting": "Cześć, {{imie}}!",
        "cart": {
          "items_one": "{{count}} produkt",
          "items_few": "{{count}} produkty",
          "items_many": "{{count}} produktów",
          "items_other": "{{count}} produktu"
        }
      }
      JSON
      cat > test/helpers.mjs <<'JS'
      // Wandelt { cart: { title: "…" } } in { "cart.title": "…" } um.
      export function flatten(obj, prefix = "") {
        const out = {};
        for (const [key, value] of Object.entries(obj)) {
          const path = prefix ? `${prefix}.${key}` : key;
          if (value !== null && typeof value === "object") Object.assign(out, flatten(value, path));
          else out[path] = String(value);
        }
        return out;
      }
      JS
    checks:
      - type: file_exists
        path: test/kataloge.test.mjs
        message: Die Testdatei test/kataloge.test.mjs fehlt noch.
      - type: command
        run: node --test
        message: node --test ist noch rot. Prüfe die Fehlermeldungen – fehlt in pl.json ein Schlüssel oder ist ein Platzhalter falsch geschrieben?
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX")
          cp -r test locales package.json "$d"/
          cd "$d"
          jq 'del(.cart.title)' locales/en.json > x.json && mv x.json locales/en.json
          node --test >/dev/null 2>&1
          echo "exit=$?"
          cd .. && rm -rf "$d"
        stdout_equals: "exit=1"
        message: Deine Tests bemerken keinen fehlenden Schlüssel. Die Prüfung löscht cart.title aus en.json – dann muss node --test fehlschlagen.
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX")
          cp -r test locales package.json "$d"/
          cd "$d"
          jq '.greeting = "Hello, {{user}}!"' locales/en.json > x.json && mv x.json locales/en.json
          node --test >/dev/null 2>&1
          echo "exit=$?"
          cd .. && rm -rf "$d"
        stdout_equals: "exit=1"
        message: Deine Tests bemerken keinen falschen Platzhalter. Die Prüfung ändert {{name}} in en.json zu {{user}} – dann muss node --test fehlschlagen.
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX")
          cp -r test locales package.json "$d"/
          cd "$d"
          jq 'del(.cart.items_one)' locales/en.json > x.json && mv x.json locales/en.json
          node --test >/dev/null 2>&1
          echo "exit=$?"
          cd .. && rm -rf "$d"
        stdout_equals: "exit=0"
        message: Pluralformen sollen ohne ihre Endung verglichen werden. Fehlt in en.json nur items_one, ist cart.items trotzdem vorhanden – deine Tests dürfen dann nicht fehlschlagen.
      - type: command
        run: jq -r '.cart.title' locales/pl.json
        stdout_equals: "Koszyk"
        message: In locales/pl.json fehlt noch cart.title mit dem Wert „Koszyk“.
    hints:
      - "Gerüst: `import { test } from \"node:test\"; import assert from \"node:assert/strict\";` – und `assert.deepEqual(fehlende, [])`."
      - "Die Pluralendung entfernst du mit `key.replace(/_(zero|one|two|few|many|other)$/, \"\")`, Platzhalter findest du mit `text.matchAll(/\\{\\{(\\w+)\\}\\}/g)`."
      - "Sammle pro Basis-Schlüssel eine `Set` aller Platzhalter und vergleiche sortierte Arrays."
    solution: |
      ```js title="test/kataloge.test.mjs"
      import { test } from "node:test";
      import assert from "node:assert/strict";
      import { readFileSync } from "node:fs";
      import { flatten } from "./helpers.mjs";

      const PLURAL = /_(zero|one|two|few|many|other)$/;

      function load(lng) {
        return flatten(JSON.parse(readFileSync(new URL(`../locales/${lng}.json`, import.meta.url), "utf8")));
      }

      // Basis-Schlüssel → Set aller Platzhalter (über alle Pluralformen)
      function groups(catalog) {
        const result = new Map();
        for (const [key, text] of Object.entries(catalog)) {
          const base = key.replace(PLURAL, "");
          const placeholders = result.get(base) ?? new Set();
          for (const [, name] of text.matchAll(/\{\{(\w+)\}\}/g)) placeholders.add(name);
          result.set(base, placeholders);
        }
        return result;
      }

      const source = groups(load("de"));

      for (const lng of ["en", "pl"]) {
        const target = groups(load(lng));

        test(`${lng}: alle Schlüssel vorhanden`, () => {
          const missing = [...source.keys()].filter((key) => !target.has(key));
          assert.deepEqual(missing, []);
        });

        test(`${lng}: gleiche Platzhalter`, () => {
          for (const [key, placeholders] of source) {
            if (!target.has(key)) continue;
            assert.deepEqual([...target.get(key)].sort(), [...placeholders].sort(), key);
          }
        });
      }
      ```

      ```bash
      jq '.greeting = "Cześć, {{name}}!" | .cart.title = "Koszyk"' locales/pl.json > x.json && mv x.json locales/pl.json
      node --test
      ```
---
Ein Release geht raus, und am nächsten Morgen kommen Screenshots aus Polen: Ein Button zeigt
`checkout.confirm`, eine Begrüßung lautet „Cześć, {{imie}}!“ und auf dem Handy ist das Wort
„Bestellübersicht“ abgeschnitten. Keiner dieser Fehler wäre nötig gewesen – alle drei lassen sich vor dem
Merge automatisch finden.

## Was du bei i18n testen kannst

| Prüfung | Findet | Wie |
|---|---|---|
| Schlüssel-Parität | fehlende Übersetzungen | Kataloge vergleichen (Skript, `i18next-cli status`) |
| Platzhalter-Parität | `{{imie}}` statt `{{name}}` | Platzhalter je Schlüssel vergleichen |
| Pluralformen | fehlendes `_few` im Polnischen | `Intl.PluralRules(…).resolvedOptions().pluralCategories` |
| Ungenutzte Schlüssel | toter Ballast | Extraktion mit `--ci` |
| Formatierung | falsche Zahlen und Daten | Unit-Tests mit fester Locale und Zeitzone |
| Layout | abgeschnittene Texte, RTL-Fehler | Pseudo-Lokalisierung, Screenshots |

Die ersten vier sind reine Datenprüfungen. Sie laufen in Sekunden und gehören in jede
[[ci-pipeline|CI-Pipeline]].

## Kataloge automatisch prüfen

Ein Test für Schlüssel-Parität ist schnell geschrieben – mit dem eingebauten [[test-runner|Test-Runner]] von
Node:

```js title="test/kataloge.test.mjs (Ausschnitt)"
import { test } from "node:test";
import assert from "node:assert/strict";

test("en: alle Schlüssel vorhanden", () => {
  const missing = Object.keys(de).filter((key) => !(key in en));
  assert.deepEqual(missing, []);
});
```

Zwei Feinheiten machen solche Tests erst brauchbar:

- **Pluralformen** unterscheiden sich zwischen Sprachen. Vergleiche `items_one` und `items_few` deshalb
  ohne Endung.
- **Platzhalter** müssen pro Schlüssel übereinstimmen. Ein umbenannter Platzhalter bricht die Seite, auch
  wenn der Schlüssel existiert.

In Laravel schreibst du dieselbe Prüfung als [[pest|Pest]]-Test, der `lang/de/*.php` mit `lang/en/*.php`
vergleicht.

## Mit fester Locale und Zeitzone testen

Tests, die formatierte Ausgaben prüfen, müssen unabhängig von der Maschine sein:

```js title="Stabil"
const fmt = new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Berlin" });
assert.equal(fmt.format(new Date("2026-03-29T01:30:00Z")), "29.03.26, 03:30");
```

```php title="Laravel/Pest"
it('begrüßt auf Englisch', function () {
    app()->setLocale('en');
    expect(__('shop.welcome', ['name' => 'Ada']))->toBe('Welcome, Ada!');
});
```

> [!FEHLER]
> `toLocaleString()` ohne Argumente nutzt Locale und Zeitzone der Umgebung – auf deinem Rechner Deutsch und
> Berlin, in der CI oft Englisch und UTC. Der Test ist dann „nur in der CI“ rot. Übergib Locale und
> `timeZone` immer ausdrücklich oder setze `TZ=UTC` für den ganzen Testlauf.

Achte außerdem auf geschützte Leerzeichen: Vergleiche formatierte Beträge lieber mit der Ausgabe des
Formatierers als mit einem von Hand getippten String.

## Pseudo-Lokalisierung

Echte Übersetzungen kommen oft erst kurz vor dem Release. [[pseudo-lokalisierung|Pseudo-Lokalisierung]]
findet die meisten i18n-Fehler schon vorher – ganz ohne Übersetzer:innen. Dafür wird die Ausgangssprache
automatisch verfremdet:

| Original | Pseudo | Was es aufdeckt |
|---|---|---|
| `Save` | `[Sávé~~]` | Akzente: Kodierungs- und Schriftfehler |
| `Hallo {name}!` | `[Hálló {name}!~~~~]` | Platzhalter bleiben heil |
| `Settings` | `[Séttíngs~~~]` | rund 30 % länger: abgeschnittene Texte |

- **Unveränderter Text** auf der Seite ist fest eingebaut – er kommt nicht aus dem Katalog.
- **Fehlende Klammer** am Ende bedeutet: Der Text wurde abgeschnitten.
- Längere Texte simulieren Sprachen wie Deutsch oder Finnisch, die oft deutlich länger als Englisch sind.

Viele Teams schalten eine Pseudo-Locale wie `en-XA` in der Entwicklungsumgebung frei. Für RTL-Layouts gibt
es das Gegenstück mit gespiegelter Richtung.

> [!MERKSATZ]
> Pseudo-Lokalisierung ist eine Übersetzung, die nur Fehler sichtbar macht – billig, automatisch und lange
> vor der ersten echten Übersetzung.

## Fehlende Schlüssel zur Laufzeit melden

Was durch alle Tests rutscht, soll wenigstens auffallen. i18next ruft bei `saveMissing: true` einen
`missingKeyHandler` auf; Laravel hat dafür einen eigenen Callback:

```php title="AppServiceProvider::boot()"
use Illuminate\Support\Facades\Lang;
use Illuminate\Support\Facades\Log;

Lang::handleMissingKeysUsing(function (string $key, array $replace, ?string $locale) {
    Log::warning('Fehlende Übersetzung', ['key' => $key, 'locale' => $locale]);

    return $key;
});
```

> [!PRAXIS]
> Eine typische Pipeline prüft vor jedem Merge: Schlüssel-Parität, Platzhalter, Pluralformen und
> Formatierungs-Tests. In Staging läuft zusätzlich die Pseudo-Locale, und fehlende Schlüssel landen als
> Warnung im Log. So erreicht kaum noch ein i18n-Fehler die Nutzer:innen.

## Zusammenfassung

- **Schlüssel- und Platzhalter-Parität** prüft ein kurzes Skript – Pluralendungen vergleichst du ohne Suffix.
- Formatierungs-Tests brauchen eine **feste Locale und Zeitzone**, sonst sind sie nur in der CI rot.
- **Pseudo-Lokalisierung** macht fest eingebaute Texte, Kodierungsfehler und zu knappe Layouts sichtbar.
- Zur Laufzeit melden `missingKeyHandler` (i18next) und `Lang::handleMissingKeysUsing()` (Laravel) fehlende Schlüssel.
- Ob eine Übersetzung gut klingt, prüfen Menschen – alles Strukturelle prüft die CI.
