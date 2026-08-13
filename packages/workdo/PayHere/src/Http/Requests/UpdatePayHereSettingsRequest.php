<?php

namespace Workdo\PayHere\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePayHereSettingsRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'settings' => 'required|array',
            'settings.payhere_merchant_id' => 'required_if:settings.payhere_enabled,on|string|max:255',
            'settings.payhere_merchant_secret' => 'required_if:settings.payhere_enabled,on|string|max:255',
            'settings.payhere_app_id' => 'required_if:settings.payhere_enabled,on|string|max:255',
            'settings.payhere_app_secret' => 'required_if:settings.payhere_enabled,on|string|max:255',
            'settings.payhere_mode' => 'required_if:settings.payhere_enabled,on|in:sandbox,live',
            'settings.payhere_enabled' => 'sometimes|in:on,off',
        ];
    }

    public function messages()
    {
        return [
            'settings.payhere_merchant_id.required_if' => __('PayHere Merchant ID is required.'),
            'settings.payhere_merchant_secret.required_if' => __('PayHere Merchant Secret is required.'),
            'settings.payhere_app_id.required_if' => __('PayHere App ID is required.'),
            'settings.payhere_app_secret.required_if' => __('PayHere App Secret is required.'),
            'settings.payhere_mode.required_if' => __('PayHere Mode is required.'),
            'settings.payhere_mode.in' => __('PayHere Mode must be either sandbox or live.'),
        ];
    }
}