<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Vote;
use Illuminate\Auth\Access\HandlesAuthorization;

class VotePolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $this->userHasTenant($user);
    }

    public function view(User $user, Vote $vote): bool
    {
        return $this->sameTenant($user, $vote);
    }

    public function create(User $user): bool
    {
        return $this->userHasTenant($user);
    }

    public function update(User $user, Vote $vote): bool
    {
        return $this->sameTenant($user, $vote);
    }

    public function delete(User $user, Vote $vote): bool
    {
        return $this->sameTenant($user, $vote);
    }

    public function restore(User $user, Vote $vote): bool
    {
        return false;
    }

    public function forceDelete(User $user, Vote $vote): bool
    {
        return false;
    }

    private function sameTenant(User $user, Vote $vote): bool
    {
        $tenantId = $this->tenantId($user);

        return $tenantId !== null && (int) $vote->tenant_id === (int) $tenantId;
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
