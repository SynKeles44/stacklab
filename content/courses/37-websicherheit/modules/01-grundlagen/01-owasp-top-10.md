---
title: Websicherheit und die OWASP Top 10
summary: Warum Sicherheit kein Extra ist, welche zehn Risikokategorien die OWASP Top 10:2025 nennt und wie du in Vertrauensgrenzen denkst.
duration: 20
sources:
  - title: OWASP Top 10:2025
    url: https://top10.owasp.org/2025/
  - title: OWASP Top 10:2025 – A01 Broken Access Control
    url: https://top10.owasp.org/2025/A01_2025-Broken_Access_Control/
  - title: OWASP Cheat Sheet Series
    url: https://cheatsheetseries.owasp.org/
  - title: MDN – Websicherheit
    url: https://developer.mozilla.org/de/docs/Web/Security
quiz:
  - type: single
    question: Welche Kategorie steht in der OWASP Top 10:2025 auf Platz 1?
    options:
      - Injection
      - Broken Access Control
      - Cryptographic Failures
      - Security Misconfiguration
    answer: 1
    explanation: >
      Fehlerhafte Zugriffskontrolle führt die Liste an – wie schon 2021. Injection ist in der Ausgabe 2025 auf
      Platz 5 gerutscht, ist aber weiterhin gefährlich.
  - type: multiple
    question: Welche Daten liegen jenseits der Vertrauensgrenze und müssen vom Server geprüft werden?
    options:
      - Der Query-String einer URL
      - Ein Cookie, das der Browser mitschickt
      - Der Wert eines versteckten Formularfelds
      - Eine Konstante in deinem eigenen PHP-Code
    answers: [0, 1, 2]
    explanation: >
      Alles, was über den Request hereinkommt, kann jemand beliebig verändern – auch Cookies und versteckte Felder.
      Nur Werte, die dein eigener Code festlegt, stammen nicht von außen.
  - type: match
    question: Ordne jedem Prinzip seine Bedeutung zu.
    pairs:
      - { left: "Defense in Depth", right: "Mehrere unabhängige Schutzschichten hintereinander" }
      - { left: "Least Privilege", right: "Jede Komponente bekommt nur die Rechte, die sie braucht" }
      - { left: "Deny by Default", right: "Was nicht ausdrücklich erlaubt ist, wird abgelehnt" }
    explanation: >
      Die drei Prinzipien ergänzen sich: Erst wird alles verboten, dann gezielt erlaubt, mit minimalen Rechten und
      mehreren Schichten – fällt eine aus, hält die nächste.
  - type: cloze
    text: Die Liste der zehn größten Risiken für Web-Anwendungen veröffentlicht das Projekt ___. Die aktuelle Ausgabe stammt aus dem Jahr ___.
    blanks:
      - [OWASP, Open Worldwide Application Security Project]
      - ["2025"]
    explanation: Das OWASP-Projekt aktualisiert die Liste alle paar Jahre anhand von Daten aus echten Tests und Umfragen.
tasks:
  - id: kategorien-zuordnen
    type: dragdrop
    title: Ordne die Fundstellen den OWASP-Kategorien zu
    description: |
      Bei einem Code-Review sind diese Probleme aufgefallen. Ziehe jedes Problem auf die passende Kategorie der
      OWASP Top 10:2025.
    targets:
      - { id: a01, label: "A01 Broken Access Control" }
      - { id: a02, label: "A02 Security Misconfiguration" }
      - { id: a03, label: "A03 Software Supply Chain Failures" }
      - { id: a05, label: "A05 Injection" }
      - { id: a09, label: "A09 Security Logging and Alerting Failures" }
    items:
      - { label: "/rechnungen/1043 zeigt auch fremde Rechnungen", target: a01 }
      - { label: "Der Server holt jede URL ab, die im Formular steht (SSRF)", target: a01 }
      - { label: "Die Live-Seite zeigt Stacktraces mit Dateipfaden", target: a02 }
      - { label: "Ein npm-Paket mit bekannter kritischer Lücke ist installiert", target: a03 }
      - { label: "Die Suche klebt die Eingabe in den SQL-Text", target: a05 }
      - { label: "Ein Kommentar mit <script> wird ungefiltert ausgegeben", target: a05 }
      - { label: "Hunderte fehlgeschlagene Logins fallen niemandem auf", target: a09 }
    hints:
      - "XSS zählt in der OWASP-Liste zur Kategorie Injection."
      - "SSRF wurde 2025 in Broken Access Control eingeordnet."
  - id: grenzen-erkennen
    type: steps
    title: Wo liegt die Vertrauensgrenze?
    description: Verfolge eine Anfrage durch eine kleine Shop-App und entscheide an jeder Station, was zu tun ist.
    steps:
      - situation: "Ein Browser schickt `POST /warenkorb` mit `{\"produkt\": 7, \"preis\": 0.01}`."
        question: Wie geht der Server mit dem Feld `preis` um?
        options:
          - Er übernimmt den Preis, weil das Frontend ihn berechnet hat.
          - Er ignoriert den Preis und liest ihn selbst aus der Datenbank.
          - Er prüft nur, ob der Preis eine Zahl ist.
        answer: 1
        explanation: Der Request liegt jenseits der Vertrauensgrenze. Preise, Rollen und Rabatte bestimmt immer der Server.
      - situation: Der Server liest die Produkt-ID `7` und will das Produkt aus der Datenbank laden.
        question: Wie kommt die ID in die SQL-Abfrage?
        options:
          - Per String-Verkettung, die ID ist ja nur eine Zahl.
          - Als Wert für einen Platzhalter in einem Prepared Statement.
          - Gar nicht, IDs sind ungefährlich.
        answer: 1
        explanation: Auch scheinbar harmlose Zahlen kommen von außen. Ein Platzhalter trennt Daten sicher vom SQL-Befehl.
      - situation: Die Datenbank ist erreichbar. Der Datenbank-Benutzer der App darf alles, auch `DROP TABLE`.
        question: Welches Prinzip ist verletzt?
        options:
          - Least Privilege
          - Defense in Depth
          - Keins, das ist üblich
        answer: 0
        explanation: Die App braucht nur Lese- und Schreibrechte auf ihre Tabellen. Weniger Rechte begrenzen den Schaden, falls doch eine Lücke durchrutscht.
---
Eine Entwicklerin baut in einem Nachmittag eine Seite, auf der Kundinnen ihre Rechnungen abrufen. Alles
funktioniert. Eine Woche später ändert jemand in der Adresszeile `/rechnungen/1043` in `/rechnungen/1044` –
und sieht die Rechnung einer Fremden. Kein Hacker-Werkzeug, nur eine geänderte Zahl.

## Warum Sicherheit kein Extra ist

Eine [[sicherheitsluecke|Sicherheitslücke]] ist ein Fehler, den jemand absichtlich ausnutzen kann. Sie fällt im
normalen Test nicht auf, weil die App ja „funktioniert“. Erst wer etwas Unerwartetes schickt, merkt den Fehler.

Das Ungleichgewicht ist brutal: Du musst **jede** Stelle absichern, ein Angreifer braucht nur **eine** Lücke.
Deshalb gehört Sicherheit in jede Zeile Code – nicht in eine Prüfung kurz vor dem Release.

> [!ACHTUNG]
> Teste nur Systeme, die dir gehören oder für die du eine schriftliche Erlaubnis hast. In diesem Kurs arbeitest
> du ausschließlich mit deinem eigenen Code im lokalen Übungs-Terminal. Fremde Seiten anzugreifen ist strafbar.

## Die OWASP Top 10:2025

[[owasp|OWASP]] ist eine gemeinnützige Community für Anwendungssicherheit. Ihr bekanntestes Projekt, die
[[owasp-top-10|OWASP Top 10]], fasst die häufigsten und folgenreichsten Risiken für Web-Anwendungen zusammen.

| Nr. | Kategorie | Kurz gesagt | Im Kurs |
|---|---|---|---|
| A01 | Broken Access Control | Fremde Daten lesen, IDOR, CSRF, SSRF | Modul 3 |
| A02 | Security Misconfiguration | Debug-Modus, fehlende Header | Modul 1 |
| A03 | Software Supply Chain Failures | Unsichere Abhängigkeiten | Modul 4 |
| A04 | Cryptographic Failures | Schwache oder fehlende Verschlüsselung | Kurs HTTP & HTTPS |
| A05 | Injection | SQL, Shell-Befehle, XSS | Modul 2 |
| A06 | Insecure Design | Sicherheit nicht mitgedacht | ganzer Kurs |
| A07 | Authentication Failures | Schwache Logins | Kurs Authentifizierung |
| A08 | Software or Data Integrity Failures | Unsichere Deserialisierung | Modul 4 |
| A09 | Security Logging and Alerting Failures | Angriffe bleiben unbemerkt | Modul 4 |
| A10 | Mishandling of Exceptional Conditions | Fehler öffnen Lücken | Modul 1 |

> [!MERKSATZ]
> Die OWASP Top 10 ist eine **Checkliste der häufigsten Risiken**, kein vollständiger Sicherheitsstandard. Sie
> sagt dir, wo du zuerst hinschauen solltest.

## Angriffsfläche und Vertrauensgrenzen

Die [[angriffsflaeche|Angriffsfläche]] ist alles, worüber jemand von außen mit deiner App spricht: URLs,
Formulare, API-Endpunkte, Datei-Uploads, Header, Cookies.

Eine [[vertrauensgrenze|Vertrauensgrenze]] ist die Linie, an der Daten aus einer unsicheren Welt in deinen Code
wechseln. Der Browser gehört dem Nutzer – er kann jedes Feld, jedes Cookie und jeden Header frei verändern.

![Vertrauensgrenze zwischen Browser und Server: Eingaben werden geprüft, Ausgaben kodiert](/assets/websicherheit/vertrauensgrenze.svg)

An der Grenze gelten drei Regeln:

1. **Eingaben prüfen** – Typ, Format, Länge, erlaubte Werte.
2. **Daten und Befehle trennen**, wenn Werte an SQL, Shell oder Dateisystem gehen.
3. **Ausgaben kodieren**, bevor Daten in HTML, URLs oder JavaScript landen.

> [!FEHLER]
> „Das Feld ist im Formular doch ausgegraut.“ Deaktivierte oder versteckte Felder, JavaScript-Prüfungen und
> Dropdowns schützen nichts. Mit den DevTools oder `curl` schickt jeder beliebige Werte.

## Defense in Depth und Least Privilege

Kein Schutz ist perfekt. Darum stapelst du mehrere Schichten: [[defense-in-depth|Defense in Depth]]. Fällt eine
aus, hält die nächste – wie Burgmauer, Graben und verschlossene Tür.

| Prinzip | Beispiel |
|---|---|
| Defense in Depth | Escaping gegen XSS **und** zusätzlich eine Content Security Policy |
| [[least-privilege\|Least Privilege]] | Der Datenbank-Benutzer der App darf keine Tabellen löschen |
| Deny by Default | Neue Routen sind gesperrt, bis eine Berechtigung sie freigibt |
| Fail Secure | Bei einem Fehler wird der Zugriff verweigert, nicht erlaubt |

> [!PRAXIS]
> In Teams wird vor größeren Releases oft eine Sicherheits-Checkliste entlang der OWASP Top 10 abgearbeitet.
> Noch wirksamer ist es, jede Kategorie schon im Code-Review mitzudenken.

## Wie du in diesem Kurs übst

Du lernst jede Lücke in drei Schritten: **verstehen**, **im eigenen Code erkennen**, **reparieren**. Dafür
bekommst du absichtlich verwundbare Code-Ausschnitte, findest den Fehler und baust die sichere Variante.

- Code-Aufgaben in PHP und JavaScript laufen im Browser bzw. im Sandbox-Container.
- Terminal-Aufgaben laufen im Ordner `websicherheit` deines Workspaces.
- Alle Adressen sind Platzhalter wie `example.com` oder `203.0.113.10`.

SQL-Injection kennst du bereits aus dem Kurs Datenbanken & SQL ([[sql-injection]]) – hier geht es um das Muster
dahinter und die übrigen Kategorien.

## Zusammenfassung

- Eine Lücke reicht – Sicherheit gehört in jede Zeile, nicht ans Projektende.
- Die **OWASP Top 10:2025** nennt die wichtigsten Risiken, angeführt von Broken Access Control.
- Alles aus dem Request liegt jenseits der **Vertrauensgrenze**: prüfen, trennen, kodieren.
- **Defense in Depth**, **Least Privilege** und **Deny by Default** begrenzen den Schaden.
- Getestet wird nur eigener Code – nie fremde Systeme.
