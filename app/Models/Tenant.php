<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Models\Concerns\SoftDeletesWithUser;

class Tenant extends Model
{
    use HasFactory, SoftDeletesWithUser;

    protected $fillable = [
        'name',
        'owner_user_id',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'tenant_user')
            ->withTimestamps();
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(TenantInvitation::class);
    }
}
