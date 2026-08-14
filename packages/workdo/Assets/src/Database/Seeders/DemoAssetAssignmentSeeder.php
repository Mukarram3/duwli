<?php

namespace Workdo\Assets\Database\Seeders;

use Illuminate\Database\Seeder;
use Workdo\Assets\Models\AssetAssignment;
use Workdo\Assets\Models\Asset;
use App\Models\User;

class DemoAssetAssignmentSeeder extends Seeder
{
    public function run($userId): void
    {
        if (AssetAssignment::where('created_by', $userId)->exists()) {
            return;
        }
        
        $assets = Asset::where('created_by', $userId)->limit(10)->get();
        $users = User::where('created_by', $userId)->where('type', '!=', 'super admin')->limit(5)->get();

        if ($assets->isEmpty() || $users->isEmpty()) {
            return;
        }

        $assignments = [
            ['assigned_date' => '2024-01-20', 'expected_return_date' => '2024-12-31', 'condition_on_assignment' => 'excellent', 'assignment_notes' => 'Assigned for daily work use', 'status' => 'active'],
            ['assigned_date' => '2024-02-01', 'expected_return_date' => '2024-11-30', 'condition_on_assignment' => 'good', 'assignment_notes' => 'Temporary assignment for project', 'status' => 'active'],
            ['assigned_date' => '2024-01-15', 'expected_return_date' => '2024-06-30', 'condition_on_assignment' => 'excellent', 'assignment_notes' => 'Long-term assignment', 'status' => 'active'],
            ['assigned_date' => '2024-03-01', 'expected_return_date' => '2024-09-30', 'condition_on_assignment' => 'good', 'assignment_notes' => 'Field work equipment', 'status' => 'active'],
            ['assigned_date' => '2024-02-15', 'expected_return_date' => '2024-08-15', 'condition_on_assignment' => 'fair', 'assignment_notes' => 'Replacement device', 'status' => 'active'],
            ['assigned_date' => '2023-12-01', 'expected_return_date' => '2024-03-01', 'returned_date' => '2024-02-28', 'condition_on_assignment' => 'excellent', 'condition_on_return' => 'good', 'assignment_notes' => 'Short-term project', 'return_notes' => 'Returned in good condition', 'status' => 'returned'],
            ['assigned_date' => '2024-01-10', 'expected_return_date' => '2024-04-10', 'condition_on_assignment' => 'good', 'assignment_notes' => 'Training equipment', 'status' => 'active'],
            ['assigned_date' => '2024-02-20', 'expected_return_date' => '2024-10-20', 'condition_on_assignment' => 'excellent', 'assignment_notes' => 'Department head assignment', 'status' => 'active'],
        ];

        foreach ($assignments as $index => $assignment) {
            $assetIndex = $index % $assets->count();
            $userIndex = $index % $users->count();

            AssetAssignment::create(array_merge($assignment, [
                'asset_id' => $assets[$assetIndex]->id,
                'user_id' => $users[$userIndex]->id,
                'assigned_by' => $userId,
                'returned_by' => isset($assignment['returned_date']) ? $userId : null,
                'creator_id' => $userId,
                'created_by' => $userId,
            ]));
        }
    }
}
