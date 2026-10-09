<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Services\SandboxClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class TerminalController extends Controller
{
    public function __construct(private readonly SandboxClient $sandbox)
    {
    }

    public function session(Request $request): JsonResponse
    {
        $course = Course::query()->where('slug', (string) $request->query('course'))->firstOrFail();

        return response()->json([
            'token' => $this->sandbox->terminalToken($request->user()->id, (string) $course->workspace_dir),
            'workspace_dir' => $course->workspace_dir,
            'url' => '/terminal/ws',
        ]);
    }

    public function status(): JsonResponse
    {
        return response()->json($this->sandbox->health());
    }
}
