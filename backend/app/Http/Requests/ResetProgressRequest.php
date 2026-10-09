<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class ResetProgressRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'include_notes_and_bookmarks' => ['sometimes', 'boolean'],
        ];
    }
}
