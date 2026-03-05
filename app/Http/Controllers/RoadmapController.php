<?php

namespace App\Http\Controllers;

use App\Models\Planning;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class RoadmapController extends Controller
{
    public function index()
    {
        $tenantId = Auth::user()->current_tenant_id;

        $plannings = Planning::where('tenant_id', $tenantId)
            ->with([
                'project:id,name',
                'features' => function ($q) {
                    $q->select('features.id', 'features.jira_key', 'features.name', 'features.type', 'features.team_id', 'features.iteration_id');
                },
                'features.team:id,name',
                'iterations' => function ($q) {
                    $q->orderBy('number');
                },
            ])
            ->orderBy('planned_at')
            ->get(['id', 'title', 'project_id', 'planned_at', 'executed_at', 'status', 'tenant_id']);

        return Inertia::render('roadmap/index', [
            'plannings' => $plannings,
        ]);
    }
}
