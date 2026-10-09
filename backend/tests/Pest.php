<?php

declare(strict_types=1);

use App\Content\ContentImporter;
use App\Content\ContentLoader;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

function importFixtureContent(): void
{
    $loader = new ContentLoader(__DIR__.'/Fixtures/content');
    app(ContentImporter::class)->import($loader->load());
}
