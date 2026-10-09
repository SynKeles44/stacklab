<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateWorkspaceRequest;
use App\Http\Requests\FolderListRequest;
use App\Http\Requests\ResetProgressRequest;
use App\Http\Requests\WorkspaceRequest;
use App\Services\HostFolders;
use App\Services\ProgressReset;
use App\Services\SandboxClient;
use App\Services\WorkspaceLocation;
use Illuminate\Http\JsonResponse;

final class SettingsController extends Controller
{
    public function __construct(
        private readonly SandboxClient $sandbox,
        private readonly WorkspaceLocation $location,
        private readonly HostFolders $folders,
    ) {}

    public function workspace(): JsonResponse
    {
        return response()->json([
            'path' => config('stacklab.workspace.host_path'),
            'writable' => $this->location->envFileWritable(),
            'browse' => $this->folders->enabled(),
            'sandbox' => $this->sandbox->health(),
        ]);
    }

    public function updateWorkspace(WorkspaceRequest $request): JsonResponse
    {
        if (! $this->location->envFileWritable()) {
            return $this->notWritable();
        }

        $path = $request->string('path')->trim()->value();
        $this->location->store($path);

        return $this->restartRequired($path);
    }

    public function folders(FolderListRequest $request): JsonResponse
    {
        abort_unless($this->folders->enabled(), 404, 'Die Ordnerauswahl ist nicht verfügbar.');

        return response()->json($this->folders->list($request->input('path')));
    }

    public function createWorkspace(CreateWorkspaceRequest $request): JsonResponse
    {
        abort_unless($this->folders->enabled(), 404, 'Die Ordnerauswahl ist nicht verfügbar.');
        if (! $this->location->envFileWritable()) {
            return $this->notWritable();
        }

        $path = $this->location->createInside($request->string('parent')->value(), $request->string('name')->trim()->value());

        return $this->restartRequired($path);
    }

    public function resetProgress(ResetProgressRequest $request, ProgressReset $reset): JsonResponse
    {
        $deleted = $reset->reset($request->user(), $request->boolean('include_notes_and_bookmarks'));

        return response()->json(['deleted' => $deleted]);
    }

    private function restartRequired(string $path): JsonResponse
    {
        return response()->json([
            'path' => $path,
            'restart_required' => true,
            'command' => 'make restart',
        ]);
    }

    private function notWritable(): JsonResponse
    {
        return response()->json(['message' => 'Die Datei .env im Projektordner ist nicht beschreibbar. Trage STACKLAB_WORKSPACE dort von Hand ein.'], 422);
    }
}
