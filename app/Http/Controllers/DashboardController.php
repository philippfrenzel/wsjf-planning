<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Project;
use App\Models\Feature;
use App\Models\Commitment;
use App\Models\FeatureStateHistory;
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

        // 3) Feature Aging (laufender Open-Count der Features über 90 Tage)
        $from = now()->subDays(90)->startOfDay();
        $closedStatuses = ['obsolete', 'rejected', 'implemented'];

        // Erstes Schließ-Datum je Feature (falls vorhanden)
        $firstClosedAt = FeatureStateHistory::whereIn('to_status', $closedStatuses)
            ->selectRaw('feature_id, MIN(changed_at) as closed_at')
            ->groupBy('feature_id')
            ->pluck('closed_at', 'feature_id');

        // Baseline: alle Features, die vor dem Zeitraum existierten und am Starttag noch nicht geschlossen waren
        $baselineOpen = Feature::where('created_at', '<', $from)
            ->get(['id', 'created_at'])
            ->filter(function ($feature) use ($firstClosedAt, $from) {
                $closedAt = $firstClosedAt[$feature->id] ?? null;
                return !($closedAt && $closedAt < $from);
            })
            ->count();

        $events = collect();

        // Events: neue Features im Zeitraum (sofern nicht direkt geschlossen erstellt)
        Feature::whereDate('created_at', '>=', $from)
            ->get(['id', 'created_at', 'status'])
            ->each(function ($feature) use ($closedStatuses, $events) {
                if (!in_array($feature->status, $closedStatuses, true)) {
                    $events->push([
                        'day' => $feature->created_at->toDateString(),
                        'delta' => 1,
                    ]);
                }
            });

        // Events: Statuswechsel
        FeatureStateHistory::where('changed_at', '>=', $from)
            ->get(['from_status', 'to_status', 'changed_at'])
            ->each(function ($history) use ($closedStatuses, $events) {
                $fromClosed = in_array($history->from_status, $closedStatuses, true);
                $toClosed = in_array($history->to_status, $closedStatuses, true);

                if (!$fromClosed && $toClosed) {
                    $events->push([
                        'day' => $history->changed_at->toDateString(),
                        'delta' => -1,
                    ]);
                }

                if ($fromClosed && !$toClosed) {
                    $events->push([
                        'day' => $history->changed_at->toDateString(),
                        'delta' => 1,
                    ]);
                }
            });

        $eventsByDay = $events
            ->groupBy('day')
            ->map(fn($rows) => $rows->sum('delta'));

        $featureAging = collect();
        $openCount = $baselineOpen;
        $cursor = $from->copy();
        $today = now();

        while ($cursor->lte($today)) {
            $day = $cursor->toDateString();
            $openCount += (int) ($eventsByDay[$day] ?? 0);
            $featureAging->push([
                'day' => $day,
                'open_count' => $openCount,
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
            'featureAging' => $featureAging,
            'wsjfCoverage' => $wsjfCoverage,
        ]);
    }
}
