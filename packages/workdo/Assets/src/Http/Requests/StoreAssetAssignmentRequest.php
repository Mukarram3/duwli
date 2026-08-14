<?php

namespace Workdo\Assets\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAssetAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'asset_id' => 'required|exists:assets,id',
            'user_id' => 'required|exists:users,id',
            'assigned_date' => 'required|date',
            'expected_return_date' => 'nullable|date|after:assigned_date',
            'condition_on_assignment' => 'required|in:excellent,good,fair,poor',
            'assignment_notes' => 'nullable|string|max:1000',
        ];
    }
}