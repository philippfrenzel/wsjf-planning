<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Concerns\SoftDeletesWithUser;

class Plan extends Model
{
    use HasFactory, SoftDeletesWithUser;

    protected $fillable = [
        'name',
        'price',
        'interval',
    ];

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }
}
