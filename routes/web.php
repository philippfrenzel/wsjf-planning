<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\PlanningController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\FeatureController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

Route::resource('projects', ProjectController::class);
Route::resource('plannings', PlanningController::class);
Route::resource('features', FeatureController::class);
Route::resource('users', UserController::class);

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
