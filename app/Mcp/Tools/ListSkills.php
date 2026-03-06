<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Models\Skill;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class ListSkills extends Tool
{
    protected string $name = 'list-skills';

    protected string $description = 'List all skills in the current tenant, grouped by category.';

    public function schema(JsonSchema $schema): array
    {
        return [
            'category' => $schema->string()->description('Filter by category name'),
        ];
    }

    public function handle(Request $request): Response
    {
        $query = Skill::orderBy('category')->orderBy('name');

        if ($category = $request->get('category')) {
            $query->where('category', $category);
        }

        $skills = $query->get();

        $grouped = $skills->groupBy(fn ($s) => $s->category ?? 'Allgemein')
            ->map(fn ($group, $cat) => [
                'category' => $cat,
                'skills' => $group->map->only('id', 'name', 'category')->values(),
            ])->values();

        return Response::json([
            'total' => $skills->count(),
            'categories' => $grouped,
        ]);
    }
}
