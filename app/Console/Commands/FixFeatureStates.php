<?php

namespace App\Console\Commands;

use App\Models\Feature;
use Illuminate\Console\Command;

class FixFeatureStates extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:fix-feature-states';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Stellt sicher, dass alle Features einen gültigen Status haben';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Überprüfe Feature-Status...');

        $features = Feature::all();
        $count = 0;

        foreach ($features as $feature) {
            $isModified = false;

            // Prüfe, ob der Status fehlt oder ungültig ist
            if (!isset($feature->status) || empty($feature->status)) {
                $feature->status = 'in-planning';
                $isModified = true;
                $this->line("Feature #{$feature->id} ({$feature->name}): Status fehlt - setze auf 'in-planning'");
            }
            // Prüfe, ob der Status als String vorliegt und gültig ist
            elseif (is_string($feature->status)) {
                $validStates = ['in-planning', 'approved', 'rejected', 'implemented', 'obsolete', 'archived', 'deleted'];

                if (!in_array($feature->status, $validStates)) {
                    $feature->status = 'in-planning';
                    $isModified = true;
                    $this->line("Feature #{$feature->id} ({$feature->name}): Ungültiger Status '{$feature->status}' - setze auf 'in-planning'");
                }
            }

            if ($isModified) {
                $feature->save();
                $count++;
            }
        }

        if ($count > 0) {
            $this->info("{$count} Feature(s) wurden aktualisiert.");
        } else {
            $this->info("Alle Features haben einen gültigen Status.");
        }

        return 0;
    }
}
