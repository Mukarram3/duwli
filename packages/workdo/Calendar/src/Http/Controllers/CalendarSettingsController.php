<?php

namespace Workdo\Calendar\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Workdo\Calendar\Http\Requests\StoreGoogleCalendarSettingsRequest;

class CalendarSettingsController extends Controller
{
    public function index()
    {
        $tokenExists = company_setting('google_calendar_token', creatorId());
        $refreshTokenExists = company_setting('google_calendar_refresh_token', creatorId());
        $hasTokens = $tokenExists && $refreshTokenExists;

        return response()->json([
            'hasTokens' => $hasTokens
        ]);
    }

    public function store(StoreGoogleCalendarSettingsRequest $request)
    {
        if (Auth::user()->can('edit-google-calendar-settings')) {
            $validated = $request->validated();

            $settings = $validated['settings'];

            if ($request->hasFile('json_file')) {
                $jsonContent = file_get_contents($request->file('json_file')->getRealPath());
                $settings['google_calendar_json_file'] = $jsonContent;
            }

            try {
                foreach ($settings as $key => $value) {
                    setSetting($key, $value, creatorId(), false);
                }

                return back()->with('success', __('Google Calendar settings saved successfully.'));
            } catch (\Exception $e) {
                return back()->with('error', __('Failed to update settings: ') . $e->getMessage());
            }
        } else {
            return back()->with('error', __('Permission denied.'));
        }
    }
}
