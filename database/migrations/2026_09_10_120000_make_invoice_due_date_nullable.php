<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * ALLOW DRAFT INVOICES TO HAVE NO DUE DATE
 * =============================================================================
 * THE ERROR THIS FIXES
 *
 *     SQLSTATE[23000]: Integrity constraint violation: 1048
 *     Column 'due_date' cannot be null
 *
 * `sales_invoices.due_date` was created NOT NULL. That was consistent with the
 * old behaviour, where every invoice had to be complete before it could be
 * saved at all.
 *
 * It stopped being true the moment drafts became real. A draft exists precisely
 * so a half-finished invoice can be put down and picked up later — the user may
 * not know the payment terms yet, so there is no due date to record. The
 * validation was relaxed to allow that; the COLUMN was not, so the insert died
 * at the database instead of at the form.
 *
 * `invoice_date` is left NOT NULL deliberately: the controller always supplies
 * it, defaulting to today, so there is no case where it can legitimately be
 * absent. Loosening a constraint that nothing needs loosened would just remove
 * a guard.
 *
 * SAFE ON EXISTING DATA. Making a column nullable never invalidates rows that
 * already have a value.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales_invoices', function (Blueprint $table) {
            $table->date('due_date')->nullable()->change();
        });

        // Purchase invoices have the same shape and the same draft workflow,
        // so they carry the same latent fault. Fixed here rather than waiting
        // for someone to hit it.
        if (Schema::hasTable('purchase_invoices')
            && Schema::hasColumn('purchase_invoices', 'due_date')) {
            Schema::table('purchase_invoices', function (Blueprint $table) {
                $table->date('due_date')->nullable()->change();
            });
        }
    }

    public function down(): void
    {
        /*
         * Reversing this requires every row to have a due_date, so any draft
         * without one is given the invoice date first. Rolling back into a
         * constraint violation would be worse than the original bug.
         */
        \Illuminate\Support\Facades\DB::table('sales_invoices')
            ->whereNull('due_date')
            ->update(['due_date' => \Illuminate\Support\Facades\DB::raw('invoice_date')]);

        Schema::table('sales_invoices', function (Blueprint $table) {
            $table->date('due_date')->nullable(false)->change();
        });

        if (Schema::hasTable('purchase_invoices')
            && Schema::hasColumn('purchase_invoices', 'due_date')) {
            \Illuminate\Support\Facades\DB::table('purchase_invoices')
                ->whereNull('due_date')
                ->update(['due_date' => \Illuminate\Support\Facades\DB::raw('invoice_date')]);

            Schema::table('purchase_invoices', function (Blueprint $table) {
                $table->date('due_date')->nullable(false)->change();
            });
        }
    }
};
