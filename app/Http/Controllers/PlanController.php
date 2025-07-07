<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PlanController extends Controller
{
    public function index()
    {
        return Inertia::render('plans/index', [
            'plans' => Plan::all(['id', 'name', 'price', 'interval']),
        ]);
    }

    public function create()
    {
        return Inertia::render('plans/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|integer',
            'interval' => 'required|string',
        ]);

        Plan::create($validated);
        return redirect()->route('plans.index');
    }
}
