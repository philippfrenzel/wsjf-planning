# Configuration and Environment

The most important settings are managed via `.env`. A template can be found in `.env.example`.

Core Variables
- `APP_URL`: Public base URL of the application
- `APP_DEBUG`: Debug mode (true/false)
- `APP_LOCALE`, `APP_FALLBACK_LOCALE`: Language settings (de/en)
- `APP_KEY`: Security key (set via `php artisan key:generate`)

Database/Cache/Queue
- `DB_CONNECTION`: Default `sqlite` (alternatively configure MySQL/Postgres)
- `SESSION_DRIVER`: Recommended `database`
- `CACHE_STORE`: e.g., `database`
- `QUEUE_CONNECTION`: e.g., `database`

Email
- `MAIL_MAILER`: e.g., `smtp`, `log` (default: `log`)
- `MAIL_*`: Host/credentials for SMTP

Filesystem
- `FILESYSTEM_DISK`: Default `local`
- For public files, create a link: `php artisan storage:link`

Frontend (Vite)
- `VITE_APP_NAME`: Display name in the frontend

Avatar Image Processing
- Supports Imagick (preferred) or GD
- If JPEG is not available, please use PNG/WebP (see Settings > Profile)

Multi‑Tenancy (Single DB)
- Tenants are represented via a `tenant_id` column in the relevant tables.
- Upon registration, a tenant is automatically created and assigned to the user.
- The current tenant of the user controls the visibility of all data.
