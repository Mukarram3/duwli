<?php

use Workdo\Assets\Http\Controllers\AssetController;
use Workdo\Assets\Http\Controllers\CategoryController;
use Workdo\Assets\Http\Controllers\AssetAssignmentController;
use Workdo\Assets\Http\Controllers\AssetLocationController;
use Workdo\Assets\Http\Controllers\AssetMaintenanceController;
use Workdo\Assets\Http\Controllers\AssetDepreciationController;

use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth', 'verified', 'PlanModuleCheck:Assets'])->group(function () {

    Route::prefix('assets/categories')->name('assets.categories.')->group(function () {
        Route::get('/', [CategoryController::class, 'index'])->name('index');
        Route::post('/', [CategoryController::class, 'store'])->name('store');
        Route::put('/{category}', [CategoryController::class, 'update'])->name('update');
        Route::delete('/{category}', [CategoryController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('assets')->name('assets.assets.')->group(function () {
        Route::get('/', [AssetController::class, 'index'])->name('index');
        Route::post('/', [AssetController::class, 'store'])->name('store');
        Route::put('/{asset}', [AssetController::class, 'update'])->name('update');
        Route::delete('/{asset}', [AssetController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('assets/asset-assignments')->name('assets.asset-assignments.')->group(function () {
        Route::get('/', [AssetAssignmentController::class, 'index'])->name('index');
        Route::post('/', [AssetAssignmentController::class, 'store'])->name('store');
        Route::put('/{assetAssignment}', [AssetAssignmentController::class, 'update'])->name('update');
        Route::delete('/{assetAssignment}', [AssetAssignmentController::class, 'destroy'])->name('destroy');
        Route::put('/{assetAssignment}/return', [AssetAssignmentController::class, 'returnAsset'])->name('return');
        Route::get('/overdue', [AssetAssignmentController::class, 'overdue'])->name('overdue');
        Route::get('/available-assets', [AssetAssignmentController::class, 'getAvailableAssets'])->name('available-assets');
        Route::get('/users', [AssetAssignmentController::class, 'getUsers'])->name('users');
    });

    Route::prefix('assets/asset-locations')->name('assets.asset-locations.')->group(function () {
        Route::get('/', [AssetLocationController::class, 'index'])->name('index');
        Route::post('/', [AssetLocationController::class, 'store'])->name('store');
        Route::put('/{assetLocation}', [AssetLocationController::class, 'update'])->name('update');
        Route::delete('/{assetLocation}', [AssetLocationController::class, 'destroy'])->name('destroy');
        Route::get('/parent-locations', [AssetLocationController::class, 'getParentLocations'])->name('parent-locations');
    });

    Route::prefix('assets/asset-maintenance')->name('assets.asset-maintenance.')->group(function () {
        Route::get('/', [AssetMaintenanceController::class, 'index'])->name('index');
        Route::post('/', [AssetMaintenanceController::class, 'store'])->name('store');
        Route::put('/{assetMaintenance}', [AssetMaintenanceController::class, 'update'])->name('update');
        Route::delete('/{assetMaintenance}', [AssetMaintenanceController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('assets/asset-depreciation')->name('assets.asset-depreciation.')->group(function () {
        Route::get('/', [AssetDepreciationController::class, 'index'])->name('index');
        Route::post('/', [AssetDepreciationController::class, 'store'])->name('store');
        Route::put('/{assetDepreciation}', [AssetDepreciationController::class, 'update'])->name('update');
        Route::delete('/{assetDepreciation}', [AssetDepreciationController::class, 'destroy'])->name('destroy');
    });

});
