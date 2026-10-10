---
title: Migrationen, Queues und die Deployment-Checkliste
summary: Datenbankänderungen abwärtskompatibel in Expand- und Contract-Schritten ausliefern, Queue-Worker sauber neu starten und Deployments mit Smoke-Test und Checkliste absichern.
duration: 25
sources:
  - title: Laravel Docs – Migrations
    url: https://laravel.com/docs/13.x/migrations
  - title: Laravel Docs – Queues, Queue Workers and Deployment
    url: https://laravel.com/docs/13.x/queues#queue-workers-and-deployment
  - title: Laravel Docs – Configuration, Maintenance Mode
    url: https://laravel.com/docs/13.x/configuration#maintenance-mode
  - title: Martin Fowler – Parallel Change
    url: https://martinfowler.com/bliki/ParallelChange.html
quiz:
  - type: single
    question: "Die Spalte `name` soll in `full_name` umbenannt werden. Warum ist `renameColumn` in einer einzigen Migration bei einem Zero-Downtime-Deployment gefährlich?"
    options:
      - renameColumn funktioniert in Laravel nicht.
      - Das alte Release läuft nach der Migration noch kurz weiter und fragt die Spalte name ab, die es nicht mehr gibt.
      - Umbenennen löscht alle Daten der Spalte.
      - Migrationen dürfen nie in Produktion laufen.
    answer: 1
    explanation: >
      Migrationen laufen vor dem Umschalten, während das alte Release noch Requests bedient. Jede Änderung muss
      deshalb mit altem **und** neuem Code funktionieren.
  - type: multiple
    question: Welche Migrationen sind ohne Weiteres abwärtskompatibel?
    options:
      - Eine neue Tabelle anlegen
      - Eine neue Spalte, die nullable ist oder einen Default hat
      - Eine Spalte löschen, die der aktuelle Code noch liest
      - Einen Index hinzufügen
    answers: [0, 1, 3]
    explanation: >
      Hinzufügen ist fast immer sicher. Löschen oder Umbenennen gehört in einen späteren Contract-Schritt, wenn
      kein laufender Code die Spalte mehr nutzt. Große Tabellen brauchen auch beim Index Vorsicht wegen Sperren.
  - type: cloze
    text: "Nach dem Umschalten beendet `php artisan queue:___` alle Worker, sobald ihr aktueller Job fertig ist. Mit Horizon nutzt du `php artisan horizon:___`."
    blanks:
      - [restart]
      - [terminate]
    explanation: >
      Worker sind langlebige Prozesse und haben den alten Code im Speicher. Supervisor startet sie danach mit dem
      neuen Release neu.
  - type: match
    question: Ordne jede Phase der Expand/Contract-Methode ihrem Inhalt zu.
    pairs:
      - { left: "Expand", right: "neue Spalte full_name hinzufügen, nullable" }
      - { left: "Migrate", right: "Code schreibt beide Spalten, Daten werden kopiert" }
      - { left: "Switch", right: "Code liest nur noch full_name" }
      - { left: "Contract", right: "Spalte name in einem späteren Release löschen" }
    explanation: Jede Phase ist ein eigenes Deployment, und jedes ist mit dem vorigen Release verträglich.
tasks:
  - id: deploy-reihenfolge
    type: order
    title: Die Reihenfolge eines Laravel-Deployments
    description: >
      Bring die Schritte eines Zero-Downtime-Deployments mit Release-Ordnern in die richtige Reihenfolge.
    items:
      - Artefakt hochladen und Prüfsumme kontrollieren
      - In einen neuen Release-Ordner entpacken und .env und storage verlinken
      - Caches bauen (php artisan optimize)
      - Abwärtskompatible Migrationen ausführen (php artisan migrate --force)
      - current atomar auf das neue Release umschalten
      - PHP-FPM neu laden und php artisan queue:restart ausführen
      - Smoke-Test gegen /up und eine wichtige Seite
      - Alte Releases aufräumen
    hints:
      - Alles, was vorbereitet werden kann, passiert vor dem Umschalten. Aufgeräumt wird erst, wenn klar ist, dass alles läuft.
  - id: deploy-ssh
    type: simulated
    title: Ein Deployment auf dem Server begleiten
    description: |
      Das neue Release liegt fertig vorbereitet in `/var/www/shop/releases/20261010-1200`. Melde dich als
      `deploy` auf `203.0.113.10` an und führe die letzten Schritte aus:

      1. Per SSH anmelden.
      2. Im neuen Release-Ordner die Migrationen für Produktion ausführen.
      3. `current` atomar umschalten (Hilfslink `current.tmp` im Ordner `/var/www/shop`, dann `mv -T`).
      4. Die Queue-Worker neu starten (im Ordner `/var/www/shop/current`).
      5. Mit `curl -fsS https://shop.example.com/up` einen Smoke-Test machen.
    prompt: "du@laptop:~$"
    steps:
      - expect: "^ssh\\s+deploy@203\\.0\\.113\\.10\\s*$"
        output: "Welcome to Ubuntu 24.04 LTS"
        prompt: "deploy@web-1:~$"
        hint: "`ssh deploy@203.0.113.10`"
      - expect: "^cd\\s+/var/www/shop/releases/20261010-1200/?\\s*&&\\s*php\\s+artisan\\s+migrate\\s+--force\\s*$"
        output: |
          INFO  Running migrations.

          2026_10_10_090000_add_full_name_to_customers_table ........ 18.42ms DONE
        prompt: "deploy@web-1:/var/www/shop/releases/20261010-1200$"
        hint: "In Produktion fragt Laravel vor dem Migrieren nach – `--force` bestätigt das: `cd /var/www/shop/releases/20261010-1200 && php artisan migrate --force`."
      - expect: "^cd\\s+/var/www/shop/?\\s*&&\\s*ln\\s+-sfn\\s+(\\./)?releases/20261010-1200/?\\s+current\\.tmp\\s*&&\\s*mv\\s+-T\\s+current\\.tmp\\s+current\\s*$"
        output: ""
        prompt: "deploy@web-1:/var/www/shop$"
        hint: "`cd /var/www/shop && ln -sfn releases/20261010-1200 current.tmp && mv -T current.tmp current`"
      - expect: "^cd\\s+/var/www/shop/current/?\\s*&&\\s*php\\s+artisan\\s+queue:restart\\s*$"
        output: |
          INFO  Broadcasting queue restart signal.
        prompt: "deploy@web-1:/var/www/shop/current$"
        hint: "`cd /var/www/shop/current && php artisan queue:restart`"
      - expect: "^curl\\s+-fsS\\s+https://shop\\.example\\.com/up\\s*$"
        output: |
          <!DOCTYPE html><html><head><title>Shop</title></head><body>Application up</body></html>
        hint: "`curl -fsS https://shop.example.com/up` – `-f` lässt curl bei einem Fehler-Statuscode scheitern."
    responses:
      - match: "^readlink\\s+(-f\\s+)?/var/www/shop/current"
        output: "/var/www/shop/releases/20261010-1200"
      - match: "^ls"
        output: "current  releases  shared"
---

Das neue Release liegt fertig im eigenen Ordner, der Symlink-Wechsel ist atomar – fertig? Leider nicht.
Zwei Dinge teilen sich alte und neue Version immer: die **Datenbank** und die **Queue**. Wer sie vergisst,
hat trotz perfektem Symlink Ausfälle. Dazu kommt die Frage, woran du merkst, dass das Deployment wirklich
geklappt hat.

## Migrationen laufen, während der alte Code läuft

Beim Deployment führst du [[migration|Migrationen]] mit `php artisan migrate --force` aus – **vor** dem
Umschalten, damit der neue Code sofort das passende Schema vorfindet. Bis zum Wechsel bedient aber das alte
Release die Nutzer. Bei Rolling- oder Blue-Green-Deployments laufen beide Versionen sogar minutenlang parallel.

Daraus folgt die wichtigste Regel dieser Lektion: Jede Migration muss mit dem **alten und dem neuen** Code
funktionieren.

| Änderung | sicher? |
|---|---|
| neue Tabelle | ja |
| neue Spalte, nullable oder mit Default | ja |
| Spalte umbenennen | nein – alter Code findet sie nicht mehr |
| Spalte löschen, die der alte Code liest | nein |
| Spalte auf `NOT NULL` ohne Default | nein – alter Code schreibt sie nicht |

> [!MERKSATZ]
> Erst erweitern, dann umstellen, ganz zum Schluss aufräumen – jeweils in einem eigenen Deployment.

## Expand und Contract

Unsichere Änderungen zerlegst du mit [[expand-contract|Expand/Contract]] in mehrere Deployments. Beispiel:
`name` soll `full_name` heißen.

1. **Expand:** Migration fügt `full_name` als nullable Spalte hinzu. Der Code schreibt ab jetzt beide Spalten.
2. **Migrate:** Ein Job oder Befehl kopiert bestehende Daten von `name` nach `full_name`.
3. **Switch:** Der Code liest und schreibt nur noch `full_name`.
4. **Contract:** In einem späteren Release löscht eine Migration `name`.

```php title="Expand: neue Spalte, abwärtskompatibel"
Schema::table('customers', function (Blueprint $table) {
    $table->string('full_name')->nullable()->after('name');
});
```

> [!FEHLER]
> **Auf `down()` als Rollback vertrauen.** Ein Code-Rollback ist ein Symlink-Wechsel, ein Daten-Rollback nicht:
> Eine `down()`-Migration, die eine Spalte löscht, vernichtet Daten, die seit dem Deployment geschrieben
> wurden. Mit Expand/Contract bleibt das Schema mit dem vorigen Release verträglich – du musst es gar nicht
> zurückdrehen.

## Queue-Worker neu starten

[[queue-worker|Queue-Worker]] sind langlebige Prozesse. Sie haben den Code geladen, der beim Start aktuell
war – nach dem Symlink-Wechsel arbeiten sie mit dem **alten** Release weiter. Deshalb gehört nach jedem
Umschalten dazu:

```bash title="Worker sauber neu starten"
php artisan queue:restart
```

Der Befehl setzt ein Signal im Cache. Jeder Worker beendet seinen aktuellen Job und stoppt dann – ein
[[graceful-shutdown|Graceful Shutdown]]. Ein Prozessmanager wie [[supervisor|Supervisor]] startet ihn sofort
neu, jetzt mit dem neuen Code. Mit Laravel Horizon nutzt du `php artisan horizon:terminate`.

Weil Jobs in der Queue warten können, während das Deployment läuft, gilt auch hier Abwärtskompatibilität:
Ein Job, den das alte Release eingereiht hat, muss vom neuen verarbeitet werden können.

## Wartungsmodus nur im Notfall

`php artisan down` zeigt allen Nutzern eine Wartungsseite. Bei Zero-Downtime-Deployments brauchst du ihn
nicht. Für die seltenen Fälle, in denen eine Änderung wirklich nicht abwärtskompatibel geht, gibt es den
[[wartungsmodus|Wartungsmodus]] mit `--secret`: Wer die geheime URL kennt, kann die App trotzdem prüfen.

## Smoke-Test und Checkliste

Nach dem Umschalten prüft ein [[smoke-test|Smoke-Test]] in Sekunden die wichtigsten Dinge – etwa
`curl -fsS https://shop.example.com/up` und eine Produktseite. Schlägt er fehl, folgt sofort der Rollback.

Eine [[deployment-checkliste|Deployment-Checkliste]] macht daraus eine Routine:

| Vorher | Nachher |
|---|---|
| CI grün, Artefakt mit Prüfsumme | Smoke-Test grün |
| Migrationen abwärtskompatibel | Fehlerquote und Antwortzeit im Monitoring normal |
| Neue Konfiguration auf allen Servern | Queue-Worker laufen mit neuem Code |
| Rollback-Weg bekannt | alte Releases aufgeräumt, letzte drei behalten |

> [!PRAXIS]
> Die Checkliste lebt am besten in der Pipeline selbst: Jeder Punkt, den eine Maschine prüfen kann, wird ein
> Schritt im Workflow. Für Menschen bleibt nur, was wirklich Urteilsvermögen braucht – etwa die Freigabe.

## Zusammenfassung

- Migrationen laufen, während das alte Release noch Requests bedient – sie müssen zu beiden passen.
- Unsichere Änderungen zerlegst du mit **Expand/Contract** in mehrere Deployments.
- `down()`-Migrationen sind kein verlässlicher Rollback; Abwärtskompatibilität ist es.
- Nach dem Umschalten: `php artisan queue:restart` (oder `horizon:terminate`), Supervisor startet neu.
- **Smoke-Test** und **Checkliste** machen jedes Deployment überprüfbar und wiederholbar.
