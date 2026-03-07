<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\SoftDeletesWithUser;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FeaturePlan extends Model
{
    use HasFactory;
    use BelongsToTenant;
    use SoftDeletesWithUser;

    public const STATUS_OPEN = 'open';
    public const STATUS_IMPLEMENTED = 'implemented';
    public const STATUS_OBSOLETE = 'obsolete';

    protected $fillable = [
        'feature_id',
        'title',
        'description',
        'status',
        'sort_order',
        'estimation_component_id',
        'created_by',
        'tenant_id',
    ];

    public static function statuses(): array
    {
        return [
            self::STATUS_OPEN => 'Offen',
            self::STATUS_IMPLEMENTED => 'Implementiert',
            self::STATUS_OBSOLETE => 'Obsolet',
        ];
    }

    public function feature(): BelongsTo
    {
        return $this->belongsTo(Feature::class);
    }

    public function estimationComponent(): BelongsTo
    {
        return $this->belongsTo(EstimationComponent::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
