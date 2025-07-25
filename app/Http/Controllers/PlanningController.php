<?php

namespace App\Http\Controllers;

use App\Models\Planning;
use App\Models\Project;
use App\Models\User;
use App\Models\Feature; // Feature Model importieren
use App\Models\Stakeholder; // Stakeholder Model importieren
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\VoteController;

class PlanningController extends Controller
{
    public function index()
    {
        $plannings = Planning::with(['project:id,name', 'stakeholders:id,name'])->get();

        return Inertia::render('plannings/index', [
            'plannings' => $plannings,
            'hasProjects' => \App\Models\Project::exists(),
        ]);
    }

    public function create()
    {
        $users = User::all(['id', 'name']);

        return Inertia::render('plannings/create', [
            'users' => $users,
            'projects' => Project::all(['id', 'name']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'project_id' => 'required|exists:projects,id',
            'planned_at' => 'nullable|date',
            'executed_at' => 'nullable|date',
            'owner_id' => 'nullable|exists:users,id',    // Hinzugefügt
            'deputy_id' => 'nullable|exists:users,id',   // Hinzugefügt
            'stakeholder_ids' => 'array',
            'stakeholder_ids.*' => 'exists:users,id',
            'feature_ids' => 'array',
            'feature_ids.*' => 'exists:features,id',
        ]);

        // Aktuellen User als Planning-Ersteller setzen
        $validated['created_by'] = Auth::id();

        $planning = Planning::create($validated);
        if (!empty($validated['stakeholder_ids'])) {
            $planning->stakeholders()->sync($validated['stakeholder_ids']);
        }

        // Features synchronisieren, wenn vorhanden
        if (!empty($validated['feature_ids'])) {
            $planning->features()->sync($validated['feature_ids']);
        }

        return redirect()->route('plannings.index')->with('success', 'Planning erfolgreich erstellt.');
    }

    public function show(Planning $planning)
    {
        // Setze die Parameter für die Commonvotes-Relation
        request()->merge([
            'planning_id' => $planning->id,
            'user_id' => $planning->created_by,
        ]);

        $planning->load([
            'project:id,name,jira_base_uri',
            'stakeholders:id,name,email',
            'creator:id,name',
            'features' => function ($query) use ($planning) {
                $query->where('project_id', $planning->project_id)
                    ->select('features.id', 'features.jira_key', 'features.name', 'features.project_id');
            },
            'features.project:id,name,jira_base_uri',
            'features.votes' => function ($query) use ($planning) {
                $query->where('planning_id', $planning->id)
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
        $users = User::all(['id', 'name', 'email']); // E-Mail für alle Benutzer hinzugefügt
        $features = Feature::where('project_id', $planning->project_id)->get(); // Features des Projekts laden

        return Inertia::render('plannings/edit', [
            'planning' => $planning->load([
                'owner:id,name',
                'deputy:id,name',
                'stakeholders:id,name,email',
                'features:id,name,jira_key,project_id'
            ]),
            'users' => $users,
            'projects' => Project::all(['id', 'name']),
            'features' => $features, // Features an die Komponente übergeben
        ]);
    }

    public function update(Request $request, Planning $planning)
    {
        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'planned_at' => 'nullable|date',
            'executed_at' => 'nullable|date',
            'owner_id' => 'nullable|exists:users,id',
            'deputy_id' => 'nullable|exists:users,id',
            'stakeholder_ids' => 'array',
            'stakeholder_ids.*' => 'exists:users,id',
            'feature_ids' => 'array',
            'feature_ids.*' => 'exists:features,id',
        ]);

        $planning->update($validated);
        $planning->stakeholders()->sync($validated['stakeholder_ids'] ?? []);
        $planning->features()->sync($validated['feature_ids'] ?? []);

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
        // VoteController-Logik aufrufen
        $voteController = app(VoteController::class);
        $voteController->calculateAverageVotesForCreator($planning);

        return redirect()->route('plannings.show', $planning->id)
            ->with('success', 'Common Votes wurden neu berechnet.');
    }

    /**
     * Admin-Übersicht: Plannings und Ersteller ändern
     */
    public function adminPlannings()
    {
        // Nur Admins erlauben
        if (!Auth::check()) { //  || !auth()->user()->roles()->where('name', 'admin')->exists()
            abort(403);
        }
        $plannings = Planning::with(['project:id,name', 'creator:id,name', 'owner:id,name', 'deputy:id,name'])->get();
        $users = User::all(['id', 'name']);
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
