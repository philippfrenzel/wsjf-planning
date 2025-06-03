<?php

namespace App\Http\Controllers;

use App\Models\EstimationComponent;
use App\Models\Feature;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;

class EstimationComponentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $components = EstimationComponent::with('creator', 'feature', 'latestEstimation')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('estimationcomponents/index', [
            'components' => $components
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $features = Feature::all();

        return Inertia::render('estimationcomponents/create', [
            'features' => $features
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'feature_id' => 'required|exists:features,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'redirect_to_feature' => 'nullable|exists:features,id',
        ]);

        $component = EstimationComponent::create([
            'feature_id' => $validated['feature_id'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'created_by' => Auth::id(),
            'status' => EstimationComponent::STATUS_ACTIVE, // Standardmäßig aktiv
        ]);

        if ($request->has('redirect_to_feature')) {
            return redirect()->route('features.show', $request->redirect_to_feature)
                ->with('success', 'Komponente wurde erfolgreich erstellt.');
        }

        return redirect()->route('estimation-components.index')
            ->with('success', 'Komponente wurde erfolgreich erstellt.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $component = EstimationComponent::with([
            'creator',
            'feature',
            'estimations.creator',
            'estimations.history.changer'
        ])->findOrFail($id);

        return Inertia::render('estimationcomponents/show', [
            'component' => $component
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $component = EstimationComponent::findOrFail($id);
        $features = Feature::all();

        return Inertia::render('estimationcomponents/edit', [
            'component' => $component,
            'features' => $features
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, EstimationComponent $estimationComponent)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $estimationComponent->update($validated);

        // Umleitung basierend auf dem Parameter
        if ($request->has('redirect_to_feature')) {
            return redirect()->route('features.show', $request->redirect_to_feature)
                ->with('success', 'Komponente wurde erfolgreich aktualisiert.');
        }

        // Standard-Umleitung zur Komponenten-Seite
        return redirect()->route('estimation-components.show', $estimationComponent)
            ->with('success', 'Komponente wurde erfolgreich aktualisiert.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $component = EstimationComponent::findOrFail($id);
        $featureId = $component->feature_id;
        $component->delete();

        // Wenn der Request von einer Feature-Detailseite kommt
        if (request()->has('redirect_to_feature') && request()->redirect_to_feature) {
            return Redirect::route('features.show', $featureId)
                ->with('success', 'Schätzungskomponente wurde gelöscht.');
        }

        return Redirect::route('estimation-components.index')
            ->with('success', 'Schätzungskomponente wurde gelöscht.');
    }

    /**
     * Archiviert eine Komponente.
     */
    public function archive(string $id)
    {
        $component = EstimationComponent::findOrFail($id);
        $component->archive();

        if (request()->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return Redirect::back()->with('success', 'Komponente wurde archiviert.');
    }

    /**
     * Aktiviert eine archivierte Komponente.
     */
    public function activate(string $id)
    {
        $component = EstimationComponent::findOrFail($id);
        $component->activate();

        if (request()->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return Redirect::back()->with('success', 'Komponente wurde wieder aktiviert.');
    }
}
