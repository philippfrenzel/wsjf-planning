<?php

namespace Tests\Feature;

use App\Models\Planning;
use App\Models\Project;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlanningStateTest extends TestCase
{
    use RefreshDatabase;

    public function test_planning_status_transitions_to_in_execution(): void
    {
        [$tenant, $user] = $this->seedTenantAndUser();
        $this->actingAs($user);

        $project = Project::create([
            'project_number' => 'P-1',
            'name' => 'Proj',
            'description' => 'Desc',
            'jira_base_uri' => 'https://example.test',
            'created_by' => $user->id,
        ]);

        $planning = Planning::create([
            'project_id' => $project->id,
            'title' => 'Planning 1',
            'created_by' => $user->id,
        ]);

        $response = $this->put(route('plannings.update', $planning), [
            'project_id' => $project->id,
            'title' => 'Planning 1',
            'description' => 'Updated',
            'planned_at' => null,
            'executed_at' => null,
            'owner_id' => null,
            'deputy_id' => null,
            'stakeholder_ids' => [],
            'feature_ids' => [],
            'status' => 'in-execution',
        ]);

        $response->assertRedirect();

        $planning->refresh();

        $this->assertSame('in-execution', $planning->status_details['value']);
        $this->assertSame('In Durchführung', $planning->status_details['name']);
    }

    private function seedTenantAndUser(): array
    {
        $tenant = Tenant::create(['name' => 'Tenant 1']);

        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);
        $user->tenant_id = $tenant->id;
        $user->current_tenant_id = $tenant->id;
        $user->save();

        return [$tenant, $user];
    }
}
