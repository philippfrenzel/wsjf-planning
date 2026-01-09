<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
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
use App\Models\FeatureDependency;
use App\Models\FeatureStateHistory;
use App\Support\StatusMapper;

class Feature extends Model
{
    use HasFactory;
    use HasStates;
    use BelongsToTenant;

    protected $fillable = [
        'jira_key',
        'name',
        'description',
        'requester_id',
        'project_id',
        'created_at',
        'tenant_id',
    ];

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
     * Die Common Votes (nur für ein bestimmtes Planning und User)
     */
    public function commonvotes()
    {
        $planning = Planning::find(request('planning_id'));
        return $this->hasMany(Vote::class)
            ->where(function ($query) use ($planning) {
                if (request()->has('planning_id')) {
                    $query->where('planning_id', request('planning_id'));
                }
                if (request()->has('user_id')) {
                    $query->where('user_id', $planning->created_by);
                }
            });
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
}
