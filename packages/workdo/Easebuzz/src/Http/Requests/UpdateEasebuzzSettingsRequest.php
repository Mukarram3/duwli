<?php

namespace Workdo\Easebuzz\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEasebuzzSettingsRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'settings' => 'required|array',
            'settings.easebuzz_enabled' => 'required|string|in:on,off',
            'settings.easebuzz_merchant_key' => 'required_if:settings.easebuzz_enabled,on|string|max:255',
            'settings.easebuzz_salt_key' => 'required_if:settings.easebuzz_enabled,on|string|max:255',
            'settings.easebuzz_mode' => 'required_if:settings.easebuzz_enabled,on|string|in:sandbox,live',
        ];
    }

    public function messages()
    {
        return [
            'settings.easebuzz_enabled.required' => __('The easebuzz enabled field is required.'),
            'settings.easebuzz_merchant_key.required_if' => __('The easebuzz merchant key field is required.'),
            'settings.easebuzz_salt_key.required_if' => __('The easebuzz salt key field is required.'),
            'settings.easebuzz_mode.required_if' => __('The easebuzz mode field is required.'),
            'settings.easebuzz_mode.in' => __('The easebuzz mode must be either sandbox or live.'),
        ];
    }
}