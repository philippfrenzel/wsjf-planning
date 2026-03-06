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
            'feature_id' => $schema->integer()->description('The feature ID')->required(),
        ];
    }

    public function handle(Request $request): Response
    {
        try {
            $data = $request->validate(['feature_id' => 'required|integer']);

            $feature = Feature::with([
                'project:id,name',
                'requester:id,name,email',
                'team:id,name',
                'iteration:id,name',
                'requiredSkills:id,name,category',
                'dependencies.related:id,jira_key,name',
                'dependents.feature:id,jira_key,name',
            ])->find($data['feature_id']);

            if (! $feature) {
                return Response::error("Feature {$data['feature_id']} not found.");
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
}
