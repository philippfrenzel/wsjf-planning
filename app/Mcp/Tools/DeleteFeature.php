<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Models\Feature;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class DeleteFeature extends Tool
{
    protected string $name = 'delete-feature';

    protected string $description = 'Delete a feature by ID. This is a soft-delete and can be reversed.';

    public function schema(JsonSchema $schema): array
    {
        return [
            'feature_id' => $schema->integer()->description('The feature ID to delete')->required(),
        ];
    }

    public function handle(Request $request): Response
    {
        $data = $request->validate(['feature_id' => 'required|integer']);

        $feature = Feature::find($data['feature_id']);

        if (! $feature) {
            return Response::error("Feature {$data['feature_id']} not found.");
        }

        $name = $feature->name;
        $feature->delete();

        cache()->increment('app.data.version', 1);

        return Response::json([
            'deleted' => true,
            'feature_id' => $data['feature_id'],
            'message' => "Feature '{$name}' deleted successfully.",
        ]);
    }
}
