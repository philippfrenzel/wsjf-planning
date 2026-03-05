<?php

namespace App\Policies;

use App\Models\Team;
use App\Models\User;

class TeamPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->userHasTenant($user);
    }

    public function view(User $user, Team $team): bool
    {
        return $this->sameTenant($user, $team);
    }

    public function create(User $user): bool
    {
        $tenantId = $this->tenantId($user);

        return $tenantId && ($user->hasRoleInTenant('Admin', $tenantId)
            || $user->hasRoleInTenant('Planner', $tenantId));
    }

    public function update(User $user, Team $team): bool
    {
        $tenantId = $this->tenantId($user);

        return $this->sameTenant($user, $team)
            && ($user->hasRoleInTenant('Admin', $tenantId)
                || $user->hasRoleInTenant('Planner', $tenantId));
    }

    public function delete(User $user, Team $team): bool
    {
        return $this->update($user, $team);
    }

    public function restore(User $user, Team $team): bool
    {
        return false;
    }

    public function forceDelete(User $user, Team $team): bool
    {
        return false;
    }

    private function sameTenant(User $user, Team $team): bool
    {
        return $this->userHasTenant($user)
            && $this->tenantId($user) === (int) $team->tenant_id;
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
