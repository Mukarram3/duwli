<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_stages', function (Blueprint $table) {
            $table->dropForeign(['pipeline_id']);
            $table->foreign('pipeline_id')->references('id')->on('pipelines')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('lead_stages', function (Blueprint $table) {
            $table->dropForeign(['pipeline_id']);
            $table->foreign('pipeline_id')->references('id')->on('pipelines')->onDelete('set null');
        });
    }
};
