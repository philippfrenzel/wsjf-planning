<?php

namespace Tests\Feature;

use App\Models\Feature;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class FeatureImportControllerTest extends TestCase
{
    use RefreshDatabase;

    private function seedTenantAndUser(): array
    {
        $tenant = \App\Models\Tenant::create(['name' => 'Test Tenant']);

        $user = User::factory()->create();
        $user->tenant_id = $tenant->id;
        $user->current_tenant_id = $tenant->id;
        $user->save();

        return [$tenant, $user];
    }

    private function createProject(User $user): Project
    {
        $tenant = $user->current_tenant_id ?? $user->tenant_id;
        
        return Project::create([
            'project_number' => 'PRJ-' . uniqid(),
            'name' => 'Test Project',
            'description' => 'Test Description',
            'start_date' => now()->toDateString(),
            'project_leader_id' => $user->id,
            'created_by' => $user->id,
            'tenant_id' => $tenant,
        ]);
    }

    public function test_import_csv_with_normal_data()
    {
        [$tenant, $user] = $this->seedTenantAndUser();
        $project = $this->createProject($user);

        $csvContent = "Jira-Key,Name,Description\n";
        $csvContent .= "KEY-1,Feature One,Simple description\n";
        $csvContent .= "KEY-2,Feature Two,Another description\n";

        $file = UploadedFile::fake()->createWithContent('test.csv', $csvContent);

        $response = $this->actingAs($user)->post(
            route('projects.features.import.store', $project, false),
            [
                'file' => $file,
                'has_header' => true,
            ]
        );

        $response->assertRedirect(route('features.index', absolute: false));
        
        $this->assertDatabaseHas('features', [
            'jira_key' => 'KEY-1',
            'name' => 'Feature One',
            'project_id' => $project->id,
        ]);

        $this->assertDatabaseHas('features', [
            'jira_key' => 'KEY-2',
            'name' => 'Feature Two',
            'project_id' => $project->id,
        ]);
    }

    public function test_import_csv_with_quotes_in_description()
    {
        [$tenant, $user] = $this->seedTenantAndUser();
        $project = $this->createProject($user);

        // Simulate Jira CSV with unescaped quotes in description
        $csvContent = "Jira-Key,Name,Description\n";
        $csvContent .= "KEY-1,Feature One,\"Description with \"unescaped\" quotes\"\n";
        $csvContent .= "KEY-2,Feature Two,Normal description\n";

        $file = UploadedFile::fake()->createWithContent('test.csv', $csvContent);

        $response = $this->actingAs($user)->post(
            route('projects.features.import.store', $project, false),
            [
                'file' => $file,
                'has_header' => true,
            ]
        );

        $response->assertRedirect(route('features.index', absolute: false));
        
        // Both features should be imported
        $this->assertDatabaseHas('features', [
            'jira_key' => 'KEY-1',
            'project_id' => $project->id,
        ]);

        $this->assertDatabaseHas('features', [
            'jira_key' => 'KEY-2',
            'name' => 'Feature Two',
            'project_id' => $project->id,
        ]);

        // Verify we have exactly 2 features
        $this->assertEquals(2, Feature::where('project_id', $project->id)->count());
    }

    public function test_import_csv_with_quote_causing_multiline_parsing()
    {
        [$tenant, $user] = $this->seedTenantAndUser();
        $project = $this->createProject($user);

        // This simulates the actual problem: unmatched quote causes multiline parsing
        $csvContent = "Jira-Key,Name,Description\n";
        $csvContent .= "KEY-1,Feature One,\"Description with quote\n";
        $csvContent .= "KEY-2,Feature Two,This gets merged into KEY-1\"\n";
        $csvContent .= "KEY-3,Feature Three,Normal description\n";

        $file = UploadedFile::fake()->createWithContent('test.csv', $csvContent);

        $response = $this->actingAs($user)->post(
            route('projects.features.import.store', $project, false),
            [
                'file' => $file,
                'has_header' => true,
            ]
        );

        $response->assertRedirect(route('features.index', absolute: false));
        
        // All three features should be imported (not merged)
        $this->assertDatabaseHas('features', ['jira_key' => 'KEY-1', 'project_id' => $project->id]);
        $this->assertDatabaseHas('features', ['jira_key' => 'KEY-2', 'project_id' => $project->id]);
        $this->assertDatabaseHas('features', ['jira_key' => 'KEY-3', 'project_id' => $project->id]);

        $this->assertEquals(3, Feature::where('project_id', $project->id)->count());
    }

    public function test_import_csv_with_multiple_quotes_in_same_row()
    {
        [$tenant, $user] = $this->seedTenantAndUser();
        $project = $this->createProject($user);

        $csvContent = "Jira-Key,Name,Description\n";
        $csvContent .= "KEY-1,Feature One,\"User said: \"Hello\" and \"Goodbye\"\"\n";
        $csvContent .= "KEY-2,Feature Two,Normal text\n";

        $file = UploadedFile::fake()->createWithContent('test.csv', $csvContent);

        $response = $this->actingAs($user)->post(
            route('projects.features.import.store', $project, false),
            [
                'file' => $file,
                'has_header' => true,
            ]
        );

        $response->assertRedirect(route('features.index', absolute: false));
        
        $this->assertDatabaseHas('features', ['jira_key' => 'KEY-1', 'project_id' => $project->id]);
        $this->assertDatabaseHas('features', ['jira_key' => 'KEY-2', 'project_id' => $project->id]);

        $this->assertEquals(2, Feature::where('project_id', $project->id)->count());
    }
}
