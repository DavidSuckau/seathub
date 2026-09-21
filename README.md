# SeatHub

Klickbarer Frontend-Prototyp für Komplett-Sitzmusterbau, Entwicklung und Musterfertigung.  
Daten nur im Browser (LocalStorage) – kein Backend.

## Lokal starten

```bash
npm install
npm run dev
```

Öffnen: [http://localhost:3000](http://localhost:3000)

## GitHub Pages

Bei Push auf `main` baut GitHub Actions den Static Export und veröffentlicht die Seite.

URL (nach dem ersten Deploy):

`https://davidsuckau.github.io/seathub/`

Unter **Settings → Pages** muss „GitHub Actions“ als Source aktiv sein (wird beim ersten Workflow meist automatisch gesetzt).

Lokal wie Pages bauen:

```bash
GITHUB_PAGES=true GITHUB_REPOSITORY=DavidSuckau/seathub npm run build
```

Ausgabe liegt in `out/`.
