<?php

namespace App\Http\Controllers;

use App\Models\Estimation;
use App\Models\EstimationComponent;
use App\Models\Feature;
use App\Models\FeaturePlan;
use App\Services\AiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FeaturePlanController extends Controller
{
    /**
     * Generate plans from a feature's specification via AI.
     */
    public function generate(Request $request, Feature $feature)
    {
        if (! $feature->specification) {
            return redirect()->back()
                ->with('error', 'Feature muss zuerst eine Spezifikation haben.');
        }

        try {
            $plansData = app(AiService::class)->generatePlans($feature->id);
        } catch (\Throwable $e) {
            return redirect()->back()
                ->with('error', 'Fehler bei der KI-Generierung: ' . $e->getMessage());
        }

        foreach ($plansData as $index => $planData) {
            $plan = FeaturePlan::create([
                'feature_id' => $feature->id,
                'title' => $planData['title'],
                'description' => $planData['description'] ?? '',
                'status' => FeaturePlan::STATUS_OPEN,
                'sort_order' => $index,
                'created_by' => Auth::id(),
            ]);

            $component = EstimationComponent::create([
                'feature_id' => $feature->id,
                'name' => $planData['title'],
                'description' => "Plan-Komponente: {$planData['title']}",
                'created_by' => Auth::id(),
                'status' => EstimationComponent::STATUS_ACTIVE,
            ]);

            Estimation::create([
                'component_id' => $component->id,
                'best_case' => $planData['best_case'],
                'most_likely' => $planData['most_likely'],
                'worst_case' => $planData['worst_case'],
                'unit' => 'story_points',
                'notes' => 'KI-generierte Schätzung',
                'created_by' => Auth::id(),
            ]);

            $plan->update(['estimation_component_id' => $component->id]);
        }

        cache()->increment('app.data.version', 1);

        return redirect()->back()
            ->with('success', 'Pläne wurden erfolgreich generiert.');
    }

    /**
     * Update a plan's content.
     */
    public function update(Request $request, FeaturePlan $plan)
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
        ]);

        $plan->update($validated);

        cache()->increment('app.data.version', 1);

        return redirect()->back()
            ->with('success', 'Plan wurde erfolgreich aktualisiert.');
    }

    /**
     * Update a plan's status.
     */
    public function updateStatus(Request $request, FeaturePlan $plan)
    {
        $validated = $request->validate([
            'status' => 'required|in:open,implemented,obsolete',
        ]);

        $plan->update(['status' => $validated['status']]);

        cache()->increment('app.data.version', 1);

        return redirect()->back()
            ->with('success', 'Plan-Status wurde erfolgreich aktualisiert.');
    }
}
