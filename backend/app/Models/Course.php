<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * @property int $id
 * @property string $slug
 * @property string $title
 * @property string|null $subtitle
 * @property string $description
 * @property string $category
 * @property string $level
 * @property int $position
 * @property string|null $icon
 * @property string|null $color
 * @property int $estimated_hours
 * @property list<string> $prerequisites
 * @property list<string> $learning_goals
 * @property list<string> $references
 * @property string|null $workspace_dir
 * @property int|null $lessons_count
 * @property int|null $modules_count
 * @property int|string|null $lessons_sum_duration_minutes
 * @property Collection<int, CourseModule> $modules
 * @property Project|null $project
 * @property Exam|null $exam
 */
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
