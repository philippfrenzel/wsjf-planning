<?php

namespace App\Support;

final class PlanningStatus
{
    public static function classFor(string $value): ?string
    {
        return StatusMapper::classFor(StatusMapper::PLANNING, $value);
    }

    public static function detailsFromStatus(mixed $status): array
    {
        return StatusMapper::details(StatusMapper::PLANNING, $status, 'in-planning') ?? [];
    }

    public static function colorFor(string $value): string
    {
        return StatusMapper::details(StatusMapper::PLANNING, $value, 'in-planning')['color'] ?? 'bg-gray-100 text-gray-800';
    }

    public static function displayName(string $value): string
    {
        return StatusMapper::details(StatusMapper::PLANNING, $value, 'in-planning')['name'] ?? ucfirst(str_replace('-', ' ', $value));
    }
}
