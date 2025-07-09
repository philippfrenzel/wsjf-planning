<?php

namespace App\States\Project;

class InApproval extends ProjectState
{
    public static $name = 'in-approval';

    public function name(): string
    {
        return 'In Abnahme';
    }

    public function color(): string
    {
        return 'bg-purple-100 text-purple-800';
    }
}
