<?php

namespace Tests\Feature;

use App\Models\Feature;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class VersionIncrementTest extends TestCase
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

    public function test_version_increments_on_bulk_import()
    {
        [$tenant, $user] = $this->seedTenantAndUser();
        $project = $this->createProject($user);

        // Get initial version
        $initialVersion = Cache::get('app.data.version', 1);

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

        // Version should have incremented
        $newVersion = Cache::get('app.data.version', 1);
        $this->assertGreaterThan($initialVersion, $newVersion);
    }

    public function test_version_increments_on_feature_create()
    {
        [$tenant, $user] = $this->seedTenantAndUser();
        $project = $this->createProject($user);

        $initialVersion = Cache::get('app.data.version', 1);

        $response = $this->actingAs($user)->post(route('features.store', absolute: false), [
            'jira_key' => 'TEST-123',
            'name' => 'Test Feature',
            'description' => 'Test Description',
            'project_id' => $project->id,
        ]);

        $newVersion = Cache::get('app.data.version', 1);
        $this->assertGreaterThan($initialVersion, $newVersion);
    }

    public function test_version_increments_on_feature_update()
    {
        [$tenant, $user] = $this->seedTenantAndUser();
        $project = $this->createProject($user);

        $feature = Feature::create([
            'jira_key' => 'TEST-123',
            'name' => 'Test Feature',
            'description' => 'Test Description',
            'project_id' => $project->id,
            'tenant_id' => $tenant->id,
        ]);

        $initialVersion = Cache::get('app.data.version', 1);

        $response = $this->actingAs($user)->put(route('features.update', $feature, false), [
            'jira_key' => 'TEST-123',
            'name' => 'Updated Feature',
            'description' => 'Updated Description',
            'project_id' => $project->id,
        ]);

        $newVersion = Cache::get('app.data.version', 1);
        $this->assertGreaterThan($initialVersion, $newVersion);
    }

    public function test_version_increments_on_feature_delete()
    {
        [$tenant, $user] = $this->seedTenantAndUser();
        $project = $this->createProject($user);

        $feature = Feature::create([
            'jira_key' => 'TEST-123',
            'name' => 'Test Feature',
            'description' => 'Test Description',
            'project_id' => $project->id,
            'tenant_id' => $tenant->id,
        ]);

        $initialVersion = Cache::get('app.data.version', 1);

        $response = $this->actingAs($user)->delete(route('features.destroy', $feature, false));

        $newVersion = Cache::get('app.data.version', 1);
        $this->assertGreaterThan($initialVersion, $newVersion);
    }
}
