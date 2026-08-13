<?php

namespace Workdo\Mercado\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMercadoSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'settings.mercado_enabled' => 'required|string|in:on,off',
            'settings.mercado_mode' => 'required_if:settings.mercado_enabled,on|string|in:sandbox,live',
            'settings.mercado_access_token' => 'required_if:settings.mercado_enabled,on|nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'settings.mercado_enabled.in' => __('Mercado enabled must be either on or off.'),
            'settings.mercado_mode.required_if' => __('Mercado mode is required.'),
            'settings.mercado_mode.in' => __('Mercado mode must be either sandbox or live.'),
            'settings.mercado_access_token.required_if' => __('Mercado access token is required.'),
        ];
    }
}
