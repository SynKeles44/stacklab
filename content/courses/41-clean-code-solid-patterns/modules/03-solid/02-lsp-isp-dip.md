---
title: "SOLID II: Liskov, Interface Segregation und Dependency Inversion"
summary: Wann eine Implementierung wirklich austauschbar ist, warum kleine Interfaces besser sind als große und wie du Abhängigkeiten umkehrst.
duration: 25
sources:
  - title: PHP-Handbuch – Interfaces
    url: https://www.php.net/manual/de/language.oop5.interfaces.php
  - title: PHP-Handbuch – Kovarianz und Kontravarianz
    url: https://www.php.net/manual/de/language.oop5.variance.php
  - title: TypeScript Handbook – Object Types
    url: https://www.typescriptlang.org/docs/handbook/2/objects.html
  - title: TypeScript Handbook – Classes
    url: https://www.typescriptlang.org/docs/handbook/2/classes.html
quiz:
  - type: find-bug
    question: "`Speicher` hat die Methoden `lies()` und `schreibe()`. Welche Zeile verletzt das Liskovsche Substitutionsprinzip?"
    language: php
    code: |
      final class NurLeseSpeicher implements Speicher
      {
          public function lies(string $schluessel): ?string
          {
              return $this->daten[$schluessel] ?? null;
          }

          public function schreibe(string $schluessel, string $wert): void
          {
              throw new LogicException('Nur lesbar!');
          }
      }
    bug_line: 10
    explanation: Wer einen `Speicher` bekommt, darf sich darauf verlassen, dass `schreibe()` funktioniert. Diese Implementierung bricht das Versprechen. Besser - zwei Interfaces, `LesbarerSpeicher` und `BeschreibbarerSpeicher`, und die Klasse implementiert nur das erste.
  - type: single
    question: Was sagt das Dependency-Inversion-Prinzip?
    options:
      - Klassen sollen ihre Abhängigkeiten in umgekehrter Reihenfolge laden.
      - Fachlogik soll von Abstraktionen (Interfaces) abhängen, und die technischen Details implementieren diese Abstraktionen.
      - Jede Klasse braucht einen Dependency-Injection-Container.
      - Abhängigkeiten zwischen Klassen sind grundsätzlich verboten.
    answer: 1
    explanation: Die Abhängigkeit wird umgedreht - nicht mehr die Fachlogik hängt am Mailserver, sondern der Mailserver-Adapter erfüllt ein Interface, das die Fachlogik definiert. Ein Container ist dafür nicht nötig.
  - type: multiple
    question: Welche Interfaces folgen dem Interface-Segregation-Prinzip?
    options:
      - "`interface Exportierbar { public function export(): string; }`"
      - "`interface Mitarbeiter { arbeite(); esse(); schlafe(); erstelleBericht(); genehmigeUrlaub(); }`"
      - "`interface Uhr { public function jetzt(): DateTimeImmutable; }`"
      - Ein Interface, bei dem die Hälfte der Klassen Methoden leer implementieren.
    answers: [0, 2]
    explanation: Kleine, passgenaue Interfaces zwingen niemanden, Methoden zu implementieren, die er nicht braucht. Leere oder werfende Pflicht-Methoden sind das typische Warnzeichen für ein zu großes Interface.
  - type: match
    question: Ordne jedem Prinzip das passende Warnzeichen zu.
    pairs:
      - { left: "Liskov Substitution", right: "Eine Implementierung wirft bei einer Methode des Vertrags eine Exception" }
      - { left: "Interface Segregation", right: "Klassen implementieren Interface-Methoden leer, weil sie sie nicht brauchen" }
      - { left: "Dependency Inversion", right: "Fachlogik erzeugt mit new direkt einen SMTP-Client" }
    explanation: Jedes der drei Prinzipien hat ein typisches Symptom, an dem du einen Verstoß im Code-Review schnell erkennst.
tasks:
  - id: dip-diagramm
    type: diagram
    title: Die Abhängigkeit umdrehen
    description: |
      Links siehst du den Zustand vorher: Der `RechnungsService` erzeugt direkt einen `SmtpMailer`. Rechts
      ist die Abhängigkeit umgedreht. Beschrifte die vier Kästen auf der rechten Seite.
    image: /assets/clean-code-solid-patterns/dependency-inversion-leer.svg
    slots:
      - { x: 74, y: 28, answer: RechnungsService }
      - { x: 74, y: 56, answer: "Interface Versender" }
      - { x: 62, y: 84, answer: SmtpVersender }
      - { x: 87, y: 84, answer: FakeVersender }
    distractors: [Datenbank, Controller]
    hints:
      - Die Fachlogik steht oben und kennt nur das Interface in der Mitte. Unten stehen die konkreten Umsetzungen – eine echte und eine für Tests.
  - id: erinnerungen-dip
    type: code
    language: ts
    title: Abhängigkeit von außen übergeben
    description: |
      Der `Erinnerungsdienst` erinnert Kund:innen an offene Rechnungen. Leider erzeugt er seinen
      `KonsolenKanal` selbst – im Test kannst du nicht prüfen, was verschickt wurde. Kehre die Abhängigkeit um:

      1. Lege das Interface `Nachrichtenkanal` mit der Methode `senden(an: string, text: string): void` an.
      2. Der `Erinnerungsdienst` bekommt einen `Nachrichtenkanal` im **Konstruktor**.
      3. `erinnere(kunden)` schickt nur Kund:innen mit `offenCent > 0` den Text `Offen: 12,50 EUR`
         (Komma als Dezimaltrennzeichen) und gibt die Anzahl der Nachrichten zurück.
    starter: |
      class KonsolenKanal {
        senden(an: string, text: string): void {
          console.log(`${an}: ${text}`);
        }
      }

      type Kunde = { email: string; offenCent: number };

      class Erinnerungsdienst {
        private kanal = new KonsolenKanal();

        erinnere(kunden: Kunde[]): number {
          let anzahl = 0;
          for (const kunde of kunden) {
            if (kunde.offenCent > 0) {
              this.kanal.senden(kunde.email, 'Offen: ' + (kunde.offenCent / 100).toFixed(2).replace('.', ',') + ' EUR');
              anzahl++;
            }
          }
          return anzahl;
        }
      }
    tests:
      - name: Nur Kund:innen mit offenem Betrag werden erinnert
        code: |
          const gesendet = [];
          const dienst = new Erinnerungsdienst({ senden(an, text) { gesendet.push(an + '|' + text); } });
          const anzahl = dienst.erinnere([
            { email: 'ada@example.com', offenCent: 1250 },
            { email: 'grace@example.com', offenCent: 0 },
          ]);
          assertEqual(anzahl, 1);
          assertDeepEqual(gesendet, ['ada@example.com|Offen: 12,50 EUR']);
      - name: Leere Liste verschickt nichts
        code: |
          const gesendet = [];
          const dienst = new Erinnerungsdienst({ senden(an, text) { gesendet.push(an); } });
          assertEqual(dienst.erinnere([]), 0);
          assertEqual(gesendet.length, 0);
      - name: Beträge unter einem Euro werden korrekt formatiert
        code: |
          const gesendet = [];
          new Erinnerungsdienst({ senden(an, text) { gesendet.push(text); } }).erinnere([{ email: 'linus@example.com', offenCent: 5 }]);
          assertDeepEqual(gesendet, ['Offen: 0,05 EUR']);
    hints:
      - "`interface Nachrichtenkanal { senden(an: string, text: string): void; }`"
      - "Mit einer Parameter-Property wird der Konstruktor ein Einzeiler: `constructor(private readonly kanal: Nachrichtenkanal) {}`."
      - "`KonsolenKanal` darf bleiben und kann `implements Nachrichtenkanal` bekommen – erzeugt wird er aber außerhalb des Dienstes."
    solution: |
      interface Nachrichtenkanal {
        senden(an: string, text: string): void;
      }

      class KonsolenKanal implements Nachrichtenkanal {
        senden(an: string, text: string): void {
          console.log(`${an}: ${text}`);
        }
      }

      type Kunde = { email: string; offenCent: number };

      function formatiereEuro(cent: number): string {
        return (cent / 100).toFixed(2).replace('.', ',') + ' EUR';
      }

      class Erinnerungsdienst {
        constructor(private readonly kanal: Nachrichtenkanal) {}

        erinnere(kunden: Kunde[]): number {
          const offene = kunden.filter((kunde) => kunde.offenCent > 0);
          for (const kunde of offene) {
            this.kanal.senden(kunde.email, `Offen: ${formatiereEuro(kunde.offenCent)}`);
          }
          return offene.length;
        }
      }

      // Zusammengesetzt wird außerhalb, z. B. beim Programmstart:
      const dienst = new Erinnerungsdienst(new KonsolenKanal());
---
Ein Kollege hat eine neue Klasse `NurLeseSpeicher` gebaut, die das Interface `Speicher` erfüllt – formal
alles korrekt. Trotzdem stürzt der Import am nächsten Tag ab: Er hat versucht, in den Speicher zu
schreiben. Die letzten drei SOLID-Prinzipien drehen sich darum, was Interfaces **versprechen** und wer von
wem abhängt.

## L – Liskovsches Substitutionsprinzip

Das [[liskovsches-substitutionsprinzip|Liskovsche Substitutionsprinzip]] (LSP) sagt: Überall, wo ein Typ
erwartet wird, muss **jede** seiner Implementierungen funktionieren – ohne dass der Aufrufer es merkt.

Ein Interface ist mehr als eine Liste von Methodennamen. Es ist ein **Versprechen** über Verhalten. Wer
`Speicher::schreibe()` aufruft, erwartet, dass danach etwas gespeichert ist.

Typische Verstöße:

| Verstoß | Beispiel |
|---|---|
| Methode wirft, obwohl der Vertrag es nicht vorsieht | `schreibe()` wirft „Nur lesbar!“ |
| Strengere Vorbedingung | Unterklasse akzeptiert nur noch positive Beträge |
| Schwächere Zusage | `finde()` liefert plötzlich `null`, obwohl der Vertrag ein Objekt verspricht |
| Stille Sonderbehandlung | Aufrufer brauchen `if ($speicher instanceof NurLeseSpeicher)` |

Das letzte Zeichen ist das deutlichste: Muss Code den konkreten Typ prüfen, ist die Austauschbarkeit
kaputt. PHP hilft dir übrigens teilweise: Es erlaubt bei Rückgabetypen nur gleiche oder speziellere Typen
und bei Parametern nur gleiche oder allgemeinere – das ist die technische Seite des LSP.

> [!MERKSATZ]
> Eine Implementierung darf nicht weniger halten, als das Interface verspricht. Kann sie das nicht,
> gehört sie zu einem anderen Interface.

## I – Interface Segregation

Das [[interface-segregation-prinzip|Interface-Segregation-Prinzip]] (ISP) sagt: Niemand soll gezwungen
sein, von Methoden abzuhängen, die er nicht benutzt. Lieber mehrere kleine Interfaces als ein großes.

```php
// vorher: Jeder Speicher muss alles können
interface Speicher
{
    public function lies(string $schluessel): ?string;
    public function schreibe(string $schluessel, string $wert): void;
    public function loesche(string $schluessel): void;
}

// nachher: passgenaue Interfaces
interface LesbarerSpeicher
{
    public function lies(string $schluessel): ?string;
}

interface BeschreibbarerSpeicher
{
    public function schreibe(string $schluessel, string $wert): void;
    public function loesche(string $schluessel): void;
}

final class NurLeseSpeicher implements LesbarerSpeicher { /* … */ }
final class DateiSpeicher implements LesbarerSpeicher, BeschreibbarerSpeicher { /* … */ }
```

Damit löst das ISP gleich das LSP-Problem von oben: `NurLeseSpeicher` verspricht gar nicht mehr, schreiben
zu können. Und ein Bericht, der nur liest, verlangt nur einen `LesbarerSpeicher`.

In TypeScript hilft dir die [[strukturelle-typisierung|strukturelle Typisierung]]: Ein Objekt erfüllt ein
Interface, sobald es die Methoden hat – du kannst kleine Interfaces frei kombinieren, etwa mit
`LesbarerSpeicher & BeschreibbarerSpeicher`.

## D – Dependency Inversion

Das [[dependency-inversion-prinzip|Dependency-Inversion-Prinzip]] (DIP) dreht die übliche Richtung um.
Normalerweise hängt Fachlogik direkt an technischen Details:

```php
final class RechnungsService
{
    public function abschliessen(Rechnung $rechnung): void
    {
        $mailer = new SmtpMailer('smtp.example.com', 587); // Fachlogik kennt den Mailserver
        $mailer->send($rechnung->email(), 'Ihre Rechnung');
    }
}
```

Jede Änderung am Versand trifft die Fachlogik, und testen kannst du `abschliessen()` nur mit einem
echten Mailserver. Beim DIP definiert die Fachlogik ein Interface für das, was **sie** braucht – und die
Technik richtet sich danach:

![Vorher hängt der Service am SmtpMailer, nachher hängen Service und Implementierungen am Interface Versender](/assets/clean-code-solid-patterns/dependency-inversion.svg)

```php
interface Versender
{
    public function sende(string $empfaenger, string $betreff): void;
}

final class RechnungsService
{
    public function __construct(private Versender $versender) {}

    public function abschliessen(Rechnung $rechnung): void
    {
        $this->versender->sende($rechnung->email(), 'Ihre Rechnung');
    }
}

final class SmtpVersender implements Versender { /* SMTP-Details */ }
```

Jetzt zeigen alle Pfeile auf das Interface. Der Service weiß nichts mehr über SMTP – im Test übergibst du
einfach einen [[fake-objekt|Fake]], der die Nachrichten in einem Array sammelt.

## DIP in TypeScript

In TypeScript sieht es genauso aus. Eine [[konstruktor-promotion|Parameter-Property]] (das TypeScript-
Gegenstück zur Constructor Promotion in PHP) spart dabei Schreibarbeit:

```ts
interface Versender {
  sende(empfaenger: string, betreff: string): Promise<void>;
}

class RechnungsService {
  constructor(private readonly versender: Versender) {}

  async abschliessen(rechnung: Rechnung): Promise<void> {
    await this.versender.sende(rechnung.email, 'Ihre Rechnung');
  }
}

// im Test
const gesendet: string[] = [];
const service = new RechnungsService({ sende: async (an) => { gesendet.push(an); } });
```

> [!FEHLER]
> **Interface nach der Technik benennen.** Ein Interface `SmtpMailerInterface` mit Methoden wie
> `setPort()` kehrt nichts um – die Fachlogik hängt immer noch an SMTP. Das Interface beschreibt, was die
> Fachlogik braucht (`Versender::sende()`), nicht wie die Technik funktioniert.

> [!PRAXIS]
> Frameworks wie Laravel bauen auf dem DIP auf: Du schreibst gegen ein Interface, und der
> [[service-container|Service-Container]] entscheidet, welche Implementierung übergeben wird – im Test
> eine andere als in Produktion.

## Zusammenfassung

- **LSP:** Jede Implementierung hält das gesamte Versprechen ihres Interfaces – sonst ist sie nicht austauschbar.
- `instanceof`-Prüfungen auf konkrete Klassen sind ein Warnzeichen für einen LSP-Verstoß.
- **ISP:** Kleine, passgenaue Interfaces statt eines großen, das niemand vollständig braucht.
- **DIP:** Fachlogik definiert Interfaces für ihre Bedürfnisse, Technik implementiert sie.
- Durch das DIP wird Fachlogik ohne echte Mailserver, Datenbanken oder APIs testbar.
- Interfaces beschreiben das **Was** aus Sicht der Fachlogik, nicht das **Wie** der Technik.
