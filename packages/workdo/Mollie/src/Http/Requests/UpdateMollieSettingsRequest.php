<?php

namespace Workdo\Mollie\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMollieSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'settings.mollie_enabled' => 'required|string|in:on,off',
            'settings.mollie_api_key' => 'required_if:settings.mollie_enabled,on|nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'settings.mollie_api_key.required_if' => __('Mollie API key is required.'),
            'settings.mollie_enabled.in' => __('Invalid status value.'),
        ];
    }
}