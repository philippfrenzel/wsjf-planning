<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Models\Feature;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class CreateFeature extends Tool
{
    protected string $name = 'create-feature';

    protected string $description = 'Create a new feature. Requires at minimum a name and project_id. Returns the created feature.';

    public function schema(JsonSchema $schema): array
    {
        return [
            'name' => $schema->string()->description('Feature name')->required(),
            'project_id' => $schema->integer()->description('Project ID this feature belongs to')->required(),
            'jira_key' => $schema->string()->description('Feature key (e.g. PROJ-123)'),
            'type' => $schema->string()->description('Feature type: business, enabler, tech_debt, nfr')->enum(['business', 'enabler', 'tech_debt', 'nfr']),
            'description' => $schema->string()->description('Feature description (plain text or markdown)'),
            'requester_id' => $schema->integer()->description('User ID of the requester'),
            'team_id' => $schema->integer()->description('Team ID to assign the feature to'),
        ];
    }

    public function handle(Request $request): Response
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'project_id' => 'required|integer|exists:projects,id',
            'jira_key' => 'nullable|string|max:255',
            'type' => 'nullable|string|in:business,enabler,tech_debt,nfr',
            'description' => 'nullable|string',
            'requester_id' => 'nullable|integer|exists:users,id',
            'team_id' => 'nullable|integer|exists:teams,id',
        ]);

        try {
            $data['tenant_id'] = Auth::user()->current_tenant_id;

            $feature = Feature::create($data);

            cache()->increment('app.data.version', 1);
        } catch (\Throwable $e) {
            return Response::error("Failed to create feature: {$e->getMessage()}");
        }

        return Response::json([
            'id' => $feature->id,
            'feature_key' => $feature->jira_key,
            'name' => $feature->name,
            'type' => $feature->type,
            'status' => $feature->status,
            'project_id' => $feature->project_id,
            'message' => "Feature '{$feature->name}' created successfully.",
        ]);
    }
}
