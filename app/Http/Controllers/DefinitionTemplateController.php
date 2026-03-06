<?php

namespace App\Http\Controllers;

use App\Models\DefinitionTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DefinitionTemplateController extends Controller
{
    public function index()
    {
        $tenantId = Auth::user()->current_tenant_id;

        $templates = DefinitionTemplate::where('tenant_id', $tenantId)
            ->with('projects:id,name')
            ->orderBy('type')
            ->orderBy('title')
            ->get();

        return Inertia::render('definitions/index', [
            'templates' => $templates,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => ['required', 'in:dor,dod,ust'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'body' => ['required', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        DefinitionTemplate::create($validated);

        return redirect()->back()->with('success', 'Template erstellt.');
    }

    public function update(Request $request, DefinitionTemplate $definitionTemplate)
    {
        $validated = $request->validate([
            'type' => ['required', 'in:dor,dod,ust'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'body' => ['required', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $definitionTemplate->update($validated);

        return redirect()->back()->with('success', 'Template aktualisiert.');
    }

    public function destroy(DefinitionTemplate $definitionTemplate)
    {
        $definitionTemplate->delete();

        return redirect()->back()->with('success', 'Template gelöscht.');
    }
}
