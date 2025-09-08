<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Concerns\BelongsToTenant;

class EstimationComponent extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'feature_id',
        'name',
        'description',
        'created_by',
        'status',
        'tenant_id',
    ];

    // Status-Konstanten
    public const STATUS_ACTIVE = 'active';
    public const STATUS_ARCHIVED = 'archived';

    /**
     * Das zugehörige Feature.
     */
    public function feature(): BelongsTo
    {
        return $this->belongsTo(Feature::class);
    }

    /**
     * Der Benutzer, der diese Komponente erstellt hat.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Die Schätzungen für diese Komponente.
     */
    public function estimations(): HasMany
    {
        return $this->hasMany(Estimation::class, 'component_id');
    }

    /**
     * Die aktuelle/neueste Schätzung für diese Komponente.
     */
    public function latestEstimation(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Estimation::class, 'component_id')
            ->latest('created_at');
    }

    /**
     * Scope für aktive Komponenten.
     */
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    /**
     * Scope für archivierte Komponenten.
     */
    public function scopeArchived($query)
    {
        return $query->where('status', self::STATUS_ARCHIVED);
    }

    /**
     * Archiviere diese Komponente.
     */
    public function archive()
    {
        $this->status = self::STATUS_ARCHIVED;
        $this->save();
        return $this;
    }

    /**
     * Setze diese Komponente wieder auf aktiv.
     */
    public function activate()
    {
        $this->status = self::STATUS_ACTIVE;
        $this->save();
        return $this;
    }
}
