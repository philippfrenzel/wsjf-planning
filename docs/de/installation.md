# Installation und Start

Dieses Projekt ist eine Laravel + React (Inertia) Anwendung. Die Standard-Konfiguration nutzt SQLite für einen schnellen lokalen Start.

Voraussetzungen
- PHP >= 8.2, Composer
- Node.js >= 18 (empfohlen: 20) und npm
- Optional: Imagick oder GD für Avatar‑Bildverarbeitung

Schnellstart
1) Repository klonen und Abhängigkeiten installieren
   - PHP: `composer install`
   - JS: `npm install`

2) Umgebungsdatei anlegen und App‑Key generieren
   - `cp .env.example .env`
   - `php artisan key:generate`

3) Datenbank vorbereiten (Standard: SQLite)
   - Stellen Sie sicher, dass `DB_CONNECTION=sqlite` in `.env` gesetzt ist
   - Legen Sie ggf. `database/database.sqlite` an: `mkdir -p database && touch database/database.sqlite`
   - Migrationen ausführen: `php artisan migrate`

4) Dev‑Server starten
   - Backend: `php artisan serve`
   - Frontend (Vite): `npm run dev`

5) Zugriff
   - Öffnen: http://localhost:8000 (sofern nicht anders konfiguriert)
   - Registrieren Sie einen Benutzer. Es wird automatisch ein eigener Tenant (Mandant) angelegt.

Empfohlene zusätzliche Schritte
- Storage Link (für öffentliche Dateien): `php artisan storage:link`
- Session und Queue: Standardmäßig `database` (siehe `.env.example`).
- Mailer: Für E‑Mail‑Verifikation `MAIL_MAILER` konfigurieren (Standard loggt Mails).

Nützliche Skripte
- PHP‑Tests: `composer test`
- E2E‑Tests (Cypress): `npm run test:e2e`

Hinweise
- `.env` Beispielwerte finden Sie in `.env.example` (z. B. `SESSION_DRIVER=database`, `QUEUE_CONNECTION=database`).
- Für Avatar‑Uploads wird Imagick bevorzugt, alternativ GD. Ohne JPEG‑Support bitte PNG/WebP verwenden.

