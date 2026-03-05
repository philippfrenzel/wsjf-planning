# PI Planning Readiness Assessment — WSJF Planning Tool

**Datum:** 2026-03-05  
**Assessor:** RTE / Solution Architect (AI-gestützt)  
**Tooling:** Laravel 12 + Inertia.js + React/TypeScript  
**Repo:** `philippfrenzel/wsjf-planning`

---

## 1) Executive Summary

**Overall Readiness Score: 🟡 AMBER**

Das Tool deckt die **Priorisierung (WSJF)** und **Feature-Verwaltung** hervorragend ab, hat aber signifikante Lücken bei den klassischen PI-Planning-Output-Artefakten.

**3 Hauptgründe für AMBER:**

1. **PI Objectives fehlen komplett** — Kein Modell, kein UI, kein Workflow für Team/ART PI Objectives mit Business-Value-Vergabe durch Business Owner.
2. **Program Board / Iterationsplanung fehlt** — Keine Team- oder Iterations-Entitäten; kein visuelles Program Board mit Milestones & Dependencies pro Iteration.
3. **Kapazität & Risiko-Management fehlen** — Kein Capacity-Modell (Team/Velocity/Abwesenheiten), kein ROAM-Board für Risiken.

**Stärken:** WSJF-Voting (4 Dimensionen inkl. Job Size), Feature-Dependencies, State Machines, Jira-Integration, Multi-Tenancy, Commitment-Tracking, 3-Punkt-Estimation, CSV-Export.

---

## 2) Coverage-Matrix

| Domäne | Checklist Item | Status | Evidenz | Kommentar |
|--------|---------------|--------|---------|-----------|
| **A) Rahmen** | ART/Value Stream Definition | **PARTIAL** | `Project` model (`project_number`, `name`, `description`, `jira_base_uri`) | Projekte dienen als ART-Container, aber kein explizites Value-Stream-Mapping oder ART-Metadaten (Scope, Kunden, Zweck) |
| **A)** | PI Cadence & Calendar | **PARTIAL** | `Planning` model (`planned_at`, `executed_at`, `status`) | Plannings haben Datum, aber keine Iterations-Struktur (Start/Ende je Iteration, IP Sprint, Kalenderansicht) |
| **A)** | Rollen & Entscheidungsrechte | **YES** | `Role` model, `*Policy.php` (4 Policies), `docs/rollen-berechtigungen.md` | Admin, Planner, Voter, Stakeholder-Rollen mit Tenant-Scoping. Owner/Deputy pro Planning. Kein expliziter RTE/PM/SA/BO-Role |
| **A)** | DoR/DoD Definitionen | **NO** | Keine Evidenz | Keine Definition of Ready/Done Felder, Templates oder Gates |
| **A)** | Committed vs. Uncommitted | **PARTIAL** | `Commitment` model mit Typen A/B/C/D + Status Suggested→Accepted→Completed | Commitment-Typen bilden Priorität ab, aber keine explizite Committed/Uncommitted-Trennung auf PI-Objectives-Ebene |
| **B) Business** | Business Context (KPIs) | **PARTIAL** | `DashboardController`, `dashboard.tsx` (5 KPI-Charts) | Feature-Status, Commitments, Aging, WSJF-Coverage — aber keine strategischen Business-KPIs oder Markt-Context-Eingabe |
| **B)** | PI Vision | **NO** | Keine Evidenz | Kein Feld/Template für outcome-orientierte PI Vision |
| **B)** | Roadmap Snapshot | **NO** | Keine Evidenz | Keine Roadmap-Ansicht (aktuelles PI + Ausblick) |
| **B)** | OKRs/Strategic Themes | **NO** | Keine Evidenz | Keine Zuordnung Features → strategische Ziele |
| **C) Backlog** | Priorisierte Features | **YES** | `Feature` + `Vote` (4 WSJF-Dimensionen), `VoteService`, Board-/Tabellen-Ansicht | Kernstärke: vollständiges WSJF-Voting mit BV, TC, RR, Job Size |
| **C)** | Grobes Sizing | **YES** | `Estimation` + `EstimationComponent` (Best/MostLikely/WorstCase, weighted_case) | 3-Punkt-Schätzung mit gewichtetem Mittel und Standardabweichung |
| **C)** | Priorisierungslogik (WSJF) | **YES** | `VoteService.calculateAverageVotesForCreator()`, Card-/Table-Voting UI | WSJF on-the-fly berechnet (nicht persistiert); 4 Vote-Typen als DB-Enum |
| **C)** | NFRs/Quality Attributes | **NO** | Keine Evidenz | Keine Tagging/Kategorisierung für NFRs, Security, Performance etc. |
| **C)** | Enabler Features / Tech Debt | **NO** | Keine Evidenz | Features haben kein Type-Feld (Business vs. Enabler vs. Tech Debt) |
| **D) Depend.** | Cross-Team Dependencies | **PARTIAL** | `FeatureDependency` model (enables/blocks/requires/replaces), `FeatureDependencyController`, `lineage` View | Feature-zu-Feature Dependencies ✅. Aber: kein Team-Kontext, kein Producer/Consumer, kein "needed-by Iteration" |
| **D)** | Externe Abhängigkeiten | **NO** | Keine Evidenz | Nur Feature↔Feature intern; keine externen Vendor/ART/Legal Dependencies |
| **D)** | Release Constraints | **NO** | Keine Evidenz | Keine Milestones, Freeze-Dates oder Integrationsfenster |
| **E) Kapazität** | Team-Roster + Skills | **NO** | Keine Evidenz | `User` existiert, aber kein Team-Modell, keine Skill-Tags |
| **E)** | Kapazität pro Iteration | **NO** | Keine Evidenz | Keine Velocity/Capacity-Felder, keine Iterationsstruktur |
| **E)** | Allocations (BAU/TechDebt) | **NO** | Keine Evidenz | Keine Allokationsregeln |
| **F) Risiken** | ROAM Board | **NO** | Keine Evidenz | Kein Risk-Modell, kein ROAM-Klassifizierung |
| **F)** | Decision Log | **NO** | Keine Evidenz | Kein expliziter Decision-Log (Comments als Workaround möglich) |
| **G) Output** | PI Objectives Template | **NO** | Keine Evidenz | Kein PI-Objectives-Modell (nur Commitments als Proxy) |
| **G)** | Iteration Plans | **NO** | Keine Evidenz | Keine Iteration-Entität, keine Feature→Story-Zerlegung |
| **G)** | Program Board Standard | **NO** | `features/board.tsx` ist Kanban-Board (Status-Spalten), kein SAFe Program Board | Kein Team×Iteration Grid mit Milestones und Dependency-Strings |

---

## 3) Gap Backlog (priorisiert)

| Prio | Gap/Feature | Domäne | Problem im PI Planning | MVI Lösung | Optionen | Aufwand | Dep. | Owner |
|------|-------------|--------|----------------------|------------|----------|---------|------|-------|
| 1 | **PI Objectives** | G | Kein Planungs-Output; Teams können keine Objectives committen, BOs keinen BV vergeben | Neues Model `PiObjective` (planning_id, team/user, title, bv, committed, uncommitted). CRUD + UI auf Planning-Show | Später: Predictability Measure Dashboard | **M** | — | PM/RTE |
| 2 | **Team-Entität** | E | Kein Team-Kontext → keine Kapazität, kein Program Board, keine Team-Objectives | Model `Team` (tenant_id, name), Pivot `team_user`. Team-Zuweisung in Planning-Stakeholder ersetzen | Später: Skills, Velocity-History | **M** | — | SA |
| 3 | **Iterations-Struktur** | A/G | PI hat keine Zeitstruktur → kein Iteration Planning, kein Program Board | Model `Iteration` (planning_id, number, start, end, is_ip). Auto-Generierung aus PI-Daten | — | **S** | Team | SA |
| 4 | **Program Board** | G | Kein visuelles Board → Dependencies nicht sichtbar, kein Gesamtbild | Team×Iteration Grid-View, Feature-Cards platzierbar, Dependency-Strings als SVG-Lines | Drag&Drop, Milestone-Markers | **L** | Team, Iteration | SA |
| 5 | **Feature-Typ (Business/Enabler)** | C | Enabler/TechDebt nicht unterscheidbar → falsche Priorisierung, kein Runway-Tracking | Enum-Feld `type` auf Feature (business, enabler, tech_debt, nfr). Filter im Backlog | NFR-Tags, Runway-Dashboard | **S** | — | PO |
| 6 | **Kapazitäts-Management** | E | Keine Planungsgrundlage → Overcommitment | Felder auf Team-Iteration-Pivot: `capacity_points`, `absence_days`. Capacity-Anzeige im Planning | Load-Balancing Visualisierung | **M** | Team, Iteration | RTE |
| 7 | **ROAM Risk Board** | F | Risiken nicht systematisch erfasst → blinde Flecken | Model `Risk` (planning_id, title, owner, roam_status, description). ROAM-Board UI | Import von Retro-Items | **M** | — | RTE |
| 8 | **PI Vision / Business Context** | B | Kein Alignment sichtbar → Feature-Priorisierung ohne Kontext | Rich-Text-Feld `vision` auf Planning. Anzeige als Banner auf Planning-Show | Vision-Änderungshistorie | **S** | — | PM |
| 9 | **DoR/DoD Definitionen** | A | Keine Qualitätsgates → unklare Feature-Readiness | Konfigurierbare Checklisten pro Tenant. DoR-Gate vor Planning-Aufnahme | Automatische DoR-Prüfung | **M** | — | SA |
| 10 | **Externe Dependencies** | D | Vendor/ART-Abhängigkeiten unsichtbar → Risiken | Erweiterung `FeatureDependency` um Typ `external` + Freitext-Beschreibung | Separates Dependency-Board | **S** | — | RTE |
| 11 | **WSJF Score Persistierung** | C | Score nur on-the-fly → kein Trend, kein Snapshot | Computed column oder After-Vote-Hook der Score materialisiert | WSJF-History über PIs | **S** | — | SA |
| 12 | **Roadmap View** | B | Kein PI-übergreifender Ausblick | Timeline-View: PIs auf X-Achse, Features als Bars, farbcodiert nach Projekt | Gantt-Stil, Milestone-Markers | **L** | — | PM |

---

## 4) Entscheidungsunterstützung pro Gap

### 1. PI Objectives → **IMPLEMENT NOW**
- Ohne PI Objectives gibt es kein offizielles PI-Planning-Ergebnis
- Commitments (A/B/C/D) sind ein guter Proxy, aber kein Ersatz für BV-bewertete Team-Objectives
- MVI ist machbar in ~1 Sprint (CRUD + einfache UI)

### 2. Team-Entität → **IMPLEMENT NOW**
- Enabler für Kapazität, Program Board und Team-PI-Objectives
- Kann inkrementell eingeführt werden (erst Team→User, dann Kapazität)
- Ohne Teams ist jede Kapazitätsplanung unmöglich

### 3. Iterations-Struktur → **IMPLEMENT NOW**
- Trivial (Model + Auto-Generierung aus PI-Start/Ende + Dauer)
- Enabler für Program Board und Iteration Planning
- Blockiert Prio 4 und 6

### 4. Program Board → **DEFER** (nach Team + Iteration)
- Hoher Aufwand (L), aber sehr hoher visueller Impact
- Erst sinnvoll wenn Teams + Iterationen existieren
- Kann im nächsten PI priorisiert werden

### 5. Feature-Typ → **IMPLEMENT NOW**
- Minimaler Aufwand (S): 1 Migration + 1 Enum + Filter-Anpassung
- Sofort nutzbar für Enabler/Tech-Debt-Tracking
- Verbessert Backlog-Transparenz für PI Planning

### 6. Kapazitäts-Management → **DEFER** (nach Team + Iteration)
- Setzt Team + Iteration voraus
- Ohne diese Grundlage nicht sinnvoll implementierbar

### 7. ROAM Risk Board → **IMPLEMENT NOW**
- Standalone (keine Dependencies)
- Risiken sind ein zentrales PI-Planning-Artefakt
- MVI: Einfache CRUD-Tabelle mit ROAM-Status-Dropdown

### 8. PI Vision → **IMPLEMENT NOW**
- Minimaler Aufwand (S): 1 Feld auf Planning + Anzeige
- Stiftet sofortigen Alignment-Nutzen

### 9. DoR/DoD → **DEFER**
- Mittlerer Aufwand, oft initial besser als Prozess/Wiki-Seite gelöst
- Tool-Unterstützung kann nachziehen

### 10. Externe Dependencies → **IMPLEMENT NOW**
- Minimaler Aufwand (S): Erweiterung bestehendes Dependency-Modell
- Füllt einen blinden Fleck bei PI Planning

### 11. WSJF Persistierung → **DEFER**
- Nice-to-have; Score ist aktuell berechenbar
- Erst relevant für Trend-Analyse

### 12. Roadmap View → **DEFER**
- Hoher Aufwand; strategisch wertvoll, aber nicht PI-Planning-kritisch

---

## 5) Empfohlene Umsetzungsreihenfolge (MVI)

**Sofort umsetzbar (S-Aufwand, keine Dependencies):**

1. PI Vision-Feld auf Planning
2. Feature-Typ-Enum (Business/Enabler/TechDebt/NFR)
3. Externe Dependencies (Erweiterung FeatureDependency)

**Zusammenhängendes Arbeitspaket (M-Aufwand):**

4. Team-Modell (Model + Pivot + UI)
5. Iterations-Struktur (Model + Auto-Generierung)
6. PI Objectives (Model + CRUD + BV-Vergabe)
7. ROAM Risk Board (Model + CRUD + ROAM-Status)

**Spätere Erweiterungen (L-Aufwand, nach Grundlagen):**

8. Program Board (Team×Iteration Grid)
9. Kapazitäts-Management
10. Roadmap View
11. DoR/DoD Checklisten
12. WSJF Score Persistierung + Trend

---

## 6) Offene Fragen / fehlende Inputs

1. **Cadence**: Wie lang ist ein PI? Wie viele Iterationen? Gibt es eine IP-Iteration? → Benötigt für Iterations-Modell
2. **Team-Struktur**: Wie viele Teams arbeiten im ART? Sind diese stabil oder wechselnd? → Bestimmt Komplexität Team-Modell
3. **PI Objectives Workflow**: Sollen BOs den Business Value (1–10) direkt im Tool vergeben, oder reicht eine Freitext-Beschreibung?
4. **Program Board Format**: Soll das Program Board interaktiv sein (Drag&Drop) oder reicht eine statische Visualisierung?
5. **Jira-Sync-Tiefe**: Sollen PI Objectives / Iterations nach Jira zurückgeschrieben werden?
6. **Compliance**: Gibt es regulatorische Anforderungen (FINMA, ISO, SOC2) an Audit-Trails für PI-Planning-Entscheidungen?
7. **Bestehender Prozess**: Wird PI Planning aktuell analog (Whiteboard/Miro) durchgeführt? Falls ja, welche Artefakte sollen migriert werden?

---

## Anhang: Bestandsaufnahme vorhandener Artefakte

### Modelle (SAFe-relevant)
| Model | Felder (Auswahl) | State Machine |
|-------|-------------------|---------------|
| Feature | jira_key, name, description, requester_id, project_id | InPlanning → Approved/Rejected/Obsolete → Implemented → Archived |
| Planning | title, description, planned_at, executed_at, owner_id, deputy_id, status | InPlanning → InExecution → Completed |
| Project | project_number, name, jira_base_uri, start_date, project_leader_id, status | InPlanning → InRealization → InApproval → Closed |
| Commitment | planning_id, feature_id, user_id, commitment_type (A/B/C/D), status | Suggested → Accepted → Completed |
| Vote | user_id, feature_id, planning_id, type (BV/TC/RR/JobSize), value | — |
| Estimation | best_case, most_likely, worst_case, weighted_case, unit | — |
| FeatureDependency | feature_id, related_feature_id, type (enables/blocks/requires/replaces) | — |
| Comment | user_id, commentable (polymorphic), parent_id, body | — |

### Dashboard KPIs (vorhanden)
- Meine Projekte (Anzahl)
- Aktive Plannings (Anzahl)
- Sichtbare Features (Anzahl)
- Feature-Status Stacked Bar pro Planning
- Commitments Bar Chart pro Planning
- Feature Aging Area Chart
- WSJF Coverage (bewertet vs. offen) pro Planning

### CI/CD Pipelines
- `lint.yml` — PHP Pint + ESLint auf push/PR
- `tests.yml` — PHPUnit auf push/PR
