<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $course_id
 * @property string $title
 * @property string|null $description
 * @property int|null $time_limit_minutes
 * @property int $pass_percent
 * @property list<array<string, mixed>> $questions
 * @property list<array<string, mixed>> $tasks
 * @property Course $course
 */
class Exam extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'questions' => 'array',
            'tasks' => 'array',
        ];
    }

    /** @return BelongsTo<Course, $this> */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
