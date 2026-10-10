---
title: Interfaces, Vererbung und Traits
summary: Verträge mit Interfaces, gemeinsamer Code in abstrakten Klassen, Wiederverwendung mit Traits – und wann du welches Werkzeug nimmst.
duration: 25
sources:
  - title: PHP-Handbuch – Interfaces
    url: https://www.php.net/manual/de/language.oop5.interfaces.php
  - title: PHP-Handbuch – Abstrakte Klassen
    url: https://www.php.net/manual/de/language.oop5.abstract.php
  - title: PHP-Handbuch – Traits
    url: https://www.php.net/manual/de/language.oop5.traits.php
  - title: PHP-Handbuch – Vererbung
    url: https://www.php.net/manual/de/language.oop5.inheritance.php
quiz:
  - type: multiple
    question: Welche Aussagen stimmen?
    options:
      - Eine Klasse kann mehrere Interfaces implementieren.
      - Eine Klasse kann von mehreren Klassen erben.
      - Eine abstrakte Klasse kann fertige Methoden enthalten.
      - Von einer abstrakten Klasse kann man direkt Objekte mit new erzeugen.
    answers: [0, 2]
    explanation: >
      PHP erlaubt nur eine Elternklasse (extends), aber beliebig viele Interfaces (implements). Abstrakte Klassen
      dürfen fertigen Code enthalten, aber man kann sie nicht instanziieren.
  - type: find-bug
    question: Dieser Code bricht mit einem Fatal Error ab. In welcher Zeile steckt der Fehler?
    language: php
    code: |
      <?php
      interface Exportierbar
      {
          public function export(): string;
      }

      final class Rechnung implements Exportierbar
      {
          public function exportieren(): string
          {
              return 'Rechnung';
          }
      }
    bug_line: 9
    explanation: >
      Das Interface verlangt eine Methode namens export(). Rechnung bietet nur exportieren() an und erfüllt den
      Vertrag damit nicht – PHP meldet, dass die abstrakte Methode export() fehlt.
  - type: single
    question: Wofür sind Traits gedacht?
    options:
      - Um eine Klasse von mehreren Klassen erben zu lassen.
      - Um Methoden in mehrere, nicht verwandte Klassen einzufügen, ohne Vererbung.
      - Um Typen für Parameter festzulegen.
      - Um eine Klasse unveränderlich zu machen.
    answer: 1
    explanation: Ein Trait ist ein Baustein mit Methoden, den PHP beim Kompilieren in die Klasse kopiert (use HatZeitstempel;).
  - type: cloze
    text: "Eine Klasse erfüllt ein Interface mit dem Schlüsselwort ___. Den Konstruktor der Elternklasse rufst du mit ___::__construct() auf."
    blanks:
      - [implements]
      - [parent]
    explanation: "implements für Interfaces, extends für Klassen, parent:: für die Elternklasse."
tasks:
  - id: rabatte
    type: code
    language: php
    title: Rabatte als austauschbare Strategien
    description: |
      Ein Shop kennt verschiedene Rabatte. Alle sollen gleich benutzt werden können.

      1. Schreibe ein Interface `Rabatt` mit der Methode `anwenden(int $cent): int`.
      2. `ProzentRabatt` (Konstruktor: `int $prozent`) zieht den Prozentsatz ab und **rundet** auf ganze Cent
         (`round`, dann `(int)`).
      3. `FestbetragRabatt` (Konstruktor: `int $cent`) zieht einen festen Betrag ab – das Ergebnis wird nie kleiner als 0.
      4. Die Funktion `gesamtpreis(int $cent, Rabatt ...$rabatte): int` wendet alle Rabatte **nacheinander** an.
    starter: |
      <?php
      declare(strict_types=1);

      interface Rabatt
      {
          // Methode deklarieren
      }

      final class ProzentRabatt implements Rabatt
      {
      }

      final class FestbetragRabatt implements Rabatt
      {
      }

      function gesamtpreis(int $cent, Rabatt ...$rabatte): int
      {
          return $cent;
      }
    tests:
      - name: Prozentrabatt
        code: assert_same(900, (new ProzentRabatt(10))->anwenden(1000)); assert_same(667, (new ProzentRabatt(33))->anwenden(995));
      - name: Festbetrag wird nie negativ
        code: assert_same(500, (new FestbetragRabatt(500))->anwenden(1000)); assert_same(0, (new FestbetragRabatt(500))->anwenden(300));
      - name: Rabatte nacheinander anwenden
        code: assert_same(800, gesamtpreis(1000, new ProzentRabatt(10), new FestbetragRabatt(100)));
      - name: ohne Rabatt bleibt der Preis
        code: assert_same(1000, gesamtpreis(1000));
      - name: beide Klassen erfüllen das Interface
        code: assert_true(new ProzentRabatt(5) instanceof Rabatt); assert_true(new FestbetragRabatt(5) instanceof Rabatt);
    hints:
      - "Im Interface steht nur die Signatur: `public function anwenden(int $cent): int;`"
      - "`(int) round($cent * (100 - $this->prozent) / 100)` und `max(0, $cent - $this->cent)`."
      - "`foreach ($rabatte as $rabatt) { $cent = $rabatt->anwenden($cent); }`"
    solution: |
      <?php
      declare(strict_types=1);

      interface Rabatt
      {
          public function anwenden(int $cent): int;
      }

      final class ProzentRabatt implements Rabatt
      {
          public function __construct(private int $prozent)
          {
          }

          public function anwenden(int $cent): int
          {
              return (int) round($cent * (100 - $this->prozent) / 100);
          }
      }

      final class FestbetragRabatt implements Rabatt
      {
          public function __construct(private int $cent)
          {
          }

          public function anwenden(int $cent): int
          {
              return max(0, $cent - $this->cent);
          }
      }

      function gesamtpreis(int $cent, Rabatt ...$rabatte): int
      {
          foreach ($rabatte as $rabatt) {
              $cent = $rabatt->anwenden($cent);
          }

          return $cent;
      }
  - id: werkzeug-waehlen
    type: dragdrop
    title: Interface, abstrakte Klasse oder Trait?
    description: Ordne jede Eigenschaft dem passenden Werkzeug zu.
    targets:
      - { id: interface, label: Interface }
      - { id: abstrakt, label: Abstrakte Klasse }
      - { id: trait, label: Trait }
    items:
      - { label: "Nur Methoden-Signaturen, kein Code", target: interface }
      - { label: "Eine Klasse kann beliebig viele davon erfüllen", target: interface }
      - { label: "Teilweise fertig, Unterklassen ergänzen den Rest", target: abstrakt }
      - { label: "Wird mit extends eingebunden – nur eines pro Klasse", target: abstrakt }
      - { label: "Code wird per use in die Klasse kopiert", target: trait }
      - { label: "Ist kein Typ – instanceof funktioniert damit nicht", target: trait }
---
Ein Online-Shop kann per Kreditkarte, per Rechnung oder per Lastschrift bezahlt werden. Der Bestellprozess soll
aber nicht für jede Zahlungsart umgeschrieben werden. Er braucht nur die Zusage: „Dieses Objekt kann bezahlen.“
Solche Zusagen sind [[interface|Interfaces]]. In dieser Lektion lernst du die drei Werkzeuge, mit denen PHP Code
teilt und austauschbar macht.

## Interfaces: ein Vertrag

Ein Interface beschreibt, **welche** Methoden es gibt – nicht, wie sie funktionieren:

```php
interface Zahlungsart
{
    public function bezahle(int $cent): bool;
}

final class Rechnung implements Zahlungsart
{
    public function bezahle(int $cent): bool
    {
        // Rechnung erzeugen …
        return true;
    }
}

function kasse(Zahlungsart $zahlung, int $cent): void
{
    $zahlung->bezahle($cent);   // egal, welche Klasse dahintersteckt
}
```

- Eine Klasse erfüllt ein Interface mit `implements`. Fehlt eine Methode, bricht PHP mit einem Fatal Error ab.
- Eine Klasse kann **mehrere** Interfaces erfüllen: `implements Zahlungsart, JsonSerializable`.
- Der Typ `Zahlungsart` akzeptiert jedes passende Objekt – das ist [[polymorphie|Polymorphie]].

> [!MERKSATZ]
> Programmiere gegen Interfaces, nicht gegen konkrete Klassen. Dann kannst du Implementierungen austauschen,
> ohne den aufrufenden Code zu ändern.

## Vererbung und abstrakte Klassen

Mit `extends` erbt eine Klasse alle Eigenschaften und Methoden einer anderen – das ist [[vererbung|Vererbung]].
Eine [[abstrakte-klasse|abstrakte Klasse]] ist ein halbfertiger Bauplan: Sie enthält gemeinsamen Code und lässt
einzelne Methoden offen.

```php
abstract class Benachrichtigung
{
    public function __construct(protected string $empfaenger) {}

    public function senden(string $text): string
    {
        return $this->kanal() . " an {$this->empfaenger}: {$text}";
    }

    abstract protected function kanal(): string;   // muss die Unterklasse liefern
}

final class EmailBenachrichtigung extends Benachrichtigung
{
    #[\Override]
    protected function kanal(): string
    {
        return 'E-Mail';
    }
}

echo (new EmailBenachrichtigung('user@example.com'))->senden('Paket kommt');
```

- Eine Klasse hat höchstens **eine** Elternklasse.
- `new Benachrichtigung(...)` ist verboten – abstrakte Klassen kann man nicht instanziieren.
- `parent::methode()` ruft die Version der Elternklasse auf, z. B. `parent::__construct($empfaenger)`.
- Das Attribut `#[\Override]` lässt PHP prüfen, dass die Methode wirklich etwas überschreibt – ein Tippfehler im
  Namen fällt sofort auf.

## Traits: Code einfügen statt erben

Manchmal brauchen nicht verwandte Klassen dieselben Hilfsmethoden. Ein [[trait|Trait]] ist ein Baustein, den PHP
in die Klasse hineinkopiert:

```php
trait HatZeitstempel
{
    private ?DateTimeImmutable $erstelltAm = null;

    public function markiereErstellt(): void
    {
        $this->erstelltAm = new DateTimeImmutable();
    }

    public function erstelltAm(): ?DateTimeImmutable
    {
        return $this->erstelltAm;
    }
}

final class Artikel
{
    use HatZeitstempel;
}

final class Kommentar
{
    use HatZeitstempel;
}
```

> [!FEHLER]
> Ein Trait ist **kein Typ**. `$x instanceof HatZeitstempel` ist immer false, und du kannst ihn nicht als
> Parametertyp verwenden. Wenn andere Code-Teile sich darauf verlassen sollen, brauchst du zusätzlich ein Interface.

## Welches Werkzeug wann?

| Frage | Werkzeug |
|---|---|
| „Andere sollen sich darauf verlassen, dass X geht.“ | Interface |
| „Mehrere Varianten teilen viel Code und unterscheiden sich in Details.“ | Abstrakte Klasse |
| „Unverwandte Klassen brauchen dieselben Hilfsmethoden.“ | Trait |
| „Ein Objekt braucht die Fähigkeit eines anderen.“ | Komposition: Objekt im Konstruktor übergeben |

Tiefe Vererbungsketten (`A extends B extends C extends D`) werden schnell unübersichtlich. Oft ist es besser, ein
Objekt einfach als Eigenschaft mitzugeben – das nennt man Komposition.

> [!PRAXIS]
> Frameworks wie Laravel definieren viele Interfaces (sogenannte Contracts) und lassen dich eigene
> Implementierungen einsetzen. Traits findest du dort oft für wiederkehrende Fähigkeiten von Models.

## Zusammenfassung

- Ein Interface ist ein Vertrag: Methoden-Signaturen ohne Code, erfüllt mit `implements`.
- Eine Klasse erbt mit `extends` von höchstens einer Klasse, kann aber viele Interfaces erfüllen.
- Abstrakte Klassen enthalten gemeinsamen Code und offene `abstract`-Methoden; man kann sie nicht instanziieren.
- `#[\Override]` und `parent::` helfen beim sicheren Überschreiben.
- Traits fügen Methoden per `use` ein, sind aber kein Typ.
- Bevorzuge flache Hierarchien und Komposition.
