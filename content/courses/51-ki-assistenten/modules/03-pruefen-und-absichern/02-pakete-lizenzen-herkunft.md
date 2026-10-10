---
title: Pakete, Lizenzen und Herkunft
summary: Erfundene Paketnamen, Slopsquatting und Lizenzfragen – wie du Abhängigkeiten aus KI-Vorschlägen sicher prüfst.
duration: 20
sources:
  - title: "Spracklen u. a. – We Have a Package for You! (Paket-Halluzinationen, 2024)"
    url: https://arxiv.org/abs/2406.10279
  - title: npm Docs – npm view
    url: https://docs.npmjs.com/cli/v11/commands/npm-view
  - title: npm Docs – Generating provenance statements
    url: https://docs.npmjs.com/generating-provenance-statements
  - title: choosealicense.com – Lizenzen im Überblick
    url: https://choosealicense.com/licenses/
quiz:
  - type: single
    question: Was ist Slopsquatting?
    options:
      - Ein Angriff, bei dem jemand Pakete unter Namen veröffentlicht, die KI-Assistenten häufig erfinden
      - Das Löschen ungenutzter Abhängigkeiten
      - Ein Tippfehler im Paketnamen, den npm automatisch korrigiert
      - Eine Lizenzform für KI-generierten Code
    answer: 0
    explanation: >
      Erfinden Modelle immer wieder denselben plausiblen Paketnamen, kann ein Angreifer genau diesen Namen
      registrieren. Wer den Vorschlag ungeprüft installiert, holt sich Schadcode.
  - type: multiple
    question: Ein Assistent schlägt `npm install date-fns-tz-helper-pro` vor. Was prüfst du vor der Installation?
    options:
      - Ob das Paket in der Registry existiert (`npm view date-fns-tz-helper-pro`)
      - Seit wann es existiert, wie oft es heruntergeladen wird und wer es pflegt
      - Ob es ein verlinktes Quell-Repository und eine passende Lizenz hat
      - Ob der Assistent beim zweiten Fragen denselben Namen nennt
    answers: [0, 1, 2]
    explanation: >
      Wiederholung beweist nichts – erfundene Namen werden oft wiederholt. Existenz, Alter, Verbreitung,
      Herkunft und Lizenz prüfst du an der Quelle.
  - type: match
    question: Ordne jede Lizenzangabe ihrer Bedeutung für ein kommerzielles, nicht quelloffenes Projekt zu.
    pairs:
      - { left: "MIT", right: "permissiv – Nutzung erlaubt, Lizenzhinweis beibehalten" }
      - { left: "GPL-3.0", right: "Copyleft – kann verlangen, dass abgeleiteter Code unter derselben Lizenz offengelegt wird" }
      - { left: "keine Lizenzangabe", right: "keine Nutzungserlaubnis – nicht verwenden, ohne zu klären" }
    explanation: >
      Ohne Lizenz gilt das Urheberrecht uneingeschränkt. Copyleft-Lizenzen sind nicht „schlecht“, passen aber
      nicht zu jedem Projekt – im Zweifel entscheidet euer Team oder die Rechtsabteilung.
  - type: cloze
    text: Ein signierter Nachweis, aus welchem Repository und Build eine Paketversion stammt, heißt ___. Prüfen kannst du die Signaturen deiner installierten npm-Pakete mit `npm audit ___`.
    blanks:
      - [Provenance, Herkunftsnachweis]
      - [signatures]
    explanation: Provenance belegt die Herkunft; sie sagt aber nichts darüber, ob der Code selbst harmlos ist.
tasks:
  - id: abhaengigkeiten-pruefen
    type: terminal
    title: Vorgeschlagene Abhängigkeiten prüfen
    description: |
      Im Ordner `kalender` hat ein Assistent eine `package.json` mit drei Abhängigkeiten vorgeschlagen:
      `dayjs`, `nanoid` und `date-fns-tz-helper-pro`. Noch ist nichts installiert. Prüfe die Vorschläge,
      **bevor** jemand `npm install` ausführt.

      1. Prüfe jedes Paket mit `npm view <paket> name version license` in der Registry.
      2. Entferne aus `package.json` jedes Paket, das es nicht gibt. Die übrigen bleiben unverändert.
      3. Lege `ABHAENGIGKEITEN.md` an: eine Zeile pro verbleibendem Paket mit Name und Lizenz (so wie
         `npm view` sie meldet) und eine Zeile, die das entfernte Paket nennt und mit dem Wort `entfernt`
         begründet.
      4. Führe **kein** `npm install` aus.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: kalender
    setup: |
      cat > package.json <<'JSON'
      {
        "name": "kalender",
        "version": "1.0.0",
        "type": "module",
        "dependencies": {
          "dayjs": "^1.11.0",
          "nanoid": "^5.0.0",
          "date-fns-tz-helper-pro": "^2.3.1"
        }
      }
      JSON
    checks:
      - type: command
        run: "jq -r '.dependencies | keys | sort | join(\" \")' package.json"
        stdout_equals: "dayjs nanoid"
        message: In package.json sollen genau noch dayjs und nanoid stehen. Entferne das Paket, das `npm view` nicht findet (E404).
      - type: command
        run: "jq -r '.dependencies.dayjs + \" \" + .dependencies.nanoid' package.json"
        stdout_equals: "^1.11.0 ^5.0.0"
        message: Die Versionsangaben der echten Pakete sollen unverändert bleiben.
      - type: file_absent
        path: node_modules
        message: Es wurde npm install ausgeführt. Lösche node_modules wieder – geprüft wird vor der Installation.
      - type: file_exists
        path: ABHAENGIGKEITEN.md
        message: Lege die Datei ABHAENGIGKEITEN.md an.
      - type: file_contains
        path: ABHAENGIGKEITEN.md
        pattern: "dayjs.*MIT"
        message: Trage dayjs mit seiner Lizenz (laut `npm view dayjs license`) in ABHAENGIGKEITEN.md ein.
      - type: file_contains
        path: ABHAENGIGKEITEN.md
        pattern: "nanoid.*MIT"
        message: Trage nanoid mit seiner Lizenz (laut `npm view nanoid license`) in ABHAENGIGKEITEN.md ein.
      - type: file_contains
        path: ABHAENGIGKEITEN.md
        pattern: "date-fns-tz-helper-pro.*[Ee]ntfernt|[Ee]ntfernt.*date-fns-tz-helper-pro"
        message: Notiere in einer Zeile, dass date-fns-tz-helper-pro entfernt wurde.
    hints:
      - "`npm view dayjs name version license` zeigt Name, aktuelle Version und Lizenz. Bei einem erfundenen Paket meldet npm `E404`."
      - "Entfernen kannst du einen Eintrag mit einem Editor (`nano package.json`) oder mit jq: `jq 'del(.dependencies[\"date-fns-tz-helper-pro\"])' package.json > p.json && mv p.json package.json`."
      - "Eine Zeile wie `- dayjs – MIT` genügt pro Paket."
    solution: |
      ```bash
      cd kalender
      npm view dayjs name version license
      npm view nanoid name version license
      npm view date-fns-tz-helper-pro name version license   # E404 – gibt es nicht
      jq 'del(.dependencies["date-fns-tz-helper-pro"])' package.json > p.json && mv p.json package.json
      cat > ABHAENGIGKEITEN.md <<'EOF'
      # Abhängigkeiten
      - dayjs – MIT
      - nanoid – MIT
      - date-fns-tz-helper-pro – entfernt, existiert nicht in der npm-Registry (Halluzination)
      EOF
      ```
  - id: lizenz-ampel
    type: dragdrop
    title: Die Lizenz-Ampel
    description: Euer Team baut eine kommerzielle, nicht quelloffene Webanwendung. Ordne jeden Fund einer Ampelfarbe zu.
    targets:
      - { id: gruen, label: "Grün: in der Regel unproblematisch" }
      - { id: gelb, label: "Gelb: mit dem Team oder der Rechtsabteilung klären" }
      - { id: rot, label: "Rot: so nicht übernehmen" }
    items:
      - { label: "Paket mit MIT-Lizenz, aktiv gepflegt, verlinktes Repository", target: gruen }
      - { label: "Paket mit Apache-2.0-Lizenz", target: gruen }
      - { label: "Paket mit GPL-3.0-Lizenz", target: gelb }
      - { label: "Ein Assistent liefert 60 Zeilen, die wörtlich einer bekannten Bibliothek mit unbekannter Lizenz gleichen", target: gelb }
      - { label: "Paket ohne Lizenzangabe und ohne Quell-Repository", target: rot }
      - { label: "Vorgeschlagenes Paket, das in der Registry nicht existiert", target: rot }
---
„Installier einfach `date-fns-tz-helper-pro`, damit geht das in einer Zeile.“ Klingt hilfreich. Nur: Das
Paket gibt es nicht. Oder schlimmer – es gibt es seit letzter Woche, und jemand anderes hat es
veröffentlicht, als du denkst.

## Erfundene Pakete

Paketnamen sind für ein Sprachmodell ganz normaler Text. Ein Name wie `date-fns-tz-helper-pro` ist
**plausibel** – er klingt wie viele echte Pakete. Also wird er erfunden, genau wie eine API.

Eine Untersuchung von 2024 ließ Modelle Hunderttausende Code-Beispiele erzeugen: Bei kommerziellen
Modellen waren mindestens rund 5 Prozent der empfohlenen Pakete erfunden, bei offenen Modellen im Schnitt
gut 20 Prozent. Viele dieser Namen tauchten **wiederholt** auf.

| Vorschlag | Was dahinterstecken kann |
|---|---|
| Paket existiert, ist bekannt und gepflegt | wahrscheinlich in Ordnung – trotzdem prüfen |
| Paket existiert nicht | Halluzination – nicht installieren |
| Paket existiert, ist aber ganz neu und kaum genutzt | möglicherweise ein Angriff |
| Name ähnelt einem bekannten Paket | möglicherweise [[typosquatting\|Typosquatting]] |

## Slopsquatting: der Angriff auf erfundene Namen

Wiederholen Modelle denselben erfundenen Namen, kann ein Angreifer ihn einfach registrieren und Schadcode
hineinlegen. Dieses Muster heißt [[slopsquatting|Slopsquatting]] – eine Spielart des
[[supply-chain-angriff|Supply-Chain-Angriffs]].

Gefährlich ist das, weil Paketmanager beim Installieren Code ausführen können, etwa über
Installations-Skripte. Ein einziges ungeprüftes `npm install` reicht.

> [!MERKSATZ]
> Ein Paketname aus einem KI-Vorschlag ist eine **Behauptung**, kein Fakt. Prüfe ihn an der Quelle,
> bevor du ihn installierst.

> [!FEHLER]
> **Den Agenten installieren lassen, „weil er es ja testet“.** Läuft `npm install` mit einem
> Schadpaket, ist der Schaden passiert, bevor ein einziger Test läuft. Installationen neuer Pakete
> gehören in deine Freigabe.

## So prüfst du ein Paket

Bevor ein neues Paket in deine `package.json` oder `composer.json` kommt:

```bash title="Prüfen, ohne zu installieren"
npm view dayjs name version license repository.url
npm view dayjs time.created
# Composer-Gegenstück: composer show --available <vendor/paket>
```

Achte auf:

1. **Existenz** – meldet die Registry `E404`, ist der Name erfunden.
2. **Alter und Verbreitung** – ein Paket von letzter Woche mit kaum Downloads ist verdächtig.
3. **Herkunft** – gibt es ein verlinktes Quell-Repository? Passt es zum Namen? Manche Registries zeigen
   einen signierten [[provenance|Provenance]]-Nachweis an.
4. **Brauchst du es überhaupt?** Oft kann die Standardbibliothek das schon – das ist die beste
   Abhängigkeit von allen.

Mehr zu Registries und Lockfiles findest du im Kurs [Libraries, Pakete und Registries](/kurse/libraries-pakete-registries).

## Lizenzen und Herkunft von Code

Auch Code ohne Paket hat eine Herkunft. Modelle haben aus öffentlichem Code gelernt und können in seltenen
Fällen längere Passagen nahezu wörtlich wiedergeben – samt der [[lizenz|Lizenz]]-Pflichten des Originals.

| Lizenztyp | Beispiel | Bedeutung |
|---|---|---|
| [[permissive-lizenz\|permissiv]] | MIT, Apache-2.0, BSD | Nutzung erlaubt, Lizenzhinweis beibehalten |
| [[copyleft\|Copyleft]] | GPL, AGPL | kann Offenlegung des eigenen Codes verlangen |
| keine Lizenz | – | keine Erlaubnis; nicht nutzen, ohne zu klären |

Praktische Regeln:

- Erkennst du in einem Vorschlag eine bekannte Bibliothek fast wörtlich wieder, nimm lieber die
  Bibliothek selbst – mit ihrer Lizenz – statt einer namenlosen Kopie.
- Manche Assistenten haben Filter, die Vorschläge mit großen Übereinstimmungen zu öffentlichem Code
  unterdrücken oder kennzeichnen. Ob sie aktiv sind, entscheidet oft eure Organisation.
- Rechtliche Fragen klärt dein Team mit der zuständigen Stelle – dieser Kurs ist keine Rechtsberatung.

> [!PRAXIS]
> In vielen Teams läuft in der CI-Pipeline eine Lizenzprüfung über alle Abhängigkeiten, und
> `npm audit` bzw. `composer audit` meldet bekannte Sicherheitslücken. Neue Abhängigkeiten werden im
> Pull Request ausdrücklich begründet.

## Zusammenfassung

- Modelle erfinden Paketnamen genauso wie APIs – oft wiederholt.
- Slopsquatting nutzt das aus: Angreifer registrieren die erfundenen Namen.
- Prüfe vor jeder Installation: Existenz, Alter, Verbreitung, Herkunft, Notwendigkeit.
- Installationen neuer Pakete gibst du selbst frei – nicht der Agent.
- Achte auf Lizenzen: permissiv, Copyleft oder gar keine – im Zweifel im Team klären.
