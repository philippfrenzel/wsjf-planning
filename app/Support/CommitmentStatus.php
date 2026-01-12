<?php

namespace App\Support;

final class CommitmentStatus
{
    public static function classFor(string $value): ?string
    {
        return StatusMapper::classFor(StatusMapper::COMMITMENT, $value);
    }

    public static function detailsFromStatus(mixed $status): ?array
    {
        return StatusMapper::details(StatusMapper::COMMITMENT, $status, 'suggested');
    }

    public static function colorFor(string $value): string
    {
        return StatusMapper::details(StatusMapper::COMMITMENT, $value, 'suggested')['color'] ?? 'bg-gray-100 text-gray-800';
    }

    public static function displayName(string $value): string
    {
        return StatusMapper::details(StatusMapper::COMMITMENT, $value, 'suggested')['name'] ?? ucfirst($value);
    }
}
