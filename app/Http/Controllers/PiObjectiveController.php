<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePiObjectiveRequest;
use App\Http\Requests\UpdatePiObjectiveRequest;
use App\Models\PiObjective;
use App\Models\Planning;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

class PiObjectiveController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(PiObjective::class, 'pi_objective');
    }

    public function store(StorePiObjectiveRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['user_id'] = Auth::id();

        PiObjective::create($data);

        return back()->with('success', 'PI Objective wurde erstellt.');
    }

    public function update(UpdatePiObjectiveRequest $request, PiObjective $piObjective): RedirectResponse
    {
        $piObjective->update($request->validated());

        return back()->with('success', 'PI Objective wurde aktualisiert.');
    }

    public function destroy(PiObjective $piObjective): RedirectResponse
    {
        $piObjective->delete();

        return back()->with('success', 'PI Objective wurde gelöscht.');
    }
}
