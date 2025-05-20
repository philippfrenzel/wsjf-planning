<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Planning extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'title',
        'description',
        'planned_at', // Wann geplant
        'executed_at', // Wann durchgeführt
        // weitere Felder nach Bedarf
    ];

    /**
     * Ein Planning gehört zu genau einem Project.
     */
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Ein Planning kann mehrere Stakeholder (User) haben.
     */
    public function stakeholders()
    {
        return $this->belongsToMany(User::class, 'planning_stakeholder', 'planning_id', 'user_id')
            ->withTimestamps();
    }
}
