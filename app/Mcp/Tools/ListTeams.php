<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Models\Team;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class ListTeams extends Tool
{
    protected string $name = 'list-teams';

    protected string $description = 'List all teams in the current tenant with member count.';

    public function handle(): Response
    {
        try {
            $teams = Team::withCount('members')->get();

            return Response::json($teams->map(fn (Team $t) => [
                'id' => $t->id,
                'name' => $t->name,
                'description' => $t->description,
                'members_count' => $t->members_count,
            ])->values());
        } catch (\Throwable $e) {
            return Response::error('list-teams failed: ' . $e->getMessage());
        }
    }
}
