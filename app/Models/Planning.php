<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Concerns\BelongsToTenant;
use Spatie\ModelStates\HasStates;
use App\States\Planning\PlanningState;
use App\States\Planning\InPlanning as PlanningInPlanning;
use App\States\Planning\InExecution;
use App\States\Planning\Completed;

class Planning extends Model
{
    use HasFactory, BelongsToTenant, HasStates;

    protected $fillable = [
        'project_id',
        'title',
        'description',
        'planned_at',    // Wann geplant
        'executed_at',   // Wann durchgeführt
        'created_by',    // ID des Users, der das Planning erstellt hat
        'owner_id',      // ID des Hauptverantwortlichen
        'deputy_id',     // ID des Stellvertreters
        // weitere Felder nach Bedarf
        'tenant_id',
        'status',
    ];

    /**
     * Die Attribute, die an das Array-Format angehängt werden sollen.
     *
     * @var array<int, string>
     */
    protected $appends = ['status_details'];

    /**
     * Status-StateMachine registrieren
     */
    protected function registerStates(): void
    {
        $this->addState('status', PlanningState::class)
            ->default(PlanningInPlanning::class)
            ->allowTransition(PlanningInPlanning::class, InExecution::class)
            ->allowTransition(InExecution::class, Completed::class)
            ->castUsing(static function ($value) {
                if (is_string($value)) {
                    $map = [
                        'in-planning' => PlanningInPlanning::class,
                        'in-execution' => InExecution::class,
                        'completed' => Completed::class,
                    ];
                    $cls = $map[$value] ?? PlanningInPlanning::class;
                    return new $cls();
                }
                return $value;
            });
    }

    /**
     * Ein Planning gehört zu genau einem Project.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Ein Planning gehört zu genau einem Ersteller (User).
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Ein Planning gehört zu einem Hauptverantwortlichen (User).
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Ein Planning gehört zu einem Stellvertreter (User).
     */
    public function deputy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deputy_id');
    }

    /**
     * Ein Planning kann mehrere Stakeholder (User) haben.
     */
    public function stakeholders(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'planning_stakeholder', 'planning_id', 'user_id')
            ->withTimestamps();
    }

    /**
     * Ein Planning kann mehrere Features haben.
     */
    public function features(): BelongsToMany
    {
        return $this->belongsToMany(Feature::class, 'feature_planning', 'planning_id', 'feature_id')
            ->withTimestamps();
    }

    /**
     * Ein Planning kann mehrere Commitments haben.
     */
    public function commitments(): HasMany
    {
        return $this->hasMany(Commitment::class);
    }

    /**
     * Status-Details für Frontend
     */
    public function getStatusDetailsAttribute(): array
    {
        $status = $this->status;

        if ($status === null) {
            return [
                'value' => 'in-planning',
                'name' => 'In Planung',
                'color' => 'bg-blue-100 text-blue-800',
            ];
        }

        if (is_string($status)) {
            try {
                $map = [
                    'in-planning' => PlanningInPlanning::class,
                    'in-execution' => InExecution::class,
                    'completed' => Completed::class,
                ];
                $cls = $map[$status] ?? PlanningInPlanning::class;
                $obj = new $cls($this);
                return [
                    'value' => $status,
                    'name' => $obj->name(),
                    'color' => $obj->color(),
                ];
            } catch (\Throwable $e) {
                return [
                    'value' => $status,
                    'name' => ucfirst(str_replace('-', ' ', $status)),
                    'color' => 'bg-gray-100 text-gray-800',
                ];
            }
        }

        return [
            'value' => $status->getValue(),
            'name' => $status->name(),
            'color' => $status->color(),
        ];
    }
}
