<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('users')) {
              Schema::table('users', function (Blueprint $table) {
                if (!Schema::hasColumn('users', 'default_pipeline')) {
                    $table->string('default_pipeline')->nullable()->after('is_disable');
                }                
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('add_default_pipeline_to_users');
    }
};