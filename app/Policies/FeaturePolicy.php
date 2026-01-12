<?php

namespace App\Policies;

use App\Models\Feature;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class FeaturePolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $this->userHasTenant($user);
    }

    public function view(User $user, Feature $feature): bool
    {
        return $this->sameTenant($user, $feature);
    }

    public function create(User $user): bool
    {
        return $this->userHasTenant($user);
    }

    public function update(User $user, Feature $feature): bool
    {
        return $this->sameTenant($user, $feature);
    }

    public function delete(User $user, Feature $feature): bool
    {
        return $this->sameTenant($user, $feature);
    }

    public function restore(User $user, Feature $feature): bool
    {
        return false;
    }

    public function forceDelete(User $user, Feature $feature): bool
    {
        return false;
    }

    private function sameTenant(User $user, Feature $feature): bool
    {
        $tenantId = $this->tenantId($user);

        return $tenantId !== null && (int) $feature->tenant_id === (int) $tenantId;
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
