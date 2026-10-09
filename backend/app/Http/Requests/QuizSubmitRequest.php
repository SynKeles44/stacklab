<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class QuizSubmitRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'score' => ['required', 'integer', 'min:0'],
            'max_score' => ['required', 'integer', 'min:1'],
            'answers' => ['present', 'array'],
        ];
    }
}
