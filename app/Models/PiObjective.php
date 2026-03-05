<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\SoftDeletesWithUser;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PiObjective extends Model
{
    use HasFactory, BelongsToTenant, SoftDeletesWithUser;

    protected $fillable = [
        'planning_id',
        'user_id',
        'tenant_id',
        'title',
        'description',
        'business_value',
        'is_committed',
        'status',
    ];

    protected $casts = [
        'business_value' => 'integer',
        'is_committed' => 'boolean',
    ];

    public const STATUS_DRAFT = 'draft';
    public const STATUS_COMMITTED = 'committed';
    public const STATUS_ACHIEVED = 'achieved';
    public const STATUS_NOT_ACHIEVED = 'not_achieved';

    public static function statuses(): array
    {
        return [
            self::STATUS_DRAFT => 'Entwurf',
            self::STATUS_COMMITTED => 'Committed',
            self::STATUS_ACHIEVED => 'Erreicht',
            self::STATUS_NOT_ACHIEVED => 'Nicht erreicht',
        ];
    }

    public function planning(): BelongsTo
    {
        return $this->belongsTo(Planning::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getStatusLabelAttribute(): string
    {
        return self::statuses()[$this->status] ?? $this->status;
    }
}
