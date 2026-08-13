<?php

use Illuminate\Support\Facades\Route;
use Workdo\Ozow\Http\Controllers\OzowController;
use Workdo\Ozow\Http\Controllers\OzowSettingsController;

Route::middleware(['web', 'auth', 'verified', 'PlanModuleCheck:Ozow'])->group(function () {
    Route::post('/ozow/settings', [OzowSettingsController::class, 'update'])->name('ozow.settings.update');
});

Route::middleware(['web'])->group(function () {
    Route::prefix('ozow')->group(function () {
        Route::post('/plan/company/payment', [OzowController::class, 'planPayWithOzow'])->name('ozow.plan.pay')->middleware(['auth']);
        Route::get('/plan/company/status', [OzowController::class, 'planGetOzowStatus'])->name('ozow.plan.status')->middleware(['auth']);
    });
});
