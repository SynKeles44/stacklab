---
title: Tabellen, Formulare und Barrierefreiheit
summary: Daten in Tabellen ordnen, Formulare mit Labels, passenden Eingabetypen und Validierung bauen – und dabei an Tastatur und Kontrast denken.
duration: 25
sources:
  - title: MDN – HTML-Tabellen
    url: https://developer.mozilla.org/de/docs/Learn_web_development/Core/Structuring_content/HTML_table_basics
  - title: MDN – Webformulare
    url: https://developer.mozilla.org/de/docs/Learn_web_development/Extensions/Forms
  - title: MDN – Clientseitige Formularvalidierung
    url: https://developer.mozilla.org/de/docs/Learn_web_development/Extensions/Forms/Form_validation
  - title: W3C WAI – Tutorial zu Formularen
    url: https://www.w3.org/WAI/tutorials/forms/
quiz:
  - type: single
    question: Warum braucht jedes Eingabefeld ein `<label>`?
    options:
      - Weil der Browser sonst die Eingabe verweigert.
      - Damit Screenreader ansagen, was einzugeben ist, und ein Klick auf den Text das Feld fokussiert.
      - Damit das Feld automatisch validiert wird.
      - Labels sind optional, ein placeholder reicht völlig.
    answer: 1
    explanation: >
      Das Label ist der Name des Feldes. Über `for`/`id` verknüpft, wird es vorgelesen und vergrößert die
      Klickfläche. Ein placeholder verschwindet beim Tippen und ist kein Ersatz.
  - type: match
    question: Ordne jedem Eingabetyp seinen Zweck zu.
    pairs:
      - { left: "type=\"email\"", right: "E-Mail-Adresse, prüft auf ein @" }
      - { left: "type=\"password\"", right: "Eingabe wird verdeckt" }
      - { left: "type=\"number\"", right: "Nur Zahlen, mit Pfeiltasten" }
      - { left: "type=\"checkbox\"", right: "Ja/Nein-Auswahl zum Ankreuzen" }
      - { left: "type=\"date\"", right: "Datumsauswahl" }
    explanation: Der passende Typ liefert Validierung und – auf Smartphones – die passende Tastatur gratis mit.
  - type: find-bug
    question: Ein Klick auf „E-Mail“ fokussiert das Feld nicht, und der Screenreader sagt nur „Eingabefeld“. Wo liegt der Fehler?
    language: html
    code: |
      <form action="/newsletter" method="post">
        <label for="mail">E-Mail</label>
        <input type="email" id="email" name="email" required>
        <button type="submit">Anmelden</button>
      </form>
    bug_line: 3
    explanation: "`for=\"mail\"` verweist auf eine id, die es nicht gibt. Das Feld heißt `id=\"email\"` – beide Werte müssen exakt übereinstimmen."
  - type: multiple
    question: Welche Attribute lösen eine eingebaute Prüfung im Browser aus, bevor das Formular abgeschickt wird?
    options:
      - required
      - minlength
      - placeholder
      - pattern
      - name
    answers: [0, 1, 3]
    explanation: >
      `required`, `minlength`, `maxlength`, `min`, `max`, `pattern` und der Typ (z. B. `email`) prüft der Browser selbst.
      `placeholder` ist nur ein Beispieltext, `name` bestimmt den Schlüssel beim Absenden.
tasks:
  - id: kontaktformular
    type: terminal
    title: Ein barrierearmes Kontaktformular
    description: |
      Im Ordner `formular` liegt eine `index.html` mit einem leeren `<main>`. Baue darin ein Kontaktformular.

      1. Ein `<form>` mit `action="/kontakt"` und `method="post"`.
      2. Ein Pflichtfeld für den Namen: `<input type="text">` mit `id="name"`, `name="name"` und `required`.
      3. Ein Pflichtfeld für die E-Mail: `<input type="email">` mit `id="email"`, `name="email"` und `required`.
      4. Eine `<textarea>` mit `id="nachricht"`, `name="nachricht"` und `minlength="10"`.
      5. Jedes der drei Felder bekommt ein `<label for="…">`, dessen `for` exakt zur `id` passt.
      6. Ein Absende-Button: `<button type="submit">`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: formular
    setup: |
      cat > index.html <<'EOF'
      <!DOCTYPE html>
      <html lang="de">
        <head>
          <meta charset="utf-8">
          <title>Kontakt</title>
        </head>
        <body>
          <main>
            <h1>Kontakt</h1>
          </main>
        </body>
      </html>
      EOF
    checks:
      - type: file_contains
        path: index.html
        pattern: "<form[\\s>]"
        message: Es gibt noch kein form-Element.
      - type: file_contains
        path: index.html
        pattern: "<form(?=[^>]*action=\"/kontakt\")(?=[^>]*method=\"post\")[^>]*>"
        message: Das form braucht action="/kontakt" und method="post".
      - type: file_contains
        path: index.html
        pattern: "<input(?=[^>]*type=\"text\")(?=[^>]*id=\"name\")(?=[^>]*\\srequired)[^>]*>"
        message: Es fehlt das Pflichtfeld für den Namen (type="text", id="name", required).
      - type: file_contains
        path: index.html
        pattern: "<input(?=[^>]*type=\"email\")(?=[^>]*id=\"email\")(?=[^>]*\\srequired)[^>]*>"
        message: Es fehlt das Pflichtfeld für die E-Mail (type="email", id="email", required).
      - type: file_contains
        path: index.html
        pattern: "<textarea(?=[^>]*id=\"nachricht\")(?=[^>]*minlength=\"10\")[^>]*>"
        message: Es fehlt die textarea mit id="nachricht" und minlength="10".
      - type: command
        run: for id in name email nachricht; do grep -q "<label[^>]*for=\"$id\"" index.html || echo "$id"; done
        stdout_equals: ""
        message: Mindestens ein Feld hat kein label, dessen for-Attribut genau zur id passt (name, email, nachricht).
      - type: file_contains
        path: index.html
        pattern: "<button[^>]*type=\"submit\""
        message: Es fehlt ein Button mit type="submit".
      - type: file_contains
        path: index.html
        pattern: "<main>[\\s\\S]*<form[\\s\\S]*</form>[\\s\\S]*</main>"
        message: Das Formular soll innerhalb von main stehen und mit </form> geschlossen werden.
    hints:
      - "Ein Feld mit Label sieht so aus: `<label for=\"name\">Name</label>` und darunter `<input type=\"text\" id=\"name\" name=\"name\" required>`."
      - "Die textarea hat ein End-Tag: `<textarea id=\"nachricht\" name=\"nachricht\" minlength=\"10\"></textarea>`."
      - Öffne die Datei mit `nano index.html` und schreibe das Formular zwischen `<h1>` und `</main>`.
    solution: |
      ```html
      <main>
        <h1>Kontakt</h1>
        <form action="/kontakt" method="post">
          <label for="name">Name</label>
          <input type="text" id="name" name="name" autocomplete="name" required>

          <label for="email">E-Mail</label>
          <input type="email" id="email" name="email" autocomplete="email" required>

          <label for="nachricht">Nachricht</label>
          <textarea id="nachricht" name="nachricht" minlength="10"></textarea>

          <button type="submit">Absenden</button>
        </form>
      </main>
      ```
  - id: formular-absenden
    type: steps
    title: Was passiert beim Absenden?
    description: Spiel durch, wie der Browser mit einem Formular umgeht, das `required` und `type="email"` nutzt.
    steps:
      - situation: >
          Das Formular hat ein Feld `<input type="email" name="email" required>`. Du lässt es leer und
          klickst auf „Absenden“.
        question: Was passiert?
        options:
          - Der Browser schickt das Formular trotzdem ab.
          - Der Browser stoppt, fokussiert das Feld und zeigt einen Hinweis an.
          - Die Seite stürzt ab.
        answer: 1
        explanation: "`required` verhindert das Absenden. Der Browser springt zum ersten ungültigen Feld und erklärt das Problem."
      - situation: Du tippst `ada.example.com` ein und klickst wieder auf „Absenden“.
        question: Was passiert jetzt?
        options:
          - Das Formular wird abgeschickt, weil das Feld nicht mehr leer ist.
          - Der Browser meldet, dass ein @ fehlt.
        answer: 1
        explanation: "`type=\"email\"` prüft das Format. Ohne @ ist die Adresse ungültig."
      - situation: Du tippst `ada@example.com` ein und schickst ab. Das Formular hat `method="post"` und `action="/kontakt"`.
        question: Was schickt der Browser an den Server?
        options:
          - Einen POST-Request an /kontakt mit `email=ada%40example.com` im Body
          - Einen GET-Request an /kontakt?email=ada
          - Gar nichts – Formulare funktionieren nur mit JavaScript
        answer: 0
        explanation: >
          Der Browser sendet die Felder als Paare aus `name` und Wert. Ohne `name`-Attribut würde ein Feld gar nicht
          mitgeschickt.
      - situation: Ein Angreifer schickt den Request direkt mit `curl` und lässt die E-Mail weg.
        question: Schützt `required` den Server davor?
        options:
          - Ja, required gilt überall.
          - Nein – die Prüfung im Browser ist nur Komfort, der Server muss selbst validieren.
        answer: 1
        explanation: Alles im Browser kann umgangen werden. Serverseitige Validierung ist Pflicht.
---
Ob Stundenplan, Preisliste oder Login: Ein großer Teil des Webs sind Tabellen und Formulare. Beide kann man
so bauen, dass sie für alle funktionieren – oder so, dass sie Menschen mit Tastatur oder Screenreader
aussperren. Der Unterschied sind oft nur ein paar Attribute.

## Tabellen für tabellarische Daten

Tabellen sind für **Daten mit Zeilen und Spalten** da – nicht fürs Seitenlayout (dafür gibt es CSS Grid).

```html
<table>
  <caption>Öffnungszeiten</caption>
  <thead>
    <tr>
      <th scope="col">Tag</th>
      <th scope="col">Von</th>
      <th scope="col">Bis</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Montag</th>
      <td>9:00</td>
      <td>17:00</td>
    </tr>
  </tbody>
</table>
```

| Element | Bedeutung |
|---|---|
| `<caption>` | Überschrift der Tabelle |
| `<thead>`, `<tbody>` | Kopf- und Datenbereich |
| `<tr>` | *table row* – eine Zeile |
| `<th>` | Kopfzelle; `scope="col"` oder `scope="row"` sagt, wofür sie gilt |
| `<td>` | *table data* – normale Datenzelle |

Dank `<th>` und `scope` liest ein Screenreader bei der Zelle „17:00“ mit: „Montag, Bis“. Ohne Kopfzellen
hört man nur eine Zahl.

## Formulare: das Grundprinzip

Ein [[formular|Formular]] sammelt Eingaben und schickt sie an einen [[server|Server]].

```html
<form action="/newsletter" method="post">
  <label for="email">E-Mail-Adresse</label>
  <input type="email" id="email" name="email" autocomplete="email" required>
  <button type="submit">Anmelden</button>
</form>
```

| Attribut | Wirkung |
|---|---|
| `action` | Wohin die Daten geschickt werden |
| `method` | `get` (Daten in der URL) oder `post` (Daten im Body) |
| `name` | Schlüssel, unter dem der Wert gesendet wird – ohne `name` wird nichts gesendet |
| `id` | Eindeutige Kennung, auf die das Label verweist |
| `autocomplete` | Erlaubt dem Browser, bekannte Daten vorzuschlagen |

Das [[label-element|Label]] ist Pflicht. Über `for="email"` ist es mit `id="email"` verbunden: Ein Klick auf
den Text setzt den Cursor ins Feld, und Screenreader lesen „E-Mail-Adresse, Eingabefeld“ vor.

> [!FEHLER]
> **Placeholder statt Label.** `placeholder="E-Mail"` verschwindet, sobald du tippst – danach weiß niemand mehr,
> was ins Feld gehört. Placeholder sind höchstens Beispiele wie `ada@example.com`, nie der Name des Feldes.

## Eingabetypen und Validierung

Das Attribut `type` macht aus einem `<input>` sehr verschiedene Felder:

| Typ | Wofür |
|---|---|
| `text` | Freitext (Standard) |
| `email`, `url`, `tel` | Adressen und Nummern – Smartphones zeigen die passende Tastatur |
| `password` | Verdeckte Eingabe |
| `number`, `range` | Zahlen bzw. Schieberegler |
| `date` | Datumsauswahl |
| `checkbox`, `radio` | Ankreuzen bzw. eine aus mehreren Optionen |

Für längere Texte gibt es `<textarea>`, für Auswahllisten `<select>` mit `<option>`.

Mit Attributen prüft der Browser Eingaben selbst – das nennt man [[formularvalidierung|Formularvalidierung]]:

```html
<input type="text" name="plz" required pattern="[0-9]{5}" title="Fünf Ziffern">
<input type="number" name="alter" min="16" max="120">
<textarea name="nachricht" minlength="10" maxlength="500"></textarea>
```

> [!ACHTUNG]
> Browser-Validierung ist Komfort für Nutzer:innen, **kein Schutz**. Jeder kann Requests direkt an den
> Server schicken. Der Server muss jede Eingabe noch einmal selbst prüfen.

## Barrierefreiheit: Tastatur, Fokus, Kontrast

Viele Menschen bedienen Seiten nur mit der Tastatur. Mit **Tab** springen sie von Link zu Feld zu Button.
Das Element, das gerade Eingaben empfängt, hat den [[fokus|Fokus]].

Drei Grundregeln:

1. **Echte Elemente nutzen.** `<button>` und `<a href>` sind automatisch per Tab erreichbar und per Enter
   bedienbar. Ein `<div onclick="…">` ist es nicht.
2. **Fokus sichtbar lassen.** Der Browser zeichnet einen Fokusrahmen. Entferne ihn nie ersatzlos mit
   `outline: none` – du gestaltest ihn später mit CSS (`:focus-visible`).
3. **Genug [[kontrast|Kontrast]].** Hellgraue Schrift auf Weiß ist für viele unlesbar. Die Richtlinien WCAG
   verlangen für normalen Text ein Kontrastverhältnis von mindestens **4,5 : 1**.

> [!PRAXIS]
> Ein schneller Test, den Profis vor jedem Release machen: Maus weglegen und die Seite nur mit Tab, Shift+Tab,
> Enter und Leertaste bedienen. Wo du nicht weiterkommst oder nicht siehst, wo du bist, ist eine Barriere.

> [!MERKSATZ]
> Barrierefreiheit beginnt mit richtigem HTML: Labels, echte Buttons, sinnvolle Überschriften und Alternativtexte
> lösen die meisten Probleme, bevor eine einzige Zeile CSS existiert.

## Zusammenfassung

- Tabellen nur für Daten: `caption`, `thead`/`tbody`, `tr`, `th` mit `scope`, `td`.
- Ein Formular hat `action` und `method`; jedes Feld braucht `name`, eine `id` und ein `<label for>`.
- Der richtige `type` bringt Validierung und passende Tastaturen mit.
- `required`, `minlength`, `min`/`max` und `pattern` prüfen im Browser – der Server prüft trotzdem.
- Barrierefrei heißt: echte Buttons und Links, sichtbarer Fokus, Kontrast von mindestens 4,5 : 1.
