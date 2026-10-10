---
title: Eingaben serverseitig validieren
summary: Jede Eingabe ist verdächtig – du prüfst Typ, Format, Länge und erlaubte Werte auf dem Server mit Allowlists und lehnst alles andere ab.
duration: 20
sources:
  - title: OWASP Cheat Sheet – Input Validation
    url: https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
  - title: PHP Manual – filter_var
    url: https://www.php.net/manual/de/function.filter-var.php
  - title: PHP Manual – Validierungsfilter
    url: https://www.php.net/manual/de/filter.constants.php
  - title: PHP Manual – preg_match
    url: https://www.php.net/manual/de/function.preg-match.php
quiz:
  - type: single
    question: Ein Formular prüft die E-Mail-Adresse mit `<input type="email" required>`. Reicht das?
    options:
      - Ja, der Browser lässt keine ungültigen Adressen durch.
      - Nein, der Server muss selbst prüfen, weil Requests auch ohne Browser kommen.
      - Ja, wenn zusätzlich JavaScript prüft.
    answer: 1
    explanation: >
      Browser-Prüfungen verbessern die Bedienung, schützen aber nichts. Mit `curl` oder den DevTools schickt jeder
      beliebige Werte direkt an den Server.
  - type: find-bug
    question: Nur Postleitzahlen aus genau fünf Ziffern sollen durchkommen. In welcher Zeile steckt der Fehler?
    language: php
    code: |
      function istPlz(string $eingabe): bool
      {
          return preg_match('/\d{5}/', $eingabe) === 1;
      }
    bug_line: 3
    explanation: >
      Ohne Anker passt das Muster auf jeden Text, der irgendwo fünf Ziffern enthält – auch `12345<script>`.
      Richtig ist `'/\A\d{5}\z/'`: Das Muster muss die **ganze** Eingabe beschreiben.
  - type: multiple
    question: Welche Prüfungen sind Allowlist-Prüfungen?
    options:
      - "Die Sortierung muss `name`, `preis` oder `datum` sein."
      - "Der Benutzername darf kein `<script>` enthalten."
      - "Die Menge ist eine ganze Zahl von 1 bis 99."
      - "Der Kommentar darf nicht das Wort `DROP` enthalten."
    answers: [0, 2]
    explanation: >
      Eine Allowlist beschreibt, was **erlaubt** ist. Die Verbote in B und D sind Denylists – sie übersehen
      Varianten wie `<SCRIPT>` oder `<img onerror=…>`.
  - type: cloze
    text: "Mit `filter_var($eingabe, FILTER_VALIDATE____)` prüfst du eine E-Mail-Adresse. Bei ungültiger Eingabe liefert die Funktion ___."
    blanks:
      - [EMAIL]
      - ["false"]
    explanation: Die Validierungsfilter geben den geprüften Wert oder `false` zurück. Prüfe deshalb mit `=== false`.
tasks:
  - id: profil-validieren
    type: code
    language: php
    title: Ein Profilformular validieren
    description: |
      Schreibe `validiereProfil(array $eingabe): array`. Die Funktion prüft die Felder eines Profilformulars und
      gibt die **Namen der fehlerhaften Felder** als Liste zurück (in der Reihenfolge unten). Eine leere Liste
      heißt: alles gültig.

      1. `benutzername`: 3–20 Zeichen, nur `a-z`, `0-9` und `_` (Kleinbuchstaben).
      2. `email`: eine gültige E-Mail-Adresse laut `FILTER_VALIDATE_EMAIL`.
      3. `alter`: ein String aus Ziffern, als Zahl zwischen 16 und 120.
      4. `sprache`: genau einer der Werte `de`, `en`, `fr`.

      Fehlt ein Feld oder ist es kein String, gilt es als fehlerhaft.
    starter: |
      <?php
      declare(strict_types=1);

      function validiereProfil(array $eingabe): array
      {
          $fehler = [];
          // Prüfe jedes Feld mit einer Allowlist
          return $fehler;
      }
    tests:
      - name: Gültiges Profil
        code: assert_same([], validiereProfil(['benutzername' => 'ada_99', 'email' => 'ada@example.com', 'alter' => '36', 'sprache' => 'de']));
      - name: Angriffsversuch im Benutzernamen
        code: assert_same(['benutzername'], validiereProfil(['benutzername' => 'ada<script>', 'email' => 'ada@example.com', 'alter' => '36', 'sprache' => 'en']));
      - name: Zeilenumbruch hinter gültigem Namen
        code: assert_same(['benutzername'], validiereProfil(['benutzername' => "ada\n", 'email' => 'ada@example.com', 'alter' => '36', 'sprache' => 'en']));
      - name: Alter außerhalb des Bereichs und keine Zahl
        code: |
          assert_same(['alter'], validiereProfil(['benutzername' => 'bob', 'email' => 'bob@example.com', 'alter' => '12', 'sprache' => 'fr']));
          assert_same(['alter'], validiereProfil(['benutzername' => 'bob', 'email' => 'bob@example.com', 'alter' => '3e1', 'sprache' => 'fr']));
      - name: Leeres Formular
        code: assert_same(['benutzername', 'email', 'alter', 'sprache'], validiereProfil([]));
      - name: Falscher Typ und unbekannte Sprache
        code: assert_same(['email', 'sprache'], validiereProfil(['benutzername' => 'eve', 'email' => ['x'], 'alter' => '20', 'sprache' => 'DE']));
    hints:
      - "Prüfe zuerst `is_string($eingabe['feld'] ?? null)`, dann das Format."
      - "Benutzername: `preg_match('/\\A[a-z0-9_]{3,20}\\z/', $wert) === 1` – `\\z` lässt keinen Zeilenumbruch am Ende zu."
      - "Alter: `ctype_digit($wert)` und danach `(int) $wert` im Bereich prüfen; Sprache: `in_array($wert, ['de', 'en', 'fr'], true)`."
    solution: |
      <?php
      declare(strict_types=1);

      function validiereProfil(array $eingabe): array
      {
          $fehler = [];

          $name = $eingabe['benutzername'] ?? null;
          if (!is_string($name) || preg_match('/\A[a-z0-9_]{3,20}\z/', $name) !== 1) {
              $fehler[] = 'benutzername';
          }

          $email = $eingabe['email'] ?? null;
          if (!is_string($email) || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
              $fehler[] = 'email';
          }

          $alter = $eingabe['alter'] ?? null;
          if (!is_string($alter) || !ctype_digit($alter) || (int) $alter < 16 || (int) $alter > 120) {
              $fehler[] = 'alter';
          }

          $sprache = $eingabe['sprache'] ?? null;
          if (!is_string($sprache) || !in_array($sprache, ['de', 'en', 'fr'], true)) {
              $fehler[] = 'sprache';
          }

          return $fehler;
      }
  - id: pruefung-waehlen
    type: dragdrop
    title: Die passende Prüfung wählen
    description: Ordne jede Eingabe der PHP-Prüfung zu, die am besten passt.
    targets:
      - { id: email, label: "filter_var(…, FILTER_VALIDATE_EMAIL)" }
      - { id: ziffern, label: "ctype_digit() + Bereich prüfen" }
      - { id: liste, label: "in_array(…, [...], true)" }
      - { id: regex, label: "preg_match() mit \\A und \\z" }
    items:
      - { label: "Newsletter-Adresse", target: email }
      - { label: "Bestellmenge 1–99", target: ziffern }
      - { label: "Sortierspalte name/preis/datum", target: liste }
      - { label: "Gutscheincode wie ABCD-1234", target: regex }
      - { label: "Seitennummer der Paginierung", target: ziffern }
      - { label: "Status offen/bezahlt/versendet", target: liste }
---
Ein Online-Shop hat ein Feld „Menge“. Im Formular kann man nur 1 bis 10 auswählen. Trotzdem steht in der
Datenbank plötzlich eine Bestellung über **-5 Tassen** – mit einer Gutschrift. Jemand hat den Request einfach
selbst gebaut.

## Jede Eingabe ist verdächtig

Für den Server ist **jede** Information aus dem Request eine Behauptung, keine Tatsache.

| Quelle | Beispiel | Lässt sich fälschen? |
|---|---|---|
| Query-String | `?seite=2` | ja |
| Formular-Body | `menge=-5` | ja |
| Cookies | `sprache=de` | ja |
| Header | `User-Agent`, `Referer` | ja |
| Datei-Uploads | Name, Typ, Inhalt | ja |
| Antworten fremder APIs | JSON eines Partners | ja, wenn der Partner kompromittiert ist |

[[validierung|Validierung]] heißt: Du prüfst, ob eine Eingabe **genau** dem erwarteten Format entspricht, und
lehnst sie sonst ab – mit einer klaren Fehlermeldung, ohne sie „irgendwie zu reparieren“.

> [!MERKSATZ]
> Prüfungen im Browser sind Komfort für Menschen. **Sicherheit** entsteht nur durch Prüfungen auf dem Server.

## Allowlist schlägt Denylist

Es gibt zwei Strategien:

- Eine [[allowlist|Allowlist]] beschreibt, was **erlaubt** ist: „nur `de`, `en`, `fr`“.
- Eine [[denylist|Denylist]] zählt auf, was **verboten** ist: „kein `<script>`“.

Denylists verlieren fast immer. Angreifer schreiben `<SCRIPT>`, `<img onerror=…>` oder kodieren Zeichen um.
Eine Allowlist dagegen lässt alles Unbekannte automatisch draußen.

```php
$erlaubt = ['name', 'preis', 'datum'];
$sort = $_GET['sort'] ?? 'name';

if (!in_array($sort, $erlaubt, true)) {
    $sort = 'name';
}
```

> [!FEHLER]
> `in_array($wert, $liste)` ohne drittes Argument vergleicht locker: Die Zahl `0` passt dann je nach Liste
> zu Strings. Setze immer `true` für den strikten Vergleich.

## Typ, Format, Länge, Bereich

Eine gute Prüfung beantwortet vier Fragen nacheinander:

1. **Typ**: Ist es überhaupt ein String? `$_GET['id']` kann auch ein Array sein (`?id[]=1`).
2. **Format**: Passt es auf ein Muster, z. B. fünf Ziffern?
3. **Länge**: Ist es nicht leer und nicht riesig? `mb_strlen()` zählt Zeichen statt Bytes.
4. **Bereich**: Liegt eine Zahl zwischen erlaubten Grenzen?

```php
$menge = $_POST['menge'] ?? null;

if (!is_string($menge) || !ctype_digit($menge)) {
    throw new InvalidArgumentException('Menge muss eine ganze Zahl sein.');
}
$menge = (int) $menge;
if ($menge < 1 || $menge > 10) {
    throw new InvalidArgumentException('Menge muss zwischen 1 und 10 liegen.');
}
```

`ctype_digit()` akzeptiert nur Ziffern – kein Minus, kein Komma, kein `3e1`.

## Reguläre Ausdrücke mit Ankern

Bei `preg_match()` muss das Muster die **ganze** Eingabe beschreiben. Ohne Anker reicht ein Treffer irgendwo.

| Muster | `12345` | `x12345<b>` | `12345\n` |
|---|---|---|---|
| `/\d{5}/` | passt | passt (!) | passt (!) |
| `/^\d{5}$/` | passt | passt nicht | passt (!) |
| `/\A\d{5}\z/` | passt | passt nicht | passt nicht |

`$` erlaubt in PCRE ein abschließendes Zeilenende. `\A` und `\z` markieren dagegen wirklich Anfang und Ende.

Für gängige Formate gibt es fertige Filter:

```php
filter_var('ada@example.com', FILTER_VALIDATE_EMAIL); // "ada@example.com"
filter_var('42', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 99])); // 42
filter_var('abc', FILTER_VALIDATE_INT); // false
```

## Validieren ist nicht Kodieren

Validierung beantwortet: „Ist das eine sinnvolle Eingabe?“ Sie macht Daten aber **nicht** automatisch sicher für
jede Verwendung. Der Name `O'Brien` ist gültig – und bricht trotzdem SQL oder HTML, wenn du ihn einfach einklebst.

| Schritt | Wann | Wozu |
|---|---|---|
| Validieren | beim Hereinkommen | Unsinn und Angriffe früh ablehnen |
| Parametrisieren | beim Weitergeben an SQL, Shell, Dateisystem | Daten von Befehlen trennen |
| Kodieren ([[escaping]]) | bei der Ausgabe | Daten im Zielkontext harmlos machen |

> [!PRAXIS]
> In Laravel übernehmen Form Requests mit Regeln wie `'menge' => ['required', 'integer', 'between:1,10']` die
> Validierung. Das Prinzip bleibt dasselbe: Allowlist, serverseitig, vor der Geschäftslogik.

## Zusammenfassung

- Alles aus dem Request ist eine Behauptung – auch Cookies, Header und versteckte Felder.
- Validiere **auf dem Server**, Browser-Prüfungen sind nur Komfort.
- **Allowlists** beschreiben das Erlaubte und schlagen Denylists.
- Prüfe Typ, Format, Länge und Bereich; nutze `\A…\z` statt `^…$`.
- Validierung ersetzt weder Prepared Statements noch Output-Encoding.
