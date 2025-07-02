<?php

namespace App\States\Commitment;

class Accepted extends CommitmentState
{
    public function name(): string
    {
        return 'Angenommen';
    }

    public function color(): string
    {
        return 'bg-yellow-100 text-yellow-800';
    }
}
