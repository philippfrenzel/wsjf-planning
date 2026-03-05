<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
// Do not add Tenant global scope here to avoid auth recursion
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany as EloquentBelongsToMany;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Models\Concerns\SoftDeletesWithUser;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, SoftDeletesWithUser;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'google_id',
        'password',
        'tenant_id',
        'current_tenant_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    protected $appends = [
        'avatar',
    ];

    public function getAvatarAttribute(): ?string
    {
        if (!$this->avatar_path) {
            return null;
        }
        // If already a full URL, return as is
        if (str_starts_with($this->avatar_path, 'http://') || str_starts_with($this->avatar_path, 'https://')) {
            return $this->avatar_path;
        }
        return Storage::disk('public')->url($this->avatar_path);
    }

    /**
     * Define the many-to-many relationship with the Role model.
     *
     * @return BelongsToMany
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class);
    }

    public function teams(): BelongsToMany
    {
        return $this->belongsToMany(Team::class, 'team_user')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function skills(): BelongsToMany
    {
        return $this->belongsToMany(Skill::class, 'skill_user')
            ->withPivot('level')
            ->withTimestamps();
    }

    /**
     * Tenants, in denen der User Mitglied ist.
     */
    public function tenants(): EloquentBelongsToMany
    {
        return $this->belongsToMany(Tenant::class, 'tenant_user')->withTimestamps();
    }

    /**
     * Aktueller Tenant des Users (für Kontext/Scope)
     */
    public function currentTenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'current_tenant_id');
    }

    public function isSuperAdmin(): bool
    {
        // Platform owner: guaranteed SuperAdmin regardless of DB role assignment
        if ($this->email === 'philipp.frenzel@swica.ch') {
            return true;
        }

        return once(fn() => $this->roles()->where('name', 'SuperAdmin')->exists());
    }

    public function hasRoleInTenant(string $role, ?int $tenantId): bool
    {
        if (!$tenantId) {
            return false;
        }
        return DB::table('tenant_user')
            ->where('tenant_id', $tenantId)
            ->where('user_id', $this->id)
            ->where('role', $role)
            ->exists();
    }

    public function currentTenantRole(): ?string
    {
        $tenantId = $this->current_tenant_id;
        if (!$tenantId) {
            return null;
        }

        $role = DB::table('tenant_user')
            ->where('tenant_id', $tenantId)
            ->where('user_id', $this->id)
            ->value('role');

        // Self-heal: owner must always be Admin
        if ($role !== 'Admin') {
            $isOwner = DB::table('tenants')
                ->where('id', $tenantId)
                ->where('owner_user_id', $this->id)
                ->exists();

            if ($isOwner) {
                DB::table('tenant_user')
                    ->where('tenant_id', $tenantId)
                    ->where('user_id', $this->id)
                    ->update(['role' => 'Admin']);
                return 'Admin';
            }
        }

        return $role;
    }
}
