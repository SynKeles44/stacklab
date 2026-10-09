<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int $user_id
 * @property string $type
 * @property string $ref
 * @property string $label
 * @property string $url
 */
class Bookmark extends Model
{
    protected $guarded = [];
}
