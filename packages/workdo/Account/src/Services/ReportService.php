<?php

namespace Workdo\Account\Services;

use Workdo\Account\Models\ChartOfAccount;
use Illuminate\Support\Facades\DB;

class ReportService
{
    public function getInvoiceAging($filters = [])
    {
        $asOfDate = $filters['as_of_date'] ?? date('Y-m-d');

        $invoices = DB::table('sales_invoices')
            ->where('sales_invoices.created_by', creatorId())
            ->whereIn('sales_invoices.status', ['posted', 'partial'])
            ->leftJoin('users', 'sales_invoices.customer_id', '=', 'users.id')
            ->where('users.type', 'client')
            ->where('sales_invoices.balance_amount', '>', 0)
            ->select(
                'sales_invoices.id',
                'sales_invoices.invoice_number',
                'sales_invoices.due_date',
                'sales_invoices.balance_amount as balance',
                'users.name as customer_name',
                'users.id as customer_id',
                DB::raw('DATEDIFF("' . $asOfDate . '", sales_invoices.due_date) as days_overdue')
            )
            ->get();

        $aging = [
            'current' => 0,
            '1_30_days' => 0,
            '31_60_days' => 0,
            '61_90_days' => 0,
            'over_90_days' => 0,
            'total' => 0
        ];

        $customerData = [];

        foreach ($invoices as $invoice) {
            $balance = $invoice->balance;
            $days = $invoice->days_overdue;

            if ($days <= 0) {
                $aging['current'] += $balance;
                $bucket = 'current';
            } elseif ($days <= 30) {
                $aging['1_30_days'] += $balance;
                $bucket = '1_30_days';
            } elseif ($days <= 60) {
                $aging['31_60_days'] += $balance;
                $bucket = '31_60_days';
            } elseif ($days <= 90) {
                $aging['61_90_days'] += $balance;
                $bucket = '61_90_days';
            } else {
                $aging['over_90_days'] += $balance;
                $bucket = 'over_90_days';
            }

            $aging['total'] += $balance;

            if (!isset($customerData[$invoice->customer_id])) {
                $customerData[$invoice->customer_id] = [
                    'customer_name' => $invoice->customer_name,
                    'current' => 0,
                    '1_30_days' => 0,
                    '31_60_days' => 0,
                    '61_90_days' => 0,
                    'over_90_days' => 0,
                    'total' => 0
                ];
            }

            $customerData[$invoice->customer_id][$bucket] += $balance;
            $customerData[$invoice->customer_id]['total'] += $balance;
        }

        return [
            'aging_summary' => $aging,
            'customers' => array_values($customerData),
            'as_of_date' => $asOfDate
        ];
    }

    public function getBillAging($filters = [])
    {
        $asOfDate = $filters['as_of_date'] ?? date('Y-m-d');

        $bills = DB::table('purchase_invoices')
            ->where('purchase_invoices.created_by', creatorId())
            ->whereIn('purchase_invoices.status', ['posted', 'partial'])
            ->leftJoin('users', 'purchase_invoices.vendor_id', '=', 'users.id')
            ->where('users.type', 'vendor')
            ->where('purchase_invoices.balance_amount', '>', 0)
            ->select(
                'purchase_invoices.id',
                'purchase_invoices.invoice_number as bill_number',
                'purchase_invoices.due_date',
                'purchase_invoices.balance_amount as balance',
                'users.name as vendor_name',
                'users.id as vendor_id',
                DB::raw('DATEDIFF("' . $asOfDate . '", purchase_invoices.due_date) as days_overdue')
            )
            ->get();

        $aging = [
            'current' => 0,
            '1_30_days' => 0,
            '31_60_days' => 0,
            '61_90_days' => 0,
            'over_90_days' => 0,
            'total' => 0
        ];

        $vendorData = [];

        foreach ($bills as $bill) {
            $balance = $bill->balance;
            $days = $bill->days_overdue;

            if ($days <= 0) {
                $aging['current'] += $balance;
                $bucket = 'current';
            } elseif ($days <= 30) {
                $aging['1_30_days'] += $balance;
                $bucket = '1_30_days';
            } elseif ($days <= 60) {
                $aging['31_60_days'] += $balance;
                $bucket = '31_60_days';
            } elseif ($days <= 90) {
                $aging['61_90_days'] += $balance;
                $bucket = '61_90_days';
            } else {
                $aging['over_90_days'] += $balance;
                $bucket = 'over_90_days';
            }

            $aging['total'] += $balance;

            if (!isset($vendorData[$bill->vendor_id])) {
                $vendorData[$bill->vendor_id] = [
                    'vendor_name' => $bill->vendor_name,
                    'current' => 0,
                    '1_30_days' => 0,
                    '31_60_days' => 0,
                    '61_90_days' => 0,
                    'over_90_days' => 0,
                    'total' => 0
                ];
            }

            $vendorData[$bill->vendor_id][$bucket] += $balance;
            $vendorData[$bill->vendor_id]['total'] += $balance;
        }

        return [
            'aging_summary' => $aging,
            'vendors' => array_values($vendorData),
            'as_of_date' => $asOfDate
        ];
    }

    public function getTaxSummary($filters = [])
    {
        $fromDate = $filters['from_date'] ?? date('Y-01-01');
        $toDate = $filters['to_date'] ?? date('Y-12-31');

        // Get tax collected from sales invoices
        $taxCollected = DB::table('sales_invoice_item_taxes')
            ->join('sales_invoice_items', 'sales_invoice_item_taxes.item_id', '=', 'sales_invoice_items.id')
            ->join('sales_invoices', 'sales_invoice_items.invoice_id', '=', 'sales_invoices.id')
            ->where('sales_invoices.created_by', creatorId())
            ->whereIn('sales_invoices.status', ['posted', 'partial', 'paid'])
            ->whereBetween('sales_invoices.invoice_date', [$fromDate, $toDate])
            ->select(
                'sales_invoice_item_taxes.tax_name',
                'sales_invoice_item_taxes.tax_rate',
                DB::raw('SUM((sales_invoice_items.unit_price * sales_invoice_items.quantity - sales_invoice_items.discount_amount) * sales_invoice_item_taxes.tax_rate / 100) as tax_amount')
            )
            ->groupBy('sales_invoice_item_taxes.tax_name', 'sales_invoice_item_taxes.tax_rate')
            ->get();

        // Get tax paid on purchases
        $taxPaid = DB::table('purchase_invoice_item_taxes')
            ->join('purchase_invoice_items', 'purchase_invoice_item_taxes.item_id', '=', 'purchase_invoice_items.id')
            ->join('purchase_invoices', 'purchase_invoice_items.invoice_id', '=', 'purchase_invoices.id')
            ->where('purchase_invoices.created_by', creatorId())
            ->whereIn('purchase_invoices.status', ['posted', 'partial', 'paid'])
            ->whereBetween('purchase_invoices.invoice_date', [$fromDate, $toDate])
            ->select(
                'purchase_invoice_item_taxes.tax_name',
                'purchase_invoice_item_taxes.tax_rate',
                DB::raw('SUM((purchase_invoice_items.unit_price * purchase_invoice_items.quantity - purchase_invoice_items.discount_amount) * purchase_invoice_item_taxes.tax_rate / 100) as tax_amount')
            )
            ->groupBy('purchase_invoice_item_taxes.tax_name', 'purchase_invoice_item_taxes.tax_rate')
            ->get();

        $totalCollected = $taxCollected->sum('tax_amount');
        $totalPaid = $taxPaid->sum('tax_amount');

        return [
            'tax_collected' => [
                'items' => $taxCollected->map(fn($t) => [
                    'tax_name' => $t->tax_name . ' (' . $t->tax_rate . '%)',
                    'amount' => $t->tax_amount
                ]),
                'total' => $totalCollected
            ],
            'tax_paid' => [
                'items' => $taxPaid->map(fn($t) => [
                    'tax_name' => $t->tax_name . ' (' . $t->tax_rate . '%)',
                    'amount' => $t->tax_amount
                ]),
                'total' => $totalPaid
            ],
            'net_tax_liability' => $totalCollected - $totalPaid,
            'from_date' => $fromDate,
            'to_date' => $toDate
        ];
    }

    public function getCustomerBalanceSummary($filters = [])
    {
        $asOfDate = $filters['as_of_date'] ?? date('Y-m-d');
        $showZeroBalances = $filters['show_zero_balances'] ?? false;

        $customers = DB::table('users')
            ->where('created_by', creatorId())
            ->where('type', 'client')
            ->select('id', 'name', 'email')
            ->get();

        $balances = [];
        $totalBalance = 0;

        foreach ($customers as $customer) {
            $invoiced = DB::table('sales_invoices')
                ->where('customer_id', $customer->id)
                ->whereIn('status', ['posted', 'partial', 'paid'])
                ->where('invoice_date', '<=', $asOfDate)
                ->sum('total_amount');

            $returns = DB::table('sales_invoice_returns')
                ->where('customer_id', $customer->id)
                ->whereIn('status', ['approved', 'completed'])
                ->where('return_date', '<=', $asOfDate)
                ->sum('total_amount');

            $balance = DB::table('sales_invoices')
                ->where('customer_id', $customer->id)
                ->whereIn('status', ['posted', 'partial', 'paid'])
                ->where('invoice_date', '<=', $asOfDate)
                ->sum('balance_amount');

            $netInvoiced = $invoiced - $returns;
            $paid = $invoiced - $balance;

            if (!$showZeroBalances && abs($balance) < 0.01) {
                continue;
            }

            $balances[] = [
                'customer_id' => $customer->id,
                'customer_name' => $customer->name,
                'customer_email' => $customer->email,
                'total_invoiced' => $invoiced,
                'total_returns' => $returns,
                'net_invoiced' => $netInvoiced,
                'total_paid' => $paid,
                'balance' => $balance
            ];

            $totalBalance += $balance;
        }

        usort($balances, fn($a, $b) => $b['balance'] <=> $a['balance']);

        return [
            'customers' => $balances,
            'total_balance' => $totalBalance,
            'as_of_date' => $asOfDate
        ];
    }

    public function getVendorBalanceSummary($filters = [])
    {
        $asOfDate = $filters['as_of_date'] ?? date('Y-m-d');
        $showZeroBalances = $filters['show_zero_balances'] ?? false;

        $vendors = DB::table('users')
            ->where('created_by', creatorId())
            ->where('type', 'vendor')
            ->select('id', 'name', 'email')
            ->get();

        $balances = [];
        $totalBalance = 0;

        foreach ($vendors as $vendor) {
            $billed = DB::table('purchase_invoices')
                ->where('vendor_id', $vendor->id)
                ->whereIn('status', ['posted', 'partial', 'paid'])
                ->where('invoice_date', '<=', $asOfDate)
                ->sum('total_amount');

            $returns = DB::table('purchase_returns')
                ->where('vendor_id', $vendor->id)
                ->whereIn('status', ['approved', 'completed'])
                ->where('return_date', '<=', $asOfDate)
                ->sum('total_amount');

            $balance = DB::table('purchase_invoices')
                ->where('vendor_id', $vendor->id)
                ->whereIn('status', ['posted', 'partial', 'paid'])
                ->where('invoice_date', '<=', $asOfDate)
                ->sum('balance_amount');

            $netBilled = $billed - $returns;
            $paid = $billed - $balance;

            if (!$showZeroBalances && abs($balance) < 0.01) {
                continue;
            }

            $balances[] = [
                'vendor_id' => $vendor->id,
                'vendor_name' => $vendor->name,
                'vendor_email' => $vendor->email,
                'total_billed' => $billed,
                'total_returns' => $returns,
                'net_billed' => $netBilled,
                'total_paid' => $paid,
                'balance' => $balance
            ];

            $totalBalance += $balance;
        }

        usort($balances, fn($a, $b) => $b['balance'] <=> $a['balance']);

        return [
            'vendors' => $balances,
            'total_balance' => $totalBalance,
            'as_of_date' => $asOfDate
        ];
    }

    public function getCustomerDetail($customerId, $filters = [])
    {
        $startDate = $filters['start_date'] ?? null;
        $endDate = $filters['end_date'] ?? null;

        $customer = DB::table('users')
            ->where('id', $customerId)
            ->where('type', 'client')
            ->select('id', 'name', 'email')
            ->first();

        if (!$customer) {
            return null;
        }

        $invoicesQuery = DB::table('sales_invoices')
            ->where('customer_id', $customerId)
            ->whereIn('status', ['posted', 'partial', 'paid'])
            ->select('invoice_number', 'invoice_date as date', 'due_date', 'subtotal', 'tax_amount', 'total_amount', 'balance_amount', 'status');

        if ($startDate) $invoicesQuery->where('invoice_date', '>=', $startDate);
        if ($endDate) $invoicesQuery->where('invoice_date', '<=', $endDate);
        $invoices = $invoicesQuery->orderBy('invoice_date', 'desc')->get();

        $returnsQuery = DB::table('sales_invoice_returns')
            ->where('customer_id', $customerId)
            ->whereIn('status', ['approved', 'completed'])
            ->select('return_number', 'return_date as date', 'subtotal', 'tax_amount', 'total_amount', 'status');

        if ($startDate) $returnsQuery->where('return_date', '>=', $startDate);
        if ($endDate) $returnsQuery->where('return_date', '<=', $endDate);
        $returns = $returnsQuery->orderBy('return_date', 'desc')->get();

        $creditNotesQuery = DB::table('credit_notes')
            ->where('customer_id', $customerId)
            ->whereIn('status', ['approved', 'completed'])
            ->select('credit_note_number', 'credit_note_date as date', 'total_amount', 'applied_amount', 'balance_amount', 'status');

        if ($startDate) $creditNotesQuery->where('credit_note_date', '>=', $startDate);
        if ($endDate) $creditNotesQuery->where('credit_note_date', '<=', $endDate);
        $creditNotes = $creditNotesQuery->orderBy('credit_note_date', 'desc')->get();

        $paymentsQuery = DB::table('customer_payments')
            ->leftJoin('bank_accounts', 'customer_payments.bank_account_id', '=', 'bank_accounts.id')
            ->where('customer_payments.customer_id', $customerId)
            ->select('customer_payments.payment_number', 'customer_payments.payment_date as date', 'customer_payments.payment_amount as amount', 'customer_payments.reference_number', 'customer_payments.status', 'bank_accounts.account_name as bank_account');

        if ($startDate) $paymentsQuery->where('payment_date', '>=', $startDate);
        if ($endDate) $paymentsQuery->where('payment_date', '<=', $endDate);
        $payments = $paymentsQuery->orderBy('payment_date', 'desc')->get();

        return [
            'customer' => $customer,
            'date_range' => ['start_date' => $startDate, 'end_date' => $endDate],
            'invoices' => $invoices,
            'returns' => $returns,
            'credit_notes' => $creditNotes,
            'payments' => $payments,
            'summary' => [
                'total_invoiced' => $invoices->sum('total_amount'),
                'total_returns' => $returns->sum('total_amount'),
                'total_credit_notes' => $creditNotes->sum('total_amount'),
                'total_payments' => $payments->sum('amount'),
                'balance' => $invoices->sum('balance_amount')
            ]
        ];
    }

    public function getVendorDetail($vendorId, $filters = [])
    {
        $startDate = $filters['start_date'] ?? null;
        $endDate = $filters['end_date'] ?? null;

        $vendor = DB::table('users')
            ->where('id', $vendorId)
            ->where('type', 'vendor')
            ->select('id', 'name', 'email')
            ->first();

        if (!$vendor) {
            return null;
        }

        $invoicesQuery = DB::table('purchase_invoices')
            ->where('vendor_id', $vendorId)
            ->whereIn('status', ['posted', 'partial', 'paid'])
            ->select('invoice_number', 'invoice_date as date', 'due_date', 'subtotal', 'tax_amount', 'total_amount', 'balance_amount', 'status');

        if ($startDate) $invoicesQuery->where('invoice_date', '>=', $startDate);
        if ($endDate) $invoicesQuery->where('invoice_date', '<=', $endDate);
        $invoices = $invoicesQuery->orderBy('invoice_date', 'desc')->get();

        $returnsQuery = DB::table('purchase_returns')
            ->where('vendor_id', $vendorId)
            ->whereIn('status', ['approved', 'completed'])
            ->select('return_number', 'return_date as date', 'subtotal', 'tax_amount', 'total_amount', 'status');

        if ($startDate) $returnsQuery->where('return_date', '>=', $startDate);
        if ($endDate) $returnsQuery->where('return_date', '<=', $endDate);
        $returns = $returnsQuery->orderBy('return_date', 'desc')->get();

        $debitNotesQuery = DB::table('debit_notes')
            ->where('vendor_id', $vendorId)
            ->whereIn('status', ['approved', 'completed'])
            ->select('debit_note_number', 'debit_note_date as date', 'total_amount', 'applied_amount', 'balance_amount', 'status');

        if ($startDate) $debitNotesQuery->where('debit_note_date', '>=', $startDate);
        if ($endDate) $debitNotesQuery->where('debit_note_date', '<=', $endDate);
        $debitNotes = $debitNotesQuery->orderBy('debit_note_date', 'desc')->get();

        $paymentsQuery = DB::table('vendor_payments')
            ->leftJoin('bank_accounts', 'vendor_payments.bank_account_id', '=', 'bank_accounts.id')
            ->where('vendor_payments.vendor_id', $vendorId)
            ->select('vendor_payments.payment_number', 'vendor_payments.payment_date as date', 'vendor_payments.payment_amount as amount', 'vendor_payments.reference_number', 'vendor_payments.status', 'bank_accounts.account_name as bank_account');

        if ($startDate) $paymentsQuery->where('payment_date', '>=', $startDate);
        if ($endDate) $paymentsQuery->where('payment_date', '<=', $endDate);
        $payments = $paymentsQuery->orderBy('payment_date', 'desc')->get();

        return [
            'vendor' => $vendor,
            'date_range' => ['start_date' => $startDate, 'end_date' => $endDate],
            'invoices' => $invoices,
            'returns' => $returns,
            'debit_notes' => $debitNotes,
            'payments' => $payments,
            'summary' => [
                'total_invoiced' => $invoices->sum('total_amount'),
                'total_returns' => $returns->sum('total_amount'),
                'total_debit_notes' => $debitNotes->sum('total_amount'),
                'total_payments' => $payments->sum('amount'),
                'balance' => $invoices->sum('balance_amount')
            ]
        ];
    }
}
