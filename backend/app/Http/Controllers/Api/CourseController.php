<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Lesson;
use App\Services\ProgressService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class CourseController extends Controller
{
    public function __construct(private readonly ProgressService $progress)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user('sanctum');
        $progress = $user !== null ? $this->progress->courseProgress($user) : [];

        $courses = Course::query()
            ->withCount(['lessons', 'modules'])
            ->orderBy('position')
            ->get()
            ->map(fn (Course $course): array => [
                ...$this->summary($course),
                'progress' => $progress[$course->id] ?? null,
            ]);

        return response()->json(['courses' => $courses]);
    }

    public function show(Request $request, string $slug): JsonResponse
    {
        $course = Course::query()
            ->where('slug', $slug)
            ->with(['modules.lessons:id,course_id,course_module_id,slug,title,summary,position,duration_minutes,tasks', 'project:id,course_id,title,description,steps', 'exam:id,course_id,title,description,time_limit_minutes,pass_percent,questions,tasks'])
            ->firstOrFail();

        $user = $request->user('sanctum');
        $completed = $user !== null ? array_flip($this->progress->completedLessonIds($user, $course->id)) : [];
        $tasksDone = $user !== null ? array_flip($this->progress->completedTaskKeys($user, $course->id)) : [];

        return response()->json([
            'course' => [
                ...$this->summary($course),
                'learning_goals' => $course->learning_goals,
                'references' => $course->references,
                'prerequisites' => Course::query()->whereIn('slug', $course->prerequisites)->get(['slug', 'title'])->all(),
                'modules' => $course->modules->map(fn ($module): array => [
                    'id' => $module->id,
                    'slug' => $module->slug,
                    'title' => $module->title,
                    'description' => $module->description,
                    'position' => $module->position,
                    'exercise' => $module->exercise,
                    'exercise_done' => is_array($module->exercise) && isset($tasksDone["module:{$module->id}:{$module->exercise['id']}"]),
                    'lessons' => $module->lessons->map(fn (Lesson $lesson): array => [
                        'id' => $lesson->id,
                        'slug' => $lesson->slug,
                        'title' => $lesson->title,
                        'summary' => $lesson->summary,
                        'duration_minutes' => $lesson->duration_minutes,
                        'task_count' => count($lesson->tasks),
                        'completed' => isset($completed[$lesson->id]),
                    ])->all(),
                ])->all(),
                'project' => $course->project !== null ? [
                    'title' => $course->project->title,
                    'description' => $course->project->description,
                    'step_count' => count($course->project->steps),
                ] : null,
                'exam' => $course->exam !== null ? [
                    'title' => $course->exam->title,
                    'question_count' => count($course->exam->questions) + count($course->exam->tasks),
                    'time_limit_minutes' => $course->exam->time_limit_minutes,
                ] : null,
                'next_lesson' => $user !== null ? $this->progress->nextLesson($user, $course)?->only(['slug', 'title']) : null,
            ],
        ]);
    }

    /** @return array<string, mixed> */
    private function summary(Course $course): array
    {
        return [
            'id' => $course->id,
            'slug' => $course->slug,
            'title' => $course->title,
            'subtitle' => $course->subtitle,
            'description' => $course->description,
            'category' => $course->category,
            'level' => $course->level,
            'position' => $course->position,
            'icon' => $course->icon,
            'color' => $course->color,
            'estimated_hours' => $course->estimated_hours,
            'workspace_dir' => $course->workspace_dir,
            'lessons_count' => $course->lessons_count ?? $course->lessons()->count(),
            'modules_count' => $course->modules_count ?? $course->modules()->count(),
        ];
    }
}
