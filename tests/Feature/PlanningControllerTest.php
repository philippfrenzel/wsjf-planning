<?php

namespace Tests\Feature;

use App\Models\Feature;
use App\Models\Planning;
use App\Models\Project;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Vote;
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

    public function test_planning_show_includes_job_size_commonvote_in_features(): void
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
            'title' => 'WSJF Test Planning',
            'created_by' => $user->id,
        ]);

        $feature = Feature::create([
            'project_id' => $project->id,
            'jira_key' => 'WSJF-1',
            'name' => 'WSJF Feature',
            'created_by' => $user->id,
        ]);
        $planning->features()->attach($feature->id);

        // Cast a JobSize vote as the creator (common vote)
        Vote::create([
            'user_id' => $user->id,
            'feature_id' => $feature->id,
            'planning_id' => $planning->id,
            'type' => 'JobSize',
            'value' => 8,
            'voted_at' => now(),
        ]);

        $response = $this->get(route('plannings.show', $planning));
        $response->assertStatus(200);

        $features = $response->viewData('page')['props']['planning']['features'];
        $featureData = collect($features)->firstWhere('id', $feature->id);
        $this->assertNotNull($featureData);

        $jobSizeVote = collect($featureData['commonvotes'] ?? [])->firstWhere('type', 'JobSize');
        $this->assertNotNull($jobSizeVote, 'JobSize commonvote should be present in features');
        $this->assertEquals(8, $jobSizeVote['value']);
    }

    public function test_planning_show_features_include_all_four_vote_types_for_wsjf(): void
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
            'title' => 'Full WSJF Planning',
            'created_by' => $user->id,
        ]);

        $feature = Feature::create([
            'project_id' => $project->id,
            'jira_key' => 'WSJF-2',
            'name' => 'Full WSJF Feature',
            'created_by' => $user->id,
        ]);
        $planning->features()->attach($feature->id);

        // Create all 4 vote types as common votes (from planning creator)
        foreach ([
            ['type' => 'BusinessValue',   'value' => 10],
            ['type' => 'TimeCriticality', 'value' => 8],
            ['type' => 'RiskOpportunity', 'value' => 5],
            ['type' => 'JobSize',         'value' => 3],
        ] as $vote) {
            Vote::create([
                'user_id'    => $user->id,
                'feature_id' => $feature->id,
                'planning_id' => $planning->id,
                'type'       => $vote['type'],
                'value'      => $vote['value'],
                'voted_at'   => now(),
            ]);
        }

        $response = $this->get(route('plannings.show', $planning));
        $response->assertStatus(200);

        $features = $response->viewData('page')['props']['planning']['features'];
        $featureData = collect($features)->firstWhere('id', $feature->id);
        $this->assertNotNull($featureData);

        $commonvoteTypes = collect($featureData['commonvotes'] ?? [])->pluck('type')->all();
        foreach (['BusinessValue', 'TimeCriticality', 'RiskOpportunity', 'JobSize'] as $expectedType) {
            $this->assertContains($expectedType, $commonvoteTypes, "Missing commonvote type: {$expectedType}");
        }
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
