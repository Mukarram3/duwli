<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * SALES INVOICE VALIDATION — DRAFT vs APPROVE
 * =============================================================================
 * The two save actions are NOT the same operation with a different status
 * string. They validate differently, and they must.
 *
 * WHAT THIS REPLACES
 * The previous version applied ONE ruleset to both paths, and that ruleset was
 * the strict one: invoice_date required, due_date required, at least one line
 * required. So "Save as Draft" could not actually save a draft — an incomplete
 * invoice failed validation and was rejected, which defeats the only purpose a
 * draft has.
 *
 *   SAVE AS DRAFT
 *     A working document. The user may not know the PO number yet, may be
 *     waiting on a price, may have entered three of eight lines. Almost
 *     everything is optional. Nothing posts, no journal entry is raised, no VAT
 *     is reported, and it stays editable.
 *
 *     The one thing a draft still needs is a CUSTOMER — an invoice belonging to
 *     nobody cannot be listed, found again or aged.
 *
 *   SAVE AND APPROVE
 *     A legal document. It posts to the ledger, enters the VAT return, and can
 *     no longer be edited — only reversed by credit note. So everything that
 *     makes it valid is required HERE and not before.
 *
 * WHY THE STRICTNESS BELONGS AT APPROVAL
 * Validating everything on draft makes drafts useless. Validating nothing at
 * approval lets an incomplete document reach the ledger and the tax return,
 * where fixing it costs a credit note rather than an edit.
 *
 * Both actions use this one class; `mode` decides which ruleset applies.
 */
class StoreSalesInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** 'draft' or 'approve'. Anything unrecognised is treated as draft — the safer default. */
    public function mode(): string
    {
        return $this->input('mode') === 'approve' ? 'approve' : 'draft';
    }

    public function rules(): array
    {
        return $this->mode() === 'approve' ? $this->approveRules() : $this->draftRules();
    }

    /**
     * Draft — keep almost everything optional so work in progress can be saved.
     * Types are still enforced: a date column must receive a date even in a
     * draft, or the row cannot be written at all.
     */
    private function draftRules(): array
    {
        return [
            'mode'          => ['nullable', Rule::in(['draft', 'approve'])],
            'customer_id'   => ['required', 'integer', 'exists:users,id'],
            'description'   => ['nullable', 'string', 'max:500'],
            'invoice_date'  => ['nullable', 'date'],
            'supply_date'   => ['nullable', 'date'],
            'due_date'      => ['nullable', 'date'],
            'payment_terms' => ['nullable', 'string', 'max:255'],
            'payment_mean'  => ['nullable', 'string', 'max:50'],
            'reference'     => ['nullable', 'string', 'max:100'],
            'warehouse_id'  => ['nullable', 'integer', 'exists:warehouses,id'],
            'location_id'   => ['nullable', 'integer'],
            'type'          => ['nullable', Rule::in(['product', 'service'])],
            'notes'         => ['nullable', 'string'],
            'terms'         => ['nullable', 'string'],

            'items'                         => ['nullable', 'array'],
            'items.*.product_id'            => ['nullable', 'integer'],
            'items.*.description'           => ['nullable', 'string', 'max:500'],
            'items.*.quantity'              => ['nullable', 'numeric', 'min:0'],
            'items.*.unit'                  => ['nullable', 'string', 'max:50'],
            'items.*.unit_price'            => ['nullable', 'numeric', 'min:0'],
            'items.*.is_tax_inclusive'      => ['nullable', 'boolean'],
            'items.*.discount_percentage'   => ['nullable', 'numeric', 'min:0', 'max:100'],
            'items.*.discount_amount'       => ['nullable', 'numeric', 'min:0'],
            'items.*.tax_percentage'        => ['nullable', 'numeric', 'min:0', 'max:100'],
            'items.*.tax_category_code'     => ['nullable', Rule::in(['S', 'Z', 'E', 'O'])],
            'items.*.exemption_reason_code' => ['nullable', 'string', 'max:20'],
        ];
    }

    /**
     * Approve — everything that makes the document legally and accountably
     * valid. This is the last point at which a problem can be fixed by editing
     * rather than by credit note.
     */
    private function approveRules(): array
    {
        return [
            'mode'          => ['required', Rule::in(['draft', 'approve'])],
            'customer_id'   => ['required', 'integer', 'exists:users,id'],
            'description'   => ['nullable', 'string', 'max:500'],

            'invoice_date'  => ['required', 'date'],
            // Supply date drives the VAT period, so an approved invoice must
            // carry one. The controller defaults it to the invoice date when
            // the user leaves it blank.
            'supply_date'   => ['required', 'date'],
            // A due date before the invoice date would make the invoice overdue
            // the moment it is raised.
            'due_date'      => ['required', 'date', 'after_or_equal:invoice_date'],

            'payment_terms' => ['nullable', 'string', 'max:255'],
            'payment_mean'  => ['required', 'string', 'max:50'],
            'reference'     => ['nullable', 'string', 'max:100'],
            'type'          => ['required', Rule::in(['product', 'service'])],
            'warehouse_id'  => ['required_if:type,product', 'nullable', 'integer', 'exists:warehouses,id'],
            'location_id'   => ['nullable', 'integer'],
            'notes'         => ['nullable', 'string'],
            'terms'         => ['nullable', 'string'],

            // At least one line. An approved invoice for nothing is not a
            // document, and it would post a zero journal entry.
            'items'                       => ['required', 'array', 'min:1'],
            'items.*.product_id'          => ['required', 'integer', 'min:1'],
            'items.*.description'         => ['nullable', 'string', 'max:500'],
            'items.*.quantity'            => ['required', 'numeric', 'gt:0'],
            'items.*.unit'                => ['nullable', 'string', 'max:50'],
            'items.*.unit_price'          => ['required', 'numeric', 'min:0'],
            'items.*.is_tax_inclusive'    => ['required', 'boolean'],
            // A discount may be given as a percentage OR a fixed amount; the
            // form sends whichever the user chose and zero for the other.
            'items.*.discount_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'items.*.discount_amount'     => ['nullable', 'numeric', 'min:0'],
            'items.*.tax_percentage'      => ['required', 'numeric', 'min:0', 'max:100'],
            // Required at approval: it drives the VAT summary and the ZATCA
            // submission, and cannot be inferred from the rate alone — zero
            // rated and exempt are both 0%.
            'items.*.tax_category_code'   => ['required', Rule::in(['S', 'Z', 'E', 'O'])],
            'items.*.exemption_reason_code' => [
                // ZATCA rejects a zero-rated, exempt or out-of-scope line with
                // no stated reason.
                'required_if:items.*.tax_category_code,Z,E,O',
                'nullable', 'string', 'max:20',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'customer_id.exists'      => __('Selected customer does not exist.'),
            'customer_id.required'    => __('Select a customer before saving.'),
            'items.required'          => __('Add at least one line before approving this invoice.'),
            'items.min'               => __('Add at least one line before approving this invoice.'),
            'items.*.product_id.min'  => __('Please select a product for each item.'),
            'items.*.quantity.gt'     => __('Quantity must be greater than zero on every line.'),
            'items.*.unit_price.min'  => __('Unit price must be 0 or greater.'),
            'due_date.after_or_equal' => __('The due date cannot be before the invoice date.'),
            'payment_mean.required'   => __('Select a payment method before approving.'),
            'items.*.tax_category_code.required' => __('Select a VAT category for every line.'),
            'items.*.exemption_reason_code.required_if' => __('A reason is required for zero-rated, exempt and out-of-scope lines.'),
        ];
    }

    /** Cross-field checks that rules() cannot express. */
    public function withValidator($validator): void
    {
        if ($this->mode() !== 'approve') {
            return;
        }

        $validator->after(function ($validator) {
            // A total of zero on an approved invoice is almost always a data
            // entry mistake — every line discounted to nothing, or quantities
            // left at zero. It posts a meaningless journal entry and files a
            // meaningless VAT line.
            $total = 0.0;
            foreach ($this->input('items', []) as $item) {
                $total += (float) ($item['quantity'] ?? 0) * (float) ($item['unit_price'] ?? 0);
            }

            if ($total <= 0) {
                $validator->errors()->add(
                    'items',
                    __('The invoice total must be greater than zero to approve it.')
                );
            }
        });
    }
}
