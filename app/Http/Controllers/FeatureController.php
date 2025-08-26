<?php

namespace App\Http\Controllers;

use App\Models\Feature;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
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
                            'name' => ucfirst(str_replace('-', ' ', $feature->status)),
                            'color' => $this->getDefaultColorForStatus($feature->status),
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
        // Status-Informationen für das Feature aufbereiten
        $currentStatus = null;
        $statusClass = null;

        // Prüfe den aktuellen Status und erstelle ein Status-Objekt
        if (is_string($feature->status)) {
            // Wenn der Status als String vorliegt
            $statusMapping = [
                'in-planning' => \App\States\Feature\InPlanning::class,
                'approved' => \App\States\Feature\Approved::class,
                'rejected' => \App\States\Feature\Rejected::class,
                'implemented' => \App\States\Feature\Implemented::class,
                'obsolete' => \App\States\Feature\Obsolete::class,
                'archived' => \App\States\Feature\Archived::class,
                'deleted' => \App\States\Feature\Deleted::class
            ];

            if (isset($statusMapping[$feature->status])) {
                $statusClass = $statusMapping[$feature->status];
                $currentStatus = (object)[
                    'name' => method_exists($statusClass, 'name')
                        ? (
                            (new \ReflectionMethod($statusClass, 'name'))->isStatic()
                            ? call_user_func([$statusClass, 'name'])
                            : (new $statusClass($feature))->name()
                        )
                        : ucfirst(str_replace('-', ' ', $feature->status)),
                    'color' => method_exists($statusClass, 'color')
                        ? (
                            (new \ReflectionMethod($statusClass, 'color'))->isStatic()
                            ? call_user_func([$statusClass, 'color'])
                            : (new $statusClass($feature))->color()
                        )
                        : 'bg-blue-100 text-blue-800'
                ];
            }
        } else {
            $currentStatus = $feature->status;
        }

        // Mögliche Status-Übergänge basierend auf dem Workflow definieren
        $possibleTransitions = [];

        // Manuelle Definition der erlaubten Übergänge basierend auf dem aktuellen Status
        if ($feature->status instanceof \App\States\Feature\InPlanning || $feature->status === 'in-planning') {
            $possibleTransitions[] = \App\States\Feature\Approved::class;
            $possibleTransitions[] = \App\States\Feature\Rejected::class;
            $possibleTransitions[] = \App\States\Feature\Obsolete::class;
        } elseif ($feature->status instanceof \App\States\Feature\Approved || $feature->status === 'approved') {
            $possibleTransitions[] = \App\States\Feature\Implemented::class;
            $possibleTransitions[] = \App\States\Feature\Obsolete::class;
            $possibleTransitions[] = \App\States\Feature\Archived::class;
        } elseif ($feature->status instanceof \App\States\Feature\Rejected || $feature->status === 'rejected') {
            $possibleTransitions[] = \App\States\Feature\Obsolete::class;
            $possibleTransitions[] = \App\States\Feature\Archived::class;
        } elseif ($feature->status instanceof \App\States\Feature\Implemented || $feature->status === 'implemented') {
            $possibleTransitions[] = \App\States\Feature\Archived::class;
        } elseif ($feature->status instanceof \App\States\Feature\Obsolete || $feature->status === 'obsolete') {
            $possibleTransitions[] = \App\States\Feature\Archived::class;
        } elseif ($feature->status instanceof \App\States\Feature\Archived || $feature->status === 'archived') {
            $possibleTransitions[] = \App\States\Feature\Deleted::class;
        }

        // Status-Informationen für das Frontend aufbereiten
        $statusOptions = [
            [
                'value' => is_string($feature->status) ? $feature->status : (
                    is_object($feature->status)
                    ? (new \ReflectionClass(get_class($feature->status)))->getStaticProperties()['name'] ?? 'in-planning'
                    : 'in-planning'
                ),
                'label' => is_string($feature->status)
                    ? ucfirst(str_replace('-', ' ', $feature->status))
                    : (is_object($currentStatus) && method_exists($currentStatus, 'name')
                        ? $currentStatus->name()
                        : (isset($currentStatus->name) ? $currentStatus->name : 'In Planung')
                    ),
                'color' => is_string($feature->status)
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
                // Wir erstellen eine Reflection-Klasse, um die statischen Methoden zu nutzen
                // anstatt eine Instanz zu erstellen
                // Get the $name static property from the transition class using reflection
                $reflectionClass = new \ReflectionClass($transition);
                $nameProperty = $reflectionClass->getStaticProperties()['name'] ?? '';

                $statusOptions[] = [
                    'value' => $nameProperty,
                    'label' => (new \ReflectionMethod($transition, 'name'))->isStatic()
                        ? call_user_func([$transition, 'name'])
                        : (new $transition($feature))->name(),
                    'color' => (new \ReflectionMethod($transition, 'color'))->isStatic()
                        ? call_user_func([$transition, 'color'])
                        : (new $transition($feature))->color(),
                    'current' => false
                ];
            } catch (\Exception $e) {
                Log::error("Fehler beim Erstellen der Status-Option: " . $e->getMessage());
                continue;
            }
        }

        return Inertia::render('features/edit', [
            'feature' => $feature->load(['project', 'requester']),
            'projects' => Project::all(['id', 'name']),
            'users' => User::all(['id', 'name']),
            'statusOptions' => $statusOptions,
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
            'status' => 'sometimes|string', // Status-Feld erlauben
        ]);

        // Status separat behandeln, um Spatie State Machine zu nutzen
        $newStatus = $request->input('status');
        $currentStatus = $feature->status;

        // Normales Update der anderen Felder
        $feature->update([
            'jira_key' => $validated['jira_key'],
            'name' => $validated['name'],
            'description' => $validated['description'],
            'requester_id' => $validated['requester_id'],
            'project_id' => $validated['project_id'],
        ]);

        // Status-Übergang durchführen, wenn sich der Status geändert hat
        if ($newStatus && (
            (is_string($currentStatus) && $newStatus !== $currentStatus) ||
            (is_object($currentStatus) && method_exists($currentStatus, 'getMorphClass') && $newStatus !== $currentStatus->getMorphClass())
        )) {
            try {
                // Statusübergang basierend auf dem neuen Statuswert
                $statusMapping = [
                    'in-planning' => \App\States\Feature\InPlanning::class,
                    'approved' => \App\States\Feature\Approved::class,
                    'rejected' => \App\States\Feature\Rejected::class,
                    'implemented' => \App\States\Feature\Implemented::class,
                    'obsolete' => \App\States\Feature\Obsolete::class,
                    'archived' => \App\States\Feature\Archived::class,
                    'deleted' => \App\States\Feature\Deleted::class
                ];

                // Wenn der aktuelle Status ein String ist, müssen wir ihn manuell aktualisieren
                if (is_string($feature->status)) {
                    if (isset($statusMapping[$newStatus])) {
                        // Den Status direkt auf den neuen Wert setzen
                        $feature->status = $newStatus;
                        $feature->save();
                    }
                } else {
                    // Wenn es ein State-Objekt ist, können wir transitionTo verwenden
                    if (isset($statusMapping[$newStatus])) {
                        $feature->status->transitionTo($statusMapping[$newStatus]);
                    } else {
                        $feature->status->transitionTo(\App\States\Feature\InPlanning::class);
                    }
                }

                // Speichern nach Statusänderung
                $feature->save();
            } catch (\Exception $e) {
                Log::error("Fehler bei der Status-Änderung des Features: " . $e->getMessage());
                return redirect()->back()->withErrors(['status' => 'Status-Änderung nicht möglich: ' . $e->getMessage()]);
            }
        }

        return redirect()->route('features.index')->with('success', 'Feature erfolgreich aktualisiert.');
    }

    public function destroy(Feature $feature)
    {
        $feature->delete();
        return redirect()->route('features.index')->with('success', 'Feature gelöscht.');
    }

    /**
     * Gibt eine passende Farbe für einen Status-String zurück
     *
     * @param string $status
     * @return string
     */
    private function getDefaultColorForStatus(string $status): string
    {
        $colorMapping = [
            'in-planning' => 'bg-blue-100 text-blue-800',
            'approved' => 'bg-green-100 text-green-800',
            'rejected' => 'bg-red-100 text-red-800',
            'implemented' => 'bg-purple-100 text-purple-800',
            'obsolete' => 'bg-gray-100 text-gray-800',
            'archived' => 'bg-yellow-100 text-yellow-800',
            'deleted' => 'bg-red-100 text-red-800'
        ];

        return $colorMapping[$status] ?? 'bg-gray-100 text-gray-800';
    }
}
