<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\PlanningController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\FeatureController;
use App\Http\Controllers\VoteController;
use App\Http\Controllers\EstimationComponentController;
use App\Http\Controllers\EstimationController;
use Illuminate\Support\Facades\Auth;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard-Route auf den neuen DashboardController umleiten
    Route::get('dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');

    // Weiterleitung, wenn keine Planning-ID übergeben wird
    Route::get('votes/session', function () {
        $user = Auth::user();
        $planning = \App\Models\Planning::whereHas('stakeholders', function ($q) use ($user) {
            $q->where('users.id', $user->id);
        })
            ->latest('created_at')
            ->first();

        if ($planning) {
            return redirect()->route('votes.session', $planning->id);
        }
        abort(404, 'Kein gültiges Planning für diesen Nutzer gefunden.');
    });

    // Voting Session mit Planning-ID
    Route::get('votes/session/{planning}', [VoteController::class, 'voteSession'])->name('votes.session');
    Route::post('votes/session/{planning}', [VoteController::class, 'voteSessionStore'])->name('votes.session.store');

    // Schätzungskomponenten und Schätzungen
    Route::resource('estimation-components', EstimationComponentController::class);
    Route::resource('estimations', EstimationController::class);

    Route::put('estimation-components/{id}/archive', [EstimationComponentController::class, 'archive'])->name('estimation-components.archive');
    Route::put('estimation-components/{id}/activate', [EstimationComponentController::class, 'activate'])->name('estimation-components.activate');
});

Route::resource('projects', ProjectController::class);
Route::resource('plannings', PlanningController::class);
Route::resource('features', FeatureController::class);
Route::resource('users', UserController::class);
Route::resources([
    'votes' => VoteController::class,
]);

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
