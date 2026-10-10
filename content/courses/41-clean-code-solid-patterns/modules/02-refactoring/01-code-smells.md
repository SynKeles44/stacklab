---
title: Code Smells erkennen
summary: Die häufigsten Warnzeichen in Code – von der langen Funktion bis zur Gottklasse – und welches Refactoring jeweils hilft.
duration: 20
sources:
  - title: Refactoring-Katalog von Martin Fowler
    url: https://refactoring.com/catalog/
  - title: Martin Fowler – CodeSmell
    url: https://martinfowler.com/bliki/CodeSmell.html
  - title: TypeScript Handbook – Object Types
    url: https://www.typescriptlang.org/docs/handbook/2/objects.html
quiz:
  - type: single
    question: Was ist ein Code Smell?
    options:
      - Ein Fehler, der das Programm zum Absturz bringt.
      - Ein Warnzeichen im Code, das auf ein tieferes Entwurfsproblem hindeuten kann.
      - Ein Verstoß gegen die Einrückungsregeln.
      - Code, der von einer KI geschrieben wurde.
    answer: 1
    explanation: Ein Smell ist ein Hinweis, kein Beweis. Der Code funktioniert – aber er ist schwer zu ändern. Ob wirklich ein Problem dahintersteckt, entscheidest du im Einzelfall.
  - type: match
    question: Ordne jedem Smell das Refactoring zu, das meist hilft.
    pairs:
      - { left: "Lange Funktion", right: "Extract Function" }
      - { left: "Lange Parameterliste", right: "Parameter-Objekt einführen" }
      - { left: "Duplizierter Code", right: "Gemeinsamen Teil in eine Funktion ziehen" }
      - { left: "switch über einen Typ an vielen Stellen", right: "Bedingung durch Polymorphie ersetzen" }
    explanation: Zu jedem Smell gibt es im Refactoring-Katalog eine Handvoll typischer Gegenmittel. Diese vier sind die häufigsten.
  - type: find-bug
    question: Welche Zeile ist ein Beispiel für Feature Envy?
    language: php
    code: |
      final class Rechnung
      {
          public function summe(Warenkorb $korb): int
          {
              return $korb->positionen()->menge() * $korb->positionen()->preis() - $korb->rabatt();
          }
      }
    bug_line: 5
    explanation: Die Methode greift fast nur auf Daten des Warenkorbs zu. Sie „beneidet“ die andere Klasse – die Rechnung gehört eigentlich als `$korb->summe()` in den Warenkorb.
  - type: multiple
    question: Welche Aussagen über Primitive Obsession stimmen?
    options:
      - Fachliche Werte wie Geldbeträge oder E-Mail-Adressen werden als nackte Strings oder Zahlen herumgereicht.
      - Die Prüfung, ob ein Wert gültig ist, steht dann oft an vielen Stellen verteilt.
      - Das Gegenmittel ist ein kleines Objekt mit Typ und Prüfung, etwa ein Value Object.
      - Primitive Datentypen sollte man grundsätzlich nie benutzen.
    answers: [0, 1, 2]
    explanation: Zahlen und Strings sind völlig in Ordnung. Problematisch wird es, wenn ein fachliches Konzept mit Regeln (Währung, Format, Bereich) nur als nackter Wert existiert.
tasks:
  - id: smells-zuordnen
    type: dragdrop
    title: Welcher Smell ist das?
    description: Lies die Beschreibungen aus einem Code-Review und ordne jede dem passenden Code Smell zu.
    targets:
      - { id: lang, label: Lange Funktion }
      - { id: params, label: Lange Parameterliste }
      - { id: dupli, label: Duplizierter Code }
      - { id: gott, label: Gottklasse }
      - { id: schrot, label: Schrotflinten-Chirurgie }
    items:
      - { label: "erstelleNutzer($vorname, $nachname, $strasse, $plz, $ort, $land, $telefon)", target: params }
      - { label: "Die Methode importiere() hat 240 Zeilen und drei verschachtelte Schleifen.", target: lang }
      - { label: "Dieselbe Prüfung der Postleitzahl steht in vier Controllern.", target: dupli }
      - { label: "Die Klasse ShopManager hat 70 Methoden – von Login bis PDF-Erzeugung.", target: gott }
      - { label: "Für einen neuen Steuersatz musst du elf Dateien anfassen.", target: schrot }
    hints:
      - Eine Gottklasse weiß und kann zu viel. Schrotflinten-Chirurgie heißt, dass eine Änderung viele kleine Treffer an verstreuten Stellen braucht.
  - id: parameter-objekt
    type: code
    language: ts
    title: Lange Parameterliste durch ein Parameter-Objekt ersetzen
    description: |
      `adresszeile` bekommt fünf einzelne Strings – beim Aufruf verwechselt man leicht Postleitzahl und Ort.
      Führe ein **Parameter-Objekt** ein:

      1. Lege einen Typ `Adresse` mit den Feldern `strasse`, `hausnummer`, `plz`, `ort` und dem optionalen
         Feld `zusatz` an.
      2. `adresszeile(adresse: Adresse): string` liefert `"Musterweg 5, 12345 Beispielstadt"`.
      3. Ist ein `zusatz` gesetzt und nicht leer, steht er in Klammern hinter der Hausnummer:
         `"Musterweg 5 (Hinterhaus), 12345 Beispielstadt"`.
    starter: |
      function adresszeile(strasse: string, hausnummer: string, plz: string, ort: string, zusatz: string): string {
        const teil = zusatz !== '' ? strasse + ' ' + hausnummer + ' (' + zusatz + ')' : strasse + ' ' + hausnummer;
        return teil + ', ' + plz + ' ' + ort;
      }
    tests:
      - name: Normale Adresse
        code: "assertEqual(adresszeile({ strasse: 'Musterweg', hausnummer: '5', plz: '12345', ort: 'Beispielstadt' }), 'Musterweg 5, 12345 Beispielstadt')"
      - name: Mit Zusatz
        code: "assertEqual(adresszeile({ strasse: 'Musterweg', hausnummer: '5', plz: '12345', ort: 'Beispielstadt', zusatz: 'Hinterhaus' }), 'Musterweg 5 (Hinterhaus), 12345 Beispielstadt')"
      - name: Leerer Zusatz zählt wie kein Zusatz
        code: "assertEqual(adresszeile({ strasse: 'Am Hang', hausnummer: '1a', plz: '01234', ort: 'Dorf', zusatz: '' }), 'Am Hang 1a, 01234 Dorf')"
      - name: Die Funktion erwartet nur noch einen Parameter
        code: assertEqual(adresszeile.length, 1)
    hints:
      - "`type Adresse = { strasse: string; hausnummer: string; plz: string; ort: string; zusatz?: string };`"
      - "Mit Destrukturierung bleibt der Funktionskörper kurz: `const { strasse, hausnummer, plz, ort, zusatz } = adresse;`"
    solution: |
      type Adresse = {
        strasse: string;
        hausnummer: string;
        plz: string;
        ort: string;
        zusatz?: string;
      };

      function adresszeile(adresse: Adresse): string {
        const { strasse, hausnummer, plz, ort, zusatz } = adresse;
        const hausteil = zusatz ? `${strasse} ${hausnummer} (${zusatz})` : `${strasse} ${hausnummer}`;
        return `${hausteil}, ${plz} ${ort}`;
      }
---
Ein erfahrener Kollege überfliegt deinen Pull Request und sagt: „Hier riecht was.“ Er hat noch keine Zeile
im Detail gelesen – aber eine Methode mit 200 Zeilen und sieben Parametern verrät ihm genug. Solche
Warnzeichen heißen [[code-smell|Code Smells]], und du lernst in dieser Lektion, sie selbst zu riechen.

## Was ein Code Smell ist

Ein Code Smell ist ein **Hinweis** auf ein Entwurfsproblem. Der Code läuft – Tests sind grün, Kund:innen
merken nichts. Aber jede Änderung wird mühsamer, als sie sein müsste.

Wichtig: Ein Smell ist **kein Beweis**. Eine lange Funktion kann in Ordnung sein, wenn sie eine einfache,
lineare Liste abarbeitet. Der Smell sagt nur: „Schau hier genauer hin.“

Zu fast jedem Smell gibt es ein passendes [[refactoring|Refactoring]] – einen benannten, kleinen Umbau, der
das Verhalten nicht ändert. Die Namen stammen aus einem Katalog, den viele Entwickler:innen kennen. Wenn du
im Review „Extract Function“ schreibst, weiß dein Team sofort, was gemeint ist.

> [!MERKSATZ]
> Ein Code Smell ist ein Warnzeichen, keine Regelverletzung. Er beantwortet nicht „Ist der Code falsch?“,
> sondern „Wird der Code teuer zu ändern?“.

## Smells in Funktionen

| Smell | Woran du ihn erkennst | Gegenmittel |
|---|---|---|
| Lange Funktion | Du musst scrollen, sie braucht Kommentare als Zwischenüberschriften | [[extract-function|Extract Function]] |
| Lange Parameterliste | Mehr als drei, vier Parameter, Reihenfolge leicht zu verwechseln | [[parameter-objekt|Parameter-Objekt]] |
| Flag-Argument | `speichere($daten, true)` – was bedeutet `true`? | Zwei Funktionen mit klaren Namen |
| Duplizierter Code | Dieselben Zeilen an mehreren Stellen | Gemeinsamen Teil herausziehen |

Ein Flag-Argument sieht harmlos aus, schaltet aber meist zwischen zwei Verhaltensweisen um:

```php
// vorher: Was heißt true?
$rechnung->drucke(true);

// nachher: Der Name sagt es
$rechnung->druckeMitLogo();
$rechnung->druckeOhneLogo();
```

Die Kommentare als Zwischenüberschrift sind übrigens ein besonders guter Hinweis: `// Rabatt berechnen`
mitten in einer Funktion ist fast immer ein Name für eine Funktion, die herausgezogen werden möchte.

## Smells zwischen Klassen

Manche Smells siehst du erst, wenn du mehrere Klassen nebeneinander betrachtest:

- **[[god-class|Gottklasse]]:** Eine Klasse wie `ShopManager` kennt Datenbank, Mails, PDFs und Preise. Jede
  Änderung landet dort, jede:r im Team arbeitet in derselben Datei.
- **[[feature-envy|Feature Envy]]:** Eine Methode benutzt fast nur Daten einer *anderen* Klasse. Sie gehört
  vermutlich dorthin.
- **[[schrotflinten-chirurgie|Schrotflinten-Chirurgie]]:** Für eine fachliche Änderung musst du viele
  verstreute Stellen anfassen. Das Wissen ist zerstreut statt an einem Ort.
- **switch über einen Typ:** Dieselbe Fallunterscheidung `match ($kunde->typ)` steht an fünf Stellen.
  Kommt ein Typ dazu, vergisst man garantiert eine.

```ts
// Feature Envy: versandkosten() interessiert sich nur für den Warenkorb
function versandkosten(korb: Warenkorb): number {
  return korb.gewichtKg() > 30 && !korb.istAbholung() ? 1990 : 490;
}
// besser als Methode des Warenkorbs: korb.versandkosten()
```

## Primitive Obsession

[[primitive-obsession|Primitive Obsession]] heißt: Ein fachlicher Wert wird als nackter String oder als Zahl
herumgereicht, obwohl er Regeln hat.

```php
function ueberweise(int $betrag, string $waehrung, string $iban): void { /* … */ }
```

Ist `$betrag` in Euro oder Cent? Ist die IBAN schon geprüft? Jede Funktion, die diese Werte bekommt, muss
die Prüfung wiederholen – oder hofft, dass es jemand anderes getan hat.

Das Gegenmittel ist ein kleines Objekt, das den Wert **und** seine Regeln bündelt, etwa `Geld` oder `Iban`.
Solche [[value-object|Value Objects]] lernst du im Modul zu Entwurfsmustern genauer kennen.

> [!FEHLER]
> **Alle Smells auf einmal beseitigen wollen.** Wer in einem Pull Request eine Gottklasse zerlegt, Namen
> ändert und Duplikate entfernt, erzeugt einen Diff, den niemand prüfen kann. Kümmere dich um den Smell,
> der deiner aktuellen Änderung im Weg steht.

> [!PRAXIS]
> Viele Smells findet ein Werkzeug für dich: [[statische-analyse|Statische Analyse]] meldet zu lange
> Methoden oder zu viele Parameter, und PhpStorm markiert duplizierten Code. Die Entscheidung, ob und wie
> du umbaust, bleibt aber bei dir.

## Zusammenfassung

- Ein Code Smell ist ein Warnzeichen für schwer änderbaren Code, kein Beweis für einen Fehler.
- In Funktionen: lange Funktion, lange Parameterliste, Flag-Argument, duplizierter Code.
- Zwischen Klassen: Gottklasse, Feature Envy, Schrotflinten-Chirurgie, wiederholtes switch über Typen.
- Primitive Obsession: Fachliche Werte mit Regeln verdienen ein eigenes kleines Objekt.
- Jeder Smell hat ein benanntes Gegenmittel im Refactoring-Katalog.
- Beseitige Smells gezielt dort, wo sie deiner aktuellen Arbeit im Weg stehen.
