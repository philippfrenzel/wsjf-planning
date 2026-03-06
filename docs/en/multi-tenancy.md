# Multi‑Tenancy

Model
- Single DB approach with a `tenant_id` column per tenant-related table
- The `tenants` table manages tenants and invitations
- Upon registration, a tenant is automatically created and assigned to the user

Usage
- Tenant switching: Menu "Tenants" → listed tenants → "Switch"
- Members: Display of the current tenant's members
- Invitations: Tenant owners can invite via email; invited users accept the invitation and become members

UI Page
- Tenants overview, switching, and invitations: `GET /tenants` (see `routes/web.php:100`)

Visibility
- All relevant queries are restricted to the current tenant of the logged-in user via a global scope (anonymous users cannot see any tenant data).
