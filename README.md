# KanMind Frontend

![KanMind Logo](assets/icons/logo_icon.svg)

KanMind ist ein in Vanilla JavaScript entwickeltes Frontend für ein separates Django-Backend. Das Projekt enthält Dashboard-, Board-, Task- und Authentifizierungsfunktionen sowie eine umfangreiche Playwright-Testsuite.

Die bestehenden Browser-Tests dienen als Sicherheitsnetz für die geplante Migration zu Angular 22. Ziel ist, das aktuelle Verhalten während der Migration unverändert beizubehalten.

## Voraussetzungen

- Node.js 24
- npm
- Chromium für die Playwright-Tests
- Das separate KanMind-Django-Backend für die manuelle Nutzung der Anwendung
- VS Code Live Server oder ein anderer statischer Webserver

Die Anwendung erwartet das Backend standardmäßig unter:

```text
http://127.0.0.1:8000/api/
```

Die URL ist in `shared/js/config.js` konfiguriert.

## Installation

```bash
npm install
npx playwright install chromium
```

## Anwendung starten

1. Starte das KanMind-Django-Backend.
2. Öffne die `index.html` im Projektstamm mit VS Code Live Server.

Alternativ kann der für die Tests installierte statische Server verwendet werden:

```bash
npm run serve:test
```

Das Frontend ist anschließend unter `http://127.0.0.1:4173` erreichbar.

## Playwright-Tests

Die Tests verwenden vollständig gemockte API-Antworten. Das Django-Backend muss für die Tests nicht laufen. Auch Chart.js wird im Browser gemockt, damit die Suite unabhängig vom Netzwerk bleibt.

Die Suite umfasst 64 fachliche Szenarien, die jeweils in zwei Projekten ausgeführt werden:

- Desktop Chromium
- Mobile Chromium mit Pixel-5-Emulation

Damit werden bei einem vollständigen Lauf 128 Tests ausgeführt.

Abgedeckt sind unter anderem:

- Login, Gast-Login, Logout und Authentifizierungs-Redirects
- Local-Storage-Verträge und Formularvalidierungen
- Registrierung sowie Erfolgs- und Fehlerantworten
- Dashboard-Daten, Leerzustände, Filter und Navigation
- Board-Suche, Erstellung, Bearbeitung, Mitglieder und Löschung
- Task-Erstellung, Statuswechsel, Suche, Kommentare und Dialoge
- HTTP-Methoden, API-Endpunkte und Request-Payloads
- Datenschutz, Impressum und responsive Darstellung

### Tests ausführen

```bash
# Gesamte Suite im Headless-Modus
npm run test:e2e

# Tests mit sichtbaren Browserfenstern
npm run test:e2e:headed

# Interaktive Playwright-Oberfläche
npm run test:e2e:ui

# Letzten HTML-Testbericht öffnen
npm run test:e2e:report
```

Ein einzelner Test kann direkt ausgeführt werden:

```bash
npx playwright test tests/e2e/board.spec.js:93 --project=desktop-chromium
```

Lokale Testläufe verwenden maximal zwei Worker, um die Chromium-Kontexte stabil zu starten. In CI läuft die Suite mit einem Worker.

## Projektstruktur

```text
assets/                  Schriftarten, Icons und Bilder
pages/                   Auth-, Dashboard-, Board- und Rechtstexte
shared/                  Gemeinsame CSS- und JavaScript-Dateien
tests/e2e/               Playwright-Charakterisierungstests
tests/e2e/support/       Stateful API-Mocks und Testdaten
.github/workflows/       GitHub-Actions-Konfiguration
playwright.config.js     Browser-, Server- und Reporter-Konfiguration
```

## Continuous Integration

GitHub Actions führt die komplette Playwright-Suite bei Pushes und Pull Requests auf `main` aus. Bei jedem Lauf wird ein HTML-Bericht als Artefakt gespeichert.

## Migrationshinweis

Während der Angular-22-Migration sollten die Playwright-Tests weiterhin unverändert gegen das sichtbare Verhalten und die bestehenden API-Verträge laufen. Änderungen an den Tests sollten nur erfolgen, wenn sich eine Produktanforderung bewusst ändert.

## Lizenz und Nutzung

Dieses Projekt ist ausschließlich für Schüler der Developer Akademie vorgesehen und nicht zur freien Nutzung oder Weitergabe freigegeben. Weitere Informationen stehen in [LICENSE.md](LICENSE.md).
