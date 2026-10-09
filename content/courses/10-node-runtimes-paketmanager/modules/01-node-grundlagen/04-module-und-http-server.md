---
title: ES-Module und ein eigener HTTP-Server
summary: Wie du Code mit import und export auf Dateien verteilst, wie sich ESM und CommonJS unterscheiden und wie du mit node:http einen Webserver baust.
duration: 25
sources:
  - title: Node.js API – ECMAScript modules
    url: https://nodejs.org/api/esm.html
  - title: Node.js API – Determining module system
    url: https://nodejs.org/api/packages.html#determining-module-system
  - title: Node.js API – HTTP
    url: https://nodejs.org/api/http.html
  - title: Anatomy of an HTTP Transaction
    url: https://nodejs.org/en/learn/http/anatomy-of-an-http-transaction
quiz:
  - type: single
    question: "Eine Datei heißt `tool.js`, die nächste package.json enthält `\"type\": \"module\"`. Wie behandelt Node.js die Datei?"
    options: ["Als CommonJS", "Als ES-Modul", "Als JSON", "Das hängt von der Node-Version ab"]
    answer: 1
    explanation: "Mit type: module gelten alle .js-Dateien des Pakets als ES-Module. Ohne das Feld (oder mit type: commonjs) wären sie CommonJS."
  - type: find-bug
    question: "In einem Paket mit `\"type\": \"module\"` meldet Node.js `ERR_MODULE_NOT_FOUND`. Welche Zeile ist falsch?"
    language: js
    code: |
      import fs from "node:fs";
      import { formatiere } from "./format";
      const text = fs.readFileSync("daten.txt", "utf8");
      console.log(formatiere(text));
    bug_line: 2
    explanation: In ES-Modulen brauchen relative Importe die Dateiendung, also "./format.js". CommonJS hat sie automatisch ergänzt, ESM tut das nicht.
  - type: match
    question: Ordne den Statuscode seiner Bedeutung zu.
    pairs:
      - { left: "200", right: "OK – alles hat geklappt" }
      - { left: "404", right: "Not Found – unbekannte Adresse" }
      - { left: "500", right: "Internal Server Error – Fehler im Server" }
    explanation: 2xx bedeutet Erfolg, 4xx einen Fehler auf Seite des Clients, 5xx einen Fehler auf Seite des Servers.
  - type: cloze
    text: Einen Server auf Port 3000 startest du mit `server.___(3000)`. Jede Antwort schließt du mit `res.___()` ab.
    blanks:
      - [listen]
      - [end]
    explanation: listen() bindet den Server an einen Port. Ohne res.end() wartet der Client endlos auf die Antwort.
tasks:
  - id: esm-oder-cjs
    type: dragdrop
    title: ESM oder CommonJS?
    description: Ordne jede Zeile dem Modulsystem zu, zu dem sie gehört.
    targets:
      - { id: esm, label: ES-Module (ESM) }
      - { id: cjs, label: CommonJS }
    items:
      - { label: "import fs from \"node:fs\"", target: esm }
      - { label: "export default function start() {}", target: esm }
      - { label: "import.meta.dirname", target: esm }
      - { label: "await auf oberster Ebene", target: esm }
      - { label: "const fs = require(\"node:fs\")", target: cjs }
      - { label: "module.exports = { start }", target: cjs }
      - { label: "__dirname", target: cjs }
      - { label: "Dateiendung .cjs", target: cjs }
    hints:
      - "Alles mit `import`/`export` und `import.meta` ist ESM."
  - id: eigener-server
    type: terminal
    title: Baue deinen eigenen Webserver
    description: |
      Im Ordner `http-server` schreibst du einen Webserver ohne Framework.

      1. Lege die Datei `server.mjs` an.
      2. Der Server lauscht auf dem Port aus der Umgebungsvariablen `PORT` (Standard: `3000`).
      3. `GET /` antwortet mit Status `200` und dem Text `Willkommen bei Stacklab`.
      4. `GET /api/status` antwortet mit Status `200`, dem Header `Content-Type: application/json`
         und JSON wie `{"status":"ok","uptime":12.3}` (`uptime` aus `process.uptime()`).
      5. Jeder andere Pfad antwortet mit Status `404` und JSON `{"fehler":"Nicht gefunden"}`.

      Teste so: `node server.mjs &` startet den Server im Hintergrund, dann
      `curl -i localhost:3000/api/status`. Mit `kill %1` beendest du ihn wieder.
    workdir: http-server
    checks:
      - type: file_exists
        path: server.mjs
        message: Lege die Datei server.mjs an.
      - type: command
        run: |
          PORT=3911 node server.mjs >/dev/null 2>&1 & pid=$!
          sleep 1
          curl -s localhost:3911/
          kill $pid
        stdout_matches: "Willkommen bei Stacklab"
        message: GET / soll den Text "Willkommen bei Stacklab" liefern. Lauscht dein Server auf process.env.PORT?
      - type: command
        run: |
          PORT=3912 node server.mjs >/dev/null 2>&1 & pid=$!
          sleep 1
          curl -s localhost:3912/api/status | jq -r '"\(.status) \(.uptime | type)"'
          kill $pid
        stdout_equals: ok number
        message: GET /api/status soll JSON mit "status" = "ok" und einer Zahl "uptime" liefern.
      - type: command
        run: |
          PORT=3913 node server.mjs >/dev/null 2>&1 & pid=$!
          sleep 1
          curl -s -D - -o /dev/null localhost:3913/api/status | grep -i '^content-type'
          kill $pid
        stdout_matches: "application/json"
        message: "Die Antwort von /api/status braucht den Header Content-Type: application/json."
      - type: command
        run: |
          PORT=3914 node server.mjs >/dev/null 2>&1 & pid=$!
          sleep 1
          echo "$(curl -s -o /dev/null -w '%{http_code}' localhost:3914/gibt-es-nicht) $(curl -s localhost:3914/gibt-es-nicht | jq -r '.fehler')"
          kill $pid
        stdout_equals: 404 Nicht gefunden
        message: Unbekannte Pfade sollen Status 404 und {"fehler":"Nicht gefunden"} liefern.
    hints:
      - "Verzweige im Handler mit `if (req.method === \"GET\" && req.url === \"/\") { … }` und beende jeden Zweig mit `return`."
      - "Für JSON: `res.writeHead(200, { \"Content-Type\": \"application/json\" }); res.end(JSON.stringify(daten));`"
      - "Den Port liest du mit `const port = Number(process.env.PORT ?? 3000);`."
    solution: |
      ```js
      // server.mjs
      import http from "node:http";

      const port = Number(process.env.PORT ?? 3000);

      function sendeJson(res, status, daten) {
        res.writeHead(status, { "Content-Type": "application/json" });
        res.end(JSON.stringify(daten));
      }

      const server = http.createServer((req, res) => {
        if (req.method === "GET" && req.url === "/") {
          res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("Willkommen bei Stacklab");
          return;
        }
        if (req.method === "GET" && req.url === "/api/status") {
          sendeJson(res, 200, { status: "ok", uptime: process.uptime() });
          return;
        }
        sendeJson(res, 404, { fehler: "Nicht gefunden" });
      });

      server.listen(port, () => {
        console.log(`Server läuft auf http://localhost:${port}`);
      });
      ```
---

Kein Projekt besteht aus einer einzigen Datei. Damit Dateien sich gegenseitig nutzen können,
braucht es ein **Modulsystem** – JavaScript hat aus historischen Gründen gleich zwei. Mit diesem
Wissen baust du am Ende einen echten Webserver, ganz ohne Framework.

## ESM und CommonJS

Als Node.js 2009 erschien, hatte JavaScript kein Modulsystem. Node.js erfand deshalb
[[commonjs|CommonJS]] mit `require()`. Seit 2015 hat die Sprache einen offiziellen Standard:
[[es-module|ES-Module]] (ESM) mit `import` und `export`.

| | CommonJS | ES-Module (ESM) |
|---|---|---|
| Importieren | `const x = require("./x.js")` | `import x from "./x.js"` |
| Exportieren | `module.exports = …` | `export …` / `export default …` |
| Im Browser | Nein | Ja |
| Ordner der Datei | `__dirname` | `import.meta.dirname` |
| `await` auf oberster Ebene | Nein | Ja |

Neue Projekte schreibst du in ESM. CommonJS begegnet dir in älteren Projekten und Paketen –
lesen können musst du beides.

```js title="format.js"
export function grossschreiben(text) {
  return text.toUpperCase();
}
export default function preis(betrag) {
  return `${betrag.toFixed(2)} EUR`;
}
```

```js title="main.js"
import preis, { grossschreiben } from "./format.js";
console.log(preis(9.5), grossschreiben("hallo"));   // 9.50 EUR HALLO
```

Benannte Importe stehen in geschweiften Klammern, den Standard-Export (`default`) darfst du frei
benennen.

> [!FEHLER]
> **Dateiendung vergessen.** In ESM brauchen relative Importe die Endung: `"./format.js"`, nicht
> `"./format"`. Sonst meldet Node.js `ERR_MODULE_NOT_FOUND`.

## Welches System gilt?

Node.js entscheidet **pro Datei**:

| Datei | Modulsystem |
|---|---|
| `*.mjs` | immer ESM |
| `*.cjs` | immer CommonJS |
| `*.js` mit `"type": "module"` in der nächsten package.json | ESM |
| `*.js` ohne dieses Feld | CommonJS (bei `import`-Syntax versucht Node.js ESM und warnt) |

Beide Welten arbeiten zusammen: ESM kann CommonJS-Pakete jederzeit importieren, und moderne
Node-Versionen können ESM-Dateien sogar per `require()` laden, solange diese kein `await` auf
oberster Ebene nutzen. Ein Projekt umzustellen heißt meist nur: `type` setzen, `require` durch
`import` ersetzen und Endungen ergänzen.

> [!MERKSATZ]
> Setze in jedem neuen Projekt `"type": "module"` in der [[package-json|package.json]]. Dann sind
> alle `.js`-Dateien ES-Module.

## Ein Server mit node:http

Im Web schickt ein [[client|Client]] einen [[request|Request]] über [[http|HTTP]], der Server
antwortet mit einer [[response|Response]] samt [[statuscode|Statuscode]]. Ein Server lauscht auf
einem [[port|Port]]; während der Entwicklung erreichst du ihn unter [[localhost|localhost]].

```js title="server.mjs"
import http from "node:http";

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/api/status") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ fehler: "Nicht gefunden" }));
});

server.listen(3000);
```

Node.js ruft den Callback **für jede Anfrage** auf. `req` enthält Methode, Pfad und Header,
mit `res` baust du die Antwort. Das `return` verhindert, dass der Code ein zweites Mal antwortet –
sonst kommt `ERR_HTTP_HEADERS_SENT`. `EADDRINUSE` heißt: Auf dem Port läuft schon ein Server.

## Testen mit curl

Im Terminal startest du den Server im Hintergrund und testest ihn mit [[curl|curl]]:

```bash title="Terminal"
node server.mjs &
curl localhost:3000/api/status          # {"status":"ok"}
curl -i localhost:3000/gibt-es-nicht    # -i zeigt Status und Header
kill %1                                 # Hintergrund-Job beenden
```

Das `&` startet den Server als Hintergrund-Job, damit du im selben Terminal weitertippen kannst.
Mit `curl -s … | jq .` bekommst du JSON-Antworten schön formatiert.

> [!PRAXIS]
> Im Alltag nutzt du Frameworks wie Express, Fastify oder Hono. Sie bauen aber genau auf
> `node:http` auf. Wer `req`, `res`, Statuscodes und Header verstanden hat, findet sich in jedem
> Framework sofort zurecht.

## Zusammenfassung

- **ESM** (`import`/`export`) ist der Standard, **CommonJS** (`require`) das ältere Node-System.
- Relative ESM-Importe brauchen die Dateiendung: `"./datei.js"`.
- `.mjs` = ESM, `.cjs` = CommonJS, bei `.js` entscheidet `"type"` in der package.json.
- `http.createServer()` ruft deinen Handler für jede Anfrage mit `req` und `res` auf.
- `res.writeHead()` setzt Status und Header, `res.end()` schließt die Antwort ab.
- Mit `curl` (und `-i` für Header) testest du Server direkt im Terminal.
