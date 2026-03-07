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
            'feature_id' => $schema->integer()->description('The feature ID')->required(),
            'status' => $schema->string()->description('Filter by status: open, implemented, obsolete')->enum(['open', 'implemented', 'obsolete']),
        ];
    }

    public function handle(Request $request): Response
    {
        try {
            $data = $request->validate([
                'feature_id' => 'required|integer',
                'status' => 'nullable|string|in:open,implemented,obsolete',
            ]);

            $feature = Feature::find($data['feature_id']);

            if (! $feature) {
                return Response::error("Feature {$data['feature_id']} not found.");
            }

            $query = $feature->plans()->with('estimationComponent.latestEstimation');

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
                    'sort_order' => $plan->sort_order,
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
}
