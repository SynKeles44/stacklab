---
title: Das Datenmodell entwerfen
summary: Aus User Stories Entitäten, Beziehungen und Constraints ableiten – und die Geschäftsregeln dort absichern, wo sie nicht umgangen werden können.
duration: 25
sources:
  - title: Laravel-Dokumentation – Migrations
    url: https://laravel.com/docs/13.x/migrations
  - title: Laravel-Dokumentation – Eloquent Relationships
    url: https://laravel.com/docs/13.x/eloquent-relationships
  - title: SQLite – CREATE TABLE (Constraints)
    url: https://www.sqlite.org/lang_createtable.html
quiz:
  - type: single
    question: Wie bildest du ab, dass viele Mitglieder viele Workshops buchen können?
    options:
      - Eine Spalte `workshop_ids` mit einer Komma-Liste in `users`
      - Eine Zwischentabelle `bookings` mit `workshop_id` und `user_id`
      - Eine Spalte `user_id` in `workshops`
    answer: 1
    explanation: >
      Eine n:m-Beziehung braucht eine Zwischentabelle. Komma-Listen lassen sich weder sauber abfragen noch
      durch Fremdschlüssel absichern.
  - type: multiple
    question: Welche Regeln sichert die Datenbank in Vereinskurse selbst ab?
    options:
      - Eine Person bucht einen Workshop höchstens einmal (Unique-Constraint).
      - Eine Buchung zeigt immer auf einen existierenden Workshop (Fremdschlüssel).
      - Ein Workshop hat einen ansprechenden Titel.
      - Wird ein Workshop gelöscht, verschwinden seine Buchungen mit (ON DELETE CASCADE).
    answers: [0, 1, 3]
    explanation: >
      Eindeutigkeit, Verweise und Löschverhalten lassen sich als Constraint ausdrücken. „Ansprechend“ ist keine
      prüfbare Regel – das bleibt Aufgabe von Menschen.
  - type: match
    question: Ordne jeder Spalte die passende Laravel-Methode zu.
    pairs:
      - { left: "user_id als Fremdschlüssel", right: "foreignId('user_id')->constrained()" }
      - { left: "Beschreibung, darf fehlen", right: "text('description')->nullable()" }
      - { left: "Beginn mit Uhrzeit", right: "dateTime('starts_at')" }
      - { left: "Plätze, nie negativ", right: "unsignedInteger('capacity')" }
    explanation: Die Migration beschreibt das Schema in PHP – Laravel übersetzt es in das SQL der jeweiligen Datenbank.
  - type: find-bug
    question: Diese Migration soll doppelte Buchungen verhindern. Welche Zeile ist falsch?
    language: php
    code: |
      Schema::create('bookings', function (Blueprint $table) {
          $table->id();
          $table->foreignId('workshop_id')->constrained()->cascadeOnDelete();
          $table->foreignId('user_id')->constrained()->cascadeOnDelete();
          $table->timestamps();
          $table->unique('user_id');
      });
    bug_line: 6
    explanation: >
      `unique('user_id')` würde jeder Person nur **eine einzige** Buchung insgesamt erlauben. Eindeutig sein muss
      die Kombination: `unique(['workshop_id', 'user_id'])`.
tasks:
  - id: schema-mit-constraints
    type: terminal
    title: Das Schema mit Constraints in SQLite
    description: |
      Bevor du Migrationen schreibst, probierst du das Datenmodell direkt in SQL aus. So siehst du, welche Regeln
      die Datenbank selbst durchsetzt.

      Lege im Ordner `datenmodell` die Datei `schema.sql` an. Sie erstellt drei Tabellen:

      1. `users`: `id` (INTEGER PRIMARY KEY), `name` (TEXT NOT NULL), `email` (TEXT NOT NULL **UNIQUE**).
      2. `workshops`: `id` (INTEGER PRIMARY KEY), `user_id` (INTEGER NOT NULL, Fremdschlüssel auf `users(id)`),
         `title` (TEXT NOT NULL), `location` (TEXT NOT NULL), `starts_at` (TEXT NOT NULL), `capacity` (INTEGER
         NOT NULL mit `CHECK (capacity > 0)`).
      3. `bookings`: `id` (INTEGER PRIMARY KEY), `workshop_id` (Fremdschlüssel auf `workshops(id)` mit
         `ON DELETE CASCADE`), `user_id` (Fremdschlüssel auf `users(id)`), und `UNIQUE (workshop_id, user_id)`.

      Teste dein Schema mit `sqlite3 test.db < schema.sql` und ein paar `INSERT`-Befehlen. Denk daran: SQLite
      prüft Fremdschlüssel erst nach `PRAGMA foreign_keys = ON;`.
    workdir: datenmodell
    checks:
      - type: file_exists
        path: schema.sql
        message: Die Datei schema.sql fehlt noch.
      - type: command
        run: "{ cat schema.sql; echo \"SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name;\"; } | sqlite3 :memory: | paste -sd ' ' -"
        stdout_equals: "bookings users workshops"
        message: schema.sql soll genau die Tabellen users, workshops und bookings anlegen – ohne Fehler.
      - type: command
        run: >-
          { echo 'PRAGMA foreign_keys = ON;'; cat schema.sql;
          echo "INSERT INTO users (id, name, email) VALUES (1, 'Ada', 'ada@example.com');";
          echo "INSERT INTO workshops (id, user_id, title, location, starts_at, capacity) VALUES (1, 1, 'Yoga', 'Halle', '2026-11-01 18:00', 2);";
          echo "INSERT INTO bookings (workshop_id, user_id) VALUES (1, 1);";
          echo "SELECT count(*) FROM bookings;"; } | sqlite3 :memory: 2>&1
        stdout_equals: "1"
        message: "Gültige Daten lassen sich noch nicht einfügen. Prüfe die Spaltennamen: users(id, name, email), workshops(id, user_id, title, location, starts_at, capacity), bookings(workshop_id, user_id)."
      - type: command
        run: >-
          { echo 'PRAGMA foreign_keys = ON;'; cat schema.sql;
          echo "INSERT INTO users (id, name, email) VALUES (1, 'Ada', 'ada@example.com');";
          echo "INSERT INTO workshops (id, user_id, title, location, starts_at, capacity) VALUES (1, 1, 'Yoga', 'Halle', '2026-11-01 18:00', 2);";
          echo "INSERT INTO bookings (workshop_id, user_id) VALUES (1, 1);";
          echo "INSERT INTO bookings (workshop_id, user_id) VALUES (1, 1);"; } | sqlite3 :memory: 2>&1 || true
        stdout_matches: "UNIQUE constraint failed"
        message: Eine doppelte Buchung (gleicher Workshop, gleiche Person) wird noch nicht abgelehnt. Ergänze UNIQUE (workshop_id, user_id) in bookings.
      - type: command
        run: >-
          { echo 'PRAGMA foreign_keys = ON;'; cat schema.sql;
          echo "INSERT INTO users (id, name, email) VALUES (1, 'Ada', 'ada@example.com');";
          echo "INSERT INTO bookings (workshop_id, user_id) VALUES (99, 1);"; } | sqlite3 :memory: 2>&1 || true
        stdout_matches: "FOREIGN KEY constraint failed"
        message: Eine Buchung für einen nicht existierenden Workshop wird noch angenommen. workshop_id braucht REFERENCES workshops(id).
      - type: command
        run: >-
          { echo 'PRAGMA foreign_keys = ON;'; cat schema.sql;
          echo "INSERT INTO users (id, name, email) VALUES (1, 'Ada', 'ada@example.com');";
          echo "INSERT INTO workshops (id, user_id, title, location, starts_at, capacity) VALUES (1, 1, 'Yoga', 'Halle', '2026-11-01 18:00', 0);"; } | sqlite3 :memory: 2>&1 || true
        stdout_matches: "CHECK constraint failed"
        message: Ein Workshop mit 0 Plätzen wird noch angenommen. Ergänze CHECK (capacity > 0).
      - type: command
        run: >-
          { echo 'PRAGMA foreign_keys = ON;'; cat schema.sql;
          echo "INSERT INTO users (id, name, email) VALUES (1, 'Ada', 'ada@example.com');";
          echo "INSERT INTO users (id, name, email) VALUES (2, 'Grace', 'ada@example.com');"; } | sqlite3 :memory: 2>&1 || true
        stdout_matches: "UNIQUE constraint failed"
        message: Zwei Konten mit derselben E-Mail werden noch angenommen. email braucht UNIQUE.
      - type: command
        run: >-
          { echo 'PRAGMA foreign_keys = ON;'; cat schema.sql;
          echo "INSERT INTO users (id, name, email) VALUES (1, 'Ada', 'ada@example.com');";
          echo "INSERT INTO workshops (id, user_id, title, location, starts_at, capacity) VALUES (1, 1, 'Yoga', 'Halle', '2026-11-01 18:00', 2);";
          echo "INSERT INTO bookings (workshop_id, user_id) VALUES (1, 1);";
          echo "DELETE FROM workshops WHERE id = 1;";
          echo "SELECT count(*) FROM bookings;"; } | sqlite3 :memory: 2>&1
        stdout_equals: "0"
        message: Wird ein Workshop gelöscht, sollen seine Buchungen mitverschwinden. Ergänze ON DELETE CASCADE am Fremdschlüssel workshop_id.
    hints:
      - "Ein Fremdschlüssel in SQLite: `workshop_id INTEGER NOT NULL REFERENCES workshops(id) ON DELETE CASCADE`."
      - "Den Unique-Constraint über zwei Spalten schreibst du als eigene Zeile am Ende: `UNIQUE (workshop_id, user_id)`."
      - "Mit `sqlite3 test.db` öffnest du eine Shell, `.schema` zeigt dein Schema, `.quit` beendet sie."
    solution: |
      ```sql title="schema.sql"
      CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE
      );

      CREATE TABLE workshops (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        location TEXT NOT NULL,
        starts_at TEXT NOT NULL,
        capacity INTEGER NOT NULL CHECK (capacity > 0)
      );

      CREATE TABLE bookings (
        id INTEGER PRIMARY KEY,
        workshop_id INTEGER NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE (workshop_id, user_id)
      );
      ```
  - id: kardinalitaeten
    type: dragdrop
    title: Welche Beziehung ist das?
    description: Ordne jede Aussage aus dem Vereinsalltag der passenden Kardinalität zu.
    targets:
      - { id: eins-n, label: "1:n" }
      - { id: n-m, label: "n:m" }
      - { id: eins-eins, label: "1:1" }
    items:
      - { label: Eine Organisatorin legt viele Workshops an, target: eins-n }
      - { label: Ein Workshop hat viele Buchungen, target: eins-n }
      - { label: Mitglieder buchen Workshops, target: n-m }
      - { label: "Workshops haben mehrere Schlagwörter, Schlagwörter gehören zu vielen Workshops", target: n-m }
      - { label: Jedes Mitglied hat genau ein Profil mit Notfallkontakt, target: eins-eins }
    hints:
      - Frag in beide Richtungen „wie viele?“ – kommt zweimal „viele“ heraus, ist es n:m.
---
Eine Organisatorin legt einen Workshop mit zehn Plätzen an. Zwei Mitglieder buchen. Eines bucht aus Versehen
doppelt, und der Workshop wird später gelöscht. Wo stehen diese Fakten, und wer passt auf, dass sie stimmen?
Das beantwortet dein Datenmodell – und es ist schwer zu ändern, sobald echte Daten darin liegen.

## Von Stories zu Entitäten

Lies deine User Stories und markiere die **Substantive**. Sie sind Kandidaten für
[[entitaet|Entitäten]], also Tabellen:

| Aus der Story | Entität | Wichtige Eigenschaften |
|---|---|---|
| „Als **Mitglied** …“ | `users` | Name, E-Mail, Passwort-Hash |
| „… einen **Workshop** anlegen“ | `workshops` | Titel, Ort, Beginn, Plätze |
| „… einen Platz **buchen**“ | `bookings` | wer, welcher Workshop |

Organisatorinnen und Mitglieder sind beide **Nutzer**. Für Version 1 reicht eine Tabelle `users`. Rollen und
Rechte stehen in „Nicht jetzt“ – du merkst, wie das MVP auch das Datenmodell klein hält.

> [!MERKSATZ]
> Substantive werden Tabellen, Verben werden oft Beziehungen oder Endpunkte.

## Beziehungen und Kardinalitäten

Jetzt fragst du für jedes Paar in **beide** Richtungen „wie viele?“. Das Ergebnis ist die
[[kardinalitaet|Kardinalität]]:

- Ein Nutzer organisiert viele Workshops, ein Workshop hat eine Organisatorin → **1:n**, Fremdschlüssel
  `user_id` in `workshops`.
- Ein Nutzer bucht viele Workshops, ein Workshop hat viele Teilnehmende → **n:m**, also eine
  [[zwischentabelle|Zwischentabelle]] `bookings`.

![ER-Diagramm mit users, workshops und bookings](/assets/capstone/datenmodell.svg)

Zeichne so ein [[er-diagramm|ER-Diagramm]] ruhig auf Papier. Es ist die schnellste Art, Denkfehler zu finden.

## Regeln in die Datenbank legen

Manche Regeln gelten **immer**, egal ob die Daten über die API, ein Skript oder eine Datenbank-Konsole
kommen. Diese Regeln legst du als [[constraint|Constraint]] in die Datenbank:

| Regel | Constraint |
|---|---|
| Eine E-Mail gibt es nur einmal | `UNIQUE` auf `email` |
| Eine Buchung zeigt auf einen echten Workshop | [[fremdschluessel\|Fremdschlüssel]] |
| Niemand bucht denselben Workshop doppelt | [[unique-constraint\|Unique]] über `(workshop_id, user_id)` |
| Workshop gelöscht → Buchungen weg | `ON DELETE CASCADE` |
| Mindestens ein Platz | `CHECK (capacity > 0)` oder Validierung |

„Nie mehr Buchungen als Plätze“ kann eine einfache Constraint dagegen **nicht** ausdrücken, weil dafür
Zeilen gezählt werden müssen. Diese Regel prüft später dein Code – in einer Transaktion.

> [!FEHLER]
> Sich nur auf die Validierung im Controller verlassen. Ein Import-Skript oder ein Bug umgeht sie. Der
> Unique-Constraint ist das Sicherheitsnetz, das immer hält.

## Vom Entwurf zur Migration

In Laravel wird der Entwurf zu [[migration|Migrationen]]. Die Bookings-Tabelle sieht so aus:

```php title="database/migrations/…_create_bookings_table.php"
Schema::create('bookings', function (Blueprint $table) {
    $table->id();
    $table->foreignId('workshop_id')->constrained()->cascadeOnDelete();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->timestamps();
    $table->unique(['workshop_id', 'user_id']);
});
```

Prüfe zum Schluss die Spalten, nach denen du **filterst und sortierst**. Die Liste zeigt kommende Workshops
nach Beginn – `starts_at` bekommt deshalb einen [[datenbank-index|Index]].

> [!PRAXIS]
> Datenmodelle wachsen. Plane Änderungen von Anfang an als neue Migrationen ein, nie als Bearbeitung einer
> schon ausgeführten. Wie du Spalten ohne Ausfall umbaust, zeigt das Muster
> [[expand-contract|Expand/Contract]].

## Checkliste für das Datenmodell

1. Jede Muss-Story lässt sich mit den Tabellen beantworten.
2. Jede Beziehung hat eine Kardinalität und einen Fremdschlüssel.
3. Regeln, die immer gelten, stehen als Constraint in der Datenbank.
4. Spalten für Filter und Sortierung haben einen Index.
5. Nichts aus „Nicht jetzt“ hat sich ins Schema geschlichen.

## Zusammenfassung

- Substantive aus den User Stories werden **Entitäten**, also Tabellen.
- Für jede Beziehung fragst du in beide Richtungen nach der **Kardinalität**; n:m braucht eine Zwischentabelle.
- Regeln, die immer gelten, sicherst du mit **Constraints** ab: Unique, Fremdschlüssel, Check, Cascade.
- Regeln, die Zeilen zählen, prüft der Code – in einer Transaktion.
- Filter- und Sortierspalten bekommen einen **Index**.
