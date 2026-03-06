<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Models\Project;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class CreateProject extends Tool
{
    protected string $name = 'create-project';

    protected string $description = 'Create a new project. Requires project_number, name, start_date, and project_leader_id. Returns the created project.';

    public function schema(JsonSchema $schema): array
    {
        return [
            'project_number' => $schema->string()->description('Unique project number')->required(),
            'name' => $schema->string()->description('Project name')->required(),
            'start_date' => $schema->string()->description('Project start date (YYYY-MM-DD)')->required(),
            'project_leader_id' => $schema->integer()->description('User ID of the project leader')->required(),
            'description' => $schema->string()->description('Project description (plain text or markdown)'),
            'jira_base_uri' => $schema->string()->description('Jira base URI for the project'),
            'deputy_leader_id' => $schema->integer()->description('User ID of the deputy project leader'),
        ];
    }

    public function handle(Request $request): Response
    {
        $data = $request->validate([
            'project_number' => 'required|string|max:255|unique:projects',
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'project_leader_id' => 'required|integer|exists:users,id',
            'description' => 'nullable|string',
            'jira_base_uri' => 'nullable|string|url',
            'deputy_leader_id' => 'nullable|integer|exists:users,id',
        ]);

        try {
            $data['created_by'] = Auth::id();
            $data['tenant_id'] = Auth::user()->current_tenant_id;

            $project = Project::create($data);

            cache()->increment('app.data.version', 1);
        } catch (\Throwable $e) {
            return Response::error("Failed to create project: {$e->getMessage()}");
        }

        return Response::json([
            'id' => $project->id,
            'project_number' => $project->project_number,
            'name' => $project->name,
            'status' => $project->status,
            'start_date' => $project->start_date,
            'project_leader_id' => $project->project_leader_id,
            'message' => "Project '{$project->name}' created successfully.",
        ]);
    }
}
