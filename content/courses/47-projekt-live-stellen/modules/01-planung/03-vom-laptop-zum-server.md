---
title: Was sich zwischen Laptop und Server ändert
summary: Das Gesamtbild – welche Bausteine auf einem Produktionsserver zusammenspielen und was dort anders läuft als lokal.
duration: 20
sources:
  - title: Laravel 13 – Deployment
    url: https://laravel.com/docs/13.x/deployment
  - title: Laravel 13 – Configuration (Environment)
    url: https://laravel.com/docs/13.x/configuration
  - title: The Twelve-Factor App – Config und Processes
    url: https://12factor.net/de/config
quiz:
  - type: multiple
    question: Was läuft auf einem Produktionsserver anders als bei `php artisan serve` auf dem Laptop?
    options:
      - Ein Webserver wie nginx nimmt die Anfragen an und reicht PHP an PHP-FPM weiter.
      - Queue-Worker laufen dauerhaft und werden von einem Prozess-Manager neu gestartet.
      - Der Scheduler wird jede Minute von Cron angestoßen.
      - APP_DEBUG steht auf true, damit man Fehler sieht.
    answers: [0, 1, 2]
    explanation: >
      In Produktion ist APP_DEBUG immer false – sonst sehen Besucher Stacktraces und Konfigurationswerte.
      Der Rest beschreibt genau die Bausteine eines Servers.
  - type: single
    question: Warum startest du in Produktion nicht einfach `php artisan serve`?
    options:
      - Weil der Befehl nur unter Windows funktioniert.
      - Weil der eingebaute Entwicklungsserver nicht für viele gleichzeitige Anfragen, HTTPS und Dauerbetrieb gebaut ist.
      - Weil er zu viele Logs schreibt.
      - Weil er die Datenbank löscht.
    answer: 1
    explanation: Der eingebaute Server ist ein Werkzeug für die Entwicklung. In Produktion übernehmen nginx und PHP-FPM.
  - type: match
    question: Ordne jedem Baustein seine Aufgabe zu.
    pairs:
      - { left: "nginx", right: "nimmt HTTP(S) an, liefert statische Dateien aus" }
      - { left: "PHP-FPM", right: "führt PHP-Code in einem Pool von Prozessen aus" }
      - { left: "Supervisor", right: "hält Queue-Worker am Leben" }
      - { left: "Cron", right: "startet jede Minute den Laravel-Scheduler" }
    explanation: Jeder Baustein hat genau eine Aufgabe – deshalb lassen sich Fehler gut eingrenzen.
tasks:
  - id: architektur-beschriften
    type: diagram
    title: Beschrifte den Server
    description: >
      Das Bild zeigt, wie eine Anfrage an `example.com` durch deinen Server läuft. Ziehe die Begriffe an die
      richtigen Stellen.
    image: /assets/projekt-live-stellen/architektur-leer.svg
    slots:
      - { x: 31, y: 62, answer: Firewall }
      - { x: 47, y: 48, answer: nginx }
      - { x: 67, y: 48, answer: PHP-FPM }
      - { x: 47, y: 80, answer: Queue-Worker }
      - { x: 67, y: 80, answer: Scheduler }
      - { x: 87, y: 80, answer: Datenbank }
    distractors: [php artisan serve, Registrar]
    hints:
      - "Die Firewall ist das Erste, was eine Anfrage auf dem Server trifft."
      - "Worker und Scheduler arbeiten ohne Anfrage im Hintergrund."
  - id: anfrage-reihenfolge
    type: order
    title: Der Weg einer Anfrage
    description: Bring die Stationen einer Anfrage an `https://example.com/produkte` in die richtige Reihenfolge.
    items:
      - Der Browser fragt per DNS nach der IP-Adresse von example.com.
      - Die Firewall des Servers lässt die Verbindung auf Port 443 durch.
      - nginx entschlüsselt TLS und prüft, ob eine statische Datei passt.
      - nginx reicht die Anfrage an PHP-FPM weiter.
      - Laravel lädt Daten aus der Datenbank und erzeugt die Antwort.
      - nginx schickt die Antwort verschlüsselt zum Browser.
    hints:
      - Erst muss der Browser wissen, wohin er sich verbinden soll.
---
Lokal tippst du `php artisan serve`, `npm run dev` und vielleicht `php artisan queue:work` in drei
Terminal-Fenster. Klappst du den Laptop zu, ist alles weg. Ein Server muss dasselbe **ohne dich** leisten:
dauerhaft, sicher und auch nach einem Neustart. Bevor du Befehle tippst, lohnt sich deshalb ein Blick aufs
Gesamtbild.

## Die Bausteine auf einen Blick

![Der Weg einer Anfrage über DNS, Firewall, nginx und PHP-FPM bis zur Laravel-App](/assets/projekt-live-stellen/architektur.svg)

| Baustein | Aufgabe | Ersetzt lokal |
|---|---|---|
| [[dns\|DNS]] | übersetzt `example.com` in die Server-IP | `localhost` |
| [[firewall\|Firewall]] | lässt nur Ports 22, 80 und 443 durch | – |
| [[nginx\|nginx]] | nimmt HTTPS an, liefert Bilder/CSS/JS direkt aus | `php artisan serve` |
| [[php-fpm\|PHP-FPM]] | hält PHP-Prozesse bereit und führt `public/index.php` aus | `php artisan serve` |
| [[queue-worker\|Queue-Worker]] | arbeitet Jobs ab, gestartet von [[supervisor\|Supervisor]] | `php artisan queue:work` im Terminal |
| [[scheduler\|Scheduler]] | führt geplante Aufgaben aus, angestoßen von [[cron\|Cron]] | `php artisan schedule:work` |
| [[datenbank\|Datenbank]] | speichert die Daten dauerhaft | lokale SQLite-Datei oder Container |

Jeder Baustein ist ein eigener [[dienst|Dienst]], der beim Hochfahren automatisch startet. Fällt einer aus,
weißt du dank dieser Trennung schnell, wo du suchen musst.

## Konfiguration kommt aus der Umgebung

Derselbe Code läuft lokal und auf dem Server. Was sich unterscheidet, steht in der [[env-datei|.env-Datei]]
– sie liegt **nur** auf dem Server und nie im Repository.

| Variable | Lokal | Produktion |
|---|---|---|
| `APP_ENV` | `local` | `production` |
| `APP_DEBUG` | `true` | `false` |
| `APP_URL` | `http://localhost:8000` | `https://example.com` |
| `DB_CONNECTION` | `sqlite` | z. B. `pgsql` oder `mysql` |
| `MAIL_MAILER` | `log` | ein echter Mail-Dienst |

> [!FEHLER]
> `APP_DEBUG=true` in Produktion. Dann zeigt jede Fehlerseite Stacktraces, Pfade und Teile der Konfiguration –
> eine Einladung für Angreifer. In Produktion steht dort **immer** `false`.

## Gebaut wird vorher, ausgeführt wird dort

Auf dem Laptop baut Vite die Assets bei jeder Änderung neu, Composer installiert Entwicklungswerkzeuge wie
Pest mit. In Produktion gilt:

- `composer install --no-dev` – nur die Pakete, die die App wirklich braucht.
- `npm run build` – fertige, minifizierte Assets, entweder in der [[ci-pipeline|CI-Pipeline]] oder beim Deploy.
- Caches für Konfiguration, Routen und Views werden einmal pro Deploy erzeugt (`php artisan optimize`).
- Migrationen laufen kontrolliert beim Deploy mit `--force`, nicht von Hand.

> [!MERKSATZ]
> Ein Server sollte nach jedem Deploy in einem **reproduzierbaren** Zustand sein: gleicher Code, gleiche
> Befehle, gleiche Reihenfolge – am besten per Skript statt per Handarbeit.

## Der Fahrplan dieses Kurses

So gehst du in den nächsten Lektionen vor – genau in dieser Reihenfolge:

1. **Planen:** Hosting wählen, DNS-Einträge vorbereiten.
2. **Server einrichten:** absichern, Laufzeit-Stack installieren, nginx-Site schreiben.
3. **Laravel deployen:** `.env`, Deploy-Skript, Queue-Worker und Scheduler.
4. **Betreiben:** HTTPS, Backups mit Wiederherstellungsprobe, Überwachung, Go-live-Checkliste.

Am Ende jeder Etappe steht ein Baustein deines **Deploy-Kits** – Dateien, die du bei jedem neuen Projekt
wiederverwendest.

> [!PRAXIS]
> Erfahrene Teams halten Server-Konfiguration und Deploy-Skripte im Repository oder in einem eigenen
> Infrastruktur-Repository. So ist nachvollziehbar, wer wann was am Server geändert hat – genau wie beim Code.

## Zusammenfassung

- Ein Server ersetzt deine lokalen Terminal-Fenster durch **Dienste**, die von selbst starten.
- **nginx** nimmt Anfragen an, **PHP-FPM** führt PHP aus, **Supervisor** hält Worker am Leben, **Cron** startet den Scheduler.
- Unterschiede zwischen lokal und Produktion stehen in der `.env`, nicht im Code.
- In Produktion gilt `APP_DEBUG=false` und `composer install --no-dev`.
- Jeder Deploy läuft per Skript in fester Reihenfolge.
