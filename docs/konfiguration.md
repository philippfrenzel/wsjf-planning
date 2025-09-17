# Konfiguration und Umgebung

Die wichtigsten Einstellungen erfolgen über `.env`. Eine Vorlage finden Sie in `.env.example`.

Kernvariablen
- `APP_URL`: Öffentliche Basis‑URL der Anwendung
- `APP_DEBUG`: Debug‑Modus (true/false)
- `APP_LOCALE`, `APP_FALLBACK_LOCALE`: Spracheinstellungen (de/en)
- `APP_KEY`: Sicherheits‑Key (per `php artisan key:generate` setzen)

Datenbank/Cache/Queue
- `DB_CONNECTION`: Standard `sqlite` (alternativ MySQL/Postgres konfigurieren)
- `SESSION_DRIVER`: empfohlen `database`
- `CACHE_STORE`: z. B. `database`
- `QUEUE_CONNECTION`: z. B. `database`

E‑Mail
- `MAIL_MAILER`: z. B. `smtp`, `log` (Standard: `log`)
- `MAIL_*`: Host/Anmeldeinformationen für SMTP

Dateisystem
- `FILESYSTEM_DISK`: Standard `local`
- Für öffentliche Dateien Link setzen: `php artisan storage:link`

Frontend (Vite)
- `VITE_APP_NAME`: Anzeigename im Frontend

Avatar‑Bildverarbeitung
- Unterstützt Imagick (bevorzugt) oder GD
- Falls JPEG nicht verfügbar ist, bitte PNG/WebP verwenden (siehe Settings > Profil)

Multi‑Tenancy (Single‑DB)
- Mandanten werden über eine `tenant_id` in den Tabellen abgebildet.
- Bei Registrierung wird automatisch ein Tenant erstellt und zugeordnet.
- Der aktuelle Tenant des Users steuert die Sichtbarkeit aller Daten.

