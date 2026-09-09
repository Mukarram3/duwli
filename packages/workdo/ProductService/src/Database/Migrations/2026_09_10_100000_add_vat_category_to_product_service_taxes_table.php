<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * VAT CATEGORY CODES ON THE TAX MASTER
 * =============================================================================
 * `product_service_taxes` stores only a name and a rate. That is enough to
 * calculate a total, and not enough for anything else the specification asks
 * for:
 *
 *   - The VAT SUMMARY has to group amounts by category (Standard / Zero /
 *     Exempt). With only a rate, "Zero rated" and "Exempt" are both 0% and
 *     become indistinguishable — but they are different things in law and must
 *     be reported separately.
 *
 *   - ZATCA requires a CATEGORY CODE on every invoice line, not a rate. The
 *     codes are fixed by UN/EDIFACT 5305 and Saudi rules:
 *
 *         S  Standard rate            (currently 15%)
 *         Z  Zero rated               (0%, but taxable — e.g. exports)
 *         E  Exempt from tax          (0%, outside the tax base)
 *         O  Outside scope of tax
 *
 *     An invoice submitted without them is rejected.
 *
 * A rate alone cannot be mapped to a code after the fact, which is why this
 * has to be stored rather than derived.
 *
 * `exemption_reason_code` is required by ZATCA whenever the category is Z, E
 * or O — the authority will not accept a zero-rated line without a stated
 * reason (VATEX-SA-... codes).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_service_taxes', function (Blueprint $table) {
            if (!Schema::hasColumn('product_service_taxes', 'category_code')) {
                $table->string('category_code', 2)
                      ->default('S')
                      ->after('rate')
                      ->comment('ZATCA/UNCL5305 tax category: S standard, Z zero-rated, E exempt, O out of scope');
            }

            if (!Schema::hasColumn('product_service_taxes', 'exemption_reason_code')) {
                $table->string('exemption_reason_code', 20)
                      ->nullable()
                      ->after('category_code')
                      ->comment('ZATCA VATEX-SA-* code. Required when category_code is Z, E or O.');
            }

            if (!Schema::hasColumn('product_service_taxes', 'exemption_reason')) {
                $table->string('exemption_reason', 255)
                      ->nullable()
                      ->after('exemption_reason_code')
                      ->comment('Free-text reason printed on the invoice alongside the code.');
            }
        });

        /*
         * Back-fill existing rows. A 0% rate today is ambiguous — it could be
         * zero-rated or exempt — so it is set to Z (zero-rated) as the more
         * common case and left for review rather than guessed silently.
         * Anything above 0% is unambiguously standard-rated.
         */
        DB::table('product_service_taxes')->where('rate', '>', 0)->update(['category_code' => 'S']);
        DB::table('product_service_taxes')->where('rate', '<=', 0)->update(['category_code' => 'Z']);
    }

    public function down(): void
    {
        Schema::table('product_service_taxes', function (Blueprint $table) {
            foreach (['category_code', 'exemption_reason_code', 'exemption_reason'] as $column) {
                if (Schema::hasColumn('product_service_taxes', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
