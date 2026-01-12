<?php

namespace Tests\Feature;

use App\Models\Feature;
use App\Models\Planning;
use App\Models\Project;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FeatureStatusTest extends TestCase
{
    use RefreshDatabase;

    public function test_feature_status_can_transition_to_approved_via_controller(): void
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

        $feature = Feature::create([
            'jira_key' => 'FEAT-1',
            'name' => 'Feature 1',
            'project_id' => $project->id,
        ]);

        $response = $this->put(route('features.update', $feature), [
            'jira_key' => 'FEAT-1',
            'name' => 'Feature 1',
            'description' => 'Updated',
            'project_id' => $project->id,
            'status' => 'approved',
        ]);

        $response->assertRedirect();

        $feature->refresh();

        $this->assertSame('approved', $feature->status_details['value']);
        $this->assertSame('Genehmigt', $feature->status_details['name']);
    }

    private function seedTenantAndUser(): array
    {
        $tenant = Tenant::create(['name' => 'Tenant 1']);

        $user = User::factory()->create();
        $user->tenant_id = $tenant->id;
        $user->current_tenant_id = $tenant->id;
        $user->save();

        return [$tenant, $user];
    }
}
