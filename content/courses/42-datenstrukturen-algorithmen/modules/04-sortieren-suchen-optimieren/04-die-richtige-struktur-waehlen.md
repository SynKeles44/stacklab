---
title: Die richtige Struktur im Alltag wählen
summary: Ein Entscheidungsleitfaden für Array, Objekt, Map, Set und PHP-Arrays – mit den typischen Performance-Fallen aus Code-Reviews und wie du sie behebst.
duration: 20
sources:
  - title: MDN – Keyed collections (Map, Set, WeakMap)
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Keyed_collections
  - title: MDN – WeakMap
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap
  - title: PHP-Handbuch – array_column
    url: https://www.php.net/manual/de/function.array-column.php
  - title: PHP-Handbuch – array_is_list
    url: https://www.php.net/manual/de/function.array-is-list.php
quiz:
  - type: match
    question: Ordne jeder Frage die Struktur zu, die sie am schnellsten beantwortet.
    pairs:
      - { left: "Was ist das 3. Element?", right: "Array" }
      - { left: "Habe ich diese ID schon gesehen?", right: "Set" }
      - { left: "Welcher Datensatz gehört zu dieser ID?", right: "Map" }
      - { left: "Welche Werte liegen zwischen 10 und 20?", right: "sortiertes Array mit binärer Suche" }
    explanation: Jede Struktur ist für eine bestimmte Art von Frage gebaut. Die Wahl beginnt also mit der Frage, die dein Code am häufigsten stellt.
  - type: single
    question: "Wann ist eine `Map` einem einfachen Objekt `{}` als Nachschlagetabelle vorzuziehen?"
    options:
      - Wenn die Schlüssel keine Strings sind oder sich zur Laufzeit ständig ändern.
      - Wenn die Daten als JSON verschickt werden sollen.
      - Wenn die Schlüssel feste Feldnamen wie `name` und `email` sind.
      - Nie – Objekte sind immer schneller.
    answer: 0
    explanation: >
      Objekte sind ideal für Datensätze mit festen Feldern und für JSON. Eine Map erlaubt beliebige
      Schlüsseltypen, hat `size` und ist für häufiges Hinzufügen und Löschen gebaut.
  - type: find-bug
    question: Dieser PHP-Code ist bei 50 000 Bestellungen sehr langsam. Welche Zeile ist schuld?
    language: php
    code: |
      $kundenIds = array_column($kunden, 'id');
      $ohneKunde = [];
      foreach ($bestellungen as $bestellung) {
          if (!in_array($bestellung['kunde_id'], $kundenIds, true)) {
              $ohneKunde[] = $bestellung['id'];
          }
      }
    bug_line: 4
    explanation: >
      `in_array()` durchsucht bei jedem Schleifendurchlauf alle Kunden-IDs – O(n · m). Mit
      `$index = array_flip($kundenIds);` vor der Schleife und `isset($index[...])` wird daraus O(n + m).
  - type: multiple
    question: Welche Aussagen über PHP-Arrays stimmen?
    options:
      - Ein PHP-Array ist intern eine geordnete Hash-Tabelle.
      - "`isset($array[$schluessel])` ist im Durchschnitt O(1)."
      - "`array_search()` ist O(1), weil es den Hash nutzt."
      - "`array_is_list()` prüft, ob die Schlüssel genau 0, 1, 2 … sind."
    answers: [0, 1, 3]
    explanation: "`array_search()` durchsucht wie `in_array()` die Werte und ist deshalb O(n). Schnell ist nur der Zugriff über Schlüssel."
tasks:
  - id: struktur-waehlen
    type: dragdrop
    title: Welche Struktur passt?
    description: >
      Für jede Anforderung aus einem Webprojekt gibt es eine naheliegende Datenstruktur. Ordne sie zu.
    targets:
      - { id: array, label: Array / Liste }
      - { id: map, label: "Map (Schlüssel → Wert)" }
      - { id: set, label: Set }
      - { id: queue, label: Queue }
      - { id: stack, label: Stack }
    items:
      - { label: "Eine Bildergalerie, die in fester Reihenfolge angezeigt wird", target: array }
      - { label: "Benutzer-IDs, die eine Benachrichtigung schon bekommen haben", target: set }
      - { label: "Zu jeder Produkt-ID den Lagerbestand nachschlagen", target: map }
      - { label: "Hochgeladene Bilder nacheinander verkleinern, in Eingangsreihenfolge", target: queue }
      - { label: "Geöffnete Modale – Escape schließt immer das zuletzt geöffnete", target: stack }
      - { label: "Gewählte Filter-Tags, jeder höchstens einmal", target: set }
      - { label: "Übersetzungen: Schlüssel wie 'cart.empty' zum Text", target: map }
    hints:
      - Frag dich bei jeder Anforderung, welche Operation am häufigsten passiert – lesen per Position, nachschlagen, prüfen, hinten anstellen oder das Neueste zuerst?
  - id: php-index-bauen
    type: code
    language: php
    title: PHP-Daten mit Index statt in_array abgleichen
    description: |
      Ein Import liefert Produkte als Arrays mit den Schlüsseln `id`, `kategorie` und `preis`. Schreibe zwei Funktionen,
      die jeweils mit **einem** Durchlauf pro Eingabe auskommen – kein `in_array()`, kein `array_search()` und keine
      verschachtelten Schleifen über beide Listen.

      1. `nachKategorie(array $produkte): array` gruppiert die Produkt-IDs nach Kategorie:
         `['buch' => [1, 3], 'film' => [2]]`. Reihenfolge der Kategorien und IDs wie in der Eingabe.
      2. `fehlendeIds(array $erwartet, array $produkte): array` liefert alle IDs aus `$erwartet`, zu denen es
         kein Produkt gibt – in der Reihenfolge von `$erwartet` und als Liste (Schlüssel 0, 1, 2 …).
    starter: |
      function nachKategorie(array $produkte): array
      {
          $gruppen = [];
          return $gruppen;
      }

      function fehlendeIds(array $erwartet, array $produkte): array
      {
          return [];
      }
    tests:
      - name: gruppiert nach Kategorie
        code: |
          $p = [
              ['id' => 1, 'kategorie' => 'buch', 'preis' => 10],
              ['id' => 2, 'kategorie' => 'film', 'preis' => 8],
              ['id' => 3, 'kategorie' => 'buch', 'preis' => 12],
          ];
          assert_same(['buch' => [1, 3], 'film' => [2]], nachKategorie($p));
      - name: fehlende IDs in Eingabereihenfolge
        code: |
          $p = [['id' => 2, 'kategorie' => 'a', 'preis' => 1], ['id' => 4, 'kategorie' => 'a', 'preis' => 1]];
          assert_same([5, 1, 3], fehlendeIds([5, 1, 2, 3, 4], $p));
      - name: leere Eingaben
        code: |
          assert_same([], nachKategorie([]));
          assert_same([], fehlendeIds([], []));
          assert_same([7], fehlendeIds([7], []));
      - name: ID 0 wird korrekt erkannt
        code: |
          assert_same([], fehlendeIds([0], [['id' => 0, 'kategorie' => 'x', 'preis' => 1]]));
      - name: 100 000 Produkte schnell abgleichen
        code: |
          $p = [];
          for ($i = 0; $i < 100000; $i++) {
              $p[] = ['id' => $i * 2, 'kategorie' => 'k' . ($i % 10), 'preis' => $i];
          }
          $start = microtime(true);
          $fehlend = fehlendeIds(range(0, 99999), $p);
          assert_same(50000, count($fehlend));
          assert_true(microtime(true) - $start < 0.5);
    hints:
      - "Gruppieren: `$gruppen[$p['kategorie']][] = $p['id'];` legt die Kategorie beim ersten Mal automatisch an."
      - "Index bauen: `$vorhanden = array_flip(array_column($produkte, 'id'));` – danach ist `isset($vorhanden[$id])` O(1)."
      - "Für das Ergebnis von `fehlendeIds` sammelst du mit `$fehlend[] = $id;`, dann ist es automatisch eine Liste."
    solution: |
      function nachKategorie(array $produkte): array
      {
          $gruppen = [];
          foreach ($produkte as $produkt) {
              $gruppen[$produkt['kategorie']][] = $produkt['id'];
          }
          return $gruppen;
      }

      function fehlendeIds(array $erwartet, array $produkte): array
      {
          $vorhanden = array_flip(array_column($produkte, 'id'));
          $fehlend = [];
          foreach ($erwartet as $id) {
              if (!isset($vorhanden[$id])) {
                  $fehlend[] = $id;
              }
          }
          return $fehlend;
      }
---
Du hast jetzt einen ganzen Werkzeugkasten: Arrays, verkettete Listen, Maps, Sets, Stacks, Queues, Bäume und
Graphen. Im Projektalltag stellt sich aber selten die Frage „Welchen Algorithmus implementiere ich?“, sondern
fast immer: „In welche Struktur packe ich diese Daten, damit der Code einfach **und** schnell bleibt?“ Diese
Lektion fasst die Entscheidung zusammen.

## Von der Frage zur Struktur

Die richtige [[datenstruktur|Datenstruktur]] ergibt sich aus der Operation, die dein Code **am häufigsten**
ausführt:

| Häufigste Operation | Struktur | Aufwand |
|---|---|---|
| per Position lesen, in Reihenfolge durchlaufen | Array | O(1) / O(n) |
| „Gibt es X schon?“ | Set | O(1) |
| „Was gehört zu Schlüssel X?“ | Map (PHP: Array mit Schlüsseln) | O(1) |
| zuletzt Hinzugefügtes zuerst | Stack | O(1) |
| zuerst Hinzugefügtes zuerst | Queue | O(1) |
| Bereiche, „nächstgrößerer Wert“ | sortiertes Array + binäre Suche | O(log n) |
| Hierarchie | Baum | O(n) zum Durchlaufen |
| Netz, Abhängigkeiten | Graph als Map von Nachbarn | O(V + E) |

> [!MERKSATZ]
> Wähle die Struktur nach der häufigsten Frage, die dein Code stellt – nicht nach der Form, in der die Daten
> gerade aus der API kommen.

## Objekt oder Map, Array oder Set?

In JavaScript gibt es für fast jede Aufgabe zwei Kandidaten:

| Situation | nimm | warum |
|---|---|---|
| Datensatz mit festen Feldern (`name`, `email`) | Objekt | lesbar, JSON-fähig, TypeScript-Typen |
| Nachschlagetabelle mit vielen, wechselnden Schlüsseln | `Map` | beliebige Schlüsseltypen, `size`, schnelles Löschen |
| geordnete Liste mit Duplikaten | Array | Index, `map`/`filter`, Sortieren |
| Menge eindeutiger Werte, häufiges `has` | `Set` | O(1) statt O(n) |

In TypeScript machst du die Wahl sichtbar: `Map<number, User>`, `Set<string>` oder `ReadonlyArray<Produkt>`.

Eine Sonderform ist die [[js-weakmap|WeakMap]]: Sie nimmt nur Objekte als Schlüssel und hält sie nicht am
Leben. Wird ein Objekt (z. B. ein DOM-Element) nicht mehr gebraucht, räumt die
[[garbage-collection|Garbage Collection]] den Eintrag automatisch weg – praktisch für Zusatzdaten zu Objekten,
die dir nicht gehören.

> [!FEHLER]
> Ein Objekt als Map für Benutzereingaben zu verwenden: Schlüssel wie `"__proto__"` oder `"constructor"`
> kollidieren mit eingebauten Eigenschaften. Für Schlüssel aus fremden Daten ist `Map` die sichere Wahl.

## PHP: ein Array, zwei Rollen

In PHP gibt es nur einen Array-Typ, der zwei Rollen spielt: **Liste** (Schlüssel 0, 1, 2 …) und
**Wörterbuch** (eigene Schlüssel). Mit `array_is_list()` prüfst du, welche Rolle ein Array gerade hat.

```php
// Rolle "Liste": Reihenfolge zählt, Suche nach Werten ist O(n)
$ids = [17, 42, 8];

// Rolle "Wörterbuch": Zugriff über Schlüssel ist O(1)
$nachId = array_column($nutzer, null, 'id');   // [17 => [...], 42 => [...]]
$autor = $nachId[$beitrag['autor_id']] ?? null;
```

`array_column($daten, null, 'id')` baut mit einem Aufruf einen Index nach ID. Für Objekte als Schlüssel
gibt es [`SplObjectStorage`](https://www.php.net/manual/de/class.splobjectstorage.php) bzw. `WeakMap`.

## Die Klassiker aus dem Code-Review

Drei Muster tauchen in Reviews immer wieder auf – alle mit derselben Lösung: einmal einen Index bauen,
danach nachschlagen.

| Langsam (O(n · m)) | Schnell (O(n + m)) |
|---|---|
| `a.filter((x) => b.includes(x))` | `const s = new Set(b); a.filter((x) => s.has(x))` |
| `bestellungen.map((b) => kunden.find((k) => k.id === b.kundeId))` | `const k = new Map(kunden.map((x) => [x.id, x]))` |
| `in_array($id, $ids)` in `foreach` | `$index = array_flip($ids); isset($index[$id])` |

Der Speicher für den Index ist fast immer gut investiert. Das Gegenstück auf Datenbank-Ebene ist das
[[n-plus-1-problem|N+1-Problem]]: eine Abfrage pro Datensatz statt einer Abfrage für alle.

> [!PRAXIS]
> Optimiere nicht auf Verdacht. Bei 20 Menüpunkten ist `includes()` völlig in Ordnung. Wird eine Liste
> unbegrenzt groß – Bestellungen, Logeinträge, Import-Zeilen – dann miss nach und wähle die passende Struktur.

## Zusammenfassung

- Die häufigste Operation bestimmt die Struktur: Position → Array, Prüfen → Set, Nachschlagen → Map.
- Objekte sind für Datensätze mit festen Feldern da, Maps für dynamische Nachschlagetabellen.
- `WeakMap` hängt Zusatzdaten an Objekte, ohne sie im Speicher festzuhalten.
- PHP-Arrays sind Liste und Wörterbuch zugleich – schnell ist nur der Zugriff über Schlüssel.
- `includes`, `find` und `in_array` in Schleifen ersetzt du durch einen vorab gebauten Index.
- Erst messen, dann optimieren – bei kleinen Datenmengen zählt Lesbarkeit mehr als Big-O.
