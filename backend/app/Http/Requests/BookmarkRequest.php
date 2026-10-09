<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class BookmarkRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'type' => ['required', 'in:course,module,lesson,term,task,project'],
            'ref' => ['required', 'string', 'max:190'],
            'label' => ['required', 'string', 'max:190'],
            'url' => ['required', 'string', 'max:300', 'starts_with:/'],
        ];
    }
}
