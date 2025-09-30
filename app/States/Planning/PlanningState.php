<?php

namespace App\States\Planning;

use Spatie\ModelStates\State;
use Spatie\ModelStates\StateConfig;

abstract class PlanningState extends State
{
    public static function config(): StateConfig
    {
        return parent::config()
            ->default(InPlanning::class)
            ->allowTransition(InPlanning::class, InExecution::class)
            ->allowTransition(InExecution::class, Completed::class);
    }

    abstract public function name(): string;

    abstract public function color(): string;
}

