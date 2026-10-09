<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property int $exam_id
 * @property Carbon $started_at
 * @property Carbon|null $finished_at
 * @property int $score
 * @property int $max_score
 * @property bool $passed
 * @property array<string, mixed>|null $result
 * @property Exam $exam
 */
class ExamAttempt extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
            'passed' => 'boolean',
            'result' => 'array',
        ];
    }

    /** @return BelongsTo<Exam, $this> */
    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }
}
