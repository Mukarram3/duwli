<?php

namespace Workdo\Stripe\Http\Controllers;

use App\Http\Controllers\Controller;
use Workdo\Stripe\Http\Requests\UpdateStripeSettingsRequest;
use Illuminate\Support\Facades\Auth;


class StripeSettingsController extends Controller
{
    public function update(UpdateStripeSettingsRequest $request)
    {
        if (Auth::user()->can('edit-stripe-settings')) {
            $validated = $request->validated();

            $settings = $validated['settings'];
            try {
                foreach ($settings as $key => $value) {
                    setSetting($key, $value, creatorId(), $key == "stripe_enabled");
                }

                return redirect()->back()->with('success', __('Stripe settings save successfully.'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', __('Failed to update stripe settings: ') . $e->getMessage());
            }           
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }
}