<?php

namespace Workdo\Account\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;

class StoreVendorPaymentRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'payment_date' => 'required|date|before_or_equal:today',
            'vendor_id' => 'required|exists:users,id',
            'bank_account_id' => 'required|exists:bank_accounts,id',
            'reference_number' => 'nullable|string|max:100',
            'payment_amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            'allocations' => 'nullable|array',
            'allocations.*.invoice_id' => 'required|exists:purchase_invoices,id',
            'allocations.*.amount' => 'required|numeric|min:0.01',
            'debit_notes' => 'nullable|array',
            'debit_notes.*.debit_note_id' => 'required|exists:debit_notes,id',
            'debit_notes.*.amount' => 'required|numeric|min:0.01'
        ];
    }

    public function messages()
    {
        return [
            'payment_date.before_or_equal' => __('Payment date cannot be in the future.'),
            'allocations.*.amount.min' => __('Allocation amount must be greater than 0.'),
            'debit_notes.*.amount.min' => __('Debit note amount must be greater than 0.')
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $allocations = $this->input('allocations', []);
            $debitNotes = $this->input('debit_notes', []);

            if (empty($allocations) && empty($debitNotes)) {
                $validator->errors()->add('allocations', 'At least one invoice allocation or debit note is required.');
            }
        });
    }
}
