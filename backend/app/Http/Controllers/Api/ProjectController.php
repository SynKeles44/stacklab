<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Project;
use App\Models\ProjectStepCompletion;
use App\Services\ProgressService;
use App\Services\SandboxClient;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

final class ProjectController extends Controller
{
    public function __construct(
        private readonly SandboxClient $sandbox,
        private readonly ProgressService $progress,
    ) {}

    public function show(Request $request, string $courseSlug): JsonResponse
    {
        $course = Course::query()->where('slug', $courseSlug)->firstOrFail();
        $project = Project::query()->where('course_id', $course->id)->firstOrFail();
        $user = $request->user('sanctum');

        return response()->json([
            'project' => [
                'id' => $project->id,
                'title' => $project->title,
                'description' => $project->description,
                'goal' => $project->goal,
                'workdir' => $project->workdir,
                'has_setup' => $project->setup !== null,
                'steps' => array_map(
                    static fn (array $step): array => [...array_diff_key($step, ['solve' => true]), 'can_solve' => Project::solveScript($step) !== null],
                    $project->steps,
                ),
                'course' => $course->only(['id', 'slug', 'title', 'color', 'icon', 'workspace_dir']),
            ],
            'completed_steps' => $user !== null
                ? ProjectStepCompletion::query()->where('user_id', $user->id)->where('project_id', $project->id)->pluck('step_key')->all()
                : [],
        ]);
    }

    public function verify(Request $request, Project $project, string $step): JsonResponse
    {
        $definition = $project->findStep($step) ?? throw new ModelNotFoundException;
        $checks = (array) ($definition['checks'] ?? []);

        if ($checks === []) {
            $this->markDone($request, $project, $step);

            return response()->json(['passed' => true, 'results' => []]);
        }

        $result = $this->sandbox->check((string) $project->course->workspace_dir, $project->stepWorkdir($definition), $checks);
        if ($result['passed']) {
            $this->markDone($request, $project, $step);
        }

        return response()->json($result);
    }

    public function solve(Request $request, Project $project, string $step): JsonResponse
    {
        $definition = $project->findStep($step) ?? throw new ModelNotFoundException;
        $script = Project::solveScript($definition) ?? abort(422, 'Für diesen Schritt gibt es keine automatische Lösung.');
        $workdir = $project->stepWorkdir($definition);

        $run = $this->sandbox->run((string) $project->course->workspace_dir, $workdir, $script);
        if (! $run['ok']) {
            return response()->json(['passed' => false, 'output' => $run['output'], 'results' => []]);
        }

        $checks = (array) ($definition['checks'] ?? []);
        $result = $checks === []
            ? ['passed' => true, 'results' => []]
            : $this->sandbox->check((string) $project->course->workspace_dir, $workdir, $checks);

        if ($result['passed']) {
            $this->markDone($request, $project, $step);
        }

        return response()->json([...$result, 'output' => $run['output']]);
    }

    public function reset(Project $project): JsonResponse
    {
        return response()->json($this->sandbox->reset((string) $project->course->workspace_dir, $project->workdir, $project->setup));
    }

    public function reopen(Request $request, Project $project, string $step): JsonResponse
    {
        ProjectStepCompletion::query()->where('user_id', $request->user()->id)->where('project_id', $project->id)->where('step_key', $step)->delete();

        return response()->json(['ok' => true]);
    }

    private function markDone(Request $request, Project $project, string $step): void
    {
        ProjectStepCompletion::query()->firstOrCreate(
            ['user_id' => $request->user()->id, 'project_id' => $project->id, 'step_key' => $step],
            ['completed_at' => Carbon::now()],
        );
        $this->progress->touch($request->user());
    }
}
