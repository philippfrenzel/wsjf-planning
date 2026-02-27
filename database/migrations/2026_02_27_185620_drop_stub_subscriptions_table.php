<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('subscriptions');
    }

    public function down(): void
    {
        // Stub table not restored — replaced by Cashier schema
    }
};
