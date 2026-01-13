<?php

namespace Tests\Feature;

use App\Models\Feature;
use App\Models\Planning;
use App\Models\Project;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlanningControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_planning_index_includes_features_and_stakeholders_count(): void
    {
        [$tenant, $user] = $this->seedTenantAndUser();
        $this->actingAs($user);

        $project = Project::factory()->create([
            'created_by' => $user->id,
            'project_leader_id' => $user->id,
            'deputy_leader_id' => $user->id,
        ]);

        $planning = Planning::create([
            'project_id' => $project->id,
            'title' => 'Test Planning',
            'created_by' => $user->id,
        ]);

        // Create features and attach to planning
        $feature1 = Feature::create([
            'project_id' => $project->id,
            'jira_key' => 'TEST-1',
            'name' => 'Feature 1',
            'created_by' => $user->id,
        ]);
        $feature2 = Feature::create([
            'project_id' => $project->id,
            'jira_key' => 'TEST-2',
            'name' => 'Feature 2',
            'created_by' => $user->id,
        ]);
        $planning->features()->attach([$feature1->id, $feature2->id]);

        // Create additional users and attach as stakeholders
        $stakeholder1 = User::factory()->create([
            'email_verified_at' => now(),
            'tenant_id' => $tenant->id,
            'current_tenant_id' => $tenant->id,
        ]);
        $stakeholder2 = User::factory()->create([
            'email_verified_at' => now(),
            'tenant_id' => $tenant->id,
            'current_tenant_id' => $tenant->id,
        ]);
        $planning->stakeholders()->attach([$stakeholder1->id, $stakeholder2->id]);

        $response = $this->get(route('plannings.index'));

        $response->assertStatus(200);
        
        // Assert that the response includes the planning with counts
        $plannings = $response->viewData('page')['props']['plannings']['data'];
        $this->assertCount(1, $plannings);
        $this->assertEquals(2, $plannings[0]['features_count']);
        $this->assertEquals(2, $plannings[0]['stakeholders_count']);
    }

    private function seedTenantAndUser(): array
    {
        $tenant = Tenant::create(['name' => 'Test Tenant']);

        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);
        $user->tenant_id = $tenant->id;
        $user->current_tenant_id = $tenant->id;
        $user->save();

        return [$tenant, $user];
    }
}
