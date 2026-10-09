<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $course_id
 * @property string $slug
 * @property string $title
 * @property string|null $description
 * @property int $position
 * @property array<string, mixed>|null $exercise
 * @property Course $course
 * @property Collection<int, Lesson> $lessons
 */
class CourseModule extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['exercise' => 'array'];
    }

    /** @return BelongsTo<Course, $this> */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /** @return HasMany<Lesson, $this> */
    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class)->orderBy('position');
    }
}
