<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ExamSubmitRequest;
use App\Models\Course;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Services\ProgressService;
use App\Services\QuizGrader;
use App\Services\SandboxClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

final class ExamController extends Controller
{
    public function __construct(
        private readonly QuizGrader $grader,
        private readonly SandboxClient $sandbox,
        private readonly ProgressService $progress,
    ) {
    }

    public function show(Request $request, string $courseSlug): JsonResponse
    {
        $course = Course::query()->where('slug', $courseSlug)->firstOrFail();
        $exam = Exam::query()->where('course_id', $course->id)->firstOrFail();
        $user = $request->user('sanctum');

        return response()->json([
            'exam' => [
                'id' => $exam->id,
                'title' => $exam->title,
                'description' => $exam->description,
                'time_limit_minutes' => $exam->time_limit_minutes,
                'pass_percent' => $exam->pass_percent,
                'question_count' => count($exam->questions),
                'task_count' => count($exam->tasks),
                'course' => $course->only(['id', 'slug', 'title', 'color', 'icon', 'workspace_dir']),
            ],
            'attempts' => $user !== null
                ? ExamAttempt::query()->where('user_id', $user->id)->where('exam_id', $exam->id)->whereNotNull('finished_at')->latest('finished_at')->limit(10)
                    ->get(['id', 'score', 'max_score', 'passed', 'finished_at'])
                : [],
        ]);
    }

    public function start(Request $request, Exam $exam): JsonResponse
    {
        $attempt = ExamAttempt::query()->create([
            'user_id' => $request->user()->id,
            'exam_id' => $exam->id,
            'started_at' => Carbon::now(),
        ]);

        return response()->json([
            'attempt_id' => $attempt->id,
            'started_at' => $attempt->started_at->toIso8601String(),
            'deadline' => $exam->time_limit_minutes !== null ? $attempt->started_at->copy()->addMinutes($exam->time_limit_minutes)->toIso8601String() : null,
            'questions' => array_map(
                fn (array $question, int $index): array => $this->grader->publicQuestion($question, $attempt->id * 1000 + $index),
                $exam->questions,
                array_keys($exam->questions),
            ),
            'tasks' => array_map(function (array $task): array {
                unset($task['solution']);

                return $task;
            }, $exam->tasks),
        ]);
    }

    public function submit(ExamSubmitRequest $request, ExamAttempt $attempt): JsonResponse
    {
        abort_if($attempt->user_id !== $request->user()->id, 403);
        abort_if($attempt->finished_at !== null, 409, 'Dieser Versuch wurde bereits abgegeben.');

        $exam = $attempt->exam()->with('course')->firstOrFail();
        $answers = (array) $request->input('answers');
        $taskInput = (array) $request->input('tasks');

        $modules = $exam->course->modules()->get(['slug', 'title'])->keyBy('slug');
        $perModule = [];
        $details = [];
        $score = 0;

        foreach ($exam->questions as $index => $question) {
            $correct = $this->grader->isCorrect($question, $answers[$index] ?? null);
            $details[] = ['kind' => 'question', 'index' => $index, 'correct' => $correct, 'module' => $question['module'], 'explanation' => $question['explanation'] ?? null];
            $this->tally($perModule, (string) $question['module'], $correct);
            $score += $correct ? 1 : 0;
        }

        foreach ($exam->tasks as $task) {
            $input = (array) ($taskInput[$task['id']] ?? []);
            $passed = match (true) {
                ($task['type'] ?? null) === 'terminal' => (bool) $this->sandbox->check((string) $exam->course->workspace_dir, (string) ($task['workdir'] ?? $task['id']), (array) $task['checks'])['passed'],
                ($task['language'] ?? null) === 'php' && isset($input['code']) => (bool) $this->sandbox->runPhp((string) $exam->course->workspace_dir, (string) $input['code'], (array) $task['tests'])['passed'],
                default => (bool) ($input['passed'] ?? false),
            };
            $details[] = ['kind' => 'task', 'id' => $task['id'], 'correct' => $passed, 'module' => $task['module']];
            $this->tally($perModule, (string) $task['module'], $passed, 2);
            $score += $passed ? 2 : 0;
        }

        $max = count($exam->questions) + count($exam->tasks) * 2;
        $percent = $max > 0 ? (int) round($score / $max * 100) : 0;

        $analysis = [];
        foreach ($perModule as $slug => $values) {
            $modulePercent = (int) round($values['score'] / max(1, $values['max']) * 100);
            $analysis[] = [
                'module' => $slug,
                'title' => $modules[$slug]->title ?? $slug,
                'score' => $values['score'],
                'max' => $values['max'],
                'percent' => $modulePercent,
                'weak' => $modulePercent < 60,
            ];
        }

        $attempt->update([
            'finished_at' => Carbon::now(),
            'score' => $score,
            'max_score' => $max,
            'passed' => $percent >= $exam->pass_percent,
            'result' => ['percent' => $percent, 'modules' => $analysis, 'details' => $details],
        ]);
        $this->progress->touch($request->user());

        return response()->json($this->attemptPayload($attempt->refresh(), $exam));
    }

    public function attempt(Request $request, ExamAttempt $attempt): JsonResponse
    {
        abort_if($attempt->user_id !== $request->user()->id, 403);
        $exam = $attempt->exam()->with('course')->firstOrFail();

        return response()->json($this->attemptPayload($attempt, $exam));
    }

    /** @param array<string, array{score: int, max: int}> $perModule */
    private function tally(array &$perModule, string $module, bool $correct, int $weight = 1): void
    {
        $perModule[$module] ??= ['score' => 0, 'max' => 0];
        $perModule[$module]['max'] += $weight;
        $perModule[$module]['score'] += $correct ? $weight : 0;
    }

    /** @return array<string, mixed> */
    private function attemptPayload(ExamAttempt $attempt, Exam $exam): array
    {
        return [
            'attempt' => [
                'id' => $attempt->id,
                'score' => $attempt->score,
                'max_score' => $attempt->max_score,
                'passed' => $attempt->passed,
                'started_at' => $attempt->started_at->toIso8601String(),
                'finished_at' => $attempt->finished_at?->toIso8601String(),
                'result' => $attempt->result,
                'user_name' => $attempt->user_id === request()->user()?->id ? request()->user()->name : null,
            ],
            'exam' => [
                'id' => $exam->id,
                'title' => $exam->title,
                'pass_percent' => $exam->pass_percent,
                'questions' => $exam->questions,
                'course' => $exam->course->only(['id', 'slug', 'title', 'color', 'icon']),
            ],
        ];
    }
}
