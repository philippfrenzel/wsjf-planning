<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\PlanningController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\FeatureController;
use App\Http\Controllers\FeatureDependencyController;
use App\Http\Controllers\FeatureStateHistoryController;
use App\Http\Controllers\VoteController;
use App\Http\Controllers\EstimationComponentController;
use App\Http\Controllers\FeatureImportController;
use App\Http\Controllers\EstimationController;
use App\Http\Controllers\CommitmentController;
use App\Http\Controllers\PlanController;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\TenantController;
use App\Http\Controllers\BillingController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\PiObjectiveController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\IterationController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/impressum', function () {
    return Inertia::render('legal/impressum');
})->name('imprint');

// Core feature routes — require active subscription or trial (ENF-01)
Route::middleware(['auth', 'verified', 'subscribed'])->group(function () {
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

    Route::resource('projects', ProjectController::class);
    Route::resource('plannings', PlanningController::class);
    Route::resource('teams', TeamController::class);
    Route::get('features/board', [FeatureController::class, 'board'])->name('features.board');
    Route::post('features/{feature}/status', [FeatureController::class, 'updateStatus'])->name('features.status.update');
    Route::get('features/lineage', [FeatureController::class, 'lineage'])->name('features.lineage');
    Route::resource('features', FeatureController::class);
    Route::get('api/features/state-history', [FeatureStateHistoryController::class, 'index'])
        ->name('api.features.state-history');
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

    // PI Objectives
    Route::post('pi-objectives', [PiObjectiveController::class, 'store'])->name('pi-objectives.store');
    Route::put('pi-objectives/{pi_objective}', [PiObjectiveController::class, 'update'])->name('pi-objectives.update');
    Route::delete('pi-objectives/{pi_objective}', [PiObjectiveController::class, 'destroy'])->name('pi-objectives.destroy');

    // Iterations
    Route::post('plannings/{planning}/iterations', [IterationController::class, 'store'])->name('plannings.iterations.store');
    Route::post('plannings/{planning}/iterations/generate', [IterationController::class, 'generate'])->name('plannings.iterations.generate');
    Route::put('iterations/{iteration}', [IterationController::class, 'update'])->name('iterations.update');
    Route::delete('iterations/{iteration}', [IterationController::class, 'destroy'])->name('iterations.destroy');

    // API-Route zum Laden von Features für ein Planning
    Route::post('api/planning-features', [CommitmentController::class, 'getFeaturesForPlanning'])
        ->name('api.planning-features');

    Route::post('plannings/{planning}/recalculate-commonvotes', [PlanningController::class, 'recalculateCommonVotes'])
        ->name('plannings.recalculate-commonvotes');

    Route::get('plannings/{planning}/export-csv', [PlanningController::class, 'exportCsv'])
        ->name('plannings.export-csv');
});

// Admin/Planner routes — one-click session start and other planner-level actions
Route::middleware(['auth', 'verified', 'role:Admin|Planner', 'subscribed'])->group(function () {
    Route::post('projects/{project}/quick-start-planning', [PlanningController::class, 'quickStart'])
        ->name('projects.quick-start-planning');
});

// Admin-only routes — SuperAdmin bypasses RequireSubscription before role check runs
Route::middleware(['auth', 'verified', 'role:Admin', 'subscribed'])->group(function () {
    Route::get('plannings/admin', [PlanningController::class, 'adminPlannings'])->name('plannings.admin');
    Route::post('plannings/{planning}/set-creator', [PlanningController::class, 'setCreator'])->name('plannings.set-creator');
    Route::post('tenants/{tenant}/invite', [TenantController::class, 'invite'])->name('tenants.invite');
    Route::delete('tenants/{tenant}/invitations/{invitation}', [TenantController::class, 'revokeInvitation'])->name('tenants.invitations.destroy');
    Route::patch('tenants/{tenant}/members/{user}', [TenantController::class, 'updateMemberRole'])->name('tenants.members.update');
    Route::delete('tenants/{tenant}/members/{user}', [TenantController::class, 'removeMember'])->name('tenants.members.destroy');
    Route::patch('tenants/{tenant}', [TenantController::class, 'update'])->name('tenants.update');
});

Route::get('/admin/users', [UserController::class, 'index'])->name('users.index')->middleware(['auth', 'role:Admin']);

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('plans', PlanController::class)->only(['index', 'create', 'store']);

    // Tenants: Übersicht, Wechsel, Einladungen
    Route::get('tenants', [TenantController::class, 'index'])->name('tenants.index');
    Route::post('tenants/{tenant}/switch', [TenantController::class, 'switch'])->name('tenants.switch');
});

Route::post('tenants/accept', [TenantController::class, 'accept'])->name('tenants.accept');

// Comments - available to authenticated users
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('comments', [CommentController::class, 'index'])->name('comments.index');
    Route::post('comments', [CommentController::class, 'store'])->name('comments.store');
    Route::get('comments/{comment}', [CommentController::class, 'show'])->name('comments.show');
    Route::put('comments/{comment}', [CommentController::class, 'update'])->name('comments.update');
    Route::delete('comments/{comment}', [CommentController::class, 'destroy'])->name('comments.destroy');
});

// Billing routes (auth + verified; NOT behind subscribed middleware)
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('billing', [BillingController::class, 'index'])->name('billing.index');
    Route::get('billing/checkout', [BillingController::class, 'checkout'])->name('billing.checkout');
    Route::get('billing/success', [BillingController::class, 'success'])->name('billing.success');
    Route::get('billing/portal', [BillingController::class, 'portal'])->name('billing.portal');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
