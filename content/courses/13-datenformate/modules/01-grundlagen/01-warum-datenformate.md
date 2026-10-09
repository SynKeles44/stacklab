---
title: Warum es Datenformate gibt
summary: Programme müssen Daten speichern und austauschen – dafür verwandeln sie Objekte in Text oder Bytes und wieder zurück.
duration: 15
sources:
  - title: MDN – JSON (Glossar)
    url: https://developer.mozilla.org/en-US/docs/Glossary/JSON
  - title: MDN – Serialization (Glossar)
    url: https://developer.mozilla.org/en-US/docs/Glossary/Serialization
  - title: RFC 8259 – The JavaScript Object Notation (JSON) Data Interchange Format
    url: https://www.rfc-editor.org/rfc/rfc8259
quiz:
  - type: single
    question: Ein Laravel-Backend schickt eine Liste von Produkten an ein React-Frontend. Was passiert dabei im Kern?
    options:
      - Das PHP-Array wird direkt aus dem Arbeitsspeicher des Servers in den Browser kopiert.
      - Das Backend serialisiert die Daten zu Text (z. B. JSON), das Frontend deserialisiert diesen Text wieder zu Objekten.
      - Der Browser führt den PHP-Code selbst aus.
    answer: 1
    explanation: Arbeitsspeicher lässt sich nicht zwischen Rechnern oder Sprachen teilen. Die Daten reisen als Text über das Netzwerk und werden auf der anderen Seite neu aufgebaut.
  - type: multiple
    question: Welche Aussagen über Textformate wie JSON, YAML oder CSV stimmen?
    options:
      - Du kannst sie mit jedem Editor öffnen und lesen.
      - Sie sind immer kleiner als Binärformate.
      - Sie lassen sich gut mit Git vergleichen (diff).
      - Ein Programm braucht einen Parser, um sie in Datenstrukturen umzuwandeln.
    answers: [0, 2, 3]
    explanation: Textformate sind lesbar und diff-freundlich, brauchen aber einen Parser. Kleiner als Binärformate sind sie meist nicht – Zahlen und Schlüsselnamen kosten als Text mehr Platz.
  - type: cloze
    text: Ein Objekt in Text umwandeln heißt ___. Den Text wieder in ein Objekt verwandeln heißt ___.
    blanks:
      - [Serialisierung, serialisieren, Serialisieren]
      - [Deserialisierung, deserialisieren, Deserialisieren, parsen, Parsen]
    explanation: Serialisieren macht aus einer Struktur im Speicher eine Folge von Zeichen oder Bytes. Deserialisieren (auch Parsen) baut daraus wieder eine Struktur.
  - type: match
    question: Ordne jedem Format seinen typischen Einsatz zu.
    pairs:
      - { left: "JSON", right: "Antworten von Web-APIs" }
      - { left: "YAML", right: "Konfiguration von CI-Pipelines und Containern" }
      - { left: "CSV", right: "Tabellen-Export aus einer Tabellenkalkulation" }
      - { left: "PNG", right: "Bild als Binärdatei" }
    explanation: Jedes Format hat seine Stärke. Im Lauf des Kurses lernst du, warum genau diese Zuordnung sinnvoll ist.
tasks:
  - id: text-oder-binaer
    type: dragdrop
    title: Text- oder Binärformat?
    description: "Ziehe jede Datei in die richtige Gruppe. Frage dich jeweils: Kann ich sie sinnvoll im Texteditor lesen?"
    targets:
      - { id: text, label: Textformat (menschenlesbar) }
      - { id: binaer, label: Binärformat }
    items:
      - { label: "package.json", target: text }
      - { label: "compose.yaml", target: text }
      - { label: "kunden.csv", target: text }
      - { label: ".env", target: text }
      - { label: "logo.png", target: binaer }
      - { label: "datenbank.sqlite", target: binaer }
      - { label: "video.mp4", target: binaer }
    hints:
      - Öffnest du eine Binärdatei im Editor, siehst du nur Zeichensalat.
  - id: daten-reise
    type: steps
    title: Die Reise eines Datensatzes
    description: Ein PHP-Backend liefert ein Nutzerprofil an eine JavaScript-App. Was passiert als Nächstes?
    steps:
      - situation: Im PHP-Code liegt das Profil als Array `['name' => 'Ada', 'skills' => ['php', 'sql']]` im Arbeitsspeicher.
        question: Was muss passieren, bevor die Daten in die HTTP-Antwort können?
        options:
          - Das Array wird zu einem JSON-String serialisiert.
          - Der Arbeitsspeicher wird komplett an den Browser geschickt.
          - Das Array wird als PHP-Code verschickt.
        answer: 0
        explanation: "Eine HTTP-Antwort transportiert nur Bytes. `json_encode()` macht aus dem Array den Text `{\"name\":\"Ada\",\"skills\":[\"php\",\"sql\"]}`."
      - situation: Der JSON-Text kommt im Browser an. Für JavaScript ist das zunächst nur ein String.
        question: Wie kommt die App an `profil.skills[0]`?
        options:
          - Sie liest Zeichen für Zeichen mit `indexOf`.
          - Sie deserialisiert den Text mit `JSON.parse()` zu einem Objekt.
          - Gar nicht – JavaScript kann keine PHP-Daten lesen.
        answer: 1
        explanation: "`JSON.parse()` ist der Parser: Er prüft die Syntax und baut ein neues JavaScript-Objekt. Danach liefert `profil.skills[0]` den String `php`."
      - situation: "Statt `{\"name\": \"Ada\"}` kommt wegen eines Fehlers `{'name': 'Ada'}` an."
        question: Was passiert beim Parsen?
        options:
          - JSON.parse ignoriert die einfachen Anführungszeichen.
          - JSON.parse wirft einen SyntaxError, weil JSON doppelte Anführungszeichen verlangt.
          - Die App bekommt ein leeres Objekt.
        answer: 1
        explanation: Ein Parser ist streng. Schon ein falsches Zeichen macht die ganze Datei ungültig – deshalb lernst du in diesem Kurs die Regeln genau.
---
Ein Programm hält seine Daten im [[arbeitsspeicher|Arbeitsspeicher]]: Objekte, Listen, Zahlen. Sobald du den
Rechner ausschaltest oder die Daten an ein anderes Programm schicken willst, stehst du vor einem Problem:
Arbeitsspeicher kann man weder speichern noch verschicken. Die Lösung heißt **Datenformat**.

![Ein Objekt wird serialisiert, als Text übertragen und auf der anderen Seite deserialisiert](/assets/datenformate/serialisierung.svg)

## Das Problem: Daten müssen reisen

Stell dir einen Umzug vor. Deine Möbel stehen fertig aufgebaut in der Wohnung. Für den Transport baust du
sie auseinander, packst die Teile in Kartons und beschriftest sie. In der neuen Wohnung baut jemand sie nach
der Beschriftung wieder auf.

Genau so reisen Daten. Ein Objekt im Speicher ist das aufgebaute Möbelstück. Für den Transport zerlegst du es
in eine **Folge von Zeichen oder Bytes** – das ist [[serialisierung|Serialisierung]]. Das Zielprogramm baut
daraus wieder ein Objekt – das ist [[deserialisierung|Deserialisierung]].

Daten müssen ständig reisen:

- in eine [[datei|Datei]], damit sie einen Neustart überleben,
- über das Netzwerk, etwa als Antwort einer [[api|API]],
- in eine [[datenbank|Datenbank]] oder einen Cache,
- von einem Werkzeug zum nächsten, zum Beispiel per [[pipe|Pipe]] im Terminal.

> [!MERKSATZ]
> Serialisieren heißt: Struktur → Text oder Bytes. Deserialisieren heißt: Text oder Bytes → Struktur.

## Was ein Datenformat festlegt

Damit der Empfänger die Kartons richtig auspackt, braucht es feste Regeln. Ein
[[datenformat|Datenformat]] legt genau diese Regeln fest:

| Frage | Beispiel in JSON |
|---|---|
| Wie sieht eine Liste aus? | `["php", "sql"]` |
| Wie schreibe ich Schlüssel und Wert? | `"name": "Ada"` |
| Welche Datentypen gibt es? | Text, Zahl, `true`/`false`, `null` |
| Wie werden Texte begrenzt? | doppelte Anführungszeichen |
| Welche Zeichenkodierung gilt? | [[zeichenkodierung\|UTF-8]] |

Das Programm, das einen Text nach diesen Regeln liest, heißt [[parser|Parser]]. Ein Parser ist pedantisch:
Hält sich die Datei nicht exakt an die Regeln, bricht er mit einer Fehlermeldung ab.

Der große Vorteil: Sender und Empfänger müssen sich nur auf das Format einigen. Ein PHP-Backend, eine
React-App und ein Python-Skript können dieselbe [[json|JSON]]-Datei lesen, obwohl sie sonst nichts gemeinsam
haben.

## Textformate und Binärformate

Es gibt zwei große Familien. Ein [[textformat|Textformat]] besteht aus lesbaren Zeichen. Ein
[[binaerformat|Binärformat]] speichert rohe Bytes, die nur ein Programm versteht.

| | Textformat | Binärformat |
|---|---|---|
| Beispiele | JSON, YAML, CSV, XML, TOML | PNG, MP4, SQLite, Protocol Buffers |
| Für Menschen lesbar | ja, mit jedem Editor | nein |
| Mit Git vergleichbar | ja, Zeile für Zeile | kaum |
| Größe | eher groß | kompakt |
| Verarbeitung | etwas langsamer | sehr schnell |

Im Alltag als Entwickler:in begegnen dir vor allem Textformate. Sie sind langsamer und größer, aber das ist
meist egal: Du kannst sie lesen, von Hand korrigieren, in Code-Reviews besprechen und mit `git diff`
vergleichen.

> [!FEHLER]
> **„Die Datei sieht doch richtig aus.“** Für Menschen sind `'Ada'` und `"Ada"` gleich, für einen
> JSON-Parser nicht. Verlass dich nie auf dein Auge – lass einen Parser prüfen, zum Beispiel mit `jq .`.

## Die wichtigsten Formate im Überblick

In diesem Kurs lernst du diese Formate kennen:

- **[[json|JSON]]** – das Austauschformat des Webs. Fast jede API spricht JSON, ebenso `package.json` und
  `composer.json`.
- **[[yaml|YAML]]** – für Konfiguration, die Menschen schreiben: Docker Compose, GitHub Actions, Kubernetes.
- **[[csv|CSV]]** – Tabellen als Text, der kleinste gemeinsame Nenner mit Tabellenkalkulationen.
- **[[xml|XML]]**, **[[toml|TOML]]**, **[[env-datei|.env]]** und **[[ini-datei|INI]]** – ältere oder
  spezialisierte Formate, die dir trotzdem täglich begegnen.

```json title="package.json (Ausschnitt)"
{
  "name": "mein-shop",
  "scripts": { "dev": "vite" }
}
```

```yaml title="compose.yaml (Ausschnitt)"
services:
  web:
    image: nginx:1.29
```

> [!PRAXIS]
> In einem typischen Webprojekt liegen JSON, YAML, `.env` und oft auch XML nebeneinander im selben
> Repository. Wer alle Formate sicher liest, findet Konfigurationsfehler in Sekunden.

## Zusammenfassung

- Daten im Arbeitsspeicher können nicht direkt gespeichert oder verschickt werden.
- **Serialisierung** verwandelt eine Struktur in Text oder Bytes, **Deserialisierung** baut sie wieder auf.
- Ein **Datenformat** legt die Regeln fest, ein **Parser** setzt sie streng durch.
- **Textformate** sind lesbar und Git-freundlich, **Binärformate** kompakt und schnell.
- JSON, YAML und CSV sind die Textformate, die dir am häufigsten begegnen.
