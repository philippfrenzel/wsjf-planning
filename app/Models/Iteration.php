<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\SoftDeletesWithUser;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Iteration extends Model
{
    use HasFactory, BelongsToTenant, SoftDeletesWithUser;

    protected $fillable = [
        'planning_id',
        'tenant_id',
        'number',
        'name',
        'start_date',
        'end_date',
        'is_ip',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_ip' => 'boolean',
        'number' => 'integer',
    ];

    public function planning(): BelongsTo
    {
        return $this->belongsTo(Planning::class);
    }
}
