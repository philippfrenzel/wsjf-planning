<?php

namespace App\Http\Controllers;

use App\Models\Vote;
use App\Models\User;
use App\Models\Feature;
use App\Models\Planning;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class VoteController extends Controller
{
    public function index()
    {
        $votes = Vote::with(['user:id,name', 'feature:id,jira_key,name', 'planning:id,title'])
            ->orderByDesc('voted_at')
            ->get();

        return Inertia::render('votes/index', [
            'votes' => $votes,
        ]);
    }

    public function create()
    {
        return Inertia::render('votes/create', [
            'users' => User::all(['id', 'name']),
            'features' => Feature::all(['id', 'jira_key', 'name']),
            'plannings' => Planning::all(['id', 'title']),
            'types' => ['BusinessValue', 'TimeCriticality', 'RiskOpportunity'],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'feature_id' => 'required|exists:features,id',
            'planning_id' => 'required|exists:plannings,id',
            'type' => 'required|in:BusinessValue,TimeCriticality,RiskOpportunity',
            'value' => 'required|numeric',
            'voted_at' => 'required|date',
        ]);

        Vote::create($validated);

        return redirect()->route('votes.index')->with('success', 'Vote erfolgreich erstellt.');
    }

    public function show(Vote $vote)
    {
        $vote->load(['user:id,name', 'feature:id,jira_key,name', 'planning:id,title']);

        return Inertia::render('votes/show', [
            'vote' => $vote,
        ]);
    }

    public function edit(Vote $vote)
    {
        return Inertia::render('votes/edit', [
            'vote' => $vote->load(['user', 'feature', 'planning']),
            'users' => User::all(['id', 'name']),
            'features' => Feature::all(['id', 'jira_key', 'name']),
            'plannings' => Planning::all(['id', 'title']),
            'types' => ['BusinessValue', 'TimeCriticality', 'RiskOpportunity'],
        ]);
    }

    public function update(Request $request, Vote $vote)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'feature_id' => 'required|exists:features,id',
            'planning_id' => 'required|exists:plannings,id',
            'type' => 'required|in:BusinessValue,TimeCriticality,RiskOpportunity',
            'value' => 'required|numeric',
            'voted_at' => 'required|date',
        ]);

        $vote->update($validated);

        return redirect()->route('votes.index')->with('success', 'Vote erfolgreich aktualisiert.');
    }

    public function destroy(Vote $vote)
    {
        $vote->delete();
        return redirect()->route('votes.index')->with('success', 'Vote gelöscht.');
    }

    /**
     * Zeigt eine Abstimmungs-Session für den aktuellen Benutzer an,
     * um für alle Features eines Plannings im Projekt zu voten.
     */
    public function voteSession(Request $request, Planning $planning)
    {
        $user = Auth::user();

        // Alle Features aus dem Planning-Projekt laden
        $features = Feature::where('project_id', $planning->project_id)->get(['id', 'jira_key', 'name']);

        // Bereits abgegebene Votes des Users für dieses Planning laden
        $existingVotes = Vote::where('user_id', $user->id)
            ->where('planning_id', $planning->id)
            ->get()
            ->keyBy(fn($vote) => $vote->feature_id . '_' . $vote->type);

        // Typen für das Votum
        $types = ['BusinessValue', 'TimeCriticality', 'RiskOpportunity'];

        return Inertia::render('votes/session', [
            'planning' => $planning->only(['id', 'title', 'project_id']),
            'features' => $features,
            'types' => $types,
            'existingVotes' => $existingVotes,
            'user' => $user->only(['id', 'name']),
        ]);
    }
}
