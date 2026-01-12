<?php

namespace App\States\Planning;

class InExecution extends PlanningState
{
    public static $name = 'in-execution';

    public function name(): string
    {
        return 'In Durchführung';
    }

    public function color(): string
    {
        return 'bg-yellow-100 text-yellow-800';
    }
}

