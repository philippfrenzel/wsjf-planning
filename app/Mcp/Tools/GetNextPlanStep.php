<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Models\Feature;
use App\Models\FeaturePlan;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class GetNextPlanStep extends Tool
{
    protected string $name = 'get-next-plan-step';

    protected string $description = 'Get the next actionable plan step for a feature. Returns the highest-priority open plan whose dependencies are all implemented.';

    public function schema(JsonSchema $schema): array
    {
        return [
            'feature_id' => $schema->integer()->description('The feature ID')->required(),
        ];
    }

    public function handle(Request $request): Response
    {
        try {
            $data = $request->validate([
                'feature_id' => 'required|integer',
            ]);

            $feature = Feature::find($data['feature_id']);

            if (! $feature) {
                return Response::error("Feature {$data['feature_id']} not found.");
            }

            $openPlans = $feature->plans()
                ->where('status', FeaturePlan::STATUS_OPEN)
                ->with(['dependencies:id,title,status', 'estimationComponent.latestEstimation'])
                ->orderByRaw("CASE priority WHEN 'P1' THEN 1 WHEN 'P2' THEN 2 WHEN 'P3' THEN 3 ELSE 4 END")
                ->orderBy('sort_order')
                ->get();

            // Find the first plan where all dependencies are implemented
            $nextPlan = $openPlans->first(function (FeaturePlan $plan) {
                return $plan->isActionable();
            });

            if (! $nextPlan) {
                $remaining = $openPlans->count();
                if ($remaining === 0) {
                    return Response::json([
                        'status' => 'complete',
                        'message' => 'All plans are implemented or obsolete. No open plans remaining.',
                    ]);
                }

                return Response::json([
                    'status' => 'blocked',
                    'message' => "There are {$remaining} open plans but all have unresolved dependencies.",
                    'blocked_plans' => $openPlans->map(fn ($p) => [
                        'id' => $p->id,
                        'title' => $p->title,
                        'priority' => $p->priority,
                        'pending_dependencies' => $p->dependencies
                            ->where('status', '!=', FeaturePlan::STATUS_IMPLEMENTED)
                            ->map(fn ($d) => ['id' => $d->id, 'title' => $d->title, 'status' => $d->status])
                            ->values(),
                    ])->values(),
                ]);
            }

            $estimation = $nextPlan->estimationComponent?->latestEstimation;

            return Response::json([
                'status' => 'next',
                'plan' => [
                    'id' => $nextPlan->id,
                    'title' => $nextPlan->title,
                    'priority' => $nextPlan->priority,
                    'sort_order' => $nextPlan->sort_order,
                    'description' => $nextPlan->description,
                    'dependencies' => $nextPlan->dependencies->map(fn ($d) => [
                        'id' => $d->id,
                        'title' => $d->title,
                        'status' => $d->status,
                    ])->values(),
                    'estimation' => $estimation ? [
                        'best_case' => $estimation->best_case,
                        'most_likely' => $estimation->most_likely,
                        'worst_case' => $estimation->worst_case,
                        'unit' => $estimation->unit,
                        'weighted_estimate' => $estimation->weighted_case,
                    ] : null,
                ],
                'progress' => [
                    'total' => $feature->plans()->whereNot('status', FeaturePlan::STATUS_OBSOLETE)->count(),
                    'implemented' => $feature->plans()->where('status', FeaturePlan::STATUS_IMPLEMENTED)->count(),
                    'open' => $feature->plans()->where('status', FeaturePlan::STATUS_OPEN)->count(),
                ],
            ]);
        } catch (\Throwable $e) {
            return Response::error('get-next-plan-step failed: ' . $e->getMessage());
        }
    }
}
