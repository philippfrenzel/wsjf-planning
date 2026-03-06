<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Models\Feature;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class ListFeatures extends Tool
{
    protected string $name = 'list-features';

    protected string $description = 'List features with optional filters by project, status, or type. Returns key fields and WSJF scores.';

    public function schema(JsonSchema $schema): array
    {
        return [
            'project_id' => $schema->integer()->description('Filter by project ID'),
            'status' => $schema->string()->description('Filter by status (e.g. funnel, analyzing, implementing, done)'),
            'type' => $schema->string()->description('Filter by type: business, enabler, tech_debt, nfr'),
            'limit' => $schema->integer()->description('Max results (default 50)'),
        ];
    }

    public function handle(Request $request): Response
    {
        try {
            $query = Feature::with(['project:id,name', 'requester:id,name', 'team:id,name'])
                ->select([
                    'id', 'jira_key', 'name', 'type', 'status',
                    'project_id', 'requester_id', 'team_id', 'iteration_id',
                    'created_at',
                ]);

            if ($projectId = $request->get('project_id')) {
                $query->where('project_id', $projectId);
            }
            if ($status = $request->get('status')) {
                $query->where('status', $status);
            }
            if ($type = $request->get('type')) {
                $query->where('type', $type);
            }

            $limit = min((int) ($request->get('limit') ?? 50), 200);

            $features = $query->orderByDesc('created_at')->limit($limit)->get();

            return Response::json($features->map(fn (Feature $f) => [
                'id' => $f->id,
                'feature_key' => $f->jira_key,
                'name' => $f->name,
                'type' => (string) $f->type,
                'status' => (string) $f->status,
                'project' => $f->project?->name,
                'requester' => $f->requester?->name,
                'team' => $f->team?->name,
            ])->values());
        } catch (\Throwable $e) {
            return Response::error('list-features failed: ' . $e->getMessage());
        }
    }
}
