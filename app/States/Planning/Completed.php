<?php

namespace App\States\Planning;

class Completed extends PlanningState
{
    public static $name = 'completed';

    public function name(): string
    {
        return 'Abgeschlossen';
    }

    public function color(): string
    {
        return 'bg-green-100 text-green-800';
    }
}

