<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ActivityDay;
use App\Models\Bookmark;
use App\Models\ExamAttempt;
use App\Models\LessonCompletion;
use App\Models\LessonVisit;
use App\Models\Note;
use App\Models\ProjectStepCompletion;
use App\Models\QuizAttempt;
use App\Models\TaskCompletion;
use App\Models\TermUnlock;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final class ProgressReset
{
    /** @return array<string, int> */
    public function reset(User $user, bool $includeNotesAndBookmarks): array
    {
        $models = [
            'lessons' => LessonCompletion::class,
            'visits' => LessonVisit::class,
            'quizzes' => QuizAttempt::class,
            'tasks' => TaskCompletion::class,
            'terms' => TermUnlock::class,
            'project_steps' => ProjectStepCompletion::class,
            'exams' => ExamAttempt::class,
            'activity' => ActivityDay::class,
        ];
        if ($includeNotesAndBookmarks) {
            $models['notes'] = Note::class;
            $models['bookmarks'] = Bookmark::class;
        }

        return DB::transaction(function () use ($models, $user): array {
            $deleted = [];
            foreach ($models as $key => $model) {
                $deleted[$key] = $model::query()->where('user_id', $user->id)->delete();
            }

            return $deleted;
        });
    }
}
