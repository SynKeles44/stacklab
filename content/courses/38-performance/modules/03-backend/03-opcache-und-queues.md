---
title: OPcache und Warteschlangen
summary: Wie OPcache PHP das ständige Neu-Übersetzen erspart, welche Einstellungen in Produktion gehören und wie du langsame Arbeit aus dem Request in eine Warteschlange verlagerst.
duration: 25
sources:
  - title: PHP-Handbuch – OPcache
    url: https://www.php.net/manual/de/book.opcache.php
  - title: PHP-Handbuch – OPcache-Konfiguration
    url: https://www.php.net/manual/de/opcache.configuration.php
  - title: Laravel – Queues
    url: https://laravel.com/docs/13.x/queues
  - title: Laravel – Deployment, Optimization
    url: https://laravel.com/docs/13.x/deployment#optimization
quiz:
  - type: single
    question: Was speichert OPcache?
    options:
      - Die Ergebnisse von Datenbankabfragen
      - Den übersetzten Bytecode (Opcodes) der PHP-Dateien im gemeinsamen Arbeitsspeicher
      - Fertige HTML-Antworten
      - Die Sessions der Nutzer:innen
    answer: 1
    explanation: >
      Ohne OPcache liest und übersetzt PHP bei jeder Anfrage alle beteiligten Dateien neu. OPcache hebt das Ergebnis der
      Übersetzung auf, sodass PHP direkt mit dem Ausführen beginnen kann.
  - type: multiple
    question: Du setzt in Produktion `opcache.validate_timestamps=0`. Was folgt daraus?
    options:
      - PHP prüft nicht mehr bei jeder Anfrage, ob sich Dateien geändert haben.
      - Nach einem Deployment musst du PHP-FPM neu laden, sonst läuft der alte Code weiter.
      - OPcache ist damit ausgeschaltet.
      - Für die lokale Entwicklung ist die Einstellung ungeeignet.
    answers: [0, 1, 3]
    explanation: Ohne Zeitstempel-Prüfung spart PHP Dateisystemzugriffe, sieht aber Änderungen erst nach einem Neustart oder Reload – lokal willst du das nicht.
  - type: cloze
    text: "In Laravel schickst du einen Job mit `SendInvoiceMail::___($order)` in die Warteschlange. Ein Worker, gestartet mit `php artisan queue:___`, arbeitet ihn ab."
    blanks:
      - [dispatch]
      - [work]
    explanation: Der Request legt den Job nur ab und antwortet sofort. Der Worker-Prozess erledigt die Arbeit im Hintergrund.
  - type: single
    question: Ein Job versendet eine Rechnungs-Mail. Beim ersten Versuch bricht er nach dem Versand mit einem Fehler ab und wird automatisch wiederholt. Was ist das Risiko?
    options:
      - Keins, Wiederholungen sind immer harmlos.
      - Die Kundin bekommt die Rechnung zweimal – Jobs sollten idempotent sein.
      - Die Warteschlange wird gelöscht.
      - Der Worker stürzt dauerhaft ab.
    answer: 1
    explanation: Jobs können mehrfach laufen. Prüfe deshalb, ob die Arbeit schon erledigt ist (z. B. ein Feld `invoice_sent_at`), bevor du sie wiederholst.
tasks:
  - id: opcache-produktion
    type: terminal
    title: OPcache für die Produktion konfigurieren
    description: |
      Du bereitest die PHP-Konfiguration für einen Produktionsserver vor. Lege dafür eine eigene INI-Datei an und prüfe,
      ob PHP sie übernimmt.

      Klicke zuerst auf **Aufgabe vorbereiten**. Dann:

      1. Lege `opcache-produktion.ini` mit diesen Einstellungen an:
         - `opcache.enable=1`
         - `opcache.memory_consumption=256`
         - `opcache.interned_strings_buffer=16`
         - `opcache.max_accelerated_files=20000`
         - `opcache.validate_timestamps=0`
      2. Prüfe sie mit `php -c opcache-produktion.ini -r 'echo ini_get("opcache.validate_timestamps"), PHP_EOL;'`.
      3. Führe das vorbereitete `status.php` mit deiner Datei aus. Damit OPcache auch auf der Kommandozeile arbeitet,
         hängst du `-d opcache.enable_cli=1` an: `php -c opcache-produktion.ini -d opcache.enable_cli=1 status.php`.
      4. Speichere die Ausgabe dieses Befehls in `status.txt`.
    workdir: opcache-produktion
    setup: |
      cat > status.php <<'EOF'
      <?php

      declare(strict_types=1);

      $status = opcache_get_status(false);
      $config = opcache_get_configuration()['directives'];

      printf("aktiv: %s\n", ($status['opcache_enabled'] ?? false) ? 'ja' : 'nein');
      printf("speicher_mb: %d\n", $config['opcache.memory_consumption'] / 1024 / 1024);
      printf("max_dateien: %d\n", $config['opcache.max_accelerated_files']);
      printf("zeitstempel_pruefen: %s\n", $config['opcache.validate_timestamps'] ? 'ja' : 'nein');
      EOF
    checks:
      - type: file_exists
        path: opcache-produktion.ini
        message: Lege die Datei opcache-produktion.ini an.
      - type: command
        run: php -c opcache-produktion.ini -r 'echo ini_get("opcache.memory_consumption");'
        stdout_equals: "256"
        message: opcache.memory_consumption soll 256 sein.
      - type: command
        run: php -c opcache-produktion.ini -r 'echo ini_get("opcache.max_accelerated_files");'
        stdout_equals: "20000"
        message: opcache.max_accelerated_files soll 20000 sein.
      - type: command
        run: php -c opcache-produktion.ini -r 'echo ini_get("opcache.interned_strings_buffer");'
        stdout_equals: "16"
        message: opcache.interned_strings_buffer soll 16 sein.
      - type: command
        run: php -c opcache-produktion.ini -r 'echo ini_get("opcache.validate_timestamps");'
        stdout_matches: "^(0|)$"
        message: opcache.validate_timestamps soll in Produktion 0 sein.
      - type: file_contains
        path: status.txt
        pattern: "^aktiv: ja"
        message: In status.txt fehlt die Ausgabe von status.php mit aktivem OPcache. Denk an -d opcache.enable_cli=1.
      - type: file_contains
        path: status.txt
        pattern: "^zeitstempel_pruefen: nein"
        message: status.txt zeigt noch, dass Zeitstempel geprüft werden. Hast du -c opcache-produktion.ini angegeben?
    hints:
      - "Eine INI-Datei hat pro Zeile einen Eintrag `schluessel=wert`. Mit `cat > opcache-produktion.ini <<'EOF'` schreibst du mehrere Zeilen."
      - "Mit `-c datei.ini` liest PHP deine Datei als php.ini, mit `-d` setzt du einzelne Werte zusätzlich."
      - "`php -c opcache-produktion.ini -d opcache.enable_cli=1 status.php > status.txt`"
    solution: |
      ```bash
      cat > opcache-produktion.ini <<'EOF'
      opcache.enable=1
      opcache.memory_consumption=256
      opcache.interned_strings_buffer=16
      opcache.max_accelerated_files=20000
      opcache.validate_timestamps=0
      EOF
      php -c opcache-produktion.ini -r 'echo ini_get("opcache.validate_timestamps"), PHP_EOL;'
      php -c opcache-produktion.ini -d opcache.enable_cli=1 status.php > status.txt
      cat status.txt
      ```
  - id: sofort-oder-queue
    type: dragdrop
    title: Sofort erledigen oder in die Warteschlange?
    description: Eine Kundin schließt eine Bestellung ab. Entscheide für jede Aufgabe, ob sie im Request passieren muss oder in die Warteschlange gehört.
    targets:
      - { id: sofort, label: "Im Request (Kundin wartet darauf)" }
      - { id: queue, label: "In die Warteschlange (später)" }
    items:
      - { label: "Eingaben validieren", target: sofort }
      - { label: "Bestellung in der Datenbank speichern", target: sofort }
      - { label: "Bestätigungs-Mail per SMTP versenden", target: queue }
      - { label: "Rechnungs-PDF erzeugen", target: queue }
      - { label: "Bestellung an das Lagerverwaltungssystem melden", target: queue }
      - { label: "Bestellnummer in der Antwort anzeigen", target: sofort }
---
Zwei Stellen im Backend kosten Zeit, ohne dass sie im eigenen Code auffallen: PHP übersetzt bei jeder Anfrage
dieselben Dateien neu, und Anfragen warten auf Arbeit, die gar nicht sofort erledigt sein müsste. Für das erste
gibt es [[opcache|OPcache]], für das zweite [[job-queue|Warteschlangen]].

## Was OPcache macht

PHP ist eine interpretierte Sprache. Ohne Cache läuft jede Anfrage so ab:

1. Alle beteiligten Dateien lesen (bei Laravel schnell mehrere hundert).
2. Den Code in Opcodes übersetzen – Anweisungen für die PHP-Engine.
3. Die Opcodes ausführen.

OPcache hebt das Ergebnis von Schritt 2 im gemeinsamen Arbeitsspeicher aller [[php-fpm|PHP-FPM]]-Prozesse auf. Ab
der zweiten Anfrage entfällt das Übersetzen – oft der größte Einzelgewinn, den eine PHP-Anwendung ohne eine Zeile
Codeänderung bekommen kann.

```bash title="Ist OPcache aktiv?"
php -i | grep -E '^opcache\.(enable|enable_cli) '
php -r 'var_dump(function_exists("opcache_get_status"));'
```

Auf der Kommandozeile ist OPcache standardmäßig aus (`opcache.enable_cli=0`), weil jeder CLI-Aufruf ein neuer Prozess
mit leerem Cache ist.

## OPcache für die Produktion einstellen

| Einstellung | Produktion | Bedeutung |
|---|---|---|
| `opcache.enable` | `1` | OPcache einschalten |
| `opcache.memory_consumption` | `256` | Speicher für Opcodes in MB |
| `opcache.interned_strings_buffer` | `16` | Speicher für doppelte Zeichenketten in MB |
| `opcache.max_accelerated_files` | `20000` | Wie viele Dateien maximal gecacht werden |
| `opcache.validate_timestamps` | `0` | Nicht bei jeder Anfrage prüfen, ob Dateien geändert wurden |

Mit `validate_timestamps=0` spart PHP Dateisystemzugriffe. Der Preis: Neuer Code wird erst nach einem Reload von
PHP-FPM aktiv – das gehört deshalb in jedes Deployment-Skript.

> [!FEHLER]
> Nach dem Deployment läuft „der alte Code weiter“, obwohl die Dateien neu sind? Bei `validate_timestamps=0` liegt
> noch der alte Bytecode im Speicher. Lösung: `php-fpm` neu laden – nicht die Einstellung wieder einschalten.

Zwei weiterführende Funktionen in einem Satz: **Preloading** (`opcache.preload`) lädt ausgewählte Dateien schon beim
Start von PHP-FPM, und der [[jit-compiler|JIT-Compiler]] bringt vor allem bei rechenlastigem Code etwas, bei typischen
Web-Anwendungen dagegen wenig ([Handbuch](https://www.php.net/manual/de/opcache.configuration.php)).

## Langsame Arbeit aus dem Request holen

Eine Bestellung abzuschicken dauert drei Sekunden. Im Profil siehst du: 40 ms für das Speichern, 1 800 ms für den
Mailversand per SMTP, 1 100 ms für das Rechnungs-PDF. Die Kundin wartet auf Dinge, die sie gar nicht sofort braucht.

Die Lösung ist eine **Warteschlange** (Queue):

1. Der Request speichert die Bestellung und legt einen **Job** in die Warteschlange (z. B. in Redis oder einer Tabelle).
2. Er antwortet sofort: „Danke für deine Bestellung!“
3. Ein separater [[worker-prozess|Worker-Prozess]] holt den Job ab und versendet die Mail.

```php title="Laravel: Job verschicken statt warten"
public function store(StoreOrderRequest $request): RedirectResponse
{
    $order = Order::create($request->validated());

    SendOrderConfirmation::dispatch($order);   // dauert ~1 ms
    GenerateInvoicePdf::dispatch($order);

    return to_route('orders.show', $order);
}
```

```bash title="Worker starten"
php artisan queue:work
```

> [!MERKSATZ]
> Im Request passiert nur, worauf die Nutzerin wartet. Alles andere – Mails, PDFs, Bildbearbeitung, Aufrufe fremder APIs – gehört in eine Warteschlange.

## Was bei Warteschlangen schiefgehen kann

- **Wiederholungen:** Schlägt ein Job fehl, wird er erneut versucht. Er muss deshalb [[idempotenz|idempotent]] sein –
  zweimal ausführen darf nicht zwei Mails erzeugen.
- **Fehlgeschlagene Jobs:** Nach der letzten Wiederholung landen sie in einer Liste (`php artisan queue:failed`) – jemand muss sie ansehen.
- **Alter Code im Worker:** Worker laufen dauerhaft und kennen neuen Code erst nach `php artisan queue:restart`.
- **Wartende Jobs:** Wächst die Warteschlange schneller, als Worker sie abarbeiten, brauchst du mehr Worker.

> [!PRAXIS]
> In Produktion überwacht ein Prozessmanager wie Supervisor oder systemd die Worker und startet sie neu, wenn sie
> abstürzen. Die Länge der Warteschlange ist eine der wichtigsten Kennzahlen auf dem Dashboard.

## Zusammenfassung

- **OPcache** speichert übersetzte Opcodes im gemeinsamen Speicher und spart das Neu-Übersetzen bei jeder Anfrage.
- Produktion: genug Speicher, hohes `max_accelerated_files` und `validate_timestamps=0` – mit PHP-FPM-Reload beim Deployment.
- Langsame Arbeit, auf die niemand wartet, gehört in eine **Warteschlange**, die ein **Worker** abarbeitet.
- Jobs müssen **idempotent** sein; fehlgeschlagene Jobs und die Länge der Warteschlange gehören überwacht.
- Worker nach einem Deployment mit `queue:restart` neu starten.
