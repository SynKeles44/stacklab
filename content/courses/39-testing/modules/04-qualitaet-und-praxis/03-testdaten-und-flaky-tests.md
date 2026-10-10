---
title: Testdaten, Factories und wackelige Tests
summary: Wie du Testdaten mit Factories lesbar erzeugst und warum Tests manchmal ohne Codeänderung rot werden – samt Ursachen und Gegenmitteln.
duration: 20
sources:
  - title: Laravel – Eloquent Factories
    url: https://laravel.com/docs/eloquent-factories
  - title: FakerPHP
    url: https://fakerphp.org/
  - title: Pest – CLI API Reference
    url: https://pestphp.com/docs/cli-api-reference
  - title: Playwright – Retries
    url: https://playwright.dev/docs/test-retries
  - title: Vitest – Fake Timers
    url: https://vitest.dev/guide/mocking/timers
quiz:
  - type: single
    question: "Ein Test erzeugt einen User mit 15 Feldern, prüft aber nur, ob gesperrte User sich nicht anmelden können. Was ist die beste Lösung?"
    options:
      - Alle 15 Felder im Test stehen lassen, damit alles sichtbar ist.
      - Eine Factory mit sinnvollen Standardwerten nutzen und im Test nur `blocked: true` überschreiben.
      - Den Test löschen.
    answer: 1
    explanation: Im Test soll nur stehen, was für diesen Fall wichtig ist. Alles andere liefert die Factory – so sieht man sofort, worum es geht.
  - type: match
    question: Ordne jeder Ursache für wackelige Tests das passende Gegenmittel zu.
    pairs:
      - { left: "Test hängt von der aktuellen Uhrzeit ab", right: "Uhr festsetzen (Fake-Timer, Clock-Interface)" }
      - { left: "Test nutzt Zufallswerte ohne Seed", right: "Seed setzen oder feste Werte nutzen" }
      - { left: "Test B braucht Daten, die Test A anlegt", right: "Jeder Test baut seine Daten selbst auf" }
      - { left: "E2E-Test wartet mit festen Sekunden", right: "Web-First-Assertions statt waitForTimeout" }
    explanation: Fast alle wackeligen Tests haben eine versteckte Abhängigkeit – von Zeit, Zufall, Reihenfolge oder Timing. Mach sie sichtbar und kontrollierbar.
  - type: multiple
    question: Mit welchen Befehlen kannst du einen Verdacht auf einen wackeligen Test überprüfen?
    options:
      - "./vendor/bin/pest --repeat=50"
      - "./vendor/bin/pest --random-order"
      - "npx playwright test --repeat-each=20"
      - "git commit --amend"
    answers: [0, 1, 2]
    explanation: Wiederholen deckt Zufall und Timing auf, eine zufällige Reihenfolge deckt Abhängigkeiten zwischen Tests auf.
  - type: cloze
    text: "Ein Test, der ohne Codeänderung mal grün und mal rot ist, heißt ___ Test. Playwright markiert einen Test als „flaky“, wenn er erst bei einer ___ grün wird."
    blanks:
      - [flaky, wackeliger, wackliger]
      - [Wiederholung, Wiederholungen, Retry]
    explanation: Wiederholungen (Retries) machen die CI grüner, beheben aber nichts. Ein als flaky markierter Test ist ein Auftrag, die Ursache zu finden.
tasks:
  - id: user-factory
    type: code
    language: js
    title: Baue eine User-Factory
    description: |
      Schreibe eine kleine Factory für Testdaten, wie sie in vielen Testsuiten steckt:

      1. `buildUser(overrides)` gibt ein neues Objekt mit Standardwerten zurück:
         `{ id, name: 'Test User', email: 'user<id>@example.com', role: 'customer', blocked: false }`.
      2. `id` ist eine fortlaufende Nummer: der erste User bekommt 1, der zweite 2 usw. Die E-Mail nutzt
         dieselbe Nummer – so ist jede Adresse eindeutig.
      3. Alle Felder aus `overrides` (optional) überschreiben die Standardwerte.
      4. `resetUsers()` setzt den Zähler zurück, sodass der nächste User wieder die `id` 1 hat.
    starter: |
      let nextId = 1

      function buildUser(overrides = {}) {
        // Standardwerte + overrides, Zähler hochzählen
      }

      function resetUsers() {
      }
    tests:
      - name: Standardwerte mit fortlaufender ID
        code: |
          resetUsers()
          assertDeepEqual(buildUser(), { id: 1, name: 'Test User', email: 'user1@example.com', role: 'customer', blocked: false })
          assertEqual(buildUser().email, 'user2@example.com')
      - name: overrides überschreiben einzelne Felder
        code: |
          resetUsers()
          const admin = buildUser({ role: 'admin', name: 'Ada' })
          assertEqual(admin.role, 'admin')
          assertEqual(admin.name, 'Ada')
          assertEqual(admin.blocked, false)
          assertEqual(admin.id, 1)
      - name: resetUsers startet wieder bei 1
        code: |
          buildUser()
          buildUser()
          resetUsers()
          assertEqual(buildUser().id, 1)
      - name: jeder Aufruf liefert ein neues Objekt
        code: |
          resetUsers()
          const a = buildUser()
          const b = buildUser()
          a.name = 'geändert'
          assertEqual(b.name, 'Test User')
          assertTrue(a.id !== b.id)
    hints:
      - "Merke dir die ID zuerst: `const id = nextId++`."
      - "Zusammenführen mit Spread: `` return { id, name: 'Test User', email: `user${id}@example.com`, role: 'customer', blocked: false, ...overrides } ``"
    solution: |
      let nextId = 1

      function buildUser(overrides = {}) {
        const id = nextId++
        return {
          id,
          name: 'Test User',
          email: `user${id}@example.com`,
          role: 'customer',
          blocked: false,
          ...overrides,
        }
      }

      function resetUsers() {
        nextId = 1
      }
  - id: flaky-diagnose
    type: steps
    title: Detektivarbeit an einem wackeligen Test
    description: In der CI schlägt ab und zu der Test „zeigt Lieferdatum an“ fehl – lokal ist er immer grün. Geh dem Fehler Schritt für Schritt nach.
    steps:
      - situation: Der Test ist in den letzten 50 CI-Läufen dreimal rot gewesen, ohne dass sich der Code geändert hat.
        question: Was ist der beste erste Schritt?
        options: ["Retries auf 5 hochsetzen und vergessen", "Den Test lokal oft wiederholen, z. B. mit --repeat=100", "Den Test löschen"]
        answer: 1
        explanation: Erst reproduzieren, dann verstehen. Mit vielen Wiederholungen wird aus „ab und zu“ oft ein zuverlässig reproduzierbarer Fehler.
      - situation: "Lokal bleibt er auch nach 100 Wiederholungen grün. In den CI-Protokollen siehst du: Die roten Läufe waren alle kurz nach Mitternacht (UTC)."
        question: Welche Ursache ist am wahrscheinlichsten?
        options: ["Der Test hängt von der aktuellen Uhrzeit oder Zeitzone ab", "Die CI hat zu wenig Speicher", "Ein Tippfehler im Testnamen"]
        answer: 0
        explanation: Fehler rund um Mitternacht, Monatswechsel oder Sommerzeit deuten fast immer auf echte Zeit im Test hin – etwa `new Date()` in Code oder Erwartung.
      - situation: "Der Code berechnet „Lieferung morgen“ mit `new Date()`, der Test erwartet das Datum ebenfalls mit `new Date()` – beide Aufrufe liegen Millisekunden auseinander."
        question: Wie machst du den Test deterministisch?
        options: ["Die Systemzeit im Test festsetzen, z. B. mit vi.setSystemTime", "Einen zweiten Test mit anderer Uhrzeit schreiben", "Den Test nur tagsüber ausführen"]
        answer: 0
        explanation: Mit einer festen Zeit (Fake-Timer oder ein hereingereichtes Clock-Objekt) liefert der Test immer dasselbe Ergebnis – und du kannst Mitternacht sogar gezielt testen.
      - situation: Der Test ist repariert. Ein zweiter wackeliger Test ist nur rot, wenn die Tests in zufälliger Reihenfolge laufen.
        question: Was verrät das?
        options: ["Er hängt von Daten oder Zustand ab, den ein anderer Test hinterlässt", "Er ist zu langsam", "Die Zufallsreihenfolge ist kaputt"]
        answer: 0
        explanation: Reihenfolge-Abhängigkeit heißt geteilter Zustand – globale Variablen, statische Eigenschaften, Datenbankzeilen. Jeder Test muss seine Ausgangslage selbst herstellen.
---
Zwei Probleme begegnen dir in jeder wachsenden Testsuite: Tests werden lang und unlesbar, weil sie
seitenweise Testdaten anlegen. Und manche Tests werden rot, obwohl niemand etwas geändert hat. Beides
hat mit der Ausgangslage deiner Tests zu tun – dem „Arrange“-Teil.

## Testdaten: nur zeigen, was zählt

Vergleiche diese zwei Tests:

```php
// unübersichtlich: Was ist hier wichtig?
$user = new User(id: 7, name: 'Ada', email: 'ada@example.com', role: 'customer',
    country: 'DE', newsletter: true, blocked: true, createdAt: new DateTimeImmutable('2026-01-01'));
expect($login->attempt($user))->toBeFalse();

// klar: Es geht um gesperrte User
$user = UserFactory::new(['blocked' => true]);
expect($login->attempt($user))->toBeFalse();
```

Eine [[test-factory|Factory]] erzeugt Objekte mit sinnvollen Standardwerten. Im Test überschreibst du
nur, was für **diesen** Fall zählt. Der Leser sieht sofort: Es geht um `blocked`.

Gute Factories

- liefern **gültige** Objekte mit neutralen Standardwerten,
- vergeben **eindeutige** Werte (fortlaufende IDs, `user1@example.com`, `user2@example.com`),
- erzeugen bei jedem Aufruf ein **neues** Objekt.

> [!MERKSATZ]
> Ein Testwert, der im Test steht, ist eine Aussage: „Das ist wichtig.“ Alles Unwichtige gehört in die
> Factory.

## Factories im Alltag

In Laravel ist das Muster eingebaut: [[factory|Model-Factories]] erzeugen Datenbankeinträge.

```php
$user = User::factory()->create(['blocked' => true]);
$orders = Order::factory()->count(3)->for($user)->create();
```

Für realistische Zufallswerte nutzen Factories oft [[faker|Faker]] – in PHP das Paket `fakerphp/faker`,
in JavaScript `@faker-js/faker`:

```php
$faker = Faker\Factory::create('de_DE');
$faker->seed(42);              // gleicher Seed = gleiche Werte bei jedem Lauf
$name = $faker->name();
$email = $faker->unique()->safeEmail();   // Adressen unter example.org und Co.
```

> [!ACHTUNG]
> Zufallsdaten ohne Seed machen Tests unvorhersehbar. Ein Name mit Apostroph oder ein Datum am 29. Februar
> kann dann einmal im Monat einen Test sprengen – und niemand kann es nachstellen.

Für Datenbanktests gilt: Jeder Test baut seine Daten selbst auf und räumt danach auf, z. B. indem er in
einer Transaktion läuft, die am Ende zurückgerollt wird. [[seed-daten|Seed-Daten]] für die ganze Suite
sind bequem, koppeln aber Tests aneinander.

## Wackelige Tests verstehen

Ein [[flaky-test|wackeliger Test]] (englisch *flaky test*) ist mal grün und mal rot – bei identischem Code.
Er ist gefährlich, weil das Team lernt, rote Tests zu ignorieren („ach, der schon wieder“).

| Ursache | Beispiel |
|---|---|
| Zeit | `new Date()`, Mitternacht, Zeitzone, Sommerzeit |
| Zufall | Zufallswerte ohne Seed, `shuffle()` |
| Reihenfolge | Test B braucht Daten von Test A, statische Variablen |
| Timing | feste Wartezeiten, [[race-condition\|Race Conditions]] in asynchronem Code |
| Umgebung | echtes Netzwerk, fremde APIs, parallele Tests auf derselben Datenbank |

Fast immer steckt eine versteckte Abhängigkeit dahinter, die der Test nicht kontrolliert.

Besonders tückisch sind parallele Testläufe (`pest --parallel`, Vitest und Playwright arbeiten ohnehin
parallel): Zwei Tests, die gleichzeitig denselben Datensatz, dieselbe Datei oder denselben Port nutzen,
stören sich gegenseitig. Eindeutige Testdaten aus einer Factory und eigene Datenbanken oder Transaktionen
pro Prozess verhindern das.

## Wackler finden und beheben

Zuerst reproduzierst du den Fehler:

```bash
./vendor/bin/pest --repeat=100              # jeden Test 100-mal
./vendor/bin/pest --random-order            # zufällige Reihenfolge
npx vitest run --repeats=50                 # Vitest: jeden Test wiederholen
npx playwright test --repeat-each=20        # Playwright
```

Dann machst du die versteckte Abhängigkeit kontrollierbar: Zeit über Fake-Timer oder ein hereingereichtes
Uhr-Objekt, Zufall über einen Seed, Netzwerk über Test-Doubles, Wartezeiten über Web-First-Assertions.

> [!FEHLER]
> **Retries als Lösung.** `retries: 3` in Playwright oder `--retry` in Vitest macht die Pipeline grün, aber
> der Fehler bleibt – manchmal ist es sogar ein echter Bug, der nur selten auftritt. Retries sind ein
> Pflaster, kein Heilmittel.

> [!PRAXIS]
> Viele Teams haben eine klare Regel: Ein als „flaky“ markierter Test bekommt sofort ein Ticket. Kann er
> nicht schnell repariert werden, wird er sichtbar in Quarantäne gesetzt (z. B. mit `->skip('Ticket …')`)
> – aber nie still ignoriert.

## Zusammenfassung

- Factories liefern gültige Objekte mit Standardwerten; im Test steht nur, was für den Fall zählt.
- Fortlaufende IDs und eindeutige E-Mails verhindern Kollisionen zwischen Tests.
- Faker liefert realistische Werte – mit Seed bleiben sie reproduzierbar.
- Wackelige Tests haben versteckte Abhängigkeiten: Zeit, Zufall, Reihenfolge, Timing, Umgebung.
- Reproduziere mit `--repeat`, `--random-order` oder `--repeat-each`, dann mach die Abhängigkeit kontrollierbar.
- Retries verdecken das Problem nur – behebe die Ursache.
