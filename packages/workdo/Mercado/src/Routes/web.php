<?php

use Illuminate\Support\Facades\Route;
use Workdo\Mercado\Http\Controllers\MercadoController;
use Workdo\Mercado\Http\Controllers\MercadoSettingsController;

Route::middleware(['web', 'auth', 'verified', 'PlanModuleCheck:Mercado'])->group(function () {
    Route::post('/mercado/settings', [MercadoSettingsController::class, 'update'])->name('mercado.settings.update');
});

Route::middleware(['web'])->group(function () {
    Route::prefix('mercado')->group(function () {
        Route::post('/plan/company/payment', [MercadoController::class, 'planPayWithMercado'])->name('mercado.plan.store')->middleware(['auth']);
        Route::get('/plan/company/status', [MercadoController::class, 'planGetMercadoStatus'])->name('mercado.plan.status')->middleware(['auth']);
    });
});
