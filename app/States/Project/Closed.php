<?php

namespace App\States\Project;

class Closed extends ProjectState
{
    public static $name = 'closed';

    public function name(): string
    {
        return 'Geschlossen';
    }

    public function color(): string
    {
        return 'bg-gray-100 text-gray-800';
    }
}
