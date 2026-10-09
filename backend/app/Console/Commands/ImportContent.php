<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Content\ContentImporter;
use App\Content\ContentLoader;
use App\Content\ContentValidator;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('stacklab:import {--force : Import all valid courses and skip the ones with errors}')]
#[Description('Import all learning content from the content directory into the database')]
final class ImportContent extends Command
{
    public function handle(ContentImporter $importer): int
    {
        $root = (string) config('stacklab.content_path');
        $loader = new ContentLoader($root);
        $content = $loader->load();

        $validator = new ContentValidator;
        $validator->validate($content, $root);
        $errors = [...$loader->errors(), ...$validator->errors()];

        if ($errors !== []) {
            foreach ($errors as $error) {
                $this->components->error($error);
            }
            if (! $this->option('force')) {
                $this->components->error(count($errors).' content error(s). Fix them or use --force.');

                return self::FAILURE;
            }
        }

        if ($errors !== []) {
            $content = $this->withoutBrokenContent($content, $errors);
        }

        $stats = $importer->import($content);
        $this->components->info(sprintf(
            'Imported %d courses, %d modules, %d lessons, %d terms.',
            $stats['courses'],
            $stats['modules'],
            $stats['lessons'],
            $stats['terms'],
        ));

        return self::SUCCESS;
    }

    /**
     * Drops courses that have errors and glossary entries that cannot be imported.
     *
     * @param  array{courses: list<array<string, mixed>>, terms: list<array<string, mixed>>}  $content
     * @param  list<string>  $errors
     * @return array{courses: list<array<string, mixed>>, terms: list<array<string, mixed>>}
     */
    private function withoutBrokenContent(array $content, array $errors): array
    {
        $brokenDirs = [];
        foreach ($errors as $error) {
            if (preg_match('#^courses/([^/:]+)#', $error, $match) === 1) {
                $brokenDirs[$match[1]] = true;
            }
        }

        $courses = array_values(array_filter(
            $content['courses'],
            fn (array $course): bool => ! isset($brokenDirs[basename(dirname((string) $course['file']))]),
        ));
        foreach (array_keys($brokenDirs) as $dir) {
            $this->components->warn("Skipped course directory {$dir} because of content errors.");
        }

        $seen = [];
        $terms = [];
        foreach ($content['terms'] as $term) {
            $slug = $term['slug'] ?? null;
            $complete = is_string($slug) && isset($term['term'], $term['short'], $term['explanation'], $term['category']);
            if (! $complete || isset($seen[$slug])) {
                continue;
            }
            $seen[$slug] = true;
            $terms[] = $term;
        }

        return ['courses' => $courses, 'terms' => $terms];
    }
}
