<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Content\ContentLoader;
use App\Models\Project;
use App\Services\SandboxClient;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('stacklab:solve-check {courses?* : Course slugs (default: all)} {--path= : Content directory} {--require-all : Treat steps without a solve script as failures}')]
#[Description('Run every project step solve script in the sandbox, read straight from the content files, and verify the step checks')]
final class SolveCheck extends Command
{
    public function handle(SandboxClient $sandbox): int
    {
        $slugs = (array) $this->argument('courses');
        $content = (new ContentLoader((string) ($this->option('path') ?: config('stacklab.content_path'))))->load();

        $failures = 0;
        foreach ($content['courses'] as $course) {
            if (! is_array($course['project'] ?? null) || ($slugs !== [] && ! in_array($course['slug'], $slugs, true))) {
                continue;
            }
            $failures += $this->checkProject($sandbox, $course);
        }

        $this->newLine();
        $this->line($failures === 0 ? '<fg=green>All solve scripts pass.</>' : "<fg=red>{$failures} failing step(s).</>");

        return $failures === 0 ? self::SUCCESS : self::FAILURE;
    }

    /** @param  array<string, mixed>  $course */
    private function checkProject(SandboxClient $sandbox, array $course): int
    {
        $data = (array) $course['project'];
        $project = new Project([
            'workdir' => (string) ($data['workdir'] ?? 'projekt'),
            'setup' => is_string($data['setup'] ?? null) ? $data['setup'] : null,
            'steps' => array_values((array) ($data['steps'] ?? [])),
        ]);
        $workspace = (string) ($course['workspace_dir'] ?? $course['slug']);

        $reset = $sandbox->reset($workspace, $project->workdir, $project->setup);
        $this->line("<options=bold>{$course['slug']}</> ({$project->workdir})");
        if (! $reset['ok']) {
            $this->line('  <fg=red>FAIL</> setup: '.$reset['output']);

            return 1;
        }

        $failures = 0;
        foreach ($project->steps as $step) {
            $step = (array) $step;
            $id = (string) ($step['id'] ?? '?');
            $script = Project::solveScript($step);
            if ($script === null) {
                $this->line('  '.($this->option('require-all') ? '<fg=red>MISS</>' : '<fg=yellow>SKIP</>')." {$id} (no solve script)");
                $failures += $this->option('require-all') ? 1 : 0;

                continue;
            }

            $workdir = $project->stepWorkdir($step);
            $run = $sandbox->run($workspace, $workdir, $script);
            $checks = (array) ($step['checks'] ?? []);
            $result = $run['ok'] && $checks !== [] ? $sandbox->check($workspace, $workdir, $checks) : ['passed' => $run['ok'], 'results' => []];

            if ($result['passed']) {
                $this->line("  <fg=green>PASS</> {$id}");

                continue;
            }

            $failures++;
            $this->line("  <fg=red>FAIL</> {$id}");
            foreach ($result['results'] as $check) {
                if (! $check['passed']) {
                    $this->line('       - '.$check['message']);
                }
            }
            if (! $run['ok']) {
                $this->line('       '.str_replace("\n", "\n       ", mb_substr($run['output'], -800)));
            }
        }

        return $failures;
    }
}
