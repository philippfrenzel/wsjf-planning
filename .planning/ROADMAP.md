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
- [x] Plan 01: Cashier foundation — laravel/cashier installed, Tenant billable, migrations, 14-day trial ✅
- [x] Plan 02: BillingController — Stripe Checkout, billing portal, subscription management ✅
- [x] Plan 03: Seat sync — member join/leave syncs subscription quantity ✅
- [x] Plan 04: Enforcement middleware — RequireSubscription, 'subscribed' alias, core routes gated ✅
- [~] Plan 05: Webhook handler — payment_succeeded, payment_failed, subscription.deleted (if planned)

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
*Last updated: 2026-02-28 after Phase 2 Plan 04 (enforcement-middleware) — complete*

---

## Milestone: v3.0 — Polish & UX

**Goal:** Complete Phase 4 execution and systematically polish every workflow and UI surface across the app so that teams can run a full WSJF session without friction.

**Phases:** 5 + 6 + 7 + 8 + 9

**Definition of Done:**
- Phase 4 features (one-click session start, vote progress, CSV export) are live
- Every destructive action uses a proper confirmation dialog; every form communicates loading and validation state
- No blank screens anywhere; every major list has an empty state
- Planners can see session readiness and vote progress at a glance
- New tenant owners are guided through onboarding before reaching the dashboard

### Phases

- [ ] **Phase 5: Foundation & Phase 4 Completion** — Wire centralized feedback infrastructure; deliver UX-01, UX-03, UX-04
- [ ] **Phase 6: Feedback Completeness** — Confirmation dialogs, form processing states, consistent validation
- [ ] **Phase 7: Empty States & Visual Polish** — Empty states on all major screens, autosave indicator, page transitions, board loading
- [ ] **Phase 8: Workflow Progress** — Vote completion bar, session readiness checklist, role-gated tooltips
- [ ] **Phase 9: Onboarding** — 3-step post-registration wizard for new tenant owners

### Phase Details

#### Phase 5: Foundation & Phase 4 Completion

**Goal:** The app has deduplicated loading infrastructure, a working toast/flash pipeline, centralized confirmation dialogs, and Phase 4's UX features (one-click session start, vote progress indicator, CSV export) delivered.

**Depends on:** Phase 4

**Requirements:** FOUND-01, FOUND-02, FOUND-03, FOUND-04, UX-01, UX-03, UX-04

**Success Criteria** (what must be TRUE when this phase completes):
1. Navigating between any two pages shows exactly one NProgress bar — no duplicate or conflicting spinners
2. After any server-side create / update / delete action, a toast notification appears in the corner carrying the Laravel flash message
3. A global `<Toaster>` and `<ConfirmDialogProvider>` are present in the app shell — no page needs to mount them independently
4. Planner can create a voting session from a project page with a single button click (no multi-step form required)
5. Planner sees a live stakeholder vote count ("X of Y voted") per feature on the planning session page
6. Planner can download a prioritized CSV export of session results from the session results view

**Plans:** 1/2 plans executed

Plans:
- [ ] 05-01-foundation-infrastructure-PLAN.md — Install deps, fix NProgress duplication, wire flash→toast pipeline, mount global Toaster + ConfirmDialogProvider
- [ ] 05-02-ux-feature-delivery-PLAN.md — One-click session start (UX-01), vote progress indicator (UX-03), CSV export smoke-test (UX-04)

---

#### Phase 6: Feedback Completeness

**Goal:** Every destructive action requires explicit confirmation; every form communicates submission state; every validation error appears inline next to the offending field.

**Depends on:** Phase 5

**Requirements:** FEED-01, FEED-02, FEED-03

**Success Criteria** (what must be TRUE when this phase completes):
1. Clicking Delete / Remove on any entity (feature, project, member, planning, invitation) opens an `AlertDialog` — `window.confirm()` is gone from the entire codebase
2. Clicking any form submit button disables it and shows a spinner icon while the HTTP request is in flight
3. Submitting any form with invalid data shows field-level error messages directly beneath each invalid input, consistently styled via `InputError`

**Plans:** 6 plans

Plans:
- [ ] 06-01-PLAN.md — FEED-01: Replace native confirm() in features/index, plannings/index, tenants/index
- [ ] 06-02-PLAN.md — FEED-01: Guard unguarded deletes in projects/index, commitments, DependencyManager, users/index
- [ ] 06-03-PLAN.md — FEED-02+03: Features domain — useForm migration + processing button + InputError (5 files)
- [ ] 06-04-PLAN.md — FEED-02+03: Projects domain — useForm migration + processing button + InputError
- [ ] 06-05-PLAN.md — FEED-02+03: Plannings domain — useForm migration + processing button + InputError
- [ ] 06-06-PLAN.md — FEED-02+03: Vote sessions isSaving binding + commitments InputError + plans/create

---

#### Phase 7: Empty States & Visual Polish

**Goal:** No major list screen shows a blank or near-blank state; the vote session auto-save communicates its status visually; page navigation has a subtle fade-in; the feature board gives loading feedback on drag.

**Depends on:** Phase 6

**Requirements:** POLISH-01, POLISH-02, POLISH-03, POLISH-04

**Success Criteria** (what must be TRUE when this phase completes):
1. Every major list screen (features, plannings, projects, members, vote session) shows a meaningful empty state — icon, descriptive message, and a role-appropriate call-to-action — when the list is empty
2. During vote session auto-save, an inline icon trio (Loader2 → CheckCircle2 → AlertCircle) replaces the raw "Speichern…" text to communicate saving / saved / error state
3. Navigating to any page produces a subtle CSS fade-in on the page content area (no flash of unstyled content)
4. Dragging a card on the feature board shows a visual loading state on that card while the status update request is in flight, then reflects the confirmed new state

**Plans:** TBD

---

#### Phase 8: Workflow Progress

**Goal:** Facilitators can see at a glance whether a planning session is ready to start and how voting is progressing; non-admin users understand why certain actions are disabled.

**Depends on:** Phase 7

**Requirements:** PROG-01, PROG-02, PROG-03

**Success Criteria** (what must be TRUE when this phase completes):
1. The planning session page shows a progress bar per feature with the exact count "X of Y stakeholders have voted" updating as votes are cast
2. The session setup page shows a readiness checklist with clear ✓ / ✗ indicators for: features attached, stakeholders assigned, and session ready to start
3. Hovering or focusing any disabled role-gated button shows a tooltip that names the required role or explains why the action is unavailable

**Plans:** TBD

---

#### Phase 9: Onboarding

**Goal:** New tenant owners are guided through workspace setup immediately after registration so they arrive at a functional dashboard — not an empty one.

**Depends on:** Phase 8

**Requirements:** ONBOARD-01

**Success Criteria** (what must be TRUE when this phase completes):
1. Immediately after registration, a new tenant owner sees a 3-step wizard (workspace name → create first project → invite a member) before the main dashboard is shown
2. After completing or explicitly dismissing the wizard, it never appears again for that user on any subsequent login or page load
3. Skipping a wizard step is allowed — the user lands on the dashboard with whatever partial setup they completed, and can finish setup manually

**Plans:** TBD

---

### Progress (v3.0)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 5. Foundation & Phase 4 Completion | 1/2 | In Progress|  |
| 6. Feedback Completeness | 0/6 | Not started | - |
| 7. Empty States & Visual Polish | 0/? | Not started | - |
| 8. Workflow Progress | 0/? | Not started | - |
| 9. Onboarding | 0/? | Not started | - |

---
*v3.0 roadmap added: 2025-07-14*
