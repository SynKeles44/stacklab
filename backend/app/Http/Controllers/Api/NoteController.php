<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\NoteRequest;
use App\Models\Lesson;
use App\Models\Note;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class NoteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $notes = Note::query()
            ->where('notes.user_id', $request->user()->id)
            ->where('notes.body', '!=', '')
            ->join('lessons', 'lessons.id', '=', 'notes.lesson_id')
            ->join('courses', 'courses.id', '=', 'lessons.course_id')
            ->orderByDesc('notes.updated_at')
            ->get(['notes.id', 'notes.body', 'notes.updated_at', 'lessons.slug as lesson_slug', 'lessons.title as lesson_title', 'courses.slug as course_slug', 'courses.title as course_title']);

        return response()->json(['notes' => $notes]);
    }

    public function update(NoteRequest $request, Lesson $lesson): JsonResponse
    {
        $body = (string) $request->input('body', '');
        Note::query()->updateOrCreate(['user_id' => $request->user()->id, 'lesson_id' => $lesson->id], ['body' => $body]);

        return response()->json(['ok' => true]);
    }
}
