<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class RunPhpRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'scope' => ['required', 'in:lesson,module,exam'],
            'id' => ['required', 'integer'],
            'task_id' => ['required', 'string', 'max:100'],
            'code' => ['required', 'string', 'max:50000'],
        ];
    }
}
