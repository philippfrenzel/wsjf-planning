<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\PlanningController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\FeatureController;
use App\Http\Controllers\FeatureDependencyController;
use App\Http\Controllers\VoteController;
use App\Http\Controllers\EstimationComponentController;
use App\Http\Controllers\FeatureImportController;
use App\Http\Controllers\EstimationController;
use App\Http\Controllers\CommitmentController;
use App\Http\Controllers\PlanController;
use App\Http\Controllers\SubscriptionController;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\TenantController;

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

    // Karten-basierte Voting Session
    Route::get('votes/card-session/{planning}', [VoteController::class, 'cardVoteSession'])->name('votes.card-session');

    // Schätzungskomponenten und Schätzungen
    Route::resource('estimation-components', EstimationComponentController::class);
    Route::resource('estimations', EstimationController::class);

    Route::put('estimation-components/{id}/archive', [EstimationComponentController::class, 'archive'])->name('estimation-components.archive');
    Route::put('estimation-components/{id}/activate', [EstimationComponentController::class, 'activate'])->name('estimation-components.activate');

    // Admin: Plannings-Übersicht und Ersteller setzen
    Route::get('plannings/admin', [PlanningController::class, 'adminPlannings'])->name('plannings.admin');
    Route::post('plannings/{planning}/set-creator', [PlanningController::class, 'setCreator'])->name('plannings.set-creator');
});

Route::resource('projects', ProjectController::class);
Route::resource('plannings', PlanningController::class);
Route::get('features/board', [FeatureController::class, 'board'])->name('features.board');
Route::post('features/{feature}/status', [FeatureController::class, 'updateStatus'])->name('features.status.update');
Route::get('features/lineage', [FeatureController::class, 'lineage'])->name('features.lineage');
Route::resource('features', FeatureController::class);
// Feature-Abhängigkeiten
Route::post('features/{feature}/dependencies', [FeatureDependencyController::class, 'store'])->name('features.dependencies.store');
Route::delete('features/{feature}/dependencies/{dependency}', [FeatureDependencyController::class, 'destroy'])->name('features.dependencies.destroy');
// Feature-Import (projektbezogen)
Route::get('projects/{project}/features/import', [FeatureImportController::class, 'create'])->name('projects.features.import');
Route::post('projects/{project}/features/import', [FeatureImportController::class, 'store'])->name('projects.features.import.store');
Route::resources([
    'votes' => VoteController::class,
    'commitments' => CommitmentController::class,
]);

// Zusätzliche Commitment-Routen
Route::get('plannings/{planning}/commitments', [CommitmentController::class, 'planningCommitments'])
    ->name('plannings.commitments');

// API-Route zum Laden von Features für ein Planning
Route::post('api/planning-features', [CommitmentController::class, 'getFeaturesForPlanning'])
    ->name('api.planning-features');

//Route::group(['middleware' => ['role:admin']], function () {
Route::get('/admin/users', [UserController::class, 'index'])->name('users.index');
// Weitere Admin-Routen...
//});

Route::post('plannings/{planning}/recalculate-commonvotes', [PlanningController::class, 'recalculateCommonVotes'])
    ->name('plannings.recalculate-commonvotes');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('plans', PlanController::class)->only(['index', 'create', 'store']);
    Route::get('subscribe', [SubscriptionController::class, 'create'])->name('subscriptions.create');
    Route::post('subscribe', [SubscriptionController::class, 'store'])->name('subscriptions.store');

    // Tenants: Übersicht, Wechsel, Einladungen
    Route::get('tenants', [TenantController::class, 'index'])->name('tenants.index');
    Route::post('tenants/{tenant}/switch', [TenantController::class, 'switch'])->name('tenants.switch');
    Route::post('tenants/{tenant}/invite', [TenantController::class, 'invite'])->name('tenants.invite');
});

Route::post('tenants/accept', [TenantController::class, 'accept'])->name('tenants.accept');

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
