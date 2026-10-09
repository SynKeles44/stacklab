---
title: Dein erstes Programm
summary: Mit console.log Text ausgeben, Kommentare schreiben und eigene Dateien mit node und php im echten Terminal ausführen.
duration: 25
sources:
  - title: MDN – console.log()
    url: https://developer.mozilla.org/en-US/docs/Web/API/console/log_static
  - title: Node.js – Run Node.js scripts from the command line
    url: https://nodejs.org/en/learn/command-line/run-nodejs-scripts-from-the-command-line
  - title: PHP-Handbuch – echo
    url: https://www.php.net/manual/de/function.echo.php
  - title: MDN – Grammatik und Typen (Kommentare)
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#comments
quiz:
  - type: single
    question: "Was gibt dieses Programm aus? `console.log(\"2 + 3\");`"
    options:
      - "5"
      - "2 + 3"
      - Nichts, es gibt einen Fehler.
    answer: 1
    explanation: >
      Alles zwischen Anführungszeichen ist Text. JavaScript rechnet darin nicht, sondern gibt den Text genau so aus.
      Ohne Anführungszeichen – `console.log(2 + 3)` – würde 5 erscheinen.
  - type: find-bug
    question: Dieses Programm startet nicht. In welcher Zeile steckt der Fehler?
    language: js
    code: |
      // Begrüßung ausgeben
      console.log("Hallo!");
      console.log("Schön, dass du da bist);
      console.log("Viel Spaß!");
    bug_line: 3
    explanation: In Zeile 3 fehlt das schließende Anführungszeichen. JavaScript weiß nicht, wo der Text endet, und meldet einen Syntaxfehler.
  - type: cloze
    text: Ein einzeiliger Kommentar beginnt in JavaScript mit ___. In PHP gibst du Text mit dem Befehl ___ aus.
    blanks:
      - ["//"]
      - [echo]
    explanation: "`//` leitet einen Kommentar ein, den der Computer ignoriert. PHP nutzt `echo` statt `console.log`."
  - type: match
    question: Ordne jedem Code seine Ausgabe zu.
    pairs:
      - { left: "console.log(\"7 * 6\");", right: "7 * 6" }
      - { left: "console.log(7 * 6);", right: "42" }
      - { left: "console.log(\"Ergebnis:\", 7 * 6);", right: "Ergebnis: 42" }
      - { left: "// console.log(42);", right: "(keine Ausgabe)" }
    explanation: Text in Anführungszeichen wird wörtlich ausgegeben, Rechnungen ohne Anführungszeichen werden ausgerechnet. Mehrere Werte trennt console.log mit einem Leerzeichen. Auskommentierter Code läuft nicht.
tasks:
  - id: hallo-node
    type: terminal
    title: Dein erstes JavaScript-Programm im Terminal
    description: |
      Jetzt wird es ernst: Du schreibst eine echte Datei und führst sie mit Node.js aus.
      Der Ordner `erstes-programm` ist leer.

      1. Wechsle in den Ordner: `cd erstes-programm` (falls du nicht schon drin bist – `pwd` zeigt dir, wo du bist).
      2. Öffne eine neue Datei mit dem Editor nano: `nano hallo.js`
      3. Schreibe zwei Zeilen hinein:
         - eine Zeile, die `Hallo Welt` ausgibt,
         - eine Zeile, die das Ergebnis von `6 * 7` ausgibt (also ohne Anführungszeichen rechnen lassen).
      4. Speichere mit **Strg+O** und **Enter**, beende nano mit **Strg+X**.
      5. Starte dein Programm mit `node hallo.js`. Du solltest zwei Zeilen sehen: `Hallo Welt` und `42`.
    workdir: erstes-programm
    checks:
      - type: file_exists
        path: hallo.js
        message: Die Datei hallo.js fehlt noch. Lege sie mit `nano hallo.js` an.
      - type: command
        run: node hallo.js
        stdout_matches: "Hallo Welt"
        message: Dein Programm gibt noch nicht „Hallo Welt" aus. Prüfe Schreibweise und Anführungszeichen.
      - type: command
        run: node hallo.js
        stdout_matches: "^42$"
        message: Es fehlt eine Zeile, die genau 42 ausgibt. Schreibe `console.log(6 * 7);` – ohne Anführungszeichen.
      - type: file_contains
        path: hallo.js
        pattern: "6\\s*\\*\\s*7"
        message: Lass JavaScript selbst rechnen – in deinem Code sollte `6 * 7` vorkommen.
    hints:
      - "Für jede Ausgabe brauchst du eine eigene Zeile mit `console.log(…);`."
      - "Text steht in Anführungszeichen: `console.log(\"Hallo Welt\");` – Rechnungen nicht: `console.log(6 * 7);`"
      - Siehst du `SyntaxError`, fehlt meist eine Klammer oder ein Anführungszeichen.
    solution: |
      ```bash
      cd erstes-programm
      nano hallo.js
      ```
      Inhalt von `hallo.js`:
      ```js
      console.log("Hallo Welt");
      console.log(6 * 7);
      ```
      ```bash
      node hallo.js
      ```
  - id: hallo-php
    type: terminal
    title: Das Gleiche in PHP
    description: |
      Im Ordner `erstes-php` liegt bereits eine Datei `hallo.php` – aber sie enthält einen Fehler und gibt
      noch nicht alles aus.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit die Datei angelegt wird.

      1. Wechsle in den Ordner (`cd erstes-php`) und schau dir die Datei an: `cat hallo.php`
      2. Führe sie aus: `php hallo.php` – und lies die Fehlermeldung.
      3. Repariere die Datei mit `nano hallo.php`.
      4. Ergänze eine dritte Ausgabe, die das Ergebnis von `6 * 7` ausgibt (wieder ohne Anführungszeichen).
      5. Prüfe mit `php hallo.php`: Es sollen drei Zeilen erscheinen – `Hallo aus PHP`, `Das ist mein erstes Skript` und `42`.
    workdir: erstes-php
    setup: |
      cat > hallo.php <<'EOF'
      <?php
      // Mein erstes PHP-Skript
      echo "Hallo aus PHP\n";
      echo "Das ist mein erstes Skript\n"
      EOF
    checks:
      - type: command
        run: php -l hallo.php
        message: hallo.php hat noch einen Syntaxfehler. Fehlt am Ende einer Zeile ein Semikolon?
      - type: command
        run: php hallo.php
        stdout_matches: "Hallo aus PHP\\nDas ist mein erstes Skript\\n"
        message: Die ersten beiden Zeilen sollen weiterhin „Hallo aus PHP" und „Das ist mein erstes Skript" lauten – jeweils mit Zeilenumbruch \n.
      - type: command
        run: php hallo.php
        stdout_matches: "^42$"
        message: Als dritte Zeile fehlt noch die 42. Ergänze `echo 6 * 7, "\n";` oder `echo (6 * 7) . "\n";`.
    hints:
      - PHP meldet `Parse error` und eine Zeilennummer. In PHP muss jede Anweisung mit `;` enden.
      - "Für den Zeilenumbruch hängst du `\"\\n\"` an: `echo 6 * 7, \"\\n\";`"
    solution: |
      ```php
      <?php
      // Mein erstes PHP-Skript
      echo "Hallo aus PHP\n";
      echo "Das ist mein erstes Skript\n";
      echo 6 * 7, "\n";
      ```
      Danach `php hallo.php` ausführen.
---

Genug Theorie – jetzt schreibst du dein erstes Programm. Es wird klein sein, aber es ist ein echtes
Programm: Du schreibst Code in eine Datei, startest sie und der Computer tut, was du ihm sagst. Genau so
fangen auch Profis jedes neue Projekt an.

## Text ausgeben mit console.log

Das wichtigste Werkzeug für den Anfang ist [[console-log|`console.log`]]. Alles, was du in die runden
Klammern schreibst, erscheint als Zeile in der Ausgabe.

```js run
console.log("Hallo Welt");
console.log(6 * 7);
console.log("Ergebnis:", 6 * 7);
```

| Code | Ausgabe | Warum |
|---|---|---|
| `console.log("Hallo Welt");` | `Hallo Welt` | Text in Anführungszeichen wird wörtlich ausgegeben |
| `console.log(6 * 7);` | `42` | Ohne Anführungszeichen wird gerechnet |
| `console.log("6 * 7");` | `6 * 7` | In Anführungszeichen ist es nur Text |
| `console.log("Ergebnis:", 6 * 7);` | `Ergebnis: 42` | Mehrere Werte, durch Komma getrennt |

Jede Zeile ist eine [[anweisung|Anweisung]] und endet mit einem Semikolon `;`. JavaScript verzeiht ein
fehlendes Semikolon oft, aber gewöhn es dir trotzdem an.

> [!MERKSATZ]
> Anführungszeichen machen den Unterschied: `"6 * 7"` ist Text, `6 * 7` ist eine Rechnung.

## Kommentare: Notizen für Menschen

Ein [[kommentar|Kommentar]] ist Text im Code, den der Computer überspringt. Damit erklärst du, **warum**
etwas so ist.

```js run
// Einzeiliger Kommentar: Alles ab den zwei Schrägstrichen wird ignoriert.
console.log("Ich laufe");   // auch am Zeilenende möglich

/* Mehrzeiliger Kommentar:
   Alles zwischen diesen Zeichen
   wird übersprungen. */

// console.log("Ich laufe nicht – ich bin auskommentiert");
```

Praktisch: Du kannst eine Zeile vorübergehend „auskommentieren", um sie testweise abzuschalten, ohne sie zu
löschen.

> [!FEHLER]
> Kommentare, die nur wiederholen, was im Code steht – `// gibt Hallo aus` über `console.log("Hallo")` –
> bringen nichts. Gute Kommentare erklären Absichten und Hintergründe, die man im Code nicht sieht.

## Programme als Datei im Terminal starten

Im Browser kannst du kleine Schnipsel ausprobieren. Echte Programme liegen aber in [[datei|Dateien]] und
werden im [[terminal|Terminal]] gestartet. Das Terminal ist ein Fenster, in dem du Befehle tippst statt zu
klicken. Für diese Lektion reichen dir wenige Befehle:

| Befehl | Wirkung |
|---|---|
| `pwd` | Zeigt, in welchem Ordner du gerade bist |
| `ls` | Listet die Dateien im aktuellen Ordner |
| `cd ordnername` | Wechselt in einen Ordner |
| `nano hallo.js` | Öffnet die Datei im Editor nano (Strg+O speichert, Strg+X beendet) |
| `cat hallo.js` | Zeigt den Inhalt einer Datei |
| `node hallo.js` | Führt die Datei mit Node.js aus |

```bash title="Terminal"
$ node hallo.js
Hallo Welt
42
```

Die Endung `.js` sagt allen Werkzeugen: Hier steht JavaScript. Node.js führt die Datei von oben nach
unten aus und beendet sich danach.

## Dasselbe in PHP

In PHP sieht dein erstes Programm etwas anders aus:

```php
<?php
// Jede PHP-Datei beginnt mit <?php
echo "Hallo Welt\n";
echo 6 * 7, "\n";
```

```bash title="Terminal"
$ php hallo.php
Hallo Welt
42
```

| | JavaScript | PHP |
|---|---|---|
| Datei-Endung | `.js` | `.php` |
| Start der Datei | einfach loslegen | `<?php` |
| Ausgabe | `console.log("…")` | `echo "…"` |
| Zeilenumbruch | automatisch | selbst mit `"\n"` anhängen |
| Semikolon | empfohlen | Pflicht |
| Ausführen | `node datei.js` | `php datei.php` |

`\n` ist ein Sonderzeichen für „neue Zeile". `console.log` setzt es automatisch, `echo` nicht.

> [!PRAXIS]
> Kleine Skripte, die man mit `node` oder `php` im Terminal startet, gehören zum Alltag: Daten umwandeln,
> Dateien umbenennen, einen Bericht erzeugen. Viele Werkzeuge, die du später nutzt, sind genau solche
> Kommandozeilen-Programme – im Abschlussprojekt baust du selbst eines.

## Zusammenfassung

- `console.log(…)` gibt Werte aus; Text steht in Anführungszeichen, Rechnungen nicht.
- Anweisungen enden mit `;` und werden von oben nach unten ausgeführt.
- **Kommentare** (`//`, `/* */`) sind Notizen für Menschen und werden ignoriert.
- Programme liegen in Dateien: `node datei.js` startet JavaScript, `php datei.php` startet PHP.
- PHP-Dateien beginnen mit `<?php`, geben mit `echo` aus und brauchen `"\n"` für Zeilenumbrüche.
