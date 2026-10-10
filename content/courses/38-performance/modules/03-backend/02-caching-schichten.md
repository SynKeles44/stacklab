---
title: Caching-Schichten
summary: Welche Caches zwischen Browser und Datenbank liegen, wie das Cache-Aside-Muster funktioniert und wie du mit TTL, Invalidierung und Cache Stampedes umgehst.
duration: 25
sources:
  - title: Laravel – Cache
    url: https://laravel.com/docs/13.x/cache
  - title: MDN – HTTP caching (private und shared caches)
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching
  - title: Redis – Caching
    url: https://redis.io/docs/latest/develop/use-cases/caching/
  - title: PHP-Handbuch – APCu
    url: https://www.php.net/manual/de/book.apcu.php
quiz:
  - type: single
    question: Was passiert beim Cache-Aside-Muster, wenn ein Schlüssel nicht im Cache liegt?
    options:
      - Die Anwendung gibt einen Fehler zurück.
      - Die Anwendung lädt den Wert aus der Datenbank, legt ihn mit einer TTL in den Cache und gibt ihn zurück.
      - Der Cache fragt selbstständig die Datenbank.
      - Die Anwendung wartet, bis ein anderer Request den Wert eingetragen hat.
    answer: 1
    explanation: >
      Bei Cache-Aside ist die Anwendung verantwortlich: erst im Cache nachsehen, bei einem Fehlschlag die Quelle fragen und
      das Ergebnis für spätere Anfragen ablegen. `Cache::remember()` in Laravel macht genau das.
  - type: multiple
    question: Welche Daten sind gute Kandidaten für einen Cache?
    options:
      - Die Liste der Produktkategorien, die sich einmal pro Woche ändert
      - Ein aufwendig berechneter Monatsbericht
      - Der aktuelle Kontostand direkt vor einer Überweisung
      - Das Ergebnis eines langsamen Aufrufs einer externen Wechselkurs-API
    answers: [0, 1, 3]
    explanation: Gut cachebar ist, was oft gelesen, selten geändert und teuer berechnet wird. Beim Kontostand vor einer Überweisung zählt der exakte, aktuelle Wert.
  - type: match
    question: Ordne jedem Begriff die passende Beschreibung zu.
    pairs:
      - { left: "TTL", right: "Wie lange ein Eintrag gültig bleibt" }
      - { left: "Invalidierung", right: "Einen Eintrag gezielt entfernen, weil sich die Daten geändert haben" }
      - { left: "Cache Stampede", right: "Viele Anfragen berechnen gleichzeitig denselben abgelaufenen Wert neu" }
      - { left: "Memoisierung", right: "Ergebnis innerhalb eines Prozesses im Arbeitsspeicher merken" }
    explanation: TTL und Invalidierung entscheiden, wie aktuell die Daten sind. Gegen Stampedes helfen Sperren oder Stale-While-Revalidate.
  - type: find-bug
    question: Dieser Code cacht die Startseite für eingeloggte Nutzer:innen. Welche Zeile ist gefährlich?
    language: php
    code: |
      public function dashboard(Request $request): View
      {
          $data = Cache::remember('dashboard', 300, function () use ($request) {
              return $this->stats->forUser($request->user());
          });

          return view('dashboard', ['data' => $data]);
      }
    bug_line: 3
    explanation: >
      Der Schlüssel `dashboard` ist für alle gleich. Wer zuerst kommt, füllt den Cache – alle anderen sehen fünf Minuten lang
      seine Daten. Persönliche Daten brauchen die Nutzer-ID im Schlüssel, z. B. `"dashboard:{$user->id}"`.
tasks:
  - id: ttl-cache
    type: code
    language: js
    title: Ein Cache mit TTL nach dem Cache-Aside-Muster
    description: |
      Schreibe `createCache(ttlMs, now)`. Sie gibt ein Objekt mit drei Bestandteilen zurück:

      - `get(key, loader)` – liefert den gespeicherten Wert, solange er jünger als `ttlMs` Millisekunden ist (Treffer).
        Sonst ruft sie `loader()` auf, speichert das Ergebnis mit Ablaufzeit und gibt es zurück (Fehlschlag).
      - `forget(key)` – entfernt einen Eintrag (Invalidierung).
      - `stats` – ein Objekt `{ hits, misses }`, das Treffer und Fehlschläge zählt.

      `now` ist eine Funktion, die die aktuelle Zeit in Millisekunden liefert. In den Tests wird eine falsche Uhr übergeben,
      damit sich der Ablauf prüfen lässt. Ein Eintrag ist genau bei `jetzt >= gespeichertUm + ttlMs` abgelaufen.
    starter: |
      function createCache(ttlMs, now = () => Date.now()) {
        const entries = new Map();
        const stats = { hits: 0, misses: 0 };

        return {
          stats,
          get(key, loader) {
          },
          forget(key) {
          },
        };
      }
    tests:
      - name: zweiter Aufruf ist ein Treffer
        code: |
          let t = 0;
          const cache = createCache(1000, () => t);
          let calls = 0;
          const load = () => { calls++; return 'Kategorien'; };
          assertEqual(cache.get('cats', load), 'Kategorien');
          assertEqual(cache.get('cats', load), 'Kategorien');
          assertEqual(calls, 1);
          assertDeepEqual(cache.stats, { hits: 1, misses: 1 });
      - name: nach Ablauf der TTL wird neu geladen
        code: |
          let t = 0;
          const cache = createCache(1000, () => t);
          let version = 1;
          cache.get('kurs', () => version);
          version = 2;
          t = 999;
          assertEqual(cache.get('kurs', () => version), 1);
          t = 1000;
          assertEqual(cache.get('kurs', () => version), 2);
      - name: forget invalidiert
        code: |
          let t = 0;
          const cache = createCache(60000, () => t);
          cache.get('a', () => 'alt');
          cache.forget('a');
          assertEqual(cache.get('a', () => 'neu'), 'neu');
          assertEqual(cache.stats.misses, 2);
      - name: falsy Werte werden auch gecacht
        code: |
          let t = 0;
          const cache = createCache(1000, () => t);
          let calls = 0;
          cache.get('leer', () => { calls++; return 0; });
          assertEqual(cache.get('leer', () => { calls++; return 0; }), 0);
          assertEqual(calls, 1);
    hints:
      - "Speichere pro Schlüssel ein Objekt `{ value, expiresAt }` mit `expiresAt = now() + ttlMs`."
      - "Prüfe mit `entries.has(key)` statt mit `if (value)` – sonst wird `0` oder `''` nie gecacht."
      - "`forget` ist nur `entries.delete(key)`."
    solution: |
      function createCache(ttlMs, now = () => Date.now()) {
        const entries = new Map();
        const stats = { hits: 0, misses: 0 };

        return {
          stats,
          get(key, loader) {
            const entry = entries.get(key);
            if (entry !== undefined && now() < entry.expiresAt) {
              stats.hits++;
              return entry.value;
            }
            stats.misses++;
            const value = loader();
            entries.set(key, { value, expiresAt: now() + ttlMs });
            return value;
          },
          forget(key) {
            entries.delete(key);
          },
        };
      }
  - id: cache-weg
    type: order
    title: Der Weg einer Anfrage durch die Caches
    description: Eine Besucherin ruft die Kategorie-Seite auf. Nirgends liegt eine gültige Kopie. Bring die Stationen in die richtige Reihenfolge.
    items:
      - Der Browser findet keine frische Kopie im eigenen Cache.
      - Das CDN hat die Seite nicht und fragt den Ursprungsserver.
      - Der Reverse Proxy hat keine Kopie und reicht die Anfrage an die Anwendung weiter.
      - Die Anwendung findet den Schlüssel nicht in Redis.
      - Die Anwendung fragt die Datenbank und legt das Ergebnis in Redis ab.
      - Die Antwort wandert zurück, jede Schicht speichert sie gemäß Cache-Control.
---
„Mach doch einen Cache davor“ ist der Klassiker unter den Performance-Tipps. Ein [[cache|Cache]] kann eine Anfrage
von 500 ms auf 1 ms bringen – oder dafür sorgen, dass Kund:innen veraltete Preise oder sogar fremde Daten sehen.
In dieser Lektion lernst du, **wo** du cachen kannst und wie du es sicher machst.

## Die Schichten zwischen Browser und Datenbank

![Caching-Schichten von Browser über CDN, Reverse Proxy und App-Cache bis zur Datenbank](/assets/performance/caching-schichten.svg)

| Schicht | Was liegt dort? | Gesteuert durch |
|---|---|---|
| Browser | Dateien, API-Antworten | `Cache-Control`-Header |
| [[cdn|CDN]] | Statische Dateien, öffentliche Seiten | `Cache-Control`, CDN-Regeln |
| [[reverse-proxy|Reverse Proxy]] | Ganze HTTP-Antworten | z. B. nginx `proxy_cache` |
| Anwendung | Berechnete Werte, Abfrageergebnisse | Code, z. B. [[redis|Redis]] oder APCu |
| Prozess | Werte innerhalb einer Anfrage | [[memoisierung|Memoisierung]] |

Je weiter vorne ein Treffer landet, desto weniger Arbeit macht der Rest. Aber je weiter vorne, desto **weniger**
weiß die Schicht über die Person: Ein CDN kennt keine Sessions.

> [!MERKSATZ]
> Persönliche Daten nie in geteilten Caches. Antworten mit Nutzerdaten bekommen `Cache-Control: private` oder `no-store`.

## Cache-Aside: das Standardmuster

Im Anwendungscode nutzt du fast immer [[cache-aside|Cache-Aside]] (auch „lazy loading“):

1. Im Cache nachsehen.
2. **Treffer:** Wert zurückgeben.
3. **Fehlschlag:** Wert aus der Quelle laden, mit einer [[ttl|TTL]] ablegen, zurückgeben.

```php title="Cache-Aside in Laravel"
$categories = Cache::remember('categories:all', 600, function () {
    return Category::query()->orderBy('name')->get();
});
```

`Cache::remember()` erledigt alle drei Schritte. Als Speicher dient meist Redis – ein eigenständiger, sehr
schneller Schlüssel-Wert-Speicher im [[arbeitsspeicher|Arbeitsspeicher]], den alle Server einer Anwendung teilen.

Der Schlüssel muss alles enthalten, wovon das Ergebnis abhängt: `products:category:7:page:2`, bei persönlichen
Daten auch die Nutzer-ID.

## Invalidierung: wann ist ein Eintrag falsch?

Ein Cache zeigt eine Kopie. Ändert sich das Original, ist die Kopie veraltet. Zwei Strategien:

| Strategie | Wie | Passt für |
|---|---|---|
| **Ablaufen lassen** (TTL) | Eintrag gilt z. B. 10 Minuten | Daten, die kurz veraltet sein dürfen |
| **Aktiv löschen** ([[cache-invalidierung|Invalidierung]]) | Beim Speichern `Cache::forget('categories:all')` | Daten, die sofort stimmen müssen |

```php title="Beim Ändern invalidieren"
public function update(UpdateCategoryRequest $request, Category $category): RedirectResponse
{
    $category->update($request->validated());
    Cache::forget('categories:all');

    return to_route('categories.index');
}
```

> [!FEHLER]
> Ein Cache ohne TTL und ohne Invalidierung zeigt veraltete Daten für immer. Jeder Eintrag braucht eine Antwort auf
> die Frage: „Wann wird er ungültig?“

## Cache Stampede und Memoisierung

Läuft ein beliebter Eintrag ab, bemerken das hundert gleichzeitige Anfragen – und **alle** berechnen ihn neu. Diese
[[cache-stampede|Cache Stampede]] kann die Datenbank genau im falschen Moment überlasten. Gegenmittel:

- **Sperre:** Nur eine Anfrage berechnet neu, die anderen warten kurz (`Cache::lock()`).
- **Stale-While-Revalidate:** Den alten Wert noch kurz ausliefern und im Hintergrund erneuern –
  `Cache::flexible('stats', [300, 600], fn () => …)`.
- **Zufällige TTLs**, damit nicht alle Einträge gleichzeitig ablaufen.

Die kleinste Schicht ist die **Memoisierung**: Innerhalb einer Anfrage merkst du dir ein Ergebnis in einer Variablen,
statt dieselbe Abfrage fünfmal zu stellen.

> [!PRAXIS]
> Bevor du cachest, prüf, ob die Abfrage nicht einfach langsam gebaut ist (N+1, fehlender Index). Ein Cache vor einer
> schlechten Abfrage versteckt das Problem nur – bis der Cache leer ist, etwa nach einem Deployment.

## Zusammenfassung

- Caches gibt es auf vielen Ebenen: Browser, CDN, Reverse Proxy, Anwendung (Redis), Prozess.
- Persönliche Daten nie in geteilte Caches; der Cache-Schlüssel enthält alles, wovon das Ergebnis abhängt.
- **Cache-Aside:** nachsehen, bei Fehlschlag laden und mit TTL ablegen (`Cache::remember`).
- Jeder Eintrag braucht eine **TTL** oder eine aktive **Invalidierung**.
- Gegen **Cache Stampedes** helfen Sperren, Stale-While-Revalidate und gestreute TTLs.
