<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Seeder;

class ProjectSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Test-User als Projekt-Eigentümer finden
        $owner = User::where('email', 'test@example.com')->first();

        // Wenn kein Test-User gefunden, Fehler ausgeben und abbrechen
        if (!$owner) {
            $this->command->error('Test-User nicht gefunden. Bitte erst DatabaseSeeder ausführen.');
            return;
        }

        // Zwei Beispielprojekte erstellen
        Project::create([
            'project_number' => 'WSJF-001',
            'name' => 'WSJF Demo Projekt',
            'description' => 'Ein Demoprojekt für WSJF-Planning mit verschiedenen Features',
            'project_leader_id' => $owner->id,
            'created_by' => $owner->id,
            'start_date' => now()->subDays(30), // Startdatum vor 30 Tagen
        ]);

        Project::create([
            'project_number' => 'DEV-001',
            'name' => 'Internes Entwicklungsprojekt',
            'description' => 'Projekt für interne Entwicklungsaufgaben und Experimente',
            'project_leader_id' => $owner->id,
            'created_by' => $owner->id,
            'start_date' => now()->subDays(15), // Startdatum vor 15 Tagen
        ]);
    }
}
