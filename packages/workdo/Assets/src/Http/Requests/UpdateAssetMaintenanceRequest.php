<?php

namespace Workdo\Assets\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAssetMaintenanceRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'asset_id' => 'required|exists:assets,id',
            'maintenance_type' => 'required|in:preventive,corrective,emergency',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'scheduled_date' => 'required|date',
            'completed_date' => 'nullable|date',
            'cost' => 'nullable|numeric|min:0',
            'technician_name' => 'nullable|string|max:255',
            'status' => 'required|in:scheduled,in_progress,completed,cancelled',
            'priority' => 'required|in:low,medium,high,critical',
            'notes' => 'nullable|string',
            'next_maintenance_date' => 'nullable|date',
        ];
    }
}
