# Installazione e avvio

Questo progetto è un'applicazione Laravel + React (Inertia). La configurazione predefinita utilizza SQLite per un avvio locale rapido.

Prerequisiti
- PHP >= 8.2, Composer
- Node.js >= 18 (consigliato: 20) e npm
- Opzionale: Imagick o GD per l'elaborazione delle immagini avatar

Avvio rapido
1) Clonare il repository e installare le dipendenze
   - PHP: `composer install`
   - JS: `npm install`

2) Creare il file di ambiente e generare la chiave dell'app
   - `cp .env.example .env`
   - `php artisan key:generate`

3) Preparare il database (predefinito: SQLite)
   - Assicurarsi che `DB_CONNECTION=sqlite` sia impostato in `.env`
   - Se necessario, creare `database/database.sqlite`: `mkdir -p database && touch database/database.sqlite`
   - Eseguire le migrazioni: `php artisan migrate`

4) Avviare il server di sviluppo
   - Backend: `php artisan serve`
   - Frontend (Vite): `npm run dev`

5) Accesso
   - Aprire: http://localhost:8000 (se non configurato diversamente)
   - Registrare un utente. Verrà automaticamente creato un Tenant (mandante) dedicato.

Passaggi aggiuntivi consigliati
- Storage Link (per file pubblici): `php artisan storage:link`
- Sessione e coda: predefiniti su `database` (vedi `.env.example`).
- Mailer: per la verifica e‑mail configurare `MAIL_MAILER` (per impostazione predefinita le mail vengono registrate nel log).

Script utili
- Test PHP: `composer test`
- Test E2E (Cypress): `npm run test:e2e`

Note
- I valori di esempio per `.env` si trovano in `.env.example` (ad es. `SESSION_DRIVER=database`, `QUEUE_CONNECTION=database`).
- Per il caricamento degli avatar si preferisce Imagick, in alternativa GD. Senza supporto JPEG, utilizzare PNG/WebP.
