<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Models\Feature;
use App\Models\FeatureSpecification;
use App\Services\AiService;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class CreateFeatureSpecification extends Tool
{
    protected string $name = 'create-feature-specification';

    protected string $description = 'Create a specification for a feature. If content is omitted, generates one using AI from the feature description.';

    public function schema(JsonSchema $schema): array
    {
        return [
            'feature_id' => $schema->integer()->description('The feature ID')->required(),
            'content' => $schema->string()->description('Specification content in Markdown. If omitted, AI generates from feature description.'),
        ];
    }

    public function handle(Request $request): Response
    {
        try {
            $data = $request->validate([
                'feature_id' => 'required|integer|exists:features,id',
                'content' => 'nullable|string',
            ]);

            $feature = Feature::with('specification')->find($data['feature_id']);

            if (! $feature) {
                return Response::error("Feature {$data['feature_id']} not found.");
            }

            if ($feature->specification) {
                return Response::error("Feature {$data['feature_id']} already has a specification. Use update-feature-specification to modify it.");
            }

            $content = $data['content'] ?? null;

            if (! $content) {
                $content = app(AiService::class)->generateSpecification($feature->id);
            }

            $spec = FeatureSpecification::create([
                'feature_id' => $feature->id,
                'content' => $content,
                'created_by' => Auth::id(),
                'tenant_id' => Auth::user()->current_tenant_id,
            ]);

            cache()->increment('app.data.version', 1);

            return Response::json([
                'id' => $spec->id,
                'feature_id' => $spec->feature_id,
                'content' => \Illuminate\Support\Str::limit($spec->content, 500),
                'message' => "Specification created for feature '{$feature->name}'.",
            ]);
        } catch (\Throwable $e) {
            return Response::error('create-feature-specification failed: ' . $e->getMessage());
        }
    }
}
