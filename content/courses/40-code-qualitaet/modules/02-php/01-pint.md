---
title: PHP-Code-Stil mit Laravel Pint
summary: Wie Laravel Pint PHP-Code in einen einheitlichen Stil bringt, wie du Presets und einzelne Regeln in pint.json festlegst und wann ECS die bessere Wahl ist.
duration: 25
sources:
  - title: Laravel Pint
    url: https://laravel.com/docs/13.x/pint
  - title: PHP CS Fixer – Regeln
    url: https://cs.symfony.com/doc/rules/index.html
  - title: PER Coding Style
    url: https://www.php-fig.org/per/coding-style/
  - title: Easy Coding Standard (ECS)
    url: https://github.com/easy-coding-standard/easy-coding-standard
quiz:
  - type: single
    question: Welches Preset nutzt Pint, wenn es keine `pint.json` gibt?
    options: [laravel, psr12, per, empty]
    answer: 0
    explanation: Ohne Konfiguration formatiert Pint nach dem Laravel-Stil. Mit `"preset"` in der `pint.json` oder `--preset` wählst du ein anderes.
  - type: match
    question: Ordne jede Pint-Option ihrem Einsatzzweck zu.
    pairs:
      - { left: "--test", right: "Nur prüfen – für die CI-Pipeline" }
      - { left: "--dirty", right: "Nur Dateien mit uncommitteten Änderungen" }
      - { left: "--diff=main", right: "Nur Dateien, die seit dem Abzweig von main geändert wurden" }
      - { left: "--repair", right: "Reparieren und trotzdem mit Exit-Code 1 enden" }
    explanation: Mit `--dirty` und `--diff` bleibt Pint auch in großen Projekten schnell, weil es nur die geänderten Dateien anfasst.
  - type: multiple
    question: Welche Aussagen über die `pint.json` stimmen?
    options:
      - Sie liegt im Wurzelverzeichnis des Projekts und wird committet.
      - Unter `rules` kannst du einzelne Regeln des Presets ein- oder ausschalten.
      - Mit `exclude` nimmst du Ordner von der Formatierung aus.
      - Ohne `pint.json` startet Pint nicht.
    answers: [0, 1, 2]
    explanation: Pint funktioniert ohne Konfiguration. Die `pint.json` brauchst du erst, wenn du vom Standard abweichen willst – und dann gehört sie ins Repository.
  - type: cloze
    text: Pint baut auf dem Werkzeug PHP ___ Fixer auf, dessen Regeln du in der pint.json verwenden kannst.
    blanks:
      - [CS, "CS-"]
    explanation: Pint ist eine schlanke Hülle um PHP CS Fixer mit fertigen Presets. Jede Regel von PHP CS Fixer funktioniert auch in Pint.
tasks:
  - id: pint-konfigurieren
    type: terminal
    title: Pint mit eigener Konfiguration
    description: |
      Im Ordner `pint-konfigurieren` liegt ein Projekt mit neuem Code in `src/` und altem, fremdem Code in
      `legacy/`, den ihr vorerst nicht anfassen wollt.

      1. Lege eine `pint.json` an: Preset `laravel`, zusätzlich die Regeln `declare_strict_types` und
         `final_class` eingeschaltet (`true`), und der Ordner `legacy` ausgeschlossen.
      2. Schau dir mit `pint --test -v` an, was Pint ändern würde.
      3. Formatiere mit `pint`.
      4. Prüfe mit `pint --test`, dass alles sauber ist. `legacy/` muss unverändert bleiben.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: pint-konfigurieren
    setup: |
      mkdir -p src legacy
      cat > src/Invoice.php <<'EOF'
      <?php
      namespace App;
      class Invoice {
          public function __construct( private array $lines ){}
          public function total() : int {
            $sum=0;
            foreach($this->lines as $line){ $sum+=$line; }
            return $sum;
          }
          public function lines() { return array_values( $this->lines ); }
      }
      EOF
      cat > legacy/functions.php <<'EOF'
      <?php
      function old_total( $lines ){ return array_sum( $lines ) ; }
      EOF
      cp legacy/functions.php .original-legacy.txt
    checks:
      - type: command
        run: jq -r .preset pint.json
        stdout_equals: laravel
        message: Die pint.json fehlt, ist kein gültiges JSON oder hat noch nicht "preset" auf "laravel".
      - type: command
        run: jq -e '.rules.declare_strict_types == true and .rules.final_class == true' pint.json
        message: Schalte unter "rules" die Regeln declare_strict_types und final_class mit true ein.
      - type: command
        run: jq -e '.exclude | index("legacy")' pint.json
        message: Nimm den Ordner legacy mit "exclude" von der Formatierung aus.
      - type: command
        run: pint --test
        message: pint --test findet noch Stilfehler. Führe pint ohne --test aus.
      - type: file_contains
        path: src/Invoice.php
        pattern: "final class Invoice"
        message: src/Invoice.php ist noch nicht mit deiner Konfiguration formatiert (die Klasse sollte final sein).
      - type: file_contains
        path: src/Invoice.php
        pattern: "declare\\(strict_types=1\\);"
        message: In src/Invoice.php fehlt noch declare(strict_types=1) – ist die Regel declare_strict_types eingeschaltet?
      - type: command
        run: cmp -s legacy/functions.php .original-legacy.txt
        message: legacy/functions.php wurde verändert. Trage "legacy" unter "exclude" ein und setze die Aufgabe zurück.
    hints:
      - "Die Datei ist ein JSON-Objekt mit den Schlüsseln `preset`, `rules` und `exclude`."
      - "`rules` ist ein Objekt (`{\"declare_strict_types\": true}`), `exclude` eine Liste (`[\"legacy\"]`)."
      - "Prüfe die Datei mit `jq . pint.json` – meldet jq einen Fehler, fehlt ein Komma oder eine Klammer."
    solution: |
      ```bash
      cd pint-konfigurieren
      cat > pint.json <<'EOF'
      {
          "preset": "laravel",
          "rules": {
              "declare_strict_types": true,
              "final_class": true
          },
          "exclude": ["legacy"]
      }
      EOF
      pint --test -v
      pint
      pint --test
      ```
  - id: pint-optionen
    type: steps
    title: Welche Option passt?
    description: Entscheide in jeder Situation, wie du Pint aufrufst.
    steps:
      - situation: Du hast an drei Dateien gearbeitet, noch nichts committet und willst nur diese formatieren – das Projekt hat 4000 Dateien.
        question: Welcher Aufruf?
        options: ["pint", "pint --dirty", "pint --test"]
        answer: 1
        explanation: "`--dirty` nimmt nur Dateien mit uncommitteten Änderungen. Das geht in Sekunden statt Minuten."
      - situation: In der CI-Pipeline soll ein Pull Request rot werden, wenn der Stil nicht stimmt. Dateien dürfen nicht verändert werden.
        question: Welcher Aufruf?
        options: ["pint --test", "pint --repair", "pint -v"]
        answer: 0
        explanation: "`--test` liest nur und meldet über den Exit-Code."
      - situation: Ein Pre-Commit-Hook soll falsch formatierte Dateien reparieren, den Commit aber trotzdem stoppen, damit du die Änderung siehst.
        question: Welcher Aufruf?
        options: ["pint --test", "pint", "pint --repair"]
        answer: 2
        explanation: "`--repair` formatiert und endet trotzdem mit Exit-Code 1, wenn es etwas ändern musste."
---
Im letzten Modul hast du `pint` schon benutzt, ohne es einzurichten. Das ist die Stärke von Laravel Pint: Es
funktioniert sofort. Spätestens wenn das Team eine Regel anders haben möchte oder alter Code ausgenommen
werden soll, brauchst du eine Konfiguration. In dieser Lektion lernst du, wie Pint arbeitet, wie du es
einstellst und wo es Alternativen gibt.

## Was Pint ist

[[pint|Laravel Pint]] ist ein [[formatter|Formatter]] für PHP. Unter der Haube steckt
[[php-cs-fixer|PHP CS Fixer]], ein sehr mächtiges, aber aufwendig zu konfigurierendes Werkzeug. Pint legt
eine dünne Schicht darüber: fertige Regelsammlungen, eine einfache JSON-Datei und gut lesbare Ausgaben.

In jedem neuen Laravel-Projekt ist Pint schon installiert. In anderen Projekten installierst du es als
Entwicklungsabhängigkeit:

```bash title="Terminal"
composer require laravel/pint --dev
./vendor/bin/pint            # formatiert alle .php-Dateien (außer vendor/)
./vendor/bin/pint app/Models # nur einen Ordner
./vendor/bin/pint -v         # zeigt zu jeder Datei den Diff
```

Pint arbeitet **dateiweise** und ändert nur das Aussehen. Ausnahme sind wenige, als „riskant“ markierte Regeln
wie `declare_strict_types`, die das Verhalten tatsächlich beeinflussen können – solche schaltest du bewusst ein.

## Presets: fertige Regelsammlungen

Ein [[code-stil-preset|Preset]] ist eine Sammlung von Regeln, auf die sich eine Community geeinigt hat.
Pint kennt fünf:

| Preset | Wofür |
|---|---|
| `laravel` | Standard – der Stil des Laravel-Frameworks |
| `per` | [[per-coding-style\|PER Coding Style]] der PHP-FIG, der Nachfolger von PSR-12 |
| `psr12` | Der ältere Standard [[psr-12\|PSR-12]] |
| `symfony` | Der Stil des Symfony-Frameworks |
| `empty` | Keine Regeln – du stellst alles selbst zusammen |

Für Laravel-Projekte nimmst du `laravel`, für framework-unabhängige Bibliotheken meist `per`. Wichtiger als
die Wahl ist, dass **eine** Wahl getroffen und nicht mehr diskutiert wird.

> [!MERKSATZ]
> Der beste Code-Stil ist der, über den niemand mehr redet. Wähle ein Preset, lege es fest, und lass das
> Werkzeug entscheiden.

## Die pint.json

Willst du vom Preset abweichen, legst du eine `pint.json` ins Wurzelverzeichnis:

```json title="pint.json"
{
    "preset": "laravel",
    "rules": {
        "declare_strict_types": true,
        "final_class": true,
        "concat_space": { "spacing": "one" }
    },
    "exclude": ["legacy"],
    "notName": ["*.blade.php"]
}
```

- **`preset`** – die Grundlage.
- **`rules`** – einzelne Regeln von PHP CS Fixer: `true` schaltet ein, `false` aus, ein Objekt konfiguriert.
- **`exclude`** – Ordner, die Pint überspringt (`vendor/` ist immer ausgenommen).
- **`notName`** / **`notPath`** – Dateien nach Namensmuster oder genauem Pfad ausnehmen.

Welche Regeln es gibt und was sie tun, steht in der Regelliste von PHP CS Fixer. Probiere eine neue Regel immer
mit `pint --test -v` aus, bevor du sie auf das ganze Projekt loslässt.

> [!FEHLER]
> Ein vergessenes Komma macht die `pint.json` ungültig – dann bricht Pint mit einer Fehlermeldung ab. Prüfe
> JSON-Dateien im Terminal mit `jq . pint.json`: Ist die Datei kaputt, zeigt jq dir die Stelle.

## Nur geänderte Dateien formatieren

In einem großen Projekt dauert ein kompletter Durchlauf. Pint kann sich deshalb mit Git abstimmen:

| Aufruf | Welche Dateien |
|---|---|
| `pint --dirty` | Dateien mit uncommitteten Änderungen |
| `pint --diff=main` | Dateien, die sich seit dem Abzweig von `main` geändert haben |
| `pint --test` | Alle – aber nur prüfen |
| `pint --repair` | Alle – reparieren und bei Änderungen Exit-Code 1 |

Zusätzlich merkt sich Pint in einem [[cache|Cache]], welche Dateien schon sauber waren, und überspringt sie beim
nächsten Lauf.

> [!PRAXIS]
> Ein bewährtes Muster: Lokal formatiert der Editor beim Speichern oder ein Hook mit `--dirty`, in der
> CI-Pipeline läuft `pint --test` über alles. So ist der Alltag schnell, und trotzdem rutscht nichts durch.

## Die Alternative: ECS

Nicht jedes Projekt nutzt Pint. Weit verbreitet ist auch [[easy-coding-standard|Easy Coding Standard]] (ECS).
Es kombiniert PHP CS Fixer mit einem zweiten Werkzeug, PHP_CodeSniffer, und wird in PHP konfiguriert:

```php title="ecs.php"
<?php

declare(strict_types=1);

use Symplify\EasyCodingStandard\Config\ECSConfig;

return ECSConfig::configure()
    ->withPaths([__DIR__ . '/src', __DIR__ . '/tests'])
    ->withPreparedSets(psr12: true, arrays: true, namespaces: true);
```

```bash title="Terminal"
./vendor/bin/ecs check          # nur prüfen
./vendor/bin/ecs check --fix    # reparieren
```

Die Faustregel: In Laravel-Projekten nimmst du Pint, weil es schon da ist. ECS lohnt sich, wenn du Regeln von
PHP_CodeSniffer brauchst oder ein Projekt es bereits nutzt. Zwei Formatter für dieselben Dateien sind dagegen
immer ein Fehler – sie formatieren sich gegenseitig um.

## Zusammenfassung

- **Pint** ist ein Formatter für PHP auf Basis von PHP CS Fixer und funktioniert ohne Konfiguration.
- Ein **Preset** (`laravel`, `per`, `psr12`, `symfony`, `empty`) legt die Grundregeln fest.
- In der `pint.json` schaltest du Regeln mit `rules` ein und aus und nimmst Ordner mit `exclude` aus.
- `--dirty` und `--diff=main` formatieren nur geänderte Dateien, `--test` prüft für die CI.
- **ECS** ist eine Alternative mit PHP-Konfiguration – nutze nie zwei Formatter für dieselben Dateien.
