# Ruoli e autorizzazioni

Panoramica (funzionale)
- Responsabile progetto: accesso completo a progetti, pianificazione e gestione
- Owner (responsabili della pianificazione): possono gestire le pianificazioni a cui sono assegnati
- Deputies (sostituti): possono co-gestire le pianificazioni
- Stakeholder: possono partecipare alle pianificazioni e votare

Classificazione tecnica
- L'app utilizza l'autenticazione con e‑mail/password e la verifica e‑mail.
- La visibilità e i permessi di scrittura sono ulteriormente limitati dal Tenant corrente (ambito Multi‑Tenancy).
- Le rotte mostrano le aree pertinenti, ad es. progetti, pianificazioni, feature, votazioni, impegni e impostazioni.

Nota
- L'applicazione effettiva dei ruoli può essere estesa in modo specifico per il progetto. Verificare eventualmente i controller/rotte, ad es. `routes/web.php:24` (aree protette tramite `auth`/`verified`).
