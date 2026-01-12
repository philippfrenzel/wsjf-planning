<?php

namespace Database\Factories;

use App\Models\Comment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Comment>
 */
class CommentFactory extends Factory
{
    protected $model = Comment::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'body' => fake()->paragraph(),
            'commentable_type' => 'App\Models\Feature',
            'commentable_id' => 1,
            'parent_id' => null,
        ];
    }

    /**
     * Indicate that the comment is a reply to another comment.
     */
    public function reply(?int $parentId = null): static
    {
        return $this->state(fn (array $attributes) => [
            'parent_id' => $parentId ?? Comment::factory(),
        ]);
    }
}
