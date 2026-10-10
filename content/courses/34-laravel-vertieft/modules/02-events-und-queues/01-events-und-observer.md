---
title: Events, Listener und Observer
summary: Code entkoppeln – ein Ereignis melden, ohne zu wissen, wer darauf reagiert, und auf Model-Änderungen automatisch reagieren.
duration: 25
sources:
  - title: Laravel – Events
    url: https://laravel.com/docs/13.x/events
  - title: Laravel – Eloquent Events und Observer
    url: https://laravel.com/docs/13.x/eloquent#observers
quiz:
  - type: single
    question: Warum löst der Registrierungs-Code ein Event `UserRegistered` aus, statt Willkommens-Mail, Newsletter-Anmeldung und Statistik direkt aufzurufen?
    options:
      - Weil Events schneller sind als Methodenaufrufe
      - Damit der Registrierungs-Code nicht wissen muss, wer alles reagiert – neue Reaktionen kommen ohne Änderung dazu
      - Weil Laravel Mails nur aus Listenern verschicken kann
    answer: 1
    explanation: Events entkoppeln. Der Auslöser meldet nur „das ist passiert“. Neue Listener lassen sich ergänzen, ohne den Auslöser anzufassen.
  - type: match
    question: Welche Observer-Methode läuft wann?
    pairs:
      - { left: creating, right: Vor dem ersten Speichern eines neuen Datensatzes }
      - { left: created, right: Nach dem ersten Speichern }
      - { left: saving, right: Vor jedem Speichern – neu oder geändert }
      - { left: deleted, right: Nachdem ein Datensatz gelöscht wurde }
    explanation: Methoden auf -ing laufen vorher und können Werte noch ändern, Methoden auf -ed laufen danach. saving/saved decken Anlegen und Ändern gemeinsam ab.
  - type: multiple
    question: Wann löst Eloquent **keine** Model-Events aus?
    options:
      - "Bei `User::where('active', false)->update(['active' => true])`"
      - "Bei `$user->save()`"
      - "Bei `User::where('id', '<', 10)->delete()`"
      - "Bei `$user->saveQuietly()`"
    answers: [0, 2, 3]
    explanation: Massen-Updates und -Löschungen laufen direkt als SQL und laden keine Models – also feuern keine Events. saveQuietly() unterdrückt sie absichtlich.
  - type: cloze
    text: "Listener im Ordner `app/Listeners` findet Laravel automatisch über den Typ des Parameters von ___(). Mit `php artisan event:___` siehst du alle registrierten Events und Listener."
    blanks:
      - [handle]
      - [list]
    explanation: Event Discovery liest den Typ des Parameters in handle() oder __invoke(). event:list zeigt das Ergebnis.
tasks:
  - id: observer-und-listener
    type: terminal
    title: Observer und Event für neue Nutzer
    description: |
      Im Ordner `events-uebung` liegt eine frische Laravel-Anwendung mit dem Model `User`.

      1. Erzeuge `php artisan make:observer UserObserver --model=User`.
         - In `saving` wird die E-Mail-Adresse bereinigt: Leerzeichen am Rand weg, alles klein
           (`Str::lower(trim(...))`).
         - In `created` wird das Event `UserRegistered` ausgelöst.
      2. Registriere den Observer mit `#[ObservedBy([UserObserver::class])]` am `User`-Model.
      3. Erzeuge das Event `UserRegistered` mit `public User $user` im Konstruktor.
      4. Erzeuge den Listener `LogRegistration` (`--event=UserRegistered`). Er schreibt ins Log:
         `Log::info('Neue Registrierung: '.$event->user->email);`
      5. Probiere es in Tinker aus und sieh in `storage/logs/laravel.log` nach.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: events-uebung
    setup: |
      # Laravel-13-Basis (mit Pest) einmal bauen und zwischenspeichern, dann hierher kopieren
      B="$HOME/.cache/stacklab/laravel13"
      if [ ! -f "$B/.fertig" ]; then
        T="$B.bau.$$"; rm -rf "$T"; mkdir -p "$(dirname "$B")"
        timeout 170 composer create-project laravel/laravel "$T" "^13.0" -n -q --prefer-dist </dev/null
        cd "$T"
        timeout 170 composer require pestphp/pest pestphp/pest-plugin-laravel --dev -W -n -q </dev/null
        printf '%s\n' '<?php' '' "pest()->extend(Tests\\TestCase::class)->in('Feature');" > tests/Pest.php
        printf '%s\n' '<?php' '' "test('the application returns a successful response', function () {" "    \$this->get('/')->assertStatus(200);" '});' > tests/Feature/ExampleTest.php
        printf '%s\n' '<?php' '' "test('that true is true', function () {" '    expect(true)->toBeTrue();' '});' > tests/Unit/ExampleTest.php
        touch .fertig && cd - >/dev/null
        rm -rf "$B" && mv "$T" "$B"
      fi
      cp -a "$B/." . && rm -f .fertig
    checks:
      - type: file_contains
        path: app/Models/User.php
        pattern: "ObservedBy\\("
        message: "Registriere den Observer mit #[ObservedBy([UserObserver::class])] am User-Model."
      - type: command
        run: php artisan tinker --execute="DB::beginTransaction(); echo App\Models\User::create(['name' => 'Ada', 'email' => '  Ada@Example.COM ', 'password' => 'geheim123'])->fresh()->email; DB::rollBack();"
        stdout_matches: "^ada@example\\.com\\s*$"
        message: "Die E-Mail wird noch nicht bereinigt. Aus „  Ada@Example.COM “ soll „ada@example.com“ werden (saving im Observer)."
      - type: command
        run: php artisan event:list --event=UserRegistered
        stdout_matches: "LogRegistration"
        message: Für das Event UserRegistered ist noch kein Listener LogRegistration registriert.
      - type: command
        run: |
          php artisan tinker --execute="DB::beginTransaction(); \$mail = 'pruefung-'.Str::lower(Str::random(6)).'@example.com'; App\Models\User::create(['name' => 'Grace', 'email' => \$mail, 'password' => 'geheim123']); DB::rollBack(); echo str_contains(file_get_contents(storage_path('logs/laravel.log')), 'Neue Registrierung: '.\$mail) ? 'geloggt' : 'fehlt';"
        stdout_matches: "^geloggt\\s*$"
        message: "Nach dem Anlegen eines Users fehlt im Log die Zeile „Neue Registrierung: <email>“. Löst created das Event aus, und schreibt der Listener ins Log?"
    hints:
      - "Im Observer: `public function saving(User $user): void { $user->email = Str::lower(trim($user->email)); }`"
      - "In `created`: `UserRegistered::dispatch($user);` – der Trait `Dispatchable` im Event macht das möglich."
      - "Das Attribut braucht `use Illuminate\\Database\\Eloquent\\Attributes\\ObservedBy;` und `use App\\Observers\\UserObserver;` im Model."
    solution: |
      ```bash
      cd events-uebung
      php artisan make:observer UserObserver --model=User
      php artisan make:event UserRegistered
      php artisan make:listener LogRegistration --event=UserRegistered
      ```

      ```php title="app/Observers/UserObserver.php"
      class UserObserver
      {
          public function saving(User $user): void
          {
              $user->email = Str::lower(trim($user->email));
          }

          public function created(User $user): void
          {
              UserRegistered::dispatch($user);
          }
      }
      ```

      ```php title="app/Models/User.php (Auszug)"
      #[ObservedBy([UserObserver::class])]
      #[Fillable(['name', 'email', 'password'])]
      #[Hidden(['password', 'remember_token'])]
      class User extends Authenticatable
      ```

      ```php title="app/Events/UserRegistered.php"
      class UserRegistered
      {
          use Dispatchable, SerializesModels;

          public function __construct(public User $user) {}
      }
      ```

      ```php title="app/Listeners/LogRegistration.php"
      public function handle(UserRegistered $event): void
      {
          Log::info('Neue Registrierung: '.$event->user->email);
      }
      ```
  - id: event-ablauf
    type: steps
    title: Was passiert als Nächstes?
    description: Verfolge, was beim Anlegen eines Nutzers geschieht. Der User hat einen Observer mit `saving` und `created`; `created` löst `UserRegistered` aus. Es gibt zwei Listener – einer davon implementiert `ShouldQueue`.
    steps:
      - situation: "Der Controller ruft `User::create([...])` auf."
        question: Was läuft zuerst?
        options:
          - "Der Observer mit `saving` (und `creating`)"
          - Der Listener für UserRegistered
          - Das INSERT in die Datenbank
        answer: 0
        explanation: Vor dem Speichern laufen die -ing-Methoden. Sie können Werte noch ändern, zum Beispiel die E-Mail bereinigen.
      - situation: Der Datensatz wurde per INSERT gespeichert.
        question: Welche Observer-Methode folgt jetzt?
        options:
          - updated
          - created (und saved)
          - retrieved
        answer: 1
        explanation: Nach dem ersten Speichern laufen created und saved. In created wird hier das Event ausgelöst.
      - situation: "`UserRegistered::dispatch($user)` wird aufgerufen."
        question: Was passiert mit dem Listener, der `ShouldQueue` implementiert?
        options:
          - Er läuft sofort im selben Request
          - Er wird als Job in die Queue gelegt und später von einem Worker ausgeführt
          - Er wird übersprungen
        answer: 1
        explanation: Listener mit ShouldQueue laufen nicht sofort. Laravel verpackt sie als Job – der Request wird dadurch nicht langsamer.
      - situation: "Statt `User::create()` führt jemand `User::where('email', 'like', '%@example.com')->update(['name' => 'Test'])` aus."
        question: Feuert der Observer?
        options:
          - Ja, für jeden betroffenen Datensatz
          - Nein, Massen-Updates laden keine Models und lösen keine Model-Events aus
        answer: 1
        explanation: Das Update läuft direkt als SQL. Willst du Events, lädst du die Models und speicherst sie einzeln.
---
Wenn sich jemand registriert, soll eine Willkommens-Mail rausgehen, der Newsletter-Dienst informiert
werden und die Statistik hochzählen. Schreibst du das alles in den Registrierungs-Controller, wird er mit
jeder neuen Anforderung länger – und muss jede Kleinigkeit kennen. **Events** drehen das um.

## Events und Listener

Ein [[event|Event]] meldet: „Das ist gerade passiert.“ Ein [[event-listener|Listener]] reagiert darauf.
Wie bei einer Durchsage im Bahnhof: Der Sprecher weiß nicht, wer zuhört – wen es betrifft, der reagiert.

```bash title="Terminal"
php artisan make:event UserRegistered
php artisan make:listener SendWelcomeMail --event=UserRegistered
```

Das Event ist eine einfache Klasse, die die nötigen Daten trägt:

```php title="app/Events/UserRegistered.php"
class UserRegistered
{
    use Dispatchable, SerializesModels;

    public function __construct(public User $user) {}
}
```

Der Listener bekommt das Event in `handle()`:

```php title="app/Listeners/SendWelcomeMail.php"
public function handle(UserRegistered $event): void
{
    Mail::to($event->user)->send(new WelcomeMail($event->user));
}
```

Ausgelöst wird es mit einer Zeile:

```php
UserRegistered::dispatch($user);   // oder: event(new UserRegistered($user));
```

## Wie Laravel Listener findet

Du musst Listener nirgends eintragen. Laravel durchsucht `app/Listeners` und schaut, welchen Typ der
Parameter von `handle()` hat (*Event Discovery*). `handle(UserRegistered $event)` heißt also: „Ich höre
auf `UserRegistered`.“

```bash title="Terminal"
php artisan event:list --event=UserRegistered
```

Willst du einen Listener von Hand verbinden, etwa eine Closure, geht das in `boot()` eines Providers:

```php
Event::listen(function (UserRegistered $event) {
    Log::info('Registriert: '.$event->user->email);
});
```

> [!MERKSATZ]
> Ein Event weiß nichts über seine Listener. Neue Reaktionen fügst du hinzu, indem du einen Listener
> schreibst – der Auslöser bleibt unverändert.

## Langsame Listener in die Queue

Mails verschicken dauert. Implementiert ein Listener `ShouldQueue`, legt Laravel ihn als Job in die
[[job-queue|Queue]] und der Request antwortet sofort. Wie Queues funktionieren, lernst du in der nächsten
Lektion.

```php
class SendWelcomeMail implements ShouldQueue
{
    public function handle(UserRegistered $event): void { /* … */ }
}
```

> [!FEHLER]
> **Event in einer Transaktion, Listener in der Queue.** Der Worker startet womöglich, bevor die
> Transaktion bestätigt ist – und findet den User noch nicht. Implementiert das Event
> `ShouldDispatchAfterCommit`, wartet Laravel mit dem Auslösen bis nach dem Commit.

## Observer: auf Model-Änderungen reagieren

[[eloquent|Eloquent]] löst bei jedem Speichern eigene Model-Events aus. Ein [[observer|Observer]] bündelt
die Reaktionen auf ein Model in einer Klasse:

```bash title="Terminal"
php artisan make:observer UserObserver --model=User
```

```php title="app/Observers/UserObserver.php"
class UserObserver
{
    public function saving(User $user): void
    {
        $user->email = Str::lower(trim($user->email));
    }

    public function created(User $user): void
    {
        UserRegistered::dispatch($user);
    }
}
```

Registriert wird er per Attribut am Model:

```php title="app/Models/User.php"
#[ObservedBy([UserObserver::class])]
class User extends Authenticatable
```

| Methode | Zeitpunkt |
|---|---|
| `creating` / `created` | vor / nach dem ersten Speichern |
| `updating` / `updated` | vor / nach dem Speichern einer Änderung |
| `saving` / `saved` | vor / nach **jedem** Speichern |
| `deleting` / `deleted` | vor / nach dem Löschen |

> [!ACHTUNG]
> Massen-Updates wie `User::where(...)->update([...])` laufen direkt als SQL. Dabei werden keine Models
> geladen – Observer und Model-Events feuern **nicht**.

## Observer oder Event?

| Frage | Werkzeug |
|---|---|
| Technische Regel für ein Model (Slug setzen, E-Mail bereinigen, Cache leeren) | Observer |
| Fachliches Ereignis, auf das mehrere Teile reagieren (Bestellung bezahlt) | Event + Listener |

> [!PRAXIS]
> In großen Projekten wird ein Observer schnell zur „Magie“, die niemand findet. Halte Observer klein
> und technisch. Fachliche Abläufe gehören in benannte Events – die tauchen in `event:list` auf und
> lassen sich im Test gezielt mit `Event::fake()` prüfen.

## Zusammenfassung

- Ein **Event** meldet, dass etwas passiert ist; **Listener** reagieren darauf, ohne dass der Auslöser sie kennt.
- Listener in `app/Listeners` werden über den Typ in `handle()` automatisch gefunden (`event:list`).
- Listener mit `ShouldQueue` laufen im Hintergrund; `ShouldDispatchAfterCommit` wartet auf den Commit.
- **Observer** bündeln Reaktionen auf Model-Events wie `saving`, `created` oder `deleted`.
- Registrierung per `#[ObservedBy([...])]` am Model.
- Massen-Updates und `saveQuietly()` lösen keine Model-Events aus.
