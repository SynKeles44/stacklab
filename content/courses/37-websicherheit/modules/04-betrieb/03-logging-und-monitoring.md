---
title: Sicherheitsrelevante Ereignisse protokollieren und erkennen
summary: Die richtigen Ereignisse strukturiert loggen, keine Secrets oder Passwörter ins Log schreiben, Log-Injection verhindern und Angriffe mit Auswertungen und Alarmen erkennen.
duration: 20
sources:
  - title: OWASP Top 10:2025 – A09 Security Logging and Alerting Failures
    url: https://top10.owasp.org/2025/A09_2025-Security_Logging_and_Alerting_Failures/
  - title: OWASP Cheat Sheet – Logging
    url: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
  - title: OWASP Cheat Sheet – Logging Vocabulary
    url: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Vocabulary_Cheat_Sheet.html
  - title: PHP Manual – json_encode
    url: https://www.php.net/manual/de/function.json-encode.php
  - title: jq Manual
    url: https://jqlang.org/manual/
quiz:
  - type: multiple
    question: Welche Ereignisse gehören in ein Security-Log?
    options:
      - Fehlgeschlagene Logins
      - Abgelehnte Zugriffe (403) auf fremde Objekte
      - Jeder einzelne Seitenaufruf mit allen Formularfeldern
      - Ungültige CSRF-Tokens
      - Änderungen an Rollen und Berechtigungen
    answers: [0, 1, 3, 4]
    explanation: >
      Ins Security-Log gehören Ereignisse, die auf Angriffe oder kritische Änderungen hinweisen. Alle Formularfelder
      zu loggen, schreibt Passwörter und persönliche Daten ins Log.
  - type: find-bug
    question: In welcher Zeile landet ein Secret im Log?
    language: php
    code: |
      $user = findeBenutzer($email);
      if ($user === null || !password_verify($passwort, $user['hash'])) {
          $logger->warning('login_failed', [
              'email' => $email,
              'passwort' => $passwort,
              'ip' => $_SERVER['REMOTE_ADDR'],
          ]);
      }
    bug_line: 5
    explanation: >
      Das eingegebene Passwort hat im Log nichts verloren – oft ist es das richtige Passwort mit einem Tippfehler oder
      das Passwort eines anderen Dienstes. Logge Ereignis, Zeit, IP und Benutzerkennung, nie Geheimnisse.
  - type: single
    question: Ein Angreifer gibt als Benutzernamen `ada\n2026-10-10 12:00:00 login_success user=admin` ein. Was ist das Problem, wenn du Logs als einfache Textzeilen schreibst?
    options:
      - Gar keins, Logs sind nur für Menschen.
      - Der Zeilenumbruch erzeugt eine gefälschte zweite Logzeile (Log-Injection).
      - Die Logdatei wird automatisch gelöscht.
    answer: 1
    explanation: >
      Mit eingeschleusten Zeilenumbrüchen fälscht jemand Einträge und verwirrt Auswertungen. Strukturierte Logs
      (JSON pro Zeile) kodieren den Zeilenumbruch als `\n` und verhindern das.
  - type: cloze
    text: "In der OWASP Top 10:2025 heißt die Kategorie A09 Security Logging and ___ Failures – Logs allein helfen nichts, wenn niemand ___ wird."
    blanks:
      - [Alerting]
      - [alarmiert, benachrichtigt, informiert]
    explanation: 2025 wurde aus „Monitoring“ bewusst „Alerting“ – entscheidend ist, dass ein Angriff rechtzeitig jemanden erreicht.
tasks:
  - id: log-auswerten
    type: terminal
    title: Einen Brute-Force-Versuch im Log finden
    description: |
      Im Ordner `log-analyse` liegt `logs/security.log` – ein Security-Log im Format JSON Lines (ein JSON-Objekt pro
      Zeile) deiner lokalen Test-App. Jeder Eintrag hat `zeit`, `event`, `ip` und `user`.

      1. Schau dir das Log an: `head -5 logs/security.log` oder `jq . logs/security.log | less`.
      2. Schreibe die Gesamtzahl aller `login_failed`-Ereignisse in die Datei `fehlversuche.txt` (nur die Zahl).
      3. Schreibe alle IP-Adressen mit **mindestens 5** `login_failed`-Ereignissen in `verdacht.txt` – eine IP pro Zeile.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: log-analyse
    setup: |
      mkdir -p logs
      : > logs/security.log
      zeile() { printf '{"zeit":"2026-10-10T08:%s:00Z","event":"%s","ip":"%s","user":"%s"}\n' "$1" "$2" "$3" "$4" >> logs/security.log; }
      zeile 00 login_success 192.0.2.10 ada
      zeile 01 login_failed 203.0.113.7 admin
      zeile 01 login_failed 203.0.113.7 admin
      zeile 02 login_failed 192.0.2.10 bob
      zeile 02 login_failed 203.0.113.7 admin
      zeile 03 login_failed 198.51.100.23 ada
      zeile 03 login_failed 203.0.113.7 root
      zeile 04 access_denied 192.0.2.10 bob
      zeile 04 login_failed 198.51.100.23 bob
      zeile 05 login_failed 203.0.113.7 admin
      zeile 05 login_failed 198.51.100.23 carol
      zeile 06 login_success 192.0.2.10 bob
      zeile 06 login_failed 203.0.113.7 test
      zeile 07 login_failed 198.51.100.23 dave
      zeile 07 login_failed 203.0.113.7 admin
      zeile 08 login_failed 198.51.100.23 erin
      zeile 08 login_failed 192.0.2.10 bob
      zeile 09 login_failed 203.0.113.7 admin
      zeile 09 csrf_invalid 198.51.100.23 -
      zeile 10 login_success 203.0.113.7 admin
    checks:
      - type: file_exists
        path: fehlversuche.txt
        message: Die Datei fehlversuche.txt fehlt noch.
      - type: command
        run: tr -d '[:space:]' < fehlversuche.txt
        stdout_equals: "15"
        message: fehlversuche.txt enthält nicht die richtige Anzahl. Zähle nur Einträge mit event = login_failed, z. B. mit jq und wc -l.
      - type: file_exists
        path: verdacht.txt
        message: Die Datei verdacht.txt fehlt noch.
      - type: command
        run: grep -v '^\s*$' verdacht.txt | sed 's/^ *//; s/ *$//' | sort | tr '\n' ' '
        stdout_equals: 198.51.100.23 203.0.113.7
        message: verdacht.txt soll genau die IPs mit mindestens 5 fehlgeschlagenen Logins enthalten – eine pro Zeile, ohne Zählerspalte.
    hints:
      - "Nur die Fehlversuche: `jq -c 'select(.event == \"login_failed\")' logs/security.log`"
      - "Zählen pro IP: `jq -r 'select(.event == \"login_failed\") | .ip' logs/security.log | sort | uniq -c`"
      - "Mit `awk '$1 >= 5 {print $2}'` bleiben nur die IPs ab 5 Versuchen übrig."
    solution: |
      ```bash
      jq -c 'select(.event == "login_failed")' logs/security.log | wc -l > fehlversuche.txt
      jq -r 'select(.event == "login_failed") | .ip' logs/security.log \
        | sort | uniq -c | awk '$1 >= 5 {print $2}' > verdacht.txt
      cat fehlversuche.txt verdacht.txt
      ```
  - id: log-zeile
    type: code
    language: php
    title: Eine sichere Logzeile bauen
    description: |
      Schreibe `logZeile(string $zeit, string $event, array $kontext): string`. Sie liefert **eine** JSON-Zeile:

      1. Zuerst `zeit`, dann `event`, danach die Einträge aus `$kontext`.
      2. Sensible Schlüssel werden entfernt – egal in welcher Groß-/Kleinschreibung: `password`, `passwort`, `token`,
         `session_id`, `api_key`.
      3. Kodierung mit `json_encode(…, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR)`. So
         werden Zeilenumbrüche in Werten automatisch zu `\n` – eine Log-Injection ist nicht möglich.
    starter: |
      <?php
      declare(strict_types=1);

      function logZeile(string $zeit, string $event, array $kontext): string
      {
          $teile = [$zeit, $event];
          foreach ($kontext as $schluessel => $wert) {
              $teile[] = "$schluessel=$wert";
          }
          return implode(' ', $teile);
      }
    tests:
      - name: Normaler Eintrag
        code: |
          assert_same('{"zeit":"2026-10-10T08:00:00Z","event":"login_failed","ip":"203.0.113.7","user":"ada"}', logZeile('2026-10-10T08:00:00Z', 'login_failed', ['ip' => '203.0.113.7', 'user' => 'ada']));
      - name: Secrets werden entfernt
        code: |
          assert_same('{"zeit":"t","event":"login_failed","user":"bob"}', logZeile('t', 'login_failed', ['user' => 'bob', 'Passwort' => 'geheim', 'TOKEN' => 'abc', 'session_id' => 'x1', 'api_key' => 'k']));
      - name: Zeilenumbruch kann keine zweite Zeile erzeugen
        code: |
          $z = logZeile('t', 'login_failed', ['user' => "ada\nt login_success user=admin"]);
          assert_same(false, str_contains($z, "\n"));
          assert_same('{"zeit":"t","event":"login_failed","user":"ada\nt login_success user=admin"}', $z);
      - name: Leerer Kontext und Umlaute
        code: |
          assert_same('{"zeit":"t","event":"logout"}', logZeile('t', 'logout', []));
          assert_same('{"zeit":"t","event":"access_denied","pfad":"/rechnungen/1044","user":"jörg"}', logZeile('t', 'access_denied', ['pfad' => '/rechnungen/1044', 'user' => 'jörg']));
    hints:
      - "Filtere mit `array_filter($kontext, fn ($k) => !in_array(strtolower((string) $k), $sensibel, true), ARRAY_FILTER_USE_KEY)`."
      - "`['zeit' => $zeit, 'event' => $event] + $gefiltert` hält die Reihenfolge ein."
    solution: |
      <?php
      declare(strict_types=1);

      function logZeile(string $zeit, string $event, array $kontext): string
      {
          $sensibel = ['password', 'passwort', 'token', 'session_id', 'api_key'];

          $gefiltert = array_filter(
              $kontext,
              fn ($schluessel): bool => !in_array(strtolower((string) $schluessel), $sensibel, true),
              ARRAY_FILTER_USE_KEY,
          );

          return json_encode(
              ['zeit' => $zeit, 'event' => $event] + $gefiltert,
              JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR,
          );
      }
---
Ein Online-Shop wird über Wochen ausgespäht: Jemand probiert jede Nacht tausende Passwörter aus, findet eine
IDOR und lädt Kundendaten herunter. Entdeckt wird das erst Monate später – durch einen Hinweis von außen. Die
Logs hätten alles gezeigt. Nur hat niemand hingeschaut, und niemand wurde alarmiert.

## Warum Security-Logging zählt

Kein Schutz ist perfekt. Wenn doch etwas passiert, entscheidet die Zeit bis zur Entdeckung über den Schaden.
OWASP führt das als **A09 Security Logging and Alerting Failures**: fehlende Logs, unbrauchbare Logs oder Logs,
die niemand auswertet.

[[security-logging|Security-Logging]] heißt: Du protokollierst gezielt die Ereignisse, die auf Angriffe oder
kritische Änderungen hinweisen – in einer Form, die Maschinen auswerten können.

Drei Fragen soll dir ein gutes Security-Log nach einem Vorfall beantworten:

1. **Was** ist passiert – welche Aktion, welches Objekt?
2. **Wer** war es – welches Konto, welche IP, welcher Request?
3. **Wann** und in welcher Reihenfolge?

Kannst du diese Fragen nicht beantworten, weißt du nach einem Angriff weder, welche Daten betroffen sind, noch,
wen du informieren musst.

> [!MERKSATZ]
> Ein Log, das niemand liest und das niemanden alarmiert, schützt nicht. Erst **Auswertung und Alarm** machen aus
> Daten Sicherheit.

## Was du loggen solltest – und was nie

| Loggen | Beispiel-Event |
|---|---|
| Fehlgeschlagene und erfolgreiche Logins | `login_failed`, `login_success` |
| Abgelehnte Zugriffe | `access_denied` (403/404 auf fremde Objekte) |
| Ungültige CSRF-Tokens, Validierungsangriffe | `csrf_invalid`, `input_rejected` |
| Kritische Änderungen | `role_changed`, `password_changed`, `mfa_disabled` |

Jeder Eintrag braucht: Zeit in [[utc|UTC]] im Format [[iso-8601|ISO 8601]], Event-Name, Benutzerkennung, IP und eine
[[request-id|Request-ID]], damit du zusammengehörige Einträge findest.

**Niemals** ins Log: Passwörter (auch falsche), Tokens, Session-IDs, API-Keys, vollständige Kartennummern. Mit
persönlichen Daten wie E-Mail-Adressen gehst du sparsam um – Logs unterliegen ebenfalls dem Datenschutz.

> [!FEHLER]
> `$logger->info('Login', $_POST)` – damit landet das Passwort aus dem Formular im Klartext im Log. Logge nur
> ausgewählte, unkritische Felder.

## Strukturiert loggen gegen Log-Injection

Schreibst du Logs als freie Textzeilen, kann ein Angreifer per Zeilenumbruch eigene Einträge fälschen – das ist
[[log-injection|Log-Injection]]:

```text
2026-10-10T08:00:00Z login_failed user=ada
2026-10-10T08:00:00Z login_success user=admin   ← kam aus dem Benutzernamen!
```

[[strukturiertes-logging|Strukturiertes Logging]] im Format [[json-lines|JSON Lines]] löst das: Jeder Eintrag
ist ein JSON-Objekt in einer Zeile, `json_encode()` macht aus einem Zeilenumbruch `\n`.

```php
$zeile = json_encode([
    'zeit' => gmdate('Y-m-d\TH:i:s\Z'),
    'event' => 'login_failed',
    'ip' => $_SERVER['REMOTE_ADDR'] ?? '-',
    'user' => $benutzername,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);

file_put_contents(__DIR__ . '/../logs/security.log', $zeile . "\n", FILE_APPEND | LOCK_EX);
```

## Auswerten und alarmieren

Strukturierte Logs kannst du direkt auswerten, etwa mit [[jq]]:

```bash title="Fehlversuche pro IP"
jq -r 'select(.event == "login_failed") | .ip' logs/security.log | sort | uniq -c | sort -rn
```

```text
      8 203.0.113.7
      5 198.51.100.23
```

Eine IP mit acht Fehlversuchen in wenigen Minuten ist kein vergessliches Teammitglied, sondern ein Skript, das
Passwörter durchprobiert ([[brute-force|Brute Force]]). Solche Muster willst du nicht erst beim nächsten Blick ins
Log entdecken, sondern automatisch.

Daraus werden Regeln für ein [[alerting|Alerting]]:

| Regel | Reaktion |
|---|---|
| ≥ 20 `login_failed` pro IP in 5 Minuten | [[rate-limiting\|Rate Limiting]] greift, Team wird benachrichtigt |
| `role_changed` zu `admin` | Sofortige Nachricht an das Team |
| Viele `access_denied` von einem Konto | Prüfen, ob jemand IDs durchprobiert |

> [!PRAXIS]
> In Produktion schicken Apps ihre Logs an ein zentrales System, damit ein Angreifer sie auf dem Server nicht
> einfach löschen kann. Dort laufen die Alarmregeln, und Aufbewahrungsfristen sorgen dafür, dass Logs nicht ewig
> persönliche Daten speichern.

## Zusammenfassung

- **A09** heißt 2025 bewusst „Logging and **Alerting**“: Logs nützen nur, wenn jemand rechtzeitig reagiert.
- Logge Logins, abgelehnte Zugriffe, CSRF-Fehler und kritische Änderungen – mit Zeit, Event, Benutzer, IP, Request-ID.
- Niemals Passwörter, Tokens, Session-IDs oder API-Keys loggen.
- **JSON Lines** verhindern Log-Injection und lassen sich mit `jq` auswerten.
- Alarmregeln und zentrale Log-Speicherung machen aus Logs echte Erkennung.
