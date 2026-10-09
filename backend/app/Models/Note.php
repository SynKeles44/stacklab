<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int $user_id
 * @property int $lesson_id
 * @property string $body
 */
class Note extends Model
{
    protected $guarded = [];
}
