---
title: Wie PHP ausgeführt wird
summary: PHP auf der Kommandozeile und im Web – CLI, php-fpm, der Request-Lebenszyklus und der eingebaute Entwicklungsserver.
duration: 20
sources:
  - title: PHP-Handbuch – Kommandozeilen-Nutzung (CLI)
    url: https://www.php.net/manual/de/features.commandline.php
  - title: PHP-Handbuch – Eingebauter Webserver
    url: https://www.php.net/manual/de/features.commandline.webserver.php
  - title: PHP-Handbuch – FastCGI Process Manager (FPM)
    url: https://www.php.net/manual/de/install.fpm.php
quiz:
  - type: single
    question: Was passiert mit Variablen eines PHP-Skripts, nachdem php-fpm eine Web-Anfrage beantwortet hat?
    options:
      - Sie bleiben für die nächste Anfrage im Speicher.
      - Sie werden verworfen – jede Anfrage beginnt mit einem leeren Zustand.
      - Sie werden automatisch in die Datenbank geschrieben.
      - Sie werden an den Browser geschickt.
    answer: 1
    explanation: >
      PHP arbeitet nach dem Prinzip „Share nothing“: Jede Anfrage startet frisch, am Ende wird alles
      aufgeräumt. Was die nächste Anfrage braucht, muss in einer Datenbank, einer Datei oder einer Session liegen.
  - type: match
    question: Ordne jedem Befehl seine Wirkung zu.
    pairs:
      - { left: "php skript.php", right: "Führt eine Datei auf der Kommandozeile aus" }
      - { left: "php -r 'echo 1 + 1;'", right: "Führt eine einzelne Code-Zeile aus" }
      - { left: "php -S localhost:8000", right: "Startet den eingebauten Entwicklungsserver" }
      - { left: "php -v", right: "Zeigt die installierte PHP-Version" }
    explanation: Alle vier Varianten nutzt du ständig. `-r` erwartet Code ohne `<?php`.
  - type: multiple
    question: Welche Aussagen über den eingebauten Webserver (`php -S`) stimmen?
    options:
      - Er eignet sich zum lokalen Entwickeln und Ausprobieren.
      - Er ist für den Produktivbetrieb gedacht.
      - Mit `-t` legst du den Ordner fest, aus dem er Dateien ausliefert.
      - Er braucht nginx, um zu starten.
    answers: [0, 2]
    explanation: >
      `php -S` ist ein Werkzeug für die Entwicklung. In Produktion übernimmt ein echter Webserver wie nginx
      zusammen mit php-fpm.
  - type: cloze
    text: "Im Web gibt nginx die Anfrage an ___ weiter. Auf der Kommandozeile stehen die Argumente im Array ___."
    blanks:
      - [php-fpm, fpm]
      - ["$argv", argv]
    explanation: php-fpm verwaltet die PHP-Prozesse für Web-Anfragen. In CLI-Skripten liefert `$argv` die Argumente.
tasks:
  - id: erster-server
    type: terminal
    title: Dein erster PHP-Server
    description: |
      Du schreibst eine kleine Webseite in PHP und lieferst sie mit dem eingebauten Server aus.

      Klicke zuerst auf **Aufgabe vorbereiten** – dann ist der Ordner `erster-server` leer und bereit.

      1. Prüfe mit `php -v`, welche Version installiert ist, und rechne mit `php -r 'echo 6 * 7, PHP_EOL;'`.
      2. Lege im Ordner `erster-server` die Datei `index.php` an (z. B. mit `nano index.php`).
      3. Die Seite soll den Query-Parameter `name` lesen und `Hallo, Ada!` ausgeben, wenn sie mit `?name=Ada`
         aufgerufen wird. Fehlt der Parameter, lautet die Ausgabe `Hallo, Welt!`.
      4. Starte den Server mit `php -S 127.0.0.1:8000` und teste in einem zweiten Schritt mit
         `curl "http://127.0.0.1:8000/?name=Ada"`. Beende den Server mit Strg+C.
    workdir: erster-server
    setup: |
      true
    checks:
      - type: file_exists
        path: index.php
        message: Im Ordner erster-server fehlt noch die Datei index.php.
      - type: command
        run: php -l index.php
        message: index.php enthält einen Syntaxfehler – prüfe sie mit php -l index.php.
      - type: command
        run: 'port=$((20000 + RANDOM % 20000)); php -S 127.0.0.1:$port >/dev/null 2>&1 & pid=$!; sleep 1; curl -s "http://127.0.0.1:$port/index.php?name=Ada"; kill $pid'
        stdout_matches: "Hallo, Ada!"
        message: 'Mit ?name=Ada soll die Seite "Hallo, Ada!" ausgeben. Lies den Wert mit $_GET["name"].'
      - type: command
        run: 'port=$((20000 + RANDOM % 20000)); php -S 127.0.0.1:$port >/dev/null 2>&1 & pid=$!; sleep 1; curl -s "http://127.0.0.1:$port/index.php"; kill $pid'
        stdout_matches: "Hallo, Welt!"
        message: 'Ohne Parameter soll die Seite "Hallo, Welt!" ausgeben. Nutze ?? für den Standardwert.'
    hints:
      - "Die Datei beginnt mit `<?php`. Query-Parameter liegen im Array `$_GET`."
      - "Mit dem Null-Coalescing-Operator setzt du einen Standardwert: `$name = $_GET['name'] ?? 'Welt';`"
      - "Ausgabe: `echo \"Hallo, {$name}!\";` – für echte HTML-Seiten gehört der Wert noch durch `htmlspecialchars()`."
    solution: |
      ```php
      <?php
      $name = $_GET['name'] ?? 'Welt';
      echo 'Hallo, ' . htmlspecialchars($name) . '!';
      ```
      ```bash
      php -S 127.0.0.1:8000
      # in einem zweiten Terminal:
      curl "http://127.0.0.1:8000/?name=Ada"
      ```
  - id: request-ablauf
    type: order
    title: Der Weg einer Web-Anfrage
    description: Bring die Stationen einer Anfrage an eine PHP-Website in die richtige Reihenfolge.
    items:
      - Der Browser schickt eine HTTP-Anfrage an den Server.
      - nginx nimmt die Anfrage an und erkennt, dass eine PHP-Datei zuständig ist.
      - nginx reicht die Anfrage per FastCGI an php-fpm weiter.
      - Ein freier PHP-Prozess führt das Skript von oben nach unten aus.
      - Die Ausgabe des Skripts geht als Antwort zurück an den Browser.
      - PHP räumt alle Variablen und Objekte dieser Anfrage weg.
    hints:
      - Der Webserver ist die Tür, php-fpm die Werkstatt dahinter.
---
Du hast in den Grundlagen gesehen, wie ein [[interpreter]] Code Zeile für Zeile ausführt. [[php|PHP]] ist so
ein interpretierte Sprache – aber sie lebt in zwei Welten: auf der [[kommandozeile]] und hinter einem
[[webserver]]. Wer versteht, wie PHP in beiden Welten läuft, versteht auch viele Eigenheiten der Sprache.

## Zwei Welten: CLI und Web

PHP kann auf zwei Arten gestartet werden:

| | Kommandozeile (CLI) | Web |
|---|---|---|
| Start | Du tippst `php skript.php` | Ein Browser ruft eine URL auf |
| Wer startet PHP? | Du selbst | Der Webserver über [[php-fpm]] |
| Eingabe | Argumente in `$argv` | Request-Daten in `$_GET`, `$_POST` … |
| Ausgabe | Ins Terminal | Als HTTP-Antwort an den Browser |
| Typischer Einsatz | Skripte, Cronjobs, Tests, Composer | Websites, APIs |

Die Kommandozeilen-Variante heißt [[php-cli|PHP-CLI]]. Du benutzt sie ständig: Composer, Tests und
Laravels `artisan` sind PHP-Skripte, die auf der Kommandozeile laufen.

```bash title="Terminal"
php -v                          # Version anzeigen
php -r 'echo 6 * 7, PHP_EOL;'   # eine Zeile Code ausführen (ohne <?php)
php hallo.php Ada               # eine Datei mit Argument ausführen
php -l hallo.php                # nur Syntax prüfen (Lint)
```

> [!MERKSATZ]
> Dieselbe Sprache, zwei Einstiege: **CLI** für Skripte und Werkzeuge, **php-fpm** für Web-Anfragen.

## Ein PHP-Skript von innen

Eine PHP-Datei beginnt mit dem öffnenden Tag `<?php`. Alles danach ist PHP-Code. Ein schließendes `?>`
lässt du in reinen PHP-Dateien weg – sonst rutscht schnell ein Leerzeichen oder Zeilenumbruch in die Ausgabe.

```php title="hallo.php"
<?php
declare(strict_types=1);

$name = $argv[1] ?? 'Welt';
echo "Hallo, {$name}!" . PHP_EOL;
```

```bash title="Terminal"
php hallo.php Ada
# Hallo, Ada!
```

- `$argv` ist ein Array: `$argv[0]` ist der Skriptname, ab `$argv[1]` kommen deine [[skript-argument|Argumente]].
- `$argc` enthält die Anzahl der Einträge.
- `PHP_EOL` ist der Zeilenumbruch des Betriebssystems.
- `??` liefert den rechten Wert, wenn links nichts (oder `null`) steht – du kennst ihn als
  [[nullish-coalescing|Null-Coalescing-Operator]].

> [!FEHLER]
> `php -r '<?php echo 1;'` schlägt fehl: Bei `-r` schreibst du den Code **ohne** `<?php`.

## Im Web: nginx und php-fpm

Im Web startet niemand PHP von Hand. Der Ablauf sieht so aus:

![Der Weg einer Anfrage: Browser, nginx, php-fpm, Skript und zurück; daneben der CLI-Weg](/assets/php/php-ausfuehrung.svg)

1. Der Browser schickt einen [[http-request|HTTP-Request]] an [[nginx]].
2. nginx liefert Bilder und CSS selbst aus. Für `.php`-Dateien reicht er die Anfrage an **php-fpm** weiter.
3. php-fpm (FastCGI Process Manager) hält einen Pool von PHP-Prozessen bereit. Ein freier Prozess führt
   das Skript aus.
4. Alles, was das Skript mit `echo` ausgibt, wird zur [[response|Antwort]].

Diese Reise heißt [[request-lebenszyklus|Request-Lebenszyklus]]. In Frameworks wie Laravel landet jede Anfrage
zuerst in einer einzigen Datei `public/index.php` – dem [[front-controller|Front-Controller]].

## Share nothing: jede Anfrage startet leer

Ein wichtiger Unterschied zu Node.js: Ein PHP-Prozess vergisst nach jeder Anfrage **alles**. Variablen,
Objekte, offene Dateien – weg. Die nächste Anfrage beginnt mit einem leeren Zustand.

| Vorteil | Folge für dich |
|---|---|
| Ein Fehler in einer Anfrage stört keine andere | Robust und einfach zu verstehen |
| Kein Speicher „läuft voll“ über Tage | Wenig Ärger mit Speicherlecks |
| Zustand geht verloren | Was bleiben soll, gehört in Datenbank, Datei oder [[session|Session]] |

Damit PHP den Code nicht bei jeder Anfrage neu einlesen muss, speichert die Erweiterung [[opcache|OPcache]]
den übersetzten Code zwischen. Einstellungen wie Fehleranzeige stehen in der [[php-ini|php.ini]].

> [!PRAXIS]
> In Produktion laufen PHP-Anwendungen fast immer hinter nginx mit php-fpm, oft in einem Docker-Container.
> Lokal reicht für den Anfang der eingebaute Server.

## Der eingebaute Entwicklungsserver

Für das schnelle Ausprobieren bringt PHP einen [[eingebauter-webserver|eingebauten Webserver]] mit:

```bash title="Terminal"
php -S 127.0.0.1:8000              # aktueller Ordner ist das Document Root
php -S 127.0.0.1:8000 -t public    # Ordner public ausliefern
```

```php title="index.php"
<?php
$name = $_GET['name'] ?? 'Welt';
echo 'Hallo, ' . htmlspecialchars($name) . '!';
```

Rufst du `http://127.0.0.1:8000/?name=Ada` auf, landet `name=Ada` im Array `$_GET`. Solche vordefinierten
Arrays (`$_GET`, `$_POST`, `$_SERVER`, `$_COOKIE`) heißen [[superglobale|Superglobals]]. Mit `-t` legst du das
[[document-root|Document Root]] fest. Der Server verarbeitet Anfragen nacheinander und ist **nur für die
Entwicklung** gedacht.

> [!ACHTUNG]
> Gib Werte aus `$_GET` nie ungefiltert in HTML aus. `htmlspecialchars()` wandelt `<` und `>` in harmlose
> Zeichen um und verhindert so eingeschleusten Code.

## Zusammenfassung

- PHP läuft auf der **Kommandozeile** (`php datei.php`, `php -r`) und im **Web** hinter nginx mit **php-fpm**.
- CLI-Skripte lesen Argumente aus `$argv`, Web-Skripte Request-Daten aus Superglobals wie `$_GET`.
- Jede Web-Anfrage startet mit leerem Zustand („share nothing“).
- `php -S 127.0.0.1:8000` startet den eingebauten Server – nur für die Entwicklung.
- `php -l` prüft eine Datei auf Syntaxfehler, `php -v` zeigt die Version.
