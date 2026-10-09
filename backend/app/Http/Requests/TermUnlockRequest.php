<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class TermUnlockRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'slugs' => ['required', 'array', 'max:200'],
            'slugs.*' => ['string', 'max:100'],
        ];
    }
}
