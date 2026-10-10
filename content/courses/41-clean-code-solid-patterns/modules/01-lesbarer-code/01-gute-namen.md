---
title: Gute Namen und keine magischen Zahlen
summary: Warum lesbarer Code Geld spart, wie Namen Absicht zeigen und wie du magische Zahlen durch benannte Konstanten ersetzt.
duration: 20
sources:
  - title: PHP-Handbuch – Konstanten
    url: https://www.php.net/manual/de/language.constants.php
  - title: PHP-Handbuch – Aufzählungen (Enums)
    url: https://www.php.net/manual/de/language.enumerations.php
  - title: TypeScript Handbook – Everyday Types
    url: https://www.typescriptlang.org/docs/handbook/2/everyday-types.html
  - title: PER Coding Style 3.0
    url: https://www.php-fig.org/per/coding-style/
quiz:
  - type: single
    question: Welcher Name für eine Variable, die die Anzahl der Tage seit der letzten Anmeldung speichert, ist am besten?
    options:
      - "$d"
      - "$days"
      - "$tageSeitLetzterAnmeldung"
      - "$data"
    answer: 2
    explanation: Der Name sagt, **was** gezählt wird und **wovon**. `$d` und `$data` sagen gar nichts, `$days` lässt offen, welche Tage gemeint sind.
  - type: multiple
    question: Welche Aussagen über magische Zahlen stimmen?
    options:
      - Eine magische Zahl ist ein Zahlenwert im Code, dessen Bedeutung man erraten muss.
      - "Die Zahl 0 in `count($liste) === 0` ist eine magische Zahl, die du ersetzen musst."
      - Eine benannte Konstante macht die Bedeutung sichtbar und ändert sich nur an einer Stelle.
      - Magische Zahlen machen den Code schneller.
    answers: [0, 2]
    explanation: "Selbsterklärende Werte wie 0, 1 oder 100 in einer Prozentrechnung sind kein Problem. Gefährlich sind Werte wie `0.19` oder `86400`, deren Sinn man nur kennt, wenn man ihn schon weiß. Schneller wird Code durch magische Zahlen nicht."
  - type: find-bug
    question: Die Funktion soll prüfen, ob eine Bestellung versandkostenfrei ist (ab 50 Euro, also 5000 Cent). Welche Zeile verrät, warum magische Zahlen gefährlich sind?
    language: php
    code: |
      const VERSANDKOSTENFREI_AB_CENT = 5000;

      function istVersandkostenfrei(int $summeCent): bool
      {
          return $summeCent >= 500;
      }
    bug_line: 5
    explanation: Statt der Konstante steht dort eine getippte Zahl – und die ist falsch (500 statt 5000). Hätte die Funktion `VERSANDKOSTENFREI_AB_CENT` benutzt, gäbe es den Tippfehler nicht.
  - type: match
    question: Ordne jedem Namen die Art von Ding zu, für die er sich eignet.
    pairs:
      - { left: "berechneVersandkosten()", right: "Funktion – ein Verb, das eine Tätigkeit beschreibt" }
      - { left: "$istAktiv", right: "Boolescher Wert – liest sich wie eine Ja/Nein-Frage" }
      - { left: "Rechnung", right: "Klasse – ein Substantiv für ein Ding der Fachsprache" }
      - { left: "MAX_ANMELDEVERSUCHE", right: "Konstante – fester Wert in Großbuchstaben" }
    explanation: Funktionen tun etwas (Verb), Klassen sind etwas (Substantiv), Wahrheitswerte stellen eine Frage (`ist`, `hat`, `kann`), Konstanten werden in PHP und TypeScript meist in GROSSBUCHSTABEN geschrieben.
tasks:
  - id: namen-zuordnen
    type: dragdrop
    title: Schlechter Name, besserer Name
    description: |
      Ordne jedem kryptischen Namen den Namen zu, der dieselbe Sache klar beschreibt. Stell dir dazu vor,
      der Code berechnet Bestellungen in einem Onlineshop.
    targets:
      - { id: tage, label: "$tageBisZurLieferung" }
      - { id: liste, label: "$offeneBestellungen" }
      - { id: pruefen, label: "istVolljaehrig()" }
      - { id: preis, label: "$preisInCent" }
    items:
      - { label: "$d", target: tage }
      - { label: "$arr2", target: liste }
      - { label: "check()", target: pruefen }
      - { label: "$p", target: preis }
    hints:
      - Achte darauf, welcher Name eine **Einheit** (Cent, Tage) oder eine **Frage** enthält.
  - id: versand-konstanten
    type: code
    language: ts
    title: Magische Zahlen durch Konstanten ersetzen
    description: |
      Die Funktion `versandkosten` funktioniert, aber niemand versteht auf Anhieb die Zahlen `5000`, `490`
      und `990`. Baue sie um:

      1. Lege die Konstanten `VERSANDKOSTENFREI_AB_CENT` (5000), `STANDARD_VERSAND_CENT` (490) und
         `EXPRESS_VERSAND_CENT` (990) an.
      2. Benenne die Parameter sprechend: `summeCent` statt `s` und `express` statt `e`.
      3. Das Verhalten bleibt gleich: Ab 50 Euro ist **Standardversand** kostenlos, Express kostet immer
         9,90 Euro.

      Die Tests prüfen das Verhalten und die Werte deiner Konstanten.
    starter: |
      function versandkosten(s: number, e: boolean): number {
        if (e) {
          return 990;
        }
        if (s >= 5000) {
          return 0;
        }
        return 490;
      }
    tests:
      - name: Standardversand unter 50 Euro kostet 4,90 Euro
        code: assertEqual(versandkosten(4999, false), 490)
      - name: Ab genau 50 Euro ist Standardversand kostenlos
        code: assertEqual(versandkosten(5000, false), 0)
      - name: Express kostet immer 9,90 Euro
        code: assertEqual(versandkosten(12000, true), 990)
      - name: Leerer Warenkorb zahlt Standardversand
        code: assertEqual(versandkosten(0, false), 490)
      - name: Konstanten haben die richtigen Werte
        code: assertDeepEqual([VERSANDKOSTENFREI_AB_CENT, STANDARD_VERSAND_CENT, EXPRESS_VERSAND_CENT], [5000, 490, 990])
    hints:
      - "Konstanten legst du in TypeScript mit `const NAME = wert;` oberhalb der Funktion an."
      - "Ersetze dann jede Zahl im Funktionskörper durch den passenden Konstantennamen."
    solution: |
      const VERSANDKOSTENFREI_AB_CENT = 5000;
      const STANDARD_VERSAND_CENT = 490;
      const EXPRESS_VERSAND_CENT = 990;

      function versandkosten(summeCent: number, express: boolean): number {
        if (express) {
          return EXPRESS_VERSAND_CENT;
        }
        if (summeCent >= VERSANDKOSTENFREI_AB_CENT) {
          return 0;
        }
        return STANDARD_VERSAND_CENT;
      }
---
Stell dir vor, du übernimmst ein Projekt und findest diese Zeile: `if ($u->t == 3 && $d > 30) { … }`. Was ist
`t`? Warum gerade 3? Und 30 was – Tage, Euro, Minuten? Du verbringst eine halbe Stunde damit, eine einzige
Zeile zu entschlüsseln. Genau dieses Problem löst [[clean-code|Clean Code]].

## Warum lesbarer Code zählt

Code wird **viel öfter gelesen als geschrieben**. Du schreibst eine Funktion einmal, aber du und dein Team
lest sie dutzende Male: beim Erweitern, beim Fehlersuchen, im [[code-review|Code-Review]].

Lesbarer Code ist deshalb kein Schönheitswettbewerb, sondern eine Frage von Zeit und Geld:

| Unlesbarer Code | Lesbarer Code |
|---|---|
| Jede Änderung beginnt mit Rätselraten | Du verstehst die Absicht beim ersten Lesen |
| Fehler verstecken sich hinter kryptischen Namen | Fehler fallen auf, weil der Code „falsch klingt“ |
| Nur die Autorin traut sich an den Code | Jede:r im Team kann ihn ändern |

Clean Code heißt: Code, den ein anderer Mensch **ohne Erklärung** versteht und **ohne Angst** ändern kann.
Das Gegenteil sammelt sich als [[technische-schulden|technische Schulden]] an – jede Abkürzung von heute
macht die Änderung von morgen teurer.

> [!MERKSATZ]
> Du schreibst Code nicht für den Computer – der versteht auch `$x1`. Du schreibst ihn für den nächsten
> Menschen, der ihn lesen muss. Oft bist das du selbst in drei Monaten.

## Namen, die Absicht zeigen

Ein guter Name beantwortet drei Fragen: **Was** ist das? **Wozu** gibt es das? **In welcher Einheit**?

```php
// vorher
$d = 14;
$list = $repo->get();

// nachher
$rueckgabefristInTagen = 14;
$offeneBestellungen = $bestellungen->offene();
```

Faustregeln für gute Namen:

- **Fachsprache statt Technik:** `$offeneBestellungen` statt `$array2`.
- **Einheiten in den Namen:** `$preisInCent`, `$timeoutInSekunden` – so rechnet niemand versehentlich in Euro.
- **Keine Abkürzungen**, die nur du kennst: `$kdNr` → `$kundennummer`.
- **Länge passt zum Gültigkeitsbereich:** In einer Schleife über drei Zeilen darf es `$i` sein, eine
  Eigenschaft einer Klasse braucht einen vollen Namen.

> [!FEHLER]
> **Namen, die lügen.** Eine Funktion `getUser()`, die den Nutzer nebenbei auch anlegt, oder eine Variable
> `$liste`, die in Wahrheit ein einzelnes Objekt enthält, ist schlimmer als ein kryptischer Name. Wer
> sie liest, glaubt etwas Falsches.

## Wortarten und Konventionen

Namen folgen in fast allen Sprachen denselben Mustern. Halte dich an die
[[namenskonvention|Namenskonvention]] deines Projekts:

| Was | Wortart | PHP | TypeScript |
|---|---|---|---|
| Klasse, Interface | Substantiv | `Rechnung`, `Versender` | `Rechnung`, `Versender` |
| Funktion, Methode | Verb | `berechneSumme()` | `berechneSumme()` |
| Boolescher Wert | Frage | `$istBezahlt`, `$hatRabatt` | `istBezahlt`, `hatRabatt` |
| Konstante | Substantiv | `MAX_VERSUCHE` | `MAX_VERSUCHE` |

In PHP schreibst du Variablen und Methoden in [[camelcase|camelCase]], Klassen in PascalCase (so steht es im
[[per-coding-style|PER Coding Style]]). In TypeScript gilt dasselbe.

> [!TIPP]
> Dein Team schreibt Code auf Englisch? Dann bleib dabei. Wichtiger als die Sprache ist, dass sie im
> ganzen Projekt **einheitlich** ist. In diesem Kurs nutzen wir deutsche Namen, damit du dich auf die
> Konzepte konzentrieren kannst.

## Magische Zahlen und Strings

Eine [[magische-zahl|magische Zahl]] ist ein Wert mitten im Code, dessen Bedeutung niemand kennt:

```ts
if (sekunden > 86400) { /* … */ }
const brutto = netto * 1.19;
```

Wer weiß, dass 86400 ein Tag in Sekunden ist? Und wenn sich der Steuersatz ändert, suchst du jede `1.19`
im Projekt. Die Lösung ist eine benannte [[konstante|Konstante]]:

```ts
const SEKUNDEN_PRO_TAG = 24 * 60 * 60;
const MEHRWERTSTEUER_SATZ = 0.19;

if (sekunden > SEKUNDEN_PRO_TAG) { /* … */ }
const brutto = netto * (1 + MEHRWERTSTEUER_SATZ);
```

Dasselbe gilt für **magische Strings** wie `'stamm'` oder `'firma'`. Kommen sie an vielen Stellen vor, ist
ein [[enum|Enum]] die bessere Wahl:

```php
enum Kundentyp: string
{
    case Privat = 'privat';
    case Stammkunde = 'stamm';
    case Firma = 'firma';
}
```

Jetzt meldet dir PHP einen Tippfehler wie `Kundentyp::Stamkunde` sofort, statt ihn still durchzulassen.

> [!PRAXIS]
> Im Code-Review gehört „Steht hier eine Zahl ohne Namen?“ zu den häufigsten Kommentaren. Viele Teams
> lassen das sogar automatisch prüfen – mit einem [[linter|Linter]] oder [[phpstan|PHPStan]].

## Zusammenfassung

- Code wird öfter gelesen als geschrieben – Lesbarkeit spart Zeit, Fehler und Geld.
- Gute Namen sagen **was**, **wozu** und **in welcher Einheit**.
- Klassen sind Substantive, Funktionen Verben, Wahrheitswerte Fragen.
- Namen dürfen nie lügen: Ein falscher Name ist schlimmer als ein kryptischer.
- Magische Zahlen und Strings werden zu benannten Konstanten oder Enums.
