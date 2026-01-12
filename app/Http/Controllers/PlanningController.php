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

    public function show(Planning $planning)
    {
        // Setze die Parameter für die Commonvotes-Relation
        request()->merge([
            'planning_id' => $planning->id,
            'user_id' => $planning->created_by,
        ]);

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
            'features.votes' => function ($query) use ($planning, $stakeholderIds) {
                $query->where('planning_id', $planning->id)
                    // Nur Stimmen von als Stakeholder (Stammdaten) zugeordneten Nutzern berücksichtigen
                    ->whereIn('user_id', $stakeholderIds)
                    // Den Planning-Ersteller (Creator) aus der Individual-Übersicht ausblenden
                    ->whereHas('user', function ($subQuery) use ($planning) {
                        $subQuery->where('id', '!=', $planning->created_by);
                    });
            },
            'features.votes.user:id,name',
            'features.commonvotes',
            'features.commitments' => function ($query) use ($planning) {
                $query->where('planning_id', $planning->id);
            },
            'features.commitments.user:id,name',
        ]);

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
     * Admin-Übersicht: Plannings und Ersteller ändern
     */
    public function adminPlannings()
    {
        $this->authorize('viewAny', Planning::class);
        // Nur Admins erlauben
        if (!Auth::check()) { //  || !auth()->user()->roles()->where('name', 'admin')->exists()
            abort(403);
        }
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
        if (!Auth::check()) { // || !auth()->user()->roles()->where('name', 'admin')->exists()
            abort(403);
        }
        $request->validate([
            'created_by' => 'required|exists:users,id',
        ]);
        $planning->created_by = $request->created_by;
        $planning->save();
        return redirect()->back()->with('success', 'Ersteller wurde geändert.');
    }
}
