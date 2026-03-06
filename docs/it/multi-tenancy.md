# Multi‑Tenancy (Gestione mandanti)

Modello
- Approccio Single‑DB con colonna `tenant_id` per ogni tabella relativa ai mandanti
- La tabella `tenants` gestisce i mandanti e gli inviti
- Al momento della registrazione viene automaticamente creato un Tenant e assegnato all'utente

Utilizzo
- Cambio Tenant: menu "Tenants" → Tenant elencati → "Cambia"
- Membri: visualizzazione dei membri del Tenant corrente
- Inviti: i proprietari di un Tenant possono invitare tramite e‑mail; gli utenti invitati accettano l'invito e diventano membri

Pagina UI
- Panoramica Tenant, cambio e inviti: `GET /tenants` (vedi `routes/web.php:100`)

Visibilità
- Tutte le query pertinenti sono limitate tramite scope globale al Tenant corrente dell'utente autenticato (gli utenti anonimi non vedono alcun dato del Tenant).
