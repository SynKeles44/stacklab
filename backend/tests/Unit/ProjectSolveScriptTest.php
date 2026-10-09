<?php

declare(strict_types=1);

use App\Models\Project;

it('uses only the explicit solve script, never the prose solution', function (): void {
    expect(Project::solveScript(['solve' => " git init \n", 'solution' => "```bash\nx\n```"]))->toBe('git init')
        ->and(Project::solveScript(['solution' => "```bash\ngit init\n```"]))->toBeNull()
        ->and(Project::solveScript(['solve' => '   ']))->toBeNull();
});
