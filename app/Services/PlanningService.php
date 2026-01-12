<?php

namespace App\Services;

use App\Models\Planning;

class PlanningService
{
    public function create(array $data, array $stakeholderIds = [], array $featureIds = []): Planning
    {
        $planning = Planning::create($data);

        $this->syncStakeholders($planning, $stakeholderIds);
        $this->syncFeatures($planning, $featureIds);

        return $planning;
    }

    public function update(Planning $planning, array $data, array $stakeholderIds = [], array $featureIds = []): Planning
    {
        $planning->update($data);

        $this->syncStakeholders($planning, $stakeholderIds);
        $this->syncFeatures($planning, $featureIds);

        return $planning;
    }

    private function syncStakeholders(Planning $planning, array $stakeholderIds): void
    {
        $planning->stakeholders()->sync($stakeholderIds);
    }

    private function syncFeatures(Planning $planning, array $featureIds): void
    {
        $planning->features()->sync($featureIds);
    }
}