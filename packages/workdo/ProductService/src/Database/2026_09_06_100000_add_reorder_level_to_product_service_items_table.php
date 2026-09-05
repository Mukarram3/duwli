<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds a per-item reorder level so low-stock alerts can be evaluated.
 *
 * WHY THIS EXISTS
 * The Inventory section of the redesign brief asks for low-stock alerts and an
 * inventory status indicator. `product_service_items` currently stores no
 * threshold, so the only stock state that can be determined is "nothing left".
 * Without this column the Items screen can flag OUT OF STOCK but never LOW
 * STOCK, because there is no number to compare the quantity against.
 *
 * BEHAVIOUR
 *   reorder_level = 0 (default)  → item is not tracked for low stock; it shows
 *                                  IN STOCK until quantity reaches zero. This
 *                                  is the existing behaviour, so shipping this
 *                                  migration changes nothing until a user sets
 *                                  a level on an item.
 *   reorder_level > 0            → quantity <= reorder_level shows LOW STOCK.
 *
 * Nullable would have worked too, but a default of 0 avoids every downstream
 * comparison needing a null guard.
 *
 * THIS MIGRATION IS OPTIONAL. The Items screen already handles the column being
 * absent — it reads it defensively and falls back to out-of-stock only. Run it
 * when low-stock alerts are approved for scope.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('product_service_items', 'reorder_level')) {
            Schema::table('product_service_items', function (Blueprint $table) {
                $table->decimal('reorder_level', 15, 2)
                      ->default(0)
                      ->after('purchase_price')
                      ->comment('Quantity at or below which the item is flagged as low stock. 0 disables the alert.');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('product_service_items', 'reorder_level')) {
            Schema::table('product_service_items', function (Blueprint $table) {
                $table->dropColumn('reorder_level');
            });
        }
    }
};
