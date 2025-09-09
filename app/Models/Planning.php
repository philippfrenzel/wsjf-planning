<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Concerns\BelongsToTenant;

class Planning extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'project_id',
        'title',
        'description',
        'planned_at',    // Wann geplant
        'executed_at',   // Wann durchgeführt
        'created_by',    // ID des Users, der das Planning erstellt hat
        'owner_id',      // ID des Hauptverantwortlichen
        'deputy_id',     // ID des Stellvertreters
        // weitere Felder nach Bedarf
        'tenant_id',
    ];

    /**
     * Ein Planning gehört zu genau einem Project.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Ein Planning gehört zu genau einem Ersteller (User).
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Ein Planning gehört zu einem Hauptverantwortlichen (User).
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Ein Planning gehört zu einem Stellvertreter (User).
     */
    public function deputy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deputy_id');
    }

    /**
     * Ein Planning kann mehrere Stakeholder (User) haben.
     */
    public function stakeholders(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'planning_stakeholder', 'planning_id', 'user_id')
            ->withTimestamps();
    }

    /**
     * Ein Planning kann mehrere Features haben.
     */
    public function features(): BelongsToMany
    {
        return $this->belongsToMany(Feature::class, 'feature_planning', 'planning_id', 'feature_id')
            ->withTimestamps();
    }

    /**
     * Ein Planning kann mehrere Commitments haben.
     */
    public function commitments(): HasMany
    {
        return $this->hasMany(Commitment::class);
    }
}
