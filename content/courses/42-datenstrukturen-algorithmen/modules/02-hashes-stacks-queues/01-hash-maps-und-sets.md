---
title: Hash-Maps und Sets
summary: Warum Map, Set und PHP-Arrays einen Wert in konstanter Zeit finden, was eine Hash-Funktion damit zu tun hat und welche Alltagsmuster du damit löst.
duration: 25
sources:
  - title: MDN – Map
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
  - title: MDN – Set
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
  - title: PHP-Handbuch – Arrays
    url: https://www.php.net/manual/de/language.types.array.php
  - title: PHP-Handbuch – array_flip
    url: https://www.php.net/manual/de/function.array-flip.php
quiz:
  - type: single
    question: Warum findet `map.get(schluessel)` einen Wert so schnell?
    options:
      - Weil die Map alle Einträge sortiert und dann binär sucht.
      - Weil eine Hash-Funktion aus dem Schlüssel direkt das Fach berechnet, in dem der Eintrag liegt.
      - Weil die Map alle Einträge im Prozessor-Cache hält.
      - Weil JavaScript Maps immer nur 100 Einträge haben dürfen.
    answer: 1
    explanation: >
      Die Hash-Funktion rechnet den Schlüssel in eine Fachnummer um. Statt alle Einträge zu durchsuchen,
      schaut die Map nur in dieses eine Fach – im Durchschnitt O(1).
  - type: multiple
    question: Welche Aussagen über `Map` und `Set` in JavaScript stimmen?
    options:
      - Eine Map kann beliebige Werte als Schlüssel haben, auch Objekte.
      - Ein Set speichert jeden Wert höchstens einmal.
      - Zwei verschiedene Objekte mit gleichem Inhalt gelten in einem Set als derselbe Wert.
      - Map und Set merken sich die Einfügereihenfolge.
      - "`map.size` muss erst durch Zählen aller Einträge berechnet werden."
    answers: [0, 1, 3]
    explanation: >
      Objekte werden über ihre Referenz verglichen, nicht über ihren Inhalt: `{ id: 1 }` und ein zweites
      `{ id: 1 }` sind zwei verschiedene Einträge. `size` ist ein gespeicherter Wert.
  - type: cloze
    text: "In PHP prüft `in_array($wert, $liste)` jedes Element und ist O(___). `isset($liste[$schluessel])` schaut direkt im Hash nach und ist O(___)."
    blanks:
      - ["n"]
      - ["1"]
    explanation: Mit `array_flip()` machst du Werte zu Schlüsseln und kannst danach mit `isset()` in konstanter Zeit nachschlagen.
  - type: find-bug
    question: "`zaehle()` soll zählen, wie oft jedes Wort vorkommt. In welcher Zeile steckt der Fehler?"
    language: js
    code: |
      function zaehle(woerter) {
        const anzahl = new Map();
        for (const wort of woerter) {
          anzahl.set(wort, anzahl.get(wort) + 1);
        }
        return anzahl;
      }
    bug_line: 4
    explanation: >
      Beim ersten Vorkommen liefert `anzahl.get(wort)` `undefined`, und `undefined + 1` ist `NaN`.
      Richtig: `anzahl.set(wort, (anzahl.get(wort) ?? 0) + 1)`.
  - type: match
    question: Ordne jedem Alltagsproblem die passende Struktur zu.
    pairs:
      - { left: "Doppelte E-Mail-Adressen entfernen", right: "Set" }
      - { left: "Zu jeder Benutzer-ID den Datensatz nachschlagen", right: "Map" }
      - { left: "Zählen, wie oft jeder Statuscode vorkommt", right: "Map mit Zähler als Wert" }
      - { left: "Prüfen, ob ein Tag bereits vergeben ist", right: "Set mit has()" }
    explanation: Ein Set beantwortet „Gibt es das schon?“, eine Map zusätzlich „Und was gehört dazu?“.
tasks:
  - id: zaehlen-und-wiederholen
    type: code
    language: ts
    title: Zählen und die erste Wiederholung finden
    description: |
      Schreibe zwei Funktionen, die jeweils mit **einem** Durchlauf über die Eingabe auskommen (O(n)):

      1. `zaehle(woerter: string[]): Map<string, number>` liefert zu jedem Wort, wie oft es vorkommt.
         Groß- und Kleinschreibung zählen als **gleich**, der Schlüssel ist das kleingeschriebene Wort.
      2. `ersteWiederholung<T>(werte: T[]): T | undefined` liefert den ersten Wert, der zum zweiten Mal
         auftaucht – oder `undefined`, wenn sich nichts wiederholt.

      Verwende keine verschachtelten Schleifen und kein `includes`/`indexOf`.
    starter: |
      function zaehle(woerter: string[]): Map<string, number> {
        const anzahl = new Map<string, number>();
        return anzahl;
      }

      function ersteWiederholung<T>(werte: T[]): T | undefined {
        return undefined;
      }
    tests:
      - name: zählt Wörter ohne Rücksicht auf Groß- und Kleinschreibung
        code: |
          const m = zaehle(["Map", "set", "map", "MAP", "Set"]);
          assertEqual(m.get("map"), 3);
          assertEqual(m.get("set"), 2);
          assertEqual(m.size, 2);
      - name: leere Eingaben
        code: |
          assertEqual(zaehle([]).size, 0);
          assertEqual(ersteWiederholung([]), undefined);
      - name: erste Wiederholung, nicht erster Wert
        code: |
          assertEqual(ersteWiederholung([3, 1, 4, 1, 3]), 1);
          assertEqual(ersteWiederholung(["a", "b", "c"]), undefined);
      - name: auch 0 und leere Strings werden erkannt
        code: |
          assertEqual(ersteWiederholung([5, 0, 0]), 0);
          assertEqual(ersteWiederholung(["x", "", ""]), "");
      - name: 200 000 Werte in unter 200 ms
        code: |
          const werte = Array.from({ length: 200000 }, (_, i) => i);
          werte.push(199999);
          const start = performance.now();
          assertEqual(ersteWiederholung(werte), 199999);
          assertTrue(performance.now() - start < 200, "zu langsam – nutzt du ein Set?");
    hints:
      - "Für `zaehle`: `const w = wort.toLowerCase(); anzahl.set(w, (anzahl.get(w) ?? 0) + 1);`"
      - "Für `ersteWiederholung`: Merke dir bereits gesehene Werte in einem `Set<T>`."
      - "Prüfe mit `gesehen.has(wert)`, nicht mit einer Wahrheitsprüfung des Werts – sonst scheitern `0` und `\"\"`."
    solution: |
      function zaehle(woerter: string[]): Map<string, number> {
        const anzahl = new Map<string, number>();
        for (const wort of woerter) {
          const w = wort.toLowerCase();
          anzahl.set(w, (anzahl.get(w) ?? 0) + 1);
        }
        return anzahl;
      }

      function ersteWiederholung<T>(werte: T[]): T | undefined {
        const gesehen = new Set<T>();
        for (const wert of werte) {
          if (gesehen.has(wert)) return wert;
          gesehen.add(wert);
        }
        return undefined;
      }
  - id: php-isset-statt-in-array
    type: terminal
    title: PHP-Abgleich von O(n²) auf O(n)
    description: |
      `abgleich.php` zählt, wie viele angefragte IDs in einer Liste bekannter IDs vorkommen. Das Skript
      nutzt `in_array()` in einer Schleife – und ist entsprechend langsam.

      Klicke zuerst auf **Aufgabe vorbereiten**. Dann:

      1. Führe `time php abgleich.php` aus und merke dir die Zeit.
      2. Baue `abgleich.php` so um, dass es ohne `in_array()` auskommt: Mache mit `array_flip()` aus den
         bekannten IDs die **Schlüssel** eines Arrays und prüfe mit `isset()`.
      3. Führe `time php abgleich.php` erneut aus. Die Ausgabe `Treffer: 20000` muss gleich bleiben.
    workdir: php-abgleich
    setup: |
      cat > daten.php <<'EOF'
      <?php
      // 40 000 bekannte IDs (gerade Zahlen) und 40 000 Anfragen (jede zweite ist bekannt)
      $bekannt = range(0, 79998, 2);
      $anfragen = range(0, 39999);
      shuffle($bekannt);
      EOF
      cat > abgleich.php <<'EOF'
      <?php
      require __DIR__ . '/daten.php';

      $treffer = 0;
      foreach ($anfragen as $id) {
          if (in_array($id, $bekannt, true)) {
              $treffer++;
          }
      }

      echo "Treffer: {$treffer}\n";
      EOF
    checks:
      - type: command
        run: "! grep -q 'in_array' abgleich.php"
        message: In abgleich.php steht noch in_array() – genau das ist die versteckte Schleife.
      - type: file_contains
        path: abgleich.php
        pattern: "isset\\s*\\(|array_key_exists\\s*\\("
        message: Prüfe die Anfragen mit isset() (oder array_key_exists()) gegen die Schlüssel eines Arrays.
      - type: command
        run: timeout 10 php abgleich.php
        stdout_matches: "^Treffer: 20000\\s*$"
        message: "abgleich.php soll weiterhin genau `Treffer: 20000` ausgeben. Hast du array_flip() auf $bekannt angewendet?"
      - type: file_contains
        path: daten.php
        pattern: "range\\(0, 79998, 2\\)"
        message: daten.php sollte unverändert bleiben – klicke notfalls auf Aufgabe vorbereiten.
    hints:
      - "`$index = array_flip($bekannt);` macht aus `[0 => 42, 1 => 8]` das Array `[42 => 0, 8 => 1]`."
      - "In der Schleife reicht dann `if (isset($index[$id])) { $treffer++; }`."
      - "Mit `time php abgleich.php` siehst du den Unterschied: aus Sekunden werden Millisekunden."
    solution: |
      ```php
      <?php
      require __DIR__ . '/daten.php';

      $index = array_flip($bekannt);
      $treffer = 0;
      foreach ($anfragen as $id) {
          if (isset($index[$id])) {
              $treffer++;
          }
      }

      echo "Treffer: {$treffer}\n";
      ```
---
In der Theatergarderobe gibst du deine Jacke ab und bekommst die Marke 317. Später sucht niemand alle
Jacken durch – die Mitarbeiterin geht direkt zu Haken 317. Genau so arbeiten
[[hash-tabelle|Hash-Tabellen]]: Aus dem Schlüssel wird direkt der Platz berechnet. Hinter `Map` und `Set` in
JavaScript und hinter jedem PHP-Array steckt dieses Prinzip.

## Aus dem Schlüssel wird ein Fach

Eine Hash-Tabelle besteht intern aus einem Array von Fächern (englisch *Buckets*). Eine
[[hash-funktion|Hash-Funktion]] macht aus einem Schlüssel eine Zahl, die Fachnummer.

```js
// stark vereinfachte Hash-Funktion für Strings
function fachNummer(schluessel, anzahlFaecher) {
  let hash = 0;
  for (const zeichen of schluessel) {
    hash = (hash * 31 + zeichen.charCodeAt(0)) % anzahlFaecher;
  }
  return hash;
}
fachNummer("ada", 8); // immer dieselbe Zahl für denselben Schlüssel
```

![Eine Hash-Tabelle verteilt Schlüssel auf Fächer](/assets/datenstrukturen-algorithmen/hash-tabelle.svg)

Zum Speichern berechnest du das Fach und legst den Eintrag ab. Zum Suchen berechnest du dasselbe Fach
und schaust nur dort nach. Die Anzahl der übrigen Einträge spielt keine Rolle.

> [!MERKSATZ]
> Hash-Tabellen tauschen Ordnung gegen Geschwindigkeit: Suchen, Einfügen und Löschen kosten im
> Durchschnitt **O(1)**.

## Kollisionen – und warum es trotzdem schnell bleibt

Manchmal landen zwei Schlüssel im selben Fach. Das heißt [[hash-kollision|Kollision]]. Die Tabelle legt
dann mehrere Einträge in dasselbe Fach und vergleicht beim Suchen nur diese wenigen.

Damit Fächer nicht überlaufen, wächst die Tabelle automatisch: Wird sie zu voll, legt sie doppelt so
viele Fächer an und verteilt alles neu. Das kostet einmal O(n), passiert aber selten – im Mittel
bleibt es bei O(1).

| Fall | Aufwand |
|---|---|
| Durchschnitt (gute Hash-Funktion) | O(1) |
| Schlechtester Fall (alles in einem Fach) | O(n) |

Den schlechtesten Fall verhindern die eingebauten Hash-Funktionen von JavaScript-Engines und PHP für
dich. Selbst bauen musst du das nie.

## Map und Set in JavaScript

[[js-map|Map]] speichert Schlüssel-Wert-Paare, [[js-set|Set]] nur Werte – jeden höchstens einmal.

| Aufgabe | Map | Set |
|---|---|---|
| anlegen | `new Map([["a", 1]])` | `new Set([1, 2])` |
| speichern | `map.set(k, v)` | `set.add(v)` |
| prüfen | `map.has(k)` | `set.has(v)` |
| lesen | `map.get(k)` | – |
| löschen | `map.delete(k)` | `set.delete(v)` |
| Anzahl | `map.size` | `set.size` |

Im Unterschied zu einem normalen [[objekt|Objekt]] darf der Schlüssel einer Map jeder Typ sein – Zahl,
Objekt, sogar eine Funktion. Objektschlüssel werden zu Strings: `obj[1]` und `obj["1"]` sind dasselbe.

> [!FEHLER]
> `new Set([{ id: 1 }, { id: 1 }]).size` ist **2**. Objekte werden über ihre [[referenz|Referenz]]
> verglichen, nicht über ihren Inhalt. Nutze die ID als Schlüssel: `new Set(liste.map((x) => x.id))`.

## Typische Muster

Drei Muster löst du ab jetzt immer mit einer Map oder einem Set:

```js
// 1. Duplikate entfernen – O(n)
const eindeutig = [...new Set(emails)];

// 2. Nachschlagetabelle statt find() in der Schleife – O(n)
const nachId = new Map(nutzer.map((u) => [u.id, u]));
const autor = nachId.get(beitrag.autorId);

// 3. Zählen und Gruppieren – O(n)
const proStatus = new Map();
for (const r of antworten) {
  proStatus.set(r.status, (proStatus.get(r.status) ?? 0) + 1);
}
```

Für das Gruppieren gibt es inzwischen auch
[`Map.groupBy()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/groupBy).

## PHP-Arrays sind Hash-Tabellen

In PHP ist jedes Array intern eine geordnete Hash-Tabelle – auch eine einfache Liste ist ein
[[assoziatives-array|assoziatives Array]] mit den Schlüsseln 0, 1, 2 … Entscheidend ist, **wo** du
suchst:

```php
$ids = [17, 42, 8];
in_array(42, $ids, true);    // O(n): durchsucht die Werte
$index = array_flip($ids);   // [17 => 0, 42 => 1, 8 => 2]
isset($index[42]);           // O(1): Schlüssel-Zugriff über den Hash
```

> [!PRAXIS]
> Ein Klassiker in Code-Reviews: `in_array()` oder `array_search()` in einer `foreach`-Schleife über
> Tausende Datensätze. Einmal `array_flip()` vorab, danach `isset()` – und aus Sekunden werden
> Millisekunden.

## Zusammenfassung

- Eine Hash-Tabelle berechnet mit einer Hash-Funktion aus dem Schlüssel das Fach, in dem der Eintrag liegt.
- Suchen, Einfügen und Löschen sind im Durchschnitt O(1); Kollisionen und Vergrößern ändern daran wenig.
- `Map` speichert Schlüssel-Wert-Paare mit beliebigen Schlüsseltypen, `Set` eindeutige Werte.
- Objekte werden in Map und Set über ihre Referenz verglichen, nicht über ihren Inhalt.
- Duplikate entfernen, nachschlagen und zählen sind die drei Standardmuster.
- PHP-Arrays sind Hash-Tabellen: `isset($a[$k])` ist O(1), `in_array()` ist O(n).
