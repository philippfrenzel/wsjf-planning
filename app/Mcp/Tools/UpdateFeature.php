<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Models\Feature;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class UpdateFeature extends Tool
{
    protected string $name = 'update-feature';

    protected string $description = 'Update an existing feature. Only provided fields are changed. Returns the updated feature.';

    public function schema(JsonSchema $schema): array
    {
        return [
            'feature_id' => $schema->integer()->description('The feature ID to update')->required(),
            'name' => $schema->string()->description('New feature name'),
            'jira_key' => $schema->string()->description('New feature key'),
            'type' => $schema->string()->description('Feature type: business, enabler, tech_debt, nfr')->enum(['business', 'enabler', 'tech_debt', 'nfr']),
            'description' => $schema->string()->description('New description'),
            'requester_id' => $schema->integer()->description('New requester user ID'),
            'project_id' => $schema->integer()->description('New project ID'),
            'team_id' => $schema->integer()->description('New team ID'),
        ];
    }

    public function handle(Request $request): Response
    {
        $data = $request->validate([
            'feature_id' => 'required|integer',
            'name' => 'nullable|string|max:255',
            'jira_key' => 'nullable|string|max:255',
            'type' => 'nullable|string|in:business,enabler,tech_debt,nfr',
            'description' => 'nullable|string',
            'requester_id' => 'nullable|integer|exists:users,id',
            'project_id' => 'nullable|integer|exists:projects,id',
            'team_id' => 'nullable|integer|exists:teams,id',
        ]);

        $feature = Feature::find($data['feature_id']);

        if (! $feature) {
            return Response::error("Feature {$data['feature_id']} not found.");
        }

        $updateFields = collect($data)
            ->except('feature_id')
            ->filter(fn ($v) => $v !== null)
            ->toArray();

        if (empty($updateFields)) {
            return Response::error('No fields provided to update.');
        }

        $feature->update($updateFields);

        cache()->increment('app.data.version', 1);

        $feature->refresh();

        return Response::json([
            'id' => $feature->id,
            'feature_key' => $feature->jira_key,
            'name' => $feature->name,
            'type' => $feature->type,
            'status' => $feature->status,
            'project_id' => $feature->project_id,
            'team_id' => $feature->team_id,
            'message' => "Feature '{$feature->name}' updated successfully.",
        ]);
    }
}
