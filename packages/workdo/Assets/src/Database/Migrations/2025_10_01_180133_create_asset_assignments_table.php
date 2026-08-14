<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if(!Schema::hasTable('asset_assignments'))
        {
            Schema::create('asset_assignments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('asset_id')->constrained('assets')->onDelete('cascade');
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->date('assigned_date');
                $table->date('expected_return_date')->nullable();
                $table->date('returned_date')->nullable();
                $table->enum('status', ['active', 'returned', 'overdue'])->default('active');
                $table->enum('condition_on_assignment', ['excellent', 'good', 'fair', 'poor']);
                $table->enum('condition_on_return', ['excellent', 'good', 'fair', 'poor'])->nullable();
                $table->text('assignment_notes')->nullable();
                $table->text('return_notes')->nullable();
                $table->foreignId('assigned_by')->constrained('users')->onDelete('cascade');
                $table->foreignId('returned_by')->nullable()->constrained('users')->onDelete('set null');
                $table->foreignId('creator_id')->nullable()->index();
                $table->foreignId('created_by')->nullable()->index();

                $table->foreign('creator_id')->references('id')->on('users')->onDelete('set null');
                $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_assignments');
    }
};