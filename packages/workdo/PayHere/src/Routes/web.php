<?php

use Illuminate\Support\Facades\Route;
use Workdo\PayHere\Http\Controllers\PayHereController;
use Workdo\PayHere\Http\Controllers\PayHereSettingsController;

Route::middleware(['web', 'auth', 'verified', 'PlanModuleCheck:PayHere'])->group(function () {
    Route::post('/payhere/settings', [PayHereSettingsController::class, 'update'])->name('payhere.settings.update');
});

Route::middleware(['web'])->group(function () {
    Route::prefix('payhere')->group(function () {
        Route::post('/plan/company/payment', [PayHereController::class, 'planPayWithPayHere'])->name('payhere.plan.pay')->middleware(['auth']);
        Route::get('/plan/company/status', [PayHereController::class, 'planGetPayHereStatus'])->name('payhere.plan.status')->middleware(['auth']);
    });
});
