# Installation and Getting Started

This project is a Laravel + React (Inertia) application. The default configuration uses SQLite for a quick local start.

Prerequisites
- PHP >= 8.2, Composer
- Node.js >= 18 (recommended: 20) and npm
- Optional: Imagick or GD for avatar image processing

Quick Start
1) Clone the repository and install dependencies
   - PHP: `composer install`
   - JS: `npm install`

2) Create environment file and generate app key
   - `cp .env.example .env`
   - `php artisan key:generate`

3) Prepare the database (default: SQLite)
   - Ensure that `DB_CONNECTION=sqlite` is set in `.env`
   - If needed, create `database/database.sqlite`: `mkdir -p database && touch database/database.sqlite`
   - Run migrations: `php artisan migrate`

4) Start the dev server
   - Backend: `php artisan serve`
   - Frontend (Vite): `npm run dev`

5) Access
   - Open: http://localhost:8000 (unless configured otherwise)
   - Register a user. A dedicated tenant will be created automatically.

Recommended Additional Steps
- Storage link (for public files): `php artisan storage:link`
- Session and Queue: Default is `database` (see `.env.example`).
- Mailer: Configure `MAIL_MAILER` for email verification (default logs emails).

Useful Scripts
- PHP tests: `composer test`
- E2E tests (Cypress): `npm run test:e2e`

Notes
- `.env` example values can be found in `.env.example` (e.g., `SESSION_DRIVER=database`, `QUEUE_CONNECTION=database`).
- Imagick is preferred for avatar uploads; GD is an alternative. Without JPEG support, please use PNG/WebP.
