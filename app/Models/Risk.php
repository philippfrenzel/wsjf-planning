<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\SoftDeletesWithUser;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Risk extends Model
{
    use HasFactory, BelongsToTenant, SoftDeletesWithUser;

    protected $fillable = [
        'planning_id',
        'tenant_id',
        'owner_id',
        'title',
        'description',
        'roam_status',
        'category',
        'impact',
    ];

    public const ROAM_IDENTIFIED = 'identified';
    public const ROAM_RESOLVED = 'resolved';
    public const ROAM_OWNED = 'owned';
    public const ROAM_ACCEPTED = 'accepted';
    public const ROAM_MITIGATED = 'mitigated';

    public static function roamStatuses(): array
    {
        return [
            self::ROAM_IDENTIFIED => 'Identifiziert',
            self::ROAM_RESOLVED => 'Resolved',
            self::ROAM_OWNED => 'Owned',
            self::ROAM_ACCEPTED => 'Accepted',
            self::ROAM_MITIGATED => 'Mitigated',
        ];
    }

    public static function categories(): array
    {
        return [
            'technical' => 'Technisch',
            'business' => 'Business',
            'schedule' => 'Zeitplan',
            'resource' => 'Ressourcen',
            'dependency' => 'Abhängigkeit',
        ];
    }

    public static function impacts(): array
    {
        return [
            'low' => 'Niedrig',
            'medium' => 'Mittel',
            'high' => 'Hoch',
        ];
    }

    public function planning(): BelongsTo
    {
        return $this->belongsTo(Planning::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }
}
