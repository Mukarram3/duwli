<?php
// packages/workdo/Account/src/Database/Migrations/2026_09_01_100000_create_audit_process_items_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Audit process queue.
 *
 * A polymorphic queue so ANY document can be flagged for audit review —
 * debit notes, invoices, bills, journal entries — without a column on each
 * table and without a separate queue per document type.
 *
 * Deliberately additive: nothing about the source document changes when it is
 * added, so flagging for audit can never alter a posted figure.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('audit_process_items')) {
            return;
        }

        Schema::create('audit_process_items', function (Blueprint $table) {
            $table->id();

            // The document under review.
            $table->string('auditable_type');
            $table->unsignedBigInteger('auditable_id');

            // A human-readable label captured at the time it was added, so the
            // queue still reads correctly if the source document is later
            // renumbered or deleted.
            $table->string('reference')->nullable();
            $table->decimal('amount', 15, 2)->default(0);

            $table->enum('status', ['pending', 'in_review', 'approved', 'rejected'])
                  ->default('pending');
            $table->text('note')->nullable();
            $table->text('reviewer_note')->nullable();

            $table->unsignedBigInteger('added_by');
            $table->unsignedBigInteger('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();

            $table->unsignedBigInteger('creator_id');
            $table->unsignedBigInteger('created_by');
            $table->timestamps();

            $table->index(['auditable_type', 'auditable_id']);
            $table->index(['created_by', 'status']);

            // The same document cannot sit in the queue twice.
            $table->unique(['auditable_type', 'auditable_id', 'created_by'], 'audit_unique_document');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_process_items');
    }
};
