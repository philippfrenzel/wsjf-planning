<?php

namespace App\Http\Controllers;

use App\Models\Commitment;
use App\Models\Feature;
use App\Models\Planning;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use App\Services\CommitmentService;
use App\Support\StatusMapper;
use Illuminate\Validation\ValidationException;
use App\Http\Requests\StoreCommitmentRequest;
use App\Http\Requests\UpdateCommitmentRequest;

class CommitmentController extends Controller
{
    public function __construct(private readonly CommitmentService $commitmentService)
    {
        $this->authorizeResource(Commitment::class, 'commitment');
    }

    /**
     * Zeigt eine Liste aller Commitments an.
     */
    public function index(Request $request)
    {
        $planningId = $request->query('planning_id');

        $query = Commitment::with(['planning:id,title', 'feature:id,jira_key,name', 'user:id,name']);

        // Wenn eine Planning-ID als Filter angegeben wurde
        if ($planningId) {
            $query->where('planning_id', $planningId);
        }

        $commitments = $query->paginate(25);

        // Status-Details für jedes Commitment anreichern
        $commitments->each(function ($commitment) {
            $commitment->append('status_details');
        });

        return Inertia::render('commitments/index', [
            'commitments' => $commitments,
            'plannings' => Planning::all(['id', 'title']),
            'selectedPlanning' => $planningId,
        ]);
    }

    /**
     * Zeigt das Formular zum Erstellen eines neuen Commitments an.
     */
    public function create(Request $request)
    {
        $planningId = $request->query('planning_id');
        $featureId = $request->query('feature_id');

        // Lade Plannings für Dropdown (falls nicht übergeben)
        $plannings = Planning::all(['id', 'title']);

        // Wenn Planning-ID gesetzt, lade Features für dieses Planning für Dropdown
        $features = [];
        if ($planningId) {
            $planning = Planning::findOrFail($planningId);
            $features = $planning->features()->select('features.id', 'features.jira_key', 'features.name')->get();
        }

        return Inertia::render('commitments/create', [
            'plannings' => $plannings,
            'features' => $features,
            'selectedPlanning' => $planningId,
            'selectedFeature' => $featureId,
            'currentUser' => Auth::user()->only('id', 'name'),
            'commitmentTypes' => [
                ['value' => 'A', 'label' => 'Hohe Priorität & Dringlichkeit'],
                ['value' => 'B', 'label' => 'Hohe Priorität, geringe Dringlichkeit'],
                ['value' => 'C', 'label' => 'Geringe Priorität, hohe Dringlichkeit'],
                ['value' => 'D', 'label' => 'Geringe Priorität & Dringlichkeit'],
            ],
            'statusOptions' => [
                ['value' => 'suggested', 'label' => 'Vorschlag', 'color' => 'bg-blue-100 text-blue-800'],
                ['value' => 'accepted', 'label' => 'Angenommen', 'color' => 'bg-yellow-100 text-yellow-800'],
                ['value' => 'completed', 'label' => 'Erledigt', 'color' => 'bg-green-100 text-green-800'],
            ],
        ]);
    }

    /**
     * Speichert ein neu erstelltes Commitment in der Datenbank.
     */
    public function store(StoreCommitmentRequest $request)
    {
        $validated = $request->validated();

        try {
            $commitment = $this->commitmentService->create($validated);
        } catch (ValidationException $e) {
            return redirect()->back()->withErrors($e->errors());
        }

        return redirect()->route('commitments.index', ['planning_id' => $validated['planning_id']])
            ->with('success', 'Commitment erfolgreich erstellt.');
    }

    /**
     * Zeigt ein bestimmtes Commitment an.
     */
    public function show(Commitment $commitment)
    {
        $commitment->load(['planning:id,title', 'feature:id,jira_key,name', 'user:id,name']);
        $commitment->append('status_details');

        return Inertia::render('commitments/show', [
            'commitment' => $commitment,
        ]);
    }

    /**
     * Zeigt das Formular zum Bearbeiten eines bestimmten Commitments an.
     */
    public function edit(Commitment $commitment)
    {
        $commitment->load(['planning:id,title', 'feature:id,jira_key,name', 'user:id,name']);
        $commitment->append('status_details');

        // Lade Features für dieses Planning für das Dropdown
        $features = $commitment->planning->features()
            ->select('features.id', 'features.jira_key', 'features.name')
            ->get();

        $tenantId = Auth::user()->current_tenant_id;
        return Inertia::render('commitments/edit', [
            'commitment' => $commitment,
            'features' => $features,
            'users' => User::whereHas('tenants', fn($q) => $q->where('tenants.id', $tenantId))->get(['id', 'name']),
            'commitmentTypes' => [
                ['value' => 'A', 'label' => 'Hohe Priorität & Dringlichkeit'],
                ['value' => 'B', 'label' => 'Hohe Priorität, geringe Dringlichkeit'],
                ['value' => 'C', 'label' => 'Geringe Priorität, hohe Dringlichkeit'],
                ['value' => 'D', 'label' => 'Geringe Priorität & Dringlichkeit'],
            ],
            'statusOptions' => [
                ['value' => 'suggested', 'label' => 'Vorschlag', 'color' => 'bg-blue-100 text-blue-800'],
                ['value' => 'accepted', 'label' => 'Angenommen', 'color' => 'bg-yellow-100 text-yellow-800'],
                ['value' => 'completed', 'label' => 'Erledigt', 'color' => 'bg-green-100 text-green-800'],
            ],
            'currentStatus' => $commitment->status ? (is_string($commitment->status) ? $commitment->status : $commitment->status->value) : 'suggested',
            'possibleTransitions' => $this->getPossibleStatusTransitions($commitment),
        ]);
    }

    private function getPossibleStatusTransitions(Commitment $commitment): array
    {
        $current = $commitment->status ? (is_string($commitment->status) ? $commitment->status : $commitment->status->value) : 'suggested';
        $targets = StatusMapper::transitionTargets(StatusMapper::COMMITMENT, $current);

        return collect($targets)
            ->map(fn(string $value) => StatusMapper::details(StatusMapper::COMMITMENT, $value, 'suggested'))
            ->filter()
            ->map(fn(array $details) => [
                'value' => $details['value'],
                'label' => $details['name'],
                'color' => $details['color'],
            ])
            ->values()
            ->all();
    }

    /**
     * Aktualisiert ein bestimmtes Commitment in der Datenbank.
     */
    public function update(UpdateCommitmentRequest $request, Commitment $commitment)
    {
        $validated = $request->validated();

        try {
            $this->commitmentService->update($commitment, $validated);
        } catch (ValidationException $e) {
            return redirect()->back()->withErrors($e->errors());
        }

        return redirect()->route('commitments.index', ['planning_id' => $commitment->planning_id])
            ->with('success', 'Commitment erfolgreich aktualisiert.');
    }

    /**
     * Löscht ein bestimmtes Commitment aus der Datenbank.
     */
    public function destroy(Commitment $commitment)
    {
        $planningId = $commitment->planning_id;
        $commitment->delete();

        return redirect()->route('commitments.index', ['planning_id' => $planningId])
            ->with('success', 'Commitment erfolgreich gelöscht.');
    }

    /**
     * Zeigt eine Zusammenfassung aller Commitments für ein bestimmtes Planning.
     */
    public function planningCommitments(Planning $planning)
    {
        $this->authorize('view', $planning);
        // Features und zugehörige Commitments laden
        $planning->load([
            'features:id,jira_key,name',
            'features.commitments' => function ($query) use ($planning) {
                $query->where('planning_id', $planning->id)
                    ->with('user:id,name');
            },
            'features.commitments.user:id,name',
        ]);

        // Commitments mit status_details Accessor anreichern
        $planning->features->each(function ($feature) {
            $feature->commitments->each(function ($commitment) {
                $commitment->append('status_details');
            });
        });

        return Inertia::render('commitments/planning', [
            'planning' => $planning,
            'commitmentTypes' => [
                ['value' => 'A', 'label' => 'Hohe Priorität & Dringlichkeit'],
                ['value' => 'B', 'label' => 'Hohe Priorität, geringe Dringlichkeit'],
                ['value' => 'C', 'label' => 'Geringe Priorität, hohe Dringlichkeit'],
                ['value' => 'D', 'label' => 'Geringe Priorität & Dringlichkeit'],
            ],
        ]);
    }

    /**
     * API-Endpunkt zum Laden der Features eines bestimmten Plannings.
     */
    public function getFeaturesForPlanning(Request $request)
    {
        $data = $request->validate([
            'planning_id' => 'required|exists:plannings,id'
        ]);

        $planningId = $data['planning_id'];
        $planning = Planning::findOrFail($planningId);
        $this->authorize('view', $planning);

        $features = $planning->features()
            ->select('features.id', 'features.jira_key', 'features.name')
            ->get();

        return response()->json($features);
    }
}
