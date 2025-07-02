<?php

namespace App\States\Commitment;

class Suggested extends CommitmentState
{
    public function name(): string
    {
        return 'Vorschlag';
    }

    public function color(): string
    {
        return 'bg-blue-100 text-blue-800';
    }
}
