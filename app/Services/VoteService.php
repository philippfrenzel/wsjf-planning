<?php

namespace App\Services;

use App\Models\Planning;
use App\Models\Vote;
use Illuminate\Support\Facades\Log;

class VoteService
{
    /**
     * Berechnet Durchschnitts-Votes für den Planning-Ersteller.
     */
    public function calculateAverageVotesForCreator(Planning $planning): void
    {
        $creatorId = $planning->created_by;
        if (!$creatorId) {
            Log::warning('Planning ohne Ersteller gefunden', ['planning_id' => $planning->id]);
            return;
        }

        $features = $planning->features()->pluck('features.id');

        if ($features->isEmpty()) {
            Log::info('Keine Features für Planning gefunden', ['planning_id' => $planning->id]);
            return;
        }

        foreach ($features as $featureId) {
            foreach (['BusinessValue', 'TimeCriticality', 'RiskOpportunity'] as $type) {
                $votes = Vote::where('planning_id', $planning->id)
                    ->where('feature_id', $featureId)
                    ->where('type', $type)
                    ->where('user_id', '!=', $creatorId);

                $averageVote = $votes->avg('value');

                if ($averageVote === null) {
                    Log::info('Keine Votes gefunden', [
                        'planning_id' => $planning->id,
                        'feature_id' => $featureId,
                        'type' => $type,
                    ]);
                    continue;
                }

                $roundedAverage = (int) ceil($averageVote);

                $existingVote = Vote::where([
                    'user_id' => $creatorId,
                    'feature_id' => $featureId,
                    'planning_id' => $planning->id,
                    'type' => $type,
                ])->first();

                if ($existingVote) {
                    $existingVote->value = $roundedAverage;
                    $existingVote->voted_at = now();
                    $existingVote->save();
                    Log::info('Creator-Vote aktualisiert', [
                        'vote_id' => $existingVote->id,
                        'planning_id' => $planning->id,
                        'feature_id' => $featureId,
                        'type' => $type,
                        'value' => $roundedAverage,
                    ]);
                    continue;
                }

                Vote::create([
                    'user_id' => $creatorId,
                    'feature_id' => $featureId,
                    'planning_id' => $planning->id,
                    'type' => $type,
                    'value' => $roundedAverage,
                    'voted_at' => now(),
                ]);

                Log::info('Creator-Vote erstellt', [
                    'planning_id' => $planning->id,
                    'feature_id' => $featureId,
                    'type' => $type,
                    'value' => $roundedAverage,
                ]);
            }
        }
    }
}
