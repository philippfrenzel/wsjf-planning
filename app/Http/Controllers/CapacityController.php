<?php

namespace App\Http\Controllers;

use App\Models\TeamIterationCapacity;
use App\Models\Planning;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CapacityController extends Controller
{
    public function upsert(Request $request, Planning $planning)
    {
        $this->authorize('update', $planning);

        $request->validate([
            'team_id' => ['required', 'exists:teams,id'],
            'iteration_id' => ['required', 'exists:iterations,id'],
            'available_points' => ['nullable', 'integer', 'min:0'],
            'planned_points' => ['nullable', 'integer', 'min:0'],
            'availability_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        TeamIterationCapacity::updateOrCreate(
            [
                'planning_id' => $planning->id,
                'team_id' => $request->team_id,
                'iteration_id' => $request->iteration_id,
            ],
            [
                'tenant_id' => Auth::user()->current_tenant_id,
                'available_points' => $request->available_points,
                'planned_points' => $request->planned_points ?? 0,
                'availability_percentage' => $request->availability_percentage ?? 100,
                'notes' => $request->notes,
            ]
        );

        return redirect()->back()->with('success', 'Kapazität gespeichert.');
    }
}
