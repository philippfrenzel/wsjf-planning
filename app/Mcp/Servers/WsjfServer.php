<?php

declare(strict_types=1);

namespace App\Mcp\Servers;

use App\Mcp\Resources\DashboardSummary;
use App\Mcp\Tools\CreateFeature;
use App\Mcp\Tools\CreateFeaturePlan;
use App\Mcp\Tools\CreateFeatureSpecification;
use App\Mcp\Tools\CreateProject;
use App\Mcp\Tools\DeleteFeature;
use App\Mcp\Tools\GetFeature;
use App\Mcp\Tools\GetFeatureSpecification;
use App\Mcp\Tools\GetNextPlanStep;
use App\Mcp\Tools\GetProject;
use App\Mcp\Tools\GetTeam;
use App\Mcp\Tools\ListFeaturePlans;
use App\Mcp\Tools\ListFeatures;
use App\Mcp\Tools\ListPlannings;
use App\Mcp\Tools\ListProjects;
use App\Mcp\Tools\ListSkills;
use App\Mcp\Tools\ListTeams;
use App\Mcp\Tools\UpdateFeature;
use App\Mcp\Tools\UpdateFeaturePlan;
use App\Mcp\Tools\UpdateFeatureSpecification;
use App\Mcp\Tools\UpdateProject;
use Laravel\Mcp\Server;

class WsjfServer extends Server
{
    protected string $name = 'WSJF Planning';

    protected string $version = '1.0.0';

    protected string $instructions = <<<'MARKDOWN'
        WSJF Planning MCP Server — provides access to PI Planning data for SAFe teams.
        Available tools let you query and manage projects, features, teams, skills, and
        plannings within the authenticated user's tenant. All data is scoped to the current tenant.
    MARKDOWN;

    protected array $tools = [
        ListProjects::class,
        GetProject::class,
        CreateProject::class,
        UpdateProject::class,
        ListFeatures::class,
        GetFeature::class,
        CreateFeature::class,
        UpdateFeature::class,
        DeleteFeature::class,
        GetFeatureSpecification::class,
        CreateFeatureSpecification::class,
        UpdateFeatureSpecification::class,
        ListFeaturePlans::class,
        CreateFeaturePlan::class,
        UpdateFeaturePlan::class,
        GetNextPlanStep::class,
        ListTeams::class,
        GetTeam::class,
        ListSkills::class,
        ListPlannings::class,
    ];

    protected array $resources = [
        DashboardSummary::class,
    ];
}
