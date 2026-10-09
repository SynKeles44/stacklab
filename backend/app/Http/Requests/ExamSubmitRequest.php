<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class ExamSubmitRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'answers' => ['present', 'array'],
            'tasks' => ['present', 'array'],
            'tasks.*.passed' => ['sometimes', 'boolean'],
            'tasks.*.code' => ['sometimes', 'string', 'max:50000'],
        ];
    }
}
