<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Course extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'prerequisites' => 'array',
            'learning_goals' => 'array',
            'references' => 'array',
        ];
    }

    /** @return HasMany<CourseModule, $this> */
    public function modules(): HasMany
    {
        return $this->hasMany(CourseModule::class)->orderBy('position');
    }

    /** @return HasMany<Lesson, $this> */
    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class);
    }

    /** @return HasOne<Project, $this> */
    public function project(): HasOne
    {
        return $this->hasOne(Project::class);
    }

    /** @return HasOne<Exam, $this> */
    public function exam(): HasOne
    {
        return $this->hasOne(Exam::class);
    }
}
