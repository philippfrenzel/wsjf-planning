<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\SoftDeletesWithUser;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FeatureSpecification extends Model
{
    use HasFactory;
    use BelongsToTenant;
    use SoftDeletesWithUser;

    protected $fillable = [
        'feature_id',
        'content',
        'created_by',
        'tenant_id',
    ];

    public function feature(): BelongsTo
    {
        return $this->belongsTo(Feature::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
