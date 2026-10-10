---
title: Was Internationalisierung bedeutet
summary: Warum fest eingebaute Texte, Formate und Annahmen teuer werden und wie sich i18n und l10n unterscheiden.
duration: 15
sources:
  - title: W3C – Localization vs. Internationalization
    url: https://www.w3.org/International/questions/qa-i18n
  - title: MDN – Intl
    url: https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Intl
quiz:
  - type: single
    question: Was ist der Unterschied zwischen Internationalisierung (i18n) und Lokalisierung (l10n)?
    options:
      - i18n übersetzt die Texte, l10n baut den Code um.
      - i18n bereitet den Code darauf vor, mehrere Sprachen und Regionen zu unterstützen; l10n passt das Produkt an eine konkrete Sprache und Region an.
      - Beides ist dasselbe, nur die Abkürzung ist anders.
      - i18n betrifft nur das Backend, l10n nur das Frontend.
    answer: 1
    explanation: >
      Internationalisierung ist Technik: Texte auslagern, Formate über Locales steuern, keine Annahmen fest
      einbauen. Lokalisierung ist die Anpassung an einen Markt: Übersetzung, passende Bilder, rechtliche Texte.
  - type: multiple
    question: Welche Dinge unterscheiden sich typischerweise zwischen Ländern und Sprachen?
    options:
      - Dezimal- und Tausendertrennzeichen
      - Die Anzahl der Pluralformen
      - Die Schreibrichtung
      - Der Wert von 1 + 1
      - Die Reihenfolge von Tag, Monat und Jahr
    answers: [0, 1, 2, 4]
    explanation: >
      Zahlenformate, Pluralregeln, Schreibrichtung und Datumsreihenfolge hängen von Sprache und Region ab.
      Mathematik bleibt zum Glück überall gleich.
  - type: cloze
    text: "In „i18n“ steht die 18 für die Anzahl der ___ zwischen dem ersten und dem letzten Buchstaben von „internationalization“."
    blanks:
      - [Buchstaben, Zeichen]
    explanation: >
      i + 18 Buchstaben + n = internationalization. Genauso entstehen l10n (localization) und g11n (globalization).
  - type: match
    question: Ordne jede Aufgabe der passenden Disziplin zu.
    pairs:
      - { left: "Texte aus dem Code in Kataloge auslagern", right: "Internationalisierung" }
      - { left: "Die Startseite ins Polnische übersetzen", right: "Lokalisierung" }
      - { left: "Preise über eine Locale formatieren statt mit festem €", right: "Internationalisierung" }
      - { left: "Für Japan andere Produktfotos auswählen", right: "Lokalisierung" }
    explanation: >
      Alles, was den Code für viele Märkte vorbereitet, ist i18n. Alles, was für einen bestimmten Markt
      geliefert wird, ist l10n.
tasks:
  - id: i18n-oder-l10n
    type: dragdrop
    title: i18n oder l10n?
    description: >
      Ein Team macht seinen Online-Shop fit für Frankreich und Ägypten. Ordne jede Aufgabe zu: Gehört sie zur
      Internationalisierung (Code vorbereiten) oder zur Lokalisierung (für einen Markt anpassen)?
    targets:
      - { id: i18n, label: Internationalisierung (i18n) }
      - { id: l10n, label: Lokalisierung (l10n) }
    items:
      - { label: "`margin-left` durch `margin-inline-start` ersetzen", target: i18n }
      - { label: "Datum mit `Intl.DateTimeFormat` statt mit festem Muster formatieren", target: i18n }
      - { label: "Fest eingebaute Texte durch Übersetzungsschlüssel ersetzen", target: i18n }
      - { label: Den Warenkorb-Text ins Französische übersetzen, target: l10n }
      - { label: Die AGB für Ägypten juristisch prüfen lassen, target: l10n }
      - { label: Ein Werbebanner mit arabischem Text gestalten, target: l10n }
    hints:
      - Frag dich bei jeder Karte, ob sie für alle Sprachen gleichzeitig hilft (i18n) oder nur für eine (l10n).
  - id: annahmen-finden
    type: steps
    title: Wo steckt die fest eingebaute Annahme?
    description: Spiel typische Situationen durch, die in Projekten ohne Internationalisierung passieren.
    steps:
      - situation: >
          Im Code steht `"Du hast " + anzahl + " neue Nachrichten"`. Das Team will die App ins Englische
          übersetzen.
        question: Was ist das Hauptproblem?
        options:
          - Der Satz ist in drei Teile zerschnitten – Übersetzer:innen können Wortreihenfolge und Plural nicht anpassen.
          - Englisch braucht keine Zahlen.
          - "`+` funktioniert nur mit deutschen Texten."
        answer: 0
        explanation: >
          Zerstückelte Sätze lassen sich nicht sauber übersetzen. Richtig ist ein ganzer Satz mit Platzhalter
          und Pluralformen – das lernst du in Modul 2.
      - situation: >
          Ein Preis wird mit `preis.toFixed(2) + " €"` angezeigt. Eine Kundin aus den USA sieht `1234.50 €`.
        question: Was fehlt?
        options:
          - Nichts, so schreiben alle Länder Preise.
          - Eine Formatierung über die Locale – Tausendertrennzeichen, Dezimalzeichen und Position des Währungssymbols hängen von der Region ab.
          - Ein Euro-Zeichen am Anfang.
        answer: 1
        explanation: >
          `Intl.NumberFormat` mit Locale und Währung erledigt das: in `de-DE` „1.234,50 €“, in `en-US` „€1,234.50“.
      - situation: >
          Ein Termin wird als `14:00` gespeichert – ohne Datum und ohne Zeitzone. Ein Kollege in New York
          öffnet den Kalender.
        question: Was sieht er?
        options:
          - Die richtige Uhrzeit in seiner Zeitzone.
          - "14:00 – obwohl der Termin für ihn um 8:00 oder 9:00 stattfindet."
        answer: 1
        explanation: >
          Ohne Zeitzone ist eine Uhrzeit mehrdeutig. Zeitpunkte gehören in UTC gespeichert und erst bei der
          Anzeige umgerechnet (Modul 3).
---
Dein Team hat eine erfolgreiche Web-App gebaut – auf Deutsch, für Deutschland. Jetzt kommt die Nachricht:
„Nächsten Monat starten wir in Frankreich, Polen und Ägypten.“ Plötzlich sind hunderte Texte im Code
verstreut, Preise stehen als `"€ " + preis` da, und das arabische Layout muss von rechts nach links laufen.
Genau dieses Problem löst **Internationalisierung**.

## Das Problem: Annahmen im Code

Die meiste Software wird zuerst für eine Sprache gebaut. Dabei schleichen sich Annahmen ein, die niemand
bewusst trifft:

- Texte stehen direkt im Code: `<button>Speichern</button>`.
- Zahlen werden mit Komma geschrieben: `preis.toFixed(2).replace(".", ",")`.
- Ein Datum hat das Format `TT.MM.JJJJ`.
- Es gibt genau zwei Formen: „1 Datei“ und „2 Dateien“.
- Text läuft von links nach rechts.

Jede dieser Annahmen ist für Deutsch richtig – und für viele andere Sprachen falsch. Wer sie später
entfernen will, muss jede Stelle im Code finden. Bei großen Projekten sind das tausende.

> [!FEHLER]
> „Übersetzen machen wir später, das ist ja nur Text.“ – Wer so denkt, baut zweimal: erst die App, dann
> den Umbau. Die Technik dafür kostet am Anfang wenig, nachträglich sehr viel.

## i18n und l10n

Zwei Begriffe musst du sauber trennen:

| | [[internationalisierung|Internationalisierung]] (i18n) | [[lokalisierung|Lokalisierung]] (l10n) |
|---|---|---|
| Frage | Kann die Software mehrere Sprachen und Regionen? | Passt die Software zu **diesem** Markt? |
| Wer | Entwickler:innen | Übersetzer:innen, Fachleute im Zielmarkt |
| Wann | Einmal, beim Bauen | Für jede neue Sprache |
| Beispiel | Texte in Kataloge auslagern | Den Katalog ins Polnische übersetzen |

Die Zahlen in den Abkürzungen zählen die weggelassenen Buchstaben: **i**-nternationalizatio-**n** hat
18 Buchstaben zwischen i und n. Genauso entsteht l10n aus *localization*.

> [!MERKSATZ]
> i18n baut die Steckdose, l10n steckt den Stecker für ein bestimmtes Land ein. Ohne Steckdose passt kein
> Stecker.

## Was sich je nach Region ändert

Eine [[locale|Locale]] beschreibt Sprache und Region, zum Beispiel `de-DE` oder `fr-CA`. Davon hängt viel
mehr ab als nur die Übersetzung:

| Bereich | Deutschland (`de-DE`) | USA (`en-US`) | Weitere Beispiele |
|---|---|---|---|
| Zahl | 1.234,5 | 1,234.5 | Schweiz: 1'234.5 |
| Preis | 1.234,50 € | $1,234.50 | Japan: ￥1,235 (ohne Nachkommastellen) |
| Datum | 29.03.2026 | 3/29/2026 | ISO: 2026-03-29 |
| Pluralformen | 2 (eins, viele) | 2 | Polnisch: 4, Arabisch: 6 |
| Schreibrichtung | links → rechts | links → rechts | Arabisch, Hebräisch: rechts → links |
| Sortierung | Ä bei A | – | Schwedisch: Ä nach Z |

Dazu kommen [[zeitzone|Zeitzonen]], die [[zeichenkodierung|Zeichenkodierung]] und kulturelle Dinge wie
Anredeformen, Farben oder Adressformate.

## Was in den Code gehört – und was nicht

Die wichtigste Regel der Internationalisierung: **Der Code enthält keine sprach- oder regionsabhängigen
Werte.** Er fragt nach ihnen.

```tsx title="Vorher: Annahmen fest eingebaut"
<p>{"Du hast " + count + " Artikel im Warenkorb – Summe: " + total.toFixed(2) + " €"}</p>
```

```tsx title="Nachher: Code fragt nach Text und Format"
<p>{t("cart.summary", { count, total: formatCurrency(total, "EUR", locale) })}</p>
```

Im zweiten Beispiel kommt der Satz aus einem [[uebersetzungskatalog|Übersetzungskatalog]], die Zahl aus
einem Formatierer. Für eine neue Sprache änderst du nur Daten, keinen Code.

> [!PRAXIS]
> In großen Projekten gibt es einen eigenen Ordner mit Katalogen pro Sprache, etwa `locales/de.json` und
> `locales/en.json`. Pull Requests mit fest eingebauten Texten werden im Review abgelehnt – oft prüft das
> sogar ein Linter automatisch.

## Wann du damit anfängst

Die Antwort ist fast immer: **sofort**. Selbst wenn heute nur Deutsch geplant ist, kostet es wenig, Texte
über eine Funktion wie `t()` zu holen und Zahlen über `Intl` zu formatieren. Du bekommst dabei kostenlos:

- eine zentrale Stelle für alle Texte (Rechtschreibung korrigieren ohne Code-Suche),
- einheitliche Formate in der ganzen App,
- und die Möglichkeit, morgen eine zweite Sprache hinzuzufügen.

Ein Sonderfall sind Sprachen, die von rechts nach links laufen ([[rtl|RTL]]). Wer von Anfang an logische
CSS-Eigenschaften nutzt, spart sich später das Umbauen des ganzen Layouts.

## Zusammenfassung

- **Internationalisierung (i18n)** bereitet Software technisch auf viele Sprachen und Regionen vor.
- **Lokalisierung (l10n)** passt sie an einen konkreten Markt an – vor allem durch Übersetzung.
- Von der Locale hängen Texte, Zahlen, Währungen, Datum, Pluralformen, Schreibrichtung und Sortierung ab.
- Der Code enthält keine sprachabhängigen Werte, sondern holt sie aus Katalogen und Formatierern.
- Zerstückelte Sätze und fest eingebaute Formate sind die häufigsten i18n-Fehler.
- Je früher du i18n einbaust, desto billiger wird es.
