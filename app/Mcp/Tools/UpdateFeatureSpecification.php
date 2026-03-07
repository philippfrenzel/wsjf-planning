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
            'feature_id' => $schema->integer()->description('The feature ID (numeric). Provide either feature_id or feature_key.'),
            'feature_key' => $schema->string()->description('The feature key (e.g. WSJF-5). Provide either feature_id or feature_key.'),
            'content' => $schema->string()->description('New specification content in Markdown')->required(),
        ];
    }

    public function handle(Request $request): Response
    {
        try {
            $data = $request->validate([
                'feature_id' => 'nullable|integer',
                'feature_key' => 'nullable|string|max:50',
                'content' => 'required|string',
            ]);

            $feature = $this->resolveFeature($data);
            $feature?->load('specification');

            if (! $feature) {
                return Response::error('Feature not found. Provide a valid feature_id or feature_key.');
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

    private function resolveFeature(array $data): ?Feature
    {
        if (! empty($data['feature_id'])) {
            return Feature::find($data['feature_id']);
        }

        if (! empty($data['feature_key'])) {
            return Feature::where('jira_key', $data['feature_key'])->first();
        }

        return null;
    }
}
