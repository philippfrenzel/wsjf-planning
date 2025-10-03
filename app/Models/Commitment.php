<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\ModelStates\HasStates;
use App\States\Commitment\CommitmentState;
use App\States\Commitment\Suggested;
use App\States\Commitment\Accepted;
use App\States\Commitment\Completed;
use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\SoftDeletesWithUser;

class Commitment extends Model
{
    use HasFactory;
    use HasStates;
    use BelongsToTenant;
    use SoftDeletesWithUser;

    /**
     * Die Attribute, die massen-zuweisbar sind.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'planning_id',
        'feature_id',
        'user_id',
        'commitment_type',
        'status',
        'tenant_id',
    ];

    /**
     * Die Attribute, die bei der JSON-Serialisierung mit ausgegeben werden sollen.
     *
     * @var array<int, string>
     */
    protected $appends = ['status_details'];

    /**
     * Die Commitment-Typen als Konstanten
     */
    public const TYPE_A = 'A';
    public const TYPE_B = 'B';
    public const TYPE_C = 'C';
    public const TYPE_D = 'D';

    /**
     * Konfiguration für Status
     */
    protected function registerStates(): void
    {
        $this->addState('status', CommitmentState::class)
            ->default(Suggested::class)
            ->allowTransition(Suggested::class, Accepted::class)
            ->allowTransition(Accepted::class, Completed::class)
            ->allowTransition(Suggested::class, Completed::class);
    }

    /**
     * Die zugehörige Planning.
     */
    public function planning(): BelongsTo
    {
        return $this->belongsTo(Planning::class);
    }

    /**
     * Das zugehörige Feature.
     */
    public function feature(): BelongsTo
    {
        return $this->belongsTo(Feature::class);
    }

    /**
     * Der Benutzer, der das Commitment erstellt hat.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Gibt eine menschenlesbare Beschreibung des Commitment-Typs zurück.
     */
    public function getCommitmentTypeDescriptionAttribute(): string
    {
        return match ($this->commitment_type) {
            self::TYPE_A => 'Hohe Priorität & Dringlichkeit',
            self::TYPE_B => 'Hohe Priorität, geringe Dringlichkeit',
            self::TYPE_C => 'Geringe Priorität, hohe Dringlichkeit',
            self::TYPE_D => 'Geringe Priorität & Dringlichkeit',
            default => 'Unbekannt'
        };
    }

    /**
     * Gibt die Status-Details für die Frontend-Darstellung zurück.
     */
    public function getStatusDetailsAttribute(): ?array
    {
        if (!$this->status) {
            return null;
        }

        // Stellen wir sicher, dass status ein State-Objekt ist
        $status = $this->status;

        // Wenn status ein String ist, konvertieren wir es in ein State-Objekt
        if (is_string($status)) {
            try {
                switch ($status) {
                    case 'suggested':
                        $statusObj = new Suggested($this);
                        break;
                    case 'accepted':
                        $statusObj = new Accepted($this);
                        break;
                    case 'completed':
                        $statusObj = new Completed($this);
                        break;
                    default:
                        $statusObj = new Suggested($this);
                }
                return [
                    'value' => $status,
                    'name' => $statusObj->name(),
                    'color' => $statusObj->color(),
                ];
            } catch (\Exception $e) {
                // Fallback, wenn die Konvertierung fehlschlägt
                return [
                    'value' => $status,
                    'name' => ucfirst($status),
                    'color' => 'bg-gray-100 text-gray-800',
                ];
            }
        }

        // Wenn es bereits ein State-Objekt ist
        return [
            'value' => $status->getValue(),
            'name' => $status->name(),
            'color' => $status->color(),
        ];
    }
}
