---
title: Kleine Funktionen und Kommentare, die das Warum erklären
summary: Wie du Funktionen klein und auf einer Abstraktionsebene hältst, verschachtelte ifs mit Guard Clauses glättest und Kommentare schreibst, die wirklich helfen.
duration: 25
sources:
  - title: PHP-Handbuch – Funktionen
    url: https://www.php.net/manual/de/language.functions.php
  - title: PHP-Handbuch – match
    url: https://www.php.net/manual/de/control-structures.match.php
  - title: TypeScript Handbook – More on Functions
    url: https://www.typescriptlang.org/docs/handbook/2/functions.html
  - title: Refactoring-Katalog von Martin Fowler
    url: https://refactoring.com/catalog/
quiz:
  - type: single
    question: Woran erkennst du am ehesten, dass eine Funktion zu viel tut?
    options:
      - Sie hat mehr als zehn Zeilen.
      - Du brauchst das Wort „und“, um zu beschreiben, was sie tut.
      - Sie hat einen Rückgabewert.
      - Sie wird an mehreren Stellen aufgerufen.
    answer: 1
    explanation: „Lädt die Bestellung **und** berechnet den Rabatt **und** schickt die Mail“ – jedes „und“ ist ein Kandidat für eine eigene Funktion. Die Zeilenzahl ist nur ein grober Hinweis.
  - type: multiple
    question: Welche Kommentare sind sinnvoll?
    options:
      - "`// Zähler um eins erhöhen` über `$zaehler++;`"
      - "`// Die API des Zahlungsanbieters liefert Beträge in Cent, nicht in Euro.`"
      - "`// Gerundet wird erst am Ende, sonst weicht die Summe vom Kassenbon ab.`"
      - "`// TODO` ohne weiteren Text"
    answers: [1, 2]
    explanation: Gute Kommentare erklären etwas, das der Code nicht zeigen kann – einen Grund, eine Einschränkung, eine Falle. Der erste Kommentar wiederholt nur den Code, ein leeres TODO hilft niemandem.
  - type: cloze
    text: Eine ___ Clause prüft eine Bedingung am Anfang einer Funktion und verlässt sie sofort mit `return` oder einer Exception. So vermeidest du tiefe ___.
    blanks:
      - [Guard]
      - [Verschachtelung, Verschachtelungen, Einrückung]
    explanation: Guard Clauses behandeln Sonderfälle zuerst. Der Normalfall steht danach ohne zusätzliche Einrückung.
  - type: find-bug
    question: Welche Zeile ist ein Kommentar, der lügt und deshalb gefährlicher ist als gar keiner?
    language: ts
    code: |
      // Gibt den Preis inklusive Steuer zurück.
      function nettopreis(bruttoCent: number): number {
        // Steuersatz kommt aus der Konfiguration.
        return Math.round(bruttoCent / (1 + STEUERSATZ));
      }
    bug_line: 1
    explanation: Die Funktion rechnet den Bruttopreis auf netto zurück – der Kommentar behauptet das Gegenteil. Kommentare veralten, wenn der Code sich ändert und niemand sie anpasst.
tasks:
  - id: guard-clauses
    type: code
    language: php
    title: Verschachtelte ifs mit Guard Clauses glätten
    description: |
      `versandart()` entscheidet, wie ein Paket verschickt wird. Die Logik stimmt, aber die vier Ebenen
      Einrückung machen sie schwer lesbar. Baue die Funktion mit **Guard Clauses** um:

      1. Prüfe die Sonderfälle zuerst und verlasse die Funktion sofort mit `return` oder `throw`.
      2. Ohne Positionen wirfst du eine `InvalidArgumentException`.
      3. Lebensmittel gehen per `kuehlversand`, Pakete über 30 kg per `spedition`, alles andere per `paket`.

      Das Verhalten bleibt genau gleich – nur die Form ändert sich.
    starter: |
      <?php

      declare(strict_types=1);

      function versandart(array $bestellung): string
      {
          if (count($bestellung['positionen']) > 0) {
              if ($bestellung['lebensmittel'] === false) {
                  if ($bestellung['gewichtKg'] > 30) {
                      return 'spedition';
                  } else {
                      return 'paket';
                  }
              } else {
                  return 'kuehlversand';
              }
          } else {
              throw new InvalidArgumentException('Bestellung ohne Positionen');
          }
      }
    tests:
      - name: Normales Paket
        code: "assert_same('paket', versandart(['positionen' => ['Buch'], 'lebensmittel' => false, 'gewichtKg' => 2]));"
      - name: Schweres Paket geht per Spedition
        code: "assert_same('spedition', versandart(['positionen' => ['Schrank'], 'lebensmittel' => false, 'gewichtKg' => 45]));"
      - name: Genau 30 kg sind noch ein Paket
        code: "assert_same('paket', versandart(['positionen' => ['Hanteln'], 'lebensmittel' => false, 'gewichtKg' => 30]));"
      - name: Lebensmittel gehen in den Kühlversand, auch wenn sie schwer sind
        code: "assert_same('kuehlversand', versandart(['positionen' => ['Käse'], 'lebensmittel' => true, 'gewichtKg' => 40]));"
      - name: Leere Bestellung wirft eine Exception
        code: |
          try {
              versandart(['positionen' => [], 'lebensmittel' => false, 'gewichtKg' => 0]);
              assert_true(false, 'Es wurde keine Exception geworfen.');
          } catch (InvalidArgumentException $e) {
              assert_true(true);
          }
      - name: Keine verschachtelten else-Zweige mehr
        code: |
          $quelle = (new ReflectionFunction('versandart'))->getFileName();
          assert_same(0, substr_count((string) file_get_contents($quelle), 'else'), 'Im Code steht noch ein else.');
    hints:
      - "Beginne mit dem Fehlerfall: `if ($bestellung['positionen'] === []) { throw new InvalidArgumentException('…'); }`"
      - "Danach: `if ($bestellung['lebensmittel']) { return 'kuehlversand'; }` – und so weiter. Ein `else` brauchst du nach einem `return` nie."
    solution: |
      <?php

      declare(strict_types=1);

      function versandart(array $bestellung): string
      {
          if ($bestellung['positionen'] === []) {
              throw new InvalidArgumentException('Bestellung ohne Positionen');
          }

          if ($bestellung['lebensmittel']) {
              return 'kuehlversand';
          }

          if ($bestellung['gewichtKg'] > 30) {
              return 'spedition';
          }

          return 'paket';
      }
  - id: kommentare-sortieren
    type: dragdrop
    title: Kommentar behalten oder löschen?
    description: |
      Ein Kollege hat seinen Code großzügig kommentiert. Entscheide für jeden Kommentar, ob er bleiben darf
      (er erklärt ein **Warum** oder eine Falle) oder gelöscht werden sollte (er wiederholt nur den Code
      oder ist toter Code).
    targets:
      - { id: behalten, label: "Behalten – erklärt ein Warum" }
      - { id: loeschen, label: "Löschen – wiederholt den Code oder stört" }
    items:
      - { label: "// Schleife über alle Kunden", target: loeschen }
      - { label: "// Der Zahlungsanbieter sperrt uns nach 5 Anfragen pro Sekunde, daher die Pause.", target: behalten }
      - { label: "// $alteBerechnung = $netto * 1.16;", target: loeschen }
      - { label: "// Rückgabe: true", target: loeschen }
      - { label: "// Reihenfolge wichtig: Rabatt vor Steuer, so verlangt es das Finanzamt.", target: behalten }
      - { label: "// Workaround für einen Fehler in Version 2.3 der Bibliothek, siehe Ticket ABC-123.", target: behalten }
    hints:
      - Frag dich bei jedem Kommentar - Würde ich diese Information auch aus dem Code allein bekommen?
      - Auskommentierter Code gehört gelöscht – die alte Version liegt in der Git-Historie.
---
Du öffnest eine Funktion namens `verarbeite()` und scrollst. Und scrollst. 180 Zeilen später hat sie die
Bestellung geladen, geprüft, Rabatte berechnet, eine Mail verschickt und etwas in eine Datei geschrieben.
Willst du nur den Rabatt ändern, musst du trotzdem alles verstehen. Kleine Funktionen lösen genau das.

## Eine Funktion, eine Aufgabe

Eine gute [[funktion|Funktion]] tut **eine** Sache und tut sie vollständig. Der einfachste Test: Beschreibe
in einem Satz, was sie tut. Brauchst du das Wort „und“, macht sie zu viel.

```php
// vorher: eine Funktion, fünf Aufgaben
function verarbeite(array $bestellung): void { /* 180 Zeilen */ }

// nachher: liest sich wie ein Inhaltsverzeichnis
function verarbeiteBestellung(array $bestellung): void
{
    pruefeBestellung($bestellung);
    $summe = berechneSumme($bestellung['positionen']);
    $summe = rabattAbziehen($bestellung['kundentyp'], $summe);
    versendeBestaetigung($bestellung['email'], $summe);
}
```

Die neue Version kannst du lesen wie eine Zusammenfassung. Willst du den Rabatt ändern, springst du direkt
in `rabattAbziehen()` – den Rest musst du nicht verstehen.

> [!MERKSATZ]
> Eine Funktion ist klein genug, wenn du ihre Aufgabe ohne „und“ beschreiben kannst und ihr Name
> verrät, was drinsteht.

## Eine Abstraktionsebene pro Funktion

Gute Funktionen mischen keine Ebenen. Die [[abstraktionsebene|Abstraktionsebene]] ist die Flughöhe, auf
der Code etwas beschreibt: „Bestellung bestätigen“ ist hoch oben, „String mit Punkt verketten“ ganz unten.

```ts
function bestaetigeBestellung(bestellung: Bestellung): void {
  pruefeLagerbestand(bestellung);                 // hohe Ebene
  const text = 'Danke, ' + bestellung.name + '!'; // plötzlich ganz unten
  mailer.senden(bestellung.email, text);
}
```

Wer das liest, muss ständig zwischen „Was passiert?“ und „Wie genau?“ wechseln. Zieh die Details in eine
eigene Funktion wie `bestaetigungsText(bestellung)` – dann bleibt `bestaetigeBestellung` auf einer Höhe.

Auch die **Parameterliste** verrät viel. Eine Funktion mit sechs Parametern macht meist zu viel – oder
mehrere Werte gehören zusammen in ein Objekt. Dazu mehr im Modul zu Code Smells.

## Guard Clauses statt Pyramiden

Tief verschachtelte `if`-Blöcke zwingen dich, beim Lesen einen Stapel offener Bedingungen im Kopf zu
behalten. Eine [[guard-clause|Guard Clause]] dreht das um: Sie behandelt Sonderfälle **zuerst** und
verlässt die Funktion sofort.

```php
// vorher: der eigentliche Fall steckt drei Ebenen tief
function rabatt(?Kunde $kunde): float
{
    if ($kunde !== null) {
        if ($kunde->istAktiv()) {
            return $kunde->istStammkunde() ? 0.05 : 0.0;
        }
    }
    return 0.0;
}

// nachher: Sonderfälle oben, Normalfall ohne Einrückung
function rabatt(?Kunde $kunde): float
{
    if ($kunde === null || !$kunde->istAktiv()) {
        return 0.0;
    }

    return $kunde->istStammkunde() ? 0.05 : 0.0;
}
```

Nach einem `return` oder `throw` brauchst du nie ein `else` – der Code darunter läuft ohnehin nur, wenn
die Bedingung nicht zutraf.

> [!FEHLER]
> **Zerstückeln um jeden Preis.** Eine Funktion mit drei Zeilen in drei Hilfsfunktionen zu zerlegen,
> macht Code nicht lesbarer, sondern zwingt zum Springen. Zieh nur heraus, was einen eigenen, sinnvollen
> Namen verdient.

## Kommentare: das Warum, nicht das Was

Ein [[kommentar|Kommentar]] soll erklären, was der Code **nicht** zeigen kann. Was der Code tut, sagt er
selbst – vorausgesetzt, die Namen sind gut.

| Schlechter Kommentar | Warum schlecht? | Besser |
|---|---|---|
| `// Summe berechnen` | Wiederholt den Code | Funktion `berechneSumme()` nennen |
| `// $alt = $x * 1.16;` | Toter Code | Löschen, Git merkt ihn sich |
| `// Gibt true zurück` | Veraltet beim nächsten Umbau | Löschen |

Gute Kommentare erklären Gründe, Einschränkungen und Fallen:

```ts
// Der Zahlungsanbieter rundet kaufmännisch pro Position, nicht auf die Gesamtsumme.
// Würden wir erst am Ende runden, wiche unser Betrag um bis zu einen Cent ab.
const summe = positionen.reduce((s, p) => s + Math.round(p.preis * p.menge), 0);
```

Für öffentliche Funktionen in Bibliotheken ergänzen viele Teams einen [[docblock|DocBlock]] mit Typen
und Beispielen – das ist Dokumentation für Nutzer:innen, kein Ersatz für gute Namen.

> [!PRAXIS]
> Bevor du einen Kommentar schreibst, frag dich: Kann ein besserer Name oder eine eigene Funktion den
> Kommentar überflüssig machen? Wenn ja, ändere den Code. Wenn nein, schreib den Kommentar – mit dem
> Warum.

## Zusammenfassung

- Eine Funktion erledigt **eine** Aufgabe; braucht ihre Beschreibung ein „und“, teile sie.
- Halte jede Funktion auf **einer** Abstraktionsebene.
- Guard Clauses behandeln Sonderfälle zuerst und ersparen dir tiefe Verschachtelung und `else`.
- Zerlege nur so weit, wie jedes Stück einen sinnvollen Namen verdient.
- Kommentare erklären das **Warum**, Einschränkungen und Fallen – nie das Was.
- Auskommentierter Code und lügende Kommentare gehören gelöscht.
