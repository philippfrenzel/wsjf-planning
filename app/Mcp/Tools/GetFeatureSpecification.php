<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Models\Feature;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class GetFeatureSpecification extends Tool
{
    protected string $name = 'get-feature-specification';

    protected string $description = 'Get the specification of a feature including its content.';

    public function schema(JsonSchema $schema): array
    {
        return [
            'feature_id' => $schema->integer()->description('The feature ID')->required(),
        ];
    }

    public function handle(Request $request): Response
    {
        try {
            $data = $request->validate(['feature_id' => 'required|integer']);

            $feature = Feature::with('specification.creator:id,name')->find($data['feature_id']);

            if (! $feature) {
                return Response::error("Feature {$data['feature_id']} not found.");
            }

            $spec = $feature->specification;

            if (! $spec) {
                return Response::json([
                    'feature_id' => $feature->id,
                    'content' => null,
                    'message' => 'This feature has no specification yet.',
                ]);
            }

            return Response::json([
                'id' => $spec->id,
                'feature_id' => $spec->feature_id,
                'content' => $spec->content,
                'created_by' => $spec->creator?->name,
                'created_at' => $spec->created_at?->toIso8601String(),
                'updated_at' => $spec->updated_at?->toIso8601String(),
            ]);
        } catch (\Throwable $e) {
            return Response::error('get-feature-specification failed: ' . $e->getMessage());
        }
    }
}
