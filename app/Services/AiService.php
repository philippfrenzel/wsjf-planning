<?php

namespace App\Services;

use App\Models\DefinitionTemplate;
use App\Models\Project;
use Illuminate\Support\Facades\Auth;
use LucianoTonet\GroqLaravel\Facades\Groq;
use LucianoTonet\GroqPHP\GroqException;

class AiService
{
    /**
     * Generate a feature description based on the project's definition templates.
     */
    public function generateFeatureDescription(
        string $featureName,
        int $projectId,
        string $existingDescription = '',
        string $context = '',
    ): string {
        $project = Project::with('definitionTemplates')->findOrFail($projectId);
        $templates = $project->definitionTemplates
            ->where('is_active', true)
            ->groupBy('type');

        $systemPrompt = $this->buildSystemPrompt($project, $templates);
        $userPrompt = $this->buildUserPrompt($featureName, $existingDescription, $context);

        try {
            $response = Groq::chat()->completions()->create([
                'model' => config('groq.model', 'llama-3.1-8b-instant'),
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userPrompt],
                ],
                'temperature' => 0.7,
                'max_tokens' => 2048,
            ]);

            return $response['choices'][0]['message']['content'] ?? '';
        } catch (GroqException $e) {
            throw new \RuntimeException('AI generation failed: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Chat with the AI about a feature description (multi-turn conversation).
     *
     * @param  array<array{role: string, content: string}>  $messages
     */
    public function chat(
        array $messages,
        string $featureName,
        int $projectId,
        string $currentDescription = '',
    ): string {
        $project = Project::with('definitionTemplates')->findOrFail($projectId);
        $templates = $project->definitionTemplates
            ->where('is_active', true)
            ->groupBy('type');

        $systemPrompt = $this->buildChatSystemPrompt($project, $templates, $featureName, $currentDescription);

        $apiMessages = [['role' => 'system', 'content' => $systemPrompt]];
        foreach ($messages as $msg) {
            $apiMessages[] = [
                'role' => $msg['role'],
                'content' => $msg['content'],
            ];
        }

        try {
            $response = Groq::chat()->completions()->create([
                'model' => config('groq.model', 'llama-3.1-8b-instant'),
                'messages' => $apiMessages,
                'temperature' => 0.7,
                'max_tokens' => 2048,
            ]);

            return $response['choices'][0]['message']['content'] ?? '';
        } catch (GroqException $e) {
            throw new \RuntimeException('AI chat failed: ' . $e->getMessage(), 0, $e);
        }
    }

    private function buildSystemPrompt(Project $project, $templates): string
    {
        $prompt = "You are a SAFe (Scaled Agile Framework) feature description writer for the project \"{$project->name}\".\n";
        $prompt .= "Write feature descriptions in Markdown. Be concise, structured, and actionable.\n";
        $prompt .= "Always respond in the same language as the feature name provided by the user.\n\n";

        if ($templates->has(DefinitionTemplate::TYPE_UST)) {
            $prompt .= "## User Story Template\nUse the following template structure for the description:\n\n";
            foreach ($templates->get(DefinitionTemplate::TYPE_UST) as $tpl) {
                $prompt .= "### {$tpl->title}\n{$tpl->body}\n\n";
            }
        }

        if ($templates->has(DefinitionTemplate::TYPE_DOR)) {
            $prompt .= "## Definition of Ready (DoR)\nEnsure the description satisfies these criteria:\n\n";
            foreach ($templates->get(DefinitionTemplate::TYPE_DOR) as $tpl) {
                $prompt .= "### {$tpl->title}\n{$tpl->body}\n\n";
            }
        }

        if ($templates->has(DefinitionTemplate::TYPE_DOD)) {
            $prompt .= "## Definition of Done (DoD)\nInclude acceptance criteria based on:\n\n";
            foreach ($templates->get(DefinitionTemplate::TYPE_DOD) as $tpl) {
                $prompt .= "### {$tpl->title}\n{$tpl->body}\n\n";
            }
        }

        if ($templates->isEmpty()) {
            $prompt .= "No templates are assigned to this project. Generate a well-structured feature description with:\n";
            $prompt .= "- A brief summary\n- User story (As a... I want... So that...)\n- Acceptance criteria as a checklist\n- Technical notes if applicable\n";
        }

        return $prompt;
    }

    private function buildUserPrompt(string $featureName, string $existingDescription, string $context): string
    {
        $prompt = "Generate a feature description for: **{$featureName}**\n";

        if (! empty($existingDescription)) {
            $prompt .= "\nExisting description to improve/expand:\n{$existingDescription}\n";
        }

        if (! empty($context)) {
            $prompt .= "\nAdditional context:\n{$context}\n";
        }

        $prompt .= "\nReturn only the markdown description, no preamble or explanation.";

        return $prompt;
    }

    private function buildChatSystemPrompt(Project $project, $templates, string $featureName, string $currentDescription): string
    {
        $prompt = "You are an AI assistant helping to refine a SAFe feature description for the project \"{$project->name}\".\n";
        $prompt .= "Feature name: \"{$featureName}\"\n";
        $prompt .= "Always respond in the same language as the user's messages.\n";
        $prompt .= "Format your responses in Markdown. When suggesting a revised description, wrap it in a fenced code block with the language tag `markdown-suggestion` so the user can easily identify and apply it.\n\n";

        if (! empty($currentDescription)) {
            $prompt .= "## Current Description\n{$currentDescription}\n\n";
        }

        if ($templates->has(DefinitionTemplate::TYPE_UST)) {
            $prompt .= "## User Story Template\n";
            foreach ($templates->get(DefinitionTemplate::TYPE_UST) as $tpl) {
                $prompt .= "### {$tpl->title}\n{$tpl->body}\n\n";
            }
        }

        if ($templates->has(DefinitionTemplate::TYPE_DOR)) {
            $prompt .= "## Definition of Ready (DoR)\n";
            foreach ($templates->get(DefinitionTemplate::TYPE_DOR) as $tpl) {
                $prompt .= "### {$tpl->title}\n{$tpl->body}\n\n";
            }
        }

        if ($templates->has(DefinitionTemplate::TYPE_DOD)) {
            $prompt .= "## Definition of Done (DoD)\n";
            foreach ($templates->get(DefinitionTemplate::TYPE_DOD) as $tpl) {
                $prompt .= "### {$tpl->title}\n{$tpl->body}\n\n";
            }
        }

        $prompt .= "Help the user improve, refine, or restructure the feature description. Offer concrete suggestions. ";
        $prompt .= "When proposing a complete revised description, wrap it in:\n";
        $prompt .= "```markdown-suggestion\n...\n```\n";
        $prompt .= "so the user can apply it directly.\n";

        return $prompt;
    }
}
