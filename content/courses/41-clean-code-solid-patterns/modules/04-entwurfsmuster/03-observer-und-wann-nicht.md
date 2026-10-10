---
title: Observer, Repository – und wann du keine Muster brauchst
summary: Wie Observer Ereignisse entkoppeln, was ein Repository leistet und wie YAGNI, KISS und DRY dich vor Überentwurf schützen – auch vor ihrem eigenen Missbrauch.
duration: 25
sources:
  - title: Refactoring Guru – Observer
    url: https://refactoring.guru/design-patterns/observer
  - title: Martin Fowler – Yagni
    url: https://martinfowler.com/bliki/Yagni.html
  - title: Martin Fowler – Repository
    url: https://martinfowler.com/eaaCatalog/repository.html
  - title: Laravel – Events
    url: https://laravel.com/docs/13.x/events
quiz:
  - type: single
    question: Welches Problem löst das Observer-Muster?
    options:
      - Ein Objekt soll mehrere andere über ein Ereignis informieren, ohne sie zu kennen.
      - Ein Objekt soll nur ein einziges Mal erzeugt werden.
      - Eine fremde Schnittstelle soll zu deinem Interface passen.
      - Daten sollen in einer Datenbank gespeichert werden.
    answer: 0
    explanation: Beim Observer meldet ein Subjekt „Bestellung aufgegeben“, und beliebig viele Beobachter reagieren darauf. Das Subjekt kennt nur das Ereignis, nicht die Beobachter.
  - type: match
    question: Ordne jedem Prinzip seine Bedeutung zu.
    pairs:
      - { left: "YAGNI", right: "Baue nichts, was heute noch niemand braucht" }
      - { left: "KISS", right: "Wähle die einfachste Lösung, die das Problem vollständig löst" }
      - { left: "DRY", right: "Jedes Stück Wissen hat genau eine maßgebliche Stelle im Code" }
    explanation: "YAGNI = You Aren't Gonna Need It, KISS = Keep It Simple, Stupid, DRY = Don't Repeat Yourself."
  - type: find-bug
    question: Zwei Funktionen wurden „wegen DRY“ zusammengelegt. In welcher Zeile zeigt sich, dass das falsch war?
    language: php
    code: |
      function pruefeName(string $name, bool $istFirma): void
      {
          $maxLaenge = 50;
          if ($istFirma) {
              $maxLaenge = 120;
          }
          if (mb_strlen($name) > $maxLaenge) {
              throw new InvalidArgumentException('Name zu lang');
          }
      }
    bug_line: 4
    explanation: Personen- und Firmennamen sahen nur zufällig gleich aus. Jetzt steuert ein Flag-Argument zwei verschiedene Regeln, und jede neue Abweichung macht die Funktion komplizierter. Zwei getrennte Funktionen wären klarer – das Wissen war gar nicht dasselbe.
  - type: multiple
    question: Welche Signale sprechen dafür, ein Muster (noch) nicht einzusetzen?
    options:
      - Es gibt genau eine Implementierung, und eine zweite ist nicht in Sicht.
      - Du begründest das Muster mit „vielleicht brauchen wir das später“.
      - Drei Stellen im Code enthalten dieselbe, wachsende Fallunterscheidung über Typen.
      - Das Muster würde fünf neue Dateien für eine Logik von zehn Zeilen erzeugen.
    answers: [0, 1, 3]
    explanation: Ein Muster lohnt sich, wenn es ein vorhandenes Problem löst – wie die wiederholte Fallunterscheidung. Spekulative Flexibilität kostet heute Lesbarkeit für einen Nutzen, der oft nie kommt.
tasks:
  - id: observer-ts
    type: code
    language: ts
    title: Ein kleiner Ereignis-Verteiler
    description: |
      Wenn eine Bestellung aufgegeben wird, sollen mehrere Teile des Systems reagieren (Mail, Lager,
      Statistik) – ohne dass der Bestellcode sie kennt. Baue einen kleinen **Observer**:

      1. `class Ereignisse` hat `abonniere(name: string, beobachter: (daten: unknown) => void): () => void`.
         Die zurückgegebene Funktion **kündigt** das Abo wieder.
      2. `melde(name: string, daten: unknown): number` ruft alle Beobachter dieses Ereignisses in der
         Reihenfolge der Anmeldung auf und gibt zurück, wie viele es waren.
      3. Ein Ereignis ohne Beobachter ist kein Fehler – `melde` liefert dann `0`.
    starter: |
      class Ereignisse {
        abonniere(name: string, beobachter: (daten: unknown) => void): () => void {
          return () => {};
        }

        melde(name: string, daten: unknown): number {
          return 0;
        }
      }
    tests:
      - name: Alle Beobachter werden in Reihenfolge benachrichtigt
        code: |
          const e = new Ereignisse();
          const log = [];
          e.abonniere('bestellt', (d) => log.push('mail:' + d.id));
          e.abonniere('bestellt', (d) => log.push('lager:' + d.id));
          assertEqual(e.melde('bestellt', { id: 7 }), 2);
          assertDeepEqual(log, ['mail:7', 'lager:7']);
      - name: Andere Ereignisse werden nicht vermischt
        code: |
          const e = new Ereignisse();
          const log = [];
          e.abonniere('storniert', () => log.push('storno'));
          assertEqual(e.melde('bestellt', {}), 0);
          assertDeepEqual(log, []);
      - name: Abo kündigen
        code: |
          const e = new Ereignisse();
          const log = [];
          const kuendigen = e.abonniere('bestellt', () => log.push('a'));
          e.abonniere('bestellt', () => log.push('b'));
          kuendigen();
          e.melde('bestellt', null);
          assertDeepEqual(log, ['b']);
    hints:
      - "Speichere die Beobachter in `private readonly abos = new Map<string, ((daten: unknown) => void)[]>();`."
      - "Zum Kündigen gibst du eine Funktion zurück, die genau diesen Beobachter aus der Liste filtert."
    solution: |
      type Beobachter = (daten: unknown) => void;

      class Ereignisse {
        private readonly abos = new Map<string, Beobachter[]>();

        abonniere(name: string, beobachter: Beobachter): () => void {
          this.abos.set(name, [...(this.abos.get(name) ?? []), beobachter]);
          return () => {
            this.abos.set(name, (this.abos.get(name) ?? []).filter((b) => b !== beobachter));
          };
        }

        melde(name: string, daten: unknown): number {
          const beobachter = this.abos.get(name) ?? [];
          for (const b of beobachter) {
            b(daten);
          }
          return beobachter.length;
        }
      }
  - id: muster-ja-nein
    type: steps
    title: Muster einsetzen oder nicht?
    description: Du arbeitest in einem kleinen Team an einem Buchungssystem. Entscheide in jeder Situation, was angemessen ist.
    steps:
      - situation: Es gibt genau eine Zahlungsart (Rechnung). Eine Kollegin schlägt vor, schon mal ein Interface, eine Factory und eine Strategy-Struktur für „spätere Zahlungsarten“ anzulegen.
        question: Was ist die beste Reaktion?
        options:
          - Sofort umsetzen, dann sind wir vorbereitet.
          - Vorerst eine einfache Klasse schreiben. Wenn die zweite Zahlungsart wirklich kommt, wird umgebaut.
          - Gar keine Klasse schreiben, sondern alles in den Controller.
        answer: 1
        explanation: YAGNI. Die Struktur kostet heute Lesbarkeit für einen Nutzen, der vielleicht nie kommt. Dank Tests ist der spätere Umbau günstig.
      - situation: Ein halbes Jahr später kommen Kartenzahlung und Ratenkauf dazu. In drei Klassen steht jetzt dasselbe `match` über die Zahlungsart.
        question: Was tust du jetzt?
        options:
          - Ein viertes match ergänzen, es funktioniert ja.
          - Ein Interface Zahlungsart mit einer Klasse pro Art einführen und die Auswahl in eine Factory legen.
          - Für jede Zahlungsart eine Unterklasse des Controllers bauen.
        answer: 1
        explanation: Jetzt gibt es ein echtes, wiederholtes Problem. Strategy plus Factory lösen es - neue Zahlungsarten sind künftig neue Klassen.
      - situation: "Zwei Funktionen formatieren Datumswerte: eine für Rechnungen (`d.m.Y`), eine für die API (ISO 8601). Sie sehen sich ähnlich."
        question: Solltest du sie wegen DRY zusammenlegen?
        options:
          - Ja, mit einem Parameter `$fuerApi`.
          - Nein, es sind zwei verschiedene Regeln, die sich aus unterschiedlichen Gründen ändern.
          - Ja, und zusätzlich einen DatumsformatiererFactory-Service anlegen.
        answer: 1
        explanation: DRY gilt für Wissen, nicht für ähnlich aussehende Zeilen. Rechnungsformat und API-Format ändern sich unabhängig voneinander – getrennt bleiben sie einfacher.
---
Ein neues Teammitglied hat gerade dieses Modul gelesen und ist begeistert. Im nächsten Pull Request steckt
eine Factory, die eine Strategy erzeugt, die ein Observer benachrichtigt – für eine Funktion, die eine
E-Mail-Adresse kleinschreibt. Diese Lektion zeigt dir das letzte Muster des Kurses – und die Prinzipien,
die dich vor genau diesem Pull Request bewahren.

## Observer – Ereignisse statt Abhängigkeiten

Wenn eine Bestellung aufgegeben wird, sollen viele Dinge passieren: Bestätigungsmail, Lager reservieren,
Statistik zählen. Ruft der Bestellcode all das direkt auf, kennt er jeden Beteiligten – und jede neue
Reaktion ändert ihn.

Beim [[observer-muster|Observer-Muster]] meldet ein Subjekt nur ein Ereignis. Beliebig viele Beobachter
haben sich vorher dafür angemeldet und reagieren:

```ts
const ereignisse = new Ereignisse();

ereignisse.abonniere('bestellung-aufgegeben', (bestellung) => mailer.bestaetige(bestellung));
ereignisse.abonniere('bestellung-aufgegeben', (bestellung) => lager.reserviere(bestellung));

// im Bestellcode – er kennt weder Mailer noch Lager
ereignisse.melde('bestellung-aufgegeben', bestellung);
```

Neue Reaktionen sind neue Beobachter, der Bestellcode bleibt unverändert. Du kennst das Muster schon aus
dem Browser: `addEventListener` ist ein Observer. In Laravel heißen die Bausteine [[event|Events]] und
Listener.

> [!FEHLER]
> **Unsichtbare Abläufe.** Mit vielen Beobachtern sieht man im Bestellcode nicht mehr, was alles passiert.
> Und wenn ein Beobachter einen Fehler wirft, bricht womöglich die ganze Bestellung ab. Nutze Observer
> für echte Nebenwirkungen, nicht für den Kernablauf, und halte fest, wer worauf hört.

## Repository – kurz und knapp

Ein [[repository-muster|Repository]] versteckt, **woher** Daten kommen. Die Fachlogik fragt
`$bestellungen->offeneVon($kunde)` und weiß nicht, ob dahinter SQL, eine API oder ein Array im Test steckt.

```php
interface Bestellungen
{
    public function mitNummer(string $nummer): ?Bestellung;

    public function speichere(Bestellung $bestellung): void;
}
```

Das ist vor allem beim Testen und bei komplexen Abfragen nützlich. In Laravel übernimmt Eloquent bereits
viel davon. Ein Repository, das jede Eloquent-Methode eins zu eins durchreicht, ist reiner Mehraufwand.
Setze es ein, wenn die Fachlogik wirklich von der Datenquelle getrennt sein soll.

## YAGNI, KISS und DRY

Drei kurze Merkregeln helfen dir, das richtige Maß zu finden:

| Prinzip | Bedeutung | Schützt vor |
|---|---|---|
| [[yagni|YAGNI]] | „You Aren't Gonna Need It“ – baue nur, was heute gebraucht wird | spekulativer Flexibilität |
| [[kiss|KISS]] | „Keep It Simple, Stupid“ – die einfachste vollständige Lösung gewinnt | cleveren, schwer lesbaren Konstruktionen |
| [[dry|DRY]] | „Don't Repeat Yourself“ – jedes Wissen hat genau eine Quelle | widersprüchlichen Kopien derselben Regel |

YAGNI ist kein Freibrief für schlampigen Code. Es heißt: Investiere in **Lesbarkeit und Tests** statt in
Erweiterungspunkte für Fälle, die vielleicht nie kommen. Gut getesteter, einfacher Code lässt sich später
günstig umbauen, wenn der Fall wirklich eintritt.

> [!MERKSATZ]
> Muster und Abstraktionen sind eine Antwort auf ein Problem, das du **heute** hast – nicht auf eines,
> das du dir für morgen vorstellst.

## Wenn Prinzipien missbraucht werden

Jedes der drei Prinzipien lässt sich übertreiben:

- **DRY falsch verstanden:** Zwei Codestellen sehen gleich aus, folgen aber unterschiedlichen Regeln. Wer
  sie zusammenlegt, braucht bald Flags und Sonderfälle. DRY meint gleiches **Wissen**, nicht gleiche Zeilen.
  Faustregel: Erst beim dritten Vorkommen abstrahieren, wenn klar ist, was wirklich gemeinsam ist.
- **KISS als Ausrede:** „Einfach“ heißt nicht „kurz“ oder „ohne Struktur“. Eine 300-Zeilen-Funktion ist
  nicht einfach, nur weil sie keine Klassen hat.
- **YAGNI gegen Grundlagen:** Tests, Fehlerbehandlung und gute Namen sind keine Spekulation – die
  brauchst du immer.

Und bei Mustern gilt: Wer ein Muster einsetzt, sollte das Problem benennen können, das es löst. Kannst
du das nicht, ist es [[ueberentwurf|Überentwurf]]. Auch das [[singleton|Singleton]] ist so ein Fall – es
klingt nach Muster, schafft aber oft nur eine versteckte globale Abhängigkeit.

> [!PRAXIS]
> In guten Code-Reviews hört man oft die Frage: „Welches Problem löst diese Abstraktion heute?“ Ist die
> Antwort „noch keins“, wird sie entfernt. Weniger Code ist weniger Code, den jemand verstehen muss.

## Zusammenfassung

- **Observer:** Ein Subjekt meldet Ereignisse, beliebig viele Beobachter reagieren – ohne dass das Subjekt sie kennt.
- Observer passen für Nebenwirkungen, nicht für den Kernablauf.
- Ein **Repository** versteckt die Datenquelle hinter einem fachlichen Interface – nur einsetzen, wenn es wirklich trennt.
- **YAGNI**, **KISS** und **DRY** schützen vor Überentwurf, Cleverness und widersprüchlichen Kopien.
- DRY gilt für Wissen, nicht für ähnlich aussehende Zeilen.
- Ein Muster braucht ein Problem, das es heute löst – sonst ist es Überentwurf.
