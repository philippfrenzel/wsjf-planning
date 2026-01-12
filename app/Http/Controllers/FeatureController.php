<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreFeatureRequest;
use App\Http\Requests\UpdateFeatureRequest;
use App\Models\Feature;
use App\Models\Planning;
use App\Models\Project;
use App\Models\User;
use App\Services\FeatureService;
use App\Support\StatusMapper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Spatie\ModelStates\State;

class FeatureController extends Controller
{
    public function __construct(private readonly FeatureService $featureService)
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
            'estimationComponents.estimations',  // Lade alle Schätzungen der Komponenten
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

        // Daten abrufen und für das Frontend aufbereiten
        $features = $query->get()->map(function ($feature) {
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

        // Get the closed status filter from request or session (default: 90 days)
        $closedStatusFilter = $request->input('closed_status_days');
        if ($closedStatusFilter !== null) {
            // Store the filter in session for persistence
            $request->session()->put('closed_status_days', $closedStatusFilter);
        } else {
            // Get from session or use default (90)
            $closedStatusFilter = $request->session()->get('closed_status_days', '90');
        }

        // Convert to integer or null for "all"
        $filterDays = $closedStatusFilter === 'all' ? null : (int) $closedStatusFilter;

        $featuresQuery = Feature::with(['project:id,name', 'estimationComponents'])
            ->withCount('estimationComponents')
            ->filterClosedByDays($filterDays);

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
            ->when($selectedProjectId, fn ($q) => $q->where('project_id', $selectedProjectId))
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
                'closed_status_days' => $closedStatusFilter,
            ],
        ]);
    }

    public function lineage()
    {
        $features = Feature::with('dependencies.related')->get();

        $lineages = $features->map(fn ($feature) => $this->featureService->buildLineage($feature))->values();

        return Inertia::render('features/lineage', [
            'features' => $lineages,
        ]);
    }

    protected function buildLineage(Feature $feature, array $visited = [])
    {
        return $this->featureService->buildLineage($feature, $visited);
    }

    public function create()
    {
        $tenantId = Auth::user()->current_tenant_id;

        return Inertia::render('features/create', [
            'projects' => Project::all(['id', 'name']),
            'users' => User::whereHas('tenants', fn ($q) => $q->where('tenants.id', $tenantId))->get(['id', 'name']),
        ]);
    }

    public function store(StoreFeatureRequest $request)
    {
        $validated = $request->validated();

        Feature::create($validated);

        // Increment data version to trigger Inertia page reload
        cache()->increment('app.data.version', 1);

        return redirect()->route('features.index')->with('success', 'Feature erfolgreich erstellt.');
    }

    public function show(Feature $feature)
    {
        $feature->load([
            'project:id,name',
            'requester:id,name',
            // Lade standardmäßig nur aktive Komponenten, es sei denn, show_archived ist true
            'estimationComponents' => function ($query) {
                if (! request()->has('show_archived') || ! request()->show_archived) {
                    $query->active();
                }

                return $query;
            },
            'estimationComponents.creator:id,name',
            'estimationComponents.estimations.creator:id,name',
            'estimationComponents.latestEstimation',
            // Abhängigkeiten
            'dependencies.related:id,jira_key,name,project_id',
            'dependents.feature:id,jira_key,name,project_id',
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
            if (! $details) {
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
            ->when($feature->project_id, fn ($q) => $q->where('project_id', $feature->project_id))
            ->orderBy('jira_key')
            ->get(['id', 'jira_key', 'name', 'project_id']);

        return Inertia::render('features/edit', [
            'feature' => $feature->load(['project', 'requester', 'dependencies.related']),
            'projects' => Project::all(['id', 'name']),
            'users' => User::whereHas('tenants', fn ($q) => $q->where('tenants.id', $tenantId))->get(['id', 'name']),
            'statusOptions' => $statusOptions,
            'featureOptions' => $featureOptions,
            'dependencies' => $feature->dependencies->map(function ($dep) {
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
                    $this->featureService->updateStatus($feature, $newStatus);
                } catch (\Exception $e) {
                    Log::error('Fehler bei der Status-Änderung des Features: '.$e->getMessage());

                    return redirect()->back()->withErrors(['status' => 'Status-Änderung nicht möglich: '.$e->getMessage()]);
                }
            }
        }

        // Increment data version to trigger Inertia page reload
        cache()->increment('app.data.version', 1);

        return redirect()->route('features.index')->with('success', 'Feature erfolgreich aktualisiert.');
    }

    public function destroy(Feature $feature)
    {
        $feature->delete();

        // Increment data version to trigger Inertia page reload
        cache()->increment('app.data.version', 1);

        return redirect()->route('features.index')->with('success', 'Feature gelöscht.');
    }

    /**
     * Aktualisiert den Status eines Features
     *
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
            $this->featureService->updateStatus($feature, $newStatus);

            Log::info('Feature Status erfolgreich aktualisiert', [
                'feature_id' => $feature->id,
                'new_status' => $feature->status,
            ]);

            // Increment data version to trigger Inertia page reload
            cache()->increment('app.data.version', 1);

            return response()->json([
                'success' => true,
                'message' => 'Status erfolgreich aktualisiert',
            ]);
        } catch (\Exception $e) {
            Log::error('Fehler bei der Status-Änderung des Features: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Status-Änderung nicht möglich: '.$e->getMessage(),
            ], 500);
        }
    }
}
