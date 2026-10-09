<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
