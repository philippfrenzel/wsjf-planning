<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\ModelStates\HasStates;
use App\States\Feature\FeatureState;
use App\States\Feature\InPlanning;
use App\States\Feature\Approved;

class Feature extends Model
{
    use HasFactory;
    use HasStates;

    protected $fillable = [
        'jira_key',
        'name',
        'description',
        'requester_id',
        'project_id',
        'created_at',
    ];

    /**
     * Konfiguration für Status
     */
    protected function registerStates(): void
    {
        $this->addState('status', FeatureState::class)
            ->default(InPlanning::class)
            ->allowTransition(InPlanning::class, Approved::class);
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

    /**
     * Die Common Votes (nur für ein bestimmtes Planning und User)
     */
    public function commonvotes()
    {
        return $this->hasMany(Vote::class)
            ->where(function ($query) {
                if (request()->has('planning_id')) {
                    $query->where('planning_id', request('planning_id'));
                }
                if (request()->has('user_id')) {
                    $query->where('user_id', request('user_id'));
                }
            });
    }
}
