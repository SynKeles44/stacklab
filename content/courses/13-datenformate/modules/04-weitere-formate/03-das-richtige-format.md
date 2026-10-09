---
title: Das richtige Format wählen
summary: Nach welchen Kriterien du ein Format auswählst, was beim Umwandeln verloren geht und wofür JSON Lines und Binärformate gut sind.
duration: 20
sources:
  - title: JSON Lines
    url: https://jsonlines.org/
  - title: jq Manual – Optionen --slurp und --compact-output
    url: https://jqlang.org/manual/v1.7/#invoking-jq
  - title: Protocol Buffers – Overview
    url: https://protobuf.dev/overview/
quiz:
  - type: single
    question: Ein Dienst schreibt pro Sekunde Hunderte Log-Einträge, die später mit jq durchsucht werden. Welches Format passt am besten?
    options:
      - Eine große JSON-Datei mit einem Array, das bei jedem Eintrag neu geschrieben wird
      - JSON Lines – ein JSON-Objekt pro Zeile, neue Einträge werden einfach angehängt
      - YAML mit einem Dokument pro Eintrag
      - CSV, weil es am kleinsten ist
    answer: 1
    explanation: Bei JSON Lines hängst du einfach eine Zeile an, ohne die Datei neu zu schreiben. Jede Zeile ist für sich gültiges JSON, und Werkzeuge können Zeile für Zeile lesen.
  - type: multiple
    question: Was geht verloren, wenn du eine kommentierte YAML-Konfiguration in JSON umwandelst und wieder zurück?
    options:
      - Die Kommentare
      - Anker und Aliase (die Werte werden ausgeschrieben)
      - Die Werte selbst
      - Die Formatierung, etwa der Block-Stil mit |
    answers: [0, 1, 3]
    explanation: Die Daten überleben die Umwandlung, alles Darüberhinausgehende nicht. JSON kennt weder Kommentare noch Anker, und beim Zurückschreiben entscheidet die Bibliothek selbst über die Schreibweise.
  - type: match
    question: Welches Format passt zu welcher Anforderung?
    pairs:
      - { left: "Menschen pflegen eine tief verschachtelte Pipeline", right: "YAML" }
      - { left: "Ein Frontend fragt Daten bei einer API ab", right: "JSON" }
      - { left: "Die Buchhaltung will Zahlen in ihrer Tabellenkalkulation", right: "CSV" }
      - { left: "Lokale Geheimnisse wie Datenbank-Passwörter", right: ".env" }
    explanation: Es gibt kein bestes Format, nur ein passendes – je nachdem, wer schreibt, wer liest und wie die Daten aufgebaut sind.
  - type: cloze
    text: "Mit `jq -___ '.[]' daten.json` machst du aus einem Array JSON Lines. Mit `jq -___ . daten.jsonl` liest jq alle Zeilen wieder in ein Array."
    blanks:
      - [c]
      - [s]
    explanation: -c gibt jedes Ergebnis kompakt in einer Zeile aus, -s (slurp) sammelt alle Eingaben in einem Array.
tasks:
  - id: json-lines
    type: terminal
    title: Logs als JSON Lines
    description: |
      Im Ordner `json-lines` liegt `events.json`: ein Array mit sechs Log-Einträgen eines Dienstes. Für ein
      Log-Werkzeug brauchst du die Daten als **JSON Lines** (ein Objekt pro Zeile).

      1. Erzeuge `events.jsonl` mit allen sechs Einträgen – jeder Eintrag kompakt in **einer** Zeile.
      2. Erzeuge aus `events.jsonl` die Datei `fehler.jsonl`, die nur die Zeilen mit `"level": "error"` enthält.
      3. Wandle `fehler.jsonl` zurück in ein normales JSON-Array und speichere es als `fehler.json`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: json-lines
    setup: |
      cat > events.json <<'JSON'
      [
        {"zeit": "2026-10-09T08:00:01Z", "level": "info", "nachricht": "Dienst gestartet"},
        {"zeit": "2026-10-09T08:00:05Z", "level": "info", "nachricht": "Verbindung zur Datenbank steht"},
        {"zeit": "2026-10-09T08:02:13Z", "level": "warn", "nachricht": "Antwortzeit über 500 ms"},
        {"zeit": "2026-10-09T08:03:40Z", "level": "error", "nachricht": "Zahlung abgelehnt", "auftrag": 1002},
        {"zeit": "2026-10-09T08:04:02Z", "level": "info", "nachricht": "Cache geleert"},
        {"zeit": "2026-10-09T08:05:59Z", "level": "error", "nachricht": "Zeitüberschreitung beim Mailversand"}
      ]
      JSON
    checks:
      - type: command
        run: wc -l < events.jsonl
        stdout_matches: "^\\s*6\\s*$"
        message: events.jsonl soll genau sechs Zeilen haben – eine pro Eintrag. Nutze jq -c '.[]'.
      - type: command
        run: jq -c 'select(type == "object") | .level' events.jsonl | wc -l
        stdout_matches: "^\\s*6\\s*$"
        message: Jede Zeile in events.jsonl soll ein vollständiges JSON-Objekt sein.
      - type: command
        run: grep -c '^{.*}$' events.jsonl
        stdout_matches: "^\\s*6\\s*$"
        message: Jedes Objekt soll kompakt in einer einzigen Zeile stehen, die mit { beginnt und mit } endet.
      - type: command
        run: jq -r '.nachricht' fehler.jsonl | tr '\n' '|'
        stdout_equals: Zahlung abgelehnt|Zeitüberschreitung beim Mailversand|
        message: fehler.jsonl soll genau die zwei Fehler-Einträge in ihrer ursprünglichen Reihenfolge enthalten, je einen pro Zeile.
      - type: command
        run: jq -r '[type, length, .[0].auftrag] | join(" ")' fehler.json
        stdout_equals: array 2 1002
        message: fehler.json soll ein JSON-Array mit den zwei Fehler-Einträgen sein. Tipp – jq -s . fehler.jsonl.
    hints:
      - "`jq -c '.[]' events.json > events.jsonl` zerlegt das Array und schreibt jedes Element kompakt in eine Zeile."
      - "jq liest eine JSONL-Datei automatisch Objekt für Objekt: `jq -c 'select(.level == \"error\")' events.jsonl > fehler.jsonl`."
      - "`jq -s . fehler.jsonl > fehler.json` sammelt alle Zeilen in einem Array."
    solution: |
      ```bash
      cd json-lines
      jq -c '.[]' events.json > events.jsonl
      jq -c 'select(.level == "error")' events.jsonl > fehler.jsonl
      jq -s . fehler.jsonl > fehler.json
      ```
  - id: format-fuer-anwendungsfall
    type: dragdrop
    title: Welches Format für welchen Fall?
    description: Ordne jeden Anwendungsfall dem Format zu, das am besten passt.
    targets:
      - { id: json, label: JSON }
      - { id: yaml, label: YAML }
      - { id: csv, label: CSV }
      - { id: jsonl, label: JSON Lines }
      - { id: env, label: .env }
      - { id: binaer, label: Binärformat (z. B. Protocol Buffers) }
    items:
      - { label: Antwort einer REST-API, target: json }
      - { label: package.json mit Abhängigkeiten, target: json }
      - { label: Docker-Compose-Konfiguration, target: yaml }
      - { label: GitHub-Actions-Pipeline, target: yaml }
      - { label: Export von 50.000 Bestellungen für die Buchhaltung, target: csv }
      - { label: Anwendungs-Logs zum Durchsuchen mit jq, target: jsonl }
      - { label: Lokales Datenbank-Passwort, target: env }
      - { label: Millionen Nachrichten pro Sekunde zwischen eigenen Diensten, target: binaer }
    hints:
      - Frage dich jeweils – wer schreibt die Daten, wer liest sie, und sind sie flach oder verschachtelt?
---
Du kennst jetzt JSON, YAML, CSV, XML, TOML, .env und INI. Bleibt die Frage, die dir im Projekt wirklich
gestellt wird: Welches Format nehme ich **hier**? Oft ist die Antwort durch Werkzeuge vorgegeben – aber wenn
du selbst entscheidest, helfen dir ein paar klare Kriterien.

## Die entscheidenden Fragen

Stell dir für jede neue Datei fünf Fragen:

| Frage | Wenn ja … |
|---|---|
| Schreiben und lesen vor allem **Menschen** die Datei? | YAML oder TOML, Kommentare sind Pflicht |
| Tauschen **Programme** die Daten aus, etwa über eine API? | JSON |
| Sind die Daten eine **flache Tabelle** mit gleichen Spalten? | CSV |
| Kommen **laufend neue Einträge** dazu, etwa Logs? | JSON Lines |
| Sind es **Geheimnisse** oder rechnerabhängige Werte? | .env (nicht im Repository!) |

Und die wichtigste Zusatzfrage: Was erwartet das **Werkzeug**? Docker Compose will YAML, npm will JSON,
PHP will INI für die `php.ini`. Gegen das Werkzeug zu arbeiten lohnt sich nie.

![Entscheidungsbaum für die Wahl eines Datenformats](/assets/datenformate/format-wahl.svg)

> [!MERKSATZ]
> Es gibt kein bestes Format. Entscheidend ist, **wer** die Daten schreibt, **wer** sie liest und **wie** sie
> aufgebaut sind.

## JSON Lines für Logs und Datenströme

Eine normale JSON-Datei hat einen Haken: Sie enthält genau **einen** Wert. Um einen Eintrag an ein Array
anzuhängen, musst du die ganze Datei neu schreiben. Für Logs mit Tausenden Einträgen ist das unbrauchbar.

[[json-lines|JSON Lines]] (auch NDJSON) löst das: ein vollständiges JSON-Objekt pro Zeile, keine Klammern
drumherum, keine Kommas dazwischen.

```text title="events.jsonl"
{"zeit":"2026-10-09T08:00:01Z","level":"info","nachricht":"Dienst gestartet"}
{"zeit":"2026-10-09T08:03:40Z","level":"error","nachricht":"Zahlung abgelehnt"}
```

Vorteile: Neue Einträge hängst du einfach an, Werkzeuge verarbeiten die Datei Zeile für Zeile, auch wenn sie
Gigabyte groß ist. jq liest JSON Lines direkt:

```bash title="Terminal"
jq -c '.[]' events.json > events.jsonl        # Array → JSON Lines
jq -c 'select(.level == "error")' events.jsonl # filtern
jq -s . events.jsonl > events.json            # JSON Lines → Array
```

## Umwandeln: Was dabei verloren geht

Zwischen Formaten umzuwandeln ist Alltag. Aber nicht jedes Format kann alles ausdrücken, was ein anderes
kann. Beim [[round-trip|Round-Trip]] – hin und wieder zurück – geht deshalb oft etwas verloren:

| Umwandlung | Was verloren geht |
|---|---|
| YAML → JSON | Kommentare, Anker und Aliase, Block-Stil |
| JSON → CSV | Verschachtelung, Typen (alles wird Text) |
| CSV → JSON | nichts – aber alle Werte sind erst einmal Strings |
| JSON → XML → JSON | Unterschied zwischen Attribut und Element, oft auch Typen |
| beliebig → .env | alles außer flachen Schlüssel-Wert-Paaren aus Strings |

> [!FEHLER]
> **Eine gepflegte YAML-Datei automatisch umschreiben lassen.** Liest ein Skript `compose.yaml` ein und
> schreibt sie wieder, sind alle Kommentare weg. Ändere Konfiguration, die Menschen pflegen, gezielt oder von
> Hand – und prüfe das Ergebnis mit `git diff`.

## Binärformate: wenn es schnell gehen muss

Textformate sind lesbar, aber groß und vergleichsweise langsam zu parsen. Tauschen eigene Dienste riesige
Datenmengen aus, nutzt man deshalb [[binaerformat|Binärformate]]:

- **Protocol Buffers** (Google): Die Struktur steht in einer Schema-Datei, die Daten sind kompakt und schnell.
  Wird zum Beispiel von gRPC genutzt.
- **MessagePack**: „JSON in binär“ – gleiches Datenmodell, aber kleiner.

Für den Einstieg brauchst du sie nicht. Merke dir nur: Sobald Menschen die Daten lesen oder debuggen müssen,
ist ein Textformat fast immer die bessere Wahl.

> [!PRAXIS]
> In Web-Projekten bleibt JSON das Standardformat für APIs – selbst große Plattformen wechseln erst zu
> Binärformaten, wenn messbar Leistung fehlt. Entscheide also nach Messung, nicht nach Gefühl.

## Zusammenfassung

- Wähle das Format danach, wer schreibt, wer liest und wie die Daten aufgebaut sind – und was das Werkzeug erwartet.
- Menschen pflegen YAML oder TOML, Programme tauschen JSON, Tabellen landen in CSV, Geheimnisse in `.env`.
- **JSON Lines** speichert ein Objekt pro Zeile – ideal für Logs; jq wandelt mit `-c` und `-s` hin und zurück.
- Beim Umwandeln gehen Kommentare, Typen oder Verschachtelung verloren – prüfe den Round-Trip.
- Binärformate wie Protocol Buffers lohnen sich erst bei großen Datenmengen zwischen eigenen Diensten.
