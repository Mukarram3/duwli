<?php

namespace Workdo\Assets\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAssetDepreciationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'asset_id' => 'required|exists:assets,id',
            'depreciation_method' => 'required|in:straight_line,declining_balance,sum_of_years',
            'useful_life_years' => 'required|integer|min:1|max:50',
            'salvage_value' => 'required|numeric|min:0',
            'depreciation_start_date' => 'required|date',
            'notes' => 'nullable|string',
        ];
    }
}
