<?php

namespace App\Support;

use App\States\Planning\Completed;
use App\States\Planning\InExecution;
use App\States\Planning\InPlanning;

class PlanningStatus
{
    /** @var array<string, class-string> */
    private const MAP = [
        'in-planning' => InPlanning::class,
        'in-execution' => InExecution::class,
        'completed' => Completed::class,
    ];

    /** @var array<string, string> */
    private const COLORS = [
        'in-planning' => 'bg-blue-100 text-blue-800',
        'in-execution' => 'bg-orange-100 text-orange-800',
        'completed' => 'bg-green-100 text-green-800',
    ];

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
            'in-execution' => 'In Durchführung',
            'completed' => 'Abgeschlossen',
            default => ucfirst(str_replace('-', ' ', $value)),
        };
    }
}
