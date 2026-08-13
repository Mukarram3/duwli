<?php

namespace Workdo\Stripe\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStripeSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'settings.stripe_enabled' => 'required|string|in:on,off',
            'settings.stripe_key' => 'required_if:settings.stripe_enabled,on|nullable|string',
            'settings.stripe_secret' => 'required_if:settings.stripe_enabled,on|nullable|string',
        ];
    }

    public function messages(): array
    {
         return [
            'settings.stripe_key.required_if' => __('Stripe key is required.'),
            'settings.stripe_secret.required_if' => __('Stripe secret is required.'),
            'settings.stripe_enabled.in' => __('Stripe enabled must be either on or off.'),
        ];
    }
}