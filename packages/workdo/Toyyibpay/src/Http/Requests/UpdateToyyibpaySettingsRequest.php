<?php

namespace Workdo\Toyyibpay\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateToyyibpaySettingsRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'settings.toyyibpay_enabled' => 'required|string|in:on,off',
            'settings.toyyibpay_secret_key' => 'required_if:settings.toyyibpay_enabled,on|nullable|string',
            'settings.toyyibpay_category_code' => 'required_if:settings.toyyibpay_enabled,on|nullable|string',
            'settings.toyyibpay_mode' => 'required_if:settings.toyyibpay_enabled,on|string|in:sandbox,live',
            'settings.toyyibpay_payment_channel' => 'required_if:settings.toyyibpay_enabled,on|string|in:0,1,2',
            'settings.toyyibpay_charge_to_customer' => 'required_if:settings.toyyibpay_enabled,on|string|in:0,1',
        ];
    }

    public function messages()
    {
        return [
            'settings.toyyibpay_secret_key.required_if' => __('Toyyibpay secret key is required.'),
            'settings.toyyibpay_category_code.required_if' => __('Toyyibpay category code is required.'),
            'settings.toyyibpay_enabled.in' => __('Invalid status value.'),
            'settings.toyyibpay_mode.required_if' => __('Toyyibpay mode is required.'),
            'settings.toyyibpay_mode.in' => __('Toyyibpay mode must be either sandbox or live.'),
        ];
    }
}