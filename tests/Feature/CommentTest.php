<?php

namespace Tests\Feature;

use App\Models\Comment;
use App\Models\Feature;
use App\Models\User;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class CommentTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Tenant $tenant;
    protected Feature $feature;

    protected function setUp(): void
    {
        parent::setUp();

        // Create a tenant and user
        $this->tenant = Tenant::factory()->create();
        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'current_tenant_id' => $this->tenant->id,
        ]);

        // Create a feature to comment on
        $this->feature = Feature::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);
    }

    public function test_user_can_create_comment(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson(route('comments.store'), [
                'body' => 'This is a test comment',
                'commentable_type' => Feature::class,
                'commentable_id' => $this->feature->id,
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'body',
                    'user',
                    'created_at',
                    'is_owner',
                ],
                'message',
            ]);

        $this->assertDatabaseHas('comments', [
            'body' => 'This is a test comment',
            'user_id' => $this->user->id,
            'commentable_type' => Feature::class,
            'commentable_id' => $this->feature->id,
        ]);
    }

    public function test_user_can_reply_to_comment(): void
    {
        $parentComment = Comment::factory()->create([
            'user_id' => $this->user->id,
            'tenant_id' => $this->tenant->id,
            'commentable_type' => Feature::class,
            'commentable_id' => $this->feature->id,
        ]);

        $response = $this->actingAs($this->user)
            ->postJson(route('comments.store'), [
                'body' => 'This is a reply',
                'commentable_type' => Feature::class,
                'commentable_id' => $this->feature->id,
                'parent_id' => $parentComment->id,
            ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('comments', [
            'body' => 'This is a reply',
            'parent_id' => $parentComment->id,
        ]);
    }

    public function test_user_can_update_own_comment(): void
    {
        $comment = Comment::factory()->create([
            'user_id' => $this->user->id,
            'tenant_id' => $this->tenant->id,
            'body' => 'Original comment',
        ]);

        $response = $this->actingAs($this->user)
            ->putJson(route('comments.update', $comment), [
                'body' => 'Updated comment',
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('comments', [
            'id' => $comment->id,
            'body' => 'Updated comment',
        ]);
    }

    public function test_user_cannot_update_others_comment(): void
    {
        $otherUser = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'current_tenant_id' => $this->tenant->id,
        ]);

        $comment = Comment::factory()->create([
            'user_id' => $otherUser->id,
            'tenant_id' => $this->tenant->id,
        ]);

        $response = $this->actingAs($this->user)
            ->putJson(route('comments.update', $comment), [
                'body' => 'Trying to update',
            ]);

        $response->assertStatus(403);
    }

    public function test_user_can_delete_own_comment(): void
    {
        $comment = Comment::factory()->create([
            'user_id' => $this->user->id,
            'tenant_id' => $this->tenant->id,
        ]);

        $response = $this->actingAs($this->user)
            ->deleteJson(route('comments.destroy', $comment));

        $response->assertStatus(200);

        $this->assertSoftDeleted('comments', [
            'id' => $comment->id,
        ]);
    }

    public function test_user_cannot_delete_others_comment(): void
    {
        $otherUser = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'current_tenant_id' => $this->tenant->id,
        ]);

        $comment = Comment::factory()->create([
            'user_id' => $otherUser->id,
            'tenant_id' => $this->tenant->id,
        ]);

        $response = $this->actingAs($this->user)
            ->deleteJson(route('comments.destroy', $comment));

        $response->assertStatus(403);
    }

    public function test_can_get_comments_for_entity(): void
    {
        Comment::factory()->count(3)->create([
            'tenant_id' => $this->tenant->id,
            'commentable_type' => Feature::class,
            'commentable_id' => $this->feature->id,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson(route('comments.index', [
                'commentable_type' => Feature::class,
                'commentable_id' => $this->feature->id,
            ]));

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_comment_validation_requires_body(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson(route('comments.store'), [
                'commentable_type' => Feature::class,
                'commentable_id' => $this->feature->id,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['body']);
    }

    public function test_threaded_comments_are_loaded_with_replies(): void
    {
        $parentComment = Comment::factory()->create([
            'tenant_id' => $this->tenant->id,
            'commentable_type' => Feature::class,
            'commentable_id' => $this->feature->id,
        ]);

        Comment::factory()->count(2)->create([
            'tenant_id' => $this->tenant->id,
            'commentable_type' => Feature::class,
            'commentable_id' => $this->feature->id,
            'parent_id' => $parentComment->id,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson(route('comments.index', [
                'commentable_type' => Feature::class,
                'commentable_id' => $this->feature->id,
            ]));

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.replies', fn ($replies) => count($replies) === 2);
    }

    public function test_version_increments_on_comment_create(): void
    {
        $initialVersion = Cache::get('app.data.version', 1);

        $this->actingAs($this->user)
            ->postJson(route('comments.store'), [
                'body' => 'This is a test comment',
                'commentable_type' => Feature::class,
                'commentable_id' => $this->feature->id,
            ]);

        $newVersion = Cache::get('app.data.version', 1);
        $this->assertGreaterThan($initialVersion, $newVersion);
    }

    public function test_version_increments_on_comment_update(): void
    {
        $comment = Comment::factory()->create([
            'user_id' => $this->user->id,
            'tenant_id' => $this->tenant->id,
            'body' => 'Original comment',
        ]);

        $initialVersion = Cache::get('app.data.version', 1);

        $this->actingAs($this->user)
            ->putJson(route('comments.update', $comment), [
                'body' => 'Updated comment',
            ]);

        $newVersion = Cache::get('app.data.version', 1);
        $this->assertGreaterThan($initialVersion, $newVersion);
    }

    public function test_version_increments_on_comment_delete(): void
    {
        $comment = Comment::factory()->create([
            'user_id' => $this->user->id,
            'tenant_id' => $this->tenant->id,
        ]);

        $initialVersion = Cache::get('app.data.version', 1);

        $this->actingAs($this->user)
            ->deleteJson(route('comments.destroy', $comment));

        $newVersion = Cache::get('app.data.version', 1);
        $this->assertGreaterThan($initialVersion, $newVersion);
    }
}
