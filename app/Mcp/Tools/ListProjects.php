<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Models\Project;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class ListProjects extends Tool
{
    protected string $name = 'list-projects';

    protected string $description = 'List all projects in the current tenant with their leaders and team count.';

    public function schema(JsonSchema $schema): array
    {
        return [
            'status' => $schema->string()->description('Filter by status (e.g. active, closed)'),
        ];
    }

    public function handle(Request $request): Response
    {
        try {
            $query = Project::with(['projectLeader:id,name', 'deputyLeader:id,name'])
                ->withCount('teams');

            if ($status = $request->get('status')) {
                $query->where('status', $status);
            }

            $projects = $query->get()->map(fn (Project $p) => [
                'id' => $p->id,
                'project_number' => $p->project_number,
                'name' => $p->name,
                'status' => (string) $p->status,
                'start_date' => $p->start_date,
                'project_leader' => $p->projectLeader?->name,
                'deputy_leader' => $p->deputyLeader?->name,
                'teams_count' => $p->teams_count,
            ]);

            return Response::json($projects->values());
        } catch (\Throwable $e) {
            return Response::error('list-projects failed: ' . $e->getMessage());
        }
    }
}
