---
title: Was macht Code zu Legacy-Code?
summary: Woran du Legacy-Code erkennst, warum er trotzdem wertvoll ist und warum ein Neuschreiben auf einen Schlag fast immer scheitert.
duration: 18
sources:
  - title: Martin Fowler – StranglerFigApplication
    url: https://martinfowler.com/bliki/StranglerFigApplication.html
  - title: Martin Fowler – Technical Debt
    url: https://martinfowler.com/bliki/TechnicalDebt.html
  - title: PHP-Handbuch – Migration zwischen PHP-Versionen
    url: https://www.php.net/manual/de/appendices.php
quiz:
  - type: single
    question: Welche Definition von Legacy-Code ist für die tägliche Arbeit am nützlichsten?
    options:
      - Code, der älter als fünf Jahre ist.
      - Code, den man nicht sicher ändern kann, weil kein Sicherheitsnetz aus Tests existiert.
      - Code, der in PHP geschrieben ist.
      - Code, den ein anderes Team geschrieben hat.
    answer: 1
    explanation: >
      Alter, Sprache oder Autor sind Nebensache. Entscheidend ist, ob du eine Änderung machen kannst und
      sofort erfährst, ob etwas kaputtgegangen ist. Ohne Tests fehlt genau diese Rückmeldung – auch bei
      Code, der erst letzte Woche geschrieben wurde.
  - type: multiple
    question: Welche Anzeichen sprechen für Legacy-Code?
    options:
      - Niemand traut sich, eine bestimmte Datei anzufassen.
      - Viele globale Variablen und `require_once` quer durch das Projekt.
      - Eine Änderung braucht zuerst einen Test, der in Sekunden läuft.
      - Die App läuft nur auf einer PHP-Version, die keine Sicherheitsupdates mehr bekommt.
    answers: [0, 1, 3]
    explanation: >
      Angst vor Änderungen, versteckte Abhängigkeiten und eine veraltete Laufzeit sind typische Signale.
      Ein schneller Test vor jeder Änderung ist dagegen das Gegenteil von Legacy – das ist das Ziel.
  - type: cloze
    text: Alles auf einmal neu zu schreiben und am Stichtag umzuschalten, nennt man ___-Rewrite. Die Alternative ist, die App ___ zu ersetzen.
    blanks:
      - [Big-Bang, Big Bang, Bigbang]
      - [schrittweise, inkrementell, Stück für Stück]
    explanation: >
      Beim Big-Bang-Rewrite gibt es lange nichts Nutzbares und am Ende einen riskanten Umschalttag.
      Schrittweise Modernisierung liefert laufend kleine, überprüfbare Verbesserungen.
  - type: match
    question: Ordne jedem Begriff die passende Beschreibung zu.
    pairs:
      - { left: "Legacy-Code", right: "Code ohne Sicherheitsnetz, der aber produktiv läuft" }
      - { left: "Technische Schulden", right: "Abkürzungen, die jede spätere Änderung verteuern" }
      - { left: "Big-Bang-Rewrite", right: "Komplette Neuentwicklung mit einem einzigen Umschalttag" }
      - { left: "Refactoring", right: "Struktur verbessern, ohne das Verhalten zu ändern" }
    explanation: Diese vier Begriffe begleiten dich durch den ganzen Kurs.
tasks:
  - id: anzeichen-sortieren
    type: dragdrop
    title: Legacy-Signal oder gesunder Code?
    description: >
      Du übernimmst ein Projekt und machst dir Notizen. Ordne jede Beobachtung ein: Ist sie ein typisches
      Anzeichen für Legacy-Code oder ein Zeichen für gut wartbaren Code?
    targets:
      - { id: legacy, label: Anzeichen für Legacy-Code }
      - { id: gesund, label: Zeichen für wartbaren Code }
    items:
      - { label: "„Fass bloß `functions.php` nicht an, da hängt alles dran.“", target: legacy }
      - { label: Jede Datei beginnt mit fünf `require_once`-Zeilen, target: legacy }
      - { label: SQL wird per String-Verkettung mit Nutzereingaben gebaut, target: legacy }
      - { label: Die Server-PHP-Version bekommt seit Jahren keine Sicherheitsupdates, target: legacy }
      - { label: "`composer install` und `./vendor/bin/pest` laufen in zwei Minuten durch", target: gesund }
      - { label: Klassen werden über PSR-4 automatisch geladen, target: gesund }
      - { label: "Eine README erklärt, wie man die App lokal startet", target: gesund }
    hints:
      - Frag dich bei jeder Notiz – macht sie Änderungen sicherer oder riskanter?
  - id: rewrite-oder-nicht
    type: steps
    title: Neu schreiben oder umbauen?
    description: Spiel eine Entscheidung durch, die so in vielen Firmen fällt.
    steps:
      - situation: >
          Das Bestellsystem eines Gemüse-Lieferdienstes ist zwölf Jahre alt. Es hat keine Tests, aber es
          verarbeitet jeden Tag Hunderte Bestellungen. Ein Kollege schlägt vor: „Wir schreiben alles in
          einem halben Jahr neu in Laravel.“
        question: Was ist das größte Risiko dieses Plans?
        options:
          - Laravel ist zu langsam für Bestellungen.
          - Niemand kennt alle Regeln, die im alten Code stecken – die neue App wird sie vergessen.
          - Ein halbes Jahr ist zu kurz, um Laravel zu lernen.
        answer: 1
        explanation: >
          Alter Code enthält jahrelang gesammeltes Wissen: Sonderrabatte, Rundungsregeln, Workarounds.
          Vieles davon ist nirgends dokumentiert. Ein Rewrite übersieht genau diese Details.
      - situation: >
          Das Team schreibt trotzdem neu. Nach acht Monaten ist die neue App zu 80 Prozent fertig. In der
          Zwischenzeit wurden im alten System drei neue Rabattaktionen eingebaut.
        question: Was passiert jetzt typischerweise?
        options:
          - Die neue App muss den alten Änderungen hinterherlaufen – das Ziel bewegt sich ständig.
          - Die Rabattaktionen übertragen sich automatisch.
          - Die alte App wird eingefroren und niemand merkt es.
        answer: 0
        explanation: >
          Das Geschäft wartet nicht. Zwei Systeme parallel weiterzuentwickeln kostet doppelt, und die
          Umstellung rückt immer weiter weg. Deshalb lernst du hier die schrittweise Modernisierung.
---
Du startest in einem neuen Team und bekommst dein erstes Ticket: „Im Bestellsystem soll der Stammkundenrabatt
von 10 auf 12 Prozent steigen.“ Eine Zahl ändern – fünf Minuten Arbeit? Dann öffnest du den Code: globale
Variablen, Funktionen ohne Typen, SQL aus zusammengeklebten Strings, kein einziger Test. Niemand kann dir sagen,
wo der Rabatt überall wirkt. Willkommen bei [[legacy-code|Legacy-Code]].

## Was Legacy-Code wirklich ist

Umgangssprachlich heißt Legacy-Code „alter Code“. Für die Arbeit taugt eine andere Definition besser:

> [!MERKSATZ]
> Legacy-Code ist Code, den du **nicht sicher ändern** kannst – weil dir kein Sicherheitsnetz sagt, ob
> nach deiner Änderung noch alles funktioniert.

Das Sicherheitsnetz sind vor allem [[automatisierter-test|automatisierte Tests]]. Diese Sicht hat zwei
Folgen:

- Auch Code von letzter Woche kann Legacy sein, wenn er ohne Tests entstanden ist.
- Alter Code ist **nicht automatisch schlecht**. Er läuft produktiv, bringt Geld ein und enthält Jahre an
  Wissen über Sonderfälle.

Legacy-Code ist also kein Schimpfwort, sondern eine Zustandsbeschreibung. Dein Job ist nicht, ihn zu
verachten, sondern ihn wieder **änderbar** zu machen.

## Typische Anzeichen

| Anzeichen | Warum es ein Problem ist |
|---|---|
| Keine oder kaum Tests | Jede Änderung ist ein Blindflug |
| Globale Variablen (`global $DB`) | Funktionen hängen unsichtbar voneinander ab |
| `require_once` in jeder Datei | Ladereihenfolge ist zerbrechlich |
| SQL per String-Verkettung | Gefahr von [[sql-injection|SQL-Injection]] |
| Alte PHP-Version auf dem Server | Keine Sicherheitsupdates mehr |
| Wissen steckt in einzelnen Köpfen | Fällt die Person aus, steht das Team |
| Angst vor bestimmten Dateien | Das Team umgeht Probleme, statt sie zu lösen |

Diese Punkte sind Formen von [[technische-schulden|technischen Schulden]]: Abkürzungen, die heute Zeit
sparen und morgen jede Änderung verteuern.

> [!FEHLER]
> „Der Code ist hässlich, also ist er falsch.“ Hässlicher Code kann jahrelang korrekt rechnen. Wer ihn
> nach Gefühl „aufräumt“, ohne sein Verhalten abzusichern, baut genau die Fehler ein, die er beheben wollte.

## Warum ein Neuschreiben meist scheitert

Der naheliegende Gedanke: „Wir werfen alles weg und schreiben es neu, diesmal richtig.“ Das nennt man
[[big-bang-rewrite|Big-Bang-Rewrite]] – Monate der Neuentwicklung und dann ein einziger Umschalttag.

Warum das so oft schiefgeht:

1. **Verborgenes Wissen geht verloren.** Der alte Code kennt Regeln, die nirgends dokumentiert sind –
   etwa einen Samstagszuschlag oder eine Rundung, auf die sich die Buchhaltung verlässt.
2. **Das Ziel bewegt sich.** Während des Rewrites ändert sich das Geschäft. Jede neue Anforderung muss
   zweimal gebaut werden.
3. **Lange kein Nutzen.** Bis zum Umschalttag liefert das Projekt nichts aus. Budget und Geduld schrumpfen.
4. **Der Umschalttag ist riskant.** Alles ändert sich gleichzeitig. Geht etwas schief, weiß niemand, woran es lag.

> [!PRAXIS]
> In vielen Firmen gibt es den „Rewrite, der nie live ging“: zwei Jahre Arbeit, dann eingestellt. Das alte
> System läuft heute noch. Erfahrene Teams modernisieren deshalb fast immer **schrittweise**.

## Der Weg dieses Kurses

Statt Neuschreiben gehst du in vier Etappen vor – das ist auch der Aufbau dieses Kurses:

```text title="Der Modernisierungs-Kreislauf"
1. Verstehen       → Was tut der Code wirklich? Wo sind die Einstiegspunkte?
2. Absichern       → Charakterisierungstests und Golden Master festhalten
3. Umbauen         → In kleinen Schritten refaktorieren, Composer, Rector, Strangler
4. Ausrollen       → Feature-Flags, Parallelbetrieb, Datenmigration, Plan
```

Jeder Umbau-Schritt ist ein [[refactoring|Refactoring]]: Du verbesserst die Struktur, das Verhalten
bleibt gleich. Erst wenn alles abgesichert ist, änderst du bewusst Verhalten – und zwar in einem
**eigenen** Schritt.

Du übst alles an einer kleinen, absichtlich altmodischen App: dem Bestellsystem der „Gemüsekiste
Grünfeld“. Sie ist erfunden, sieht aber genau so aus wie Code, den du in echten Projekten findest.

## Zusammenfassung

- Legacy-Code ist Code, den du **nicht sicher ändern** kannst – unabhängig von seinem Alter.
- Er ist wertvoll: Er läuft produktiv und enthält Wissen über Sonderfälle.
- Typische Anzeichen: keine Tests, globale Variablen, `require_once`-Ketten, SQL per Verkettung, alte PHP-Version.
- Ein **Big-Bang-Rewrite** scheitert oft an verborgenem Wissen, beweglichen Zielen und einem riskanten Umschalttag.
- Der bessere Weg: verstehen → absichern → in kleinen Schritten umbauen → kontrolliert ausrollen.
