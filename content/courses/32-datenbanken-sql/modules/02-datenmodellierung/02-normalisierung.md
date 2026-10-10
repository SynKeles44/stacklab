---
title: Normalisierung bis zur dritten Normalform
summary: Redundanz und ihre Anomalien erkennen, Tabellen Schritt für Schritt in die erste, zweite und dritte Normalform bringen und bewusst denormalisieren, wenn es sich lohnt.
duration: 20
sources:
  - title: PostgreSQL – Data Definition (Tabellen entwerfen)
    url: https://www.postgresql.org/docs/current/ddl.html
  - title: MySQL 8.4 – Optimizing Database Structure
    url: https://dev.mysql.com/doc/refman/8.4/en/optimizing-database-structure.html
  - title: SQLite – Datatypes In SQLite
    url: https://sqlite.org/datatype3.html
quiz:
  - type: single
    question: In einer Tabelle steht der Kundenname in jeder Bestellung erneut. Ada heiratet und ändert ihren Namen, aber nur zwei von fünf Zeilen werden angepasst. Wie heißt dieses Problem?
    options: [Einfüge-Anomalie, Änderungs-Anomalie, Lösch-Anomalie, Deadlock]
    answer: 1
    explanation: >
      Weil dieselbe Information mehrfach gespeichert ist, muss eine Änderung an vielen Stellen passieren. Wird
      eine vergessen, widersprechen sich die Daten – eine Änderungs-Anomalie (Update-Anomalie).
  - type: match
    question: Ordne jeder Normalform ihre Regel zu.
    pairs:
      - { left: "1. Normalform", right: "Jede Zelle enthält genau einen Wert, keine Listen" }
      - { left: "2. Normalform", right: "Jede Spalte hängt vom ganzen Primärschlüssel ab, nicht nur von einem Teil" }
      - { left: "3. Normalform", right: "Keine Spalte hängt über eine andere Nicht-Schlüssel-Spalte vom Schlüssel ab" }
    explanation: Jede Normalform setzt die vorherige voraus. Die dritte ist in der Praxis meist das Ziel.
  - type: multiple
    question: Welche Gründe sprechen dafür, `unit_price` in `order_items` zu speichern, obwohl der Preis schon in `products` steht?
    options:
      - Der Produktpreis kann sich später ändern, die Rechnung aber nicht.
      - So muss man nie wieder JOINs schreiben.
      - Es ist eigentlich kein Duplikat, sondern ein anderer Fakt – der Preis zum Bestellzeitpunkt.
      - Normalisierung ist bei Preisen verboten.
    answers: [0, 2]
    explanation: >
      `products.price` ist der aktuelle Preis, `order_items.unit_price` der Preis zum Zeitpunkt der Bestellung.
      Das sind zwei verschiedene Informationen, deshalb ist die Spalte richtig modelliert.
  - type: single
    question: Eine Tabelle `customers` hat die Spalten `id`, `name`, `zip`, `city`. Die Stadt ergibt sich immer aus der Postleitzahl. Welche Normalform ist verletzt?
    options: ["Die erste", "Die zweite", "Die dritte", "Keine"]
    answer: 2
    explanation: >
      `city` hängt von `zip` ab und `zip` von `id` – eine transitive Abhängigkeit über eine Nicht-Schlüssel-Spalte.
      Streng nach 3NF gehörten PLZ und Ort in eine eigene Tabelle. In der Praxis lässt man das oft bewusst so.
tasks:
  - id: normalisieren-schritte
    type: steps
    title: Eine flache Tabelle normalisieren
    description: |
      Ein Shop hat alles in einer Tabelle `bestellungen_flach` gespeichert:

      | bestell_nr | datum | kunde | kunde_email | produkte |
      |---|---|---|---|---|
      | 1 | 2026-03-01 | Ada | ada@example.com | Tasse (2), Notizbuch (3) |
      | 3 | 2026-04-10 | Ada | ada@example.com | Rucksack (1) |

      Bring sie Schritt für Schritt in Ordnung.
    steps:
      - situation: Die Spalte `produkte` enthält mehrere Produkte mit Mengen in einer Zelle.
        question: Gegen welche Regel verstößt das, und was ist der erste Schritt?
        options:
          - "Gegen die 1. Normalform – jede Position bekommt eine eigene Zeile in einer neuen Tabelle."
          - "Gegen die 3. Normalform – die Spalte wird gelöscht."
          - "Gegen gar nichts, Text darf beliebig lang sein."
        answer: 0
        explanation: Listen in einer Zelle lassen sich weder sauber filtern noch summieren. Eine Tabelle mit einer Zeile pro Position löst das.
      - situation: "Die neue Positionstabelle hat den Schlüssel `(bestell_nr, produkt_name)` und zusätzlich die Spalte `produkt_kategorie`."
        question: Was stimmt an `produkt_kategorie` nicht?
        options:
          - "Sie hängt nur vom Teil `produkt_name` des Schlüssels ab – Verstoß gegen die 2. Normalform. Sie gehört in eine Tabelle `products`."
          - "Sie verstößt gegen die 1. Normalform."
          - "Nichts, sie ist richtig platziert."
        answer: 0
        explanation: Die Kategorie hängt am Produkt, nicht an der Bestellung. Steht sie in jeder Position, wiederholt sie sich bei jeder Bestellung desselben Produkts.
      - situation: "In der Tabelle der Bestellungen stehen jetzt noch `kunde` und `kunde_email` neben `bestell_nr` und `datum`."
        question: Was ist der letzte Schritt zur 3. Normalform?
        options:
          - "Die Kundendaten wandern in eine Tabelle `customers`; die Bestellung speichert nur noch `customer_id`."
          - "`kunde_email` wird in `kunde` hineingeschrieben."
          - "Nichts, das ist bereits normalisiert."
        answer: 0
        explanation: Die E-Mail hängt am Kunden, nicht an der Bestellung. Über den Fremdschlüssel `customer_id` steht sie nur noch einmal in der Datenbank.
  - id: verstoesse-zuordnen
    type: dragdrop
    title: Welche Normalform ist verletzt?
    description: Ordne jedes Tabellen-Design der ersten verletzten Normalform zu – oder „in Ordnung“.
    targets:
      - { id: nf1, label: Verstößt gegen 1NF }
      - { id: nf2, label: Verstößt gegen 2NF }
      - { id: nf3, label: Verstößt gegen 3NF }
      - { id: ok, label: In Ordnung (3NF) }
    items:
      - { label: "customers(id, name, telefonnummern) mit Wert \"0301234, 0405678\"", target: nf1 }
      - { label: "orders(id, artikel1, artikel2, artikel3)", target: nf1 }
      - { label: "order_items(order_id, product_id, quantity, product_name) mit PK (order_id, product_id)", target: nf2 }
      - { label: "orders(id, customer_id, customer_city)", target: nf3 }
      - { label: "employees(id, department_id, department_name)", target: nf3 }
      - { label: "orders(id, customer_id, order_date, status)", target: ok }
---

Ein Shop speichert jede Bestellung in einer einzigen, breiten Tabelle: Bestellnummer, Datum, Kundenname,
E-Mail, Produkte. Das wirkt einfach, bis Ada ihre E-Mail-Adresse ändert. Jetzt muss sie in jeder ihrer
Bestellungen geändert werden – und irgendwo wird eine vergessen. [[normalisierung|Normalisierung]] ist das
Rezept gegen solche Widersprüche.

## Das Problem: Redundanz und Anomalien

[[redundanz|Redundanz]] heißt: Dieselbe Information steht mehrfach in der Datenbank.

| bestell_nr | kunde | kunde_email | produkt | kategorie |
|---|---|---|---|---|
| 1 | Ada | ada@example.com | Tasse | Küche |
| 1 | Ada | ada@example.com | Notizbuch | Büro |
| 3 | Ada | ada@example.com | Rucksack | Taschen |

Daraus entstehen drei typische [[anomalie|Anomalien]]:

- **Änderungs-Anomalie:** Die E-Mail muss in drei Zeilen geändert werden. Vergisst du eine, widersprechen
  sich die Daten.
- **Einfüge-Anomalie:** Ein neues Produkt ohne Bestellung kannst du gar nicht anlegen – es fehlt eine
  Bestellnummer.
- **Lösch-Anomalie:** Löschst du Bestellung 3, verschwindet auch das Wissen, dass es Rucksäcke gibt.

Die Normalformen sind drei Regeln, die diese Probleme Schritt für Schritt beseitigen.

## Erste Normalform: ein Wert pro Zelle

Eine Tabelle ist in der ersten [[normalform|Normalform]] (1NF), wenn jede Zelle genau einen Wert enthält.
Verboten sind Listen in einer Zelle und durchnummerierte Spalten.

| Verstoß | Warum schlecht |
|---|---|
| `produkte = 'Tasse (2), Notizbuch (3)'` | Du kannst nicht nach einem Produkt filtern oder Mengen summieren |
| Spalten `artikel1`, `artikel2`, `artikel3` | Bei vier Artikeln brauchst du eine Schemaänderung |

Die Lösung: eine Zeile pro Position, in einer eigenen Tabelle. Genau das ist `order_items`.

> [!FEHLER]
> **Kommagetrennte Listen in einer Text-Spalte.** Abfragen wie „Wer hat Tassen bestellt?“ werden dann zu
> fehleranfälligen `LIKE '%Tasse%'`-Suchen – und finden auch „Tassenhalter“.

## Zweite Normalform: am ganzen Schlüssel

Die zweite Normalform (2NF) betrifft Tabellen mit zusammengesetztem Schlüssel. Jede weitere Spalte muss vom
**ganzen** Schlüssel abhängen, nicht nur von einem Teil.

In `order_items` ist der Schlüssel `(order_id, product_id)`:

| Spalte | hängt ab von | Ergebnis |
|---|---|---|
| `quantity` | Bestellung **und** Produkt | richtig hier |
| `product_name` | nur `product_id` | gehört nach `products` |
| `order_date` | nur `order_id` | gehört nach `orders` |

Faustregel: Wenn eine Spalte sich bei jeder Bestellung desselben Produkts wiederholt, steht sie in der falschen
Tabelle.

## Dritte Normalform: keine Umwege

In der dritten Normalform (3NF) hängt keine Spalte über eine **andere Nicht-Schlüssel-Spalte** vom Schlüssel
ab. Ein Beispiel: `orders(id, customer_id, customer_email)`. Die E-Mail hängt an `customer_id`, nicht an der
Bestellung. Sie gehört nach `customers`.

```sql title="Vorher und nachher"
-- vorher: orders(id, customer_id, customer_email, order_date)
-- nachher:
CREATE TABLE customers (id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE);
CREATE TABLE orders (id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  order_date TEXT NOT NULL);
```

> [!MERKSATZ]
> Ein Fakt – ein Ort. Jede Information steht genau einmal in der Datenbank, alles andere verweist per
> Fremdschlüssel darauf.

Es gibt noch weitere Normalformen. Für die tägliche Arbeit reicht die dritte fast immer.

## Denormalisierung: bewusst doppelt

Normalisierte Daten sind sauber, brauchen aber JOINs. Manchmal speichert man Werte deshalb absichtlich
doppelt – das heißt [[denormalisierung|Denormalisierung]].

| Beispiel | Vorteil | Preis |
|---|---|---|
| `orders.total` zusätzlich zu den Positionen | Listen laden ohne Summieren | muss bei jeder Änderung neu berechnet werden |
| Kundenname in einem Suchindex | schnelle Volltextsuche | kann kurzzeitig veraltet sein |

Kein Fall von Denormalisierung ist `order_items.unit_price`: Er speichert den Preis **zum Zeitpunkt der
Bestellung**. Das ist ein anderer Fakt als der heutige Preis in `products`.

> [!PRAXIS]
> Normalisiere zuerst. Denormalisiere erst, wenn eine Messung zeigt, dass eine Abfrage zu langsam ist – und
> schreibe auf, wer die doppelten Werte aktuell hält.

## Zusammenfassung

- Redundanz führt zu Änderungs-, Einfüge- und Lösch-Anomalien.
- 1NF: ein Wert pro Zelle, keine Listen und keine durchnummerierten Spalten.
- 2NF: Spalten hängen vom ganzen zusammengesetzten Schlüssel ab.
- 3NF: keine Abhängigkeit über eine andere Nicht-Schlüssel-Spalte – ein Fakt, ein Ort.
- Denormalisierung ist eine bewusste, gemessene Ausnahme mit klarer Verantwortung.
- Ein historischer Wert wie der Preis zum Bestellzeitpunkt ist ein eigener Fakt, kein Duplikat.
