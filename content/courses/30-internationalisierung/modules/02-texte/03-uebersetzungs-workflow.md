---
title: Der Übersetzungs-Workflow
summary: Dateiformate, Extraktion, fehlende Schlüssel und die Zusammenarbeit mit Übersetzer:innen – wie Texte zuverlässig in alle Sprachen kommen.
duration: 25
sources:
  - title: i18next-cli (offizielles Werkzeug für Extraktion und Status)
    url: https://github.com/i18next/i18next-cli
  - title: FormatJS – Message Extraction
    url: https://formatjs.github.io/docs/getting-started/message-extraction/
  - title: GNU gettext – PO Files
    url: https://www.gnu.org/software/gettext/manual/html_node/PO-Files.html
  - title: jq Manual
    url: https://jqlang.org/manual/
quiz:
  - type: single
    question: Was ist die Ausgangssprache (Source Language) im Übersetzungs-Workflow?
    options:
      - Die Sprache, in der Entwickler:innen die Texte zuerst schreiben und aus der alle anderen übersetzt werden.
      - Die Sprache des Betriebssystems.
      - Die Sprache mit den meisten Nutzer:innen.
      - Englisch – immer.
    answer: 0
    explanation: >
      Der Katalog der Ausgangssprache ist die einzige Quelle der Wahrheit. Neue Schlüssel entstehen dort, alle
      Zielsprachen werden daraus abgeleitet. Das muss nicht Englisch sein.
  - type: multiple
    question: Warum sind dynamisch zusammengebaute Schlüssel wie `t("status." + order.status)` problematisch?
    options:
      - Extraktions-Werkzeuge finden sie nicht und melden sie weder als neu noch als unbenutzt.
      - Sie sind in JavaScript verboten.
      - Ein neuer Status-Wert führt still zu einem fehlenden Text.
      - Sie machen die App langsamer.
    answers: [0, 2]
    explanation: >
      Werkzeuge lesen den Quelltext, ohne ihn auszuführen. Besser ist eine feste Zuordnung, etwa ein Objekt
      `{ paid: t("status.paid"), open: t("status.open") }`, oder ein Kommentar, den das Werkzeug versteht.
  - type: match
    question: Ordne jedem Format den typischen Einsatz zu.
    pairs:
      - { left: "JSON (verschachtelt)", right: "i18next, react-i18next, viele JS-Apps" }
      - { left: "PHP-Array", right: "Laravel lang/de/*.php" }
      - { left: "PO/POT (gettext)", right: "WordPress, Linux-Programme, Python" }
      - { left: "XLIFF", right: "Austausch mit professionellen Übersetzungs-Werkzeugen" }
    explanation: >
      Das Format ist meist von der Bibliothek vorgegeben. Übersetzungs-Werkzeuge können fast alle davon
      lesen und schreiben.
  - type: cloze
    text: "`jq -r 'paths(___) | join(\".\")' de.json` listet alle Schlüssel mit Text als Pfad wie `cart.title`."
    blanks:
      - [scalars]
    explanation: >
      `paths(scalars)` liefert die Pfade zu allen einfachen Werten (Texte, Zahlen), `join(".")` macht daraus
      Punkt-Schlüssel. So vergleichst du Kataloge mit Standard-Werkzeugen.
tasks:
  - id: fehlende-schluessel
    type: terminal
    title: Fehlende Schlüssel mit jq finden
    description: |
      Im Ordner `kataloge` liegen `locales/de.json` (Ausgangssprache) und `locales/en.json`. Die englische
      Datei ist veraltet. Klicke zuerst auf **Aufgabe vorbereiten**.

      1. Schreibe ein ausführbares Skript `fehlende-schluessel.sh`. Aufruf:
         `./fehlende-schluessel.sh QUELLE ZIEL`. Es gibt alle Schlüssel aus QUELLE, die in ZIEL fehlen, als
         Punkt-Pfad aus (einer pro Zeile, sortiert) und endet mit Exit-Code **1**. Fehlt nichts, endet es mit
         Exit-Code **0**.
      2. Führe es für `locales/de.json` und `locales/en.json` aus und ergänze die fehlenden Schlüssel in
         `en.json` mit **englischen** Texten.
      3. Vertausche die Argumente, um veraltete Schlüssel zu finden, die nur noch in `en.json` stehen.
         Entferne sie aus `en.json`.
    workdir: kataloge
    setup: |
      mkdir -p locales
      cat > locales/de.json <<'JSON'
      {
        "cart": {
          "title": "Warenkorb",
          "empty": "Dein Warenkorb ist leer.",
          "items_one": "{{count}} Artikel",
          "items_other": "{{count}} Artikel"
        },
        "checkout": {
          "pay": "Jetzt bezahlen",
          "address": "Lieferadresse"
        }
      }
      JSON
      cat > locales/en.json <<'JSON'
      {
        "cart": {
          "title": "Shopping cart",
          "items_one": "{{count}} item",
          "items_other": "{{count}} items"
        },
        "checkout": {
          "pay": "Pay now"
        },
        "promo": {
          "summer": "Summer sale!"
        }
      }
      JSON
    checks:
      - type: file_exists
        path: fehlende-schluessel.sh
        message: Das Skript fehlende-schluessel.sh fehlt noch.
      - type: command
        run: test -x fehlende-schluessel.sh
        message: Das Skript ist noch nicht ausführbar. Nutze chmod +x fehlende-schluessel.sh.
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX")
          printf '{"a":{"b":"x","c":"y"},"d":"z"}' > "$d/q.json"
          printf '{"a":{"b":"x"},"e":"w"}' > "$d/z.json"
          ./fehlende-schluessel.sh "$d/q.json" "$d/z.json"
          echo "exit=$?"
          rm -rf "$d"
        stdout_matches: "^a\\.c\\s+d\\s+exit=1\\s*$"
        message: "Für eine Testdatei mit fehlenden Schlüsseln soll dein Skript genau die fehlenden Pfade (z. B. a.c und d) ausgeben und mit Exit-Code 1 enden."
      - type: command
        run: ./fehlende-schluessel.sh locales/de.json locales/en.json
        message: In locales/en.json fehlen noch Schlüssel aus de.json – oder dein Skript endet nicht mit Exit-Code 0, wenn alles vorhanden ist.
      - type: command
        run: 'a=$(jq -er .cart.empty locales/en.json) && b=$(jq -er .checkout.address locales/en.json) && [ "$a" != "$(jq -r .cart.empty locales/de.json)" ] && [ "$b" != "$(jq -r .checkout.address locales/de.json)" ] && echo englisch'
        stdout_equals: "englisch"
        message: cart.empty und checkout.address brauchen englische Texte in en.json – nicht die deutschen kopieren.
      - type: command
        run: ./fehlende-schluessel.sh locales/en.json locales/de.json
        message: en.json enthält noch einen veralteten Schlüssel, den es in de.json nicht gibt (promo.summer). Entferne ihn.
    hints:
      - "`jq -r 'paths(scalars) | join(\".\")' locales/de.json | sort` listet alle Schlüssel einer Datei."
      - "`comm -23 <(liste1) <(liste2)` zeigt Zeilen, die nur in der ersten sortierten Liste stehen."
      - "Fehlende Schlüssel ergänzt du z. B. mit `jq '.cart.empty = \"Your cart is empty.\"' locales/en.json > tmp.json && mv tmp.json locales/en.json`, und `del(.promo)` entfernt einen Schlüssel."
    solution: |
      ```bash
      cd kataloge
      cat > fehlende-schluessel.sh <<'SH'
      #!/usr/bin/env bash
      set -euo pipefail
      keys() { jq -r 'paths(scalars) | map(tostring) | join(".")' "$1" | sort; }
      missing=$(comm -23 <(keys "$1") <(keys "$2"))
      if [ -n "$missing" ]; then
        echo "$missing"
        exit 1
      fi
      echo "Alle Schlüssel vorhanden."
      SH
      chmod +x fehlende-schluessel.sh
      ./fehlende-schluessel.sh locales/de.json locales/en.json   # cart.empty, checkout.address
      jq '.cart.empty = "Your cart is empty." | .checkout.address = "Shipping address" | del(.promo)' \
        locales/en.json > locales/en.tmp && mv locales/en.tmp locales/en.json
      ./fehlende-schluessel.sh locales/de.json locales/en.json
      ./fehlende-schluessel.sh locales/en.json locales/de.json
      ```
  - id: workflow-reihenfolge
    type: order
    title: Ein neuer Text auf dem Weg in alle Sprachen
    description: >
      Eine Entwicklerin baut einen neuen Button „Gutschein einlösen“. Bring die Schritte in die Reihenfolge, in
      der sie in einem gut organisierten Team passieren.
    items:
      - "Im Code `t(\"checkout.redeem_voucher\")` schreiben"
      - Das Extraktions-Werkzeug trägt den neuen Schlüssel in den Katalog der Ausgangssprache ein
      - Deutschen Text und Kontext („Button, max. 25 Zeichen“) ergänzen
      - Die CI-Prüfung meldet den Schlüssel in en.json und pl.json als fehlend
      - Übersetzer:innen liefern die Texte über das Übersetzungs-Werkzeug
      - Die Zielkataloge werden ins Repository übernommen und die Prüfung ist grün
    hints:
      - Alles beginnt im Code und endet mit einer grünen Prüfung.
---
Dein Team hat drei Sprachen und zwanzig Entwickler:innen. Jeden Tag entstehen neue Texte. Wer trägt sie in
die Kataloge ein? Woher wissen Übersetzer:innen, was neu ist? Und wie verhinderst du, dass ein Release mit
leeren Buttons auf Polnisch rausgeht? Dafür brauchst du einen **Workflow** – feste Schritte und Werkzeuge.

## Der Lebenszyklus eines Textes

![Der Weg eines Textes: Code, Extraktion, Quellkatalog, Übersetzung, Zielkataloge, Prüfung in CI, Laufzeit](/assets/internationalisierung/uebersetzungs-workflow.svg)

1. **Code:** Jemand schreibt `t("cart.title")`.
2. **Extraktion:** Ein Werkzeug findet den neuen Schlüssel.
3. **Quellkatalog:** Der Text kommt in die Ausgangssprache (z. B. `de.json`).
4. **Übersetzung:** Übersetzer:innen arbeiten mit Kontext.
5. **Zielkataloge:** `en.json`, `pl.json` … werden aktualisiert.
6. **Prüfung:** Die CI meldet fehlende oder kaputte Übersetzungen.
7. **Laufzeit:** Die App zeigt den Text in jeder Sprache.

> [!MERKSATZ]
> Der Katalog der Ausgangssprache ist die einzige Quelle der Wahrheit. Zielsprachen werden nur daraus
> abgeleitet – nie umgekehrt.

## Dateiformate

| Format | Beispiel | Typisch für |
|---|---|---|
| JSON | `{ "cart": { "title": "Warenkorb" } }` | i18next, FormatJS, viele JS-Apps |
| PHP-Array | `return ['title' => 'Warenkorb'];` | Laravel `lang/de/cart.php` |
| PO (gettext) | `msgid "Cart"` / `msgstr "Warenkorb"` | WordPress, Python, Linux |
| XLIFF | XML mit `<source>` und `<target>` | Austausch mit Übersetzungs-Werkzeugen |
| YAML | `cart: { title: Warenkorb }` | Ruby on Rails, Symfony |

Für eine App wählst du ein Format, das deine Bibliothek versteht. Wichtiger als das Format sind feste Regeln:
gleiche Struktur in jeder Sprache, UTF-8, keine Kommentare, die beim Speichern verloren gehen.

## Extraktion: Schlüssel automatisch finden

Niemand pflegt hunderte Schlüssel von Hand. [[string-extraktion|Extraktions-Werkzeuge]] lesen den
Quelltext, finden alle `t("…")`-Aufrufe und gleichen sie mit dem Katalog ab:

```bash title="Beispiele"
npx i18next-cli extract       # i18next: neue Schlüssel in die Kataloge schreiben
npx i18next-cli status de     # wie viel ist übersetzt? Exit-Code ≠ 0 bei Lücken
npx @formatjs/cli extract "src/**/*.tsx" --out-file lang/de.json   # FormatJS
```

Werkzeuge lesen den Code, ohne ihn auszuführen. Deshalb müssen Schlüssel **wörtlich** im Code stehen.

> [!FEHLER]
> `t("status." + order.status)` findet kein Werkzeug. Kommt ein neuer Status dazu, fehlt der Text still.
> Schreib stattdessen jede Variante aus, z. B. `const labels = { paid: t("status.paid"), open: t("status.open") }`.

## Fehlende Schlüssel finden

Fehlende Übersetzungen passieren ständig – jemand fügt einen Text hinzu, die Übersetzung kommt erst morgen.
Drei Schutzschichten helfen:

1. **Fallback zur Laufzeit:** Die App zeigt die Ausgangssprache statt eines leeren Buttons.
2. **Meldung zur Laufzeit:** Fehlende Schlüssel werden im Log oder Fehler-Tracking notiert.
3. **Prüfung vor dem Merge:** Ein Skript vergleicht die Kataloge in der [[ci-pipeline|CI-Pipeline]].

Für JSON-Kataloge reicht dafür schon [[jq]]:

```bash title="Alle Schlüssel als Punkt-Pfad"
jq -r 'paths(scalars) | join(".")' locales/de.json | sort
# cart.empty
# cart.title
# checkout.pay
```

Zwei solche Listen vergleichst du mit `comm` – genau das baust du in der Aufgabe.

## Mit Übersetzer:innen arbeiten

In kleinen Teams übersetzen Kolleg:innen direkt in den Dateien. Ab einigen Sprachen lohnt sich ein
[[tms|Translation-Management-System]] (TMS): eine Web-Oberfläche, in der Übersetzer:innen arbeiten. Typisch:

- Das TMS liest neue Schlüssel aus dem Repository (oder per CLI-Upload).
- Übersetzer:innen sehen Kontext, Screenshots, Längenlimits und die nötigen Pluralformen.
- Ein Übersetzungsspeicher schlägt bereits übersetzte, ähnliche Sätze vor.
- Fertige Übersetzungen kommen als Pull Request zurück.

> [!PRAXIS]
> Bearbeite Zielkataloge nicht gleichzeitig im Repository und im TMS – sonst überschreiben sich Änderungen.
> Viele Teams legen fest: Ausgangssprache im Code, alle Zielsprachen nur im TMS.

## Zusammenfassung

- Texte durchlaufen einen festen Weg: Code → Extraktion → Quellkatalog → Übersetzung → Zielkataloge → Prüfung → Laufzeit.
- Formate wie JSON, PHP-Arrays, PO und XLIFF gibt die Bibliothek vor – feste Regeln sind wichtiger als das Format.
- **Extraktions-Werkzeuge** finden Schlüssel nur, wenn sie wörtlich im Code stehen.
- Fehlende Schlüssel fängst du mit Fallback, Logging und einer **Prüfung in der CI** ab.
- Ein **TMS** organisiert die Arbeit von Übersetzer:innen – mit Kontext, Pluralformen und Übersetzungsspeicher.
