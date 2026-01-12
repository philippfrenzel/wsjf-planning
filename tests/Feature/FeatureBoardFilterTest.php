<?php

namespace Tests\Feature;

use App\Models\Feature;
use App\Models\FeatureStateHistory;
use App\Models\Project;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FeatureBoardFilterTest extends TestCase
{
    use RefreshDatabase;

    private function createTenantAndUser(): array
    {
        $tenant = Tenant::create(['name' => 'Test Tenant']);
        $user = User::factory()->create();
        $user->tenant_id = $tenant->id;
        $user->current_tenant_id = $tenant->id;
        $user->save();

        return [$tenant, $user];
    }

    private function createProject(User $user): Project
    {
        return Project::create([
            'project_number' => 'PRJ-' . uniqid(),
            'name' => 'Test Project',
            'description' => 'Description',
            'start_date' => now()->toDateString(),
            'project_leader_id' => $user->id,
            'created_by' => $user->id,
        ]);
    }

    public function test_filter_scope_excludes_old_closed_features(): void
    {
        [$tenant, $user] = $this->createTenantAndUser();
        $this->actingAs($user);
        
        $project = $this->createProject($user);

        // Create a feature in planning (should always be visible)
        $featureInPlanning = Feature::create([
            'jira_key' => 'PLAN-1',
            'name' => 'In Planning',
            'project_id' => $project->id,
        ]);

        // Create a recently implemented feature
        $recentFeature = Feature::create([
            'jira_key' => 'RECENT-1',
            'name' => 'Recent',
            'project_id' => $project->id,
        ]);
        
        // Manually set status (this will trigger observer to create history)
        $recentFeature->status = 'App\\States\\Feature\\Implemented';
        $recentFeature->save();
        
        // Update the automatically created history entry
        $recentHistory = FeatureStateHistory::where('feature_id', $recentFeature->id)
            ->where('to_status', 'App\\States\\Feature\\Implemented')
            ->first();
        $recentHistory->update(['changed_at' => now()->subDays(5)]);

        // Create an old implemented feature
        $oldFeature = Feature::create([
            'jira_key' => 'OLD-1',
            'name' => 'Old',
            'project_id' => $project->id,
        ]);
        
        $oldFeature->status = 'App\\States\\Feature\\Implemented';
        $oldFeature->save();
        
        // Update the automatically created history entry
        $oldHistory = FeatureStateHistory::where('feature_id', $oldFeature->id)
            ->where('to_status', 'App\\States\\Feature\\Implemented')
            ->first();
        $oldHistory->update(['changed_at' => now()->subDays(100)]);

        // Test the scope
        $filteredFeatures = Feature::filterClosedByDays(90)->get();

        // Should include in-planning and recent, but not old
        $this->assertTrue($filteredFeatures->contains('id', $featureInPlanning->id));
        $this->assertTrue($filteredFeatures->contains('id', $recentFeature->id));
        $this->assertFalse($filteredFeatures->contains('id', $oldFeature->id));
    }

    public function test_filter_scope_with_null_shows_all(): void
    {
        [$tenant, $user] = $this->createTenantAndUser();
        $this->actingAs($user);
        
        $project = $this->createProject($user);

        $oldFeature = Feature::create([
            'jira_key' => 'OLD-2',
            'name' => 'Very Old',
            'project_id' => $project->id,
        ]);
        
        $oldFeature->status = 'App\\States\\Feature\\Implemented';
        $oldFeature->save();
        
        // Update the automatically created history entry
        $oldHistory = FeatureStateHistory::where('feature_id', $oldFeature->id)
            ->where('to_status', 'App\\States\\Feature\\Implemented')
            ->first();
        $oldHistory->update(['changed_at' => now()->subYears(5)]);

        // With null (all), should include everything
        $allFeatures = Feature::filterClosedByDays(null)->get();
        $this->assertTrue($allFeatures->contains('id', $oldFeature->id));
    }
}
