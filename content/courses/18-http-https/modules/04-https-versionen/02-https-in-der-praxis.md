---
title: HTTPS in der Praxis – Umleitung, HSTS und Let's Encrypt
summary: Wie eine Website zuverlässig nur noch HTTPS spricht, woher kostenlose Zertifikate kommen und welche Zertifikatsfehler dir begegnen.
duration: 20
sources:
  - title: MDN – Strict-Transport-Security
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security
  - title: Let's Encrypt – How It Works
    url: https://letsencrypt.org/how-it-works/
  - title: Let's Encrypt – Challenge Types
    url: https://letsencrypt.org/docs/challenge-types/
  - title: "Let's Encrypt – Decreasing Certificate Lifetimes to 45 Days"
    url: https://letsencrypt.org/2025/12/02/from-90-to-45
  - title: Certbot – Dokumentation
    url: https://eff-certbot.readthedocs.io/en/stable/using.html
  - title: MDN – Mixed content
    url: https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Mixed_content
quiz:
  - type: single
    question: Warum reicht eine Umleitung von http:// auf https:// allein nicht aus?
    options:
      - Weil Umleitungen bei HTTPS verboten sind.
      - Weil die allererste Anfrage noch unverschlüsselt über http:// läuft und abgefangen werden kann.
      - Weil Browser 301 ignorieren.
      - Weil die Umleitung das Zertifikat ungültig macht.
    answer: 1
    explanation: >
      Genau diese erste Klartext-Anfrage nutzt ein Angreifer im selben WLAN aus. HSTS sorgt dafür, dass der
      Browser http:// gar nicht erst benutzt.
  - type: match
    question: Ordne jede Fehlermeldung ihrer Ursache zu.
    pairs:
      - { left: "Zertifikat abgelaufen", right: "notAfter liegt in der Vergangenheit" }
      - { left: "Name stimmt nicht überein", right: "Der Hostname fehlt im Subject Alternative Name" }
      - { left: "Unbekannte Zertifizierungsstelle", right: "Selbst signiert oder Root nicht im Vertrauensspeicher" }
      - { left: "unable to get local issuer certificate", right: "Der Server schickt das Zwischenzertifikat nicht mit" }
    explanation: Diese vier Ursachen decken fast alle Zertifikatsfehler im Alltag ab.
  - type: multiple
    question: Welche Aussagen über Let's Encrypt stimmen?
    options:
      - Die Zertifikate sind kostenlos.
      - Die Ausstellung läuft automatisch über das Protokoll ACME.
      - Zertifikate gelten derzeit standardmäßig 90 Tage und sollen bis 2028 auf 45 Tage schrumpfen.
      - Man muss jedes Zertifikat von Hand per E-Mail beantragen.
    answers: [0, 1, 2]
    explanation: Kurze Laufzeiten funktionieren nur mit Automatisierung – genau dafür ist ACME da.
  - type: cloze
    text: "Der Header `Strict-Transport-Security: max-age=___` weist den Browser an, ein Jahr lang nur HTTPS zu nutzen."
    blanks:
      - ["31536000"]
    explanation: 365 × 24 × 60 × 60 = 31 536 000 Sekunden.
tasks:
  - id: https-erzwingen
    type: simulated
    title: Prüfe, ob eine Website HTTPS erzwingt
    description: |
      Du prüfst auf deinem Rechner, ob `www.example.com` sauber auf HTTPS umgestellt ist (hier simuliert).

      1. Hole mit `curl -sI` nur die Header von `http://www.example.com/`. Kommt eine Umleitung?
      2. Hole die Header von `https://www.example.com/` und filtere mit `grep -i strict` nach dem HSTS-Header.
    prompt: "du@laptop:~$"
    steps:
      - expect: "^curl\\s+-s?I\\s+(-s\\s+)?http://www\\.example\\.com/?\\s*$"
        output: |
          HTTP/1.1 301 Moved Permanently
          Server: nginx
          Date: Fri, 09 Oct 2026 10:15:02 GMT
          Content-Type: text/html
          Content-Length: 162
          Location: https://www.example.com/
        hint: "curl -sI http://www.example.com/"
      - expect: "^curl\\s+-s?I\\s+(-s\\s+)?https://www\\.example\\.com/?\\s*\\|\\s*grep\\s+-i\\s+['\"]?strict['\"]?\\s*$"
        output: |
          strict-transport-security: max-age=31536000; includeSubDomains
        hint: "curl -sI https://www.example.com/ | grep -i strict"
    responses:
      - match: "^curl\\s+-s?I\\s+(-s\\s+)?https://www\\.example\\.com/?\\s*$"
        output: |
          HTTP/2 200
          server: nginx
          content-type: text/html; charset=UTF-8
          strict-transport-security: max-age=31536000; includeSubDomains
          cache-control: no-cache
  - id: acme-ablauf
    type: steps
    title: Ein Zertifikat von Let's Encrypt – was passiert als Nächstes?
    description: Du richtest auf dem Server für `shop.example.com` ein kostenloses Zertifikat mit Certbot ein (HTTP-01-Challenge).
    steps:
      - situation: "Du startest `certbot certonly --webroot -w /var/www/html -d shop.example.com`."
        question: Was muss Certbot gegenüber Let's Encrypt beweisen?
        options:
          - Dass du die Domain kontrollierst.
          - Dass deine Firma im Handelsregister steht.
          - Dass dein Server schnell genug ist.
        answer: 0
        explanation: Let's Encrypt stellt nur Domain-validierte Zertifikate aus. Geprüft wird ausschließlich die Kontrolle über die Domain.
      - situation: Let's Encrypt gibt Certbot einen zufälligen Token für die HTTP-01-Challenge.
        question: Wo legt Certbot ihn ab?
        options:
          - Als Datei unter /.well-known/acme-challenge/ im Webroot, erreichbar über Port 80
          - Als Cookie im Browser
          - In einer E-Mail an den Domain-Besitzer
        answer: 0
        explanation: Let's Encrypt ruft `http://shop.example.com/.well-known/acme-challenge/<token>` ab. Antwortet dein Server mit dem richtigen Inhalt, ist die Kontrolle bewiesen.
      - situation: Die Prüfung klappt. Certbot speichert `fullchain.pem` und `privkey.pem`.
        question: Welche Datei trägst du als Zertifikat im Webserver ein?
        options:
          - fullchain.pem – Server-Zertifikat plus Zwischenzertifikat
          - Nur das Root-Zertifikat
          - privkey.pem als Zertifikat und fullchain.pem als Schlüssel
        answer: 0
        explanation: fullchain.pem enthält die Kette ohne Root. privkey.pem ist der private Schlüssel und verlässt den Server nie.
      - situation: Das Zertifikat läuft in 90 Tagen ab – Tendenz kürzer.
        question: Wie verhinderst du, dass die Website in drei Monaten ausfällt?
        options:
          - Kalender-Erinnerung und manuelle Erneuerung
          - Automatische Erneuerung, z. B. per Timer mit `certbot renew`, getestet mit `certbot renew --dry-run`
          - Ein Zertifikat mit 10 Jahren Laufzeit bestellen
        answer: 1
        explanation: Certbot richtet meist selbst einen Timer ein. Kurze Laufzeiten sind gewollt – sie zwingen zur Automatisierung und begrenzen den Schaden bei einem geleakten Schlüssel.
---
Dein Server hat ein gültiges Zertifikat, `https://` funktioniert. Fertig? Nicht ganz. Wer `example.com`
ohne Schema eintippt, landet zuerst auf `http://`. Bilder werden vielleicht noch unverschlüsselt
geladen. Und in 90 Tagen läuft das Zertifikat ab. Diese Lektion zeigt, wie du HTTPS im Betrieb
wirklich dicht machst.

## Von HTTP auf HTTPS umleiten

Der Webserver beantwortet jede Anfrage auf Port 80 mit einer dauerhaften Umleitung:

```http title="Antwort auf http://www.example.com/warenkorb"
HTTP/1.1 301 Moved Permanently
Location: https://www.example.com/warenkorb
```

Pfad und Query-String bleiben dabei erhalten. Für APIs nimmst du `308`, damit ein `POST` nicht zum
`GET` wird. Diese Umleitung ist Pflicht, reicht aber nicht.

> [!FEHLER]
> Die allererste Anfrage über `http://` ist unverschlüsselt. Im offenen WLAN kann ein Angreifer sie
> abfangen und dich auf einer gefälschten HTTP-Seite festhalten („SSL Stripping“). Die Umleitung kommt
> dann nie bei dir an.

## HSTS: nur noch HTTPS

[[hsts|HSTS]] (HTTP Strict Transport Security) schließt diese Lücke. Der Server schickt über HTTPS:

```http title="HSTS-Header"
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

| Teil | Bedeutung |
|---|---|
| `max-age=31536000` | Ein Jahr lang merkt sich der Browser: diese Domain nur per HTTPS |
| `includeSubDomains` | Gilt auch für alle Subdomains |
| `preload` | Domain darf in die eingebaute HSTS-Liste der Browser |

Danach schreibt der Browser jedes `http://` für diese Domain **selbst** in `https://` um, bevor er
überhaupt eine Verbindung aufbaut. Im Netzwerk-Tab erscheint dafür oft „307 Internal Redirect“. Zudem
lässt er bei Zertifikatsfehlern kein „Trotzdem fortfahren“ mehr zu.

> [!MERKSATZ]
> Umleitung + HSTS: Die Umleitung holt Besucher:innen beim ersten Mal ab, HSTS sorgt dafür, dass es nie
> wieder ein erstes Mal über HTTP gibt.

Vorsicht: Mit `includeSubDomains` müssen wirklich **alle** Subdomains HTTPS können – sonst sind sie für
ein Jahr unerreichbar. Starte mit einem kleinen `max-age` und erhöhe es schrittweise.

## Let's Encrypt und ACME

Früher kosteten Zertifikate Geld und wurden von Hand beantragt. [[lets-encrypt|Let's Encrypt]] ist eine
gemeinnützige Zertifizierungsstelle, die kostenlose Zertifikate automatisch ausstellt. Das Protokoll
dafür heißt [[acme|ACME]], das bekannteste Programm [[certbot|Certbot]].

Bewiesen wird nur: Du kontrollierst die Domain. Dafür gibt es Challenges:

| Challenge | So geht der Beweis |
|---|---|
| HTTP-01 | Eine Datei unter `/.well-known/acme-challenge/` auf Port 80 bereitstellen |
| DNS-01 | Einen TXT-Eintrag `_acme-challenge.example.com` setzen – nötig für Wildcards wie `*.example.com` |

```bash title="Certbot auf einem Server (Beispiel)"
sudo certbot certonly --webroot -w /var/www/html -d shop.example.com
sudo certbot renew --dry-run
```

Heraus kommen `fullchain.pem` (Server- plus Zwischenzertifikat) und `privkey.pem` (privater Schlüssel).

## Kurze Laufzeiten, volle Automatik

Let's Encrypt-Zertifikate gelten derzeit 90 Tage. Das wird kürzer: Ab Februar 2027 sind es
standardmäßig 64 Tage, ab Februar 2028 nur noch 45. Auch die Regeln der Browser-Hersteller verkürzen
die maximale Laufzeit aller öffentlichen Zertifikate Schritt für Schritt.

Kurze Laufzeiten sind Absicht. Wird ein privater Schlüssel gestohlen, ist das Zertifikat bald wertlos.
Dafür muss die Erneuerung vollautomatisch laufen – Certbot richtet einen Timer ein, viele Webserver und
Reverse Proxys bringen ACME sogar direkt mit.

> [!PRAXIS]
> In Teams gehört „Zertifikat erneuert sich automatisch“ zur Checkliste jedes neuen Servers. Ein
> Monitoring warnt zusätzlich, wenn `notAfter` weniger als zwei Wochen entfernt ist.

## Typische Fehler im Betrieb

| Symptom | Ursache |
|---|---|
| Browser: Zertifikat abgelaufen | Erneuerung lief nicht – Timer und Logs prüfen |
| Browser: Name stimmt nicht | Hostname fehlt im SAN, z. B. `www.` vergessen |
| Unbekannte Zertifizierungsstelle | Selbst signiert oder Root unbekannt |
| curl: `unable to get local issuer certificate` (Exit-Code 60) | Zwischenzertifikat fehlt – `fullchain.pem` nutzen |
| Schloss-Symbol mit Warnung | Mixed Content: Seite lädt Teile über `http://` |

[[mixed-content|Mixed Content]] entsteht, wenn eine HTTPS-Seite Bilder oder Skripte über `http://`
einbindet. Browser blockieren Skripte dann ganz und versuchen Bilder automatisch per HTTPS zu laden.
Die Lösung: alle Adressen auf `https://` oder relative Pfade umstellen.

## Zusammenfassung

- Port 80 leitet dauerhaft auf HTTPS um (301, bei APIs 308).
- HSTS sorgt dafür, dass der Browser die Domain nur noch per HTTPS anspricht.
- Let's Encrypt stellt kostenlose Zertifikate per ACME aus; bewiesen wird die Kontrolle über die Domain.
- Laufzeiten sind kurz (90 Tage, bald 45) – Erneuerung muss automatisch laufen.
- Immer `fullchain.pem` ausliefern, damit das Zwischenzertifikat mitkommt.
- Mixed Content entsteht durch `http://`-Ressourcen auf HTTPS-Seiten.
