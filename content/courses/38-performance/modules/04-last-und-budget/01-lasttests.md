---
title: Lasttests
summary: Wie du mit autocannon prüfst, wie sich ein Server unter vielen gleichzeitigen Anfragen verhält, wie du das Ergebnis liest und welche Fehler Lasttests wertlos machen.
duration: 25
sources:
  - title: autocannon – README und CLI-Optionen
    url: https://github.com/mcollina/autocannon
  - title: Grafana k6 – Load test types
    url: https://grafana.com/docs/k6/latest/testing-guides/test-types/
  - title: Node.js – HTTP
    url: https://nodejs.org/api/http.html
quiz:
  - type: single
    question: "`autocannon -c 50 -d 30 http://localhost:3000/` – was bedeutet `-c 50`?"
    options:
      - 50 Anfragen insgesamt
      - 50 gleichzeitig offene Verbindungen, die immer wieder neue Anfragen schicken
      - 50 Sekunden Testdauer
      - 50 Millisekunden Zeitlimit pro Anfrage
    answer: 1
    explanation: "`-c` (connections) legt die Nebenläufigkeit fest, `-d` (duration) die Dauer in Sekunden. Die Gesamtzahl der Anfragen ergibt sich daraus."
  - type: multiple
    question: Welche Aussagen über Lasttests stimmen?
    options:
      - Steigt die Auslastung Richtung 100 %, wächst die Latenz stark, weil Anfragen warten müssen.
      - Ein Lasttest gegen eine fremde Website ohne Erlaubnis ist in Ordnung, solange er kurz ist.
      - Lasttest und Server auf demselben schwachen Rechner verfälschen das Ergebnis.
      - Das p99 der Latenz sagt mehr über das Verhalten unter Last als der Durchschnitt.
    answers: [0, 2, 3]
    explanation: Ein Lasttest gegen fremde Systeme ist ein Angriff (Denial of Service). Teste nur eigene Systeme oder solche, für die du eine ausdrückliche Erlaubnis hast.
  - type: match
    question: Ordne jede Testart ihrem Ziel zu.
    pairs:
      - { left: "Lasttest", right: "Verhalten bei der erwarteten Spitzenlast" }
      - { left: "Stresstest", right: "Wo und wie bricht das System, wenn die Last weiter steigt?" }
      - { left: "Dauertest (Soak)", right: "Gibt es Speicherlecks oder Verschlechterung über Stunden?" }
      - { left: "Smoke-Test", right: "Läuft das Skript überhaupt – mit minimaler Last?" }
    explanation: Beginne immer mit einem kleinen Smoke-Test, bevor du richtig Last erzeugst.
  - type: cloze
    text: "Mit `autocannon -___` gibt autocannon das Ergebnis als JSON aus. Mit `--on-___` startet es den Server selbst und beendet ihn danach."
    blanks:
      - [j]
      - [port]
    explanation: "`-j`/`--json` macht das Ergebnis maschinenlesbar, `--on-port` erspart dir das Starten und Stoppen des Servers."
tasks:
  - id: erster-lasttest
    type: terminal
    title: Dein erster Lasttest
    description: |
      `server.js` ist eine kleine Node.js-API mit dem Endpunkt `/produkte`. Belaste sie mit autocannon und lies das
      Ergebnis aus.

      Klicke zuerst auf **Aufgabe vorbereiten**. Dann:

      1. Führe einen Lasttest mit **20** Verbindungen und **5** Sekunden Dauer gegen `/produkte` aus. autocannon soll den
         Server selbst starten und das Ergebnis als JSON in `ergebnis.json` schreiben:
         `npx -y autocannon@8 -c 20 -d 5 -j --on-port /produkte -- node server.js > ergebnis.json`
         (beim ersten Mal lädt npx autocannon herunter, das dauert einige Sekunden).
      2. Lies mit `jq` den Median (`.latency.p50`), das p99 (`.latency.p99`) und die durchschnittlichen Anfragen pro
         Sekunde (`.requests.average`) aus.
      3. Schreibe sie in `zusammenfassung.txt` – genau drei Zeilen in dieser Form (mit deinen Zahlen):

         ```text
         p50: 4
         p99: 11
         rps: 4305
         ```
    workdir: erster-lasttest
    setup: |
      cat > server.js <<'EOF'
      const http = require('node:http');

      const products = Array.from({ length: 50 }, (_, i) => ({ id: i + 1, name: `Produkt ${i + 1}`, price: 199 + i * 10 }));

      const server = http.createServer((req, res) => {
        if (req.url !== '/produkte') {
          res.writeHead(404).end();
          return;
        }
        const body = JSON.stringify(products.toSorted((a, b) => b.price - a.price));
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(body);
      });

      server.listen(Number(process.env.PORT ?? 0), () => {
        console.error(`Server läuft auf Port ${server.address().port}`);
      });
      EOF
    checks:
      - type: command
        run: jq -e '.connections == 20' ergebnis.json
        message: ergebnis.json fehlt oder der Test lief nicht mit 20 Verbindungen (-c 20).
      - type: command
        run: jq -e '.duration >= 4.5 and .duration < 10' ergebnis.json
        message: Der Test soll 5 Sekunden dauern (-d 5).
      - type: command
        run: jq -e '(.url | endswith("/produkte")) and .requests.total > 100 and .non2xx == 0 and .errors == 0' ergebnis.json
        message: Der Test soll /produkte ohne Fehler belasten. Prüfe die URL hinter --on-port.
      - type: command
        run: test "$(sed -nE 's/^p50:[[:space:]]*([0-9.]+).*/\1/p' zusammenfassung.txt)" = "$(jq -r .latency.p50 ergebnis.json)"
        message: "Die Zeile `p50: …` in zusammenfassung.txt passt nicht zu .latency.p50 aus ergebnis.json."
      - type: command
        run: test "$(sed -nE 's/^p99:[[:space:]]*([0-9.]+).*/\1/p' zusammenfassung.txt)" = "$(jq -r .latency.p99 ergebnis.json)"
        message: "Die Zeile `p99: …` in zusammenfassung.txt passt nicht zu .latency.p99 aus ergebnis.json."
      - type: command
        run: test "$(sed -nE 's/^rps:[[:space:]]*([0-9.]+).*/\1/p' zusammenfassung.txt)" = "$(jq -r .requests.average ergebnis.json)"
        message: "Die Zeile `rps: …` in zusammenfassung.txt passt nicht zu .requests.average aus ergebnis.json."
    hints:
      - "Bei `--on-port` gibst du statt einer vollständigen URL nur den Pfad an und hängst nach `--` den Startbefehl des Servers an."
      - "`jq -r .latency.p99 ergebnis.json` gibt eine einzelne Zahl aus."
      - "`echo \"p50: $(jq -r .latency.p50 ergebnis.json)\" > zusammenfassung.txt` – die nächsten Zeilen hängst du mit `>>` an."
    solution: |
      ```bash
      npx -y autocannon@8 -c 20 -d 5 -j --on-port /produkte -- node server.js > ergebnis.json
      echo "p50: $(jq -r .latency.p50 ergebnis.json)" > zusammenfassung.txt
      echo "p99: $(jq -r .latency.p99 ergebnis.json)" >> zusammenfassung.txt
      echo "rps: $(jq -r .requests.average ergebnis.json)" >> zusammenfassung.txt
      cat zusammenfassung.txt
      ```
  - id: ergebnis-deuten
    type: steps
    title: Ein Lasttest-Ergebnis deuten
    description: Du testest eine Such-API vor einem großen Marketing-Termin. Das Ziel lautet „p99 unter 300 ms bei 200 gleichzeitigen Nutzer:innen“.
    steps:
      - situation: "Mit 10 Verbindungen: 900 Anfragen/s, p50 = 9 ms, p99 = 25 ms. Mit 50 Verbindungen: 1000 Anfragen/s, p50 = 45 ms, p99 = 120 ms."
        question: Was fällt dir auf?
        options:
          - Der Durchsatz steigt kaum noch, aber die Latenz verfünffacht sich – der Server ist nahe an seiner Grenze.
          - Alles bestens, der Durchsatz ist ja gestiegen.
          - Die Messung ist kaputt, weil der p50 gestiegen ist.
        answer: 0
        explanation: Wenn mehr Verbindungen kaum mehr Durchsatz bringen, warten Anfragen in einer Schlange. Genau das sieht man an der steigenden Latenz.
      - situation: "Mit 200 Verbindungen: 1010 Anfragen/s, p50 = 190 ms, p99 = 2400 ms, 3 % der Antworten mit Status 503."
        question: Ist das Ziel erreicht?
        options:
          - Ja, der Median liegt unter 300 ms.
          - Nein – das p99 liegt weit über 300 ms, und es gibt Fehler.
        answer: 1
        explanation: Das Ziel ist als p99 formuliert. Fehlerantworten sind zusätzlich ein klares Warnsignal – oft sind sie sogar schneller als echte Antworten und schönen die Latenz.
      - situation: Das Profil unter Last zeigt, dass 80 % der Zeit in einer Datenbankabfrage ohne Index stecken.
        question: Was ist der nächste Schritt?
        options:
          - Sofort zehn weitere Server mieten
          - Index anlegen, denselben Lasttest wiederholen und die Zahlen vergleichen
          - Das Ziel auf p50 ändern
        answer: 1
        explanation: Erst den Engpass beheben, dann unter gleichen Bedingungen erneut messen. Mehr Server verstecken das Problem nur und kosten Geld.
---
Dein Endpunkt antwortet in 20 ms – wenn du ihn allein im Browser aufrufst. Was passiert, wenn am Black Friday
500 Menschen gleichzeitig suchen? Das beantwortet kein Benchmark und kein Profiler, sondern nur ein
[[lasttest|Lasttest]].

## Was ein Lasttest misst

Ein Lasttest schickt viele Anfragen gleichzeitig an deinen Server und beobachtet:

| Kennzahl | Frage |
|---|---|
| [[durchsatz|Durchsatz]] | Wie viele Anfragen pro Sekunde schafft er? |
| Latenz (p50, p99) | Wie lange warten Nutzer:innen unter Last? |
| Fehlerrate | Wie viele Anfragen scheitern (Status 5xx, Timeouts)? |

Entscheidend ist der Zusammenhang: Solange der Server Reserven hat, steigt mit mehr
[[nebenlaeufigkeit|gleichzeitigen]] Anfragen der Durchsatz. Nähert er sich seiner Grenze, bleibt der Durchsatz
gleich – und die Latenz schießt nach oben, weil Anfragen in einer Schlange warten.

> [!MERKSATZ]
> Ein Server ist nicht „schnell“ oder „langsam“, sondern bis zu einer bestimmten Last schnell. Der Lasttest findet diese Grenze.

## Testarten

- **Smoke-Test:** minimale Last – läuft das Testskript überhaupt?
- **Lasttest:** die erwartete Spitzenlast, z. B. 200 gleichzeitige Nutzer:innen.
- **Stresstest:** Last immer weiter erhöhen, bis etwas bricht – und beobachten, **wie** es bricht.
- **Dauertest (Soak):** normale Last über Stunden, um Speicherlecks zu finden.

Für komplexe Szenarien mit Login, mehreren Schritten und Lastkurven gibt es Werkzeuge wie
[k6](https://grafana.com/docs/k6/latest/), Gatling oder JMeter. Für einzelne Endpunkte reicht ein schlankes
Kommandozeilenwerkzeug.

## autocannon: Last aus dem Terminal

[[autocannon]] ist ein Lasttest-Werkzeug für Node.js. Du brauchst es nicht zu installieren – [[npx]] lädt es bei Bedarf:

```bash title="Gegen einen laufenden Server"
npx -y autocannon@8 -c 20 -d 10 http://localhost:3000/produkte
```

| Option | Bedeutung |
|---|---|
| `-c 20` | 20 gleichzeitige Verbindungen |
| `-d 10` | 10 Sekunden lang |
| `-a 5000` | alternativ: genau 5000 Anfragen |
| `-j` | Ergebnis als JSON statt Tabelle |
| `-W [ -c 5 -d 3 ]` | Aufwärmphase vor der eigentlichen Messung |
| `--on-port /pfad -- node server.js` | Server selbst starten und danach beenden |

Mit `--on-port` startet autocannon den Server, wartet, bis er lauscht, testet den angegebenen Pfad und beendet ihn
wieder. So bleibt kein Server im Hintergrund hängen.

## Das Ergebnis lesen

```bash title="Ergebnis als JSON auswerten"
npx -y autocannon@8 -c 20 -d 5 -j --on-port /produkte -- node server.js > ergebnis.json
jq '{p50: .latency.p50, p99: .latency.p99, rps: .requests.average, fehler: .non2xx}' ergebnis.json
```

Achte auf vier Dinge:

1. **p99**, nicht den Durchschnitt – er zeigt die Wartezeit der Pechvögel.
2. **`non2xx` und `errors`** – Fehlerantworten sind oft schneller als echte und schönen die Latenz.
3. **Durchsatz im Verhältnis zur Last** – wächst er nicht mehr, ist die Grenze erreicht.
4. **Die Umgebung** – laufen Lastgenerator und Server auf demselben Rechner, konkurrieren sie um die CPU.

> [!FEHLER]
> Einen Lasttest gegen eine fremde Website oder die Produktion ohne Absprache zu fahren, ist kein Test, sondern ein
> Angriff. Teste nur eigene Systeme oder solche, für die du eine schriftliche Erlaubnis hast – am besten eine
> Testumgebung, die der Produktion ähnelt.

> [!PRAXIS]
> Vor großen Releases oder Marketing-Aktionen fahren viele Teams einen Lasttest mit klaren Zielen wie „p99 unter
> 300 ms bei 200 gleichzeitigen Nutzer:innen, Fehlerrate unter 0,1 %“. Wer das Ziel vorher festlegt, kann das
> Ergebnis nicht nachträglich schönreden.

## Zusammenfassung

- Ein **Lasttest** zeigt Durchsatz, Latenz und Fehlerrate unter vielen gleichzeitigen Anfragen.
- Nahe der Grenze stagniert der Durchsatz und die Latenz steigt stark.
- Testarten: Smoke-, Last-, Stress- und Dauertest.
- `npx -y autocannon@8 -c 20 -d 5 -j --on-port /pfad -- node server.js` testet einen Node-Server reproduzierbar.
- Bewerte **p99** und **Fehler**, lege Ziele vorher fest und teste nur Systeme, für die du eine Erlaubnis hast.
