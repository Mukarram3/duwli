<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if(!Schema::hasTable('assets'))
        {
            Schema::create('assets', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->date('purchase_date')->nullable();
                $table->date('supported_date')->nullable();
                $table->string('serial_code');
                $table->integer('quantity')->nullable();
                $table->decimal('unit_price', 10, 2)->nullable();
                $table->decimal('purchase_cost', 10, 2)->nullable();
                $table->string('warranty_period')->nullable();
                $table->longText('description')->nullable();
                $table->string('image')->nullable();
                $table->foreignId('category_id')->nullable()->constrained('assets_categories')->onDelete('set null');
                $table->foreignId('location_id')->nullable()->constrained('asset_locations')->onDelete('set null');
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
        Schema::dropIfExists('assets');
    }
};
