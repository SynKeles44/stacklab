---
title: Binärzahlen und die Netzmaske
summary: Wie aus acht Bits ein Oktett wird und wie ein Gerät mit Netzmaske und bitweisem UND entscheidet, ob ein Ziel im eigenen Netz liegt.
duration: 25
sources:
  - title: RFC 4632 – CIDR, Abschnitt Address Masks
    url: https://www.rfc-editor.org/rfc/rfc4632
  - title: MDN – Number.prototype.toString() mit Basis
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toString
  - title: MDN – Bitweises UND (&)
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_AND
quiz:
  - type: single
    question: Welcher Dezimalzahl entspricht das Oktett `11000000`?
    options: ["128", "192", "224", "96"]
    answer: 1
    explanation: Die beiden linken Bits haben die Stellenwerte 128 und 64. 128 + 64 = 192.
  - type: match
    question: Ordne jedem Oktett seinen Dezimalwert zu.
    pairs:
      - { left: "11111111", right: "255" }
      - { left: "10000000", right: "128" }
      - { left: "00001010", right: "10" }
      - { left: "11111100", right: "252" }
    explanation: Addiere die Stellenwerte aller Einsen. 11111100 = 128+64+32+16+8+4 = 252.
  - type: single
    question: "Die Adresse `192.168.40.77` hat die Netzmaske `255.255.255.0`. Wie lautet die Netzadresse?"
    options: ["192.168.0.0", "192.168.40.0", "192.168.40.77", "192.168.40.255"]
    answer: 1
    explanation: Wo die Maske 255 ist, bleibt das Oktett erhalten, wo sie 0 ist, wird es 0.
  - type: multiple
    question: Welche dieser Netzmasken sind gültig?
    options: ["255.255.255.0", "255.255.240.0", "255.0.255.0", "255.255.255.192", "255.255.253.0"]
    answers: [0, 1, 3]
    explanation: Eine gültige Maske hat links nur Einsen und rechts nur Nullen. 255.0.255.0 hat eine Lücke, 253 ist binär 11111101 – auch eine Lücke.
  - type: find-bug
    question: Diese Funktion soll eine Zahl als 8-stelligen Binärtext zurückgeben. In welcher Zeile steckt der Fehler?
    language: js
    code: |
      function toOctet(n) {
        const bits = n.toString(2)
        return bits.padEnd(8, '0')
      }
    bug_line: 3
    explanation: "Fehlende Nullen gehören nach **links**. Aus 10 (`1010`) würde sonst `10100000` = 160. Richtig ist `padStart(8, '0')`."
tasks:
  - id: oktett-umrechner
    type: code
    language: js
    title: Oktette umrechnen
    description: |
      Schreibe zwei Funktionen:

      1. `toBinaryOctet(n)` – bekommt eine Zahl von 0 bis 255 und gibt genau acht Binärziffern als
         Text zurück, z. B. `toBinaryOctet(10)` → `"00001010"`.
      2. `fromBinaryOctet(bits)` – bekommt genau acht Zeichen `0`/`1` und gibt die Dezimalzahl zurück,
         z. B. `fromBinaryOctet("11000000")` → `192`.

      Bei Zahlen außerhalb von 0–255 bzw. Text, der nicht aus genau acht Nullen und Einsen besteht,
      wirft die jeweilige Funktion einen Fehler (`throw new Error(...)`).
    starter: |
      function toBinaryOctet(n) {
        // Prüfen, dann umrechnen und auf 8 Stellen auffüllen
      }

      function fromBinaryOctet(bits) {
        // Prüfen, dann umrechnen (parseInt mit Basis 2)
      }
    tests:
      - name: wandelt 10 in 00001010 um
        code: assertEqual(toBinaryOctet(10), '00001010')
      - name: kennt die Randwerte 0 und 255
        code: |
          assertEqual(toBinaryOctet(0), '00000000')
          assertEqual(toBinaryOctet(255), '11111111')
      - name: wandelt 11000000 in 192 um
        code: assertEqual(fromBinaryOctet('11000000'), 192)
      - name: Hin- und Rückweg ergeben wieder die Zahl
        code: |
          for (const n of [1, 42, 127, 128, 200, 254]) {
            assertEqual(fromBinaryOctet(toBinaryOctet(n)), n)
          }
      - name: wirft bei ungültigen Eingaben
        code: |
          assertThrows(() => toBinaryOctet(256))
          assertThrows(() => toBinaryOctet(-1))
          assertThrows(() => fromBinaryOctet('1010'))
          assertThrows(() => fromBinaryOctet('10102010'))
    hints:
      - "`n.toString(2)` liefert die Binärdarstellung ohne führende Nullen."
      - "`'101'.padStart(8, '0')` füllt links mit Nullen auf."
      - "`/^[01]{8}$/.test(bits)` prüft auf genau acht Nullen und Einsen, `parseInt(bits, 2)` rechnet zurück."
    solution: |
      ```js
      function toBinaryOctet(n) {
        if (!Number.isInteger(n) || n < 0 || n > 255) throw new Error('Kein gültiges Oktett: ' + n)
        return n.toString(2).padStart(8, '0')
      }

      function fromBinaryOctet(bits) {
        if (!/^[01]{8}$/.test(bits)) throw new Error('Keine 8 Bit: ' + bits)
        return parseInt(bits, 2)
      }
      ```
  - id: selbes-netz-zuordnen
    type: dragdrop
    title: Direkt zustellen oder zum Router?
    description: |
      Dein Laptop hat die Adresse `192.168.178.23` mit der Maske `255.255.255.0`. Liegt ein Ziel im
      eigenen Netz, schickt er das Paket **direkt**, sonst an den **Router** (Gateway). Ordne die Ziele zu.
    targets:
      - { id: direkt, label: Direkt im eigenen Netz }
      - { id: router, label: Über den Router }
    items:
      - { label: "192.168.178.1", target: direkt }
      - { label: "192.168.178.254", target: direkt }
      - { label: "192.168.178.99", target: direkt }
      - { label: "192.168.179.23", target: router }
      - { label: "192.168.1.23", target: router }
      - { label: "203.0.113.80", target: router }
    hints:
      - Bei der Maske 255.255.255.0 müssen die ersten drei Oktette übereinstimmen.
---

Fast jede Frage rund um Netze – „Gehört diese Adresse in mein Netz?“, „Wie viele Server passen in dieses
Subnetz?“ – wird auf Bit-Ebene beantwortet. Wer das einmal verstanden hat, rechnet Netze im Kopf aus,
statt Online-Rechner zu raten.

## Binärzahlen und Oktette

Im [[binaersystem|Binärsystem]] gibt es nur die Ziffern 0 und 1, jede Stelle ist doppelt so viel wert
wie die rechts daneben. Eine Binärziffer heißt [[bit|Bit]], acht Bit sind ein [[byte|Byte]] – in der
Netzwerkwelt sagt man [[oktett|Oktett]]. Für ein Oktett musst du dir nur eine Zeile merken:

| Bit | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| Stellenwert | 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |

Zum Lesen addierst du die Stellenwerte aller Einsen: `10101100` = 128 + 32 + 8 + 4 = **172**. Alle
Einsen ergeben 255, alle Nullen 0 – das sind die 256 möglichen Werte eines Oktetts.

Für den Rückweg fragst du von links nach rechts: „Passt der Stellenwert noch in meinen Rest?“

```text
172: 128 ja (Rest 44) · 64 nein · 32 ja (Rest 12) · 16 nein · 8 ja (Rest 4) · 4 ja · 2 nein · 1 nein
→ 10101100
```

> [!MERKSATZ]
> Die Stellenwerte eines Oktetts sind 128, 64, 32, 16, 8, 4, 2, 1. Eine IPv4-Adresse sind vier
> Oktette, also 32 Bit – die Punkte gibt es nur für uns Menschen.

## Umrechnen mit JavaScript

```js run
console.log((172).toString(2))                  // "10101100"
console.log((10).toString(2).padStart(8, '0'))  // "00001010"
console.log(parseInt('11000000', 2))            // 192
```

`toString(2)` liefert die Binärdarstellung, `parseInt(text, 2)` liest sie zurück, `padStart(8, '0')`
füllt links auf acht Stellen auf.

> [!FEHLER]
> **Führende Nullen vergessen.** `(10).toString(2)` liefert nur `1010`. Hängst du vier solche Texte
> aneinander, stimmen die Bit-Positionen nicht mehr. Fülle ein Oktett immer **links** auf
> (`padStart`, nicht `padEnd`).

## Die Netzmaske: Netzanteil und Hostanteil

Jede Adresse hat einen **Netzanteil** (die „Straße“) und einen **Hostanteil** (die „Hausnummer“). Wo
die Grenze liegt, sagt die [[netzmaske|Netzmaske]] – eine Schablone aus 32 Bit: Einsen markieren den
Netzanteil, Nullen den Hostanteil.

```text
Adresse:  192.168.178.23  = 11000000.10101000.10110010.00010111
Maske:    255.255.255.0   = 11111111.11111111.11111111.00000000
```

![Netz- und Hostanteil einer IPv4-Adresse mit Netzmaske](/assets/netzwerk-grundlagen/netz-und-hostanteil.svg)

Gültige Masken haben links nur Einsen und rechts nur Nullen – ohne Lücken. Ein Oktett einer Maske kann
deshalb nur 0, 128, 192, 224, 240, 248, 252, 254 oder 255 sein. Alle Geräte mit gleichem Netzanteil
liegen im selben [[subnetz|Subnetz]].

## Das bitweise UND: direkt oder über den Router?

Ein Gerät wendet die Maske mit einem **bitweisen UND** an: Nur wo Adresse **und** Maske eine 1 haben,
bleibt eine 1. Übrig bleibt die [[netzadresse|Netzadresse]]:

```text
  11000000.10101000.10110010.00010111   192.168.178.23
& 11111111.11111111.11111111.00000000   255.255.255.0
= 11000000.10101000.10110010.00000000   192.168.178.0
```

Dasselbe rechnet der Laptop für das Ziel – mit seiner eigenen Maske. Ist die Netzadresse gleich,
stellt er das Paket direkt zu. Sonst geht es an das Standard-Gateway, meist den Router.

| Ziel | Netzadresse (Maske /24) | Entscheidung |
|---|---|---|
| `192.168.178.40` | `192.168.178.0` | gleich → direkt |
| `203.0.113.80` | `203.0.113.0` | anders → Router |

In JavaScript gibt es dafür `&`. Weil JavaScript dabei mit vorzeichenbehafteten 32-Bit-Zahlen rechnet,
hängst du `>>> 0` an: `(ip & mask) >>> 0` – sonst werden Adressen ab 128.0.0.0 negativ.

> [!PRAXIS]
> Die Meldung „Gateway liegt nicht im Subnetz“ in Server- oder Cloud-Konsolen ist genau diese Rechnung.
> Trägst du eine statische Adresse ein, prüfe: Liegen Adresse und Gateway nach Anwendung der Maske im
> selben Netz?

## Zusammenfassung

- Ein Oktett hat 8 Bit mit den Stellenwerten 128 bis 1 und Werte von 0 bis 255.
- In JavaScript: `toString(2)`, `parseInt(text, 2)` und **immer** `padStart(8, '0')`.
- Die **Netzmaske** trennt Netzanteil (Einsen) und Hostanteil (Nullen), ohne Lücken.
- Adresse **UND** Maske ergibt die **Netzadresse**; gleiche Netzadresse heißt gleiches Subnetz.
- Ziele im eigenen Subnetz werden direkt erreicht, alle anderen über das Gateway.
