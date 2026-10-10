---
title: Events, Delegation und Formulare
summary: Auf Klicks und Eingaben reagieren, verstehen, wie ein Event durch den DOM-Baum wandert, mit Event-Delegation viele Elemente über einen Listener steuern und Formulare mit FormData auswerten.
duration: 25
sources:
  - title: MDN – EventTarget.addEventListener()
    url: https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
  - title: MDN – Event bubbling
    url: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling
  - title: MDN – Event.preventDefault()
    url: https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault
  - title: MDN – FormData
    url: https://developer.mozilla.org/en-US/docs/Web/API/FormData
quiz:
  - type: single
    question: "Ein Listener hängt am `<ul>`, geklickt wird auf einen `<button>` in einem `<li>`. Was ist `event.currentTarget`?"
    options: ["Der button", "Das li", "Das ul", "document"]
    answer: 2
    explanation: currentTarget ist das Element, an dem der gerade laufende Listener hängt. target ist das Element, auf das tatsächlich geklickt wurde – hier der button.
  - type: multiple
    question: Welche Vorteile hat Event-Delegation?
    options:
      - Ein einziger Listener reicht für beliebig viele Kindelemente.
      - Später hinzugefügte Elemente funktionieren automatisch.
      - Events wandern dadurch schneller.
      - Man muss beim Entfernen von Elementen keine Listener aufräumen.
    answers: [0, 1, 3]
    explanation: Der Listener sitzt am gemeinsamen Elternelement und nutzt das Bubbling. Die Geschwindigkeit des Events ändert sich dadurch nicht.
  - type: cloze
    text: "Damit ein Formular beim Absenden die Seite nicht neu lädt, rufst du im submit-Listener `event.___()` auf."
    blanks:
      - [preventDefault]
    explanation: preventDefault verhindert die Standardaktion des Browsers – beim Formular das Absenden und Neuladen.
  - type: find-bug
    question: Der Löschen-Knopf soll den Eintrag entfernen, reagiert aber bei neu hinzugefügten Einträgen nicht. Welche Zeile ist das Problem?
    language: js
    code: |
      const liste = document.querySelector("#liste");
      function fuegeHinzu(text) {
        liste.insertAdjacentHTML("beforeend", "<li>" + text + " <button class='loeschen'>x</button></li>");
      }
      document.querySelectorAll(".loeschen").forEach((knopf) => {
        knopf.addEventListener("click", () => knopf.closest("li").remove());
      });
      fuegeHinzu("Einkaufen");
    bug_line: 5
    explanation: "querySelectorAll findet nur die Knöpfe, die in diesem Moment existieren. Spätere Einträge haben keinen Listener. Mit Event-Delegation – einem Listener an `liste` und `event.target.closest(\".loeschen\")` – funktioniert es für alle. (Zeile 3 hat obendrein eine XSS-Lücke.)"
  - type: match
    question: Welches Event passt?
    pairs:
      - { left: "Formular wird abgeschickt", right: "submit" }
      - { left: "Jeder Tastendruck in einem Textfeld", right: "input" }
      - { left: "Auswahl in einem select wurde geändert", right: "change" }
      - { left: "HTML ist fertig gelesen", right: "DOMContentLoaded" }
    explanation: input feuert bei jeder Änderung, change erst, wenn der Wert bestätigt ist. DOMContentLoaded brauchst du bei Modulen selten, weil sie ohnehin nach dem Parsen laufen.
tasks:
  - id: bubbling-vorhersagen
    type: steps
    title: Wohin wandert der Klick?
    description: |
      Gegeben ist `<ul id="liste"><li data-id="7"><span>Einkaufen</span> <button class="loeschen">x</button></li></ul>`
      und dieser Code:

      ```js
      liste.addEventListener("click", (event) => {
        const knopf = event.target.closest(".loeschen");
        console.log(event.target.tagName, knopf ? knopf.closest("li").dataset.id : "kein Knopf");
      });
      ```
    steps:
      - situation: Du klickst auf den Knopf „x“.
        question: Was wird ausgegeben?
        options: ["BUTTON 7", "UL 7", "LI kein Knopf", "BUTTON kein Knopf"]
        answer: 0
        explanation: Das Event startet am button und blubbert zum ul hoch. target bleibt der button, closest(".loeschen") findet ihn selbst, das li liefert data-id 7.
      - situation: Du klickst auf den Text „Einkaufen“.
        question: Was wird ausgegeben?
        options: ["SPAN kein Knopf", "SPAN 7", "LI kein Knopf"]
        answer: 0
        explanation: target ist das span. Weder das span noch seine Vorfahren haben die Klasse loeschen, closest liefert null.
      - situation: Ein zweiter Listener am li ruft `event.stopPropagation()` auf. Du klickst wieder auf „x“.
        question: Was passiert mit dem Listener am ul?
        options: ["Er läuft trotzdem", "Er läuft nicht, weil das Event am li gestoppt wurde", "Er läuft zweimal"]
        answer: 1
        explanation: stopPropagation beendet das Bubbling. Genau deshalb solltest du es sparsam einsetzen – es bricht Delegation weiter oben.
      - situation: Per JavaScript wird ein neues li mit eigenem Löschen-Knopf angehängt. Du klickst auf dessen „x“.
        question: Reagiert der Listener am ul?
        options: ["Ja, das Event blubbert auch vom neuen Knopf zum ul", "Nein, er kennt nur die Knöpfe beim Start"]
        answer: 0
        explanation: Das ist der große Vorteil der Delegation – der Listener sitzt am Elternelement und sieht Klicks auf alle heutigen und künftigen Kinder.
  - id: formular-pruefen
    type: code
    language: js
    title: Formulardaten prüfen
    description: |
      Trenne Logik und DOM: Die Prüfung eines Anmeldeformulars bekommt ein einfaches Objekt – so, wie es
      `Object.fromEntries(new FormData(formular))` liefert (alle Werte sind Strings). Schreibe
      `pruefeAnmeldung(daten)`, die ein Objekt mit Fehlermeldungen je Feld zurückgibt. Ist alles in Ordnung,
      ist das Objekt leer.

      1. `name`: nach `trim()` mindestens 2 Zeichen, sonst `"Bitte gib deinen Namen an."`
      2. `email`: muss ein `@` enthalten und darf nicht mit `@` beginnen oder enden, sonst `"Bitte gib eine gültige E-Mail-Adresse an."`
      3. `alter`: eine ganze Zahl von 16 bis 120, sonst `"Das Alter muss zwischen 16 und 120 liegen."`
      4. Fehlende Felder gelten als leerer String.
    starter: |
      function pruefeAnmeldung(daten) {
        const fehler = {};
        if (daten.name.length < 2) {
          fehler.name = "Bitte gib deinen Namen an.";
        }
        return fehler;
      }
    tests:
      - name: gültige Daten ergeben keine Fehler
        code: 'assertDeepEqual(pruefeAnmeldung({ name: "Ada", email: "ada@example.com", alter: "36" }), {})'
      - name: Name wird getrimmt
        code: 'assertEqual(pruefeAnmeldung({ name: "  A ", email: "ada@example.com", alter: "36" }).name, "Bitte gib deinen Namen an.")'
      - name: E-Mail wird geprüft
        code: 'assertEqual(pruefeAnmeldung({ name: "Ada", email: "@example.com", alter: "36" }).email, "Bitte gib eine gültige E-Mail-Adresse an."); assertEqual(pruefeAnmeldung({ name: "Ada", email: "ada.example.com", alter: "36" }).email, "Bitte gib eine gültige E-Mail-Adresse an.")'
      - name: Alter muss eine ganze Zahl im Bereich sein
        code: 'for (const alter of ["15", "121", "abc", "18.5", ""]) { assertEqual(pruefeAnmeldung({ name: "Ada", email: "a@b.de", alter }).alter, "Das Alter muss zwischen 16 und 120 liegen.", "alter = " + alter); } assertEqual(pruefeAnmeldung({ name: "Ada", email: "a@b.de", alter: "16" }).alter, undefined)'
      - name: leeres Objekt meldet alle drei Felder
        code: 'assertDeepEqual(Object.keys(pruefeAnmeldung({})).sort(), ["alter", "email", "name"])'
    hints:
      - "Mit Standardwerten in der Destrukturierung sind fehlende Felder kein Problem: `const { name = \"\", email = \"\", alter = \"\" } = daten;`"
      - "E-Mail: `const at = email.indexOf(\"@\");` – gültig, wenn `at > 0 && at < email.length - 1`."
      - "Alter: `const zahl = Number(alter);` und dann `alter.trim() !== \"\" && Number.isInteger(zahl) && zahl >= 16 && zahl <= 120`."
    solution: |
      function pruefeAnmeldung(daten) {
        const { name = "", email = "", alter = "" } = daten;
        const fehler = {};

        if (name.trim().length < 2) {
          fehler.name = "Bitte gib deinen Namen an.";
        }

        const at = email.indexOf("@");
        if (at <= 0 || at === email.length - 1) {
          fehler.email = "Bitte gib eine gültige E-Mail-Adresse an.";
        }

        const zahl = Number(alter);
        if (alter.trim() === "" || !Number.isInteger(zahl) || zahl < 16 || zahl > 120) {
          fehler.alter = "Das Alter muss zwischen 16 und 120 liegen.";
        }

        return fehler;
      }
---
Deine Aufgabenliste zeigt Einträge an – jetzt soll man sie abhaken, löschen und über ein Formular neue
hinzufügen. Dafür muss dein Code erfahren, **wann** der Nutzer etwas tut. Der Browser meldet jede Aktion als
Event. In dieser Lektion lernst du, darauf zu reagieren – und warum ein einziger Listener oft besser ist als
hundert.

## Auf Events reagieren

Ein [[event|Event]] ist eine Meldung des Browsers: geklickt, getippt, abgeschickt, geladen. Mit
`addEventListener` registrierst du einen [[event-listener|Event-Listener]] – eine Funktion, die bei jedem
passenden Event aufgerufen wird:

```js
const knopf = document.querySelector("#zaehlen");
let klicks = 0;

knopf.addEventListener("click", (event) => {
  klicks += 1;
  knopf.textContent = `${klicks}× geklickt`;
  console.log(event.type, event.target);   // "click", das geklickte Element
});
```

Der Listener bekommt ein Event-Objekt mit allen Details:

| Eigenschaft / Methode | Bedeutung |
|---|---|
| `event.type` | Art des Events, z. B. `"click"` |
| `event.target` | das Element, auf dem das Event ausgelöst wurde |
| `event.currentTarget` | das Element, an dem der Listener hängt |
| `event.key` | gedrückte Taste bei `keydown` |
| `event.preventDefault()` | Standardaktion des Browsers verhindern |

Mit `{ once: true }` als drittem Argument läuft ein Listener nur einmal. `removeEventListener` entfernt ihn
wieder – dafür brauchst du aber dieselbe Funktion, keine neue Arrow Function.

## Die Reise eines Events: Bubbling

Klickst du auf einen Knopf in einem Listeneintrag, hast du gleichzeitig auf den Eintrag, die Liste und den
`body` geklickt. Das Event wandert deshalb durch den Baum: Erst von oben zum Ziel (Capture-Phase), dann vom
Ziel wieder nach oben. Dieses Aufsteigen heißt [[event-bubbling|Bubbling]], und dort laufen normale Listener.

![Ein Klick auf einen button wandert in der Capture-Phase von document nach unten und in der Bubbling-Phase über li, ul und body wieder nach oben.](/assets/javascript/event-bubbling.svg)

```js
document.querySelector("#liste").addEventListener("click", (event) => {
  console.log("Liste hört:", event.target.tagName);   // auch Klicks auf Kinder kommen hier an
});
```

`event.stopPropagation()` stoppt die Reise. Setze es sparsam ein – Listener weiter oben bekommen das Event
dann nicht mehr mit.

> [!MERKSATZ]
> `target` ist, wo geklickt wurde. `currentTarget` ist, wo der Listener hängt. Durch Bubbling können die
> beiden verschieden sein.

## Event-Delegation

Hast du 200 Listeneinträge mit je einem Löschen-Knopf, brauchst du nicht 200 Listener. Du hängst **einen**
Listener an das gemeinsame Elternelement und prüfst darin, worauf geklickt wurde. Dieses Muster heißt
[[event-delegation|Event-Delegation]]:

```js
const liste = document.querySelector("#liste");

liste.addEventListener("click", (event) => {
  const knopf = event.target.closest("button[data-aktion]");
  if (!knopf) return;                               // Klick woanders hin – ignorieren

  const id = Number(knopf.closest("li").dataset.id);
  if (knopf.dataset.aktion === "loeschen") loesche(id);
  if (knopf.dataset.aktion === "erledigt") schalteUm(id);
});
```

Die Vorteile: Später hinzugefügte Einträge funktionieren automatisch, beim Entfernen musst du keine Listener
aufräumen, und der Code steht an einer Stelle. `closest` ist wichtig, weil `target` auch ein `<span>` oder
`<svg>` **im** Knopf sein kann.

> [!FEHLER]
> `querySelectorAll(".loeschen").forEach(k => k.addEventListener(…))` erreicht nur Knöpfe, die es beim Start
> gibt. Neue Einträge bleiben tot. Mit Delegation passiert das nicht.

## Standardaktionen und Formulare

Manche Events lösen eine Standardaktion des Browsers aus: Ein Link navigiert, ein Formular wird abgeschickt
und die Seite neu geladen. Mit [[preventdefault|`preventDefault()`]] verhinderst du das und übernimmst selbst.

[[formular|Formulare]] wertest du am besten im `submit`-Event aus – das deckt Klick auf den Knopf **und** Enter im
Textfeld ab. [[formdata|`FormData`]] liest alle Felder anhand ihres `name`-Attributs:

```js
const formular = document.querySelector("#neue-aufgabe");

formular.addEventListener("submit", (event) => {
  event.preventDefault();                                  // kein Neuladen
  const daten = Object.fromEntries(new FormData(formular)); // { titel: "…", prioritaet: "…" }
  if (daten.titel.trim() === "") return;
  fuegeHinzu(daten);
  formular.reset();                                        // Felder leeren
});
```

Für Live-Rückmeldungen beim Tippen gibt es das Event `input`, für bestätigte Änderungen `change`. Die
eingebaute HTML-Validierung (`required`, `type="email"`, `min`) prüft der Browser schon vor `submit`. Eigene
Regeln schreibst du als reine Funktion, die ein Objekt prüft – die lässt sich ohne Browser testen.

> [!PRAXIS]
> Prüfe Eingaben im Browser für eine gute Bedienung – aber verlass dich nie darauf. Ein Server muss alle
> Daten noch einmal selbst prüfen, denn Anfragen lassen sich auch ohne dein Formular schicken.

## Zusammenfassung

- `addEventListener(typ, fn)` registriert einen Listener; das Event-Objekt liefert `type`, `target`, `key` und mehr.
- Events wandern erst nach unten zum Ziel und blubbern dann nach oben; normale Listener laufen beim Bubbling.
- `target` ist das ausgelöste Element, `currentTarget` das mit dem Listener.
- Event-Delegation: ein Listener am Elternelement plus `event.target.closest(…)` – auch für spätere Elemente.
- `preventDefault()` verhindert die Standardaktion, z. B. das Neuladen beim Absenden.
- `Object.fromEntries(new FormData(formular))` liefert alle Felder als Objekt mit String-Werten.
