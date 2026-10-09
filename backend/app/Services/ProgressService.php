<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ActivityDay;
use App\Models\Course;
use App\Models\ExamAttempt;
use App\Models\Lesson;
use App\Models\LessonCompletion;
use App\Models\ProjectStepCompletion;
use App\Models\TaskCompletion;
use App\Models\TermUnlock;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

final class ProgressService
{
    public function touch(User $user): void
    {
        $today = Carbon::today()->toDateString();
        $updated = ActivityDay::query()
            ->where('user_id', $user->id)
            ->whereDate('day', $today)
            ->increment('actions');

        if ($updated === 0) {
            ActivityDay::query()->insertOrIgnore(['user_id' => $user->id, 'day' => $today, 'actions' => 1]);
        }
    }

    public function streak(User $user): int
    {
        $days = ActivityDay::query()
            ->where('user_id', $user->id)
            ->orderByDesc('day')
            ->limit(400)
            ->pluck('day')
            ->map(fn (mixed $day): string => Carbon::parse($day)->toDateString())
            ->all();

        $set = array_flip($days);
        $cursor = Carbon::today();
        if (! isset($set[$cursor->toDateString()])) {
            $cursor = $cursor->subDay();
        }

        $streak = 0;
        while (isset($set[$cursor->toDateString()])) {
            $streak++;
            $cursor = $cursor->subDay();
        }

        return $streak;
    }

    /** @return array<int, array{completed: int, total: int, percent: int}> */
    public function courseProgress(User $user): array
    {
        $totals = Lesson::query()->select('course_id', DB::raw('count(*) as total'))->groupBy('course_id')->pluck('total', 'course_id');
        $completed = LessonCompletion::query()
            ->join('lessons', 'lessons.id', '=', 'lesson_completions.lesson_id')
            ->where('lesson_completions.user_id', $user->id)
            ->select('lessons.course_id', DB::raw('count(*) as completed'))
            ->groupBy('lessons.course_id')
            ->pluck('completed', 'course_id');

        $result = [];
        foreach ($totals as $courseId => $total) {
            $done = (int) ($completed[$courseId] ?? 0);
            $result[(int) $courseId] = [
                'completed' => $done,
                'total' => (int) $total,
                'percent' => $total > 0 ? (int) round($done / $total * 100) : 0,
            ];
        }

        return $result;
    }

    /** @return list<int> */
    public function completedLessonIds(User $user, ?int $courseId = null): array
    {
        return LessonCompletion::query()
            ->where('user_id', $user->id)
            ->when($courseId !== null, fn ($query) => $query->whereIn('lesson_id', Lesson::query()->where('course_id', $courseId)->select('id')))
            ->pluck('lesson_id')
            ->map(fn (mixed $id): int => (int) $id)
            ->all();
    }

    /** @return list<string> */
    public function completedTaskKeys(User $user, int $courseId): array
    {
        return TaskCompletion::query()
            ->where('user_id', $user->id)
            ->where('course_id', $courseId)
            ->whereNotNull('completed_at')
            ->pluck('task_key')
            ->all();
    }

    /**
     * @return list<array{id: string, title: string, description: string, icon: string, earned: bool}>
     */
    public function badges(User $user): array
    {
        $lessons = LessonCompletion::query()->where('user_id', $user->id)->count();
        $terms = TermUnlock::query()->where('user_id', $user->id)->count();
        $tasks = TaskCompletion::query()->where('user_id', $user->id)->whereNotNull('completed_at')->count();
        $passedExams = ExamAttempt::query()->where('user_id', $user->id)->where('passed', true)->distinct('exam_id')->count('exam_id');
        $projectSteps = ProjectStepCompletion::query()->where('user_id', $user->id)->count();
        $streak = $this->streak($user);
        $finishedCourses = collect($this->courseProgress($user))->filter(fn (array $p): bool => $p['total'] > 0 && $p['completed'] === $p['total'])->count();

        $definitions = [
            ['erste-lektion', 'Erster Schritt', 'Deine erste Lektion abgeschlossen.', 'footprints', $lessons >= 1],
            ['zehn-lektionen', 'Am Ball', '10 Lektionen abgeschlossen.', 'book-open', $lessons >= 10],
            ['fuenfzig-lektionen', 'Bücherwurm', '50 Lektionen abgeschlossen.', 'library', $lessons >= 50],
            ['hundert-lektionen', 'Unaufhaltsam', '100 Lektionen abgeschlossen.', 'rocket', $lessons >= 100],
            ['erster-begriff', 'Wortschatz', 'Deinen ersten Begriff freigeschaltet.', 'sparkles', $terms >= 1],
            ['hundert-begriffe', 'Lexikon-Profi', '100 Begriffe freigeschaltet.', 'book-a', $terms >= 100],
            ['erste-aufgabe', 'Hände am Code', 'Deine erste Aufgabe gelöst.', 'terminal', $tasks >= 1],
            ['fuenfzig-aufgaben', 'Praktiker', '50 Aufgaben gelöst.', 'hammer', $tasks >= 50],
            ['streak-3', 'Dranbleiben', '3 Tage in Folge gelernt.', 'flame', $streak >= 3],
            ['streak-7', 'Eine Woche Feuer', '7 Tage in Folge gelernt.', 'flame-kindling', $streak >= 7],
            ['streak-30', 'Gewohnheit', '30 Tage in Folge gelernt.', 'calendar-check', $streak >= 30],
            ['projekt-start', 'Baumeister', 'Den ersten Projektschritt geschafft.', 'blocks', $projectSteps >= 1],
            ['erste-pruefung', 'Geprüft', 'Deine erste Prüfung bestanden.', 'award', $passedExams >= 1],
            ['erster-kurs', 'Kursabschluss', 'Einen Kurs komplett abgeschlossen.', 'graduation-cap', $finishedCourses >= 1],
            ['fuenf-kurse', 'Full-Stack unterwegs', 'Fünf Kurse komplett abgeschlossen.', 'trophy', $finishedCourses >= 5],
        ];

        return array_map(fn (array $badge): array => [
            'id' => $badge[0],
            'title' => $badge[1],
            'description' => $badge[2],
            'icon' => $badge[3],
            'earned' => $badge[4],
        ], $definitions);
    }

    public function lastVisitedLesson(User $user): ?Lesson
    {
        return Lesson::query()
            ->join('lesson_visits', 'lesson_visits.lesson_id', '=', 'lessons.id')
            ->where('lesson_visits.user_id', $user->id)
            ->orderByDesc('lesson_visits.visited_at')
            ->select('lessons.*')
            ->with('course:id,slug,title,color,icon')
            ->first();
    }

    public function nextLesson(User $user, Course $course): ?Lesson
    {
        $completed = $this->completedLessonIds($user, $course->id);

        return Lesson::query()
            ->where('lessons.course_id', $course->id)
            ->whereNotIn('lessons.id', $completed)
            ->join('course_modules', 'course_modules.id', '=', 'lessons.course_module_id')
            ->orderBy('course_modules.position')
            ->orderBy('lessons.position')
            ->select('lessons.*')
            ->first();
    }
}
