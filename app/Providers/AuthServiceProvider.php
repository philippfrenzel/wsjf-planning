<?php

namespace App\Providers;

use App\Models\Planning;
use App\Models\Feature;
use App\Models\Commitment;
use App\Models\Vote;
use App\Policies\PlanningPolicy;
use App\Policies\FeaturePolicy;
use App\Policies\CommitmentPolicy;
use App\Policies\VotePolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Planning::class => PlanningPolicy::class,
        Feature::class => FeaturePolicy::class,
        Commitment::class => CommitmentPolicy::class,
        Vote::class => VotePolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();
    }
}
