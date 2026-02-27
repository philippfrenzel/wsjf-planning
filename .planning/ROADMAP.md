# Roadmap: WSJF Planning Tool

**Goal:** Ship a sellable, multi-tenant SaaS WSJF planning tool with clean team management and Stripe billing.

---

## Phase 1: Tenant Invitations & Role Enforcement

**Goal:** A tenant owner can invite teammates by email, and the app enforces 4 roles (SuperAdmin / Admin / Planner / Voter) consistently across all routes and policies.

**Why first:** Everything else — billing, planning, voting — requires knowing who belongs to which tenant and what they're allowed to do. Without this, the product can't be sold to teams.

**Requirements**: INV-01 → INV-05, ROLE-01 → ROLE-07, TEN-01 → TEN-04

**Progress:**
- [x] Plan 01: Role foundation — migration, User helpers, Gate bypass, TenantScope bypass ✅
- [x] Plan 02: Invitation flow — email dispatch, Voter role on accept, registration token handling ✅
- [x] Plan 04: Policy role enforcement — FeaturePolicy, PlanningPolicy, VotePolicy, CommitmentPolicy updated ✅
- [x] Plan 03: RequireRole middleware — `role:Admin` alias registered, admin routes gated, inline checks removed ✅
- [~] Plan 05: Tenant management UI — Tasks 1 & 2 complete; awaiting Task 3 checkpoint (human-verify)

**Deliverables:**
- End-to-end invitation flow: invite by email → signed URL → accept → join tenant with Voter role ✅
- `TenantInvitation` model fully wired (expiry, status, acceptance) ✅
- Roles middleware + policy updates: `RequireRole` middleware, all existing policies updated to check roles
- Tenant management page: members list, role change, remove member, pending invitations
- Admin-only routes (`adminPlannings`, `setCreator`) properly gated on Admin role ✅
- SuperAdmin global access (exempt from tenant scoping)

**Done when:** A user can be invited, accept, log in, and be restricted to exactly what their role allows — across Features, Plannings, Projects, Votes, and Comments.

---

## Phase 2: Stripe Subscription & Per-Seat Billing

**Goal:** Tenants can subscribe, pay per seat, and access the billing portal. Inactive subscriptions block access to core features.

**Why second:** Multi-tenancy must be clean before attaching money to it. After Phase 1, the membership model is reliable enough to meter.

**Requirements**: BILL-01 → BILL-08, ENF-01 → ENF-02

**Progress:**
- [ ] Plan 01: Cashier foundation — laravel/cashier installed, Tenant billable, migrations, 14-day trial ✅
- [ ] Plan 02: BillingController — Stripe Checkout, billing portal, subscription management
- [ ] Plan 03: Seat sync — member join/leave syncs subscription quantity
- [ ] Plan 04: Webhook handler — payment_succeeded, payment_failed, subscription.deleted
- [ ] Plan 05: Subscription enforcement middleware — blocks non-subscribed tenants

**Done when:** A new tenant can sign up, start a trial, enter a card, be billed per seat, cancel, and see their billing history — all without manual intervention.

---

## Phase 3: WSJF Formula Completion (Job Size Voting)

**Goal:** Teams can vote on Job Size per feature, completing the WSJF formula and seeing a ranked backlog.

**Why third:** The core product promise is WSJF. Phases 1 and 2 make it sellable; Phase 3 makes it complete.

**Requirements**: WSJF-01 → WSJF-04

**Deliverables:**
- New vote type: `JobSize` with Fibonacci scale (1, 2, 3, 5, 8, 13, 20)
- Job Size voting integrated into existing voting session UI
- WSJF score auto-calculated: `(BV + TC + RR) / JobSize`
- Planning show page displays features ranked by WSJF score
- Common vote recalculation includes Job Size average

**Done when:** A planning session produces a prioritized feature list with WSJF scores that a team can act on immediately.

---

## Phase 4: Planning Session UX & Export

**Goal:** Simplify the end-to-end voting session experience and add export.

**Why fourth:** Once the formula is complete, polish the experience for recurring use.

**Requirements**: UX-01 → UX-04

**Deliverables:**
- One-click session creation from project
- Unified voting view (all features + all vote types on one screen)
- Vote progress indicator for planner (X of Y stakeholders voted)
- Prioritized backlog export (CSV)

**Done when:** A team can start, complete, and export a full WSJF session in under 30 minutes with no onboarding friction.

---

## Milestone: v1.0 — Sellable SaaS

**Phases:** 1 + 2
**Definition of Done:**
- A team can sign up, invite members, assign roles, and pay per seat
- Core WSJF planning features (existing) work within the enforced tenancy model
- Stripe billing is live and webhooks are handled

## Milestone: v2.0 — Complete WSJF Tool

**Phases:** 3 + 4
**Definition of Done:**
- Teams get a complete WSJF score (including Job Size)
- Session UX is streamlined
- Results are exportable

---
*Roadmap defined: 2026-02-27*
*Last updated: 2026-02-28 after Phase 2 Plan 01 (cashier-foundation) — complete*
