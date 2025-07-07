<?php

namespace App\States\Commitment;

class Completed extends CommitmentState
{
    public function name(): string
    {
        return 'Erledigt';
    }

    public function color(): string
    {
        return 'bg-green-100 text-green-800';
    }
}
