<?php

declare(strict_types=1);

use App\Content\TermLinks;

it('extracts term links including ones with an escaped pipe inside tables', function (): void {
    $markdown = "Ein [[commit]] und [[branch|Branches]].\n\n| Begriff | Erklärung |\n|---|---|\n| [[merge\\|Merge]] | x |";

    expect(TermLinks::extract($markdown))->toBe(['commit', 'branch', 'merge']);
});

it('keeps only the link text in the plain text', function (): void {
    expect(TermLinks::toPlainText('Siehe [[merge\\|Merge]] und [[commit]].'))->toBe('Siehe Merge und commit.');
});
