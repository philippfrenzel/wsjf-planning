<?php

namespace Tests\Feature;

use App\Models\Feature;
use App\Models\Planning;
use App\Models\Project;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VoteSessionFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_vote_session_store_creates_creator_average_vote(): void
    {
        [$tenant, $creator, $voter] = $this->seedTenantAndUsers();

        $this->actingAs($voter);

        $project = Project::create([
            'project_number' => 'P-1',
            'name' => 'Proj',
            'description' => 'Desc',
            'jira_base_uri' => 'https://example.test',
            'created_by' => $creator->id,
        ]);

        $planning = Planning::create([
            'project_id' => $project->id,
            'title' => 'Planning 1',
            'created_by' => $creator->id,
        ]);

        $feature = Feature::create([
            'jira_key' => 'FEAT-1',
            'name' => 'Feature 1',
            'project_id' => $project->id,
        ]);

        $planning->features()->sync([$feature->id]);

        $payload = [
            'votes' => [
                $feature->id . '_BusinessValue' => 5,
                $feature->id . '_TimeCriticality' => 3,
            ],
        ];

        $response = $this->post(route('votes.session.store', $planning), $payload);

        $response->assertRedirect();

        // Voter's vote stored
        $this->assertDatabaseHas('votes', [
            'user_id' => $voter->id,
            'feature_id' => $feature->id,
            'planning_id' => $planning->id,
            'type' => 'BusinessValue',
            'value' => 5,
        ]);

        // Creator average vote created (only one voter -> same value)
        $this->assertDatabaseHas('votes', [
            'user_id' => $creator->id,
            'feature_id' => $feature->id,
            'planning_id' => $planning->id,
            'type' => 'BusinessValue',
            'value' => 5,
        ]);
    }

    private function seedTenantAndUsers(): array
    {
        $tenant = Tenant::create(['name' => 'Tenant 1']);

        $creator = User::factory()->create([
            'email_verified_at' => now(),
        ]);
        $creator->tenant_id = $tenant->id;
        $creator->current_tenant_id = $tenant->id;
        $creator->save();

        $voter = User::factory()->create([
            'email_verified_at' => now(),
        ]);
        $voter->tenant_id = $tenant->id;
        $voter->current_tenant_id = $tenant->id;
        $voter->save();

        return [$tenant, $creator, $voter];
    }
}
