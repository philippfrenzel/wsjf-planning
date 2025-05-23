<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Project;

class DashboardController extends Controller
{
    /**
     * Zeigt das Dashboard mit KPIs an.
     */
    public function index(Request $request)
    {
        $userId = auth()->id();
        $myProjectsCount = Project::where('created_by', $userId)->count();

        return Inertia::render('dashboard', [
            'myProjectsCount' => $myProjectsCount,
        ]);
    }
}
