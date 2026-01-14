# WSJF Planning Tool

## Übersicht

Das WSJF Planning Tool ist eine umfassende Anwendung zur Planung, Priorisierung und Schätzung von Features im agilen Projektmanagement mit besonderem Fokus auf die Weighted Shortest Job First (WSJF) Methodik.

Diese Anwendung ermöglicht es Teams, Planungszyklen zu organisieren, Aufwände zu schätzen und Features basierend auf Geschäftswert, Zeit- und Risikokriterien zu priorisieren.

## Hauptfunktionen

- **Planning-Verwaltung**: Erstellen und verwalten Sie Planungssitzungen mit zugewiesenen Verantwortlichen (Owner) und Stellvertretern
- **Feature-Management**: Organisieren Sie Features nach Projekten und verfolgen Sie deren Status
- **Schätzungen**: Erfassen Sie Aufwandsschätzungen mit Best Case, Most Likely und Worst Case und berechnen Sie den gewichteten Durchschnitt
- **Stakeholder-Integration**: Binden Sie relevante Teammitglieder in den Planungsprozess ein
- **Filter und Suche**: Finden Sie schnell relevante Planungen und Features durch umfangreiche Filtermöglichkeiten
- **Abonnements**: Benutzer können Pläne auswählen und monatliche Zahlungen veranlassen
- **Kommentarfunktion**: Diskutieren Sie Features, Planungen und Projekte mit verschachtelten Kommentaren
- **Versionsinformation**: Automatische Anzeige von Version und Git-Commit für besseres Issue-Tracking

## Installation

1. Klonen Sie das Repository:
    ```bash
    git clone [repository-url]
    ```

2. Installieren Sie die PHP-Abhängigkeiten:
    ```bash
    composer install
    ```

3. Installieren Sie die JavaScript-Abhängigkeiten:
    ```bash
    npm install
    ```

4. Konfigurieren Sie die Umgebungsvariablen:
    ```bash
    cp .env.example .env
    # Setzen Sie APP_VERSION (optional, Standard: 1.0.0)
    APP_VERSION=1.0.0
    ```

5. Starten Sie den Laravel-Server:
    ```bash
    php artisan serve
    ```

6. Starten Sie die Frontend-Entwicklung:
    ```bash
    npm run dev
    ```

## Tests

Tests können über die PHP- oder JavaScript-Werkzeuge ausgeführt werden:
```bash
composer test
# oder
npm run test:e2e
```

## Dokumentation

Weitere Dokumentation finden Sie im `docs/` Verzeichnis:
- [Kommentarfunktion](docs/FRONTEND_KOMMENTARE.md) - Nutzung der Kommentarfunktion
- [Versionsinformation](docs/VERSION_INFO.md) - Details zur Versionsverwaltung
- [Kommentar-Fix](docs/COMMENT_COMPONENT_FIX.md) - Technische Details zum Kommentar-Fix

Technologien
Backend: Laravel (PHP)
Frontend: React 19, TypeScript, Inertia.js
UI-Komponenten: Tailwind CSS, shadcn/ui, radix-ui
Datenbank: MySQL/PostgreSQL
Berechtigungen
Das System unterstützt folgende Berechtigungen:

Projektleiter: Voller Zugriff auf alle Funktionen
Owner: Können Planungen verwalten, für die sie verantwortlich sind
Deputies: Können Planungen bearbeiten, für die sie als Stellvertreter eingetragen sind
Stakeholder: Können an Planungen teilnehmen und Schätzungen abgeben
Lizenz
Das WSJF Planning Tool ist eine proprietäre Software. Alle Rechte vorbehalten.

## Multi-Tenancy

- Die Anwendung ist nun mandantenfähig (Single-DB mit `tenant_id`).
- Es existiert eine Tabelle `tenants`; alle mandantenbezogenen Tabellen besitzen eine `tenant_id`-Spalte.
- Standardverhalten: Bei der Registrierung wird für jeden Benutzer automatisch ein eigener Tenant angelegt und dem Benutzer zugewiesen.
- Eloquent-Modelle sind mit einem globalen Scope versehen, der alle Abfragen auf den aktuellen Tenant des eingeloggten Benutzers einschränkt. Anonyme Benutzer sehen keine Tenant-Daten.
- Nach dem Update bitte `php artisan migrate` ausführen. Eine Migrationsroutine erzeugt für bestehende Benutzer automatisch Tenants und weist vorhandene Datensätze korrekt zu.
