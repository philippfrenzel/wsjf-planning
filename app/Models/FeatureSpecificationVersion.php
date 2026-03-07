<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FeatureSpecificationVersion extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'specification_id',
        'version_number',
        'content',
        'change_summary',
        'created_by',
        'tenant_id',
    ];

    public function specification()
    {
        return $this->belongsTo(FeatureSpecification::class, 'specification_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
