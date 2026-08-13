<?php

use Illuminate\Support\Facades\Route;
use Workdo\Khalti\Http\Controllers\KhaltiSettingsController;
use Workdo\Khalti\Http\Controllers\KhaltiController;

Route::middleware(['web', 'auth', 'verified', 'PlanModuleCheck:Khalti'])->group(function () {
    Route::post('/khalti/settings', [KhaltiSettingsController::class, 'update'])->name('khalti.settings.update');
});

Route::middleware(['web'])->group(function () {
    Route::prefix('khalti')->group(function () {
        Route::post('/plan/company/payment', [KhaltiController::class, 'planPayWithKhalti'])->name('khalti.plan.pay')->middleware(['auth']);
        Route::get('/plan/company/status', [KhaltiController::class, 'planGetKhaltiStatus'])->name('khalti.plan.status')->middleware(['auth']);
    });
});
