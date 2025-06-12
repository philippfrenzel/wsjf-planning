<?php

namespace App\States\Feature;

class Approved extends FeatureState
{
    public static $name = 'approved';

    public function name(): string
    {
        return 'Genehmigt';
    }

    public function color(): string
    {
        return 'bg-green-100 text-green-800';
    }
}
