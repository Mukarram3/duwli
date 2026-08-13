<?php

namespace Workdo\ZoomMeeting\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreZoomMeetingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|max:100',
            'description' => 'nullable',
            'meeting_password' => 'nullable|max:20',
            'start_time' => 'required|date|after:' . date('Y-m-d H:i:s', time() - 60),
            'duration' => 'required|integer|min:15|max:480',
            'host_video' => 'boolean',
            'participant_video' => 'boolean',
            'waiting_room' => 'boolean',
            'recording' => 'boolean',
            'status' => 'required',
            'participants' => 'nullable|array',
            'host_id' => 'nullable|exists:users,id'
        ];
    }

    public function messages(): array
    {
        return [
            'start_time.after' => __('The start time must be a future date and time.'),
        ];
    }
}