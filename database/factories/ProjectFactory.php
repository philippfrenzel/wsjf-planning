<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Project>
 */
class ProjectFactory extends Factory
{
    protected $model = Project::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'project_number' => fake()->unique()->numerify('PRJ-####'),
            'name' => fake()->words(3, true),
            'description' => fake()->paragraph(),
            'jira_base_uri' => fake()->url(),
            'start_date' => fake()->dateTimeBetween('-1 year', '+1 year'),
            'project_leader_id' => User::factory(),
            'deputy_leader_id' => User::factory(),
            'created_by' => User::factory(),
            'status' => 'App\States\Project\InPlanning',
        ];
    }
}
