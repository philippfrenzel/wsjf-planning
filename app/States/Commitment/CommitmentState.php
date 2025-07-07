<?php

namespace App\States\Commitment;

use Spatie\ModelStates\State;
use Spatie\ModelStates\StateConfig;

abstract class CommitmentState extends State
{
    public static function config(): StateConfig
    {
        return parent::config()
            ->default(Suggested::class)
            ->allowTransition(Suggested::class, Accepted::class)
            ->allowTransition(Accepted::class, Completed::class)
            ->allowTransition(Suggested::class, Completed::class);
    }

    abstract public function name(): string;

    abstract public function color(): string;
}
