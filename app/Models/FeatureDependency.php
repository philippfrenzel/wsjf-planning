<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToTenant;

class FeatureDependency extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'feature_id',
        'related_feature_id',
        'type',
        'tenant_id',
    ];

    public function feature()
    {
        return $this->belongsTo(Feature::class);
    }

    public function related()
    {
        return $this->belongsTo(Feature::class, 'related_feature_id');
    }
}

