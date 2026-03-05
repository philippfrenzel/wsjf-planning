<?php

namespace App\Http\Controllers;

use App\Models\Skill;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SkillController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    public function index(): Response
    {
        $skills = Skill::withCount('users')->orderBy('category')->orderBy('name')->get();
        $existingNames = $skills->pluck('name')->toArray();

        return Inertia::render('skills/index', [
            'skills' => $skills,
            'safeDefaults' => collect(self::safeDefaults())
                ->map(fn ($s) => array_merge($s, ['exists' => in_array($s['name'], $existingNames)]))
                ->values(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
        ]);

        Skill::create($validated);

        return redirect()->route('skills.index')->with('success', 'Skill wurde erstellt.');
    }

    public function update(Request $request, Skill $skill): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
        ]);

        $skill->update($validated);

        return redirect()->route('skills.index')->with('success', 'Skill wurde aktualisiert.');
    }

    public function destroy(Skill $skill): RedirectResponse
    {
        $skill->delete();

        return redirect()->route('skills.index')->with('success', 'Skill wurde gelöscht.');
    }

    public function seedDefaults(Request $request): RedirectResponse
    {
        $request->validate([
            'names' => ['required', 'array', 'min:1'],
            'names.*' => ['required', 'string'],
        ]);

        $tenantId = auth()->user()->current_tenant_id;
        $selected = collect($request->names);
        $defaults = collect(self::safeDefaults())->keyBy('name');

        $inserted = 0;
        foreach ($selected as $name) {
            $skill = $defaults->get($name);
            if (!$skill) continue;

            $exists = Skill::where('tenant_id', $tenantId)->where('name', $name)->exists();
            if (!$exists) {
                Skill::create(array_merge($skill, ['tenant_id' => $tenantId]));
                $inserted++;
            }
        }

        return redirect()->route('skills.index')
            ->with('success', $inserted > 0
                ? "{$inserted} SAFe-Skills wurden hinzugefügt."
                : 'Alle ausgewählten Skills sind bereits vorhanden.');
    }

    public static function safeDefaults(): array
    {
        return [
            ['name' => 'Release Train Engineer (RTE)', 'category' => 'ART-Ebene', 'description' => 'Leitet den Agile Release Train, moderiert PI Planning und beseitigt Impediments.'],
            ['name' => 'Product Manager', 'category' => 'ART-Ebene', 'description' => 'Verantwortet die Programm-Backlog-Priorisierung und die inhaltliche Ausrichtung des ART.'],
            ['name' => 'System Architect', 'category' => 'ART-Ebene', 'description' => 'Definiert die technische Architektur und Leitplanken für alle Teams im ART.'],
            ['name' => 'Business Owner', 'category' => 'ART-Ebene', 'description' => 'Stakeholder mit Geschäftsverantwortung, bewertet den Business Value bei PI Planning.'],
            ['name' => 'Scrum Master', 'category' => 'Team-Ebene', 'description' => 'Facilitiert agile Zeremonien, schützt das Team und fördert kontinuierliche Verbesserung.'],
            ['name' => 'Product Owner', 'category' => 'Team-Ebene', 'description' => 'Verantwortet das Team-Backlog, priorisiert Stories und akzeptiert Ergebnisse.'],
            ['name' => 'Frontend-Entwicklung', 'category' => 'Team-Ebene', 'description' => 'Entwicklung von Benutzeroberflächen mit modernen Web-Frameworks.'],
            ['name' => 'Backend-Entwicklung', 'category' => 'Team-Ebene', 'description' => 'Entwicklung von APIs, Geschäftslogik und Datenbank-Schichten.'],
            ['name' => 'Full-Stack-Entwicklung', 'category' => 'Team-Ebene', 'description' => 'Übergreifende Entwicklung von Frontend und Backend.'],
            ['name' => 'QA / Test Engineering', 'category' => 'Team-Ebene', 'description' => 'Testautomatisierung, Qualitätssicherung und Teststrategien.'],
            ['name' => 'UX/UI Design', 'category' => 'Team-Ebene', 'description' => 'Nutzerforschung, Interaction Design und visuelle Gestaltung.'],
            ['name' => 'DevOps / Platform Engineering', 'category' => 'Team-Ebene', 'description' => 'CI/CD-Pipelines, Infrastruktur-Automatisierung und Monitoring.'],
            ['name' => 'Data Engineering', 'category' => 'Team-Ebene', 'description' => 'Datenmodellierung, ETL-Pipelines und Datenanalyse.'],
            ['name' => 'Security Engineering', 'category' => 'Team-Ebene', 'description' => 'Applikationssicherheit, Penetration Testing und Compliance.'],
            ['name' => 'Mobile-Entwicklung', 'category' => 'Team-Ebene', 'description' => 'Entwicklung nativer oder hybrider mobiler Anwendungen.'],
            ['name' => 'Technical Writing', 'category' => 'Team-Ebene', 'description' => 'Technische Dokumentation, API-Docs und Benutzerhandbücher.'],
            ['name' => 'Business Analyse', 'category' => 'Team-Ebene', 'description' => 'Anforderungsanalyse, Prozessmodellierung und Stakeholder-Kommunikation.'],
            ['name' => 'Lean Portfolio Manager', 'category' => 'Portfolio-Ebene', 'description' => 'Steuert den Wertstrom auf Portfolio-Ebene und priorisiert Epics.'],
            ['name' => 'Enterprise Architect', 'category' => 'Portfolio-Ebene', 'description' => 'Definiert die übergreifende Unternehmensarchitektur und Technologiestrategie.'],
            ['name' => 'Epic Owner', 'category' => 'Portfolio-Ebene', 'description' => 'Verantwortet die Ausarbeitung und Umsetzung von Portfolio-Epics.'],
            ['name' => 'Agile Coach', 'category' => 'Übergreifend', 'description' => 'Begleitet Teams und Führungskräfte bei der agilen Transformation.'],
            ['name' => 'Solution Architect', 'category' => 'Übergreifend', 'description' => 'Entwirft lösungsübergreifende Architekturen für Solution Trains.'],
            ['name' => 'Cloud Engineering', 'category' => 'Übergreifend', 'description' => 'Cloud-Infrastruktur, Container-Orchestrierung und Cloud-native Architektur.'],
            ['name' => 'Performance Engineering', 'category' => 'Übergreifend', 'description' => 'Lasttests, Performance-Optimierung und Kapazitätsplanung.'],
            ['name' => 'Site Reliability Engineering (SRE)', 'category' => 'Übergreifend', 'description' => 'Betriebsstabilität, Incident Management und Service-Level-Objectives.'],
        ];
    }
}
