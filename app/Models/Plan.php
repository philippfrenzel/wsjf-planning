<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\SoftDeletesWithUser;

class Plan extends Model
{
    use HasFactory, SoftDeletesWithUser;

    protected $fillable = [
        'name',
        'price',
        'interval',
        'stripe_price_id',
    ];
}
