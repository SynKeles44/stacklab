<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class WorkspaceRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'path' => ['required', 'string', 'max:500', 'regex:/^[^\\0\\n\\r"\\$`]+$/'],
        ];
    }
}
