---
title: Enums
summary: Feste Wertemengen typsicher modellieren – Pure und Backed Enums, from/tryFrom, Methoden auf Enums und vollständige match-Ausdrücke.
duration: 20
sources:
  - title: PHP-Handbuch – Aufzählungen (Enums)
    url: https://www.php.net/manual/de/language.enumerations.php
  - title: PHP-Handbuch – Backed Enums
    url: https://www.php.net/manual/de/language.enumerations.backed.php
quiz:
  - type: single
    question: "Was liefert `Status::tryFrom('unbekannt')` bei einem Backed Enum ohne diesen Wert?"
    options: ["null", "Einen ValueError", "Den ersten Fall", "false"]
    answer: 0
    explanation: tryFrom liefert null, wenn kein Fall passt. from würde dagegen einen ValueError werfen.
  - type: multiple
    question: Welche Aussagen über Enums stimmen?
    options:
      - Jeder Fall eines Enums existiert genau einmal – man vergleicht mit ===.
      - Enums können Methoden und Konstanten haben.
      - Mit new Status() erzeugst du einen neuen Fall.
      - "`Status::cases()` liefert alle Fälle als Array."
    answers: [0, 1, 3]
    explanation: Enum-Fälle sind feste Objekte (Singletons). new ist nicht erlaubt.
  - type: match
    question: Ordne zu.
    pairs:
      - { left: "enum Farbe { case Rot; }", right: "Pure Enum ohne Wert" }
      - { left: "enum Farbe: string { case Rot = 'rot'; }", right: "Backed Enum" }
      - { left: "Farbe::Rot->value", right: "'rot'" }
      - { left: "Farbe::Rot->name", right: "'Rot'" }
    explanation: Jeder Fall hat einen name. Backed Enums haben zusätzlich einen value (string oder int).
  - type: find-bug
    question: Ein Tippfehler wie "bezahlz" fällt hier nicht auf. Welche Zeile solltest du ändern, damit PHP solche Fehler sofort meldet?
    language: php
    code: |
      <?php
      function versandbereit(string $status): bool
      {
          return $status === 'bezahlt';
      }

      echo versandbereit('bezahlz') ? 'ja' : 'nein';
    bug_line: 2
    explanation: >
      Der Parameter nimmt jeden beliebigen String an. Mit `versandbereit(BestellStatus $status)` könnte niemand
      einen Tippfehler übergeben – PHP würde sofort einen TypeError werfen.
tasks:
  - id: bestellstatus
    type: code
    language: php
    title: Ein Bestellstatus mit Regeln
    description: |
      Schreibe ein Backed Enum `BestellStatus: string` mit den Fällen
      `Offen = 'offen'`, `Bezahlt = 'bezahlt'`, `Versendet = 'versendet'`, `Storniert = 'storniert'`.

      1. `label(): string` liefert `Offen`, `Bezahlt`, `Versendet` bzw. `Storniert`.
      2. `kannWechselnZu(self $neu): bool` erlaubt nur diese Übergänge:
         - Offen → Bezahlt oder Storniert
         - Bezahlt → Versendet oder Storniert
         - Versendet und Storniert sind Endzustände (nichts erlaubt).
      3. `static abgeschlossene(): array` liefert die Liste `[Versendet, Storniert]` (als Enum-Fälle).

      Nutze `match` – dann wirft PHP einen Fehler, falls du einen Fall vergisst.
    starter: |
      <?php
      declare(strict_types=1);

      enum BestellStatus: string
      {
          case Offen = 'offen';
          // weitere Fälle

          public function label(): string
          {
              return '';
          }
      }
    tests:
      - name: Werte und Labels
        code: assert_same('bezahlt', BestellStatus::Bezahlt->value); assert_same('Versendet', BestellStatus::from('versendet')->label());
      - name: erlaubte Übergänge
        code: assert_true(BestellStatus::Offen->kannWechselnZu(BestellStatus::Bezahlt)); assert_true(BestellStatus::Bezahlt->kannWechselnZu(BestellStatus::Storniert));
      - name: verbotene Übergänge
        code: assert_same(false, BestellStatus::Offen->kannWechselnZu(BestellStatus::Versendet)); assert_same(false, BestellStatus::Versendet->kannWechselnZu(BestellStatus::Offen)); assert_same(false, BestellStatus::Storniert->kannWechselnZu(BestellStatus::Storniert));
      - name: abgeschlossene()
        code: assert_same([BestellStatus::Versendet, BestellStatus::Storniert], BestellStatus::abgeschlossene());
      - name: tryFrom mit unbekanntem Wert
        code: assert_same(null, BestellStatus::tryFrom('verloren'));
    hints:
      - "`return match ($this) { self::Offen => 'Offen', … };`"
      - "Für die Übergänge: `match ($this) { self::Offen => in_array($neu, [self::Bezahlt, self::Storniert], true), … }`"
      - "Endzustände: `self::Versendet, self::Storniert => false`."
    solution: |
      <?php
      declare(strict_types=1);

      enum BestellStatus: string
      {
          case Offen = 'offen';
          case Bezahlt = 'bezahlt';
          case Versendet = 'versendet';
          case Storniert = 'storniert';

          public function label(): string
          {
              return match ($this) {
                  self::Offen => 'Offen',
                  self::Bezahlt => 'Bezahlt',
                  self::Versendet => 'Versendet',
                  self::Storniert => 'Storniert',
              };
          }

          public function kannWechselnZu(self $neu): bool
          {
              return match ($this) {
                  self::Offen => in_array($neu, [self::Bezahlt, self::Storniert], true),
                  self::Bezahlt => in_array($neu, [self::Versendet, self::Storniert], true),
                  self::Versendet, self::Storniert => false,
              };
          }

          public static function abgeschlossene(): array
          {
              return [self::Versendet, self::Storniert];
          }
      }
  - id: enum-ablauf
    type: steps
    title: Was passiert mit dem Enum?
    description: "Spiel Situationen mit dem Enum `enum Prioritaet: int { case Niedrig = 1; case Hoch = 2; }` durch."
    steps:
      - situation: Ein Formular schickt den String `"2"`. Du rufst `Prioritaet::from((int) $_POST['prio'])` auf.
        question: Was bekommst du?
        options: ["Prioritaet::Hoch", "Die Zahl 2", "null"]
        answer: 0
        explanation: from() wandelt einen Wert in den passenden Enum-Fall um.
      - situation: Jemand schickt `"7"`, und du nutzt wieder `Prioritaet::from(7)`.
        question: Was passiert?
        options: ["Es wird ein ValueError geworfen", "Es kommt null zurück", "Es kommt Prioritaet::Niedrig zurück"]
        answer: 0
        explanation: from() wirft bei unbekannten Werten einen ValueError. Für Benutzereingaben ist tryFrom() mit null-Prüfung oft besser.
      - situation: "`echo json_encode(['prio' => Prioritaet::Hoch]);`"
        question: Was erscheint?
        options: ["{\"prio\":2}", "{\"prio\":\"Hoch\"}", "Ein Fehler"]
        answer: 0
        explanation: Backed Enums werden zu ihrem value serialisiert. Pure Enums lassen sich nicht als JSON ausgeben.
      - situation: "Du ergänzt einen Fall `case Kritisch = 3;`. Eine Methode nutzt `match ($this) { self::Niedrig => 'grau', self::Hoch => 'rot' }`."
        question: Was passiert bei Prioritaet::Kritisch->farbe()?
        options: ["Ein UnhandledMatchError", "Es kommt 'rot' zurück", "Es kommt null zurück"]
        answer: 0
        explanation: match ohne passenden Zweig wirft einen Fehler. So fällt ein vergessener Fall sofort auf – statische Analyse meldet ihn sogar vorher.
---
Ein Bestellstatus kann „offen“, „bezahlt“, „versendet“ oder „storniert“ sein – sonst nichts. Speicherst du das als
String, kann sich ein Tippfehler wie `'bezalt'` einschleichen und bleibt unbemerkt. Für solche festen Wertemengen
gibt es seit PHP 8.1 [[enum|Enums]]. Sie gehören heute zu den wichtigsten Werkzeugen in modernem PHP.

## Ein Enum definieren

```php
enum Wochentag
{
    case Montag;
    case Dienstag;
    case Mittwoch;
}

function istMeetingTag(Wochentag $tag): bool
{
    return $tag === Wochentag::Montag;
}

istMeetingTag(Wochentag::Montag);   // true
istMeetingTag('Montag');            // TypeError – nur echte Fälle erlaubt
```

- Ein Enum ist ein eigener **Typ**. Ein Parameter `Wochentag $tag` akzeptiert nur seine Fälle.
- Jeder Fall existiert genau einmal. Du vergleichst mit `===`.
- `new Wochentag()` ist verboten.
- `Wochentag::cases()` liefert alle Fälle, `$tag->name` den Namen als String (`'Montag'`).

> [!MERKSATZ]
> Wenn eine Variable nur wenige feste Werte annehmen kann, ist sie ein Enum – kein String und keine Zahl.

## Backed Enums: Fälle mit Wert

In Datenbanken, JSON und Formularen brauchst du einen speicherbaren Wert. Ein [[backed-enum|Backed Enum]]
verknüpft jeden Fall mit einem `string` oder `int`:

```php
enum BestellStatus: string
{
    case Offen = 'offen';
    case Bezahlt = 'bezahlt';
    case Storniert = 'storniert';
}

BestellStatus::Bezahlt->value;          // 'bezahlt' – zum Speichern
BestellStatus::from('offen');           // BestellStatus::Offen
BestellStatus::from('weg');             // ValueError
BestellStatus::tryFrom('weg');          // null
json_encode(BestellStatus::Offen);      // "offen"
```

| Methode | bei unbekanntem Wert | Einsatz |
|---|---|---|
| `from($wert)` | wirft `ValueError` | Daten, die gültig sein **müssen** (z. B. aus der eigenen DB) |
| `tryFrom($wert)` | liefert `null` | Benutzereingaben, die ungültig sein **können** |

## Enums mit Methoden

Enums können Methoden, Konstanten und Interfaces haben. So bleibt das Wissen über die Fälle an einem Ort:

```php
enum BestellStatus: string
{
    case Offen = 'offen';
    case Bezahlt = 'bezahlt';
    case Storniert = 'storniert';

    public function label(): string
    {
        return match ($this) {
            self::Offen => 'Wartet auf Zahlung',
            self::Bezahlt => 'Bezahlt',
            self::Storniert => 'Storniert',
        };
    }

    public static function auswahl(): array
    {
        return array_map(fn(self $s) => $s->label(), self::cases());
    }
}
```

`match` und Enums passen perfekt zusammen: Kommt ein neuer Fall hinzu und du vergisst ihn in einem `match`, gibt
es einen `UnhandledMatchError` – und Werkzeuge wie [[phpstan|PHPStan]] melden die Lücke schon vor dem Ausführen.

> [!FEHLER]
> `if ($status->value === 'bezahlt')` – damit vergleichst du wieder Strings und verlierst die Typsicherheit.
> Vergleiche Fälle direkt: `$status === BestellStatus::Bezahlt`.

## Enums in Value Objects

Zusammen mit readonly-Klassen entstehen ausdrucksstarke Modelle:

```php
final readonly class Bestellung
{
    public function __construct(
        public int $id,
        public BestellStatus $status,
    ) {}

    public function stornieren(): self
    {
        return new self($this->id, BestellStatus::Storniert);
    }
}

$daten = ['id' => 7, 'status' => 'bezahlt'];          // z. B. aus JSON
$bestellung = new Bestellung($daten['id'], BestellStatus::from($daten['status']));
```

Beim Laden wandelst du den gespeicherten Wert mit `from()` in einen Fall um, beim Speichern nutzt du `->value`.

> [!PRAXIS]
> In Laravel kannst du Datenbank-Spalten direkt auf Backed Enums abbilden („Enum Casts“). Status, Rollen,
> Zahlungsarten und Länder-Codes werden in modernen Projekten fast immer als Enum modelliert.

## Zusammenfassung

- Enums modellieren feste Wertemengen als eigenen Typ – Tippfehler sind unmöglich.
- Pure Enums haben nur Namen, Backed Enums zusätzlich einen `string`- oder `int`-Wert (`->value`).
- `from()` wirft bei unbekannten Werten einen `ValueError`, `tryFrom()` liefert `null`.
- Enums können Methoden, Konstanten und Interfaces haben; `cases()` liefert alle Fälle.
- `match ($this)` in Enum-Methoden macht vergessene Fälle sofort sichtbar.
