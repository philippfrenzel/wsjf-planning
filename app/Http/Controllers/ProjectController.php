<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\User;
use App\Support\StatusMapper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Spatie\ModelStates\State;

class ProjectController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $userId = auth()->id();

        return Inertia::render('projects/index', [
            'projects' => Project::with(['projectLeader', 'deputyLeader'])
                ->where('created_by', $userId)
                ->get(),
            'hasProjects' => Project::where('created_by', $userId)->exists(),
            'currentUserId' => $userId,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $tenantId = Auth::user()->current_tenant_id;
        return Inertia::render('projects/create', [
            'users' => User::whereHas('tenants', fn($q) => $q->where('tenants.id', $tenantId))->get(['id', 'name']),
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

        $validated['created_by'] = auth()->id();

        Project::create($validated);

        return redirect()->route('projects.index')->with('success', 'Projekt erfolgreich erstellt.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Project $project)
    {
        $project->load(['projectLeader', 'deputyLeader']);

        return Inertia::render('projects/show', [
            'project' => $project,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Project $project)
    {
        $tenantId = Auth::user()->current_tenant_id;

        $currentStatus = StatusMapper::details(StatusMapper::PROJECT, $project->status, 'in-planning');
        $currentValue = $currentStatus['value'] ?? 'in-planning';
        $transitionValues = StatusMapper::transitionTargets(StatusMapper::PROJECT, $currentValue);

        $statusOptions = [[
            'value' => $currentValue,
            'label' => $currentStatus['name'] ?? 'In Planung',
            'color' => $currentStatus['color'] ?? 'bg-blue-100 text-blue-800',
            'current' => true,
        ]];

        foreach ($transitionValues as $value) {
            $details = StatusMapper::details(StatusMapper::PROJECT, $value, 'in-planning');
            if (!$details) {
                continue;
            }

            $statusOptions[] = [
                'value' => $details['value'],
                'label' => $details['name'],
                'color' => $details['color'],
                'current' => false,
            ];
        }

        return Inertia::render('projects/edit', [
            'project' => $project,
            'users' => User::whereHas('tenants', fn($q) => $q->where('tenants.id', $tenantId))->get(['id', 'name']),
            'currentStatus' => [
                'name' => $currentStatus['name'] ?? 'In Planung',
                'color' => $currentStatus['color'] ?? 'bg-blue-100 text-blue-800',
            ],
            'statusOptions' => $statusOptions,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Project $project)
    {
        $currentStatus = StatusMapper::details(StatusMapper::PROJECT, $project->status, 'in-planning');
        $currentValue = $currentStatus['value'] ?? 'in-planning';
        $allowedTransitions = StatusMapper::transitionTargets(StatusMapper::PROJECT, $currentValue);

        $validated = $request->validate([
            'project_number' => 'required|unique:projects,project_number,' . $project->id,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'jira_base_uri' => 'nullable|string|url',
            'start_date' => 'required|date',
            'project_leader_id' => 'required|exists:users,id',
            'deputy_leader_id' => 'nullable|exists:users,id',
            'new_status' => ['nullable', 'string', Rule::in($allowedTransitions)],
        ]);

        $newStatus = $validated['new_status'] ?? null;
        unset($validated['new_status']);

        if ($newStatus) {
            $targetClass = StatusMapper::classFor(StatusMapper::PROJECT, $newStatus);

            if ($targetClass) {
                if ($project->status instanceof State) {
                    $project->status->transitionTo($targetClass);
                } else {
                    $project->status = $targetClass;
                }

                $project->save();
            }
        }

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
