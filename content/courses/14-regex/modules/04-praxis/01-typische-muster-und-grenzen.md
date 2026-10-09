---
title: Typische Muster und ihre Grenzen
summary: E-Mail-Adressen, Datumsangaben, IP-Adressen und Logzeilen – bewährte Muster für den Alltag und die Stellen, an denen eine Regex allein nicht reicht.
duration: 25
sources:
  - title: MDN – input type="email" (Prüfung im Browser)
    url: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/email
  - title: PHP-Handbuch – checkdate
    url: https://www.php.net/manual/de/function.checkdate.php
  - title: PHP-Handbuch – Validierungsfilter (filter_var)
    url: https://www.php.net/manual/de/filter.filters.validate.php
  - title: MDN – URL-Konstruktor
    url: https://developer.mozilla.org/de/docs/Web/API/URL/URL
quiz:
  - type: single
    question: "Das Muster `^\\d{4}-\\d{2}-\\d{2}$` akzeptiert `2026-02-31`. Was ist die beste Lösung?"
    options:
      - Ein noch genaueres Muster, das jeden Monat einzeln kennt
      - Das Muster prüft das Format, eine Datumsfunktion wie checkdate() prüft, ob es den Tag gibt
      - Gar nicht prüfen – die Datenbank meldet sich schon
    answer: 1
    explanation: Regex prüfen Formen, keine Kalender. Schaltjahre und Monatslängen gehören in Code – das ist kürzer, lesbarer und sicher richtig.
  - type: multiple
    question: "Welche Adressen passen auf das pragmatische Muster `^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$`?"
    options: ["user@example.com", "ada.lovelace+news@mail.example.org", "user@localhost", "user @example.com", "user@@example.com"]
    answers: [0, 1]
    explanation: "Das Muster verlangt Text, genau ein @, Text, einen Punkt und Text – ohne Leerzeichen. `user@localhost` hat keinen Punkt im Domainteil. Ob die Adresse wirklich existiert, verrät nur eine Bestätigungs-E-Mail."
  - type: match
    question: Welches Werkzeug passt am besten?
    pairs:
      - { left: "Prüfen, ob eine E-Mail-Adresse zustellbar ist", right: "Bestätigungslink per E-Mail senden" }
      - { left: "Eine IPv4-Adresse in PHP validieren", right: "filter_var() mit FILTER_VALIDATE_IP" }
      - { left: "Den Host aus einer URL holen", right: "new URL() bzw. parse_url()" }
      - { left: "Fehlerzeilen in einem Log zählen", right: "Regex mit grep oder preg_match_all()" }
    explanation: Regex sind stark bei Text mit festem Aufbau. Für Formate mit eigenen Regeln gibt es spezialisierte Funktionen – und manche Fragen beantwortet nur die Wirklichkeit.
  - type: find-bug
    question: Die Prüfung soll IPv4-Adressen wie 192.0.2.15 akzeptieren. Welche Zeile lässt auch „999.1.1.1“ und „1a2b3c4“ durch?
    language: php
    code: |
      function istIpv4(string $ip): bool
      {
          return preg_match('/^\d+.\d+.\d+.\d+$/', $ip) === 1;
      }
    bug_line: 3
    explanation: "Die Punkte sind nicht escapt und passen auf jedes Zeichen – „1a2b3c4“ geht durch. Außerdem prüft `\\d+` nicht, ob ein Block höchstens 255 ist. Besser: `filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) !== false`."
tasks:
  - id: datum-pruefen
    type: code
    language: php
    title: Ein Datum gründlich prüfen
    description: |
      Schreibe `istGueltigesDatum(string $text): bool`. Ein gültiges Datum hat das Format `TT.MM.JJJJ` **und**
      existiert im Kalender.

      1. Prüfe das Format mit `preg_match()` und benannten Gruppen (`tag`, `monat`, `jahr`).
      2. Prüfe die Existenz mit `checkdate($monat, $tag, $jahr)` – Achtung, Reihenfolge: Monat zuerst.

      Gültig: `09.10.2026`, `29.02.2024` (Schaltjahr). Ungültig: `31.02.2026`, `29.02.2026`, `9.10.2026`,
      `09.10.2026 ` (mit Leerzeichen am Ende).
    starter: |
      function istGueltigesDatum(string $text): bool
      {
          if (preg_match('/(\d+)\.(\d+)\.(\d+)/', $text, $m) !== 1) {
              return false;
          }
          return true;
      }
    tests:
      - name: Normale Daten sind gültig
        code: |
          assert_true(istGueltigesDatum('09.10.2026'));
          assert_true(istGueltigesDatum('31.12.1999'));
      - name: Schaltjahr wird berücksichtigt
        code: |
          assert_true(istGueltigesDatum('29.02.2024'));
          assert_same(false, istGueltigesDatum('29.02.2026'));
      - name: Nicht existierende Tage sind ungültig
        code: |
          assert_same(false, istGueltigesDatum('31.02.2026'));
          assert_same(false, istGueltigesDatum('00.10.2026'));
          assert_same(false, istGueltigesDatum('10.13.2026'));
      - name: Falsches Format ist ungültig
        code: |
          assert_same(false, istGueltigesDatum('9.10.2026'));
          assert_same(false, istGueltigesDatum('2026-10-09'));
          assert_same(false, istGueltigesDatum(''));
      - name: Zusätzliche Zeichen sind ungültig
        code: |
          assert_same(false, istGueltigesDatum("09.10.2026 "));
          assert_same(false, istGueltigesDatum("09.10.2026\n"));
    hints:
      - "Das Muster braucht Anker und genaue Anzahlen: `^(?<tag>\\d{2})\\.(?<monat>\\d{2})\\.(?<jahr>\\d{4})$`."
      - "`$` in PCRE erlaubt einen Zeilenumbruch am Ende. `\\z` oder der Modifikator `D` verhindern das."
      - "`checkdate((int) $m['monat'], (int) $m['tag'], (int) $m['jahr'])` erwartet Zahlen."
    solution: |
      ```php
      function istGueltigesDatum(string $text): bool
      {
          if (preg_match('/^(?<tag>\d{2})\.(?<monat>\d{2})\.(?<jahr>\d{4})$/D', $text, $m) !== 1) {
              return false;
          }
          return checkdate((int) $m['monat'], (int) $m['tag'], (int) $m['jahr']);
      }
      ```
  - id: regex-oder-nicht
    type: dragdrop
    title: Regex, Regex plus Code oder ein anderes Werkzeug?
    description: Ordne jede Aufgabe dem Ansatz zu, der sie am zuverlässigsten löst.
    targets:
      - { id: regex, label: Regex allein reicht }
      - { id: kombi, label: "Regex für das Format, Code für die Bedeutung" }
      - { id: anders, label: Parser oder eingebaute Funktion }
    items:
      - { label: "Alle Zeilen mit [ERROR] in einem Log zählen", target: regex }
      - { label: "Prüfen, ob ein Gutscheincode die Form ABC-1234 hat", target: regex }
      - { label: "Prüfen, ob 31.04.2026 ein echtes Datum ist", target: kombi }
      - { label: "Eine Kreditkartennummer mit Prüfziffer validieren", target: kombi }
      - { label: "Alle Links aus einer HTML-Seite auslesen", target: anders }
      - { label: "Den Wert price aus einer JSON-Antwort lesen", target: anders }
      - { label: "Host und Pfad einer URL ermitteln", target: anders }
---
Irgendwann brauchst du ein Muster für E-Mail-Adressen und findest im Netz eine Regex über drei Bildschirmzeilen.
Du kopierst sie – und niemand im Team kann sie je wieder ändern. Diese Lektion zeigt dir **pragmatische**
Muster für die häufigsten Fälle und, genauso wichtig, wo eine Regex aufhört, nützlich zu sein.

## Die Grundregel: Form prüfen, nicht Bedeutung

Eine Regex sieht nur Zeichen. Sie weiß nicht, dass der Februar 28 oder 29 Tage hat, dass eine Domain
existieren muss oder dass 300 kein gültiger IP-Block ist. Daraus folgt eine einfache Arbeitsteilung:

| Frage | Wer beantwortet sie? |
|---|---|
| Hat der Text die richtige **Form**? | die Regex |
| Ergibt der Wert **Sinn**? | Code (z. B. `checkdate()`, Wertebereiche) |
| **Existiert** er wirklich? | die Wirklichkeit (Bestätigungsmail, Datenbank) |

> [!MERKSATZ]
> Eine Regex sagt „sieht aus wie ein Datum“ – nicht „ist ein Datum“. Kombiniere sie mit Code, sobald
> Bedeutung ins Spiel kommt.

## E-Mail-Adressen: pragmatisch bleiben

Die offizielle Spezifikation für E-Mail-Adressen erlaubt erstaunliche Dinge, etwa Anführungszeichen und
Kommentare. Eine Regex, die das alles abbildet, ist unlesbar. In der Praxis reicht ein Plausibilitätscheck:

```js run
const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
for (const t of ["user@example.com", "a.b+news@mail.example.org", "user@localhost", "user @example.com"]) {
  console.log(t, email.test(t));
}
```

Gelesen: Etwas ohne Leerzeichen und `@`, ein `@`, wieder etwas, ein Punkt, noch etwas.

> [!PRAXIS]
> In PHP nimmst du `filter_var($email, FILTER_VALIDATE_EMAIL)`, im Browser `<input type="email">`.
> Ob die Adresse **funktioniert**, zeigt nur ein Bestätigungslink. Deshalb verschicken Registrierungen fast
> immer eine E-Mail mit Link – keine noch so gute Regex kann das ersetzen.

## Datumsangaben und Zahlenbereiche

Für Datumsangaben prüft die Regex das Format, der Code den Kalender:

```php
function istIsoDatum(string $text): bool
{
    if (preg_match('/^(?<j>\d{4})-(?<m>\d{2})-(?<t>\d{2})$/D', $text, $m) !== 1) {
        return false;
    }
    return checkdate((int) $m['m'], (int) $m['t'], (int) $m['j']);
}
```

Der Modifikator `D` sorgt dafür, dass `$` wirklich nur das Textende meint. Ohne ihn akzeptiert PCRE auch
einen abschließenden Zeilenumbruch – eine kleine, aber echte Lücke bei Formulardaten.

Bei **Zahlenbereichen** werden Regex schnell unhandlich. „0 bis 255“ als Muster lautet
`25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d`. Lesbarer ist: Ziffern mit `\d{1,3}` herausholen und im Code mit `<= 255`
vergleichen – oder gleich `filter_var($ip, FILTER_VALIDATE_IP)` nutzen.

## Logzeilen: hier glänzen Regex

Logdateien sind der ideale Einsatzort: Jede Zeile hat denselben, von Programmen erzeugten Aufbau.

![Eine Logzeile, zerlegt in die benannten Gruppen date, time, level, source und message](/assets/regex/log-zeile.svg)

```js run
const logZeile = /^(?<date>\d{4}-\d{2}-\d{2}) (?<time>\d{2}:\d{2}:\d{2}) \[(?<level>[A-Z]+)\] (?<source>[a-z]+): (?<message>.+)$/;
const m = "2026-10-01 08:02:45 [ERROR] db: Query timeout after 5000ms".match(logZeile);
console.log(m.groups.level, m.groups.source, m.groups.message);
```

Zeilen, die nicht passen, sind selbst eine wertvolle Information: Sie zeigen Abstürze mitten im Schreiben,
fremde Ausgaben oder ein geändertes Log-Format. Zähle sie, statt sie stillschweigend zu verwerfen.

## Wo Regex an ihre Grenzen stoßen

> [!FEHLER]
> **HTML mit Regex zerlegen.** `/<a href="(.*?)">/` funktioniert, bis jemand einfache Anführungszeichen,
> ein zusätzliches Attribut oder einen Zeilenumbruch im Tag verwendet. HTML ist **verschachtelt** – das kann
> eine Regex grundsätzlich nicht zuverlässig abbilden. Nutze einen HTML-Parser (`DOMParser` im Browser,
> `Dom\HTMLDocument` in PHP).

Weitere Fälle für andere Werkzeuge:

| Format | Werkzeug |
|---|---|
| JSON | `JSON.parse()`, `json_decode()` |
| [[url|URL]] | `new URL()`, `parse_url()` |
| [[csv|CSV]] mit Anführungszeichen | `fgetcsv()`, eine CSV-Bibliothek |
| Programmcode | ein echter Parser, z. B. für einen Linter |

Faustregel: Sobald etwas **verschachtelt** ist oder eigene Escape-Regeln hat, greifst du zum Parser.

## Zusammenfassung

- Regex prüfen die **Form**, Code prüft die **Bedeutung**, nur die Wirklichkeit prüft die **Existenz**.
- Für E-Mails reicht ein pragmatisches Muster plus `filter_var()` und ein Bestätigungslink.
- Datumsangaben: Format per Regex, Kalender per `checkdate()`; der Modifikator `D` schließt einen Zeilenumbruch am Ende aus.
- Zahlenbereiche wie 0–255 prüfst du lesbarer im Code als in der Regex.
- Logzeilen sind ideal für Regex; verschachtelte Formate wie HTML oder JSON gehören in einen Parser.
