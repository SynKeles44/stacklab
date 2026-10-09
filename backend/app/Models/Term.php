<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property string $slug
 * @property string $term
 * @property string $short
 * @property string $explanation
 * @property string|null $example
 * @property string $category
 * @property list<string> $aliases
 * @property list<string> $related
 * @property int|null $lesson_id
 * @property Lesson|null $lesson
 */
class Term extends Model
{
    protected $guarded = [];

    protected $hidden = ['search_vector'];

    protected function casts(): array
    {
        return [
            'aliases' => 'array',
            'related' => 'array',
        ];
    }

    /** @return BelongsTo<Lesson, $this> */
    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }
}
