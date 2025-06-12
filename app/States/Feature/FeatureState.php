<?php

namespace App\States\Feature;

use Spatie\ModelStates\State;
use Spatie\ModelStates\StateConfig;

abstract class FeatureState extends State
{
    /**
     * Konfiguration für die State-Übergänge.
     */
    public static function config(): StateConfig
    {
        return parent::config()
            ->default(InPlanning::class)
            ->allowTransition(InPlanning::class, Approved::class);
    }

    /**
     * Menschenlesbarer Name für diesen Status.
     */
    abstract public function name(): string;

    /**
     * CSS-Klasse für die Anzeige des Status.
     */
    abstract public function color(): string;
}
