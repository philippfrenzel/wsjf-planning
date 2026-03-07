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
            'feature_id' => $schema->integer()->description('The feature ID (numeric). Provide either feature_id or feature_key.'),
            'feature_key' => $schema->string()->description('The feature key (e.g. WSJF-5). Provide either feature_id or feature_key.'),
        ];
    }

    public function handle(Request $request): Response
    {
        try {
            $data = $request->validate([
                'feature_id' => 'nullable|integer',
                'feature_key' => 'nullable|string|max:50',
            ]);

            $feature = $this->resolveFeature($data);
            $feature?->load('specification.creator:id,name');

            if (! $feature) {
                return Response::error('Feature not found. Provide a valid feature_id or feature_key.');
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
