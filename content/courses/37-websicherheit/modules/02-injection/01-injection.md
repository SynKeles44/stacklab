---
title: "Injection: SQL, Shell-Befehle und Pfade"
summary: Das gemeinsame Muster hinter jeder Injection verstehen und Daten zuverlässig von Befehlen trennen – in SQL, in der Shell und im Dateisystem.
duration: 25
sources:
  - title: OWASP Top 10:2025 – A05 Injection
    url: https://top10.owasp.org/2025/A05_2025-Injection/
  - title: OWASP Cheat Sheet – OS Command Injection Defense
    url: https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html
  - title: OWASP – Path Traversal
    url: https://owasp.org/www-community/attacks/Path_Traversal
  - title: PHP Manual – escapeshellarg
    url: https://www.php.net/manual/de/function.escapeshellarg.php
  - title: PHP Manual – proc_open
    url: https://www.php.net/manual/de/function.proc-open.php
quiz:
  - type: single
    question: Was haben SQL-Injection, Command Injection und Path Traversal gemeinsam?
    options:
      - Sie funktionieren nur bei PHP.
      - Daten von außen werden von einem Interpreter als Befehl oder Pfadangabe gelesen.
      - Sie lassen sich alle mit HTTPS verhindern.
      - Sie betreffen nur Administratoren.
    answer: 1
    explanation: >
      Bei jeder Injection wird ein Text aus Code und Eingabe zusammengeklebt. Der Interpreter – Datenbank, Shell
      oder Dateisystem – kann danach nicht mehr unterscheiden, was Befehl und was Daten waren.
  - type: find-bug
    question: In welcher Zeile steckt die Command Injection?
    language: php
    code: |
      $host = $_GET['host'] ?? '';
      if ($host === '') {
          exit('Bitte einen Host angeben.');
      }
      $ausgabe = shell_exec('ping -c 1 ' . $host);
      echo htmlspecialchars((string) $ausgabe);
    bug_line: 5
    explanation: >
      Der Host wird ungeprüft an einen Shell-Befehl gehängt. Mit `example.com; cat /etc/passwd` läuft ein zweiter
      Befehl. Besser: Host gegen eine Allowlist prüfen und `escapeshellarg()` nutzen – oder ganz ohne Shell arbeiten.
  - type: multiple
    question: Welche Maßnahmen schützen vor Path Traversal beim Ausliefern von Dateien?
    options:
      - Nur Dateinamen aus einer Allowlist oder mit strengem Muster zulassen.
      - Mit `realpath()` den echten Pfad ermitteln und prüfen, ob er im erlaubten Ordner liegt.
      - Einmal `str_replace('../', '', $name)` aufrufen.
      - Dateien unter zufälligen IDs speichern und den Namen in der Datenbank nachschlagen.
    answers: [0, 1, 3]
    explanation: >
      Einmaliges Ersetzen lässt sich austricksen: Aus `....//` wird nach dem Ersetzen wieder `../`. Sicher sind
      Allowlists, eine `realpath()`-Prüfung gegen den Basisordner oder IDs statt Dateinamen.
  - type: cloze
    text: "In PHP verpackt `escape___arg()` einen Wert so, dass die Shell ihn als ein einziges Argument liest. Noch sicherer ist `proc_open()` mit einem ___ statt eines Strings, weil dann gar keine Shell beteiligt ist."
    blanks:
      - [shell]
      - [Array]
    explanation: Übergibst du `proc_open()` ein Array, startet PHP das Programm direkt mit genau diesen Argumenten – Shell-Sonderzeichen haben dann keine Wirkung.
tasks:
  - id: zeilen-zaehler
    type: terminal
    title: Den Zeilenzähler absichern
    description: |
      Im Ordner `zeilen-zaehler` liegt `zeilen.php`. Es zählt die Zeilen einer Datei im Ordner `daten/` und ruft dafür
      `wc -l` über die Shell auf. Der Dateiname kommt als Argument – und landet ungeprüft im Befehl.

      1. Probiere es aus: `php zeilen.php notizen.txt`
      2. Zeige die Lücken – nur in deinem eigenen Ordner:
         - `php zeilen.php "notizen.txt; touch GEHACKT"` und danach `ls` – es gibt plötzlich eine Datei `GEHACKT`.
         - `php zeilen.php ../config/secret.txt` liest eine Datei außerhalb von `daten/`.
      3. Lösche `GEHACKT` wieder.
      4. Baue `zeilen.php` um: Nur Namen wie `notizen.txt` (Kleinbuchstaben, Ziffern, `-`, `_`, Endung `.txt`) sind
         erlaubt. Bei jedem anderen Namen gibt das Skript `Ungültiger Dateiname` aus und endet mit `exit(1)`.
         Gültige Namen zählst du ohne Shell, z. B. mit `count(file(...))`. Die Ausgabe beginnt weiterhin mit der Zahl.

      Bearbeite die Datei mit `nano zeilen.php`. Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: zeilen-zaehler
    setup: |
      mkdir -p daten config
      printf 'Milch kaufen\nKurs weitermachen\nSport\n' > daten/notizen.txt
      printf 'Steuer\n' > daten/todo.txt
      printf 'API_KEY=<dein-token>\n' > config/secret.txt
      cat > zeilen.php <<'PHP'
      <?php
      declare(strict_types=1);

      $name = $argv[1] ?? '';
      echo shell_exec('wc -l daten/' . $name);
      PHP
    checks:
      - type: command
        run: php -l zeilen.php >/dev/null && echo ok
        stdout_equals: ok
        message: zeilen.php enthält einen Syntaxfehler.
      - type: command
        run: php zeilen.php notizen.txt
        stdout_matches: "^\\s*3\\b"
        message: "`php zeilen.php notizen.txt` soll weiterhin mit der Zeilenzahl 3 beginnen."
      - type: command
        run: php zeilen.php todo.txt
        stdout_matches: "^\\s*1\\b"
        message: "`php zeilen.php todo.txt` soll mit 1 beginnen – zählst du Zeilen richtig?"
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX")
          php zeilen.php "notizen.txt; touch $d/GEHACKT" >/dev/null 2>&1; e=$?
          if [ -e "$d/GEHACKT" ]; then echo injiziert; elif [ $e -ne 1 ]; then echo "exit-$e"; else echo ok; fi
          rm -rf "$d"
        stdout_equals: ok
        message: "Ein Name wie `notizen.txt; touch …` führt noch einen zweiten Befehl aus oder endet nicht mit exit(1). Prüfe den Namen gegen ein strenges Muster und nutze keine Shell."
      - type: command
        run: |
          out=$(php zeilen.php ../config/secret.txt 2>&1); e=$?
          if [ $e -eq 1 ] && printf '%s' "$out" | grep -q 'Ungültiger Dateiname'; then echo ok; else echo "exit-$e"; fi
        stdout_equals: ok
        message: "`../config/secret.txt` soll mit „Ungültiger Dateiname“ und exit(1) abgelehnt werden."
      - type: file_absent
        path: GEHACKT
        message: Die Datei GEHACKT aus deinem Test liegt noch im Ordner. Lösche sie mit `rm GEHACKT`.
    hints:
      - "Ein strenges Muster mit Ankern: `preg_match('/\\A[a-z0-9_-]+\\.txt\\z/', $name)` – ein Punkt oder Schrägstrich vor der Endung fällt dann durch."
      - "Abbruch bei ungültigem Namen: `echo \"Ungültiger Dateiname\\n\"; exit(1);`"
      - "Zählen ohne Shell: `$zeilen = count(file(__DIR__ . '/daten/' . $name)); echo \"$zeilen $name\\n\";`"
    solution: |
      ```php
      <?php
      declare(strict_types=1);

      $name = $argv[1] ?? '';

      if (preg_match('/\A[a-z0-9_-]+\.txt\z/', $name) !== 1) {
          echo "Ungültiger Dateiname\n";
          exit(1);
      }

      $pfad = __DIR__ . '/daten/' . $name;
      if (!is_file($pfad)) {
          echo "Datei nicht gefunden\n";
          exit(1);
      }

      $zeilen = count(file($pfad));
      echo "$zeilen $name\n";
      ```

      ```bash
      rm -f GEHACKT
      php zeilen.php notizen.txt
      php zeilen.php "notizen.txt; touch GEHACKT"; echo $?
      ```
  - id: sicherer-pfad
    type: code
    language: php
    title: Einen sicheren Download-Pfad bauen
    description: |
      Ein Download-Endpunkt liefert Handbücher aus dem Ordner `$basis` aus. Schreibe
      `sichererPfad(string $basis, string $name): ?string`.

      1. Erlaubt sind nur Namen aus Kleinbuchstaben, Ziffern, `-` und `_` mit der Endung `.pdf` oder `.txt`.
      2. Bei einem erlaubten Namen gibt die Funktion `$basis . '/' . $name` zurück (ohne doppelten Schrägstrich, falls
         `$basis` schon mit `/` endet).
      3. Bei allem anderen – leere Namen, `../`, Schrägstriche, Großbuchstaben, Null-Bytes – gibt sie `null` zurück.
    starter: |
      <?php
      declare(strict_types=1);

      function sichererPfad(string $basis, string $name): ?string
      {
          return $basis . '/' . $name;
      }
    tests:
      - name: Normaler Dateiname
        code: assert_same('/srv/handbuecher/kurzanleitung.pdf', sichererPfad('/srv/handbuecher', 'kurzanleitung.pdf'));
      - name: Basis mit Schrägstrich am Ende
        code: assert_same('/srv/handbuecher/faq_2026.txt', sichererPfad('/srv/handbuecher/', 'faq_2026.txt'));
      - name: Path Traversal wird abgelehnt
        code: |
          assert_same(null, sichererPfad('/srv/handbuecher', '../../etc/passwd'));
          assert_same(null, sichererPfad('/srv/handbuecher', '....//secret.txt'));
          assert_same(null, sichererPfad('/srv/handbuecher', 'unter/ordner.pdf'));
      - name: Leerer Name, Null-Byte und falsche Endung
        code: |
          assert_same(null, sichererPfad('/srv/handbuecher', ''));
          assert_same(null, sichererPfad('/srv/handbuecher', "anleitung.pdf\0.php"));
          assert_same(null, sichererPfad('/srv/handbuecher', 'shell.php'));
          assert_same(null, sichererPfad('/srv/handbuecher', 'Anleitung.PDF'));
    hints:
      - "Prüfe den Namen mit einem Muster, das den ganzen String beschreibt: `\\A…\\z`."
      - "`rtrim($basis, '/')` entfernt einen abschließenden Schrägstrich."
    solution: |
      <?php
      declare(strict_types=1);

      function sichererPfad(string $basis, string $name): ?string
      {
          if (preg_match('/\A[a-z0-9_-]+\.(pdf|txt)\z/', $name) !== 1) {
              return null;
          }

          return rtrim($basis, '/') . '/' . $name;
      }
---
Ein Admin-Tool zeigt per Knopfdruck an, ob ein Server erreichbar ist. Intern ruft es `ping` mit dem Hostnamen aus
dem Formular auf. Jemand tippt `example.com; rm -rf storage` ein – und die Shell führt beide Befehle brav
nacheinander aus. Willkommen bei **Injection**.

## Das Muster hinter jeder Injection

Viele Programme verstehen eine eigene kleine Sprache: die Datenbank SQL, die [[shell|Shell]] Befehle, das
Dateisystem Pfade. Ein [[interpreter|Interpreter]] liest diesen Text und führt ihn aus.

Eine [[injection|Injection]] entsteht, wenn du **Code und Daten zu einem Text zusammenklebst**. Enthalten die
Daten Sonderzeichen der Zielsprache, werden sie selbst zu Code.

| Ziel | Sonderzeichen | Beispiel-Eingabe |
|---|---|---|
| SQL | `'`, `--`, `;` | `x' OR '1'='1` |
| Shell | `;`, `&&`, `\|`, `$( )`, Backticks | `a.txt; touch GEHACKT` |
| Dateisystem | `../`, `/`, Null-Byte | `../../etc/passwd` |
| HTML | `<`, `>`, `"` | `<script>…</script>` |

> [!MERKSATZ]
> Die Abwehr ist immer dieselbe Idee: **Daten getrennt vom Befehl übergeben** – per Platzhalter, Argument-Liste
> oder fester Allowlist. Selbstgebastelte Filter sind keine Trennung.

## SQL-Injection – kurz wiederholt

Im Kurs Datenbanken & SQL hast du [[sql-injection|SQL-Injection]] ausführlich kennengelernt. Hier nur die Regeln:

```php
// Unsicher: Eingabe im SQL-Text
$pdo->query("SELECT * FROM notes WHERE title = '$suche'");

// Sicher: Platzhalter, Wert kommt getrennt
$stmt = $pdo->prepare('SELECT * FROM notes WHERE title = ?');
$stmt->execute([$suche]);
```

- Werte gehen **immer** über [[prepared-statement|Prepared Statements]].
- Spalten- und Tabellennamen (etwa für `ORDER BY`) lassen sich nicht als Platzhalter übergeben – sie prüfst du
  gegen eine [[allowlist|Allowlist]].
- ORMs wie Eloquent nutzen intern Platzhalter, aber `whereRaw("… $eingabe")` hebelt das wieder aus.

## Command Injection

Bei einer [[command-injection|Command Injection]] landet eine Eingabe in einem Shell-Befehl. Gefährlich sind
`shell_exec()`, `exec()`, `system()`, `passthru()` und Backticks, sobald ein Teil des Befehls von außen kommt.

Die sichere Reihenfolge der Maßnahmen:

1. **Ohne Shell auskommen.** Für fast alles gibt es PHP-Funktionen: `file()`, `copy()`, `mkdir()`, `ZipArchive`.
2. **Eingabe streng prüfen.** Allowlist oder Muster mit `\A…\z`.
3. **Argumente getrennt übergeben.** `proc_open()` mit einem Array startet das Programm ohne Shell.
4. **Notfalls maskieren.** `escapeshellarg()` macht einen Wert zu genau einem Argument.

```php
// proc_open mit Array: keine Shell, ";" ist nur ein normales Zeichen
$prozess = proc_open(['wc', '-l', $pfad], [1 => ['pipe', 'w']], $pipes);
$ausgabe = stream_get_contents($pipes[1]);
```

> [!FEHLER]
> `escapeshellcmd()` statt `escapeshellarg()`. Die erste Funktion maskiert nur Steuerzeichen im ganzen Befehl,
> lässt aber zusätzliche Optionen wie `--output=/var/www/x.php` durch. Für einzelne Werte ist
> `escapeshellarg()` richtig – und eine Allowlist davor.

## Path Traversal

Bei [[path-traversal|Path Traversal]] verlässt ein Dateiname mit `../` den erlaubten Ordner:

```php
// Unsicher
readfile('/srv/handbuecher/' . $_GET['datei']);
// ?datei=../../etc/passwd  →  /srv/handbuecher/../../etc/passwd
```

Drei sichere Varianten:

| Variante | Idee |
|---|---|
| ID statt Name | `?id=17`, den echten Pfad liest du aus der Datenbank |
| Strenges Muster | `\A[a-z0-9_-]+\.pdf\z` – Schrägstrich und `..` fallen durch |
| `realpath()` + Präfix | Echten Pfad bestimmen, prüfen, dass er mit dem Basisordner beginnt |

```php
$basis = realpath('/srv/handbuecher');
$pfad = realpath($basis . '/' . $name);

if ($pfad === false || !str_starts_with($pfad, $basis . DIRECTORY_SEPARATOR)) {
    http_response_code(404);
    exit;
}
```

> [!PRAXIS]
> In Laravel speicherst du Dateien über die `Storage`-Fassade mit eigenen, generierten Namen und lieferst sie per
> ID aus. Der Originalname der Nutzerin landet nur als Text in der Datenbank – nie im Pfad.

## Zusammenfassung

- **Injection** heißt: Daten werden vom Interpreter als Code gelesen, weil sie in den Befehl geklebt wurden.
- SQL: Prepared Statements für Werte, Allowlists für Bezeichner.
- Shell: am besten gar nicht nutzen; sonst Allowlist, `proc_open()` mit Array oder `escapeshellarg()`.
- Pfade: IDs statt Namen, strenge Muster oder `realpath()` mit Präfix-Prüfung.
- Denylists wie „`../` entfernen“ lassen sich fast immer umgehen.
