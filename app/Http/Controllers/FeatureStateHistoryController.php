<?php

namespace App\Http\Controllers;

use App\Models\Feature;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FeatureStateHistoryController extends Controller
{
    private const DEFAULT_RANGE_DAYS = 90;

    public function index(Request $request): JsonResponse
    {
        $from = $request->filled('from')
            ? Carbon::parse($request->input('from'))->startOfDay()
            : now()->subDays(self::DEFAULT_RANGE_DAYS)->startOfDay();

        $to = $request->filled('to')
            ? Carbon::parse($request->input('to'))->endOfDay()
            : now()->endOfDay();

        if ($from->gt($to)) {
            [$from, $to] = [$to->copy()->startOfDay(), $from->copy()->endOfDay()];
        }

        $features = Feature::with(['stateHistories' => fn ($query) => $query->orderBy('changed_at')])
            ->get(['id', 'status', 'created_at']);

        $segmentsByFeature = [];

        foreach ($features as $feature) {
            $histories = $feature->stateHistories;

            if ($histories->isEmpty()) {
                $segmentsByFeature[$feature->id] = [[
                    'status' => $this->normalizeStatus($feature->status) ?? 'in-planning',
                    'start' => $this->asCarbon($feature->created_at ?? $from),
                    'end' => null,
                ]];
                continue;
            }

            $currentStatus = null;
            $currentStart = null;
            $segments = [];

            foreach ($histories as $history) {
                if ($currentStatus !== null && $currentStart !== null) {
                    $segments[] = [
                        'status' => $currentStatus,
                        'start' => $this->asCarbon($currentStart),
                        'end' => $this->asCarbon($history->changed_at),
                    ];
                }

                $currentStatus = $history->to_status;
                $currentStart = $history->changed_at;
            }

            if ($currentStatus !== null && $currentStart !== null) {
                $segments[] = [
                    'status' => $currentStatus,
                    'start' => $this->asCarbon($currentStart),
                    'end' => null,
                ];
            }

            $segmentsByFeature[$feature->id] = $segments;
        }

        $statusKeys = [
            'in-planning',
            'approved',
            'rejected',
            'implemented',
            'obsolete',
            'archived',
            'deleted',
        ];

        $timeline = [];
        $cursor = $from->copy();

        while ($cursor->lte($to)) {
            $dayEnd = $cursor->copy()->endOfDay();
            $counts = array_fill_keys($statusKeys, 0);

            foreach ($segmentsByFeature as $segments) {
                foreach ($segments as $segment) {
                    /** @var CarbonInterface $segmentStart */
                    $segmentStart = $segment['start'];
                    /** @var CarbonInterface|null $segmentEnd */
                    $segmentEnd = $segment['end'];

                    $isActive = $segmentStart->lte($dayEnd) && ($segmentEnd === null || $segmentEnd->gt($dayEnd));

                    if ($isActive) {
                        if (! array_key_exists($segment['status'], $counts)) {
                            $counts[$segment['status']] = 0;
                        }
                        $counts[$segment['status']] = ($counts[$segment['status']] ?? 0) + 1;
                        break;
                    }
                }
            }

            $timeline[] = [
                'date' => $cursor->toDateString(),
                'counts' => $counts,
            ];

            $cursor->addDay();
        }

        return response()->json([
            'from' => $from->toISOString(),
            'to' => $to->toISOString(),
            'timeline' => $timeline,
        ]);
    }

    private function normalizeStatus(mixed $status): ?string
    {
        if (is_object($status) && method_exists($status, 'getValue')) {
            return $status->getValue();
        }

        if (is_string($status)) {
            return $status;
        }

        return null;
    }

    private function asCarbon(mixed $value): CarbonInterface
    {
        if ($value instanceof CarbonInterface) {
            return $value;
        }

        return Carbon::parse($value);
    }
}
