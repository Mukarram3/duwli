<?php

namespace Workdo\Lead\Database\Seeders;

use Workdo\Lead\Models\UserLead;
use Workdo\Lead\Models\Lead;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoUserLeadSeeder extends Seeder
{
    public function run($userId): void
    {
        if (UserLead::where('user_id', $userId)->exists()) {
            return;
        }
        if (!empty($userId)) {
            $leads = Lead::where('created_by', $userId)->get();
            $users = User::where('created_by', $userId)->where('type', '!=', 'client')->pluck('id')->toArray();

            if ($leads->isEmpty()) {
                return;
            }

            if (empty($users)) {
                $users = [$userId];
            }

            foreach ($leads as $lead) {
                // Assign the primary user_id of the lead
                if (!empty($lead->user_id)) {
                    UserLead::firstOrCreate([
                        'user_id' => $lead->user_id,
                        'lead_id' => $lead->id,
                    ]);
                }

                // Assign 1-2 additional users (avoiding the primary user)
                $availableUsers = array_diff($users, [$lead->user_id, $userId]);

                if (!empty($availableUsers)) {
                    $randomUsers = collect($availableUsers)->shuffle()->take(rand(1, min(2, count($availableUsers))))->all();

                    foreach ($randomUsers as $additionalUserId) {
                        UserLead::firstOrCreate([
                            'user_id' => $additionalUserId,
                            'lead_id' => $lead->id,
                        ]);
                    }
                }

                // Always assign company user (userId)
                UserLead::firstOrCreate([
                    'user_id' => $userId,
                    'lead_id' => $lead->id,
                ]);
            }
        }
    }
}
