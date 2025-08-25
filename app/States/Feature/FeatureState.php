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
            // Von "In Planung" kann zu "Genehmigt", "Abgewiesen" oder "Obsolet" gewechselt werden
            ->allowTransition(InPlanning::class, Approved::class)
            ->allowTransition(InPlanning::class, Rejected::class)
            ->allowTransition(InPlanning::class, Obsolete::class)
            // Von "Genehmigt" kann zu "Implementiert", "Obsolet" oder "Archiviert" gewechselt werden
            ->allowTransition(Approved::class, Implemented::class)
            ->allowTransition(Approved::class, Obsolete::class)
            ->allowTransition(Approved::class, Archived::class)
            // Von "Implementiert" kann zu "Archiviert" gewechselt werden
            ->allowTransition(Implemented::class, Archived::class)
            // Von "Abgewiesen" kann zu "Obsolet" oder "Archiviert" gewechselt werden
            ->allowTransition(Rejected::class, Obsolete::class)
            ->allowTransition(Rejected::class, Archived::class)
            // Von "Obsolet" kann zu "Archiviert" gewechselt werden
            ->allowTransition(Obsolete::class, Archived::class)
            // Von "Archiviert" kann zu "Gelöscht" gewechselt werden
            ->allowTransition(Archived::class, Deleted::class);
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
