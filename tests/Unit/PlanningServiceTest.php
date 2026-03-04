<?php

namespace Tests\Unit;

use App\Models\Feature;
use App\Models\Planning;
use App\Models\Project;
use App\Models\Tenant;
use App\Models\User;
use App\Services\PlanningService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlanningServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_creates_planning_and_syncs_relations(): void
    {
        [$tenant, $user] = $this->seedTenantAndUser();
        $this->actingAs($user);

        $project = Project::factory()->create([
            'tenant_id' => $tenant->id,
            'created_by' => $user->id,
            'project_leader_id' => $user->id,
            'deputy_leader_id' => $user->id,
        ]);

        $stakeholders = User::factory()->count(2)->create([
            'tenant_id' => $tenant->id,
            'current_tenant_id' => $tenant->id,
        ]);

        $features = Feature::factory()->count(2)->create([
            'project_id' => $project->id,
            'tenant_id' => $tenant->id,
        ]);

        $service = app(PlanningService::class);
        $planning = $service->create(
            [
                'project_id' => $project->id,
                'title' => 'Quick Planning',
                'created_by' => $user->id,
                'tenant_id' => $tenant->id,
            ],
            $stakeholders->pluck('id')->all(),
            $features->pluck('id')->all(),
        );

        $this->assertDatabaseHas('plannings', [
            'id' => $planning->id,
            'title' => 'Quick Planning',
        ]);
        $this->assertEqualsCanonicalizing(
            $stakeholders->pluck('id')->all(),
            $planning->stakeholders()->pluck('users.id')->all(),
        );
        $this->assertEqualsCanonicalizing(
            $features->pluck('id')->all(),
            $planning->features()->pluck('features.id')->all(),
        );
    }

    public function test_update_replaces_synced_stakeholders_and_features(): void
    {
        [$tenant, $user] = $this->seedTenantAndUser();
        $this->actingAs($user);

        $project = Project::factory()->create([
            'tenant_id' => $tenant->id,
            'created_by' => $user->id,
            'project_leader_id' => $user->id,
            'deputy_leader_id' => $user->id,
        ]);

        $planning = Planning::create([
            'project_id' => $project->id,
            'title' => 'Original Planning',
            'created_by' => $user->id,
            'tenant_id' => $tenant->id,
        ]);

        $oldStakeholder = User::factory()->create([
            'tenant_id' => $tenant->id,
            'current_tenant_id' => $tenant->id,
        ]);
        $newStakeholder = User::factory()->create([
            'tenant_id' => $tenant->id,
            'current_tenant_id' => $tenant->id,
        ]);

        $oldFeature = Feature::factory()->create([
            'project_id' => $project->id,
            'tenant_id' => $tenant->id,
        ]);
        $newFeature = Feature::factory()->create([
            'project_id' => $project->id,
            'tenant_id' => $tenant->id,
        ]);

        $planning->stakeholders()->sync([$oldStakeholder->id]);
        $planning->features()->sync([$oldFeature->id]);

        $service = app(PlanningService::class);
        $service->update(
            $planning,
            ['title' => 'Updated Planning'],
            [$newStakeholder->id],
            [$newFeature->id],
        );

        $planning->refresh();

        $this->assertSame('Updated Planning', $planning->title);
        $this->assertEquals([$newStakeholder->id], $planning->stakeholders()->pluck('users.id')->all());
        $this->assertEquals([$newFeature->id], $planning->features()->pluck('features.id')->all());
    }

    private function seedTenantAndUser(): array
    {
        $tenant = Tenant::create(['name' => 'Test Tenant']);

        $user = User::factory()->create([
            'email_verified_at' => now(),
            'tenant_id' => $tenant->id,
            'current_tenant_id' => $tenant->id,
        ]);

        return [$tenant, $user];
    }
}
