<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\SoftDeletesWithUser;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class FeaturePlan extends Model
{
    use HasFactory;
    use BelongsToTenant;
    use SoftDeletesWithUser;

    public const STATUS_OPEN = 'open';
    public const STATUS_IMPLEMENTED = 'implemented';
    public const STATUS_OBSOLETE = 'obsolete';

    public const PRIORITY_P1 = 'P1';
    public const PRIORITY_P2 = 'P2';
    public const PRIORITY_P3 = 'P3';

    protected $fillable = [
        'feature_id',
        'title',
        'description',
        'status',
        'priority',
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

    public static function priorities(): array
    {
        return [
            self::PRIORITY_P1 => 'P1 – Must Have',
            self::PRIORITY_P2 => 'P2 – Should Have',
            self::PRIORITY_P3 => 'P3 – Nice to Have',
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

    /** Plans this plan depends on (must be done before this one) */
    public function dependencies(): BelongsToMany
    {
        return $this->belongsToMany(
            self::class,
            'feature_plan_dependencies',
            'plan_id',
            'depends_on_plan_id'
        );
    }

    /** Plans that depend on this plan */
    public function dependents(): BelongsToMany
    {
        return $this->belongsToMany(
            self::class,
            'feature_plan_dependencies',
            'depends_on_plan_id',
            'plan_id'
        );
    }

    /** Check if all dependencies are done (implemented) or there are none */
    public function isActionable(): bool
    {
        if ($this->status !== self::STATUS_OPEN) {
            return false;
        }

        return !$this->dependencies()
            ->where('status', '!=', self::STATUS_IMPLEMENTED)
            ->exists();
    }
}
