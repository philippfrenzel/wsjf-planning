<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\Estimation;
use App\Observers\EstimationObserver;
use Spatie\Permission\PermissionRegistrar;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Spatie Permission Services registrieren
        $this->app->singleton(PermissionRegistrar::class, function ($app) {
            return new PermissionRegistrar($app);
        });

        // Alias für den vereinfachten Zugriff
        $this->app->alias(PermissionRegistrar::class, 'permission.registration');
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Permission Cache leeren beim Starten der Anwendung (optional)
        $this->app->make(PermissionRegistrar::class)->forgetCachedPermissions();

        Estimation::observe(EstimationObserver::class);
    }
}
