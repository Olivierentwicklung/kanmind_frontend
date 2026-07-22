# KanMind Frontend Project

![KanMind Logo](assets/icons/logo_icon.svg)

Dieses Projekt ist ein einfaches Frontend, das mit **Vanilla JavaScript** (reines JavaScript ohne Frameworks) erstellt wurde. Es wurde speziell entwickelt, um Schülern der **Developer Akademie** mit Backend-Erfahrung den Einstieg in kleinere Frontend-Anpassungen zu erleichtern.

---

## Voraussetzungen

- Ein funktionierendes Django-Backend (`KanMind`), das **nicht** in diesem Projekt enthalten ist.
- Visual Studio Code mit der **Live Server**-Erweiterung oder eine ähnliche Möglichkeit, die `index.html` auf oberster Ebene lokal im Browser zu starten.

---

## Nutzung

1. Stelle sicher, dass das Backend `KanMind` läuft.
2. Öffne dieses Projekt in **Visual Studio Code**.
3. Rechtsklicke auf die Datei `index.html` auf oberster Ebene und wähle **Open with Live Server**, um das Projekt zu starten.

---

## Ziel des Projekts

Dieses Frontend wurde bewusst mit **Vanilla JavaScript** erstellt, um die folgenden Ziele zu erreichen:

- **Einfacher Einstieg**: Durch den Verzicht auf Frameworks wie React oder Angular bleibt der Code leicht verständlich und nachvollziehbar auch bei wenig Frontend-Erfahrung.
- **Lernen durch Anpassung**: Schüler können den Code anpassen, um kleine Änderungen vorzunehmen und Frontend-Konzepte besser zu verstehen.
- **Backend-Erweiterung**: Das Projekt lässt sich einfach an das bestehende Django-Backend `KanMind` anbinden.

---

## Hinweis

Dieses Projekt ist **ausschließlich für Schüler der Developer Akademie** gedacht und nicht zur freien Nutzung oder Weitergabe freigegeben.

---

## End-to-End-Tests mit Playwright

Die Browser-Tests verwenden gemockte API-Antworten. Das Django-Backend muss daher nicht laufen.

### Installation

```bash
npm install
npx playwright install chromium
```

### Befehle

```bash
# Tests im Headless-Modus ausführen
npm run test:e2e

# Tests mit sichtbarem Browser ausführen
npm run test:e2e:headed

# Interaktiven Playwright-Test-Runner starten
npm run test:e2e:ui

# Den letzten HTML-Bericht öffnen
npm run test:e2e:report
```

Playwright startet den lokalen Frontend-Server automatisch. Die Tests laufen in Desktop Chromium und in einer mobilen Pixel-5-Emulation. In GitHub Actions werden sie bei Pushes und Pull Requests auf `main` ausgeführt.

---
