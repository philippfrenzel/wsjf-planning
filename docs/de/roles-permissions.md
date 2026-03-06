# Rollen und Berechtigungen

Überblick (fachlich)
- Projektleiter: Vollzugriff auf Projekte, Planung und Steuerung
- Owner (Planning‑Verantwortliche): dürfen Plannings verwalten, für die sie eingetragen sind
- Deputies (Stellvertreter): dürfen Plannings mitverwalten
- Stakeholder: können an Plannings teilnehmen und Votes abgeben

Technische Einordnung
- Die App nutzt Anmeldungen mit E‑Mail/Passwort und E‑Mail‑Verifikation.
- Sichtbarkeit/Schreibrechte sind zusätzlich durch den aktuellen Tenant begrenzt (Multi‑Tenancy Scope).
- Routen zeigen die relevanten Bereiche, z. B. Projekte, Plannings, Features, Votes, Commitments sowie Settings.

Hinweis
- Die tatsächliche Erzwingung von Rollen kann projektspezifisch erweitert werden. Prüfen Sie ggf. die Controller/Routen, z. B. `routes/web.php:24` (geschützte Bereiche über `auth`/`verified`).

