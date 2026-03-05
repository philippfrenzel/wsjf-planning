<?php

namespace App\Policies;

use App\Models\PiObjective;
use App\Models\User;

class PiObjectivePolicy
{
    public function viewAny(User $user): bool
    {
        return $this->userHasTenant($user);
    }

    public function view(User $user, PiObjective $piObjective): bool
    {
        return $this->sameTenant($user, $piObjective);
    }

    public function create(User $user): bool
    {
        $tenantId = $this->tenantId($user);

        return $tenantId && $user->hasRoleInTenant('Admin', $tenantId)
            || $user->hasRoleInTenant('Planner', $tenantId);
    }

    public function update(User $user, PiObjective $piObjective): bool
    {
        $tenantId = $this->tenantId($user);

        return $this->sameTenant($user, $piObjective)
            && ($user->hasRoleInTenant('Admin', $tenantId)
                || $user->hasRoleInTenant('Planner', $tenantId));
    }

    public function delete(User $user, PiObjective $piObjective): bool
    {
        return $this->update($user, $piObjective);
    }

    public function restore(User $user, PiObjective $piObjective): bool
    {
        return false;
    }

    public function forceDelete(User $user, PiObjective $piObjective): bool
    {
        return false;
    }

    private function sameTenant(User $user, PiObjective $piObjective): bool
    {
        return $this->userHasTenant($user)
            && $this->tenantId($user) === (int) $piObjective->tenant_id;
    }

    private function userHasTenant(User $user): bool
    {
        return (bool) $this->tenantId($user);
    }

    private function tenantId(User $user): ?int
    {
        return $user->current_tenant_id ?? $user->tenant_id ?? null;
    }
}
