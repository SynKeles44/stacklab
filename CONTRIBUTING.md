# Mitmachen bei Stacklab

Danke, dass du Stacklab besser machen willst! Beiträge sind willkommen – neue Lektionen, Korrekturen,
bessere Erklärungen, neue Aufgaben, Bugfixes und Features.

## Inhalte ergänzen (der häufigste Beitrag)

1. Lies [content/README.md](content/README.md) (Dateiformat) und [docs/AUTHORING.md](docs/AUTHORING.md)
   (Stil, Tiefe, Regeln für Aufgaben).
2. Schau dir die Musterlektionen im Git-Kurs an.
3. Schreibe oder ändere Dateien unter `content/`.
4. Prüfe und importiere:

   ```bash
   make validate
   make import
   ```

5. Teste deine Aufgaben in der Oberfläche – Terminal-Aufgaben mit **Aufgabe vorbereiten** und **Prüfen**.
6. Öffne einen Pull Request.

### Checkliste für neue Lektionen

- [ ] Erklärt das **Warum** vor dem **Wie**, in einfacher Sprache, mit Beispielen
- [ ] Jedes Fachwort ist als `[[begriff]]` verlinkt und hat einen Lexikon-Eintrag
- [ ] Merksatz, typischer Fehler und Praxisbezug sind enthalten
- [ ] Mindestens eine interaktive Aufgabe, dazu ein Quiz mit 3+ Fragen
- [ ] Quellen aus offizieller Dokumentation sind angegeben
- [ ] Keine echten Zugangsdaten, Hostnamen oder Firmendaten – nur Platzhalter
- [ ] `make validate` meldet keine Fehler

## Code beitragen

- Code, Bezeichner und Commit-Messages auf **Englisch**, Oberfläche und Inhalte auf **Deutsch**.
- Commits nach [Conventional Commits](https://www.conventionalcommits.org/de/v1.0.0/):
  `feat:`, `fix:`, `docs:`, `content:`, `chore:` …
- Frontend: nur **shadcn/ui** als Komponentenbibliothek (`bunx shadcn@latest add …`), API-Antworten mit Zod validieren.
- Backend: Validierung über Form Requests, Logik in Services.
- Vor dem Pull Request: `make test`, im Backend zusätzlich `composer analyse` und `composer lint`.

## Entwicklung mit Hot Reload

```bash
docker compose up -d
make dev    # Vite-Dev-Server auf http://localhost:5173, API über den Proxy
```

## Fehler melden

Öffne ein Issue mit: was du getan hast, was passiert ist, was du erwartet hast, Betriebssystem und
`docker compose version`. Bei Problemen mit dem Übungs-Terminal hilft die Ausgabe von
`docker compose logs sandbox`.

## Verhaltenskodex

Sei freundlich und geduldig – Stacklab ist für Lernende gemacht, und jede Frage ist eine gute Frage.
