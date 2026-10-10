---
title: Login und Geschäftsregeln
summary: Den Login mit Sanctum-Tokens absichern und die Regel „nie mehr Buchungen als Plätze“ so umsetzen, dass sie auch bei gleichzeitigen Klicks hält.
duration: 25
sources:
  - title: Laravel-Dokumentation – Sanctum (API Tokens)
    url: https://laravel.com/docs/13.x/sanctum#api-token-authentication
  - title: Laravel-Dokumentation – Database Transactions und Pessimistic Locking
    url: https://laravel.com/docs/13.x/queries#pessimistic-locking
  - title: Laravel-Dokumentation – Rate Limiting
    url: https://laravel.com/docs/13.x/routing#rate-limiting
  - title: OWASP Authentication Cheat Sheet
    url: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
quiz:
  - type: single
    question: Warum meldet der Login bei falscher E-Mail und bei falschem Passwort dieselbe Fehlermeldung?
    options:
      - Weil Laravel nur eine Meldung kennt.
      - Damit Angreifer nicht herausfinden, welche E-Mail-Adressen ein Konto haben.
      - Damit die Antwort schneller ist.
    answer: 1
    explanation: >
      Unterschiedliche Meldungen verraten, ob ein Konto existiert (User Enumeration). Eine gemeinsame Meldung
      schließt diese Lücke.
  - type: multiple
    question: Was gehört zu einem sicheren Token-Login mit Sanctum?
    options:
      - Passwort mit `Hash::check` gegen den gespeicherten Hash prüfen
      - Die Login-Route drosseln, z. B. mit `throttle:10,1`
      - Das Passwort im Klartext in der Datenbank speichern, um es vergleichen zu können
      - Beim Logout das aktuelle Token löschen
    answers: [0, 1, 3]
    explanation: Passwörter liegen nur als Hash vor, Rateversuche werden gedrosselt, und ein Logout widerruft das Token.
  - type: single
    question: Zwei Mitglieder buchen zur selben Millisekunde den letzten Platz. Was verhindert zuverlässig, dass beide durchkommen?
    options:
      - Eine `if`-Abfrage, ob noch Plätze frei sind
      - Eine Transaktion, die den Workshop mit `lockForUpdate()` sperrt, bevor gezählt wird
      - Ein JavaScript-Check im Browser
    answer: 1
    explanation: >
      Ohne Sperre lesen beide gleichzeitig „1 Platz frei“ und buchen. Die Sperre zwingt die zweite Anfrage zu
      warten, bis die erste fertig ist – dann sieht sie „0 Plätze frei“.
  - type: find-bug
    question: Diese Methode soll das Token der aktuellen Anfrage widerrufen. Welche Zeile ist falsch?
    language: php
    code: |
      public function logout(Request $request): Response
      {
          $request->user()->tokens()->delete();

          return response()->noContent();
      }
    bug_line: 3
    explanation: >
      `tokens()->delete()` löscht **alle** Tokens der Person – auch die anderer Geräte. Für einen normalen Logout
      ist `currentAccessToken()->delete()` richtig.
tasks:
  - id: buchungsregel-php
    type: code
    language: php
    title: Die Buchungsregel als reine Funktion
    description: |
      Bevor die Regel in den Controller wandert, formulierst du sie als reine Funktion – so ist sie leicht zu
      testen. Schreibe `bookingDecision(int $capacity, array $bookedUserIds, int $userId): array`.

      Sie gibt ein Array mit `status` und `message` zurück:

      - Hat `$userId` schon gebucht (steht in `$bookedUserIds`) → `['status' => 409, 'message' => 'Du hast diesen Workshop schon gebucht.']`
      - Sonst, wenn keine Plätze frei sind → `['status' => 409, 'message' => 'Der Workshop ist leider ausgebucht.']`
      - Sonst → `['status' => 201, 'message' => 'Gebucht.']`

      Die Prüfung „schon gebucht“ kommt zuerst: Wer selbst den letzten Platz hat, soll nicht „ausgebucht“ lesen.
    starter: |
      <?php

      declare(strict_types=1);

      function bookingDecision(int $capacity, array $bookedUserIds, int $userId): array
      {
          return ['status' => 0, 'message' => ''];
      }
    tests:
      - name: Freier Platz wird gebucht
        code: assert_same(['status' => 201, 'message' => 'Gebucht.'], bookingDecision(3, [7, 8], 9));
      - name: Ausgebucht ergibt 409
        code: assert_same(['status' => 409, 'message' => 'Der Workshop ist leider ausgebucht.'], bookingDecision(2, [7, 8], 9));
      - name: Doppelte Buchung ergibt 409
        code: assert_same(['status' => 409, 'message' => 'Du hast diesen Workshop schon gebucht.'], bookingDecision(5, [9], 9));
      - name: Wer den letzten Platz hat, liest „schon gebucht“
        code: assert_same('Du hast diesen Workshop schon gebucht.', bookingDecision(1, [9], 9)['message']);
      - name: Leerer Workshop mit einem Platz
        code: assert_same(201, bookingDecision(1, [], 4)['status']);
      - name: Mehr Buchungen als Plätze (Altdaten) bleibt ausgebucht
        code: assert_same(409, bookingDecision(1, [1, 2], 3)['status']);
    solution: |
      <?php

      declare(strict_types=1);

      function bookingDecision(int $capacity, array $bookedUserIds, int $userId): array
      {
          if (in_array($userId, $bookedUserIds, true)) {
              return ['status' => 409, 'message' => 'Du hast diesen Workshop schon gebucht.'];
          }

          if ($capacity - count($bookedUserIds) <= 0) {
              return ['status' => 409, 'message' => 'Der Workshop ist leider ausgebucht.'];
          }

          return ['status' => 201, 'message' => 'Gebucht.'];
      }
    hints:
      - "`in_array($userId, $bookedUserIds, true)` prüft, ob die Person schon gebucht hat."
      - "Freie Plätze: `$capacity - count($bookedUserIds)`. Prüfe auf `<= 0`, dann sind auch kaputte Altdaten abgedeckt."
  - id: wettlauf-um-den-letzten-platz
    type: steps
    title: Der Wettlauf um den letzten Platz
    description: Zwei Anfragen kommen gleichzeitig an. Verfolge, was passiert.
    steps:
      - situation: >
          Der Workshop hat 10 Plätze und 9 Buchungen. Anfrage A und Anfrage B zählen ohne Transaktion
          gleichzeitig die Buchungen.
        question: Was lesen beide?
        options:
          - A liest 9, B liest 10.
          - Beide lesen 9 – also „1 Platz frei“.
          - Die Datenbank lehnt B sofort ab.
        answer: 1
        explanation: Ohne Sperre sehen beide denselben alten Stand. Das ist eine klassische Race Condition.
      - situation: Beide legen jetzt ihre Buchung an. Es gibt nur einen Unique-Constraint auf (workshop_id, user_id).
        question: Wie viele Buchungen hat der Workshop danach?
        options:
          - 10 – der Constraint verhindert die elfte.
          - 11 – der Constraint verhindert nur Doppelbuchungen derselben Person.
        answer: 1
        explanation: >
          Der Constraint schützt vor doppelten Buchungen derselben Person, nicht vor Überbuchung. Die
          Platzregel muss der Code absichern.
      - situation: >
          Jetzt läuft die Buchung in `DB::transaction()` und lädt den Workshop zuerst mit `lockForUpdate()`.
          A bekommt die Sperre zuerst.
        question: Was passiert mit B?
        options:
          - B wartet, bis A fertig ist, liest dann 10 Buchungen und bekommt 409.
          - B bucht trotzdem parallel.
          - B bekommt sofort 500.
        answer: 0
        explanation: >
          Die Sperre gilt bis zum Ende von A's Transaktion. B sieht danach den neuen Stand und wird korrekt
          abgelehnt.
---
Die API hat jetzt einen Vertrag. Zwei Dinge machen sie erst brauchbar: Man muss sich **anmelden** können,
und die wichtigste Regel – nie mehr Buchungen als Plätze – muss **immer** halten. Auch dann, wenn am
Montagmorgen um 8:00 Uhr zwanzig Mitglieder gleichzeitig auf „Buchen“ klicken.

## Die Login-Entscheidung

[[sanctum|Laravel Sanctum]] bietet zwei Wege für eine SPA:

| | API-Tokens | SPA-Cookies |
|---|---|---|
| Wie | Login gibt ein Token zurück, jede Anfrage schickt `Authorization: Bearer …` | Session-Cookie, CSRF-Schutz |
| Voraussetzung | keine | SPA und API auf derselben Top-Level-Domain |
| Gut für | Tests, mobile Apps, Skripte | Browser-SPAs im eigenen Haus |

Vereinskurse nutzt **Tokens**, weil sie sich leicht testen lassen und eine spätere App sie mitbenutzen kann.
Die SPA hält das Token nur im Arbeitsspeicher, nicht im [[web-storage|localStorage]], damit ein
eingeschleustes Skript es nicht dauerhaft abgreifen kann. Diese Abwägung steht als ADR in
`docs/entscheidungen.md`.

## Der Login in fünf Zeilen Logik

```php title="app/Http/Controllers/AuthController.php"
public function login(LoginRequest $request): JsonResponse
{
    $user = User::where('email', $request->validated('email'))->first();

    if (! $user || ! Hash::check($request->validated('password'), $user->password)) {
        throw ValidationException::withMessages(['email' => 'Die Zugangsdaten sind ungültig.']);
    }

    return response()->json([
        'token' => $user->createToken($request->validated('device_name'))->plainTextToken,
    ]);
}
```

Die Checkliste dazu:

1. Das Model `User` nutzt den Trait `HasApiTokens`.
2. Falsche E-Mail und falsches Passwort liefern **dieselbe** Meldung.
3. Die Login-Route ist gedrosselt: `->middleware('throttle:10,1')` ([[rate-limiting|Rate Limiting]]).
4. Geschützte Routen liegen in einer Gruppe mit `auth:sanctum`.
5. Logout löscht nur `currentAccessToken()`.

> [!FEHLER]
> „E-Mail nicht gefunden“ und „Passwort falsch“ getrennt melden. Das verrät Angreifern, welche Adressen ein
> Konto haben – die Vorstufe zu gezieltem Passwort-Raten.

## Geschäftsregeln gehören ins Backend

Eine Geschäftsregel ist eine fachliche Bedingung, die immer gelten muss. Für das Buchen sind es zwei:

- Niemand bucht denselben Workshop zweimal.
- Es gibt nie mehr Buchungen als Plätze.

Das Frontend darf den Button „Buchen“ ausgrauen, wenn `seats_left` 0 ist. Das ist **Komfort**, kein Schutz:
Jede Anfrage kann auch ohne Browser kommen. Die Entscheidung trifft immer der Server und antwortet bei einem
Verstoß mit **409**.

> [!MERKSATZ]
> Das Frontend zeigt Regeln an, das Backend setzt sie durch.

## Die Race Condition

Die naive Umsetzung zählt erst und bucht dann. Kommen zwei Anfragen gleichzeitig, lesen beide „1 Platz frei“,
und beide buchen – eine [[race-condition|Race Condition]]. Die Lösung ist eine
[[transaktion|Transaktion]] mit einer [[sperre|Sperre]] auf den Workshop:

```php title="app/Http/Controllers/BookingController.php (Kern)"
return DB::transaction(function () use ($request, $workshop) {
    $workshop = Workshop::query()->lockForUpdate()->findOrFail($workshop->id);

    if ($workshop->bookings()->where('user_id', $request->user()->id)->exists()) {
        abort(409, 'Du hast diesen Workshop schon gebucht.');
    }
    if ($workshop->seatsLeft() === 0) {
        abort(409, 'Der Workshop ist leider ausgebucht.');
    }

    $workshop->bookings()->create(['user_id' => $request->user()->id]);
    // … Antwort mit 201
});
```

`lockForUpdate()` sperrt die Zeile bis zum Ende der Transaktion. Die zweite Anfrage wartet und sieht danach
den neuen Stand. Der Unique-Constraint aus dem Datenmodell bleibt als zweites Netz bestehen.

> [!PRAXIS]
> SQLite sperrt beim Schreiben ohnehin die ganze Datenbank, deshalb fällt das Problem lokal selten auf. In
> Produktion mit PostgreSQL und vielen gleichzeitigen Anfragen tritt es real auf – gerade bei begehrten
> Terminen, Tickets oder Lagerbeständen.

## Checkliste für Login und Regeln

1. Jede schreibende Route liegt in der `auth:sanctum`-Gruppe – prüfe das mit `php artisan route:list --path=api`.
2. Der Login ist gedrosselt und meldet Fehler einheitlich.
3. Jede Geschäftsregel hat eine eindeutige Antwort: 409 mit einer Meldung, die ein Mensch versteht.
4. Zählen und Schreiben passieren in **einer** Transaktion mit Sperre.
5. Für jede Regel gibt es einen Test, der den Verstoß zeigt.

## Zusammenfassung

- Vereinskurse nutzt **Sanctum-API-Tokens**; die Entscheidung und ihr Preis stehen im ADR.
- Der Login prüft mit `Hash::check`, meldet einheitlich und ist **gedrosselt**.
- Logout widerruft nur das **aktuelle** Token.
- **Geschäftsregeln** setzt das Backend durch; das Frontend zeigt sie nur an.
- Gegen **Race Conditions** helfen eine Transaktion mit `lockForUpdate()` und ein Constraint als Netz.
