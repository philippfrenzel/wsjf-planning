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
        'notes',
        'created_by'
    ];

    /**
     * Boot-Methode des Models
     * Hier registrieren wir die Events
     */
    protected static function boot()
    {
        parent::boot();

        // Vor dem Speichern (sowohl create als auch update)
        static::saving(function ($estimation) {
            // Überprüfe, ob die notwendigen Felder gesetzt sind
            if (isset($estimation->best_case) && isset($estimation->most_likely) && isset($estimation->worst_case)) {
                // Berechne den gewichteten Durchschnitt
                $estimation->weighted_case = (
                    $estimation->best_case +
                    $estimation->most_likely +
                    $estimation->worst_case
                ) / 3;

                // Optional: Auf 2 Nachkommastellen runden
                $estimation->weighted_case = round($estimation->weighted_case, 2);
            }
        });
    }

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
        return ($this->best_case * $this->most_likely + $this->worst_case) / 3;
    }

    /**
     * Berechnet die Standardabweichung.
     */
    public function getStandardDeviationAttribute(): float
    {
        return ($this->worst_case - $this->best_case) / 2;
    }
}
