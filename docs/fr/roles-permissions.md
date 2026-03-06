# Rôles et autorisations

Vue d'ensemble (métier)
- Chef de projet : Accès complet aux projets, à la planification et au pilotage
- Owner (Responsable du planning) : peut gérer les plannings auxquels il est affecté
- Deputies (Suppléants) : peuvent co-gérer les plannings
- Parties prenantes : peuvent participer aux plannings et soumettre des votes

Classification technique
- L'application utilise une authentification par e‑mail/mot de passe avec vérification par e‑mail.
- La visibilité et les droits d'écriture sont en outre limités par le Tenant actuel (périmètre Multi‑Tenancy).
- Les routes indiquent les domaines pertinents, par ex. Projets, Plannings, Features, Votes, Commitments ainsi que Settings.

Remarque
- L'application effective des rôles peut être étendue selon les besoins du projet. Vérifiez le cas échéant les contrôleurs/routes, par ex. `routes/web.php:24` (zones protégées via `auth`/`verified`).
