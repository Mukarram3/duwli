<?php

namespace Workdo\Assets\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAssetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|max:100',
            'purchase_date' => 'required|date',
            'supported_date' => 'nullable|date',
            'serial_code' => 'required|max:50',
            'quantity' => 'required|integer|min:1',
            'unit_price' => 'required|numeric|min:0',
            'purchase_cost' => 'required|numeric|min:0',
            'warranty_period' => 'nullable|max:50',
            'description' => 'nullable',
            'image' => 'nullable|string',
            'location_id' => 'nullable|exists:asset_locations,id',
            'category_id' => 'required|exists:assets_categories,id'
        ];
    }
}