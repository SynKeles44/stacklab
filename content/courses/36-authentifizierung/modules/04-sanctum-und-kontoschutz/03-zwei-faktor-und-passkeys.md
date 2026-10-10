---
title: Zwei-Faktor-Anmeldung und Passkeys
summary: Wie TOTP-Codes aus Authenticator-Apps entstehen, wie du sie prüfst, wofür Wiederherstellungscodes da sind und warum Passkeys Phishing ins Leere laufen lassen.
duration: 25
sources:
  - title: RFC 6238 – TOTP Time-Based One-Time Password Algorithm
    url: https://www.rfc-editor.org/rfc/rfc6238
  - title: RFC 4226 – HOTP
    url: https://www.rfc-editor.org/rfc/rfc4226
  - title: OWASP Multifactor Authentication Cheat Sheet
    url: https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html
  - title: W3C – Web Authentication (WebAuthn)
    url: https://www.w3.org/TR/webauthn-3/
  - title: Laravel 13 – Fortify (Two Factor Authentication)
    url: https://laravel.com/docs/13.x/fortify#two-factor-authentication
quiz:
  - type: single
    question: Woraus berechnet eine Authenticator-App den 6-stelligen TOTP-Code?
    options:
      - Aus deinem Passwort und der Uhrzeit.
      - Aus einem gemeinsamen Geheimnis und der aktuellen Zeit, geteilt in 30-Sekunden-Schritte.
      - Aus einer SMS des Servers.
      - Aus einer Zufallszahl, die der Server per Push schickt.
    answer: 1
    explanation: >
      App und Server kennen dasselbe Geheimnis (aus dem QR-Code). Beide rechnen HMAC-SHA1 über die Nummer
      des aktuellen 30-Sekunden-Fensters und kommen zum selben Code – ganz ohne Netzwerk.
  - type: multiple
    question: Warum sind Passkeys resistent gegen Phishing?
    options:
      - Der private Schlüssel verlässt nie das Gerät.
      - Der Browser bindet jede Anmeldung an die echte Domain – eine Fälschung bekommt keine gültige Signatur.
      - Der Nutzer muss sich ein besonders langes Passwort merken.
      - Der Server speichert nur einen öffentlichen Schlüssel, der für Angreifer wertlos ist.
    answers: [0, 1, 3]
    explanation: >
      Es gibt nichts abzutippen, was eine Phishing-Seite abgreifen könnte. Die Signatur gilt nur für die
      registrierte Domain, und ein Datenbankleck verrät nur öffentliche Schlüssel.
  - type: match
    question: Ordne jedem zweiten Faktor seine größte Schwäche zu.
    pairs:
      - { left: "SMS-Code", right: "SIM-Swapping und abgefangene Nachrichten" }
      - { left: "TOTP-App", right: "Code kann auf einer Phishing-Seite abgefangen werden" }
      - { left: "Wiederherstellungscode", right: "Wer die ausgedruckte Liste findet, kommt rein" }
      - { left: "Passkey", right: "Kaum Schwächen – Geräteverlust braucht einen Wiederherstellungsweg" }
    explanation: Je weniger Menschen abtippen müssen, desto weniger lässt sich abfangen.
  - type: cloze
    text: "Ein TOTP-Zeitschritt dauert standardmäßig ___ Sekunden. Das gemeinsame Geheimnis wird meist im Format ___ als QR-Code angezeigt."
    blanks:
      - ["30", "dreißig"]
      - [Base32, base32]
    explanation: "Der QR-Code enthält eine URI wie `otpauth://totp/Notizen:ada@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Notizen`."
tasks:
  - id: totp-berechnen
    type: code
    language: php
    title: TOTP selbst berechnen und prüfen
    description: |
      Implementiere den TOTP-Algorithmus nach RFC 6238 (mit HMAC-SHA1) und eine Prüffunktion.

      **`totp(string $geheimnis, int $zeit, int $stellen = 6): string`**

      1. Zähler: `$zaehler = intdiv($zeit, 30)`.
      2. Wandle den Zähler in 8 Byte Big-Endian um: `pack('J', $zaehler)`.
      3. `$hmac = hash_hmac('sha1', $zaehlerBytes, $geheimnis, true)` – 20 Rohbytes.
      4. Dynamische Kürzung: `$offset = ord($hmac[19]) & 0x0f`. Lies ab `$offset` vier Bytes als Zahl und
         lösche das oberste Bit: `unpack('N', substr($hmac, $offset, 4))[1] & 0x7fffffff`.
      5. Der Code ist diese Zahl modulo `10 ** $stellen`, links mit Nullen aufgefüllt
         (`str_pad(…, $stellen, '0', STR_PAD_LEFT)`).

      **`pruefeTotp(string $geheimnis, string $code, int $zeit): bool`** akzeptiert einen 6-stelligen Code
      aus dem aktuellen Zeitschritt **oder** einem direkt benachbarten (±30 Sekunden Uhrabweichung).
      Vergleiche mit `hash_equals()`.

      Die Tests nutzen das Testgeheimnis aus RFC 6238 (`12345678901234567890` als ASCII-Bytes).
    starter: |
      <?php
      declare(strict_types=1);

      function totp(string $geheimnis, int $zeit, int $stellen = 6): string
      {
          // Dein Code
          return '';
      }

      function pruefeTotp(string $geheimnis, string $code, int $zeit): bool
      {
          return false;
      }
    tests:
      - name: RFC-6238-Testvektor bei 59 Sekunden (8 Stellen)
        code: assert_same('94287082', totp('12345678901234567890', 59, 8));
      - name: weitere Testvektoren aus RFC 6238
        code: |
          assert_same('07081804', totp('12345678901234567890', 1111111109, 8));
          assert_same('14050471', totp('12345678901234567890', 1111111111, 8));
          assert_same('89005924', totp('12345678901234567890', 1234567890, 8));
          assert_same('69279037', totp('12345678901234567890', 2000000000, 8));
      - name: standardmäßig 6 Stellen mit führenden Nullen
        code: |
          assert_same('287082', totp('12345678901234567890', 59));
          assert_same('081804', totp('12345678901234567890', 1111111109));
      - name: Codes aus dem aktuellen und den Nachbar-Zeitschritten werden akzeptiert
        code: |
          $g = '12345678901234567890';
          assert_same(true, pruefeTotp($g, totp($g, 1000), 1000));
          assert_same(true, pruefeTotp($g, totp($g, 970), 1000));
          assert_same(true, pruefeTotp($g, totp($g, 1030), 1000));
      - name: ältere Codes und falsche Codes werden abgelehnt
        code: |
          $g = '12345678901234567890';
          assert_same(false, pruefeTotp($g, totp($g, 900), 1000));
          assert_same(false, pruefeTotp($g, 'abcdef', 1000));
          assert_same(false, pruefeTotp('anderes-geheimnis-123', totp($g, 1000), 1000));
    hints:
      - "`pack('J', $zaehler)` liefert die 8 Byte des Zählers in Big-Endian-Reihenfolge, so wie RFC 6238 es verlangt."
      - "`$zahl = unpack('N', substr($hmac, $offset, 4))[1] & 0x7fffffff;` und danach `$zahl % (10 ** $stellen)`."
      - "In `pruefeTotp()` gehst du die Zeiten `$zeit - 30`, `$zeit` und `$zeit + 30` durch und vergleichst jeweils mit `hash_equals(totp(...), $code)`."
    solution: |
      <?php
      declare(strict_types=1);

      function totp(string $geheimnis, int $zeit, int $stellen = 6): string
      {
          $zaehler = intdiv($zeit, 30);
          $hmac = hash_hmac('sha1', pack('J', $zaehler), $geheimnis, true);
          $offset = ord($hmac[19]) & 0x0f;
          $zahl = unpack('N', substr($hmac, $offset, 4))[1] & 0x7fffffff;

          return str_pad((string) ($zahl % (10 ** $stellen)), $stellen, '0', STR_PAD_LEFT);
      }

      function pruefeTotp(string $geheimnis, string $code, int $zeit): bool
      {
          foreach ([-30, 0, 30] as $abweichung) {
              if (hash_equals(totp($geheimnis, $zeit + $abweichung), $code)) {
                  return true;
              }
          }

          return false;
      }
  - id: passkey-ablauf
    type: steps
    title: Phishing gegen TOTP und Passkey
    description: Ein Angreifer baut eine täuschend echte Kopie deiner Login-Seite auf `notizen-login.example.net`. Spiel durch, was passiert.
    steps:
      - situation: Ada hat TOTP aktiviert. Sie landet auf der gefälschten Seite und tippt E-Mail, Passwort und den aktuellen 6-stelligen Code ein.
        question: Kann der Angreifer sich anmelden?
        options:
          - Nein, TOTP ist phishingsicher.
          - Ja – er leitet alle drei Werte sofort an die echte Seite weiter, solange der Code noch gilt.
        answer: 1
        explanation: >
          Solche Echtzeit-Phishing-Proxys sind verbreitet. TOTP macht Angriffe aufwändiger, verhindert sie aber
          nicht, weil Menschen Codes überall eintippen.
      - situation: Ada nutzt stattdessen einen Passkey. Die gefälschte Seite startet eine WebAuthn-Anmeldung.
        question: Was passiert?
        options:
          - Der Browser bietet Adas Passkey gar nicht an, weil er für notizen.example.com registriert ist, nicht für die fremde Domain.
          - Ada bestätigt per Fingerabdruck und der Angreifer bekommt eine gültige Signatur.
        answer: 0
        explanation: >
          Ein Passkey ist an die Domain gebunden, für die er erstellt wurde (die Relying Party ID). Der Browser
          prüft das selbst – Ada muss die Fälschung nicht erkennen.
      - situation: Ada verliert ihr Smartphone, auf dem ihre TOTP-App lief.
        question: Was hilft ihr jetzt, ohne dass der Support das Konto ungeprüft freischaltet?
        options:
          - Einer ihrer Wiederherstellungscodes, die sie beim Einrichten sicher abgelegt hat.
          - Eine E-Mail an den Support mit der Bitte, 2FA abzuschalten.
        answer: 0
        explanation: >
          Wiederherstellungscodes sind einmalig nutzbare Notfallschlüssel. Ein Support, der 2FA auf Zuruf
          abschaltet, ist selbst eine Lücke (Social Engineering).
---
Ein Passwort ist schnell verloren: per [[phishing|Phishing]]-Mail, durch ein Datenleck bei einem anderen Dienst oder
weil es schlicht zu einfach war. Ein **zweiter Faktor** sorgt dafür, dass das Passwort allein nicht
reicht. Und Passkeys gehen noch einen Schritt weiter – sie machen das Passwort ganz überflüssig.

## Zweite Faktoren im Überblick

Die [[zwei-faktor-authentifizierung|Zwei-Faktor-Authentifizierung]] (2FA, allgemein MFA) verlangt
zusätzlich zum Passwort einen Nachweis anderer Art – meist **Besitz**:

| Verfahren | Wie es funktioniert | Bewertung |
|---|---|---|
| SMS-Code | Server schickt Code per SMS | schwach: SIM-Swapping, abgefangene SMS |
| [[totp|TOTP]] | Authenticator-App berechnet Code aus Geheimnis + Zeit | gut, aber phishbar |
| Push-Bestätigung | App fragt „Bist du das?“ | gut, Gefahr durch „Push-Bombing“ |
| Sicherheitsschlüssel / [[passkey|Passkey]] | Signatur mit privatem Schlüssel über WebAuthn | sehr gut, phishingresistent |

> [!MERKSATZ]
> Jeder zweite Faktor ist besser als keiner. Aber nur Passkeys und Sicherheitsschlüssel schützen auch
> dann, wenn jemand auf eine perfekt gefälschte Login-Seite hereinfällt.

## Wie TOTP funktioniert

Beim Einrichten erzeugt der Server ein zufälliges Geheimnis und zeigt es als QR-Code an, meist als
[[base32|Base32]]-Text in einer URI:

```text title="Inhalt des QR-Codes"
otpauth://totp/Notizen:ada@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Notizen
```

Ab jetzt rechnen App und Server unabhängig voneinander dasselbe:

1. Zähler = aktuelle Unix-Zeit geteilt durch 30 (abgerundet).
2. [[hmac|HMAC]]-SHA1 über den Zähler mit dem Geheimnis.
3. „Dynamische Kürzung“: Aus dem 20-Byte-Ergebnis werden vier Bytes ausgewählt und zu einer Zahl.
4. Die letzten 6 Ziffern sind der Code.

Weil alles auf der Uhrzeit beruht, braucht die App kein Netzwerk. Der Server akzeptiert meist auch den
vorigen und nächsten Zeitschritt, falls die Uhren etwas abweichen.

> [!FEHLER]
> Denselben TOTP-Code mehrfach akzeptieren. Wer einen Code abfängt, könnte ihn innerhalb von 30–90
> Sekunden noch einmal benutzen. Merke dir den zuletzt akzeptierten Zeitschritt pro Konto und lehne
> Wiederholungen ab.

## Was zur 2FA dazugehört

Ein sauberes 2FA-System besteht aus mehr als dem Code:

- **Bestätigung beim Einrichten:** 2FA ist erst aktiv, wenn der Nutzer einen gültigen Code eingegeben hat.
- **[[wiederherstellungscode|Wiederherstellungscodes]]:** 8–10 einmalig nutzbare Codes für den Notfall,
  gespeichert wie Passwörter – gehasht.
- **Geheimnis schützen:** Das TOTP-Geheimnis liegt verschlüsselt in der Datenbank.
- **Rate Limiting:** Ein 6-stelliger Code hat nur eine Million Möglichkeiten.
- **Neue Prüfung bei kritischen Aktionen:** 2FA abschalten oder E-Mail ändern nur nach erneuter Bestätigung.

In Laravel musst du das nicht selbst bauen: [Laravel Fortify](https://laravel.com/docs/13.x/fortify)
und die Starter Kits bringen TOTP samt QR-Code und Wiederherstellungscodes mit.

## Passkeys und WebAuthn

Ein [[passkey|Passkey]] ist ein Schlüsselpaar, das dein Gerät für **genau eine** Website erzeugt. Der
Standard dahinter heißt [[webauthn|WebAuthn]].

| Schritt | Registrierung | Anmeldung |
|---|---|---|
| 1 | Server schickt eine zufällige Challenge | Server schickt eine zufällige Challenge |
| 2 | Gerät erzeugt ein Schlüsselpaar für diese Domain | Nutzer entsperrt per Fingerabdruck, Gesicht oder PIN |
| 3 | Server speichert den **öffentlichen** Schlüssel | Gerät signiert die Challenge mit dem privaten Schlüssel |
| 4 | – | Server prüft die Signatur mit dem öffentlichen Schlüssel |

Der private Schlüssel verlässt das Gerät nie (oder wird verschlüsselt über den Passwortmanager des
Herstellers synchronisiert). Der Browser lässt eine Anmeldung nur auf der Domain zu, für die der
Passkey erstellt wurde – eine Phishing-Seite bekommt einfach keine Signatur.

> [!PRAXIS]
> Viele Dienste führen Passkeys schrittweise ein: zuerst als zusätzliche Anmeldeoption neben dem
> Passwort, später als Standard. Behalte immer einen sicheren Wiederherstellungsweg, falls alle Geräte
> verloren gehen.

## Zusammenfassung

- 2FA kombiniert das Passwort mit einem Nachweis anderer Art, meist Besitz.
- TOTP: HMAC-SHA1 über das 30-Sekunden-Fenster mit einem gemeinsamen Geheimnis, gekürzt auf 6 Ziffern.
- Codes nicht mehrfach akzeptieren, Wiederherstellungscodes hashen, Rate Limiting nicht vergessen.
- SMS ist der schwächste zweite Faktor, TOTP ist gut, aber phishbar.
- Passkeys (WebAuthn) signieren eine Challenge mit einem domain-gebundenen Schlüssel – phishingresistent und ohne Passwort.
