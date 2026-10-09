---
title: JSON im Terminal mit jq
summary: Mit jq liest, filterst, zählst und formst du JSON direkt im Terminal – ohne ein einziges Skript zu schreiben.
duration: 25
sources:
  - title: jq Manual (Version 1.7)
    url: https://jqlang.org/manual/v1.7/
  - title: jq Tutorial
    url: https://jqlang.org/tutorial/
quiz:
  - type: match
    question: "Ordne jedem Filter sein Ergebnis zu. Eingabe: `{\"user\": {\"name\": \"Ada\", \"skills\": [\"php\", \"sql\"]}}`"
    pairs:
      - { left: ".user.name", right: "\"Ada\"" }
      - { left: ".user.skills[1]", right: "\"sql\"" }
      - { left: ".user.skills | length", right: "2" }
      - { left: ".user | keys", right: "[\"name\", \"skills\"]" }
    explanation: Ein Punkt mit Namen greift auf einen Schlüssel zu, [n] auf ein Array-Element, und mit | reichst du das Ergebnis an den nächsten Filter weiter.
  - type: single
    question: Du willst Namen ohne Anführungszeichen ausgeben, um sie an ein anderes Kommando weiterzureichen. Welche Option brauchst du?
    options:
      - "-c"
      - "-r"
      - "-s"
      - "-n"
    answer: 1
    explanation: "-r (raw output) gibt Strings ohne Anführungszeichen aus. -c macht kompakte Ein-Zeilen-Ausgabe, -s liest alle Eingaben in ein Array, -n startet ohne Eingabe."
  - type: cloze
    text: "`jq '.[] | ___(.aktiv)' users.json` gibt nur aktive Nutzer aus. `jq '___(.name)' users.json` macht aus dem Array von Nutzern ein Array von Namen."
    blanks:
      - [select]
      - [map]
    explanation: select(bedingung) lässt einen Wert nur durch, wenn die Bedingung wahr ist. map(f) wendet f auf jedes Element eines Arrays an und liefert wieder ein Array.
  - type: find-bug
    question: Der Befehl soll die E-Mail-Adressen aller Admins ausgeben, liefert aber die Adressen aller Nutzer. In welcher Zeile steckt der Fehler?
    language: bash
    code: |
      jq -r '
        .[]
        | select(.rolle = "admin")
        | .email
      ' users.json
    bug_line: 3
    explanation: "Ein einzelnes = ist in jq eine Zuweisung: Es setzt bei jedem Nutzer die Rolle auf admin, und das Ergebnis ist immer wahr. Für den Vergleich brauchst du ==, also select(.rolle == \"admin\")."
tasks:
  - id: nutzer-auswerten
    type: terminal
    title: Nutzerdaten mit jq auswerten
    description: |
      Im Ordner `jq-nutzer` liegt `users.json` mit fünf Nutzern. Jeder hat `name`, `email`, `rolle`
      (`admin` oder `user`), `aktiv` (Boolean) und `logins` (Zahl).

      1. Schau dir die Datei mit `jq . users.json` an.
      2. Schreibe die **Anzahl** der aktiven Nutzer als Zahl in `anzahl.txt`.
      3. Schreibe die **Namen** aller Admins ohne Anführungszeichen, einen pro Zeile, in `admins.txt`.
      4. Erzeuge `kontakte.json`: ein Array aller **aktiven** Nutzer, nach Namen sortiert, und jedes Element
         enthält **nur** die Felder `name` und `email`.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: jq-nutzer
    setup: |
      cat > users.json <<'JSON'
      [
        {"id": 1, "name": "Ada", "email": "ada@example.com", "rolle": "admin", "aktiv": true, "logins": 42},
        {"id": 2, "name": "Linus", "email": "linus@example.com", "rolle": "user", "aktiv": false, "logins": 3},
        {"id": 3, "name": "Grace", "email": "grace@example.com", "rolle": "admin", "aktiv": true, "logins": 17},
        {"id": 4, "name": "Alan", "email": "alan@example.com", "rolle": "user", "aktiv": true, "logins": 8},
        {"id": 5, "name": "Margaret", "email": "margaret@example.com", "rolle": "user", "aktiv": true, "logins": 0}
      ]
      JSON
    checks:
      - type: command
        run: tr -d '[:space:]' < anzahl.txt
        stdout_equals: "4"
        message: anzahl.txt soll nur die Zahl der aktiven Nutzer enthalten (4). Tipp – map(select(.aktiv)) | length.
      - type: command
        run: cat admins.txt | tr '\n' ' '
        stdout_matches: "^Ada Grace\\s*$"
        message: admins.txt soll die Namen Ada und Grace enthalten – je einer pro Zeile und ohne Anführungszeichen (Option -r).
      - type: command
        run: jq -r 'map(.name) | join(",")' kontakte.json
        stdout_equals: Ada,Alan,Grace,Margaret
        message: kontakte.json soll die vier aktiven Nutzer enthalten, alphabetisch nach Namen sortiert (sort_by(.name)).
      - type: command
        run: jq -c 'map(keys)' kontakte.json
        stdout_equals: '[["email","name"],["email","name"],["email","name"],["email","name"]]'
        message: Jedes Element in kontakte.json soll genau die zwei Felder name und email haben – baue es mit {name, email}.
    hints:
      - "Fang klein an: `jq '.[0]' users.json`, dann `jq '.[] | .name' users.json`. Mit `> datei` leitest du die Ausgabe um."
      - "Zählen: `jq 'map(select(.aktiv)) | length' users.json > anzahl.txt`. Für die Admins brauchst du `-r` und `.[] | select(...) | .name`."
      - "Für die Kontakte: `map(select(.aktiv) | {name, email}) | sort_by(.name)`."
    solution: |
      ```bash
      cd jq-nutzer
      jq 'map(select(.aktiv)) | length' users.json > anzahl.txt
      jq -r '.[] | select(.rolle == "admin") | .name' users.json > admins.txt
      jq 'map(select(.aktiv) | {name, email}) | sort_by(.name)' users.json > kontakte.json
      ```
  - id: filter-zuordnen
    type: dragdrop
    title: Welcher Filter wofür?
    description: Ordne jeden jq-Filter der Aufgabe zu, die er erledigt. Die Eingabe ist immer ein Array von Nutzer-Objekten.
    targets:
      - { id: zaehlen, label: Wie viele Nutzer gibt es? }
      - { id: filtern, label: Nur Nutzer mit mehr als 10 Logins }
      - { id: umformen, label: Nur Name und Rolle behalten }
      - { id: sortieren, label: Nach Logins absteigend ordnen }
      - { id: gruppieren, label: Nutzer je Rolle zusammenfassen }
    items:
      - { label: "length", target: zaehlen }
      - { label: "map(select(.logins > 10))", target: filtern }
      - { label: "map({name, rolle})", target: umformen }
      - { label: "sort_by(.logins) | reverse", target: sortieren }
      - { label: "group_by(.rolle)", target: gruppieren }
    hints:
      - sort_by sortiert aufsteigend – reverse dreht die Reihenfolge um.
---
Eine API liefert 3000 Zeilen JSON, und du suchst darin einen einzigen Wert. Im Editor scrollst du ewig, ein
Skript dafür zu schreiben dauert zu lange. Genau dafür gibt es [[jq]]: ein kleines Kommandozeilenwerkzeug,
das JSON liest, filtert und umformt – oft in einer einzigen Zeile.

## Der erste Filter: der Punkt

jq bekommt einen **Filter** und eine Eingabe. Der einfachste Filter ist `.` – er gibt die Eingabe
unverändert, aber schön formatiert und farbig wieder aus:

```bash title="Terminal"
jq . users.json            # Datei lesen
cat users.json | jq .      # oder über eine Pipe
```

Damit hast du schon zwei Dinge gewonnen: lesbares JSON und eine Syntaxprüfung. Ist die Datei kaputt, meldet
jq Zeile und Spalte.

Den Filter setzt du fast immer in **einfache** Anführungszeichen. So interpretiert die [[shell|Shell]] keine
Sonderzeichen wie `|`, `$` oder `"` darin.

> [!MERKSATZ]
> `jq '<filter>' datei.json` – der Filter beschreibt, welchen Teil der Daten du haben willst.

## Werte herauspicken

Mit einem Punkt und einem Namen greifst du auf Schlüssel zu, mit eckigen Klammern auf Array-Elemente:

| Filter | Bedeutung | Ergebnis bei `{"user": {"name": "Ada", "skills": ["php", "sql"]}}` |
|---|---|---|
| `.user` | Schlüssel `user` | das innere Objekt |
| `.user.name` | verschachtelt | `"Ada"` |
| `.user.skills[0]` | erstes Element | `"php"` |
| `.user.skills[]` | **jedes** Element einzeln | `"php"` und `"sql"` |
| `.user.alter` | fehlender Schlüssel | `null` |

Wichtig ist `[]` ohne Zahl: Es zerlegt ein Array in einzelne Werte. Ein Array mit 100 Nutzern wird so zu
100 einzelnen Ausgaben, die du weiterverarbeiten kannst.

Fehlt ein Schlüssel, liefert jq `null` statt eines Fehlers. Mit dem Operator `//` setzt du dann einen
Ersatzwert: `.alter // "unbekannt"` gibt `"unbekannt"` aus, wenn `alter` fehlt oder `null` ist. Das ist
praktisch, weil echte API-Daten selten vollständig sind.

## Filter verketten mit der Pipe

Wie in der Shell reicht `|` das Ergebnis eines Filters an den nächsten weiter. Dazu kommen ein paar
eingebaute Funktionen:

```bash title="Terminal"
jq '.[] | .name' users.json                       # jeden Namen ausgeben
jq '.[] | select(.aktiv) | .email' users.json     # nur aktive Nutzer
jq 'map(.name)' users.json                        # Array der Namen
jq 'map(select(.logins > 10)) | length' users.json  # zählen
```

| Funktion | Wirkung |
|---|---|
| `select(bedingung)` | lässt einen Wert nur durch, wenn die Bedingung wahr ist |
| `map(f)` | wendet `f` auf jedes Element an, Ergebnis ist wieder ein Array |
| `length` | Anzahl der Elemente (bei Strings: Zeichen) |
| `keys` | sortierte Liste der Schlüssel eines Objekts |
| `sort_by(.feld)`, `group_by(.feld)` | sortieren, gruppieren |
| `unique`, `add` | Duplikate entfernen, Werte addieren |

> [!FEHLER]
> **`=` statt `==`.** In `select(.rolle = "admin")` ist `=` eine Zuweisung, kein Vergleich. Das Ergebnis ist
> Unsinn oder ein Fehler. Vergleiche schreibst du mit `==`, `!=`, `<`, `>`.

## Neue Strukturen bauen

jq kann auch **neues** JSON erzeugen. Mit geschweiften Klammern baust du Objekte, mit eckigen Arrays:

```bash title="Terminal"
jq 'map({name, email})' users.json            # nur zwei Felder behalten
jq 'map({login: .email, admin: (.rolle == "admin")})' users.json
jq '[.[] | .logins] | add' users.json         # Summe aller Logins
```

`{name, email}` ist die Kurzform für `{name: .name, email: .email}`.

Drei Optionen brauchst du ständig:

| Option | Wirkung |
|---|---|
| `-r` | *raw*: Strings ohne Anführungszeichen ausgeben |
| `-c` | kompakt: jedes Ergebnis in einer Zeile |
| `--arg name wert` | Shell-Wert sicher als `$name` in den Filter übergeben |

```bash title="Terminal"
rolle=admin
jq -r --arg r "$rolle" '.[] | select(.rolle == $r) | .name' users.json
```

## jq im Arbeitsalltag

Seine Stärke spielt jq zusammen mit anderen Werkzeugen aus – etwa mit `curl`, das eine API abfragt:

```bash title="Terminal"
curl -s https://api.example.com/users | jq '.[0]'
jq -r '.[] | [.name, .email] | @csv' users.json > users.csv
```

Der zweite Befehl erzeugt sogar eine CSV-Datei: `@csv` macht aus einem Array eine korrekt gequotete CSV-Zeile.

> [!PRAXIS]
> In Deployment-Skripten liest man mit jq oft einzelne Werte aus JSON-Ausgaben, etwa die Version aus
> `package.json`: `jq -r .version package.json`. Auch Cloud-Kommandozeilen liefern JSON, das man mit jq
> weiterverarbeitet.

## Zusammenfassung

- `jq . datei.json` formatiert JSON und prüft dabei die Syntax.
- `.schluessel`, `.a.b`, `.[0]` und `.[]` greifen auf Werte zu; `|` verkettet Filter.
- `select`, `map`, `length`, `sort_by`, `unique` und `add` lösen die meisten Alltagsaufgaben.
- Mit `{…}` und `[…]` baust du neue Strukturen, `{name, email}` ist eine praktische Kurzform.
- `-r` für Rohtext, `-c` für kompakte Zeilen, `--arg` für Werte aus der Shell.
