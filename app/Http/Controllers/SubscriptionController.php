<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Models\Subscription;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SubscriptionController extends Controller
{
    public function create()
    {
        return Inertia::render('plans/select', [
            'plans' => Plan::all(['id', 'name', 'price', 'interval']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'plan_id' => 'required|exists:plans,id',
        ]);

        Subscription::create([
            'user_id' => Auth::id(),
            'plan_id' => $validated['plan_id'],
            'status' => 'active',
            'starts_at' => now(),
        ]);

        return redirect()->route('dashboard');
    }
}
