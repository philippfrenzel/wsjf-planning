<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class FixProjectStates extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:fix-project-states';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Stellt sicher, dass alle Projekte einen gültigen Status haben';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Korrigiere Projekt-Status...');

        $projects = \App\Models\Project::all();
        $count = 0;

        foreach ($projects as $project) {
            if (!$project->status || !is_string($project->status)) {
                $project->status = 'in-planning';
                $project->save();
                $count++;
            } elseif (!in_array($project->status, ['in-planning', 'in-realization', 'in-approval', 'closed'])) {
                $project->status = 'in-planning';
                $project->save();
                $count++;
            }
        }

        $this->info("{$count} Projekte wurden aktualisiert.");
    }
}
