<?php

namespace App\Http\Controllers;

use App\Models\Planning;
use App\Models\Project;
use App\Models\User;
use App\Models\Feature; // Feature Model importieren
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Services\PlanningService;
use App\Services\VoteService;
use App\Http\Requests\StorePlanningRequest;
use App\Http\Requests\UpdatePlanningRequest;
use Illuminate\Http\RedirectResponse;

class PlanningController extends Controller
{
    public function __construct(
        private readonly PlanningService $planningService,
        private readonly VoteService $voteService,
    ) {
        $this->authorizeResource(Planning::class, 'planning');
    }

    public function index()
    {
        $plannings = Planning::with(['project:id,name', 'stakeholders:id,name'])
            ->withCount(['features', 'stakeholders'])
            ->latest('created_at')
            ->paginate(20);

        return Inertia::render('plannings/index', [
            'plannings' => $plannings,
            'hasProjects' => \App\Models\Project::exists(),
        ]);
    }

    public function create()
    {
        $tenantId = Auth::user()->current_tenant_id;
        $users = User::whereHas('tenants', fn($q) => $q->where('tenants.id', $tenantId))->get(['id', 'name']);

        return Inertia::render('plannings/create', [
            'users' => $users,
            'projects' => Project::where('tenant_id', $tenantId)->get(['id', 'name']),
        ]);
    }

    public function store(StorePlanningRequest $request)
    {
        $validated = $request->validated();

        $stakeholderIds = $validated['stakeholder_ids'] ?? [];
        $featureIds = $validated['feature_ids'] ?? [];

        unset($validated['stakeholder_ids'], $validated['feature_ids']);

        $planning = $this->planningService->create(
            $validated + ['created_by' => Auth::id()],
            $stakeholderIds,
            $featureIds
        );

        return redirect()->route('plannings.index')->with('success', 'Planning erfolgreich erstellt.');
    }

    /**
     * One-click session start: creates a Planning pre-populated with all project features
     * and all tenant stakeholders, then redirects to plannings.edit for review.
     */
    public function quickStart(Project $project): RedirectResponse
    {
        // Security: verify project belongs to current tenant (belt-and-suspenders;
        // global TenantScope on Project model also scopes the route model binding)
        abort_if(
            $project->tenant_id !== Auth::user()->current_tenant_id,
            403,
            'Unauthorized'
        );

        // Auto-generate title
        $title = $project->name . ' — ' . now()->format('Y-m-d');

        // Create the planning (status = 'open'; planner reviews before going live)
        $planning = Planning::create([
            'project_id' => $project->id,
            'title'      => $title,
            'status'     => 'open',
            'created_by' => Auth::id(),
        ]);

        // Attach all project features via pivot
        $featureIds = Feature::where('project_id', $project->id)->pluck('id');
        $planning->features()->sync($featureIds);

        // Attach all current-tenant users as stakeholders via pivot
        $userIds = User::whereHas('tenants', function ($q) {
            $q->where('tenants.id', Auth::user()->current_tenant_id);
        })->pluck('id');
        $planning->stakeholders()->sync($userIds);

        // Redirect to edit so planner can review/trim before going live
        return redirect()
            ->route('plannings.edit', $planning->id)
            ->with('success', 'Planungssession "' . $title . '" wurde erstellt. Bitte Teilnehmer und Features prüfen.');
    }

    public function show(Planning $planning)
    {
        $planningId = $planning->id;
        $creatorId = $planning->created_by;

        // IDs der dem Planning zugeordneten Stakeholder (Stammdaten)
        $stakeholderIds = $planning->stakeholders()->pluck('users.id');

        $planning->load([
            'project:id,name,jira_base_uri',
            'stakeholders:id,name,email',
            'creator:id,name',
            'features' => function ($query) use ($planning) {
                $query->where('project_id', $planning->project_id)
                    ->select('features.id', 'features.jira_key', 'features.name', 'features.project_id');
            },
            'features.project:id,name,jira_base_uri',
            'features.votes' => function ($query) use ($planningId, $stakeholderIds) {
                $query->where('planning_id', $planningId)
                    ->whereIn('user_id', $stakeholderIds);
            },
            'features.votes.user:id,name',
            'features.commitments' => function ($query) use ($planningId) {
                $query->where('planning_id', $planningId);
            },
            'features.commitments.user:id,name',
        ]);

        // Attach common votes per feature using the scoped method (no request coupling)
        if ($creatorId) {
            foreach ($planning->features as $feature) {
                $feature->setRelation(
                    'commonvotes',
                    $feature->commonVotesForPlanning($planningId, $creatorId)->get()
                );
            }
        }

        // Stakeholder (User) mit ihrer Stimmenanzahl in der aktuellen Planning-Session laden
        $stakeholders = User::select('users.id', 'users.name', 'users.email')
            ->selectRaw('COUNT(votes.id) as votes_count')
            ->join('planning_stakeholder', function ($join) use ($planning) {
                $join->on('users.id', '=', 'planning_stakeholder.user_id')
                    ->where('planning_stakeholder.planning_id', '=', $planning->id);
            })
            ->leftJoin('votes', function ($join) use ($planning) {
                $join->on('users.id', '=', 'votes.user_id')
                    ->where('votes.planning_id', '=', $planning->id);
            })
            ->groupBy('users.id', 'users.name', 'users.email')
            ->get();

        return Inertia::render('plannings/show', [
            'planning' => $planning,
            'stakeholders' => $stakeholders,
        ]);
    }

    public function edit(Planning $planning)
    {
        $tenantId = Auth::user()->current_tenant_id;
        $users = User::whereHas('tenants', fn($q) => $q->where('tenants.id', $tenantId))->get(['id', 'name', 'email']);
        $features = Feature::where('project_id', $planning->project_id)
            ->get()
            ->map(fn($feature) => [
                'id' => $feature->id,
                'jira_key' => $feature->jira_key,
                'name' => $feature->name,
                'project_id' => $feature->project_id,
                'status_details' => $feature->status_details,
            ])->values(); // Features des Projekts laden

        return Inertia::render('plannings/edit', [
            'planning' => $planning->load([
                'owner:id,name',
                'deputy:id,name',
                'stakeholders:id,name,email',
                'features:id,name,jira_key,project_id'
            ]),
            'users' => $users,
            'projects' => Project::where('tenant_id', $tenantId)->get(['id', 'name']),
            'features' => $features, // Features an die Komponente übergeben
        ]);
    }

    public function update(UpdatePlanningRequest $request, Planning $planning)
    {
        $validated = $request->validated();

        $stakeholderIds = $validated['stakeholder_ids'] ?? [];
        $featureIds = $validated['feature_ids'] ?? [];

        unset($validated['stakeholder_ids'], $validated['feature_ids']);

        $this->planningService->update($planning, $validated, $stakeholderIds, $featureIds);

        return redirect()->route('plannings.index')->with('success', 'Planning erfolgreich aktualisiert.');
    }

    public function destroy(Planning $planning)
    {
        $planning->delete();
        return redirect()->route('plannings.index')->with('success', 'Planning gelöscht.');
    }

    /**
     * Stößt die Berechnung der Common Votes für ein Planning an.
     */
    public function recalculateCommonVotes(string $planningId)
    {
        $planning = Planning::findOrFail($planningId);
        $this->authorize('update', $planning);
        // Vote-Logik über Service aufrufen
        $this->voteService->calculateAverageVotesForCreator($planning);

        return redirect()->route('plannings.show', $planning->id)
            ->with('success', 'Common Votes wurden neu berechnet.');
    }

    /**
     * Export the prioritized WSJF backlog for a planning as a CSV download.
     */
    public function exportCsv(Planning $planning)
    {
        $this->authorize('view', $planning);

        $creatorId = $planning->created_by;

        $planning->load([
            'features' => function ($query) use ($planning) {
                $query->where('project_id', $planning->project_id)
                    ->select('features.id', 'features.jira_key', 'features.name', 'features.project_id');
            },
        ]);

        // Attach common votes (same pattern as show())
        if ($creatorId) {
            foreach ($planning->features as $feature) {
                $feature->setRelation(
                    'commonvotes',
                    $feature->commonVotesForPlanning($planning->id, $creatorId)->get()
                );
            }
        }

        // Compute WSJF score for each feature
        $rows = $planning->features->map(function ($feature) {
            $commonvotes = $feature->commonvotes ?? collect();
            $bv = $commonvotes->firstWhere('type', 'BusinessValue')?->value;
            $tc = $commonvotes->firstWhere('type', 'TimeCriticality')?->value;
            $rr = $commonvotes->firstWhere('type', 'RiskOpportunity')?->value;
            $js = $commonvotes->firstWhere('type', 'JobSize')?->value;
            $score = ($bv && $tc && $rr && $js && $js > 0) ? ($bv + $tc + $rr) / $js : null;

            return [
                'jira_key' => $feature->jira_key,
                'name'     => $feature->name,
                'bv'       => $bv,
                'tc'       => $tc,
                'rr'       => $rr,
                'js'       => $js,
                'score'    => $score,
            ];
        })->sortByDesc('score')->values();

        $filename = 'wsjf-' . $planning->id . '-' . date('Y-m-d') . '.csv';

        return response()->streamDownload(function () use ($rows) {
            $handle = fopen('php://output', 'w');

            // UTF-8 BOM for Excel compatibility
            fputs($handle, "\xEF\xBB\xBF");

            fputcsv($handle, ['Rank', 'Jira Key', 'Feature', 'Business Value', 'Time Criticality', 'Risk Reduction', 'Job Size', 'WSJF Score']);

            foreach ($rows as $index => $row) {
                fputcsv($handle, [
                    $row['score'] !== null ? $index + 1 : '',
                    $row['jira_key'],
                    $row['name'],
                    $row['bv'] ?? '',
                    $row['tc'] ?? '',
                    $row['rr'] ?? '',
                    $row['js'] ?? '',
                    $row['score'] !== null ? number_format($row['score'], 2) : '',
                ]);
            }

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /**
     * Admin-Übersicht: Plannings und Ersteller ändern
     */
    public function adminPlannings()
    {
        $this->authorize('viewAny', Planning::class);

        $plannings = Planning::with(['project:id,name', 'creator:id,name', 'owner:id,name', 'deputy:id,name'])->get();
        $tenantId = Auth::user()->current_tenant_id;
        $users = User::whereHas('tenants', fn($q) => $q->where('tenants.id', $tenantId))->get(['id', 'name']);
        return Inertia::render('plannings/admin', [
            'plannings' => $plannings,
            'users' => $users,
        ]);
    }

    /**
     * Setzt den Ersteller (created_by) eines Plannings neu (nur Admin)
     */
    public function setCreator(Request $request, Planning $planning)
    {
        $this->authorize('update', $planning);

        $request->validate([
            'created_by' => 'required|exists:users,id',
        ]);
        $planning->created_by = $request->created_by;
        $planning->save();
        return redirect()->back()->with('success', 'Ersteller wurde geändert.');
    }
}
