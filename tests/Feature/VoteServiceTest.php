<?php

namespace Tests\Feature;

use App\Models\Feature;
use App\Models\Planning;
use App\Models\Project;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Vote;
use App\Services\VoteService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VoteServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_creates_creator_average_votes(): void
    {
        [$tenant, $creator, $userA, $userB] = $this->seedTenantAndUsers();

        $this->actingAs($creator);

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

        Vote::create([
            'user_id' => $userA->id,
            'feature_id' => $feature->id,
            'planning_id' => $planning->id,
            'type' => 'BusinessValue',
            'value' => 3,
            'voted_at' => now(),
        ]);

        Vote::create([
            'user_id' => $userB->id,
            'feature_id' => $feature->id,
            'planning_id' => $planning->id,
            'type' => 'BusinessValue',
            'value' => 5,
            'voted_at' => now(),
        ]);

        app(VoteService::class)->calculateAverageVotesForCreator($planning);

        $this->assertDatabaseHas('votes', [
            'user_id' => $creator->id,
            'feature_id' => $feature->id,
            'planning_id' => $planning->id,
            'type' => 'BusinessValue',
            'value' => 4, // ceil((3+5)/2)
        ]);
    }

    public function test_it_updates_existing_creator_vote(): void
    {
        [$tenant, $creator, $userA, $userB] = $this->seedTenantAndUsers();

        $this->actingAs($creator);

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

        // Initial creator vote
        Vote::create([
            'user_id' => $creator->id,
            'feature_id' => $feature->id,
            'planning_id' => $planning->id,
            'type' => 'BusinessValue',
            'value' => 1,
            'voted_at' => now(),
        ]);

        Vote::create([
            'user_id' => $userA->id,
            'feature_id' => $feature->id,
            'planning_id' => $planning->id,
            'type' => 'BusinessValue',
            'value' => 8,
            'voted_at' => now(),
        ]);

        Vote::create([
            'user_id' => $userB->id,
            'feature_id' => $feature->id,
            'planning_id' => $planning->id,
            'type' => 'BusinessValue',
            'value' => 7,
            'voted_at' => now(),
        ]);

        app(VoteService::class)->calculateAverageVotesForCreator($planning);

        $this->assertDatabaseHas('votes', [
            'user_id' => $creator->id,
            'feature_id' => $feature->id,
            'planning_id' => $planning->id,
            'type' => 'BusinessValue',
            'value' => 8, // ceil((8+7)/2)
        ]);
    }

    private function seedTenantAndUsers(): array
    {
        $tenant = Tenant::create(['name' => 'Tenant 1']);

        $creator = User::factory()->create();
        $creator->tenant_id = $tenant->id;
        $creator->current_tenant_id = $tenant->id;
        $creator->save();

        $userA = User::factory()->create();
        $userA->tenant_id = $tenant->id;
        $userA->current_tenant_id = $tenant->id;
        $userA->save();

        $userB = User::factory()->create();
        $userB->tenant_id = $tenant->id;
        $userB->current_tenant_id = $tenant->id;
        $userB->save();

        return [$tenant, $creator, $userA, $userB];
    }
}
