<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EstimationComponent extends Model
{
    use HasFactory;

    protected $fillable = [
        'feature_id',
        'name',
        'description',
        'created_by',
    ];

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
    public function latestEstimation(): BelongsTo
    {
        return $this->hasOne(Estimation::class, 'component_id')
            ->latest('created_at');
    }
}
