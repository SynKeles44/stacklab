---
title: Übersetzungsschlüssel und Kataloge
summary: Wie du Texte in Kataloge auslagerst, gute Schlüssel benennst und mit Platzhaltern statt Verkettung arbeitest.
duration: 20
sources:
  - title: i18next – Essentials (Schlüssel, Interpolation, Fallback)
    url: https://www.i18next.com/translation-function/essentials
  - title: Laravel – Localization
    url: https://laravel.com/docs/13.x/localization
  - title: W3C – Composite messages
    url: https://www.w3.org/International/articles/composite-messages/
quiz:
  - type: single
    question: Warum ist `"Willkommen zurück, " + name + "!"` schlecht zu übersetzen?
    options:
      - Weil Übersetzer:innen nur Satzteile sehen und die Wortstellung nicht anpassen können.
      - Weil Namen nicht übersetzt werden dürfen.
      - Weil Ausrufezeichen in anderen Sprachen verboten sind.
      - Es ist kein Problem, solange beide Teile übersetzt werden.
    answer: 0
    explanation: >
      Im Japanischen steht der Name vorne, im Türkischen hängt eine Endung daran. Nur ein ganzer Satz mit
      Platzhalter – `"Willkommen zurück, {name}!"` – lässt sich frei umstellen.
  - type: multiple
    question: Welche Schlüssel sind gut benannt?
    options:
      - "`checkout.payment.submit`"
      - "`text17`"
      - "`profile.delete.confirm_title`"
      - "`blue_button_left`"
    answers: [0, 2]
    explanation: >
      Gute Schlüssel beschreiben den Zweck und den Ort im Produkt, nicht das Aussehen oder eine laufende
      Nummer. So bleiben sie stabil, auch wenn der Button später grün wird.
  - type: find-bug
    question: "Auf dem Button steht „Bestellung“ statt „Bestellen“. Im Englischen fiel das nie auf, weil beides „Order“ heißt. Welche Zeile ist schuld?"
    language: tsx
    code: |
      function OrderPage({ order }: { order: Order }) {
        return (
          <section>
            <h1>{t("order.title")}</h1>
            <p>{t("order.number", { id: order.id })}</p>
            <button>{t("order.title")}</button>
          </section>
        );
      }
    bug_line: 6
    explanation: >
      Der Button nutzt den Schlüssel der Überschrift („Bestellung“). Im
      Englischen heißen beide „Order“, im Deutschen nicht. Jede Stelle mit eigener Bedeutung braucht einen
      eigenen Schlüssel, hier z. B. `order.submit`.
  - type: cloze
    text: "Laravel-JSON-Dateien wie `lang/de.json` nutzen den ___ Text selbst als Schlüssel, PHP-Dateien wie `lang/de/messages.php` nutzen kurze ___."
    blanks:
      - [englischen, originalen, ursprünglichen, Original]
      - [Schlüssel, Keys]
    explanation: >
      Laravel unterstützt beide Stile: Quelltext als Schlüssel (JSON) und sprechende, kurze Schlüssel (PHP-Arrays).
tasks:
  - id: mini-translator
    type: code
    language: ts
    title: Baue deine eigene t()-Funktion
    description: |
      Bevor du eine Bibliothek nutzt, baust du das Herzstück selbst nach. Schreibe
      `createTranslator(catalogs, locale, fallback)`, das eine Funktion `t(key, params)` zurückgibt:

      1. Suche den Schlüssel im Katalog von `locale`.
      2. Fehlt er dort (oder gibt es den Katalog gar nicht), suche im Katalog von `fallback`.
      3. Fehlt er auch dort, gib den **Schlüssel selbst** zurück – so fallen fehlende Texte auf.
      4. Ersetze jeden Platzhalter `{name}` durch den passenden Wert aus `params`. Gibt es keinen Wert,
         bleibt der Platzhalter stehen.
    starter: |
      type Catalog = Record<string, string>;
      type Params = Record<string, string | number>;

      function createTranslator(catalogs: Record<string, Catalog>, locale: string, fallback: string) {
        return function t(key: string, params: Params = {}): string {
          return key;
        };
      }
    tests:
      - name: übersetzt mit Platzhalter
        code: |
          const t = createTranslator({ de: { greeting: "Hallo, {name}!" } }, "de", "en");
          assertEqual(t("greeting", { name: "Ada" }), "Hallo, Ada!");
      - name: nutzt die Fallback-Sprache
        code: |
          const t = createTranslator({ de: {}, en: { logout: "Log out" } }, "de", "en");
          assertEqual(t("logout"), "Log out");
      - name: unbekannte Locale nutzt den Fallback
        code: |
          const t = createTranslator({ en: { save: "Save" } }, "fr", "en");
          assertEqual(t("save"), "Save");
      - name: fehlender Schlüssel liefert den Schlüssel
        code: |
          const t = createTranslator({ de: {}, en: {} }, "de", "en");
          assertEqual(t("cart.title"), "cart.title");
      - name: mehrere und wiederholte Platzhalter, Zahlen
        code: |
          const t = createTranslator({ de: { m: "{a} und {b} – noch einmal {a}: {n}" } }, "de", "en");
          assertEqual(t("m", { a: "Ada", b: "Linus", n: 3 }), "Ada und Linus – noch einmal Ada: 3");
      - name: fehlender Wert lässt den Platzhalter stehen
        code: |
          const t = createTranslator({ de: { greeting: "Hallo, {name}!" } }, "de", "en");
          assertEqual(t("greeting"), "Hallo, {name}!");
    solution: |
      type Catalog = Record<string, string>;
      type Params = Record<string, string | number>;

      function createTranslator(catalogs: Record<string, Catalog>, locale: string, fallback: string) {
        return function t(key: string, params: Params = {}): string {
          const message = catalogs[locale]?.[key] ?? catalogs[fallback]?.[key];
          if (message === undefined) return key;
          return message.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
            name in params ? String(params[name]) : placeholder,
          );
        };
      }
    hints:
      - "Mit `catalogs[locale]?.[key]` liest du sicher, auch wenn es den Katalog nicht gibt. `??` liefert dann den Fallback."
      - "Ein regulärer Ausdruck wie `/\\{(\\w+)\\}/g` findet alle Platzhalter."
      - "`text.replace(regex, (ganz, name) => …)` ruft deine Funktion für jeden Treffer auf."
  - id: gut-oder-problematisch
    type: dragdrop
    title: Gute Praxis oder Problem?
    description: Ordne jedes Beispiel ein. Ist es gute i18n-Praxis, oder wird es beim Übersetzen Probleme machen?
    targets:
      - { id: gut, label: Gute Praxis }
      - { id: problem, label: Macht Probleme }
    items:
      - { label: "`t(\"cart.items\", { count })` mit ganzem Satz im Katalog", target: gut }
      - { label: "Schlüssel `settings.privacy.title` statt `heading3`", target: gut }
      - { label: "Kommentar für Übersetzer:innen: „Button, max. 20 Zeichen“", target: gut }
      - { label: "`t(\"hello\") + \" \" + name`", target: problem }
      - { label: "Ein Schlüssel `common.open` für „Öffnen“ (Verb) und „Offen“ (Status)", target: problem }
      - { label: "HTML-Tags und CSS-Klassen mitten im Übersetzungstext", target: problem }
    hints:
      - Frage dich, ob Übersetzer:innen den Satz frei umstellen können und ob jede Stelle eine eigene Bedeutung hat.
---
Ein Kunde meldet: „Im englischen Shop steht oben links immer noch ‚Warenkorb‘.“ Du suchst im Code – und
findest das Wort an elf Stellen, in Komponenten, E-Mails und Fehlermeldungen. Damit das nie wieder
passiert, kommen alle Texte an **einen** Ort: in Übersetzungskataloge.

## Texte raus aus dem Code

Ein [[uebersetzungskatalog|Übersetzungskatalog]] ist eine Datei pro Sprache, die
[[uebersetzungsschluessel|Schlüssel]] auf Texte abbildet. Am häufigsten ist [[json|JSON]]:

```json title="locales/de.json"
{
  "cart": {
    "title": "Warenkorb",
    "empty": "Dein Warenkorb ist leer.",
    "checkout": "Zur Kasse"
  }
}
```

```json title="locales/en.json"
{
  "cart": {
    "title": "Shopping cart",
    "empty": "Your cart is empty.",
    "checkout": "Check out"
  }
}
```

Im Code steht nur noch der Schlüssel: `t("cart.title")`. Die Funktion `t` (für *translate*) schaut im
Katalog der aktuellen Sprache nach. Verschachtelte Schlüssel werden mit Punkten gelesen.

> [!MERKSATZ]
> Code kennt nur Schlüssel. Welche Wörter dahinterstehen, entscheiden die Kataloge.

## Schlüssel oder Quelltext als ID?

Es gibt zwei Stile, Texte zu identifizieren:

| | Sprechende Schlüssel | Quelltext als Schlüssel |
|---|---|---|
| Code | `t("cart.empty")` | `__("Your cart is empty.")` |
| Beispiele | i18next, Laravel-PHP-Dateien | gettext, Laravel-JSON-Dateien |
| Vorteil | stabil, wenn sich der Text ändert | Code ist ohne Katalog lesbar |
| Nachteil | Code allein zeigt den Text nicht | Tippfehler im Original ändern den Schlüssel |

Beide funktionieren. In großen Apps setzen sich sprechende Schlüssel durch, weil Texte oft umformuliert
werden, ohne dass sich ihre Bedeutung ändert.

## Gute Schlüssel benennen

Ein guter Schlüssel beschreibt **Ort und Zweck**, nicht Aussehen oder Inhalt:

| Schlecht | Besser | Warum |
|---|---|---|
| `text17` | `profile.bio_placeholder` | Niemand weiß, was Nummer 17 ist. |
| `red_warning` | `checkout.card_declined` | Die Farbe kann sich ändern. |
| `common.order` (für alles) | `order.page_title`, `order.submit` | „Bestellung“ und „Bestellen“ sind im Deutschen verschiedene Wörter. |

> [!FEHLER]
> Ein Schlüssel für mehrere Bedeutungen zu nutzen, weil das englische Wort gleich ist („Order“, „Open“,
> „Save“), ist der Klassiker. In anderen Sprachen sind es oft verschiedene Wörter oder Formen. Jede Stelle
> mit eigener Bedeutung bekommt einen eigenen Schlüssel.

## Platzhalter statt Verkettung

Satzbau unterscheidet sich zwischen Sprachen. Deshalb gehört **immer der ganze Satz** in den Katalog, mit
[[platzhalter|Platzhaltern]] für variable Teile:

```ts title="Falsch – zerstückelter Satz"
t("welcome") + ", " + name + "!"
```

```json title="Richtig – ganzer Satz mit Platzhalter"
{ "welcome": "Willkommen zurück, {name}!" }
```

Die Syntax der Platzhalter hängt von der Bibliothek ab:

| Werkzeug | Platzhalter |
|---|---|
| ICU MessageFormat, FormatJS | `{name}` |
| i18next | `{{name}}` |
| Laravel | `:name` |

Genauso wichtig: Kein HTML oder CSS mitten im Text. Für Links und Hervorhebungen gibt es eigene Lösungen
(z. B. die `Trans`-Komponente in React, Lektion 10).

## Kontext für Übersetzer:innen

Übersetzer:innen sehen meist nur eine Liste von Texten – ohne deine App. Ob „Home“ ein Menüpunkt oder
eine Adresse ist, wissen sie nicht. Gib ihnen deshalb Kontext mit:

- eine **Beschreibung** („Button im Bezahlschritt“),
- eine **maximale Länge**, falls der Platz knapp ist,
- die **Bedeutung der Platzhalter** („`{name}` = Vorname der angemeldeten Person“),
- wenn möglich einen **Screenshot**.

> [!PRAXIS]
> Viele Teams pflegen die Beschreibungen direkt neben dem Text, etwa in einem eigenen Feld des
> Übersetzungs-Werkzeugs oder in einer zweiten Datei mit denselben Schlüsseln. Das spart Rückfragen und
> verhindert peinliche Übersetzungen.

## Zusammenfassung

- Texte gehören in **Kataloge pro Sprache**, der Code kennt nur Schlüssel und ruft `t()` auf.
- Es gibt **sprechende Schlüssel** und **Quelltext als Schlüssel** – beide haben Vor- und Nachteile.
- Gute Schlüssel beschreiben Ort und Zweck; jede Bedeutung bekommt einen eigenen Schlüssel.
- **Ganze Sätze mit Platzhaltern** statt Verkettung – nur so können Übersetzer:innen umstellen.
- Fehlt ein Text, greift die Fallback-Sprache; fehlt er ganz, macht der sichtbare Schlüssel den Fehler deutlich.
- Kontext (Beschreibung, Länge, Platzhalter) macht Übersetzungen besser.
