<p align="center">
  <img src="docs/brand/logo-light.svg#gh-light-mode-only" alt="Stacklab" width="320">
  <img src="docs/brand/logo-dark.svg#gh-dark-mode-only" alt="Stacklab" width="320">
</p>

<p align="center"><strong>IT lernen durch echtes Tippen.</strong><br>
Eine interaktive Lernplattform, die komplett auf deinem Rechner läuft – von „Was ist eine Variable?“ bis zum eigenen Projekt in der Cloud.</p>

---

## In 3 Schritten starten

**1. Docker installieren und starten**

Lade [Docker Desktop](https://www.docker.com/products/docker-desktop/) herunter (macOS und Windows) und starte es.
Unter Linux reichen Docker Engine und das Compose-Plugin. Mehr brauchst du nicht – kein PHP, kein Node, keine Datenbank.

**2. Stacklab herunterladen und starten**

Öffne ein Terminal (unter Windows: das Ubuntu-Terminal aus WSL, siehe unten) und füge ein:

```bash
git clone https://github.com/SynKeles44/stacklab.git
cd stacklab
./bin/start.sh
```

Beim ersten Mal dauert das ein paar Minuten. Das Skript wartet, bis alles bereit ist, und öffnet dann den Browser.
Hast du `make` installiert (macOS und die meisten Linux-Systeme haben es), geht statt `./bin/start.sh` auch `make start`.

**3. Loslegen**

Stacklab läuft unter **http://localhost:8080**. Lege ein Konto an – es bleibt auf deinem Rechner – und wähle deinen ersten Kurs.

> [!TIP]
> | Befehl | Wirkung |
> |---|---|
> | `make start` | Stacklab starten und warten, bis es bereit ist |
> | `make stop` | Stacklab beenden |
> | `make restart` | Stacklab neu starten, z. B. nach einem Wechsel des Workspace-Ordners |
>
> Ohne `make`: `./bin/start.sh` zum Starten, `docker compose down` zum Beenden. Dein Fortschritt bleibt dabei immer erhalten.

<details>
<summary><strong>Windows: so geht's</strong></summary>

1. Docker Desktop installieren; bei der Installation **WSL 2** aktiviert lassen.
2. Aus dem Microsoft Store **Ubuntu** installieren und einmal öffnen.
3. Im Ubuntu-Fenster die drei Befehle aus Schritt 2 ausführen. Im WSL-Ordner ist Stacklab deutlich schneller als unter `C:\`.

Ohne WSL geht es auch in der PowerShell: `git clone …`, `cd stacklab`, dann `docker compose up -d` und nach ein paar
Minuten http://localhost:8080 öffnen.
</details>

## Was dich erwartet

- **52 Kurse in einer sinnvollen Reihenfolge** – Grundlagen & Werkzeuge, Web & APIs, Frontend, Backend
  (Laravel als größter Kurs), Infrastruktur & Betrieb und ein Abschlussprojekt.
- **Ein echtes Übungs-Terminal im Browser.** Du tippst echte Befehle (git, npm, composer, artisan …) in einem
  abgesicherten Container. Alles, was du baust, landet als echtes Projekt im Ordner `workspace/` auf deiner Festplatte.
- **Code-Aufgaben** in JavaScript, TypeScript, React und PHP mit automatischen Tests.
- **Ein Lexikon mit über 2.000 Begriffen.** Jedes Fachwort ist anklickbar; beim Lesen schaltest du Begriffe frei.
- **Quizze, Projekte und Prüfungen** mit Schwächenanalyse und Zertifikat.
- **Hängst du fest?** Projektschritte erledigt Stacklab auf Wunsch für dich – mit dem Knopf „Für mich erledigen“.
- Volltextsuche, Lesezeichen, Notizen, Fortschritt und Dark Mode.

## Dein Workspace

Alles, was du im Übungs-Terminal baust, liegt im Ordner `workspace/` – pro Kurs ein Unterordner. Öffne ihn
jederzeit mit deinem Editor. Einen anderen Ort wählst du in der App unter **Einstellungen → Workspace-Ordner →
Ordner auswählen**; danach einmal `make restart`.

## Wenn etwas hakt

| Problem | Lösung |
|---|---|
| „Docker läuft nicht“ | Docker Desktop starten, kurz warten, Befehl wiederholen. |
| Seite lädt nicht | `docker compose logs php` zeigt, ob noch Kurse importiert werden. Beim ersten Start ein paar Minuten warten. |
| Stacklab auf dem Handy öffnen | In `.env` `STACKLAB_BIND=0.0.0.0` setzen und `make restart` ausführen. Achtung: Dann kann jeder in deinem Netzwerk Stacklab und das Übungs-Terminal nutzen. |
| Port 8080 ist belegt | In der Datei `.env` `STACKLAB_PORT=8090` setzen und `make restart` ausführen. |
| Terminal zeigt „getrennt“ | `docker compose restart sandbox` |
| Seite zeigt eine alte Version | `docker compose run --rm frontend` |
| Nur den Lernfortschritt löschen | In der App: *Einstellungen → Fortschritt zurücksetzen*. |
| Alles zurücksetzen | `docker compose down -v` löscht Konten und Fortschritt, nicht aber deinen Workspace. |
| Windows ist sehr langsam | Stacklab im Ubuntu-Fenster (WSL) klonen, nicht unter `C:\`. |

## Aktualisieren und entfernen

```bash
git pull && make restart     # neueste Version holen, neue Kurse werden automatisch importiert
make stop                    # beenden
docker compose down -v       # beenden und Datenbank löschen (vor dem Entfernen)
```

Danach kannst du den Ordner `stacklab` einfach löschen. Deinen `workspace/` sicherst du vorher, wenn du ihn behalten willst.

## Für Neugierige und Mitwirkende

- [Architektur, Sicherheit des Übungs-Terminals und Tech-Stack](docs/ARCHITECTURE.md)
- Inhalte liegen als Markdown und YAML unter [`content/`](content/): [Format](content/README.md),
  [Stil und Tiefe](docs/AUTHORING.md), [Beitragen](CONTRIBUTING.md). Nach dem Bearbeiten: `make validate` und `make import`.
- Alle Befehle: `make help`.

## Lizenz

[MIT](LICENSE) © 2026 [SynKeles44](https://github.com/SynKeles44)
