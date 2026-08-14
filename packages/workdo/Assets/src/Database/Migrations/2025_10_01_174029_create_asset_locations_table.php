<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        if(!Schema::hasTable('asset_locations'))
        {
            Schema::create('asset_locations', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('code',50);
                $table->enum('type', ['building', 'floor', 'room', 'warehouse', 'site']);
                $table->foreignId('parent_id')->nullable()->constrained('asset_locations')->onDelete('cascade');
                $table->text('address')->nullable();
                $table->string('city', 100)->nullable();
                $table->string('state', 100)->nullable();
                $table->string('country', 100)->nullable();
                $table->string('postal_code', 20)->nullable();
                $table->string('contact_person')->nullable();
                $table->string('contact_phone', 20)->nullable();
                $table->string('contact_email')->nullable();
                $table->text('description')->nullable();
                $table->boolean('is_active')->default(true);
                $table->foreignId('creator_id')->nullable()->index();
                $table->foreignId('created_by')->nullable()->index();

                $table->foreign('creator_id')->references('id')->on('users')->onDelete('set null');
                $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
                $table->timestamps();

                $table->index(['type', 'is_active']);
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('asset_locations');
    }
};
