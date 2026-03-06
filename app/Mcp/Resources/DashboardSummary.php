<?php

declare(strict_types=1);

namespace App\Mcp\Resources;

use App\Models\Feature;
use App\Models\Planning;
use App\Models\Project;
use App\Models\Skill;
use App\Models\Team;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Resource;

class DashboardSummary extends Resource
{
    protected string $name = 'dashboard-summary';

    protected string $uri = 'wsjf://dashboard/summary';

    protected string $description = 'Overview of the current tenant: project count, feature count, team count, skill count, and recent plannings.';

    protected string $mimeType = 'application/json';

    public function handle(): Response
    {
        return Response::json([
            'projects_count' => Project::count(),
            'features_count' => Feature::count(),
            'teams_count' => Team::count(),
            'skills_count' => Skill::count(),
            'plannings_count' => Planning::count(),
            'recent_features' => Feature::orderByDesc('created_at')
                ->limit(5)
                ->get(['id', 'jira_key', 'name', 'status', 'wsjf_score', 'created_at'])
                ->toArray(),
        ]);
    }
}
