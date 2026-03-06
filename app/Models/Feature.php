<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\ModelStates\HasStates;
use App\States\Feature\FeatureState;
use App\States\Feature\InPlanning;
use App\States\Feature\Approved;
use App\States\Feature\Rejected;
use App\States\Feature\Implemented;
use App\States\Feature\Obsolete;
use App\States\Feature\Archived;
use App\States\Feature\Deleted;
use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\SoftDeletesWithUser;
use App\Models\Concerns\HasComments;
use App\Models\FeatureDependency;
use App\Models\FeatureStateHistory;
use App\Support\StatusMapper;
use Illuminate\Support\Facades\DB;

class Feature extends Model
{
    use HasFactory;
    use HasStates;
    use BelongsToTenant;
    use SoftDeletesWithUser;
    use HasComments;

    protected static function booted(): void
    {
        static::creating(function (Feature $feature) {
            if (empty($feature->jira_key) && $feature->project_id) {
                $feature->jira_key = static::generateNextJiraKey($feature->project_id, $feature->tenant_id);
            }
        });
    }

    /**
     * Generate the next sequential jira_key for a project (e.g. WSJF-4).
     */
    public static function generateNextJiraKey(int $projectId, ?int $tenantId = null): string
    {
        $project = Project::find($projectId);
        $prefix = $project?->project_number ?? 'FEAT';

        $maxNum = (int) DB::table('features')
            ->where('project_id', $projectId)
            ->when($tenantId, fn ($q) => $q->where('tenant_id', $tenantId))
            ->whereRaw("jira_key LIKE ?", ["{$prefix}-%"])
            ->selectRaw("MAX(CAST(SUBSTR(jira_key, ?) AS INTEGER)) as max_num", [strlen($prefix) + 2])
            ->value('max_num');

        return "{$prefix}-" . ($maxNum + 1);
    }

    protected $fillable = [
        'jira_key',
        'name',
        'type',
        'description',
        'requester_id',
        'project_id',
        'team_id',
        'iteration_id',
        'created_at',
        'tenant_id',
    ];

    public const TYPE_BUSINESS = 'business';
    public const TYPE_ENABLER = 'enabler';
    public const TYPE_TECH_DEBT = 'tech_debt';
    public const TYPE_NFR = 'nfr';

    public static function types(): array
    {
        return [
            self::TYPE_BUSINESS => 'Business Feature',
            self::TYPE_ENABLER => 'Enabler',
            self::TYPE_TECH_DEBT => 'Tech Debt',
            self::TYPE_NFR => 'NFR',
        ];
    }

    /**
     * Die Attribute, die an das Array-Format angehängt werden sollen.
     *
     * @var array<int, string>
     */
    protected $appends = ['status_details'];

    /**
     * Konfiguration für Status
     */
    protected function registerStates(): void
    {
        $this->addState('status', FeatureState::class)
            ->default(InPlanning::class)
            ->allowTransition(InPlanning::class, Approved::class)
            ->allowTransition(InPlanning::class, Rejected::class)
            ->allowTransition(InPlanning::class, Obsolete::class)
            ->allowTransition(Approved::class, Implemented::class)
            ->allowTransition(Approved::class, Obsolete::class)
            ->allowTransition(Approved::class, Archived::class)
            ->allowTransition(Implemented::class, Archived::class)
            ->allowTransition(Rejected::class, Obsolete::class)
            ->allowTransition(Rejected::class, Archived::class)
            ->allowTransition(Obsolete::class, Archived::class)
            ->allowTransition(Archived::class, Deleted::class);
    }

    /**
     * Der anfordernde User (optional).
     */
    public function requester()
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    /**
     * Das zugehörige Projekt (Pflichtfeld).
     */
    public function project()
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

    /**
     * Die Schätzungskomponenten dieses Features.
     */
    public function estimationComponents(): HasMany
    {
        return $this->hasMany(EstimationComponent::class);
    }

    /**
     * Die Stimmen für dieses Feature.
     */
    public function votes()
    {
        return $this->hasMany(Vote::class);
    }

    public function stateHistories(): HasMany
    {
        return $this->hasMany(FeatureStateHistory::class)->orderBy('changed_at');
    }

    /**
     * Gibt die Status-Details des Features zurück.
     *
     * @return array
     */
    public function getStatusDetailsAttribute()
    {
        return StatusMapper::details(StatusMapper::FEATURE, $this->status, 'in-planning');
    }

    /**
     * Die Common Votes für ein bestimmtes Planning und einen bestimmten Creator.
     *
     * Scoped relation – verwende commonVotesForPlanning() statt commonvotes() direkt.
     */
    public function commonVotesForPlanning(int $planningId, int $creatorId): HasMany
    {
        return $this->hasMany(Vote::class)
            ->where('planning_id', $planningId)
            ->where('user_id', $creatorId);
    }

    /**
     * Die Commitments für dieses Feature.
     */
    public function commitments(): HasMany
    {
        return $this->hasMany(Commitment::class);
    }

    /**
     * Ausgehende Abhängigkeiten dieses Features.
     */
    public function dependencies()
    {
        return $this->hasMany(FeatureDependency::class, 'feature_id')->with('related:id,jira_key,name,project_id');
    }

    /**
     * Eingehende Abhängigkeiten (andere Features, die von diesem abhängen/bezogen sind).
     */
    public function dependents()
    {
        return $this->hasMany(FeatureDependency::class, 'related_feature_id')->with('feature:id,jira_key,name,project_id');
    }

    public function team()
    {
        return $this->belongsTo(Team::class);
    }

    public function iteration()
    {
        return $this->belongsTo(Iteration::class);
    }

    public function requiredSkills(): BelongsToMany
    {
        return $this->belongsToMany(Skill::class, 'feature_skill')
            ->withPivot('level')
            ->withTimestamps();
    }

    /**
     * Scope to filter features by closed statuses and transition date.
     * Hides features with status 'implemented', 'rejected', or 'obsolete' 
     * that have been in that status for more than the specified number of days.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int|null $days Number of days threshold (null = show all)
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeFilterClosedByDays($query, ?int $days)
    {
        // If days is null, show all features (no filtering)
        if ($days === null) {
            return $query;
        }

        // Define the statuses that should be filtered (both string and class names)
        $closedStatuses = [
            'implemented',
            'rejected',
            'obsolete',
            'App\\States\\Feature\\Implemented',
            'App\\States\\Feature\\Rejected',
            'App\\States\\Feature\\Obsolete',
        ];

        return $query->where(function ($q) use ($days, $closedStatuses) {
            // Include features that are NOT in closed statuses
            $q->whereNotIn('status', $closedStatuses)
              // OR include features in closed statuses that were changed within the threshold
              // We need to check the LATEST transition to a closed status
              ->orWhereIn('features.id', function ($subQuery) use ($days, $closedStatuses) {
                  $subQuery->select('fsh.feature_id')
                      ->from('feature_state_histories as fsh')
                      ->whereIn('fsh.to_status', $closedStatuses)
                      ->whereRaw('fsh.changed_at = (
                          SELECT MAX(changed_at) 
                          FROM feature_state_histories 
                          WHERE feature_id = fsh.feature_id 
                          AND (to_status IN (?, ?, ?, ?, ?, ?))
                      )', $closedStatuses)
                      ->where('fsh.changed_at', '>=', now()->subDays($days))
                      ->groupBy('fsh.feature_id');
              });
        });
    }
}
