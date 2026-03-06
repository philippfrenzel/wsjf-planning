<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Models\Team;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class GetTeam extends Tool
{
    protected string $name = 'get-team';

    protected string $description = 'Get a team with its members and their skills.';

    public function schema(JsonSchema $schema): array
    {
        return [
            'team_id' => $schema->integer()->description('The team ID')->required(),
        ];
    }

    public function handle(Request $request): Response
    {
        $data = $request->validate(['team_id' => 'required|integer']);

        $team = Team::with(['members' => fn ($q) => $q->with('skills:id,name,category')])->find($data['team_id']);

        if (! $team) {
            return Response::error("Team {$data['team_id']} not found.");
        }

        return Response::json([
            'id' => $team->id,
            'name' => $team->name,
            'description' => $team->description,
            'members' => $team->members->map(fn ($m) => [
                'id' => $m->id,
                'name' => $m->name,
                'email' => $m->email,
                'skills' => $m->skills->map(fn ($s) => [
                    'id' => $s->id,
                    'name' => $s->name,
                    'category' => $s->category,
                    'level' => $s->pivot->level ?? null,
                ]),
            ]),
        ]);
    }
}
