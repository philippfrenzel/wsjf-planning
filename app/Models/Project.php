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

    /**
     * Gibt die Status-Details des Projekts zurück.
     *
     * @return array
     */
    public function getStatusDetailsAttribute()
    {
        $status = $this->status;

        // Wenn es ein String ist, versuchen wir die Informationen ohne eine Instanz zu bekommen
        if (is_string($status)) {
            try {
                $statusMapping = [
                    'in-planning' => InPlanning::class,
                    'in-realization' => InRealization::class,
                    'in-approval' => InApproval::class,
                    'closed' => Closed::class
                ];

                $statusClass = $statusMapping[$status] ?? InPlanning::class;

                // Die statischen Eigenschaften der Klasse verwenden
                $reflectionClass = new \ReflectionClass($statusClass);

                // Extrahieren des Namens aus der Klassenname
                $shortName = $reflectionClass->getShortName();
                $displayName = '';

                // Wir suchen nach einer statischen Testmethode, um den Namen zu extrahieren
                // ohne eine Instanz zu erstellen
                try {
                    $mockObj = new $statusClass($this);
                    $displayName = $mockObj->name();
                    $color = $mockObj->color();
                } catch (\Throwable $e) {
                    // Wenn das fehlschlägt, verwenden wir einen Fallback
                    $displayName = $this->formatStateName($shortName);
                    $color = 'bg-gray-100 text-gray-800';
                }

                return [
                    'value' => $status,
                    'name' => $displayName,
                    'color' => $color,
                ];
            } catch (\Exception $e) {
                // Fallback, wenn die Konvertierung fehlschlägt
                return [
                    'value' => $status,
                    'name' => ucfirst(str_replace('-', ' ', $status)),
                    'color' => 'bg-gray-100 text-gray-800',
                ];
            }
        }

        // Wenn es bereits ein State-Objekt ist oder null
        if ($status === null) {
            // Fallback für den Fall, dass der Status null ist
            return [
                'value' => 'in-planning',
                'name' => 'In Planung',
                'color' => 'bg-blue-100 text-blue-800',
            ];
        }

        // Ansonsten normal das State-Objekt verwenden
        return [
            'value' => $status->getValue(),
            'name' => $status->name(),
            'color' => $status->color(),
        ];
    }

    /**
     * Formatiert einen Status-Namen aus einem CamelCase-Klassennamen
     * 
     * @param string $name
     * @return string
     */
    private function formatStateName(string $name): string
    {
        // InPlanning -> In Planning
        $result = preg_replace('/(?<!^)[A-Z]/', ' $0', $name);
        return $result ?: $name;
    }
}
