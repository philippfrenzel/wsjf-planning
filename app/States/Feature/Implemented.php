<?php

namespace App\States\Feature;

class Implemented extends FeatureState
{
    public static $name = 'implemented';

    public function name(): string
    {
        return 'Implementiert';
    }

    public function color(): string
    {
        return 'bg-purple-100 text-purple-800';
    }
}
