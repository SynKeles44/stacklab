<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\WorkspaceRequest;
use App\Services\SandboxClient;
use Illuminate\Http\JsonResponse;

final class SettingsController extends Controller
{
    public function __construct(private readonly SandboxClient $sandbox)
    {
    }

    public function workspace(): JsonResponse
    {
        return response()->json([
            'path' => config('stacklab.workspace.host_path'),
            'writable' => $this->envFileWritable(),
            'sandbox' => $this->sandbox->health(),
        ]);
    }

    public function updateWorkspace(WorkspaceRequest $request): JsonResponse
    {
        if (! $this->envFileWritable()) {
            return response()->json(['message' => 'Die Datei .env im Projektordner ist nicht beschreibbar. Trage STACKLAB_WORKSPACE dort von Hand ein.'], 422);
        }

        $file = (string) config('stacklab.workspace.env_file');
        $path = $request->string('path')->trim()->value();
        $contents = is_file($file) ? (string) file_get_contents($file) : '';
        $line = 'STACKLAB_WORKSPACE="'.$path.'"';

        $contents = preg_match('/^STACKLAB_WORKSPACE=.*$/m', $contents) === 1
            ? (string) preg_replace('/^STACKLAB_WORKSPACE=.*$/m', $line, $contents)
            : rtrim($contents).PHP_EOL.$line.PHP_EOL;

        file_put_contents($file, ltrim($contents));

        return response()->json([
            'path' => $path,
            'restart_required' => true,
            'command' => 'docker compose up -d',
        ]);
    }

    private function envFileWritable(): bool
    {
        $file = (string) config('stacklab.workspace.env_file');

        return is_file($file) ? is_writable($file) : is_dir(dirname($file)) && is_writable(dirname($file));
    }
}
