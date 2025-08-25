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
            ->allowTransition(Archived::class, Deleted::class)
            ->castUsing(static function ($value) {
                // Beim Auslesen aus der Datenbank konvertieren wir den Status-String in ein Objekt
                if (is_string($value)) {
                    $statusMapping = [
                        'in-planning' => InPlanning::class,
                        'approved' => Approved::class,
                        'rejected' => Rejected::class,
                        'implemented' => Implemented::class,
                        'obsolete' => Obsolete::class,
                        'archived' => Archived::class,
                        'deleted' => Deleted::class
                    ];

                    $statusClass = $statusMapping[$value] ?? InPlanning::class;
                    return new $statusClass();
                }

                return $value;
            });
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
}
