<?php

namespace Workdo\Quotation\Http\Controllers;

use App\Http\Controllers\Controller;
use Workdo\Quotation\Models\SalesQuotation;
use Workdo\Quotation\Models\SalesQuotationItem;
use Workdo\Quotation\Models\SalesQuotationItemTax;
use Workdo\Quotation\Http\Requests\StoreQuotationRequest;
use Workdo\Quotation\Http\Requests\UpdateQuotationRequest;
use App\Models\User;
use App\Models\Warehouse;
use Workdo\ProductService\Models\ProductServiceItem;
use App\Models\SalesInvoice;
use App\Models\SalesInvoiceItem;
use App\Models\SalesInvoiceItemTax;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Workdo\Quotation\Events\AcceptSalesQuotation;
use Workdo\Quotation\Events\ConvertSalesQuotation;
use Workdo\Quotation\Events\CreateQuotation;
use Workdo\Quotation\Events\UpdateQuotation;
use Workdo\Quotation\Events\DestroyQuotation;
use Workdo\Quotation\Events\RejectSalesQuotation;
use Workdo\Quotation\Events\SentSalesQuotation;

class QuotationController extends Controller
{
    public function index(Request $request)
    {
        if (Auth::user()->can('manage-quotations')) {
            $query = SalesQuotation::with(['customer', 'items'])
                /*
                 * CONVERTED QUOTATIONS LEAVE THIS LIST.
                 *
                 * Once a quotation becomes an invoice, the invoice is the live
                 * document — the quotation is history. Leaving it here means
                 * two records for one sale and an invitation to act on the
                 * dead one.
                 *
                 * Nothing is deleted: the row stays, carries invoice_id, and
                 * is still reachable from the invoice it produced. Deleting it
                 * would break that trail.
                 *
                 * `?show_converted=1` brings them back for anyone who needs to
                 * look at the history.
                 */
                ->when(!request()->boolean('show_converted'), function ($q) {
                    $q->where(function ($inner) {
                        $inner->where('converted_to_invoice', false)
                              ->orWhereNull('converted_to_invoice');
                    });
                })
                ->where(function ($q) {
                    if (Auth::user()->can('manage-any-quotations')) {
                        $q->where('created_by', creatorId());
                    } elseif (Auth::user()->can('manage-own-quotations')) {
                        $q->where('creator_id', Auth::id())->orWhere('customer_id', Auth::id());
                        if (Auth::user()->type == 'client') {
                            $q->where('status', '!=', 'draft');
                        }
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                });
              // Apply filters
            if ($request->customer_id) {
                $query->where('customer_id', $request->customer_id);
            }
            if ($request->status) {
                $query->where('status', $request->status);
            }
            if ($request->search) {
                $query->where('quotation_number', 'like', '%' . $request->search . '%');
            }
            if ($request->date_range) {
                $dates = explode(' - ', $request->date_range);
                if (count($dates) === 2) {
                    $query->whereBetween('quotation_date', [$dates[0], $dates[1]]);
                }
            }

              // Apply sorting
            $sortField     = $request->get('sort', 'created_at');
            $sortDirection = $request->get('direction', 'desc');

            $allowedSortFields = ['quotation_number', 'quotation_date', 'due_date', 'subtotal', 'tax_amount', 'total_amount', 'status', 'created_at'];
            if (!in_array($sortField, $allowedSortFields) || empty($sortField)) {
                $sortField = 'created_at';
            }

            $query->orderBy($sortField, $sortDirection);

            $perPage    = $request->get('per_page', 10);
            $quotations = $query->paginate($perPage);
            $customers  = User::where('type', 'client')->select('id', 'name', 'email')->where('created_by', creatorId())->get();

            return Inertia::render('Quotation/Quotations/Index', [
                'quotations' => $quotations,
                'customers'  => $customers,
                'filters'    => $request->only(['customer_id', 'status', 'search', 'date_range'])
            ]);
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }

    public function create()
    {
        if (Auth::user()->can('create-quotations')) {
            $customers  = User::where('type', 'client')->select('id', 'name', 'email')->where('created_by', creatorId())->get();
            $warehouses = Warehouse::where('is_active', true)->select('id', 'name', 'address')->where('created_by', creatorId())->get();

            return Inertia::render('Quotation/Quotations/Create', [
                'customers'  => $customers,
                'warehouses' => $warehouses
            ]);
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }

    public function store(StoreQuotationRequest $request)
    {
        if (Auth::user()->can('create-quotations')) {
            $totals = $this->calculateTotals($request->items);

            $quotation                  = new SalesQuotation();
            $quotation->quotation_date  = $request->invoice_date;
            $quotation->due_date        = $request->due_date;
            $quotation->customer_id     = $request->customer_id;
            $quotation->warehouse_id    = $request->warehouse_id;
            $quotation->payment_terms   = $request->payment_terms;
            $quotation->notes           = $request->notes;
            $quotation->subtotal        = $totals['subtotal'];
            $quotation->tax_amount      = $totals['tax_amount'];
            $quotation->discount_amount = $totals['discount_amount'];
            $quotation->total_amount    = $totals['total_amount'];
            $quotation->creator_id      = Auth::id();
            $quotation->created_by      = creatorId();
            $quotation->save();

              // Create quotation items
            $this->createQuotationItems($quotation->id, $request->items);

            try {
                CreateQuotation::dispatch($request, $quotation);
            } catch (\Throwable $th) {
                return back()->with('error', $th->getMessage());
            }

            return redirect()->route('quotations.index')->with('success', __('The quotation has been created successfully.'));
        } else {
            return redirect()->route('quotations.index')->with('error', __('Permission denied'));
        }
    }



    public function show(SalesQuotation $quotation)
    {
        if (Auth::user()->can('view-quotations')) {
            if (!$this->canAccessQuotation($quotation)) {
                return redirect()->route('quotations.index')->with('error', __('Access denied'));
            }

            $quotation->load(['customer', 'customerDetails', 'items.product', 'items.taxes', 'warehouse', 'parentQuotation']);

            return Inertia::render('Quotation/Quotations/View', [
                'quotation' => $quotation
            ]);
        } else {
            return redirect()->route('quotations.index')->with('error', __('Permission denied'));
        }
    }

    public function edit(SalesQuotation $quotation)
    {
        if (Auth::user()->can('edit-quotations')) {
            if (!$this->canAccessQuotation($quotation)) {
                return redirect()->route('quotations.index')->with('error', __('Access denied'));
            }

            if ($quotation->status != 'draft') {
                return redirect()->route('quotations.index')->with('error', __('Cannot update sent quotation.'));
            }

            $quotation->load(['items.taxes']);
            $customers  = User::where('type', 'client')->select('id', 'name', 'email')->where('created_by', creatorId())->get();
            $warehouses = Warehouse::where('is_active', true)->select('id', 'name', 'address')->where('created_by', creatorId())->get();

            return Inertia::render('Quotation/Quotations/Edit', [
                'quotation'  => $quotation,
                'customers'  => $customers,
                'warehouses' => $warehouses
            ]);
        } else {
            return redirect()->route('quotations.index')->with('error', __('Permission denied'));
        }
    }

    public function update(UpdateQuotationRequest $request, SalesQuotation $quotation)
    {
        if (Auth::user()->can('edit-quotations') && $quotation->created_by == creatorId()) {
            if ($quotation->status != 'draft') {
                return redirect()->route('quotations.index')->with('error', __('Cannot update sent quotation.'));
            }

            $totals = $this->calculateTotals($request->items);

            $quotation->quotation_date  = $request->invoice_date;
            $quotation->due_date        = $request->due_date;
            $quotation->customer_id     = $request->customer_id;
            $quotation->warehouse_id    = $request->warehouse_id;
            $quotation->payment_terms   = $request->payment_terms;
            $quotation->notes           = $request->notes;
            $quotation->subtotal        = $totals['subtotal'];
            $quotation->tax_amount      = $totals['tax_amount'];
            $quotation->discount_amount = $totals['discount_amount'];
            $quotation->total_amount    = $totals['total_amount'];
            $quotation->save();

            $quotation->items()->delete();
            $this->createQuotationItems($quotation->id, $request->items);

            UpdateQuotation::dispatch($request, $quotation);

            return redirect()->route('quotations.index')->with('success', __('The quotation details are updated successfully.'));
        } else {
            return redirect()->route('quotations.index')->with('error', __('Permission denied'));
        }
    }

    public function destroy(SalesQuotation $quotation)
    {
        if (Auth::user()->can('delete-quotations')) {
            if ($quotation->status === 'sent') {
                return back()->with('error', __('Cannot delete sent quotation.'));
            }

            DestroyQuotation::dispatch($quotation);

            $quotation->delete();

            return redirect()->route('quotations.index')->with('success', __('The quotation has been deleted.'));
        } else {
            return redirect()->route('quotations.index')->with('error', __('Permission denied'));
        }
    }

    private function calculateTotals($items)
    {
        $subtotal      = 0;
        $totalTax      = 0;
        $totalDiscount = 0;

        foreach ($items as $item) {
            $lineTotal      = $item['quantity'] * $item['unit_price'];
            $discountAmount = ($lineTotal * ($item['discount_percentage'] ?? 0)) / 100;
            $afterDiscount  = $lineTotal - $discountAmount;
            $taxAmount      = ($afterDiscount * ($item['tax_percentage'] ?? 0)) / 100;

            $subtotal      += $lineTotal;
            $totalDiscount += $discountAmount;
            $totalTax      += $taxAmount;
        }

        return [
            'subtotal'        => $subtotal,
            'tax_amount'      => $totalTax,
            'discount_amount' => $totalDiscount,
            'total_amount'    => $subtotal + $totalTax - $totalDiscount
        ];
    }

    private function createQuotationItems($quotationId, $items)
    {
        foreach ($items as $itemData) {
            $item                      = new SalesQuotationItem();
            $item->quotation_id        = $quotationId;
            $item->product_id          = $itemData['product_id'];
            $item->quantity            = $itemData['quantity'];
            $item->unit_price          = $itemData['unit_price'];
            $item->discount_percentage = $itemData['discount_percentage'] ?? 0;
            $item->tax_percentage      = $itemData['tax_percentage'] ?? 0;
            $item->save();

              // Store individual taxes
            if (isset($itemData['taxes']) && is_array($itemData['taxes'])) {
                foreach ($itemData['taxes'] as $tax) {
                    $quotationItemTax           = new SalesQuotationItemTax();
                    $quotationItemTax->item_id  = $item->id;
                    $quotationItemTax->tax_name = $tax['tax_name'];
                    $quotationItemTax->tax_rate = $tax['tax_rate'] ?? $tax['rate'] ?? 0;
                    $quotationItemTax->save();
                }
            }
        }
    }

    public function sent(SalesQuotation $quotation)
    {
        if (Auth::user()->can('sent-quotations') && $quotation->created_by == creatorId()) {
            if ($quotation->status !== 'draft') {
                return back()->with('error', __('Only draft quotations can be sent.'));
            }
            SentSalesQuotation::dispatch($quotation);

            $quotation->update(['status' => 'sent']);

            return back()->with('success', __('The quotation has been sent successfully.'));
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }

    public function approve(SalesQuotation $quotation)
    {
        if (Auth::user()->can('approve-quotations') && $quotation->created_by == creatorId()) {
            if ($quotation->status !== 'sent') {
                return back()->with('error', __('Only sent quotations can be approved.'));
            }
            AcceptSalesQuotation::dispatch($quotation);

            $quotation->update(['status' => 'accepted']);

            return back()->with('success', __('The quotation has been approved successfully.'));
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }

    public function reject(SalesQuotation $quotation)
    {
        if (Auth::user()->can('reject-quotations') && $quotation->created_by == creatorId()) {
            if ($quotation->status !== 'sent') {
                return back()->with('error', __('Only sent quotations can be rejected.'));
            }
            RejectSalesQuotation::dispatch($quotation);

            $quotation->update(['status' => 'rejected']);

            return back()->with('success', __('The quotation has been rejected successfully.'));
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }

    public function print(SalesQuotation $quotation)
    {
        if (Auth::user()->can('print-quotations')) {
            $quotation->load(['customer', 'customerDetails', 'items.product', 'items.taxes', 'warehouse']);

            return Inertia::render('Quotation/Quotations/Print', [
                'quotation' => $quotation
            ]);
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }

    public function createRevision(SalesQuotation $quotation)
    {
        if (Auth::user()->can('create-quotations-revision') && $quotation->created_by == creatorId()) {
            if ($quotation->status === 'draft') {
                return back()->with('error', __('Cannot create version of draft quotation.'));
            }

            $quotation->load(['items.taxes']);

            // Create new revision
            $newRevision = $quotation->replicate();
            $newRevision->parent_quotation_id = $quotation->id;
            $newRevision->revision_number = $quotation->revision_number + 1;
            $newRevision->status = 'draft';
            $newRevision->converted_to_invoice = false;
            $newRevision->invoice_id = null;
            $newRevision->quotation_number = null;
            $newRevision->save();

            // Copy items
            foreach ($quotation->items as $item) {
                $newItem = $item->replicate();
                $newItem->quotation_id = $newRevision->id;
                $newItem->save();

                // Copy taxes
                foreach ($item->taxes as $tax) {
                    $newTax = $tax->replicate();
                    $newTax->item_id = $newItem->id;
                    $newTax->save();
                }
            }

            return redirect()->route('quotations.edit', $newRevision);
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }

    public function duplicate(SalesQuotation $quotation)
    {
        if (Auth::user()->can('duplicate-quotations')) {
            $quotation->load(['items.taxes']);

            // Create duplicate
            $duplicate = $quotation->replicate();
            $duplicate->status = 'draft';
            $duplicate->converted_to_invoice = false;
            $duplicate->invoice_id = null;
            $duplicate->quotation_number = null; // Will be auto-generated
            $duplicate->parent_quotation_id = null;
            $duplicate->revision_number = 1;
            $duplicate->save();

            // Copy items
            foreach ($quotation->items as $item) {
                $newItem = $item->replicate();
                $newItem->quotation_id = $duplicate->id;
                $newItem->save();

                // Copy taxes
                foreach ($item->taxes as $tax) {
                    $newTax = $tax->replicate();
                    $newTax->item_id = $newItem->id;
                    $newTax->save();
                }
            }
            return back()->with('success', __('Quotation duplicated successfully.'));
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }

    /**
     * Convert an accepted quotation into a REAL, SAVED sales invoice.
     *
     * The invoice is written to the database here — it is not a prefilled form
     * the user still has to save. The quotation is then marked converted, which
     * removes it from the Quotations list (see index()) and leaves the invoice
     * as the live document.
     *
     * EVERYTHING RUNS IN ONE TRANSACTION. Copying a header, its lines and their
     * taxes is several writes; a failure halfway would leave an invoice with
     * some of its lines and a quotation that still looks unconverted — the
     * worst of both. All of it lands or none of it does.
     */
    public function convertToInvoice(SalesQuotation $quotation)
    {
        if (!Auth::user()->can('convert-to-invoice-quotations') || $quotation->created_by != creatorId()) {
            return back()->with('error', __('Permission denied'));
        }

        if ($quotation->status !== 'accepted') {
            return back()->with('error', __('Only accepted quotations can be converted to invoice.'));
        }

        if ($quotation->converted_to_invoice) {
            return back()->with('error', __('Quotation already converted to invoice.'));
        }

        $quotation->load(['items.taxes']);

        try {
            $invoice = DB::transaction(function () use ($quotation) {
                $invoice = new SalesInvoice();

                // Header. Written through the same filter the invoice
                // controller uses, so a column the database does not have yet
                // is dropped instead of failing the insert.
                $header = [
                    'uuid'              => (string) Str::uuid(),
                    'customer_id'       => $quotation->customer_id,
                    'warehouse_id'      => $quotation->warehouse_id,
                    'invoice_date'      => now()->toDateString(),
                    // Supply date drives the VAT period; default it to the
                    // invoice date rather than leaving it empty.
                    'supply_date'       => now()->toDateString(),
                    // Never null: the column may still be NOT NULL on a
                    // database that has not run the nullable migration.
                    'due_date'          => $quotation->due_date ?: now()->toDateString(),
                    'description'       => $quotation->description ?? null,
                    'reference'         => $quotation->quotation_number ?? null,
                    'type'              => $quotation->type ?? 'product',
                    'invoice_type_code' => '388',
                    'subtotal'          => $quotation->subtotal,
                    'tax_amount'        => $quotation->tax_amount,
                    'discount_amount'   => $quotation->discount_amount,
                    'total_before_vat'  => $quotation->subtotal - $quotation->discount_amount,
                    'total_amount'      => $quotation->total_amount,
                    'balance_amount'    => $quotation->total_amount,
                    'paid_amount'       => 0,
                    'payment_terms'     => $quotation->payment_terms,
                    'notes'             => $quotation->notes,
                    // Draft, deliberately: converting is not approving. The
                    // invoice still goes through Approve & Post so the ledger
                    // entry is raised by the normal path.
                    'status'            => 'draft',
                    'creator_id'        => Auth::id(),
                    'created_by'        => creatorId(),
                ];

                $columns = Schema::getColumnListing('sales_invoices');
                foreach ($header as $key => $value) {
                    if (in_array($key, $columns, true)) {
                        $invoice->{$key} = $value;
                    }
                }
                $invoice->save();

                $itemColumns = Schema::getColumnListing('sales_invoice_items');

                foreach ($quotation->items as $line) {
                    $payload = [
                        'invoice_id'          => $invoice->id,
                        'product_id'          => $line->product_id,
                        'description'         => $line->description ?? null,
                        'quantity'            => $line->quantity,
                        'unit'                => $line->unit ?? null,
                        'unit_price'          => $line->unit_price,
                        'discount_percentage' => $line->discount_percentage,
                        'discount_amount'     => $line->discount_amount,
                        'total_before_vat'    => ($line->quantity * $line->unit_price) - $line->discount_amount,
                        'tax_percentage'      => $line->tax_percentage,
                        'tax_amount'          => $line->tax_amount,
                        'total_amount'        => $line->total_amount,
                    ];

                    $invoiceItem = new SalesInvoiceItem();
                    foreach ($payload as $key => $value) {
                        if (in_array($key, $itemColumns, true)) {
                            $invoiceItem->{$key} = $value;
                        }
                    }
                    $invoiceItem->save();

                    foreach ($line->taxes as $tax) {
                        $invoiceTax           = new SalesInvoiceItemTax();
                        $invoiceTax->item_id  = $invoiceItem->id;
                        $invoiceTax->tax_name = $tax->tax_name;
                        $invoiceTax->tax_rate = $tax->tax_rate;
                        $invoiceTax->save();
                    }
                }

                $quotation->converted_to_invoice = true;
                $quotation->invoice_id           = $invoice->id;
                $quotation->save();

                return $invoice;
            });
        } catch (\Throwable $e) {
            return back()->with('error', __('Could not convert the quotation: ') . $e->getMessage());
        }

        try {
            ConvertSalesQuotation::dispatch($quotation, $invoice);
        } catch (\Throwable $th) {
            // The invoice exists and is correct; only a listener failed. Say so
            // rather than implying the conversion did not happen.
            return redirect()->route('sales-invoices.index')
                ->with('error', __('The invoice was created, but a follow-up action failed: ') . $th->getMessage());
        }

        /*
         * Land on Sales Invoices, not back on Quotations. The quotation has
         * just left that list, so returning there shows the user the absence of
         * the thing they acted on rather than the result of acting on it.
         */
        return redirect()->route('sales-invoices.index')
            ->with('success', __('Quotation converted. The invoice :number has been created as a draft.', [
                'number' => $invoice->invoice_number,
            ]));
    }

    private function canAccessQuotation(SalesQuotation $quotation)
    {
        if (Auth::user()->can('manage-any-quotations')) {
            return $quotation->created_by == creatorId();
        } elseif (Auth::user()->can('manage-own-quotations')) {
            return $quotation->creator_id == Auth::id() || $quotation->customer_id == Auth::id();
        } else {
            return false;
        }
    }

    public function getWarehouseProducts(Request $request)
    {
        if (Auth::user()->can('create-quotations') || Auth::user()->can('edit-quotations')) {
            $warehouseId = $request->warehouse_id;

            if (!$warehouseId) {
                return response()->json([]);
            }

            $products = ProductServiceItem::select('id', 'name', 'sku', 'sale_price', 'tax_ids', 'unit', 'type')
                ->where('is_active', true)
                ->where('created_by', creatorId())
                ->whereHas('warehouseStocks', function ($q) use ($warehouseId) {
                    $q->where('warehouse_id', $warehouseId)
                        ->where('quantity', '>', 0);
                })
                ->with(['warehouseStocks' => function ($q) use ($warehouseId) {
                    $q->where('warehouse_id', $warehouseId);
                }])
                ->get()
                ->map(function ($product) {
                    $stock = $product->warehouseStocks->first();
                    return [
                        'id'             => $product->id,
                        'name'           => $product->name,
                        'sku'            => $product->sku,
                        'sale_price'     => $product->sale_price,
                        'unit'           => $product->unit,
                        'type'           => $product->type,
                        'stock_quantity' => $stock ? $stock->quantity : 0,
                        'taxes'          => $product->taxes->map(function ($tax) {
                            return [
                                'id'       => $tax->id,
                                'tax_name' => $tax->tax_name,
                                'rate'     => $tax->rate
                            ];
                        })
                    ];
                });
            return response()->json($products);
        } else {
            return response()->json([], 403);
        }
    }
}
