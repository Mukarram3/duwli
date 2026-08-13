<?php

namespace Workdo\PaiementPro\Http\Controllers;

use App\Http\Controllers\Controller;
use Workdo\PaiementPro\Http\Requests\UpdatePaiementProSettingsRequest;
use Illuminate\Support\Facades\Auth;

class PaiementProSettingsController extends Controller
{
    public function update(UpdatePaiementProSettingsRequest $request)
    {
        if (Auth::user()->can('edit-paiement-pro-settings')) {
            $validated = $request->validated();

            $settings = $validated['settings'];
            try {
                foreach ($settings as $key => $value) {
                    setSetting($key, $value, creatorId(), $key == "paiementpro_enabled");
                }

                return redirect()->back()->with('success', __('PaiementPro settings save successfully.'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', __('Failed to update PaiementPro settings: ') . $e->getMessage());
            }
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }
}
