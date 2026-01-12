<?php

namespace App\Policies;

use App\Models\Planning;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class PlanningPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $this->userHasTenant($user);
    }

    public function view(User $user, Planning $planning): bool
    {
        return $this->sameTenant($user, $planning);
    }

    public function create(User $user): bool
    {
        return $this->userHasTenant($user);
    }

    public function update(User $user, Planning $planning): bool
    {
        return $this->sameTenant($user, $planning);
    }

    public function delete(User $user, Planning $planning): bool
    {
        return $this->sameTenant($user, $planning);
    }

    public function restore(User $user, Planning $planning): bool
    {
        return false;
    }

    public function forceDelete(User $user, Planning $planning): bool
    {
        return false;
    }

    private function sameTenant(User $user, Planning $planning): bool
    {
        $tenantId = $this->tenantId($user);

        return $tenantId !== null && (int) $planning->tenant_id === (int) $tenantId;
    }

    private function userHasTenant(User $user): bool
    {
        return $this->tenantId($user) !== null;
    }

    private function tenantId(User $user): ?int
    {
        return $user->current_tenant_id ?? $user->tenant_id ?? null;
    }
}
