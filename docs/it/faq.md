# FAQ e Troubleshooting

Generale
- Problema: "Il caricamento dell'avatar fallisce / JPEG non supportato"
  - Soluzione: attivare l'estensione del server Imagick o GD con JPEG, in alternativa caricare PNG/WebP (Settings › Profilo mostra un avviso)

- Problema: nessuna e‑mail per la verifica
  - Soluzione: il mailer predefinito è `log`. Per e‑mail reali configurare SMTP in `.env` (`MAIL_MAILER=smtp`, impostare host/porta/utente/password)

- Problema: nessun dato visibile
  - Soluzione: verificare che il Tenant corretto sia attivo (pagina "Tenants") e che si sia membri del Tenant

Domande sull'installazione
- Errore durante le migrazioni
  - Verificare che il database sia configurato correttamente e accessibile (file SQLite creato?)

Votazione/WSJF
- Inserimento valori nella vista tabellare
  - I valori sono numerici per ogni categoria per feature; nella vista a schede la posizione corrisponde al valore

Prestazioni/Sviluppo
- Modalità sviluppo: `APP_DEBUG=true`, Vite con `npm run dev`
- Build di produzione: `npm run build` (a seconda del deployment)


## Importazione feature da Jira CSV

- Domanda: le formattazioni Jira vengono mantenute durante l'importazione CSV?
  - Risposta: Sì! Durante l'importazione di feature da esportazioni CSV di Jira, le formattazioni Jira Wiki vengono automaticamente convertite in HTML. Formattazioni supportate:
    - Intestazioni: `h1.`, `h2.`, `h3.`, ecc.
    - Grassetto: `*text*` o `**text**`
    - Corsivo: `_text_`
    - Sottolineato: `+text+`
    - Barrato: `-text-`
    - Elenchi: `*` per elenchi non ordinati e `#` per elenchi numerati
    - Link: `[URL]` o `[Text|URL]`
    - Codice: `{{inline code}}` e `{code}...{code}` per blocchi di codice
    - Citazioni: `bq. quote text`
    - Tabelle: sintassi tabelle Jira con `||` per le intestazioni e `|` per le righe
  - Le formattazioni vengono automaticamente convertite durante l'importazione e sono correttamente visibili nella descrizione della feature.
