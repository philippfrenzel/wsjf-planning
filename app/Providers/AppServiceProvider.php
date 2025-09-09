<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;
use App\Models\Estimation;
use App\Observers\EstimationObserver;
use Spatie\Permission\PermissionRegistrar;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void {}

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Estimation::observe(EstimationObserver::class);

        // Force HTTPS in production
        if (config('app.env') !== 'local') {
            URL::forceScheme('https');
        }
    }
}
