<?php
// packages/workdo/Account/src/Providers/AccountServiceProvider.php

namespace Workdo\Account\Providers;

use Illuminate\Support\ServiceProvider;
use Workdo\Account\Console\CheckJournalSetup;
use Workdo\Account\Console\LinkCustomers;
use Workdo\Account\Console\CheckAccountingSetup;

class AccountServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $routesPath = __DIR__.'/../Routes/web.php';
        if (file_exists($routesPath)) {
            $this->loadRoutesFrom($routesPath);
        }

        $migrationsPath = __DIR__.'/../Database/Migrations';
        if (is_dir($migrationsPath)) {
            $this->loadMigrationsFrom($migrationsPath);
        }

        if ($this->app->runningInConsole()) {
            $this->commands([
                CheckJournalSetup::class,
                LinkCustomers::class,
                CheckAccountingSetup::class,
            ]);
        }
    }

    public function register(): void
    {
        $this->app->register(EventServiceProvider::class);
    }
}
