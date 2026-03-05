<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;
use App\Models\Concerns\SoftDeletesWithUser;

class TenantInvitation extends Model
{
    use HasFactory, SoftDeletesWithUser;

    protected $fillable = [
        'tenant_id',
        'email',
        'inviter_id',
        'token',
        'expires_at',
        'accepted_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'accepted_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'inviter_id');
    }

    public function acceptFor(User $user): void
    {
        DB::transaction(function () use ($user) {
            // Atomic accept — prevents race condition on double-click
            $updated = DB::table('tenant_invitations')
                ->where('id', $this->id)
                ->whereNull('accepted_at')
                ->update(['accepted_at' => now()]);

            if ($updated === 0) {
                return; // Already accepted by a concurrent request — safe to exit
            }

            $user->tenants()->syncWithoutDetaching([$this->tenant_id]);

            // Assign Voter role — but never downgrade the tenant owner
            $tenant = Tenant::find($this->tenant_id);
            $role = ($tenant && $tenant->owner_user_id === $user->id) ? 'Admin' : 'Voter';
            DB::table('tenant_user')
                ->where('tenant_id', $this->tenant_id)
                ->where('user_id', $user->id)
                ->whereNull('role')
                ->update(['role' => $role]);

            $user->forceFill(['current_tenant_id' => $this->tenant_id])->save();
        });
    }
}

