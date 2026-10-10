---
title: Wann MVC nicht mehr reicht
summary: Woran du erkennst, dass eine Laravel-App aus dem einfachen MVC-Schema herauswächst, und welche Schichten große Apps zusätzlich einziehen.
duration: 20
sources:
  - title: Laravel-Dokumentation – Controllers
    url: https://laravel.com/docs/13.x/controllers
  - title: Laravel-Dokumentation – Request Lifecycle
    url: https://laravel.com/docs/13.x/lifecycle
  - title: Laravel-Dokumentation – Directory Structure
    url: https://laravel.com/docs/13.x/structure
quiz:
  - type: multiple
    question: Welche Beobachtungen sind typische Symptome dafür, dass eine App über das einfache MVC-Schema hinausgewachsen ist?
    options:
      - Dieselbe Preisberechnung steht in einem Controller, einem Artisan-Befehl und einem Job.
      - Ein Controller hat 600 Zeilen und mischt Validierung, Berechnung, Datenbank und E-Mails.
      - Die App hat eine Route mit zwei Controllern.
      - Um eine Geschäftsregel zu testen, musst du einen kompletten HTTP-Request simulieren.
    answers: [0, 1, 3]
    explanation: >
      Kopierte Geschäftslogik, riesige Controller und Regeln, die nur über HTTP testbar sind, sind die
      klassischen Warnsignale. Wie viele Routen oder Controller es gibt, sagt allein nichts aus.
  - type: single
    question: Wozu dient die zusätzliche Schicht aus Actions oder Services zwischen Controller und Model?
    options:
      - Sie macht Abfragen schneller.
      - Sie bündelt einen Anwendungsfall an einer Stelle, die von HTTP, Konsole und Queue aus nutzbar ist.
      - Sie ersetzt Eloquent.
      - Sie ist nötig, damit Laravel Routen findet.
    answer: 1
    explanation: >
      Der Controller übersetzt nur noch HTTP. Der eigentliche Anwendungsfall („Rechnung anlegen“) lebt
      in einer eigenen Klasse, die jeder Eingang aufrufen kann – Controller, Artisan-Befehl oder Job.
  - type: match
    question: Ordne jeder Schicht ihre Aufgabe zu.
    pairs:
      - { left: "Controller", right: "HTTP übersetzen: Request rein, Response raus" }
      - { left: "Form Request", right: "Eingabe prüfen und berechtigen" }
      - { left: "Action / Service", right: "Einen Anwendungsfall ausführen" }
      - { left: "Model", right: "Daten laden und speichern" }
    explanation: Jede Schicht hat genau eine Aufgabe. So weißt du sofort, wo du suchen musst, wenn sich etwas ändern soll.
  - type: cloze
    text: Eine Anwendung, in der alle Logik in Controllern steckt, nennt man umgangssprachlich „___ Controller“. Das Gegenmittel sind ___ Controller.
    blanks:
      - [fette, fat, dicke]
      - [schlanke, thin, dünne]
    explanation: Fette Controller machen alles selbst, schlanke Controller delegieren und bleiben wenige Zeilen lang.
tasks:
  - id: wohin-gehoert-das
    type: dragdrop
    title: Wohin gehört dieser Code?
    description: >
      In einem dicken Controller stehen alle diese Zeilen durcheinander. Ordne jede Zeile der Schicht zu,
      in die sie in einer gut geschnittenen Laravel-App gehört.
    targets:
      - { id: controller, label: Controller }
      - { id: request, label: Form Request }
      - { id: action, label: Action }
      - { id: model, label: Model }
    items:
      - { label: "return response()->json($invoice, 201);", target: controller }
      - { label: "'net_cents' => ['required', 'integer', 'min:0']", target: request }
      - { label: "$gross = $net->add($net->percent($rate));", target: action }
      - { label: "DB::transaction(fn () => ...)", target: action }
      - { label: "#[Fillable(['customer', 'net_cents'])]", target: model }
      - { label: "return $this->user()->can('create', Invoice::class);", target: request }
    hints:
      - Der Controller kennt nur HTTP. Alles, was „Regel“ oder „Ablauf“ ist, gehört woandershin.
  - id: wachstum
    type: steps
    title: Eine App wächst
    description: Spiel durch, wie eine Laravel-App über zwei Jahre wächst – und was an welcher Stelle wehtut.
    steps:
      - situation: >
          Monat 1: Eine kleine App legt Rechnungen an. Der `InvoiceController` validiert, rechnet die
          Steuer aus und speichert – 40 Zeilen, alles übersichtlich.
        question: Brauchst du jetzt schon Actions, DTOs und Module?
        options:
          - Ja, sonst ist es später zu spät.
          - Nein. 40 Zeilen in einem Controller sind gut lesbar, Laravels Standard reicht.
        answer: 1
        explanation: Architektur löst Probleme, die du hast. Für eine kleine App sind die Laravel-Standards genau richtig.
      - situation: >
          Monat 8: Rechnungen sollen auch per CSV-Import (Artisan-Befehl) und nachts per Job angelegt
          werden. Ein Kollege kopiert die Steuerberechnung in beide Klassen.
        question: Was ist das eigentliche Problem?
        options:
          - Die Geschäftsregel existiert jetzt dreimal und wird irgendwann unterschiedlich geändert.
          - Artisan-Befehle sind langsamer als Controller.
        answer: 0
        explanation: >
          Sobald derselbe Anwendungsfall mehrere Eingänge hat, gehört er in eine eigene Klasse. Genau hier
          lohnt sich eine Action.
      - situation: >
          Jahr 2: Vier Teams arbeiten an derselben Codebasis. Das Team „Reporting“ liest direkt die
          Tabelle `invoices` aus und bricht, als das Team „Rechnungen“ eine Spalte umbenennt.
        question: Welche Maßnahme hilft am meisten?
        options:
          - Fachliche Module mit klaren Grenzen und einer öffentlichen Schnittstelle.
          - Mehr Kommentare im Code.
        answer: 0
        explanation: Module mit Grenzen sorgen dafür, dass Teams sich über Verträge austauschen statt über interne Details.
---
Deine Laravel-App hat klein angefangen: Route, [[controller|Controller]], [[model|Model]], View – fertig.
Zwei Jahre später hat der `InvoiceController` 600 Zeilen, dieselbe Steuerberechnung steht in drei
Dateien, und niemand traut sich mehr, etwas zu ändern. Das ist kein Versagen, sondern Wachstum. In
dieser Lektion lernst du, die Warnsignale zu erkennen und welche Schichten große Apps einziehen.

## MVC in kleinen Apps

Laravel liefert dir [[mvc|MVC]]: Das Model spricht mit der [[datenbank|Datenbank]], die View erzeugt
HTML, der Controller verbindet beides. Für kleine Apps ist das ideal – wenig Dateien, alles an seinem
erwarteten Ort.

```php title="Ein kleiner Controller – völlig in Ordnung"
public function store(Request $request): RedirectResponse
{
    $data = $request->validate(['title' => ['required', 'max:120']]);
    Note::create($data);

    return redirect()->route('notes.index');
}
```

Das Problem: MVC sagt dir, wo **HTTP**, **Darstellung** und **Daten** hingehören. Es sagt dir nicht,
wohin die eigentliche [[geschaeftslogik|Geschäftslogik]] gehört – also die Regeln, die dein Produkt
ausmachen: Wie wird der Preis berechnet? Wann darf eine Rechnung storniert werden? Diese Regeln landen
deshalb oft dort, wo man gerade tippt – im Controller.

> [!MERKSATZ]
> MVC trennt Ein- und Ausgabe von Daten. Für die Geschäftsregeln dazwischen hat es keinen festen Platz.

## Warnsignale: Die App ist herausgewachsen

Diese Symptome zeigen, dass das einfache Schema nicht mehr trägt:

| Symptom | Was dahintersteckt |
|---|---|
| Controller mit hunderten Zeilen | Validierung, Berechnung, Datenbank und E-Mails in einer Methode |
| Kopierte Logik | Derselbe Ablauf in Controller, Artisan-Befehl und Job |
| Tests nur über HTTP möglich | Die Regel ist an den Request gekettet |
| „Fass das nicht an“-Dateien | Niemand überblickt die [[seiteneffekt|Seiteneffekte]] |
| Teams stören sich gegenseitig | Jeder greift auf jede Tabelle und Klasse zu |

Einen Controller voller Logik nennt man umgangssprachlich [[fat-controller|Fat Controller]]. Er ist
schwer zu lesen, schwer zu testen und erzwingt Kopien, sobald ein zweiter Eingang denselben Ablauf
braucht.

> [!FEHLER]
> „Wir bauen das gleich richtig groß auf.“ – Wer am ersten Tag Module, Repositories und Events für eine
> CRUD-App einführt, bezahlt die Komplexität, ohne ihren Nutzen zu bekommen. Architektur reagiert auf
> echte Schmerzen.

## Die zusätzlichen Schichten

Große Laravel-Apps ergänzen MVC um ein paar Bausteine. Keiner davon ist Magie – es sind normale
PHP-[[klasse|Klassen]] mit einer klaren Aufgabe:

![Schichten einer gewachsenen Laravel-App](/assets/laravel-architektur/schichten.svg)

| Baustein | Aufgabe | Lektion |
|---|---|---|
| [[form-request\|Form Request]] | Eingabe prüfen und berechtigen | aus dem Laravel-Kurs |
| [[action-klasse\|Action]] / [[service-klasse\|Service]] | Einen Anwendungsfall ausführen | 1.2 |
| [[dto\|DTO]] | Daten typisiert zwischen Schichten transportieren | 1.3 |
| [[value-object\|Value Object]] | Einen fachlichen Wert mit Regeln abbilden | 1.3 |
| [[domain-event\|Domain Event]] | Andere Teile über Geschehenes informieren | 2.2 |
| [[fachliches-modul\|Modul]] | Zusammengehörigen Code samt Grenze bündeln | 3.1 |

Der Controller wird dadurch [[schlanker-controller|schlank]]: Request entgegennehmen, an die Action
weiterreichen, Response bauen.

## Abhängigkeiten zeigen nach innen

Die wichtigste Regel einer [[schichtenarchitektur|Schichtenarchitektur]] ist die
[[abhaengigkeitsrichtung|Abhängigkeitsrichtung]]: Äußere Schichten kennen innere, nie umgekehrt.

- Der Controller kennt die Action. Die Action kennt den Controller **nicht**.
- Die Action kennt Models und Value Objects. Ein Value Object kennt weder Request noch Datenbank.
- Darum kann dieselbe Action aus einem Controller, einem Artisan-Befehl oder einem Queue-Job aufgerufen
  werden.

```php title="Drei Eingänge, ein Anwendungsfall"
// HTTP
$createInvoice->handle(CreateInvoiceData::fromArray($request->validated()));

// Artisan-Befehl beim CSV-Import
$createInvoice->handle(CreateInvoiceData::fromArray($row));

// Queue-Job
$createInvoice->handle($this->data);
```

> [!PRAXIS]
> In großen Laravel-Projekten ist die erste Frage im Code-Review oft: „Könnte ich das auch aus einem
> Artisan-Befehl aufrufen?“ Wenn nein, steckt Logik an der falschen Stelle.

## Zusammenfassung

- MVC trennt HTTP, Darstellung und Daten – für Geschäftsregeln hat es keinen festen Platz.
- Warnsignale: riesige Controller, kopierte Logik, Tests nur über HTTP, Teams im Weg.
- Große Apps ergänzen Form Requests, Actions/Services, DTOs, Value Objects, Events und Module.
- Abhängigkeiten zeigen nach innen: Der Controller kennt die Action, nie umgekehrt.
- Architektur reagiert auf echte Schmerzen – eine kleine App braucht keine Schichtentorte.
