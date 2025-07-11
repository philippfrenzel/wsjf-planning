<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Project;
use App\Models\Feature;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

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
}
