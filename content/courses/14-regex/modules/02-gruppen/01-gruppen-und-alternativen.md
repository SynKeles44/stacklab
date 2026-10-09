---
title: Gruppen und Alternativen
summary: Mit runden Klammern fasst du Teile eines Musters zusammen, mit dem senkrechten Strich beschreibst du Entweder-oder – und lernst, warum die Klammern dabei so wichtig sind.
duration: 20
sources:
  - title: MDN – Gruppen und Rückverweise
    url: https://developer.mozilla.org/de/docs/Web/JavaScript/Guide/Regular_expressions/Groups_and_backreferences
  - title: PHP-Handbuch – Alternativen
    url: https://www.php.net/manual/de/regexp.reference.alternation.php
  - title: PHP-Handbuch – Teilmuster (Subpatterns)
    url: https://www.php.net/manual/de/regexp.reference.subpatterns.php
quiz:
  - type: single
    question: "Worauf passt `^ab+$` – im Gegensatz zu `^(ab)+$`?"
    options:
      - "`^ab+$` passt auf „abbb“, `^(ab)+$` auf „ababab“"
      - Beide Muster bedeuten dasselbe
      - "`^ab+$` passt auf „ababab“, `^(ab)+$` auf „abbb“"
    answer: 0
    explanation: Ohne Klammern wirkt `+` nur auf das b. Mit Klammern wiederholt sich die ganze Gruppe „ab“.
  - type: multiple
    question: "Welche Texte passen **vollständig** auf `^(Mo|Di|Mi)-(früh|spät)$`?"
    options: [Mo-früh, Mi-spät, Do-früh, Di-, Di-spät]
    answers: [0, 1, 4]
    explanation: Vor dem Bindestrich muss eine der drei Abkürzungen stehen, danach „früh“ oder „spät“. „Do“ ist keine Alternative, und „Di-“ fehlt der zweite Teil.
  - type: find-bug
    question: Das Muster soll nur die Texte „cat“ oder „dog“ akzeptieren – akzeptiert aber auch „catalog“ und „hotdog“. In welcher Zeile liegt der Fehler?
    language: js
    code: |
      const tiere = ["cat", "dog", "catalog", "hotdog"];
      const muster = /^cat|dog$/;
      const ok = tiere.filter((t) => muster.test(t));
      console.log(ok);
    bug_line: 2
    explanation: "`|` hat die niedrigste Priorität. Das Muster bedeutet „^cat“ **oder** „dog$“. Richtig: `/^(cat|dog)$/` oder `/^(?:cat|dog)$/`."
  - type: cloze
    text: "Eine Gruppe, die nur zusammenfasst und sich nichts merkt, schreibst du als `(___cat|dog)`. Der senkrechte Strich `|` heißt ___."
    blanks:
      - ["?:"]
      - [Alternation, Alternative, Oder, Pipe]
    explanation: "`(?:…)` ist eine nicht-erfassende Gruppe. Der senkrechte Strich trennt Alternativen – „entweder links oder rechts“."
tasks:
  - id: uhrzeit-und-datei
    type: code
    language: js
    title: Uhrzeiten und Bilddateien erkennen
    description: |
      Schreibe zwei Prüffunktionen. Der **ganze** Text muss jeweils passen.

      1. `istUhrzeit(text)` – eine Uhrzeit im 24-Stunden-Format `HH:MM`: Stunden `00` bis `23`, Minuten `00`
         bis `59`. Gültig: `08:15`, `23:59`, `00:00`. Ungültig: `24:00`, `8:15`, `12:60`.
      2. `istBilddatei(text)` – ein Dateiname aus Kleinbuchstaben, Ziffern und Bindestrichen mit der Endung
         `.png`, `.jpg`, `.jpeg` oder `.webp`. Gültig: `logo.png`, `team-foto-2026.jpeg`. Ungültig:
         `logo.gif`, `logo.png.exe`, `.png`.
    starter: |
      function istUhrzeit(text) {
        return /^\d{2}:\d{2}$/.test(text);
      }

      function istBilddatei(text) {
        return /\.png/.test(text);
      }
    tests:
      - name: Gültige Uhrzeiten
        code: |
          assertTrue(istUhrzeit("08:15"))
          assertTrue(istUhrzeit("23:59"))
          assertTrue(istUhrzeit("00:00"))
          assertTrue(istUhrzeit("19:05"))
      - name: Ungültige Uhrzeiten
        code: |
          assertEqual(istUhrzeit("24:00"), false)
          assertEqual(istUhrzeit("8:15"), false)
          assertEqual(istUhrzeit("12:60"), false)
          assertEqual(istUhrzeit(""), false)
      - name: Gültige Bilddateien
        code: |
          assertTrue(istBilddatei("logo.png"))
          assertTrue(istBilddatei("team-foto-2026.jpeg"))
          assertTrue(istBilddatei("banner.jpg"))
          assertTrue(istBilddatei("icon.webp"))
      - name: Ungültige Bilddateien
        code: |
          assertEqual(istBilddatei("logo.gif"), false)
          assertEqual(istBilddatei("logo.png.exe"), false)
          assertEqual(istBilddatei(".png"), false)
          assertEqual(istBilddatei("logo.jpgx"), false)
    hints:
      - "Stunden zerfallen in zwei Fälle: `0` oder `1` gefolgt von einer beliebigen Ziffer – oder `2` gefolgt von `0` bis `3`."
      - "Stunden: `([01]\\d|2[0-3])`, Minuten: `[0-5]\\d`. Für die Endungen: `(png|jpe?g|webp)`."
      - "Vergiss die Anker nicht und klammere die Alternativen ein, sonst gilt `^` nur für die erste."
    solution: |
      ```js
      function istUhrzeit(text) {
        return /^([01]\d|2[0-3]):[0-5]\d$/.test(text);
      }

      function istBilddatei(text) {
        return /^[a-z0-9-]+\.(png|jpe?g|webp)$/.test(text);
      }
      ```
  - id: muster-bauen
    type: order
    title: Ein Muster Schritt für Schritt bauen
    description: |
      Du sollst ein Muster für Kalenderwochen wie `KW 07` oder `KW 52` (Wochen 01 bis 53) entwickeln. Bring
      die Arbeitsschritte in eine sinnvolle Reihenfolge.
    items:
      - Beispiele sammeln, die passen sollen – und solche, die nicht passen dürfen
      - Den festen Teil als Literal schreiben – KW und ein Leerzeichen
      - "Die Zahl in Fälle zerlegen: 0 + Ziffer 1–9, 1–4 + Ziffer, 5 + Ziffer 0–3"
      - Die Fälle mit | in einer Gruppe verbinden
      - Das Muster mit ^ und $ verankern
      - Mit allen gesammelten Beispielen testen
    hints:
      - Bevor du eine einzige Klammer tippst, brauchst du Beispiele – sonst weißt du nicht, wann du fertig bist.
---
Du sollst prüfen, ob ein Text eine Uhrzeit wie `08:15` ist. `\d{2}:\d{2}` passt – aber leider auch auf
`99:99`. Die Stunde hat **zwei Fälle**: `00–19` und `20–23`. Für solche Entweder-oder-Regeln brauchst du zwei
neue Werkzeuge: Gruppen und Alternativen.

## Alternativen mit dem senkrechten Strich

Der senkrechte Strich `|` bedeutet „oder“. Diese Schreibweise heißt [[alternation|Alternation]]:

```js run
const muster = /Katze|Hund|Maus/;
console.log(muster.test("Mein Hund schläft"));   // true
console.log(muster.test("Mein Vogel singt"));    // false
```

Die Engine probiert die Alternativen **von links nach rechts** und nimmt die erste, die an der aktuellen
Stelle passt. Das spielt eine Rolle, wenn sich Alternativen überschneiden:

```js run
console.log("Javascript".match(/Java|Javascript/)[0]);   // "Java"
console.log("Javascript".match(/Javascript|Java/)[0]);   // "Javascript"
```

> [!TIPP]
> Stell bei überlappenden Alternativen die **längere** zuerst, wenn du den längsten Treffer willst.

## Gruppen mit runden Klammern

Runde Klammern fassen Teile eines Musters zu einer [[regex-gruppe|Gruppe]] zusammen. Eine Gruppe verhält
sich wie ein einzelnes Element. Das hat zwei Folgen:

**1. Quantoren wirken auf die ganze Gruppe.**

| Muster | passt vollständig auf |
|---|---|
| `^ab+$` | ab, abb, abbb |
| `^(ab)+$` | ab, abab, ababab |
| `^(ha){2,3}!$` | haha!, hahaha! |

**2. Alternativen bleiben in der Gruppe.**

```js run
const datei = /^bericht\.(pdf|docx)$/;
console.log(datei.test("bericht.pdf"));    // true
console.log(datei.test("bericht.docx"));   // true
console.log(datei.test("bericht.txt"));    // false
```

> [!MERKSATZ]
> Runde Klammern sind der „Kleber“ einer Regex: Was in der Gruppe steht, wiederholt sich gemeinsam und
> bildet einen eigenen Bereich für `|`.

## Die Priorität von |

`|` bindet **am schwächsten** von allen Regex-Bausteinen. Alles links davon ist eine Alternative, alles
rechts davon die andere – bis zur nächsten Klammer.

| Muster | Bedeutung |
|---|---|
| `^cat\|dog$` | „beginnt mit cat“ **oder** „endet mit dog“ |
| `^(cat\|dog)$` | „ist genau cat oder genau dog“ |

```js run
console.log(/^cat|dog$/.test("hotdog"));     // true – endet mit dog
console.log(/^(cat|dog)$/.test("hotdog"));   // false
```

> [!FEHLER]
> **Alternativen ohne Klammern verankern.** `/^jpg|png$/` akzeptiert „jpg-Virus.exe“, weil der Anker `^`
> nur zur ersten Alternative gehört. Klammere Alternativen immer ein, sobald noch etwas davor oder dahinter
> steht.

## Fälle zerlegen: die Uhrzeit

Viele Formate lassen sich nicht mit einer einzigen Klasse beschreiben. Dann zerlegst du sie in **Fälle**
und verbindest sie mit `|`:

| Stunde | Fall | Teilmuster |
|---|---|---|
| 00–19 | `0` oder `1`, dann eine Ziffer | `[01]\d` |
| 20–23 | `2`, dann `0` bis `3` | `2[0-3]` |

```js run
const uhrzeit = /^([01]\d|2[0-3]):[0-5]\d$/;
for (const t of ["08:15", "23:59", "24:00", "12:60"]) {
  console.log(t, uhrzeit.test(t));
}
```

Die Minuten sind einfacher: erste Ziffer `0–5`, zweite beliebig.

> [!PRAXIS]
> Formulare für Termine, Öffnungszeiten oder Lieferfenster prüfen Uhrzeiten oft genau so – zusätzlich
> zum `<input type="time">`, weil Daten auch über eine API ankommen können, ohne je ein Formular zu sehen.

## Gruppen ohne Gedächtnis: (?:…)

Normale Gruppen **merken** sich, welchen Text sie getroffen haben. Das nutzt du in der nächsten Lektion,
um Teile herauszuholen. Brauchst du die Klammern nur zum Zusammenfassen, schreibst du eine
nicht-erfassende Gruppe:

```js run
const muster = /^(?:Mo|Di|Mi|Do|Fr)-(früh|spät)$/;
console.log("Mi-spät".match(muster));   // [ 'Mi-spät', 'spät' ]
```

Nur `(früh|spät)` wird gemerkt. Das hält die Nummerierung der Gruppen übersichtlich und spart der Engine
etwas Arbeit.

## Typische Muster mit Gruppen

Mit Gruppen, Alternativen und Quantoren beschreibst du viele Formate aus dem Alltag:

| Aufgabe | Muster | Idee |
|---|---|---|
| optionale Vorwahl | `^(\+49 )?\d{3,5} \d+$` | ganze Gruppe ist optional |
| IPv4-Form | `^(\d{1,3}\.){3}\d{1,3}$` | Block plus Punkt dreimal wiederholen |
| Wochentag | `^(Mo\|Di\|Mi\|Do\|Fr\|Sa\|So)$` | Alternativen in Klammern |
| Dateiendung | `\.(jpe?g\|png\|webp)$` | Alternativen mit optionalem Zeichen |

Achte bei der IPv4-Form darauf, dass das Muster nur die **Form** prüft: `999.1.1.1` passt ebenfalls.
Wie du Wertebereiche sauber prüfst, lernst du in Modul 4.

> [!TIPP]
> Lies ein Muster mit Gruppen von außen nach innen: erst die Klammern und Quantoren, dann den Inhalt
> jeder Gruppe. So erkennst du schnell, welcher Teil sich wiederholt und welcher optional ist.

## Zusammenfassung

- `|` trennt Alternativen; die Engine probiert sie von links nach rechts.
- Runde Klammern bilden eine Gruppe: Quantoren wirken auf die ganze Gruppe.
- `|` bindet am schwächsten – klammere Alternativen ein, sobald Anker oder weitere Teile dazukommen.
- Komplexe Formate wie Uhrzeiten zerlegst du in Fälle: `([01]\d|2[0-3])`.
- `(?:…)` gruppiert, ohne sich den Treffer zu merken.
