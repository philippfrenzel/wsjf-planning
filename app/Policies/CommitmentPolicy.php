<?php

namespace App\Policies;

use App\Models\Commitment;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class CommitmentPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $this->userHasTenant($user);
    }

    public function view(User $user, Commitment $commitment): bool
    {
        return $this->sameTenant($user, $commitment);
    }

    public function create(User $user): bool
    {
        return $this->userHasTenant($user);
    }

    public function update(User $user, Commitment $commitment): bool
    {
        return $this->sameTenant($user, $commitment);
    }

    public function delete(User $user, Commitment $commitment): bool
    {
        return $this->sameTenant($user, $commitment);
    }

    public function restore(User $user, Commitment $commitment): bool
    {
        return false;
    }

    public function forceDelete(User $user, Commitment $commitment): bool
    {
        return false;
    }

    private function sameTenant(User $user, Commitment $commitment): bool
    {
        $tenantId = $this->tenantId($user);

        return $tenantId !== null && (int) $commitment->tenant_id === (int) $tenantId;
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
