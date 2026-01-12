<?php

namespace Database\Factories;

use App\Models\Feature;
use App\Models\User;
use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Feature>
 */
class FeatureFactory extends Factory
{
    protected $model = Feature::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'jira_key' => fake()->unique()->bothify('FEAT-####'),
            'name' => fake()->sentence(),
            'description' => fake()->paragraph(),
            'requester_id' => User::factory(),
            'project_id' => Project::factory(),
            'status' => 'App\States\Feature\InPlanning',
        ];
    }
}
