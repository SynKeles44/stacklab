<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $course_id
 * @property int $course_module_id
 * @property string $slug
 * @property string $title
 * @property string|null $summary
 * @property int $position
 * @property int $duration_minutes
 * @property string $body
 * @property list<array<string, mixed>> $quiz
 * @property list<array<string, mixed>> $tasks
 * @property list<string> $term_slugs
 * @property list<array{title: string, url: string}> $sources
 * @property string $search_text
 * @property Course $course
 * @property CourseModule $module
 */
class Lesson extends Model
{
    protected $guarded = [];

    protected $hidden = ['search_text', 'search_vector'];

    protected function casts(): array
    {
        return [
            'quiz' => 'array',
            'tasks' => 'array',
            'term_slugs' => 'array',
            'sources' => 'array',
        ];
    }

    /** @return BelongsTo<Course, $this> */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /** @return BelongsTo<CourseModule, $this> */
    public function module(): BelongsTo
    {
        return $this->belongsTo(CourseModule::class, 'course_module_id');
    }

    /** @return array<string, mixed>|null */
    public function findTask(string $taskId): ?array
    {
        foreach ($this->tasks as $task) {
            if (($task['id'] ?? null) === $taskId) {
                return $task;
            }
        }

        return null;
    }
}
