---
title: Mails und Notifications
summary: E-Mails als Mailable-Klassen bauen, lokal ins Log schicken und Benachrichtigungen über mehrere Kanäle wie Mail und Datenbank verteilen.
duration: 25
sources:
  - title: Laravel – Mail
    url: https://laravel.com/docs/13.x/mail
  - title: Laravel – Notifications
    url: https://laravel.com/docs/13.x/notifications
quiz:
  - type: single
    question: In `.env` steht `MAIL_MAILER=log`. Du verschickst eine Mail. Was passiert?
    options:
      - Die Mail geht an einen echten SMTP-Server
      - Die komplette Mail wird in die Log-Datei geschrieben, niemand bekommt sie
      - Laravel wirft einen Fehler, weil kein Server konfiguriert ist
    answer: 1
    explanation: Der log-Mailer schreibt die Nachricht nach storage/logs. Ideal für die Entwicklung – es kann nichts versehentlich an echte Adressen gehen.
  - type: match
    question: Welche Methode einer Mailable-Klasse ist wofür zuständig?
    pairs:
      - { left: "envelope()", right: "Betreff, Absender, Antwortadresse" }
      - { left: "content()", right: Die Blade- oder Markdown-Vorlage für den Inhalt }
      - { left: "attachments()", right: Dateianhänge }
    explanation: Laravel trennt Umschlag, Inhalt und Anhänge in drei Methoden. Daten für die Vorlage stehen als öffentliche Eigenschaften zur Verfügung.
  - type: multiple
    question: Welche Aussagen über Notifications stimmen?
    options:
      - "`via()` legt fest, über welche Kanäle die Notification geht"
      - "Für den Kanal `database` braucht es die Tabelle `notifications`"
      - "Notifications können nur an User-Models geschickt werden"
      - "Mit `ShouldQueue` wird die Notification im Hintergrund verschickt"
    answers: [0, 1, 3]
    explanation: Jedes Model mit dem Trait Notifiable kann Notifications empfangen – und mit Notification::route() sogar eine beliebige Adresse ohne Model.
  - type: cloze
    text: "Ein User mit dem Trait `Notifiable` bekommt eine Benachrichtigung mit `$user->___(new InvoicePaid($invoice));`. Eine Mailable verschickst du mit `Mail::___($user)->send(new WelcomeMail($user));`."
    blanks:
      - [notify]
      - [to]
    explanation: notify() gehört zum Trait Notifiable. Mail::to() legt den Empfänger fest, send() verschickt sofort, queue() über die Queue.
tasks:
  - id: mail-und-notification
    type: terminal
    title: Willkommens-Mail und Passwort-Hinweis
    description: |
      Im Ordner `mail-uebung` liegt eine frische Laravel-Anwendung mit `MAIL_MAILER=log`.

      1. Erzeuge eine Mailable: `php artisan make:mail WelcomeMail --markdown=mail.welcome`.
         - Der Konstruktor bekommt `public User $user`.
         - Der Betreff lautet `Willkommen bei Stacklab, <Name>!` (z. B. `Willkommen bei Stacklab, Ada!`).
         - Die Vorlage `resources/views/mail/welcome.blade.php` enthält die Zeile `Hallo {{ $user->name }},`.
      2. Erzeuge eine Notification: `php artisan make:notification PasswordChanged`.
         - Kanäle: `mail` und `database`.
         - `toMail()`: Betreff `Dein Passwort wurde geändert`.
         - `toArray()`: `['message' => 'Passwort geändert']`.
      3. Lege die Tabelle für Datenbank-Notifications an: `php artisan make:notifications-table` und
         `php artisan migrate`.
      4. Lege in Tinker einen Nutzer **Ada** (`ada@example.com`) an, schicke ihm die `WelcomeMail` und die
         Notification `PasswordChanged`.
      5. Sieh dir das Ergebnis in `storage/logs/laravel.log` an.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: mail-uebung
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
      - type: command
        run: |
          php artisan tinker --execute="\$u = new App\Models\User(['name' => 'Grace', 'email' => 'grace@example.com']); \$m = new App\Mail\WelcomeMail(\$u); echo \$m->envelope()->subject, '|', str_contains(\$m->render(), 'Hallo Grace,') ? 'vorlage' : 'ohne-gruss';"
        stdout_matches: "^Willkommen bei Stacklab, Grace!\\|vorlage\\s*$"
        message: "WelcomeMail braucht den Betreff „Willkommen bei Stacklab, <Name>!“ und in der Vorlage die Zeile „Hallo {{ $user->name }},“."
      - type: file_contains
        path: storage/logs/laravel.log
        pattern: "Willkommen bei Stacklab, Ada!"
        message: Im Log fehlt die Willkommens-Mail an Ada. Hast du sie mit Mail::to($user)->send(new WelcomeMail($user)) verschickt?
      - type: command
        run: |
          php artisan tinker --execute="\$n = new App\Notifications\PasswordChanged(); echo implode(',', \$n->via(new App\Models\User())), '|', \$n->toMail(new App\Models\User())->subject, '|', json_encode(\$n->toArray(new App\Models\User()), JSON_UNESCAPED_UNICODE);"
        stdout_matches: "^mail,database\\|Dein Passwort wurde geändert\\|\\{\"message\":\"Passwort geändert\"\\}\\s*$"
        message: PasswordChanged soll über mail und database gehen, den Betreff „Dein Passwort wurde geändert“ haben und toArray() ['message' => 'Passwort geändert'] liefern.
      - type: command
        run: |
          php artisan tinker --execute="\$u = App\Models\User::where('email', 'ada@example.com')->first(); echo \$u ? \$u->notifications()->where('type', App\Notifications\PasswordChanged::class)->count() : 'kein-user';"
        stdout_matches: "^[1-9]\\d*\\s*$"
        message: Ada hat noch keine gespeicherte PasswordChanged-Notification. Lege die notifications-Tabelle an (make:notifications-table, migrate) und rufe $user->notify(new PasswordChanged()) auf.
    hints:
      - "Im Mailable: `public function __construct(public User $user) {}` und `new Envelope(subject: 'Willkommen bei Stacklab, '.$this->user->name.'!')`."
      - "In der Notification: `return ['mail', 'database'];` in `via()` und `(new MailMessage)->subject('Dein Passwort wurde geändert')->line('…')` in `toMail()`."
      - "In Tinker: `$u = App\\Models\\User::create(['name' => 'Ada', 'email' => 'ada@example.com', 'password' => 'geheim123']); Mail::to($u)->send(new App\\Mail\\WelcomeMail($u)); $u->notify(new App\\Notifications\\PasswordChanged());`"
    solution: |
      ```php title="app/Mail/WelcomeMail.php (Auszug)"
      public function __construct(public User $user) {}

      public function envelope(): Envelope
      {
          return new Envelope(subject: 'Willkommen bei Stacklab, '.$this->user->name.'!');
      }

      public function content(): Content
      {
          return new Content(markdown: 'mail.welcome');
      }
      ```

      ```blade title="resources/views/mail/welcome.blade.php"
      <x-mail::message>
      # Willkommen!

      Hallo {{ $user->name }},

      schön, dass du da bist.

      Viele Grüße,<br>
      {{ config('app.name') }}
      </x-mail::message>
      ```

      ```php title="app/Notifications/PasswordChanged.php (Auszug)"
      public function via(object $notifiable): array
      {
          return ['mail', 'database'];
      }

      public function toMail(object $notifiable): MailMessage
      {
          return (new MailMessage)
              ->subject('Dein Passwort wurde geändert')
              ->line('Warst du das nicht? Melde dich bitte sofort bei uns.');
      }

      public function toArray(object $notifiable): array
      {
          return ['message' => 'Passwort geändert'];
      }
      ```

      ```bash
      php artisan make:notifications-table
      php artisan migrate
      php artisan tinker --execute="\$u = App\Models\User::create(['name' => 'Ada', 'email' => 'ada@example.com', 'password' => 'geheim123']); Mail::to(\$u)->send(new App\Mail\WelcomeMail(\$u)); \$u->notify(new App\Notifications\PasswordChanged());"
      ```
  - id: mail-oder-notification
    type: dragdrop
    title: Mailable oder Notification?
    description: Ordne jede Anforderung dem passenden Werkzeug zu.
    targets:
      - { id: mailable, label: Mailable }
      - { id: notification, label: Notification }
    items:
      - { label: Ein monatlicher Newsletter mit eigenem Layout und Bildern, target: mailable }
      - { label: "„Deine Bestellung wurde versandt“ per Mail und als Glocke in der App", target: notification }
      - { label: Eine Rechnung als PDF-Anhang mit individuellem Design, target: mailable }
      - { label: "Hinweis an alle Admins per Mail und Slack, wenn ein Import scheitert", target: notification }
      - { label: "Liste ungelesener Hinweise im Nutzerkonto", target: notification }
    hints:
      - Mehrere Kanäle oder gespeicherte Hinweise sprechen für eine Notification.
      - Eine aufwendig gestaltete einzelne Mail ist ein Fall für ein Mailable.
---
Nach der Registrierung soll eine Willkommens-Mail rausgehen. Ändert jemand sein Passwort, soll er eine
Mail bekommen **und** in der App einen Hinweis sehen. Laravel bietet dafür zwei Werkzeuge: **Mailables**
für E-Mails und **Notifications** für Benachrichtigungen über beliebige Kanäle.

## Mails als Klassen: Mailables

Ein [[mailable|Mailable]] ist eine Klasse, die genau eine Art E-Mail beschreibt:

```bash title="Terminal"
php artisan make:mail WelcomeMail --markdown=mail.welcome
```

```php title="app/Mail/WelcomeMail.php"
class WelcomeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Willkommen bei Stacklab, '.$this->user->name.'!');
    }

    public function content(): Content
    {
        return new Content(markdown: 'mail.welcome');
    }
}
```

| Methode | Zweck |
|---|---|
| `envelope()` | Betreff, Absender, Antwortadresse |
| `content()` | Vorlage (`view:` für HTML, `markdown:` für Markdown) |
| `attachments()` | Dateianhänge |

Öffentliche Eigenschaften wie `$user` stehen in der Vorlage automatisch zur Verfügung.

## Vorlage und Versand

Markdown-Mails nutzen fertige Bausteine und sehen ohne eigenes CSS ordentlich aus:

```blade title="resources/views/mail/welcome.blade.php"
<x-mail::message>
# Willkommen!

Hallo {{ $user->name }},

<x-mail::button :url="url('/dashboard')">
Zum Dashboard
</x-mail::button>
</x-mail::message>
```

Verschickt wird mit dem `Mail`-Facade:

```php
Mail::to($user)->send(new WelcomeMail($user));    // sofort
Mail::to($user)->queue(new WelcomeMail($user));   // über die Queue
```

Wohin Mails gehen, steuert `MAIL_MAILER` in `.env`:

| Wert | Wirkung |
|---|---|
| `log` | ganze Mail in `storage/logs/laravel.log` – Standard für die Entwicklung |
| `smtp` | echter Versand über einen [[smtp|SMTP]]-Server |
| `array` | nur im Speicher – für Tests |

Anhänge gibst du in `attachments()` zurück – zum Beispiel eine Rechnung, die schon auf einer Disk liegt:

```php
public function attachments(): array
{
    return [
        Attachment::fromStorage('invoices/R-1001.pdf')->as('Rechnung.pdf'),
    ];
}
```

Implementiert das Mailable selbst `ShouldQueue`, landet es bei jedem `send()` automatisch in der Queue.
So kannst du nicht versehentlich eine langsame Mail im Request verschicken.

> [!TIPP]
> Eine Mail kannst du im Browser ansehen, indem eine Route sie zurückgibt:
> `Route::get('/mail-vorschau', fn () => new WelcomeMail(User::first()));`

## Notifications: eine Nachricht, viele Kanäle

Eine [[notification|Notification]] beschreibt **was** passiert ist und überlässt die Darstellung den
Kanälen – Mail, Datenbank, SMS, Slack.

```php title="app/Notifications/PasswordChanged.php"
class PasswordChanged extends Notification
{
    use Queueable;

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Dein Passwort wurde geändert')
            ->line('Warst du das nicht? Melde dich bitte sofort.');
    }

    public function toArray(object $notifiable): array
    {
        return ['message' => 'Passwort geändert'];
    }
}
```

`toArray()` liefert die Daten, die der Kanal `database` als JSON in die Tabelle `notifications` schreibt.
Diese Tabelle legst du einmal an: `php artisan make:notifications-table` und `php artisan migrate`.

## Notifications verschicken und lesen

Empfänger ist jedes Model mit dem Trait `Notifiable` – das `User`-Model hat ihn schon:

```php
$user->notify(new PasswordChanged());

// ohne Model, an eine beliebige Adresse
Notification::route('mail', 'support@example.com')->notify(new ImportFailed($import));
```

Die gespeicherten Hinweise liest du für die „Glocke“ in der App:

```php
$user->unreadNotifications;            // ungelesene
$user->unreadNotifications->markAsRead();
```

> [!FEHLER]
> **Langsamer Versand im Request.** Mails gehen über das Netzwerk an einen Mailserver – das kann Sekunden
> dauern. Implementiert die Notification `ShouldQueue` (oder du nutzt `Mail::queue()`), antwortet die
> Seite sofort und ein Worker verschickt im Hintergrund.

> [!MERKSATZ]
> **Mailable** = eine gestaltete E-Mail. **Notification** = ein Ereignis für den Nutzer, das über einen
> oder mehrere Kanäle zugestellt wird.

> [!PRAXIS]
> In der Entwicklung nutzt man `MAIL_MAILER=log` oder ein lokales Postfach-Tool, damit keine Mail an echte
> Kundenadressen geht. Testdaten verwenden Adressen wie `kunde@example.com` – die Domain `example.com`
> ist für Beispiele reserviert.

## Zusammenfassung

- Ein **Mailable** beschreibt eine E-Mail mit `envelope()`, `content()` und `attachments()`.
- `Mail::to($user)->send()` verschickt sofort, `->queue()` über die Queue.
- `MAIL_MAILER=log` schreibt Mails ins Log – sicher für die Entwicklung.
- Eine **Notification** wählt in `via()` ihre Kanäle und liefert pro Kanal eine Darstellung (`toMail`, `toArray`).
- `$user->notify()` oder `Notification::route('mail', …)->notify()` verschickt; `database` braucht die Tabelle `notifications`.
