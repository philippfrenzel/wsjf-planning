# Multi‑Tenancy (Mandantenfähigkeit)

Modell
- Single‑DB Ansatz mit `tenant_id` Spalte pro mandantenbezogener Tabelle
- Tabelle `tenants` verwaltet Mandanten und Einladungen
- Beim Registrieren wird automatisch ein Tenant erstellt und dem Benutzer zugewiesen

Bedienung
- Tenant‑Wechsel: Menü „Tenants“ → gelistete Tenants → „Wechseln“
- Mitglieder: Anzeige der Mitglieder des aktuellen Tenants
- Einladungen: Besitzer eines Tenants können via E‑Mail einladen; eingeladene Benutzer akzeptieren die Einladung und werden Mitglieder

UI‑Seite
- Tenants‑Übersicht, Wechsel und Einladungen: `GET /tenants` (siehe `routes/web.php:100`)

Sichtbarkeit
- Alle relevanten Abfragen sind per globalem Scope auf den aktuellen Tenant des eingeloggten Users eingeschränkt (anonyme Benutzer sehen keine Tenant‑Daten).

