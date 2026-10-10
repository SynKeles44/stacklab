---
title: Mocking und Test-Doubles
summary: Wie du langsame oder externe Abhängigkeiten durch Stubs, Fakes, Mocks und Spies ersetzt – von Hand und mit Mockery.
duration: 25
sources:
  - title: Pest – Mocking
    url: https://pestphp.com/docs/mocking
  - title: Mockery – Dokumentation
    url: https://docs.mockery.io/en/latest/
  - title: Martin Fowler – Mocks Aren't Stubs
    url: https://martinfowler.com/articles/mocksArentStubs.html
quiz:
  - type: match
    question: Ordne jedem Test-Double seine Eigenschaft zu.
    pairs:
      - { left: Stub, right: Liefert vorbereitete Antworten auf Aufrufe }
      - { left: Fake, right: "Funktionierende Vereinfachung, z. B. Speicher statt Datenbank" }
      - { left: Mock, right: "Legt vorher fest, welche Aufrufe erwartet werden" }
      - { left: Spy, right: Zeichnet Aufrufe auf – geprüft wird danach }
    explanation: Alle vier sind Test-Doubles. Stubs und Fakes liefern Daten, Mocks und Spies prüfen das Zusammenspiel.
  - type: single
    question: "Die Klasse `Checkout` erzeugt im Konstruktor selbst `new StripeGateway()`. Warum ist sie schwer zu testen?"
    options:
      - Weil der Test die echte Abhängigkeit nicht durch ein Double ersetzen kann.
      - Weil Konstruktoren in Tests nicht erlaubt sind.
      - Weil Mockery nur mit Interfaces funktioniert.
    answer: 0
    explanation: Wer seine Abhängigkeiten selbst erzeugt, lässt keinen Austausch zu. Mit Dependency Injection (die Abhängigkeit wird hereingereicht) kann der Test ein Double übergeben.
  - type: find-bug
    question: Der Test soll prüfen, dass genau 4990 Cent abgebucht werden. Er ist aber auch grün, wenn `Checkout` 1 Cent abbucht. In welcher Zeile fehlt etwas?
    language: php
    code: |
      <?php

      it('bucht den Warenkorbwert ab', function () {
          $gateway = Mockery::mock(PaymentGateway::class);
          $gateway->shouldReceive('charge')->andReturn('tx-1');

          $checkout = new Checkout($gateway);

          expect($checkout->pay(4990))->toBe('tx-1');
      });
    bug_line: 5
    explanation: "Ohne `->with(4990)` akzeptiert der Mock jedes Argument. Erst `shouldReceive('charge')->once()->with(4990)` prüft den Betrag – und dass genau einmal abgebucht wird."
  - type: multiple
    question: Wann ist ein Test-Double sinnvoll?
    options:
      - Für einen Zahlungsanbieter, der echtes Geld abbuchen würde.
      - Für das Versenden von E-Mails.
      - Für eine kleine Hilfsfunktion, die nur zwei Zahlen addiert.
      - Für die aktuelle Uhrzeit, damit der Test jeden Tag gleich läuft.
    answers: [0, 1, 3]
    explanation: Doubles ersetzen Dinge, die langsam, teuer, unberechenbar oder außerhalb deiner Kontrolle sind. Reine Logik testest du mit dem echten Code.
tasks:
  - id: fake-mailer
    type: code
    language: php
    title: Schreibe einen Fake-Mailer
    description: |
      `Registration` verschickt nach der Anmeldung eine Willkommensmail über das Interface `Mailer`.
      Im Test soll natürlich keine echte Mail rausgehen. Schreibe deshalb einen **Fake**:

      1. Die Klasse `FakeMailer` implementiert `Mailer`.
      2. `send()` speichert jede Mail als Array `['to' => …, 'subject' => …]` in der öffentlichen
         Eigenschaft `$sent` (am Anfang ein leeres Array).
      3. `sentTo(string $address): int` gibt zurück, wie viele Mails an diese Adresse gingen.

      `Mailer` und `Registration` sind schon fertig – ändere sie nicht.
    starter: |
      <?php

      declare(strict_types=1);

      interface Mailer
      {
          public function send(string $to, string $subject): void;
      }

      final class Registration
      {
          public function __construct(private Mailer $mailer) {}

          public function register(string $email): void
          {
              if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
                  throw new InvalidArgumentException('Invalid email.');
              }
              $this->mailer->send($email, 'Willkommen!');
          }
      }

      final class FakeMailer implements Mailer
      {
          // speichere hier die verschickten Mails

          public function send(string $to, string $subject): void
          {
          }

          public function sentTo(string $address): int
          {
              return 0;
          }
      }
    tests:
      - name: Anfangs wurde nichts verschickt
        code: |
          $mailer = new FakeMailer();
          assert_same([], $mailer->sent);
          assert_same(0, $mailer->sentTo('ada@example.com'));
      - name: Registrierung verschickt eine Willkommensmail
        code: |
          $mailer = new FakeMailer();
          (new Registration($mailer))->register('ada@example.com');
          assert_same([['to' => 'ada@example.com', 'subject' => 'Willkommen!']], $mailer->sent);
      - name: sentTo zählt pro Adresse
        code: |
          $mailer = new FakeMailer();
          $registration = new Registration($mailer);
          $registration->register('ada@example.com');
          $registration->register('grace@example.com');
          $registration->register('ada@example.com');
          assert_same(2, $mailer->sentTo('ada@example.com'));
          assert_same(1, $mailer->sentTo('grace@example.com'));
      - name: Ungültige Adresse verschickt nichts
        code: |
          $mailer = new FakeMailer();
          try {
              (new Registration($mailer))->register('kein-at-zeichen');
          } catch (InvalidArgumentException) {
          }
          assert_same(0, count($mailer->sent));
    hints:
      - "Lege die Eigenschaft so an: `public array $sent = [];`"
      - "In `send()`: `$this->sent[] = ['to' => $to, 'subject' => $subject];`"
      - "`sentTo()` kann `array_filter` und `count` nutzen – oder eine einfache Schleife."
    solution: |
      <?php

      declare(strict_types=1);

      interface Mailer
      {
          public function send(string $to, string $subject): void;
      }

      final class Registration
      {
          public function __construct(private Mailer $mailer) {}

          public function register(string $email): void
          {
              if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
                  throw new InvalidArgumentException('Invalid email.');
              }
              $this->mailer->send($email, 'Willkommen!');
          }
      }

      final class FakeMailer implements Mailer
      {
          public array $sent = [];

          public function send(string $to, string $subject): void
          {
              $this->sent[] = ['to' => $to, 'subject' => $subject];
          }

          public function sentTo(string $address): int
          {
              return count(array_filter($this->sent, fn (array $mail) => $mail['to'] === $address));
          }
      }
  - id: mockery-checkout
    type: terminal
    title: Den Zahlungsanbieter mit Mockery ersetzen
    description: |
      Im Ordner `mocking` liegt ein Pest-Projekt mit Mockery. `App\Checkout` bekommt im Konstruktor ein
      `App\PaymentGateway` und ruft in `pay(int $cents)` die Methode `charge($cents)` auf. Wirft das
      Gateway eine `App\PaymentFailed`-Exception, gibt `pay()` den Text `abgelehnt` zurück, sonst die
      Transaktions-ID.

      1. Lege `tests/Unit/CheckoutTest.php` an.
      2. **Test 1:** Erzeuge mit `Mockery::mock(PaymentGateway::class)` einen Mock, der erwartet, dass
         `charge` **genau einmal** mit `4990` aufgerufen wird, und `tx-42` zurückgibt. Prüfe, dass
         `pay(4990)` `tx-42` liefert.
      3. **Test 2:** Lass `charge` eine `new PaymentFailed()` werfen (`andThrow`) und prüfe, dass `pay()`
         `abgelehnt` zurückgibt.
      4. Starte `./vendor/bin/pest`.

      Klicke zuerst auf **Aufgabe vorbereiten** (Composer installiert dabei Pest und Mockery).
    workdir: mocking
    setup: |
      cat > composer.json <<'EOF'
      {
          "name": "stacklab/mocking",
          "type": "project",
          "require": {
              "php": "^8.4"
          },
          "require-dev": {
              "pestphp/pest": "^5.3",
              "mockery/mockery": "^1.6"
          },
          "autoload": {
              "psr-4": { "App\\": "src/" }
          },
          "config": {
              "allow-plugins": { "pestphp/pest-plugin": true }
          }
      }
      EOF
      cat > phpunit.xml <<'EOF'
      <?xml version="1.0" encoding="UTF-8"?>
      <phpunit bootstrap="vendor/autoload.php" colors="true">
          <testsuites>
              <testsuite name="Test Suite">
                  <directory suffix="Test.php">./tests</directory>
              </testsuite>
          </testsuites>
          <source>
              <include>
                  <directory>src</directory>
              </include>
          </source>
      </phpunit>
      EOF
      mkdir -p src tests/Unit
      printf '<?php\n' > tests/Pest.php
      cat > src/PaymentGateway.php <<'EOF'
      <?php

      declare(strict_types=1);

      namespace App;

      interface PaymentGateway
      {
          /** @throws PaymentFailed */
          public function charge(int $cents): string;
      }
      EOF
      cat > src/PaymentFailed.php <<'EOF'
      <?php

      declare(strict_types=1);

      namespace App;

      final class PaymentFailed extends \RuntimeException
      {
      }
      EOF
      cat > src/Checkout.php <<'EOF'
      <?php

      declare(strict_types=1);

      namespace App;

      final class Checkout
      {
          public function __construct(private PaymentGateway $gateway)
          {
          }

          public function pay(int $cents): string
          {
              try {
                  return $this->gateway->charge($cents);
              } catch (PaymentFailed) {
                  return 'abgelehnt';
              }
          }
      }
      EOF
      timeout 150 composer install -n -q </dev/null
    checks:
      - type: file_exists
        path: tests/Unit/CheckoutTest.php
        message: Lege tests/Unit/CheckoutTest.php an.
      - type: file_contains
        path: tests/Unit/CheckoutTest.php
        pattern: "Mockery::(mock|spy)\\("
        message: Erzeuge das Gateway mit Mockery::mock(PaymentGateway::class).
      - type: file_contains
        path: tests/Unit/CheckoutTest.php
        pattern: "->once\\(\\)"
        message: Lege mit ->once() fest, dass charge genau einmal aufgerufen wird.
      - type: file_contains
        path: tests/Unit/CheckoutTest.php
        pattern: "->with\\(\\s*4990\\s*\\)"
        message: Prüfe mit ->with(4990), dass der richtige Betrag abgebucht wird.
      - type: file_contains
        path: tests/Unit/CheckoutTest.php
        pattern: "andThrow\\("
        message: Es fehlt der Test, in dem charge mit andThrow eine PaymentFailed-Exception wirft.
      - type: command
        run: ./vendor/bin/pest tests/Unit/CheckoutTest.php
        message: Deine Tests sind noch nicht grün. Lies die Meldung von ./vendor/bin/pest.
      - type: command
        run: ./vendor/bin/pest --list-tests tests/Unit/CheckoutTest.php 2>/dev/null | grep -c '^ - '
        stdout_matches: "^\\s*([2-9]|[1-9][0-9]+)\\s*$"
        message: Es sollten mindestens zwei Tests in CheckoutTest.php stehen.
    hints:
      - "Oben in die Datei: `use App\\Checkout; use App\\PaymentGateway; use App\\PaymentFailed;`"
      - "`$gateway->shouldReceive('charge')->once()->with(4990)->andReturn('tx-42');`"
      - "Für Test 2: `$gateway->shouldReceive('charge')->andThrow(new PaymentFailed());`"
    solution: |
      ```bash
      cd mocking
      cat > tests/Unit/CheckoutTest.php <<'EOF'
      <?php

      use App\Checkout;
      use App\PaymentFailed;
      use App\PaymentGateway;

      it('bucht den Betrag genau einmal ab', function () {
          $gateway = Mockery::mock(PaymentGateway::class);
          $gateway->shouldReceive('charge')->once()->with(4990)->andReturn('tx-42');

          $checkout = new Checkout($gateway);

          expect($checkout->pay(4990))->toBe('tx-42');
      });

      it('meldet eine abgelehnte Zahlung', function () {
          $gateway = Mockery::mock(PaymentGateway::class);
          $gateway->shouldReceive('charge')->andThrow(new PaymentFailed());

          expect((new Checkout($gateway))->pay(4990))->toBe('abgelehnt');
      });
      EOF
      ./vendor/bin/pest
      ```
---
Deine Klasse `Checkout` bucht über einen Zahlungsanbieter Geld ab. Im Test willst du weder echtes Geld
bewegen noch auf ein langsames Netzwerk warten – und schon gar nicht, dass der Test rot wird, weil der
Anbieter gerade Wartung macht. Die Lösung: Du ersetzt die echte Abhängigkeit im Test durch ein Double.

## Was ist ein Test-Double?

Ein [[test-double|Test-Double]] ist ein Ersatzobjekt, das im Test die Rolle einer echten Abhängigkeit
spielt – wie ein Stunt-Double im Film. Du brauchst eins, wenn die echte Abhängigkeit:

- **langsam** ist (Netzwerk, große Datenbank),
- **Nebenwirkungen** hat (E-Mail, Zahlung, Datei löschen),
- **unberechenbar** ist (aktuelle Uhrzeit, Zufall, fremde API),
- **noch nicht existiert** (ein anderes Team baut sie gerade).

| Art | Was es tut | Beispiel |
|---|---|---|
| [[stub\|Stub]] | liefert vorbereitete Antworten | `getRate()` gibt immer `0.19` zurück |
| [[fake-objekt\|Fake]] | einfache, funktionierende Version | Repository speichert in einem Array |
| [[mock\|Mock]] | erwartet bestimmte Aufrufe, sonst rot | `charge(4990)` muss genau einmal kommen |
| [[spy\|Spy]] | zeichnet auf, du prüfst danach | Welche Mails wurden verschickt? |

> [!MERKSATZ]
> Stubs und Fakes **liefern** Daten an deinen Code. Mocks und Spies **prüfen**, wie dein Code mit der
> Abhängigkeit spricht.

## Voraussetzung: Dependency Injection

Ein Double kannst du nur einsetzen, wenn die Klasse ihre Abhängigkeit nicht selbst erzeugt:

```php
// schwer testbar – die echte Klasse ist fest verdrahtet
final class Checkout
{
    private StripeGateway $gateway;
    public function __construct() { $this->gateway = new StripeGateway(); }
}

// testbar – die Abhängigkeit wird hereingereicht
final class Checkout
{
    public function __construct(private PaymentGateway $gateway) {}
}
```

Das zweite Muster heißt [[dependency-injection|Dependency Injection]]. Der Typ ist ein
[[interface|Interface]]: In Produktion übergibst du die echte Implementierung, im Test ein Double.

## Doubles von Hand: Fakes

Oft ist ein kleiner, selbst geschriebener Fake die lesbarste Lösung:

```php
final class FakeMailer implements Mailer
{
    public array $sent = [];

    public function send(string $to, string $subject): void
    {
        $this->sent[] = ['to' => $to, 'subject' => $subject];
    }
}

it('verschickt eine Willkommensmail', function () {
    $mailer = new FakeMailer();

    (new Registration($mailer))->register('ada@example.com');

    expect($mailer->sent)->toHaveCount(1)
        ->and($mailer->sent[0]['to'])->toBe('ada@example.com');
});
```

Der Fake funktioniert wirklich – er speichert nur im Speicher statt zu senden. Der Test prüft das
**Ergebnis**, nicht jeden einzelnen Aufruf.

## Mocks mit Mockery

Für Pest empfiehlt die Dokumentation [[mockery|Mockery]]. Du installierst es als Dev-Abhängigkeit:

```bash
composer require mockery/mockery --dev
```

```php
it('bucht den Betrag genau einmal ab', function () {
    $gateway = Mockery::mock(PaymentGateway::class);
    $gateway->shouldReceive('charge')
        ->once()
        ->with(4990)
        ->andReturn('tx-42');

    expect((new Checkout($gateway))->pay(4990))->toBe('tx-42');
});
```

| Methode | Bedeutung |
|---|---|
| `shouldReceive('charge')` | diese Methode wird aufgerufen |
| `with(4990)` | mit genau diesen Argumenten |
| `once()`, `twice()`, `times(3)`, `never()` | so oft |
| `andReturn('tx-42')` | Rückgabewert |
| `andThrow(new PaymentFailed())` | wirft stattdessen eine Exception |

Wird eine Erwartung nicht erfüllt, ist der Test rot: „should be called exactly 1 times but called 0 times“.
Mit `Mockery::spy(...)` und danach `shouldHaveReceived('charge')` prüfst du im Spy-Stil.

## Wann du nicht mocken solltest

> [!FEHLER]
> **Alles wegmocken.** Ein Test, in dem jede Klasse ein Mock ist, prüft am Ende nur, dass die Mocks
> sich gegenseitig aufrufen. Ändert sich die echte Klasse, bleibt er grün – und testet nichts mehr.

Faustregeln:

- **Reine Logik nie mocken** – nimm den echten Code.
- **Grenzen nach außen mocken**: Zahlung, Mail, fremde APIs, Uhrzeit.
- **Lieber Fakes als Mocks**, wenn das Ergebnis zählt und nicht die genaue Aufrufreihenfolge.
- **Die eigene Datenbank** prüfst du in Integrationstests besser echt (z. B. mit [[sqlite|SQLite]]).

> [!PRAXIS]
> Laravel bringt fertige Fakes mit: `Mail::fake()`, `Queue::fake()`, `Http::fake()`. Sie ersetzen
> die echten Dienste im Test und bieten Prüfungen wie `Mail::assertSent(...)` – das ist genau das
> Fake-Muster aus dieser Lektion, nur schon gebaut.

## Zusammenfassung

- Test-Doubles ersetzen langsame, teure oder unberechenbare Abhängigkeiten im Test.
- Stubs und Fakes liefern Daten, Mocks und Spies prüfen das Zusammenspiel.
- Dependency Injection über ein Interface macht Klassen erst austauschbar und testbar.
- Mockery: `shouldReceive()->once()->with()->andReturn()` bzw. `andThrow()`.
- Mocke Grenzen nach außen, nicht deine eigene Logik – sonst testest du nur die Mocks.
