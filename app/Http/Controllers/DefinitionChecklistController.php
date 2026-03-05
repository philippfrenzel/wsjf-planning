<?php

namespace App\Http\Controllers;

use App\Models\DefinitionChecklist;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DefinitionChecklistController extends Controller
{
    public function index()
    {
        $tenantId = Auth::user()->current_tenant_id;

        $checklists = DefinitionChecklist::where('tenant_id', $tenantId)
            ->orderBy('type')
            ->orderBy('title')
            ->get();

        return Inertia::render('definitions/index', [
            'checklists' => $checklists,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'type' => ['required', 'in:dor,dod'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.text' => ['required', 'string', 'max:500'],
            'items.*.required' => ['boolean'],
        ]);

        DefinitionChecklist::create([
            'tenant_id' => Auth::user()->current_tenant_id,
            ...$request->only(['type', 'title', 'description', 'items']),
        ]);

        return redirect()->back()->with('success', 'Definition erstellt.');
    }

    public function update(Request $request, DefinitionChecklist $definitionChecklist)
    {
        $request->validate([
            'type' => ['required', 'in:dor,dod'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.text' => ['required', 'string', 'max:500'],
            'items.*.required' => ['boolean'],
            'is_active' => ['boolean'],
        ]);

        $definitionChecklist->update($request->only(['type', 'title', 'description', 'items', 'is_active']));

        return redirect()->back()->with('success', 'Definition aktualisiert.');
    }

    public function destroy(DefinitionChecklist $definitionChecklist)
    {
        $definitionChecklist->delete();

        return redirect()->back()->with('success', 'Definition gelöscht.');
    }
}
