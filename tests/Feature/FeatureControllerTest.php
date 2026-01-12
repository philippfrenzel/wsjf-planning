<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Project;
use App\Models\Feature;
use App\Models\FeatureDependency;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Inertia\Testing\AssertableInertia as Assert;

class FeatureControllerTest extends TestCase
{
    use RefreshDatabase;

    private function createProject(User $user): Project
    {
        return Project::create([
            'project_number' => 'PRJ-' . uniqid(),
            'name' => 'Projekt',
            'description' => 'Desc',
            'start_date' => now()->toDateString(),
            'project_leader_id' => $user->id,
            'created_by' => $user->id,
        ]);
    }

    public function test_feature_list_is_displayed()
    {
        $user = User::factory()->create();
        $project = $this->createProject($user);
        Feature::create([
            'jira_key' => 'FEA-001',
            'name' => 'Feature',
            'project_id' => $project->id,
        ]);

        $response = $this->actingAs($user)->get(route('features.index', absolute: false));
        $response->assertOk();
    }

    public function test_feature_can_be_created()
    {
        $user = User::factory()->create();
        $project = $this->createProject($user);

        $response = $this->actingAs($user)->post(route('features.store', absolute: false), [
            'jira_key' => 'FEA-002',
            'name' => 'Neues Feature',
            'description' => 'Desc',
            'project_id' => $project->id,
            'requester_id' => $user->id,
        ]);

        $response->assertRedirect(route('features.index', absolute: false));

        $this->assertDatabaseHas('features', [
            'jira_key' => 'FEA-002',
            'name' => 'Neues Feature',
            'project_id' => $project->id,
        ]);
    }

    public function test_feature_can_be_updated()
    {
        $user = User::factory()->create();
        $project = $this->createProject($user);
        $feature = Feature::create([
            'jira_key' => 'FEA-003',
            'name' => 'Altes Feature',
            'project_id' => $project->id,
        ]);

        $response = $this->actingAs($user)->put(route('features.update', $feature, false), [
            'jira_key' => 'FEA-003',
            'name' => 'Aktualisiertes Feature',
            'description' => null,
            'project_id' => $project->id,
            'requester_id' => $user->id,
        ]);

        $response->assertRedirect(route('features.index', absolute: false));

        $this->assertDatabaseHas('features', [
            'id' => $feature->id,
            'name' => 'Aktualisiertes Feature',
        ]);
    }

    public function test_feature_can_be_deleted()
    {
        $user = User::factory()->create();
        $project = $this->createProject($user);
        $feature = Feature::create([
            'jira_key' => 'FEA-004',
            'name' => 'Löschen',
            'project_id' => $project->id,
        ]);

        $response = $this->actingAs($user)->delete(route('features.destroy', $feature, false));

        $response->assertRedirect(route('features.index', absolute: false));

        $this->assertModelMissing($feature);
    }

    public function test_lineage_view_displays_all_features()
    {
        $user = User::factory()->create();
        $project = $this->createProject($user);

        $featureA = Feature::create([
            'jira_key' => 'FEA-100',
            'name' => 'Feature A',
            'project_id' => $project->id,
        ]);

        $featureB = Feature::create([
            'jira_key' => 'FEA-101',
            'name' => 'Feature B',
            'project_id' => $project->id,
        ]);

        $featureC = Feature::create([
            'jira_key' => 'FEA-102',
            'name' => 'Feature C',
            'project_id' => $project->id,
        ]);

        FeatureDependency::create([
            'feature_id' => $featureA->id,
            'related_feature_id' => $featureB->id,
            'type' => 'ermoeglicht',
        ]);

        $response = $this->actingAs($user)->get(route('features.lineage', absolute: false));

        $response->assertOk()
            ->assertInertia(fn (Assert $page) =>
                $page->component('features/lineage')
                     ->has('features', 3)
            );
    }

    public function test_board_filters_closed_features_by_days(): void
    {
        [$tenant, $user] = $this->seedTenantAndUser();
        $project = $this->createProject($user);

        // Create a feature that was recently moved to implemented (5 days ago)
        $recentFeature = Feature::create([
            'jira_key' => 'FEA-200',
            'name' => 'Recent Implemented',
            'project_id' => $project->id,
        ]);
        
        // Transition to implemented and update the history timestamp
        $featureService = app(\App\Services\FeatureService::class);
        $featureService->updateStatus($recentFeature, 'approved');
        $featureService->updateStatus($recentFeature, 'implemented');
        
        // Update the last history entry's timestamp to 5 days ago
        $recentHistory = \App\Models\FeatureStateHistory::where('feature_id', $recentFeature->id)
            ->where('to_status', 'LIKE', '%Implemented%')
            ->latest('changed_at')
            ->first();
        $recentHistory->update(['changed_at' => now()->subDays(5)]);

        // Create a feature that was moved to implemented long ago (100 days ago)
        $oldFeature = Feature::create([
            'jira_key' => 'FEA-201',
            'name' => 'Old Implemented',
            'project_id' => $project->id,
        ]);
        
        // Transition to implemented and update the history timestamp
        $featureService->updateStatus($oldFeature, 'approved');
        $featureService->updateStatus($oldFeature, 'implemented');
        
        // Update the last history entry's timestamp to 100 days ago
        $oldHistory = \App\Models\FeatureStateHistory::where('feature_id', $oldFeature->id)
            ->where('to_status', 'LIKE', '%Implemented%')
            ->latest('changed_at')
            ->first();
        $oldHistory->update(['changed_at' => now()->subDays(100)]);

        // Test with 90 day filter - should show recent but not old
        $response = $this->actingAs($user)->get(route('features.board', ['closed_status_days' => '90'], false));

        $response->assertOk()
            ->assertInertia(fn (Assert $page) =>
                $page->component('features/board')
                    ->has('lanes')
                    ->where('filters.closed_status_days', '90')
            );

        // Verify the old feature is filtered out and recent is included
        $lanes = $response->viewData('page')['props']['lanes'];
        $implementedLane = collect($lanes)->firstWhere('key', 'implemented');
        $featureIds = collect($implementedLane['features'])->pluck('id')->toArray();
        
        $this->assertContains($recentFeature->id, $featureIds, 'Recent feature should be visible');
        $this->assertNotContains($oldFeature->id, $featureIds, 'Old feature should be hidden');
    }

    public function test_board_shows_all_features_when_filter_is_all(): void
    {
        [$tenant, $user] = $this->seedTenantAndUser();
        $project = $this->createProject($user);

        // Create a feature that was moved to rejected long ago
        $oldRejected = Feature::create([
            'jira_key' => 'FEA-202',
            'name' => 'Old Rejected',
            'project_id' => $project->id,
        ]);
        
        // Transition to rejected and update the history timestamp
        $featureService = app(\App\Services\FeatureService::class);
        $featureService->updateStatus($oldRejected, 'rejected');
        
        // Update the history entry's timestamp to 200 days ago
        $history = \App\Models\FeatureStateHistory::where('feature_id', $oldRejected->id)
            ->where('to_status', 'LIKE', '%Rejected%')
            ->latest('changed_at')
            ->first();
        $history->update(['changed_at' => now()->subDays(200)]);

        // Test with 'all' filter - should show everything
        $response = $this->actingAs($user)->get(route('features.board', ['closed_status_days' => 'all'], false));

        $response->assertOk()
            ->assertInertia(fn (Assert $page) =>
                $page->component('features/board')
                    ->has('lanes')
                    ->where('filters.closed_status_days', 'all')
            );

        // Verify the old feature is included
        $lanes = $response->viewData('page')['props']['lanes'];
        $rejectedLane = collect($lanes)->firstWhere('key', 'rejected');
        $featureIds = collect($rejectedLane['features'])->pluck('id')->toArray();
        
        $this->assertContains($oldRejected->id, $featureIds, 'Old rejected feature should be visible with "all" filter');
    }

    public function test_board_filter_persists_in_session(): void
    {
        [$tenant, $user] = $this->seedTenantAndUser();

        // First request with filter
        $this->actingAs($user)->get(route('features.board', ['closed_status_days' => '30'], false));

        // Second request without filter should use session value
        $response = $this->actingAs($user)->get(route('features.board', [], false));

        $response->assertOk()
            ->assertInertia(fn (Assert $page) =>
                $page->where('filters.closed_status_days', '30')
            );
    }

    private function seedTenantAndUser(): array
    {
        $tenant = \App\Models\Tenant::create(['name' => 'Test Tenant']);

        $user = User::factory()->create();
        $user->tenant_id = $tenant->id;
        $user->current_tenant_id = $tenant->id;
        $user->save();

        return [$tenant, $user];
    }
}
