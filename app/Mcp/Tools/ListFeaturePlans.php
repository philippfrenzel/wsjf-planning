<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Models\Feature;
use App\Models\FeaturePlan;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class ListFeaturePlans extends Tool
{
    protected string $name = 'list-feature-plans';

    protected string $description = 'List all plan components of a feature with their status and estimation.';

    public function schema(JsonSchema $schema): array
    {
        return [
            'feature_id' => $schema->integer()->description('The feature ID (numeric). Provide either feature_id or feature_key.'),
            'feature_key' => $schema->string()->description('The feature key (e.g. WSJF-5). Provide either feature_id or feature_key.'),
            'status' => $schema->string()->description('Filter by status: open, implemented, obsolete')->enum(['open', 'implemented', 'obsolete']),
        ];
    }

    public function handle(Request $request): Response
    {
        try {
            $data = $request->validate([
                'feature_id' => 'nullable|integer',
                'feature_key' => 'nullable|string|max:50',
                'status' => 'nullable|string|in:open,implemented,obsolete',
            ]);

            $feature = $this->resolveFeature($data);

            if (! $feature) {
                return Response::error('Feature not found. Provide a valid feature_id or feature_key.');
            }

            $query = $feature->plans()->with(['estimationComponent.latestEstimation', 'dependencies:id,title,status']);

            if (! empty($data['status'])) {
                $query->where('status', $data['status']);
            }

            $plans = $query->orderBy('sort_order')->get();

            return Response::json($plans->map(function (FeaturePlan $plan) {
                $estimation = $plan->estimationComponent?->latestEstimation;

                return [
                    'id' => $plan->id,
                    'title' => $plan->title,
                    'status' => $plan->status,
                    'priority' => $plan->priority,
                    'sort_order' => $plan->sort_order,
                    'depends_on' => $plan->dependencies->map(fn ($d) => [
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
                ];
            })->values());
        } catch (\Throwable $e) {
            return Response::error('list-feature-plans failed: ' . $e->getMessage());
        }
    }

    private function resolveFeature(array $data): ?Feature
    {
        if (! empty($data['feature_id'])) {
            return Feature::find($data['feature_id']);
        }

        if (! empty($data['feature_key'])) {
            return Feature::where('jira_key', $data['feature_key'])->first();
        }

        return null;
    }
}
