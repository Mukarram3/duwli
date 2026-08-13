<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class UpdaterController extends Controller
{
    public function index()
    {
        if (!Auth::user()->hasRole('superadmin')) {
            abort(403, 'Unauthorized access');
        }

        $pendingData = $this->getPendingMigrations();
        $pendingMigrations = array_column($pendingData, 'migration');
        
        // Extract unique package names that have pending migrations
        $updatedModules = array_unique(array_filter(array_column($pendingData, 'package')));
        
        $newPackages = $this->getNewPackages();
        $hasUpdates = (count($pendingMigrations) > 0 || count($newPackages) > 0);

        return Inertia::render('Updater/Index', [
            'hasUpdates' => $hasUpdates,
            'pendingMigrations' => $pendingMigrations,
            'newPackages' => $newPackages,
            'updatedModules' => array_values($updatedModules)
        ]);
    }

    public function update(Request $request)
    {
        if (!Auth::user()->hasRole('superadmin')) {
            return response()->json(['success' => false, 'message' => 'Unauthorized access'], 403);
        }

        try {
            $pendingData = $this->getPendingMigrations();
            $updatedModules = array_unique(array_filter(array_column($pendingData, 'package')));

            // 1. Run migrations (Core + All Packages)
            Artisan::call('migrate', ['--force' => true]);

            // 2. Install detected NEW packages (discovery)
            $newPackages = $this->getNewPackages();
            foreach ($newPackages as $moduleName) {
                $this->enableModule($moduleName);
            }

            // 3. Run seeders for EXISTING packages that were updated
            foreach ($updatedModules as $moduleName) {
                // Skip if it's already handled in newPackages loop to avoid double seeding
                if (!in_array($moduleName, $newPackages)) {
                    Artisan::call('package:seed ' . $moduleName);
                }
            }

            // 4. Core seeders
            Artisan::call('db:seed', ['--force' => true]);

            // Clear caches
            Artisan::call('config:clear');
            Artisan::call('route:clear');
            Artisan::call('view:clear');

            // Update installed file
            $this->updateInstalledFile();

            return response()->json([
                'success' => true,
                'message' => 'System updated successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Update failed: ' . $e->getMessage()
            ]);
        }
    }

    private function getPendingMigrations()
    {
        try {
            $allMigrations = [];

            // Core migrations
            $files = glob(database_path('migrations') . '/*.php');
            foreach ($files as $file) {
                $allMigrations[] = [
                    'migration' => basename($file, '.php'),
                    'package' => null // 'Base' migrations
                ];
            }

            // Package migrations
            $packageDirs = glob(base_path('packages/workdo/*/src/Database/Migrations'), GLOB_ONLYDIR);
            foreach ($packageDirs as $dir) {
                // Extract package name from path: .../packages/workdo/{PackageName}/src/...
                $parts = explode(DIRECTORY_SEPARATOR, $dir);
                $packageIndex = array_search('workdo', $parts);
                $moduleName = ($packageIndex !== false && isset($parts[$packageIndex + 1])) ? $parts[$packageIndex + 1] : null;

                $files = glob($dir . '/*.php');
                foreach ($files as $file) {
                    $allMigrations[] = [
                        'migration' => basename($file, '.php'),
                        'package' => $moduleName
                    ];
                }
            }

            // Get ran migrations from database
            $ranMigrations = DB::table('migrations')->pluck('migration')->toArray();

            // Find pending migrations
            $pendingMigrations = [];
            foreach ($allMigrations as $item) {
                if (!in_array($item['migration'], $ranMigrations)) {
                    $pendingMigrations[] = $item;
                }
            }

            return $pendingMigrations;
        } catch (\Exception $e) {
            return [];
        }
    }

    private function getNewPackages()
    {
        $newPackages = [];
        $modules = $this->getAllAvailableModules();
        $existingModules = \App\Models\AddOn::pluck('module')->toArray();

        foreach ($modules as $module) {
            if (!in_array($module['name'], $existingModules)) {
                $newPackages[] = $module['name'];
            }
        }
        return $newPackages;
    }

    private function getAllAvailableModules()
    {
        $modules = [];
        $packagesPath = base_path('packages/workdo');

        if (!File::exists($packagesPath)) {
            return $modules;
        }

        $directories = File::directories($packagesPath);

        foreach ($directories as $directory) {
            $moduleName = basename($directory);
            $moduleJsonPath = "{$directory}/module.json";

            if (File::exists($moduleJsonPath)) {
                $moduleData = json_decode(File::get($moduleJsonPath), true);
                if ($moduleData) {
                    $modules[] = [
                        'name' => $moduleData['name'],
                        'alias' => $moduleData['alias'],
                        'description' => $moduleData['description'] ?? '',
                        'priority' => $moduleData['priority'] ?? 10,
                    ];
                }
            }
        }

        usort($modules, function ($a, $b) {
            return $a['priority'] - $b['priority'];
        });

        return $modules;
    }

    private function enableModule($moduleName)
    {
        // Validate module name to prevent path traversal
        if (!preg_match('/^[a-zA-Z0-9_-]+$/', $moduleName)) {
            throw new \Exception('Invalid module name');
        }

        $addon = \App\Models\AddOn::where('module', $moduleName)->first();
        if (empty($addon)) {
            $filePath = base_path('packages/workdo/' . $moduleName . '/module.json');

            if (!File::exists($filePath)) {
                throw new \Exception('Module configuration not found');
            }

            $jsonContent = File::get($filePath);
            $data = json_decode($jsonContent, true);

            if (!$data) {
                throw new \Exception('Invalid module configuration');
            }

            Artisan::call('migrate --path=/packages/workdo/' . $moduleName . '/src/Database/Migrations --force');
            Artisan::call('package:seed ' . $moduleName);

            $addon = new \App\Models\AddOn;
            $addon->module = $data['name'];
            $addon->name = $data['alias'];
            $addon->monthly_price = $data['monthly_price'] ?? 0;
            $addon->yearly_price = $data['yearly_price'] ?? 0;
            $addon->package_name = $data['package_name'] ?? null;
            $addon->for_admin = $data['for_admin'] ?? false;
            $addon->priority = $data['priority'] ?? 0;

            $addon->is_enable = 1;
            $addon->save();
        } else {
            Artisan::call('migrate --path=/packages/workdo/' . $moduleName . '/src/Database/Migrations --force');
            Artisan::call('package:seed ' . $moduleName);
            $addon->save();
        }
    }

    private function updateInstalledFile()
    {
        try {
            $installedPath = storage_path('installed');
            $existingContent = '';

            if (File::exists($installedPath)) {
                $existingContent = File::get($installedPath) . "\n";
            }

            $newContent = $existingContent . 'update ' . date('Y-m-d H:i:s');
            File::put($installedPath, $newContent);
        } catch (\Exception $e) {
            // Ignore errors in updating installed file
        }
    }
}