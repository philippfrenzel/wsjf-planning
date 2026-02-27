<?php

namespace App\Services;

use App\Models\Planning;
use App\Models\Vote;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class VoteService
{
    /**
     * Berechnet Durchschnitts-Votes für den Planning-Ersteller.
     *
     * Replaces the previous O(6N) loop approach with a single aggregation query
     * and a single upsert, keeping database round-trips constant regardless of
     * the number of features.
     */
    public function calculateAverageVotesForCreator(Planning $planning): void
    {
        $creatorId = $planning->created_by;
        if (!$creatorId) {
            Log::warning('Planning ohne Ersteller gefunden', ['planning_id' => $planning->id]);
            return;
        }

        $featureIds = $planning->features()->pluck('features.id');

        if ($featureIds->isEmpty()) {
            Log::info('Keine Features für Planning gefunden', ['planning_id' => $planning->id]);
            return;
        }

        // Single aggregation query: average per feature/type, excluding the creator
        $averages = Vote::select('feature_id', 'type', DB::raw('AVG(value) as avg_value'))
            ->where('planning_id', $planning->id)
            ->whereIn('feature_id', $featureIds)
            ->where('user_id', '!=', $creatorId)
            ->groupBy('feature_id', 'type')
            ->get();

        if ($averages->isEmpty()) {
            Log::info('Keine Votes für Durchschnittsberechnung gefunden', ['planning_id' => $planning->id]);
            return;
        }

        $now = now();
        $upsertRows = $averages->map(fn($row) => [
            'user_id'     => $creatorId,
            'feature_id'  => $row->feature_id,
            'planning_id' => $planning->id,
            'type'        => $row->type,
            'value'       => (int) ceil($row->avg_value),
            'voted_at'    => $now,
            'created_at'  => $now,
            'updated_at'  => $now,
        ])->all();

        // Single upsert – one round-trip regardless of N
        Vote::upsert(
            $upsertRows,
            ['user_id', 'feature_id', 'planning_id', 'type'],
            ['value', 'voted_at', 'updated_at']
        );

        Log::info('Creator-Votes berechnet und gespeichert', [
            'planning_id' => $planning->id,
            'rows'        => count($upsertRows),
        ]);
    }
}
