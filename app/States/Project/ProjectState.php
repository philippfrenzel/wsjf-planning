<?php

namespace App\States\Project;

use Spatie\ModelStates\State;
use Spatie\ModelStates\StateConfig;

abstract class ProjectState extends State
{
    /**
     * Konfiguration für die State-Übergänge.
     */
    public static function config(): StateConfig
    {
        return parent::config()
            ->default(InPlanning::class)
            ->allowTransition(InPlanning::class, InRealization::class)
            ->allowTransition(InRealization::class, InApproval::class)
            ->allowTransition(InApproval::class, Closed::class);
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
