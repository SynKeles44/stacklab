---
title: Feature-Flags und Parallelbetrieb
summary: Wie du neuen Code abgesichert live bringst – erst im Schatten neben dem alten, dann für wenige Nutzer, dann für alle, mit einem Notausschalter.
duration: 24
sources:
  - title: Martin Fowler – Feature Toggles
    url: https://martinfowler.com/articles/feature-toggles.html
  - title: Martin Fowler – Dark Launching
    url: https://martinfowler.com/bliki/DarkLaunching.html
  - title: Laravel-Dokumentation – Pennant (Feature-Flags)
    url: https://laravel.com/docs/13.x/pennant
  - title: PHP-Handbuch – getenv
    url: https://www.php.net/manual/de/function.getenv.php
quiz:
  - type: single
    question: Was passiert im Parallelbetrieb (Schattenbetrieb) mit dem Ergebnis des neuen Codes?
    options:
      - Es wird an die Nutzer ausgeliefert, das alte Ergebnis wird verworfen.
      - Es wird nur mit dem alten Ergebnis verglichen; ausgeliefert wird weiterhin das alte.
      - Es wird in die Datenbank geschrieben, damit es nicht verloren geht.
    answer: 1
    explanation: >
      Im Schattenbetrieb ist der alte Code noch die Wahrheit. Der neue läuft mit echten Eingaben mit, Abweichungen
      werden protokolliert – aber kein Nutzer bekommt das neue Ergebnis zu sehen.
  - type: multiple
    question: Was gehört zu einem guten Feature-Flag für eine Modernisierung?
    options:
      - Er lässt sich ohne Deployment umschalten.
      - Er hat einen sicheren Standardwert, der den alten Weg nimmt.
      - Er bleibt für immer im Code, falls man ihn noch einmal braucht.
      - Es steht fest, wer ihn verantwortet und wann er entfernt wird.
    answers: [0, 1, 3]
    explanation: >
      Flags für Modernisierungen sind kurzlebig. Nach der Umstellung werden sie samt altem Pfad entfernt –
      sonst wachsen sie selbst zu technischen Schulden.
  - type: find-bug
    question: Dieser Schattenbetrieb soll den alten Preis ausliefern und Abweichungen protokollieren. Welche Zeile ist gefährlich?
    language: php
    code: |
      function preis_mit_schatten(string $kiste, int $menge, string $typ): float
      {
          $alt = berechne_preis($kiste, $menge, $typ);
          $neu = $GLOBALS['rechner']->preis($kiste, $menge, $typ);
          if ($alt !== $neu) {
              protokolliere_abweichung($kiste, $menge, $typ, $alt, $neu);
          }
          return $alt;
      }
    bug_line: 4
    explanation: >
      Wirft der neue Code eine Exception, bricht die ganze Anfrage ab – der Schatten hat die Produktion lahmgelegt.
      Der Aufruf des neuen Codes gehört in ein try/catch, Fehler werden nur protokolliert.
  - type: cloze
    text: "Ein Flag, mit dem du eine neue Funktion im Notfall sofort abschaltest, nennt man ___. Neuen Code zuerst nur für einen kleinen Teil der Nutzer freizuschalten, heißt ___-Release."
    blanks:
      - [Kill-Switch, Killswitch, Notausschalter]
      - [Canary]
    explanation: Kill-Switch und Canary-Release begrenzen den Schaden, falls der neue Code doch einen Fehler hat.
tasks:
  - id: parallelbetrieb-klasse
    type: code
    language: php
    title: Baue einen Parallelbetrieb
    description: |
      Schreib die Klasse `Parallelbetrieb`. Sie bekommt im Konstruktor zwei Funktionen: `$alt` (die Wahrheit) und
      `$neu` (der Kandidat).

      - `ausfuehren(mixed ...$argumente): mixed` ruft **beide** Funktionen mit denselben Argumenten auf und gibt
        **immer** das Ergebnis von `$alt` zurück.
      - Sind die Ergebnisse nicht identisch (`!==`), wird eine Abweichung gespeichert:
        `['argumente' => $argumente, 'alt' => …, 'neu' => …]`.
      - Wirft `$neu` eine Exception, wird sie abgefangen und als
        `['argumente' => $argumente, 'alt' => …, 'fehler' => $e->getMessage()]` gespeichert.
      - Wirft `$alt` eine Exception, darf sie ganz normal nach außen durchgehen – der alte Code ist die Wahrheit.
      - `abweichungen(): array` liefert alle gespeicherten Abweichungen.
    starter: |
      <?php
      declare(strict_types=1);

      final class Parallelbetrieb
      {
          private array $abweichungen = [];

          public function __construct(
              private Closure $alt,
              private Closure $neu,
          ) {
          }

          public function ausfuehren(mixed ...$argumente): mixed
          {
              return ($this->alt)(...$argumente);
          }

          public function abweichungen(): array
          {
              return $this->abweichungen;
          }
      }
    tests:
      - name: Gleiche Ergebnisse erzeugen keine Abweichung
        code: |
          $p = new Parallelbetrieb(fn (int $a) => $a * 2, fn (int $a) => $a + $a);
          assert_same(10, $p->ausfuehren(5));
          assert_same([], $p->abweichungen());
      - name: Abweichung wird gespeichert, ausgeliefert wird das alte Ergebnis
        code: |
          $p = new Parallelbetrieb(fn (float $p) => round($p * 0.9 - 2, 2), fn (float $p) => round(($p - 2) * 0.9, 2));
          assert_same(114.1, $p->ausfuehren(129.0));
          assert_same([['argumente' => [129.0], 'alt' => 114.1, 'neu' => 114.3]], $p->abweichungen());
      - name: Exception im neuen Code wird abgefangen
        code: |
          $p = new Parallelbetrieb(fn (string $k) => strtoupper($k), function (string $k) { throw new RuntimeException('kaputt'); });
          assert_same('KLEIN', $p->ausfuehren('klein'));
          assert_same([['argumente' => ['klein'], 'alt' => 'KLEIN', 'fehler' => 'kaputt']], $p->abweichungen());
      - name: Exception im alten Code geht nach außen
        code: |
          $p = new Parallelbetrieb(function () { throw new LogicException('alt kaputt'); }, fn () => 1);
          $geworfen = false;
          try {
              $p->ausfuehren();
          } catch (LogicException $e) {
              $geworfen = true;
          }
          assert_true($geworfen);
      - name: Mehrere Aufrufe sammeln mehrere Abweichungen
        code: |
          $p = new Parallelbetrieb(fn (int $a) => $a, fn (int $a) => $a === 3 ? 4 : $a);
          $p->ausfuehren(1);
          $p->ausfuehren(3);
          $p->ausfuehren(3);
          assert_same(2, count($p->abweichungen()));
    solution: |
      <?php
      declare(strict_types=1);

      final class Parallelbetrieb
      {
          private array $abweichungen = [];

          public function __construct(
              private Closure $alt,
              private Closure $neu,
          ) {
          }

          public function ausfuehren(mixed ...$argumente): mixed
          {
              $alt = ($this->alt)(...$argumente);

              try {
                  $neu = ($this->neu)(...$argumente);
              } catch (Throwable $e) {
                  $this->abweichungen[] = ['argumente' => $argumente, 'alt' => $alt, 'fehler' => $e->getMessage()];

                  return $alt;
              }

              if ($alt !== $neu) {
                  $this->abweichungen[] = ['argumente' => $argumente, 'alt' => $alt, 'neu' => $neu];
              }

              return $alt;
          }

          public function abweichungen(): array
          {
              return $this->abweichungen;
          }
      }
    hints:
      - "Ruf zuerst `$alt` auf – ohne try/catch. Danach `$neu` innerhalb von `try { … } catch (Throwable $e) { … }`."
      - "Variadische Argumente reichst du mit `...$argumente` weiter; `$argumente` selbst ist ein Array."
  - id: rollout-entscheidungen
    type: steps
    title: Die neue Preisberechnung geht live
    description: Begleite die Umstellung der Preislogik der Gemüsekiste vom Schatten bis zum Aufräumen.
    steps:
      - situation: >
          Der neue Preisrechner läuft seit einer Woche im Schattenbetrieb. Das Protokoll zeigt 3 Abweichungen bei
          40.000 Anfragen – alle bei Stammkunden mit mehr als fünf Kisten.
        question: Was tust du?
        options:
          - Sofort für alle umschalten – 3 von 40.000 ist praktisch nichts.
          - Die Ursache klären, den neuen Code korrigieren und den Schattenbetrieb weiterlaufen lassen, bis keine Abweichung mehr auftaucht.
          - Den Schattenbetrieb abschalten, weil er Fehler findet.
        answer: 1
        explanation: >
          Jede Abweichung ist ein Preis, den ein echter Kunde anders bezahlen würde. Der Schatten hat genau seinen Job
          gemacht: einen Fehler gefunden, bevor er Schaden anrichtet.
      - situation: >
          Zwei Wochen ohne Abweichung. Das Team schaltet das Flag auf „an“ – zuerst für 5 Prozent der Anfragen.
          Nach einer Stunde steigt die Fehlerrate im Monitoring deutlich.
        question: Was ist der schnellste sichere Schritt?
        options:
          - Den Kill-Switch umlegen, also das Flag zurück auf „aus“, und danach in Ruhe untersuchen.
          - Einen Hotfix schreiben und deployen, während der Fehler weiterläuft.
        answer: 0
        explanation: >
          Das Flag ist der Notausschalter: Ein Umschalten dauert Sekunden, ein Deployment Minuten bis Stunden. Erst
          stabilisieren, dann reparieren.
      - situation: >
          Einen Monat später läuft die neue Preisberechnung für alle Anfragen fehlerfrei.
        question: Was fehlt noch?
        options:
          - Nichts – das Flag kann für alle Fälle im Code bleiben.
          - Flag, alten Pfad und Schatten-Code entfernen, den Golden Master bewusst neu erzeugen und das alte Feature aus der Routenliste streichen.
        answer: 1
        explanation: >
          Ein Flag nach der Umstellung ist toter Code mit Schalter. Aufräumen gehört zur Modernisierung – sonst
          sammeln sich verwaiste Flags an.
---
Der neue Preisrechner ist fertig, getestet und der Golden Master ist grün. Trotzdem hat das Team ein mulmiges Gefühl: Die
Testdaten decken sieben Fälle ab, die Kundschaft bestellt aber in Tausenden Kombinationen. Was, wenn ein Sonderfall
fehlt? Die Lösung: Den neuen Code mit **echten** Anfragen prüfen, bevor er **echte** Preise bestimmt.

## Ausliefern ist nicht gleich freischalten

Bei einer Modernisierung trennst du zwei Dinge, die sonst zusammenfallen:

| Schritt | Bedeutung |
|---|---|
| **Deployment** | Der neue Code liegt auf dem Server |
| **Release** | Nutzer bekommen das Ergebnis des neuen Codes |

Ein [[feature-flag|Feature-Flag]] ist der Schalter dazwischen. Der neue Code wird ausgeliefert, bleibt aber aus,
bis du ihn bewusst einschaltest – ohne neues Deployment.

```php title="Ein einfaches Flag über eine Umgebungsvariable"
$modus = getenv('NEUE_PREISE') ?: 'aus';   // aus | schatten | an
```

Statt einer [[umgebungsvariable|Umgebungsvariable]] kann der Schalter auch in der Datenbank oder einem
Flag-Dienst liegen. In Laravel-Projekten übernimmt das Paket Pennant diese Aufgabe.

> [!MERKSATZ]
> Der Standardwert eines Modernisierungs-Flags nimmt **immer den alten Weg**. Fehlt die Einstellung, passiert nichts
> Neues.

## Parallelbetrieb: der neue Code im Schatten

Im [[parallelbetrieb|Parallelbetrieb]] (auch Schattenbetrieb) laufen alter und neuer Code mit **denselben echten
Eingaben**. Ausgeliefert wird das alte Ergebnis, Unterschiede landen im Protokoll:

```php title="seiten/preis.php – Modus schatten"
$alt = berechne_preis($kiste, $menge, $typ);
try {
    $neu = $rechner->preis($kiste, (int) $menge, $typ);
    if ($alt !== $neu) {
        file_put_contents('data/abweichungen.log', "$kiste|$menge|$typ alt=$alt neu=$neu\n", FILE_APPEND);
    }
} catch (Throwable $e) {
    file_put_contents('data/abweichungen.log', "$kiste|$menge|$typ fehler={$e->getMessage()}\n", FILE_APPEND);
}
echo formatiere_preis($alt) . "\n";
```

So wird jede reale Anfrage zum Testfall. Nach einigen Tagen ohne Abweichung weißt du mehr als nach jedem Testlauf.

> [!FEHLER]
> Den neuen Code im Schatten ohne `try/catch` aufrufen. Wirft er eine Exception, stürzt die Anfrage ab – der Schatten,
> der nur beobachten sollte, legt die Produktion lahm.

## Schatten mit Nebenwirkungen

Parallelbetrieb ist einfach, solange der neue Code nur **rechnet**. Schwierig wird es bei Nebenwirkungen:

| Neuer Code … | Gefahr im Schatten | Abhilfe |
|---|---|---|
| verschickt E-Mails | Kunden bekommen alles doppelt | E-Mail-Versand im Schatten durch einen Fake ersetzen |
| schreibt in die Datenbank | Doppelte oder widersprüchliche Daten | In eine Schattentabelle schreiben |
| ruft eine Zahlungs-API auf | Doppelte Abbuchung | Im Schatten niemals aufrufen |
| ist langsam | Jede Anfrage wird langsamer | Nur einen Teil der Anfragen spiegeln |

Diese Technik heißt auch [[dark-launch|Dark Launch]]: Neuer Code läuft unter Volllast, ohne dass es jemand sieht.

## Schrittweise einschalten

Hat der Schatten lange genug keine Abweichung gezeigt, schaltest du in Stufen um:

1. **Schatten** – alt ausliefern, neu vergleichen.
2. **[[canary-release|Canary]]** – neu für einen kleinen Teil (z. B. 5 Prozent oder nur interne Nutzer).
3. **Alle** – neu für alle, alt bleibt per Flag erreichbar.
4. **Aufräumen** – Flag, alten Code und Schatten-Logik entfernen.

In jeder Stufe ist das Flag ein [[kill-switch|Kill-Switch]]: Zurück auf „aus“ dauert Sekunden, ein Hotfix Stunden.

> [!PRAXIS]
> Professionelle Teams schreiben für jedes Flag auf, wer es verantwortet und bis wann es entfernt wird. Ein Ticket
> „Flag NEUE_PREISE entfernen“ entsteht schon an dem Tag, an dem das Flag angelegt wird.

## Zusammenfassung

- **Deployment** und **Release** sind getrennte Schritte – ein Feature-Flag ist der Schalter dazwischen.
- Der Standardwert eines Flags nimmt den **alten** Weg.
- Im **Parallelbetrieb** laufen alt und neu mit echten Eingaben; ausgeliefert wird alt, Abweichungen werden protokolliert.
- Neuen Code im Schatten immer in `try/catch` aufrufen und Nebenwirkungen abschirmen.
- Umschalten in Stufen: Schatten → Canary → alle → aufräumen; das Flag dient als **Kill-Switch**.
