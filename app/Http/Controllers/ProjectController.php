<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProjectController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('projects/index', [
            'projects' => Project::with(['projectLeader', 'deputyLeader'])->get(),
            'hasProjects' => \App\Models\Project::exists(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('projects/create', [
            'users' => User::all(['id', 'name']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_number' => 'required|unique:projects',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'required|date',
            'project_leader_id' => 'required|exists:users,id',
            'deputy_leader_id' => 'nullable|exists:users,id',
        ]);

        Project::create($validated);

        return redirect()->route('projects.index')->with('success', 'Projekt erfolgreich erstellt.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Project $project)
    {
        return Inertia::render('Projects/Show', [
            'project' => $project,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Project $project)
    {
        return Inertia::render('projects/edit', [
            'project' => $project,
            'users' => User::all(['id', 'name']),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Project $project)
    {
        $validated = $request->validate([
            'project_number' => 'required|unique:projects,project_number,' . $project->id,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'required|date',
            'project_leader_id' => 'required|exists:users,id',
            'deputy_leader_id' => 'nullable|exists:users,id',
        ]);

        $project->update($validated);

        return redirect()->route('projects.index')->with('success', 'Projekt erfolgreich aktualisiert.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Project $project)
    {
        $project->delete();

        return redirect()->route('projects.index')->with('success', 'Projekt erfolgreich gelöscht.');
    }
}
