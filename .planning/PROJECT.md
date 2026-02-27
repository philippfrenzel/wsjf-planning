# WSJF Planning Tool

## What This Is

A multi-tenant SaaS application for agile teams to run lean PI Planning sessions using the Weighted Shortest Job First (WSJF) methodology. Teams create planning sessions, vote individually on Business Value, Time Criticality, and Risk/Opportunity per feature, and the system synthesizes a shared common score for prioritization.

## Core Value

Teams can run a complete WSJF planning session — from feature backlog through prioritized output — without friction, in a single sitting.

## Requirements

### Validated

<!-- Shipped features inferred from existing codebase. -->

- ✓ Multi-tenant architecture (single-DB, tenant_id scoping) — v0
- ✓ Feature management with status state machine (InPlanning → Approved → Implemented etc.) — v0
- ✓ Planning sessions with stakeholder assignment — v0
- ✓ Individual voting on Business Value, Time Criticality, Risk/Opportunity — v0
- ✓ Common vote auto-calculation (average of stakeholder votes) — v0
- ✓ Estimation components (Best/Most Likely/Worst Case, weighted average) — v0
- ✓ Commitments per feature per planning — v0
- ✓ Comment threads on Features, Plannings, Projects — v0
- ✓ Feature dependency graph (lineage view) — v0
- ✓ Feature board (Kanban by status) — v0
- ✓ Role model data structure (roles table, Role model) — v0

### Active

- [ ] Email invitation flow — users can invite teammates into their tenant via email link
- [ ] Role system: SuperAdmin / Admin / Planner / Voter enforced across the app
- [ ] Tenant management UI — owner can view members, revoke access, manage invitations
- [ ] Stripe per-seat billing — subscription tied to number of active tenant members
- [ ] Billing portal — users can manage subscription, view invoices, upgrade/downgrade seats
- [ ] Subscription enforcement — features gated behind active subscription

### Out of Scope (v1)

- Job Size voting — deferred to v2 (completes the WSJF formula)
- Simplified planning session UX — deferred to v2
- Prioritized backlog output / export — deferred to v2
- OAuth / SSO login — email/password sufficient for v1
- Mobile app — web-first
- Paddle / other payment processors — Stripe only for v1

## Context

**Stack:** Laravel 12, React 19 + TypeScript, Inertia.js, Tailwind CSS, shadcn/ui, SQLite/MySQL.

**Existing multi-tenancy:** `tenant_id` column on all tenant-scoped models. Global Eloquent scope enforces isolation on reads. `TenantInvitation` model exists but invitation flow is not implemented end-to-end.

**Existing subscription scaffolding:** `Plan`, `Subscription`, `SubscriptionController`, `PlanController` models/controllers exist as stubs. Not yet connected to a payment processor.

**Existing roles:** `Role` model + `role_user` pivot table exist. No middleware or policy enforcement on roles yet. Admin-only routes in `PlanningController` have dead role guards (commented out).

**Auth:** Standard Laravel auth (Breeze-style). Email verification available.

**Target users:** Agile teams (SAFe, LeSS, or custom) running PI Planning or Sprint Planning sessions.

## Constraints

- **Tech Stack**: Laravel 12 + React/Inertia — no framework switches
- **Payments**: Stripe only — no Paddle, no manual invoicing in v1
- **Multi-tenancy**: Single-DB model — no database-per-tenant
- **Auth**: Email/password only for v1 — no OAuth

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Per-seat pricing | Aligns cost with value as teams grow | — Pending |
| Stripe for billing | Industry standard, laravel/cashier package available | — Pending |
| Email invitation (not self-serve tenant join) | Keeps tenant isolation clean; owner controls membership | — Pending |
| 4-role system (SuperAdmin/Admin/Planner/Voter) | Matches typical PI Planning org structure | — Pending |
| Job Size voting deferred to v2 | Multi-tenancy + billing are prerequisites for a sellable product | — Pending |

---
*Last updated: 2026-02-27 after initial GSD project initialization*
