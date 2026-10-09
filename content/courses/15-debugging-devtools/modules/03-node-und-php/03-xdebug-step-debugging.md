---
title: Step-Debugging in PHP mit Xdebug
summary: Wie Xdebug PHP mit deiner IDE verbindet, welche Einstellungen du brauchst und wie du mit Breakpoints, bedingten Breakpoints und Steps durch ein PHP-Skript gehst.
duration: 25
sources:
  - title: Xdebug – Step Debugging
    url: https://xdebug.org/docs/step_debug
  - title: Xdebug – All settings (xdebug.mode, start_with_request, client_host)
    url: https://xdebug.org/docs/all_settings
  - title: PhpStorm – Configure Xdebug
    url: https://www.jetbrains.com/help/phpstorm/configuring-xdebug.html
  - title: VS Code – PHP Debug (Xdebug)
    url: https://marketplace.visualstudio.com/items?itemName=xdebug.php-debug
quiz:
  - type: single
    question: Wer baut beim Step-Debugging mit Xdebug die Verbindung auf?
    options:
      - Die IDE verbindet sich mit dem PHP-Prozess.
      - PHP (Xdebug) verbindet sich mit der IDE, die auf einem Port lauscht.
      - Der Browser verbindet sich direkt mit der IDE.
    answer: 1
    explanation: >
      Die IDE wartet auf Port 9003, Xdebug meldet sich dort. Deshalb muss `xdebug.client_host` auf den Rechner
      zeigen, auf dem die IDE läuft.
  - type: match
    question: Ordne jeder Xdebug-Einstellung ihre Bedeutung zu.
    pairs:
      - { left: "xdebug.mode=debug", right: "Step-Debugging einschalten" }
      - { left: "xdebug.mode=develop", right: "Bessere Fehlermeldungen und var_dump-Ausgaben" }
      - { left: "xdebug.start_with_request=yes", right: "Bei jeder Anfrage versuchen, eine Debug-Sitzung zu starten" }
      - { left: "xdebug.client_port=9003", right: "Port, auf dem die IDE lauscht" }
    explanation: >
      Mehrere Modi lassen sich mit Komma kombinieren, z. B. `xdebug.mode=develop,debug`. Port 9003 ist seit
      Xdebug 3 der Standard.
  - type: cloze
    text: "Läuft PHP in einem Docker-Container und die IDE auf deinem Rechner, setzt du `xdebug.client_host` meist auf `host.docker.___`. Ohne `start_with_request=yes` startest du auf der Kommandozeile eine Sitzung mit der Umgebungsvariable ___=1."
    blanks:
      - [internal]
      - [XDEBUG_TRIGGER]
    explanation: >
      Im Container zeigt `localhost` auf den Container selbst, nicht auf deinen Rechner. Der Trigger
      `XDEBUG_TRIGGER` kann als GET-Parameter, Cookie oder Umgebungsvariable gesetzt werden.
  - type: multiple
    question: Welche Aussagen über Xdebug stimmen?
    options:
      - Xdebug verlangsamt PHP spürbar und sollte in Produktion ausgeschaltet sein.
      - Lauscht die IDE nicht, meldet Xdebug „Could not connect to debugging client“ und das Skript läuft normal weiter.
      - Ein bedingter Breakpoint hält nur an, wenn ein Ausdruck wie `$kunde['id'] === 42` wahr ist.
      - Xdebug funktioniert nur mit PhpStorm.
    answers: [0, 1, 2]
    explanation: >
      Xdebug spricht das offene Protokoll DBGp. Neben PhpStorm unterstützen es auch VS Code (Erweiterung
      „PHP Debug“) und viele andere Editoren.
tasks:
  - id: xdebug-verbindung-beschriften
    type: diagram
    title: Beschrifte die Xdebug-Verbindung
    description: >
      Das Diagramm zeigt, wie eine Debug-Sitzung zustande kommt. Ordne den drei Beteiligten und dem Port die
      richtige Beschriftung zu. Achte auf die Pfeilrichtung.
    image: /assets/debugging-devtools/xdebug-ablauf-leer.svg
    slots:
      - { x: 15, y: 34, answer: Browser oder CLI }
      - { x: 50, y: 34, answer: PHP mit Xdebug }
      - { x: 85, y: 34, answer: IDE (lauscht) }
      - { x: 67, y: 74, answer: Port 9003 }
    distractors: [Port 9229, Datenbank]
    hints:
      - Port 9229 gehört zum Node-Inspector, nicht zu Xdebug.
  - id: xdebug-container
    type: simulated
    title: Xdebug im Container zum Laufen bringen
    description: |
      Deine PHP-Anwendung läuft in einem Docker-Container, PhpStorm auf deinem Laptop. In PhpStorm hast du
      **Start Listening for PHP Debug Connections** eingeschaltet und in `rechnung.php` einen Breakpoint gesetzt.
      Du arbeitest in einer Shell **im Container**.

      1. Prüfe mit `php -v`, ob Xdebug installiert ist.
      2. Prüfe mit `php -i | grep xdebug.mode`, welcher Modus aktiv ist.
      3. Starte das Skript mit Step-Debugging: `php -d xdebug.mode=debug -d xdebug.start_with_request=yes rechnung.php`.
      4. Lies die Meldung und starte das Skript erneut – diesmal zusätzlich mit
         `-d xdebug.client_host=host.docker.internal`.
    prompt: "root@app-container:/var/www$"
    steps:
      - expect: "^php\\s+-v\\s*$"
        output: |
          PHP 8.5.0 (cli) (NTS)
          Copyright (c) The PHP Group
          Zend Engine v4.5.0, Copyright (c) Zend Technologies
              with Xdebug v3.5.0, Copyright (c) 2002-2026, by Derick Rethans
              with Zend OPcache v8.5.0, Copyright (c), by Zend Technologies
        hint: php -v
      - expect: "^php\\s+-i\\s*\\|\\s*grep\\s+['\"]?xdebug\\.mode['\"]?\\s*$"
        output: "xdebug.mode => off => off"
        hint: php -i | grep xdebug.mode
      - expect: "^php\\s+(?=.*-d\\s*xdebug\\.mode=debug)(?=.*-d\\s*xdebug\\.start_with_request=yes)(?!.*client_host).*rechnung\\.php\\s*$"
        output: |
          Xdebug: [Step Debug] Could not connect to debugging client. Tried: localhost:9003 (through xdebug.client_host/xdebug.client_port).
          Rechnungssumme: 119.00
        hint: php -d xdebug.mode=debug -d xdebug.start_with_request=yes rechnung.php
      - expect: "^php\\s+(?=.*-d\\s*xdebug\\.mode=debug)(?=.*-d\\s*xdebug\\.start_with_request=yes)(?=.*-d\\s*xdebug\\.client_host=host\\.docker\\.internal).*rechnung\\.php\\s*$"
        output: |
          [PhpStorm: Debug-Sitzung gestartet – angehalten in rechnung.php, Zeile 12]
          [Variables: $netto = 100.0, $steuersatz = 0.19]
        hint: php -d xdebug.mode=debug -d xdebug.start_with_request=yes -d xdebug.client_host=host.docker.internal rechnung.php
---
In der letzten Lektion hast du Werte mit `var_dump` sichtbar gemacht. Das funktioniert – aber bei jeder neuen
Frage musst du eine Ausgabe einbauen, das Skript neu starten und die Ausgabe wieder entfernen. Mit
[[xdebug|Xdebug]] hältst du PHP stattdessen per [[step-debugging|Step-Debugging]] an einer beliebigen Stelle an und siehst **alle** Variablen auf
einmal – genau wie mit den Breakpoints im Browser.

## Was Xdebug ist

Xdebug ist eine Erweiterung für PHP. Sie hat mehrere **Modi**, die du über die Einstellung `xdebug.mode`
einschaltest:

| Modus | Wofür |
|---|---|
| `off` | Xdebug ist geladen, tut aber nichts – kein Geschwindigkeitsverlust |
| `develop` | Bessere Fehlermeldungen mit Call Stack, schöneres `var_dump` |
| `debug` | Step-Debugging mit deiner IDE |
| `coverage` | Testabdeckung für PHPUnit und Pest messen |
| `profile` / `trace` | Laufzeit messen bzw. jeden Funktionsaufruf mitschreiben |

Mehrere Modi kombinierst du mit Komma: `xdebug.mode=develop,debug`. Ob Xdebug installiert ist, zeigt `php -v`
in der Zeile `with Xdebug v3…`.

> [!MERKSATZ]
> Xdebug macht PHP deutlich langsamer. In Produktion ist es nicht installiert oder steht auf `off`. Auch lokal
> schaltest du `debug` nur ein, wenn du es brauchst.

## Wie die Verbindung entsteht

Das Wichtigste vorweg – und das Gegenteil von dem, was die meisten erwarten: **Nicht die IDE verbindet sich mit
PHP, sondern PHP mit der IDE.**

![Ablauf einer Xdebug-Sitzung: Browser oder CLI startet die Anfrage, PHP mit Xdebug verbindet sich zur IDE auf Port 9003](/assets/debugging-devtools/xdebug-ablauf.svg)

1. Deine [[ide|IDE]] lauscht auf [[port|Port]] 9003. In PhpStorm heißt der Schalter
   **Start Listening for PHP Debug Connections**, in VS Code startest du die Konfiguration „Listen for Xdebug“
   der Erweiterung *PHP Debug*.
2. Du startest eine Anfrage – im Browser oder auf der Kommandozeile.
3. Xdebug baut eine Verbindung zu `xdebug.client_host` auf Port `xdebug.client_port` auf.
4. Die IDE übernimmt: Sie sagt Xdebug, wo die Breakpoints sitzen, und zeigt dir den angehaltenen Zustand.

Lauscht die IDE nicht, meldet Xdebug `Could not connect to debugging client` – und das Skript läuft einfach
normal weiter.

## Die wichtigsten Einstellungen

```ini title="php.ini oder conf.d/xdebug.ini (nur lokal!)"
xdebug.mode = debug
xdebug.start_with_request = trigger
xdebug.client_host = localhost
xdebug.client_port = 9003
```

Mit `start_with_request = trigger` startet Xdebug nur dann eine Sitzung, wenn ein **Trigger** gesetzt ist:

| Wo | Trigger |
|---|---|
| Browser | `?XDEBUG_TRIGGER=1` an der URL oder eine Browser-Erweiterung, die ein Cookie setzt |
| Kommandozeile | Umgebungsvariable: `XDEBUG_TRIGGER=1 php skript.php` |

Mit `start_with_request = yes` versucht Xdebug es bei **jeder** Anfrage. Für eine einzelne Sitzung auf der
Kommandozeile reicht auch `php -d xdebug.mode=debug -d xdebug.start_with_request=yes skript.php`.

> [!FEHLER]
> **`localhost` im Container.** Läuft PHP in [[docker|Docker]], zeigt [[localhost|`localhost`]] auf den Container selbst – dort lauscht
> keine IDE. Setze `xdebug.client_host=host.docker.internal` (Docker Desktop) oder die IP deines Rechners.
> Prüfe außerdem, ob eine Firewall Port 9003 blockiert.

## Breakpoints und Steps in PHP

Steht die Verbindung, arbeitest du genauso wie im Browser:

- **Breakpoint:** Klick neben die Zeilennummer. PHP hält **vor** dieser Zeile an.
- **[[bedingter-breakpoint|Bedingter Breakpoint]]:** Rechtsklick auf den Breakpoint, Bedingung eintragen, z. B.
  `$bestellung['id'] === 4711`. Ideal in Schleifen über tausende Datensätze.
- **Steps:** Step over, Step into, Step out und Resume – die Begriffe kennst du schon.
- **Variables und Watches:** alle lokalen Variablen, `$_GET`, `$_POST` und eigene Ausdrücke.
- **Evaluate:** beliebigen PHP-Ausdruck im aktuellen Zustand auswerten, etwa `count($positionen)`.

Ein Tipp für den Anfang: Setze in PhpStorm **Break at first line in PHP scripts**. Dann hält jede Sitzung in der
ersten Zeile an – so siehst du sofort, ob die Verbindung grundsätzlich funktioniert.

> [!PRAXIS]
> In Laravel-Projekten in Docker gehört eine fertige Xdebug-Konfiguration ins Entwicklungs-Setup des Teams: ein
> eigenes ini für den Container, `client_host=host.docker.internal` und ein Hinweis in der README, wie man
> lauscht. Dann kann jede neue Kollegin am ersten Tag Breakpoints setzen, statt einen Nachmittag mit der
> Einrichtung zu verbringen. Details stehen in der [Xdebug-Dokumentation](https://xdebug.org/docs/step_debug).

## Zusammenfassung

- Xdebug hat Modi: `off`, `develop`, `debug`, `coverage`, `profile`, `trace` – kombinierbar mit Komma.
- Beim Step-Debugging verbindet sich **PHP mit der IDE**, die auf Port 9003 lauscht.
- `start_with_request=trigger` startet eine Sitzung nur mit `XDEBUG_TRIGGER`, `yes` bei jeder Anfrage.
- „Could not connect to debugging client“ heißt: Die IDE lauscht nicht oder `client_host` ist falsch.
- Im Container ist `host.docker.internal` meist der richtige `client_host`.
- Breakpoints, bedingte Breakpoints, Steps und Watches funktionieren wie in den Browser-DevTools.
