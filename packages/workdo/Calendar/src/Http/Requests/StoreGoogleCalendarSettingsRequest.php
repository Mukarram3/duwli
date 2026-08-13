<?php

namespace Workdo\Calendar\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreGoogleCalendarSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'settings.google_calendar_enable' => 'required|string|in:on,off',
            'settings.google_calendar_id' => 'required_if:settings.google_calendar_enable,on|nullable|string',
            'json_file' => 'nullable|file|mimes:json|max:2048',
        ];
    }

    public function messages(): array
    {
        return [
            'settings.google_calendar_id.required_if' => __('Google Calendar ID is required when Google Calendar is enabled.'),
            'settings.google_calendar_enable.in' => __('Google Calendar status must be either on or off.'),
            'json_file.mimes' => __('The JSON file must be a valid JSON file.'),
            'json_file.max' => __('The JSON file size must not exceed 2MB.'),
        ];
    }
}
