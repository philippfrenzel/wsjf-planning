<?php

namespace App\Http\Controllers;

use App\Models\Planning;
use App\Models\Vote;
use App\Models\User;
use App\Models\Feature;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

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

        // Aktuell: alle Features aus dem Projekt
        // $features = Feature::where('project_id', $planning->project_id)->get(['id', 'jira_key', 'name']);

        // Korrekt: nur die Features, die mit dem Planning verknüpft sind
        $features = $planning->features()
            ->select('features.id', 'features.jira_key', 'features.name', 'features.description')
            ->get();

        // Bereits abgegebene Votes des Users für dieses Planning laden
        $existingVotes = Vote::where('user_id', $user->id)
            ->where('planning_id', $planning->id)
            ->get()
            ->keyBy(fn($vote) => $vote->feature_id . '_' . $vote->type);

        // Typen für das Votum
        $types = ['BusinessValue', 'TimeCriticality', 'RiskOpportunity'];

        $plannings = \App\Models\Planning::all(['id', 'title', 'project_id']);
        return Inertia::render('votes/session', [
            'planning' => $planning->only(['id', 'title', 'project_id']),
            'plannings' => $plannings,
            'features' => $features,
            'types' => $types,
            'existingVotes' => $existingVotes,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
            ],
        ]);
    }

    public function voteSessionStore(Request $request, Planning $planning)
    {
        $user = Auth::user();

        // Erwartet: votes = [ "featureId_type" => value, ... ]
        $votes = $request->input('votes', []);
        $types = ['BusinessValue', 'TimeCriticality', 'RiskOpportunity'];

        foreach ($votes as $key => $value) {
            // Key-Format: featureId_type
            [$featureId, $type] = explode('_', $key, 2);

            if (!in_array($type, $types)) {
                continue; // Ungültiger Typ, überspringen
            }

            // Vote updaten oder neu anlegen
            \App\Models\Vote::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'feature_id' => $featureId,
                    'planning_id' => $planning->id,
                    'type' => $type,
                ],
                [
                    'value' => $value,
                    'voted_at' => now(),
                ]
            );
        }

        // Automatisch Durchschnitts-Votes für den Planning-Ersteller berechnen
        $this->calculateAverageVotesForCreator($planning);

        return redirect()->route('votes.session', $planning->id)
            ->with('success', 'Deine Stimmen wurden gespeichert.');
    }

    /**
     * Berechnet Durchschnitts-Votes für den Planning-Ersteller
     */
    private function calculateAverageVotesForCreator(Planning $planning)
    {
        // Planning-Ersteller identifizieren
        $creatorId = $planning->created_by;
        if (!$creatorId) {
            \Log::warning('Planning ohne Ersteller gefunden (ID: ' . $planning->id . ')');
            return; // Kein Ersteller definiert, abbrechen
        }

        // Features dieses Plannings abrufen - Tabellennamen qualifizieren
        $features = $planning->features()->pluck('features.id');

        if ($features->isEmpty()) {
            \Log::info('Keine Features für Planning (ID: ' . $planning->id . ') gefunden');
            return; // Keine Features vorhanden
        }

        \Log::info('Berechne Durchschnittsvotes für Planning ' . $planning->id .
            ', Ersteller ' . $creatorId . ', Features: ' . $features->implode(', '));

        // Für jeden Feature-Typ-Kombination Durchschnitt berechnen
        foreach ($features as $featureId) {
            foreach (['BusinessValue', 'TimeCriticality', 'RiskOpportunity'] as $type) {
                // Durchschnitt aller User-Votes berechnen (außer vom Creator selbst)
                $votes = Vote::where('planning_id', $planning->id)
                    ->where('feature_id', $featureId)
                    ->where('type', $type)
                    ->where('user_id', '!=', $creatorId); // Creator-Votes ausschließen

                // Anzahl der Votes für dieses Feature/Typ protokollieren
                $voteCount = $votes->count();
                $averageVote = $votes->avg('value');

                \Log::debug("Feature $featureId, Typ $type: $voteCount Votes, Durchschnitt: $averageVote");

                // Wenn es Votes gibt, den Durchschnitt aufrunden und für den Creator speichern
                if ($averageVote !== null) {
                    $roundedAverage = ceil($averageVote);

                    // Bestehenden Vote des Creators prüfen
                    $existingVote = Vote::where('user_id', $creatorId)
                        ->where('feature_id', $featureId)
                        ->where('planning_id', $planning->id)
                        ->where('type', $type)
                        ->first();

                    $action = $existingVote ? 'Aktualisiere' : 'Erstelle neuen';
                    \Log::info("$action Vote für Ersteller $creatorId, Feature $featureId, Typ $type: $roundedAverage");

                    Vote::updateOrCreate(
                        [
                            'user_id' => $creatorId,
                            'feature_id' => $featureId,
                            'planning_id' => $planning->id,
                            'type' => $type,
                        ],
                        [
                            'value' => $roundedAverage,
                            'voted_at' => now(),
                        ]
                    );
                } else {
                    \Log::info("Keine Votes für Feature $featureId, Typ $type gefunden");
                }
            }
        }
    }
}
