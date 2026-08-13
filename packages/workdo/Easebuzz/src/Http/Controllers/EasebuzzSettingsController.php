<?php

namespace Workdo\Easebuzz\Http\Controllers;

use App\Http\Controllers\Controller;
use Workdo\Easebuzz\Http\Requests\UpdateEasebuzzSettingsRequest;
use Illuminate\Support\Facades\Auth;

class EasebuzzSettingsController extends Controller
{
    public function update(UpdateEasebuzzSettingsRequest $request)
    {
        if (Auth::user()->can('edit-easebuzz-settings')) {
            $validated = $request->validated();

            $settings = $validated['settings'];
            try {
                foreach ($settings as $key => $value) {
                    setSetting($key, $value, creatorId(), $key == "easebuzz_enabled");
                }

                return redirect()->back()->with('success', __('Easebuzz settings save successfully.'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', __('Failed to update Easebuzz settings: ') . $e->getMessage());
            }
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }
}