<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\SoftDeletesWithUser;

class EstimationHistory extends Model
{
    use HasFactory, BelongsToTenant, SoftDeletesWithUser;

    public $timestamps = false;

    protected $fillable = [
        'estimation_id',
        'field_name',
        'old_value',
        'new_value',
        'changed_by',
        'changed_at',
        'tenant_id',
    ];

    protected $casts = [
        'changed_at' => 'datetime',
    ];

    /**
     * Die zugehörige Schätzung.
     */
    public function estimation(): BelongsTo
    {
        return $this->belongsTo(Estimation::class);
    }

    /**
     * Der Benutzer, der die Änderung durchgeführt hat.
     */
    public function changer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
