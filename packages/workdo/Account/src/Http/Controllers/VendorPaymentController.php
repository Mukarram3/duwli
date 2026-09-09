<?php

namespace Workdo\Account\Http\Controllers;

use Workdo\Account\Models\VendorPayment;
use Workdo\Account\Models\CustomerPayment;
use Workdo\Account\Services\ReceiptExportService;
use Workdo\Account\Models\VendorPaymentAllocation;
use Workdo\Account\Models\BankAccount;
use Workdo\Account\Models\DebitNote;
use Workdo\Account\Models\DebitNoteApplication;
use Workdo\Account\Http\Requests\StoreVendorPaymentRequest;
use Workdo\Account\Services\JournalService;
use Workdo\Account\Services\BankTransactionsService;
use App\Models\User;
use App\Models\PurchaseInvoice;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Workdo\Account\Models\JournalEntry;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Workdo\Account\Events\CreateVendorPayment;
use Workdo\Account\Events\UpdateVendorPaymentStatus;
use Workdo\Account\Events\DestroyVendorPayment;

class VendorPaymentController extends Controller
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
        if(Auth::user()->can('manage-vendor-payments')){
            $query = VendorPayment::with(['vendor', 'bankAccount', 'allocations.invoice', 'debitNoteApplications.debitNote'])
                ->where(function($q) {
                    if(Auth::user()->can('manage-any-vendor-payments')) {
                        $q->where('created_by', creatorId());
                    } elseif(Auth::user()->can('manage-own-vendor-payments')) {
                        $q->where('creator_id', Auth::id())->orWhere('vendor_id',Auth::id());
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                });

            /*
             * FILTERS
             * The reference layout offers a full filter panel. Each of these
             * runs in SQL so it applies to the WHOLE result set and paginates
             * correctly — filtering the loaded page instead would show a total
             * count that did not match the rows displayed.
             */
            if ($request->vendor_id) {
                $query->where('vendor_id', $request->vendor_id);
            }
            if ($request->status) {
                $query->where('status', $request->status);
            }
            // "Reference" matches either the system payment number or the
            // vendor's own reference — a user looking for a payment has one or
            // the other to hand, rarely both.
            if ($request->reference) {
                $query->where(function ($q) use ($request) {
                    $q->where('payment_number', 'like', '%' . $request->reference . '%')
                      ->orWhere('reference_number', 'like', '%' . $request->reference . '%');
                });
            }
            if ($request->search) {
                $query->where(function ($q) use ($request) {
                    $q->where('payment_number', 'like', '%' . $request->search . '%')
                      ->orWhere('reference_number', 'like', '%' . $request->search . '%')
                      ->orWhereHas('vendor', fn ($v) => $v->where('name', 'like', '%' . $request->search . '%'));
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
            // Fiscal year, taken as a calendar year unless the company defines
            // its own start month. Kept simple deliberately: an incorrect
            // fiscal boundary is worse than an obvious calendar one.
            if ($request->fiscal_year) {
                $query->whereYear('payment_date', $request->fiscal_year);
            }
            if ($request->fiscal_period) {
                $query->whereMonth('payment_date', $request->fiscal_period);
            }

            /*
             * "Kind" filters by ALLOCATION state, which is derived rather than
             * stored: a payment is Unused, Partially Used or Used depending on
             * how much of it has been applied to bills. It has to be computed
             * from the allocations table, so it is expressed as a HAVING over a
             * subquery rather than a plain WHERE.
             */
            if ($request->kind) {
                $ids = $this->paymentIdsByAllocationState($request->kind);
                $query->whereIn('id', $ids);
            }

            $sortField = $request->get('sort', 'created_at');
            $sortDirection = $request->get('direction', 'desc');
            $query->orderBy($sortField, $sortDirection);

            $payments = $query->paginate($request->get('per_page', 10));

            /*
             * UNALLOCATED AMOUNT is derived, not stored: the payment total less
             * everything applied to bills and debit notes. Computed here with
             * two grouped queries over the page's ids rather than per row — a
             * per-row sum on a 100-row page is 200 extra queries.
             *
             * It drives the Allocate action: a payment with nothing left to
             * apply must not offer one.
             */
            $ids = $payments->getCollection()->pluck('id');

            $allocated = VendorPaymentAllocation::whereIn('payment_id', $ids)
                ->selectRaw('payment_id, SUM(allocated_amount) as total')
                ->groupBy('payment_id')
                ->pluck('total', 'payment_id');

            $applied = DebitNoteApplication::whereIn('payment_id', $ids)
                ->selectRaw('payment_id, SUM(applied_amount) as total')
                ->groupBy('payment_id')
                ->pluck('total', 'payment_id');

            $payments->getCollection()->transform(function ($payment) use ($allocated, $applied) {
                $used = (float) ($allocated[$payment->id] ?? 0) + (float) ($applied[$payment->id] ?? 0);
                $payment->allocated_amount   = round($used, 2);
                $payment->unallocated_amount = round(max($payment->payment_amount - $used, 0), 2);

                // Kind, as the reference column shows it.
                $payment->kind = $used <= 0
                    ? 'unused'
                    : ($payment->unallocated_amount > 0 ? 'partially_used' : 'used');

                return $payment;
            });

            $vendors = User::where('type', 'vendor')->where('created_by', creatorId())->get();
            $bankAccounts = BankAccount::where('is_active', true)->where('created_by', creatorId())->get();

            return Inertia::render('Account/VendorPayments/Index', [
                'payments'     => $payments,
                'vendors'      => $vendors,
                'bankAccounts' => $bankAccounts,
                'filters'      => $request->only([
                    'vendor_id', 'status', 'search', 'reference', 'kind',
                    'bank_account_id', 'date_from', 'date_to',
                    'min_amount', 'max_amount', 'fiscal_year', 'fiscal_period',
                ]),
                // Years that actually have payments — an empty year in a picker
                // is a dead end.
                'fiscalYears' => VendorPayment::where('created_by', creatorId())
                    ->selectRaw('DISTINCT YEAR(payment_date) as year')
                    ->orderByDesc('year')
                    ->pluck('year'),
            ]);
        }
        else{
            return back()->with('error', __('Permission denied'));
        }
    }

    /**
     * Payment ids in a given allocation state.
     *
     * Unused / Partially Used / Used is not a stored column — it depends on how
     * much of the payment has been applied to bills and debit notes. This
     * resolves it in SQL so the filter applies across the whole result set and
     * paginates correctly.
     *
     * @param  string  $state  unused|partially_used|used
     * @return array<int>
     */
    private function paymentIdsByAllocationState(string $state): array
    {
        $payments = VendorPayment::where('created_by', creatorId())
            ->select('id', 'payment_amount')
            ->get();

        if ($payments->isEmpty()) {
            return [];
        }

        $ids = $payments->pluck('id');

        $allocated = VendorPaymentAllocation::whereIn('payment_id', $ids)
            ->selectRaw('payment_id, SUM(allocated_amount) as total')
            ->groupBy('payment_id')
            ->pluck('total', 'payment_id');

        $applied = DebitNoteApplication::whereIn('payment_id', $ids)
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

    /**
     * VOID a payment — cancel it while PRESERVING the accounting history.
     *
     * This is not a delete, and the difference matters. Deleting a cleared
     * payment would remove a row the ledger still refers to, leaving journal
     * entries pointing at nothing and a bank reconciliation that no longer
     * balances. Voiding leaves every record in place and posts the REVERSE
     * entries, so the audit trail shows both what happened and that it was
     * undone.
     *
     * The sequence matters and is deliberate:
     *   1. Roll back the bills — a voided payment no longer pays them, so the
     *      amounts must go back onto their balances or those bills would show
     *      as paid with nothing paying them.
     *   2. Roll back any debit notes applied through this payment.
     *   3. Reverse the journal entry, leaving the original in place.
     *   4. Mark the payment cancelled, recording who and when.
     *
     * A payment that was never cleared has no ledger effect, so steps 1-3 are
     * skipped and it is simply marked cancelled.
     */
    public function void(Request $request, VendorPayment $vendorPayment)
    {
        if (!Auth::user()->can('cleared-vendor-payments') || $vendorPayment->created_by != creatorId()) {
            return back()->with('error', __('Permission denied'));
        }

        if ($vendorPayment->status === 'cancelled') {
            return back()->with('error', __('This payment has already been cancelled.'));
        }

        try {
            DB::transaction(function () use ($vendorPayment) {
                if ($vendorPayment->status === 'cleared') {
                    // 1. Put the money back on the bills.
                    foreach ($vendorPayment->allocations as $allocation) {
                        $invoice = $allocation->invoice;
                        if (!$invoice) {
                            continue;
                        }

                        $invoice->paid_amount    = max($invoice->paid_amount - $allocation->allocated_amount, 0);
                        $invoice->balance_amount = $invoice->total_amount - $invoice->paid_amount;
                        $invoice->status = $invoice->paid_amount <= 0
                            ? 'posted'
                            : ($invoice->balance_amount <= 0 ? 'paid' : 'partial');
                        $invoice->save();
                    }

                    // 2. And back on the debit notes.
                    foreach (DebitNoteApplication::where('payment_id', $vendorPayment->id)->get() as $application) {
                        $note = DebitNote::find($application->debit_note_id);
                        if (!$note) {
                            continue;
                        }

                        $note->applied_amount  = max($note->applied_amount - $application->applied_amount, 0);
                        $note->balance_amount  = $note->total_amount - $note->applied_amount;
                        $note->status = $note->applied_amount <= 0
                            ? 'open'
                            : ($note->balance_amount <= 0 ? 'applied' : 'partial');
                        $note->save();
                    }

                    // 3. Reverse the ledger entry. The original stays — that is
                    //    the whole point of a void rather than a delete.
                    $journal = JournalEntry::where('reference_type', 'vendor_payment')
                        ->where('reference_id', $vendorPayment->id)
                        ->where('status', 'posted')
                        ->first();

                    if ($journal) {
                        $this->journalService->reverseManualJournal($journal);
                    }
                }

                $vendorPayment->update(['status' => 'cancelled']);
            });
        } catch (\Throwable $e) {
            return back()->with('error', __('Could not void the payment: ') . $e->getMessage());
        }

        return back()->with('success', __('The payment has been voided. The accounting entries were reversed and the history kept.'));
    }

    public function store(StoreVendorPaymentRequest $request)
    {
        if(Auth::user()->can('create-vendor-payments')){
            // Validate that at least one invoice allocation exists
            if (!$request->allocations || count($request->allocations) === 0) {
                return back()->with('error', __('At least one invoice allocation is required to create a payment.'));
            }

            // Validate debit note amount doesn't exceed invoice allocation amount
            if ($request->debit_notes) {
                $totalInvoiceAmount = collect($request->allocations)->sum('amount');
                $totalDebitNoteAmount = collect($request->debit_notes)->sum('amount');

                if ($totalDebitNoteAmount > $totalInvoiceAmount) {
                    return back()->with('error', __('Debit note amount cannot exceed the total invoice allocation amount.'));
                }
            }

            // Create payment
            $payment = new VendorPayment();
            $payment->payment_date = $request->payment_date;
            $payment->vendor_id = $request->vendor_id;
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
                    $paymentAllocation = new VendorPaymentAllocation();
                    $paymentAllocation->payment_id = $payment->id;
                    $paymentAllocation->invoice_id = $allocation['invoice_id'];
                    $paymentAllocation->allocated_amount = $allocation['amount'];
                    $paymentAllocation->save();
                }
            }

            // Handle debit notes if provided
            if ($request->debit_notes) {
                foreach ($request->debit_notes as $debitNote) {
                    $debitNoteModel = DebitNote::find($debitNote['debit_note_id']);
                    if (!$debitNoteModel) continue;

                    // Create debit note application entry
                    DebitNoteApplication::create([
                        'debit_note_id' => $debitNote['debit_note_id'],
                        'payment_id' => $payment->id,
                        'applied_amount' => $debitNote['amount'],
                        'application_date' => $request->payment_date,
                        'creator_id' => Auth::id(),
                        'created_by' => creatorId()
                    ]);
                }
            }

            // Dispatch event
            CreateVendorPayment::dispatch($request, $payment);

            return redirect()->route('account.vendor-payments.index')->with('success', __('The vendor payment has been created successfully.'));
        }
        else{
            return back()->with('error', __('Permission denied'));
        }
    }

    public function getOutstandingInvoices($vendorId)
    {
        $invoices = PurchaseInvoice::where('vendor_id', $vendorId)
            ->where('balance_amount', '>', 0)
            ->whereIn('status', ['posted', 'partial'])
            ->where('created_by', creatorId())
            ->get();

        $debitNotes = \Workdo\Account\Models\DebitNote::where('vendor_id', $vendorId)
            ->where('balance_amount', '>', 0)
            ->whereIn('status', ['approved', 'partial'])
            ->where('created_by', creatorId())
            ->get(['id', 'debit_note_number', 'balance_amount', 'total_amount', 'status']);

        return response()->json([
            'invoices' => $invoices,
            'debitNotes' => $debitNotes
        ]);
    }

    public function updateStatus(Request $request, VendorPayment $vendorPayment)
    {
        if(Auth::user()->can('cleared-vendor-payments') && $vendorPayment->created_by == creatorId()){
            try {
                // Create journal entry and update invoices when payment is cleared
                if($request->status === 'cleared') {
                    if($vendorPayment->payment_amount > 0)
                    {
                        $this->journalService->createVendorPaymentJournal($vendorPayment);
                        $this->bankTransactionsService->createVendorPayment($vendorPayment);
                    }
                    // Update invoice balances
                    foreach ($vendorPayment->allocations as $allocation) {
                        $invoice = $allocation->invoice;
                        $invoice->paid_amount += $allocation->allocated_amount;
                        $invoice->balance_amount = $invoice->total_amount - $invoice->paid_amount;

                        if ($invoice->balance_amount == 0) {
                            $invoice->status = 'paid';
                        } elseif ($invoice->paid_amount > 0) {
                            $invoice->status = 'partial';
                        }
                        $invoice->save();
                    }
                }

                $debitNoteApplication = DebitNoteApplication::where('payment_id', $vendorPayment->id)->get();

                foreach ($debitNoteApplication as $debitNote) {
                    $debitNoteModel = DebitNote::find($debitNote['debit_note_id']);
                    $debitNoteModel->applied_amount += $debitNote['applied_amount'];
                    $debitNoteModel->balance_amount = $debitNoteModel->total_amount - $debitNoteModel->applied_amount;
                    $debitNoteModel->status = $debitNoteModel->balance_amount <= 0 ? 'applied' : 'partial';
                    $debitNoteModel->save();
                }

                $vendorPayment->update(['status' => $request->status]);

                 // Dispatch event
                 UpdateVendorPaymentStatus::dispatch($request, $vendorPayment);

                return back()->with('success', __('The payment status are updated successfully.'));
            } catch (\Exception $e) {
                return back()->with('error', $e->getMessage());
            }
        }
        else{
            return back()->with('error', __('Permission denied'));
        }
    }

    public function destroy(VendorPayment $vendorPayment)
    {
        if(Auth::user()->can('delete-vendor-payments') && $vendorPayment->created_by == creatorId() && $vendorPayment->status === 'pending'){

            // Dispatch event before deletion
            DestroyVendorPayment::dispatch($vendorPayment);

            $vendorPayment->delete();
            return back()->with('success', __('The vendor payment has been deleted.'));
        }
        else{
            return back()->with('error', __('Permission denied'));
        }
    }

    // -----------------------------------------------------------------
    // Export + the combined receipts view
    // -----------------------------------------------------------------

    public function export(Request $request, ReceiptExportService $service)
    {
        if (!Auth::user()->can('manage-vendor-payments')) {
            return back()->with('error', __('Permission denied'));
        }

        try {
            $path = $service->export('vendor', $request->only(['search', 'status', 'date_from', 'date_to']));
        } catch (\Exception $e) {
            return back()->with('error', __('Export failed: ') . $e->getMessage());
        }

        return response()->download($path, 'vendor-receipts-' . now()->format('Y-m-d') . '.xlsx')
            ->deleteFileAfterSend(true);
    }

    /** Export the combined customer + vendor list. */
    public function exportAll(Request $request, ReceiptExportService $service)
    {
        if (!Auth::user()->can('manage-vendor-payments') && !Auth::user()->can('manage-customer-payments')) {
            return back()->with('error', __('Permission denied'));
        }

        try {
            $path = $service->export('all', $request->only(['search', 'status', 'date_from', 'date_to']));
        } catch (\Exception $e) {
            return back()->with('error', __('Export failed: ') . $e->getMessage());
        }

        return response()->download($path, 'all-receipts-' . now()->format('Y-m-d') . '.xlsx')
            ->deleteFileAfterSend(true);
    }

    /**
     * All Receipts — money in and money out in one list.
     *
     * Customer and vendor payments have identical shapes, so they are unioned
     * in PHP with an explicit direction rather than through a database view.
     * Direction is carried as a field: in a combined list, received and paid
     * must never be ambiguous.
     */
    public function allReceipts(Request $request)
    {
        if (!Auth::user()->can('manage-vendor-payments') && !Auth::user()->can('manage-customer-payments')) {
            return back()->with('error', __('Permission denied'));
        }

        $collect = function ($query, string $direction, string $partyRelation) use ($request) {
            $query->where('created_by', creatorId());

            if ($request->search) {
                $query->where('payment_number', 'like', '%' . $request->search . '%');
            }
            if ($request->status && $request->status !== 'all') {
                $query->where('status', $request->status);
            }
            if ($request->date_from) {
                $query->whereDate('payment_date', '>=', $request->date_from);
            }
            if ($request->date_to) {
                $query->whereDate('payment_date', '<=', $request->date_to);
            }

            return $query->get()->map(fn($p) => [
                'id'             => $p->id,
                'payment_number' => $p->payment_number,
                'payment_date'   => $p->payment_date,
                'direction'      => $direction,
                'party'          => $p->{$partyRelation}->company_name ?? '',
                'bank_account'   => $p->bankAccount->account_name ?? '',
                'amount'         => $p->payment_amount,
                'status'         => $p->status,
            ]);
        };

        $customer = Auth::user()->can('manage-customer-payments')
            ? $collect(CustomerPayment::with(['customer:id,company_name', 'bankAccount:id,account_name']), 'received', 'customer')
            : collect();

        $vendor = Auth::user()->can('manage-vendor-payments')
            ? $collect(VendorPayment::with(['vendor:id,company_name', 'bankAccount:id,account_name']), 'paid', 'vendor')
            : collect();

        $all = $customer->concat($vendor)->sortByDesc('payment_date')->values();

        return Inertia::render('Account/Receipts/All', [
            'receipts' => $all,
            'totals'   => [
                'received' => round($customer->sum('amount'), 2),
                'paid'     => round($vendor->sum('amount'), 2),
                'net'      => round($customer->sum('amount') - $vendor->sum('amount'), 2),
            ],
            'filters'  => $request->only(['search', 'status', 'date_from', 'date_to']),
        ]);
    }
}
