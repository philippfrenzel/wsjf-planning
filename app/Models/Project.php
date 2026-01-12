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
use App\Support\StatusMapper;
use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\SoftDeletesWithUser;

class Project extends Model
{
    use HasFactory;
    use HasStates;
    use BelongsToTenant;
    use SoftDeletesWithUser;

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
        'tenant_id',
    ];

    /**
     * Die Attribute, die an das Array-Format angehängt werden sollen.
     *
     * @var array<int, string>
     */
    protected $appends = ['status_details'];

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
            ->allowTransition(InApproval::class, Closed::class);
    }

    protected static function booted()
    {
        static::saving(function ($project) {
            if (empty($project->created_by)) {
                throw new \Exception('Das Feld "created_by" darf nicht leer sein.');
            }
        });
    }

    /**
     * Gibt die Status-Details des Projekts zurück.
     *
     * @return array
     */
    public function getStatusDetailsAttribute()
    {
        $status = $this->status;
        return StatusMapper::details(StatusMapper::PROJECT, $status, 'in-planning');
    }
}
