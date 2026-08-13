<?php

namespace Workdo\Khalti\Http\Controllers;

use App\Http\Controllers\Controller;
use Workdo\Khalti\Http\Requests\UpdateKhaltiSettingsRequest;
use Illuminate\Support\Facades\Auth;

class KhaltiSettingsController extends Controller
{
    public function update(UpdateKhaltiSettingsRequest $request)
    {
        if (Auth::user()->can('edit-khalti-settings')) {
            $validated = $request->validated();

            $settings = $validated['settings'];
            try {
                foreach ($settings as $key => $value) {
                    setSetting($key, $value, creatorId(), $key == "khalti_enabled");
                }

                return redirect()->back()->with('success', __('Khalti settings saved successfully.'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', __('Failed to update Khalti settings: '));
            }
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }
}
