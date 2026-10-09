<?php

declare(strict_types=1);

use App\Content\ContentLoader;
use App\Content\ContentValidator;

it('accepts the fixture content', function (): void {
    $root = __DIR__.'/../Fixtures/content';
    $validator = new ContentValidator;
    $validator->validate((new ContentLoader($root))->load(), $root);

    expect($validator->errors())->toBe([]);
});

it('reports unknown terms, broken answers and missing tasks', function (): void {
    $validator = new ContentValidator;
    $validator->validate([
        'terms' => [],
        'courses' => [[
            'slug' => 'x', 'file' => 'courses/01-x/course.yaml', 'title' => 'X', 'description' => 'd', 'workspace_dir' => 'x',
            'category' => 'falsch', 'level' => 'einsteiger', 'project' => null, 'exam' => null,
            'modules' => [[
                'slug' => 'm', 'file' => 'm.yaml', 'title' => 'M',
                'lessons' => [[
                    'slug' => 'l', 'file' => 'l.md', 'title' => 'L', 'body' => 'Text mit [[unbekannt]]',
                    'quiz' => [['type' => 'single', 'question' => 'q', 'options' => ['a', 'b'], 'answer' => 5, 'explanation' => 'e']],
                    'tasks' => [],
                ]],
            ]],
        ]],
    ]);

    expect(implode("\n", $validator->errors()))
        ->toContain('category must be one of')
        ->toContain('unknown term [[unbekannt]]')
        ->toContain('answer must be a valid option index')
        ->toContain('lesson needs at least one interactive task');
});
