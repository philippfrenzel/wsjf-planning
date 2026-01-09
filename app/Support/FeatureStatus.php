<?php

namespace App\Support;

use App\States\Feature\Approved;
use App\States\Feature\Archived;
use App\States\Feature\Deleted;
use App\States\Feature\Implemented;
use App\States\Feature\InPlanning;
use App\States\Feature\Obsolete;
use App\States\Feature\Rejected;

class FeatureStatus
{
    /** @var array<string, class-string> */
    private const MAP = [
        'in-planning' => InPlanning::class,
        'approved' => Approved::class,
        'rejected' => Rejected::class,
        'implemented' => Implemented::class,
        'obsolete' => Obsolete::class,
        'archived' => Archived::class,
        'deleted' => Deleted::class,
    ];

    /** @var array<string, string> */
    private const COLORS = [
        'in-planning' => 'bg-blue-100 text-blue-800',
        'approved' => 'bg-green-100 text-green-800',
        'rejected' => 'bg-red-100 text-red-800',
        'implemented' => 'bg-purple-100 text-purple-800',
        'obsolete' => 'bg-gray-100 text-gray-800',
        'archived' => 'bg-yellow-100 text-yellow-800',
        'deleted' => 'bg-red-100 text-red-800',
    ];

    public static function isValid(string $value): bool
    {
        return array_key_exists($value, self::MAP);
    }

    /**
     * @return class-string|null
     */
    public static function classFor(string $value): ?string
    {
        return self::MAP[$value] ?? null;
    }

    public static function detailsFromStatus(mixed $status): array
    {
        if ($status === null) {
            return [
                'value' => 'in-planning',
                'name' => 'In Planung',
                'color' => self::COLORS['in-planning'],
            ];
        }

        if (is_object($status) && method_exists($status, 'getValue')) {
            $value = $status->getValue();
            return [
                'value' => $value,
                'name' => method_exists($status, 'name') ? $status->name() : self::displayName($value),
                'color' => method_exists($status, 'color') ? $status->color() : self::colorFor($value),
            ];
        }

        if (is_string($status)) {
            $value = $status;
            return [
                'value' => $value,
                'name' => self::displayName($value),
                'color' => self::colorFor($value),
            ];
        }

        return [
            'value' => 'in-planning',
            'name' => 'In Planung',
            'color' => self::COLORS['in-planning'],
        ];
    }

    public static function colorFor(string $value): string
    {
        return self::COLORS[$value] ?? 'bg-gray-100 text-gray-800';
    }

    public static function displayName(string $value): string
    {
        return match ($value) {
            'in-planning' => 'In Planung',
            'approved' => 'Genehmigt',
            'rejected' => 'Abgelehnt',
            'implemented' => 'Implementiert',
            'obsolete' => 'Obsolet',
            'archived' => 'Archiviert',
            'deleted' => 'Gelöscht',
            default => ucfirst(str_replace('-', ' ', $value)),
        };
    }
}
