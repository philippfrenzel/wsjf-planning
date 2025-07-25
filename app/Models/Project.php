<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\ModelStates\HasStates;
use App\States\Project\ProjectState;
use App\States\Project\InPlanning;
use App\States\Project\InRealization;
use App\States\Project\InApproval;
use App\States\Project\Closed;

class Project extends Model
{
    use HasFactory;
    use HasStates;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'project_number',
        'name',
        'description',
        'jira_base_uri',
        'start_date',
        'project_leader_id',
        'deputy_leader_id',
        'created_by',
        'status',
    ];

    /**
     * Get the project leader (User).
     *
     * @return BelongsTo
     */
    public function projectLeader()
    {
        return $this->belongsTo(User::class, 'project_leader_id');
    }

    /**
     * Get the deputy project leader (User).
     *
     * @return BelongsTo
     */
    public function deputyLeader()
    {
        return $this->belongsTo(User::class, 'deputy_leader_id');
    }

    /**
     * Der Benutzer, der das Projekt erstellt hat.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Konfiguration für Status
     */
    protected function registerStates(): void
    {
        $this->addState('status', ProjectState::class)
            ->default(InPlanning::class)
            ->allowTransition(InPlanning::class, InRealization::class)
            ->allowTransition(InRealization::class, InApproval::class)
            ->allowTransition(InApproval::class, Closed::class)
            ->castUsing(static function ($value) {
                // Beim Auslesen aus der Datenbank konvertieren wir den Status-String in ein Objekt
                if (is_string($value)) {
                    $statusMapping = [
                        'in-planning' => InPlanning::class,
                        'in-realization' => InRealization::class,
                        'in-approval' => InApproval::class,
                        'closed' => Closed::class
                    ];

                    $statusClass = $statusMapping[$value] ?? InPlanning::class;
                    return new $statusClass();
                }

                return $value;
            });
    }

    protected static function booted()
    {
        static::saving(function ($project) {
            if (empty($project->created_by)) {
                throw new \Exception('Das Feld "created_by" darf nicht leer sein.');
            }
        });
    }
}
