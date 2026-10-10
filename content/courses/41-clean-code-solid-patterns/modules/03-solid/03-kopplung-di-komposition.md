---
title: Kopplung, Kohäsion, Dependency Injection und Komposition
summary: Wie du Abhängigkeiten zwischen Klassen gering hältst, Zusammengehöriges bündelst, Abhängigkeiten von außen übergibst und Komposition statt Vererbung nutzt.
duration: 25
sources:
  - title: PHP-Handbuch – Konstruktoren (Constructor Promotion)
    url: https://www.php.net/manual/de/language.oop5.decon.php
  - title: PHP-Handbuch – Objektvererbung
    url: https://www.php.net/manual/de/language.oop5.inheritance.php
  - title: Laravel – Service Container
    url: https://laravel.com/docs/13.x/container
  - title: TypeScript Handbook – Classes
    url: https://www.typescriptlang.org/docs/handbook/2/classes.html
quiz:
  - type: single
    question: Welche Kombination willst du anstreben?
    options:
      - Hohe Kopplung, hohe Kohäsion
      - Niedrige Kopplung, hohe Kohäsion
      - Niedrige Kopplung, niedrige Kohäsion
      - Hohe Kopplung, niedrige Kohäsion
    answer: 1
    explanation: Module sollen wenig voneinander wissen (niedrige Kopplung) und in sich eng zusammengehören (hohe Kohäsion). Dann bleibt eine Änderung meist auf ein Modul beschränkt.
  - type: find-bug
    question: In welcher Zeile versteckt die Klasse eine Abhängigkeit, die man im Test nicht austauschen kann?
    language: php
    code: |
      final class Bestellabschluss
      {
          public function __construct(private Lager $lager) {}

          public function abschliessen(Bestellung $bestellung): void
          {
              $this->lager->reservieren($bestellung);
              $zahlung = new StripeZahlung();
              $zahlung->belasten($bestellung->summe());
          }
      }
    bug_line: 8
    explanation: Das Lager kommt von außen, die Zahlung wird aber mit `new` fest erzeugt. Im Test würde jedes Mal eine echte Zahlung versucht. Die Zahlung sollte ebenfalls über den Konstruktor kommen – am besten als Interface.
  - type: multiple
    question: Welche Aussagen zu Komposition statt Vererbung stimmen?
    options:
      - Bei Komposition besteht ein Objekt aus anderen Objekten, an die es Arbeit weitergibt.
      - Vererbung koppelt eine Unterklasse eng an die Interna der Oberklasse.
      - Komposition erlaubt, Verhalten zur Laufzeit auszutauschen und frei zu kombinieren.
      - Vererbung ist in modernem PHP verboten.
    answers: [0, 1, 2]
    explanation: Vererbung ist erlaubt und manchmal richtig (echte „ist ein“-Beziehung, gemeinsamer Vertrag). Für das Wiederverwenden von Verhalten ist Komposition aber fast immer flexibler.
  - type: cloze
    text: Bei der Constructor ___ bekommt eine Klasse ihre Abhängigkeiten als Parameter des ___ übergeben. Die Stelle, an der alle Objekte zusammengesetzt werden, heißt Composition ___.
    blanks:
      - [Injection]
      - [Konstruktors, Konstruktor]
      - [Root]
    explanation: Konstruktor-Injektion macht Abhängigkeiten sichtbar. Zusammengesetzt wird an genau einer Stelle, meist beim Programmstart oder im Container.
tasks:
  - id: kopplung-zuordnen
    type: dragdrop
    title: Kopplung erhöhen oder senken?
    description: Ordne jede Entwurfsentscheidung zu – macht sie Klassen enger voneinander abhängig oder lockerer?
    targets:
      - { id: hoch, label: Erhöht die Kopplung }
      - { id: niedrig, label: Senkt die Kopplung }
    items:
      - { label: "Eine Klasse erzeugt ihren Mailer mit new im Methodenrumpf", target: hoch }
      - { label: "Abhängigkeiten kommen als Interface über den Konstruktor", target: niedrig }
      - { label: "Code greift über drei Ebenen zu: $a->b()->c()->d()", target: hoch }
      - { label: "Eine Klasse liest öffentliche Eigenschaften einer anderen direkt und ändert sie", target: hoch }
      - { label: "Module sprechen nur über kleine, klar benannte Methoden miteinander", target: niedrig }
      - { label: "Eine statische Hilfsklasse wird von überall aus aufgerufen", target: hoch }
    hints:
      - Je mehr eine Klasse über das Innenleben einer anderen wissen muss, desto stärker ist die Kopplung.
  - id: bericht-komposition
    type: code
    language: php
    title: Vererbung durch Komposition ersetzen
    description: |
      Für jedes Exportformat gibt es eine Unterklasse von `Bericht`. Kommt eine Variante „mit Kopfzeile“
      dazu, müsste man jede Unterklasse verdoppeln. Baue auf **Komposition** um:

      1. Lege das Interface `Format` mit `formatiere(array $zeilen): string` an.
      2. `CsvFormat`: Kopfzeile aus den Schlüsseln der ersten Zeile, Werte mit `;` getrennt, Zeilen mit `\n`.
         Ohne Zeilen liefert es einen leeren String.
      3. `JsonFormat`: `json_encode($zeilen)`.
      4. `final class Bericht` bekommt ein `Format` im Konstruktor; `erstelle(array $zeilen): string`
         gibt die Arbeit an das Format weiter.
    starter: |
      <?php

      declare(strict_types=1);

      abstract class Bericht
      {
          abstract protected function formatiere(array $zeilen): string;

          public function erstelle(array $zeilen): string
          {
              return $this->formatiere($zeilen);
          }
      }

      final class CsvBericht extends Bericht
      {
          protected function formatiere(array $zeilen): string
          {
              if ($zeilen === []) {
                  return '';
              }
              $ausgabe = [implode(';', array_keys($zeilen[0]))];
              foreach ($zeilen as $zeile) {
                  $ausgabe[] = implode(';', $zeile);
              }
              return implode("\n", $ausgabe);
          }
      }
    tests:
      - name: CSV mit Kopfzeile
        code: "assert_same(\"name;punkte\\nAda;3\\nGrace;5\", (new Bericht(new CsvFormat()))->erstelle([['name' => 'Ada', 'punkte' => 3], ['name' => 'Grace', 'punkte' => 5]]));"
      - name: JSON
        code: "assert_same('[{\"name\":\"Ada\",\"punkte\":3}]', (new Bericht(new JsonFormat()))->erstelle([['name' => 'Ada', 'punkte' => 3]]));"
      - name: Leere Liste ergibt bei CSV einen leeren String
        code: "assert_same('', (new Bericht(new CsvFormat()))->erstelle([]));"
      - name: Ein eigenes Format lässt sich einstecken
        code: |
          $anzahl = new class implements Format {
              public function formatiere(array $zeilen): string { return count($zeilen) . ' Zeilen'; }
          };
          assert_same('2 Zeilen', (new Bericht($anzahl))->erstelle([[1], [2]]));
      - name: Bericht ist keine abstrakte Klasse mehr
        code: "assert_true(!(new ReflectionClass('Bericht'))->isAbstract());"
    hints:
      - "`final class Bericht { public function __construct(private Format $format) {} public function erstelle(array $zeilen): string { return $this->format->formatiere($zeilen); } }`"
      - "Den Inhalt von `CsvBericht::formatiere()` kannst du fast unverändert in `CsvFormat` übernehmen – nur `protected` wird `public`."
    solution: |
      <?php

      declare(strict_types=1);

      interface Format
      {
          public function formatiere(array $zeilen): string;
      }

      final class CsvFormat implements Format
      {
          public function formatiere(array $zeilen): string
          {
              if ($zeilen === []) {
                  return '';
              }

              $ausgabe = [implode(';', array_keys($zeilen[0]))];
              foreach ($zeilen as $zeile) {
                  $ausgabe[] = implode(';', $zeile);
              }

              return implode("\n", $ausgabe);
          }
      }

      final class JsonFormat implements Format
      {
          public function formatiere(array $zeilen): string
          {
              return json_encode($zeilen, JSON_THROW_ON_ERROR);
          }
      }

      final class Bericht
      {
          public function __construct(private Format $format)
          {
          }

          public function erstelle(array $zeilen): string
          {
              return $this->format->formatiere($zeilen);
          }
      }
---
Du willst nur die Art ändern, wie Rechnungsnummern erzeugt werden – und plötzlich musst du sieben Klassen
anfassen, weil alle direkt auf die alte Methode zugreifen. Zwei Begriffe beschreiben, warum das passiert:
**Kopplung** und **Kohäsion**. Zwei Techniken helfen dagegen: **Dependency Injection** und **Komposition**.

## Kopplung und Kohäsion

[[kopplung|Kopplung]] beschreibt, wie stark Module voneinander abhängen. Je mehr eine Klasse über das
Innenleben einer anderen weiß, desto enger sind sie gekoppelt – und desto eher zieht eine Änderung weitere
nach sich.

[[kohaesion|Kohäsion]] beschreibt, wie eng die Teile **innerhalb** eines Moduls zusammengehören. Eine Klasse
`Warenkorb` mit `hinzufuegen()`, `entfernen()` und `summe()` hat hohe Kohäsion. Eine Klasse `Helfer` mit
`formatiereDatum()`, `sendeSms()` und `berechneSteuer()` hat keine.

| | Niedrig | Hoch |
|---|---|---|
| **Kopplung** | gewünscht – Module wissen wenig voneinander | Änderungen ziehen Kreise |
| **Kohäsion** | Sammelsurium ohne roten Faden | gewünscht – alles dient einem Zweck |

Typische Quellen hoher Kopplung: `new` mitten in der Fachlogik, statische Aufrufe wie `Konfig::get()`,
lange Aufrufketten wie `$bestellung->kunde()->adresse()->land()->steuersatz()` und direkte Zugriffe auf
fremde Eigenschaften.

> [!MERKSATZ]
> Niedrige Kopplung, hohe Kohäsion: Was zusammen geändert wird, gehört zusammen. Was getrennt geändert
> wird, sollte wenig voneinander wissen.

## Dependency Injection

[[dependency-injection|Dependency Injection]] (DI) heißt: Eine Klasse erzeugt ihre Abhängigkeiten nicht
selbst, sondern bekommt sie **von außen** übergeben. Die üblichste Form ist die
[[konstruktor-injektion|Konstruktor-Injektion]]:

```php
// vorher: versteckte, feste Abhängigkeiten
final class Bestellabschluss
{
    public function abschliessen(Bestellung $bestellung): void
    {
        $zahlung = new KartenZahlung('<dein-token>');
        $zahlung->belasten($bestellung->summe());
    }
}

// nachher: Abhängigkeiten sind im Konstruktor sichtbar
final class Bestellabschluss
{
    public function __construct(
        private Zahlung $zahlung,
        private Lager $lager,
    ) {}

    public function abschliessen(Bestellung $bestellung): void
    {
        $this->lager->reservieren($bestellung);
        $this->zahlung->belasten($bestellung->summe());
    }
}
```

Drei Vorteile auf einen Blick: Du **siehst** im Konstruktor, was die Klasse braucht. Du kannst im Test
einen [[test-double|Test-Double]] übergeben. Und du kannst Implementierungen tauschen, ohne die Klasse zu
ändern – genau das Open-Closed-Prinzip.

## Wer setzt alles zusammen?

Wenn keine Klasse mehr `new` aufruft, muss es irgendwo jemand tun. Diese Stelle heißt
[[composition-root|Composition Root]] – meist der Programmstart:

```ts
// main.ts – die einzige Stelle, die konkrete Klassen kennt
const zahlung = new KartenZahlung(process.env.ZAHLUNG_TOKEN ?? '');
const lager = new DatenbankLager(datenbank);
const abschluss = new Bestellabschluss(zahlung, lager);
```

In großen Anwendungen übernimmt ein DI-Container diese Arbeit, etwa der
[[service-container|Service-Container]] von Laravel. Er liest die Konstruktoren und erzeugt die passenden
Objekte automatisch. Der Container ist bequem, aber kein Muss – DI funktioniert auch komplett von Hand.

> [!FEHLER]
> **Den Container überall abfragen.** Wer in Fachklassen `app(Zahlung::class)` aufruft, hat die
> Abhängigkeit nur versteckt, nicht injiziert. Im Konstruktor ist sie nicht mehr sichtbar, und im Test
> musst du den Container präparieren. Dieses Muster nennt man Service Locator – vermeide es in Fachlogik.

## Komposition statt Vererbung

[[vererbung|Vererbung]] wirkt verlockend, um Code wiederzuverwenden. Aber sie koppelt eng: Jede Unterklasse
hängt von den Interna der Oberklasse ab. Und Varianten vervielfachen sich schnell:

```php
class Bericht {}
class CsvBericht extends Bericht {}
class JsonBericht extends Bericht {}
class CsvBerichtMitKopfzeile extends CsvBericht {}
class JsonBerichtMitKopfzeile extends JsonBericht {} // jede Kombination eine Klasse
```

Bei [[komposition-statt-vererbung|Komposition statt Vererbung]] besteht ein Objekt aus anderen Objekten,
an die es Arbeit weitergibt:

```php
final class Bericht
{
    public function __construct(private Format $format) {}

    public function erstelle(array $zeilen): string
    {
        return $this->format->formatiere($zeilen);
    }
}

$csv = new Bericht(new CsvFormat());
$json = new Bericht(new JsonFormat());
```

Jedes neue Format ist **eine** neue Klasse, und Formate lassen sich sogar zur Laufzeit wählen.

> [!PRAXIS]
> Vererbung bleibt sinnvoll bei einer echten „ist ein“-Beziehung mit gemeinsamem Vertrag, etwa einer
> eigenen Exception, die von `InvalidArgumentException` erbt. Viele Teams markieren Klassen standardmäßig
> als `final` und öffnen sie nur bewusst für Vererbung.

## Zusammenfassung

- **Kopplung** misst, wie stark Module voneinander abhängen – sie soll niedrig sein.
- **Kohäsion** misst, wie eng ein Modul in sich zusammengehört – sie soll hoch sein.
- **Dependency Injection** übergibt Abhängigkeiten von außen, am besten über den Konstruktor.
- Zusammengesetzt wird an einer Stelle, der Composition Root – von Hand oder mit einem Container.
- Den Container in Fachklassen abzufragen, versteckt Abhängigkeiten nur.
- **Komposition statt Vererbung:** Verhalten als austauschbares Objekt einstecken, statt Unterklassen zu stapeln.
