<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Http\JsonResponse;
use RuntimeException;

final class SandboxUnavailable extends RuntimeException
{
    public function __construct(string $message = 'Die Übungs-Sandbox ist nicht erreichbar. Läuft der Container "sandbox"?')
    {
        parent::__construct($message);
    }

    public function render(): JsonResponse
    {
        return response()->json(['message' => $this->getMessage()], 503);
    }
}
