<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Models\Concerns\BelongsToTenant;

class DefinitionTemplate extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'type',
        'title',
        'description',
        'body',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public const TYPE_DOR = 'dor';
    public const TYPE_DOD = 'dod';
    public const TYPE_UST = 'ust';

    public function projects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class, 'definition_template_project')
            ->withTimestamps();
    }
}
