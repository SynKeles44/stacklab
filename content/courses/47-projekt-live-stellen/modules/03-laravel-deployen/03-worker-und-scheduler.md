---
title: Queue-Worker und Scheduler dauerhaft betreiben
summary: Supervisor hält die Worker am Leben, Cron weckt jede Minute den Scheduler – und beide überleben Deploys und Neustarts.
duration: 20
sources:
  - title: Laravel 13 – Queues, Supervisor Configuration
    url: https://laravel.com/docs/13.x/queues#supervisor-configuration
  - title: Laravel 13 – Task Scheduling, Running the Scheduler
    url: https://laravel.com/docs/13.x/scheduling#running-the-scheduler
  - title: Supervisor – Configuration File
    url: https://supervisord.org/configuration.html
  - title: crontab(5) – Debian Manpage
    url: https://manpages.debian.org/stable/cron/crontab.5.en.html
quiz:
  - type: single
    question: Wozu dient `stopwaitsecs` in der Supervisor-Konfiguration?
    options:
      - Wie lange Supervisor nach dem Start wartet.
      - Wie lange Supervisor einem Worker beim Stoppen Zeit gibt, seinen aktuellen Job zu beenden, bevor er ihn hart beendet.
      - Wie oft der Worker neu startet.
      - Wie lange ein Job höchstens dauern darf.
    answer: 1
    explanation: Der Wert sollte größer sein als dein längster Job – sonst bricht Supervisor ihn beim Stoppen mitten in der Arbeit ab.
  - type: cloze
    text: "Die Cron-Zeile für den Laravel-Scheduler beginnt mit fünf Sternchen: `___ cd /var/www/example.com/current && php artisan schedule:run`."
    blanks:
      - ["* * * * *"]
    explanation: Fünf Sternchen bedeuten „jede Minute“. Welche Aufgaben wirklich laufen, entscheidet Laravel anhand von routes/console.php.
  - type: match
    question: Ordne jede Supervisor-Einstellung ihrer Wirkung zu.
    pairs:
      - { left: "numprocs=2", right: "zwei Worker-Prozesse parallel" }
      - { left: "autorestart=true", right: "nach einem Absturz neu starten" }
      - { left: "user=deploy", right: "Prozess läuft als Benutzer deploy" }
      - { left: "stdout_logfile", right: "Ausgabe des Workers in eine Datei" }
    explanation: Diese vier Zeilen findest du in fast jeder Worker-Konfiguration.
  - type: single
    question: Warum zeigt der Pfad im Worker-Befehl auf `current/artisan` statt auf ein bestimmtes Release?
    options:
      - Weil Supervisor keine Zeitstempel versteht.
      - Weil nach jedem Neustart automatisch der Code des gerade aktiven Releases verwendet wird.
      - Weil es kürzer ist.
      - Das ist falsch, man sollte das Release fest eintragen.
    answer: 1
    explanation: Nach queue:restart beenden sich die Worker, Supervisor startet sie über current/artisan neu – mit dem neuen Code.
tasks:
  - id: prozesse-konfigurieren
    type: terminal
    title: Worker und Scheduler konfigurieren
    description: |
      Lege im Ordner `prozesse` zwei Dateien für den Server an:

      1. `laravel-worker.conf` (für `/etc/supervisor/conf.d/`) mit einem Abschnitt `[program:laravel-worker]`:
         - `command=php /var/www/example.com/current/artisan queue:work --sleep=3 --tries=3 --max-time=3600`
         - `process_name=%(program_name)s_%(process_num)02d`
         - `autostart=true`, `autorestart=true`, `stopasgroup=true`, `killasgroup=true`
         - `user=deploy`, `numprocs=2`
         - `redirect_stderr=true`, `stdout_logfile=/var/www/example.com/shared/storage/logs/worker.log`
         - `stopwaitsecs=3600`
      2. `laravel-scheduler` (für `/etc/cron.d/`) mit **einer** Zeile, die jede Minute als Benutzer `deploy`
         `cd /var/www/example.com/current && php artisan schedule:run >> /dev/null 2>&1` ausführt.
         In `/etc/cron.d/` steht der Benutzer als sechste Spalte nach den fünf Zeitfeldern.
    workdir: prozesse
    checks:
      - type: file_exists
        path: laravel-worker.conf
        message: Die Datei laravel-worker.conf fehlt noch.
      - type: command
        run: |
          php -r '$i = @parse_ini_file("laravel-worker.conf", true, INI_SCANNER_RAW); $p = $i["program:laravel-worker"] ?? null; if (!$p) { exit(1); } echo trim($p["command"] ?? "");'
        stdout_matches: "^php /var/www/example\\.com/current/artisan queue:work( --[a-z-]+=\\d+)+$"
        message: "Es fehlt der Abschnitt [program:laravel-worker] oder command zeigt nicht auf php /var/www/example.com/current/artisan queue:work …"
      - type: command
        run: |
          php -r '$p = parse_ini_file("laravel-worker.conf", true, INI_SCANNER_RAW)["program:laravel-worker"]; foreach (["--sleep=3", "--tries=3", "--max-time=3600"] as $o) { if (!str_contains($p["command"], $o)) { echo "fehlt $o\n"; } }'
        stdout_equals: ""
        message: Der Worker-Befehl braucht --sleep=3, --tries=3 und --max-time=3600.
      - type: command
        run: |
          php -r '$p = parse_ini_file("laravel-worker.conf", true, INI_SCANNER_RAW)["program:laravel-worker"]; $soll = ["process_name" => "%(program_name)s_%(process_num)02d", "autostart" => "true", "autorestart" => "true", "stopasgroup" => "true", "killasgroup" => "true", "user" => "deploy", "numprocs" => "2", "redirect_stderr" => "true", "stdout_logfile" => "/var/www/example.com/shared/storage/logs/worker.log", "stopwaitsecs" => "3600"]; foreach ($soll as $k => $v) { if (trim($p[$k] ?? "") !== $v) { echo "$k\n"; } }'
        stdout_equals: ""
        message: Mindestens eine Einstellung fehlt oder hat einen anderen Wert (die Ausgabe der Prüfung nennt sie).
      - type: file_exists
        path: laravel-scheduler
        message: Die Datei laravel-scheduler fehlt noch.
      - type: command
        run: grep -vE '^\s*(#|$)' laravel-scheduler | wc -l
        stdout_matches: "^\\s*1\\s*$"
        message: laravel-scheduler soll genau eine Cron-Zeile enthalten (Kommentare sind erlaubt).
      - type: command
        run: grep -vE '^\s*(#|$)' laravel-scheduler | awk '{print $1,$2,$3,$4,$5,$6}'
        stdout_equals: "* * * * * deploy"
        message: "Die Zeile beginnt mit `* * * * * deploy` – fünf Sternchen für jede Minute, dann der Benutzer."
      - type: command
        run: grep -vE '^\s*(#|$)' laravel-scheduler | grep -Eq 'cd /var/www/example\.com/current && php artisan schedule:run >> /dev/null 2>&1\s*$'
        message: "Der Befehl lautet `cd /var/www/example.com/current && php artisan schedule:run >> /dev/null 2>&1`."
    hints:
      - "Eine Supervisor-Datei ist eine INI-Datei: Abschnitt in eckigen Klammern, darunter `schluessel=wert`."
      - "Orientiere dich am Beispiel in der Laravel-Dokumentation (Queues → Supervisor Configuration)."
      - "Cron-Zeile: `* * * * * deploy cd /var/www/example.com/current && php artisan schedule:run >> /dev/null 2>&1`"
    solution: |
      ```bash
      cd prozesse
      cat > laravel-worker.conf <<'EOF'
      [program:laravel-worker]
      process_name=%(program_name)s_%(process_num)02d
      command=php /var/www/example.com/current/artisan queue:work --sleep=3 --tries=3 --max-time=3600
      autostart=true
      autorestart=true
      stopasgroup=true
      killasgroup=true
      user=deploy
      numprocs=2
      redirect_stderr=true
      stdout_logfile=/var/www/example.com/shared/storage/logs/worker.log
      stopwaitsecs=3600
      EOF
      cat > laravel-scheduler <<'EOF'
      # Laravel-Scheduler jede Minute anstoßen
      * * * * * deploy cd /var/www/example.com/current && php artisan schedule:run >> /dev/null 2>&1
      EOF
      ```
  - id: supervisor-starten
    type: simulated
    title: Die Worker starten und beobachten
    description: |
      Die Datei liegt jetzt unter `/etc/supervisor/conf.d/laravel-worker.conf`. Starte die Worker:

      1. `sudo supervisorctl reread` – Supervisor liest neue Dateien ein.
      2. `sudo supervisorctl update` – übernimmt die Änderungen.
      3. `sudo supervisorctl start "laravel-worker:*"` – startet alle Worker der Gruppe.
      4. `sudo supervisorctl status` – zeigt, ob sie laufen.
      5. `tail -n 3 /var/www/example.com/shared/storage/logs/worker.log` – die letzten Jobs.
    prompt: "deploy@web-01:~$"
    steps:
      - expect: "^sudo\\s+supervisorctl\\s+reread\\s*$"
        output: "laravel-worker: available"
      - expect: "^sudo\\s+supervisorctl\\s+update\\s*$"
        output: "laravel-worker: added process group"
      - expect: "^sudo\\s+supervisorctl\\s+start\\s+[\"']?laravel-worker:\\*[\"']?\\s*$"
        output: |
          laravel-worker:laravel-worker_00: started
          laravel-worker:laravel-worker_01: started
        hint: "sudo supervisorctl start \"laravel-worker:*\""
      - expect: "^sudo\\s+supervisorctl\\s+status\\s*$"
        output: |
          laravel-worker:laravel-worker_00   RUNNING   pid 4211, uptime 0:00:12
          laravel-worker:laravel-worker_01   RUNNING   pid 4212, uptime 0:00:12
      - expect: "^tail\\s+-n\\s*3\\s+/var/www/example\\.com/shared/storage/logs/worker\\.log\\s*$"
        output: |
          2026-10-10 12:01:04 App\Jobs\SendOrderConfirmation ........ RUNNING
          2026-10-10 12:01:05 App\Jobs\SendOrderConfirmation ........ 412.83ms DONE
          2026-10-10 12:03:40 App\Jobs\ExportDailyReport ............ 1s DONE
    solution: |
      ```bash
      sudo supervisorctl reread
      sudo supervisorctl update
      sudo supervisorctl start "laravel-worker:*"
      sudo supervisorctl status
      tail -n 3 /var/www/example.com/shared/storage/logs/worker.log
      ```
---
Lokal startest du `php artisan queue:work` in einem Terminal-Fenster. Schließt du es, bleiben Bestellmails
liegen. Auf dem Server gibt es kein Fenster, das offen bleibt – und der Worker kann abstürzen, Speicher
ansammeln oder nach einem Deploy alten Code ausführen. Zwei Werkzeuge lösen das: **Supervisor** für die
Worker und **Cron** für den Scheduler.

## Supervisor hält Worker am Leben

Ein [[queue-worker|Queue-Worker]] ist ein lang laufender [[prozess|Prozess]]. [[supervisor|Supervisor]]
startet ihn beim Hochfahren, startet ihn nach einem Absturz neu und kann mehrere Kopien parallel betreiben.

```ini title="/etc/supervisor/conf.d/laravel-worker.conf"
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/example.com/current/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=deploy
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/example.com/shared/storage/logs/worker.log
stopwaitsecs=3600
```

| Zeile | Bedeutung |
|---|---|
| `command` | der Worker – über `current/`, damit nach Neustarts der aktuelle Code läuft |
| `--max-time=3600` | der Worker beendet sich nach einer Stunde und gibt Speicher frei; Supervisor startet ihn neu |
| `numprocs=2` | zwei Worker arbeiten parallel |
| `stopwaitsecs=3600` | beim Stoppen bekommt ein Job bis zu einer Stunde Zeit – länger als dein längster Job |

```bash title="Terminal"
sudo supervisorctl reread && sudo supervisorctl update
sudo supervisorctl start "laravel-worker:*"
sudo supervisorctl status
```

## Worker und Deploys

Worker laden deinen Code **einmal** beim Start. Nach einem Deploy arbeiten sie also mit der alten Version
weiter – bis du sie neu startest:

```bash title="Am Ende von deploy.sh"
php artisan queue:restart
```

Der Befehl setzt ein Signal im Cache. Jeder Worker beendet danach seinen aktuellen Job und hört auf;
Supervisor startet ihn über `current/artisan` neu, also mit dem neuen Release. Kein Job geht verloren.

Scheitert ein Job auch nach allen Versuchen (`--tries=3`), landet er in der Tabelle `failed_jobs`. Mit `php artisan queue:failed` siehst du die Liste, mit `php artisan queue:retry all` schickst du die Jobs erneut los, sobald der Fehler behoben ist. Schau dort nach jedem Deploy kurz hinein.

> [!FEHLER]
> `queue:restart` im Deploy vergessen. Die Seite zeigt schon die neue Version, aber Mails werden noch mit
> altem Code verschickt – im schlimmsten Fall mit Klassen, die es im neuen Schema nicht mehr gibt.

## Cron weckt den Scheduler

Geplante Aufgaben stehen in Laravel in `routes/console.php`, z. B. `Schedule::command('report:daily')->dailyAt('02:00')`.
Damit sie laufen, muss jemand **jede Minute** `schedule:run` aufrufen. Das übernimmt [[cron|Cron]]:

```text title="/etc/cron.d/laravel-scheduler"
* * * * * deploy cd /var/www/example.com/current && php artisan schedule:run >> /dev/null 2>&1
```

| Teil | Bedeutung |
|---|---|
| `* * * * *` | Minute, Stunde, Tag, Monat, Wochentag – überall „jeder“ |
| `deploy` | in `/etc/cron.d/` die sechste Spalte: der ausführende Benutzer |
| `cd … && php artisan schedule:run` | Laravel prüft, welche Aufgaben jetzt fällig sind |
| `>> /dev/null 2>&1` | Ausgaben verwerfen – die App loggt selbst |

Dateien in `/etc/cron.d/` haben gegenüber `crontab -e` einen Vorteil: Du kannst sie wie jede andere
Konfigurationsdatei versionieren und per Skript ausrollen. Statt Cron ginge auch ein systemd-Timer – das
Prinzip bleibt dasselbe.

> [!MERKSATZ]
> Cron entscheidet nur **wann geprüft** wird (jede Minute). **Was** läuft, entscheidet der
> [[scheduler|Laravel-Scheduler]] in `routes/console.php`.

> [!PRAXIS]
> Läuft die App später auf mehreren Servern, laufen geplante Aufgaben sonst mehrfach. Laravel bietet dafür
> `->onOneServer()` – dann braucht es einen gemeinsamen Cache wie Redis.

## Zusammenfassung

- **Supervisor** startet Queue-Worker, startet sie nach Abstürzen neu und betreibt mehrere parallel.
- Der Worker-Befehl zeigt auf `current/artisan`; `--max-time` sorgt für regelmäßige Neustarts.
- `stopwaitsecs` muss länger sein als der längste Job.
- Nach jedem Deploy: `php artisan queue:restart`.
- **Cron** ruft jede Minute `schedule:run` auf; die Aufgaben selbst stehen in `routes/console.php`.
