<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class CreateWorkspaceRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'parent' => ['required', 'string', 'max:500', 'regex:/^\/[^\0\n\r"$`]*$/'],
            'name' => ['required', 'string', 'max:64', 'regex:/^[A-Za-z0-9][A-Za-z0-9._ -]*$/', 'not_regex:/\.\./'],
        ];
    }
}
