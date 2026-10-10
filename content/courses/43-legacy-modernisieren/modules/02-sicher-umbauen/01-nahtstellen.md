---
title: Nahtstellen schaffen
summary: Wie du verklebten Code an einer Naht auftrennst, damit du Abhängigkeiten wie Datum, Datenbank oder globale Variablen im Test ersetzen kannst.
duration: 24
sources:
  - title: Martin Fowler – Legacy Seam
    url: https://martinfowler.com/bliki/LegacySeam.html
  - title: PHP-Handbuch – Konstruktor-Promotion
    url: https://www.php.net/manual/de/language.oop5.decon.php#language.oop5.decon.constructor.promotion
  - title: PHP-Handbuch – Closure
    url: https://www.php.net/manual/de/class.closure.php
quiz:
  - type: single
    question: Was ist eine Nahtstelle (Seam) im Sinne der Legacy-Arbeit?
    options:
      - Eine Stelle, an der zwei Git-Branches zusammengeführt werden.
      - Eine Stelle, an der du Verhalten austauschen kannst, ohne den Code an dieser Stelle zu bearbeiten.
      - Ein Kommentar, der einen Abschnitt im Code markiert.
      - Eine Datenbanktabelle, die zwei andere verbindet.
    answer: 1
    explanation: >
      An einer Naht kannst du von außen etwas anderes hineingeben – zum Beispiel einen festen Wochentag im
      Test statt `date('N')`. Der Code selbst bleibt unverändert, nur die Verbindung ist austauschbar.
  - type: match
    question: Ordne jeder Technik ihre Beschreibung zu.
    pairs:
      - { left: "Parameter-Naht", right: "Abhängigkeit als Parameter mit Standardwert hereingeben" }
      - { left: "Objekt-Naht", right: "Abhängigkeit als Objekt im Konstruktor übergeben" }
      - { left: "Sprout-Methode", right: "Neue Logik in einer neuen, getesteten Funktion schreiben und aus dem Altcode aufrufen" }
      - { left: "Wrap-Methode", right: "Alte Funktion umbenennen und eine neue gleichnamige drumherum legen" }
    explanation: Alle vier schaffen Platz für Tests, ohne den Altcode auf einen Schlag umzuschreiben.
  - type: find-bug
    question: Diese Funktion soll testbar sein. Welche Zeile verhindert das am stärksten?
    language: php
    code: |
      function versandkosten(float $wert, ?int $wochentag = null): float
      {
          $wochentag = $wochentag ?? (int) date('N');
          $kosten = $wert >= 50 ? 0.0 : 4.9;
          $kosten += rand(0, 1) ? 0.5 : 0.0;
          return $wochentag === 7 ? $kosten * 2 : $kosten;
      }
    bug_line: 5
    explanation: >
      Für das Datum gibt es schon eine Parameter-Naht. `rand()` macht das Ergebnis aber weiter zufällig – kein
      Test kann es vorhersagen. Auch der Zufall braucht eine Naht, etwa einen Parameter oder ein Objekt.
  - type: cloze
    text: "Damit alte Aufrufe weiter funktionieren, bekommt der neue Parameter einen ___. In PHP 8 schreibst du dafür `?int $tag = ___`."
    blanks:
      - [Standardwert, Defaultwert, Default-Wert]
      - ["null"]
    explanation: Ohne Standardwert müsstest du alle Aufrufstellen auf einmal anpassen – genau das willst du vermeiden.
tasks:
  - id: preisrechner-naht
    type: code
    language: php
    title: Baue einen Preisrechner mit Nahtstellen
    description: |
      Die alte Funktion `berechne_preis()` hängt an der globalen Variable `$PREISE` und an `date('N')`. Baue
      dieselbe Logik als Klasse `Preisrechner`, in die beide Abhängigkeiten **von außen** hineinkommen:

      - Der Konstruktor bekommt das Preis-Array (`array $preise`) und eine Funktion `Closure $wochentag`, die
        den Wochentag als Zahl liefert (1 = Montag … 6 = Samstag, 7 = Sonntag).
      - `preis(string $kiste, int $menge, string $typ): float` rechnet **genau wie** die alte Funktion:
        Grundpreis × Menge, Stammkunden (`'stamm'`) 10 Prozent weniger, ab mehr als 5 Kisten 2 Euro weniger,
        samstags 1,50 Euro mehr, am Ende auf zwei Stellen gerundet.
      - Eine unbekannte Kiste kostet 0 – so verhält sich die alte Funktion heute auch (nur mit Warnung).
    starter: |
      <?php
      declare(strict_types=1);

      // Die alte Funktion – nur zum Nachlesen:
      // function berechne_preis($kiste, $menge, $typ) {
      //     global $PREISE;
      //     $preis = $PREISE[$kiste] * $menge;
      //     if ($typ == 'stamm') { $preis = $preis * 0.9; }
      //     if ($menge > 5) { $preis = $preis - 2; }
      //     if (date('N') == 6) { $preis = $preis + 1.5; }
      //     return round($preis, 2);
      // }

      final class Preisrechner
      {
          public function __construct(
              private array $preise,
              private Closure $wochentag,
          ) {
          }

          public function preis(string $kiste, int $menge, string $typ): float
          {
              return 0.0;
          }
      }
    tests:
      - name: Normalpreis an einem Montag
        code: |
          $r = new Preisrechner(['klein' => 14.9, 'mittel' => 21.5, 'gross' => 29.9], fn () => 1);
          assert_same(14.9, $r->preis('klein', 1, 'neu'));
      - name: Samstagszuschlag kommt über die Naht
        code: |
          $r = new Preisrechner(['klein' => 14.9, 'mittel' => 21.5, 'gross' => 29.9], fn () => 6);
          assert_same(16.4, $r->preis('klein', 1, 'neu'));
      - name: Stammkunde mit Mengenrabatt
        code: |
          $r = new Preisrechner(['klein' => 14.9, 'mittel' => 21.5, 'gross' => 29.9], fn () => 3);
          assert_same(114.1, $r->preis('mittel', 6, 'stamm'));
      - name: Genau fünf Kisten bekommen noch keinen Mengenrabatt
        code: |
          $r = new Preisrechner(['klein' => 10.0], fn () => 2);
          assert_same(50.0, $r->preis('klein', 5, 'neu'));
      - name: Unbekannte Kiste kostet 0
        code: |
          $r = new Preisrechner(['klein' => 14.9], fn () => 1);
          assert_same(0.0, $r->preis('riesig', 2, 'neu'));
      - name: Preise kommen von außen statt aus einer globalen Variable
        code: |
          $r = new Preisrechner(['klein' => 10.0], fn () => 4);
          assert_same(20.0, $r->preis('klein', 2, 'neu'));
    solution: |
      <?php
      declare(strict_types=1);

      final class Preisrechner
      {
          public function __construct(
              private array $preise,
              private Closure $wochentag,
          ) {
          }

          public function preis(string $kiste, int $menge, string $typ): float
          {
              $preis = ($this->preise[$kiste] ?? 0.0) * $menge;
              if ($typ === 'stamm') {
                  $preis = $preis * 0.9;
              }
              if ($menge > 5) {
                  $preis = $preis - 2;
              }
              if (($this->wochentag)() === 6) {
                  $preis = $preis + 1.5;
              }

              return round($preis, 2);
          }
      }
    hints:
      - "Den Wochentag holst du mit `($this->wochentag)()` – die Klammern um die Eigenschaft sind nötig, damit PHP die Closure aufruft."
      - "Für die unbekannte Kiste: `$this->preise[$kiste] ?? 0.0`."
  - id: naht-technik-waehlen
    type: dragdrop
    title: Welche Technik passt?
    description: Ordne jede Situation der Technik zu, die du dafür als Erstes wählen würdest.
    targets:
      - { id: parameter, label: Parameter-Naht }
      - { id: objekt, label: Objekt-Naht }
      - { id: sprout, label: Sprout-Methode }
      - { id: wrap, label: Wrap-Methode }
    items:
      - { label: "Eine Funktion ruft `date('N')` auf und hat drei Aufrufer, die nichts ändern sollen", target: parameter }
      - { label: Eine Klasse baut ihre Datenbankverbindung selbst im Konstruktor, target: objekt }
      - { label: Neue Gutschein-Regel soll in eine 400-Zeilen-Funktion ohne Tests, target: sprout }
      - { label: Jeder Aufruf von `speichere_bestellung()` soll zusätzlich protokolliert werden, target: wrap }
    hints:
      - "Wrap = etwas soll **vor oder nach** dem Alten passieren. Sprout = etwas **Neues** kommt hinzu."
---
In der letzten Lektion hast du gemerkt: Die Preisberechnung der Gemüsekiste ist samstags anders. Dein Golden
Master meldet deshalb manchmal Unterschiede, obwohl niemand etwas geändert hat. Du kannst den Samstag im Test
nicht erzwingen, solange `date('N')` fest im Code steckt. Du brauchst eine Stelle, an der du ihn austauschen
kannst – eine Nahtstelle.

## Was eine Naht ist

Denk an ein Kleidungsstück: An der Naht kannst du zwei Teile trennen, ohne den Stoff zu zerschneiden. Eine
[[naht|Nahtstelle]] (englisch *seam*) im Code ist genau das: eine Stelle, an der du Verhalten austauschen
kannst, **ohne den Code dort zu bearbeiten**.

Typische Abhängigkeiten, die eine Naht brauchen:

| Abhängigkeit | Warum sie stört |
|---|---|
| `date()`, `time()` | Ergebnis hängt von der Uhr ab |
| `rand()`, `uniqid()` | Ergebnis ist zufällig |
| `global $DB` | Test braucht eine echte Datenbank |
| `mail()`, HTTP-Aufrufe | Tests würden echte Nachrichten verschicken |
| Dateisystem | Tests hängen vom Zustand der Festplatte ab |

Ist die Naht geschaffen, ersetzt du die Abhängigkeit im Test durch ein [[test-double|Test-Double]] –
etwa eine Funktion, die immer „Samstag“ zurückgibt.

> [!MERKSATZ]
> Eine Naht verwandelt eine **versteckte** Abhängigkeit in eine **sichtbare** – und alles Sichtbare kannst
> du im Test kontrollieren.

## Parameter-Naht: der kleinste Schnitt

Die einfachste Naht ist ein neuer Parameter mit Standardwert. Alle bisherigen Aufrufer funktionieren
weiter, nur der Test gibt den Wert vor:

```php title="inc/functions.php – vorher"
function berechne_preis($kiste, $menge, $typ) {
    // ...
    if (date('N') == 6) {
        $preis = $preis + 1.5;
    }
```

```php title="inc/functions.php – nachher"
function berechne_preis($kiste, $menge, $typ, $wochentag = null) {
    if ($wochentag === null) {
        $wochentag = (int) date('N');
    }
    // ...
    if ($wochentag == 6) {
        $preis = $preis + 1.5;
    }
```

```php title="Im Test"
pruefe(16.4, berechne_preis('klein', 1, 'neu', 6));   // Samstag
pruefe(14.9, berechne_preis('klein', 1, 'neu', 1));   // Montag
```

Der Golden Master bleibt grün, weil sich für normale Aufrufe nichts ändert. Aber du kannst jetzt beide Fälle
gezielt prüfen.

## Objekt-Naht: Abhängigkeiten im Konstruktor

Für Klassen ist die Objekt-Naht der Standard. Die Klasse holt sich ihre Abhängigkeiten nicht selbst, sondern
bekommt sie über den [[konstruktor|Konstruktor]] – das ist [[dependency-injection|Dependency Injection]]:

```php title="src/Preisrechner.php"
final class Preisrechner
{
    public function __construct(
        private array $preise,        // statt global $PREISE
        private Closure $wochentag,   // statt date('N')
    ) {
    }

    public function preis(string $kiste, int $menge, string $typ): float
    {
        $preis = ($this->preise[$kiste] ?? 0.0) * $menge;
        // ... gleiche Regeln wie vorher
        if (($this->wochentag)() === 6) {
            $preis += 1.5;
        }
        return round($preis, 2);
    }
}
```

In der App gibst du die echten Werte hinein, im Test feste:

```php
$echt = new Preisrechner($PREISE, fn () => (int) date('N'));
$test = new Preisrechner(['klein' => 14.9], fn () => 6);
```

> [!FEHLER]
> Eine Naht schaffen und dabei „nebenbei“ die Rabattregel korrigieren. Dann weißt du bei einem roten Golden
> Master nicht, ob der Umbau oder die Korrektur schuld ist. Naht und Verhaltensänderung gehören in
> **getrennte** Commits.

## Sprout und Wrap: Neues neben Altem

Oft sollst du in eine riesige, ungetestete Funktion etwas **Neues** einbauen. Zwei Techniken helfen:

**Sprout-Methode** (sprießen lassen): Schreib die neue Logik als eigene, getestete Funktion und ruf sie
aus dem Altcode mit **einer** Zeile auf.

```php
// neu, vollständig getestet
function gutschein_abzug(float $preis, string $code): float { /* ... */ }

// im Altcode nur eine neue Zeile:
$preis = gutschein_abzug($preis, $gutschein);
```

**Wrap-Methode** (umhüllen): Benenne die alte Funktion um und lege eine neue mit dem alten Namen drumherum,
die vorher oder nachher etwas tut:

```php
function speichere_bestellung_alt($daten) { /* unverändert */ }

function speichere_bestellung($daten) {
    $id = speichere_bestellung_alt($daten);
    protokolliere('Bestellung gespeichert', $id);
    return $id;
}
```

Die [[sprout-methode|Sprout-Methode]] sorgt dafür, dass neuer Code von Anfang an getestet ist – auch wenn
der Rest drumherum es noch nicht ist.

> [!PRAXIS]
> In Laravel übernimmt der [[service-container|Service-Container]] die Objekt-Nähte für dich: Er baut Klassen
> und gibt ihre Abhängigkeiten automatisch hinein. In Altcode ohne Framework baust du die Nähte zuerst von Hand.

## Zusammenfassung

- Eine **Naht** ist eine Stelle, an der du Verhalten austauschen kannst, ohne den Code dort zu bearbeiten.
- **Parameter-Naht:** neuer Parameter mit Standardwert – alte Aufrufe bleiben unverändert.
- **Objekt-Naht:** Abhängigkeiten über den Konstruktor hereingeben (Dependency Injection).
- **Sprout-Methode:** neue Logik getestet daneben schreiben, mit einer Zeile einhängen.
- **Wrap-Methode:** alte Funktion umbenennen und eine neue drumherum legen.
- Naht schaffen und Verhalten ändern sind **zwei getrennte Schritte**.
