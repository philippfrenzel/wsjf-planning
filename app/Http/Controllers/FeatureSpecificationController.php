<?php

namespace App\Http\Controllers;

use App\Models\Feature;
use App\Models\FeatureSpecification;
use App\Services\AiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FeatureSpecificationController extends Controller
{
    /**
     * Generate a specification for a feature via AI.
     */
    public function store(Request $request, Feature $feature)
    {
        if ($feature->specification) {
            return redirect()->back()
                ->with('error', 'Diese Feature hat bereits eine Spezifikation.');
        }

        try {
            $content = app(AiService::class)->generateSpecification($feature->id);
        } catch (\Throwable $e) {
            return redirect()->back()
                ->with('error', 'Fehler bei der KI-Generierung: ' . $e->getMessage());
        }

        $spec = FeatureSpecification::create([
            'feature_id' => $feature->id,
            'content' => $content,
            'created_by' => Auth::id(),
        ]);

        $spec->createVersionSnapshot('Initiale KI-Generierung');

        cache()->increment('app.data.version', 1);

        return redirect()->back()
            ->with('success', 'Spezifikation wurde erfolgreich generiert.');
    }

    /**
     * Update the specification content.
     */
    public function update(Request $request, Feature $feature)
    {
        $validated = $request->validate([
            'content' => 'required|string',
            'change_summary' => 'nullable|string|max:255',
        ]);

        $spec = $feature->specification;

        // Snapshot the old content before overwriting
        $spec->createVersionSnapshot($validated['change_summary'] ?? 'Manuelle Bearbeitung');

        $spec->update(['content' => $validated['content']]);

        cache()->increment('app.data.version', 1);

        return redirect()->back()
            ->with('success', 'Spezifikation wurde erfolgreich aktualisiert.');
    }

    /**
     * Get version history for a feature's specification.
     */
    public function versions(Feature $feature)
    {
        if (! $feature->specification) {
            return response()->json(['versions' => []]);
        }

        $versions = $feature->specification->versions()
            ->with('creator:id,name')
            ->get(['id', 'specification_id', 'version_number', 'change_summary', 'content', 'created_by', 'created_at']);

        return response()->json(['versions' => $versions]);
    }
}
