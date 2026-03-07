<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\SoftDeletesWithUser;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Auth;

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

    public function versions(): HasMany
    {
        return $this->hasMany(FeatureSpecificationVersion::class, 'specification_id')->orderByDesc('version_number');
    }

    public function currentVersionNumber(): int
    {
        return $this->versions()->max('version_number') ?? 0;
    }

    /**
     * Snapshot current content as a new version before update.
     */
    public function createVersionSnapshot(?string $changeSummary = null): FeatureSpecificationVersion
    {
        $nextVersion = $this->currentVersionNumber() + 1;

        return FeatureSpecificationVersion::create([
            'specification_id' => $this->id,
            'version_number' => $nextVersion,
            'content' => $this->content,
            'change_summary' => $changeSummary,
            'created_by' => Auth::id(),
        ]);
    }
}
