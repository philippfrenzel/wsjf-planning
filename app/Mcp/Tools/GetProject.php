<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Models\Project;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class GetProject extends Tool
{
    protected string $name = 'get-project';

    protected string $description = 'Get detailed information about a specific project including teams, required skills, and feature counts.';

    public function schema(JsonSchema $schema): array
    {
        return [
            'project_id' => $schema->integer()->description('The project ID')->required(),
        ];
    }

    public function handle(Request $request): Response
    {
        $data = $request->validate(['project_id' => 'required|integer']);

        $project = Project::with([
            'projectLeader:id,name,email',
            'deputyLeader:id,name,email',
            'teams:id,name',
            'requiredSkills:id,name,category',
        ])->withCount('teams')->find($data['project_id']);

        if (! $project) {
            return Response::error("Project {$data['project_id']} not found.");
        }

        return Response::json([
            'id' => $project->id,
            'project_number' => $project->project_number,
            'name' => $project->name,
            'description' => $project->description,
            'status' => $project->status,
            'start_date' => $project->start_date,
            'jira_base_uri' => $project->jira_base_uri,
            'project_leader' => $project->projectLeader?->only('id', 'name', 'email'),
            'deputy_leader' => $project->deputyLeader?->only('id', 'name', 'email'),
            'teams' => $project->teams->map->only('id', 'name'),
            'required_skills' => $project->requiredSkills->map->only('id', 'name', 'category'),
        ]);
    }
}
