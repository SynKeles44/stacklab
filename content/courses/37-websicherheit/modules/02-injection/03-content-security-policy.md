---
title: Content Security Policy als zweite Verteidigungslinie
summary: Mit einer strikten Content Security Policy und Nonces legst du fest, welche Skripte der Browser ausführen darf – und bremst XSS auch dann, wenn irgendwo ein Escaping fehlt.
duration: 25
sources:
  - title: MDN – Content Security Policy (CSP)
    url: https://developer.mozilla.org/de/docs/Web/HTTP/Guides/CSP
  - title: MDN – Content-Security-Policy Header
    url: https://developer.mozilla.org/de/docs/Web/HTTP/Reference/Headers/Content-Security-Policy
  - title: web.dev – Mitigate XSS with a strict CSP
    url: https://web.dev/articles/strict-csp
  - title: OWASP Cheat Sheet – Content Security Policy
    url: https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html
quiz:
  - type: single
    question: Was ist die Aufgabe einer Content Security Policy?
    options:
      - Sie verschlüsselt die Verbindung zwischen Browser und Server.
      - Sie teilt dem Browser mit, aus welchen Quellen er Skripte, Styles und andere Ressourcen laden und ausführen darf.
      - Sie kodiert alle Ausgaben automatisch.
      - Sie ersetzt die Validierung von Formularen.
    answer: 1
    explanation: >
      Die CSP ist eine Regel für den Browser. Sie behebt keine Lücke im Code, verhindert aber, dass eingeschleuste
      Skripte ausgeführt werden.
  - type: find-bug
    question: Diese CSP soll eingeschleuste Inline-Skripte blockieren. In welcher Zeile wird der Schutz ausgehebelt?
    language: php
    code: |
      $nonce = base64_encode(random_bytes(16));
      header("Content-Security-Policy: "
          . "default-src 'self'; "
          . "script-src 'self' 'unsafe-inline'; "
          . "object-src 'none'; base-uri 'none'");
    bug_line: 4
    explanation: >
      `'unsafe-inline'` erlaubt jedes Inline-Skript – also auch eingeschleuste. Richtig ist
      `script-src 'nonce-…' 'strict-dynamic'`, sodass nur Skripte mit der passenden Nonce laufen.
  - type: multiple
    question: Welche Aussagen über Nonces stimmen?
    options:
      - Die Nonce muss bei jeder Antwort neu und zufällig erzeugt werden.
      - Eine feste Nonce in der Konfiguration reicht aus.
      - Jedes erlaubte `<script>`-Element bekommt das Attribut `nonce` mit demselben Wert wie im Header.
      - Inline-Event-Handler wie `onclick="…"` laufen mit einer Nonce automatisch weiter.
    answers: [0, 2]
    explanation: >
      Eine Nonce ist eine Einmalzahl: Kennt ein Angreifer sie vorher, ist der Schutz weg. Inline-Handler wie
      `onclick` werden von einer strikten CSP blockiert – du ersetzt sie durch `addEventListener`.
  - type: cloze
    text: "Mit dem Header `Content-Security-Policy-___` testest du eine neue CSP: Der Browser meldet Verstöße, blockiert aber nichts."
    blanks:
      - [Report-Only]
    explanation: So führst du eine CSP ohne Risiko ein und siehst in der Konsole oder per Report, was noch angepasst werden muss.
tasks:
  - id: csp-mit-nonce
    type: code
    language: php
    title: Eine strikte CSP mit Nonce bauen
    description: |
      Schreibe drei Funktionen für eine strikte CSP:

      1. `neueNonce(): string` – 16 zufällige Bytes aus `random_bytes()`, Base64-kodiert (ergibt 24 Zeichen).
      2. `cspHeader(string $nonce): string` – liefert genau diesen Header-Wert (ohne den Namen `Content-Security-Policy:`):
         `script-src 'nonce-NONCE' 'strict-dynamic'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'`
      3. `scriptTag(string $src, string $nonce): string` – liefert `<script src="SRC" nonce="NONCE"></script>`.
         Beide Werte werden mit `htmlspecialchars(…, ENT_QUOTES)` kodiert.
    starter: |
      <?php
      declare(strict_types=1);

      function neueNonce(): string
      {
          return 'abc';
      }

      function cspHeader(string $nonce): string
      {
          return "script-src 'self' 'unsafe-inline'";
      }

      function scriptTag(string $src, string $nonce): string
      {
          return '<script src="' . $src . '"></script>';
      }
    tests:
      - name: Header mit Nonce
        code: |
          assert_same("script-src 'nonce-r4nd0m' 'strict-dynamic'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'", cspHeader('r4nd0m'));
      - name: Script-Tag mit Nonce
        code: |
          assert_same('<script src="/js/app.js" nonce="r4nd0m"></script>', scriptTag('/js/app.js', 'r4nd0m'));
      - name: Nonce ist zufällig und 24 Zeichen lang
        code: |
          $a = neueNonce();
          $b = neueNonce();
          assert_same(24, strlen($a));
          assert_true($a !== $b);
          assert_same(16, strlen(base64_decode($a, true)));
      - name: Sonderzeichen im src werden kodiert
        code: |
          assert_same('<script src="/x.js?&quot;&gt;&lt;b&gt;" nonce="n"></script>', scriptTag('/x.js?"><b>', 'n'));
    hints:
      - "`base64_encode(random_bytes(16))` erzeugt eine sichere Nonce."
      - "Im Header steht die Nonce in einfachen Anführungszeichen mit Präfix: `'nonce-' . $nonce`."
    solution: |
      <?php
      declare(strict_types=1);

      function neueNonce(): string
      {
          return base64_encode(random_bytes(16));
      }

      function cspHeader(string $nonce): string
      {
          return "script-src 'nonce-{$nonce}' 'strict-dynamic'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'";
      }

      function scriptTag(string $src, string $nonce): string
      {
          $e = fn (string $v): string => htmlspecialchars($v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

          return '<script src="' . $e($src) . '" nonce="' . $e($nonce) . '"></script>';
      }
  - id: direktiven-zuordnen
    type: dragdrop
    title: Welche Direktive regelt was?
    description: Ordne jede CSP-Direktive ihrer Aufgabe zu.
    targets:
      - { id: skripte, label: "Welche Skripte ausgeführt werden" }
      - { id: rahmen, label: "Wer die Seite in einem iframe einbetten darf" }
      - { id: basis, label: "Welche URL im <base>-Tag stehen darf" }
      - { id: plugins, label: "Ob Plugins über <object>/<embed> laden" }
      - { id: verbindungen, label: "Wohin fetch() und WebSockets verbinden dürfen" }
    items:
      - { label: "script-src", target: skripte }
      - { label: "frame-ancestors", target: rahmen }
      - { label: "base-uri", target: basis }
      - { label: "object-src", target: plugins }
      - { label: "connect-src", target: verbindungen }
---
Trotz aller Sorgfalt rutscht in einem großen Projekt irgendwann ein `{!! $wert !!}` oder ein `innerHTML` durch.
Ein Angreifer schleust `<script>` ein – doch der Browser weigert sich, es auszuführen. In der Konsole steht nur:
„Refused to execute inline script because it violates the following Content Security Policy directive“.

## Was eine CSP ist

Die [[content-security-policy|Content Security Policy]] (CSP) ist ein HTTP-Header, mit dem der Server dem Browser
eine Hausordnung mitgibt: Welche Skripte dürfen laufen? Von wo dürfen Bilder, Styles und Verbindungen kommen?

```text
Content-Security-Policy: script-src 'self'; object-src 'none'
```

Sie ist eine Schicht von [[defense-in-depth|Defense in Depth]]: Output-Encoding verhindert XSS, die CSP verhindert,
dass ein durchgerutschtes XSS Schaden anrichtet.

> [!MERKSATZ]
> Eine CSP ersetzt kein Escaping. Sie ist der Sicherheitsgurt, nicht die Bremse.

## Direktiven und Quellen

Eine CSP besteht aus [[csp-direktive|Direktiven]], getrennt durch Semikolons. Jede Direktive nennt erlaubte
Quellen.

| Direktive | Regelt |
|---|---|
| `default-src` | Rückfallwert für alle Ressourcentypen ohne eigene Direktive |
| `script-src` | JavaScript |
| `style-src`, `img-src`, `font-src` | CSS, Bilder, Schriften |
| `connect-src` | `fetch()`, XHR, WebSockets |
| `object-src` | Plugins über `<object>` und `<embed>` – fast immer `'none'` |
| `base-uri` | erlaubte URL im `<base>`-Tag |
| `frame-ancestors` | wer die Seite einbetten darf (gegen Clickjacking) |
| `form-action` | wohin Formulare senden dürfen |

Wichtige Quellangaben: `'self'` (eigener Origin), `'none'` (nichts), `https://cdn.example.com` (ein Host) – und
die gefährlichen Ausnahmen `'unsafe-inline'` und `'unsafe-eval'`, die den Schutz praktisch abschalten.

## Strikte CSP mit Nonce

Allowlists von Hosts lassen sich oft umgehen, etwa über alte Bibliotheken auf einem erlaubten CDN. Empfohlen
ist deshalb eine **strikte CSP** mit [[nonce|Nonce]]: einer Zufallszahl, die bei jeder Antwort neu entsteht.

```php
$nonce = base64_encode(random_bytes(16));

header("Content-Security-Policy: script-src 'nonce-{$nonce}' 'strict-dynamic'; "
    . "object-src 'none'; base-uri 'none'");
```

```html
<script nonce="<?= $nonce ?>" src="/js/app.js"></script>
```

- Nur Skripte mit der richtigen Nonce laufen. Ein eingeschleustes `<script>` kennt sie nicht.
- `'strict-dynamic'` erlaubt Skripten mit Nonce, weitere Skripte nachzuladen.
- Inline-Handler wie `onclick="…"` und `javascript:`-Links werden blockiert.

> [!FEHLER]
> Eine feste Nonce in der `.env` oder im Template-Cache. Wer die Seite einmal abruft, kennt sie – und kann sie in
> seinem eingeschleusten Skript mitschicken. Die Nonce entsteht **pro Antwort** neu.

## Einführen ohne Ausfall

Eine CSP in eine bestehende App einzubauen, bricht oft etwas: Inline-Skripte, `onclick`-Attribute, Analytics.
Darum gehst du in drei Schritten vor:

1. **Report-Only**: Sende `Content-Security-Policy-Report-Only` mit der geplanten Policy. Der Browser meldet
   Verstöße in der DevTools-Konsole, blockiert aber nichts.
2. **Aufräumen**: Inline-Handler durch `addEventListener` ersetzen, Inline-Skripte mit Nonce versehen.
3. **Scharf schalten**: Header in `Content-Security-Policy` umbenennen.

```js
// statt <button onclick="speichern()">
document.querySelector('#speichern').addEventListener('click', speichern)
```

> [!PRAXIS]
> Mit der Direktive `report-to` schicken Browser Verstöße als JSON an einen Endpunkt deiner App. So siehst du
> nach dem Scharfschalten, ob Nutzer auf blockierte Inhalte stoßen – oder ob jemand gerade XSS ausprobiert.

Eine weitere Schutzschicht gegen DOM-based XSS sind [[trusted-types|Trusted Types]]
(`require-trusted-types-for 'script'`): Gefährliche Senken wie `innerHTML` akzeptieren dann nur noch geprüfte
Werte. Details findest du auf [MDN](https://developer.mozilla.org/de/docs/Web/API/Trusted_Types_API).

## Zusammenfassung

- Die **CSP** ist ein Header, der dem Browser erlaubte Quellen für Skripte und andere Ressourcen vorgibt.
- Sie ergänzt Output-Encoding, ersetzt es aber nicht.
- Empfohlen: `script-src 'nonce-…' 'strict-dynamic'; object-src 'none'; base-uri 'none'`.
- Die **Nonce** ist pro Antwort neu und zufällig; Inline-Handler werden blockiert.
- Einführung mit **Report-Only**, dann aufräumen, dann scharf schalten.
