<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Project extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['steps' => 'array'];
    }

    /** @return BelongsTo<Course, $this> */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /** @return array<string, mixed>|null */
    public function findStep(string $stepId): ?array
    {
        foreach ($this->steps as $step) {
            if (($step['id'] ?? null) === $stepId) {
                return $step;
            }
        }

        return null;
    }
}
