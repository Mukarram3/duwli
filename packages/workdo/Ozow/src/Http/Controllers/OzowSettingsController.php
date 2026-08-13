<?php

namespace Workdo\Ozow\Http\Controllers;

use App\Http\Controllers\Controller;
use Workdo\Ozow\Http\Requests\UpdateOzowSettingsRequest;
use Illuminate\Support\Facades\Auth;

class OzowSettingsController extends Controller
{
    public function update(UpdateOzowSettingsRequest $request)
    {
        if (Auth::user()->can('edit-ozow-settings')) {
            $validated = $request->validated();

            $settings = $validated['settings'];
            try {
                foreach ($settings as $key => $value) {
                    setSetting($key, $value, creatorId(), $key == "ozow_enabled");
                }

                return redirect()->back()->with('success', __('Ozow settings save successfully.'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', __('Failed to update Ozow settings: ') . $e->getMessage());
            }           
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }
}