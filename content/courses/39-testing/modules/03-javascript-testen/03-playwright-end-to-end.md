---
title: End-to-End-Tests mit Playwright
summary: Du richtest Playwright ein, findest Elemente mit Locators, nutzt Auto-Waiting und Web-First-Assertions und liest Berichte und Traces.
duration: 25
sources:
  - title: Playwright – Installation
    url: https://playwright.dev/docs/intro
  - title: Playwright – Writing Tests
    url: https://playwright.dev/docs/writing-tests
  - title: Playwright – Locators
    url: https://playwright.dev/docs/locators
  - title: Playwright – Assertions
    url: https://playwright.dev/docs/test-assertions
  - title: Playwright – Command Line
    url: https://playwright.dev/docs/test-cli
  - title: Playwright – Trace Viewer
    url: https://playwright.dev/docs/trace-viewer
quiz:
  - type: single
    question: Welcher Locator ist für einen Button „Bestellen“ am robustesten?
    options:
      - "page.locator('#app > div:nth-child(3) > button')"
      - "page.getByRole('button', { name: 'Bestellen' })"
      - "page.locator('.btn-primary')"
    answer: 1
    explanation: "`getByRole` sucht so, wie Nutzer und Screenreader die Seite wahrnehmen. Ändert sich das Layout oder eine CSS-Klasse, findet er den Button trotzdem."
  - type: find-bug
    question: Der Test ist wackelig – manchmal rot, manchmal grün. In welcher Zeile steckt die Ursache?
    language: ts
    code: |
      test('zeigt die Bestätigung', async ({ page }) => {
        await page.goto('/checkout')
        await page.getByRole('button', { name: 'Bestellen' }).click()
        await page.waitForTimeout(1000)
        expect(await page.getByRole('alert').textContent()).toBe('Danke!')
      })
    bug_line: 4
    explanation: "Eine feste Wartezeit ist mal zu kurz, mal unnötig lang. Besser: Die Web-First-Assertion `await expect(page.getByRole('alert')).toHaveText('Danke!')` wartet automatisch, bis der Text da ist (Zeile 5 zeigt das zweite Problem: Sie liest den Text nur einmal)."
  - type: match
    question: Welcher Befehl tut was?
    pairs:
      - { left: "npx playwright test", right: "Alle Tests headless ausführen" }
      - { left: "npx playwright test --ui", right: "Interaktiver UI-Modus mit Zeitreise" }
      - { left: "npx playwright show-report", right: "HTML-Bericht des letzten Laufs öffnen" }
      - { left: "npx playwright codegen", right: "Klicks im Browser aufzeichnen und Code erzeugen" }
    explanation: Im Alltag nutzt du vor allem `test`, beim Schreiben `--ui` oder `codegen` und nach einem roten CI-Lauf den Bericht samt Trace.
  - type: multiple
    question: Was erledigt Playwrights Auto-Waiting vor einem `click()` für dich?
    options:
      - Es wartet, bis das Element sichtbar ist.
      - Es wartet, bis das Element nicht mehr verdeckt und aktiviert ist.
      - Es wartet immer genau eine Sekunde.
      - Es wartet, bis das Element ruhig steht (keine Animation).
    answers: [0, 1, 3]
    explanation: Playwright prüft vor jeder Aktion, ob das Element bereit ist (Actionability Checks) – bis zum Timeout. Feste Wartezeiten sind deshalb fast nie nötig.
tasks:
  - id: playwright-login-spec
    type: terminal
    title: Schreibe End-to-End-Tests für das Login
    description: |
      Im Ordner `playwright-start` liegt ein Projekt mit `@playwright/test` und einer fertigen
      `playwright.config.ts` (`testDir: './e2e'`, `baseURL: 'http://localhost:4173'`).

      Browser lassen sich im Übungs-Terminal nicht herunterladen. Deshalb prüfst du deine Tests mit
      `npx playwright test --list`: Playwright lädt dabei jede Datei und zeigt alle gefundenen Tests –
      ohne Browser zu starten. Syntaxfehler fallen trotzdem auf.

      1. Lege `e2e/login.spec.ts` an.
      2. Schreibe darin einen `test.describe('Login', …)` mit **mindestens zwei** Tests:
         - Falsches Passwort: Seite `/login` öffnen, Felder über `getByLabel('E-Mail')` und
           `getByLabel('Passwort')` füllen, Button „Anmelden“ über `getByRole` klicken, dann prüfen, dass
           `getByRole('alert')` den Text „Login fehlgeschlagen“ hat.
         - Erfolgreicher Login: danach soll die URL auf `/dashboard` enden (`toHaveURL`).
      3. Nutze **keine** festen Wartezeiten (`waitForTimeout`) – nur Web-First-Assertions mit `await expect(...)`.
      4. Prüfe mit `npx playwright test --list`.

      Klicke zuerst auf **Aufgabe vorbereiten** – npm installiert dabei Playwright.
    workdir: playwright-start
    setup: |
      cat > package.json <<'EOF'
      {
        "name": "playwright-start",
        "private": true,
        "type": "module",
        "scripts": {
          "e2e": "playwright test"
        }
      }
      EOF
      cat > playwright.config.ts <<'EOF'
      import { defineConfig, devices } from '@playwright/test'

      export default defineConfig({
        testDir: './e2e',
        retries: process.env.CI ? 2 : 0,
        use: {
          baseURL: 'http://localhost:4173',
          trace: 'on-first-retry',
        },
        projects: [
          { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        ],
      })
      EOF
      mkdir -p e2e
      timeout 150 npm install -D @playwright/test --no-audit --no-fund --loglevel=error </dev/null
    checks:
      - type: file_exists
        path: e2e/login.spec.ts
        message: Lege die Datei e2e/login.spec.ts an.
      - type: command
        run: npx playwright test --list
        message: Playwright kann deine Testdatei nicht laden. Führe npx playwright test --list aus und lies die Fehlermeldung.
      - type: command
        run: npx playwright test --list 2>/dev/null | grep -c 'login.spec.ts'
        stdout_matches: "^\\s*([2-9]|[1-9][0-9]+)\\s*$"
        message: In e2e/login.spec.ts sollten mindestens zwei Tests stehen.
      - type: file_contains
        path: e2e/login.spec.ts
        pattern: "test\\.describe\\("
        message: Fasse die Tests mit test.describe('Login', …) zusammen.
      - type: file_contains
        path: e2e/login.spec.ts
        pattern: "getByRole\\(\\s*['\"]button['\"]"
        message: "Klicke den Button über getByRole('button', { name: 'Anmelden' })."
      - type: file_contains
        path: e2e/login.spec.ts
        pattern: "getByLabel\\("
        message: Fülle die Felder über getByLabel('E-Mail') und getByLabel('Passwort').
      - type: file_contains
        path: e2e/login.spec.ts
        pattern: "toHaveURL\\("
        message: Prüfe im Erfolgsfall mit toHaveURL, dass du auf /dashboard gelandet bist.
      - type: command
        run: grep -c 'waitForTimeout' e2e/login.spec.ts
        expect_exit: 1
        message: Entferne waitForTimeout – nutze stattdessen Web-First-Assertions wie toHaveText.
    hints:
      - "Die Datei beginnt mit `import { test, expect } from '@playwright/test'`."
      - "`await page.getByLabel('E-Mail').fill('user@example.com')` – danach `await page.getByRole('button', { name: 'Anmelden' }).click()`."
      - "Prüfungen: `await expect(page.getByRole('alert')).toHaveText('Login fehlgeschlagen')` und `await expect(page).toHaveURL(/\\/dashboard$/)`."
    solution: |
      ```bash
      cd playwright-start
      cat > e2e/login.spec.ts <<'EOF'
      import { test, expect } from '@playwright/test'

      test.describe('Login', () => {
        test.beforeEach(async ({ page }) => {
          await page.goto('/login')
          await page.getByLabel('E-Mail').fill('user@example.com')
        })

        test('zeigt bei falschem Passwort eine Fehlermeldung', async ({ page }) => {
          await page.getByLabel('Passwort').fill('falsch')
          await page.getByRole('button', { name: 'Anmelden' }).click()

          await expect(page.getByRole('alert')).toHaveText('Login fehlgeschlagen')
        })

        test('leitet nach erfolgreichem Login zum Dashboard', async ({ page }) => {
          await page.getByLabel('Passwort').fill('richtiges-passwort')
          await page.getByRole('button', { name: 'Anmelden' }).click()

          await expect(page).toHaveURL(/\/dashboard$/)
        })
      })
      EOF
      npx playwright test --list
      ```
  - id: playwright-lauf
    type: simulated
    title: Einen roten End-to-End-Lauf untersuchen
    description: |
      Auf deinem Rechner (mit installierten Browsern) läuft die Playwright-Suite eines Shops. Untersuche
      einen Fehler wie im Alltag:

      1. Starte alle Tests mit `npx playwright test`.
      2. Wiederhole nur den fehlgeschlagenen Test mit `npx playwright test --last-failed`.
      3. Öffne den HTML-Bericht mit `npx playwright show-report`.
      4. Starte den fehlerhaften Test zum Zuschauen nur in Chromium mit sichtbarem Browser:
         `npx playwright test e2e/checkout.spec.ts --project=chromium --headed`
    prompt: "du@laptop:~/shop$"
    steps:
      - expect: "^npx\\s+playwright\\s+test\\s*$"
        output: |
          Running 12 tests using 4 workers

            ✓  1 [chromium] › e2e/login.spec.ts:4:3 › Login › zeigt bei falschem Passwort eine Fehlermeldung (1.2s)
            ✓  2 [chromium] › e2e/login.spec.ts:10:3 › Login › leitet nach erfolgreichem Login zum Dashboard (1.4s)
            ✘  3 [chromium] › e2e/checkout.spec.ts:8:3 › Checkout › zeigt die Bestätigung (5.1s)
            …

            1) [chromium] › e2e/checkout.spec.ts:8:3 › Checkout › zeigt die Bestätigung

              Error: expect(locator).toHaveText(expected) failed

              Locator: getByRole('alert')
              Expected: "Danke für deine Bestellung!"
              Received: "Danke für Ihre Bestellung!"
              Timeout: 5000ms

            1 failed
            11 passed (14.8s)

            Serving HTML report at http://localhost:9323. Press Ctrl+C to quit.
        hint: Tippe einfach npx playwright test
      - expect: "^npx\\s+playwright\\s+test\\s+--last-failed\\s*$"
        output: |
          Running 1 test using 1 worker

            ✘  1 [chromium] › e2e/checkout.spec.ts:8:3 › Checkout › zeigt die Bestätigung (5.0s)

            1 failed
        hint: Der Schalter heißt --last-failed
      - expect: "^npx\\s+playwright\\s+show-report\\s*$"
        output: |
          Serving HTML report at http://localhost:9323. Press Ctrl+C to quit.
          (Im Bericht siehst du Fehlermeldung, Screenshot und – falls aufgezeichnet – den Trace.)
        hint: show-report öffnet den letzten Bericht
      - expect: "^npx\\s+playwright\\s+test\\s+e2e/checkout\\.spec\\.ts\\s+--project[= ]chromium\\s+--headed\\s*$"
        output: |
          Running 1 test using 1 worker

            ✘  1 [chromium] › e2e/checkout.spec.ts:8:3 › Checkout › zeigt die Bestätigung (5.2s)

          Im sichtbaren Browser erkennst du: Der Text wurde von „deine“ auf „Ihre“ geändert.
          Der Test hat recht – jemand hat die Ansprache vergessen anzupassen.
        hint: "Kombiniere Dateipfad, --project=chromium und --headed"
    responses:
      - match: "^npx\\s+playwright\\s+install"
        output: Die Browser sind auf diesem Rechner schon installiert.
      - match: "^ls"
        output: "e2e  node_modules  package.json  playwright.config.ts  playwright-report  test-results"
---
Unit-Tests sagen dir, dass deine Funktionen stimmen. Aber funktioniert der Login, wenn echter Browser,
echtes Frontend und echtes Backend zusammenspielen? Genau das prüft ein
[[end-to-end-test|End-to-End-Test]]. [[playwright|Playwright]] steuert dafür echte Browser – Chromium,
Firefox und WebKit – per Code.

## Playwright einrichten

Ein neues Playwright-Setup legst du mit einem Assistenten an:

```bash title="Terminal"
npm init playwright@latest
```

Er fragt nach TypeScript oder JavaScript, dem Testordner (`tests` oder `e2e`), einem GitHub-Actions-Workflow
und ob die Browser installiert werden sollen. Danach liegen da:

| Datei | Zweck |
|---|---|
| `playwright.config.ts` | Browser, Basis-URL, Wiederholungen, Berichte |
| `tests/example.spec.ts` | ein Beispieltest |
| `package.json` | mit `@playwright/test` als Dev-Abhängigkeit |

Die Browser selbst lädst du mit `npx playwright install --with-deps` herunter – `--with-deps` installiert
auch nötige Systembibliotheken (in CI-Containern wichtig).

> [!ACHTUNG]
> Im Stacklab-Übungs-Terminal sind Browser-Downloads gesperrt. Du schreibst deine Tests dort trotzdem
> und prüfst sie mit `npx playwright test --list`. Ausführen kannst du sie auf deinem eigenen Rechner.

## Der erste Test

```ts title="e2e/login.spec.ts"
import { test, expect } from '@playwright/test'

test('zeigt bei falschem Passwort eine Fehlermeldung', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('E-Mail').fill('user@example.com')
  await page.getByLabel('Passwort').fill('falsch')
  await page.getByRole('button', { name: 'Anmelden' }).click()

  await expect(page.getByRole('alert')).toHaveText('Login fehlgeschlagen')
})
```

Jeder Test bekommt ein frisches `page`-Objekt – einen neuen, sauberen Browser-Tab. Fast jede Zeile hat
ein `await`, weil der Browser asynchron arbeitet. `page.goto('/login')` nutzt die `baseURL` aus der
Konfiguration.

`test.describe` gruppiert Tests, `test.beforeEach` bereitet sie vor – wie in Pest und Vitest.

## Locators: Elemente finden wie ein Mensch

Ein [[locator|Locator]] beschreibt, **wie** Playwright ein Element findet. Die Reihenfolge der Empfehlung:

| Locator | Findet |
|---|---|
| `getByRole('button', { name: 'Anmelden' })` | Element nach Rolle und zugänglichem Namen |
| `getByLabel('E-Mail')` | Formularfeld über sein `<label>` |
| `getByText('Warenkorb leer')` | sichtbaren Text |
| `getByPlaceholder('Suche')` | Feld über Platzhalter |
| `getByTestId('cart-count')` | `data-testid`-Attribut – wenn sonst nichts passt |

CSS- oder XPath-Selektoren wie `div > button.btn` brechen beim nächsten Redesign. Rollen und Beschriftungen
bleiben – und ganz nebenbei prüfst du so die [[barrierefreiheit|Barrierefreiheit]] mit.

> [!MERKSATZ]
> Wenn dein Test ein Element nicht über Rolle oder Label findet, findet es ein Screenreader oft auch nicht.

## Auto-Waiting und Web-First-Assertions

Webseiten laden nach, animieren und rendern neu. Playwright wartet deshalb automatisch
([[auto-waiting|Auto-Waiting]]): Vor einem `click()` prüft es, ob das Element sichtbar, ruhig, nicht
verdeckt und aktiviert ist.

Für Prüfungen gibt es [[web-first-assertion|Web-First-Assertions]]. Sie wiederholen die Prüfung, bis sie
stimmt oder das Zeitlimit (standardmäßig 5 Sekunden) abläuft:

```ts
await expect(page.getByRole('alert')).toHaveText('Login fehlgeschlagen')
await expect(page).toHaveURL(/\/dashboard$/)
await expect(page.getByRole('heading', { name: 'Willkommen' })).toBeVisible()
```

> [!FEHLER]
> **Feste Wartezeiten.** `await page.waitForTimeout(2000)` ist auf deinem Laptop zu lang und in der
> langsamen CI zu kurz – der Test wird wackelig. Ebenso falsch: `expect(await locator.textContent())`,
> denn das liest den Text nur einmal. Nimm immer `await expect(locator).toHaveText(...)`.

## Konfiguration, Berichte und Traces

Die wichtigsten Einstellungen in `playwright.config.ts`:

```ts
export default defineConfig({
  testDir: './e2e',
  retries: process.env.CI ? 2 : 0,
  use: { baseURL: 'http://localhost:4173', trace: 'on-first-retry' },
  webServer: { command: 'npm run preview', url: 'http://localhost:4173' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
```

`webServer` startet deine App vor den Tests, `projects` legt die Browser fest. Mit
`trace: 'on-first-retry'` zeichnet Playwright beim ersten Wiederholungsversuch einen Trace auf: Screenshots,
DOM-Stände, Netzwerk und Konsole jedes Schritts. Du öffnest ihn im Bericht oder mit
`npx playwright show-trace` – das ist der [[trace-viewer|Trace Viewer]].

| Befehl | Wofür |
|---|---|
| `npx playwright test --ui` | interaktiv entwickeln und debuggen |
| `npx playwright test --headed` | Browser sichtbar starten |
| `npx playwright test --last-failed` | nur die zuletzt roten Tests |
| `npx playwright codegen localhost:4173` | Klicks aufzeichnen, Code erzeugen |

> [!PRAXIS]
> In der CI läuft Playwright [[headless-browser|headless]] mit zwei Wiederholungen. Wird ein Test rot,
> lädt das Team den HTML-Bericht als Artefakt herunter und spielt den Trace Schritt für Schritt ab –
> meist ist die Ursache in Minuten gefunden.

## Zusammenfassung

- `npm init playwright@latest` richtet Playwright ein, `npx playwright install --with-deps` lädt Browser.
- Tests nutzen `page.goto`, Locators und Aktionen wie `fill` und `click` – fast immer mit `await`.
- Bevorzuge `getByRole`, `getByLabel` und `getByText` vor CSS-Selektoren.
- Auto-Waiting und Web-First-Assertions (`await expect(...).toHaveText(...)`) ersetzen feste Wartezeiten.
- `baseURL`, `webServer`, `projects`, `retries` und `trace` stehen in `playwright.config.ts`.
- `--ui`, `--headed`, `--last-failed`, `show-report` und `codegen` helfen beim Schreiben und Debuggen.
