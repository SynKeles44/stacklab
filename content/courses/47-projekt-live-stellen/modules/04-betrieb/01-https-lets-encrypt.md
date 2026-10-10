---
title: HTTPS mit Let's Encrypt
summary: Ein kostenloses Zertifikat mit Certbot holen, nginx automatisch auf HTTPS umstellen und die Erneuerung zuverlässig automatisieren.
duration: 20
sources:
  - title: Let's Encrypt – How It Works
    url: https://letsencrypt.org/how-it-works/
  - title: Let's Encrypt – Challenge Types
    url: https://letsencrypt.org/docs/challenge-types/
  - title: Let's Encrypt – Certificate Lifetimes
    url: https://letsencrypt.org/docs/cert-lifetimes/
  - title: Certbot – User Guide
    url: https://eff-certbot.readthedocs.io/en/stable/using.html
quiz:
  - type: single
    question: Wie beweist dein Server bei der HTTP-01-Challenge, dass er die Domain kontrolliert?
    options:
      - Er schickt Let's Encrypt eine E-Mail.
      - Er legt eine Datei unter /.well-known/acme-challenge/ ab, die Let's Encrypt über Port 80 abruft.
      - Er öffnet Port 22 für Let's Encrypt.
      - Er lädt seinen privaten Schlüssel hoch.
    answer: 1
    explanation: >
      Let's Encrypt ruft `http://example.com/.well-known/acme-challenge/<token>` ab. Nur wer den Server hinter
      der Domain kontrolliert, kann dort die richtige Antwort ablegen. Deshalb muss Port 80 offen sein.
  - type: multiple
    question: Was solltest du über die Laufzeit von Let's Encrypt-Zertifikaten wissen?
    options:
      - Sie gelten derzeit standardmäßig 90 Tage.
      - Let's Encrypt plant, die Laufzeit bis 2028 auf 45 Tage zu verkürzen.
      - Man erneuert sie am besten einmal im Jahr von Hand.
      - Die Erneuerung muss automatisch laufen.
    answers: [0, 1, 3]
    explanation: Kurze Laufzeiten machen Automatisierung zur Pflicht. Certbot richtet dafür einen Timer ein, der regelmäßig erneuert.
  - type: cloze
    text: "Ob die automatische Erneuerung funktioniert, testest du gefahrlos mit `sudo certbot renew ___`."
    blanks:
      - ["--dry-run"]
    explanation: --dry-run nutzt die Testumgebung von Let's Encrypt und verändert keine echten Zertifikate.
  - type: single
    question: Warum aktivierst du HSTS erst, wenn HTTPS stabil läuft?
    options:
      - Weil HSTS den Server verlangsamt.
      - Weil Browser sich HSTS für die angegebene Zeit merken und die Seite dann nur noch per HTTPS aufrufen – ein kaputtes Zertifikat macht sie unerreichbar.
      - Weil HSTS nur mit selbst signierten Zertifikaten funktioniert.
      - Weil HSTS Port 80 schließt.
    answer: 1
    explanation: HSTS ist ein Versprechen an den Browser. Starte mit einer kurzen max-age und erhöhe sie, wenn alles läuft.
tasks:
  - id: certbot-ausfuehren
    type: simulated
    title: Ein Zertifikat holen und die Erneuerung testen
    description: |
      DNS zeigt auf deinen Server, Port 80 und 443 sind offen, die nginx-Site für `example.com` ist aktiv.

      1. Hole ein Zertifikat für beide Namen und lass Certbot nginx anpassen:
         `sudo certbot --nginx -d example.com -d www.example.com`
      2. Prüfe, ob die Weiterleitung klappt: `curl -I http://example.com`
      3. Teste die automatische Erneuerung: `sudo certbot renew --dry-run`
      4. Schau nach, wann der Timer das nächste Mal läuft: `systemctl list-timers | grep certbot`
    prompt: "deploy@web-01:~$"
    steps:
      - expect: "^sudo\\s+certbot\\s+--nginx\\s+-d\\s+example\\.com\\s+-d\\s+www\\.example\\.com\\s*$"
        output: |
          Saving debug log to /var/log/letsencrypt/letsencrypt.log
          Requesting a certificate for example.com and www.example.com

          Successfully received certificate.
          Certificate is saved at: /etc/letsencrypt/live/example.com/fullchain.pem
          Key is saved at:         /etc/letsencrypt/live/example.com/privkey.pem
          This certificate expires on 2027-01-08.
          Certbot has set up a scheduled task to automatically renew this certificate in the background.

          Deploying certificate
          Successfully deployed certificate for example.com to /etc/nginx/sites-enabled/example.com
          Successfully deployed certificate for www.example.com to /etc/nginx/sites-enabled/example.com
          Congratulations! You have successfully enabled HTTPS on https://example.com and https://www.example.com
        hint: "sudo certbot --nginx -d example.com -d www.example.com"
      - expect: "^curl\\s+-I\\s+http://example\\.com/?\\s*$"
        output: |
          HTTP/1.1 301 Moved Permanently
          Server: nginx
          Location: https://example.com/
        hint: "curl -I http://example.com"
      - expect: "^sudo\\s+certbot\\s+renew\\s+--dry-run\\s*$"
        output: |
          Processing /etc/letsencrypt/renewal/example.com.conf
          Account registered.
          Simulating renewal of an existing certificate for example.com and www.example.com

          Congratulations, all simulated renewals succeeded:
            /etc/letsencrypt/live/example.com/fullchain.pem (success)
        hint: "sudo certbot renew --dry-run"
      - expect: "^systemctl\\s+list-timers(\\s+--all)?\\s*\\|\\s*grep\\s+certbot\\s*$"
        output: "Sat 2026-10-10 21:14:00 UTC  9h left  Sat 2026-10-10 09:02:11 UTC  2h ago  certbot.timer  certbot.service"
        hint: "systemctl list-timers | grep certbot"
    solution: |
      ```bash
      sudo certbot --nginx -d example.com -d www.example.com
      curl -I http://example.com
      sudo certbot renew --dry-run
      systemctl list-timers | grep certbot
      ```
      Wenn du Certbot als Snap installiert hast, heißt der Timer `snap.certbot.renew.timer`.
  - id: https-situationen
    type: steps
    title: Was passiert, wenn …?
    description: Spiel typische Situationen rund um HTTPS durch.
    steps:
      - situation: >
          Du rufst `sudo certbot --nginx -d example.com` auf, aber die Firewall erlaubt nur 22 und 443.
        question: Was passiert?
        options:
          - Das Zertifikat wird trotzdem ausgestellt.
          - Die HTTP-01-Challenge scheitert, weil Let's Encrypt Port 80 nicht erreicht.
          - Certbot öffnet den Port selbst.
        answer: 1
        explanation: Die HTTP-01-Challenge läuft immer über Port 80. Ohne ihn kann Let's Encrypt die Datei nicht abrufen.
      - situation: >
          Du hast DNS gerade erst umgestellt. `dig +short example.com` zeigt bei manchen Resolvern noch die alte IP.
        question: Was ist klug?
        options:
          - Sofort zehnmal hintereinander Certbot starten, bis es klappt.
          - Warten, bis die alte TTL abgelaufen ist, und mit `--dry-run` testen, bevor du das echte Zertifikat holst.
          - Ein selbst signiertes Zertifikat verwenden.
        answer: 1
        explanation: Viele Fehlversuche laufen in die Rate Limits von Let's Encrypt. Test-Läufe mit --dry-run zählen dort nicht.
      - situation: >
          Drei Monate später: Die Erneuerung schlägt fehl, weil jemand den Block für `.well-known` aus der nginx-Site gelöscht hat.
        question: Wie erfährst du davon rechtzeitig?
        options:
          - Gar nicht, bis Besucher Warnungen sehen.
          - Über eine Überwachung, die die Ablaufzeit des Zertifikats prüft und früh warnt.
          - Let's Encrypt verlängert trotzdem.
        answer: 1
        explanation: Eine Zertifikats-Überwachung gehört zur Grundausstattung. Darum geht es in der Lektion zur Überwachung.
---
Seit Jahren markieren Browser Seiten ohne HTTPS als „nicht sicher“, und Formulare mit Passwörtern
funktionieren ohne Verschlüsselung gar nicht vernünftig. Früher kosteten Zertifikate Geld und Nerven. Heute
holst du dir mit einem Befehl ein kostenloses Zertifikat – wichtig ist nur, dass auch die **Erneuerung**
von allein klappt.

## Let's Encrypt und ACME

[[lets-encrypt|Let's Encrypt]] ist eine gemeinnützige [[zertifizierungsstelle|Zertifizierungsstelle]].
Sie stellt [[zertifikat|Zertifikate]] kostenlos und vollautomatisch aus – über das Protokoll
[[acme|ACME]]. Das Programm auf deinem Server, das ACME spricht, heißt ACME-Client. Let's Encrypt
empfiehlt für den Einstieg [[certbot|Certbot]].

So läuft die Ausstellung mit der [[http-01-challenge|HTTP-01-Challenge]] ab:

1. Certbot meldet sich bei Let's Encrypt: „Ich möchte ein Zertifikat für `example.com`.“
2. Let's Encrypt antwortet mit einem Token.
3. Certbot legt eine Datei unter `/.well-known/acme-challenge/<token>` ab.
4. Let's Encrypt ruft `http://example.com/.well-known/acme-challenge/<token>` ab – über **Port 80**.
5. Stimmt der Inhalt, wird das Zertifikat ausgestellt.

Für Wildcard-Zertifikate (`*.example.com`) gibt es die DNS-01-Challenge über einen TXT-Eintrag – mehr dazu
in der [Dokumentation](https://letsencrypt.org/docs/challenge-types/).

## Certbot mit dem nginx-Plugin

```bash title="Terminal"
sudo snap install --classic certbot      # empfohlener Weg laut Certbot-Anleitung
sudo ln -s /snap/bin/certbot /usr/bin/certbot
sudo certbot --nginx -d example.com -d www.example.com
```

Alternativ gibt es das Ubuntu-Paket `python3-certbot-nginx`. Das nginx-Plugin erledigt drei Dinge:

- holt das Zertifikat für alle mit `-d` genannten Namen,
- ergänzt deine Site um `listen 443 ssl;` und die Pfade zu Zertifikat und Schlüssel,
- leitet HTTP per `301` auf HTTPS um.

```nginx title="Was Certbot ergänzt (Auszug)"
listen 443 ssl;
ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
```

> [!FEHLER]
> Port 80 nach der Umstellung auf HTTPS in der Firewall schließen. Dann funktionieren zwar alle Seiten,
> aber in ein paar Wochen scheitert die Erneuerung – denn die HTTP-01-Challenge braucht Port 80.

## Erneuerung: automatisch oder gar nicht

Zertifikate von Let's Encrypt gelten derzeit standardmäßig **90 Tage**. Let's Encrypt plant, die maximale
Laufzeit bis Februar 2028 auf **45 Tage** zu senken; auf Wunsch gibt es schon heute Zertifikate mit nur
sechs Tagen Laufzeit. Von Hand erneuern ist also keine Option.

Certbot richtet bei der Installation einen [[systemd|systemd]]-Timer ein, der zweimal täglich prüft und
rechtzeitig vor Ablauf erneuert. Ob das klappt, testest du ohne Risiko:

```bash title="Terminal"
sudo certbot renew --dry-run
systemctl list-timers | grep certbot
sudo certbot certificates          # alle Zertifikate mit Ablaufdatum
```

> [!MERKSATZ]
> Ein Zertifikat ist erst fertig eingerichtet, wenn `certbot renew --dry-run` erfolgreich war **und** eine
> Überwachung dich vor dem Ablauf warnt.

## HSTS – das Versprechen an den Browser

Mit [[hsts|HSTS]] sagt deine Seite dem Browser: „Ruf mich in Zukunft nur noch per HTTPS auf.“ Das schützt
vor Angriffen, bei denen jemand die erste unverschlüsselte Anfrage abfängt.

```nginx title="Im server-Block für Port 443"
add_header Strict-Transport-Security "max-age=300" always;
```

Starte mit fünf Minuten (`max-age=300`). Läuft alles stabil, erhöhst du schrittweise bis auf ein Jahr
(`31536000`). Der Browser merkt sich den Wert – ein Fehler lässt sich nicht einfach zurücknehmen.

> [!PRAXIS]
> Teste neue Domains zuerst mit `certbot --dry-run` oder der Staging-Umgebung. Wer bei Fehlern in einer
> Schleife echte Zertifikate anfragt, läuft schnell in die Rate Limits von Let's Encrypt und muss warten.

## Zusammenfassung

- **Let's Encrypt** stellt kostenlose Zertifikate über das **ACME**-Protokoll aus; Certbot ist der empfohlene Client.
- Die **HTTP-01-Challenge** braucht Port 80 und den Pfad `/.well-known/acme-challenge/`.
- `certbot --nginx` holt das Zertifikat, ergänzt `listen 443 ssl` und leitet HTTP auf HTTPS um.
- Laufzeit heute 90 Tage, geplant 45 Tage – Erneuerung **automatisch** per Timer, geprüft mit `--dry-run`.
- **HSTS** erst aktivieren, wenn HTTPS stabil läuft, und mit kleinem `max-age` beginnen.
