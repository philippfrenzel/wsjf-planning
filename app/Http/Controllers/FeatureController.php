<?php

namespace App\Http\Controllers;

use App\Models\Feature;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class FeatureController extends Controller
{
    public function index(Request $request)
    {
        $userId = Auth::id();

        // Hole alle Projekt-IDs, bei denen der Nutzer Besitzer, Stellvertreter oder Projektleiter ist
        $projectIds = Project::where(function ($query) use ($userId) {
            $query->where('project_leader_id', $userId)
                ->orWhere('deputy_leader_id', $userId)
                ->orWhere('created_by', $userId); // Projektleiter-Beziehung hinzugefügt
        })->pluck('id');

        // Zeige nur Features, die zu diesen Projekten gehören
        $features = Feature::with([
            'project:id,name,jira_base_uri',
            'requester:id,name',
            'estimationComponents',  // Lade alle Komponenten
            'estimationComponents.estimations'  // Lade alle Schätzungen der Komponenten
        ])
            ->withCount('estimationComponents as estimation_components_count')
            ->whereIn('project_id', $projectIds)
            ->get()
            ->map(function ($feature) {
                // Berechne die Summe der weighted_case manuell
                $totalWeightedCase = $feature->estimationComponents->flatMap(function ($component) {
                    return $component->estimations;
                })->sum('weighted_case');

                // Sammle alle Einheiten der Schätzungen
                $units = $feature->estimationComponents->flatMap(function ($component) {
                    return $component->estimations->pluck('unit');
                })->unique()->values()->all();

                return [
                    'id' => $feature->id,
                    'jira_key' => $feature->jira_key,
                    'name' => $feature->name,
                    'description' => $feature->description,
                    'requester' => $feature->requester ? [
                        'id' => $feature->requester->id,
                        'name' => $feature->requester->name,
                    ] : null,
                    'project' => $feature->project ? [
                        'id' => $feature->project->id,
                        'name' => $feature->project->name,
                        'jira_base_uri' => $feature->project->jira_base_uri,
                    ] : null,
                    'status' => isset($feature->status) ? (
                        // Prüfen, ob es ein Objekt oder ein String ist
                        is_object($feature->status) ? [
                            'name' => $feature->status->name(),
                            'color' => $feature->status->color(),
                        ] : [
                            // Fallback für String-Status
                            'name' => ucfirst($feature->status),
                            'color' => 'bg-gray-100 text-gray-800',
                        ]
                    ) : [
                        'name' => 'In Planung',
                        'color' => 'bg-gray-100 text-gray-800',
                    ],
                    'estimation_components_count' => $feature->estimation_components_count,
                    'total_weighted_case' => $totalWeightedCase,
                    'estimation_units' => $units,
                ];
            });

        return Inertia::render('features/index', [
            'features' => $features,
        ]);
    }

    public function create()
    {
        return Inertia::render('features/create', [
            'projects' => Project::all(['id', 'name']),
            'users' => User::all(['id', 'name']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'jira_key' => 'required|string|max:255',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'requester_id' => 'nullable|exists:users,id',
            'project_id' => 'required|exists:projects,id',
        ]);

        Feature::create($validated);

        return redirect()->route('features.index')->with('success', 'Feature erfolgreich erstellt.');
    }

    public function show(Feature $feature)
    {
        $feature->load([
            'project:id,name',
            'requester:id,name',
            // Lade standardmäßig nur aktive Komponenten, es sei denn, show_archived ist true
            'estimationComponents' => function ($query) {
                if (!request()->has('show_archived') || !request()->show_archived) {
                    $query->active();
                }
                return $query;
            },
            'estimationComponents.creator:id,name',
            'estimationComponents.estimations.creator:id,name',
            'estimationComponents.latestEstimation'
        ]);

        return Inertia::render('features/show', [
            'feature' => $feature,
            'showArchived' => request()->has('show_archived') && request()->show_archived,
        ]);
    }

    public function edit(Feature $feature)
    {
        return Inertia::render('features/edit', [
            'feature' => $feature->load(['project', 'requester']),
            'projects' => Project::all(['id', 'name']),
            'users' => User::all(['id', 'name']),
        ]);
    }

    public function update(Request $request, Feature $feature)
    {
        $validated = $request->validate([
            'jira_key' => 'required|string|max:255',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'requester_id' => 'nullable|exists:users,id',
            'project_id' => 'required|exists:projects,id',
        ]);

        $feature->update($validated);

        return redirect()->route('features.index')->with('success', 'Feature erfolgreich aktualisiert.');
    }

    public function destroy(Feature $feature)
    {
        $feature->delete();
        return redirect()->route('features.index')->with('success', 'Feature gelöscht.');
    }
}
