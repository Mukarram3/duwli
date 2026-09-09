<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SALES INVOICE — VAT AND ZATCA FIELDS
 * =============================================================================
 * Three groups of columns, all required by the invoice-form specification.
 *
 * 1. HEADER FIELDS the form asks for and the table does not have:
 *    description, supply_date, location_id, payment_mean, reference.
 *
 *    SUPPLY DATE is not cosmetic. Saudi VAT is accounted for on the date of
 *    supply, which can differ from the invoice date — and ZATCA requires it as
 *    a separate field. Without it, a January invoice for a December supply is
 *    reported in the wrong period.
 *
 * 2. LINE FIELDS: description, unit, is_tax_inclusive, total_before_vat.
 *
 *    IS_TAX_INCLUSIVE has to be stored per line, not per invoice. Retail lines
 *    are commonly quoted VAT-inclusive while service lines on the same invoice
 *    are quoted exclusive, and the two produce different net amounts from the
 *    same figure. Storing only the computed result would make the invoice
 *    impossible to re-derive or audit.
 *
 * 3. ZATCA fields on the header. These are inert until integration is built —
 *    all nullable, nothing reads them yet — but adding them NOW means the
 *    integration does not require a second migration and a backfill across
 *    live invoices:
 *
 *    uuid              Per-invoice UUID (ZATCA requires one, distinct from the id)
 *    invoice_hash      Base64 SHA-256 of the signed XML
 *    previous_hash     PIH — the hash of the previous invoice, forming a chain
 *    icv               Invoice Counter Value, strictly incrementing per device
 *    qr_code           Base64 TLV payload printed on the document
 *    invoice_type_code 388 standard, 383 debit note, 381 credit note
 *    zatca_status      pending | cleared | reported | rejected
 *    zatca_response    Raw authority response, kept for dispute evidence
 *
 *    THE HASH CHAIN IS WHY THIS MATTERS EARLY. Each invoice's PIH is the
 *    previous invoice's hash. A chain cannot be reconstructed retrospectively
 *    for invoices issued before the columns existed, so any invoice raised
 *    between now and integration would sit outside it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales_invoices', function (Blueprint $table) {
            // --- form fields ---
            if (!Schema::hasColumn('sales_invoices', 'description')) {
                $table->string('description', 500)->nullable()->after('invoice_number');
            }
            if (!Schema::hasColumn('sales_invoices', 'supply_date')) {
                $table->date('supply_date')->nullable()->after('invoice_date')
                      ->comment('Date of supply. VAT is accounted for on this date, which may differ from the invoice date.');
            }
            if (!Schema::hasColumn('sales_invoices', 'location_id')) {
                $table->unsignedBigInteger('location_id')->nullable()->after('warehouse_id');
            }
            if (!Schema::hasColumn('sales_invoices', 'payment_mean')) {
                $table->string('payment_mean', 50)->nullable()->after('payment_terms')
                      ->comment('UNCL4461 payment means code. 10 cash, 30 transfer, 48 card, 42 bank account.');
            }
            if (!Schema::hasColumn('sales_invoices', 'reference')) {
                $table->string('reference', 100)->nullable()->after('payment_mean')
                      ->comment('Customer PO or external reference.');
            }

            // --- VAT totals, split so the summary never has to be recomputed ---
            if (!Schema::hasColumn('sales_invoices', 'total_before_vat')) {
                $table->decimal('total_before_vat', 15, 2)->default(0)->after('subtotal');
            }

            // --- ZATCA ---
            if (!Schema::hasColumn('sales_invoices', 'uuid')) {
                $table->uuid('uuid')->nullable()->unique()->after('id');
            }
            if (!Schema::hasColumn('sales_invoices', 'invoice_type_code')) {
                $table->string('invoice_type_code', 4)->default('388')->after('type')
                      ->comment('UNCL1001: 388 tax invoice, 383 debit note, 381 credit note.');
            }
            if (!Schema::hasColumn('sales_invoices', 'icv')) {
                $table->unsignedBigInteger('icv')->nullable()->after('invoice_type_code')
                      ->comment('Invoice Counter Value — strictly incrementing, never reused.');
            }
            if (!Schema::hasColumn('sales_invoices', 'invoice_hash')) {
                $table->string('invoice_hash', 255)->nullable()->after('icv');
            }
            if (!Schema::hasColumn('sales_invoices', 'previous_hash')) {
                $table->string('previous_hash', 255)->nullable()->after('invoice_hash')
                      ->comment('PIH — hash of the previous invoice. Forms the tamper-evident chain.');
            }
            if (!Schema::hasColumn('sales_invoices', 'qr_code')) {
                $table->text('qr_code')->nullable()->after('previous_hash')
                      ->comment('Base64 TLV payload printed on the document.');
            }
            if (!Schema::hasColumn('sales_invoices', 'zatca_status')) {
                $table->string('zatca_status', 20)->nullable()->after('qr_code')
                      ->comment('pending | cleared | reported | rejected');
            }
            if (!Schema::hasColumn('sales_invoices', 'zatca_response')) {
                $table->text('zatca_response')->nullable()->after('zatca_status');
            }

            // --- document audit trail ---
            // Previously only creator_id was stored, so "who posted this and
            // when" was unanswerable. An accounting system has to be able to
            // answer that.
            if (!Schema::hasColumn('sales_invoices', 'posted_by')) {
                $table->unsignedBigInteger('posted_by')->nullable()->after('created_by');
                $table->timestamp('posted_at')->nullable()->after('posted_by');
            }
            if (!Schema::hasColumn('sales_invoices', 'cancelled_by')) {
                $table->unsignedBigInteger('cancelled_by')->nullable()->after('posted_at');
                $table->timestamp('cancelled_at')->nullable()->after('cancelled_by');
            }
        });

        Schema::table('sales_invoice_items', function (Blueprint $table) {
            if (!Schema::hasColumn('sales_invoice_items', 'description')) {
                $table->string('description', 500)->nullable()->after('product_id');
            }
            if (!Schema::hasColumn('sales_invoice_items', 'unit')) {
                $table->string('unit', 50)->nullable()->after('quantity');
            }
            if (!Schema::hasColumn('sales_invoice_items', 'is_tax_inclusive')) {
                $table->boolean('is_tax_inclusive')->default(false)->after('unit_price')
                      ->comment('Whether unit_price already contains VAT. Per line: retail and service lines differ on the same invoice.');
            }
            if (!Schema::hasColumn('sales_invoice_items', 'total_before_vat')) {
                $table->decimal('total_before_vat', 15, 2)->default(0)->after('discount_amount');
            }
            if (!Schema::hasColumn('sales_invoice_items', 'tax_category_code')) {
                $table->string('tax_category_code', 2)->default('S')->after('tax_percentage')
                      ->comment('Copied from the tax master AT THE TIME OF ENTRY. Historic invoices must not change if the master is edited later.');
            }
            if (!Schema::hasColumn('sales_invoice_items', 'exemption_reason_code')) {
                $table->string('exemption_reason_code', 20)->nullable()->after('tax_category_code');
            }
        });
    }

    public function down(): void
    {
        Schema::table('sales_invoices', function (Blueprint $table) {
            foreach ([
                'description', 'supply_date', 'location_id', 'payment_mean', 'reference',
                'total_before_vat', 'uuid', 'invoice_type_code', 'icv', 'invoice_hash',
                'previous_hash', 'qr_code', 'zatca_status', 'zatca_response',
                'posted_by', 'posted_at', 'cancelled_by', 'cancelled_at',
            ] as $column) {
                if (Schema::hasColumn('sales_invoices', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('sales_invoice_items', function (Blueprint $table) {
            foreach ([
                'description', 'unit', 'is_tax_inclusive', 'total_before_vat',
                'tax_category_code', 'exemption_reason_code',
            ] as $column) {
                if (Schema::hasColumn('sales_invoice_items', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
