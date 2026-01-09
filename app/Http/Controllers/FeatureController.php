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
use App\Support\StatusMapper;
use Spatie\ModelStates\State;

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
                    'status' => StatusMapper::details(StatusMapper::FEATURE, $feature->status, 'in-planning'),
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
        $currentStatus = StatusMapper::details(StatusMapper::FEATURE, $feature->status, 'in-planning');
        $currentValue = $currentStatus['value'] ?? 'in-planning';
        $transitionValues = StatusMapper::transitionTargets(StatusMapper::FEATURE, $currentValue);

        $statusOptions = [[
            'value' => $currentValue,
            'label' => $currentStatus['name'] ?? 'In Planung',
            'color' => $currentStatus['color'] ?? 'bg-blue-100 text-blue-800',
            'current' => true,
        ]];

        foreach ($transitionValues as $value) {
            $details = StatusMapper::details(StatusMapper::FEATURE, $value, 'in-planning');
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

        if ($newStatus) {
            $currentValue = $currentStatus instanceof State ? $currentStatus->getValue() : (string) $currentStatus;

            if ($newStatus !== $currentValue) {
                try {
                    $targetClass = StatusMapper::classFor(StatusMapper::FEATURE, $newStatus);

                    if (!$targetClass) {
                        return redirect()->back()->withErrors(['status' => 'Ungültiger Status']);
                    }

                    if ($feature->status instanceof State) {
                        $feature->status->transitionTo($targetClass);
                    } else {
                        $feature->status = $targetClass;
                    }

                    $feature->save();
                } catch (\Exception $e) {
                    Log::error("Fehler bei der Status-Änderung des Features: " . $e->getMessage());
                    return redirect()->back()->withErrors(['status' => 'Status-Änderung nicht möglich: ' . $e->getMessage()]);
                }
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
            $targetClass = StatusMapper::classFor(StatusMapper::FEATURE, $newStatus);

            if (!$targetClass) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ungültiger Status',
                ], 422);
            }

            if ($feature->status instanceof State) {
                $feature->status->transitionTo($targetClass);
            } else {
                $feature->status = $targetClass;
            }

            $feature->save();

            Log::info('Feature Status erfolgreich aktualisiert', [
                'feature_id' => $feature->id,
                'new_status' => $feature->status,
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

}
