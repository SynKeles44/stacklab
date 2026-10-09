<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Content\ContentLoader;
use App\Content\ContentValidator;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('stacklab:validate {--path= : Content directory} {--warnings : Also print warnings} {--strict : Treat warnings as errors}')]
#[Description('Validate the learning content against the content contract')]
final class ValidateContent extends Command
{
    public function handle(): int
    {
        $root = (string) ($this->option('path') ?: config('stacklab.content_path'));
        $loader = new ContentLoader($root);
        $content = $loader->load();

        $validator = new ContentValidator;
        $validator->validate($content, $root);

        $errors = [...$loader->errors(), ...$validator->errors()];
        $warnings = $validator->warnings();

        foreach ($errors as $error) {
            $this->line("<fg=red>ERROR</> {$error}");
        }
        if ($this->option('warnings') || $this->option('strict')) {
            foreach ($warnings as $warning) {
                $this->line("<fg=yellow>WARN</>  {$warning}");
            }
        }

        $lessons = 0;
        foreach ($content['courses'] as $course) {
            foreach ($course['modules'] as $module) {
                $lessons += count($module['lessons']);
            }
        }

        $this->newLine();
        $this->line(sprintf(
            '%d courses, %d lessons, %d terms — %d error(s), %d warning(s)',
            count($content['courses']),
            $lessons,
            count($content['terms']),
            count($errors),
            count($warnings),
        ));

        $failed = $errors !== [] || ($this->option('strict') && $warnings !== []);

        return $failed ? self::FAILURE : self::SUCCESS;
    }
}
