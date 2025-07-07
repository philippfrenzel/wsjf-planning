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
use App\Http\Controllers\CommitmentController;
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

    // Admin: Plannings-Übersicht und Ersteller setzen
    Route::get('plannings/admin', [PlanningController::class, 'adminPlannings'])->name('plannings.admin');
    Route::post('plannings/{planning}/set-creator', [PlanningController::class, 'setCreator'])->name('plannings.set-creator');
});

Route::resource('projects', ProjectController::class);
Route::resource('plannings', PlanningController::class);
Route::resource('features', FeatureController::class);
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

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
