<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Estimation extends Model
{
    use HasFactory;

    protected $fillable = [
        'component_id',
        'best_case',
        'most_likely',
        'worst_case',
        'unit',
        'created_by',
        'notes',
    ];

    /**
     * Die geschätzte Feature-Komponente.
     */
    public function component(): BelongsTo
    {
        return $this->belongsTo(EstimationComponent::class, 'component_id');
    }

    /**
     * Der Benutzer, der diese Schätzung erstellt hat.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Der Änderungsverlauf dieser Schätzung.
     */
    public function history(): HasMany
    {
        return $this->hasMany(EstimationHistory::class);
    }

    /**
     * Berechnet den gewichteten Durchschnittswert (PERT-Methode).
     */
    public function getWeightedEstimateAttribute(): float
    {
        return ($this->best_case + 4 * $this->most_likely + $this->worst_case) / 6;
    }

    /**
     * Berechnet die Standardabweichung.
     */
    public function getStandardDeviationAttribute(): float
    {
        return ($this->worst_case - $this->best_case) / 6;
    }
}
