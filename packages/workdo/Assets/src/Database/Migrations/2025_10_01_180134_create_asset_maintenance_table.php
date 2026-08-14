<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        if (!Schema::hasTable('asset_maintenance')) {
            Schema::create('asset_maintenance', function (Blueprint $table) {
                $table->id();
                $table->foreignId('asset_id')->constrained('assets')->onDelete('cascade');
                $table->enum('maintenance_type', ['preventive', 'corrective', 'emergency']);
                $table->string('title');
                $table->text('description')->nullable();
                $table->date('scheduled_date');
                $table->date('completed_date')->nullable();
                $table->decimal('cost', 10, 2)->nullable();
                $table->string('technician_name')->nullable();
                $table->enum('status', ['scheduled', 'in_progress', 'completed', 'cancelled'])->default('scheduled');
                $table->enum('priority', ['low', 'medium', 'high', 'critical'])->default('medium');
                $table->text('notes')->nullable();
                $table->date('next_maintenance_date')->nullable();
                $table->foreignId('creator_id')->nullable()->index();
                $table->foreignId('created_by')->nullable()->index();
                
                $table->foreign('creator_id')->references('id')->on('users')->onDelete('set null');
                $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
                $table->timestamps();

                $table->index(['asset_id', 'status']);
                $table->index(['scheduled_date', 'status']);
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('asset_maintenance');
    }
};
