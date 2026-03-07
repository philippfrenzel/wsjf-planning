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
use App\Http\Controllers\RiskController;
use App\Http\Controllers\CapacityController;
use App\Http\Controllers\DefinitionTemplateController;
use App\Http\Controllers\SkillController;
use App\Http\Controllers\RoadmapController;
use App\Http\Controllers\SuperAdminController;
use App\Http\Controllers\AiController;
use App\Http\Controllers\FeatureSpecificationController;
use App\Http\Controllers\FeaturePlanController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/impressum', function () {
    return Inertia::render('legal/impressum');
})->name('imprint');

Route::get('/docs/mcp', function () {
    return Inertia::render('docs/mcp');
})->name('docs.mcp');

Route::get('/docs/features', function () {
    return Inertia::render('docs/features');
})->name('docs.features');

Route::get('/sitemap.xml', function () {
    $urls = [
        ['loc' => url('/'), 'changefreq' => 'weekly', 'priority' => '1.0'],
        ['loc' => url('/docs/mcp'), 'changefreq' => 'weekly', 'priority' => '0.8'],
        ['loc' => url('/docs/features'), 'changefreq' => 'weekly', 'priority' => '0.8'],
        ['loc' => url('/impressum'), 'changefreq' => 'monthly', 'priority' => '0.3'],
        ['loc' => url('/login'), 'changefreq' => 'monthly', 'priority' => '0.5'],
        ['loc' => url('/register'), 'changefreq' => 'monthly', 'priority' => '0.7'],
    ];

    $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
    foreach ($urls as $u) {
        $xml .= '  <url>' . "\n";
        $xml .= '    <loc>' . htmlspecialchars($u['loc']) . '</loc>' . "\n";
        $xml .= '    <changefreq>' . $u['changefreq'] . '</changefreq>' . "\n";
        $xml .= '    <priority>' . $u['priority'] . '</priority>' . "\n";
        $xml .= '  </url>' . "\n";
    }
    $xml .= '</urlset>';

    return response($xml, 200, ['Content-Type' => 'application/xml']);
})->name('sitemap');

// Core feature routes — require active subscription or trial (ENF-01)
Route::middleware(['auth', 'verified', 'subscribed'])->group(function () {
    // Dashboard-Route auf den neuen DashboardController umleiten
    Route::get('dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');

    // AI Assistant routes
    Route::post('/ai/generate-description', [AiController::class, 'generateDescription'])->name('ai.generate-description');
    Route::post('/ai/chat', [AiController::class, 'chat'])->name('ai.chat');

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
    Route::put('teams/{team}/member-skills', [TeamController::class, 'updateMemberSkills'])->name('teams.member-skills.update');
    Route::resource('skills', SkillController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::post('skills/seed-defaults', [SkillController::class, 'seedDefaults'])->name('skills.seed-defaults');
    Route::get('features/board', [FeatureController::class, 'board'])->name('features.board');
    Route::post('features/{feature}/status', [FeatureController::class, 'updateStatus'])->name('features.status.update');
    Route::get('features/lineage', [FeatureController::class, 'lineage'])->name('features.lineage');
    Route::resource('features', FeatureController::class);
    Route::get('api/features/state-history', [FeatureStateHistoryController::class, 'index'])
        ->name('api.features.state-history');

    // Feature Specification
    Route::post('features/{feature}/specification', [FeatureSpecificationController::class, 'store'])->name('features.specification.store');
    Route::put('features/{feature}/specification', [FeatureSpecificationController::class, 'update'])->name('features.specification.update');
    Route::post('features/{feature}/specification/regenerate', [FeatureSpecificationController::class, 'regenerate'])->name('features.specification.regenerate');
    Route::get('features/{feature}/specification/versions', [FeatureSpecificationController::class, 'versions'])->name('features.specification.versions');

    // Feature Plans
    Route::post('features/{feature}/plans/generate', [FeaturePlanController::class, 'generate'])->name('features.plans.generate');
    Route::put('feature-plans/{plan}', [FeaturePlanController::class, 'update'])->name('feature-plans.update');
    Route::post('feature-plans/{plan}/status', [FeaturePlanController::class, 'updateStatus'])->name('feature-plans.status');

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

    // Risks (ROAM)
    Route::post('risks', [RiskController::class, 'store'])->name('risks.store');
    Route::put('risks/{risk}', [RiskController::class, 'update'])->name('risks.update');
    Route::delete('risks/{risk}', [RiskController::class, 'destroy'])->name('risks.destroy');

    // Program Board: assign feature to team/iteration
    Route::put('plannings/{planning}/features/{feature}/assign', [PlanningController::class, 'assignFeature'])
        ->name('plannings.assign-feature');

    // Capacity management
    Route::post('plannings/{planning}/capacities', [CapacityController::class, 'upsert'])
        ->name('plannings.capacities.upsert');

    // Definition of Ready / Definition of Done checklists
    Route::get('definitions', [DefinitionTemplateController::class, 'index'])->name('definitions.index');
    Route::post('definitions', [DefinitionTemplateController::class, 'store'])->name('definitions.store');
    Route::put('definitions/{definitionTemplate}', [DefinitionTemplateController::class, 'update'])->name('definitions.update');
    Route::delete('definitions/{definitionTemplate}', [DefinitionTemplateController::class, 'destroy'])->name('definitions.destroy');

    // Roadmap
    Route::get('roadmap', [RoadmapController::class, 'index'])->name('roadmap.index');

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

// SuperAdmin-only routes
Route::middleware(['auth', 'role:SuperAdmin'])->prefix('admin')->group(function () {
    Route::get('licenses', [SuperAdminController::class, 'licenses'])->name('admin.licenses');
    Route::patch('licenses/{tenant}', [SuperAdminController::class, 'updateSponsor'])->name('admin.licenses.update');
    Route::post('licenses/domain', [SuperAdminController::class, 'sponsorDomain'])->name('admin.licenses.domain');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('plans', PlanController::class)->only(['index', 'create', 'store']);

    // Tenants: Übersicht, Wechsel, Einladungen
    Route::get('tenants', [TenantController::class, 'index'])->name('tenants.index');
    Route::get('tenants/general', [TenantController::class, 'general'])->name('tenants.general');
    Route::get('tenants/members', [TenantController::class, 'members'])->name('tenants.members');
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
