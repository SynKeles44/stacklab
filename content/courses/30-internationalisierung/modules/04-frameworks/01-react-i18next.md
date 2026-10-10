---
title: i18n in React mit react-i18next
summary: i18next einrichten, Texte mit useTranslation und t() holen, Pluralformen und Formatierung nutzen und die Sprache zur Laufzeit wechseln.
duration: 25
sources:
  - title: react-i18next – Getting started
    url: https://react.i18next.com/getting-started
  - title: react-i18next – useTranslation (Hook)
    url: https://react.i18next.com/latest/usetranslation-hook
  - title: react-i18next – Trans-Komponente
    url: https://react.i18next.com/latest/trans-component
  - title: i18next – Plurals
    url: https://www.i18next.com/translation-function/plurals
  - title: i18next – Formatting
    url: https://www.i18next.com/translation-function/formatting
  - title: FormatJS – React Intl
    url: https://formatjs.github.io/docs/react-intl/
quiz:
  - type: single
    question: Wozu dient `i18next.use(initReactI18next)`?
    options:
      - Es übergibt die i18next-Instanz an react-i18next, damit `useTranslation` sie in allen Komponenten findet.
      - Es übersetzt die App automatisch mit einer KI.
      - Es installiert React.
      - Es lädt die Kataloge vom Server.
    answer: 0
    explanation: >
      `initReactI18next` ist ein Plugin, das die Instanz für die React-Bindung registriert. Danach liefert
      `useTranslation()` überall dieselbe Instanz und rendert neu, wenn sich die Sprache ändert.
  - type: cloze
    text: "Für Pluralformen legst du Schlüssel wie `items_one` und `items_other` an, i18next wählt per `Intl.PluralRules` aus. Dafür musst du `t()` die Option ___ übergeben."
    blanks:
      - [count]
    explanation: >
      `t("items", { count: 3 })` wählt anhand von count die Kategorie und hängt sie an: `items_other`.
      Ohne die Option count gibt es keine Pluralauswahl.
  - type: find-bug
    question: "Ein Name wie „Tom & Jerry“ erscheint in der React-App als „Tom &amp; Jerry“. Welche Zeile ist die Ursache?"
    language: ts
    code: |
      i18next.use(initReactI18next).init({
        lng: "de",
        fallbackLng: "en",
        resources,
        interpolation: { escapeValue: true },
      });
    bug_line: 5
    explanation: >
      React maskiert Ausgaben selbst. Mit `escapeValue: true` maskiert i18next zusätzlich – das ergibt doppelt
      maskierte Zeichen wie `&amp;`. In React-Projekten setzt du `escapeValue: false`.
  - type: multiple
    question: Welche Aussagen über den Sprachwechsel stimmen?
    options:
      - "`i18n.changeLanguage(\"en\")` wechselt die Sprache, und Komponenten mit `useTranslation` rendern neu."
      - "`i18n.language` enthält danach die neue Sprache."
      - Du solltest auch `<html lang>` (und bei RTL `dir`) aktualisieren.
      - Der Sprachwechsel lädt immer die ganze Seite neu.
    answers: [0, 1, 2]
    explanation: >
      Der Wechsel passiert ohne Neuladen. Das `lang`-Attribut ist wichtig für Screenreader, Silbentrennung und
      Schriftwahl – höre dafür z. B. auf das Ereignis `languageChanged`.
tasks:
  - id: i18next-einrichten
    type: terminal
    title: i18next einrichten und ausprobieren
    description: |
      Bevor i18next in React läuft, richtest du die Bibliothek selbst ein – ohne Browser, direkt in Node. Im
      Ordner `i18next-start` liegen ein leeres Node-Projekt und zwei Kataloge in `locales/`. Klicke zuerst auf
      **Aufgabe vorbereiten**.

      1. Installiere i18next: `npm install i18next`.
      2. Ergänze in `locales/de.json` unter `cart` die Pluralformen `items_one` mit
         `{{count}} Produkt im Warenkorb` und `items_other` mit `{{count}} Produkte im Warenkorb`.
      3. Schreibe `i18n.mjs`: Lies beide Kataloge ein, initialisiere i18next mit `lng: "de"`,
         `fallbackLng: "en"` und `resources` (Namespace `translation`) und exportiere die Instanz als
         `export default`.
      4. Probiere es aus:
         `node -e 'import("./i18n.mjs").then(({ default: i18n }) => console.log(i18n.t("cart.items", { count: 3 })))'`
    workdir: i18next-start
    setup: |
      npm init -y >/dev/null
      npm pkg set type=module
      mkdir -p locales
      cat > locales/de.json <<'JSON'
      {
        "greeting": "Hallo, {{name}}!",
        "cart": {
          "title": "Warenkorb"
        }
      }
      JSON
      cat > locales/en.json <<'JSON'
      {
        "greeting": "Hello, {{name}}!",
        "logout": "Log out",
        "cart": {
          "title": "Cart",
          "items_one": "{{count}} item in your cart",
          "items_other": "{{count}} items in your cart"
        }
      }
      JSON
    checks:
      - type: dir_exists
        path: node_modules/i18next
        message: i18next ist noch nicht installiert. Führe npm install i18next aus.
      - type: file_exists
        path: i18n.mjs
        message: Die Datei i18n.mjs fehlt noch.
      - type: command
        run: |
          node -e 'import("./i18n.mjs").then(({ default: i18n }) => console.log(i18n.t("greeting", { name: "Ada" })))'
        stdout_equals: "Hallo, Ada!"
        message: "i18n.t(\"greeting\", { name: \"Ada\" }) soll „Hallo, Ada!“ liefern. Ist lng auf \"de\" gesetzt und exportierst du die Instanz mit export default?"
      - type: command
        run: |
          node -e 'import("./i18n.mjs").then(({ default: i18n }) => { console.log(i18n.t("cart.items", { count: 1 })); console.log(i18n.t("cart.items", { count: 3 })) })'
        stdout_matches: "^1 Produkt im Warenkorb\\n3 Produkte im Warenkorb$"
        message: Die deutschen Pluralformen fehlen oder stimmen nicht. Ergänze cart.items_one und cart.items_other in locales/de.json.
      - type: command
        run: |
          node -e 'import("./i18n.mjs").then(({ default: i18n }) => console.log(i18n.t("logout")))'
        stdout_equals: "Log out"
        message: Für Schlüssel, die nur im englischen Katalog stehen, soll i18next auf Englisch zurückfallen. Setze fallbackLng auf "en".
      - type: command
        run: |
          node -e 'import("./i18n.mjs").then(async ({ default: i18n }) => { await i18n.changeLanguage("en"); console.log(i18n.language + ": " + i18n.t("cart.items", { count: 1 })) })'
        stdout_equals: "en: 1 item in your cart"
        message: Nach changeLanguage("en") soll der englische Text erscheinen. Hast du beide Kataloge unter resources eingetragen?
    hints:
      - "`import i18next from \"i18next\";` und `await i18next.init({ ... })` – in einer .mjs-Datei ist `await` auf oberster Ebene erlaubt."
      - "Die Kataloge liest du mit `JSON.parse(readFileSync(\"locales/de.json\", \"utf8\"))` aus `node:fs`."
      - "`resources: { de: { translation: de }, en: { translation: en } }`"
    solution: |
      ```bash
      cd i18next-start
      npm install i18next
      jq '.cart.items_one = "{{count}} Produkt im Warenkorb" | .cart.items_other = "{{count}} Produkte im Warenkorb"' \
        locales/de.json > locales/de.tmp && mv locales/de.tmp locales/de.json
      ```

      ```js title="i18n.mjs"
      import { readFileSync } from "node:fs";
      import i18next from "i18next";

      const load = (lng) => JSON.parse(readFileSync(new URL(`./locales/${lng}.json`, import.meta.url), "utf8"));

      await i18next.init({
        lng: "de",
        fallbackLng: "en",
        resources: {
          de: { translation: load("de") },
          en: { translation: load("en") },
        },
      });

      export default i18next;
      ```
  - id: eigener-use-translation
    type: code
    language: tsx
    title: Baue useTranslation selbst nach
    description: |
      Im Code-Editor kannst du keine Pakete importieren. Deshalb baust du das Herzstück von react-i18next
      selbst nach – so verstehst du, was die Bibliothek für dich tut. `Cart` und `App` sind fertig, aber der
      Provider ist noch unvollständig:

      1. `changeLanguage(lng)` soll die Sprache wirklich wechseln (State im `I18nProvider`).
      2. `t(key, options)` soll Pluralformen im i18next-Stil auflösen: Ist `options.count` eine Zahl, hänge
         `_` plus die Kategorie aus `new Intl.PluralRules(sprache).select(count)` an den Schlüssel. Gibt es den
         Schlüssel nicht, nimm `_other`.
      3. `t` ersetzt Platzhalter `{{name}}` durch Werte aus `options`.
    starter: |
      const RESOURCES: Record<string, Record<string, string>> = {
        de: { "cart.title": "Warenkorb", "cart.items_one": "{{count}} Produkt", "cart.items_other": "{{count}} Produkte", switch: "English" },
        en: { "cart.title": "Cart", "cart.items_one": "{{count}} item", "cart.items_other": "{{count}} items", switch: "Deutsch" },
      };

      type Options = Record<string, string | number>;
      type I18n = { language: string; changeLanguage: (lng: string) => void };
      const I18nContext = React.createContext<{ t: (key: string, options?: Options) => string; i18n: I18n } | null>(null);

      function I18nProvider({ initialLanguage, children }: { initialLanguage: string; children: React.ReactNode }) {
        const language = initialLanguage;
        const t = (key: string, options: Options = {}) => RESOURCES[language][key] ?? key;
        const i18n = { language, changeLanguage: (lng: string) => {} };
        return <I18nContext.Provider value={{ t, i18n }}>{children}</I18nContext.Provider>;
      }

      function useTranslation() {
        const value = React.useContext(I18nContext);
        if (value === null) throw new Error("useTranslation braucht einen I18nProvider");
        return value;
      }

      function Cart() {
        const { t, i18n } = useTranslation();
        const [count, setCount] = React.useState(1);
        return (
          <section id="shop" lang={i18n.language}>
            <h1>{t("cart.title")}</h1>
            <p id="items">{t("cart.items", { count })}</p>
            <button id="add" onClick={() => setCount((c) => c + 1)}>+</button>
            <button id="switch" onClick={() => i18n.changeLanguage(i18n.language === "de" ? "en" : "de")}>
              {t("switch")}
            </button>
          </section>
        );
      }

      function App() {
        return (
          <I18nProvider initialLanguage="de">
            <Cart />
          </I18nProvider>
        );
      }
    tests:
      - name: startet auf Deutsch mit Singular
        code: |
          assertEqual(query("h1").textContent, "Warenkorb");
          assertEqual(query("#items").textContent, "1 Produkt");
      - name: Plural nach dem Hinzufügen
        code: |
          await click("#add");
          await click("#add");
          assertEqual(query("#items").textContent, "3 Produkte");
      - name: Sprachwechsel nach Englisch
        code: |
          await click("#switch");
          assertEqual(query("h1").textContent, "Cart");
          assertEqual(query("#items").textContent, "3 items");
          assertEqual(query("#shop").getAttribute("lang"), "en");
      - name: Zähler bleibt beim Wechsel erhalten
        code: |
          await click("#add");
          assertEqual(query("#items").textContent, "4 items");
          await click("#switch");
          assertEqual(query("#items").textContent, "4 Produkte");
          assertEqual(query("#shop").getAttribute("lang"), "de");
    solution: |
      const RESOURCES: Record<string, Record<string, string>> = {
        de: { "cart.title": "Warenkorb", "cart.items_one": "{{count}} Produkt", "cart.items_other": "{{count}} Produkte", switch: "English" },
        en: { "cart.title": "Cart", "cart.items_one": "{{count}} item", "cart.items_other": "{{count}} items", switch: "Deutsch" },
      };

      type Options = Record<string, string | number>;
      type I18n = { language: string; changeLanguage: (lng: string) => void };
      const I18nContext = React.createContext<{ t: (key: string, options?: Options) => string; i18n: I18n } | null>(null);

      function I18nProvider({ initialLanguage, children }: { initialLanguage: string; children: React.ReactNode }) {
        const [language, setLanguage] = React.useState(initialLanguage);

        const value = React.useMemo(() => {
          const plural = new Intl.PluralRules(language);
          const t = (key: string, options: Options = {}) => {
            const catalog = RESOURCES[language];
            let message = catalog[key];
            if (typeof options.count === "number") {
              message = catalog[`${key}_${plural.select(options.count)}`] ?? catalog[`${key}_other`];
            }
            if (message === undefined) return key;
            return message.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
              name in options ? String(options[name]) : match,
            );
          };
          return { t, i18n: { language, changeLanguage: setLanguage } };
        }, [language]);

        return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
      }

      function useTranslation() {
        const value = React.useContext(I18nContext);
        if (value === null) throw new Error("useTranslation braucht einen I18nProvider");
        return value;
      }

      function Cart() {
        const { t, i18n } = useTranslation();
        const [count, setCount] = React.useState(1);
        return (
          <section id="shop" lang={i18n.language}>
            <h1>{t("cart.title")}</h1>
            <p id="items">{t("cart.items", { count })}</p>
            <button id="add" onClick={() => setCount((c) => c + 1)}>+</button>
            <button id="switch" onClick={() => i18n.changeLanguage(i18n.language === "de" ? "en" : "de")}>
              {t("switch")}
            </button>
          </section>
        );
      }

      function App() {
        return (
          <I18nProvider initialLanguage="de">
            <Cart />
          </I18nProvider>
        );
      }
    hints:
      - "`const [language, setLanguage] = React.useState(initialLanguage);` – und `changeLanguage: setLanguage`."
      - "`` catalog[`${key}_${new Intl.PluralRules(language).select(count)}`] `` findet die passende Form."
      - "Für die Platzhalter: `message.replace(/\\{\\{(\\w+)\\}\\}/g, (m, name) => String(options[name]))`."
---
Du kennst jetzt alle Bausteine: Kataloge, Platzhalter, Pluralformen, Intl. In einer echten React-App willst
du sie nicht selbst zusammenstecken. Die verbreitetste Lösung dafür ist [[react-i18next]] – die
React-Anbindung der Bibliothek [[i18next]].

## Eine Bibliothek wählen

Für React gibt es zwei große Lösungen:

| | react-i18next | react-intl (FormatJS) |
|---|---|---|
| Nachrichtenformat | eigene Syntax `{{name}}`, Plurale über Schlüssel-Suffixe | ICU MessageFormat `{name}` |
| Kataloge | JSON, verschachtelt, Namespaces, Nachladen per Plugin | JSON, flach, meist mit IDs |
| Ökosystem | sehr groß (Spracherkennung, Backends, i18next-cli) | Extraktion mit `@formatjs/cli` |
| Typisch für | viele React- und Node-Projekte | Projekte, die konsequent ICU nutzen wollen |

Beide sind gute Wahl. Dieser Kurs zeigt react-i18next, weil du dieselbe Bibliothek auch in Node, React Native
und Vue nutzen kannst. Wer ICU bevorzugt, kann i18next mit dem Plugin `i18next-icu` erweitern oder
[[formatjs|FormatJS]] nehmen.

## Einrichten

```bash title="Installation"
npm install i18next react-i18next
```

```ts title="src/i18n.ts"
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import de from "./locales/de.json";
import en from "./locales/en.json";

i18n.use(initReactI18next).init({
  lng: "de",
  fallbackLng: "en",
  resources: {
    de: { translation: de },
    en: { translation: en },
  },
  interpolation: { escapeValue: false }, // React maskiert selbst
});

export default i18n;
```

```tsx title="src/main.tsx"
import "./i18n"; // einmal importieren, bevor die App rendert
```

`resources` enthält pro Sprache einen oder mehrere **Namespaces** (hier `translation`). Große Apps teilen
Kataloge so in `common`, `checkout`, `admin` auf und laden sie nur bei Bedarf. Dafür gibt es Backend-Plugins wie
`i18next-http-backend`, die einen Katalog erst beim Sprachwechsel vom Server holen – so lädt niemand alle
Sprachen auf einmal. Mit `npx i18next-cli types` erzeugst du außerdem TypeScript-Typen aus den Katalogen, und
dein Editor meldet Tippfehler in Schlüsseln schon beim Schreiben.

> [!FEHLER]
> `escapeValue: true` (der Standard) in React führt zu doppelt maskierten Zeichen wie `&amp;`. React schützt
> schon vor [[xss|XSS]], deshalb gehört in React-Projekten `escapeValue: false` in die Konfiguration.

## useTranslation und t()

Der [[react-hook|Hook]] `useTranslation` liefert die Funktion `t` und die Instanz `i18n`:

```tsx title="Cart.tsx"
import { useTranslation } from "react-i18next";

export function Cart({ count, name }: { count: number; name: string }) {
  const { t } = useTranslation();
  return (
    <section>
      <h1>{t("cart.title")}</h1>
      <p>{t("greeting", { name })}</p>
      <p>{t("cart.items", { count })}</p>
    </section>
  );
}
```

```json title="locales/de.json"
{
  "greeting": "Hallo, {{name}}!",
  "cart": {
    "title": "Warenkorb",
    "items_one": "{{count}} Produkt im Warenkorb",
    "items_other": "{{count}} Produkte im Warenkorb"
  }
}
```

Bei `count` sucht i18next den Schlüssel mit der passenden Pluralkategorie (`_one`, `_few`, `_many`,
`_other` …). Mit `useTranslation("checkout")` wählst du einen anderen Namespace, mit
`{ keyPrefix: "cart" }` sparst du dir den gemeinsamen Anfang der Schlüssel.

> [!MERKSATZ]
> `t()` braucht für Pluralformen immer die Option `count`. Ohne `count` gibt es keine Auswahl.

## Sprache wechseln

```tsx title="LanguageSwitcher.tsx"
export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  return (
    <select value={i18n.resolvedLanguage} onChange={(e) => i18n.changeLanguage(e.target.value)}>
      <option value="de">Deutsch</option>
      <option value="en">English</option>
    </select>
  );
}
```

`changeLanguage` wechselt die Sprache sofort, alle Komponenten mit `useTranslation` rendern neu. Zwei
Dinge machst du zusätzlich:

- **`<html lang>` und `dir` aktualisieren**, z. B. in `i18n.on("languageChanged", (lng) => { … })`.
- **Die Wahl merken**, etwa in `localStorage`. Das Plugin `i18next-browser-languagedetector` übernimmt das
  und liest beim ersten Besuch `navigator.languages`.

## Markup in Übersetzungen und Formatierung

Links oder fette Wörter mitten im Satz löst die Komponente `Trans` – ohne HTML im Katalog zu zerschneiden:

```tsx title="Trans mit benannten Tags"
<Trans i18nKey="terms" components={{ link: <a href="/agb" /> }} />
// Katalog: "terms": "Mit der Bestellung akzeptierst du die <link>AGB</link>."
```

Zahlen und Datumswerte formatiert i18next mit eingebauten Formatierern auf Basis von Intl:
`"total": "Summe: {{val, currency(EUR)}}"` und `t("total", { val: 19.99 })`. Alternativ formatierst du in
der Komponente mit `Intl.NumberFormat(i18n.language, …)`.

> [!PRAXIS]
> In großen Apps prüft `npx i18next-cli extract --ci` in der CI-Pipeline, ob alle Schlüssel aus dem Code in den
> Katalogen stehen. Und `i18next-cli lint` meldet fest eingebaute Texte in JSX.

## Zusammenfassung

- **react-i18next** verbindet die Bibliothek i18next mit React; Alternative ist react-intl mit ICU.
- Die Instanz wird einmal mit `i18n.use(initReactI18next).init({ … })` konfiguriert – in React mit `escapeValue: false`.
- `useTranslation()` liefert `t` und `i18n`; Platzhalter schreibst du als `{{name}}`.
- Pluralformen stehen als `_one`, `_other` … im Katalog und werden über die Option `count` gewählt.
- `i18n.changeLanguage()` wechselt die Sprache; `lang`/`dir` und die gespeicherte Wahl pflegst du mit.
- `Trans` setzt Markup in Übersetzungen ein, Formatierer wie `{{val, currency(EUR)}}` nutzen Intl.
