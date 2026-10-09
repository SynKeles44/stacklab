<?php

declare(strict_types=1);

use App\Models\Course;
use App\Models\Lesson;
use App\Models\Term;

beforeEach(fn () => importFixtureContent());

it('imports courses, lessons, terms, project and exam', function (): void {
    expect(Course::query()->count())->toBe(1)
        ->and(Lesson::query()->count())->toBe(1)
        ->and(Term::query()->first()->lesson_id)->toBe(Lesson::query()->first()->id)
        ->and(Lesson::query()->first()->term_slugs)->toBe(['variable']);
});

it('is idempotent when importing twice', function (): void {
    $lessonId = Lesson::query()->first()->id;
    importFixtureContent();

    expect(Lesson::query()->count())->toBe(1)
        ->and(Lesson::query()->first()->id)->toBe($lessonId);
});

it('lists courses for guests', function (): void {
    $this->getJson('/api/courses')
        ->assertOk()
        ->assertJsonPath('courses.0.slug', 'demo')
        ->assertJsonPath('courses.0.lessons_count', 1)
        ->assertJsonPath('courses.0.progress', null);
});

it('shows a course with modules and lessons', function (): void {
    $this->getJson('/api/courses/demo')
        ->assertOk()
        ->assertJsonPath('course.modules.0.slug', 'start')
        ->assertJsonPath('course.modules.0.lessons.0.slug', 'hallo')
        ->assertJsonPath('course.project.step_count', 2);
});

it('shows a lesson with its terms', function (): void {
    $this->getJson('/api/courses/demo/lessons/hallo')
        ->assertOk()
        ->assertJsonPath('lesson.title', 'Hallo Welt')
        ->assertJsonPath('lesson.terms.0.slug', 'variable')
        ->assertJsonPath('lesson.position', 1)
        ->assertJsonPath('state', null);
});

it('returns 404 for unknown lessons', function (): void {
    $this->getJson('/api/courses/demo/lessons/gibt-es-nicht')->assertNotFound();
});

it('lists the glossary', function (): void {
    $this->getJson('/api/glossary')
        ->assertOk()
        ->assertJsonPath('total', 1)
        ->assertJsonPath('terms.0.lesson.course_slug', 'demo');
});

it('finds lessons by search', function (): void {
    $this->getJson('/api/search?q=Hallo')
        ->assertOk()
        ->assertJsonPath('lessons.0.slug', 'hallo');
});

it('skips broken courses when importing with --force', function (): void {
    $root = sys_get_temp_dir().'/stacklab-broken-'.uniqid();
    mkdir($root.'/courses', 0777, true);
    exec('cp -R '.escapeshellarg(__DIR__.'/../Fixtures/content/.').' '.escapeshellarg($root));
    mkdir($root.'/courses/02-kaputt/modules/01-leer', 0777, true);
    file_put_contents($root.'/courses/02-kaputt/course.yaml', "title: Kaputt\n");
    config(['stacklab.content_path' => $root]);

    $this->artisan('stacklab:import')->assertFailed();
    $this->artisan('stacklab:import --force')->assertSuccessful();

    expect(Course::query()->pluck('slug')->all())->toBe(['demo']);
});

it('computes the course duration from lesson durations', function (): void {
    $this->getJson('/api/courses')->assertJsonPath('courses.0.estimated_hours', 1);
});
