<?php
// packages/workdo/Account/src/Database/Migrations/2026_08_22_100000_add_is_group_to_chart_of_accounts_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Adds is_group to the chart of accounts.
 *
 * A group account is a heading that holds other accounts and is never posted
 * to directly. A detail (non-group) account is a posting account and must sit
 * under a parent.
 *
 * Existing rows are backfilled from the data already present: any account that
 * is already someone's parent becomes a group, everything else stays a detail
 * account. That keeps current charts working without manual re-entry.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('chart_of_accounts')) {
            return;
        }

        if (!Schema::hasColumn('chart_of_accounts', 'is_group')) {
            Schema::table('chart_of_accounts', function (Blueprint $table) {
                $table->boolean('is_group')->default(false)->after('level');
                $table->index('is_group');
            });
        }

        // Backfill: anything that already has children is a group account.
        DB::statement('
            UPDATE chart_of_accounts
               SET is_group = 1
             WHERE id IN (
                   SELECT parent_id FROM (
                       SELECT DISTINCT parent_account_id AS parent_id
                         FROM chart_of_accounts
                        WHERE parent_account_id IS NOT NULL
                   ) AS parents
             )
        ');
    }

    public function down(): void
    {
        if (Schema::hasColumn('chart_of_accounts', 'is_group')) {
            Schema::table('chart_of_accounts', function (Blueprint $table) {
                $table->dropIndex(['is_group']);
                $table->dropColumn('is_group');
            });
        }
    }
};
