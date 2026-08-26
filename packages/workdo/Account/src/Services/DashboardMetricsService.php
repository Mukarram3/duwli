<?php
// packages/workdo/Account/src/Services/DashboardMetricsService.php

namespace Workdo\Account\Services;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Figures for the ERP dashboard.
 *
 * Everything is read from POSTED journal entries joined to the chart of
 * accounts — the same source the Trial Balance, Profit & Loss and Balance Sheet
 * use. That is deliberate: a dashboard that totals invoice tables directly will
 * drift away from the financial statements the moment anything is credited,
 * reversed or adjusted, and then nobody can tell which number is right.
 *
 * Account ranges follow the convention already established in
 * DoubleEntry\Services\BalanceSheetService::getAccountSection():
 *
 *   1000-1999  Assets      1000-1049 cash & bank, 1100-1199 receivables
 *   2000-2999  Liabilities 2000-2099 payables
 *   3000-3999  Equity
 *   4000-4999  Revenue
 *   5000-5999  Expenses
 */
class DashboardMetricsService
{
    /** Sum of posted movement on accounts in a code range, over a date window. */
    private function movement(int $from, int $to, ?string $start = null, ?string $end = null): float
    {
        if (!Schema::hasTable('journal_entries')) {
            return 0.0;
        }

        $query = DB::table('journal_entry_items as jei')
            ->join('journal_entries as je', 'je.id', '=', 'jei.journal_entry_id')
            ->join('chart_of_accounts as coa', 'coa.id', '=', 'jei.account_id')
            ->where('je.status', 'posted')
            ->where('coa.created_by', creatorId())
            ->whereRaw('CAST(coa.account_code AS UNSIGNED) BETWEEN ? AND ?', [$from, $to]);

        if ($start) {
            $query->whereDate('je.journal_date', '>=', $start);
        }
        if ($end) {
            $query->whereDate('je.journal_date', '<=', $end);
        }

        // Revenue, liabilities and equity carry credit balances; assets and
        // expenses carry debit balances. Normalising by normal_balance keeps
        // every figure positive when it should be.
        $row = $query->selectRaw('
            COALESCE(SUM(CASE WHEN coa.normal_balance = "debit"
                              THEN jei.debit_amount - jei.credit_amount
                              ELSE jei.credit_amount - jei.debit_amount END), 0) as total
        ')->first();

        return round((float) ($row->total ?? 0), 2);
    }

    /** Headline KPI cards, with a same-length prior-period comparison. */
    public function stats(): array
    {
        $yearStart = Carbon::now()->startOfYear()->toDateString();
        $today     = Carbon::now()->toDateString();

        $prevStart = Carbon::now()->subYear()->startOfYear()->toDateString();
        $prevEnd   = Carbon::now()->subYear()->toDateString();

        $revenue      = $this->movement(4000, 4999, $yearStart, $today);
        $expenses     = $this->movement(5000, 5999, $yearStart, $today);
        $prevRevenue  = $this->movement(4000, 4999, $prevStart, $prevEnd);
        $prevExpenses = $this->movement(5000, 5999, $prevStart, $prevEnd);

        // Balances are positions, not movements — no date window.
        $cash        = $this->movement(1000, 1049);
        $receivables = $this->movement(1100, 1199);
        $payables    = $this->movement(2000, 2099);

        return [
            'revenue'     => ['value' => $revenue,     'delta' => $this->delta($revenue, $prevRevenue)],
            'expenses'    => ['value' => $expenses,    'delta' => $this->delta($expenses, $prevExpenses)],
            'cash'        => ['value' => $cash],
            'receivables' => ['value' => $receivables],
            'payables'    => ['value' => $payables],
        ];
    }

    /** Percentage change, rounded. Null when there is no baseline to compare. */
    private function delta(float $now, float $before): ?float
    {
        if (abs($before) < 0.01) {
            return null;
        }
        return round((($now - $before) / abs($before)) * 100, 1);
    }

    /** Revenue vs expenses, month by month, for the current year. */
    public function revenueExpenses(): array
    {
        $out = [];

        for ($month = 1; $month <= 12; $month++) {
            $start = Carbon::create(null, $month, 1)->startOfMonth();
            if ($start->isFuture()) {
                break;
            }

            $out[] = [
                'name'     => $start->format('M'),
                'revenue'  => $this->movement(4000, 4999, $start->toDateString(), $start->copy()->endOfMonth()->toDateString()),
                'expenses' => $this->movement(5000, 5999, $start->toDateString(), $start->copy()->endOfMonth()->toDateString()),
            ];
        }

        return $out;
    }

    /** Revenue per day for the last seven days. */
    public function weeklySales(): array
    {
        $out = [];

        for ($i = 6; $i >= 0; $i--) {
            $day = Carbon::now()->subDays($i);
            $out[] = [
                'day'   => $day->format('D'),
                'sales' => $this->movement(4000, 4999, $day->toDateString(), $day->toDateString()),
            ];
        }

        return $out;
    }

    /** Invoice counts by state, for the donut. */
    public function invoiceOverview(): ?array
    {
        if (!Schema::hasTable('sales_invoices')) {
            return null;
        }

        $rows = DB::table('sales_invoices')
            ->where('created_by', creatorId())
            ->selectRaw('status, COUNT(*) as total, SUM(CASE WHEN due_date < CURDATE() AND status != "paid" THEN 1 ELSE 0 END) as overdue')
            ->groupBy('status')
            ->get();

        if ($rows->isEmpty()) {
            return null;
        }

        $byStatus = $rows->pluck('total', 'status');
        $overdue  = (int) $rows->sum('overdue');

        return [
            'paid'    => (int) ($byStatus['paid'] ?? 0),
            'unpaid'  => (int) ($byStatus['posted'] ?? 0) + (int) ($byStatus['partial'] ?? 0),
            'overdue' => $overdue,
            'draft'   => (int) ($byStatus['draft'] ?? 0),
        ];
    }

    /** The most recent posted journal entries, whatever raised them. */
    public function recentTransactions(int $limit = 8): array
    {
        if (!Schema::hasTable('journal_entries')) {
            return [];
        }

        return DB::table('journal_entries')
            ->where('created_by', creatorId())
            ->orderByDesc('journal_date')
            ->orderByDesc('id')
            ->limit($limit)
            ->get(['id', 'journal_number', 'description', 'journal_date', 'total_debit', 'status'])
            ->map(fn($entry) => [
                'id'        => $entry->id,
                'reference' => $entry->journal_number,
                'party'     => $entry->description,
                'date'      => Carbon::parse($entry->journal_date)->format('d M Y'),
                'amount'    => $entry->total_debit,
                'status'    => $entry->status,
            ])
            ->all();
    }

    /** Everything the dashboard page expects, in one call. */
    public function all(): array
    {
        return [
            'stats'              => $this->stats(),
            'revenueExpenses'    => $this->revenueExpenses(),
            'weeklySales'        => $this->weeklySales(),
            'invoiceOverview'    => $this->invoiceOverview(),
            'recentTransactions' => $this->recentTransactions(),
        ];
    }
}
