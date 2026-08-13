<?php

namespace Workdo\Mercado\Http\Controllers;

use App\Http\Controllers\Controller;
use Workdo\Mercado\Http\Requests\UpdateMercadoSettingsRequest;
use Illuminate\Support\Facades\Auth;

class MercadoSettingsController extends Controller
{
    public function update(UpdateMercadoSettingsRequest $request)
    {
        if (Auth::user()->can('edit-mercado-settings')) {
            $validated = $request->validated();

            $settings = $validated['settings'];
            try {
                foreach ($settings as $key => $value) {
                    setSetting($key, $value, creatorId(), $key == "mercado_enabled");
                }

                return redirect()->back()->with('success', __('Mercado settings saved successfully.'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', __('Failed to update Mercado settings: ') . $e->getMessage());
            }
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }
}
