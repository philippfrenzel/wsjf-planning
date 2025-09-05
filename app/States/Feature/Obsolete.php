<?php

namespace App\States\Feature;

class Obsolete extends FeatureState
{
    public static $name = 'obsolete';

    public function name(): string
    {
        return 'Obsolet';
    }

    public function color(): string
    {
        return 'bg-gray-100 text-gray-800';
    }
}
