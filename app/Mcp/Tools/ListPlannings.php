<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Models\Planning;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class ListPlannings extends Tool
{
    protected string $name = 'list-plannings';

    protected string $description = 'List PI plannings with their project, owner, status, and feature/iteration counts.';

    public function schema(JsonSchema $schema): array
    {
        return [
            'project_id' => $schema->integer()->description('Filter by project ID'),
        ];
    }

    public function handle(Request $request): Response
    {
        $query = Planning::with([
            'project:id,name',
            'owner:id,name',
            'deputy:id,name',
        ])->withCount(['features', 'iterations']);

        if ($projectId = $request->get('project_id')) {
            $query->where('project_id', $projectId);
        }

        $plannings = $query->orderByDesc('created_at')->get();

        return Response::json($plannings->map(fn (Planning $p) => [
            'id' => $p->id,
            'name' => $p->name,
            'status' => $p->status,
            'project' => $p->project?->name,
            'owner' => $p->owner?->name,
            'deputy' => $p->deputy?->name,
            'features_count' => $p->features_count,
            'iterations_count' => $p->iterations_count,
            'start_date' => $p->start_date,
            'end_date' => $p->end_date,
        ]));
    }
}
