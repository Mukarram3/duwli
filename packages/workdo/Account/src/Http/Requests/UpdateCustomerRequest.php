<?php

namespace Workdo\Account\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCustomerRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    /**
     * Normalise the "no user account" sentinel to a real null BEFORE validation.
     *
     * THE BUG THIS FIXES
     * The form's user picker uses "0" as its empty option, because a Radix
     * Select cannot hold an empty string as a value. That "0" was posted
     * verbatim, and `nullable|exists:users,id` does not treat it as absent —
     * "0" is a present value, so the rule ran, found no user with id 0, and
     * failed with "The selected user id is invalid."
     *
     * The field was already optional at every level: nullable in the rules,
     * nullable in the column, null-coalesced in the controller. It still
     * blocked vendor creation, because a sentinel is not the same as a null.
     *
     * Normalising here rather than only in the form means it holds for the API
     * and the importer too, not just the one screen that happened to send "0".
     */
    protected function prepareForValidation(): void
    {
        $userId = $this->input('user_id');

        if ($userId === '0' || $userId === 0 || $userId === '' || $userId === 'null') {
            $this->merge(['user_id' => null]);
        }
    }

    public function rules()
    {
        return [
            'user_id' => 'nullable|exists:users,id',
            'company_name' => 'required|string|max:255',
            'contact_person_name' => 'required|string|max:255',
            'contact_person_email' => 'required|email|max:255',
            'contact_person_mobile' => 'nullable|string|max:255',
            'tax_number' => 'nullable|string|max:255',
            'payment_terms' => 'nullable|string|max:255',
            'billing_address.name' => 'required|string|max:255',
            'billing_address.address_line_1' => 'required|string|max:255',
            'billing_address.address_line_2' => 'nullable|string|max:255',
            'billing_address.city' => 'required|string|max:255',
            'billing_address.state' => 'required|string|max:255',
            'billing_address.country' => 'required|string|max:255',
            'billing_address.zip_code' => 'required|string|max:20',
            'shipping_address.name' => 'required_if:same_as_billing,false|string|max:255',
            'shipping_address.address_line_1' => 'required_if:same_as_billing,false|string|max:255',
            'shipping_address.address_line_2' => 'nullable|string|max:255',
            'shipping_address.city' => 'required_if:same_as_billing,false|string|max:255',
            'shipping_address.state' => 'required_if:same_as_billing,false|string|max:255',
            'shipping_address.country' => 'required_if:same_as_billing,false|string|max:255',
            'shipping_address.zip_code' => 'required_if:same_as_billing,false|string|max:20',
            'same_as_billing' => 'boolean',
            'notes' => 'nullable|string',
        ];
    }
}