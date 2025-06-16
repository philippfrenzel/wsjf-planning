<?php

namespace App\Http\Controllers;

use App\Models\Planning;
use App\Models\Project;
use App\Models\User;
use App\Models\Feature; // Feature Model importieren
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

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
        $planning->load([
            'project:id,name',
            'stakeholders:id,name,email',
            'creator:id,name', // Ersteller mit laden
            'features' => function ($query) use ($planning) {
                // Nur Features aus dem gleichen Projekt laden
                $query->where('project_id', $planning->project_id)
                    ->select('features.id', 'features.jira_key', 'features.name', 'features.project_id');
            },
            // Bestehende Votes-Abfrage für andere Stakeholder beibehalten
            'features.votes' => function ($query) use ($planning) {
                // Nur Votes aus dem aktuellen Planning laden, die NICHT vom Ersteller des Plannings sind
                $query->where('planning_id', $planning->id)
                    ->whereHas('user', function ($subQuery) use ($planning) {
                        $subQuery->where('id', '!=', $planning->created_by);
                    });
            },
            'features.votes.user:id,name', // Benutzer der Votes laden

            // Common Votes (Ersteller-Votes) separat laden
            'features.commonvotes' => function ($query) use ($planning) {
                // Nur Votes vom Ersteller des Plannings
                $query->where('planning_id', $planning->id)
                    ->where('user_id', $planning->created_by);
            },
        ]);

        return Inertia::render('plannings/show', [
            'planning' => $planning,
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
}
