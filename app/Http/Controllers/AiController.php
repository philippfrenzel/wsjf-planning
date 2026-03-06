<?php

namespace App\Http\Controllers;

use App\Services\AiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiController extends Controller
{
    public function __construct(
        private readonly AiService $aiService,
    ) {}

    public function generateDescription(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'feature_name' => 'required|string|max:255',
            'project_id' => 'required|integer|exists:projects,id',
            'existing_description' => 'nullable|string',
            'context' => 'nullable|string|max:1000',
        ]);

        try {
            $description = $this->aiService->generateFeatureDescription(
                featureName: $validated['feature_name'],
                projectId: $validated['project_id'],
                existingDescription: $validated['existing_description'] ?? '',
                context: $validated['context'] ?? '',
            );

            return response()->json(['description' => $description]);
        } catch (\RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 502);
        }
    }

    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'messages' => 'required|array|min:1',
            'messages.*.role' => 'required|in:user,assistant',
            'messages.*.content' => 'required|string',
            'feature_name' => 'required|string|max:255',
            'project_id' => 'required|integer|exists:projects,id',
            'current_description' => 'nullable|string',
        ]);

        try {
            $reply = $this->aiService->chat(
                messages: $validated['messages'],
                featureName: $validated['feature_name'],
                projectId: $validated['project_id'],
                currentDescription: $validated['current_description'] ?? '',
            );

            return response()->json(['reply' => $reply]);
        } catch (\RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 502);
        }
    }
}
