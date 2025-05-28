<?php

namespace App\Http\Controllers;

use App\Models\Estimation;
use App\Models\EstimationComponent;
use App\Models\EstimationHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class EstimationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $estimations = Estimation::with('component.feature', 'creator')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('estimations/index', [
            'estimations' => $estimations
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $components = EstimationComponent::with('feature')->get();

        return Inertia::render('estimations/create', [
            'components' => $components
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'component_id' => 'required|exists:estimation_components,id',
            'best_case' => 'required|numeric|min:0',
            'most_likely' => 'required|numeric|min:0',
            'worst_case' => 'required|numeric|min:0',
            'unit' => 'required|string|in:hours,days,story_points',
            'notes' => 'nullable|string',
        ]);

        $estimation = Estimation::create([
            'component_id' => $validated['component_id'],
            'best_case' => $validated['best_case'],
            'most_likely' => $validated['most_likely'],
            'worst_case' => $validated['worst_case'],
            'unit' => $validated['unit'],
            'notes' => $validated['notes'] ?? null,
            'created_by' => Auth::id(),
        ]);

        $component = EstimationComponent::with('feature')->find($validated['component_id']);

        // Wenn die Anfrage von einem Inertia-Request kommt (AJAX)
        if ($request->wantsJson()) {
            return response()->json([
                'estimation' => $estimation->load('creator')
            ]);
        }

        // Wenn der Request von einer Feature-Detailseite kommt
        if ($request->has('redirect_to_feature') && $request->redirect_to_feature) {
            return Redirect::route('features.show', $component->feature_id)
                ->with('success', 'Schätzung wurde erstellt.');
        }

        // Wenn der Request von einer Komponenten-Detailseite kommt
        if ($request->has('redirect_to_component') && $request->redirect_to_component) {
            return Redirect::route('estimation-components.show', $validated['component_id'])
                ->with('success', 'Schätzung wurde erstellt.');
        }

        return Redirect::route('estimations.index')
            ->with('success', 'Schätzung wurde erstellt.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $estimation = Estimation::with([
            'creator',
            'component.feature',
            'history.changer'
        ])->findOrFail($id);

        return Inertia::render('estimations/show', [
            'estimation' => $estimation
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $estimation = Estimation::findOrFail($id);
        $components = EstimationComponent::with('feature')->get();

        return Inertia::render('estimations/edit', [
            'estimation' => $estimation,
            'components' => $components
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'best_case' => 'required|numeric|min:0',
            'most_likely' => 'required|numeric|min:0',
            'worst_case' => 'required|numeric|min:0',
            'unit' => 'required|string|in:hours,days,story_points',
            'notes' => 'nullable|string',
        ]);

        $estimation = Estimation::findOrFail($id);

        // Speichere alte Werte für das Änderungsprotokoll
        $oldValues = [
            'best_case' => $estimation->best_case,
            'most_likely' => $estimation->most_likely,
            'worst_case' => $estimation->worst_case,
        ];

        $estimation->update($validated);

        // Erstelle Einträge im Änderungsprotokoll für geänderte Werte
        foreach (['best_case', 'most_likely', 'worst_case'] as $field) {
            if ($oldValues[$field] != $validated[$field]) {
                EstimationHistory::create([
                    'estimation_id' => $estimation->id,
                    'field_name' => $field,
                    'old_value' => $oldValues[$field],
                    'new_value' => $validated[$field],
                    'changed_by' => Auth::id(),
                    'changed_at' => now(),
                ]);
            }
        }

        $component = $estimation->component;

        // Wenn der Request von einer Feature-Detailseite kommt
        if ($request->has('redirect_to_feature') && $request->redirect_to_feature) {
            return Redirect::route('features.show', $component->feature_id)
                ->with('success', 'Schätzung wurde aktualisiert.');
        }

        // Wenn der Request von einer Komponenten-Detailseite kommt
        if ($request->has('redirect_to_component') && $request->redirect_to_component) {
            return Redirect::route('estimation-components.show', $component->id)
                ->with('success', 'Schätzung wurde aktualisiert.');
        }

        return Redirect::route('estimations.show', $estimation->id)
            ->with('success', 'Schätzung wurde aktualisiert.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $estimation = Estimation::with('component.feature')->findOrFail($id);
        $componentId = $estimation->component_id;
        $featureId = $estimation->component->feature_id;

        $estimation->delete();

        // Wenn der Request von einer Feature-Detailseite kommt
        if (request()->has('redirect_to_feature') && request()->redirect_to_feature) {
            return Redirect::route('features.show', $featureId)
                ->with('success', 'Schätzung wurde gelöscht.');
        }

        // Wenn der Request von einer Komponenten-Detailseite kommt
        if (request()->has('redirect_to_component') && request()->redirect_to_component) {
            return Redirect::route('estimation-components.show', $componentId)
                ->with('success', 'Schätzung wurde gelöscht.');
        }

        return Redirect::route('estimations.index')
            ->with('success', 'Schätzung wurde gelöscht.');
    }
}
