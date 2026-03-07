<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Models\Estimation;
use App\Models\EstimationComponent;
use App\Models\Feature;
use App\Models\FeaturePlan;
use App\Services\AiService;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class CreateFeaturePlan extends Tool
{
    protected string $name = 'create-feature-plan';

    protected string $description = 'Create a plan component for a feature. Can auto-generate from specification using AI, or create a single plan manually.';

    public function schema(JsonSchema $schema): array
    {
        return [
            'feature_id' => $schema->integer()->description('The feature ID')->required(),
            'generate_from_spec' => $schema->boolean()->description('If true, AI generates multiple plans from the specification. Ignores title/description.'),
            'title' => $schema->string()->description('Plan title. Required if not generating from spec.'),
            'description' => $schema->string()->description('Plan description'),
            'best_case' => $schema->number()->description('Best case estimate in story points'),
            'most_likely' => $schema->number()->description('Most likely estimate in story points'),
            'worst_case' => $schema->number()->description('Worst case estimate in story points'),
        ];
    }

    public function handle(Request $request): Response
    {
        try {
            $data = $request->validate([
                'feature_id' => 'required|integer|exists:features,id',
                'generate_from_spec' => 'nullable|boolean',
                'title' => 'nullable|string|max:255',
                'description' => 'nullable|string',
                'best_case' => 'nullable|numeric|min:0',
                'most_likely' => 'nullable|numeric|min:0',
                'worst_case' => 'nullable|numeric|min:0',
            ]);

            $feature = Feature::with('specification')->find($data['feature_id']);

            if (! $feature) {
                return Response::error("Feature {$data['feature_id']} not found.");
            }

            $tenantId = Auth::user()->current_tenant_id;
            $userId = Auth::id();

            if (! empty($data['generate_from_spec'])) {
                return $this->generateFromSpec($feature, $tenantId, $userId);
            }

            return $this->createSinglePlan($feature, $data, $tenantId, $userId);
        } catch (\Throwable $e) {
            return Response::error('create-feature-plan failed: ' . $e->getMessage());
        }
    }

    private function generateFromSpec(Feature $feature, int $tenantId, int $userId): Response
    {
        if (! $feature->specification) {
            return Response::error("Feature {$feature->id} has no specification. Create a specification first.");
        }

        $aiPlans = app(AiService::class)->generatePlans($feature->id);
        $createdPlans = [];
        $maxSort = $feature->plans()->max('sort_order') ?? 0;

        foreach ($aiPlans as $index => $planData) {
            $component = EstimationComponent::create([
                'feature_id' => $feature->id,
                'name' => $planData['title'],
                'description' => $planData['description'] ?? '',
                'created_by' => $userId,
                'status' => EstimationComponent::STATUS_ACTIVE,
                'tenant_id' => $tenantId,
            ]);

            Estimation::create([
                'component_id' => $component->id,
                'best_case' => $planData['best_case'],
                'most_likely' => $planData['most_likely'],
                'worst_case' => $planData['worst_case'],
                'unit' => 'story_points',
                'created_by' => $userId,
                'tenant_id' => $tenantId,
            ]);

            $plan = FeaturePlan::create([
                'feature_id' => $feature->id,
                'title' => $planData['title'],
                'description' => $planData['description'] ?? '',
                'status' => FeaturePlan::STATUS_OPEN,
                'sort_order' => $maxSort + $index + 1,
                'estimation_component_id' => $component->id,
                'created_by' => $userId,
                'tenant_id' => $tenantId,
            ]);

            $createdPlans[] = [
                'id' => $plan->id,
                'title' => $plan->title,
                'status' => $plan->status,
                'estimation' => [
                    'best_case' => $planData['best_case'],
                    'most_likely' => $planData['most_likely'],
                    'worst_case' => $planData['worst_case'],
                ],
            ];
        }

        cache()->increment('app.data.version', 1);

        return Response::json([
            'plans' => $createdPlans,
            'message' => count($createdPlans) . " plan(s) generated from specification for feature '{$feature->name}'.",
        ]);
    }

    private function createSinglePlan(Feature $feature, array $data, int $tenantId, int $userId): Response
    {
        if (empty($data['title'])) {
            return Response::error('Title is required when not generating from specification.');
        }

        $maxSort = $feature->plans()->max('sort_order') ?? 0;
        $componentId = null;

        $hasEstimates = isset($data['best_case']) && isset($data['most_likely']) && isset($data['worst_case']);

        if ($hasEstimates) {
            $component = EstimationComponent::create([
                'feature_id' => $feature->id,
                'name' => $data['title'],
                'description' => $data['description'] ?? '',
                'created_by' => $userId,
                'status' => EstimationComponent::STATUS_ACTIVE,
                'tenant_id' => $tenantId,
            ]);

            Estimation::create([
                'component_id' => $component->id,
                'best_case' => $data['best_case'],
                'most_likely' => $data['most_likely'],
                'worst_case' => $data['worst_case'],
                'unit' => 'story_points',
                'created_by' => $userId,
                'tenant_id' => $tenantId,
            ]);

            $componentId = $component->id;
        }

        $plan = FeaturePlan::create([
            'feature_id' => $feature->id,
            'title' => $data['title'],
            'description' => $data['description'] ?? '',
            'status' => FeaturePlan::STATUS_OPEN,
            'sort_order' => $maxSort + 1,
            'estimation_component_id' => $componentId,
            'created_by' => $userId,
            'tenant_id' => $tenantId,
        ]);

        cache()->increment('app.data.version', 1);

        return Response::json([
            'id' => $plan->id,
            'title' => $plan->title,
            'status' => $plan->status,
            'sort_order' => $plan->sort_order,
            'message' => "Plan '{$plan->title}' created for feature '{$feature->name}'.",
        ]);
    }
}
