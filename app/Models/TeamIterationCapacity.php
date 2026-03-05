<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToTenant;

class TeamIterationCapacity extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'planning_id',
        'team_id',
        'iteration_id',
        'available_points',
        'planned_points',
        'availability_percentage',
        'notes',
    ];

    protected $casts = [
        'availability_percentage' => 'decimal:2',
    ];

    public function planning()
    {
        return $this->belongsTo(Planning::class);
    }

    public function team()
    {
        return $this->belongsTo(Team::class);
    }

    public function iteration()
    {
        return $this->belongsTo(Iteration::class);
    }

    public function loadPercentage(): float
    {
        if (!$this->available_points || $this->available_points === 0) {
            return 0;
        }
        return ($this->planned_points / $this->available_points) * 100;
    }
}
