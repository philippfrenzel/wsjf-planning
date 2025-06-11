<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_page_is_displayed_for_authenticated_user()
    {
        $user = User::factory()->create();
        Project::create([
            'project_number' => 'PRJ-001',
            'name' => 'Demo Projekt',
            'description' => 'Beschreibung',
            'start_date' => now()->toDateString(),
            'project_leader_id' => $user->id,
            'created_by' => $user->id,
        ]);

        $response = $this->actingAs($user)->get(route('projects.index', absolute: false));

        $response->assertOk();
    }

    public function test_project_can_be_created()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('projects.store', absolute: false), [
            'project_number' => 'PRJ-002',
            'name' => 'Neues Projekt',
            'description' => 'Test',
            'start_date' => now()->toDateString(),
            'project_leader_id' => $user->id,
            'deputy_leader_id' => null,
        ]);

        $response->assertRedirect(route('projects.index', absolute: false));

        $this->assertDatabaseHas('projects', [
            'project_number' => 'PRJ-002',
            'name' => 'Neues Projekt',
            'created_by' => $user->id,
        ]);
    }

    public function test_project_can_be_updated()
    {
        $user = User::factory()->create();
        $project = Project::create([
            'project_number' => 'PRJ-003',
            'name' => 'Altes Projekt',
            'description' => 'Alt',
            'start_date' => now()->toDateString(),
            'project_leader_id' => $user->id,
            'created_by' => $user->id,
        ]);

        $response = $this->actingAs($user)->put(route('projects.update', $project, false), [
            'project_number' => 'PRJ-003',
            'name' => 'Aktualisiertes Projekt',
            'description' => 'Neu',
            'start_date' => now()->toDateString(),
            'project_leader_id' => $user->id,
            'deputy_leader_id' => null,
        ]);

        $response->assertRedirect(route('projects.index', absolute: false));

        $this->assertDatabaseHas('projects', [
            'id' => $project->id,
            'name' => 'Aktualisiertes Projekt',
        ]);
    }

    public function test_project_can_be_deleted()
    {
        $user = User::factory()->create();
        $project = Project::create([
            'project_number' => 'PRJ-004',
            'name' => 'Zu löschen',
            'description' => 'Alt',
            'start_date' => now()->toDateString(),
            'project_leader_id' => $user->id,
            'created_by' => $user->id,
        ]);

        $response = $this->actingAs($user)->delete(route('projects.destroy', $project, false));

        $response->assertRedirect(route('projects.index', absolute: false));

        $this->assertModelMissing($project);
    }
}
