<?php

namespace Workdo\Khalti\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateKhaltiSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'settings.khalti_enabled' => 'required|in:on,off',
            'settings.khalti_mode' => 'required|in:sandbox,live',
            'settings.khalti_secret_key' => 'required_if:settings.khalti_enabled,on|nullable|string|max:255',
        ];
    }

    public function messages(): array
    {
        return [
            'settings.khalti_enabled.required' => __('Khalti enabled status is required.'),
            'settings.khalti_enabled.in' => __('Khalti enabled status must be either "on" or "off".'),
            'settings.khalti_mode.required' => __('Khalti mode is required.'),
            'settings.khalti_mode.in' => __('Khalti mode must be either "sandbox" or "live".'),
            'settings.khalti_secret_key.required_if' => __('Khalti secret key is required when Khalti is enabled.'),
            'settings.khalti_secret_key.string' => __('Khalti secret key must be a string.'),
            'settings.khalti_secret_key.max' => __('Khalti secret key may not be greater than 255 characters.'),
        ];
    }
}
