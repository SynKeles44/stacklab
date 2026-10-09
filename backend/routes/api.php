<?php

declare(strict_types=1);

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookmarkController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ExamController;
use App\Http\Controllers\Api\GlossaryController;
use App\Http\Controllers\Api\LessonController;
use App\Http\Controllers\Api\NoteController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\TerminalController;
use Illuminate\Support\Facades\Route;

Route::middleware('throttle:20,1')->group(function (): void {
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
});

Route::get('/courses', [CourseController::class, 'index']);
Route::get('/courses/{slug}', [CourseController::class, 'show']);
Route::get('/courses/{courseSlug}/lessons/{lessonSlug}', [LessonController::class, 'show']);
Route::get('/courses/{courseSlug}/project', [ProjectController::class, 'show']);
Route::get('/courses/{courseSlug}/exam', [ExamController::class, 'show']);
Route::get('/glossary', [GlossaryController::class, 'index']);
Route::get('/glossary/{slug}', [GlossaryController::class, 'show']);
Route::get('/search', SearchController::class);
Route::get('/sandbox/status', [TerminalController::class, 'status']);

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::patch('/me', [AuthController::class, 'update']);

    Route::get('/dashboard', DashboardController::class);

    Route::post('/lessons/{lesson}/visit', [LessonController::class, 'visit']);
    Route::post('/lessons/{lesson}/complete', [LessonController::class, 'complete']);
    Route::post('/lessons/{lesson}/quiz', [LessonController::class, 'submitQuiz']);
    Route::put('/lessons/{lesson}/note', [NoteController::class, 'update']);
    Route::get('/notes', [NoteController::class, 'index']);

    Route::post('/glossary/unlock', [GlossaryController::class, 'unlock']);

    Route::post('/tasks/complete', [TaskController::class, 'complete']);
    Route::post('/tasks/verify', [TaskController::class, 'verify'])->middleware('throttle:60,1');
    Route::post('/tasks/reset', [TaskController::class, 'reset'])->middleware('throttle:30,1');
    Route::post('/tasks/run-php', [TaskController::class, 'runPhp'])->middleware('throttle:60,1');
    Route::get('/terminal/session', [TerminalController::class, 'session']);

    Route::post('/projects/{project}/steps/{step}/verify', [ProjectController::class, 'verify']);
    Route::post('/projects/{project}/steps/{step}/solve', [ProjectController::class, 'solve'])->middleware('throttle:30,1');
    Route::delete('/projects/{project}/steps/{step}', [ProjectController::class, 'reopen']);
    Route::post('/projects/{project}/reset', [ProjectController::class, 'reset'])->middleware('throttle:30,1');

    Route::post('/exams/{exam}/start', [ExamController::class, 'start']);
    Route::post('/exam-attempts/{attempt}/submit', [ExamController::class, 'submit']);
    Route::get('/exam-attempts/{attempt}', [ExamController::class, 'attempt']);

    Route::get('/bookmarks', [BookmarkController::class, 'index']);
    Route::post('/bookmarks/toggle', [BookmarkController::class, 'toggle']);
    Route::delete('/bookmarks/{bookmark}', [BookmarkController::class, 'destroy']);

    Route::get('/settings/workspace', [SettingsController::class, 'workspace']);
    Route::put('/settings/workspace', [SettingsController::class, 'updateWorkspace']);
    Route::delete('/settings/progress', [SettingsController::class, 'resetProgress'])->middleware('throttle:10,1');
});
