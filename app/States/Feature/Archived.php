<?php

namespace App\States\Feature;

class Archived extends FeatureState
{
    public static $name = 'archived';

    public function name(): string
    {
        return 'Archiviert';
    }

    public function color(): string
    {
        return 'bg-yellow-100 text-yellow-800';
    }
}
