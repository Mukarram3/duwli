<?php

namespace Workdo\Ozow\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOzowSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'settings.ozow_enabled' => 'required|string|in:on,off',
            'settings.ozow_site_key' => 'required_if:settings.ozow_enabled,on|nullable|string',
            'settings.ozow_private_key' => 'required_if:settings.ozow_enabled,on|nullable|string',
            'settings.ozow_api_key' => 'required_if:settings.ozow_enabled,on|nullable|string',
            'settings.ozow_mode' => 'required_if:settings.ozow_enabled,on|string|in:sandbox,live',
        ];
    }

    public function messages(): array
    {
        return [
            'settings.ozow_site_key.required_if' => __('Ozow site key is required.'),
            'settings.ozow_private_key.required_if' => __('Ozow private key is required.'),
            'settings.ozow_api_key.required_if' => __('Ozow API key is required.'),
            'settings.ozow_enabled.in' => __('Ozow enabled must be either on or off.'),
            'settings.ozow_mode.required_if' => __('Ozow mode is required.'),
            'settings.ozow_mode.in' => __('Ozow mode must be either sandbox or live.'),
        ];
    }
}