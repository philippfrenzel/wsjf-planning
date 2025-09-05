<?php

namespace App\States\Feature;

class Rejected extends FeatureState
{
    public static $name = 'rejected';

    public function name(): string
    {
        return 'Abgewiesen';
    }

    public function color(): string
    {
        return 'bg-red-100 text-red-800';
    }
}
