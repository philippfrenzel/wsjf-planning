<?php

namespace App\Services;

use App\Models\Feature;
use App\Support\StatusMapper;
use Illuminate\Support\Facades\Log;
use Spatie\ModelStates\State;

class FeatureService
{
    public function updateStatus(Feature $feature, string $newStatus): void
    {
        $current = $feature->status instanceof State ? $feature->status->getValue() : (string) $feature->status;

        if ($newStatus === $current) {
            return;
        }

        $targetClass = StatusMapper::classFor(StatusMapper::FEATURE, $newStatus);

        if (!$targetClass) {
            throw new \InvalidArgumentException('Ungültiger Status');
        }

        if ($feature->status instanceof State) {
            $feature->status->transitionTo($targetClass);
        } else {
            $feature->status = $targetClass;
        }

        $feature->save();
    }

    public function buildLineage(Feature $feature, array &$visited = []): array
    {
        if (in_array($feature->id, $visited, true)) {
            return [
                'id' => $feature->id,
                'jira_key' => $feature->jira_key,
                'name' => $feature->name,
                'dependencies' => [],
            ];
        }

        $visited[] = $feature->id;

        return [
            'id' => $feature->id,
            'jira_key' => $feature->jira_key,
            'name' => $feature->name,
            'dependencies' => $feature->dependencies
                ->map(function ($dep) use (&$visited) {
                    return $dep->related ? $this->buildLineage($dep->related, $visited) : null;
                })
                ->filter()
                ->values()
                ->all(),
        ];
    }
}