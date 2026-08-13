<?php

namespace Workdo\PaiementPro\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePaiementProSettingsRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'settings.paiementpro_enabled' => 'required|string|in:on,off',
            'settings.paiementpro_merchant_id' => 'required_if:settings.paiementpro_enabled,on|nullable|string',
        ];
    }

    public function messages()
    {
        return [
            'settings.paiementpro_merchant_id.required_if' => __('PaiementPro merchant ID is required.'),
            'settings.paiementpro_enabled.in' => __('PaiementPro enabled must be either on or off.'),
        ];
    }
}
