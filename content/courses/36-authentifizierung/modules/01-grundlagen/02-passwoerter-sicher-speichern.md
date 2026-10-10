---
title: Passwörter sicher speichern
summary: Warum Passwörter nie im Klartext oder mit SHA-256 gespeichert werden, was Salt und langsame Hashes leisten und wie du Argon2id und bcrypt in PHP und Laravel nutzt.
duration: 25
sources:
  - title: OWASP Password Storage Cheat Sheet
    url: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
  - title: PHP-Handbuch – password_hash()
    url: https://www.php.net/manual/de/function.password-hash.php
  - title: PHP-Handbuch – password_needs_rehash()
    url: https://www.php.net/manual/de/function.password-needs-rehash.php
  - title: Laravel 13 – Hashing
    url: https://laravel.com/docs/13.x/hashing
quiz:
  - type: single
    question: Warum ist SHA-256 für Passwörter ungeeignet, obwohl es ein sicherer Hash ist?
    options:
      - SHA-256 ist umkehrbar.
      - SHA-256 ist extrem schnell – Angreifer können Milliarden Kandidaten pro Sekunde durchprobieren.
      - SHA-256 erzeugt zu kurze Hashes.
      - SHA-256 ist in PHP nicht verfügbar.
    answer: 1
    explanation: >
      Für Prüfsummen ist Geschwindigkeit gut, für Passwörter schlecht. Passwort-Hashes wie Argon2id und bcrypt
      sind absichtlich langsam und speicherhungrig, damit massenhaftes Raten teuer wird.
  - type: multiple
    question: Was steht alles im String, den `password_hash()` zurückgibt?
    options:
      - Der Name des Algorithmus
      - Die Parameter (z. B. Kosten oder Speicherbedarf)
      - Das Salt
      - Das Passwort, verschlüsselt
    answers: [0, 1, 2]
    explanation: >
      Der Hash-String ist selbstbeschreibend, z. B. `$argon2id$v=19$m=65536,t=4,p=1$<salt>$<hash>`. Darum
      braucht `password_verify()` nur Passwort und Hash. Das Passwort selbst steckt nicht darin – auch nicht
      verschlüsselt.
  - type: find-bug
    question: In welcher Zeile steckt die Sicherheitslücke?
    language: php
    code: |
      <?php
      function anmelden(array $user, string $passwort): bool
      {
          $hash = hash('sha256', $passwort);

          return $hash === $user['password_hash'];
      }
    bug_line: 4
    explanation: >
      Ein schneller Hash ohne Salt. Gleiche Passwörter ergeben gleiche Hashes, und Angreifer probieren
      Milliarden Kandidaten pro Sekunde. Richtig: `password_hash()` beim Speichern und `password_verify()` beim Prüfen.
  - type: cloze
    text: "Eine zufällige Zeichenfolge, die vor dem Hashen pro Passwort hinzugefügt wird, heißt ___. Ein geheimer Wert für alle Passwörter, der getrennt von der Datenbank liegt, heißt ___."
    blanks:
      - [Salt, Salz]
      - [Pepper, Pfeffer]
    explanation: Das Salt liegt im Hash-String und macht gleiche Passwörter unterschiedlich. Der Pepper ist ein zusätzliches Geheimnis außerhalb der Datenbank.
tasks:
  - id: klartext-migrieren
    type: terminal
    title: Klartext-Passwörter retten
    description: |
      Ein Altsystem hat Passwörter im Klartext in `nutzer.json` gespeichert – ein Albtraum. Schreibe ein
      PHP-Skript, das daraus sichere Hashes macht.

      Klicke zuerst auf **Aufgabe vorbereiten**, dann:

      1. Schau dir die Datei an: `cat nutzer.json`. Zwei Personen haben dasselbe Passwort.
      2. Lege `migriere.php` an. Es liest `nutzer.json` und schreibt `nutzer-sicher.json` – eine Liste in
         **derselben Reihenfolge** mit den Feldern `email` und `hash`. Den Hash erzeugst du mit
         `password_hash($passwort, PASSWORD_ARGON2ID)`. Ein Feld `passwort` darf es dort nicht mehr geben.
      3. Führe das Skript aus: `php migriere.php`.
      4. Vergleiche die Hashes der beiden Personen mit gleichem Passwort: `jq -r '.[].hash' nutzer-sicher.json`.
    workdir: hash-labor
    setup: |
      cat > nutzer.json <<'EOF'
      [
        {"email": "ada@example.com", "passwort": "sommer-2026-urlaub"},
        {"email": "grace@example.com", "passwort": "compiler-sind-toll"},
        {"email": "linus@example.com", "passwort": "sommer-2026-urlaub"},
        {"email": "margaret@example.com", "passwort": "mondlandung-1969!"}
      ]
      EOF
    checks:
      - type: file_exists
        path: migriere.php
        message: Die Datei migriere.php fehlt noch.
      - type: file_exists
        path: nutzer-sicher.json
        message: nutzer-sicher.json gibt es noch nicht. Führe php migriere.php aus.
      - type: command
        run: jq -e 'length == 4 and all(.[]; has("email") and has("hash") and (has("passwort") | not))' nutzer-sicher.json
        message: nutzer-sicher.json soll vier Einträge mit genau den Feldern email und hash enthalten – kein Feld passwort.
      - type: command
        run: jq -r '.[].hash' nutzer-sicher.json | grep -vc '^\$argon2id\$'
        expect_exit: 1
        message: Jeder Hash soll mit $argon2id$ beginnen. Nutze password_hash() mit PASSWORD_ARGON2ID.
      - type: command
        run: |
          php -r '$a = json_decode(file_get_contents("nutzer.json"), true); $b = json_decode(file_get_contents("nutzer-sicher.json"), true); $ok = true; foreach ($a as $i => $n) { $ok = $ok && ($b[$i]["email"] ?? "") === $n["email"] && password_verify($n["passwort"], $b[$i]["hash"] ?? ""); } echo $ok ? "ok" : "nein";'
        stdout_equals: ok
        message: Mindestens ein Hash passt nicht zum Passwort oder steht an der falschen Stelle. Behalte die Reihenfolge bei und hashe das Feld passwort.
      - type: command
        run: test "$(jq -r '.[0].hash' nutzer-sicher.json)" != "$(jq -r '.[2].hash' nutzer-sicher.json)"
        message: Ada und Linus haben dasselbe Passwort, aber ihre Hashes müssen sich unterscheiden. password_hash() erzeugt dafür automatisch ein Salt.
    hints:
      - "`json_decode(file_get_contents('nutzer.json'), true)` liefert ein PHP-Array, `json_encode()` macht wieder JSON daraus."
      - "Mit `array_map(fn ($n) => [...], $nutzer)` baust du für jeden Eintrag ein neues Array mit `email` und `hash`."
      - "`file_put_contents('nutzer-sicher.json', json_encode($sicher, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));`"
    solution: |
      ```php title="migriere.php"
      <?php

      $nutzer = json_decode(file_get_contents('nutzer.json'), true);

      $sicher = array_map(fn (array $n) => [
          'email' => $n['email'],
          'hash' => password_hash($n['passwort'], PASSWORD_ARGON2ID),
      ], $nutzer);

      file_put_contents('nutzer-sicher.json', json_encode($sicher, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
      ```

      ```bash
      php migriere.php
      jq -r '.[].hash' nutzer-sicher.json
      ```
  - id: kodieren-verschluesseln-hashen
    type: dragdrop
    title: Kodieren, verschlüsseln oder hashen?
    description: Drei Verfahren, die gern verwechselt werden. Ordne jede Eigenschaft dem richtigen Verfahren zu.
    targets:
      - { id: kodieren, label: "Kodieren (z. B. Base64)" }
      - { id: verschluesseln, label: "Verschlüsseln (z. B. AES)" }
      - { id: hashen, label: "Passwort-Hash (z. B. Argon2id)" }
    items:
      - { label: Jeder kann es ohne Geheimnis rückgängig machen, target: kodieren }
      - { label: Macht Binärdaten URL- oder E-Mail-tauglich, target: kodieren }
      - { label: Mit dem richtigen Schlüssel kommt der Originaltext zurück, target: verschluesseln }
      - { label: "Wer den Schlüssel stiehlt, liest alle Daten", target: verschluesseln }
      - { label: Lässt sich nicht umkehren – man kann nur vergleichen, target: hashen }
      - { label: Ist absichtlich langsam, target: hashen }
---
Stell dir vor, deine Datenbank wird gestohlen – das passiert auch großen Firmen regelmäßig. Stehen die
Passwörter im [[klartext|Klartext]] darin, kann der Angreifer sich sofort als jede Person anmelden. Und
weil viele Menschen überall dasselbe Passwort nutzen, auch bei deren E-Mail-Anbieter und Bank. Deine
Aufgabe ist darum: Passwörter so speichern, dass ein Dieb damit möglichst wenig anfangen kann.

## Hashen statt verschlüsseln

Eine [[verschluesselung|Verschlüsselung]] ist umkehrbar: Mit dem Schlüssel kommt der Originaltext
zurück. Liegt der Schlüssel auf demselben Server, stiehlt der Angreifer ihn gleich mit.

Ein [[hash|Hash]] ist eine Einbahnstraße: Aus dem Passwort entsteht ein Fingerabdruck, aus dem
Fingerabdruck aber kein Passwort. Zum Prüfen hashst du die Eingabe beim Login erneut und vergleichst.

| Verfahren | Umkehrbar? | Für Passwörter? |
|---|---|---|
| [[base64|Base64]] (Kodierung) | ja, ohne Geheimnis | niemals |
| Verschlüsselung (AES) | ja, mit Schlüssel | nein |
| Schneller Hash (SHA-256, MD5) | nein | nein, zu schnell |
| Passwort-Hash (Argon2id, bcrypt) | nein | **ja** |

> [!MERKSATZ]
> Passwörter werden **gehasht** – mit einem langsamen, gesalzenen Passwort-Hash. Nie im Klartext, nie
> verschlüsselt, nie mit einem schnellen Hash.

## Warum schnell schlecht ist

Hashes wie SHA-256 sind für Prüfsummen gebaut und rasend schnell. Eine Grafikkarte probiert damit
Milliarden Kandidaten pro Sekunde. Ein Angreifer nimmt eine Liste mit Millionen bekannter Passwörter,
hasht jedes und vergleicht mit deiner gestohlenen Tabelle – das nennt man [[brute-force|Brute-Force]]
beziehungsweise Wörterbuchangriff.

Es gibt noch ein zweites Problem: Gleiche Passwörter ergeben gleiche Hashes. Vorberechnete Tabellen
([[rainbow-table|Rainbow Tables]]) knacken häufige Passwörter dann ohne jede Rechenzeit.

Die Lösung besteht aus zwei Zutaten:

- **[[salt|Salt]]:** eine zufällige Zeichenfolge pro Passwort, die vor dem Hashen angehängt wird. Gleiche
  Passwörter ergeben so unterschiedliche Hashes, vorberechnete Tabellen werden nutzlos.
- **Arbeitsaufwand:** Ein [[passwort-hash|Passwort-Hash]] braucht absichtlich Rechenzeit und Speicher.
  Für dich ist ein Login 50 Millisekunden langsamer, für den Angreifer jeder einzelne Rateversuch.

Wer möchte, ergänzt einen [[pepper|Pepper]]: ein zusätzliches Geheimnis für alle Passwörter, das nicht in der
Datenbank, sondern z. B. in einem [[secret|Secret]]-Speicher liegt. Er hilft nur, solange er nicht mitgestohlen wird.

## Argon2id und bcrypt

Das [[owasp|OWASP]]-Cheat-Sheet empfiehlt (Stand 2026) diese Reihenfolge:

| Algorithmus | Einsatz | Mindest-Parameter laut OWASP |
|---|---|---|
| [[argon2id|Argon2id]] | erste Wahl | 19 MiB Speicher, 2 Durchläufe, Parallelität 1 |
| scrypt | wenn Argon2id fehlt | N = 2^17, r = 8, p = 1 |
| PBKDF2 | wenn FIPS-140 verlangt ist | 600 000 Iterationen mit SHA-256 |
| [[bcrypt|bcrypt]] | Altsysteme | Kostenfaktor ≥ 10 |

Argon2id ist **speicherhart**: Jeder Versuch braucht viel Arbeitsspeicher, und genau der ist auf
Grafikkarten knapp. bcrypt ist älter, aber weit verbreitet – Laravel nutzt es standardmäßig mit
Kostenfaktor 12. Eine Eigenheit: bcrypt beachtet nur die ersten **72 Byte** eines Passworts.

> [!FEHLER]
> Eigene Konstrukte wie `sha256($salt . $passwort)` oder „zehnmal MD5“ sind keine Passwort-Hashes.
> Nutze immer die fertigen Funktionen deiner Sprache oder deines Frameworks.

## In PHP: drei Funktionen

PHP bringt alles mit. Das Salt erzeugt `password_hash()` selbst und schreibt es in den Ergebnis-String:

```php title="password.php"
<?php
$hash = password_hash('sommer-2026-urlaub', PASSWORD_ARGON2ID);
echo $hash, PHP_EOL;
// $argon2id$v=19$m=65536,t=4,p=1$d3NVc0ZBNlI0MC5y…$epTHm5MpCP1+SiI0…

var_dump(password_verify('sommer-2026-urlaub', $hash)); // bool(true)
var_dump(password_verify('Sommer-2026-urlaub', $hash)); // bool(false)
```

Der String ist selbstbeschreibend: Algorithmus, Version, Parameter (`m` = Speicher in KiB, `t` =
Durchläufe, `p` = Parallelität), Salt und Hash. Darum kannst du die Parameter später erhöhen, ohne
alte Hashes ungültig zu machen.

Dafür gibt es die dritte Funktion: `password_needs_rehash()` meldet, ob ein Hash mit veralteten
Einstellungen erzeugt wurde. Nach einem **erfolgreichen** Login kennst du das Klartext-Passwort kurz
und kannst es mit den neuen Einstellungen neu hashen:

```php title="Hash beim Login erneuern"
if (password_verify($passwort, $hash) && password_needs_rehash($hash, PASSWORD_ARGON2ID)) {
    $hash = password_hash($passwort, PASSWORD_ARGON2ID);
    // neuen Hash in der Datenbank speichern
}
```

## In Laravel: Hash und der `hashed`-Cast

Laravel kapselt dasselbe in der `Hash`-Fassade. Den Algorithmus wählst du über die
[[umgebungsvariable|Umgebungsvariable]] `HASH_DRIVER` (`bcrypt`, `argon` oder `argon2id`).

```php title="Laravel"
use Illuminate\Support\Facades\Hash;

$hash = Hash::make('sommer-2026-urlaub');
Hash::check('sommer-2026-urlaub', $hash);   // true
Hash::needsRehash($hash);                   // false
```

Im `User`-Model steht bereits der Cast `'password' => 'hashed'`. Er hasht jeden Wert, den du dem
Attribut `password` zuweist, automatisch. Laravel erneuert veraltete Hashes außerdem beim Login von
selbst (`rehash_on_login` in der Hashing-Konfiguration).

> [!PRAXIS]
> In bestehenden Projekten findest du oft noch MD5- oder SHA-1-Hashes. Die übliche Migration: Den alten
> Hash beim nächsten erfolgreichen Login prüfen und sofort durch Argon2id oder bcrypt ersetzen. Konten,
> die sich lange nicht anmelden, bekommen einen erzwungenen Passwort-Reset.

## Zusammenfassung

- Passwörter werden mit einem **langsamen, gesalzenen Passwort-Hash** gespeichert – nie Klartext, nie verschlüsselt.
- Schnelle Hashes wie SHA-256 oder MD5 lassen Milliarden Rateversuche pro Sekunde zu.
- Das Salt macht gleiche Passwörter unterschiedlich und Rainbow Tables nutzlos.
- Erste Wahl ist Argon2id, bcrypt (Kosten ≥ 10, max. 72 Byte) ist für bestehende Systeme okay.
- PHP: `password_hash()`, `password_verify()`, `password_needs_rehash()`. Laravel: `Hash::make()`, `Hash::check()` und der `hashed`-Cast.
