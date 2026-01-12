<?php

namespace App\States\Planning;

class InPlanning extends PlanningState
{
    public static $name = 'in-planning';

    public function name(): string
    {
        return 'In Planung';
    }

    public function color(): string
    {
        return 'bg-blue-100 text-blue-800';
    }
}

