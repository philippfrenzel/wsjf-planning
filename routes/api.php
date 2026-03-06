<?php

use App\Http\Controllers\AiController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/ai/generate-description', [AiController::class, 'generateDescription']);
    Route::post('/ai/chat', [AiController::class, 'chat']);
});
