<?php

namespace App\Services;

use App\Models\DefinitionTemplate;
use App\Models\Feature;
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

    /**
     * Generate a detailed technical specification from a feature's description.
     */
    public function generateSpecification(int $featureId): string
    {
        $feature = Feature::with(['project.definitionTemplates'])->findOrFail($featureId);
        $project = $feature->project;
        $templates = $project->definitionTemplates->where('is_active', true)->groupBy('type');

        $systemPrompt = $this->buildSpecSystemPrompt($project, $templates);

        $userPrompt = "Erstelle eine detaillierte technische Spezifikation für das Feature \"{$feature->name}\".\n\n";
        $userPrompt .= "## Aktuelle Beschreibung\n{$feature->description}\n\n";
        $userPrompt .= "Antworte ausschließlich mit der Markdown-Spezifikation.";

        try {
            $response = Groq::chat()->completions()->create([
                'model' => config('groq.model', 'llama-3.1-8b-instant'),
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userPrompt],
                ],
                'temperature' => 0.7,
                'max_tokens' => 4096,
            ]);

            return $response['choices'][0]['message']['content'] ?? '';
        } catch (GroqException $e) {
            throw new \RuntimeException('Spezifikation-Generierung fehlgeschlagen: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Generate plan components from a feature's specification.
     * Returns array of plan data with AI-estimated effort.
     *
     * @return array<array{title: string, description: string, best_case: float, most_likely: float, worst_case: float}>
     */
    public function generatePlans(int $featureId): array
    {
        $feature = Feature::with(['specification', 'project'])->findOrFail($featureId);

        if (! $feature->specification) {
            throw new \RuntimeException('Feature hat keine Spezifikation. Bitte zuerst eine Spezifikation erstellen.');
        }

        $systemPrompt = "Du bist ein erfahrener Projektplaner für das Projekt \"{$feature->project->name}\".\n";
        $systemPrompt .= "Zerlege die folgende Feature-Spezifikation in umsetzbare Plan-Komponenten nach dem spec-kit Format.\n\n";
        $systemPrompt .= "Jede Plan-Komponente soll einer User Story oder einem logischen Arbeitspaket entsprechen.\n";
        $systemPrompt .= "Orientiere dich an der Priorisierung in der Spezifikation (P1, P2, P3...).\n\n";
        $systemPrompt .= "Für jede Komponente schätze den Aufwand in Story Points (Fibonacci: 1,2,3,5,8,13,21).\n\n";
        $systemPrompt .= "Antworte AUSSCHLIESSLICH mit einem JSON-Array. Kein Markdown, keine Erklärung.\n";
        $systemPrompt .= "Format:\n";
        $systemPrompt .= "[\n";
        $systemPrompt .= "  {\n";
        $systemPrompt .= "    \"title\": \"User Story 1 - [Titel] (Priority: P1)\",\n";
        $systemPrompt .= "    \"description\": \"## Goal\\n[Was diese Komponente liefert]\\n\\n## Independent Test\\n[Wie man verifiziert, dass es funktioniert]\\n\\n## Acceptance Scenarios\\n1. **Given** ..., **When** ..., **Then** ...\\n\\n## Tasks\\n- [ ] T001 [P] Task description with file path\\n- [ ] T002 Next task\",\n";
        $systemPrompt .= "    \"best_case\": 3,\n";
        $systemPrompt .= "    \"most_likely\": 5,\n";
        $systemPrompt .= "    \"worst_case\": 8\n";
        $systemPrompt .= "  }\n";
        $systemPrompt .= "]\n\n";
        $systemPrompt .= "WICHTIG:\n";
        $systemPrompt .= "- Jede Komponente muss unabhängig umsetzbar und testbar sein\n";
        $systemPrompt .= "- Tasks in der description mit Checkbox-Format: - [ ] T001 [P] Beschreibung in datei/pfad.ext\n";
        $systemPrompt .= "- [P] markiert parallelisierbare Tasks\n";
        $systemPrompt .= "- Erstelle 3-7 Komponenten, von Setup/Foundation bis Polish\n";

        $userPrompt = "Feature: \"{$feature->name}\"\n\n";
        $userPrompt .= "## Spezifikation\n{$feature->specification->content}\n\n";
        $userPrompt .= "Zerlege diese Spezifikation in 3-7 Plan-Komponenten mit Schätzungen.";

        try {
            $response = Groq::chat()->completions()->create([
                'model' => config('groq.model', 'llama-3.1-8b-instant'),
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userPrompt],
                ],
                'temperature' => 0.5,
                'max_tokens' => 4096,
                'response_format' => ['type' => 'json_object'],
            ]);

            $content = $response['choices'][0]['message']['content'] ?? '[]';
            $data = json_decode($content, true);

            // Handle both {plans: [...]} and [...] formats
            if (isset($data['plans'])) {
                $data = $data['plans'];
            }
            if (! is_array($data) || empty($data)) {
                if (preg_match('/\[.*\]/s', $content, $matches)) {
                    $data = json_decode($matches[0], true) ?? [];
                }
            }

            return array_map(function ($plan, $index) {
                return [
                    'title' => $plan['title'] ?? 'Komponente ' . ($index + 1),
                    'description' => $plan['description'] ?? '',
                    'best_case' => max(1, (float) ($plan['best_case'] ?? 1)),
                    'most_likely' => max(1, (float) ($plan['most_likely'] ?? 3)),
                    'worst_case' => max(1, (float) ($plan['worst_case'] ?? 5)),
                ];
            }, $data, array_keys($data));

        } catch (GroqException $e) {
            throw new \RuntimeException('Plan-Generierung fehlgeschlagen: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Chat with the AI about a feature specification (multi-turn conversation).
     *
     * @param  array<array{role: string, content: string}>  $messages
     */
    public function chatSpecification(
        array $messages,
        string $featureName,
        int $projectId,
        string $currentSpecification = '',
    ): string {
        $project = Project::with('definitionTemplates')->findOrFail($projectId);
        $templates = $project->definitionTemplates->where('is_active', true)->groupBy('type');

        $systemPrompt = "Du bist ein KI-Assistent, der bei der Verfeinerung einer Feature-Spezifikation im spec-kit Format für das Projekt \"{$project->name}\" hilft.\n";
        $systemPrompt .= "Feature: \"{$featureName}\"\n";
        $systemPrompt .= "Antworte immer in der Sprache der Nutzer-Nachrichten.\n\n";
        $systemPrompt .= "Die Spezifikation folgt dem spec-kit Format mit Abschnitten:\n";
        $systemPrompt .= "- User Scenarios & Testing (priorisierte User Stories mit Given/When/Then)\n";
        $systemPrompt .= "- Requirements (nummerierte FR-xxx mit MUSS/SOLL/KANN)\n";
        $systemPrompt .= "- Key Entities (falls Daten involviert)\n";
        $systemPrompt .= "- Success Criteria (messbare SC-xxx)\n";
        $systemPrompt .= "- Edge Cases\n\n";
        $systemPrompt .= "Formatiere Antworten in Markdown. Wenn du eine überarbeitete Spezifikation vorschlägst, umschließe sie mit:\n";
        $systemPrompt .= "```markdown-suggestion\n...\n```\n\n";

        if (! empty($currentSpecification)) {
            $systemPrompt .= "## Aktuelle Spezifikation\n{$currentSpecification}\n\n";
        }

        if ($templates->has(DefinitionTemplate::TYPE_DOR)) {
            $systemPrompt .= "## Definition of Ready (DoR)\n";
            foreach ($templates->get(DefinitionTemplate::TYPE_DOR) as $tpl) {
                $systemPrompt .= "### {$tpl->title}\n{$tpl->body}\n\n";
            }
        }

        if ($templates->has(DefinitionTemplate::TYPE_DOD)) {
            $systemPrompt .= "## Definition of Done (DoD)\n";
            foreach ($templates->get(DefinitionTemplate::TYPE_DOD) as $tpl) {
                $systemPrompt .= "### {$tpl->title}\n{$tpl->body}\n\n";
            }
        }

        $systemPrompt .= "Hilf dem Nutzer, die Spezifikation zu verbessern, zu verfeinern oder umzustrukturieren. ";
        $systemPrompt .= "Wenn du eine überarbeitete Spezifikation vorschlägst, umschließe sie mit:\n";
        $systemPrompt .= "```markdown-suggestion\n...\n```\n";
        $systemPrompt .= "damit der Nutzer sie direkt übernehmen kann.\n";

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
                'max_tokens' => 4096,
            ]);

            return $response['choices'][0]['message']['content'] ?? '';
        } catch (GroqException $e) {
            throw new \RuntimeException('AI Spezifikation-Chat fehlgeschlagen: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Chat with the AI about a plan component (multi-turn conversation).
     *
     * @param  array<array{role: string, content: string}>  $messages
     */
    public function chatPlan(
        array $messages,
        string $planTitle,
        int $projectId,
        string $currentDescription = '',
    ): string {
        $project = Project::with('definitionTemplates')->findOrFail($projectId);
        $templates = $project->definitionTemplates->where('is_active', true)->groupBy('type');

        $systemPrompt = "Du bist ein KI-Assistent, der bei der Verfeinerung einer Plan-Komponente für das Projekt \"{$project->name}\" hilft.\n";
        $systemPrompt .= "Plan-Komponente: \"{$planTitle}\"\n";
        $systemPrompt .= "Antworte immer in der Sprache der Nutzer-Nachrichten.\n";
        $systemPrompt .= "Formatiere Antworten in Markdown. Wenn du eine überarbeitete Beschreibung vorschlägst, umschließe sie mit:\n";
        $systemPrompt .= "```markdown-suggestion\n...\n```\n\n";

        if (! empty($currentDescription)) {
            $systemPrompt .= "## Aktuelle Beschreibung\n{$currentDescription}\n\n";
        }

        if ($templates->has(DefinitionTemplate::TYPE_DOR)) {
            $systemPrompt .= "## Definition of Ready (DoR)\n";
            foreach ($templates->get(DefinitionTemplate::TYPE_DOR) as $tpl) {
                $systemPrompt .= "### {$tpl->title}\n{$tpl->body}\n\n";
            }
        }

        if ($templates->has(DefinitionTemplate::TYPE_DOD)) {
            $systemPrompt .= "## Definition of Done (DoD)\n";
            foreach ($templates->get(DefinitionTemplate::TYPE_DOD) as $tpl) {
                $systemPrompt .= "### {$tpl->title}\n{$tpl->body}\n\n";
            }
        }

        $systemPrompt .= "Hilf dem Nutzer, die Plan-Komponente zu verbessern, zu verfeinern oder umzustrukturieren. ";
        $systemPrompt .= "Wenn du eine überarbeitete Beschreibung vorschlägst, umschließe sie mit:\n";
        $systemPrompt .= "```markdown-suggestion\n...\n```\n";
        $systemPrompt .= "damit der Nutzer sie direkt übernehmen kann.\n";

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
            throw new \RuntimeException('AI Plan-Chat fehlgeschlagen: ' . $e->getMessage(), 0, $e);
        }
    }

    private function buildSpecSystemPrompt(Project $project, $templates): string
    {
        $prompt = "Du bist ein erfahrener Software-Architekt und schreibst Feature-Spezifikationen für das Projekt \"{$project->name}\".\n";
        $prompt .= "Erstelle eine detaillierte, strukturierte Spezifikation in Markdown.\n";
        $prompt .= "Antworte immer in der Sprache des Feature-Namens und der Beschreibung.\n\n";

        $prompt .= "Die Spezifikation MUSS dem folgenden spec-kit Format folgen:\n\n";

        $prompt .= "# Feature Specification: [FEATURE NAME]\n\n";
        $prompt .= "**Feature Key**: [aus dem Feature-Key]\n";
        $prompt .= "**Created**: [heutiges Datum]\n";
        $prompt .= "**Status**: Draft\n\n";

        $prompt .= "## User Scenarios & Testing *(mandatory)*\n\n";
        $prompt .= "Priorisierte User Stories als unabhängig testbare User Journeys.\n";
        $prompt .= "Jede User Story muss enthalten:\n";
        $prompt .= "- Titel mit Priorität (P1, P2, P3)\n";
        $prompt .= "- Beschreibung der User Journey in einfacher Sprache\n";
        $prompt .= "- **Why this priority**: Begründung der Priorisierung\n";
        $prompt .= "- **Independent Test**: Wie die Story unabhängig getestet werden kann\n";
        $prompt .= "- **Acceptance Scenarios**: Given/When/Then Format\n\n";

        $prompt .= "### Edge Cases\n";
        $prompt .= "- Was passiert bei Grenzfällen?\n";
        $prompt .= "- Wie behandelt das System Fehler?\n\n";

        $prompt .= "## Requirements *(mandatory)*\n\n";
        $prompt .= "### Functional Requirements\n";
        $prompt .= "- **FR-001**: System MUSS [Fähigkeit]\n";
        $prompt .= "- Nummerierte Anforderungen mit MUSS/SOLL/KANN\n";
        $prompt .= "- Unklare Anforderungen mit [NEEDS CLARIFICATION: ...] markieren\n\n";

        $prompt .= "### Key Entities *(falls Daten involviert)*\n";
        $prompt .= "- Entitäten mit Beziehungen beschreiben (ohne Implementierungsdetails)\n\n";

        $prompt .= "## Success Criteria *(mandatory)*\n\n";
        $prompt .= "### Measurable Outcomes\n";
        $prompt .= "- **SC-001**: [Messbare Metrik]\n";
        $prompt .= "- Technologie-agnostische, messbare Erfolgskriterien\n\n";

        if ($templates->has(DefinitionTemplate::TYPE_DOR)) {
            $prompt .= "## Definition of Ready (DoR)\nStelle sicher, dass die Spezifikation diese Kriterien erfüllt:\n\n";
            foreach ($templates->get(DefinitionTemplate::TYPE_DOR) as $tpl) {
                $prompt .= "### {$tpl->title}\n{$tpl->body}\n\n";
            }
        }

        if ($templates->has(DefinitionTemplate::TYPE_DOD)) {
            $prompt .= "## Definition of Done (DoD)\nBerücksichtige folgende Akzeptanzkriterien:\n\n";
            foreach ($templates->get(DefinitionTemplate::TYPE_DOD) as $tpl) {
                $prompt .= "### {$tpl->title}\n{$tpl->body}\n\n";
            }
        }

        return $prompt;
    }
}
