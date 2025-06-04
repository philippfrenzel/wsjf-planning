<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Project;

class DashboardController extends Controller
{
    /**
     * Zeigt das Dashboard mit KPIs an.
     */
    public function index(Request $request)
    {
        $userId = auth()->id();

        $myProjectsCount = \App\Models\Project::where('created_by', $userId)->count();
        $activePlanningsCount = \App\Models\Planning::whereNull('executed_at')->count();
        $visibleFeatureCount = \App\Models\Feature::whereHas('project', function ($q) use ($userId) {
            $q->where('created_by', $userId)
                ->orWhere('project_leader_id', $userId)
                ->orWhere('deputy_leader_id', $userId);
        })->count();

        // Gültige Plannings für den User (z.B. als Stakeholder)
        $validPlannings = \App\Models\Planning::whereHas('stakeholders', function ($q) use ($userId) {
            $q->where('users.id', $userId);
        })->get(['id', 'title']);

        return Inertia::render('dashboard', [
            'myProjectsCount' => $myProjectsCount,
            'activePlanningsCount' => $activePlanningsCount,
            'visibleFeatureCount' => $visibleFeatureCount,
            'validPlannings' => $validPlannings,
        ]);
    }
}
