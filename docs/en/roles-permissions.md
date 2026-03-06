# Roles and Permissions

Overview (Functional)
- Project Manager: Full access to projects, planning, and management
- Owner (Planning Responsible): May manage plannings they are assigned to
- Deputies: May co-manage plannings
- Stakeholders: Can participate in plannings and submit votes

Technical Classification
- The app uses email/password authentication with email verification.
- Visibility/write permissions are additionally restricted by the current tenant (Multi‑Tenancy Scope).
- Routes define the relevant areas, e.g., Projects, Plannings, Features, Votes, Commitments, and Settings.

Note
- The actual enforcement of roles can be extended on a project-specific basis. Check the controllers/routes if needed, e.g., `routes/web.php:24` (protected areas via `auth`/`verified`).
