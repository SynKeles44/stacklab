<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int $user_id
 * @property int $lesson_id
 * @property int $score
 * @property int $max_score
 * @property array<int, mixed> $answers
 */
class QuizAttempt extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['answers' => 'array'];
    }
}
