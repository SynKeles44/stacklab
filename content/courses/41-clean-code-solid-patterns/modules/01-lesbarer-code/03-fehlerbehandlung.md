---
title: Fehlerbehandlung, die Probleme sichtbar macht
summary: Exceptions statt Fehlercodes, eigene Fehlerklassen, Fail Fast und warum du Fehler nur dort fängst, wo du wirklich reagieren kannst.
duration: 25
sources:
  - title: PHP-Handbuch – Die Klasse Exception
    url: https://www.php.net/manual/de/class.exception.php
  - title: PHP-Handbuch – Vordefinierte Exceptions (SPL)
    url: https://www.php.net/manual/de/spl.exceptions.php
  - title: MDN – Error
    url: https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Error
  - title: TypeScript Handbook – Narrowing
    url: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
quiz:
  - type: single
    question: Eine Funktion gibt bei einem Fehler `false` zurück, sonst einen Betrag. Was ist das größte Problem?
    options:
      - "`false` ist langsamer als eine Exception."
      - Jeder Aufrufer muss daran denken, das Ergebnis zu prüfen – vergisst er es, rechnet er mit `false` weiter.
      - PHP erlaubt keine Rückgabe von `false`.
      - Man kann `false` nicht loggen.
    answer: 1
    explanation: "Ein Fehlercode als Rückgabewert lässt sich still übersehen. In PHP wird `false` in einer Rechnung sogar zu 0 – der Fehler taucht erst viel später als falscher Betrag auf."
  - type: find-bug
    question: In welcher Zeile wird ein Fehler verschluckt?
    language: php
    code: |
      function ladeKonfiguration(string $pfad): array
      {
          try {
              $inhalt = file_get_contents($pfad);
              return json_decode($inhalt, true, flags: JSON_THROW_ON_ERROR);
          } catch (JsonException $e) {
              return [];
          }
      }
    bug_line: 7
    explanation: Eine kaputte Konfigurationsdatei wird stillschweigend zu einer leeren Konfiguration. Die App läuft weiter, aber mit falschen Werten – und niemand erfährt, warum. Besser ist es, die Exception weiterzureichen oder mit Kontext neu zu werfen.
  - type: multiple
    question: Welche Aussagen zu eigenen Exception-Klassen stimmen?
    options:
      - Sie erlauben Aufrufern, gezielt genau diesen Fehlerfall zu fangen.
      - Sie sollten von einer passenden Standard-Exception wie `InvalidArgumentException` erben.
      - Für jede einzelne Zeile, die fehlschlagen kann, brauchst du eine eigene Klasse.
      - Ihr Name beschreibt das fachliche Problem, z. B. `ArtikelNichtGefunden`.
    answers: [0, 1, 3]
    explanation: Eigene Klassen lohnen sich für fachliche Fehlerfälle, auf die jemand gezielt reagieren will. Eine Klasse pro Zeile wäre übertrieben.
  - type: match
    question: Ordne jeder Situation das passende Vorgehen zu.
    pairs:
      - { left: "Ein Pflichtparameter ist negativ", right: "Sofort eine Exception werfen (Fail Fast)" }
      - { left: "Im Controller schlägt eine Zahlung fehl", right: "Exception fangen und eine verständliche Antwort zeigen" }
      - { left: "Eine Datenbank-Exception in einer Hilfsfunktion", right: "Weiterreichen, bis jemand sinnvoll reagieren kann" }
      - { left: "Ein Datensatz wird gesucht, existiert aber erwartbar oft nicht", right: "null zurückgeben und den Typ als nullable deklarieren" }
    explanation: Gefangen wird an der Grenze, wo jemand reagieren kann. Erwartbares „Nicht gefunden“ ist oft kein Fehler, sondern ein normaler Rückgabewert.
tasks:
  - id: eigene-fehler-ts
    type: code
    language: ts
    title: Eine eigene Fehlerklasse in TypeScript
    description: |
      `parseMenge` liest eine Bestellmenge aus einem Formularfeld. Bisher gibt sie bei Unsinn `-1` zurück –
      ein klassischer Fehlercode. Baue sie um:

      1. Lege die Klasse `UngueltigeMengeError` an, die von `Error` erbt. Setze `this.name` auf
         `'UngueltigeMengeError'`.
      2. `parseMenge(eingabe: string): number` liefert die Zahl, wenn die Eingabe eine **ganze Zahl von
         1 bis 99** ist (Leerzeichen am Rand sind erlaubt).
      3. Sonst wirft sie einen `UngueltigeMengeError`, dessen Nachricht die fehlerhafte Eingabe enthält.
    starter: |
      function parseMenge(eingabe: string): number {
        const zahl = Number(eingabe);
        if (!Number.isInteger(zahl) || zahl < 1 || zahl > 99) {
          return -1;
        }
        return zahl;
      }
    tests:
      - name: Gültige Menge wird zur Zahl
        code: assertEqual(parseMenge('3'), 3)
      - name: Leerzeichen am Rand sind erlaubt
        code: assertEqual(parseMenge(' 12 '), 12)
      - name: 0 ist ungültig und wirft einen UngueltigeMengeError
        code: |
          let fehler = null;
          try { parseMenge('0'); } catch (e) { fehler = e; }
          assertTrue(fehler instanceof UngueltigeMengeError);
      - name: Leere Eingabe wirft ebenfalls
        code: assertThrows(() => parseMenge(''))
      - name: Nachricht nennt die Eingabe, name ist gesetzt
        code: |
          try { parseMenge('2,5'); assertTrue(false); } catch (e) {
            assertTrue(e instanceof Error && e.message.includes('2,5'));
            assertEqual(e.name, 'UngueltigeMengeError');
          }
    hints:
      - "Die Klasse beginnt mit `class UngueltigeMengeError extends Error`. Im Konstruktor rufst du `super(nachricht)` auf und setzt danach `this.name = 'UngueltigeMengeError'`."
      - "Achtung: `Number('')` ergibt `0` und `Number(' 12 ')` ergibt `12`. Prüfe die leere Eingabe am besten mit `eingabe.trim() === ''` zuerst."
    solution: |
      class UngueltigeMengeError extends Error {
        constructor(eingabe: string) {
          super(`Ungültige Menge: "${eingabe}" – erlaubt sind ganze Zahlen von 1 bis 99.`);
          this.name = 'UngueltigeMengeError';
        }
      }

      function parseMenge(eingabe: string): number {
        const bereinigt = eingabe.trim();
        const zahl = Number(bereinigt);
        if (bereinigt === '' || !Number.isInteger(zahl) || zahl < 1 || zahl > 99) {
          throw new UngueltigeMengeError(eingabe);
        }
        return zahl;
      }
  - id: exception-weg
    type: steps
    title: Wohin wandert die Exception?
    description: |
      Ein Webshop verarbeitet eine Bestellung. Der Aufruf läuft so:
      `Controller → BestellService::bestellen() → Lager::reservieren()`. Nur der Controller hat ein
      `try/catch` für `ArtikelAusverkauft`. Verfolge, was passiert.
    steps:
      - situation: "`Lager::reservieren()` stellt fest, dass vom Artikel nichts mehr da ist, und führt `throw new ArtikelAusverkauft('Tasse')` aus."
        question: Was passiert direkt danach?
        options:
          - Die nächste Zeile in reservieren() läuft weiter.
          - reservieren() bricht ab, die Exception springt zum Aufrufer BestellService::bestellen().
          - PHP gibt automatisch null zurück.
        answer: 1
        explanation: throw beendet die Funktion sofort. Die Exception wandert den Aufrufstapel nach oben.
      - situation: "`BestellService::bestellen()` hat kein `try/catch`."
        question: Was passiert in bestellen()?
        options:
          - Die Exception wird ignoriert und bestellen() läuft weiter.
          - bestellen() bricht ebenfalls ab, die Exception wandert weiter zum Controller.
          - Die Bestellung wird trotzdem gespeichert.
        answer: 1
        explanation: Ohne catch reicht jede Funktion die Exception einfach weiter. Code nach dem Aufruf von reservieren() läuft nicht.
      - situation: "Der Controller fängt `ArtikelAusverkauft` mit `catch`."
        question: Was ist hier die richtige Reaktion?
        options:
          - Die Exception leer fangen und nichts tun.
          - Dem Kunden eine verständliche Meldung zeigen, z. B. „Die Tasse ist leider ausverkauft“.
          - Die Exception in einen String umwandeln und als Erfolg zurückgeben.
        answer: 1
        explanation: Der Controller ist die Grenze zum Menschen – hier kann man sinnvoll reagieren. Deshalb wird genau hier gefangen.
---
Eine Kundin meldet: „Meine Rechnung ist über 0,00 Euro.“ Du suchst stundenlang und findest es schließlich:
Eine Funktion gab bei einer ungültigen Menge `false` zurück, und PHP hat damit fröhlich weitergerechnet.
Der eigentliche Fehler lag drei Aufrufe entfernt – unsichtbar. Gute Fehlerbehandlung macht solche Probleme
**laut und früh** sichtbar.

## Fehlercodes verstecken Probleme

Ein [[fehlercode|Fehlercode]] ist ein besonderer Rückgabewert, der „hat nicht geklappt“ bedeutet: `-1`,
`false`, `null` oder ein String wie `"FEHLER"`.

```php
function nettoSumme(array $positionen): int|false
{
    foreach ($positionen as $position) {
        if ($position['menge'] <= 0) {
            return false;
        }
    }
    // …
}

$summe = nettoSumme($positionen);
$steuer = $summe * 0.19; // false * 0.19 ergibt 0 – kein Fehler, nur ein falscher Betrag
```

Das Problem: Jeder Aufrufer **muss** daran denken, das Ergebnis zu prüfen. Vergisst er es einmal, läuft
der Fehler still weiter. Außerdem vermischt der Rückgabetyp zwei Dinge – den Erfolg und den Misserfolg.

Eine [[exception|Exception]] dagegen unterbricht den Ablauf sofort. Niemand kann sie aus Versehen
ignorieren: Fängt sie keiner, bricht das Programm mit einer klaren Meldung ab.

## Exceptions werfen – früh und deutlich

Prüfe ungültige Eingaben am **Anfang** einer Funktion und wirf sofort. Dieses Prinzip heißt
[[fail-fast|Fail Fast]]: Ein Fehler soll dort auffallen, wo er entsteht – nicht drei Schritte später.

```php
function nettoSumme(array $positionen): int
{
    $summe = 0;
    foreach ($positionen as $position) {
        if ($position['menge'] <= 0) {
            throw new InvalidArgumentException(sprintf(
                'Menge für "%s" muss größer als 0 sein, ist %d.',
                $position['name'],
                $position['menge'],
            ));
        }
        $summe += $position['preisCent'] * $position['menge'];
    }

    return $summe;
}
```

Eine gute Fehlermeldung beantwortet: **Was** ist schiefgelaufen, **womit** (welcher Wert) und – wenn
möglich – **was erwartet war**. „Fehler 17“ hilft niemandem.

> [!MERKSATZ]
> Ein Rückgabewert beschreibt das Ergebnis, eine Exception den Ausnahmefall. Mische beides nicht in einem
> Rückgabetyp.

## Eigene Fehlerklassen

PHP bringt passende Standard-Exceptions mit, etwa `InvalidArgumentException` für falsche Argumente oder
`RuntimeException` für Probleme zur Laufzeit. Für fachliche Fehler lohnt sich oft eine
[[eigene-fehlerklasse|eigene Fehlerklasse]]:

```php
final class ArtikelAusverkauft extends RuntimeException
{
    public static function fuer(string $artikel): self
    {
        return new self(sprintf('Der Artikel "%s" ist ausverkauft.', $artikel));
    }
}

throw ArtikelAusverkauft::fuer('Tasse');
```

So kann ein Aufrufer **gezielt** genau diesen Fall fangen, ohne versehentlich auch andere Fehler zu
schlucken. In TypeScript funktioniert es genauso:

```ts
class ArtikelAusverkauftError extends Error {
  constructor(public readonly artikel: string) {
    super(`Der Artikel "${artikel}" ist ausverkauft.`);
    this.name = 'ArtikelAusverkauftError';
  }
}
```

In einem `catch` hat der Fehler in TypeScript den Typ `unknown`. Mit `instanceof` prüfst du, um welchen
Fehler es sich handelt, und TypeScript kennt danach seine Eigenschaften.

## Wo fängst du Fehler?

Fange eine Exception nur dort, wo du **sinnvoll reagieren** kannst – meist an der Grenze deiner Anwendung:
im Controller, im CLI-Skript, im Job.

| Stelle | Typische Reaktion |
|---|---|
| Rechenlogik, Hilfsfunktion | Nicht fangen – einfach durchlassen |
| Service mit technischem Fehler | Fangen und als fachlichen Fehler mit Kontext neu werfen |
| Controller, CLI, Job | Fangen, loggen, verständliche Meldung oder Exit-Code |

Beim Neu-Werfen hängst du die ursprüngliche Exception als `previous` an. So geht der
[[stack-trace|Stack-Trace]] nicht verloren:

```php
try {
    $daten = $this->api->hole($id);
} catch (RuntimeException $e) {
    throw new KatalogNichtErreichbar('Katalog konnte nicht geladen werden.', previous: $e);
}
```

> [!FEHLER]
> **Leeres catch.** `catch (Exception $e) {}` oder `catch { return []; }` lässt jedes Problem verschwinden.
> Die App läuft weiter – mit falschen Daten. Wenn du einen Fehler bewusst ignorierst, schreib wenigstens
> einen Kommentar mit dem Grund und logge ihn.

## Wann null völlig in Ordnung ist

Nicht jeder Misserfolg ist eine Ausnahme. Sucht `findeKunde($email)` in einer Datenbank und findet nichts,
ist das ein **erwartbares** Ergebnis. Hier ist ein [[nullable-typ|nullable Typ]] ehrlich:

```php
function findeKunde(string $email): ?Kunde { /* … */ }
```

Der Typ `?Kunde` zwingt den Aufrufer, an `null` zu denken – PHPStan und TypeScript melden es, wenn er es
vergisst. Anders bei `ladeKunde(int $id): Kunde`: Hier erwartet der Aufrufer, dass es den Kunden gibt.
Fehlt er, ist das eine Exception.

> [!PRAXIS]
> Viele Teams halten fest: Methoden mit `finde…` dürfen `null` liefern, Methoden mit `lade…` oder
> `hole…` werfen, wenn es nichts gibt. Eine kleine [[konvention|Konvention]] im Namen spart viele
> Nachfragen.

## Zusammenfassung

- Fehlercodes wie `false`, `-1` oder `"FEHLER"` lassen sich still übersehen.
- Exceptions unterbrechen den Ablauf und können nicht aus Versehen ignoriert werden.
- **Fail Fast:** Ungültige Eingaben sofort am Anfang prüfen und mit klarer Nachricht werfen.
- Eigene Fehlerklassen beschreiben fachliche Fälle und erben von einer passenden Standard-Exception.
- Gefangen wird an der Grenze, wo jemand sinnvoll reagieren kann – nie mit leerem `catch`.
- Erwartbares „nicht gefunden“ darf ein nullable Rückgabetyp sein.
