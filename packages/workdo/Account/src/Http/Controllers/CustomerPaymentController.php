<?php

namespace Workdo\Account\Http\Controllers;

use Workdo\Account\Models\CustomerPayment;
use Workdo\Account\Models\CustomerPaymentAllocation;
use Workdo\Account\Models\BankAccount;
use Workdo\Account\Models\CreditNote;
use Workdo\Account\Models\CreditNoteApplication;
use Workdo\Account\Http\Requests\StoreCustomerPaymentRequest;
use Workdo\Account\Services\JournalService;
use Workdo\Account\Services\BankTransactionsService;
use App\Models\User;
use App\Models\SalesInvoice;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Workdo\Account\Models\JournalEntry;
use Illuminate\Support\Facades\DB;
use Workdo\Account\Services\ReceiptExportService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Workdo\Account\Events\CreateCustomerPayment;
use Workdo\Account\Events\UpdateCustomerPaymentStatus;
use Workdo\Account\Events\DestroyCustomerPayment;

class CustomerPaymentController extends Controller
{
    protected $journalService;
    protected $bankTransactionsService;

    public function __construct(JournalService $journalService, BankTransactionsService $bankTransactionsService)
    {
        $this->journalService = $journalService;
        $this->bankTransactionsService = $bankTransactionsService;
    }

    public function index(Request $request)
    {
        if(Auth::user()->can('manage-customer-payments')){
            $query = CustomerPayment::with(['customer', 'bankAccount', 'allocations.invoice', 'creditNoteApplications.creditNote'])
                ->where(function($q) {
                    if(Auth::user()->can('manage-any-customer-payments')) {
                        $q->where('created_by', creatorId());
                    } elseif(Auth::user()->can('manage-own-customer-payments')) {
                        $q->where('creator_id', Auth::id())->orWhere('customer_id',Auth::id());
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                });

            /*
             * FILTERS — the full panel from the reference layout.
             *
             * All of them run in SQL so they apply to the WHOLE result set and
             * paginate correctly. Filtering the loaded page instead reports a
             * total count that does not match the rows shown.
             */
            if ($request->customer_id) {
                $query->where('customer_id', $request->customer_id);
            }
            if ($request->status) {
                $query->where('status', $request->status);
            }
            // "Reference" matches the system receipt number OR the customer's
            // own reference — whoever is looking has one or the other to hand,
            // rarely both.
            if ($request->reference) {
                $query->where(function ($q) use ($request) {
                    $q->where('payment_number', 'like', '%' . $request->reference . '%')
                      ->orWhere('reference_number', 'like', '%' . $request->reference . '%');
                });
            }
            // "Contact Name or Ref. No." — one box that searches both, because
            // that is how the reference screen labels it.
            if ($request->search) {
                $query->where(function ($q) use ($request) {
                    $q->where('payment_number', 'like', '%' . $request->search . '%')
                      ->orWhere('reference_number', 'like', '%' . $request->search . '%')
                      ->orWhereHas('customer', fn ($c) => $c->where('name', 'like', '%' . $request->search . '%'));
                });
            }
            if ($request->date_from) {
                $query->whereDate('payment_date', '>=', $request->date_from);
            }
            if ($request->date_to) {
                $query->whereDate('payment_date', '<=', $request->date_to);
            }
            if ($request->filled('min_amount')) {
                $query->where('payment_amount', '>=', (float) $request->min_amount);
            }
            if ($request->filled('max_amount')) {
                $query->where('payment_amount', '<=', (float) $request->max_amount);
            }
            if ($request->bank_account_id) {
                $query->where('bank_account_id', $request->bank_account_id);
            }
            if ($request->fiscal_year) {
                $query->whereYear('payment_date', $request->fiscal_year);
            }
            if ($request->fiscal_period) {
                $query->whereMonth('payment_date', $request->fiscal_period);
            }

            /*
             * "Kind" filters by ALLOCATION state, which is derived rather than
             * stored: a receipt is Unused, Partially Used or Used depending on
             * how much has been applied to invoices. It has to be resolved from
             * the allocations, so it cannot be a plain WHERE.
             */
            if ($request->kind) {
                $query->whereIn('id', $this->paymentIdsByAllocationState($request->kind));
            }

            $sortField = $request->get('sort', 'created_at');
            $sortDirection = $request->get('direction', 'desc');
            $query->orderBy($sortField, $sortDirection);

            $payments = $query->paginate($request->get('per_page', 10));

            /*
             * UNALLOCATED AMOUNT is derived: the receipt total less everything
             * applied to invoices and credit notes. Two grouped queries over
             * the page's ids, not one per row — a per-row sum on a 100-row page
             * is 200 extra queries.
             *
             * It is the actionable figure on this screen: money received but
             * not yet matched to an invoice.
             */
            $ids = $payments->getCollection()->pluck('id');

            $allocated = CustomerPaymentAllocation::whereIn('payment_id', $ids)
                ->selectRaw('payment_id, SUM(allocated_amount) as total')
                ->groupBy('payment_id')
                ->pluck('total', 'payment_id');

            $applied = CreditNoteApplication::whereIn('payment_id', $ids)
                ->selectRaw('payment_id, SUM(applied_amount) as total')
                ->groupBy('payment_id')
                ->pluck('total', 'payment_id');

            $payments->getCollection()->transform(function ($payment) use ($allocated, $applied) {
                $used = (float) ($allocated[$payment->id] ?? 0) + (float) ($applied[$payment->id] ?? 0);
                $payment->allocated_amount   = round($used, 2);
                $payment->unallocated_amount = round(max($payment->payment_amount - $used, 0), 2);
                $payment->kind = $used <= 0
                    ? 'unused'
                    : ($payment->unallocated_amount > 0 ? 'partially_used' : 'used');

                return $payment;
            });

            $customers = User::where('type', 'client')->where('created_by', creatorId())->get();
            $bankAccounts = BankAccount::where('is_active', true)->where('created_by', creatorId())->get();

            return Inertia::render('Account/CustomerPayments/Index', [
                'payments'     => $payments,
                'customers'    => $customers,
                'bankAccounts' => $bankAccounts,
                'filters'      => $request->only([
                    'customer_id', 'status', 'search', 'reference', 'kind',
                    'bank_account_id', 'date_from', 'date_to',
                    'min_amount', 'max_amount', 'fiscal_year', 'fiscal_period',
                ]),
                // Only years that actually have receipts — an empty year in a
                // picker is a dead end.
                'fiscalYears' => CustomerPayment::where('created_by', creatorId())
                    ->selectRaw('DISTINCT YEAR(payment_date) as year')
                    ->orderByDesc('year')
                    ->pluck('year'),

                /*
                 * PREFILL — set when the user clicked the Payment icon on a
                 * specific sales invoice (?invoice_id=...).
                 *
                 * Resolved SERVER-SIDE rather than passed through the URL. The
                 * outstanding balance decides how much money is being taken;
                 * accepting it from a query string would let anyone edit the
                 * address bar and allocate an amount the invoice does not owe.
                 *
                 * Scoped by created_by, so an invoice id from another company
                 * resolves to nothing rather than leaking a customer name and
                 * a balance.
                 */
                'prefill' => $this->invoicePrefill($request->get('invoice_id')),
            ]);
        }
        else{
            return back()->with('error', __('Permission denied'));
        }
    }

    /**
     * Build the prefill payload for "receive payment for THIS invoice".
     *
     * Returns null for anything that cannot legitimately be paid — a missing
     * id, another company's invoice, a draft, a cancelled document, or one
     * with nothing left outstanding. In every one of those cases the form
     * simply opens blank rather than half-filled with something misleading.
     */
    private function invoicePrefill($invoiceId): ?array
    {
        if (!$invoiceId) {
            return null;
        }

        $invoice = SalesInvoice::with('customer:id,name')
            ->where('created_by', creatorId())
            ->whereNotIn('status', ['draft', 'cancelled'])
            ->find($invoiceId);

        if (!$invoice || $invoice->balance_amount <= 0) {
            return null;
        }

        return [
            'invoice_id'     => $invoice->id,
            'invoice_number' => $invoice->invoice_number,
            'customer_id'    => $invoice->customer_id,
            'customer_name'  => $invoice->customer->name ?? null,
            // The OUTSTANDING balance, not the invoice total — a partly paid
            // invoice should not offer to collect the full amount again.
            'balance_amount' => (float) $invoice->balance_amount,
        ];
    }

    /**
     * Receipt ids in a given allocation state.
     *
     * Unused / Partially Used / Used is not a stored column — it depends on how
     * much of the receipt has been applied to invoices and credit notes. This
     * resolves it so the "Kind" filter applies across the whole result set and
     * paginates correctly.
     *
     * @param  string  $state  unused|partially_used|used
     * @return array<int>
     */
    private function paymentIdsByAllocationState(string $state): array
    {
        $payments = CustomerPayment::where('created_by', creatorId())
            ->select('id', 'payment_amount')
            ->get();

        if ($payments->isEmpty()) {
            return [];
        }

        $ids = $payments->pluck('id');

        $allocated = CustomerPaymentAllocation::whereIn('payment_id', $ids)
            ->selectRaw('payment_id, SUM(allocated_amount) as total')
            ->groupBy('payment_id')
            ->pluck('total', 'payment_id');

        $applied = CreditNoteApplication::whereIn('payment_id', $ids)
            ->selectRaw('payment_id, SUM(applied_amount) as total')
            ->groupBy('payment_id')
            ->pluck('total', 'payment_id');

        return $payments->filter(function ($payment) use ($allocated, $applied, $state) {
            $used = (float) ($allocated[$payment->id] ?? 0) + (float) ($applied[$payment->id] ?? 0);
            $remaining = round($payment->payment_amount - $used, 2);

            return match ($state) {
                'unused'         => $used <= 0,
                'partially_used' => $used > 0 && $remaining > 0,
                'used'           => $used > 0 && $remaining <= 0,
                default          => true,
            };
        })->pluck('id')->all();
    }

    public function store(StoreCustomerPaymentRequest $request)
    {
        if(Auth::user()->can('create-customer-payments')){
            // Validate that at least one invoice allocation exists
            if (!$request->allocations || count($request->allocations) === 0) {
                return back()->with('error', __('At least one invoice allocation is required to create a payment.'));
            }

            // Validate credit note amount doesn't exceed invoice allocation amount
            if ($request->credit_notes) {
                $totalInvoiceAmount = collect($request->allocations)->sum('amount');
                $totalCreditNoteAmount = collect($request->credit_notes)->sum('amount');

                if ($totalCreditNoteAmount > $totalInvoiceAmount) {
                    return back()->with('error', __('Credit note amount cannot exceed the total invoice allocation amount.'));
                }
            }

            // Create payment
            $payment = new CustomerPayment();
            $payment->payment_date = $request->payment_date;
            $payment->customer_id = $request->customer_id;
            $payment->bank_account_id = $request->bank_account_id;
            $payment->reference_number = $request->reference_number;
            $payment->payment_amount = $request->payment_amount;
            $payment->notes = $request->notes;
            $payment->creator_id = Auth::id();
            $payment->created_by = creatorId();
            $payment->save();

            // Create allocations if provided
            if ($request->allocations) {
                foreach ($request->allocations as $allocation) {
                    $paymentAllocation = new CustomerPaymentAllocation();
                    $paymentAllocation->payment_id = $payment->id;
                    $paymentAllocation->invoice_id = $allocation['invoice_id'];
                    $paymentAllocation->allocated_amount = $allocation['amount'];
                    $paymentAllocation->save();
                }
            }

            // Handle credit notes if provided
            if ($request->credit_notes) {
                foreach ($request->credit_notes as $creditNote) {
                    $creditNoteModel = CreditNote::find($creditNote['credit_note_id']);
                    if (!$creditNoteModel) continue;

                    // Create credit note application entry
                    CreditNoteApplication::create([
                        'credit_note_id' => $creditNote['credit_note_id'],
                        'payment_id' => $payment->id,
                        'applied_amount' => $creditNote['amount'],
                        'application_date' => $request->payment_date,
                        'creator_id' => Auth::id(),
                        'created_by' => creatorId()
                    ]);
                }
            }

            /*
             * SAVED DIRECTLY — no separate posting or approval step.
             *
             * The receipt is created as `cleared` and posted to the books in
             * the same operation: journal entry, bank transaction, invoice
             * balances and credit note applications all in one.
             *
             * Previously it was created as `pending` and did nothing to the
             * ledger until someone marked it cleared, which meant a receipt
             * could be entered and the invoice still show as unpaid.
             *
             * TRADE-OFF, stated plainly: money now hits the ledger the moment
             * the receipt is saved, so a mistake is corrected by cancelling
             * (which reverses the entries) rather than by deleting a pending
             * row. That is the normal accounting treatment and it is what makes
             * the invoice update immediately, which is the point.
             */
            $payment->status = 'cleared';
            $payment->save();

            try {
                $this->postPaymentToBooks($payment);
            } catch (\Exception $e) {
                // The receipt exists but the ledger does not agree with it.
                // Say so rather than reporting a clean success.
                return redirect()->route('account.customer-payments.index')
                    ->with('error', __('The receipt was saved but could not be posted: ') . $e->getMessage());
            }

            // Dispatch event
            CreateCustomerPayment::dispatch($request, $payment);

            return redirect()->route('account.customer-payments.index')
                ->with('success', __('The customer receipt has been saved and posted.'));
        }
        else{
            return back()->with('error', __('Permission denied'));
        }
    }



    /**
     * Edit a receipt — amount, date, bank account, reference or notes.
     *
     * WHY THIS IS NOT A SIMPLE UPDATE
     * The receipt has already posted: a journal entry exists, the bank
     * transaction exists, and the invoices carry its money in their
     * paid_amount. Changing the amount without touching any of that would
     * leave the ledger, the bank and the invoices all disagreeing with the
     * receipt they came from.
     *
     * So the edit is: UNPOST, APPLY THE CHANGES, RE-POST — all inside one
     * transaction, so a failure halfway cannot leave the books half-corrected.
     *
     * The allocation is scaled to the new amount. If a 1,000 receipt allocated
     * entirely to one invoice becomes 600, the allocation becomes 600 too;
     * leaving it at 1,000 would allocate money the receipt no longer contains.
     */
    public function update(Request $request, CustomerPayment $customerPayment)
    {
        if (!Auth::user()->can('edit-customer-payments') || $customerPayment->created_by != creatorId()) {
            return back()->with('error', __('Permission denied'));
        }

        if ($customerPayment->status === 'cancelled') {
            return back()->with('error', __('A cancelled receipt cannot be edited.'));
        }

        $validated = $request->validate([
            'payment_amount'   => 'required|numeric|min:0.01',
            'payment_date'     => 'required|date',
            'bank_account_id'  => 'required|exists:bank_accounts,id',
            'reference_number' => 'nullable|string|max:255',
            'notes'            => 'nullable|string',
        ]);

        try {
            DB::transaction(function () use ($customerPayment, $validated) {
                $wasPosted = $customerPayment->status === 'cleared';
                $oldAmount = (float) $customerPayment->payment_amount;
                $newAmount = (float) $validated['payment_amount'];

                if ($wasPosted) {
                    $this->unpostPaymentFromBooks($customerPayment);
                }

                /*
                 * Scale the allocations proportionally. Done before re-posting
                 * so the new figures are what gets applied to the invoices.
                 */
                if ($oldAmount > 0 && $newAmount != $oldAmount) {
                    $ratio = $newAmount / $oldAmount;
                    foreach ($customerPayment->allocations as $allocation) {
                        $allocation->allocated_amount = round($allocation->allocated_amount * $ratio, 2);
                        $allocation->save();
                    }
                }

                $customerPayment->update($validated);
                $customerPayment->refresh()->load('allocations.invoice');

                if ($wasPosted) {
                    $this->postPaymentToBooks($customerPayment);
                }
            });
        } catch (\Exception $e) {
            return back()->with('error', __('Could not update the receipt: ') . $e->getMessage());
        }

        return back()->with('success', __('The receipt has been updated and the accounts adjusted.'));
    }

    /**
     * The exact inverse of postPaymentToBooks().
     *
     * Takes the receipt's money back off the invoices and credit notes and
     * reverses its journal entry, so the receipt can be re-posted with new
     * figures. The original journal is REVERSED, not deleted — an amended
     * receipt should show both the original entry and its correction.
     */
    private function unpostPaymentFromBooks(CustomerPayment $payment): void
    {
        foreach ($payment->allocations as $allocation) {
            $invoice = $allocation->invoice;
            if (!$invoice) {
                continue;
            }

            $invoice->paid_amount = max($invoice->paid_amount - $allocation->allocated_amount, 0);
            $invoice->balance_amount = $invoice->total_amount - $invoice->paid_amount;
            $invoice->status = $invoice->paid_amount <= 0
                ? 'posted'
                : ($invoice->balance_amount <= 0 ? 'paid' : 'partial');
            $invoice->save();
        }

        foreach (CreditNoteApplication::where('payment_id', $payment->id)->get() as $application) {
            $creditNote = CreditNote::find($application->credit_note_id);
            if (!$creditNote) {
                continue;
            }

            $creditNote->applied_amount = max($creditNote->applied_amount - $application->applied_amount, 0);
            $creditNote->balance_amount = $creditNote->total_amount - $creditNote->applied_amount;
            $creditNote->status = $creditNote->applied_amount <= 0
                ? 'open'
                : ($creditNote->balance_amount <= 0 ? 'applied' : 'partial');
            $creditNote->save();
        }

        $journal = JournalEntry::where('reference_type', 'customer_payment')
            ->where('reference_id', $payment->id)
            ->where('status', 'posted')
            ->first();

        if ($journal) {
            $this->journalService->reverseManualJournal($journal);
        }
    }

    public function getOutstandingInvoices($customerId)
    {
        /*
         * Anything with money still owed, EXCEPT drafts and cancelled
         * documents.
         *
         * This used to be an allow-list of ['posted','partial'], which silently
         * excluded 'overdue' and 'paid'. An overdue invoice is the one most
         * likely to be paid, and it could not be selected here at all — so
         * clicking Receive Payment on it prefilled a form whose invoice never
         * appeared in the list, and the allocation quietly never attached.
         *
         * A deny-list is also correct as statuses are added: a new status means
         * money owed unless it explicitly does not.
         */
        $invoices = SalesInvoice::where('customer_id', $customerId)
            ->where('balance_amount', '>', 0)
            ->whereNotIn('status', ['draft', 'cancelled'])
            ->where('created_by', creatorId())
            ->get();

        $creditNotes = CreditNote::where('customer_id', $customerId)
            ->where('balance_amount', '>', 0)
            ->whereIn('status', ['approved', 'partial'])
            ->where('created_by', creatorId())
            ->get(['id', 'credit_note_number', 'balance_amount', 'total_amount', 'status']);

        return response()->json([
            'invoices' => $invoices,
            'creditNotes' => $creditNotes
        ]);
    }

    /**
     * Post a receipt to the books.
     *
     * Raises the journal entry and the bank transaction, applies the
     * allocations to their invoices, and applies any credit notes.
     *
     * Extracted from updateStatus() so store() and updateStatus() run the SAME
     * code. Two copies of posting logic is how a receipt created one way ends
     * up on the ledger differently from one created the other way — and that
     * kind of divergence only shows up at a reconciliation.
     *
     * IDEMPOTENT BY CALLER. It must be invoked exactly once per receipt;
     * calling it twice would double the invoice paid_amount. Both callers guard
     * for that: store() posts only on creation, updateStatus() only on a
     * transition INTO cleared.
     */
    private function postPaymentToBooks(CustomerPayment $payment): void
    {
        if ($payment->payment_amount > 0) {
            $this->journalService->createCustomerPaymentJournal($payment);
            $this->bankTransactionsService->createCustomerPayment($payment);
        }

        foreach ($payment->allocations as $allocation) {
            $invoice = $allocation->invoice;
            if (!$invoice) {
                continue;
            }

            $invoice->paid_amount += $allocation->allocated_amount;
            $invoice->balance_amount = $invoice->total_amount - $invoice->paid_amount;

            if ($invoice->balance_amount <= 0) {
                $invoice->status = 'paid';
            } elseif ($invoice->paid_amount > 0) {
                $invoice->status = 'partial';
            }
            $invoice->save();
        }

        foreach (CreditNoteApplication::where('payment_id', $payment->id)->get() as $application) {
            $creditNote = CreditNote::find($application->credit_note_id);
            if (!$creditNote) {
                continue;
            }

            $creditNote->applied_amount += $application->applied_amount;
            $creditNote->balance_amount = $creditNote->total_amount - $creditNote->applied_amount;
            $creditNote->status = $creditNote->balance_amount <= 0 ? 'applied' : 'partial';
            $creditNote->save();
        }
    }

    public function updateStatus(Request $request, CustomerPayment $customerPayment)
    {
        if(Auth::user()->can('cleared-customer-payments') && $customerPayment->created_by == creatorId()){
            try {
                /*
                 * Only post on a transition INTO cleared, and only from a state
                 * that has not already posted. Receipts are now created as
                 * cleared, so this path exists for a receipt being revived from
                 * cancelled — posting an already-cleared receipt again would
                 * double every invoice's paid_amount.
                 */
                if ($request->status === 'cleared' && $customerPayment->status !== 'cleared') {
                    $this->postPaymentToBooks($customerPayment);
                }

                $customerPayment->update(['status' => $request->status]);

                 // Dispatch event
                 UpdateCustomerPaymentStatus::dispatch($request, $customerPayment);

                return back()->with('success', __('The payment status are updated successfully.'));
            } catch (\Exception $e) {
                return back()->with('error', $e->getMessage());
            }
        }
        else{
            return back()->with('error', __('Permission denied'));
        }
    }

    public function destroy(CustomerPayment $customerPayment)
    {
        if(Auth::user()->can('delete-customer-payments') && $customerPayment->created_by == creatorId() && $customerPayment->status === 'pending'){

            // Dispatch event before deletion
            DestroyCustomerPayment::dispatch($customerPayment);

            $customerPayment->delete();
            return back()->with('success', __('The customer payment has been deleted.'));
        }
        else{
            return back()->with('error', __('Permission denied'));
        }
    }

    /**
     * Export customer receipts to Excel, honouring the current filters.
     *
     * The vendor side has had this since the module was written
     * (VendorPaymentController@export); the customer side never did, which is
     * why the two screens offered different actions. ReceiptExportService
     * already supported a 'customer' scope — only the route and this method
     * were missing.
     */
    public function export(Request $request, ReceiptExportService $service)
    {
        if (!Auth::user()->can('manage-customer-payments')) {
            return back()->with('error', __('Permission denied'));
        }

        try {
            $path = $service->export('customer', $request->only(['search', 'status', 'date_from', 'date_to']));
        } catch (\Exception $e) {
            return back()->with('error', __('Export failed: ') . $e->getMessage());
        }

        return response()->download($path, 'customer-receipts-' . now()->format('Y-m-d') . '.xlsx')
            ->deleteFileAfterSend(true);
    }
}
