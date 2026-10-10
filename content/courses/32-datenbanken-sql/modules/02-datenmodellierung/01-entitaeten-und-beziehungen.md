---
title: Entitäten, Schlüssel und Beziehungen
summary: Aus einer Fachsprache Tabellen ableiten, Primär- und Fremdschlüssel setzen, 1:1-, 1:n- und n:m-Beziehungen erkennen und als ER-Diagramm zeichnen.
duration: 20
sources:
  - title: SQLite – SQLite Foreign Key Support
    url: https://sqlite.org/foreignkeys.html
  - title: PostgreSQL – Constraints (Primary Keys, Foreign Keys)
    url: https://www.postgresql.org/docs/current/ddl-constraints.html
  - title: MySQL 8.4 – FOREIGN KEY Constraints
    url: https://dev.mysql.com/doc/refman/8.4/en/create-table-foreign-keys.html
quiz:
  - type: single
    question: Ein Kunde kann viele Bestellungen aufgeben, jede Bestellung gehört zu genau einem Kunden. Wo steht der Fremdschlüssel?
    options:
      - "In `customers` als Spalte `order_id`."
      - "In `orders` als Spalte `customer_id`."
      - "In beiden Tabellen."
      - "In einer Zwischentabelle `customer_orders`."
    answer: 1
    explanation: >
      Bei 1:n steht der Fremdschlüssel immer auf der n-Seite. Eine Bestellung hat genau einen Kunden, also passt
      eine Spalte `customer_id` in `orders`. Umgekehrt bräuchte ein Kunde beliebig viele `order_id`-Spalten.
  - type: multiple
    question: Welche Beziehungen sind n:m und brauchen deshalb eine Zwischentabelle?
    options:
      - Studierende und Kurse
      - Bestellungen und Produkte
      - Personen und ihr Personalausweis
      - Bücher und Autor:innen (ein Buch kann mehrere haben)
    answers: [0, 1, 3]
    explanation: >
      Bei n:m kann jede Seite mit vielen Einträgen der anderen verbunden sein. Personalausweis ist ein klassisches
      1:1 – eine Person hat höchstens einen gültigen Ausweis, ein Ausweis gehört genau einer Person.
  - type: cloze
    text: "Eine Spalte, die auf den Primärschlüssel einer anderen Tabelle zeigt, heißt ___. In `order_items` bilden `order_id` und `product_id` zusammen einen ___ Primärschlüssel."
    blanks:
      - [Fremdschlüssel, Foreign Key, FK]
      - [zusammengesetzten, zusammengesetzter]
    explanation: >
      Der Fremdschlüssel stellt die Beziehung her. Der zusammengesetzte Primärschlüssel stellt sicher, dass dasselbe
      Produkt pro Bestellung nur einmal als Position vorkommt.
  - type: single
    question: Warum nutzen viele Tabellen eine künstliche `id` statt der E-Mail-Adresse als Primärschlüssel?
    options:
      - Weil Text-Spalten keine Primärschlüssel sein dürfen.
      - Weil sich eine E-Mail-Adresse ändern kann und dann alle Fremdschlüssel mitgeändert werden müssten.
      - Weil E-Mail-Adressen nie eindeutig sind.
      - Weil SQL das so vorschreibt.
    answer: 1
    explanation: >
      Ein Primärschlüssel sollte sich nie ändern. Eine künstliche Zahl hat keine Bedeutung außerhalb der Datenbank
      und bleibt deshalb stabil. Die E-Mail bekommt trotzdem eine UNIQUE-Regel.
tasks:
  - id: er-diagramm
    type: diagram
    title: Beschrifte das ER-Diagramm des Shops
    description: >
      Das Diagramm zeigt die vier Tabellen des Shops mit ihren Spalten und Beziehungen, aber ohne Tabellennamen.
      Ziehe die richtigen Namen in die Kopfzeilen. Achte auf die Fremdschlüssel und die Kardinalitäten 1 und n.
    image: /assets/datenbanken-sql/er-shop-leer.svg
    slots:
      - { x: 17, y: 21, answer: customers }
      - { x: 82, y: 21, answer: orders }
      - { x: 82, y: 66, answer: order_items }
      - { x: 17, y: 66, answer: products }
    distractors: [categories, payments]
  - id: kardinalitaeten
    type: dragdrop
    title: 1:1, 1:n oder n:m?
    description: Ordne jede Beziehung ihrer Kardinalität zu. Lies sie in beide Richtungen.
    targets:
      - { id: eins-eins, label: "1:1" }
      - { id: eins-n, label: "1:n" }
      - { id: n-m, label: "n:m" }
    items:
      - { label: "Nutzerkonto und sein Profil mit Zusatzdaten", target: eins-eins }
      - { label: "Land und seine Hauptstadt", target: eins-eins }
      - { label: "Kunde und seine Bestellungen", target: eins-n }
      - { label: "Blogartikel und seine Kommentare", target: eins-n }
      - { label: "Bestellungen und Produkte", target: n-m }
      - { label: "Mitglieder und ausgeliehene Bücher über die Zeit", target: n-m }
---

Bevor du eine einzige Tabelle anlegst, lohnt sich ein Blick auf die Fachsprache: „Ein **Kunde** gibt
**Bestellungen** auf. Eine Bestellung enthält mehrere **Produkte** in bestimmter Menge.“ Aus solchen Sätzen
entsteht das Datenmodell. Wer diesen Schritt überspringt, baut Tabellen, die später schwer zu ändern sind.

## Entitäten und Attribute

Eine [[entitaet|Entität]] ist ein Ding, über das du Daten speichern willst: Kunde, Produkt, Bestellung. Jede
Entität wird zu einer Tabelle. Ihre Eigenschaften, die Attribute, werden zu Spalten.

| Fachsprache | Datenbank |
|---|---|
| Entität „Kunde“ | Tabelle `customers` |
| Attribut „E-Mail-Adresse“ | Spalte `email` |
| ein konkreter Kunde | eine Zeile |

Jede Tabelle braucht einen [[primaerschluessel|Primärschlüssel]]: eine Spalte, deren Wert jede Zeile
eindeutig kennzeichnet und sich nie ändert. Es gibt zwei Arten:

- **Natürlicher Schlüssel:** ein Wert aus der echten Welt, etwa eine ISBN. Klingt praktisch, kann sich aber
  ändern oder doch doppelt vorkommen.
- **Künstlicher Schlüssel:** eine fortlaufende Zahl `id` ohne Bedeutung. Er bleibt stabil, deshalb ist er
  der Normalfall.

> [!MERKSATZ]
> Primärschlüssel: eindeutig, nie NULL, nie geändert. Eine künstliche `id` erfüllt das am zuverlässigsten.

## Beziehungen und ihre Kardinalität

Entitäten hängen zusammen. Die [[kardinalitaet|Kardinalität]] sagt, wie viele Zeilen auf jeder Seite
beteiligt sein können.

| Kardinalität | Beispiel | Umsetzung |
|---|---|---|
| 1:1 | Nutzerkonto ↔ Profil | Fremdschlüssel mit UNIQUE in einer der Tabellen |
| 1:n | Kunde ↔ Bestellungen | Fremdschlüssel auf der n-Seite (`orders.customer_id`) |
| n:m | Bestellungen ↔ Produkte | eigene Zwischentabelle mit zwei Fremdschlüsseln |

Prüfe Beziehungen immer in beide Richtungen: „Hat ein Kunde viele Bestellungen? Ja. Hat eine Bestellung
viele Kunden? Nein.“ Daraus folgt 1:n.

## Fremdschlüssel verbinden Tabellen

Ein [[fremdschluessel|Fremdschlüssel]] ist eine Spalte, die auf den Primärschlüssel einer anderen Tabelle
zeigt. In `orders` steht nicht der Name des Kunden, sondern nur seine `id`:

```sql title="orders verweist auf customers"
CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  order_date TEXT NOT NULL,
  status TEXT NOT NULL
);
```

Der Name steht so genau **einmal** in der Datenbank. Ändert Ada ihren Namen, änderst du eine Zeile in
`customers` – alle Bestellungen zeigen danach automatisch den neuen Namen.

Die Datenbank kann außerdem prüfen, dass jede `customer_id` wirklich existiert. Diese Garantie heißt
[[referentielle-integritaet|referentielle Integrität]]. Wie du sie einschaltest und was beim Löschen
passiert, lernst du in der Lektion über Constraints.

> [!FEHLER]
> **Den Fremdschlüssel auf die falsche Seite setzen.** Eine Spalte `order_id` in `customers` könnte nur
> eine einzige Bestellung pro Kunde speichern. Bei 1:n gehört der Fremdschlüssel immer zur n-Seite.

## n:m mit einer Zwischentabelle

Eine Bestellung enthält viele Produkte, ein Produkt steckt in vielen Bestellungen. Weder `orders` noch
`products` kann das mit einer einzelnen Spalte abbilden. Die Lösung ist eine
[[zwischentabelle|Zwischentabelle]], die n:m in zwei 1:n-Beziehungen zerlegt:

```sql title="order_items: eine Zeile pro Position"
CREATE TABLE order_items (
  order_id INTEGER NOT NULL REFERENCES orders(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  PRIMARY KEY (order_id, product_id)
);
```

- Jede Zeile verbindet genau eine Bestellung mit genau einem Produkt.
- Der [[zusammengesetzter-schluessel|zusammengesetzte Primärschlüssel]] `(order_id, product_id)` verhindert
  doppelte Positionen.
- Die Zwischentabelle trägt eigene Daten: Menge und Preis zum Zeitpunkt der Bestellung.

> [!PRAXIS]
> In Web-Frameworks heißt so eine Tabelle oft Pivot-Tabelle. Sobald sie eigene Spalten wie `quantity`
> bekommt, ist sie eigentlich eine vollwertige Entität – hier die „Bestellposition“.

## ER-Diagramme lesen

Ein [[er-diagramm|ER-Diagramm]] (Entity-Relationship) zeichnet Entitäten als Kästen und Beziehungen als
Linien mit Kardinalitäten. So erkennst du das Datenmodell auf einen Blick, bevor eine Zeile SQL existiert.

![ER-Diagramm mit customers, orders, order_items und products](/assets/datenbanken-sql/er-shop.svg)

Lies die Linien so: Ein Kunde (1) hat viele Bestellungen (n). Eine Bestellung (1) hat viele Positionen (n).
Ein Produkt (1) steckt in vielen Positionen (n). Zusammen ergibt das die n:m-Beziehung zwischen Bestellungen
und Produkten. Es gibt mehrere Notationen, etwa „Krähenfüße“ statt `n`. Die Aussage ist dieselbe.

## Zusammenfassung

- Entitäten werden zu Tabellen, Attribute zu Spalten, konkrete Dinge zu Zeilen.
- Jede Tabelle hat einen stabilen Primärschlüssel, meist eine künstliche `id`.
- Kardinalitäten: 1:1, 1:n und n:m – immer in beide Richtungen prüfen.
- Bei 1:n steht der Fremdschlüssel auf der n-Seite.
- n:m löst eine Zwischentabelle mit zwei Fremdschlüsseln und zusammengesetztem Primärschlüssel auf.
- Ein ER-Diagramm zeigt das Modell, bevor du SQL schreibst.
