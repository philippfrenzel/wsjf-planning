<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Project;
use App\Models\Feature;
use App\Models\Commitment;
use App\Models\Planning;
use App\Models\Vote;

class DashboardController extends Controller
{
    /**
     * Zeigt das Dashboard mit KPIs an.
     */
    public function index(Request $request)
    {
        $userId = auth()->id();

        $myProjectsCount = Project::where('created_by', $userId)->count();
        $activePlanningsCount = Planning::whereNull('executed_at')->count();
        $visibleFeatureCount = Feature::whereHas('project', function ($q) use ($userId) {
            $q->where('created_by', $userId)
                ->orWhere('project_leader_id', $userId)
                ->orWhere('deputy_leader_id', $userId);
        })->count();

        // Gültige Plannings für den User (z.B. als Stakeholder)
        $validPlannings = Planning::whereHas('stakeholders', function ($q) use ($userId) {
            $q->where('users.id', $userId);
        })->get(['id', 'title']);

        // KPIs für Charts
        // 1) Feature-Status Verteilung
        $featureStatus = Feature::selectRaw("COALESCE(status, 'in-planning') as status, COUNT(*) as count")
            ->groupBy('status')
            ->get()
            ->map(function ($row) {
                return [
                    'status' => $row->status,
                    'count' => (int) $row->count,
                ];
            })
            ->values();

        // 2) Commitments je Planning (accepted + completed)
        $committedByPlanningRaw = Commitment::select('planning_id')
            ->selectRaw("SUM(CASE WHEN status IN ('accepted','completed') THEN 1 ELSE 0 END) as committed")
            ->groupBy('planning_id')
            ->with('planning:id,title')
            ->get();

        $committedByPlanning = $committedByPlanningRaw
            ->map(function ($row) {
                return [
                    'planning_id' => (int) $row->planning_id,
                    'planning' => optional($row->planning)->title ?? (string) $row->planning_id,
                    'committed' => (int) $row->committed,
                ];
            })
            ->sortByDesc('committed')
            ->take(10)
            ->values();

        // 3) Votes pro Tag (letzte 30 Tage)
        $from = now()->subDays(30)->startOfDay();
        $votesByDayRaw = Vote::selectRaw('DATE(voted_at) as day, COUNT(*) as count')
            ->where('voted_at', '>=', $from)
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->keyBy('day');

        $votesByDay = collect();
        $cursor = $from->copy();
        while ($cursor->lte(now())) {
            $day = $cursor->toDateString();
            $votesByDay->push([
                'day' => $day,
                'count' => (int) ($votesByDayRaw[$day]->count ?? 0),
            ]);
            $cursor->addDay();
        }

        // 4) WSJF-Abdeckung pro Planning (Anteil Features mit 3 Creator-Votes)
        $wsjfCoverage = collect();
        $planningsForCoverage = Planning::withCount('features')
            ->orderByDesc('features_count')
            ->take(10)
            ->get(['id','title','created_by']);

        foreach ($planningsForCoverage as $p) {
            $featureIds = $p->features()->pluck('features.id');
            $total = $featureIds->count();
            $rated = 0;
            if ($total > 0) {
                $byFeature = Vote::selectRaw('feature_id, COUNT(DISTINCT type) as types')
                    ->where('planning_id', $p->id)
                    ->where('user_id', $p->created_by)
                    ->whereIn('feature_id', $featureIds)
                    ->groupBy('feature_id')
                    ->get();
                $rated = $byFeature->filter(fn($r) => (int)$r->types >= 3)->count();
            }
            $wsjfCoverage->push([
                'planning_id' => (int) $p->id,
                'planning' => $p->title,
                'rated' => $rated,
                'open' => max(0, $total - $rated),
                'total' => $total,
            ]);
        }

        return Inertia::render('dashboard', [
            'myProjectsCount' => $myProjectsCount,
            'activePlanningsCount' => $activePlanningsCount,
            'visibleFeatureCount' => $visibleFeatureCount,
            'validPlannings' => $validPlannings,
            // Charts
            'featureStatus' => $featureStatus,
            'committedByPlanning' => $committedByPlanning,
            'votesByDay' => $votesByDay,
            'wsjfCoverage' => $wsjfCoverage,
        ]);
    }
}
