<?php

namespace App\Http\Controllers;

use App\Models\Iteration;
use App\Models\Planning;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class IterationController extends Controller
{
    public function store(Request $request, Planning $planning): RedirectResponse
    {
        $this->authorize('update', $planning);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'is_ip' => ['boolean'],
        ]);

        $maxNumber = $planning->iterations()->max('number') ?? 0;

        $planning->iterations()->create([
            ...$validated,
            'number' => $maxNumber + 1,
        ]);

        return back()->with('success', 'Iteration wurde erstellt.');
    }

    /**
     * Auto-generate iterations for a planning based on PI start/end and sprint length.
     */
    public function generate(Request $request, Planning $planning): RedirectResponse
    {
        $this->authorize('update', $planning);

        $validated = $request->validate([
            'pi_start' => ['required', 'date'],
            'pi_end' => ['required', 'date', 'after:pi_start'],
            'sprint_weeks' => ['required', 'integer', 'min:1', 'max:6'],
            'ip_sprint' => ['boolean'],
        ]);

        // Remove existing iterations
        $planning->iterations()->forceDelete();

        $start = Carbon::parse($validated['pi_start']);
        $end = Carbon::parse($validated['pi_end']);
        $sprintWeeks = (int) $validated['sprint_weeks'];
        $includeIp = $validated['ip_sprint'] ?? true;
        $number = 1;

        $current = $start->copy();
        while ($current->copy()->addWeeks($sprintWeeks)->lte($end)) {
            $sprintEnd = $current->copy()->addWeeks($sprintWeeks)->subDay();

            // Check if next sprint would exceed end — make this the IP sprint
            $isLastSprint = $sprintEnd->copy()->addDay()->addWeeks($sprintWeeks)->gt($end);

            $planning->iterations()->create([
                'number' => $number,
                'name' => ($isLastSprint && $includeIp) ? "IP Sprint" : "Sprint {$number}",
                'start_date' => $current->toDateString(),
                'end_date' => $sprintEnd->toDateString(),
                'is_ip' => $isLastSprint && $includeIp,
            ]);

            $number++;
            $current = $sprintEnd->copy()->addDay();
        }

        // Handle remaining days as IP sprint if they exist
        if ($current->lt($end)) {
            $planning->iterations()->create([
                'number' => $number,
                'name' => 'IP Sprint',
                'start_date' => $current->toDateString(),
                'end_date' => $end->toDateString(),
                'is_ip' => true,
            ]);
        }

        return back()->with('success', 'Iterationen wurden generiert.');
    }

    public function update(Request $request, Iteration $iteration): RedirectResponse
    {
        $this->authorize('update', $iteration->planning);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'is_ip' => ['boolean'],
        ]);

        $iteration->update($validated);

        return back()->with('success', 'Iteration wurde aktualisiert.');
    }

    public function destroy(Iteration $iteration): RedirectResponse
    {
        $this->authorize('update', $iteration->planning);

        $iteration->delete();

        return back()->with('success', 'Iteration wurde gelöscht.');
    }
}
