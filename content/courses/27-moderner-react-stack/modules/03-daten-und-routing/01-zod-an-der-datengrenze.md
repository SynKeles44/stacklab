---
title: Zod an der Datengrenze
summary: API-Antworten mit Zod-Schemas prüfen, Typen mit z.infer ableiten, parse und safeParse richtig einsetzen und Fehler lesbar machen.
duration: 20
sources:
  - title: Zod – Basic usage
    url: https://zod.dev/basics
  - title: Zod – Defining schemas
    url: https://zod.dev/api
  - title: Zod – Formatting errors
    url: https://zod.dev/error-formatting
  - title: Zod – Customizing errors
    url: https://zod.dev/error-customization
quiz:
  - type: single
    question: Was ist der Unterschied zwischen `schema.parse(data)` und `schema.safeParse(data)`?
    options:
      - parse prüft gründlicher als safeParse.
      - parse wirft bei ungültigen Daten einen Fehler, safeParse gibt ein Objekt mit `success` und entweder `data` oder `error` zurück.
      - safeParse ändert die Daten nicht, parse schon.
      - Es gibt keinen Unterschied, safeParse ist nur der neuere Name.
    answer: 1
    explanation: >
      Beide prüfen gleich streng. `parse` passt, wenn ungültige Daten ein echter Fehler sind (kaputte API-Antwort).
      `safeParse` passt, wenn ungültige Daten erwartbar sind und du sie behandeln willst (Formulareingaben).
  - type: multiple
    question: Welche Aussagen über `type User = z.infer<typeof UserSchema>` stimmen?
    options:
      - Der Typ wird aus dem Schema abgeleitet – du schreibst die Felder nur einmal.
      - Ändert sich das Schema, ändert sich der Typ automatisch mit.
      - z.infer prüft die Daten zur Laufzeit.
      - Nach dem Build ist der Typ verschwunden, das Schema aber nicht.
    answers: [0, 1, 3]
    explanation: >
      `z.infer` ist reine TypeScript-Magie zur Compile-Zeit. Geprüft wird erst, wenn du `parse` oder `safeParse`
      aufrufst – das Schema ist echter JavaScript-Code und bleibt im Bundle.
  - type: match
    question: Ordne jedem Schema die Eingabe zu, die es akzeptiert.
    pairs:
      - { left: "z.int().positive()", right: "42" }
      - { left: "z.email()", right: "\"ada@example.com\"" }
      - { left: "z.enum(['admin', 'member'])", right: "\"member\"" }
      - { left: "z.iso.datetime()", right: "\"2026-10-01T09:30:00Z\"" }
      - { left: "z.string().nullable()", right: "null" }
    explanation: In Zod 4 sind viele Formate eigene Schemas auf oberster Ebene, z. B. `z.email()`, `z.url()` oder `z.int()`.
  - type: find-bug
    question: Die Seite stürzt ab, obwohl ein Schema existiert. Welche Zeile ist das Problem?
    language: ts
    code: |
      const BookSchema = z.object({ id: z.string(), title: z.string() })
      type Book = z.infer<typeof BookSchema>

      async function loadBook(id: string): Promise<Book> {
        const response = await fetch(`/api/books/${id}`)
        const json = await response.json()
        return json as Book
      }
    bug_line: 7
    explanation: "`as Book` behauptet nur, dass die Daten passen – geprüft wird nichts. Richtig ist `return BookSchema.parse(json)`."
tasks:
  - id: api-schema
    type: terminal
    title: Ein Schema für die Nutzer-API
    description: |
      Im Ordner `api-schema` liegt ein kleines Bun-Projekt mit installiertem Zod. In `data/` liegen zwei
      Beispielantworten einer API: `users-ok.json` ist korrekt, `users-kaputt.json` enthält Fehler.

      1. Lege `src/schemas.ts` an und exportiere `UserSchema` mit den Feldern
         - `id`: positive ganze Zahl,
         - `name`: Text mit mindestens einem Zeichen,
         - `email`: E-Mail-Adresse,
         - `role`: entweder `"admin"` oder `"member"`,
         - `createdAt`: ISO-Zeitstempel (`z.iso.datetime()`).
      2. Exportiere `UserListSchema` (ein Array von Usern) und den Typ `User` über `z.infer`.
      3. Exportiere eine Funktion `parseUsers(input: unknown): User[]`, die `UserListSchema.parse` benutzt.
      4. Schreibe `src/main.ts`, die beide Dateien liest (`await Bun.file('data/users-ok.json').json()`), jeweils
         `UserListSchema.safeParse` aufruft und bei Fehlern `z.prettifyError(result.error)` ausgibt.
         Starte sie mit `bun src/main.ts` und lies, was an der kaputten Datei falsch ist.

      Klicke zuerst auf **Aufgabe vorbereiten**.
    workdir: api-schema
    setup: |
      printf '{\n  "name": "api-schema",\n  "private": true,\n  "type": "module"\n}\n' > package.json
      bun add zod >/dev/null 2>&1
      mkdir -p data src
      cat > data/users-ok.json <<'EOF'
      [
        { "id": 1, "name": "Ada", "email": "ada@example.com", "role": "admin", "createdAt": "2026-09-01T08:00:00Z" },
        { "id": 2, "name": "Linus", "email": "linus@example.com", "role": "member", "createdAt": "2026-09-14T17:45:00Z" }
      ]
      EOF
      cat > data/users-kaputt.json <<'EOF'
      [
        { "id": 1, "name": "Ada", "email": "ada@example.com", "role": "admin", "createdAt": "2026-09-01T08:00:00Z" },
        { "id": "3", "name": "", "email": "keine-mail", "role": "owner", "createdAt": "gestern" }
      ]
      EOF
    checks:
      - type: file_contains
        path: src/schemas.ts
        pattern: "export\\s+const\\s+UserSchema\\s*=\\s*z\\.object\\("
        message: In src/schemas.ts fehlt export const UserSchema = z.object(…).
      - type: file_contains
        path: src/schemas.ts
        pattern: "export\\s+type\\s+User\\s*=\\s*z\\.infer<\\s*typeof\\s+UserSchema\\s*>"
        message: Exportiere den Typ mit export type User = z.infer<typeof UserSchema>.
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX")
          cat > "$d/t.ts" <<'EOF'
          import { parseUsers, UserListSchema } from '../src/schemas.ts'
          const ok = await Bun.file('data/users-ok.json').json()
          const users = parseUsers(ok)
          if (users.length !== 2 || users[1].role !== 'member') throw new Error('ok-Datei falsch geparst')
          const bad = await Bun.file('data/users-kaputt.json').json()
          const result = UserListSchema.safeParse(bad)
          if (result.success) throw new Error('kaputte Datei wurde akzeptiert')
          const paths = result.error.issues.map((issue) => issue.path.join('.')).sort().join(',')
          console.log(paths)
          EOF
          bun "$d/t.ts"; status=$?; rm -rf "$d"; exit $status
        stdout_equals: "1.createdAt,1.email,1.id,1.name,1.role"
        message: Das Schema erkennt nicht genau die fünf Fehler im zweiten Eintrag der kaputten Datei (id, name, email, role, createdAt) – oder parseUsers/UserListSchema fehlen. Prüfe jedes Feld.
      - type: command
        run: |
          d=$(mktemp -d "$PWD/.pruefung-XXXXXX")
          cat > "$d/t.ts" <<'EOF'
          import { parseUsers } from '../src/schemas.ts'
          try { parseUsers([{ id: 1 }]); console.log('kein Fehler') } catch { console.log('wirft') }
          EOF
          bun "$d/t.ts"; status=$?; rm -rf "$d"; exit $status
        stdout_equals: "wirft"
        message: parseUsers soll bei ungültigen Daten einen Fehler werfen – benutze UserListSchema.parse, nicht safeParse.
      - type: file_contains
        path: src/main.ts
        pattern: "safeParse\\("
        message: src/main.ts soll safeParse benutzen.
      - type: command
        run: bun src/main.ts 2>&1 | grep -c "role"
        stdout_matches: "^[1-9]"
        message: bun src/main.ts gibt die Fehler der kaputten Datei noch nicht aus. Nutze z.prettifyError(result.error).
    hints:
      - "Zod 4: `z.int().positive()`, `z.string().min(1)`, `z.email()`, `z.enum(['admin', 'member'])`, `z.iso.datetime()`."
      - "`export const UserListSchema = z.array(UserSchema)` und `export function parseUsers(input: unknown): User[] { return UserListSchema.parse(input) }`"
      - "In main.ts: `const result = UserListSchema.safeParse(json); if (!result.success) console.log(z.prettifyError(result.error))`"
    solution: |
      ```bash
      cd api-schema
      cat > src/schemas.ts <<'EOF'
      import { z } from 'zod'

      export const UserSchema = z.object({
        id: z.int().positive(),
        name: z.string().min(1),
        email: z.email(),
        role: z.enum(['admin', 'member']),
        createdAt: z.iso.datetime(),
      })

      export const UserListSchema = z.array(UserSchema)

      export type User = z.infer<typeof UserSchema>

      export function parseUsers(input: unknown): User[] {
        return UserListSchema.parse(input)
      }
      EOF
      cat > src/main.ts <<'EOF'
      import { z } from 'zod'
      import { UserListSchema } from './schemas.ts'

      for (const file of ['data/users-ok.json', 'data/users-kaputt.json']) {
        const json: unknown = await Bun.file(file).json()
        const result = UserListSchema.safeParse(json)
        if (result.success) {
          console.log(`${file}: ${result.data.length} gültige Nutzer`)
        } else {
          console.log(`${file} ist ungültig:`)
          console.log(z.prettifyError(result.error))
        }
      }
      EOF
      bun src/main.ts
      ```
  - id: parse-oder-safeparse
    type: steps
    title: parse oder safeParse?
    description: Entscheide in jeder Situation, welche Prüfung passt.
    steps:
      - situation: Ein Loader holt die Bücherliste von der eigenen API. Kommt etwas anderes zurück als erwartet, ist das ein Fehler im System.
        question: Was benutzt du?
        options:
          - "`BookListSchema.parse(json)` – ein Fehler soll laut werden und in der ErrorBoundary landen"
          - "`BookListSchema.safeParse(json)` und bei Fehlern eine leere Liste anzeigen"
        answer: 0
        explanation: Stille Ersatzwerte verstecken echte Fehler. `parse` wirft, der Router zeigt die Fehlerseite, und im Log steht genau, welches Feld nicht stimmte.
      - situation: Ein Formular schickt Titel, Autor:in und E-Mail-Adresse. Dass jemand ein Feld vergisst, passiert ständig.
        question: Was benutzt du?
        options:
          - "`parse` – die Seite soll abstürzen"
          - "`safeParse` – bei Fehlern zeigst du die Meldungen am jeweiligen Feld an"
        answer: 1
        explanation: Ungültige Eingaben sind hier normal. `safeParse` liefert die Fehlerliste, ohne zu werfen, und du gibst sie an das Formular zurück.
      - situation: Beim App-Start liest du `import.meta.env` und brauchst `VITE_API_URL`. Fehlt sie, kann die App nicht arbeiten.
        question: Was benutzt du?
        options:
          - "`parse` – lieber sofort beim Start scheitern als später mit undefined arbeiten"
          - Gar keine Prüfung – Umgebungsvariablen sind immer gesetzt
        answer: 0
        explanation: Eine fehlende Konfiguration soll sofort und deutlich auffallen. Das schauen wir uns in Modul 4 genauer an.
---
TypeScript gibt dir ein gutes Gefühl: Jede Variable hat einen Typ, jeder Tippfehler fällt auf. Aber was passiert,
wenn die API um drei Uhr nachts plötzlich `"id": "3"` statt `"id": 3` schickt? TypeScript ist dann längst nicht mehr
da – nach dem Build sind alle Typen verschwunden. Genau an dieser Stelle steht [[zod|Zod]] Wache.

## Warum die Datengrenze gefährlich ist

Alles, was dein Code nicht selbst erzeugt, kommt über eine **Datengrenze**: API-Antworten, Formulareingaben,
URL-Parameter, `localStorage`, Umgebungsvariablen. TypeScript kann diese Daten nicht sehen.

```ts
const response = await fetch('/api/users')
const users = (await response.json()) as User[]   // eine Behauptung, keine Prüfung
```

`as User[]` sagt dem Compiler nur „glaub mir“. Stimmen die Daten nicht, knallt es irgendwo später – in einer
Komponente, die mit der API nichts zu tun hat.

> [!MERKSATZ]
> TypeScript prüft deinen Code, Zod prüft die Welt. An jeder Datengrenze gehört eine
> [[laufzeitvalidierung|Laufzeitprüfung]] hin.

## Ein Schema – und der Typ gleich mit

Ein Zod-Schema beschreibt, wie Daten aussehen müssen. Den TypeScript-Typ leitest du daraus ab:

```ts title="src/lib/schemas.ts"
import { z } from 'zod'

export const UserSchema = z.object({
  id: z.int().positive(),
  name: z.string().min(1),
  email: z.email(),
  role: z.enum(['admin', 'member']),
  createdAt: z.iso.datetime(),
  avatarUrl: z.url().nullable(),
})

export const UserListSchema = z.array(UserSchema)

export type User = z.infer<typeof UserSchema>
```

Mit [[z-infer|z.infer]] schreibst du jedes Feld nur **einmal**. Kommt ein Feld hinzu, ändern sich Prüfung und Typ
gemeinsam – sie können nicht auseinanderlaufen.

| Zod 4 | prüft |
|---|---|
| `z.string().min(1)` | nicht leerer Text |
| `z.int()`, `z.number().positive()` | ganze Zahl, positive Zahl |
| `z.email()`, `z.url()`, `z.iso.datetime()` | Formate (in Zod 4 eigene Schemas) |
| `z.enum([...])` | genau einer der Werte |
| `.optional()`, `.nullable()`, `.default(x)` | darf fehlen, darf `null` sein, Standardwert |

## parse oder safeParse

```ts
const users = UserListSchema.parse(json)       // wirft bei Fehlern

const result = UserListSchema.safeParse(json)  // wirft nie
if (result.success) {
  console.log(result.data)                      // Typ: User[]
} else {
  console.log(result.error.issues)              // Liste aller Probleme
}
```

- **[[safe-parse|safeParse]]** nimmst du, wenn ungültige Daten **erwartbar** sind – vor allem bei Formularen.
- **parse** nimmst du, wenn ungültige Daten ein **Fehler im System** sind – etwa eine kaputte API-Antwort. Der Fehler
  soll laut werden, nicht still verschluckt.

Zod liefert immer **alle** Probleme auf einmal, nicht nur das erste – jedes mit `path` (z. B. `[1, 'email']`) und
einer Meldung.

Noch etwas macht ein Schema wertvoll: `parse` gibt **neue**, bereinigte Daten zurück. Felder, die das Schema nicht
kennt, entfernt `z.object` standardmäßig, und Standardwerte aus `.default()` sind bereits eingesetzt. Arbeite deshalb
immer mit dem Rückgabewert weiter, nicht mit dem ursprünglichen JSON.

> [!FEHLER]
> **Bei Fehlern still Ersatzwerte liefern.** `safeParse` und dann `return []` sieht freundlich aus, versteckt aber
> einen echten Fehler: Die Seite zeigt „keine Bücher“, und niemand merkt, dass die API kaputt ist.

## Fehler lesbar machen und Daten umformen

Für Menschen gibt es zwei Helfer:

```ts
z.prettifyError(result.error)
// ✖ Invalid input: expected number, received string
//   → at [1].id

z.flattenError(result.error).fieldErrors
// { email: ['Bitte gib eine gültige E-Mail-Adresse an.'], … }
```

`prettifyError` eignet sich für Logs, `flattenError` für Formulare (nächste Lektionen). Eigene Meldungen gibst du
mit `error` an: `z.string().min(2, { error: 'Mindestens 2 Zeichen.' })`.

Zod kann Daten beim Prüfen auch umformen: `z.coerce.number()` macht aus `"42"` die Zahl 42 – nützlich für
URL-Parameter und Formulare, die immer Text liefern. `.transform()` wandelt einen gültigen Wert weiter um.

> [!PRAXIS]
> In vielen Teams gilt die Regel: **Jede** API-Antwort läuft durch ein Zod-Schema, bevor sie eine Komponente
> erreicht. Die Schemas liegen gesammelt, etwa in `src/lib/api`, und die Typen werden nur aus ihnen abgeleitet.

## Zusammenfassung

- An jeder Datengrenze (API, Formular, URL, Umgebung) prüft Zod zur Laufzeit.
- `z.infer<typeof Schema>` leitet den Typ aus dem Schema ab – Felder stehen nur einmal im Code.
- `parse` wirft bei Fehlern, `safeParse` liefert `{ success, data | error }`.
- Kaputte API-Antworten sollen laut scheitern, Formularfehler werden angezeigt.
- `z.prettifyError` für Logs, `z.flattenError` für Formulare, `error` für eigene Meldungen.
