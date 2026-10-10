---
title: Zugriffskontrolle, IDOR und Mass Assignment
summary: Die häufigste Lücke im Web verstehen – und bei jedem Request auf dem Server prüfen, ob genau diese Person genau diese Aktion an genau diesem Objekt ausführen darf.
duration: 25
sources:
  - title: OWASP Top 10:2025 – A01 Broken Access Control
    url: https://top10.owasp.org/2025/A01_2025-Broken_Access_Control/
  - title: OWASP Cheat Sheet – Authorization
    url: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
  - title: OWASP Cheat Sheet – Insecure Direct Object Reference Prevention
    url: https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html
  - title: OWASP Cheat Sheet – Mass Assignment
    url: https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html
  - title: Laravel – Authorization (Gates und Policies)
    url: https://laravel.com/docs/13.x/authorization
quiz:
  - type: single
    question: Eine Nutzerin ist eingeloggt und ruft `/api/rechnungen/1044` auf. Die Rechnung gehört einem anderen Kunden, wird aber angezeigt. Wie heißt diese Lücke?
    options:
      - SQL-Injection
      - Insecure Direct Object Reference (IDOR)
      - Cross-Site Scripting
      - Clickjacking
    answer: 1
    explanation: >
      Die App prüft nur, **ob** jemand eingeloggt ist, nicht, **wem** das Objekt gehört. Das ist eine IDOR – ein Fall
      von Broken Access Control.
  - type: find-bug
    question: In welcher Zeile fehlt die entscheidende Prüfung?
    language: php
    code: |
      $user = aktuellerBenutzer();
      if ($user === null) {
          http_response_code(401);
          exit;
      }
      $stmt = $pdo->prepare('SELECT * FROM invoices WHERE id = ?');
      $stmt->execute([(int) $_GET['id']]);
      echo json_encode($stmt->fetch(PDO::FETCH_ASSOC));
    bug_line: 6
    explanation: >
      Die Abfrage lädt jede Rechnung mit dieser ID. Richtig wäre `WHERE id = ? AND user_id = ?` mit der ID des
      eingeloggten Benutzers – dann kommen fremde Rechnungen gar nicht erst aus der Datenbank.
  - type: multiple
    question: Welche Maßnahmen schützen wirksam vor Broken Access Control?
    options:
      - Berechtigung bei jedem Request auf dem Server prüfen.
      - Admin-Links im Menü für normale Nutzer ausblenden.
      - Nur erlaubte Felder aus dem Request übernehmen (kein Mass Assignment).
      - Standardmäßig alles verbieten und gezielt freigeben.
      - IDs durch lange zufällige UUIDs ersetzen und dann auf Prüfungen verzichten.
    answers: [0, 2, 3]
    explanation: >
      Ausgeblendete Links und schwer erratbare IDs erschweren das Finden, ersetzen aber keine Prüfung. Eine UUID kann
      in Logs, Links oder E-Mails auftauchen – dann ist sie bekannt.
  - type: cloze
    text: "___ klärt, wer du bist. ___ klärt, was du darfst."
    blanks:
      - [Authentifizierung, Authentisierung]
      - [Autorisierung]
    explanation: Ein gültiger Login beantwortet nur die erste Frage. Für jede Aktion braucht es zusätzlich die zweite.
tasks:
  - id: rechnung-pruefen
    type: code
    language: php
    title: Rechnungen nur für Berechtigte
    description: |
      Rechnungen liegen als Arrays mit `id`, `user_id` und `betrag` vor. Benutzer haben `id` und `rolle`
      (`kunde` oder `admin`). Schreibe zwei Funktionen:

      1. `darfRechnungSehen(array $benutzer, array $rechnung): bool` – Admins sehen alles, Kunden nur eigene
         Rechnungen. Unbekannte Rollen sehen nichts (Deny by Default).
      2. `findeRechnung(array $rechnungen, int $id, array $benutzer): ?array` – liefert die Rechnung mit dieser `id`,
         wenn der Benutzer sie sehen darf, sonst `null`. „Gibt es nicht“ und „gehört dir nicht“ sehen von außen
         gleich aus.
    starter: |
      <?php
      declare(strict_types=1);

      function darfRechnungSehen(array $benutzer, array $rechnung): bool
      {
          return true;
      }

      function findeRechnung(array $rechnungen, int $id, array $benutzer): ?array
      {
          foreach ($rechnungen as $rechnung) {
              if ($rechnung['id'] === $id) {
                  return $rechnung;
              }
          }
          return null;
      }
    tests:
      - name: Eigene Rechnung
        code: |
          $r = [['id' => 1, 'user_id' => 7, 'betrag' => 49.0], ['id' => 2, 'user_id' => 8, 'betrag' => 12.5]];
          assert_same($r[0], findeRechnung($r, 1, ['id' => 7, 'rolle' => 'kunde']));
      - name: Fremde Rechnung bleibt verborgen
        code: |
          $r = [['id' => 1, 'user_id' => 7, 'betrag' => 49.0], ['id' => 2, 'user_id' => 8, 'betrag' => 12.5]];
          assert_same(null, findeRechnung($r, 2, ['id' => 7, 'rolle' => 'kunde']));
      - name: Admin sieht alles, unbekannte ID ergibt null
        code: |
          $r = [['id' => 1, 'user_id' => 7, 'betrag' => 49.0], ['id' => 2, 'user_id' => 8, 'betrag' => 12.5]];
          assert_same($r[1], findeRechnung($r, 2, ['id' => 1, 'rolle' => 'admin']));
          assert_same(null, findeRechnung($r, 99, ['id' => 1, 'rolle' => 'admin']));
      - name: Unbekannte Rolle und leere Liste
        code: |
          assert_same(false, darfRechnungSehen(['id' => 7, 'rolle' => 'gast'], ['id' => 1, 'user_id' => 7, 'betrag' => 1.0]));
          assert_same(null, findeRechnung([], 1, ['id' => 7, 'rolle' => 'kunde']));
    hints:
      - "Ein `match` auf die Rolle mit `default => false` setzt Deny by Default direkt um."
      - "In `findeRechnung` rufst du nach dem Fund `darfRechnungSehen()` auf und gibst sonst `null` zurück."
    solution: |
      <?php
      declare(strict_types=1);

      function darfRechnungSehen(array $benutzer, array $rechnung): bool
      {
          return match ($benutzer['rolle'] ?? null) {
              'admin' => true,
              'kunde' => $rechnung['user_id'] === $benutzer['id'],
              default => false,
          };
      }

      function findeRechnung(array $rechnungen, int $id, array $benutzer): ?array
      {
          foreach ($rechnungen as $rechnung) {
              if ($rechnung['id'] === $id) {
                  return darfRechnungSehen($benutzer, $rechnung) ? $rechnung : null;
              }
          }

          return null;
      }
  - id: idor-test
    type: steps
    title: Einen Zugriffstest an der eigenen App durchspielen
    description: Du testest deine eigene lokale App mit zwei Testkonten, Ada (Kundin, ID 7) und Bob (Kunde, ID 8).
    steps:
      - situation: Du bist als Ada eingeloggt und öffnest `/bestellungen/501` – Adas eigene Bestellung.
        question: Wie prüfst du jetzt, ob eine IDOR vorliegt?
        options:
          - Gar nicht, die Seite funktioniert ja.
          - Als Ada die ID einer Bestellung von Bob aufrufen, z. B. `/bestellungen/502`.
          - Den Server neu starten.
        answer: 1
        explanation: Eine IDOR fällt nur auf, wenn du gezielt ein fremdes Objekt anfragst. Dafür brauchst du zwei Testkonten.
      - situation: "`/bestellungen/502` liefert Bobs Bestellung mit Status 200."
        question: Was ist die richtige Korrektur?
        options:
          - Die Bestellnummern zufällig machen.
          - Die Abfrage auf `WHERE id = ? AND user_id = ?` mit der ID aus der Session einschränken.
          - Den Link zu Bobs Bestellung im Menü ausblenden.
        answer: 1
        explanation: Die Besitzprüfung gehört in die Abfrage bzw. eine Policy auf dem Server. Zufällige IDs sind höchstens eine zusätzliche Schicht.
      - situation: Nach der Korrektur liefert `/bestellungen/502` für Ada eine Antwort.
        question: Welche Antwort ist am sinnvollsten?
        options:
          - 404 Not Found, damit nicht einmal die Existenz verraten wird.
          - 200 mit leerem Inhalt.
          - 500 Internal Server Error.
        answer: 0
        explanation: 404 (oder 403) ist korrekt. Viele Teams wählen 404, damit niemand durch Ausprobieren herausfindet, welche IDs existieren.
      - situation: Ada schickt beim Profil-Speichern zusätzlich das Feld `rolle=admin` mit.
        question: Was muss der Server tun?
        options:
          - Das Feld übernehmen, es kam ja vom eingeloggten Benutzer.
          - Nur die erlaubten Felder (z. B. `name`, `email`) übernehmen und alle anderen ignorieren.
        answer: 1
        explanation: Das ist Mass Assignment. Eine Allowlist der erlaubten Felder verhindert, dass sich jemand selbst zum Admin macht.
---
Ein Support-Portal zeigt eingeloggten Kundinnen ihre Tickets unter `/tickets/88231`. Eine Kundin probiert aus
Neugier `/tickets/88230` – und liest das Ticket eines anderen Unternehmens, inklusive Vertragsdaten. Die
Seite hat geprüft, ob sie eingeloggt ist. Nicht aber, ob ihr dieses Ticket gehört.

## Wer bist du – und was darfst du?

Zwei Fragen, die oft verwechselt werden:

| Frage | Begriff | Beispiel |
|---|---|---|
| Wer bist du? | [[authentifizierung\|Authentifizierung]] | Login mit Passwort und zweitem Faktor |
| Was darfst du? | [[autorisierung\|Autorisierung]] | Ada darf Rechnung 1043 sehen, Rechnung 1044 nicht |

Wie ein sicherer Login funktioniert, lernst du im Kurs Authentifizierung. Hier geht es um die zweite Frage.
[[broken-access-control|Broken Access Control]] bedeutet: Die App beantwortet sie falsch oder gar nicht. Seit
Jahren steht genau das auf Platz 1 der OWASP Top 10.

> [!MERKSATZ]
> Eingeloggt heißt nicht berechtigt. Jede Anfrage braucht die Prüfung: Darf **diese Person** **diese Aktion** an
> **diesem Objekt** ausführen?

## IDOR: das fremde Objekt

Bei einer [[idor|IDOR]] (*Insecure Direct Object Reference*) steht ein direkter Verweis auf ein Objekt in der
Anfrage – meist eine ID – und der Server prüft nicht, ob es der anfragenden Person gehört.

```php
// Unsicher: lädt jede Rechnung
$stmt = $pdo->prepare('SELECT * FROM invoices WHERE id = ?');
$stmt->execute([$id]);

// Sicher: Besitz ist Teil der Abfrage
$stmt = $pdo->prepare('SELECT * FROM invoices WHERE id = ? AND user_id = ?');
$stmt->execute([$id, $user['id']]);
$rechnung = $stmt->fetch() ?: null;

if ($rechnung === null) {
    http_response_code(404);
    exit;
}
```

Die ID des Benutzers kommt **aus der Session**, nie aus dem Request. Sonst schickt jemand einfach
`user_id=8` mit.

## Weitere Formen von Broken Access Control

| Form | Beispiel |
|---|---|
| Forced Browsing | `/admin` ist nur im Menü versteckt, aber ohne Prüfung erreichbar |
| Fehlende Prüfung bei Methoden | `GET /api/posts/5` ist geschützt, `DELETE /api/posts/5` nicht |
| Rechte-Ausweitung | Ein Kunde ruft `POST /api/users/7/promote` auf und wird Admin |
| Manipulierte Tokens | Rolle `admin` im Cookie oder in einem unsignierten Token |
| [[mass-assignment\|Mass Assignment]] | Das Profil-Formular übernimmt auch `rolle=admin` |

Allen Formen ist gemeinsam: Die App verlässt sich auf etwas, das der Client kontrolliert – eine ID, ein verstecktes
Menü, ein Feld im Formular. Die Prüfung muss deshalb immer auf dem Server stattfinden, mit Daten aus der Session
und der Datenbank.

Gegen Mass Assignment hilft eine Allowlist der Felder:

```php
$erlaubt = ['name', 'email'];
$daten = array_intersect_key($_POST, array_flip($erlaubt));
```

> [!FEHLER]
> „Die IDs sind UUIDs, die errät keiner.“ IDs tauchen in Links, Logs, E-Mails und Browser-Verläufen auf.
> Schwer erratbare IDs sind eine zusätzliche Hürde, aber **niemals** der Ersatz für die Besitzprüfung.

## Prüfungen zentral und standardmäßig verboten

Verstreute `if`-Abfragen werden irgendwann vergessen. Robuster ist eine zentrale Stelle pro Objekttyp und das
Prinzip [[deny-by-default|Deny by Default]]: Was keine Regel ausdrücklich erlaubt, ist verboten.

```php
function darfRechnungSehen(array $benutzer, array $rechnung): bool
{
    return match ($benutzer['rolle']) {
        'admin' => true,
        'kunde' => $rechnung['user_id'] === $benutzer['id'],
        default => false, // neue oder unbekannte Rollen dürfen nichts
    };
}
```

Antworte bei fremden Objekten mit **404** oder **403**. Viele Teams nehmen 404, damit niemand durch Ausprobieren
herausfindet, welche IDs existieren.

> [!PRAXIS]
> In Laravel bündeln [Policies](https://laravel.com/docs/13.x/authorization) diese Regeln pro Model, etwa
> `InvoicePolicy::view()`. Im Controller genügt dann `Gate::authorize('view', $invoice);` – und automatisierte
> Tests prüfen mit zwei Testkonten, dass fremde Objekte 403 oder 404 liefern.

## Zusammenfassung

- **Authentifizierung** klärt, wer jemand ist; **Autorisierung**, was er darf.
- **Broken Access Control** steht auf Platz 1 der OWASP Top 10:2025.
- Bei einer **IDOR** fehlt die Besitzprüfung für ein per ID angefragtes Objekt.
- Benutzer-ID aus der Session, Besitz in der Abfrage oder einer Policy prüfen.
- **Mass Assignment** verhinderst du mit einer Allowlist erlaubter Felder.
- **Deny by Default**: Unbekanntes ist verboten; fremde Objekte liefern 404 oder 403.
