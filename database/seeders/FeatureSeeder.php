<?php

namespace Database\Seeders;

use App\Models\Feature;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Seeder;

class FeatureSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Testbenutzer finden
        $user = User::where('email', 'test@example.com')->first();

        // Projekte finden
        $dataProject = Project::where('name', 'WSJF Demo Projekt')->first();
        $devProject = Project::where('name', 'Internes Entwicklungsprojekt')->first();

        if (!$user || !$dataProject || !$devProject) {
            $this->command->error('Benötigte Benutzer- oder Projektdaten nicht gefunden. Bitte erst DatabaseSeeder und ProjectSeeder ausführen.');
            return;
        }

        // Features für die Datenplattform erstellen
        $features = [
            // ETL und Datenintegration
            [
                'jira_key' => 'DP-1001',
                'name' => 'ETL-Pipeline für Kundendaten',
                'description' => 'Implementierung einer robusten ETL-Pipeline zur Integration von Kundendaten aus verschiedenen Quellsystemen (CRM, ERP, Marketing).',
                'project_id' => $dataProject->id,
            ],
            [
                'jira_key' => 'DP-1002',
                'name' => 'Echtzeit-Datenintegration',
                'description' => 'Entwicklung einer Echtzeit-Datenintegrationskomponente mit Apache Kafka für Streaming-Analytics.',
                'project_id' => $dataProject->id,
            ],

            // Datenqualität
            [
                'jira_key' => 'DP-1003',
                'name' => 'Datenvalidierungsframework',
                'description' => 'Entwicklung eines umfassenden Frameworks zur automatisierten Validierung der Datenqualität mit konfigurierbaren Regeln.',
                'project_id' => $dataProject->id,
            ],
            [
                'jira_key' => 'DP-1004',
                'name' => 'Data Cleansing-Tools',
                'description' => 'Implementierung von Tools zur Datenbereinigung und -normalisierung.',
                'project_id' => $devProject->id,
            ],

            // Data Governance
            [
                'jira_key' => 'DP-1005',
                'name' => 'Metadaten-Management',
                'description' => 'Aufbau eines zentralen Metadaten-Repositorys zur Dokumentation von Datenstrukturen, Herkunft und Abhängigkeiten.',
                'project_id' => $dataProject->id,
            ],
            [
                'jira_key' => 'DP-1006',
                'name' => 'Data Lineage-Tracking',
                'description' => 'Implementierung eines Systems zur Verfolgung der Datenherkunft und -transformation durch die gesamte Plattform.',
                'project_id' => $dataProject->id,
            ],

            // Sicherheit und Zugriffskontrolle
            [
                'jira_key' => 'DP-1007',
                'name' => 'Rollen- und Berechtigungssystem',
                'description' => 'Entwicklung eines feingranularen Rollen- und Berechtigungssystems zur Zugriffssteuerung auf Datensatzebene.',
                'project_id' => $dataProject->id,
            ],
            [
                'jira_key' => 'DP-1008',
                'name' => 'Datenverschlüsselung',
                'description' => 'Implementation von End-to-End-Verschlüsselung für sensible Datensätze in der Plattform.',
                'project_id' => $devProject->id,
            ],

            // Analytics und Reporting
            [
                'jira_key' => 'DP-1009',
                'name' => 'Self-Service BI-Dashboard',
                'description' => 'Entwicklung eines benutzerfreundlichen Self-Service Business Intelligence-Dashboards für Fachabteilungen.',
                'project_id' => $dataProject->id,
            ],
            [
                'jira_key' => 'DP-1010',
                'name' => 'Predictive Analytics-Motor',
                'description' => 'Integration eines ML-basierten Predictive Analytics-Motors für Geschäftsprognosen.',
                'project_id' => $dataProject->id,
            ],

            // API und Services
            [
                'jira_key' => 'DP-1011',
                'name' => 'REST-API für Datenzugriff',
                'description' => 'Entwicklung einer RESTful API zur programmatischen Interaktion mit der Datenplattform.',
                'project_id' => $devProject->id,
            ],
            [
                'jira_key' => 'DP-1012',
                'name' => 'GraphQL-Schnittstelle',
                'description' => 'Implementierung einer GraphQL-Schnittstelle für flexible Datenabfragen.',
                'project_id' => $devProject->id,
            ],

            // Infrastruktur und Performance
            [
                'jira_key' => 'DP-1013',
                'name' => 'Horizontale Skalierung der Datenbank',
                'description' => 'Implementierung von Sharding und horizontaler Skalierung für die Hauptdatenbankcluster.',
                'project_id' => $dataProject->id,
            ],
            [
                'jira_key' => 'DP-1014',
                'name' => 'Caching-Layer',
                'description' => 'Entwicklung eines intelligenten Caching-Layers zur Optimierung der Abfrageleistung bei häufig zugegriffenen Daten.',
                'project_id' => $devProject->id,
            ],
            [
                'jira_key' => 'DP-1015',
                'name' => 'Datenpipeline-Monitoring',
                'description' => 'Implementierung eines umfassenden Monitoring- und Alerting-Systems für alle Datenpipelines und -prozesse.',
                'project_id' => $dataProject->id,
            ],
        ];

        // Features in der Datenbank erstellen
        foreach ($features as $featureData) {
            $randomDaysAgo = rand(1, 30);

            Feature::create([
                'jira_key' => $featureData['jira_key'],
                'name' => $featureData['name'],
                'description' => $featureData['description'],
                'requester_id' => $user->id,
                'project_id' => $featureData['project_id'],
                'created_at' => now()->subDays($randomDaysAgo),
            ]);
        }

        $this->command->info('15 Datenplattform-Features wurden erfolgreich erstellt!');
    }
}
