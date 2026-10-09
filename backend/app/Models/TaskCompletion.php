<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property int $course_id
 * @property string $task_key
 * @property int $attempts
 * @property Carbon|null $completed_at
 */
class TaskCompletion extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['completed_at' => 'datetime'];
    }
}
