<?php

namespace Workdo\Lead\Database\Seeders;

use App\Models\Notification;
use Illuminate\Database\Seeder;
use Illuminate\Database\Eloquent\Model;

class NotificationsTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        Model::unguard();

        $notifications = [
            'Lead Assign', 
            'Lead Move',

            'Deal Assign',
            'Deal Move',
            
            'Lead Emails',
            'Deal Emails'
        ];

        $permissions = [
            'manage-leads',
            'lead-move',

            'manage-deals',
            'deal-move',
             
            'edit-leads',
            'edit-deals',

        ];
        foreach($notifications as $key=>$n){
            $ntfy = Notification::where('action',$n)->where('type','mail')->where('module','Lead')->count();
            if($ntfy == 0){
                $new = new Notification();
                $new->action = $n;
                $new->status = 'on';
                $new->permissions = $permissions[$key];
                $new->module = 'Lead';
                $new->type = 'mail';
                $new->save();
            }
        }
    }
}
