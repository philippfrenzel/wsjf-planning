# Benutzerhandbuch – Arbeitsabläufe

Dieses Kapitel beschreibt die wichtigsten Bereiche und Workflows der Anwendung.

Anmeldung & Start
- Startseite: Willkommen/Landing, Login/Registrierung
- Nach Login: Dashboard mit KPIs und „Meine gültigen Plannings“ (`resources/js/pages/dashboard.tsx:1`)

Projekte
- Ansicht: Projekte‑Liste, Details, Erstellen/Bearbeiten/Löschen (`routes/web.php:62`)
- Felder: Projektnummer, Name, Beschreibung, Startdatum, Projektleiter, Stellvertreter, Jira‑Basis‑URL
- Status: In Planung → In Realisierung → In Abnahme → Abgeschlossen (Statuswechsel im Bearbeiten‑Dialog)
- Navigation: Projekte → „Neu“ zum Anlegen

Features
- Liste: Filter (Jira Key, Name, Projekt, Anforderer, Status), Sortierung, Pagination (`resources/js/pages/features/index.tsx:1`)
- Anlegen/Bearbeiten: Jira‑Key, Name, Beschreibung (Rich‑Text möglich), Projekt, Anforderer
- Board: Kanban‑Board mit Drag‑&‑Drop zum Statuswechsel (In Planung, Genehmigt, Implementiert, Abgelehnt, Obsolet, Archiviert) (`resources/js/pages/features/board.tsx:1`)
- Detailseite: Feature‑Details, Abhängigkeiten, Schätzungskomponenten, Schätzungen, Beschreibung (`resources/js/pages/features/show.tsx:1`)

Schätzungen (Estimation Components)
- Komponenten: fachliche/technische Teilaspekte eines Features
- Schätzungen: Best Case, Most Likely, Worst Case, Einheit (Stunden/Tage/Story Points), Notizen
- Automatik: gewichteter Durchschnitt und Standardabweichung werden berechnet (`app/Models/Estimation.php:1`)
- Archivieren/Reaktivieren von Komponenten möglich

Plannings
- Planungssitzungen pro Projekt mit Titel, Beschreibung, Terminen
- Verantwortliche: Owner und Deputy, Stakeholder per Auswahl hinzufügen (`app/Http/Controllers/PlanningController.php:1`)
- Features zuordnen: Beim Erstellen/Bearbeiten oder später zuweisen
- Anzeigen: Tabs „Details & Common Vote“ und „Features & Individual Votes“ (`resources/js/pages/plannings/show.tsx:1`)

Voting (WSJF‑Kategorien)
- Kategorien: Business Value, Time Criticality, Risk/Opportunity
- Tabellen‑Ansicht: Für jede Kategorie numerischen Wert je Feature eingeben (`resources/js/pages/votes/session.tsx:1`)
- Karten‑Ansicht: Per Drag‑&‑Drop Features je Kategorie ranken (Positionen 1..n) (`resources/js/pages/votes/card-session.tsx:1`)
- Speichern: Button „Abstimmung speichern“
- Common Votes: Durchschnittswerte werden für den Planning‑Ersteller automatisch berechnet (`app/Http/Controllers/VoteController.php:1`)

Commitments
- Zweck: Verbindliche Zuordnung „Wer macht was?“ pro Planning & Feature
- Typen: A/B/C/D (Kombination von Priorität/Dringlichkeit), Status: Vorschlag/Angenommen/Erledigt
- Listen‑ und Detailansichten, Bearbeiten mit Statusübergängen (`app/Http/Controllers/CommitmentController.php:1`)
- Übersicht je Planning: Zusammenfassung aller Commitments (`resources/js/pages/commitments/planning.tsx`)

Abhängigkeiten zwischen Features
- In der Feature‑Detailseite Sicht auf Abhängigkeiten (ermöglicht, verhindert, bedingt, ersetzt)
- Verlinkungen zu referenzierten Features vorhanden (`resources/js/pages/features/show.tsx:120`)

Abonnements/Pläne
- Abo auswählen: Pläne mit Name/Preis/Intervall, Auswahl führt zu aktiver Subscription (`resources/js/pages/plans/select.tsx:1`)

Einstellungen
- Profil: Name/E‑Mail ändern, Avatar hochladen (optimiert zu WebP 256×256) (`resources/js/pages/settings/profile.tsx:1`)
- Passwort ändern: aktuelles/neues Passwort mit Bestätigung (`resources/js/pages/settings/password.tsx:1`)
- Darstellung: Appearance‑Seite vorhanden (`routes/settings.php:19`)

Tenants (Mandanten)
- Übersicht: Eigene Tenants, aktueller Tenant, Mitglieder, Einladungen (`resources/js/pages/tenants/index.tsx:1`)
- Aktionen: Tenant wechseln, Mitglieder einladen (Token), Einladungen annehmen

Navigation & Hinweise
- Breadcrumbs in allen Hauptseiten erleichtern Orientierung
- Erfolgs-/Fehlermeldungen erscheinen als Dialoge/Toasts
- Tabellen unterstützen Filterung, Sortierung und Pagination

Screenshots (Beispiele – Datei anlegen und verlinken)
- Dashboard: `![Dashboard](images/dashboard.png)`
- Features‑Liste: `![Features Liste](images/features-list.png)`
- Feature‑Board: `![Feature Board](images/feature-board.png)`
- Planning‑Details: `![Planning Details](images/planning-details.png)`
- Voting (Tabellen): `![Voting Tabelle](images/vote-session-table.png)`
- Voting (Karten): `![Voting Karten](images/vote-session-cards.png)`
- Commitments‑Übersicht: `![Commitments](images/commitments.png)`
- Tenants: `![Tenants](images/tenants.png)`

