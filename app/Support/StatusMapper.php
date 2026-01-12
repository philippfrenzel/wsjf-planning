<?php

namespace App\Support;

use App\States\Commitment\Accepted as CommitmentAccepted;
use App\States\Commitment\CommitmentState;
use App\States\Commitment\Completed as CommitmentCompleted;
use App\States\Commitment\Suggested as CommitmentSuggested;
use App\States\Feature\Approved as FeatureApproved;
use App\States\Feature\Archived as FeatureArchived;
use App\States\Feature\Deleted as FeatureDeleted;
use App\States\Feature\FeatureState;
use App\States\Feature\Implemented as FeatureImplemented;
use App\States\Feature\InPlanning as FeatureInPlanning;
use App\States\Feature\Obsolete as FeatureObsolete;
use App\States\Feature\Rejected as FeatureRejected;
use App\States\Planning\Completed as PlanningCompleted;
use App\States\Planning\InExecution as PlanningInExecution;
use App\States\Planning\InPlanning as PlanningInPlanning;
use App\States\Planning\PlanningState;
use App\States\Project\Closed as ProjectClosed;
use App\States\Project\InApproval as ProjectInApproval;
use App\States\Project\InPlanning as ProjectInPlanning;
use App\States\Project\InRealization as ProjectInRealization;
use App\States\Project\ProjectState;
use Spatie\ModelStates\State;

final class StatusMapper
{
    public const FEATURE = 'feature';
    public const PLANNING = 'planning';
    public const PROJECT = 'project';
    public const COMMITMENT = 'commitment';

    /**
     * Canonical value -> state class + presentation.
     *
     * @var array<string, array<string, array{class: class-string<State>, label: string, color: string}>>
     */
    private const MAP = [
        self::FEATURE => [
            'in-planning' => ['class' => FeatureInPlanning::class, 'label' => 'In Planung', 'color' => 'bg-blue-100 text-blue-800'],
            'approved' => ['class' => FeatureApproved::class, 'label' => 'Genehmigt', 'color' => 'bg-green-100 text-green-800'],
            'rejected' => ['class' => FeatureRejected::class, 'label' => 'Abgelehnt', 'color' => 'bg-red-100 text-red-800'],
            'implemented' => ['class' => FeatureImplemented::class, 'label' => 'Implementiert', 'color' => 'bg-purple-100 text-purple-800'],
            'obsolete' => ['class' => FeatureObsolete::class, 'label' => 'Obsolet', 'color' => 'bg-gray-100 text-gray-800'],
            'archived' => ['class' => FeatureArchived::class, 'label' => 'Archiviert', 'color' => 'bg-yellow-100 text-yellow-800'],
            'deleted' => ['class' => FeatureDeleted::class, 'label' => 'Gelöscht', 'color' => 'bg-red-100 text-red-800'],
        ],
        self::PLANNING => [
            'in-planning' => ['class' => PlanningInPlanning::class, 'label' => 'In Planung', 'color' => 'bg-blue-100 text-blue-800'],
            'in-execution' => ['class' => PlanningInExecution::class, 'label' => 'In Durchführung', 'color' => 'bg-orange-100 text-orange-800'],
            'completed' => ['class' => PlanningCompleted::class, 'label' => 'Abgeschlossen', 'color' => 'bg-green-100 text-green-800'],
        ],
        self::PROJECT => [
            'in-planning' => ['class' => ProjectInPlanning::class, 'label' => 'In Planung', 'color' => 'bg-blue-100 text-blue-800'],
            'in-realization' => ['class' => ProjectInRealization::class, 'label' => 'In Realisierung', 'color' => 'bg-yellow-100 text-yellow-800'],
            'in-approval' => ['class' => ProjectInApproval::class, 'label' => 'In Freigabe', 'color' => 'bg-purple-100 text-purple-800'],
            'closed' => ['class' => ProjectClosed::class, 'label' => 'Abgeschlossen', 'color' => 'bg-green-100 text-green-800'],
        ],
        self::COMMITMENT => [
            'suggested' => ['class' => CommitmentSuggested::class, 'label' => 'Vorschlag', 'color' => 'bg-blue-100 text-blue-800'],
            'accepted' => ['class' => CommitmentAccepted::class, 'label' => 'Angenommen', 'color' => 'bg-yellow-100 text-yellow-800'],
            'completed' => ['class' => CommitmentCompleted::class, 'label' => 'Erledigt', 'color' => 'bg-green-100 text-green-800'],
        ],
    ];

    /**
     * State transitions per aggregate (value => allowed next values).
     *
     * @var array<string, array<string, list<string>>>
     */
    private const TRANSITIONS = [
        self::FEATURE => [
            'in-planning' => ['approved', 'rejected', 'obsolete'],
            'approved' => ['implemented', 'obsolete', 'archived'],
            'implemented' => ['archived'],
            'rejected' => ['obsolete', 'archived'],
            'obsolete' => ['archived'],
            'archived' => ['deleted'],
        ],
        self::PLANNING => [
            'in-planning' => ['in-execution'],
            'in-execution' => ['completed'],
        ],
        self::PROJECT => [
            'in-planning' => ['in-realization'],
            'in-realization' => ['in-approval'],
            'in-approval' => ['closed'],
        ],
        self::COMMITMENT => [
            'suggested' => ['accepted', 'completed'],
            'accepted' => ['completed'],
        ],
    ];

    /**
     * Resolve a canonical value to its state class.
     *
     * @param string $type One of the StatusMapper::* constants
     * @param string|null $value Canonical value (e.g. "in-planning")
     * @return class-string<State>|null
     */
    public static function classFor(string $type, ?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        return self::MAP[$type][$value]['class'] ?? null;
    }

    /**
     * Normalize a state or raw value into display details.
     */
    public static function details(string $type, State|string|null $status, ?string $defaultValue = null): ?array
    {
        $value = match (true) {
            $status instanceof State => $status->getValue(),
            is_string($status) && is_subclass_of($status, State::class) && property_exists($status, 'name') => $status::$name,
            is_string($status) => $status,
            default => $defaultValue,
        };

        if ($value === null) {
            return null;
        }

        $info = self::MAP[$type][$value] ?? null;

        return [
            'value' => $value,
            'name' => $info['label'] ?? self::displayName($value),
            'color' => $info['color'] ?? 'bg-gray-100 text-gray-800',
        ];
    }

    /**
     * Allowed transition target values from a given current value.
     *
     * @return list<string>
     */
    public static function transitionTargets(string $type, string $currentValue): array
    {
        return self::TRANSITIONS[$type][$currentValue] ?? [];
    }

    private static function displayName(string $value): string
    {
        return ucfirst(str_replace('-', ' ', $value));
    }
}