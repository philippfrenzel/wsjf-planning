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

class CommitmentController extends Controller
{
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

        $commitments = $query->get();

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
    public function store(Request $request)
    {
        $validated = $request->validate([
            'planning_id' => 'required|exists:plannings,id',
            'feature_id' => [
                'required',
                'exists:features,id',
                Rule::exists('feature_planning')->where(function ($query) use ($request) {
                    $query->where('planning_id', $request->input('planning_id'))
                        ->where('feature_id', $request->input('feature_id'));
                }),
            ],
            'commitment_type' => 'required|in:A,B,C,D',
            'status' => 'nullable|string|in:suggested,accepted,completed',
        ], [
            'feature_id.exists' => 'Das Feature muss zum ausgewählten Planning gehören.',
        ]);

        // Automatisch den aktuell angemeldeten Benutzer verwenden
        $validated['user_id'] = Auth::id();

        // Prüfe, ob bereits ein Commitment für diese Kombination existiert
        $existing = Commitment::where('planning_id', $validated['planning_id'])
            ->where('feature_id', $validated['feature_id'])
            ->where('user_id', $validated['user_id'])
            ->first();

        if ($existing) {
            return redirect()->back()->withErrors([
                'commitment' => 'Es existiert bereits ein Commitment für dieses Feature und diesen Benutzer im ausgewählten Planning.'
            ]);
        }

        // Status wird automatisch auf den Default-Wert (Suggested) gesetzt
        // wenn er nicht explizit angegeben wurde
        $commitment = Commitment::create($validated);

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

    /**
     * Ermittelt die möglichen Status-Übergänge für ein Commitment.
     */
    private function getPossibleStatusTransitions(Commitment $commitment): array
    {
        $transitions = [];

        // Wenn status ein String ist, konvertieren wir es in ein State-Objekt
        if ($commitment->status && is_string($commitment->status)) {
            // Bei String-Status geben wir die Standard-Übergänge zurück
            switch ($commitment->status) {
                case 'suggested':
                    $transitions[] = [
                        'value' => 'accepted',
                        'label' => 'Angenommen',
                        'color' => 'bg-yellow-100 text-yellow-800'
                    ];
                    $transitions[] = [
                        'value' => 'completed',
                        'label' => 'Erledigt',
                        'color' => 'bg-green-100 text-green-800'
                    ];
                    break;
                case 'accepted':
                    $transitions[] = [
                        'value' => 'completed',
                        'label' => 'Erledigt',
                        'color' => 'bg-green-100 text-green-800'
                    ];
                    break;
                case 'completed':
                    // Keine weiteren Übergänge von "completed" aus
                    break;
            }
        }
        // Wenn es ein State-Objekt ist
        else if ($commitment->status) {
            // Basierend auf dem aktuellen Status die möglichen Übergänge ermitteln
            if ($commitment->status->canTransitionTo(\App\States\Commitment\Accepted::class)) {
                $transitions[] = [
                    'value' => 'accepted',
                    'label' => 'Angenommen',
                    'color' => 'bg-yellow-100 text-yellow-800'
                ];
            }

            if ($commitment->status->canTransitionTo(\App\States\Commitment\Completed::class)) {
                $transitions[] = [
                    'value' => 'completed',
                    'label' => 'Erledigt',
                    'color' => 'bg-green-100 text-green-800'
                ];
            }

            if ($commitment->status->canTransitionTo(\App\States\Commitment\Suggested::class)) {
                $transitions[] = [
                    'value' => 'suggested',
                    'label' => 'Vorschlag',
                    'color' => 'bg-blue-100 text-blue-800'
                ];
            }
        }

        return $transitions;
    }

    /**
     * Aktualisiert ein bestimmtes Commitment in der Datenbank.
     */
    public function update(Request $request, Commitment $commitment)
    {
        $validated = $request->validate([
            'feature_id' => [
                'required',
                'exists:features,id',
                Rule::exists('feature_planning')->where(function ($query) use ($request, $commitment) {
                    $query->where('planning_id', $commitment->planning_id)
                        ->where('feature_id', $request->input('feature_id'));
                }),
            ],
            'user_id' => 'required|exists:users,id',
            'commitment_type' => 'required|in:A,B,C,D',
            'status' => 'nullable|string|in:suggested,accepted,completed',
        ], [
            'feature_id.exists' => 'Das Feature muss zum ausgewählten Planning gehören.',
        ]);

        // Prüfe, ob bereits ein Commitment für diese Kombination existiert (außer dem aktuellen)
        $existing = Commitment::where('planning_id', $commitment->planning_id)
            ->where('feature_id', $validated['feature_id'])
            ->where('user_id', $validated['user_id'])
            ->where('id', '!=', $commitment->id)
            ->first();

        if ($existing) {
            return redirect()->back()->withErrors([
                'commitment' => 'Es existiert bereits ein Commitment für dieses Feature und diesen Benutzer im ausgewählten Planning.'
            ]);
        }

        // Status-Transition verarbeiten, wenn ein neuer Status angegeben wurde
        if (isset($validated['status'])) {
            $currentStatusValue = is_string($commitment->status) ? $commitment->status : ($commitment->status ? $commitment->status->value : null);

            if ($commitment->status && $validated['status'] !== $currentStatusValue) {
                // Wenn status ein String ist, setzen wir den neuen Status direkt
                if (is_string($commitment->status)) {
                    $commitment->status = $validated['status'];
                    $commitment->save();
                }
                // Wenn status ein State-Objekt ist, verwenden wir die Transition-Funktionen
                else {
                    switch ($validated['status']) {
                        case 'suggested':
                            if ($commitment->status->canTransitionTo(\App\States\Commitment\Suggested::class)) {
                                $commitment->status->transitionTo(\App\States\Commitment\Suggested::class);
                            }
                            break;
                        case 'accepted':
                            if ($commitment->status->canTransitionTo(\App\States\Commitment\Accepted::class)) {
                                $commitment->status->transitionTo(\App\States\Commitment\Accepted::class);
                            }
                            break;
                        case 'completed':
                            if ($commitment->status->canTransitionTo(\App\States\Commitment\Completed::class)) {
                                $commitment->status->transitionTo(\App\States\Commitment\Completed::class);
                            }
                            break;
                    }
                }
            }

            // Status aus den validated-Daten entfernen, da er bereits gesetzt wurde
            unset($validated['status']);
        }

        $commitment->update($validated);

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
        // Features und zugehörige Commitments laden
        $planning->load([
            'features:id,jira_key,name',
            'features.commitments' => function ($query) use ($planning) {
                $query->where('planning_id', $planning->id);
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
        $request->validate([
            'planning_id' => 'required|exists:plannings,id'
        ]);

        $planningId = $request->input('planning_id');
        $planning = Planning::findOrFail($planningId);

        $features = $planning->features()
            ->select('features.id', 'features.jira_key', 'features.name')
            ->get();

        return response()->json($features);
    }
}
