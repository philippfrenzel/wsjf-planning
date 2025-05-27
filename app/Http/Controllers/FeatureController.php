<?php

namespace App\Http\Controllers;

use App\Models\Feature;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FeatureController extends Controller
{
    public function index()
    {
        $features = Feature::with(['project:id,name', 'requester:id,name'])->get();

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
