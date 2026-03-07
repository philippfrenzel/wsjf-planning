<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Models\Feature;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class UpdateFeatureSpecification extends Tool
{
    protected string $name = 'update-feature-specification';

    protected string $description = 'Update the specification content of a feature.';

    public function schema(JsonSchema $schema): array
    {
        return [
            'feature_id' => $schema->integer()->description('The feature ID')->required(),
            'content' => $schema->string()->description('New specification content in Markdown')->required(),
        ];
    }

    public function handle(Request $request): Response
    {
        try {
            $data = $request->validate([
                'feature_id' => 'required|integer',
                'content' => 'required|string',
            ]);

            $feature = Feature::with('specification')->find($data['feature_id']);

            if (! $feature) {
                return Response::error("Feature {$data['feature_id']} not found.");
            }

            $spec = $feature->specification;

            if (! $spec) {
                return Response::error("Feature {$data['feature_id']} has no specification. Use create-feature-specification first.");
            }

            $spec->update(['content' => $data['content']]);

            cache()->increment('app.data.version', 1);

            return Response::json([
                'id' => $spec->id,
                'feature_id' => $spec->feature_id,
                'content' => \Illuminate\Support\Str::limit($spec->content, 500),
                'updated_at' => $spec->updated_at?->toIso8601String(),
                'message' => "Specification updated for feature '{$feature->name}'.",
            ]);
        } catch (\Throwable $e) {
            return Response::error('update-feature-specification failed: ' . $e->getMessage());
        }
    }
}
