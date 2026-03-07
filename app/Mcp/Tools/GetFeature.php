<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Models\Feature;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class GetFeature extends Tool
{
    protected string $name = 'get-feature';

    protected string $description = 'Get full details of a feature including WSJF scores, dependencies, skill requirements, and status history.';

    public function schema(JsonSchema $schema): array
    {
        return [
            'feature_id' => $schema->integer()->description('The feature ID (numeric). Provide either feature_id or feature_key.'),
            'feature_key' => $schema->string()->description('The feature key (e.g. WSJF-5). Provide either feature_id or feature_key.'),
        ];
    }

    public function handle(Request $request): Response
    {
        try {
            $data = $request->validate([
                'feature_id' => 'nullable|integer',
                'feature_key' => 'nullable|string|max:50',
            ]);

            $feature = $this->resolveFeature($data);
            $feature?->load([
                'project:id,name',
                'requester:id,name,email',
                'team:id,name',
                'iteration:id,name',
                'requiredSkills:id,name,category',
                'dependencies.related:id,jira_key,name',
                'dependents.feature:id,jira_key,name',
            ]);

            if (! $feature) {
                return Response::error('Feature not found. Provide a valid feature_id or feature_key.');
            }

            return Response::json([
                'id' => $feature->id,
                'feature_key' => $feature->jira_key,
                'name' => $feature->name,
                'type' => (string) $feature->type,
                'description' => $feature->description,
                'status' => (string) $feature->status,
                'project' => $feature->project?->only('id', 'name'),
                'requester' => $feature->requester?->only('id', 'name', 'email'),
                'team' => $feature->team?->only('id', 'name'),
                'iteration' => $feature->iteration?->only('id', 'name'),
                'required_skills' => $feature->requiredSkills->map->only('id', 'name', 'category'),
                'dependencies' => $feature->dependencies->map(fn ($d) => $d->related?->only('id', 'jira_key', 'name'))->filter()->values(),
                'dependents' => $feature->dependents->map(fn ($d) => $d->feature?->only('id', 'jira_key', 'name'))->filter()->values(),
                'created_at' => $feature->created_at?->toIso8601String(),
            ]);
        } catch (\Throwable $e) {
            return Response::error('get-feature failed: ' . $e->getMessage());
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
