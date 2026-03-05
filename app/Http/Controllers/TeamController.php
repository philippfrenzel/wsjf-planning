<?php

namespace App\Http\Controllers;

use App\Models\Team;
use App\Models\User;
use App\Models\Skill;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class TeamController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Team::class, 'team');
    }

    public function index(): Response
    {
        $teams = Team::with('members:id,name,email')
            ->withCount('members')
            ->orderBy('name')
            ->get();

        return Inertia::render('teams/index', [
            'teams' => $teams,
        ]);
    }

    public function create(): Response
    {
        $tenantId = Auth::user()->current_tenant_id;
        $users = User::where('tenant_id', $tenantId)
            ->orWhereHas('tenants', fn ($q) => $q->where('tenants.id', $tenantId))
            ->select('id', 'name', 'email')
            ->orderBy('name')
            ->get();

        return Inertia::render('teams/create', [
            'users' => $users,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'members' => ['array'],
            'members.*' => ['exists:users,id'],
        ]);

        $team = Team::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
        ]);

        if (!empty($validated['members'])) {
            $team->members()->attach($validated['members']);
        }

        return redirect()->route('teams.index')->with('success', 'Team wurde erstellt.');
    }

    public function edit(Team $team): Response
    {
        $team->load(['members:id,name,email', 'members.skills']);
        $tenantId = Auth::user()->current_tenant_id;
        $users = User::where('tenant_id', $tenantId)
            ->orWhereHas('tenants', fn ($q) => $q->where('tenants.id', $tenantId))
            ->select('id', 'name', 'email')
            ->orderBy('name')
            ->get();
        $skills = Skill::orderBy('category')->orderBy('name')->get(['id', 'name', 'category']);

        return Inertia::render('teams/edit', [
            'team' => $team,
            'users' => $users,
            'skills' => $skills,
        ]);
    }

    public function update(Request $request, Team $team): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'members' => ['array'],
            'members.*' => ['exists:users,id'],
        ]);

        $team->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
        ]);

        $team->members()->sync($validated['members'] ?? []);

        return redirect()->route('teams.index')->with('success', 'Team wurde aktualisiert.');
    }

    public function updateMemberSkills(Request $request, Team $team): RedirectResponse
    {
        $validated = $request->validate([
            'member_skills' => ['required', 'array'],
            'member_skills.*.user_id' => ['required', 'exists:users,id'],
            'member_skills.*.skill_ids' => ['array'],
            'member_skills.*.skill_ids.*' => ['exists:skills,id'],
            'member_skills.*.levels' => ['array'],
        ]);

        foreach ($validated['member_skills'] as $entry) {
            $user = User::findOrFail($entry['user_id']);
            $syncData = [];
            foreach ($entry['skill_ids'] ?? [] as $skillId) {
                $level = $entry['levels'][$skillId] ?? 'basic';
                $syncData[$skillId] = ['level' => $level];
            }
            $user->skills()->sync($syncData);
        }

        return redirect()->route('teams.edit', $team)->with('success', 'Skills wurden aktualisiert.');
    }

    public function destroy(Team $team): RedirectResponse
    {
        $team->delete();

        return redirect()->route('teams.index')->with('success', 'Team wurde gelöscht.');
    }
}
