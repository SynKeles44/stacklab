<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Course;
use App\Models\CourseModule;
use App\Models\Lesson;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * Resolves a task definition from its scope (lesson task or module exercise).
 */
final class TaskLocator
{
    /**
     * @return array{task: array<string, mixed>, course: Course, key: string}
     */
    public function locate(string $scope, int $id, string $taskId): array
    {
        if ($scope === 'lesson') {
            $lesson = Lesson::query()->with('course')->findOrFail($id);
            $task = $lesson->findTask($taskId) ?? throw new ModelNotFoundException("Task {$taskId} not found");

            return ['task' => $task, 'course' => $lesson->course, 'key' => "lesson:{$lesson->id}:{$taskId}"];
        }

        $module = CourseModule::query()->with('course')->findOrFail($id);
        $exercise = $module->exercise;
        if (! is_array($exercise) || ($exercise['id'] ?? null) !== $taskId) {
            throw new ModelNotFoundException("Exercise {$taskId} not found");
        }

        return ['task' => $exercise, 'course' => $module->course, 'key' => "module:{$module->id}:{$taskId}"];
    }

    public function workdir(array $task): string
    {
        $workdir = trim((string) ($task['workdir'] ?? $task['id'] ?? 'aufgabe'), '/');

        return str_replace('..', '', $workdir);
    }
}
