<?php

namespace App\Http\Controllers;

use App\Models\DefinitionTemplate;
use App\Models\Project;
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

        $projects = Project::where('tenant_id', $tenantId)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('definitions/index', [
            'templates' => $templates,
            'projects' => $projects,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => ['required', 'in:dor,dod,ust'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'body' => ['required', 'string'],
            'project_ids' => ['nullable', 'array'],
            'project_ids.*' => ['integer', 'exists:projects,id'],
        ]);

        $projectIds = $validated['project_ids'] ?? [];
        unset($validated['project_ids']);

        $template = DefinitionTemplate::create([
            'tenant_id' => Auth::user()->current_tenant_id,
            ...$validated,
        ]);

        if (! empty($projectIds)) {
            $template->projects()->sync($projectIds);
        }

        return redirect()->back()->with('success', 'Template erstellt.');
    }

    public function update(Request $request, DefinitionTemplate $definitionTemplate)
    {
        $validated = $request->validate([
            'type' => ['required', 'in:dor,dod,ust'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'body' => ['required', 'string'],
            'is_active' => ['boolean'],
            'project_ids' => ['nullable', 'array'],
            'project_ids.*' => ['integer', 'exists:projects,id'],
        ]);

        $projectIds = $validated['project_ids'] ?? [];
        unset($validated['project_ids']);

        $definitionTemplate->update($validated);
        $definitionTemplate->projects()->sync($projectIds);

        return redirect()->back()->with('success', 'Template aktualisiert.');
    }

    public function destroy(DefinitionTemplate $definitionTemplate)
    {
        $definitionTemplate->delete();

        return redirect()->back()->with('success', 'Template gelöscht.');
    }
}
