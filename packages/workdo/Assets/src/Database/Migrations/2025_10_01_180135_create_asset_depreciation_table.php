<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if(!Schema::hasTable('asset_depreciations'))
        {
            Schema::create('asset_depreciations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('asset_id')->constrained('assets')->onDelete('cascade');
                $table->enum('depreciation_method', ['straight_line', 'declining_balance', 'sum_of_years']);
                $table->integer('useful_life_years');
                $table->decimal('salvage_value', 10, 2)->default(0);
                $table->decimal('annual_depreciation', 10, 2)->default(0);
                $table->decimal('accumulated_depreciation', 10, 2)->default(0);
                $table->decimal('book_value', 10, 2)->default(0);
                $table->date('depreciation_start_date');
                $table->date('last_calculated_date')->nullable();
                $table->boolean('is_fully_depreciated')->default(0);
                $table->text('notes')->nullable();
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
        Schema::dropIfExists('asset_depreciations');
    }
};
