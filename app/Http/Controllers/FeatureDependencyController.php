<?php

namespace App\Http\Controllers;

use App\Models\Feature;
use App\Models\FeatureDependency;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class FeatureDependencyController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    public function store(Request $request, Feature $feature): RedirectResponse
    {
        $validated = $request->validate([
            'related_feature_id' => 'required|exists:features,id',
            'type' => 'required|in:ermoeglicht,verhindert,bedingt,ersetzt',
        ]);

        // Kein Self-Linking und kein Duplikat
        if ((int)$validated['related_feature_id'] === (int)$feature->id) {
            return back()->with('error', 'Ein Feature kann nicht von sich selbst abhängen.');
        }

        FeatureDependency::firstOrCreate([
            'feature_id' => $feature->id,
            'related_feature_id' => $validated['related_feature_id'],
            'type' => $validated['type'],
        ]);

        return back()->with('success', 'Abhängigkeit gespeichert.');
    }

    public function destroy(Feature $feature, FeatureDependency $dependency): RedirectResponse
    {
        // Sicherheit: sicherstellen, dass die Abhängigkeit zu diesem Feature gehört
        if ($dependency->feature_id !== $feature->id) {
            abort(404);
        }

        $dependency->delete();
        return back()->with('success', 'Abhängigkeit entfernt.');
    }
}

