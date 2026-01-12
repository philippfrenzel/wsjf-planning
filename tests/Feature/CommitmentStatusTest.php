<?php

namespace Tests\Feature;

use App\Models\Commitment;
use App\Models\Feature;
use App\Models\Planning;
use App\Models\Project;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommitmentStatusTest extends TestCase
{
    use RefreshDatabase;

    public function test_commitment_status_can_transition_to_accepted(): void
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

        $feature = Feature::create([
            'jira_key' => 'FEAT-1',
            'name' => 'Feature 1',
            'project_id' => $project->id,
        ]);

        $planning->features()->sync([$feature->id]);

        $commitment = Commitment::create([
            'planning_id' => $planning->id,
            'feature_id' => $feature->id,
            'user_id' => $user->id,
            'commitment_type' => 'A',
        ]);

        $response = $this->put(route('commitments.update', $commitment), [
            'feature_id' => $feature->id,
            'user_id' => $user->id,
            'commitment_type' => 'A',
            'status' => 'accepted',
        ]);

        $response->assertRedirect();

        $commitment->refresh();

        $this->assertSame('accepted', $commitment->status_details['value']);
        $this->assertSame('Angenommen', $commitment->status_details['name']);
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
