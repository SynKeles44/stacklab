<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityDay;
use App\Models\Course;
use App\Models\ExamAttempt;
use App\Models\TaskCompletion;
use App\Models\Term;
use App\Models\TermUnlock;
use App\Services\ProgressService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

final class DashboardController extends Controller
{
    public function __construct(private readonly ProgressService $progress)
    {
    }

    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();
        $courseProgress = $this->progress->courseProgress($user);
        $last = $this->progress->lastVisitedLesson($user);

        $active = Course::query()
            ->whereIn('id', array_keys(array_filter($courseProgress, fn (array $p): bool => $p['completed'] > 0)))
            ->orderBy('position')
            ->get(['id', 'slug', 'title', 'icon', 'color'])
            ->map(fn (Course $course): array => [
                ...$course->only(['slug', 'title', 'icon', 'color']),
                'progress' => $courseProgress[$course->id],
                'next_lesson' => $this->progress->nextLesson($user, $course)?->only(['slug', 'title']),
            ]);

        $activity = ActivityDay::query()
            ->where('user_id', $user->id)
            ->where('day', '>=', Carbon::today()->subDays(83))
            ->get(['day', 'actions'])
            ->map(fn (ActivityDay $day): array => ['day' => $day->day->toDateString(), 'actions' => $day->actions]);

        return response()->json([
            'continue' => $last !== null ? [
                'lesson_slug' => $last->slug,
                'lesson_title' => $last->title,
                'course_slug' => $last->course->slug,
                'course_title' => $last->course->title,
                'color' => $last->course->color,
                'icon' => $last->course->icon,
            ] : null,
            'active_courses' => $active,
            'stats' => [
                'lessons_completed' => array_sum(array_column($courseProgress, 'completed')),
                'lessons_total' => array_sum(array_column($courseProgress, 'total')),
                'terms_unlocked' => TermUnlock::query()->where('user_id', $user->id)->count(),
                'terms_total' => Term::query()->count(),
                'tasks_completed' => TaskCompletion::query()->where('user_id', $user->id)->whereNotNull('completed_at')->count(),
                'exams_passed' => ExamAttempt::query()->where('user_id', $user->id)->where('passed', true)->distinct('exam_id')->count('exam_id'),
                'streak' => $this->progress->streak($user),
            ],
            'activity' => $activity,
            'badges' => $this->progress->badges($user),
        ]);
    }
}
