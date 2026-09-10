<?php

namespace App\Http\Controllers;

use App\Models\SalesInvoice;
use App\Models\SalesInvoiceItem;
use App\Models\SalesInvoiceItemTax;
use App\Models\User;
use App\Models\Warehouse;
use App\Http\Requests\StoreSalesInvoiceRequest;
use App\Http\Requests\UpdateSalesInvoiceRequest;
use Workdo\ProductService\Models\ProductServiceItem;
use Workdo\ProductService\Models\ProductServiceTax;
use Workdo\ProductService\Models\ProductServiceUnit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use App\Services\SalesInvoiceImportExportService;
use App\Services\VatCalculator;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Events\CreateSalesInvoice;
use App\Events\UpdateSalesInvoice;
use App\Events\DestroySalesInvoice;
use App\Events\PostSalesInvoice;
use App\Events\EditSalesInvoice;

class SalesInvoiceController extends Controller
{
    private function checkInvoiceAccess(SalesInvoice $salesInvoice)
    {
        if(Auth::user()->can('manage-any-sales-invoices')) {
            return true;
        } elseif(Auth::user()->can('manage-own-sales-invoices')) {
            if($salesInvoice->creator_id != Auth::id() && $salesInvoice->customer_id != Auth::id()) {
                return false;
            }
            if($salesInvoice->creator_id != Auth::id() && Auth::user()->type == 'client' && $salesInvoice->status == 'draft') {
                return false;
            }
            return true;
        }
        return false;
    }
    public function index(Request $request)
    {
        if(Auth::user()->can('manage-sales-invoices')){
            $query = SalesInvoice::with(['customer', 'items'])
                ->where(function($q) {
                    if(Auth::user()->can('manage-any-sales-invoices')) {
                        $q->where('created_by', creatorId());
                    } elseif(Auth::user()->can('manage-own-sales-invoices')) {
                        $q->where('creator_id', Auth::id())->orWhere('customer_id',Auth::id());
                        if(Auth::user()->type == 'client') {
                            $q->where('status','!=', 'draft');
                        }
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                });

            // Apply filters
            if ($request->customer_id) {
                $query->where('customer_id', $request->customer_id);
            }
            if ($request->warehouse_id) {
                $query->where('warehouse_id', $request->warehouse_id);
            }
            if ($request->status) {
                if ($request->status === 'overdue') {
                    $query->where('due_date', '<', now())
                    ->whereIn('status', ['posted', 'partial'])
                    ->where('balance_amount', '>', 0);
                } else {
                    $query->where('status', $request->status);
                }
            }
            if ($request->search) {
                $query->where('invoice_number', 'like', '%' . $request->search . '%');
            }
            if ($request->date_range) {
                $dates = explode(' - ', $request->date_range);
                if (count($dates) === 2) {
                    $query->whereBetween('invoice_date', [$dates[0], $dates[1]]);
                }
            }

        // Apply sorting
        $sortField = $request->get('sort', 'created_at');
        $sortDirection = $request->get('direction', 'desc');

        // Validate sort field to prevent SQL injection
        $allowedSortFields = ['invoice_number', 'invoice_date', 'due_date', 'subtotal', 'tax_amount', 'total_amount', 'balance_amount', 'status', 'created_at'];
        if (!in_array($sortField, $allowedSortFields) || empty($sortField)) {
            $sortField = 'created_at';
        }

        $query->orderBy($sortField, $sortDirection);

        $perPage = $request->get('per_page', 10);
        $invoices = $query->paginate($perPage);
        $customers = User::where('type', 'client')->select('id', 'name', 'email')->where('created_by', creatorId())->get();
        $warehouses = Warehouse::where('is_active', true)->select('id', 'name')->where('created_by', creatorId())->get();

            return Inertia::render('Sales/Index', [
                'invoices' => $invoices,
                'customers' => $customers,
                'warehouses' => $warehouses,
                'filters' => $request->only(['customer_id', 'warehouse_id', 'status', 'search', 'date_range']),
                'stats' => $this->indexStats(),
            ]);
        }
        else{
            return back()->with('error', __('Permission denied'));
        }
    }

    /**
     * Summary figures for the KPI strip above the invoice list.
     *
     * Deliberately NOT filtered by the request's search/filter parameters: the
     * strip describes the receivables book as a whole, so the totals stay
     * stable while the user filters the table beneath them. A KPI that moves
     * with every filter change cannot be used as a reference point.
     *
     * Scoped by the same ownership rules as the list itself, so a user limited
     * to their own invoices does not see company-wide receivables.
     */
    private function indexStats(): array
    {
        $base = function () {
            return SalesInvoice::query()->where(function ($q) {
                if (Auth::user()->can('manage-any-sales-invoices')) {
                    $q->where('created_by', creatorId());
                } elseif (Auth::user()->can('manage-own-sales-invoices')) {
                    $q->where('creator_id', Auth::id())->orWhere('customer_id', Auth::id());
                } else {
                    $q->whereRaw('1 = 0');
                }
            });
        };

        // "Open" excludes draft and cancelled: neither is money anyone owes yet.
        $open = $base()->whereNotIn('status', ['draft', 'cancelled', 'paid'])
                       ->where('balance_amount', '>', 0);

        $overdue = $base()->whereNotIn('status', ['draft', 'cancelled', 'paid'])
                          ->where('balance_amount', '>', 0)
                          ->whereDate('due_date', '<', now());

        return [
            'outstanding'      => (float) (clone $open)->sum('balance_amount'),
            'outstandingCount' => (clone $open)->count(),
            'overdue'          => (float) (clone $overdue)->sum('balance_amount'),
            'overdueCount'     => (clone $overdue)->count(),
            'collectedThisMonth' => (float) $base()
                                        ->whereYear('invoice_date', now()->year)
                                        ->whereMonth('invoice_date', now()->month)
                                        ->sum('paid_amount'),
            'drafts'           => $base()->where('status', 'draft')->count(),
        ];
    }

    public function create()
    {
        if(Auth::user()->can('create-sales-invoices')){
            /*
             * The Customer Details panel shows phone, tax number and current
             * balance, so they have to be selected here — the previous query
             * fetched only id/name/email and the panel would have rendered
             * three permanent dashes.
             *
             * The balance is the sum of what is still outstanding, computed in
             * one grouped subquery rather than per customer.
             */
            $customerIds = User::where('type', 'client')->where('created_by', creatorId())->pluck('id');

            // Outstanding balance per customer — one grouped query, not one
            // per row.
            $balances = SalesInvoice::whereIn('customer_id', $customerIds)
                ->where('created_by', creatorId())
                ->whereNotIn('status', ['draft', 'cancelled'])
                ->selectRaw('customer_id, SUM(balance_amount) as balance')
                ->groupBy('customer_id')
                ->pluck('balance', 'customer_id');

            // Tax numbers live on the Account customer record, not on the user.
            $taxNumbers = \Workdo\Account\Models\Customer::whereIn('user_id', $customerIds)
                ->where('created_by', creatorId())
                ->pluck('tax_number', 'user_id');

            $customers = User::where('type', 'client')
                ->where('created_by', creatorId())
                ->select('id', 'name', 'email', 'mobile_no')
                ->get()
                ->map(function ($user) use ($balances, $taxNumbers) {
                    $user->balance    = (float) ($balances[$user->id] ?? 0);
                    $user->tax_number = $taxNumbers[$user->id] ?? null;
                    return $user;
                });

            $warehouses = Warehouse::where('is_active', true)->select('id', 'name', 'address')->where('created_by', creatorId())->get();

            return Inertia::render('Sales/Create', [
                'customers'  => $customers,
                'warehouses' => $warehouses,

                // Products carry their own default price and tax, so choosing
                // one fills the line rather than leaving the user to key it.
                // `description` is selected so choosing a product can pre-fill
                // the line description, and `tax_ids` so it can pre-select the
                // product's usual VAT rate.
                'products' => ProductServiceItem::where('created_by', creatorId())
                    ->select('id', 'name', 'sku', 'description', 'sale_price', 'unit', 'tax_ids', 'type')
                    ->get(),

                // Units of measurement for the Unit column. A free-text field
                // produces "pcs", "PCS", "Pieces" and "piece" in the same
                // table, which then cannot be summed or reported on.
                'units' => ProductServiceUnit::where('created_by', creatorId())
                    ->select('id', 'unit_name')
                    ->orderBy('unit_name')
                    ->get(),

                // Tax master WITH category codes. The category is what drives
                // the VAT summary and the ZATCA submission — a rate alone
                // cannot distinguish zero-rated from exempt.
                'taxes' => ProductServiceTax::where('created_by', creatorId())
                    ->select('id', 'tax_name', 'rate', 'category_code', 'exemption_reason_code')
                    ->get(),

                'vatCategories' => VatCalculator::categories(),

                /*
                 * UNCL4461 payment means codes — the set ZATCA expects on an
                 * e-invoice. Stored as codes rather than free text so the
                 * submission does not need a translation layer later.
                 */
                'paymentMeans' => [
                    ['code' => '10', 'label' => __('Cash')],
                    ['code' => '30', 'label' => __('Credit Transfer')],
                    ['code' => '42', 'label' => __('Payment to Bank Account')],
                    ['code' => '48', 'label' => __('Bank Card')],
                    ['code' => '1',  'label' => __('Instrument Not Defined')],
                ],

                'paymentTerms' => ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Due on Receipt'],

                'modules' => [
                    'recurringinvoicebill' => module_is_active('RecurringInvoiceBill')
                ]
            ]);
        }
        else{
            return back()->with('error', __('Permission denied'));
        }
    }

    /**
     * Create a sales invoice — as a DRAFT or as an APPROVED document.
     *
     * The two paths are genuinely different operations, not one operation with
     * a different status string:
     *
     *   mode=draft    Lenient validation (see StoreSalesInvoiceRequest). Saved
     *                 as a working document. NO journal entry, NO VAT reported,
     *                 fully editable afterwards.
     *
     *   mode=approve  Strict validation. Saved, then posted in the same
     *                 operation: journal entries raised, VAT entered, invoice
     *                 locked to editing and correctable only by credit note.
     *
     * Every figure is computed by VatCalculator — the same service the form,
     * the printed document and the posting action use — so the screen, the
     * document and the ledger can never disagree.
     */
    public function store(StoreSalesInvoiceRequest $request, VatCalculator $vat)
    {
        if (!Auth::user()->can('create-sales-invoices')) {
            return redirect()->route('sales-invoices.index')->with('error', __('Permission denied'));
        }

        $approving = $request->mode() === 'approve';

        /*
         * Permission is checked BEFORE anything is written. Discovering
         * afterwards that the user cannot post would leave a draft they did not
         * ask for and a confusing message.
         */
        if ($approving && !Auth::user()->can('post-sales-invoices')) {
            return back()->withInput()->with(
                'error',
                __('You do not have permission to approve invoices. Save it as a draft instead.')
            );
        }

        $items = $request->input('items', []);

        // Server-side costing. The browser computes the same figures for
        // display, but they are recomputed here and the client's numbers are
        // discarded — a total that arrives from a form is an assertion, not a
        // fact, and this one posts to the ledger.
        $costed = $vat->invoice($items);

        $invoice = DB::transaction(function () use ($request, $costed, $items, $approving) {
            $invoice = new SalesInvoice();

            $invoice->uuid          = (string) Str::uuid();
            $invoice->customer_id   = $request->customer_id;
            $invoice->description   = $request->description;
            $invoice->invoice_date  = $request->invoice_date ?: now()->toDateString();
            // Supply date drives the VAT period. Defaulted to the invoice date
            // rather than left null, because a null supply date on a posted
            // invoice puts it in no period at all.
            $invoice->supply_date   = $request->supply_date ?: ($request->invoice_date ?: now()->toDateString());
            /*
             * DUE DATE — defaults to the invoice date when the user leaves it
             * blank on a draft.
             *
             * A draft may legitimately have no due date; the user may not know
             * the payment terms yet. I first solved that by making the column
             * nullable, which was correct but left the feature DEPENDENT ON A
             * MIGRATION HAVING BEEN RUN — and until it was, saving a draft died
             * with "Column 'due_date' cannot be null".
             *
             * Defaulting here instead means drafts save on ANY schema state,
             * migrated or not. The value is sensible rather than arbitrary: an
             * invoice due on its issue date is "due on receipt", it is visible
             * in the form, and the user can change it. On approve, validation
             * has already required an explicit date, so this only ever applies
             * to drafts.
             *
             * The nullable migration still ships and is still worth running —
             * it lets a draft hold a genuinely empty due date. But nothing
             * breaks without it now.
             */
            $invoice->due_date      = $request->due_date
                ?: ($request->invoice_date ?: now()->toDateString());
            $invoice->type          = $request->type ?? 'product';
            $invoice->warehouse_id  = ($request->type ?? 'product') === 'product' ? $request->warehouse_id : null;
            $invoice->location_id   = $request->location_id;
            $invoice->payment_terms = $request->payment_terms;
            $invoice->payment_mean  = $request->payment_mean;
            $invoice->reference     = $request->reference;
            $invoice->notes         = $request->notes;

            $invoice->subtotal         = $costed['subtotal'];
            $invoice->discount_amount  = $costed['discount_amount'];
            $invoice->total_before_vat = $costed['total_before_vat'];
            $invoice->tax_amount       = $costed['tax_amount'];
            $invoice->total_amount     = $costed['total_amount'];
            $invoice->paid_amount      = 0;
            $invoice->balance_amount   = $costed['total_amount'];

            $invoice->invoice_type_code = '388'; // tax invoice
            $invoice->status     = 'draft';      // posted below, never both at once
            $invoice->creator_id = Auth::id();
            $invoice->created_by = creatorId();
            $invoice->save();

            $this->writeInvoiceItems($invoice, $items, $costed['lines']);

            return $invoice;
        });

        try {
            CreateSalesInvoice::dispatch($request, $invoice);
        } catch (\Throwable $th) {
            return back()->with('error', $th->getMessage());
        }

        if (!$approving) {
            return redirect()->route('sales-invoices.index')
                ->with('success', __('Saved as a draft. No accounting entries were made.'));
        }

        /*
         * Approval. The status is set BEFORE dispatching, for the same reason
         * post() does it: if the listener throws after writing journals, an
         * invoice still marked draft with journals against it would duplicate
         * them on the next attempt. Updating first means a failure leaves a
         * status to correct, not a ledger to unpick.
         */
        try {
            $invoice->update([
                'status'    => 'posted',
                'posted_by' => Auth::id(),
                'posted_at' => now(),
            ]);

            PostSalesInvoice::dispatch($invoice);
        } catch (\Throwable $th) {
            $invoice->update(['status' => 'draft', 'posted_by' => null, 'posted_at' => null]);

            return redirect()->route('sales-invoices.index')
                ->with('error', __('Saved as a draft, but approval failed: ') . $th->getMessage());
        }

        return redirect()->route('sales-invoices.index')
            ->with('success', __('The invoice has been approved and posted to the ledger.'));
    }

    /**
     * Write the invoice lines from the costed figures.
     *
     * The tax CATEGORY and rate are stored on the line, copied from the tax
     * master at the moment of entry. If the master is edited next year, this
     * invoice must still show what was charged at the time.
     */
    private function writeInvoiceItems(SalesInvoice $invoice, array $items, array $costed): void
    {
        foreach ($items as $index => $item) {
            $line = $costed[$index] ?? null;
            if (!$line) {
                continue;
            }

            // Skip completely blank rows — a draft often has an empty last row
            // left over from the "add line" button.
            if (empty($item['product_id']) && empty($item['description'])) {
                continue;
            }

            $record = SalesInvoiceItem::create([
                'invoice_id'            => $invoice->id,
                'product_id'            => $item['product_id'] ?? null,
                'description'           => $item['description'] ?? null,
                'quantity'              => $item['quantity'] ?? 0,
                'unit'                  => $item['unit'] ?? null,
                'unit_price'            => $item['unit_price'] ?? 0,
                'is_tax_inclusive'      => (bool) ($item['is_tax_inclusive'] ?? false),
                'discount_percentage'   => $item['discount_percentage'] ?? 0,
                'discount_amount'       => $line['discount_amount'],
                'total_before_vat'      => $line['total_before_vat'],
                'tax_percentage'        => $line['tax_percentage'],
                'tax_category_code'     => $line['tax_category_code'],
                'exemption_reason_code' => $line['exemption_reason_code'] ?? null,
                'tax_amount'            => $line['tax_amount'],
                'total_amount'          => $line['total_amount'],
                'creator_id'            => Auth::id(),
                'created_by'            => creatorId(),
            ]);

            // The per-line tax breakdown table, kept for documents that show
            // several taxes on one line.
            if (!empty($item['taxes']) && is_array($item['taxes'])) {
                foreach ($item['taxes'] as $tax) {
                    SalesInvoiceItemTax::create([
                        'item_id'  => $record->id,
                        'tax_name' => $tax['tax_name'] ?? '',
                        'tax_rate' => $tax['tax_rate'] ?? 0,
                    ]);
                }
            }
        }
    }

    public function show(SalesInvoice $salesInvoice)
    {
        if(Auth::user()->can('view-sales-invoices') && $salesInvoice->created_by == creatorId()){
            if(!$this->checkInvoiceAccess($salesInvoice)) {
                return redirect()->route('sales-invoices.index')->with('error', __('Permission denied'));
            }

            $salesInvoice->load(['customer', 'customerDetails', 'items.product', 'items.taxes', 'warehouse']);

            return Inertia::render('Sales/View', [
                'invoice' => $salesInvoice
            ]);
        }
        else{
            return redirect()->route('sales-invoices.index')->with('error', __('Permission denied'));
        }
    }

    public function edit(SalesInvoice $salesInvoice)
    {
        if(Auth::user()->can('edit-sales-invoices') && $salesInvoice->created_by == creatorId()){
            if(!$this->checkInvoiceAccess($salesInvoice)) {
                return redirect()->route('sales-invoices.index')->with('error', __('Permission denied'));
            }

            if ($salesInvoice->status != 'draft') {
                return redirect()->route('sales-invoices.index')->with('error', __('Cannot update posted invoice.'));
            }

            $salesInvoice->load(['items.taxes']);

            EditSalesInvoice::dispatch($salesInvoice);

            $customers = User::where('type', 'client')->select('id', 'name', 'email')->where('created_by', creatorId())->get();
            $warehouses = Warehouse::where('is_active', true)->select('id', 'name', 'address')->where('created_by', creatorId())->get();

            return Inertia::render('Sales/Edit', [
                'invoice' => $salesInvoice,
                'customers' => $customers,
                'warehouses' => $warehouses,
                'modules' => [
                    'recurringinvoicebill' => module_is_active('RecurringInvoiceBill')
                ]
            ]);
        }
        else{
            return redirect()->route('sales-invoices.index')->with('error', __('Permission denied'));
        }
    }

    public function update(UpdateSalesInvoiceRequest $request, SalesInvoice $salesInvoice)
    {
        if(Auth::user()->can('edit-sales-invoices') && $salesInvoice->created_by == creatorId()){
            if ($salesInvoice->status != 'draft') {
                return redirect()->route('sales-invoices.index')->with('error', __('Cannot update posted invoice.'));
            }
            $totals = $this->calculateTotals($request->items);

            $salesInvoice->invoice_date = $request->invoice_date;
            // Same fallback as store(): never write a null into a column that
            // may still be NOT NULL on an un-migrated database.
            $salesInvoice->due_date = $request->due_date
                ?: ($request->invoice_date ?: $salesInvoice->invoice_date);
            $salesInvoice->customer_id = $request->customer_id;
            $salesInvoice->warehouse_id = $salesInvoice->type === 'product' ? $request->warehouse_id : null;
            $salesInvoice->payment_terms = $request->payment_terms;
            $salesInvoice->notes = $request->notes;
            $salesInvoice->subtotal = $totals['subtotal'];
            $salesInvoice->tax_amount = $totals['tax_amount'];
            $salesInvoice->discount_amount = $totals['discount_amount'];
            $salesInvoice->total_amount = $totals['total_amount'];
            $salesInvoice->balance_amount = $totals['total_amount'];
            $salesInvoice->save();

            // Delete existing items and recreate
            $salesInvoice->items()->delete();
            $this->createInvoiceItems($salesInvoice->id, $request->items);

            // Dispatch event for packages to handle their fields
            UpdateSalesInvoice::dispatch($request, $salesInvoice);

            return redirect()->route('sales-invoices.index')->with('success', __('The sales invoice details are updated successfully.'));
        }
        else{
            return redirect()->route('sales-invoices.index')->with('error', __('Permission denied'));
        }
    }

    public function destroy(SalesInvoice $salesInvoice)
    {
        if(Auth::user()->can('delete-sales-invoices')){
            if ($salesInvoice->status === 'posted') {
                return back()->withErrors(['error' => __('Cannot delete posted invoice.')]);
            }

            // Dispatch event before deletion
            DestroySalesInvoice::dispatch($salesInvoice);

            $salesInvoice->delete();

            return redirect()->route('sales-invoices.index')->with('success', __('The sales invoice has been deleted.'));
        }
        else{
            return redirect()->route('sales-invoices.index')->with('error', __('Permission denied'));
        }
    }

    private function calculateTotals($items)
    {
        $subtotal = 0;
        $totalTax = 0;
        $totalDiscount = 0;

        foreach ($items as $item) {
            $lineTotal = $item['quantity'] * $item['unit_price'];
            $discountAmount = ($lineTotal * ($item['discount_percentage'] ?? 0)) / 100;
            $afterDiscount = $lineTotal - $discountAmount;
            $taxAmount = ($afterDiscount * ($item['tax_percentage'] ?? 0)) / 100;

            $subtotal += $lineTotal;
            $totalDiscount += $discountAmount;
            $totalTax += $taxAmount;
        }

        return [
            'subtotal' => $subtotal,
            'tax_amount' => $totalTax,
            'discount_amount' => $totalDiscount,
            'total_amount' => $subtotal + $totalTax - $totalDiscount
        ];
    }

    private function createInvoiceItems($invoiceId, $items)
    {
        foreach ($items as $itemData) {
            $item = new SalesInvoiceItem();
            $item->invoice_id = $invoiceId;
            $item->product_id = $itemData['product_id'];
            $item->quantity = $itemData['quantity'];
            $item->unit_price = $itemData['unit_price'];
            $item->discount_percentage = $itemData['discount_percentage'] ?? 0;
            $item->tax_percentage = $itemData['tax_percentage'] ?? 0;
            $item->save();

            // Store individual taxes
            if (isset($itemData['taxes']) && is_array($itemData['taxes'])) {
                foreach ($itemData['taxes'] as $tax) {
                    $salesInvoiceItemTax = new SalesInvoiceItemTax();
                    $salesInvoiceItemTax->item_id = $item->id;
                    $salesInvoiceItemTax->tax_name = $tax['tax_name'];
                    $salesInvoiceItemTax->tax_rate = $tax['tax_rate'] ?? $tax['rate'] ?? 0;
                    $salesInvoiceItemTax->save();
                }
            }
        }
    }

    public function post(SalesInvoice $salesInvoice)
    {
        if(Auth::user()->can('post-sales-invoices')){
        if ($salesInvoice->status !== 'draft') {
            return back()->withErrors(['error' => __('Only draft invoices can be posted.')]);
        }

        try {
            /**
             * Mark posted BEFORE dispatching.
             *
             * The listener creates the journal entries. If it threw after a
             * successful write, the old order left the invoice still marked
             * draft while its journals existed — so posting again would
             * duplicate them. Updating first means a failure leaves the status
             * to be corrected, not the ledger.
             */
            $salesInvoice->update(['status' => 'posted']);
            PostSalesInvoice::dispatch($salesInvoice);
        } catch (\Throwable $th) {
            $salesInvoice->update(['status' => 'draft']);
            return back()->with('error', $th->getMessage());
        }

        return back()->with('success', __('The sales invoice has been posted successfully.'));
        }
        else{
            return back()->with('error', __('Permission denied'));
        }
    }

    public function getWarehouseProducts(Request $request)
    {
        if(Auth::user()->can('create-sales-invoices') || Auth::user()->can('edit-sales-invoices')){
            $warehouseId = $request->warehouse_id;

            if (!$warehouseId) {
                return response()->json([]);
            }
            $products = ProductServiceItem::select('id', 'name', 'sku', 'sale_price', 'tax_ids', 'unit', 'type')
                ->where('is_active', true)
                ->where('created_by', creatorId())
                ->whereHas('warehouseStocks', function($q) use ($warehouseId) {
                    $q->where('warehouse_id', $warehouseId)
                      ->where('quantity', '>', 0);
                })
                ->with(['warehouseStocks' => function($q) use ($warehouseId) {
                    $q->where('warehouse_id', $warehouseId);
                }])
                ->get()
                ->map(function ($product) {
                    $stock = $product->warehouseStocks->first();
                    return [
                        'id' => $product->id,
                        'name' => $product->name,
                        'sku' => $product->sku,
                        'sale_price' => $product->sale_price,
                        'unit' => $product->unit,
                        'type' => $product->type,
                        'stock_quantity' => $stock ? $stock->quantity : 0,
                        'taxes' => $product->taxes->map(function ($tax) {
                            return [
                                'id' => $tax->id,
                                'tax_name' => $tax->tax_name,
                                'rate' => $tax->rate
                            ];
                        })
                    ];
                });
            return response()->json($products);
        }
        else{
            return response()->json([], 403);
        }
    }

    public function getServices(Request $request)
    {
        if(Auth::user()->can('create-sales-invoices') || Auth::user()->can('edit-sales-invoices')){
            $services = ProductServiceItem::select('id', 'name', 'sku', 'sale_price', 'tax_ids', 'unit', 'type')
                ->where('is_active', true)
                ->where('type', 'service')
                ->where('created_by', creatorId())
                ->get()
                ->map(function ($service) {
                    return [
                        'id' => $service->id,
                        'name' => $service->name,
                        'sku' => $service->sku,
                        'sale_price' => $service->sale_price,
                        'unit' => $service->unit,
                        'type' => $service->type,
                        'taxes' => $service->taxes->map(function ($tax) {
                            return [
                                'id' => $tax->id,
                                'tax_name' => $tax->tax_name,
                                'rate' => $tax->rate
                            ];
                        })
                    ];
                });
            return response()->json($services);
        }
        else{
            return response()->json([], 403);
        }
    }

    public function print(SalesInvoice $salesInvoice)
    {
        if(Auth::user()->can('print-sales-invoices')){
            $salesInvoice->load(['customer', 'customerDetails', 'items.product', 'items.taxes', 'warehouse']);

            return Inertia::render('Sales/Print', [
                'invoice' => $salesInvoice
            ]);
        }
        else{
            return back()->with('error', __('Permission denied'));
        }
    }

    // =================================================================
    // Import / Export
    // =================================================================

    /**
     * Export invoices matching the CURRENT FILTERS.
     *
     * The filters are read from the request, which is what the index screen
     * already sends — so the file contains exactly what the user is looking
     * at. Exporting the whole table regardless of filters is the classic
     * version of this feature and it is infuriating: the user narrows to 12
     * overdue invoices, clicks Export, and receives 4,000 rows.
     */
    public function export(Request $request, SalesInvoiceImportExportService $service)
    {
        if (!Auth::user()->can('manage-sales-invoices')) {
            return back()->with('error', __('Permission denied'));
        }

        $format = $request->get('format') === 'csv' ? 'csv' : 'xlsx';

        $path = $service->export(
            $request->only(['customer_id', 'warehouse_id', 'status', 'search', 'date_range']),
            $format
        );

        return response()->download($path)->deleteFileAfterSend(true);
    }

    /** Blank template with worked examples showing the one-row-per-line format. */
    public function importTemplate(SalesInvoiceImportExportService $service)
    {
        if (!Auth::user()->can('create-sales-invoices')) {
            return back()->with('error', __('Permission denied'));
        }

        return response()->download($service->template())->deleteFileAfterSend(true);
    }

    /**
     * Validate an uploaded file and return what WOULD be created, without
     * writing anything. This is the preview step the specification asks for.
     */
    public function importPreview(Request $request, SalesInvoiceImportExportService $service)
    {
        if (!Auth::user()->can('create-sales-invoices')) {
            return response()->json(['message' => __('Permission denied')], 403);
        }

        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:10240',
        ]);

        // Stored under a token the confirm step passes back, so the file is
        // read once and the user is not asked to upload it twice.
        $stored = $request->file('file')->store('imports');
        $result = $service->preview(storage_path('app/' . $stored));

        return response()->json([
            'token'      => $stored,
            'summary'    => $result['summary'],
            'errors'     => $result['errors'],
            'duplicates' => $result['duplicates'],
            // Capped: a 5,000-invoice file would otherwise return a payload
            // too large to render, and nobody reviews 5,000 rows by eye.
            'invoices'   => array_slice($result['invoices'], 0, 50),
            'truncated'  => count($result['invoices']) > 50,
        ]);
    }

    /**
     * Commit a previewed file.
     *
     * Everything is created as DRAFT and no journal entries are raised here.
     * The batch is reviewed and posted through the normal workflow, so the
     * accounting entry comes from the same code path as a manual invoice and
     * nothing reaches the ledger without a person posting it.
     */
    public function importConfirm(Request $request, SalesInvoiceImportExportService $service)
    {
        if (!Auth::user()->can('create-sales-invoices')) {
            return back()->with('error', __('Permission denied'));
        }

        $request->validate(['token' => 'required|string']);

        $path = storage_path('app/' . $request->get('token'));

        if (!is_file($path)) {
            return back()->with('error', __('The uploaded file has expired. Please upload it again.'));
        }

        $result = $service->import($path);
        @unlink($path);

        if (!empty($result['errors'])) {
            return back()->with('error', $result['message']);
        }

        return redirect()
            ->route('sales-invoices.index')
            ->with('success', $result['message']);
    }
}
