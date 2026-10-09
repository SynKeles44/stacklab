<?php

declare(strict_types=1);

use App\Models\Exam;
use App\Models\Lesson;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

beforeEach(fn () => importFixtureContent());

it('registers and logs in', function (): void {
    $this->postJson('/api/auth/register', ['name' => 'Ada', 'email' => 'ada@example.com', 'password' => 'geheim123'])
        ->assertCreated()
        ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email']]);

    $this->postJson('/api/auth/login', ['email' => 'ada@example.com', 'password' => 'falsch'])->assertUnprocessable();
    $this->postJson('/api/auth/login', ['email' => 'ada@example.com', 'password' => 'geheim123'])->assertOk();
});

it('rejects protected routes for guests', function (): void {
    $this->getJson('/api/dashboard')->assertUnauthorized();
    $this->postJson('/api/lessons/1/complete')->assertUnauthorized();
});

it('tracks lesson completion and course progress', function (): void {
    Sanctum::actingAs($user = User::factory()->create());
    $lesson = Lesson::query()->first();

    $this->postJson("/api/lessons/{$lesson->id}/visit")->assertOk();
    $this->postJson("/api/lessons/{$lesson->id}/complete")
        ->assertOk()
        ->assertJsonPath('newly_completed', true)
        ->assertJsonPath('course_completed', true);
    $this->postJson("/api/lessons/{$lesson->id}/complete")->assertJsonPath('newly_completed', false);

    $this->getJson('/api/courses')->assertJsonPath('courses.0.progress.percent', 100);
    $this->getJson('/api/dashboard')
        ->assertOk()
        ->assertJsonPath('continue.lesson_slug', 'hallo')
        ->assertJsonPath('stats.streak', 1)
        ->assertJsonPath('badges.0.earned', true);
});

it('unlocks terms only once', function (): void {
    Sanctum::actingAs(User::factory()->create());

    $this->postJson('/api/glossary/unlock', ['slugs' => ['variable', 'unbekannt']])
        ->assertOk()
        ->assertJsonPath('unlocked.0.slug', 'variable')
        ->assertJsonPath('unlocked_count', 1);
    $this->postJson('/api/glossary/unlock', ['slugs' => ['variable']])->assertJsonPath('unlocked', []);
});

it('completes client graded tasks but not terminal tasks', function (): void {
    Sanctum::actingAs(User::factory()->create());
    $lesson = Lesson::query()->first();

    $this->postJson('/api/tasks/complete', ['scope' => 'lesson', 'id' => $lesson->id, 'task_id' => 'sortieren'])
        ->assertOk()
        ->assertJsonPath('newly_completed', true);
    $this->postJson('/api/tasks/complete', ['scope' => 'lesson', 'id' => $lesson->id, 'task_id' => 'datei-anlegen'])->assertUnprocessable();
    $this->postJson('/api/tasks/complete', ['scope' => 'lesson', 'id' => $lesson->id, 'task_id' => 'gibt-es-nicht'])->assertNotFound();

    $this->getJson('/api/courses/demo/lessons/hallo')->assertJsonPath('state.completed_tasks', ['sortieren']);
});

it('toggles bookmarks and keeps them private', function (): void {
    Sanctum::actingAs($user = User::factory()->create());
    $payload = ['type' => 'lesson', 'ref' => 'demo/hallo', 'label' => 'Hallo Welt', 'url' => '/kurse/demo/hallo'];

    $this->postJson('/api/bookmarks/toggle', $payload)->assertJsonPath('bookmarked', true);
    $this->getJson('/api/bookmarks')->assertJsonCount(1, 'bookmarks');

    $id = $this->getJson('/api/bookmarks')->json('bookmarks.0.id');
    Sanctum::actingAs(User::factory()->create());
    $this->getJson('/api/bookmarks')->assertJsonCount(0, 'bookmarks');
    $this->deleteJson("/api/bookmarks/{$id}")->assertNotFound();

    Sanctum::actingAs($user);
    $this->postJson('/api/bookmarks/toggle', $payload)->assertJsonPath('bookmarked', false);
});

it('stores notes per lesson', function (): void {
    Sanctum::actingAs(User::factory()->create());
    $lesson = Lesson::query()->first();

    $this->putJson("/api/lessons/{$lesson->id}/note", ['body' => 'Merken: let vs const'])->assertOk();
    $this->getJson('/api/courses/demo/lessons/hallo')->assertJsonPath('state.note', 'Merken: let vs const');
    $this->getJson('/api/notes')->assertJsonPath('notes.0.lesson_slug', 'hallo');
});

it('grades an exam with a weakness analysis', function (): void {
    Sanctum::actingAs(User::factory()->create());
    $exam = Exam::query()->first();

    $start = $this->postJson("/api/exams/{$exam->id}/start")->assertOk();
    expect($start->json('questions.0'))->not->toHaveKey('answer')
        ->and($start->json('questions.3.lefts'))->toBe(['a', 'b']);

    $attemptId = $start->json('attempt_id');
    $this->postJson("/api/exam-attempts/{$attemptId}/submit", [
        'answers' => [0, [2, 0], ['INIT'], ['1', '2'], 3],
        'tasks' => ['js-aufgabe' => ['passed' => true]],
    ])
        ->assertOk()
        ->assertJsonPath('attempt.score', 7)
        ->assertJsonPath('attempt.max_score', 7)
        ->assertJsonPath('attempt.passed', true)
        ->assertJsonPath('attempt.result.modules.0.weak', false);

    $this->postJson("/api/exam-attempts/{$attemptId}/submit", ['answers' => [], 'tasks' => []])->assertStatus(409);
});

it('marks weak modules when answers are wrong', function (): void {
    Sanctum::actingAs(User::factory()->create());
    $exam = Exam::query()->first();
    $attemptId = $this->postJson("/api/exams/{$exam->id}/start")->json('attempt_id');

    $this->postJson("/api/exam-attempts/{$attemptId}/submit", ['answers' => [1, [0], ['x'], ['2', '1'], 1], 'tasks' => []])
        ->assertJsonPath('attempt.score', 0)
        ->assertJsonPath('attempt.passed', false)
        ->assertJsonPath('attempt.result.modules.0.weak', true);
});

it('prevents reading other users exam attempts', function (): void {
    Sanctum::actingAs(User::factory()->create());
    $attemptId = $this->postJson('/api/exams/'.Exam::query()->first()->id.'/start')->json('attempt_id');

    Sanctum::actingAs(User::factory()->create());
    $this->getJson("/api/exam-attempts/{$attemptId}")->assertForbidden();
    $this->postJson("/api/exam-attempts/{$attemptId}/submit", ['answers' => [], 'tasks' => []])->assertForbidden();
});

it('stores the preferred ui variant', function (): void {
    Sanctum::actingAs(User::factory()->create());

    $this->getJson('/api/me')->assertJsonPath('user.ui_variant', 'standard');
    $this->patchJson('/api/me', ['ui_variant' => 'apple'])->assertOk()->assertJsonPath('user.ui_variant', 'apple');
    $this->patchJson('/api/me', ['ui_variant' => 'windows'])->assertUnprocessable();
    $this->getJson('/api/me')->assertJsonPath('user.ui_variant', 'apple');
});
