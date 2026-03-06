# Configurazione e ambiente

Le impostazioni principali vengono effettuate tramite `.env`. Un modello è disponibile in `.env.example`.

Variabili principali
- `APP_URL`: URL base pubblica dell'applicazione
- `APP_DEBUG`: modalità debug (true/false)
- `APP_LOCALE`, `APP_FALLBACK_LOCALE`: impostazioni della lingua (de/en)
- `APP_KEY`: chiave di sicurezza (impostare con `php artisan key:generate`)

Database/Cache/Coda
- `DB_CONNECTION`: predefinito `sqlite` (in alternativa configurare MySQL/Postgres)
- `SESSION_DRIVER`: consigliato `database`
- `CACHE_STORE`: ad es. `database`
- `QUEUE_CONNECTION`: ad es. `database`

E‑mail
- `MAIL_MAILER`: ad es. `smtp`, `log` (predefinito: `log`)
- `MAIL_*`: host/credenziali per SMTP

File system
- `FILESYSTEM_DISK`: predefinito `local`
- Per i file pubblici creare il link: `php artisan storage:link`

Frontend (Vite)
- `VITE_APP_NAME`: nome visualizzato nel frontend

Elaborazione immagini avatar
- Supporta Imagick (preferito) o GD
- Se JPEG non è disponibile, utilizzare PNG/WebP (vedi Settings > Profilo)

Multi‑Tenancy (Single‑DB)
- I mandanti vengono gestiti tramite una colonna `tenant_id` nelle tabelle.
- Al momento della registrazione viene automaticamente creato e assegnato un Tenant.
- Il Tenant corrente dell'utente controlla la visibilità di tutti i dati.
