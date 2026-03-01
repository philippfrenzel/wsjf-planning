# Requirements: WSJF Planning Tool

**Defined:** 2026-02-27
**Core Value:** Teams can run a complete WSJF planning session without friction, in a single sitting.

## v1 Requirements

### Tenant Invitations

- [ ] **INV-01**: Tenant owner/admin can invite a user by email address
- [ ] **INV-02**: Invited user receives an email with a secure, expiring invitation link
- [ ] **INV-03**: Invited user can accept invitation and join the tenant (existing account or register)
- [ ] **INV-04**: Pending invitations are visible and cancellable by admin
- [ ] **INV-05**: Accepting an invitation automatically assigns the Voter role

### Roles & Permissions

- [ ] **ROLE-01**: Four roles exist and are enforced: SuperAdmin, Admin, Planner, Voter
- [ ] **ROLE-02**: SuperAdmin can manage all tenants and users (global)
- [ ] **ROLE-03**: Admin can manage members, roles, and invitations within their tenant
- [ ] **ROLE-04**: Planner can create/edit/delete Plannings, Features, Projects within their tenant
- [ ] **ROLE-05**: Voter can participate in voting sessions and view results; cannot manage data
- [ ] **ROLE-06**: Admin can change the role of any tenant member (except their own SuperAdmin flag)
- [ ] **ROLE-07**: All existing admin-only routes (e.g. admin plannings) are gated on Admin role

### Tenant Management

- [ ] **TEN-01**: Tenant owner can view all members and their roles
- [ ] **TEN-02**: Tenant owner/admin can remove a member from the tenant
- [ ] **TEN-03**: Tenant settings page shows current subscription status and seat count
- [ ] **TEN-04**: Tenant name is editable by admin

### Subscription & Billing

- [ ] **BILL-01**: Stripe integration via laravel/cashier
- [ ] **BILL-02**: Plans are defined with per-seat pricing (e.g. €X/seat/month)
- [ ] **BILL-03**: New tenant gets a free trial period (e.g. 14 days) before billing activates
- [ ] **BILL-04**: Subscription is created when tenant owner adds a payment method
- [ ] **BILL-05**: Seat count updates automatically when members are added/removed
- [ ] **BILL-06**: Tenant owner can access Stripe billing portal to manage payment method and view invoices
- [ ] **BILL-07**: Tenants with lapsed subscriptions are blocked from core features (grace period allowed)
- [ ] **BILL-08**: Stripe webhooks handle payment success, failure, and cancellation events

### Subscription Enforcement

- [ ] **ENF-01**: Routes requiring active subscription return a clear upgrade prompt when subscription is inactive
- [ ] **ENF-02**: SuperAdmin accounts are exempt from subscription enforcement

## v2 Requirements

### WSJF Formula Completion

- **WSJF-01**: Each feature in a planning session can be voted on for Job Size (separate from CoD votes)
- **WSJF-02**: Job Size vote types: Fibonacci scale (1, 2, 3, 5, 8, 13, 20)
- **WSJF-03**: WSJF Score = (BusinessValue + TimeCriticality + RiskOpportunity) / JobSize — auto-calculated per feature
- **WSJF-04**: Planning session shows features ranked by WSJF score

### Planning Session UX

- **UX-01**: One-click session start — planner can create a session from a project with one action
- **UX-02**: Voting view shows all features with vote sliders/inputs on a single page
- **UX-03**: Real-time vote progress — planner sees how many stakeholders have voted
- **UX-04**: Exported prioritized backlog (CSV/PDF) after session completes

---

## v3.0 — Polish & UX

### Foundation & Infrastructure

- [x] **FOUND-01**: User benefits from sonner, alert-dialog, and progress shadcn components installed and available app-wide
- [x] **FOUND-02**: User experiences exactly one NProgress loading indicator per navigation (no duplicate spinner)
- [x] **FOUND-03**: User sees Laravel flash messages (success/error) surfaced as toast notifications via Inertia shared props
- [x] **FOUND-04**: A global Toaster and ConfirmDialogProvider are mounted at app shell level, requiring no per-page setup

### Feedback Completeness

- [x] **FEED-01**: User is shown a proper confirmation dialog (not window.confirm()) before any destructive action (delete, remove member, cancel)
- [x] **FEED-02**: User sees form submission buttons enter a loading/processing state while the request is in flight
- [x] **FEED-03**: User sees inline validation errors displayed consistently via InputError on all form fields

### Empty States & Visual Polish

- [ ] **POLISH-01**: User sees a meaningful empty state (icon, message, call-to-action) on every major list screen (features, plannings, projects, members, votes)
- [ ] **POLISH-02**: User sees an autosave indicator (saving / saved / error) in the vote session during debounced auto-save
- [ ] **POLISH-03**: User experiences a subtle page content fade-in on navigation using CSS transitions
- [ ] **POLISH-04**: User sees consistent loading feedback on the feature board (Kanban) when dragging changes a card's status

### Workflow Progress

- [ ] **PROG-01**: Planner sees a vote completion progress bar (X of Y stakeholders voted) per feature in the planning session
- [ ] **PROG-02**: User sees a planning session readiness checklist (features attached, stakeholders assigned, ready to start) on the session setup page
- [ ] **PROG-03**: Non-admin users see a tooltip on disabled role-gated action buttons explaining why the action is unavailable

### Onboarding

- [ ] **ONBOARD-01**: New tenant owner is guided through a 3-step post-registration wizard (workspace name → create first project → invite a member) before reaching the dashboard

## Out of Scope

| Feature | Reason |
|---------|--------|
| OAuth / SSO login | Email/password sufficient for v1; reduces complexity |
| Mobile app | Web-first strategy |
| Paddle or other processors | Stripe handles EU VAT with Tax; one processor for v1 |
| Database-per-tenant | Single-DB multi-tenancy already established |
| Real-time voting (WebSockets) | Page-based voting is sufficient for v1 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INV-01 | Phase 1 | Pending |
| INV-02 | Phase 1 | Pending |
| INV-03 | Phase 1 | Pending |
| INV-04 | Phase 1 | Pending |
| INV-05 | Phase 1 | Pending |
| ROLE-01 | Phase 1 | Pending |
| ROLE-02 | Phase 1 | Pending |
| ROLE-03 | Phase 1 | Pending |
| ROLE-04 | Phase 1 | Pending |
| ROLE-05 | Phase 1 | Pending |
| ROLE-06 | Phase 1 | Pending |
| ROLE-07 | Phase 1 | Pending |
| TEN-01 | Phase 1 | Pending |
| TEN-02 | Phase 1 | Pending |
| TEN-03 | Phase 1 | Pending |
| TEN-04 | Phase 1 | Pending |
| BILL-01 | Phase 2 | Pending |
| BILL-02 | Phase 2 | Pending |
| BILL-03 | Phase 2 | Pending |
| BILL-04 | Phase 2 | Pending |
| BILL-05 | Phase 2 | Pending |
| BILL-06 | Phase 2 | Pending |
| BILL-07 | Phase 2 | Pending |
| BILL-08 | Phase 2 | Pending |
| ENF-01 | Phase 2 | Pending |
| ENF-02 | Phase 2 | Pending |
| UX-01 | Phase 5 | Pending |
| UX-03 | Phase 5 | Pending |
| UX-04 | Phase 5 | Pending |
| FOUND-01 | Phase 5 | Complete |
| FOUND-02 | Phase 5 | Complete |
| FOUND-03 | Phase 5 | Complete |
| FOUND-04 | Phase 5 | Complete |
| FEED-01 | Phase 6 | Complete |
| FEED-02 | Phase 6 | Complete |
| FEED-03 | Phase 6 | Complete |
| POLISH-01 | Phase 7 | Pending |
| POLISH-02 | Phase 7 | Pending |
| POLISH-03 | Phase 7 | Pending |
| POLISH-04 | Phase 7 | Pending |
| PROG-01 | Phase 8 | Pending |
| PROG-02 | Phase 8 | Pending |
| PROG-03 | Phase 8 | Pending |
| ONBOARD-01 | Phase 9 | Pending |

**Coverage:**
- v1 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0 ✓

**v3.0 Coverage:**
- v3.0 requirements: 18 total (FOUND-01→04, UX-01, UX-03, UX-04, FEED-01→03, POLISH-01→04, PROG-01→03, ONBOARD-01)
- Mapped to phases: 18
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-27*
*Last updated: 2026-02-27 after initial GSD project initialization*
