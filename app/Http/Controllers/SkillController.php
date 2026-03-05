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

        $withExists = fn (array $items) => collect($items)
            ->map(fn ($s) => array_merge($s, ['exists' => in_array($s['name'], $existingNames)]))
            ->values();

        return Inertia::render('skills/index', [
            'skills' => $skills,
            'roleSets' => [
                ['key' => 'safe', 'label' => 'SAFe-Rollen', 'items' => $withExists(self::safeDefaults())],
                ['key' => 'software', 'label' => 'Software Engineering', 'items' => $withExists(self::softwareDefaults())],
                ['key' => 'data', 'label' => 'Data Engineering', 'items' => $withExists(self::dataDefaults())],
            ],
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
        $allDefaults = collect(array_merge(
            self::safeDefaults(),
            self::softwareDefaults(),
            self::dataDefaults(),
        ))->keyBy('name');

        $inserted = 0;
        foreach ($selected as $name) {
            $skill = $allDefaults->get($name);
            if (!$skill) continue;

            $exists = Skill::where('tenant_id', $tenantId)->where('name', $name)->exists();
            if (!$exists) {
                Skill::create(array_merge($skill, ['tenant_id' => $tenantId]));
                $inserted++;
            }
        }

        return redirect()->route('skills.index')
            ->with('success', $inserted > 0
                ? "{$inserted} Skills wurden hinzugefügt."
                : 'Alle ausgewählten Skills sind bereits vorhanden.');
    }

    public static function softwareDefaults(): array
    {
        return [
            // Architektur & Design
            ['name' => 'Software Architect', 'category' => 'Architektur & Design', 'description' => 'Entwurf von Systemarchitekturen, Technologieentscheidungen und Architektur-Reviews.'],
            ['name' => 'Domain-Driven Design (DDD)', 'category' => 'Architektur & Design', 'description' => 'Bounded Contexts, Aggregates, Domain Events und strategisches Design.'],
            ['name' => 'API Design', 'category' => 'Architektur & Design', 'description' => 'RESTful APIs, GraphQL, gRPC-Schnittstellen und API-Governance.'],
            ['name' => 'Microservices', 'category' => 'Architektur & Design', 'description' => 'Service-Schnitt, Inter-Service-Kommunikation, Service Mesh und Resilienz-Patterns.'],

            // Programmiersprachen & Frameworks
            ['name' => 'Java / Spring Boot', 'category' => 'Sprachen & Frameworks', 'description' => 'Enterprise-Java-Entwicklung mit Spring Boot, JPA und Spring Security.'],
            ['name' => 'TypeScript / Node.js', 'category' => 'Sprachen & Frameworks', 'description' => 'Serverseitige Entwicklung mit Node.js, Express, NestJS und TypeScript.'],
            ['name' => 'Python', 'category' => 'Sprachen & Frameworks', 'description' => 'Python-Entwicklung mit Django, FastAPI oder Flask.'],
            ['name' => 'Go', 'category' => 'Sprachen & Frameworks', 'description' => 'Go-Entwicklung für performante Services, CLI-Tools und Cloud-native Systeme.'],
            ['name' => 'C# / .NET', 'category' => 'Sprachen & Frameworks', 'description' => 'Entwicklung mit .NET Core/6+, ASP.NET, Entity Framework und Azure-Integration.'],
            ['name' => 'Rust', 'category' => 'Sprachen & Frameworks', 'description' => 'Systemnahe Entwicklung mit Rust für Performance-kritische Komponenten.'],
            ['name' => 'React / Next.js', 'category' => 'Sprachen & Frameworks', 'description' => 'Frontend-Entwicklung mit React, Next.js, State-Management und SSR/SSG.'],
            ['name' => 'Vue.js / Nuxt', 'category' => 'Sprachen & Frameworks', 'description' => 'Frontend-Entwicklung mit Vue 3, Nuxt 3, Composition API und Pinia.'],
            ['name' => 'PHP / Laravel', 'category' => 'Sprachen & Frameworks', 'description' => 'Backend-Entwicklung mit Laravel, Eloquent ORM und Blade/Inertia.'],

            // Qualität & Testing
            ['name' => 'Test Automation', 'category' => 'Qualität & Testing', 'description' => 'Unit-, Integrations- und E2E-Tests mit Jest, Cypress, Playwright oder PHPUnit.'],
            ['name' => 'Code Review', 'category' => 'Qualität & Testing', 'description' => 'Systematische Code-Reviews, Pair Programming und Coding Standards.'],
            ['name' => 'CI/CD Pipeline Engineering', 'category' => 'Qualität & Testing', 'description' => 'Build-Pipelines mit GitHub Actions, GitLab CI, Jenkins oder Azure DevOps.'],
            ['name' => 'Observability', 'category' => 'Qualität & Testing', 'description' => 'Logging, Tracing und Metrics mit OpenTelemetry, Grafana, Datadog oder ELK.'],

            // Infrastruktur & Betrieb
            ['name' => 'Kubernetes', 'category' => 'Infrastruktur & Betrieb', 'description' => 'Container-Orchestrierung, Helm Charts, Operators und Cluster-Management.'],
            ['name' => 'Infrastructure as Code', 'category' => 'Infrastruktur & Betrieb', 'description' => 'Terraform, Pulumi, CloudFormation für reproduzierbare Infrastruktur.'],
            ['name' => 'AWS', 'category' => 'Infrastruktur & Betrieb', 'description' => 'Amazon Web Services: EC2, ECS, Lambda, RDS, S3, CloudFront und weitere.'],
            ['name' => 'Azure', 'category' => 'Infrastruktur & Betrieb', 'description' => 'Microsoft Azure: App Services, AKS, Functions, Cosmos DB und DevOps.'],
            ['name' => 'Datenbanken (SQL)', 'category' => 'Infrastruktur & Betrieb', 'description' => 'PostgreSQL, MySQL, SQL Server — Schema-Design, Performance-Tuning und Migrationen.'],
            ['name' => 'Datenbanken (NoSQL)', 'category' => 'Infrastruktur & Betrieb', 'description' => 'MongoDB, Redis, Elasticsearch, DynamoDB — Datenmodellierung und Skalierung.'],
            ['name' => 'Message Broker', 'category' => 'Infrastruktur & Betrieb', 'description' => 'Kafka, RabbitMQ, NATS — Event-Streaming und asynchrone Kommunikation.'],
        ];
    }

    public static function dataDefaults(): array
    {
        return [
            // Datenplattform & Architektur
            ['name' => 'Data Platform Architect', 'category' => 'Datenplattform', 'description' => 'Design der Gesamtdatenarchitektur: Data Lake, Data Warehouse, Lakehouse und Datenflüsse.'],
            ['name' => 'Data Modeling', 'category' => 'Datenplattform', 'description' => 'Dimensionales Modellieren (Star/Snowflake), Data Vault, Entity-Relationship-Modellierung.'],
            ['name' => 'Data Governance', 'category' => 'Datenplattform', 'description' => 'Datenqualität, Datenkataloge, Lineage, Policies und Compliance (DSGVO, GDPR).'],
            ['name' => 'Data Mesh', 'category' => 'Datenplattform', 'description' => 'Domänenorientierte Datenprodukte, Self-Serve-Plattform und föderierte Governance.'],

            // ETL & Integration
            ['name' => 'ETL / ELT Entwicklung', 'category' => 'ETL & Integration', 'description' => 'Datenpipelines mit dbt, Airflow, Fivetran, Talend oder Informatica.'],
            ['name' => 'Apache Spark', 'category' => 'ETL & Integration', 'description' => 'Batch- und Streaming-Verarbeitung mit PySpark, Spark SQL und Structured Streaming.'],
            ['name' => 'Apache Kafka', 'category' => 'ETL & Integration', 'description' => 'Event-Streaming-Plattform: Kafka Connect, Kafka Streams und Schema Registry.'],
            ['name' => 'Apache Airflow', 'category' => 'ETL & Integration', 'description' => 'Workflow-Orchestrierung: DAGs, Operatoren, Scheduling und Monitoring.'],
            ['name' => 'Real-Time Streaming', 'category' => 'ETL & Integration', 'description' => 'Echtzeit-Datenverarbeitung mit Flink, Kafka Streams, Spark Streaming oder Kinesis.'],
            ['name' => 'CDC (Change Data Capture)', 'category' => 'ETL & Integration', 'description' => 'Debezium, Oracle GoldenGate, DMS — inkrementelle Datenreplikation.'],

            // Data Warehouse & Analytics
            ['name' => 'Snowflake', 'category' => 'Warehouse & Analytics', 'description' => 'Cloud Data Warehouse: Warehouses, Stages, Streams, Tasks und Data Sharing.'],
            ['name' => 'BigQuery', 'category' => 'Warehouse & Analytics', 'description' => 'Google BigQuery: Partitionierung, Clustering, ML-Integration und BI Engine.'],
            ['name' => 'Databricks', 'category' => 'Warehouse & Analytics', 'description' => 'Unified Analytics: Delta Lake, MLflow, Notebooks und Data Engineering Pipelines.'],
            ['name' => 'Redshift', 'category' => 'Warehouse & Analytics', 'description' => 'Amazon Redshift: Verteilung, Sort Keys, Spectrum und Serverless.'],
            ['name' => 'dbt (Data Build Tool)', 'category' => 'Warehouse & Analytics', 'description' => 'SQL-basierte Transformationen, Tests, Dokumentation und Lineage im Warehouse.'],

            // Analytics & BI
            ['name' => 'Business Intelligence', 'category' => 'Analytics & BI', 'description' => 'Dashboard-Erstellung und Reporting mit Tableau, Power BI, Looker oder Metabase.'],
            ['name' => 'SQL Analytics', 'category' => 'Analytics & BI', 'description' => 'Fortgeschrittenes SQL: Window Functions, CTEs, Performance-Optimierung und komplexe Queries.'],
            ['name' => 'Data Visualization', 'category' => 'Analytics & BI', 'description' => 'Datenvisualisierung: Best Practices, Storytelling mit Daten und Chart-Design.'],

            // Machine Learning & AI
            ['name' => 'Machine Learning Engineering', 'category' => 'ML & AI', 'description' => 'ML-Modelle trainieren, evaluieren und in Produktion bringen (scikit-learn, TensorFlow, PyTorch).'],
            ['name' => 'MLOps', 'category' => 'ML & AI', 'description' => 'ML-Pipelines, Model Registry, Feature Stores, Monitoring und A/B-Testing.'],
            ['name' => 'NLP / LLM', 'category' => 'ML & AI', 'description' => 'Natural Language Processing, Large Language Models, Prompt Engineering und RAG.'],
            ['name' => 'Data Science', 'category' => 'ML & AI', 'description' => 'Explorative Datenanalyse, statistische Modellierung, Hypothesentests und Experimente.'],

            // Infrastruktur & Ops
            ['name' => 'Data Platform Ops', 'category' => 'Data Ops', 'description' => 'Betrieb und Skalierung von Datenplattformen: Monitoring, Alerting und Incident Response.'],
            ['name' => 'DataOps / Data Reliability', 'category' => 'Data Ops', 'description' => 'Datenqualitäts-Checks, Data Contracts, SLAs und automatisierte Daten-Tests.'],
            ['name' => 'Cloud Data Services', 'category' => 'Data Ops', 'description' => 'AWS Glue, Azure Data Factory, GCP Dataflow — Managed Cloud-Datendienste.'],
        ];
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
