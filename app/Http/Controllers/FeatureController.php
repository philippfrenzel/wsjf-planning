<?php

namespace App\Http\Controllers;

use App\Models\Feature;
use App\Models\Project;
use App\Models\Planning;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use App\Http\Requests\StoreFeatureRequest;
use App\Http\Requests\UpdateFeatureRequest;
use App\Support\FeatureStatus;

class FeatureController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Feature::class, 'feature');
    }

    public function index(Request $request)
    {
        // Optionaler Initial-Filter (z. B. via Dashboard-Drilldown)
        $initialStatus = $request->input('status');

        // Basiskonfiguration der Abfrage (TenantScope greift automatisch)
        $query = Feature::with([
            'project:id,name,jira_base_uri',
            'requester:id,name',
            'estimationComponents',  // Lade alle Komponenten
            'estimationComponents.estimations'  // Lade alle Schätzungen der Komponenten
        ])->withCount('estimationComponents as estimation_components_count');

        // Serverseitiger Status-Filter, falls gesetzt
        if ($initialStatus) {
            if ($initialStatus === 'in-planning') {
                $query->where(function ($q) {
                    $q->whereNull('status')->orWhere('status', 'in-planning');
                });
            } else {
                $query->where('status', $initialStatus);
            }
        }

        // Daten paginiert abrufen und für das Frontend aufbereiten
        $features = $query->paginate(25)->through(function ($feature) {
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
            'initialFilters' => [
                'status' => $initialStatus,
            ],
        ]);
    }

    public function board(Request $request)
    {
        // Zeige alle Projekte des aktuellen Tenants (TenantScope greift automatisch)
        $projects = Project::get(['id', 'name']);

        // Filtere nach Projekt, wenn ein Filter gesetzt ist
        $selectedProjectId = $request->input('project_id');
        $selectedPlanningId = $request->input('planning_id');
        $selectedStatus = $request->input('status');

        $featuresQuery = Feature::with(['project:id,name', 'estimationComponents'])
            ->withCount('estimationComponents');

        // Filter nach Projekt anwenden, wenn ausgewählt
        if ($selectedProjectId) {
            $featuresQuery->where('project_id', $selectedProjectId);
        }

        // Optional: Filter nach Planning anwenden (nur Features, die in diesem Planning sind)
        if ($selectedPlanningId) {
            $featuresQuery->whereIn('features.id', function ($q) use ($selectedPlanningId) {
                $q->select('feature_id')
                  ->from('feature_planning')
                  ->where('planning_id', $selectedPlanningId);
            });
        }

        $features = $featuresQuery->get();

        // Plannings-Liste für Filter (optional nach Projekt einschränken)
        $plannings = Planning::select('id', 'title')
            ->when($selectedProjectId, fn($q) => $q->where('project_id', $selectedProjectId))
            ->orderBy('title')
            ->get();

        $statuses = [
            ['key' => 'in-planning', 'name' => 'In Planung', 'color' => 'bg-blue-100 text-blue-800'],
            ['key' => 'approved', 'name' => 'Genehmigt', 'color' => 'bg-green-100 text-green-800'],
            ['key' => 'implemented', 'name' => 'Implementiert', 'color' => 'bg-purple-100 text-purple-800'],
            ['key' => 'rejected', 'name' => 'Abgelehnt', 'color' => 'bg-red-100 text-red-800'],
            ['key' => 'obsolete', 'name' => 'Obsolet', 'color' => 'bg-gray-100 text-gray-800'],
            ['key' => 'archived', 'name' => 'Archiviert', 'color' => 'bg-yellow-100 text-yellow-800'],
        ];

        $lanes = collect($statuses)->map(function ($status) use ($features) {
            $filtered = $features->filter(function ($feature) use ($status) {
                $value = $feature->status_details['value'] ?? 'in-planning';
                return $value === $status['key'];
            })->map(function ($feature) {
                // Berechne die Summe der weighted_case manuell
                $totalWeightedCase = $feature->estimationComponents
                    ->flatMap(function ($component) {
                        return $component->estimations ?? [];
                    })
                    ->sum('weighted_case');

                // Sammle alle Einheiten der Schätzungen
                $units = $feature->estimationComponents
                    ->flatMap(function ($component) {
                        return $component->estimations->pluck('unit') ?? [];
                    })
                    ->unique()
                    ->values()
                    ->all();

                return [
                    'id' => $feature->id,
                    'jira_key' => $feature->jira_key,
                    'name' => $feature->name,
                    'project' => $feature->project ? [
                        'id' => $feature->project->id,
                        'name' => $feature->project->name,
                    ] : null,
                    'estimation_components_count' => $feature->estimation_components_count,
                    'total_weighted_case' => $totalWeightedCase,
                    'estimation_units' => $units,
                ];
            })->values();

            return array_merge($status, ['features' => $filtered]);
        });

        return Inertia::render('features/board', [
            'lanes' => $lanes,
            'projects' => $projects,
            'plannings' => $plannings,
            'filters' => [
                'project_id' => $selectedProjectId,
                'planning_id' => $selectedPlanningId,
                'status' => $selectedStatus,
            ],
        ]);
    }

    public function lineage()
    {
        $features = Feature::with('dependencies.related')->get();

        $lineages = $features->map(function ($feature) {
            return $this->buildLineage($feature);
        })->values();

        return Inertia::render('features/lineage', [
            'features' => $lineages,
        ]);
    }

    protected function buildLineage(Feature $feature, array $visited = [])
    {
        if (in_array($feature->id, $visited)) {
            return [
                'id' => $feature->id,
                'jira_key' => $feature->jira_key,
                'name' => $feature->name,
                'dependencies' => [],
            ];
        }

        $visited[] = $feature->id;

        return [
            'id' => $feature->id,
            'jira_key' => $feature->jira_key,
            'name' => $feature->name,
            'dependencies' => $feature->dependencies
                ->map(function ($dep) use ($visited) {
                    return $dep->related ? $this->buildLineage($dep->related, $visited) : null;
                })
                ->filter()
                ->values()
                ->all(),
        ];
    }

    public function create()
    {
        $tenantId = Auth::user()->current_tenant_id;
        return Inertia::render('features/create', [
            'projects' => Project::all(['id', 'name']),
            'users' => User::whereHas('tenants', fn($q) => $q->where('tenants.id', $tenantId))->get(['id', 'name']),
        ]);
    }

    public function store(StoreFeatureRequest $request)
    {
        $validated = $request->validated();

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
            'estimationComponents.latestEstimation',
            // Abhängigkeiten
            'dependencies.related:id,jira_key,name,project_id',
            'dependents.feature:id,jira_key,name,project_id'
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

        $tenantId = Auth::user()->current_tenant_id;
        $featureOptions = Feature::where('id', '!=', $feature->id)
            ->when($feature->project_id, fn($q) => $q->where('project_id', $feature->project_id))
            ->orderBy('jira_key')
            ->get(['id','jira_key','name','project_id']);

        return Inertia::render('features/edit', [
            'feature' => $feature->load(['project', 'requester', 'dependencies.related']),
            'projects' => Project::all(['id', 'name']),
            'users' => User::whereHas('tenants', fn($q) => $q->where('tenants.id', $tenantId))->get(['id', 'name']),
            'statusOptions' => $statusOptions,
            'featureOptions' => $featureOptions,
            'dependencies' => $feature->dependencies->map(function($dep){
                return [
                    'id' => $dep->id,
                    'type' => $dep->type,
                    'related' => $dep->related ? [
                        'id' => $dep->related->id,
                        'jira_key' => $dep->related->jira_key,
                        'name' => $dep->related->name,
                    ] : null,
                ];
            }),
        ]);
    }

    public function update(UpdateFeatureRequest $request, Feature $feature)
    {
        $validated = $request->validated();

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
                $targetClass = FeatureStatus::classFor($newStatus);

                if (is_string($feature->status)) {
                    if ($targetClass) {
                        $feature->status = $newStatus;
                        $feature->save();
                    }
                } else {
                    $feature->status->transitionTo($targetClass ?? \App\States\Feature\InPlanning::class);
                }

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
     * Aktualisiert den Status eines Features
     * 
     * @param Request $request
     * @param Feature $feature
     * @return \Illuminate\Http\Response
     */
    public function updateStatus(Request $request, Feature $feature)
    {
        $this->authorize('update', $feature);
        $validated = $request->validate([
            'status' => 'required|string',
        ]);

        $newStatus = $validated['status'];
        $currentStatus = $feature->status;

        Log::info('Feature Status Update Request:', [
            'feature_id' => $feature->id,
            'current_status' => $currentStatus,
            'new_status' => $newStatus,
        ]);

        try {
            $targetClass = FeatureStatus::classFor($newStatus);

            if (is_string($feature->status) || is_null($feature->status)) {
                if ($targetClass) {
                    $feature->status = $newStatus;
                    $feature->save();
                }
            } else {
                $feature->status->transitionTo($targetClass ?? \App\States\Feature\InPlanning::class);
            }

            $feature->save();

            Log::info('Feature Status erfolgreich aktualisiert', [
                'feature_id' => $feature->id,
                'new_status' => $feature->status
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Status erfolgreich aktualisiert'
            ]);
        } catch (\Exception $e) {
            Log::error("Fehler bei der Status-Änderung des Features: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Status-Änderung nicht möglich: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Gibt eine passende Farbe für einen Status-String zurück
     *
     * @param string $status
     * @return string
     */
    private function getDefaultColorForStatus(string $status): string
    {
        return FeatureStatus::colorFor($status);
    }
}
