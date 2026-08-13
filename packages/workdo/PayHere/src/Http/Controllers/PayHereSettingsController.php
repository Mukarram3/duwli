<?php

namespace Workdo\PayHere\Http\Controllers;

use App\Http\Controllers\Controller;
use Workdo\PayHere\Http\Requests\UpdatePayHereSettingsRequest;
use Illuminate\Support\Facades\Auth;

class PayHereSettingsController extends Controller
{
    public function update(UpdatePayHereSettingsRequest $request)
    {
        if (Auth::user()->can('edit-payhere-settings')) {
            $validated = $request->validated();

            $settings = $validated['settings'];
            try {
                foreach ($settings as $key => $value) {
                    setSetting($key, $value, creatorId(), $key == "payhere_enabled");
                }

                return redirect()->back()->with('success', __('PayHere settings save successfully.'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', __('Failed to update PayHere settings: ') . $e->getMessage());
            }
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }
}