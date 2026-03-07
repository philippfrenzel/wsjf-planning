<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Models\FeaturePlan;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class UpdateFeaturePlan extends Tool
{
    protected string $name = 'update-feature-plan';

    protected string $description = 'Update a plan component. Can update title, description, and/or status.';

    public function schema(JsonSchema $schema): array
    {
        return [
            'plan_id' => $schema->integer()->description('The plan ID to update')->required(),
            'title' => $schema->string()->description('New plan title'),
            'description' => $schema->string()->description('New plan description'),
            'status' => $schema->string()->description('New status: open, implemented, obsolete')->enum(['open', 'implemented', 'obsolete']),
        ];
    }

    public function handle(Request $request): Response
    {
        try {
            $data = $request->validate([
                'plan_id' => 'required|integer',
                'title' => 'nullable|string|max:255',
                'description' => 'nullable|string',
                'status' => 'nullable|string|in:open,implemented,obsolete',
            ]);

            $plan = FeaturePlan::find($data['plan_id']);

            if (! $plan) {
                return Response::error("Plan {$data['plan_id']} not found.");
            }

            $updateFields = collect($data)
                ->except('plan_id')
                ->filter(fn ($v) => $v !== null)
                ->toArray();

            if (empty($updateFields)) {
                return Response::error('No fields provided to update.');
            }

            $plan->update($updateFields);
            $plan->refresh();

            cache()->increment('app.data.version', 1);

            return Response::json([
                'id' => $plan->id,
                'title' => $plan->title,
                'status' => $plan->status,
                'description' => \Illuminate\Support\Str::limit($plan->description, 500),
                'updated_at' => $plan->updated_at?->toIso8601String(),
                'message' => "Plan '{$plan->title}' updated successfully.",
            ]);
        } catch (\Throwable $e) {
            return Response::error('update-feature-plan failed: ' . $e->getMessage());
        }
    }
}
