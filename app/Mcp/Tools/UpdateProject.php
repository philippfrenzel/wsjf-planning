<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Models\Project;
use App\Support\StatusMapper;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;
use Spatie\ModelStates\State;

class UpdateProject extends Tool
{
    protected string $name = 'update-project';

    protected string $description = 'Update an existing project. Only provided fields are changed. Returns the updated project.';

    public function schema(JsonSchema $schema): array
    {
        return [
            'project_id' => $schema->integer()->description('The project ID to update')->required(),
            'project_number' => $schema->string()->description('New project number'),
            'name' => $schema->string()->description('New project name'),
            'description' => $schema->string()->description('New project description'),
            'jira_base_uri' => $schema->string()->description('New Jira base URI'),
            'start_date' => $schema->string()->description('New start date (YYYY-MM-DD)'),
            'project_leader_id' => $schema->integer()->description('New project leader user ID'),
            'deputy_leader_id' => $schema->integer()->description('New deputy leader user ID'),
            'new_status' => $schema->string()->description('Transition to a new status (e.g. in-realization, in-approval, closed)'),
        ];
    }

    public function handle(Request $request): Response
    {
        $data = $request->validate([
            'project_id' => 'required|integer',
            'project_number' => 'nullable|string|max:255',
            'name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'jira_base_uri' => 'nullable|string|url',
            'start_date' => 'nullable|date',
            'project_leader_id' => 'nullable|integer|exists:users,id',
            'deputy_leader_id' => 'nullable|integer|exists:users,id',
            'new_status' => 'nullable|string',
        ]);

        $project = Project::find($data['project_id']);

        if (! $project) {
            return Response::error("Project {$data['project_id']} not found.");
        }

        // Handle status transition
        $newStatus = $data['new_status'] ?? null;
        if ($newStatus) {
            $currentStatus = StatusMapper::details(StatusMapper::PROJECT, $project->status, 'in-planning');
            $currentValue = $currentStatus['value'] ?? 'in-planning';
            $allowedTransitions = StatusMapper::transitionTargets(StatusMapper::PROJECT, $currentValue);

            if (! in_array($newStatus, $allowedTransitions)) {
                return Response::error("Cannot transition from '{$currentValue}' to '{$newStatus}'. Allowed: " . implode(', ', $allowedTransitions));
            }

            $targetClass = StatusMapper::classFor(StatusMapper::PROJECT, $newStatus);
            if ($targetClass) {
                try {
                    if ($project->status instanceof State) {
                        $project->status->transitionTo($targetClass);
                    } else {
                        $project->status = $targetClass;
                    }
                    $project->save();
                } catch (\Throwable $e) {
                    return Response::error("Failed to transition status: {$e->getMessage()}");
                }
            }
        }

        $updateFields = collect($data)
            ->except('project_id', 'new_status')
            ->filter(fn ($v) => $v !== null)
            ->toArray();

        if (! empty($updateFields)) {
            // Validate uniqueness of project_number against other projects
            if (isset($updateFields['project_number'])) {
                $exists = Project::where('project_number', $updateFields['project_number'])
                    ->where('id', '!=', $project->id)
                    ->exists();
                if ($exists) {
                    return Response::error("Project number '{$updateFields['project_number']}' is already taken.");
                }
            }

            try {
                $project->update($updateFields);
            } catch (\Throwable $e) {
                return Response::error("Failed to update project: {$e->getMessage()}");
            }
        }

        if (empty($updateFields) && ! $newStatus) {
            return Response::error('No fields provided to update.');
        }

        cache()->increment('app.data.version', 1);

        $project->refresh();

        return Response::json([
            'id' => $project->id,
            'project_number' => $project->project_number,
            'name' => $project->name,
            'status' => $project->status,
            'start_date' => $project->start_date,
            'project_leader_id' => $project->project_leader_id,
            'deputy_leader_id' => $project->deputy_leader_id,
            'message' => "Project '{$project->name}' updated successfully.",
        ]);
    }
}
