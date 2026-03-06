# User Guide – Workflows

This chapter describes the most important areas and workflows of the application.

Login & Getting Started
- Landing page: Welcome/Landing, Login/Registration
- After login: Dashboard with KPIs and "My Active Plannings" (`resources/js/pages/dashboard.tsx:1`)

Projects
- View: Project list, details, create/edit/delete (`routes/web.php:62`)
- Fields: Project number, name, description, start date, project manager, deputy, Jira base URL
- Status: In Planning → In Development → In Acceptance → Completed (status changes in the edit dialog)
- Navigation: Projects → "New" to create

Features
- List: Filter (Jira Key, name, project, requester, status), sorting, pagination (`resources/js/pages/features/index.tsx:1`)
- Create/Edit: Jira Key, name, description (rich text supported), project, requester
- Board: Kanban board with drag & drop for status changes (In Planning, Approved, Implemented, Rejected, Obsolete, Archived) (`resources/js/pages/features/board.tsx:1`)
- Detail page: Feature details, dependencies, estimation components, estimations, description (`resources/js/pages/features/show.tsx:1`)

Estimations (Estimation Components)
- Components: functional/technical sub-aspects of a feature
- Estimations: Best Case, Most Likely, Worst Case, unit (hours/days/story points), notes
- Automatic: weighted average and standard deviation are calculated (`app/Models/Estimation.php:1`)
- Archiving/reactivating components is possible

Plannings
- Planning sessions per project with title, description, dates
- Responsible parties: Owner and Deputy, stakeholders can be added via selection (`app/Http/Controllers/PlanningController.php:1`)
- Assign features: During creation/editing or later
- Views: Tabs "Details & Common Vote" and "Features & Individual Votes" (`resources/js/pages/plannings/show.tsx:1`)

Voting (WSJF Categories)
- Categories: Business Value, Time Criticality, Risk/Opportunity
- Table view: Enter a numeric value per feature for each category (`resources/js/pages/votes/session.tsx:1`)
- Card view: Rank features per category via drag & drop (positions 1..n) (`resources/js/pages/votes/card-session.tsx:1`)
- Save: Button "Save Vote"
- Common Votes: Average values are automatically calculated for the planning creator (`app/Http/Controllers/VoteController.php:1`)

Commitments
- Purpose: Binding assignment of "Who does what?" per planning & feature
- Types: A/B/C/D (combination of priority/urgency), status: Proposal/Accepted/Completed
- List and detail views, editing with status transitions (`app/Http/Controllers/CommitmentController.php:1`)
- Overview per planning: Summary of all commitments (`resources/js/pages/commitments/planning.tsx`)

Dependencies Between Features
- On the feature detail page, view dependencies (enables, blocks, requires, replaces)
- Links to referenced features are available (`resources/js/pages/features/show.tsx:120`)

Subscriptions/Plans
- Select a plan: Plans with name/price/interval, selection activates a subscription (`resources/js/pages/plans/select.tsx:1`)

Settings
- Profile: Change name/email, upload avatar (optimized to WebP 256×256) (`resources/js/pages/settings/profile.tsx:1`)
- Change password: Current/new password with confirmation (`resources/js/pages/settings/password.tsx:1`)
- Appearance: Appearance page available (`routes/settings.php:19`)

Tenants
- Overview: Your tenants, current tenant, members, invitations (`resources/js/pages/tenants/index.tsx:1`)
- Actions: Switch tenant, invite members (token), accept invitations

Navigation & Notes
- Breadcrumbs on all main pages facilitate orientation
- Success/error messages appear as dialogs/toasts
- Tables support filtering, sorting, and pagination

Screenshots (Examples – Create file and link)
- Dashboard: `![Dashboard](images/dashboard.png)`
- Features list: `![Features List](images/features-list.png)`
- Feature board: `![Feature Board](images/feature-board.png)`
- Planning details: `![Planning Details](images/planning-details.png)`
- Voting (table): `![Voting Table](images/vote-session-table.png)`
- Voting (cards): `![Voting Cards](images/vote-session-cards.png)`
- Commitments overview: `![Commitments](images/commitments.png)`
- Tenants: `![Tenants](images/tenants.png)`
