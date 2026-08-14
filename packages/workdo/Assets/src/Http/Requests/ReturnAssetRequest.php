<?php

namespace Workdo\Assets\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReturnAssetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'returned_date' => 'required|date',
            'condition_on_return' => 'required|in:excellent,good,fair,poor',
            'return_notes' => 'nullable|string|max:1000',
        ];
    }
}