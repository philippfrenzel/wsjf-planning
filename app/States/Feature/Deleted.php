<?php

namespace App\States\Feature;

class Deleted extends FeatureState
{
    public static $name = 'deleted';

    public function name(): string
    {
        return 'Gelöscht';
    }

    public function color(): string
    {
        return 'bg-red-200 text-red-900';
    }
}
