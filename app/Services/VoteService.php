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

        // Persist WSJF scores after recalculating common votes
        $this->persistWsjfScores($planning);
    }

    /**
     * Computes and persists WSJF scores on the feature_planning pivot.
     */
    public function persistWsjfScores(Planning $planning): void
    {
        $creatorId = $planning->created_by;
        if (!$creatorId) return;

        $featureIds = $planning->features()->pluck('features.id');
        if ($featureIds->isEmpty()) return;

        // Get common votes (creator's votes = averaged stakeholder votes)
        $votes = Vote::where('planning_id', $planning->id)
            ->where('user_id', $creatorId)
            ->whereIn('feature_id', $featureIds)
            ->get()
            ->groupBy('feature_id');

        $scores = [];
        foreach ($votes as $featureId => $featureVotes) {
            $bv = $featureVotes->firstWhere('type', 'BusinessValue')?->value;
            $tc = $featureVotes->firstWhere('type', 'TimeCriticality')?->value;
            $rr = $featureVotes->firstWhere('type', 'RiskOpportunity')?->value;
            $js = $featureVotes->firstWhere('type', 'JobSize')?->value;

            if ($bv && $tc && $rr && $js && $js > 0) {
                $scores[$featureId] = round(($bv + $tc + $rr) / $js, 2);
            }
        }

        // Sort by score descending for ranking
        arsort($scores);

        $rank = 1;
        foreach ($scores as $featureId => $score) {
            DB::table('feature_planning')
                ->where('planning_id', $planning->id)
                ->where('feature_id', $featureId)
                ->update([
                    'wsjf_score' => $score,
                    'wsjf_rank' => $rank++,
                    'updated_at' => now(),
                ]);
        }

        // Null out features without a computable score
        $scoredIds = array_keys($scores);
        if (count($scoredIds) < $featureIds->count()) {
            DB::table('feature_planning')
                ->where('planning_id', $planning->id)
                ->whereNotIn('feature_id', $scoredIds)
                ->update([
                    'wsjf_score' => null,
                    'wsjf_rank' => null,
                    'updated_at' => now(),
                ]);
        }

        Log::info('WSJF scores persisted', [
            'planning_id' => $planning->id,
            'scored_features' => count($scores),
        ]);
    }
}
