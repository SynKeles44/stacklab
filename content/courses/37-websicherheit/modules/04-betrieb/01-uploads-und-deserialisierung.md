---
title: Datei-Uploads und unsichere Deserialisierung
summary: Hochgeladene Dateien anhand ihres Inhalts prüfen, sicher benennen und außerhalb des Webroots speichern – und verstehen, warum unserialize() auf fremden Daten gefährlich ist.
duration: 25
sources:
  - title: OWASP Cheat Sheet – File Upload
    url: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
  - title: OWASP Cheat Sheet – Deserialization
    url: https://cheatsheetseries.owasp.org/cheatsheets/Deserialization_Cheat_Sheet.html
  - title: OWASP Top 10:2025 – A08 Software or Data Integrity Failures
    url: https://top10.owasp.org/2025/A08_2025-Software_or_Data_Integrity_Failures/
  - title: PHP Manual – finfo::file
    url: https://www.php.net/manual/de/finfo.file.php
  - title: PHP Manual – unserialize (Sicherheitswarnung)
    url: https://www.php.net/manual/de/function.unserialize.php
  - title: PHP Manual – Datei-Uploads mit POST
    url: https://www.php.net/manual/de/features.file-upload.post-method.php
quiz:
  - type: single
    question: Ein Upload-Formular prüft nur `$_FILES['bild']['type'] === 'image/png'`. Warum reicht das nicht?
    options:
      - Weil der Typ in `$_FILES` immer leer ist.
      - Weil dieser Wert vom Browser bzw. Client stammt und beliebig gefälscht werden kann.
      - Weil PNG-Dateien grundsätzlich unsicher sind.
    answer: 1
    explanation: >
      Der MIME-Typ in `$_FILES` ist nur eine Behauptung des Clients. Den echten Typ ermittelst du auf dem Server aus
      dem Dateiinhalt, z. B. mit `finfo`.
  - type: multiple
    question: Welche Maßnahmen gehören zu einem sicheren Bild-Upload?
    options:
      - Echten Dateityp mit `finfo` prüfen und gegen eine Allowlist vergleichen.
      - Eine maximale Dateigröße festlegen.
      - Die Datei unter dem Originalnamen in `public/uploads/` speichern.
      - Einen zufälligen Dateinamen erzeugen und die Endung aus dem geprüften Typ ableiten.
      - Dateien außerhalb des Document Root speichern und über ein Skript ausliefern.
    answers: [0, 1, 3, 4]
    explanation: >
      Der Originalname kann `../` oder `.php` enthalten und liegt im Webroot direkt aufrufbar. Zufällige Namen
      außerhalb des Webroots verhindern Überschreiben und Ausführen.
  - type: find-bug
    question: Ein Warenkorb wird im Cookie gespeichert. In welcher Zeile steckt die Lücke?
    language: php
    code: |
      $roh = $_COOKIE['warenkorb'] ?? '';
      $warenkorb = $roh !== '' ? unserialize($roh) : [];
      foreach ($warenkorb as $position) {
          echo htmlspecialchars($position['name']);
      }
    bug_line: 2
    explanation: >
      `unserialize()` auf Daten aus dem Cookie kann beliebige Objekte erzeugen und deren magische Methoden auslösen.
      Sicher ist `json_decode($roh, true)` – oder den Warenkorb serverseitig in der Session speichern.
  - type: match
    question: Ordne jedem Risiko die passende Gegenmaßnahme zu.
    pairs:
      - { left: "Webshell `shell.php` wird hochgeladen und aufgerufen", right: "Speichern außerhalb des Webroots mit zufälligem Namen" }
      - { left: "`foto.png` enthält in Wahrheit PHP-Code", right: "Inhalt mit finfo prüfen" }
      - { left: "5-GB-Datei legt den Server lahm", right: "Größenlimit vor dem Speichern" }
      - { left: "Manipulierte Objekte im Cookie", right: "JSON statt unserialize, Daten signieren" }
    explanation: Jede Maßnahme schließt ein anderes Loch – zusammen ergeben sie einen sicheren Upload und sichere Datenformate.
tasks:
  - id: upload-pruefen
    type: terminal
    title: Uploads am Inhalt erkennen
    description: |
      Im Ordner `upload-pruefung` liegt `pruefe.php`. Es entscheidet, ob eine Datei als Profilbild angenommen wird –
      bisher nur anhand der Dateiendung. Daneben liegen drei Testdateien:

      - `katze.png` – ein echtes, winziges PNG,
      - `shell.png` – PHP-Code mit der Endung `.png`,
      - `riesig.png` – ein echtes PNG, aber 2 MB groß.

      1. Probiere: `php pruefe.php katze.png`, `php pruefe.php shell.png`, `php pruefe.php riesig.png`.
      2. Baue `pruefe.php` so um, dass es den **echten** Typ mit `finfo` ermittelt. Erlaubt sind nur `image/png` und
         `image/jpeg`, höchstens 1 000 000 Bytes.
      3. Bei Erfolg gibt das Skript `OK <mime-typ>` aus (z. B. `OK image/png`), sonst `ABGELEHNT` und endet mit `exit(1)`.

      Bearbeite die Datei mit `nano pruefe.php`. Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: upload-pruefung
    setup: |
      echo 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' | base64 -d > katze.png
      printf '<?php system($_GET["c"]); ?>\n' > shell.png
      { cat katze.png; head -c 2000000 /dev/zero; } > riesig.png
      cat > pruefe.php <<'PHP'
      <?php
      declare(strict_types=1);

      $datei = $argv[1] ?? '';
      $endung = strtolower(pathinfo($datei, PATHINFO_EXTENSION));

      if (in_array($endung, ['png', 'jpg', 'jpeg'], true)) {
          echo "OK $endung\n";
      } else {
          echo "ABGELEHNT\n";
          exit(1);
      }
      PHP
    checks:
      - type: command
        run: php -l pruefe.php >/dev/null && echo ok
        stdout_equals: ok
        message: pruefe.php enthält einen Syntaxfehler.
      - type: command
        run: php pruefe.php katze.png
        stdout_equals: OK image/png
        message: "`php pruefe.php katze.png` soll genau `OK image/png` ausgeben – ermittle den Typ mit (new finfo(FILEINFO_MIME_TYPE))->file($datei)."
      - type: command
        run: |
          out=$(php pruefe.php shell.png); e=$?
          [ $e -eq 1 ] && [ "$out" = "ABGELEHNT" ] && echo ok || echo "exit-$e"
        stdout_equals: ok
        message: shell.png enthält PHP-Code und muss mit „ABGELEHNT“ und exit(1) abgewiesen werden – die Endung allein reicht nicht.
      - type: command
        run: |
          out=$(php pruefe.php riesig.png); e=$?
          [ $e -eq 1 ] && [ "$out" = "ABGELEHNT" ] && echo ok || echo "exit-$e"
        stdout_equals: ok
        message: riesig.png ist größer als 1 000 000 Bytes und muss abgelehnt werden. Prüfe filesize().
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX"); cp katze.png "$d/bild.txt"
          out=$(php pruefe.php "$d/bild.txt"); rm -rf "$d"; echo "$out"
        stdout_equals: OK image/png
        message: Eine echte PNG-Datei mit falscher Endung soll trotzdem als image/png erkannt werden – entscheide nach dem Inhalt, nicht nach der Endung.
    hints:
      - "Den echten Typ liefert `(new finfo(FILEINFO_MIME_TYPE))->file($datei)` – er liest die ersten Bytes der Datei."
      - "Prüfe zuerst `is_file($datei)` und `filesize($datei) <= 1000000`."
      - "Allowlist: `in_array($mime, ['image/png', 'image/jpeg'], true)`."
    solution: |
      ```php
      <?php
      declare(strict_types=1);

      $datei = $argv[1] ?? '';

      if (!is_file($datei) || filesize($datei) > 1000000) {
          echo "ABGELEHNT\n";
          exit(1);
      }

      $mime = (new finfo(FILEINFO_MIME_TYPE))->file($datei);

      if (!in_array($mime, ['image/png', 'image/jpeg'], true)) {
          echo "ABGELEHNT\n";
          exit(1);
      }

      echo "OK $mime\n";
      ```
  - id: speichername
    type: code
    language: php
    title: Einen sicheren Speichernamen erzeugen
    description: |
      Hochgeladene Bilder sollen nie unter ihrem Originalnamen gespeichert werden. Schreibe
      `speicherName(string $mime): ?string`:

      1. Für `image/png` → Endung `png`, für `image/jpeg` → `jpg`, für `image/webp` → `webp`.
      2. Der Name besteht aus 32 hexadezimalen Kleinbuchstaben/Ziffern (`bin2hex(random_bytes(16))`), einem Punkt und
         der Endung, z. B. `9f2c…e1.png`.
      3. Für jeden anderen Typ gibt die Funktion `null` zurück.
    starter: |
      <?php
      declare(strict_types=1);

      function speicherName(string $mime): ?string
      {
          return 'upload.png';
      }
    tests:
      - name: PNG bekommt zufälligen Namen
        code: assert_same(1, preg_match('/\A[0-9a-f]{32}\.png\z/', (string) speicherName('image/png')));
      - name: JPEG und WebP
        code: |
          assert_same(1, preg_match('/\A[0-9a-f]{32}\.jpg\z/', (string) speicherName('image/jpeg')));
          assert_same(1, preg_match('/\A[0-9a-f]{32}\.webp\z/', (string) speicherName('image/webp')));
      - name: Jeder Aufruf liefert einen neuen Namen
        code: assert_true(speicherName('image/png') !== speicherName('image/png'));
      - name: Unbekannte und gefährliche Typen
        code: |
          assert_same(null, speicherName('text/x-php'));
          assert_same(null, speicherName('image/svg+xml'));
          assert_same(null, speicherName(''));
    hints:
      - "Ein `match` mit `default => null` bildet die Allowlist der Typen ab."
      - "`bin2hex(random_bytes(16))` liefert genau 32 Zeichen."
    solution: |
      <?php
      declare(strict_types=1);

      function speicherName(string $mime): ?string
      {
          $endung = match ($mime) {
              'image/png' => 'png',
              'image/jpeg' => 'jpg',
              'image/webp' => 'webp',
              default => null,
          };

          if ($endung === null) {
              return null;
          }

          return bin2hex(random_bytes(16)) . '.' . $endung;
      }
---
Eine Community-Seite erlaubt Profilbilder. Jemand lädt `avatar.php` hoch, die Seite speichert die Datei unter
`/uploads/avatar.php` – und ab jetzt führt der Webserver bei jedem Aufruf dieser URL den Code des Angreifers aus.
Mit einem einzigen Upload gehört ihm der Server.

## Warum Uploads gefährlich sind

Ein [[datei-upload|Datei-Upload]] bringt nicht nur Daten, sondern eine komplette Datei mit Namen, Typ und Inhalt
auf deinen Server. Jedes dieser drei Dinge kann bösartig sein.

| Risiko | Beispiel |
|---|---|
| Ausführbarer Code im Webroot | `shell.php` – eine [[webshell\|Webshell]], die Befehle ausführt |
| Gefälschter Typ | `foto.png` enthält in Wahrheit PHP oder HTML |
| Gefährlicher Name | `../../config.php` überschreibt eine Datei ([[path-traversal\|Path Traversal]]) |
| Aktiver Inhalt | SVG oder HTML mit `<script>` – Stored XSS beim Anzeigen |
| Riesige Dateien | Speicher voll, Server lahmgelegt |

> [!MERKSATZ]
> Name, Endung und `$_FILES[…]['type']` kommen vom Client. Vertraue nur dem, was **dein Server** über die Datei
> herausfindet.

## Den echten Typ prüfen

Fast jedes Dateiformat beginnt mit typischen Bytes, den [[magic-bytes|Magic Bytes]]: PNG mit `\x89PNG`, PDF mit
`%PDF`. Die PHP-Erweiterung `fileinfo` liest diese Bytes und ermittelt daraus den [[mime-typ|MIME-Typ]].

```php
$tmp = $_FILES['bild']['tmp_name'];

if ($_FILES['bild']['error'] !== UPLOAD_ERR_OK || $_FILES['bild']['size'] > 1_000_000) {
    throw new RuntimeException('Upload fehlgeschlagen oder zu groß.');
}

$mime = (new finfo(FILEINFO_MIME_TYPE))->file($tmp);
$erlaubt = ['image/png' => 'png', 'image/jpeg' => 'jpg'];

if (!isset($erlaubt[$mime])) {
    throw new RuntimeException('Nur PNG und JPEG sind erlaubt.');
}
```

Auch Magic Bytes lassen sich vorne an eine Datei setzen. Darum ist die Typprüfung nur **eine** Schicht – die
nächsten Abschnitte sorgen dafür, dass selbst eine durchgerutschte Datei nie ausgeführt wird.

## Sicher speichern und ausliefern

1. **Zufälliger Name**, Endung aus dem geprüften Typ: `bin2hex(random_bytes(16)) . '.png'`.
2. **Außerhalb des Webroots** speichern, z. B. in `storage/uploads/` statt `public/uploads/`.
3. **Per Skript ausliefern** mit festem `Content-Type`, `X-Content-Type-Options: nosniff` und bei fremden
   Formaten `Content-Disposition: attachment`.
4. Den Originalnamen höchstens als Text in der Datenbank speichern.

```php
$name = bin2hex(random_bytes(16)) . '.' . $erlaubt[$mime];
move_uploaded_file($tmp, __DIR__ . '/../storage/uploads/' . $name);
```

> [!FEHLER]
> SVG als „Bild“ erlauben und direkt ausliefern. SVG ist XML und darf `<script>` enthalten. Erlaube SVG nur nach
> einer Bereinigung oder liefere es als Download aus.

## Unsichere Deserialisierung

[[serialisierung|Serialisierung]] verwandelt Daten in Text, [[deserialisierung|Deserialisierung]] wieder zurück.
PHPs `unserialize()` kann dabei **beliebige Objekte** erzeugen – inklusive Klassen, die beim Aufwachen oder
Zerstören automatisch Code ausführen (`__wakeup()`, `__destruct()`).

Kommt der Text von außen (Cookie, Formular, API), kann ein Angreifer Objekte zusammenbauen, die in deiner App
Dateien löschen oder Code ausführen. Das ist [[unsichere-deserialisierung|unsichere Deserialisierung]], in der
OWASP Top 10:2025 ein Fall von **A08 Software or Data Integrity Failures**.

| Statt | Besser |
|---|---|
| `unserialize($_COOKIE['x'])` | `json_decode($_COOKIE['x'], true, 16, JSON_THROW_ON_ERROR)` |
| Zustand im Cookie | Zustand in der Session auf dem Server |
| `unserialize($daten)` ohne Optionen | `unserialize($daten, ['allowed_classes' => false])` für vertrauenswürdige Quellen |
| Daten unsigniert beim Client | Mit [[hmac\|HMAC]] signieren (`hash_hmac()`) und vor der Nutzung prüfen |

> [!PRAXIS]
> Frameworks verschlüsseln und signieren Cookies standardmäßig – Laravel etwa mit dem `APP_KEY`. Gelangt dieser
> Schlüssel nach außen, kann ein Angreifer wieder manipulierte Daten einschleusen. Deshalb gehört er zu den
> wichtigsten Secrets der App.

## Zusammenfassung

- Uploads bringen Name, Typ und Inhalt mit – alle drei können bösartig sein.
- Den Typ prüfst du mit **finfo** am Inhalt gegen eine Allowlist, dazu ein Größenlimit.
- Gespeichert wird unter **zufälligem Namen außerhalb des Webroots**, ausgeliefert mit festem Content-Type und `nosniff`.
- `unserialize()` auf fremden Daten ist gefährlich – nutze **JSON** oder serverseitige Sessions.
- Daten beim Client signierst du mit HMAC und prüfst sie vor der Nutzung.
