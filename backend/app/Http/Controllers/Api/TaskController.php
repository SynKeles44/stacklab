<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RunPhpRequest;
use App\Http\Requests\TaskRequest;
use App\Models\Course;
use App\Models\Exam;
use App\Models\TaskCompletion;
use App\Models\User;
use App\Services\ProgressService;
use App\Services\SandboxClient;
use App\Services\TaskLocator;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

final class TaskController extends Controller
{
    public function __construct(
        private readonly TaskLocator $locator,
        private readonly SandboxClient $sandbox,
        private readonly ProgressService $progress,
    ) {}

    public function complete(TaskRequest $request): JsonResponse
    {
        ['task' => $task, 'course' => $course, 'key' => $key] = $this->locator->locate($request->string('scope')->value(), $request->integer('id'), $request->string('task_id')->value());

        if (in_array($task['type'] ?? null, ['terminal'], true) || ($task['type'] ?? null) === 'code' && ($task['language'] ?? null) === 'php') {
            return response()->json(['message' => 'Diese Aufgabe wird von der Sandbox geprüft.'], 422);
        }

        return response()->json(['completed' => true, 'newly_completed' => $this->markDone($request->user(), $course, $key, true)]);
    }

    public function verify(TaskRequest $request): JsonResponse
    {
        ['task' => $task, 'course' => $course, 'key' => $key] = $this->locator->locate($request->string('scope')->value(), $request->integer('id'), $request->string('task_id')->value());

        if (($task['type'] ?? null) !== 'terminal') {
            return response()->json(['message' => 'Nur Terminal-Aufgaben werden in der Sandbox geprüft.'], 422);
        }

        $result = $this->sandbox->check((string) $course->workspace_dir, $this->locator->workdir($task), (array) ($task['checks'] ?? []));
        $newly = $this->markDone($request->user(), $course, $key, (bool) $result['passed']);

        return response()->json([...$result, 'newly_completed' => $newly]);
    }

    public function reset(TaskRequest $request): JsonResponse
    {
        ['task' => $task, 'course' => $course] = $this->locator->locate($request->string('scope')->value(), $request->integer('id'), $request->string('task_id')->value());

        if (($task['type'] ?? null) !== 'terminal') {
            return response()->json(['message' => 'Nur Terminal-Aufgaben können zurückgesetzt werden.'], 422);
        }

        return response()->json($this->sandbox->reset((string) $course->workspace_dir, $this->locator->workdir($task), $task['setup'] ?? null));
    }

    public function runPhp(RunPhpRequest $request): JsonResponse
    {
        $scope = $request->string('scope')->value();
        $taskId = $request->string('task_id')->value();

        if ($scope === 'exam') {
            $exam = Exam::query()->with('course')->findOrFail($request->integer('id'));
            $task = collect($exam->tasks)->firstWhere('id', $taskId) ?? throw new ModelNotFoundException;
            $course = $exam->course;
            $key = null;
        } else {
            ['task' => $task, 'course' => $course, 'key' => $key] = $this->locator->locate($scope, $request->integer('id'), $taskId);
        }

        if (($task['type'] ?? null) !== 'code' || ($task['language'] ?? null) !== 'php') {
            return response()->json(['message' => 'Keine PHP-Aufgabe.'], 422);
        }

        $result = $this->sandbox->runPhp((string) $course->workspace_dir, $request->string('code')->value(), (array) ($task['tests'] ?? []));
        $newly = $key !== null && $this->markDone($request->user(), $course, $key, (bool) $result['passed']);

        return response()->json([...$result, 'newly_completed' => $newly]);
    }

    private function markDone(User $user, Course $course, string $key, bool $passed): bool
    {
        $completion = TaskCompletion::query()->firstOrNew(['user_id' => $user->id, 'task_key' => $key], ['course_id' => $course->id]);
        $completion->attempts++;
        $newly = false;
        if ($passed && $completion->completed_at === null) {
            $completion->completed_at = Carbon::now();
            $newly = true;
        }
        $completion->save();
        $this->progress->touch($user);

        return $newly;
    }
}
