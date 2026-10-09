<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Content\ContentImporter;
use App\Content\ContentLoader;
use App\Content\ContentValidator;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('stacklab:import {--force : Import even if validation reports errors}')]
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
}
