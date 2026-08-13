<?php

use Illuminate\Support\Facades\Route;
use Workdo\PaiementPro\Http\Controllers\PaiementProController;
use Workdo\PaiementPro\Http\Controllers\PaiementProSettingsController;

Route::middleware(['web', 'auth', 'verified', 'PlanModuleCheck:PaiementPro'])->group(function () {
    Route::post('/paiementpro/settings', [PaiementProSettingsController::class, 'update'])->name('paiementpro.settings.update');
});

Route::middleware(['web'])->group(function () {
    Route::prefix('paiementpro')->group(function () {
        Route::post('/plan/company/payment', [PaiementProController::class, 'planPayWithPaiementPro'])->name('payment.paiementpro.store')->middleware(['auth']);
        Route::get('/plan/company/status/{plan_id}', [PaiementProController::class, 'planGetPaiementProStatus'])->name('payment.paiementpro.status')->middleware(['auth']);
    });
});
