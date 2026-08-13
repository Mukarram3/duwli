<?php

namespace Workdo\Account\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;

class StoreCustomerPaymentRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'payment_date' => 'required|date|before_or_equal:today',
            'customer_id' => 'required|exists:users,id',
            'bank_account_id' => 'required|exists:bank_accounts,id',
            'reference_number' => 'nullable|string|max:100',
            'payment_amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            'allocations' => 'nullable|array',
            'allocations.*.invoice_id' => 'required|exists:sales_invoices,id',
            'allocations.*.amount' => 'required|numeric|min:0.01',
            'credit_notes' => 'nullable|array',
            'credit_notes.*.credit_note_id' => 'required|exists:credit_notes,id',
            'credit_notes.*.amount' => 'required|numeric|min:0.01'
        ];
    }

    public function messages()
    {
        return [
            'payment_date.before_or_equal' => __('Payment date cannot be in the future.'),
            'allocations.*.amount.min' => __('Allocation amount must be greater than 0.'),
            'credit_notes.*.amount.min' => __('Credit note amount must be greater than 0.')
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $allocations = $this->input('allocations', []);
            $creditNotes = $this->input('credit_notes', []);
            
            if (empty($allocations) && empty($creditNotes)) {
                $validator->errors()->add('allocations', __('At least one invoice allocation or credit note is required.'));
            }
        });
    }
}