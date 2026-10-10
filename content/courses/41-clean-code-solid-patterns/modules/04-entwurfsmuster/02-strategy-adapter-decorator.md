---
title: Strategy, Adapter und Decorator
summary: Drei Muster, die auf Interfaces und Komposition aufbauen – austauschbares Verhalten, fremde Schnittstellen passend machen und Verhalten in Schichten ergänzen.
duration: 25
sources:
  - title: Refactoring Guru – Strategy
    url: https://refactoring.guru/design-patterns/strategy
  - title: Refactoring Guru – Adapter
    url: https://refactoring.guru/design-patterns/adapter
  - title: Refactoring Guru – Decorator
    url: https://refactoring.guru/design-patterns/decorator
  - title: TypeScript Handbook – Classes (implements)
    url: https://www.typescriptlang.org/docs/handbook/2/classes.html
quiz:
  - type: match
    question: Ordne jedem Muster seine Kernidee zu.
    pairs:
      - { left: "Strategy", right: "Austauschbare Varianten eines Verhaltens hinter einem gemeinsamen Interface" }
      - { left: "Adapter", right: "Eine fremde Schnittstelle so übersetzen, dass sie zu deinem Interface passt" }
      - { left: "Decorator", right: "Ein Objekt mit gleichem Interface umhüllen und Verhalten davor oder danach ergänzen" }
    explanation: Alle drei arbeiten mit einem Interface und Komposition – sie unterscheiden sich darin, welches Problem sie lösen.
  - type: single
    question: Ein Zahlungsanbieter liefert ein SDK mit der Methode `chargeAmount(int $minorUnits, string $ref)`. Dein Code erwartet das Interface `Zahlung::belasten(Geld $betrag)`. Welches Muster passt?
    options:
      - Strategy
      - Adapter
      - Decorator
      - Observer
    answer: 1
    explanation: Der Adapter implementiert dein Interface und übersetzt jeden Aufruf in die Sprache des SDK. Dein restlicher Code bleibt frei von den Details des Anbieters.
  - type: find-bug
    question: "`ZeitmessendeQuelle` soll ein Decorator für `Preisquelle` sein. In welcher Zeile steckt der Fehler?"
    language: ts
    code: |
      class ZeitmessendeQuelle implements Preisquelle {
        constructor(private readonly innere: Preisquelle, private readonly log: string[]) {}

        preisCent(artikel: string): number {
          const start = Date.now();
          const preis = new DatenbankQuelle().preisCent(artikel);
          this.log.push(`${artikel}: ${Date.now() - start} ms`);
          return preis;
        }
      }
    bug_line: 6
    explanation: Der Decorator erzeugt selbst eine `DatenbankQuelle`, statt an das umhüllte Objekt `this.innere` weiterzugeben. Damit lässt er sich nicht mehr um beliebige Quellen legen und nicht stapeln.
  - type: multiple
    question: Wann ist eine Strategy übertrieben?
    options:
      - Es gibt genau eine Variante, und weitere sind nicht absehbar.
      - Die Fallunterscheidung besteht aus zwei einfachen Zeilen, die sich seit Jahren nicht geändert haben.
      - Neue Varianten kommen regelmäßig dazu und werden von verschiedenen Teams gebaut.
      - Die Variante soll zur Laufzeit per Konfiguration gewählt werden.
    answers: [0, 1]
    explanation: Bei einer einzigen oder sehr stabilen Variante kostet die Strategy nur Dateien und Indirektion. Sie lohnt sich, wenn Varianten wirklich wechseln oder wachsen.
tasks:
  - id: muster-waehlen
    type: dragdrop
    title: Welches Muster löst das Problem?
    description: Lies die Situationen aus einem Projekt und ordne jeder das passende Muster zu.
    targets:
      - { id: strategy, label: Strategy }
      - { id: adapter, label: Adapter }
      - { id: decorator, label: Decorator }
    items:
      - { label: "Rabatte werden je nach Kundentyp unterschiedlich berechnet", target: strategy }
      - { label: "Die Sortierung einer Liste soll per Dropdown wählbar sein", target: strategy }
      - { label: "Eine alte SOAP-Bibliothek soll hinter unserem Interface Kurse verschwinden", target: adapter }
      - { label: "Zwei Kartendienste mit unterschiedlichen APIs sollen gleich benutzt werden", target: adapter }
      - { label: "Jede Anfrage an die Wetter-API soll zusätzlich gecacht werden", target: decorator }
      - { label: "Auf dem Testsystem sollen alle Mails an eine Testadresse umgeleitet werden", target: decorator }
    hints:
      - Wird ein Verhalten gewählt (Strategy), eine fremde Schnittstelle übersetzt (Adapter) oder ein vorhandenes Verhalten um etwas ergänzt (Decorator)?
  - id: decorator-cache
    type: code
    language: ts
    title: Decorators für eine Preisquelle
    description: |
      Eine `Preisquelle` liefert Preise – zum Beispiel aus einer langsamen API. Ergänze Verhalten, **ohne**
      die Quelle selbst zu ändern, mit zwei Decorators:

      1. `CachendePreisquelle` fragt die innere Quelle pro Artikel nur **einmal** und merkt sich das Ergebnis
         (z. B. in einer `Map`).
      2. `ProtokollierendePreisquelle` schreibt bei jedem Aufruf `<artikel>=<preis>` in ein Array, das sie im
         Konstruktor bekommt, und gibt den Preis unverändert zurück.

      Beide implementieren `Preisquelle` und bekommen die innere Quelle im Konstruktor – so lassen sie sich
      beliebig stapeln.
    starter: |
      interface Preisquelle {
        preisCent(artikel: string): number;
      }

      class CachendePreisquelle implements Preisquelle {
        constructor(private readonly innere: Preisquelle) {}

        preisCent(artikel: string): number {
          return this.innere.preisCent(artikel);
        }
      }

      class ProtokollierendePreisquelle implements Preisquelle {
        preisCent(artikel: string): number {
          return 0;
        }
      }
    tests:
      - name: Cache fragt pro Artikel nur einmal
        code: |
          let aufrufe = 0;
          const quelle = { preisCent(artikel) { aufrufe++; return artikel.length * 100; } };
          const cache = new CachendePreisquelle(quelle);
          assertDeepEqual([cache.preisCent('tee'), cache.preisCent('tee'), cache.preisCent('kaffee')], [300, 300, 600]);
          assertEqual(aufrufe, 2);
      - name: Ein Preis von 0 wird ebenfalls gecacht
        code: |
          let aufrufe = 0;
          const cache = new CachendePreisquelle({ preisCent() { aufrufe++; return 0; } });
          cache.preisCent('probe'); cache.preisCent('probe');
          assertEqual(aufrufe, 1);
      - name: Protokoll schreibt jeden Aufruf mit
        code: |
          const log = [];
          const p = new ProtokollierendePreisquelle({ preisCent: () => 450 }, log);
          assertEqual(p.preisCent('brot'), 450);
          p.preisCent('brot');
          assertDeepEqual(log, ['brot=450', 'brot=450']);
      - name: Gestapelt protokolliert nur, was nicht aus dem Cache kommt
        code: |
          const log = [];
          const quelle = new CachendePreisquelle(new ProtokollierendePreisquelle({ preisCent: () => 199 }, log));
          quelle.preisCent('apfel'); quelle.preisCent('apfel');
          assertDeepEqual(log, ['apfel=199']);
    hints:
      - "Im Cache: `private readonly gemerkt = new Map<string, number>();` und `if (this.gemerkt.has(artikel)) return this.gemerkt.get(artikel)!;`"
      - "Prüfe mit `has()`, nicht mit `if (wert)` – sonst wird ein Preis von 0 nie gecacht."
      - "Der Konstruktor des Protokolls: `constructor(private readonly innere: Preisquelle, private readonly log: string[]) {}`"
    solution: |
      interface Preisquelle {
        preisCent(artikel: string): number;
      }

      class CachendePreisquelle implements Preisquelle {
        private readonly gemerkt = new Map<string, number>();

        constructor(private readonly innere: Preisquelle) {}

        preisCent(artikel: string): number {
          const bekannt = this.gemerkt.get(artikel);
          if (bekannt !== undefined) {
            return bekannt;
          }
          const preis = this.innere.preisCent(artikel);
          this.gemerkt.set(artikel, preis);
          return preis;
        }
      }

      class ProtokollierendePreisquelle implements Preisquelle {
        constructor(private readonly innere: Preisquelle, private readonly log: string[]) {}

        preisCent(artikel: string): number {
          const preis = this.innere.preisCent(artikel);
          this.log.push(`${artikel}=${preis}`);
          return preis;
        }
      }
---
Dein Shop rechnet Rabatte, verschickt Mails über einen externen Dienst und fragt Wechselkurse bei einer
langsamen API ab. Drei ganz verschiedene Aufgaben – und doch lösen drei eng verwandte Muster sie elegant.
Alle drei bauen auf dem auf, was du aus dem SOLID-Modul kennst: Interfaces und Komposition.

## Strategy – austauschbares Verhalten

Das [[strategy-muster|Strategy-Muster]] verpackt jede Variante eines Verhaltens in eine eigene Klasse mit
gemeinsamem Interface. Wer das Verhalten braucht, bekommt eine Strategie übergeben und muss nicht wissen,
welche es ist.

```php
interface Sortierung
{
    /** @param list<Produkt> $produkte  @return list<Produkt> */
    public function sortiere(array $produkte): array;
}

final class NachPreisAufsteigend implements Sortierung
{
    public function sortiere(array $produkte): array
    {
        usort($produkte, fn (Produkt $a, Produkt $b) => $a->preisCent <=> $b->preisCent);
        return $produkte;
    }
}

final class Produktliste
{
    public function __construct(private Sortierung $sortierung) {}
}
```

Im Projekt dieses Kurses baust du genau so die Rabattregeln um: `StammkundenRabatt`, `FirmenRabatt` und
`KeinRabatt` sind Strategien, eine Factory wählt die passende aus.

> [!MERKSATZ]
> Strategy ersetzt eine wachsende Fallunterscheidung durch austauschbare Objekte. Die Auswahl geschieht
> an einer Stelle, die Verwendung überall gleich.

## Strategy in TypeScript

In TypeScript ist eine Strategie oft einfach eine **Funktion**. Ein Interface mit einer einzigen Methode
lässt sich als Funktionstyp ausdrücken – eine Klasse ist dann gar nicht nötig:

```ts
type Sortierung = (a: Produkt, b: Produkt) => number;

const nachPreis: Sortierung = (a, b) => a.preisCent - b.preisCent;
const nachName: Sortierung = (a, b) => a.name.localeCompare(b.name, 'de');

function sortiere(produkte: Produkt[], sortierung: Sortierung): Produkt[] {
  return [...produkte].sort(sortierung);
}
```

Das ist dasselbe Muster in leichterer Form. Auch PHP kennt das mit `callable` oder Closures. Greif zur
Klasse, wenn eine Strategie eigenen Zustand oder mehrere Methoden braucht.

## Adapter – fremde Schnittstellen übersetzen

Ein [[adapter-muster|Adapter]] macht eine Schnittstelle, die du nicht ändern kannst (etwa ein SDK eines
Anbieters), zu einem Interface passend, das **dein** Code erwartet. Wie ein Reisestecker: Die Steckdose
bleibt, wie sie ist – der Adapter übersetzt.

```php
// dein Interface – aus Sicht deiner Fachlogik formuliert
interface Zahlung
{
    public function belasten(Geld $betrag, string $bestellnummer): void;
}

// der Adapter übersetzt in die Sprache des Anbieters
final class BeispielPayAdapter implements Zahlung
{
    public function __construct(private BeispielPayClient $client) {}

    public function belasten(Geld $betrag, string $bestellnummer): void
    {
        $this->client->chargeAmount($betrag->cent, $betrag->waehrung, ref: $bestellnummer);
    }
}
```

Wechselst du später den Anbieter, schreibst du einen neuen Adapter. Die Fachlogik bleibt unberührt – das
ist das Dependency-Inversion-Prinzip in Aktion.

> [!FEHLER]
> **Den Adapter durchlässig machen.** Gibt dein Adapter Objekte oder Exceptions des SDK nach außen weiter,
> klebt deine Fachlogik doch wieder am Anbieter. Übersetze auch Rückgaben und Fehler in deine eigenen
> Typen.

## Decorator – Verhalten in Schichten

Ein [[decorator-muster|Decorator]] implementiert dasselbe Interface wie das Objekt, das er umhüllt. Er
gibt jeden Aufruf weiter und ergänzt **davor oder danach** etwas: Caching, Protokollierung, Zeitmessung,
Umleitung.

![Ein Aufruf läuft durch einen Protokoll- und einen Cache-Decorator bis zur echten Quelle](/assets/clean-code-solid-patterns/decorator-kette.svg)

```ts
class ProtokollierendeQuelle implements Kursquelle {
  constructor(private readonly innere: Kursquelle, private readonly log: string[]) {}

  async kurs(waehrung: string): Promise<number> {
    const wert = await this.innere.kurs(waehrung);
    this.log.push(`${waehrung}: ${wert}`);
    return wert;
  }
}

const quelle = new ProtokollierendeQuelle(new CachendeQuelle(new ApiKursquelle()), log);
```

Weil jeder Decorator selbst eine `Kursquelle` ist, kannst du sie beliebig **stapeln** und die Reihenfolge
frei wählen. Die echte Quelle weiß von alldem nichts. Im Kursprojekt leitest du so mit einem
`UmleitenderVersender` auf dem Testsystem alle Rechnungen an eine Testadresse um.

> [!PRAXIS]
> Decorators sind der saubere Weg, Querschnittsaufgaben wie Caching oder Logging nachzurüsten. Statt in
> zehn Services je ein `if ($cache->has(…))` einzubauen, legst du einen einzigen Decorator um das Interface.

## Drei Muster, ein Bauplan

Im Code sehen die drei Muster fast gleich aus: eine Klasse, die ein Interface implementiert und oft ein
anderes Objekt im Konstruktor bekommt. Unterscheiden kannst du sie an ihrer **Absicht**:

| Frage | Strategy | Adapter | Decorator |
|---|---|---|---|
| Was bekommt sie im Konstruktor? | meist nichts oder Einstellungen | ein fremdes Objekt (z. B. SDK) | ein Objekt mit **demselben** Interface |
| Was tut sie? | eine Variante des Verhaltens umsetzen | übersetzen | weitergeben und ergänzen |
| Woran erkennst du sie im Namen? | `FirmenRabatt`, `NachPreis` | `…Adapter`, Anbietername | `Cachende…`, `Protokollierende…` |

Ein sprechender Name, der die Rolle verrät, hilft deinem Team mehr als ein Kommentar „Dies ist ein Decorator“.

## Zusammenfassung

- **Strategy:** Varianten eines Verhaltens hinter einem gemeinsamen Interface; in TypeScript oft nur eine Funktion.
- **Adapter:** übersetzt eine fremde Schnittstelle in dein Interface und hält Anbieter-Details aus der Fachlogik.
- **Decorator:** umhüllt ein Objekt mit gleichem Interface und ergänzt Verhalten davor oder danach.
- Decorators lassen sich stapeln, weil jeder selbst das Interface erfüllt.
- Alle drei bauen auf Interfaces und Komposition auf – und lohnen sich nur, wenn es echte Varianten gibt.
