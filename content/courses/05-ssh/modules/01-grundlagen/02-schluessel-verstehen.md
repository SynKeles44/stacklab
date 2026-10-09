---
title: Schlüsselpaare verstehen
summary: Die Idee hinter öffentlichen und privaten Schlüsseln – und warum dein privater Schlüssel deinen Rechner nie verlässt.
duration: 25
sources:
  - title: RFC 4252 – SSH Authentication Protocol (Public Key Method)
    url: https://www.rfc-editor.org/rfc/rfc4252#section-7
  - title: RFC 4253 – SSH Transport Layer Protocol (Schlüsselaustausch)
    url: https://www.rfc-editor.org/rfc/rfc4253
  - title: ssh(1) – Abschnitt AUTHENTICATION
    url: https://man.openbsd.org/ssh#AUTHENTICATION
quiz:
  - type: single
    question: Welcher Teil deines Schlüsselpaars kommt auf den Server?
    options:
      - Der private Schlüssel
      - Der öffentliche Schlüssel
      - Beide, damit der Server vergleichen kann
      - Keiner – der Server erzeugt sich selbst einen
    answer: 1
    explanation: >
      Auf den Server kommt nur der öffentliche Schlüssel (in die Datei authorized_keys). Der private
      Schlüssel bleibt auf deinem Rechner. Der Server prüft damit nur deine Signaturen.
  - type: multiple
    question: Welche Aussagen über die Schlüssel-Anmeldung stimmen?
    options:
      - Der private Schlüssel wird bei jeder Anmeldung verschlüsselt zum Server geschickt.
      - Der Client beweist mit einer Signatur, dass er den privaten Schlüssel besitzt.
      - Aus dem öffentlichen Schlüssel lässt sich der private praktisch nicht berechnen.
      - Ein gestohlener öffentlicher Schlüssel erlaubt einem Angreifer die Anmeldung.
    answers: [1, 2]
    explanation: >
      Der private Schlüssel verlässt nie den Rechner – über das Netz geht nur eine Signatur. Der
      öffentliche Schlüssel ist ungefährlich: Mit ihm kann man nur Signaturen prüfen, nicht erzeugen.
  - type: match
    question: Ordne jedem Verfahren die passende Beschreibung zu.
    pairs:
      - { left: "Symmetrische Verschlüsselung", right: "Ein gemeinsamer Schlüssel zum Ver- und Entschlüsseln" }
      - { left: "Asymmetrische Kryptografie", right: "Schlüsselpaar aus privatem und öffentlichem Teil" }
      - { left: "Signatur", right: "Beweis, dass jemand den privaten Schlüssel besitzt" }
      - { left: "Schlüsselaustausch", right: "Beide Seiten einigen sich auf ein Sitzungsgeheimnis" }
    explanation: SSH kombiniert alle vier – asymmetrische Verfahren für Identität und Schlüsselaustausch, symmetrische für den schnellen Datenverkehr.
  - type: cloze
    text: Der ___ Schlüssel darf weitergegeben werden, der ___ Schlüssel bleibt geheim auf deinem Rechner.
    blanks:
      - [öffentliche, oeffentliche, public]
      - [private, privat]
    explanation: Öffentlich (public) = darf jeder sehen, etwa der Server. Privat (private) = nur du, niemals weitergeben.
tasks:
  - id: login-beschriften
    type: diagram
    title: Beschrifte die Schlüssel-Anmeldung
    description: Ordne jedem leeren Kasten den richtigen Begriff zu. Überlege, was auf deinem Laptop bleibt, was auf dem Server liegt und was über das Netz geht.
    image: /assets/ssh/schluessel-login-leer.svg
    slots:
      - { x: 18, y: 37, answer: Privater Schlüssel }
      - { x: 82, y: 35, answer: authorized_keys }
      - { x: 82, y: 48, answer: Öffentlicher Schlüssel }
      - { x: 50, y: 78, answer: Signatur }
    distractors: [Passwort, known_hosts]
    hints:
      - Über das Netz geht nur der Beweis, nie der geheime Teil.
      - Die Datei auf dem Server, die erlaubte Schlüssel auflistet, heißt authorized_keys.
  - id: login-ablauf
    type: steps
    title: Was passiert als Nächstes?
    description: Spiel eine Schlüssel-Anmeldung Schritt für Schritt durch.
    steps:
      - situation: >
          Du tippst `ssh ada@203.0.113.10`. Client und Server haben sich gerade auf eine
          Verschlüsselung geeinigt. Jetzt geht es um deine Identität.
        question: Was schickt dein Client als Erstes?
        options:
          - Deinen privaten Schlüssel
          - Die Information, mit welchem öffentlichen Schlüssel du dich anmelden möchtest
          - Dein Passwort
        answer: 1
        explanation: Der Client fragt quasi an, ob der Server diesen öffentlichen Schlüssel für ada akzeptiert.
      - situation: Der Server findet genau diesen öffentlichen Schlüssel in `/home/ada/.ssh/authorized_keys`.
        question: Was verlangt der Server jetzt?
        options:
          - Einen Beweis in Form einer Signatur über Daten dieser Sitzung
          - Gar nichts, er lässt dich sofort rein
          - Dass du den privaten Schlüssel hochlädst
        answer: 0
        explanation: Den öffentlichen Schlüssel kennt jeder. Rein kommt nur, wer eine passende Signatur liefern kann.
      - situation: Dein Client erstellt mit dem privaten Schlüssel eine Signatur und schickt sie.
        question: Womit prüft der Server die Signatur?
        options:
          - Mit dem öffentlichen Schlüssel aus authorized_keys
          - Mit einer Kopie deines privaten Schlüssels
          - Mit deinem Passwort
        answer: 0
        explanation: Eine Signatur, die zum öffentlichen Schlüssel passt, kann nur mit dem dazugehörigen privaten Schlüssel erstellt worden sein. Du bist drin.
      - situation: Ein Angreifer hat die komplette Kommunikation dieser Anmeldung mitgeschnitten.
        question: Kann er sich damit morgen als ada anmelden?
        options:
          - Ja, er schickt die Signatur einfach noch einmal.
          - Nein, die Signatur gilt nur für Daten genau dieser Sitzung.
        answer: 1
        explanation: Die signierten Daten enthalten eine Kennung der Sitzung, die bei jeder Verbindung neu entsteht. Eine alte Signatur ist wertlos.
---

Passwörter haben ein Grundproblem: Um sie zu prüfen, musst du sie dem Server **verraten**. Selbst
über einen verschlüsselten Kanal heißt das: Ist der Server kompromittiert oder ist es gar nicht der
echte Server, hat jemand dein Passwort. SSH bietet eine elegantere Lösung – du beweist, dass du ein
Geheimnis kennst, **ohne es jemals herauszugeben**. Dafür brauchst du ein Schlüsselpaar.

## Zwei Arten von Verschlüsselung

Bei der [[symmetrische-verschluesselung|symmetrischen Verschlüsselung]] gibt es **einen**
Schlüssel. Mit ihm schließt du ab und wieder auf – wie bei einem normalen Fahrradschloss mit
Zahlencode. Das ist sehr schnell, hat aber einen Haken: Beide Seiten müssen denselben Schlüssel
kennen. Wie bekommst du ihn sicher zum Server, ohne dass jemand mithört?

Die [[asymmetrische-kryptografie|asymmetrische Kryptografie]] löst das mit einem
[[schluesselpaar|Schlüsselpaar]]. Die beiden Teile gehören mathematisch zusammen, sind aber
verschieden:

| Teil | Wer hat ihn? | Was kann man damit? |
|---|---|---|
| [[privater-schluessel|Privater Schlüssel]] | nur du, auf deinem Rechner | **Signaturen erstellen** (und entschlüsseln) |
| [[oeffentlicher-schluessel|Öffentlicher Schlüssel]] | jeder, der ihn braucht | **Signaturen prüfen** (und verschlüsseln) |

Eine Alltags-Analogie: Der öffentliche Schlüssel ist wie dein **Unterschriftenmuster**, das bei der
Bank hinterlegt ist. Jeder Bankangestellte kann damit prüfen, ob eine Unterschrift von dir stammt.
Aber niemand kann aus dem Muster lernen, deine Unterschrift so zu leisten, dass die Prüfung sie
akzeptiert. Nur du kannst unterschreiben – das ist dein privater Schlüssel.

Mathematisch beruht das auf Rechenaufgaben, die in eine Richtung leicht und in die andere praktisch
unmöglich sind. Aus dem privaten Schlüssel lässt sich der öffentliche in Millisekunden berechnen.
Umgekehrt bräuchten selbst alle Computer der Welt zusammen unvorstellbar lange.

> [!MERKSATZ]
> Der öffentliche Schlüssel darf überall liegen – auf Servern, bei GitHub, in einer E-Mail. Der
> private Schlüssel gehört nur auf deinen Rechner. Wer ihn hat, **ist** für jeden Server du.

## Die Signatur: Beweis ohne Verrat

Eine [[signatur|Signatur]] ist eine kleine Datenmenge, die dein privater Schlüssel über eine
Nachricht berechnet. Jeder, der den öffentlichen Schlüssel kennt, kann prüfen: „Diese Signatur passt
zu genau dieser Nachricht und wurde mit dem passenden privaten Schlüssel erstellt.“ Ändert sich auch
nur ein Zeichen der Nachricht, passt die Signatur nicht mehr.

Genau so meldest du dich bei SSH an:

![Ablauf der Anmeldung mit einem Schlüsselpaar](/assets/ssh/schluessel-login.svg)

1. Dein Client sagt: „Ich bin `ada` und möchte mich mit diesem öffentlichen Schlüssel anmelden.“
2. Der Server schaut in die Datei [[authorized-keys|`authorized_keys`]] im Home-Verzeichnis von
   `ada`. Steht der Schlüssel dort, fordert er einen Beweis.
3. Dein Client signiert Daten, die nur in **dieser** Sitzung gelten, mit dem privaten Schlüssel.
4. Der Server prüft die Signatur mit dem öffentlichen Schlüssel. Passt sie, bist du drin.

Über das Netz ging dabei nie dein privater Schlüssel – nur der öffentliche Schlüssel und eine
Signatur. Selbst ein gefälschter Server, der dich hereinlegt, lernt nichts, womit er sich später
als du ausgeben könnte. Weil die signierten Daten an die aktuelle Sitzung gebunden sind, nützt ein
Mitschnitt auch nichts: Eine alte Signatur passt zu keiner neuen Verbindung.

> [!FEHLER]
> **Den privaten Schlüssel auf den Server kopieren.** Manche denken, der Server brauche „den
> Schlüssel“ und kopieren `id_ed25519` (ohne `.pub`) hoch. Damit liegt dein Geheimnis auf einem
> fremden Rechner. Auf den Server gehört **immer nur die `.pub`-Datei**. Im Zweifel: Der private
> Schlüssel beginnt mit `-----BEGIN OPENSSH PRIVATE KEY-----` – so eine Datei verschickst du nie.

## Wie die Verbindung selbst verschlüsselt wird

Schlüsselpaare sind toll für Identität, aber für große Datenmengen zu langsam. Deshalb kombiniert
SSH beide Welten:

1. Ganz am Anfang führen Client und Server einen **Schlüsselaustausch** durch (zum Beispiel nach
   dem Diffie-Hellman-Prinzip). Das Verblüffende: Beide berechnen dabei denselben geheimen
   Sitzungsschlüssel, obwohl dieser nie über das Netz geschickt wird. Ein Lauscher sieht nur
   Zwischenwerte, aus denen er das Geheimnis nicht berechnen kann.
2. Mit diesem Sitzungsschlüssel wird der gesamte weitere Verkehr **symmetrisch** verschlüsselt –
   schnell und sicher.
3. Nach dem Ende der Verbindung wird der Sitzungsschlüssel verworfen. Selbst wer später an deinen
   privaten Schlüssel kommt, kann alte Mitschnitte nicht entschlüsseln.

Moderne OpenSSH-Versionen nutzen für diesen Austausch inzwischen standardmäßig Verfahren, die auch
gegen künftige Quantencomputer schützen sollen. Du musst dafür nichts einstellen – das handeln
Client und Server automatisch aus.

## Passwort oder Schlüssel?

Ein SSH-Server kann beides erlauben. Der Vergleich zeigt, warum Profis Schlüssel nutzen:

| | Passwort | Schlüsselpaar |
|---|---|---|
| Was geht an den Server? | das Passwort selbst (verschlüsselt) | nur eine Signatur |
| Erraten möglich? | ja, schwache Passwörter fallen schnell | praktisch nein |
| Automatisierbar (Skripte, CI) | nur mit gespeichertem Passwort | ja, sauber |
| Für viele Server | ein Passwort pro Server oder (schlecht) überall dasselbe | ein Schlüssel, auf jedem Server der öffentliche Teil |
| Zugriff entziehen | Passwort ändern, allen mitteilen | eine Zeile aus `authorized_keys` löschen |

> [!PRAXIS]
> In Teams bekommt jede Person ihren eigenen Schlüssel. Verlässt jemand das Team, entfernt man genau
> eine Zeile in `authorized_keys` – alle anderen arbeiten ungestört weiter. Bei einem geteilten
> Passwort müssten alle umlernen.

> [!HINWEIS]
> Bei SSH gibt es **zwei** Arten von Schlüsselpaaren: **Dein Benutzer-Schlüssel** beweist dem Server,
> wer du bist (öffentlicher Teil in `authorized_keys`). **Der Host-Key des Servers** beweist dir, wer
> der Server ist (öffentlicher Teil in deiner `known_hosts`). Beide folgen demselben Prinzip – mehr
> dazu in der nächsten Lektion.

## Zusammenfassung

- Symmetrische Verschlüsselung nutzt einen gemeinsamen Schlüssel – schnell, aber der Schlüssel muss erst sicher ausgetauscht werden.
- Asymmetrische Kryptografie nutzt ein Schlüsselpaar: Der private Schlüssel signiert, der öffentliche prüft.
- Bei der Anmeldung schickt dein Client nur eine Signatur über sitzungsgebundene Daten – der private Schlüssel verlässt nie deinen Rechner.
- Auf den Server kommt nur der öffentliche Schlüssel, eingetragen in `authorized_keys`.
- Der Datenverkehr selbst wird nach einem Schlüsselaustausch symmetrisch verschlüsselt.
- Benutzer-Schlüssel beweisen deine Identität, Host-Keys die des Servers.
