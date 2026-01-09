<?php

namespace App\Support;

use App\States\Commitment\Accepted;
use App\States\Commitment\Completed;
use App\States\Commitment\Suggested;

class CommitmentStatus
{
    /** @var array<string, class-string> */
    private const MAP = [
        'suggested' => Suggested::class,
        'accepted' => Accepted::class,
        'completed' => Completed::class,
    ];

    /** @var array<string, string> */
    private const COLORS = [
        'suggested' => 'bg-blue-100 text-blue-800',
        'accepted' => 'bg-yellow-100 text-yellow-800',
        'completed' => 'bg-green-100 text-green-800',
    ];

    /**
     * @return class-string|null
     */
    public static function classFor(string $value): ?string
    {
        return self::MAP[$value] ?? null;
    }

    public static function detailsFromStatus(mixed $status): ?array
    {
        if ($status === null) {
            return null;
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

        return null;
    }

    public static function colorFor(string $value): string
    {
        return self::COLORS[$value] ?? 'bg-gray-100 text-gray-800';
    }

    public static function displayName(string $value): string
    {
        return match ($value) {
            'suggested' => 'Vorschlag',
            'accepted' => 'Angenommen',
            'completed' => 'Erledigt',
            default => ucfirst($value),
        };
    }
}
