---
title: Logs lesen und schreiben
summary: Warum Logs in Produktion dein einziger Blick ins Programm sind, welche Log-Level es gibt, wie strukturierte Logs aussehen und wie du Logdateien mit tail, grep und jq durchsuchst.
duration: 25
sources:
  - title: PSR-3 – Logger Interface (Log-Level)
    url: https://www.php-fig.org/psr/psr-3/
  - title: Laravel – Logging
    url: https://laravel.com/docs/13.x/logging
  - title: GNU Coreutils – tail
    url: https://www.gnu.org/software/coreutils/manual/html_node/tail-invocation.html
  - title: jq Manual
    url: https://jqlang.org/manual/
quiz:
  - type: single
    question: Ein Zahlungsdienst antwortet nicht, die Bestellung schlägt fehl, das Programm läuft aber weiter. Welches Log-Level passt?
    options:
      - debug
      - info
      - error
      - emergency
    answer: 2
    explanation: >
      Eine konkrete Aktion ist fehlgeschlagen – das ist `error`. `emergency` reservierst du für „das ganze System ist
      unbenutzbar“.
  - type: multiple
    question: Was gehört **nicht** in eine Logdatei?
    options:
      - Passwörter und vollständige Kreditkartennummern
      - Die Request-ID einer Anfrage
      - API-Tokens aus dem Authorization-Header
      - Die Dauer einer Datenbankabfrage in Millisekunden
    answers: [0, 2]
    explanation: >
      Logs werden oft lange aufbewahrt und von vielen gelesen. Geheimnisse und sensible persönliche Daten haben
      dort nichts zu suchen. IDs und Messwerte sind dagegen genau das, was beim Debuggen hilft.
  - type: cloze
    text: Mit `tail ___ storage/logs/laravel.log` folgst du einer Logdatei live. Mit `grep ___ ERROR app.log` zählst du die Treffer, statt sie anzuzeigen.
    blanks:
      - [-f, -F]
      - [-c]
    explanation: >
      `tail -f` zeigt neue Zeilen, sobald sie geschrieben werden (Abbruch mit Strg+C). `grep -c` gibt nur die
      Anzahl passender Zeilen aus.
  - type: match
    question: Ordne jedem Befehl seine Wirkung zu.
    pairs:
      - { left: "tail -n 50 app.log", right: "Die letzten 50 Zeilen anzeigen" }
      - { left: "grep -i timeout app.log", right: "Zeilen mit „timeout“ finden, Groß-/Kleinschreibung egal" }
      - { left: "grep -v DEBUG app.log", right: "Alle Zeilen außer denen mit DEBUG" }
      - { left: "jq 'select(.level == \"error\")' app.jsonl", right: "Nur JSON-Logzeilen mit Level error" }
    explanation: >
      Diese vier Befehle decken einen Großteil der täglichen Log-Analyse ab.
tasks:
  - id: log-level-zuordnen
    type: dragdrop
    title: Das passende Log-Level wählen
    description: Ordne jede Situation dem Log-Level zu, das du dafür verwenden würdest.
    targets:
      - { id: debug, label: debug }
      - { id: info, label: info }
      - { id: warning, label: warning }
      - { id: error, label: error }
      - { id: critical, label: critical }
    items:
      - { label: "SQL-Abfrage mit allen Parametern, nur zur Fehlersuche", target: debug }
      - { label: "Nutzerin hat sich erfolgreich angemeldet", target: info }
      - { label: "Täglicher Export gestartet", target: info }
      - { label: "API-Antwort dauerte 4 Sekunden statt 200 ms", target: warning }
      - { label: "Veraltete Konfigurationsoption wird noch benutzt", target: warning }
      - { label: "E-Mail konnte nach drei Versuchen nicht versendet werden", target: error }
      - { label: "Datenbank ist komplett nicht erreichbar", target: critical }
    hints:
      - "Frag dich: Muss jemand etwas tun? Nein → info oder debug. Ja, aber nicht sofort → warning. Eine Aktion ist gescheitert → error."
  - id: logdatei-auswerten
    type: terminal
    title: Eine Logdatei auswerten
    description: |
      Im Ordner `logs-lesen` liegt `app.log` – das Protokoll eines Online-Shops mit gut 120 Zeilen. Jede Zeile
      enthält Zeitstempel, Level, Request-ID in eckigen Klammern und eine Nachricht.

      1. Verschaffe dir mit `head` und `tail -n 20 app.log` einen Überblick über das Format.
      2. Zähle die Zeilen mit dem Level `ERROR` und schreibe **nur die Zahl** in `anzahl-errors.txt`.
      3. Die Supportabteilung meldet ein Problem mit der Anfrage `req-1042`. Schreibe **alle** Zeilen dieser
         Anfrage – in der Reihenfolge aus der Logdatei – in die Datei `req-1042.log`.
      4. Ein Endpunkt antwortet immer wieder mit Status `500`. Finde heraus, welcher, und schreibe seinen Pfad
         (zum Beispiel `/produkte`) in `endpunkt.txt`.

      Klicke zuerst auf **Aufgabe vorbereiten**, damit die Logdatei angelegt wird.
    workdir: logs-lesen
    setup: |
      for i in $(seq 1 120); do
        id=$((1000 + i))
        sek=$(printf '%02d' $((i % 60)))
        min=$(printf '%02d' $((i / 60)))
        zeit="2026-10-09T08:${min}:${sek}Z"
        if [ $((i % 17)) -eq 0 ]; then
          echo "$zeit ERROR [req-$id] POST /warenkorb 500 Datenbank-Timeout nach 5000 ms"
        elif [ $((i % 11)) -eq 0 ]; then
          echo "$zeit WARN  [req-$id] GET /produkte 200 langsame Antwort 1800 ms"
        elif [ $((i % 7)) -eq 0 ]; then
          echo "$zeit DEBUG [req-$id] Cache-Treffer produkte:liste"
        else
          echo "$zeit INFO  [req-$id] GET /produkte 200 34 ms"
        fi
        if [ "$i" = "42" ]; then
          echo "$zeit INFO  [req-$id] Warenkorb geladen mit 3 Artikeln"
          echo "$zeit ERROR [req-$id] Zahlungsdienst antwortet nicht"
          echo "$zeit INFO  [req-$id] Antwort 502 an Client gesendet"
        fi
      done > app.log
    checks:
      - type: command
        run: test "$(tr -d '[:space:]' < anzahl-errors.txt)" = "$(grep -c ' ERROR ' app.log)"
        message: In anzahl-errors.txt gehört nur die Anzahl der ERROR-Zeilen. `grep -c ' ERROR ' app.log` zählt sie.
      - type: command
        run: grep 'req-1042' app.log | diff -q - req-1042.log
        message: req-1042.log soll genau alle Zeilen mit req-1042 aus app.log enthalten. Nutze `grep 'req-1042' app.log > req-1042.log`.
      - type: command
        run: cat endpunkt.txt
        stdout_matches: "^\\s*/warenkorb\\s*$"
        message: In endpunkt.txt gehört der Pfad des Endpunkts, der mit 500 antwortet. Suche mit `grep ' 500 ' app.log`.
    hints:
      - "`grep` findet Zeilen mit einem Muster, `> datei` schreibt die Ausgabe in eine Datei."
      - "Achte bei ERROR auf die Leerzeichen: `grep -c ' ERROR ' app.log > anzahl-errors.txt` zählt nur das Level, nicht Wörter in Nachrichten."
      - "`grep 'req-1042' app.log > req-1042.log` und `grep ' 500 ' app.log | head` – in jeder Zeile steht derselbe Pfad."
    solution: |
      ```bash
      cd logs-lesen
      head -n 5 app.log
      tail -n 20 app.log
      grep -c ' ERROR ' app.log > anzahl-errors.txt     # 8
      grep 'req-1042' app.log > req-1042.log            # 4 Zeilen, darunter der Zahlungsfehler
      grep ' 500 ' app.log | head -n 3                  # POST /warenkorb 500 Datenbank-Timeout …
      echo /warenkorb > endpunkt.txt
      ```
---
Im Browser oder auf deinem Laptop kannst du einen Debugger anschließen. Auf einem Server in Produktion geht das
nicht: Dort laufen tausende Anfragen gleichzeitig, und niemand darf das Programm anhalten. Wenn nachts um drei
eine Bestellung fehlschlägt, ist die [[logdatei|Logdatei]] dein einziger Zeuge. Ob du den Fehler findest, hängt
davon ab, **was** das Programm damals aufgeschrieben hat.

## Log-Level: wie wichtig ist eine Meldung?

Jede Logzeile hat ein [[log-level|Log-Level]]. Es sagt, wie dringend die Meldung ist. PHP-Bibliotheken nach dem
Standard PSR-3 – und damit auch Laravel – kennen acht Stufen; die fünf wichtigsten:

![Log-Level von DEBUG bis CRITICAL mit einer Schwelle bei WARNING](/assets/debugging-devtools/log-level.svg)

| Level | Wann | Beispiel |
|---|---|---|
| `debug` | Details nur für die Fehlersuche | „SQL: select … where id = 42“ |
| `info` | normale, interessante Ereignisse | „Nutzer 42 hat sich angemeldet“ |
| `warning` | ungewöhnlich, aber es läuft weiter | „API-Antwort dauerte 4 s“ |
| `error` | eine Aktion ist fehlgeschlagen | „Zahlung für Bestellung 7 abgelehnt“ |
| `critical` | ein wichtiger Teil des Systems fällt aus | „Datenbank nicht erreichbar“ |

Darüber gibt es noch `notice`, `alert` und `emergency`. Über eine **Schwelle** stellst du ein, ab welchem Level
geschrieben wird: In der Entwicklung oft `debug`, in Produktion meist `info` oder `warning`. Alles darunter
wird verworfen.

> [!MERKSATZ]
> Ein Log-Level beschreibt, **wer handeln muss**: debug und info – niemand. warning – jemand sollte es sich
> ansehen. error und höher – etwas ist kaputt.

## Gute Logzeilen schreiben

Eine Logzeile muss für sich allein verständlich sein, denn du liest sie Wochen später ohne Zusammenhang.
Sie beantwortet: **Was** ist passiert, **wem**, **womit**?

```text title="Schlecht vs. gut"
ERROR Fehler!
ERROR [req-1042] Zahlung fehlgeschlagen bestellung_id=7 anbieter=karte status=402 dauer_ms=812
```

Die [[request-id|Request-ID]] (`req-1042`) ist besonders wertvoll: Jede Anfrage bekommt beim Eintreffen eine
eindeutige ID, und **alle** Logzeilen dieser Anfrage tragen sie. So filterst du aus tausenden Zeilen genau die
heraus, die zu einer Beschwerde gehören.

> [!FEHLER]
> **Geheimnisse loggen.** `Log::debug('Login', $request->all())` schreibt auch das Passwort in die Logdatei.
> Logs werden lange aufbewahrt, kopiert und von vielen gelesen. Passwörter, Tokens und vollständige
> Zahlungsdaten gehören **nie** hinein – logge IDs statt Inhalten.

## Strukturierte Logs

Text-Logs sind gut für Menschen, aber schwer für Maschinen. Beim [[strukturiertes-logging|strukturierten Logging]]
ist jede Zeile ein [[json|JSON]]-Objekt mit festen Feldern:

```json title="app.jsonl – eine Zeile pro Ereignis"
{"zeit":"2026-10-09T08:00:42Z","level":"error","request_id":"req-1042","nachricht":"Zahlung fehlgeschlagen","bestellung_id":7}
```

Solche Logs kannst du gezielt abfragen, zum Beispiel mit [[jq]]:

```bash title="Terminal"
jq -c 'select(.level == "error")' app.jsonl
jq -r 'select(.request_id == "req-1042") | .nachricht' app.jsonl
```

Log-Plattformen wie Grafana Loki oder Elasticsearch lesen genau dieses Format und bieten Suche und Diagramme
darüber. In Laravel schreibst du Kontext als zweites Argument: `Log::error('Zahlung fehlgeschlagen',
['bestellung_id' => 7]);`. Wohin die Meldung in einer [[laravel|Laravel]]-Anwendung geht, bestimmen [[log-channel|Log-Kanäle]] in
`config/logging.php` – etwa `single` (eine Datei), `daily` (eine Datei pro Tag) oder `stderr` für Container.
Standard ist `storage/logs/laravel.log`. Mehr dazu in der [Laravel-Dokumentation](https://laravel.com/docs/13.x/logging).

## Logdateien im Terminal lesen

Für die Analyse brauchst du nur eine Handvoll Befehle:

| Befehl | Wirkung |
|---|---|
| `tail -n 100 app.log` | die letzten 100 Zeilen |
| `tail -f app.log` | live mitlesen, neue Zeilen erscheinen sofort (Strg+C beendet) |
| `grep ' ERROR ' app.log` | nur Fehlerzeilen |
| `grep -c ' ERROR ' app.log` | Anzahl der Fehlerzeilen |
| `grep -i 'timeout' app.log` | ohne Beachtung der Groß-/Kleinschreibung |
| `grep -v DEBUG app.log` | alles außer DEBUG |
| `grep -A 3 'Exception' app.log` | Treffer plus die 3 Zeilen danach (z. B. Stack Trace) |

Kombiniert mit einer [[pipe|Pipe]] werden sie mächtig: `tail -f app.log | grep --line-buffered ERROR` zeigt
live nur neue Fehler. Den Befehl [[tail]] kennst du damit schon fast vollständig.

> [!PRAXIS]
> Ein bewährter Ablauf bei „Kunde meldet Fehler um 14:05“: Erst die Zeilen rund um diese Uhrzeit suchen, dann
> die Request-ID der fehlerhaften Anfrage notieren, dann mit `grep req-…` die komplette Geschichte dieser einen
> Anfrage lesen. Die Ursache steht oft ein paar Zeilen **vor** dem eigentlichen ERROR.

## Zusammenfassung

- In Produktion sind Logs oft die einzige Informationsquelle – was nicht geloggt wird, ist verloren.
- Log-Level von debug bis critical sagen, wie dringend eine Meldung ist; eine Schwelle filtert.
- Gute Logzeilen enthalten Kontext wie IDs und Messwerte – aber nie Passwörter oder Tokens.
- Eine Request-ID verbindet alle Zeilen einer Anfrage.
- Strukturierte Logs (JSON pro Zeile) lassen sich mit `jq` und Log-Plattformen gezielt abfragen.
- `tail -f`, `grep`, `grep -c`, `grep -v` und `grep -A` sind dein Werkzeugkasten für Logdateien.
