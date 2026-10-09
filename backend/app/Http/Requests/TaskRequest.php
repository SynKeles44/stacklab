<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class TaskRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'scope' => ['required', 'in:lesson,module'],
            'id' => ['required', 'integer'],
            'task_id' => ['required', 'string', 'max:100'],
        ];
    }
}
