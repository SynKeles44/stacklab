<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\QuizSubmitRequest;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonCompletion;
use App\Models\LessonVisit;
use App\Models\Note;
use App\Models\QuizAttempt;
use App\Models\Term;
use App\Models\TermUnlock;
use App\Services\ProgressService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

final class LessonController extends Controller
{
    public function __construct(private readonly ProgressService $progress) {}

    public function show(Request $request, string $courseSlug, string $lessonSlug): JsonResponse
    {
        $course = Course::query()->where('slug', $courseSlug)->firstOrFail();
        $lesson = Lesson::query()->where('course_id', $course->id)->where('slug', $lessonSlug)->with('module')->firstOrFail();

        $ordered = Lesson::query()
            ->where('lessons.course_id', $course->id)
            ->join('course_modules', 'course_modules.id', '=', 'lessons.course_module_id')
            ->orderBy('course_modules.position')
            ->orderBy('lessons.position')
            ->get(['lessons.id', 'lessons.slug', 'lessons.title']);
        $index = $ordered->search(fn (Lesson $item): bool => $item->id === $lesson->id);

        $terms = Term::query()->whereIn('slug', $lesson->term_slugs)->get(['id', 'slug', 'term', 'short', 'example', 'category']);

        $user = $request->user('sanctum');
        $state = null;
        if ($user !== null) {
            $tasksDone = $this->progress->completedTaskKeys($user, $course->id);
            $unlocked = TermUnlock::query()->where('user_id', $user->id)->whereIn('term_id', $terms->pluck('id'))->pluck('term_id')->all();
            $bestQuiz = QuizAttempt::query()->where('user_id', $user->id)->where('lesson_id', $lesson->id)->orderByDesc('score')->first(['score', 'max_score']);
            $state = [
                'completed' => LessonCompletion::query()->where('user_id', $user->id)->where('lesson_id', $lesson->id)->exists(),
                'completed_tasks' => array_values(array_map(
                    fn (string $key): string => substr($key, strlen("lesson:{$lesson->id}:")),
                    array_filter($tasksDone, fn (string $key): bool => str_starts_with($key, "lesson:{$lesson->id}:")),
                )),
                'unlocked_terms' => $terms->whereIn('id', $unlocked)->pluck('slug')->values()->all(),
                'best_quiz' => $bestQuiz?->only(['score', 'max_score']),
                'note' => Note::query()->where('user_id', $user->id)->where('lesson_id', $lesson->id)->value('body'),
            ];
        }

        return response()->json([
            'lesson' => [
                'id' => $lesson->id,
                'slug' => $lesson->slug,
                'title' => $lesson->title,
                'summary' => $lesson->summary,
                'duration_minutes' => $lesson->duration_minutes,
                'body' => $lesson->body,
                'quiz' => $lesson->quiz,
                'tasks' => $lesson->tasks,
                'sources' => $lesson->sources,
                'module' => ['id' => $lesson->module->id, 'slug' => $lesson->module->slug, 'title' => $lesson->module->title],
                'course' => ['id' => $course->id, 'slug' => $course->slug, 'title' => $course->title, 'color' => $course->color, 'icon' => $course->icon, 'workspace_dir' => $course->workspace_dir],
                'terms' => $terms->map(fn (Term $term): array => $term->only(['slug', 'term', 'short', 'example', 'category']))->all(),
                'previous' => $index !== false && $index > 0 ? $ordered[$index - 1]->only(['slug', 'title']) : null,
                'next' => $index !== false && $index < $ordered->count() - 1 ? $ordered[$index + 1]->only(['slug', 'title']) : null,
                'position' => $index === false ? null : $index + 1,
                'total' => $ordered->count(),
            ],
            'state' => $state,
        ]);
    }

    public function visit(Request $request, Lesson $lesson): JsonResponse
    {
        LessonVisit::query()->updateOrCreate(
            ['user_id' => $request->user()->id, 'lesson_id' => $lesson->id],
            ['visited_at' => Carbon::now()],
        );
        $this->progress->touch($request->user());

        return response()->json(['ok' => true]);
    }

    public function complete(Request $request, Lesson $lesson): JsonResponse
    {
        $created = LessonCompletion::query()->firstOrCreate(
            ['user_id' => $request->user()->id, 'lesson_id' => $lesson->id],
            ['completed_at' => Carbon::now()],
        )->wasRecentlyCreated;
        $this->progress->touch($request->user());

        $progress = $this->progress->courseProgress($request->user())[$lesson->course_id] ?? null;

        return response()->json([
            'ok' => true,
            'newly_completed' => $created,
            'course_progress' => $progress,
            'course_completed' => $progress !== null && $progress['completed'] === $progress['total'],
        ]);
    }

    public function submitQuiz(QuizSubmitRequest $request, Lesson $lesson): JsonResponse
    {
        QuizAttempt::query()->create([
            'user_id' => $request->user()->id,
            'lesson_id' => $lesson->id,
            'score' => min($request->integer('score'), $request->integer('max_score')),
            'max_score' => $request->integer('max_score'),
            'answers' => $request->input('answers'),
        ]);
        $this->progress->touch($request->user());

        return response()->json(['ok' => true]);
    }
}
