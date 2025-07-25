<?php

namespace App\States\Project;

class InRealization extends ProjectState
{
    public static $name = 'in-realization';

    public function name(): string
    {
        return 'In Realisierung';
    }

    public function color(): string
    {
        return 'bg-yellow-100 text-yellow-800';
    }
}
