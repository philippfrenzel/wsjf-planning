<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vote extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'feature_id',
        'planning_id',
        'type',
        'value',
        'voted_at',
    ];

    /**
     * Der Benutzer, der das Votum abgegeben hat.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Das zugehörige Feature.
     */
    public function feature()
    {
        return $this->belongsTo(Feature::class);
    }

    /**
     * Das zugehörige Planning.
     */
    public function planning()
    {
        return $this->belongsTo(Planning::class);
    }
}
