<?php

namespace App\Observers;

use App\Models\Feature;
use App\Models\FeatureStateHistory;
use Carbon\CarbonInterface;

class FeatureObserver
{
    public function created(Feature $feature): void
    {
        $status = $this->normalizeStatus($feature->status);

        FeatureStateHistory::create([
            'feature_id' => $feature->id,
            'tenant_id' => $feature->tenant_id,
            'from_status' => null,
            'to_status' => $status ?? 'in-planning',
            'changed_at' => $this->resolveTimestamp($feature->created_at),
        ]);
    }

    public function updated(Feature $feature): void
    {
        if (! $feature->wasChanged('status')) {
            return;
        }

        FeatureStateHistory::create([
            'feature_id' => $feature->id,
            'tenant_id' => $feature->tenant_id,
            'from_status' => $this->normalizeStatus($feature->getOriginal('status')),
            'to_status' => $this->normalizeStatus($feature->status) ?? 'in-planning',
            'changed_at' => $this->resolveTimestamp($feature->updated_at),
        ]);
    }

    private function normalizeStatus(mixed $status): ?string
    {
        if (is_object($status) && method_exists($status, 'getValue')) {
            return $status->getValue();
        }

        if (is_string($status)) {
            return $status;
        }

        return null;
    }

    private function resolveTimestamp(mixed $timestamp): CarbonInterface
    {
        if ($timestamp instanceof CarbonInterface) {
            return $timestamp;
        }

        return now();
    }
}
