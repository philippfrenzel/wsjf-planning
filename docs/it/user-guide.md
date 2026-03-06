# Guida utente – Flussi di lavoro

Questo capitolo descrive le principali aree e i flussi di lavoro dell'applicazione.

Accesso e avvio
- Pagina iniziale: Benvenuto/Landing, Login/Registrazione
- Dopo il login: Dashboard con KPI e "Le mie pianificazioni valide" (`resources/js/pages/dashboard.tsx:1`)

Progetti
- Visualizzazione: elenco progetti, dettagli, creazione/modifica/eliminazione (`routes/web.php:62`)
- Campi: numero progetto, nome, descrizione, data di inizio, responsabile progetto, sostituto, URL base Jira
- Stato: In pianificazione → In realizzazione → In accettazione → Completato (cambio di stato nella finestra di modifica)
- Navigazione: Progetti → "Nuovo" per la creazione

Feature
- Elenco: filtri (Jira Key, nome, progetto, richiedente, stato), ordinamento, paginazione (`resources/js/pages/features/index.tsx:1`)
- Creazione/Modifica: Jira‑Key, nome, descrizione (Rich‑Text possibile), progetto, richiedente
- Board: Kanban‑Board con Drag‑&‑Drop per il cambio di stato (In pianificazione, Approvato, Implementato, Rifiutato, Obsoleto, Archiviato) (`resources/js/pages/features/board.tsx:1`)
- Pagina di dettaglio: dettagli feature, dipendenze, componenti di stima, stime, descrizione (`resources/js/pages/features/show.tsx:1`)

Stime (Estimation Components)
- Componenti: aspetti funzionali/tecnici di una feature
- Stime: Best Case, Most Likely, Worst Case, unità (ore/giorni/Story Points), note
- Automatismo: vengono calcolati la media ponderata e la deviazione standard (`app/Models/Estimation.php:1`)
- Possibilità di archiviare/riattivare i componenti

Pianificazioni
- Sessioni di pianificazione per progetto con titolo, descrizione, date
- Responsabili: Owner e Deputy, aggiunta di stakeholder tramite selezione (`app/Http/Controllers/PlanningController.php:1`)
- Assegnazione feature: durante la creazione/modifica o successivamente
- Visualizzazione: schede "Dettagli & Common Vote" e "Feature & Individual Votes" (`resources/js/pages/plannings/show.tsx:1`)

Votazione (Categorie WSJF)
- Categorie: Business Value, Time Criticality, Risk/Opportunity
- Vista tabellare: inserire un valore numerico per ciascuna categoria per feature (`resources/js/pages/votes/session.tsx:1`)
- Vista a schede: classificare le feature per categoria tramite Drag‑&‑Drop (posizioni 1..n) (`resources/js/pages/votes/card-session.tsx:1`)
- Salvataggio: pulsante "Salva votazione"
- Common Votes: i valori medi vengono calcolati automaticamente per il creatore della pianificazione (`app/Http/Controllers/VoteController.php:1`)

Impegni (Commitments)
- Scopo: assegnazione vincolante "Chi fa cosa?" per pianificazione e feature
- Tipi: A/B/C/D (combinazione di priorità/urgenza), stato: Proposta/Accettato/Completato
- Viste elenco e dettaglio, modifica con transizioni di stato (`app/Http/Controllers/CommitmentController.php:1`)
- Panoramica per pianificazione: riepilogo di tutti gli impegni (`resources/js/pages/commitments/planning.tsx`)

Dipendenze tra feature
- Nella pagina di dettaglio della feature è presente la vista delle dipendenze (abilita, impedisce, richiede, sostituisce)
- Sono presenti i collegamenti alle feature referenziate (`resources/js/pages/features/show.tsx:120`)

Abbonamenti/Piani
- Selezione abbonamento: piani con nome/prezzo/intervallo, la selezione attiva una subscription (`resources/js/pages/plans/select.tsx:1`)

Impostazioni
- Profilo: modificare nome/e‑mail, caricare avatar (ottimizzato in WebP 256×256) (`resources/js/pages/settings/profile.tsx:1`)
- Cambio password: password attuale/nuova con conferma (`resources/js/pages/settings/password.tsx:1`)
- Aspetto: pagina Appearance disponibile (`routes/settings.php:19`)

Tenant (Mandanti)
- Panoramica: i propri Tenant, Tenant corrente, membri, inviti (`resources/js/pages/tenants/index.tsx:1`)
- Azioni: cambiare Tenant, invitare membri (token), accettare inviti

Navigazione e note
- I breadcrumb in tutte le pagine principali facilitano l'orientamento
- I messaggi di successo/errore vengono visualizzati come dialoghi/toast
- Le tabelle supportano filtraggio, ordinamento e paginazione

Screenshot (esempi – creare il file e collegare)
- Dashboard: `![Dashboard](images/dashboard.png)`
- Elenco feature: `![Elenco Feature](images/features-list.png)`
- Board feature: `![Board Feature](images/feature-board.png)`
- Dettagli pianificazione: `![Dettagli Pianificazione](images/planning-details.png)`
- Votazione (tabelle): `![Tabella Votazione](images/vote-session-table.png)`
- Votazione (schede): `![Schede Votazione](images/vote-session-cards.png)`
- Panoramica impegni: `![Impegni](images/commitments.png)`
- Tenant: `![Tenant](images/tenants.png)`
