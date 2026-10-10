---
title: Wer bist du – und was darfst du?
summary: Der Unterschied zwischen Authentifizierung und Autorisierung, die drei Arten von Faktoren und wann eine API mit 401 oder 403 antwortet.
duration: 15
sources:
  - title: OWASP Authentication Cheat Sheet
    url: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
  - title: OWASP Authorization Cheat Sheet
    url: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
  - title: MDN – HTTP-Statuscodes 401 und 403
    url: https://developer.mozilla.org/de/docs/Web/HTTP/Reference/Status/401
  - title: Laravel 13 – Authentication
    url: https://laravel.com/docs/13.x/authentication
quiz:
  - type: single
    question: Eine angemeldete Nutzerin ruft die Rechnung eines anderen Kunden auf. Welcher Statuscode passt?
    options:
      - 401 Unauthorized
      - 403 Forbidden (oder 404, um die Existenz zu verbergen)
      - 200 OK
      - 500 Internal Server Error
    answer: 1
    explanation: >
      Wer sie ist, steht fest – die Authentifizierung hat geklappt. Sie darf diese Rechnung aber nicht sehen,
      also scheitert die Autorisierung: 403. Viele APIs antworten hier bewusst mit 404, damit niemand erfährt,
      dass die Rechnung überhaupt existiert.
  - type: match
    question: Ordne jedem Beispiel den Faktor-Typ zu.
    pairs:
      - { left: "Passwort oder PIN", right: "Wissen" }
      - { left: "Smartphone mit Authenticator-App", right: "Besitz" }
      - { left: "Fingerabdruck", right: "Inhärenz (Merkmal)" }
    explanation: >
      Wissen kann man vergessen oder ausplaudern, Besitz kann gestohlen werden, Merkmale lassen sich schwer
      ändern. Echte Zwei-Faktor-Anmeldung kombiniert zwei **verschiedene** Typen.
  - type: multiple
    question: Welche Aussagen stimmen?
    options:
      - Authentifizierung kommt immer vor der Autorisierung.
      - Zwei Passwörter hintereinander sind Zwei-Faktor-Authentifizierung.
      - Ein API-Token beweist, wer (oder welches Programm) die Anfrage stellt.
      - "401 bedeutet: Du bist angemeldet, darfst aber nicht."
    answers: [0, 2]
    explanation: >
      Erst muss klar sein, wer anfragt, dann kann man Rechte prüfen. Zwei Passwörter sind zweimal derselbe
      Faktor-Typ (Wissen). 401 heißt trotz des Namens „Unauthorized“: Du bist **nicht** (gültig) angemeldet.
  - type: cloze
    text: Die Frage „Wer bist du?“ beantwortet die ___. Die Frage „Was darfst du?“ beantwortet die ___.
    blanks:
      - [Authentifizierung, Authentication, AuthN]
      - [Autorisierung, Authorization, AuthZ]
    explanation: Im Englischen kürzt man die beiden oft mit AuthN und AuthZ ab.
tasks:
  - id: authn-oder-authz
    type: dragdrop
    title: Authentifizierung oder Autorisierung?
    description: Ordne jede Prüfung der Frage zu, die sie beantwortet.
    targets:
      - { id: authn, label: "Authentifizierung – Wer bist du?" }
      - { id: authz, label: "Autorisierung – Was darfst du?" }
    items:
      - { label: Das Passwort zur E-Mail-Adresse wird geprüft, target: authn }
      - { label: Der Code aus der Authenticator-App wird geprüft, target: authn }
      - { label: Ein Bearer-Token wird in der Datenbank nachgeschlagen, target: authn }
      - { label: Nur Admins dürfen Nutzer löschen, target: authz }
      - { label: Du darfst nur deine eigenen Notizen bearbeiten, target: authz }
      - { label: "Das Token hat die Fähigkeit notizen:lesen, aber nicht notizen:schreiben", target: authz }
    hints:
      - Geht es darum, eine Identität zu beweisen, oder darum, ob eine bekannte Identität etwas tun darf?
  - id: statuscode-waehlen
    type: steps
    title: 401 oder 403?
    description: Spiel ein paar Anfragen an eine Notiz-API durch und entscheide, was der Server antwortet.
    steps:
      - situation: "Eine Anfrage `GET /api/notizen` kommt ohne `Authorization`-Header und ohne Cookie an."
        question: Was antwortet die API?
        options: [200 OK mit leerer Liste, 401 Unauthorized, 403 Forbidden]
        answer: 1
        explanation: Niemand hat sich ausgewiesen – die Authentifizierung fehlt. Das ist 401.
      - situation: "Dieselbe Anfrage kommt mit einem Token, das gestern widerrufen wurde."
        question: Was antwortet die API jetzt?
        options: [401 Unauthorized, 403 Forbidden, 200 OK]
        answer: 0
        explanation: Ein widerrufenes oder abgelaufenes Token beweist keine Identität mehr – wieder 401.
      - situation: "Ein gültiges Token von Ada fragt `DELETE /api/nutzer/7` an. Löschen dürfen nur Admins, Ada ist keine."
        question: Was antwortet die API?
        options: [401 Unauthorized, 403 Forbidden, 204 No Content]
        answer: 1
        explanation: Ada ist eindeutig erkannt, hat aber nicht das Recht – das ist 403.
---
Am Flughafen passiert zweimal etwas Unterschiedliches: Erst zeigst du deinen Ausweis – damit ist klar,
**wer** du bist. Dann zeigst du deine Bordkarte – damit ist klar, **wohin du darfst**. Genau diese
zwei Fragen stellt jede Webanwendung bei jeder Anfrage. Wer sie verwechselt, baut Sicherheitslücken.

## Zwei Fragen, zwei Begriffe

| Begriff | Frage | Beispiel |
|---|---|---|
| [[authentifizierung|Authentifizierung]] (AuthN) | Wer bist du? | E-Mail und Passwort prüfen |
| [[autorisierung|Autorisierung]] (AuthZ) | Was darfst du? | Darf Ada diese Rechnung sehen? |

Die Reihenfolge steht fest: Erst wenn klar ist, **wer** anfragt, lässt sich prüfen, was diese Person
darf. Eine Anfrage ohne Identität kann man höchstens als „Gast“ behandeln.

Eine dritte Vokabel taucht oft auf: die **Identität**. Das ist der Datensatz, für den sich jemand
ausweist – in Laravel meist ein `User` mit einer `id`. Nach der Authentifizierung kennt die Anwendung
diese ID und hängt sie an die Anfrage.

```php title="So sieht das in Laravel aus"
$user = $request->user();          // Authentifizierung: wer ist es? (oder null)

if ($user->cannot('delete', $note)) {  // Autorisierung: darf er das?
    abort(403);
}
```

> [!MERKSATZ]
> **Authentifizierung** beweist eine Identität. **Autorisierung** entscheidet, was diese Identität tun darf.

## Womit beweist man, wer man ist?

Einen Beweis für die Identität nennt man **[[authentifizierungsfaktor|Faktor]]**. Es gibt drei Arten:

| Faktor-Typ | Etwas, das du … | Beispiele |
|---|---|---|
| Wissen | weißt | Passwort, PIN, Sicherheitsfrage |
| Besitz | hast | Smartphone mit Authenticator-App, Sicherheitsschlüssel, [[passkey|Passkey]] |
| Inhärenz | bist | Fingerabdruck, Gesicht |

Ein Passwort allein ist der schwächste Fall: Es kann erraten, abgefischt oder in einem fremden
Datenleck mitveröffentlicht werden. Darum kombiniert die [[zwei-faktor-authentifizierung|Zwei-Faktor-Authentifizierung]]
zwei **verschiedene** Typen, etwa Passwort plus Code vom Smartphone.

> [!FEHLER]
> „Wir haben 2FA: erst Passwort, dann Sicherheitsfrage.“ – Beides ist Wissen. Wer das Passwort per
> Phishing erbeutet, fragt die Sicherheitsfrage einfach gleich mit ab.

## Wie bleibt man angemeldet?

HTTP ist zustandslos: Jede Anfrage steht für sich, der Server erinnert sich nicht von selbst an dich.
Damit du nicht bei jedem Klick dein Passwort tippen musst, bekommt der Client nach dem Login einen
**Nachweis**, den er bei allen weiteren Anfragen mitschickt:

| Verfahren | Was der Client mitschickt | Typisch für |
|---|---|---|
| [[session|Session]] | ein [[cookie|Cookie]] mit einer zufälligen Session-ID | klassische Web-Apps, eigene SPA |
| Token | `Authorization: Bearer …` im Header | mobile Apps, CLI, andere Server |

Beide Verfahren schauen wir uns in diesem Kurs genau an. Wichtig ist schon jetzt: Dieser Nachweis ist
so wertvoll wie das Passwort selbst. Wer ihn stiehlt, ist für den Server du.

## 401 oder 403?

HTTP hat für beide Fragen eigene [[statuscode|Statuscodes]] – leider mit verwirrenden Namen:

| Code | Name | Bedeutung |
|---|---|---|
| `401` | Unauthorized | Du bist **nicht** (gültig) authentifiziert. Melde dich an. |
| `403` | Forbidden | Wir wissen, wer du bist – aber das darfst du nicht. |

Trotz des Namens „Unauthorized“ geht es bei 401 um die **Authentifizierung**. Laravel hält sich daran:
Die Middleware `auth:sanctum` antwortet ohne gültigen Nachweis mit 401, `abort(403)` oder eine Policy
mit 403.

> [!PRAXIS]
> Bei fremden Datensätzen antworten viele APIs bewusst mit `404 Not Found` statt 403. So erfährt
> niemand, dass zum Beispiel die Rechnung Nummer 1042 überhaupt existiert.

## Zusammenfassung

- Authentifizierung beantwortet „Wer bist du?“, Autorisierung „Was darfst du?“ – in dieser Reihenfolge.
- Faktoren sind Wissen, Besitz und Inhärenz. 2FA kombiniert zwei **verschiedene** Typen.
- Nach dem Login trägt der Client einen Nachweis mit: Session-Cookie oder Token.
- Ein gestohlener Nachweis ist so gefährlich wie ein gestohlenes Passwort.
- `401` = nicht angemeldet, `403` = angemeldet, aber nicht berechtigt.
