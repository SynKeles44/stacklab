<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $course_id
 * @property string $slug
 * @property string $title
 * @property string $description
 * @property string|null $goal
 * @property string $workdir
 * @property string|null $setup
 * @property list<array<string, mixed>> $steps
 * @property Course $course
 */
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

    /** @param  array<string, mixed>  $step */
    public function stepWorkdir(array $step): string
    {
        return is_string($step['workdir'] ?? null) && $step['workdir'] !== '' ? $step['workdir'] : $this->workdir;
    }

    /** @param  array<string, mixed>  $step */
    public static function solveScript(array $step): ?string
    {
        $script = is_string($step['solve'] ?? null) ? trim($step['solve']) : '';

        return $script === '' ? null : $script;
    }
}
