<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

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
        // Wir verwenden try-catch, um mögliche Fehler abzufangen
        try {
            // Importieren der Status-Klassen
            $statusMapping = [
                'in-planning' => \App\States\Project\InPlanning::class,
                'in-realization' => \App\States\Project\InRealization::class,
                'in-approval' => \App\States\Project\InApproval::class,
                'closed' => \App\States\Project\Closed::class
            ];

            // Status-Objekt erzeugen
            if (is_string($project->status)) {
                $statusClass = $statusMapping[$project->status] ?? \App\States\Project\InPlanning::class;
                try {
                    $currentStatus = new $statusClass($project, 'status');
                } catch (\Exception $e) {
                    // Wenn das Erstellen mit Parametern fehlschlägt, versuchen wir die statischen Methoden direkt
                    $currentStatusClass = new \ReflectionClass($statusClass);
                    $currentStatus = (object)[
                        'name' => method_exists($statusClass, 'name')
                            ? call_user_func([$statusClass, 'name'])
                            : ucfirst(str_replace('-', ' ', $project->status)),
                        'color' => method_exists($statusClass, 'color')
                            ? call_user_func([$statusClass, 'color'])
                            : 'bg-blue-100 text-blue-800'
                    ];
                }
            } else {
                $currentStatus = $project->status;
            }

            // Mögliche Status-Übergänge basierend auf dem Workflow definieren
            $possibleTransitions = [];

            // Manuelle Definition der erlaubten Übergänge basierend auf dem aktuellen Status
            if ($project->status === 'in-planning' || get_class($currentStatus) === \App\States\Project\InPlanning::class) {
                $possibleTransitions[] = \App\States\Project\InRealization::class;
            } elseif ($project->status === 'in-realization' || get_class($currentStatus) === \App\States\Project\InRealization::class) {
                $possibleTransitions[] = \App\States\Project\InApproval::class;
            } elseif ($project->status === 'in-approval' || get_class($currentStatus) === \App\States\Project\InApproval::class) {
                $possibleTransitions[] = \App\States\Project\Closed::class;
            }

            // Status-Informationen für das Frontend aufbereiten
            $statusOptions = [
                [
                    'value' => is_string($project->status) ? $project->status : (
                        is_object($currentStatus) && method_exists($currentStatus, 'getValue')
                        ? $currentStatus->getValue()
                        : $project->status
                    ),
                    'label' => is_string($project->status)
                        ? ucfirst(str_replace('-', ' ', $project->status))
                        : (is_object($currentStatus) && method_exists($currentStatus, 'name')
                            ? $currentStatus->name()
                            : (isset($currentStatus->name) ? $currentStatus->name : 'Unbekannt')
                        ),
                    'color' => is_string($project->status)
                        ? 'bg-blue-100 text-blue-800'
                        : (is_object($currentStatus) && method_exists($currentStatus, 'color')
                            ? $currentStatus->color()
                            : (isset($currentStatus->color) ? $currentStatus->color : 'bg-blue-100 text-blue-800')
                        ),
                    'current' => true
                ]
            ];

            foreach ($possibleTransitions as $transition) {
                try {
                    // Erstelle eine Instanz des Status mit dem Projekt-Modell und dem Feld-Namen
                    $transitionInstance = new $transition($project, 'status');
                    $statusOptions[] = [
                        'value' => $transition,
                        'label' => $transitionInstance->name(),
                        'color' => $transitionInstance->color(),
                        'current' => false
                    ];
                } catch (\Exception $e) {
                    // Fallback, falls die Instanzierung fehlschlägt
                    $statusName = (new \ReflectionClass($transition))->getShortName();
                    $readableName = ucwords(str_replace(['_', '-'], ' ', $statusName));

                    $statusOptions[] = [
                        'value' => $transition,
                        'label' => $readableName,
                        'color' => 'bg-gray-100 text-gray-800',
                        'current' => false
                    ];
                }
            }

            return Inertia::render('projects/edit', [
                'project' => $project,
                'users' => User::all(['id', 'name']),
                'currentStatus' => [
                    'name' => is_string($project->status)
                        ? ucfirst(str_replace('-', ' ', $project->status))
                        : (is_object($currentStatus) && method_exists($currentStatus, 'name')
                            ? $currentStatus->name()
                            : (isset($currentStatus->name) ? $currentStatus->name : 'Unbekannt')
                        ),
                    'color' => is_string($project->status)
                        ? 'bg-blue-100 text-blue-800'
                        : (is_object($currentStatus) && method_exists($currentStatus, 'color')
                            ? $currentStatus->color()
                            : (isset($currentStatus->color) ? $currentStatus->color : 'bg-blue-100 text-blue-800')
                        )
                ],
                'statusOptions' => $statusOptions,
            ]);
        } catch (\Exception $e) {
            // Bei einem Fehler einfach nur die Basis-Daten ohne Status-Informationen senden
            return Inertia::render('projects/edit', [
                'project' => $project,
                'users' => User::all(['id', 'name']),
                'currentStatus' => [
                    'name' => is_string($project->status) ? ucfirst(str_replace('-', ' ', $project->status)) : 'In Planung',
                    'color' => 'bg-blue-100 text-blue-800'
                ],
                'statusOptions' => [],
            ]);
        }
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
            'jira_base_uri' => 'nullable|string|url',
            'start_date' => 'required|date',
            'project_leader_id' => 'required|exists:users,id',
            'deputy_leader_id' => 'nullable|exists:users,id',
            'new_status' => 'nullable|string',
        ]);

        // Status-Übergang durchführen, wenn angegeben
        if (!empty($validated['new_status'])) {
            try {
                if (class_exists($validated['new_status'])) {
                    // Status-String direkt aus der Klasse ermitteln, ohne eine Instanz zu erstellen
                    $statusClass = $validated['new_status'];
                    // Zugriff auf die statische Eigenschaft $name
                    $project->status = $statusClass::$name;
                    $project->save();
                }
            } catch (\Exception $e) {
                // Fehler beim Status-Übergang protokollieren
                \Illuminate\Support\Facades\Log::error('Status-Übergang fehlgeschlagen: ' . $e->getMessage());
            }
        }

        // new_status aus den Daten entfernen, da es kein Spaltenname ist
        unset($validated['new_status']);

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
