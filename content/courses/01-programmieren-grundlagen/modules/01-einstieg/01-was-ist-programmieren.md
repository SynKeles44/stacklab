---
title: Was ist Programmieren?
summary: Was ein Programm wirklich ist, warum Computer so präzise Anweisungen brauchen und welche Rolle Programmiersprachen spielen.
duration: 20
sources:
  - title: MDN – Was ist JavaScript?
    url: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/What_is_JavaScript
  - title: PHP-Handbuch – Was ist PHP?
    url: https://www.php.net/manual/de/introduction.php
  - title: MDN – JavaScript-Leitfaden, Einführung
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Introduction
quiz:
  - type: single
    question: Was ist ein Programm?
    options:
      - Eine Datei, in der Bilder gespeichert sind.
      - Eine genaue Folge von Anweisungen, die ein Computer Schritt für Schritt ausführt.
      - Ein Bauteil im Computer, das rechnet.
      - Eine Website im Internet.
    answer: 1
    explanation: >
      Ein Programm ist eine Folge von Anweisungen. Der Computer führt sie der Reihe nach aus – genau so,
      wie sie dastehen, ohne mitzudenken.
  - type: multiple
    question: Welche Aussagen über Computer stimmen?
    options:
      - Computer sind extrem schnell.
      - Computer erraten, was du eigentlich gemeint hast.
      - Computer führen Anweisungen exakt so aus, wie sie geschrieben sind.
      - Computer brauchen eindeutige Anweisungen ohne Interpretationsspielraum.
    answers: [0, 2, 3]
    explanation: >
      Ein Computer ist schnell, aber „dumm": Er versteht keine Absichten, nur exakte Anweisungen. Ist eine
      Anweisung falsch, führt er sie trotzdem genauso falsch aus.
  - type: cloze
    text: Die Schreibregeln einer Programmiersprache nennt man ___. Text in einer Programmiersprache nennt man ___.
    blanks:
      - [Syntax]
      - [Code, Quellcode, Source Code]
    explanation: Syntax = Grammatik der Sprache. Code oder Quellcode = der Text, den Menschen schreiben.
  - type: match
    question: Ordne jedem Begriff die passende Beschreibung zu.
    pairs:
      - { left: "Programm", right: "Folge von Anweisungen, die ein Computer ausführt" }
      - { left: "Programmiersprache", right: "Formale Sprache, um Anweisungen aufzuschreiben" }
      - { left: "Anweisung", right: "Ein einzelner Schritt, z. B. eine Ausgabe" }
      - { left: "JavaScript", right: "Sprache, die im Browser und mit Node.js läuft" }
    explanation: Mit einer Programmiersprache schreibst du Anweisungen auf; viele Anweisungen zusammen ergeben ein Programm.
tasks:
  - id: roboter-tee
    type: order
    title: Ein Roboter kocht Tee
    description: >
      Ein Roboter versteht nur einfache, eindeutige Schritte und führt sie stur von oben nach unten aus.
      Bring die Anweisungen in eine Reihenfolge, bei der am Ende wirklich eine Tasse Tee entsteht.
    items:
      - Fülle den Wasserkocher mit Wasser.
      - Schalte den Wasserkocher ein.
      - Warte, bis das Wasser kocht.
      - Lege einen Teebeutel in die Tasse.
      - Gieße das heiße Wasser in die Tasse.
      - Warte drei Minuten.
      - Nimm den Teebeutel aus der Tasse.
    hints:
      - Der Teebeutel muss in der Tasse sein, bevor das Wasser hineinkommt.
      - Den Beutel kannst du erst herausnehmen, nachdem der Tee gezogen hat.
  - id: begriffe-sortieren
    type: dragdrop
    title: Sprache, Programm oder Anweisung?
    description: Ordne jedes Beispiel der richtigen Kategorie zu.
    targets:
      - { id: sprache, label: Programmiersprache }
      - { id: programm, label: Programm }
      - { id: anweisung, label: Einzelne Anweisung }
    items:
      - { label: JavaScript, target: sprache }
      - { label: PHP, target: sprache }
      - { label: Ein Webbrowser, target: programm }
      - { label: Ein Texteditor, target: programm }
      - { label: "console.log(\"Hallo\");", target: anweisung }
      - { label: "let punkte = 0;", target: anweisung }
    hints:
      - Eine Programmiersprache ist das Werkzeug, ein Programm das fertige Ergebnis.
      - Eine Anweisung ist ein einzelner Schritt – meist eine Zeile Code.
---

Stell dir vor, du erklärst einer Freundin am Telefon den Weg zu dir nach Hause. Du sagst: „Geh einfach
die Straße runter und dann bei der Bäckerei links." Sie kommt trotzdem an, weil sie mitdenkt: Sie weiß,
welche Straße gemeint ist, und erkennt die Bäckerei auch, wenn das Schild fehlt. Jetzt stell dir vor,
du müsstest denselben Weg einem Roboter erklären, der **nichts** errät. Genau das ist Programmieren.

## Ein Programm ist eine sehr genaue Anleitung

Ein [[programm|Programm]] ist eine Folge von [[anweisung|Anweisungen]], die ein [[computer|Computer]]
nacheinander ausführt. Jede Anweisung ist ein kleiner, eindeutiger Schritt: „Rechne 3 plus 4",
„Zeige den Text *Hallo* an", „Speichere diese Zahl unter dem Namen *punkte*".

Das klingt simpel – und ist es auch. Die Kunst besteht darin, große Aufgaben in so viele kleine,
eindeutige Schritte zu zerlegen, dass ein Computer sie ausführen kann. Eine gute Analogie ist ein
Kochrezept:

| Kochrezept | Programm |
|---|---|
| Zutaten | Daten, mit denen das Programm arbeitet |
| Arbeitsschritte | Anweisungen |
| Reihenfolge der Schritte | Ablauf des Programms |
| „Wenn der Teig zu fest ist, gib Milch dazu" | Entscheidungen (Bedingungen) |
| „Rühre, bis keine Klumpen mehr da sind" | Wiederholungen (Schleifen) |
| Der fertige Kuchen | Das Ergebnis |

Ein Rezept für Menschen darf ungenau sein („eine Prise Salz", „bis es gut aussieht"). Ein Rezept für
einen Computer darf das nicht. Er braucht „5 Gramm Salz" und „30 Minuten bei 180 Grad".

## Computer sind schnell, aber nicht schlau

Ein moderner Computer führt Milliarden einfacher Operationen pro Sekunde aus. Gleichzeitig versteht er
überhaupt nicht, **was** er tut. Er hat keine Ahnung, dass deine Zahl ein Preis ist oder dein Text ein
Name. Er folgt nur den Anweisungen – wortwörtlich.

Daraus folgen zwei Dinge, die du dir für dein ganzes Programmiererleben merken solltest:

1. **Der Computer macht genau das, was du schreibst – nicht das, was du meinst.** Wenn du aus Versehen
   „addiere" statt „multipliziere" schreibst, addiert er. Ohne Rückfrage.
2. **Jeder Fehler im Programm ist ein Fehler in den Anweisungen.** Das ist eigentlich eine gute
   Nachricht: Fehler sind kein Zufall, du kannst sie finden und beheben.

> [!MERKSATZ]
> Ein Programm ist eine exakte Folge von Anweisungen. Der Computer denkt nicht mit – er führt aus.
> Programmieren heißt, so präzise zu denken, dass keine Lücke für Missverständnisse bleibt.

## Warum es Programmiersprachen gibt

Im Inneren versteht ein Computer nur Nullen und Einsen. Für Menschen ist das unlesbar. Deshalb gibt es
[[programmiersprache|Programmiersprachen]]: Sie liegen irgendwo zwischen menschlicher Sprache und dem,
was die Maschine versteht. Sie benutzen englische Wörter wie `if` (wenn), `for` (für) oder `return`
(zurückgeben) und mathematische Zeichen wie `+` oder `=`.

Den Text, den du in einer Programmiersprache schreibst, nennt man [[code|Code]] oder Quellcode. Er
steht in ganz normalen Textdateien. Damit der Computer ihn versteht, muss er noch übersetzt oder
ausgeführt werden – wie das genau funktioniert, lernst du in der nächsten Lektion.

Jede Programmiersprache hat feste Schreibregeln, ihre [[syntax|Syntax]]. Das ist wie Grammatik und
Rechtschreibung – nur viel strenger. Ein Mensch versteht „Hallo wie gehts" auch ohne Komma. Ein Computer
verweigert die Arbeit, wenn auch nur eine Klammer fehlt.

```js
// So sieht eine Zeile JavaScript aus:
console.log("Hallo Welt");
```

```text
// Und so nicht – hier fehlt die schließende Klammer:
console.log("Hallo Welt";
```

Die zweite Zeile führt zu einem Syntaxfehler. Das Programm startet gar nicht erst.

> [!FEHLER]
> Viele Anfänger:innen denken, sie müssten erst eine Programmiersprache „auswendig" können, bevor sie
> loslegen. Das stimmt nicht. Die Syntax schlägst du am Anfang ständig nach – das machen auch Profis.
> Wichtiger ist das **Denken in Schritten**. Die Syntax kommt mit der Übung von allein.

## Zwei Sprachen in diesem Kurs: JavaScript und PHP

Es gibt hunderte Programmiersprachen. Die gute Nachricht: Die grundlegenden Ideen sind fast überall
gleich. Variablen, Bedingungen, Schleifen und Funktionen gibt es in praktisch jeder Sprache. Wer eine
Sprache gut versteht, lernt die zweite viel schneller.

In diesem Kurs lernst du mit [[javascript|JavaScript]]. Dafür gibt es gute Gründe:

- JavaScript läuft in jedem Webbrowser – du kannst sofort loslegen, ohne etwas zu installieren.
- Mit Node.js läuft JavaScript auch im [[terminal|Terminal]] und auf Servern.
- Fast jede Website nutzt JavaScript, deshalb brauchst du es später ohnehin.

Immer wieder siehst du außerdem, wie dasselbe in [[php|PHP]] aussieht. PHP ist eine der wichtigsten
Sprachen für Webserver. Der Vergleich zeigt dir: Die Idee bleibt gleich, nur die Schreibweise ändert sich.

```js
// JavaScript
console.log("Hallo Welt");
```

```php
<?php
// PHP
echo "Hallo Welt\n";
```

Beide Programme machen dasselbe: Sie geben den Text „Hallo Welt" aus. JavaScript benutzt dafür
`console.log`, PHP benutzt `echo`. Beide beenden die Anweisung mit einem Semikolon `;`.

## Was Programmierer:innen den ganzen Tag tun

Vielleicht stellst du dir vor, dass Programmierer:innen den ganzen Tag schnell tippen. In Wirklichkeit
verbringen sie die meiste Zeit mit Denken und Lesen:

| Tätigkeit | Was dahintersteckt |
|---|---|
| Probleme verstehen | Was genau soll das Programm tun? Was kommt rein, was soll rauskommen? |
| Lösungen planen | Das Problem in kleine Schritte zerlegen |
| Code schreiben | Die Schritte in einer Programmiersprache aufschreiben |
| Code lesen | Fremden oder eigenen alten Code verstehen |
| Fehler suchen | Herausfinden, warum das Programm nicht tut, was es soll |
| Testen | Prüfen, ob alles auch in Sonderfällen funktioniert |

Das Schreiben selbst ist oft der kleinste Teil. Deshalb übst du in diesem Kurs mit Code-, Terminal- und
Denkaufgaben – und Fehler sind ausdrücklich erwünscht.

> [!PRAXIS]
> In Teams wird Code viel häufiger gelesen als geschrieben. Eine Zeile, die du heute in fünf Minuten
> tippst, lesen Kolleg:innen in den nächsten Jahren vielleicht hundertmal. Deshalb legen Profis so viel
> Wert auf verständliche Namen und klare Struktur – das lernst du in diesem Kurs von Anfang an mit.

## Zusammenfassung

- Ein **Programm** ist eine exakte Folge von **Anweisungen**, die ein Computer Schritt für Schritt ausführt.
- Computer sind sehr schnell, denken aber nicht mit: Sie tun, was du schreibst, nicht was du meinst.
- **Programmiersprachen** übersetzen zwischen menschlichem Denken und Maschine; der Text heißt **Code**.
- Die **Syntax** sind die strengen Schreibregeln einer Sprache – ein fehlendes Zeichen reicht für einen Fehler.
- Wir lernen mit **JavaScript** und vergleichen immer wieder mit **PHP**; die Konzepte sind fast überall gleich.
- Programmieren besteht vor allem aus Denken, Planen, Lesen und Testen – nicht nur aus Tippen.
