<?php

namespace App\Services;

use App\Models\Commitment;
use App\Support\StatusMapper;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Spatie\ModelStates\State;

class CommitmentService
{
    public function create(array $data): Commitment
    {
        $data['user_id'] = $data['user_id'] ?? Auth::id();

        $this->guardUniqueCombination($data['planning_id'], $data['feature_id'], $data['user_id']);

        return Commitment::create($data);
    }

    public function update(Commitment $commitment, array $data): Commitment
    {
        $this->guardUniqueCombination(
            $commitment->planning_id,
            $data['feature_id'],
            $data['user_id'],
            $commitment->id
        );

        $newStatus = $data['status'] ?? null;
        unset($data['status']);

        $commitment->update($data);

        if ($newStatus) {
            $this->transition($commitment, $newStatus);
        }

        return $commitment;
    }

    public function transition(Commitment $commitment, string $targetValue): void
    {
        $current = $commitment->status instanceof State ? $commitment->status->getValue() : (string) $commitment->status;

        if ($targetValue === $current) {
            return;
        }

        $allowed = StatusMapper::transitionTargets(StatusMapper::COMMITMENT, $current);

        if (!in_array($targetValue, $allowed, true)) {
            throw ValidationException::withMessages([
                'status' => 'Status-Übergang nicht erlaubt.',
            ]);
        }

        $targetClass = StatusMapper::classFor(StatusMapper::COMMITMENT, $targetValue);

        if (!$targetClass) {
            throw ValidationException::withMessages([
                'status' => 'Ungültiger Status.',
            ]);
        }

        if ($commitment->status instanceof State) {
            $commitment->status->transitionTo($targetClass);
        } else {
            $commitment->status = $targetClass;
        }

        $commitment->save();
    }

    private function guardUniqueCombination(int $planningId, int $featureId, int $userId, ?int $ignoreId = null): void
    {
        $query = Commitment::where('planning_id', $planningId)
            ->where('feature_id', $featureId)
            ->where('user_id', $userId);

        if ($ignoreId) {
            $query->where('id', '!=', $ignoreId);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'commitment' => 'Es existiert bereits ein Commitment für dieses Feature und diesen Benutzer im ausgewählten Planning.',
            ]);
        }
    }
}