<?php

use Illuminate\Support\Facades\Route;
use Workdo\Easebuzz\Http\Controllers\EasebuzzController;
use Workdo\Easebuzz\Http\Controllers\EasebuzzSettingsController;

Route::middleware(['web', 'auth', 'verified', 'PlanModuleCheck:Easebuzz'])->group(function () {
    Route::post('/easebuzz/settings', [EasebuzzSettingsController::class, 'update'])->name('easebuzz.settings.update');
});

Route::middleware(['web'])->group(function () {
    Route::prefix('easebuzz')->group(function () {
        Route::post('/plan/company/payment', [EasebuzzController::class, 'planPayWithEasebuzz'])->name('easebuzz.plan.pay')->middleware(['auth']);
        Route::match(['get', 'post'], '/plan/company/status', [EasebuzzController::class, 'planGetEasebuzzStatus'])->name('easebuzz.plan.status')->middleware(['auth']);
    });
});
