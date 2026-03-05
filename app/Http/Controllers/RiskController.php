<?php

namespace App\Http\Controllers;

use App\Models\Risk;
use App\Models\Planning;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RiskController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'planning_id' => ['required', 'exists:plannings,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'roam_status' => ['required', 'string', 'in:identified,resolved,owned,accepted,mitigated'],
            'category' => ['nullable', 'string', 'in:technical,business,schedule,resource,dependency'],
            'impact' => ['required', 'string', 'in:low,medium,high'],
            'owner_id' => ['nullable', 'exists:users,id'],
        ]);

        if (empty($validated['owner_id'])) {
            $validated['owner_id'] = Auth::id();
        }

        Risk::create($validated);

        return back()->with('success', 'Risiko wurde erstellt.');
    }

    public function update(Request $request, Risk $risk): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'roam_status' => ['required', 'string', 'in:identified,resolved,owned,accepted,mitigated'],
            'category' => ['nullable', 'string', 'in:technical,business,schedule,resource,dependency'],
            'impact' => ['required', 'string', 'in:low,medium,high'],
            'owner_id' => ['nullable', 'exists:users,id'],
        ]);

        $risk->update($validated);

        return back()->with('success', 'Risiko wurde aktualisiert.');
    }

    public function destroy(Risk $risk): RedirectResponse
    {
        $risk->delete();

        return back()->with('success', 'Risiko wurde gelöscht.');
    }
}
