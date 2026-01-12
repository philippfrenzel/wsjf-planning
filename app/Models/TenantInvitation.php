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
            $user->tenants()->syncWithoutDetaching([$this->tenant_id]);

            $this->forceFill([
                'accepted_at' => now(),
            ])->save();

            $user->forceFill([
                'current_tenant_id' => $this->tenant_id,
            ])->save();
        });
    }
}

