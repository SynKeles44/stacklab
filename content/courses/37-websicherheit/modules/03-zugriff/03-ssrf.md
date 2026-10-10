---
title: SSRF – wenn dein Server fremde URLs abruft
summary: Server-Side Request Forgery verstehen und Funktionen wie „Bild per URL laden“ mit Allowlist, Schema-Prüfung, IP-Prüfung und ohne Weiterleitungen absichern.
duration: 20
sources:
  - title: OWASP Cheat Sheet – Server Side Request Forgery Prevention
    url: https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
  - title: OWASP Top 10:2025 – A01 Broken Access Control (enthält SSRF)
    url: https://top10.owasp.org/2025/A01_2025-Broken_Access_Control/
  - title: PHP Manual – parse_url
    url: https://www.php.net/manual/de/function.parse-url.php
  - title: PHP Manual – Filter-Flags für IP-Adressen
    url: https://www.php.net/manual/de/filter.constants.php
  - title: AWS – Instance Metadata Service Version 2
    url: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html
quiz:
  - type: single
    question: Ein Formular erlaubt „Profilbild per URL laden“. Jemand trägt `http://169.254.169.254/latest/meta-data/` ein. Was versucht er?
    options:
      - Ein besonders großes Bild hochzuladen.
      - Den Server dazu zu bringen, den internen Metadaten-Dienst der Cloud abzufragen.
      - Eine XSS-Lücke im Browser auszulösen.
    answer: 1
    explanation: >
      `169.254.169.254` ist eine Link-Local-Adresse, unter der Cloud-Anbieter Metadaten und manchmal temporäre
      Zugangsdaten bereitstellen. Von außen ist sie nicht erreichbar – vom Server aus schon.
  - type: multiple
    question: Welche URLs muss eine sichere SSRF-Prüfung ablehnen, wenn nur `https://images.example.com` erlaubt ist?
    options:
      - "`http://images.example.com/a.png`"
      - "`https://images.example.com@127.0.0.1/a.png`"
      - "`https://images.example.com/katze.png`"
      - "`https://images.example.com.evil.example/a.png`"
      - "`file:///etc/passwd`"
    answers: [0, 1, 3, 4]
    explanation: >
      Erlaubt ist nur Schema `https` mit exakt diesem Host. Bei `images.example.com@127.0.0.1` ist der Teil vor `@`
      ein Benutzername – der echte Host ist `127.0.0.1`.
  - type: find-bug
    question: In welcher Zeile wird die Prüfung umgangen, obwohl der Host stimmt?
    language: php
    code: |
      $teile = parse_url($url);
      if (($teile['scheme'] ?? '') !== 'https' || ($teile['host'] ?? '') !== 'images.example.com') {
          throw new InvalidArgumentException('URL nicht erlaubt');
      }
      $ctx = stream_context_create(['http' => ['follow_location' => 1]]);
      $bild = file_get_contents($url, false, $ctx);
    bug_line: 5
    explanation: >
      Mit aktivierten Weiterleitungen kann der erlaubte Server (oder ein offener Redirect darauf) auf eine interne
      Adresse umleiten. Setze `'follow_location' => 0` und prüfe jede neue URL erneut.
  - type: cloze
    text: "SSRF steht für Server-Side Request ___. In der OWASP Top 10:2025 gehört es zur Kategorie ___ Access Control."
    blanks:
      - [Forgery]
      - [Broken]
    explanation: SSRF hatte 2021 eine eigene Kategorie und ist 2025 in Broken Access Control aufgegangen.
tasks:
  - id: url-pruefen
    type: code
    language: php
    title: URLs für den Bild-Import prüfen
    description: |
      Schreibe zwei Funktionen für einen Bild-Import per URL:

      1. `istErlaubteUrl(string $url, array $hosts): bool` – `true` nur, wenn
         - `parse_url()` die URL zerlegen kann,
         - das Schema `https` ist,
         - kein Benutzername oder Passwort enthalten ist,
         - kein Port oder Port `443` angegeben ist,
         - der Host (kleingeschrieben) **exakt** in `$hosts` steht.
      2. `istOeffentlicheIp(string $ip): bool` – `true` für gültige IPs, die weder privat noch reserviert sind
         (Loopback, Link-Local usw.). Nutze `filter_var()` mit `FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE`.

      Die zweite Funktion nutzt du nach der DNS-Auflösung, um auch Hosts abzufangen, die auf interne Adressen zeigen.
    starter: |
      <?php
      declare(strict_types=1);

      function istErlaubteUrl(string $url, array $hosts): bool
      {
          return str_contains($url, $hosts[0] ?? '');
      }

      function istOeffentlicheIp(string $ip): bool
      {
          return true;
      }
    tests:
      - name: Erlaubte URL
        code: |
          assert_true(istErlaubteUrl('https://images.example.com/katze.png', ['images.example.com']));
          assert_true(istErlaubteUrl('https://IMAGES.example.com:443/katze.png', ['images.example.com']));
      - name: Falsches Schema, Port und Zugangsdaten
        code: |
          $h = ['images.example.com'];
          assert_same(false, istErlaubteUrl('http://images.example.com/a.png', $h));
          assert_same(false, istErlaubteUrl('file:///etc/passwd', $h));
          assert_same(false, istErlaubteUrl('https://images.example.com:8080/a.png', $h));
          assert_same(false, istErlaubteUrl('https://images.example.com@127.0.0.1/a.png', $h));
      - name: Ähnliche Hosts und kaputte URLs
        code: |
          $h = ['images.example.com'];
          assert_same(false, istErlaubteUrl('https://images.example.com.evil.example/a.png', $h));
          assert_same(false, istErlaubteUrl('https://evil.example/?x=images.example.com', $h));
          assert_same(false, istErlaubteUrl('', $h));
          assert_same(false, istErlaubteUrl('https://images.example.com/a.png', []));
      - name: Öffentliche und interne IPs
        code: |
          assert_true(istOeffentlicheIp('203.0.113.10'));
          assert_same(false, istOeffentlicheIp('127.0.0.1'));
          assert_same(false, istOeffentlicheIp('169.254.169.254'));
          assert_same(false, istOeffentlicheIp('10.0.0.5'));
          assert_same(false, istOeffentlicheIp('::1'));
          assert_same(false, istOeffentlicheIp('kein-ip'));
    hints:
      - "`parse_url()` liefert ein Array mit `scheme`, `host`, `port`, `user`, `pass` – oder `false`."
      - "Host vergleichen: `in_array(strtolower($teile['host']), $hosts, true)`."
      - "`filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false`"
    solution: |
      <?php
      declare(strict_types=1);

      function istErlaubteUrl(string $url, array $hosts): bool
      {
          $teile = parse_url($url);
          if ($teile === false) {
              return false;
          }
          if (($teile['scheme'] ?? '') !== 'https') {
              return false;
          }
          if (isset($teile['user']) || isset($teile['pass'])) {
              return false;
          }
          if (isset($teile['port']) && $teile['port'] !== 443) {
              return false;
          }

          return in_array(strtolower($teile['host'] ?? ''), $hosts, true);
      }

      function istOeffentlicheIp(string $ip): bool
      {
          return filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false;
      }
  - id: ssrf-entscheiden
    type: dragdrop
    title: Abrufen oder ablehnen?
    description: |
      Dein Server lädt Vorschaubilder nur von `https://images.example.com`. Entscheide für jede eingegebene URL,
      ob er sie abrufen darf.
    targets:
      - { id: abrufen, label: Abrufen }
      - { id: ablehnen, label: Ablehnen }
    items:
      - { label: "https://images.example.com/a.png", target: abrufen }
      - { label: "https://images.example.com/ordner/b.jpg?v=2", target: abrufen }
      - { label: "http://127.0.0.1:8080/admin", target: ablehnen }
      - { label: "http://169.254.169.254/latest/meta-data/", target: ablehnen }
      - { label: "https://images.example.com@10.0.0.5/", target: ablehnen }
      - { label: "gopher://images.example.com/", target: ablehnen }
      - { label: "https://images.example.com.evil.example/c.png", target: ablehnen }
---
Eine App bietet an: „Füge den Link zu deinem Profilbild ein, wir laden es für dich herunter.“ Praktisch. Jemand
trägt statt eines Bildes `http://127.0.0.1:8080/admin/users` ein. Der Server ruft die interne Admin-Seite ab – von
innen, wo keine Firewall im Weg steht – und speichert die Antwort als „Profilbild“.

## Was SSRF ist

Bei [[ssrf|Server-Side Request Forgery]] bringt jemand deinen Server dazu, eine Anfrage an ein Ziel seiner Wahl
zu schicken. Der Angreifer nutzt deinen Server als Sprungbrett.

Typische Funktionen mit SSRF-Risiko:

- Bild oder Datei per URL importieren
- Link-Vorschau mit Titel und Bild
- Webhooks, bei denen Nutzer die Ziel-URL eintragen
- PDF-Generatoren, die HTML mit externen Ressourcen rendern

Seit 2025 zählt OWASP SSRF zu **A01 Broken Access Control**: Der Angreifer erreicht Ziele, auf die er selbst
keinen Zugriff hätte.

> [!MERKSATZ]
> Dein Server steht **hinter** der Firewall. Was du von außen nicht erreichst, erreicht er oft problemlos.

## Lohnende Ziele

| Ziel | Beispiel | Risiko |
|---|---|---|
| Loopback | `http://127.0.0.1:6379/` | Interne Dienste ohne Passwort, etwa Cache oder Admin-Panel |
| Private Netze | `http://10.0.0.5/` | Datenbanken, interne APIs |
| [[cloud-metadaten-dienst\|Cloud-Metadaten]] | `http://169.254.169.254/` | Konfiguration und temporäre Zugangsdaten der Instanz |
| Andere Schemata | `file:///etc/passwd`, `gopher://…` | Lokale Dateien lesen, Protokolle missbrauchen |

Viele interne Dienste verlangen kein Passwort, weil sie sich darauf verlassen, nur aus dem eigenen Netz
erreichbar zu sein. Genau dieses Vertrauen nutzt SSRF aus: Die Anfrage kommt ja von deinem eigenen Server.

Die Adresse `169.254.169.254` ist eine [[link-local-adresse|Link-Local-Adresse]], unter der Cloud-Anbieter Daten
über die laufende Instanz bereitstellen. Bei AWS schützt IMDSv2 mit einem Token-Zwang zusätzlich davor.

## Abwehr: Allowlist und strenge URL-Prüfung

Die stärkste Abwehr ist eine [[allowlist|Allowlist]] erlaubter Ziele. Prüfe die URL **zerlegt**, nie per
Textsuche:

```php
$teile = parse_url($url);

$ok = $teile !== false
    && ($teile['scheme'] ?? '') === 'https'
    && !isset($teile['user']) && !isset($teile['pass'])
    && in_array(strtolower($teile['host'] ?? ''), ['images.example.com'], true);
```

| Trick | Warum eine Textsuche scheitert |
|---|---|
| `https://images.example.com@127.0.0.1/` | Vor dem `@` steht nur ein Benutzername |
| `https://images.example.com.evil.example/` | Der Host endet ganz anders |
| `https://evil.example/?u=images.example.com` | Der erlaubte Name steht nur im Query-String |

> [!FEHLER]
> `str_contains($url, 'images.example.com')` als Prüfung. Alle drei Tricks aus der Tabelle kommen durch. Prüfe
> immer den zerlegten Host – exakt und kleingeschrieben.

## Abwehr: IP prüfen und keine Weiterleitungen

Wenn beliebige öffentliche Ziele erlaubt sein müssen (etwa bei Webhooks), reicht die Host-Allowlist nicht. Dann:

1. Hostnamen per DNS auflösen und **jede** IP prüfen:
   `filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)`.
2. Die Verbindung zu genau dieser geprüften IP aufbauen – sonst kann ein zweiter DNS-Abruf eine andere Antwort
   liefern ([[dns-rebinding|DNS-Rebinding]]).
3. **Weiterleitungen abschalten** (`follow_location => 0`) oder jede neue URL erneut prüfen.
4. Kurze Timeouts und eine maximale Antwortgröße setzen.

```php
$ctx = stream_context_create(['http' => [
    'follow_location' => 0,
    'timeout' => 3,
]]);
```

> [!PRAXIS]
> Zusätzlich zur Prüfung im Code begrenzen viele Teams ausgehende Verbindungen auf Netzwerkebene: Der Webserver
> darf nur bestimmte Ziele erreichen (Egress-Filter). So hilft [[defense-in-depth|Defense in Depth]] auch dann,
> wenn eine Prüfung im Code fehlt.

## Zusammenfassung

- Bei **SSRF** schickt dein Server Anfragen an Ziele, die der Angreifer bestimmt.
- Lohnende Ziele: Loopback, private Netze, Cloud-Metadaten, Schemata wie `file://`.
- Beste Abwehr: **Allowlist** mit exaktem Host, nur `https`, keine Zugangsdaten in der URL.
- Bei freien Zielen: DNS auflösen, private und reservierte IPs ablehnen, keine Weiterleitungen.
- Textsuchen wie `str_contains` sind keine URL-Prüfung.
